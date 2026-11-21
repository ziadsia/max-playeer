// MAX backend: login/session, Xtream API proxy, stream proxy (HLS rewrite), image proxy, static hosting.
import express from 'express';
import compression from 'compression';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Readable } from 'node:stream';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Minimal .env loader (no extra dependency)
try {
  for (const line of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
} catch {}

const HOST = (process.env.XTREAM_HOST || 'http://max4k.xyz').replace(/\/+$/, '');
const ORIGIN = new URL(HOST).origin;
const PORT = Number(process.env.PORT || 3000);
const PROD = process.env.NODE_ENV === 'production';
const SECRET = process.env.SESSION_SECRET || (PROD ? '' : 'dev-only-secret-change-me');
if (PROD && (!SECRET || SECRET.startsWith('change-me'))) {
  console.error('SESSION_SECRET must be set to a long random value in production.');
  process.exit(1);
}
const KEY = crypto.createHash('sha256').update(SECRET).digest();
const COOKIE = 'max_session';
const MAX_AGE = 7 * 24 * 3600; // seconds
const UA = 'MAX-WebPlayer/1.0';

/* ---------- session: AES-256-GCM sealed cookie (credentials never reach the browser JS) ---------- */
function seal(obj) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  const enc = Buffer.concat([c.update(JSON.stringify(obj), 'utf8'), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), enc]).toString('base64url');
}
function unseal(tok) {
  try {
    const b = Buffer.from(tok, 'base64url');
    const d = crypto.createDecipheriv('aes-256-gcm', KEY, b.subarray(0, 12));
    d.setAuthTag(b.subarray(12, 28));
    const o = JSON.parse(Buffer.concat([d.update(b.subarray(28)), d.final()]).toString('utf8'));
    return o.exp > Date.now() ? o : null;
  } catch { return null; }
}
function parseCookies(h = '') {
  const out = {};
  for (const part of h.split(';')) { const i = part.indexOf('='); if (i > 0) out[part.slice(0, i).trim()] = part.slice(i + 1).trim(); }
  return out;
}
const secureCookie = (req) => (process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === 'true' : req.secure);
function setSession(req, res, creds) {
  const tok = seal({ u: creds.u, p: creds.p, exp: Date.now() + MAX_AGE * 1000 });
  res.setHeader('Set-Cookie', `${COOKIE}=${tok}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE}${secureCookie(req) ? '; Secure' : ''}`);
}
const clearSession = (req, res) =>
  res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secureCookie(req) ? '; Secure' : ''}`);

/* ---------- signed URLs (so proxies can't be abused as open relays) ---------- */
const mac = (kind, s) => crypto.createHmac('sha256', KEY).update(kind + ':' + s).digest('base64url').slice(0, 24);
const sign = (kind, href) => { const b = Buffer.from(href).toString('base64url'); return b + '.' + mac(kind, b); };
function unsign(kind, tok) {
  const [b, sig] = String(tok).split('.');
  if (!b || !sig) return null;
  const exp = mac(kind, b);
  if (sig.length !== exp.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(exp))) return null;
  try { return Buffer.from(b, 'base64url').toString(); } catch { return null; }
}

/* ---------- Xtream upstream ---------- */
async function xtream(creds, params = {}) {
  const u = new URL(HOST + '/player_api.php');
  u.searchParams.set('username', creds.u);
  u.searchParams.set('password', creds.p);
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') u.searchParams.set(k, String(v));
  const r = await fetch(u, { headers: { 'User-Agent': UA, 'Accept-Encoding': 'identity' }, signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error('upstream_' + r.status);
  const text = await r.text();
  try { return JSON.parse(text); } catch { throw new Error('upstream_invalid_json'); }
}

// http:// images are blocked on https pages -> rewrite them to our signed image proxy
const IMG_KEYS = new Set(['stream_icon', 'cover', 'cover_big', 'movie_image', 'backdrop_path', 'logo']);
function rewrite(node, key) {
  if (typeof node === 'string') return IMG_KEYS.has(key) && /^http:\/\//i.test(node) ? '/img/' + sign('img', node) : node;
  if (Array.isArray(node)) { for (let i = 0; i < node.length; i++) node[i] = rewrite(node[i], key); return node; }
  if (node && typeof node === 'object') { for (const k of Object.keys(node)) node[k] = rewrite(node[k], k); return node; }
  return node;
}

const publicInfo = (d) => {
  const ui = d.user_info || {};
  return {
    username: ui.username, status: ui.status, exp_date: ui.exp_date ?? null, is_trial: ui.is_trial,
    active_cons: ui.active_cons, max_connections: ui.max_connections, allowed_output_formats: ui.allowed_output_formats || [],
  };
};

/* ---------- streaming proxy ---------- */
function rewriteM3u8(text, base) {
  const map = (u) => {
    try {
      const abs = new URL(u.trim(), base);
      return abs.origin === ORIGIN ? '/up' + abs.pathname + abs.search : '/up-ext/' + sign('up', abs.href);
    } catch { return u; }
  };
  return text.split(/\r?\n/).map((line) => {
    if (!line.trim()) return line;
    if (line.startsWith('#')) return line.replace(/URI="([^"]+)"/g, (_, u) => `URI="${map(u)}"`);
    return map(line);
  }).join('\n');
}

async function pipe(req, res, target, opts = {}) {
  const headers = { 'User-Agent': UA, 'Accept-Encoding': 'identity' };
  if (req.headers.range) headers.Range = req.headers.range;
  const ac = new AbortController();
  res.on('close', () => ac.abort());
  const timer = setTimeout(() => ac.abort(), 25000);
  let r;
  try { r = await fetch(target, { headers, signal: ac.signal, redirect: 'follow' }); }
  catch { clearTimeout(timer); if (!res.headersSent) res.status(502).end(); return; }
  clearTimeout(timer);

  const ct = r.headers.get('content-type') || '';
  if (opts.imageOnly && !/^image\//i.test(ct)) { ac.abort(); return res.status(415).end(); }
  let finalPath = '';
  try { finalPath = new URL(r.url).pathname; } catch {}
  if (r.ok && (/mpegurl/i.test(ct) || /\.m3u8$/i.test(finalPath))) {
    const text = await r.text();
    if (text.startsWith('#EXTM3U')) {
      return res.status(200).set({ 'Content-Type': 'application/vnd.apple.mpegurl', 'Cache-Control': 'no-store' }).send(rewriteM3u8(text, r.url));
    }
    return res.status(200).set('Content-Type', ct || 'text/plain').send(text);
  }
  res.status(r.status);
  for (const h of ['content-type', 'content-length', 'content-range', 'accept-ranges', 'last-modified']) {
    const v = r.headers.get(h); if (v) res.setHeader(h, v);
  }
  if (opts.cache) res.setHeader('Cache-Control', 'public, max-age=604800');
  if (!r.body) return res.end();
  Readable.fromWeb(r.body).on('error', () => res.destroy()).pipe(res);
}

/* ---------- app ---------- */
const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  const tok = parseCookies(req.headers.cookie)[COOKIE];
  req.session = tok ? unseal(tok) : null;
  next();
});
const needAuth = (req, res, next) => (req.session ? next() : res.status(401).json({ error: 'unauthorized' }));

// login throttling
const attempts = new Map();
setInterval(() => { const n = Date.now(); for (const [k, v] of attempts) if (v.reset < n) attempts.delete(k); }, 60000).unref();
function throttled(ip) {
  const now = Date.now(); const a = attempts.get(ip);
  if (!a || a.reset < now) { attempts.set(ip, { n: 1, reset: now + 600000 }); return false; }
  return ++a.n > 12;
}

app.post('/api/login', express.json({ limit: '2kb' }), async (req, res) => {
  if (throttled(req.ip)) return res.status(429).json({ error: 'rate_limited' });
  const { username, password } = req.body || {};
  if (typeof username !== 'string' || typeof password !== 'string' || !username.trim() || !password || username.length > 100 || password.length > 100)
    return res.status(400).json({ error: 'missing_credentials' });
  const creds = { u: username.trim(), p: password };
  try {
    const data = await xtream(creds);
    const ui = data && data.user_info;
    if (!ui || Number(ui.auth) !== 1) return res.status(401).json({ error: 'invalid_credentials' });
    const st = String(ui.status || 'Active').toLowerCase();
    if (st !== 'active') return res.status(403).json({ error: 'account_' + st });
    setSession(req, res, creds);
    res.json(publicInfo(data));
  } catch { res.status(502).json({ error: 'server_unreachable' }); }
});

app.post('/api/logout', (req, res) => { clearSession(req, res); res.json({ ok: true }); });

app.get('/api/me', needAuth, async (req, res) => {
  try {
    const data = await xtream({ u: req.session.u, p: req.session.p });
    if (!data?.user_info || Number(data.user_info.auth) !== 1) { clearSession(req, res); return res.status(401).json({ error: 'unauthorized' }); }
    res.json(publicInfo(data));
  } catch { res.status(502).json({ error: 'server_unreachable' }); }
});

const ACTIONS = {
  get_live_categories: [], get_live_streams: ['category_id'], get_vod_categories: [], get_vod_streams: ['category_id'],
  get_vod_info: ['vod_id'], get_series_categories: [], get_series: ['category_id'], get_series_info: ['series_id'],
  get_short_epg: ['stream_id', 'limit'],
};
const cache = new Map(); // key -> { at, body }
app.get('/api/xc', needAuth, compression(), async (req, res) => {
  const action = String(req.query.action || '');
  const allowed = ACTIONS[action];
  if (!allowed) return res.status(400).json({ error: 'bad_action' });
  const params = { action };
  for (const k of allowed) if (req.query[k] !== undefined) params[k] = String(req.query[k]).slice(0, 40);
  const key = req.session.u + '|' + JSON.stringify(params);
  const hit = cache.get(key);
  res.type('json');
  if (hit && Date.now() - hit.at < 300000) return res.send(hit.body);
  try {
    const body = JSON.stringify(rewrite(await xtream({ u: req.session.u, p: req.session.p }, params)));
    if (cache.size > 80) cache.delete(cache.keys().next().value);
    cache.set(key, { at: Date.now(), body });
    res.send(body);
  } catch { res.status(502).json({ error: 'server_unreachable' }); }
});

// Direct play: /play/live/123.m3u8  /play/movie/55.mp4  /play/series/900.mkv
app.get('/play/:kind(live|movie|series)/:file', needAuth, (req, res) => {
  if (!/^\d+\.[a-z0-9]{2,5}$/i.test(req.params.file)) return res.status(400).end();
  const { u, p } = req.session;
  pipe(req, res, `${HOST}/${req.params.kind}/${encodeURIComponent(u)}/${encodeURIComponent(p)}/${req.params.file}`);
});
// HLS segments / sub-playlists on the Xtream host
app.get('/up/*', needAuth, (req, res) => pipe(req, res, HOST + req.originalUrl.slice(3)));
// HLS resources on another host (only URLs we signed ourselves)
app.get('/up-ext/:tok', needAuth, (req, res) => {
  const href = unsign('up', req.params.tok);
  if (!href || !/^https?:\/\//i.test(href)) return res.status(400).end();
  pipe(req, res, href);
});
// Images (http -> proxied)
app.get('/img/:tok', (req, res) => {
  const href = unsign('img', req.params.tok);
  if (!href || !/^http:\/\//i.test(href)) return res.status(400).end();
  pipe(req, res, href, { imageOnly: true, cache: true });
});
app.all(['/api/*', '/play/*', '/up/*', '/up-ext/*', '/img/*'], (req, res) => res.status(404).json({ error: 'not_found' }));

const DIST = path.join(ROOT, 'dist');
if (fs.existsSync(DIST)) {
  app.use(express.static(DIST, { index: false, maxAge: '7d', setHeaders: (r, p) => p.endsWith('.html') && r.setHeader('Cache-Control', 'no-cache') }));
  app.get('*', (req, res) => res.sendFile(path.join(DIST, 'index.html')));
} else {
  app.get('/', (req, res) => res.type('text').send('MAX API is running. Run "npm run build" to serve the web app, or use "npm run dev".'));
}

app.listen(PORT, () => console.log(`MAX running on http://localhost:${PORT}  ->  ${HOST}`));
