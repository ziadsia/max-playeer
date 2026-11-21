// Every request to the backend lives here. Components never call fetch directly.
import type { Category, EpgItem, LiveStream, Series, SeriesInfo, UserInfo, VodInfo, VodStream } from '../types';

export class ApiError extends Error {
  constructor(public code: string, public status: number) { super(code); }
}

let onUnauthorized: (() => void) | null = null;
export const setUnauthorizedHandler = (fn: (() => void) | null) => { onUnauthorized = fn; };

async function http<T>(url: string, init?: RequestInit): Promise<T> {
  let r: Response;
  try { r = await fetch(url, { credentials: 'same-origin', ...init }); }
  catch { throw new ApiError('network', 0); }
  let body: any = null;
  try { body = await r.json(); } catch { /* empty */ }
  if (r.status === 401 && !url.startsWith('/api/login')) { onUnauthorized?.(); throw new ApiError('unauthorized', 401); }
  if (!r.ok) throw new ApiError(body?.error || 'request_failed', r.status);
  return body as T;
}

const memo = new Map<string, Promise<any>>();
function cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
  let p = memo.get(key);
  if (!p) { p = fn().catch((e) => { memo.delete(key); throw e; }); memo.set(key, p); }
  return p;
}
const list = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const xc = (action: string, params: Record<string, string | number> = {}) => {
  const q = new URLSearchParams({ action });
  Object.entries(params).forEach(([k, v]) => q.set(k, String(v)));
  return http<unknown>('/api/xc?' + q.toString());
};
const fixCat = <T extends { category_id: unknown }>(a: T[]) => a.map((x) => ({ ...x, category_id: String(x.category_id) }));

export const api = {
  login: (username: string, password: string) => {
    memo.clear();
    return http<UserInfo>('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
  },
  logout: async () => { memo.clear(); try { await http('/api/logout', { method: 'POST' }); } catch { /* ignore */ } },
  me: () => http<UserInfo>('/api/me'),

  liveCategories: () => cached('lc', async () => list<Category>(await xc('get_live_categories'))),
  live: () => cached('ls', async () => fixCat(list<LiveStream>(await xc('get_live_streams')))),
  epg: async (id: number) => {
    const d: any = await xc('get_short_epg', { stream_id: id, limit: 2 });
    return list<EpgItem>(d?.epg_listings);
  },

  vodCategories: () => cached('vc', async () => list<Category>(await xc('get_vod_categories'))),
  vod: () => cached('vs', async () => fixCat(list<VodStream>(await xc('get_vod_streams')))),
  vodInfo: (id: string | number) => cached('vi' + id, async () => (await xc('get_vod_info', { vod_id: id })) as VodInfo),

  seriesCategories: () => cached('sc', async () => list<Category>(await xc('get_series_categories'))),
  series: () => cached('ss', async () => fixCat(list<Series>(await xc('get_series')))),
  seriesInfo: (id: string | number) => cached('si' + id, async () => (await xc('get_series_info', { series_id: id })) as SeriesInfo),
};

export const streamUrl = (type: 'live' | 'movie' | 'episode', id: string | number, ext: string) =>
  `/play/${type === 'episode' ? 'series' : type}/${id}.${ext}`;
