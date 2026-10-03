// Minimal mock of mirakc's Web API for local E2E of the WebUI.
// Usage: node scripts/mock-mirakc.mjs [distDir] [port]
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const DIST = process.argv[2] || 'dist';
const PORT = Number(process.argv[3] || 4180);
const now = Date.now();
const H = 3600_000;

const services = [
  { id: 3273601024, serviceId: 1024, networkId: 32736, type: 1, name: 'NHK総合', channel: { type: 'GR', channel: '27' }, remoteControlKeyId: 1, epgReady: true },
  { id: 3273601025, serviceId: 1025, networkId: 32736, type: 1, name: 'NHK Eテレ', channel: { type: 'GR', channel: '26' }, remoteControlKeyId: 2, epgReady: true },
  { id: 400101, serviceId: 101, networkId: 4, type: 1, name: 'NHK BS', channel: { type: 'BS', channel: 'BS15_0' }, remoteControlKeyId: 1, epgReady: false },
  { id: 45328, serviceId: 101, networkId: 11, type: 1, name: 'NHK BS4K', channel: { type: 'BS4K', channel: '45328' }, remoteControlKeyId: 1, epgReady: true },
  { id: 45280, serviceId: 102, networkId: 11, type: 1, name: 'NHK BS8K', channel: { type: 'BS4K', channel: '0xB0E0' }, epgReady: false },
  { id: 500001, serviceId: 1, networkId: 5, type: 0xad, name: 'データ放送', channel: { type: 'CS', channel: 'ND02' } },
];

function programs() {
  const list = [];
  let eid = 1;
  for (const sv of services) {
    for (let i = 0; i < 12; i++) {
      list.push({
        id: `${sv.serviceId}-${eid}`,
        eventId: eid,
        serviceId: sv.serviceId,
        networkId: sv.networkId,
        startAt: now - 2 * H + i * 2 * H,
        duration: 2 * H,
        isFree: true,
        name: `${sv.name} 番組${i + 1}`,
        description: 'これはモック番組の説明です。\n2行目。',
        extended: { 出演者: 'テスト太郎' },
        genres: [{ lv1: i % 10, lv2: 0, un1: 0, un2: 0 }],
      });
      eid++;
    }
  }
  return list;
}

const tuners = [
  { index: 0, name: 'GR0', types: ['GR'], command: 'recpt1 --device /dev/px4video0 {{{channel}}} - -', pid: null, isAvailable: true, isFree: true, isUsing: false, isFault: false, users: [] },
  { index: 1, name: 'BS0', types: ['BS', 'CS'], command: 'recpt1 --device /dev/px4video1 {{{channel}}} - -', pid: 12345, isAvailable: true, isFree: false, isUsing: true, isFault: false, users: [{ id: 'client-1', agent: 'EPGStation', priority: 128 }] },
  { index: 2, name: 'BS4K0', types: ['BS4K'], command: 'curl -sG http://decode:40773/stream?channel={{{channel}}}', pid: null, isAvailable: true, isFree: true, isUsing: false, isFault: false, users: [] },
];

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json' };

function json(res, data) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const path = url.pathname;
  if (path === '/api/version') return json(res, { current: '3.0.0-mock', latest: '3.0.0-mock' });
  if (path === '/api/services') return json(res, services);
  if (path === '/api/programs') return json(res, programs());
  if (path === '/api/tuners') return json(res, tuners);
  if (path === '/api/channels') return json(res, []);
  if (path.startsWith('/api/services/') && path.endsWith('/logo')) {
    res.writeHead(404);
    return res.end();
  }
  if (path === '/events') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
    res.write(': connected\n\n');
    const t = setInterval(() => res.write(': ping\n\n'), 15000);
    req.on('close', () => clearInterval(t));
    return;
  }
  let file = path === '/' ? '/index.html' : path;
  if (!extname(file)) file = '/index.html';
  try {
    const data = await readFile(join(DIST, normalize(file)));
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
    return res.end(data);
  } catch {
    res.writeHead(404);
    return res.end('not found');
  }
});

server.listen(PORT, () => console.log(`mock mirakc on http://localhost:${PORT}`));
