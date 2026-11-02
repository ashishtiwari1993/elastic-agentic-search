FROM node:22-slim
ENV NODE_ENV=production
WORKDIR /app
COPY ui/ ui/
# Cloud Run injects PORT; ES_URL / KIBANA_URL / ES_API_KEY / GOOGLE_* come from service config + Secret Manager.
# Data ingestion and Elastic setup are NOT part of the image: run `python3 setup.py` locally first.
CMD ["node", "ui/server.js"]
