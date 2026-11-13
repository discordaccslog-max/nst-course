// Captures product-page previews from the real trainer into img/previews/<slug>-<n>.jpg.
// Run: node tools/previews/capture.mjs   (uses the local dev server and the installed Chrome)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { startServer } from '../dev-server.mjs';
import { previews } from './specs.mjs';
import '../../js/products.js';
import { generate } from '../../js/license.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = path.join(ROOT, 'img/previews');
fs.mkdirSync(OUT, { recursive: true });
const server = await startServer(8133);
const BASE = 'http://localhost:8133';
const browser = await chromium.launch({ channel: 'chrome' });
const code = await generate('complete-training-library', 'PREVIEW');
const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 }, colorScheme: 'light', serviceWorkers: 'block', reducedMotion: 'reduce' });
await ctx.addInitScript((c) => {
  localStorage.setItem('fiancho-chess.v1', JSON.stringify({ version: 1, licenses: { [c]: { code: c, product: 'complete-training-library', activatedAt: new Date().toISOString() } }, progress: {}, settings: { walkthroughDone: true }, lastBackupAt: new Date().toISOString() }));
}, code);
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

async function squarePoint(sq) {
  return page.evaluate((sq) => {
    const wrap = document.querySelector('.fc-board'); const r = wrap.querySelector('svg').getBoundingClientRect();
    const o = wrap.dataset.orientation, f = 'abcdefgh'.indexOf(sq[0]), rk = Number(sq[1]);
    const x = o === 'w' ? f : 7 - f, y = o === 'w' ? 8 - rk : rk - 1;
    return { x: r.left + ((x + 0.5) * r.width) / 8, y: r.top + ((y + 0.5) * r.height) / 8 };
  }, sq);
}

let n = 0;
for (const [slug, specs] of Object.entries(previews)) {
  for (let i = 0; i < specs.length; i++) {
    const s = specs[i];
    await page.goto(`${BASE}/train/#${s.route}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    if (s.explore) for (let k = 0; k < s.explore; k++) { const b = page.locator('.tr-branches [data-c="0"]'); if (await b.count()) await b.click(); }
    if (s.step) for (let k = 0; k < s.step; k++) await page.locator('[data-step="next"]').click();
    if (s.solve) {
      const course = JSON.parse(fs.readFileSync(path.join(ROOT, `train/courses/${s.route.split('/')[2]}.json`), 'utf8'));
      const [, , , , secId, idx] = s.route.split('/');
      const item = course.sections.find((x) => x.id === secId).items[Number(idx) - 1];
      await page.waitForSelector('.fc-board.is-interactive');
      for (const sq of [item.solution[0].slice(0, 2), item.solution[0].slice(2, 4)]) { const p = await squarePoint(sq); await page.mouse.click(p.x, p.y); await page.waitForTimeout(80); }
      await page.waitForTimeout(400);
    }
    await page.mouse.move(5, 5);
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT, `${slug}-${i + 1}.jpg`), type: 'jpeg', quality: 82 });
    n++;
  }
}
await browser.close();
server.close();
if (errors.length) { console.error('page errors:', errors); process.exit(1); }
console.log(`${n} previews captured`);
