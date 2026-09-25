# Agentic Search, natively in Elastic

> **The agent decides what to search. Elasticsearch still decides what's relevant.**

A runnable demo of *agentic search* built entirely from Elastic features: no LangChain, no Python service in the
request path, no model hosting. A shopper types something like *"nike running shoes under 100 dollars"* or
*"something to keep my coffee hot on a long drive"*. Then Elastic does the rest in one API call:

- **Understands** the request with an LLM on the Elastic Inference Service (EIS): intent, filters, typo fixes, Hinglish, a rewritten query
- **Routes** it to products, analytics, a help-centre index, or decides **not to search at all**
- **Retrieves** with hybrid search (BM25 + `semantic_text`), RRF and a Jina reranker
- **Self-corrects** when the extracted filters return zero hits
- **Returns normal Elasticsearch JSON** (`took`, `hits`, `aggregations`) plus an `agentic` block explaining what it decided

An **Agent Builder agent** sits on top. It takes goals like *"Goa beach trip, $150 total, what should I pack?"*,
decides how many searches to run, and combines the results.

The dataset is a fictional store, **ShopSphere**: 194 real products with images from [DummyJSON](https://github.com/Ovi/DummyJSON)
and 20 help-centre articles written for this demo.

---

## How it works

```
Browser / any agent
   │  POST /api/agent_builder/tools/_execute   { tool_id: "shop.agentic_search", tool_params: { query } }
   ▼
Kibana Workflow "agentic_product_search"
   1. UNDERSTAND  ai.prompt on an EIS chat model, JSON-schema output,
                  grounded in the real category / brand list of the index
                  → intent · categories · brands · price · rating · stock · sort · rewritten query
   2. PLAN        data.set → search-template parameters (deterministic guardrails)
   3. ROUTE       switch on intent
        product_search   → search template: BM25 + semantic_text → RRF → Jina reranker
                           if 0 hits → relax filters and re-run on the raw request
        analytics        → search template: filters + aggregations
        support_question → search template: help-centre hybrid + rerank
        out_of_scope     → no search
   4. RESPOND     workflow.output → { took, hits, aggregations, agentic: {...} }
```

One request = **one LLM call + one search** (two searches if the zero-hit fallback fires).

**Key design choice: the LLM never writes query DSL.** It fills a JSON schema, and a stored, tested search template
turns those parameters into the query. A bad model answer can give a less relevant result, but it can't produce a
bad or unsafe query.

| Piece | Elastic feature | File |
|---|---|---|
| Normalise raw JSON, build `product_text` | Ingest pipeline (painless) | `elastic/pipelines/products-enrich.json` |
| Embeddings at ingest and query time | `semantic_text` on EIS (Jina embeddings v5) | `elastic/mappings/` |
| Hybrid + rerank + optional filters | Stored search templates with `rrf` and `text_similarity_reranker` retrievers | `elastic/search-templates/` |
| Understanding, routing, self-correction | Workflows (`ai.prompt`, `data.set`, `switch`, `if`, `workflow.output`) | `elastic/workflows/agentic-product-search.yaml` |
| Keyword baseline for comparison | Workflow with one BM25 `multi_match` | `elastic/workflows/classic-product-search.yaml` |
| Tools and agent | Agent Builder: workflow tools, an ES\|QL tool, a custom agent | `elastic/agent/` |
| Demo UI | Static page + small allow-list proxy that holds the API key | `ui/` |

---

## Prerequisites

- An **Elastic Cloud Serverless** (Elasticsearch / Search) project, or **Elastic Cloud Hosted 9.4+**, with
  **Workflows** and **Agent Builder** available. On Hosted, Workflows needs an Enterprise subscription.
- **Elastic Inference Service** endpoints. Serverless and Cloud Hosted include them by default:
  `.jina-embeddings-v5-text-small`, `.jina-reranker-v3` and a set of chat models.
  Self-managed clusters need EIS through Cloud Connect, or your own endpoints (see [Customise](#customise)).
- An **API key with admin privileges** on the project. Setup creates indices, an ingest pipeline, stored scripts,
  workflows, Agent Builder tools and an agent.
- **Python 3.9+** and **Node 18+**. No packages to install; both scripts use only the standard library.

> ⚠️ `setup.py` **deletes and re-creates** the indices `products` and `support-kb`. Use a demo project, or rename
> them if those names are taken (see [Customise](#customise)).

---

## Quick start

```bash
git clone <this repo> agentic-search && cd agentic-search

cp .env.example .env        # then fill in ES_URL, KIBANA_URL, ES_API_KEY

python3 setup.py            # 1-2 minutes: ingest, templates, workflows, tools, agent, smoke test
node ui/server.js           # open http://localhost:8080
```

Where to find the values for `.env`:

| Variable | Where |
|---|---|
| `ES_URL` | Serverless: project **Connection details** (Elasticsearch endpoint). Hosted: deployment page |
| `KIBANA_URL` | Same place. On Serverless it's usually the ES URL with `.es.` replaced by `.kb.` |
| `ES_API_KEY` | Kibana → **API keys** → Create API key → copy the encoded value |

What `setup.py` does, in order:

1. Checks it can reach Elasticsearch and Kibana
2. Picks the embedding and rerank inference endpoints
3. Creates the pipeline and indices, then loads the data (embeddings are generated on EIS at ingest)
4. Stores the three search templates
5. Picks the chat model, then deploys the two workflows
6. Creates the Agent Builder tools and the `shop-concierge` agent
7. Runs four test queries and prints what the agent decided for each

---

## Try it

### Demo UI (`node ui/server.js` → http://localhost:8080)

The browser only calls Elastic endpoints. The small Node server serves the page and forwards three allow-listed
Kibana APIs, adding the API key on the server side.

| Tab | What it shows |
|---|---|
| **Agentic Search API** | Product grid, the agent's decisions (route, filters, rewritten query, reasoning), the raw JSON response, template parameters and the workflow execution trace |
| **Classic vs Agentic** | The keyword baseline and agentic search side by side |
| **Ask the Agent** | Chat with the Agent Builder agent, including the tool calls it chose to make |

Queries worth trying:

| Query | Shows |
|---|---|
| `something to keep my coffee hot on a long drive` | Need vs keywords (use the Classic vs Agentic tab) |
| `nike running shoes under 100 dollars` | Brand, category and price filter extraction |
| `samsng phone` / `sasta laal lipstick` | Typo correction against the real brand list; Hinglish |
| `cheapest laptop in stock` | Filters + sort, no free text left |
| `which brand has the best rated smartphones?` | Routing to analytics (aggregations) |
| `can I return perfume if I don't like it?` | Routing to the help centre |
| `what is the capital of France` | The agent decides not to search |
| `gucci running shoes` | Zero hits with strict filters → self-correction |
| `Goa beach trip, $150 total. What should I pack?` (Ask the Agent) | The agent plans and runs several searches |

### From the terminal

```bash
python3 setup.py --test "samsng phone under 300"       # run one agentic search, print the decisions and hits
python3 setup.py --timing "nike running shoes"         # time taken by each workflow step, end to end
```

### Directly over the API

```bash
source .env
curl -s -X POST "$KIBANA_URL/api/agent_builder/tools/_execute" \
  -H "Authorization: ApiKey $ES_API_KEY" -H "kbn-xsrf: true" -H "Content-Type: application/json" \
  -d '{"tool_id":"shop.agentic_search","tool_params":{"query":"red dress for a summer party under 80"}}' \
  | jq '.results[0].data.execution.output | {agentic, total: .hits.total, titles: [.hits.hits[]._source.title]}'
```

The workflow result is at `results[0].data.execution.output`.

Because the tools live in Agent Builder, the same search is also available to external agents over **MCP**
(`$KIBANA_URL/api/agent_builder/mcp`) and **A2A**.

### In Kibana

- **Workflows** → `agentic_product_search`: read the YAML and open any run in the execution history
- **Agent Builder** → the *ShopSphere Concierge* agent and the `shop.*` tools
- **Dev Tools**:

```
GET _scripts/agentic-product-search

POST _render/template
{
  "id": "agentic-product-search",
  "params": { "search_text": "running shoes", "hybrid": "true",
              "categories": ["mens-shoes", "womens-shoes"], "brands": ["Nike"], "price_max": "100", "size": 5 }
}

POST products/_search/template
{
  "id": "agentic-product-search",
  "params": { "search_text": "running shoes", "hybrid": "true", "price_max": "100", "size": 5 }
}
```

---

## Customise

| Want to… | Do this |
|---|---|
| Choose the LLM | `python3 setup.py --models`, set `LLM_INFERENCE_ID` in `.env`, then `python3 setup.py --skip-data` |
| Keep a model that rejects `reasoning-level` | Set `LLM_REASONING_LEVEL=` (empty) in `.env` |
| Use other embeddings / reranker | `EMBED_INFERENCE_ID` / `RERANK_INFERENCE_ID` in `.env`, then a full `python3 setup.py` |
| Redeploy after editing YAML or templates | `python3 setup.py --skip-data` (re-ingest not needed) |
| Change routing, prompt or guardrails | `elastic/workflows/agentic-product-search.yaml` |
| Change the query shape | `elastic/search-templates/*.mustache` (`_filters.mustache` is shared) |
| Change what the agent does | `elastic/agent/shop-concierge.json` (instructions) and `elastic/agent/tools.json` |
| Use your own data | Replace `data/*.json`, adjust `elastic/mappings/` and the pipeline, and update field names in the templates and in the workflow prompt |
| Use other index names | Replace `products` / `support-kb` in `setup.py`, both workflow YAML files, and the ES\|QL query in `elastic/agent/tools.json` |

**Which model is used where:** one EIS inference endpoint (`LLM_INFERENCE_ID`) serves both the workflow's `ai.prompt`
step and the agent. Agents have no per-agent model setting, so the UI passes `inference_id` on each `/converse` call.
If `LLM_INFERENCE_ID` is empty, setup picks the fastest available model and writes it to `.env`.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `Kibana Agent Builder API not reachable` | Check `KIBANA_URL`; it must be the Kibana endpoint, not Elasticsearch |
| `Could not find embedding/rerank endpoints` | Your project has no EIS endpoints; set `EMBED_INFERENCE_ID` / `RERANK_INFERENCE_ID` to endpoints you created |
| `No chat_completion inference endpoint found` | Create or enable a chat model, then set `LLM_INFERENCE_ID` |
| Workflow saved but invalid | Workflows is newer on self-managed/Hosted; use Serverless or 9.4+. The error names the failing step |
| 401 / 403 errors | The API key needs admin privileges for setup |
| Search feels slow | `python3 setup.py --timing "…"` shows which step; usually the LLM step, so pick a faster model |
| No images in the UI | Product images load from `cdn.dummyjson.com`; your network must allow it |

---

## Clean up

```bash
source .env
H=(-H "Authorization: ApiKey $ES_API_KEY" -H "kbn-xsrf: true")
curl -s -X DELETE "${H[@]}" "$KIBANA_URL/api/agent_builder/agents/shop-concierge"
for t in shop.agentic_search shop.classic_search shop.brand_stats; do
  curl -s -X DELETE "${H[@]}" "$KIBANA_URL/api/agent_builder/tools/$t"; done
for w in agentic-product-search classic-product-search; do
  curl -s -X DELETE "${H[@]}" "$KIBANA_URL/api/workflows/workflow/$w"; done
for s in agentic-product-search agentic-product-analytics agentic-support-search; do
  curl -s -X DELETE "${H[@]}" "$ES_URL/_scripts/$s"; done
curl -s -X DELETE "${H[@]}" "$ES_URL/products,support-kb"
curl -s -X DELETE "${H[@]}" "$ES_URL/_ingest/pipeline/products-enrich"
```

---

## Repository layout

```
.
├── setup.py                    # one-shot setup + --test / --timing / --models
├── .env.example                # copy to .env
├── data/
│   ├── products.json           # 194 DummyJSON products
│   └── support_kb.json         # 20 help-centre articles
├── elastic/
│   ├── mappings/               # index mappings (semantic_text)
│   ├── pipelines/              # ingest pipeline
│   ├── search-templates/       # mustache templates (hybrid, analytics, help centre)
│   ├── workflows/              # agentic + classic workflows (YAML)
│   └── agent/                  # Agent Builder tools + agent
├── ui/                         # demo UI + allow-list proxy
└── agentic_search_deck/        # talk slides (Marp source + HTML), with speaker notes and demo run-sheet
```

## Talk slides

`agentic_search_deck/agentic_search_slides.html` is the deck for the talk *"Agentic Search: When the Agent Decides
What to Search"* (about 30 minutes including the demo). Open it in a browser: arrow keys to navigate, **P** for
presenter view with speaker notes. Edit `agentic_search_slides.md` and rebuild with:

```bash
cd agentic_search_deck
npx @marp-team/marp-cli agentic_search_slides.md -o agentic_search_slides.html --allow-local-files
```

## Notes

- Workflows and parts of Agent Builder are recent features. Their APIs may change between releases; this repo
  targets Elastic Cloud Serverless as of September 2026.
- This is a demo, not an official Elastic product. Product data comes from DummyJSON; ShopSphere and its policies are fictional.
- Author: Ashish Tiwari, Principal Solutions Architect (Search AI Specialist), Elastic.
