// Thin, logic-free proxy + static file server for the demo UI.
// It only: (1) serves ./ui files, (2) forwards a small allow-list of Kibana API calls,
// adding the API key server-side so it never reaches the browser. No search logic lives here.
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const env = {};
try {
  for (const line of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m) { const v = m[2].split(' #')[0].trim().replace(/^["']|["']$/g, ''); if (v) env[m[1]] = v; }
  }
} catch { /* rely on process.env */ }
const cfg = { ...env, ...process.env };
const ES_URL = (cfg.ES_URL || '').replace(/\/$/, '');
const KIBANA_URL = (cfg.KIBANA_URL || ES_URL.replace('.es.', '.kb.')).replace(/\/$/, '');
const API_KEY = cfg.ES_API_KEY;
const PORT = Number(cfg.PORT || 8080);
const auth = require('./auth')(process.env); // login only when set as real env vars (Cloud Run); local `node ui/server.js` stays open
if (!KIBANA_URL || !API_KEY) { console.error('Set KIBANA_URL / ES_API_KEY in .env'); process.exit(1); }

// Only these Elastic endpoints can be called from the UI.
const ALLOW = [
  ['POST', /^\/api\/workflows\/workflow\/(agentic|classic)-product-search\/run$/],  // run the search workflow directly
  ['POST', /^\/api\/agent_builder\/converse$/],          // Agent Builder agent
  ['GET', /^\/api\/workflows\/executions\/[\w-]+$/],     // execution trace for the demo
];

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json' };

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');

  if (url.pathname === '/healthz') { res.writeHead(200); return res.end('ok'); }

  // Google sign-in gate (only when GOOGLE_CLIENT_ID is set): everything else requires a valid @ALLOWED_DOMAIN session.
  if (auth.ENABLED) {
    if (await auth.handle(req, res, url)) return;
    if (!auth.currentUser(req)) {
      if (url.pathname === '/' || url.pathname === '/index.html') { res.writeHead(302, { location: '/login' }); return res.end(); }
      res.writeHead(401, { 'content-type': 'application/json' }); return res.end('{"error":"authentication required"}');
    }
  }

  if (url.pathname === '/config') {
    res.writeHead(200, { 'content-type': 'application/json' });
    return res.end(JSON.stringify({ kibanaUrl: KIBANA_URL, llmInferenceId: cfg.LLM_INFERENCE_ID || null }));
  }

  if (url.pathname.startsWith('/kbn/')) {
    const target = url.pathname.slice(4);
    if (!ALLOW.some(([m, re]) => m === req.method && re.test(target))) {
      res.writeHead(403); return res.end('not allowed');
    }
    const upstream = new URL(KIBANA_URL + target + url.search);
    const started = Date.now();
    const p = https.request(upstream, {
      method: req.method,
      headers: {
        'content-type': 'application/json',
        'kbn-xsrf': 'true',
        'elastic-api-version': '2023-10-31',
        authorization: `ApiKey ${API_KEY}`,
      },
      timeout: 180000,
    }, (up) => {
      res.writeHead(up.statusCode, { 'content-type': up.headers['content-type'] || 'application/json' });
      up.pipe(res);
      up.on('end', () => console.log(`${req.method} ${target} -> ${up.statusCode} (${Date.now() - started} ms)`));
    });
    p.on('error', (e) => { res.writeHead(502); res.end(JSON.stringify({ error: e.message })); });
    req.pipe(p);
    return;
  }

  const file = path.join(__dirname, url.pathname === '/' ? 'index.html' : url.pathname);
  if (!file.startsWith(__dirname) || !fs.existsSync(file)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => {
  console.log(auth.ENABLED ? `Google sign-in enabled (only @${auth.DOMAIN} accounts)` : 'Sign-in disabled (set GOOGLE_CLIENT_ID to enable)');
  console.log(`ShopSphere demo UI  ->  http://localhost:${PORT}`);
  console.log(`Proxying allow-listed calls to ${KIBANA_URL}`);
  console.log(`Agent LLM (inference_id): ${cfg.LLM_INFERENCE_ID || 'project default - run setup.py to pin one'}`);
});
