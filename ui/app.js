// Presentation only. Every search / decision happens inside Elastic:
//   POST /api/agent_builder/tools/_execute  -> workflow "agentic_product_search" (or the classic baseline)
//   POST /api/agent_builder/converse        -> Agent Builder agent "shop-concierge"
//   GET  /api/workflows/executions/{id}     -> execution trace, for the demo
// The page just renders what comes back.

const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const EXAMPLES = [
  'nike running shoes under 100 dollars',
  'sasta smartphone with good rating',
  'something to keep my coffee hot',
  'gift for my wife who loves luxury, under $200',
  'cheapest laptop in stock',
  'samsng phone',
  'which brand has the best rated smartphones?',
  'average price of womens watches by brand',
  'can I return perfume if I dont like it?',
  'do you have EMI on laptops?',
  'what is the capital of France',
];
const COMPARE_EXAMPLES = [
  'something to keep my coffee hot on a long drive',
  'outfit for a beach wedding under 100',
  'I have oily skin, need something for the face',
  'red lipstick sasta',
  'apple under 1000',
];
const AGENT_EXAMPLES = [
  'Planning a Goa beach trip, budget $150 total — what should I pack?',
  'Setting up a home office: I need a laptop, a desk chair and something for my desk. Mid-range.',
  'Compare smartphone brands and recommend the best value phone.',
  'My dad loves watches and fragrances. Gift ideas under $150?',
];

