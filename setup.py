#!/usr/bin/env python3
"""
One-shot setup for the "Agentic Search natively in Elastic" demo.

Creates everything inside your Elastic project - nothing runs outside Elastic at query time:
  Elasticsearch : inference endpoint check, ingest pipeline, 2 indices (semantic_text on EIS),
                  3 stored search templates, data ingest
  Kibana        : 2 workflows, 3 Agent Builder tools, 1 Agent Builder agent

Usage:
  python3 setup.py                 # full setup (re-creates indices)
  python3 setup.py --skip-data     # only (re)deploy templates, workflows, tools, agent
  python3 setup.py --test "nike running shoes under 100"   # just run the agentic search API
  python3 setup.py --timing "nike running shoes under 100" # per-step latency from the execution trace
  python3 setup.py --models                                # list chat inference endpoints (for LLM_INFERENCE_ID)

Only the Python standard library is used. Config is read from .env (ES_URL, KIBANA_URL, ES_API_KEY).
"""
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent
EL = ROOT / "elastic"

# ----------------------------------------------------------------------------- config

def load_env():
    env_file = ROOT / ".env"
    if env_file.exists():
        for line in env_file.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                v = v.split(" #", 1)[0].strip().strip('"').strip("'")  # allow inline comments
                if v:
                    os.environ.setdefault(k.strip(), v)
    es = os.environ.get("ES_URL", "").rstrip("/")
    kb = os.environ.get("KIBANA_URL", "").rstrip("/") or es.replace(".es.", ".kb.")
    key = os.environ.get("ES_API_KEY", "")
    if not es or not key:
        sys.exit("Set ES_URL and ES_API_KEY in .env")
    return es, kb, key


ES_URL, KIBANA_URL, API_KEY = load_env()

C = {"g": "\033[32m", "y": "\033[33m", "r": "\033[31m", "b": "\033[1m", "d": "\033[2m", "x": "\033[0m"}
def ok(msg): print(f"  {C['g']}✔{C['x']} {msg}")
def warn(msg): print(f"  {C['y']}!{C['x']} {msg}")
def fail(msg): print(f"  {C['r']}✘{C['x']} {msg}")
def head(msg): print(f"\n{C['b']}{msg}{C['x']}")


class HttpError(Exception):
    def __init__(self, status, body):
        super().__init__(f"HTTP {status}: {body[:800]}")
        self.status, self.body = status, body


def http(base, method, path, body=None, kibana=False, raw=None, ctype="application/json", timeout=180):
    url = base + path
    headers = {"Authorization": f"ApiKey {API_KEY}", "Content-Type": ctype}
    if kibana:
        headers.update({"kbn-xsrf": "true", "elastic-api-version": "2023-10-31"})
    data = raw if raw is not None else (json.dumps(body).encode() if body is not None else None)
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            txt = r.read().decode()
            return json.loads(txt) if txt else {}
    except urllib.error.HTTPError as e:
        raise HttpError(e.code, e.read().decode(errors="replace"))


def es(method, path, body=None, **kw): return http(ES_URL, method, path, body, **kw)
def kb(method, path, body=None, **kw): return http(KIBANA_URL, method, path, body, kibana=True, **kw)


def exists(fn, method, path):
    try:
        fn(method, path)
        return True
    except HttpError as e:
        if e.status == 404:
            return False
        raise

# ----------------------------------------------------------------------------- steps

def check_connectivity():
    head("1. Connectivity")
    info = es("GET", "/")
    ok(f"Elasticsearch: {info.get('name')} (build flavor: {info.get('version', {}).get('build_flavor')})")
    try:
        kb("GET", "/api/agent_builder/agents")
        ok(f"Kibana + Agent Builder reachable at {KIBANA_URL}")
    except HttpError as e:
        fail(f"Kibana Agent Builder API not reachable ({e.status}). Check KIBANA_URL. {e.body[:200]}")
        raise


