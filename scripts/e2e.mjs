// Headless smoke test for the built SPA against the mock mirakc server.
// Prereqs: `npm run build` and `npm run mock` (in another shell).
// Usage: node scripts/e2e.mjs [baseUrl]   (default http://localhost:4180)
import { chromium } from 'playwright';

const BASE = process.argv[2] || 'http://localhost:4180';
const errors = [];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on('console', (m) => {
  if (m.type() === 'error' && !m.text().includes('Failed to load resource')) {
    errors.push(`console.error: ${m.text()}`);
  }
});
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));

const checks = [];
function check(name, ok) {
  checks.push([name, ok]);
}

async function visit(hash) {
  await page.goto(`${BASE}/#${hash}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  return page.locator('body').innerText();
}

check('home: ステータス', (await visit('/')).includes('ステータス'));
{
  const text = await visit('/');
  check('home: 4K バッジ', text.includes('4K'));
  const logos = await page.locator('img[src*="/logo"]').count();
  check('home: ロゴ表示 (hasLogoData)', logos >= 3);
  check('home: チューナーチャンネル (streamSetting)', text.includes('NHK BS / BS BS15_0'));
  check('home: CATV TSMF', text.includes('TSMF 3'));
}
check('epg: 番組表', (await visit('/epg')).includes('EPG 番組表'));
check('epg: BS4K 列', (await visit('/epg')).includes('NHK BS4K'));
check('epg: CATV フィルタ', (await visit('/epg')).includes('CATV'));
check('epg: サービス週間ビュー', (await visit('/epg/services/45328')).includes('8日間'));
{
  const text = await visit('/epg');
  check('epg: CATV サービス', text.includes('CATV TBS'));
}
check('search', (await visit('/epg/search?q=NHK')).includes('件'));
{
  const text = await visit('/about');
  check('about: BS4K', text.includes('BS4K'));
  check('about: X-Mirakc-Tuner', text.includes('X-Mirakc-Tuner'));
}
check('notfound', (await visit('/nope')).includes('ページが見つかりません'));

await browser.close();

let failed = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}`);
  if (!ok) failed++;
}
if (errors.length) {
  failed++;
  console.log('\n=== runtime errors ===');
  console.log(errors.join('\n'));
}
console.log(`\n${checks.length - failed}/${checks.length} checks passed`);
process.exit(failed ? 1 : 0);