// ------------------------------------------------------------------ Elastic calls (via allow-list proxy)
async function kbn(method, path, body) {
  const r = await fetch('/kbn' + path, { method, headers: { 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const text = await r.text();
  let json; try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!r.ok) throw new Error(`${r.status} ${json.message || text}`);
  return json;
}
async function runTool(tool_id, tool_params) {
  const t0 = performance.now();
  const res = await kbn('POST', '/api/agent_builder/tools/_execute', { tool_id, tool_params });
  const ms = Math.round(performance.now() - t0);
  const first = res.results?.[0];
  if (!first || first.type === 'error') throw new Error(JSON.stringify(first?.data || res, null, 2));
  const ex = first.data.execution;
  if (ex.status !== 'completed') throw new Error(`Workflow ${ex.status}: ${ex.error_message || ''} (execution ${ex.execution_id})`);
  return { output: ex.output, execution: ex, ms, raw: res };
}

// ------------------------------------------------------------------ rendering helpers
function stars(r) { const n = Math.round(r || 0); return '★'.repeat(n) + '☆'.repeat(5 - n) + ` ${Number(r || 0).toFixed(1)}`; }
function stock(s) {
  const st = s.availability_status || (s.stock > 0 ? 'In Stock' : 'Out of Stock');
  const cls = st === 'Low Stock' ? 'low' : st === 'Out of Stock' ? 'out' : 'in';
  return `<span class="stock ${cls}">${esc(st)}</span>`;
}
function productCard(hit, i) {
  const s = hit._source || {};
  const score = hit._score != null ? Number(hit._score).toFixed(3) : (hit.sort ? 'sorted' : '');
  return `<div class="card" style="animation-delay:${i * 35}ms">
    <div class="img"><img loading="lazy" src="${esc(s.thumbnail)}" alt="${esc(s.title)}"/>
      <span class="rank">#${i + 1}</span>${score ? `<span class="score">${score}</span>` : ''}</div>
    <div class="body">
      <div class="title">${esc(s.title)}</div>
      <div class="sub">${esc(s.brand)} · ${esc(s.category)}</div>
      <div class="row"><span class="price">$${Number(s.price).toFixed(2)}${s.discount_percentage ? `<span class="off">-${Math.round(s.discount_percentage)}%</span>` : ''}</span>${stock(s)}</div>
      <div class="stars">${stars(s.rating)}</div>
    </div></div>`;
}
function renderHits(container, out) {
  const ag = out.agentic || {};
  const hits = out.hits?.hits || [];
  if (ag.route === 'analytics') return renderAnalytics(container, out);
  if (ag.route === 'support_question') {
    container.innerHTML = hits.length ? hits.map((h, i) => `<div class="kb-card" style="animation-delay:${i * 60}ms">
      <div class="sec">Help centre · ${esc(h._source.section)} · score ${Number(h._score).toFixed(3)}</div>
      <h4>${esc(h._source.title)}</h4><p>${esc(h._source.body)}</p></div>`).join('') : '<div class="empty">No help-centre article found.</div>';
    return;
  }
  if (ag.route === 'out_of_scope') {
    container.innerHTML = `<div class="empty">🤷 The agent decided this isn't a shopping question, so it <b>didn't search at all</b>.</div>`;
    return;
  }
  container.innerHTML = hits.length ? hits.map(productCard).join('') : '<div class="empty">No products found.</div>';
}
function renderAnalytics(container, out) {
  const u = out.agentic?.understanding || {};
  const buckets = out.aggregations?.by_group?.buckets || [];
  const overall = out.aggregations?.overall || {};
  const metric = u.metric || 'price';
  const fmt = (v) => v == null ? '–' : metric === 'price' ? `$${v.toFixed(2)}` : v.toFixed(2);
  const max = Math.max(...buckets.map((b) => b.metric_avg.value || 0), 1);
  container.innerHTML = `<div class="agg">
    <h4>${esc(metric)} ${u.group_by !== 'none' ? 'by ' + esc(u.group_by) : ''} <span class="muted">— ${out.hits?.total?.value ?? 0} products · avg ${fmt(overall.avg)} · min ${fmt(overall.min)} · max ${fmt(overall.max)}</span></h4>
    ${buckets.map((b) => {
      const top = b.top_product?.hits?.hits?.[0]?._source || {};
      return `<div class="bar-row"><b>${esc(b.key)}</b>
        <div><div class="bar" style="width:${Math.max(4, (b.metric_avg.value / max) * 100)}%"></div></div>
        <span>avg ${fmt(b.metric_avg.value)} <span class="muted">(${b.doc_count})</span></span>
        ${top.thumbnail ? `<img title="${esc(top.title)}" src="${esc(top.thumbnail)}"/>` : '<span></span>'}</div>`;
    }).join('') || '<p class="muted">No grouping requested — see overall stats above.</p>'}
  </div>`;
}
function renderPlan(out, ms, execution) {
  const ag = out.agentic || {};
  const u = ag.understanding || {};
  const f = [];
  (u.categories || []).forEach((c) => f.push(`<span class="fchip">category: <b>${esc(c)}</b></span>`));
  (u.brands || []).forEach((b) => f.push(`<span class="fchip">brand: <b>${esc(b)}</b></span>`));
  if (u.price_min > 0) f.push(`<span class="fchip">price ≥ <b>$${u.price_min}</b></span>`);
  if (u.price_max > 0) f.push(`<span class="fchip">price ≤ <b>$${u.price_max}</b></span>`);
  if (u.min_rating > 0) f.push(`<span class="fchip">rating ≥ <b>${u.min_rating}</b></span>`);
  if (u.in_stock_only) f.push(`<span class="fchip"><b>in stock</b></span>`);
  if (u.sort_by && u.sort_by !== 'relevance') f.push(`<span class="fchip">sort: <b>${esc(u.sort_by)}</b></span>`);
  if (ag.route === 'analytics') { f.push(`<span class="fchip">group by: <b>${esc(u.group_by)}</b></span>`, `<span class="fchip">metric: <b>${esc(u.metric)}</b></span>`); }
  const retrieval = ag.route === 'product_search'
    ? (ag.template_params?.hybrid ? 'BM25 + semantic_text → RRF → Jina rerank' : 'filtered BM25 + sort')
    : ag.route === 'analytics' ? 'filters + aggregations' : ag.route === 'support_question' ? 'help-centre hybrid + rerank' : 'no retrieval';
  return `<h3>What the agent decided</h3>
    <span class="route ${esc(ag.route)}">${esc((ag.route || '').replace('_', ' '))}</span>
    <dl class="kv">
      <dt>Query reformulation</dt>
      <dd class="rewrite"><div class="from">${esc(ag.original_query)}</div><div>→ ${esc(ag.rewritten_query) || '<i class="muted">(filters only)</i>'}</div></dd>
      <dt>Detected filters</dt><dd>${f.join('') || '<span class="muted">none</span>'}</dd>
      <dt>Index · template · retrieval</dt><dd><code>${esc(ag.index)}</code> · <code>${esc(ag.search_template)}</code><br/><span class="muted">${retrieval}</span></dd>
      <dt>Reasoning</dt><dd class="reason">${esc(u.reasoning)}</dd>
    </dl>
    ${ag.relaxed_fallback ? `<div class="alert">⚠️ Strict filters returned 0 hits — the workflow <b>self-corrected</b> and re-ran hybrid search on the raw request.</div>` : ''}
    <p class="muted" style="margin-top:14px">⏱ ${ms} ms end-to-end · execution <code>${esc(execution.execution_id?.slice(0, 8))}</code></p>`;
}

// ------------------------------------------------------------------ Tab: Agentic Search
let lastResult = null, jsonView = 'response';
async function doSearch(q) {
  $('#q').value = q;
  $('#results').innerHTML = `<div class="empty"><span class="spinner"></span>Agent is understanding, routing and searching…</div>`;
  $('#search-meta').textContent = '';
  try {
    const r = await runTool('shop.agentic_search', { query: q, size: 12 });
    lastResult = r;
    $('#plan').innerHTML = renderPlan(r.output, r.ms, r.execution);
    renderHits($('#results'), r.output);
    const total = r.output.hits?.total?.value ?? 0;
    $('#search-meta').innerHTML = `${total} matching docs · ES took ${r.output.took ?? 0} ms · workflow + LLM + retrieval ${r.ms} ms · <code>POST /api/agent_builder/tools/_execute</code>`;
    r.trace = null;
    showJson();
  } catch (e) {
    $('#results').innerHTML = `<div class="error">${esc(e.message)}</div>`;
  }
}
async function showJson() {
  document.querySelectorAll('.json-tabs button').forEach((b) => b.classList.toggle('active', b.dataset.view === jsonView));
  const pre = $('#json-view');
  if (!lastResult) { pre.textContent = '// run a search first'; return; }
  if (jsonView === 'response') pre.textContent = JSON.stringify(lastResult.output, null, 2);
  if (jsonView === 'params') pre.textContent = `POST /${lastResult.output.agentic?.index}/_search/template\n` + JSON.stringify({ id: lastResult.output.agentic?.search_template, params: lastResult.output.agentic?.template_params }, null, 2);
  if (jsonView === 'trace') {
    if (!lastResult.trace) {
      pre.textContent = '// loading GET /api/workflows/executions/' + lastResult.execution.execution_id;
      try { lastResult.trace = await kbn('GET', `/api/workflows/executions/${lastResult.execution.execution_id}`); }
      catch (e) { pre.textContent = e.message; return; }
    }
    const steps = (lastResult.trace.stepExecutions || []).map((s) => {
      const dur = s.executionTimeMs ?? (s.finishedAt && s.startedAt ? new Date(s.finishedAt) - new Date(s.startedAt) : '');
      return `${String(s.stepId).padEnd(26)} ${String(s.stepType || '').padEnd(24)} ${String(s.status).padEnd(10)} ${dur !== '' ? dur + ' ms' : ''}`;
    });
    pre.textContent = `workflow: ${lastResult.trace.workflowDefinition?.name || ''}   status: ${lastResult.trace.status}\n\n` +
      `${'STEP'.padEnd(26)} ${'TYPE'.padEnd(24)} ${'STATUS'.padEnd(10)} DURATION\n` + steps.join('\n') +
      `\n\n// full execution document:\n` + JSON.stringify(lastResult.trace, null, 2);
  }
}

// ------------------------------------------------------------------ Tab: Compare
async function doCompare(q) {
  $('#cq').value = q;
  for (const id of ['#classic-results', '#agentic-results']) $(id).innerHTML = `<div class="empty"><span class="spinner"></span>searching…</div>`;
  $('#agentic-plan').innerHTML = ''; $('#classic-meta').textContent = ''; $('#agentic-meta').textContent = '';
  const classic = runTool('shop.classic_search', { query: q, size: 8 }).then((r) => {
    $('#classic-meta').textContent = `${r.output.hits.total.value} hits · ${r.ms} ms`;
    renderHits($('#classic-results'), { ...r.output, agentic: { route: 'product_search' } });
  }).catch((e) => { $('#classic-results').innerHTML = `<div class="error">${esc(e.message)}</div>`; });
  const agentic = runTool('shop.agentic_search', { query: q, size: 8 }).then((r) => {
    const ag = r.output.agentic || {}; const u = ag.understanding || {};
    $('#agentic-meta').textContent = `${r.output.hits?.total?.value ?? 0} hits · ${r.ms} ms`;
    $('#agentic-plan').innerHTML = `<span class="route ${esc(ag.route)}">${esc(ag.route)}</span> → <code>${esc(ag.rewritten_query)}</code> `
      + [...(u.categories || []).map((c) => `<span class="fchip">${esc(c)}</span>`), ...(u.brands || []).map((b) => `<span class="fchip">${esc(b)}</span>`),
        u.price_max > 0 ? `<span class="fchip">≤ $${u.price_max}</span>` : '', u.sort_by !== 'relevance' ? `<span class="fchip">${esc(u.sort_by)}</span>` : ''].join('');
    renderHits($('#agentic-results'), r.output);
  }).catch((e) => { $('#agentic-results').innerHTML = `<div class="error">${esc(e.message)}</div>`; });
  await Promise.all([classic, agentic]);
}

// ------------------------------------------------------------------ Tab: Agent chat
let conversationId = null;
let CONFIG = {};
fetch('/config').then((r) => r.json()).then((c) => { CONFIG = c; }).catch(() => {});
function md(text) {
  if (window.marked) return window.marked.parse(text || '');
  // tiny fallback if the CDN is unreachable
  return esc(text)
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2"/>')
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(/^#{1,3} (.*)$/gm, '<h3>$1</h3>')
    .replace(/^[-*] (.*)$/gm, '• $1')
    .replace(/\n/g, '<br/>');
}
function toolProducts(step) {
  const out = step.results?.find((r) => r.data?.execution)?.data.execution.output;
  const hits = out?.hits?.hits || [];
  if (!hits.length || out?.agentic?.route !== 'product_search') return '';
  return `<div class="tool-products">${hits.slice(0, 8).map((h) => `<div class="p"><img src="${esc(h._source.thumbnail)}"/><div>${esc(h._source.title)}</div><b>$${h._source.price}</b></div>`).join('')}</div>`;
}
function renderSteps(steps = []) {
  if (!steps.length) return '';
  const items = steps.map((s) => {
    if (s.type === 'reasoning') return `<div class="step"><span class="t">💭 reasoning</span> ${esc(s.reasoning)}</div>`;
    if (s.type === 'tool_call') {
      const ag = s.results?.find((r) => r.data?.execution)?.data.execution.output?.agentic;
      return `<div class="step"><span class="t">🔧 ${esc(s.tool_id)}</span> ${ag ? `→ <span class="route ${esc(ag.route)}">${esc(ag.route)}</span> <code>${esc(ag.rewritten_query)}</code>` : ''}
        <pre>${esc(JSON.stringify(s.params, null, 1))}</pre>${toolProducts(s)}</div>`;
    }
    return `<div class="step"><span class="t">${esc(s.type)}</span></div>`;
  }).join('');
  const calls = steps.filter((s) => s.type === 'tool_call').length;
  return `<details class="steps" open><summary>Agent trace — ${calls} tool call${calls === 1 ? '' : 's'} decided by the agent</summary>${items}</details>`;
}
async function doChat(text) {
  const log = $('#chat-log');
  log.insertAdjacentHTML('beforeend', `<div class="bubble user">${esc(text)}</div>`);
  const pending = document.createElement('div');
  pending.className = 'bubble agent';
  pending.innerHTML = '<span class="spinner"></span>Thinking, planning searches…';
  log.appendChild(pending);
  pending.scrollIntoView({ behavior: 'smooth' });
  const t0 = performance.now();
  try {
    const res = await kbn('POST', '/api/agent_builder/converse', { input: text, agent_id: 'shop-concierge', ...(CONFIG.llmInferenceId ? { inference_id: CONFIG.llmInferenceId } : {}), ...(conversationId ? { conversation_id: conversationId } : {}) });
    conversationId = res.conversation_id;
    pending.innerHTML = renderSteps(res.steps) + md(res.response?.message) +
      `<p class="muted" style="font-size:12px">⏱ ${Math.round(performance.now() - t0)} ms · <code>POST /api/agent_builder/converse</code> · model <code>${esc(CONFIG.llmInferenceId || 'default')}</code></p>`;
  } catch (e) {
    pending.innerHTML = `<div class="error">${esc(e.message)}</div>`;
  }
}

// ------------------------------------------------------------------ wiring
function chips(el, list, fn) { el.innerHTML = list.map((q) => `<button class="chip">${esc(q)}</button>`).join(''); el.querySelectorAll('.chip').forEach((c) => c.onclick = () => fn(c.textContent)); }
document.querySelectorAll('.tab').forEach((t) => t.onclick = () => {
  document.querySelectorAll('.tab').forEach((x) => x.classList.toggle('active', x === t));
  document.querySelectorAll('.panel').forEach((p) => p.classList.toggle('active', p.id === 'tab-' + t.dataset.tab));
});
document.querySelectorAll('.json-tabs button').forEach((b) => b.onclick = () => { jsonView = b.dataset.view; showJson(); });
chips($('#examples'), EXAMPLES, doSearch);
chips($('#compare-examples'), COMPARE_EXAMPLES, doCompare);
chips($('#agent-examples'), AGENT_EXAMPLES, (q) => doChat(q));
$('#search-form').onsubmit = (e) => { e.preventDefault(); if ($('#q').value.trim()) doSearch($('#q').value.trim()); };
$('#compare-form').onsubmit = (e) => { e.preventDefault(); if ($('#cq').value.trim()) doCompare($('#cq').value.trim()); };
$('#chat-form').onsubmit = (e) => { e.preventDefault(); const v = $('#chat-input').value.trim(); if (v) { $('#chat-input').value = ''; doChat(v); } };
$('#chat-reset').onclick = () => { conversationId = null; $('#chat-log').querySelectorAll('.bubble:not(.intro)').forEach((b) => b.remove()); };
