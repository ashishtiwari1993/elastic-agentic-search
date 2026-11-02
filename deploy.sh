#!/usr/bin/env bash
# Deploy ONLY the demo UI to Google Cloud Run (data ingestion / Elastic setup stay local: python3 setup.py).
# Prereq: gcloud auth login ; docker running ; `python3 setup.py` already run against your Elastic project.
# Optional env: GCP_PROJECT, REGION (asia-south1), SERVICE (agentic-search), PUBLIC=0 for IAM-only.
# Login: GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET in .env (Google OAuth web client); only @ALLOWED_DOMAIN users get in.
# Same approach as the mulescope deploy: image built locally, pushed to Artifact Registry, secrets in Secret Manager.
set -euo pipefail
cd "$(dirname "$0")"

if [ -f .env ]; then
  while IFS='=' read -r k v; do
    [[ -z "$k" || "$k" == \#* ]] && continue
    v="${v%\"}"; v="${v#\"}"; v="${v%\'}"; v="${v#\'}"; v="${v%% #*}"
    [ -z "${!k:-}" ] && export "$k=$v"
  done < .env
fi

PROJECT="${GCP_PROJECT:-$(gcloud config get-value project 2>/dev/null)}"
REGION="${REGION:-asia-south1}"
SERVICE="${SERVICE:-agentic-search}"
: "${ES_URL:?ES_URL not set (.env)}"
: "${ES_API_KEY:?ES_API_KEY not set (.env)}"
KIBANA_URL="${KIBANA_URL:-${ES_URL/.es./.kb.}}"
[ -n "$PROJECT" ] || { echo "Set GCP_PROJECT or run: gcloud config set project <id>"; exit 1; }

PUBLIC="${PUBLIC:-1}"
if [ "$PUBLIC" = "1" ] && [ -z "${GOOGLE_CLIENT_ID:-}" ]; then
  echo "Refusing to deploy a public URL without login. Set GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET in .env, or use PUBLIC=0."; exit 1
fi

echo "== Project $PROJECT / region $REGION / service $SERVICE"
gcloud services enable run.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com --project "$PROJECT"
PROJECT_NUM="$(gcloud projects describe "$PROJECT" --format='value(projectNumber)')"
SA="serviceAccount:${PROJECT_NUM}-compute@developer.gserviceaccount.com"

put_secret() {  # name value
  if gcloud secrets describe "$1" --project "$PROJECT" >/dev/null 2>&1; then
    printf '%s' "$2" | gcloud secrets versions add "$1" --data-file=- --project "$PROJECT" >/dev/null
  else
    printf '%s' "$2" | gcloud secrets create "$1" --data-file=- --replication-policy=automatic --project "$PROJECT" >/dev/null
  fi
  gcloud secrets add-iam-policy-binding "$1" --project "$PROJECT" --member "$SA" --role roles/secretmanager.secretAccessor >/dev/null
}

echo "== Storing secrets in Secret Manager"
put_secret "${SERVICE}-es-api-key" "$ES_API_KEY"
SECRETS="ES_API_KEY=${SERVICE}-es-api-key:latest"
ENVVARS="^|^ES_URL=${ES_URL}|KIBANA_URL=${KIBANA_URL}"
[ -n "${LLM_INFERENCE_ID:-}" ] && ENVVARS="$ENVVARS|LLM_INFERENCE_ID=${LLM_INFERENCE_ID}"
if [ -n "${GOOGLE_CLIENT_ID:-}" ]; then
  : "${GOOGLE_CLIENT_SECRET:?GOOGLE_CLIENT_SECRET not set (.env)}"
  put_secret "${SERVICE}-google-client-secret" "$GOOGLE_CLIENT_SECRET"
  # Stable cookie-signing key: created once, reused so sessions survive redeploys
  gcloud secrets describe "${SERVICE}-session-secret" --project "$PROJECT" >/dev/null 2>&1 || put_secret "${SERVICE}-session-secret" "$(openssl rand -hex 32)"
  gcloud secrets add-iam-policy-binding "${SERVICE}-session-secret" --project "$PROJECT" --member "$SA" --role roles/secretmanager.secretAccessor >/dev/null
  SECRETS="$SECRETS,GOOGLE_CLIENT_SECRET=${SERVICE}-google-client-secret:latest,SESSION_SECRET=${SERVICE}-session-secret:latest"
  ENVVARS="$ENVVARS|GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}|ALLOWED_DOMAIN=${ALLOWED_DOMAIN:-elastic.co}"
fi

REPO="cloud-run-source-deploy"
IMAGE="${REGION}-docker.pkg.dev/${PROJECT}/${REPO}/${SERVICE}:$(date +%Y%m%d-%H%M%S)"
gcloud artifacts repositories describe "$REPO" --location "$REGION" --project "$PROJECT" >/dev/null 2>&1 || \
  gcloud artifacts repositories create "$REPO" --repository-format=docker --location "$REGION" --project "$PROJECT"
gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet >/dev/null

echo "== Building image (linux/amd64) and pushing $IMAGE"
docker buildx build --platform linux/amd64 -t "$IMAGE" --push .

AUTH_FLAG="--allow-unauthenticated"   # the app itself enforces Google login
[ "$PUBLIC" = "0" ] && AUTH_FLAG="--no-allow-unauthenticated"

echo "== Deploying to Cloud Run"
gcloud run deploy "$SERVICE" --image "$IMAGE" --project "$PROJECT" --region "$REGION" \
  --set-env-vars "$ENVVARS" --set-secrets "$SECRETS" \
  --memory 256Mi --cpu 1 --min-instances 0 --max-instances 3 --timeout 300 \
  "$AUTH_FLAG"

URL="$(gcloud run services describe "$SERVICE" --project "$PROJECT" --region "$REGION" --format='value(status.url)')"
echo "== URL: $URL"
[ -n "${GOOGLE_CLIENT_ID:-}" ] && echo "== Make sure this redirect URI is registered on the OAuth client:  $URL/auth/callback"