def pick_inference():
    head("2. Inference endpoints (Elastic Inference Service)")
    eps = es("GET", "/_inference/_all").get("endpoints", [])
    ids = {e["inference_id"]: e.get("task_type") for e in eps}

    def choose(env, prefs, task):
        if os.environ.get(env):
            return os.environ[env]
        for p in prefs:
            if p in ids:
                return p
        cands = [i for i, t in ids.items() if t == task]
        return cands[0] if cands else None

    embed = choose("EMBED_INFERENCE_ID",
                   [".jina-embeddings-v5-text-small", ".jina-embeddings-v3", ".elser-2-elastic", ".elser-2-elasticsearch"],
                   "sparse_embedding")
    rerank = choose("RERANK_INFERENCE_ID",
                    [".jina-reranker-v3", ".jina-reranker-v2-base-multilingual", ".rerank-v1-elasticsearch"],
                    "rerank")
    if not embed or not rerank:
        sys.exit(f"Could not find embedding/rerank endpoints. Available: {ids}")
    ok(f"embeddings for semantic_text : {embed}")
    ok(f"reranker                     : {rerank}")
    return embed, rerank


def create_indices_and_ingest(embed_id):
    head("3. Ingest pipeline, indices and data")
    es("PUT", "/_ingest/pipeline/products-enrich", json.loads((EL / "pipelines/products-enrich.json").read_text()))
    ok("ingest pipeline products-enrich")

    for index, mapping_file in [("products", "products.json"), ("support-kb", "support-kb.json")]:
        if exists(es, "HEAD", f"/{index}"):
            es("DELETE", f"/{index}")
        mapping = json.loads((EL / "mappings" / mapping_file).read_text().replace("__EMBED_ID__", embed_id))
        es("PUT", f"/{index}", mapping)
        ok(f"index {index} (semantic_text -> {embed_id})")

    def bulk(index, docs, pipeline=None, batch=25):
        q = f"?pipeline={pipeline}" if pipeline else ""
        for i in range(0, len(docs), batch):
            lines = []
            for d in docs[i:i + batch]:
                lines.append(json.dumps({"index": {"_index": index, "_id": str(d["id"])}}))
                lines.append(json.dumps(d))
            res = es("POST", f"/_bulk{q}", raw=("\n".join(lines) + "\n").encode(), ctype="application/x-ndjson", timeout=300)
            if res.get("errors"):
                errs = [it["index"]["error"] for it in res["items"] if "error" in it["index"]][:3]
                raise RuntimeError(f"bulk errors in {index}: {json.dumps(errs)[:1500]}")
            print(f"    {C['d']}{index}: {min(i + batch, len(docs))}/{len(docs)}{C['x']}", end="\r")
        print()

    products = json.loads((ROOT / "data/products.json").read_text())
    kb_docs = json.loads((ROOT / "data/support_kb.json").read_text())
    t = time.time()
    bulk("products", products, pipeline="products-enrich")
    bulk("support-kb", kb_docs)
    es("POST", "/products,support-kb/_refresh")
    n1 = es("GET", "/products/_count")["count"]
    n2 = es("GET", "/support-kb/_count")["count"]
    ok(f"indexed {n1} products and {n2} help-centre articles in {time.time() - t:.1f}s (embeddings generated on EIS at ingest)")


def put_search_templates(rerank_id):
    head("4. Stored search templates")
    filters = (EL / "search-templates/_filters.mustache").read_text()
    for name in ["agentic-product-search", "agentic-product-analytics", "agentic-support-search"]:
        src = (EL / f"search-templates/{name}.mustache").read_text()
        src = src.replace("__FILTERS__", filters).replace("__RERANK_ID__", rerank_id)
        es("PUT", f"/_scripts/{name}", {"script": {"lang": "mustache", "source": src}})
        ok(name)


FAST_MODEL_PREFS = [  # query understanding needs speed, not deep reasoning
    "gemini-3.1-flash-lite", "gemini-3.5-flash-lite", "gpt-5.4-nano", "claude-4.5-haiku", "haiku",
    "gemini-3.5-flash", "gemini-3.0-flash", "flash", "gpt-5.4-mini", "mini", "gpt-oss-20b",
]


def list_chat_endpoints():
    eps = es("GET", "/_inference/_all").get("endpoints", [])
    return [e["inference_id"] for e in eps if e.get("task_type") in ("chat_completion", "completion")]


