// Google sign-in (OAuth 2.0 authorization-code flow) restricted to one email domain. No dependencies.
// Enabled only when GOOGLE_CLIENT_ID is set; otherwise the UI stays open (plain local runs).
//   GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET   OAuth "Web application" client
//   ALLOWED_DOMAIN                            default elastic.co
//   SESSION_SECRET                            signs the session cookie (long random string)
//   PUBLIC_URL                                optional; else derived from the request (X-Forwarded-Proto/Host)
const crypto = require('crypto');

module.exports = function makeAuth(cfg) {
  const CLIENT_ID = cfg.GOOGLE_CLIENT_ID || '';
  const CLIENT_SECRET = cfg.GOOGLE_CLIENT_SECRET || '';
  const DOMAIN = (cfg.ALLOWED_DOMAIN || 'elastic.co').toLowerCase();
  const PUBLIC_URL = (cfg.PUBLIC_URL || '').replace(/\/$/, '');
  const SECRET = cfg.SESSION_SECRET || crypto.randomBytes(32).toString('hex'); // per-process if unset
  const TTL = 8 * 3600;
  const COOKIE = 'as_session', STATE_COOKIE = 'as_state';
  const ENABLED = !!CLIENT_ID;

  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const mac = (raw) => crypto.createHmac('sha256', SECRET).update(raw).digest('hex');
  const sign = (payload) => { const raw = b64(payload); return `${raw}.${mac(raw)}`; };
  const safeEq = (a, b) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  function unsign(token) {
    try {
      const i = token.lastIndexOf('.');
      const raw = token.slice(0, i);
      if (i < 0 || !safeEq(token.slice(i + 1), mac(raw))) return null;
      const p = JSON.parse(Buffer.from(raw, 'base64url').toString());
      return p.exp > Date.now() / 1000 ? p : null;
    } catch { return null; }
  }
  const cookies = (h) => Object.fromEntries((h || '').split(';').map((s) => s.trim()).filter((s) => s.includes('=')).map((s) => [s.slice(0, s.indexOf('=')), s.slice(s.indexOf('=') + 1)]));
  const currentUser = (req) => unsign(cookies(req.headers.cookie)[COOKIE] || '');
  const baseUrl = (req) => PUBLIC_URL || `${String(req.headers['x-forwarded-proto'] || 'http').split(',')[0].trim()}://${req.headers.host || 'localhost'}`;
  const cookie = (req, name, value, maxAge) =>
    `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}` + (baseUrl(req).startsWith('https') ? '; Secure' : '');
  const clear = (req) => [cookie(req, COOKIE, '', 0), cookie(req, STATE_COOKIE, '', 0)];

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const loginPage = (error) => `<!doctype html><html><head><meta charset="utf-8"><title>ShopSphere - Sign in</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0b1126;color:#e6edf7;font-family:system-ui,sans-serif}
.card{background:#131c3a;border:1px solid #243056;border-radius:12px;padding:36px 40px;max-width:380px;text-align:center}
h1{margin:0 0 6px;font-size:22px}p{color:#9fb3d1;font-size:13px;line-height:1.5}
a.btn{display:inline-block;margin-top:18px;background:#fff;color:#1f2937;text-decoration:none;font-weight:600;padding:10px 18px;border-radius:8px}
.err{background:#3a1420;border:1px solid #7a2238;color:#ffb4c1;padding:9px 12px;border-radius:8px;margin-top:14px;font-size:13px}</style></head>
<body><div class="card"><h1>ShopSphere &middot; Agentic Search</h1><p>Sign in with your @${esc(DOMAIN)} Google account.</p>
${error ? `<div class="err">${esc(error)}</div>` : ''}<a class="btn" href="/auth/login">Sign in with Google</a></div></body></html>`;

  async function postForm(url, data) {
    const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(data), signal: AbortSignal.timeout(20000) });
    if (!r.ok) throw new Error('token exchange failed');
    return r.json();
  }

  async function completeLogin(req, q) {
    if (q.get('error')) throw new Error(`Google sign-in was cancelled (${q.get('error')}).`);
    const st = unsign(cookies(req.headers.cookie)[STATE_COOKIE] || '');
    if (!st || !q.get('state') || !safeEq(st.s, q.get('state'))) throw new Error('Sign-in session expired or invalid. Please try again.');
    if (!q.get('code')) throw new Error('Missing authorization code.');
    let claims;
    try {
      const tok = await postForm('https://oauth2.googleapis.com/token', {
        code: q.get('code'), client_id: CLIENT_ID, client_secret: CLIENT_SECRET,
        redirect_uri: baseUrl(req) + '/auth/callback', grant_type: 'authorization_code' });
      const r = await fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(tok.id_token), { signal: AbortSignal.timeout(20000) });
      if (!r.ok) throw new Error('bad token');
      claims = await r.json();
    } catch { throw new Error('Could not verify your Google sign-in. Please try again.'); }
    const email = (claims.email || '').toLowerCase();
    if (claims.aud !== CLIENT_ID || !['https://accounts.google.com', 'accounts.google.com'].includes(claims.iss)) throw new Error('Invalid sign-in token.');
    if (String(claims.email_verified).toLowerCase() !== 'true') throw new Error('Your Google email is not verified.');
    if (!email.endsWith('@' + DOMAIN) || String(claims.hd || '').toLowerCase() !== DOMAIN)
      throw new Error(`Access is limited to @${DOMAIN} accounts. You signed in as ${email || 'unknown'}.`);
    return { cookie: cookie(req, COOKIE, sign({ email, name: claims.name || email, exp: Date.now() / 1000 + TTL }), TTL), email };
  }

  // Returns true when the request was fully handled here.
  async function handle(req, res, url) {
    const redirect = (loc, setCookie) => { res.writeHead(302, { location: loc, ...(setCookie ? { 'set-cookie': setCookie } : {}) }); res.end(); return true; };
    switch (url.pathname) {
      case '/login':
        if (currentUser(req)) return redirect('/');
        res.writeHead(200, { 'content-type': 'text/html' }); res.end(loginPage(url.searchParams.get('error') || '')); return true;
      case '/auth/login': {
        const state = crypto.randomBytes(24).toString('base64url');
        const q = new URLSearchParams({ client_id: CLIENT_ID, redirect_uri: baseUrl(req) + '/auth/callback', response_type: 'code',
          scope: 'openid email profile', state, hd: DOMAIN, prompt: 'select_account' }); // hd is a UI hint; real check is in completeLogin
        return redirect('https://accounts.google.com/o/oauth2/v2/auth?' + q, cookie(req, STATE_COOKIE, sign({ s: state, exp: Date.now() / 1000 + 600 }), 600));
      }
      case '/auth/callback':
        try {
          const { cookie: c, email } = await completeLogin(req, url.searchParams);
          console.log(`[auth] signed in ${email}`);
          return redirect('/', [c, cookie(req, STATE_COOKIE, '', 0)]);
        } catch (e) { return redirect('/login?error=' + encodeURIComponent(e.message), clear(req)); }
      case '/auth/logout': return redirect('/login', clear(req));
      case '/auth/me': {
        const u = currentUser(req);
        res.writeHead(u ? 200 : 401, { 'content-type': 'application/json' });
        res.end(JSON.stringify(u ? { email: u.email, name: u.name } : { error: 'authentication required' })); return true;
      }
    }
    return false;
  }

  return { ENABLED, DOMAIN, handle, currentUser };
};
