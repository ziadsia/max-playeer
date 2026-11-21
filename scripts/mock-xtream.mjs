// Tiny fake Xtream server for testing MAX without real credentials.
//   npm run mock    (port 9000)   then set XTREAM_HOST=http://localhost:9000 in .env
// Login: test / test.  It serves categories, lists and an HLS playlist (playlist only, no real video).
import http from 'node:http';

const PORT = 9000, USER = 'test', PASS = 'test';
const img = (t) => `http://localhost:${PORT}/img.svg?${encodeURIComponent(t)}`;
const json = (res, o) => { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(o)); };

http.createServer((req, res) => {
  const u = new URL(req.url, `http://localhost:${PORT}`);
  const q = u.searchParams;
  if (u.pathname === '/img.svg') {
    res.writeHead(200, { 'Content-Type': 'image/svg+xml' });
    return res.end(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450"><rect width="300" height="450" fill="#0c1430"/><text x="150" y="235" fill="#5b9bff" font-size="28" text-anchor="middle">${q.toString().slice(0, 18)}</text></svg>`);
  }
  if (u.pathname === '/player_api.php') {
    if (q.get('username') !== USER || q.get('password') !== PASS) return json(res, { user_info: { auth: 0 } });
    switch (q.get('action')) {
      case null: return json(res, { user_info: { username: USER, password: PASS, auth: 1, status: 'Active', exp_date: String(Math.floor(Date.now() / 1000) + 86400 * 30), is_trial: '0', active_cons: '0', max_connections: '1', allowed_output_formats: ['m3u8', 'ts'] }, server_info: {} });
      case 'get_live_categories': return json(res, [{ category_id: '1', category_name: 'News' }, { category_id: '2', category_name: 'Sports' }]);
      case 'get_live_streams': return json(res, Array.from({ length: 12 }, (_, i) => ({ num: i + 1, name: `Channel ${i + 1}`, stream_id: 100 + i, stream_icon: img('CH' + (i + 1)), category_id: String(1 + (i % 2)) })));
      case 'get_vod_categories': return json(res, [{ category_id: '10', category_name: 'Action' }, { category_id: '11', category_name: 'Drama' }]);
      case 'get_vod_streams': return json(res, Array.from({ length: 30 }, (_, i) => ({ num: i + 1, name: `Movie ${i + 1} (${2000 + i})`, stream_id: 500 + i, stream_icon: img('M' + (i + 1)), rating: String((i % 10) + 0.5), category_id: String(10 + (i % 2)), container_extension: 'mp4', added: String(1700000000 + i * 1000) })));
      case 'get_vod_info': return json(res, { info: { name: 'Mock Movie', movie_image: img('Mock'), plot: 'A mock movie used to test the UI.', duration: '01:45:00', genre: 'Action', rating: '7.5', releasedate: '2020-01-01' }, movie_data: { stream_id: Number(q.get('vod_id')), name: 'Mock Movie', container_extension: 'mp4' } });
      case 'get_series_categories': return json(res, [{ category_id: '20', category_name: 'Series' }]);
      case 'get_series': return json(res, Array.from({ length: 10 }, (_, i) => ({ series_id: 900 + i, name: `Series ${i + 1}`, cover: img('S' + (i + 1)), rating: '8.1', category_id: '20', last_modified: String(1700000000 + i) })));
      case 'get_series_info': return json(res, { info: { name: 'Mock Series', cover: img('Series'), plot: 'Mock plot.', genre: 'Drama' }, episodes: { 1: [1, 2, 3].map((n) => ({ id: String(7000 + n), episode_num: n, title: `Episode ${n}`, container_extension: 'mp4', info: { duration: '45:00' } })), 2: [1, 2].map((n) => ({ id: String(7100 + n), episode_num: n, title: `Episode ${n}`, container_extension: 'mp4', info: {} })) } });
      case 'get_short_epg': return json(res, { epg_listings: [{ title: Buffer.from('Mock News').toString('base64') }, { title: Buffer.from('Mock Weather').toString('base64') }] });
      default: return json(res, []);
    }
  }
  const m = u.pathname.match(/^\/live\/([^/]+)\/([^/]+)\/(\d+)\.m3u8$/);
  if (m) {
    res.writeHead(200, { 'Content-Type': 'application/vnd.apple.mpegurl' });
    return res.end('#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TARGETDURATION:4\n#EXTINF:4,\nseg0.ts\n#EXTINF:4,\n/hls/abc/seg1.ts\n#EXTINF:4,\nhttp://localhost:9000/hls/abc/seg2.ts\n');
  }
  res.writeHead(404); res.end();
}).listen(PORT, () => console.log(`Mock Xtream on http://localhost:${PORT}  (user: ${USER} / pass: ${PASS})`));