def pick_llm_endpoint():
    """The EIS inference endpoint used by the workflow's ai.prompt step AND by the agent (converse)."""
    head("5a. LLM inference endpoint")
    chat = list_chat_endpoints()
    print(f"    {C['d']}chat endpoints: {', '.join(chat) or '(none)'}{C['x']}")
    chosen = os.environ.get("LLM_INFERENCE_ID")
    if chosen:
        if chosen not in chat:
            warn(f"LLM_INFERENCE_ID={chosen} is not in the list above - using it anyway")
        ok(f"LLM_INFERENCE_ID from .env: {chosen}")
        return chosen
    for pref in FAST_MODEL_PREFS:
        for eid in chat:
            if pref in eid.lower():
                ok(f"picked fast model {eid} - pinned into .env as LLM_INFERENCE_ID")
                with open(ROOT / ".env", "a") as f:
                    f.write(f"\n# LLM used by the ai.prompt step and the agent (change and re-run setup.py --skip-data)\nLLM_INFERENCE_ID={eid}\n")
                os.environ["LLM_INFERENCE_ID"] = eid
                return eid
    sys.exit("No chat_completion inference endpoint found - set LLM_INFERENCE_ID in .env")


def catalog_vocab():
    aggs = es("POST", "/products/_search", {"size": 0, "aggs": {
        "categories": {"terms": {"field": "category", "size": 100}},
        "brands": {"terms": {"field": "brand", "size": 300}},
        "price": {"stats": {"field": "price"}}}})["aggregations"]
    cats = ", ".join(b["key"] for b in aggs["categories"]["buckets"])
    brands = ", ".join(b["key"] for b in aggs["brands"]["buckets"])
    return (f"        - categories: {cats}\n        - brands: {brands}\n"
            f"        - price range (USD): {aggs['price']['min']} to {aggs['price']['max']}")


def upsert_workflow(wf_id, yaml_text):
    name = re.search(r"^name:\s*(\S+)", yaml_text, re.M).group(1)
    if exists(kb, "GET", f"/api/workflows/workflow/{wf_id}"):
        try:
            kb("PUT", f"/api/workflows/workflow/{wf_id}",
               {"name": name, "enabled": True, "tags": ["agentic-search", "demo"], "yaml": yaml_text})
            return "updated"
        except HttpError:
            kb("DELETE", f"/api/workflows/workflow/{wf_id}")
    res = kb("POST", "/api/workflows/workflow", {"id": wf_id, "yaml": yaml_text})
    if res.get("valid") is False:
        raise RuntimeError(f"workflow {wf_id} saved but INVALID: {json.dumps(res)[:1500]}")
    return "created"


def deploy_workflows(llm_id):
    head("5b. Workflows (Kibana)")
    reasoning = os.environ.get("LLM_REASONING_LEVEL", "none")
    lines = f'connector-id: "{llm_id}"'
    if reasoning:
        lines += f'\n    reasoning-level: {reasoning}'
    vocab = catalog_vocab()
    ok(f"ai.prompt -> {llm_id} (reasoning-level: {reasoning or 'model default'}), catalog vocabulary baked in")
    for wf_id, f in [("agentic-product-search", "agentic-product-search.yaml"),
                     ("classic-product-search", "classic-product-search.yaml")]:
        y = (EL / "workflows" / f).read_text().replace("__LLM_LINES__", lines).replace("__CATALOG_VOCAB__", vocab)
        ok(f"workflow {wf_id}: {upsert_workflow(wf_id, y)}")


def upsert_tool(tool):
    tid = tool["id"]
    update = {k: v for k, v in tool.items() if k not in ("id", "type")}
    if exists(kb, "GET", f"/api/agent_builder/tools/{tid}"):
        kb("PUT", f"/api/agent_builder/tools/{tid}", update)
        return "updated"
    kb("POST", "/api/agent_builder/tools", tool)
    return "created"


def deploy_agent():
    head("6. Agent Builder tools + agent")
    for tool in json.loads((EL / "agent/tools.json").read_text()):
        try:
            ok(f"tool {tool['id']} ({tool['type']}): {upsert_tool(tool)}")
        except HttpError as e:
            if tool["type"] == "esql" and e.status == 400:
                # older stacks use 'keyword' instead of 'string' for ES|QL tool params
                for p in tool["configuration"]["params"].values():
                    p["type"] = "keyword"
                ok(f"tool {tool['id']} ({tool['type']}): {upsert_tool(tool)}")
            else:
                raise
    agent = json.loads((EL / "agent/shop-concierge.json").read_text())
    aid = agent["id"]
    if exists(kb, "GET", f"/api/agent_builder/agents/{aid}"):
        kb("PUT", f"/api/agent_builder/agents/{aid}", {k: v for k, v in agent.items() if k != "id"})
        ok(f"agent {aid}: updated")
    else:
        kb("POST", "/api/agent_builder/agents", agent)
        ok(f"agent {aid}: created")


def run_agentic_search(query, size=6):
    t = time.time()
    res = kb("POST", "/api/agent_builder/tools/_execute",
             {"tool_id": "shop.agentic_search", "tool_params": {"query": query, "size": size}})
    ms = (time.time() - t) * 1000
    result = res["results"][0]
    if result.get("type") == "error":
        fail(f"{query!r}: {json.dumps(result)[:1500]}")
        return None
    ex = result["data"]["execution"]
    if ex.get("status") != "completed":
        fail(f"{query!r}: execution {ex.get('execution_id')} status={ex.get('status')} {ex.get('error_message', '')}")
        return None
    out = ex["output"]
    ag = out.get("agentic", {})
    u = ag.get("understanding", {})
    print(f"\n  {C['b']}“{query}”{C['x']}  {C['d']}({ms:.0f} ms, execution {ex.get('execution_id')}){C['x']}")
    print(f"    route={ag.get('route')}  rewritten='{ag.get('rewritten_query')}'  relaxed={ag.get('relaxed_fallback')}")
    print(f"    filters: categories={u.get('categories')} brands={u.get('brands')} price={u.get('price_min')}-{u.get('price_max')} "
          f"rating>={u.get('min_rating')} sort={u.get('sort_by')}")
    hits = (out.get("hits") or {}).get("hits", [])
    for h in hits[:5]:
        s = h["_source"]
        print(f"      • {s.get('title')}  [{s.get('brand', s.get('section', ''))}]  {('$' + str(s['price'])) if 'price' in s else ''}")
    aggs = out.get("aggregations") or {}
    for b in (aggs.get("by_group") or {}).get("buckets", [])[:5]:
        print(f"      • {b['key']}: avg={b['metric_avg']['value']:.2f} (n={b['doc_count']})")
    return out


def timing(query):
    head(f"Timing: {query!r}")
    t = time.time()
    res = kb("POST", "/api/agent_builder/tools/_execute",
             {"tool_id": "shop.agentic_search", "tool_params": {"query": query, "size": 12}})
    total = (time.time() - t) * 1000
    ex = res["results"][0]["data"]["execution"]
    trace = kb("GET", f"/api/workflows/executions/{ex['execution_id']}")
    print(f"  {'step':28} {'type':24} {'ms':>7}")
    for st in trace.get("stepExecutions", []):
        ms = st.get("executionTimeMs")
        if ms is None and st.get("finishedAt") and st.get("startedAt"):
            from datetime import datetime
            f = lambda x: datetime.fromisoformat(x.replace("Z", "+00:00"))
            ms = (f(st["finishedAt"]) - f(st["startedAt"])).total_seconds() * 1000
        print(f"  {st.get('stepId', ''):28} {st.get('stepType', ''):24} {ms if ms is None else round(ms):>7}")
    wf_ms = trace.get("duration") or trace.get("executionTimeMs")
    print(f"\n  workflow reported: {wf_ms} ms   end-to-end API call: {total:.0f} ms")
    print(f"  model: {os.environ.get('LLM_INFERENCE_ID')}")


def smoke_test():
    head("7. Smoke test - calling the agentic search API (tools/_execute)")
    for q in ["nike running shoes under 100 dollars",
              "sasta smartphone with good rating",
              "which brand has the best rated laptops?",
              "can I return a perfume if I don't like it?"]:
        try:
            run_agentic_search(q)
        except HttpError as e:
            fail(f"{q!r}: {e}")


def main():
    args = sys.argv[1:]
    if args[:1] == ["--models"]:
        print("\n".join(list_chat_endpoints()))
        return
    if args[:1] == ["--timing"]:
        timing(" ".join(args[1:]) or "nike running shoes under 100 dollars")
        return
    if args[:1] == ["--test"]:
        run_agentic_search(" ".join(args[1:]) or "red dress for a summer party", size=8)
        return
    check_connectivity()
    embed, rerank = pick_inference()
    if "--skip-data" not in args:
        create_indices_and_ingest(embed)
    put_search_templates(rerank)
    llm = pick_llm_endpoint()
    deploy_workflows(llm)
    deploy_agent()
    smoke_test()
    head("Done ✨")
    print(f"  UI       : node ui/server.js  ->  http://localhost:8080")
    print(f"  Kibana   : {KIBANA_URL}/app/workflows   and   {KIBANA_URL}/app/agent_builder")


if __name__ == "__main__":
    try:
        main()
    except HttpError as e:
        fail(str(e))
        sys.exit(1)
