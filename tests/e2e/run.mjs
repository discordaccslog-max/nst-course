// End-to-end tests in a real browser (installed Chrome via playwright-core).
// Run: npm run test:e2e        Only the full course walkthrough: ONLY=walkthrough npm run test:e2e
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { Chess } from 'chess.js';
import { startServer } from '../../tools/dev-server.mjs';
import '../../js/products.js';
import { generate, validate } from '../../js/license.js';
import * as tb from '../../train/tb-core.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const PORT = 8140;
const BASE = `http://localhost:${PORT}`;
const products = globalThis.SITE_PRODUCTS;
const COURSES = Object.keys(products).filter((s) => !products[s].includes);
const ONLY = process.env.ONLY || '';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-e2e-'));

const server = await startServer(PORT);
const browser = await chromium.launch({ channel: 'chrome' });
const results = [];

async function newPage({ mobile = false, sw = false, state = null } = {}) {
  const ctx = await browser.newContext({
    viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 860 },
    isMobile: mobile, hasTouch: mobile, deviceScaleFactor: mobile ? 2 : 1,
    serviceWorkers: sw ? 'allow' : 'block', acceptDownloads: true
  });
  if (state) await ctx.addInitScript((s) => { if (!localStorage.getItem('fiancho-chess.v1')) localStorage.setItem('fiancho-chess.v1', s); }, JSON.stringify(state));
  const page = await ctx.newPage();
  page.errors = [];
  page.on('pageerror', (e) => page.errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/favicon|Failed to load resource: net::ERR_INTERNET_DISCONNECTED/.test(m.text())) page.errors.push(m.text()); });
  return { ctx, page };
}

function ownedState(codes, extra = {}) {
  const licenses = {};
  for (const code of codes) { const v = validate(code); licenses[v.code] = { code: v.code, product: v.product.slug, activatedAt: new Date().toISOString() }; }
  return { version: 1, licenses, progress: {}, settings: { walkthroughDone: true, ...extra }, lastBackupAt: new Date().toISOString(), createdAt: new Date().toISOString() };
}

async function test(name, fn) {
  if (ONLY && !name.toLowerCase().includes(ONLY.toLowerCase())) return;
  if (process.env.SKIP && name.toLowerCase().includes(process.env.SKIP.toLowerCase())) return;
  const t0 = Date.now();
  try { await fn(); results.push([true, name]); console.log(`  ok   ${name} (${((Date.now() - t0) / 1000).toFixed(1)}s)`); }
  catch (e) { results.push([false, name, e]); console.log(`  FAIL ${name}\n       ${String(e && e.stack || e).split('\n').slice(0, 4).join('\n       ')}`); }
}
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

/* ---------------- board helpers ---------------- */
async function squarePoint(page, sq) {
  return page.evaluate((sq) => {
    const wrap = document.querySelector('.fc-board');
    const r = wrap.querySelector('svg').getBoundingClientRect();
    const o = wrap.dataset.orientation, f = 'abcdefgh'.indexOf(sq[0]), rk = Number(sq[1]);
    const x = o === 'w' ? f : 7 - f, y = o === 'w' ? 8 - rk : rk - 1;
    return { x: r.left + ((x + 0.5) * r.width) / 8, y: r.top + ((y + 0.5) * r.height) / 8 };
  }, sq);
}
async function tapSquare(page, sq, mobile) {
  await page.locator('.fc-board').scrollIntoViewIfNeeded();
  const p = await squarePoint(page, sq);
  if (mobile) await page.touchscreen.tap(p.x, p.y); else await page.mouse.click(p.x, p.y);
}
async function waitInteractive(page) { await page.waitForSelector('.fc-board.is-interactive', { timeout: 15000 }); }
async function playMove(page, uci, mobile = false) {
  await waitInteractive(page);
  await tapSquare(page, uci.slice(0, 2), mobile);
  await page.waitForTimeout(60);
  await tapSquare(page, uci.slice(2, 4), mobile);
  if (uci[4]) {
    const idx = { q: 0, r: 1, b: 2, n: 3 }[uci[4]];
    await page.locator('.fc-promo__btn').nth(idx).click();
  }
}
const boardFen = (page) => page.evaluate(() => document.querySelector('.fc-board').dataset.fen);
async function noOverflow(page, where) {
  const o = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  assert(o.sw <= o.cw + 1, `horizontal overflow on ${where}: ${o.sw} > ${o.cw}`);
}
function loadCourse(slug) { return JSON.parse(fs.readFileSync(path.join(ROOT, `train/courses/${slug}.json`), 'utf8')); }
function leafPaths(nodes, p = []) { const out = []; for (const n of nodes) { const q = [...p, n]; if (!n.children.length) out.push(q); else out.push(...leafPaths(n.children, q)); } return out; }
let tables = null;
function tbTables() {
  if (tables) return tables;
  tables = {};
  for (const t of ['q', 'r', 'p']) { const raw = zlib.gunzipSync(fs.readFileSync(path.join(ROOT, `train/tb/${t}.bin.gz`))); tables[t] = { w: raw.subarray(0, tb.SIZE), b: raw.subarray(tb.SIZE) }; }
  return tables;
}

/* ================================================================ license delivery */
await test('confirmation page issues an order-linked code for every supported parameter', async () => {
  for (const key of ['session_id', 'order_id', 'order', 'transaction_id', 'txn_id', 'token']) {
    const { ctx, page } = await newPage();
    await page.goto(`${BASE}/thank-you/checkmate-patterns/?${key}=ORD-${key}`);
    const code = (await page.locator('[data-code]').textContent()).trim();
    assert(code === await generate('checkmate-patterns', `ORD-${key}`), `${key}: code should come from the order reference`);
    assert(await page.locator('text=Order reference').count() === 1, 'order reference shown');
    await ctx.close();
  }
});

await test('the same order always produces the same code, even in a fresh browser', async () => {
  const codes = [];
  for (let i = 0; i < 2; i++) {
    const { ctx, page } = await newPage();
    await page.goto(`${BASE}/thank-you/tactics-fundamentals/?session_id=cs_live_SAME`);
    codes.push((await page.locator('[data-code]').textContent()).trim());
    await ctx.close();
  }
  assert(codes[0] === codes[1], `codes differ: ${codes}`);
});

await test('without an order reference the code is random but stable on reload', async () => {
  const { ctx, page } = await newPage();
  await page.goto(`${BASE}/thank-you/tactics-fundamentals/`);
  const a = (await page.locator('[data-code]').textContent()).trim();
  await page.reload();
  const b = (await page.locator('[data-code]').textContent()).trim();
  assert(a === b, 'reload keeps the issued code');
  assert(await page.locator('text=Order reference').count() === 0, 'no order reference line');
  const other = await newPage();
  await other.page.goto(`${BASE}/thank-you/tactics-fundamentals/`);
  const c = (await other.page.locator('[data-code]').textContent()).trim();
  assert(c !== a && validate(c).ok, 'a different browser gets a different random code');
  await ctx.close(); await other.ctx.close();
});

await test('confirmation page states completion, activates the license and starts the first lesson', async () => {
  const { ctx, page } = await newPage();
  await page.goto(`${BASE}/thank-you/endgame-essentials/?order_id=E-100`);
  await page.locator('h1', { hasText: 'Your order is complete and your course is delivered.' }).waitFor();
  for (const t of ['Product', 'Endgame Essentials', 'Date and time', 'Order reference', 'E-100']) assert(await page.locator(`text=${t}`).count() > 0, `shows ${t}`);
  const lic = await page.evaluate(() => JSON.parse(localStorage.getItem('fiancho-chess.v1')).licenses);
  assert(Object.values(lic).some((l) => l.product === 'endgame-essentials'), 'license activated in this browser');
  assert(await page.locator('meta[name="robots"][content*="noindex"]').count() === 1, 'noindex');
  await page.evaluate(() => { window.__printed = false; window.print = () => { window.__printed = true; }; });
  await page.locator('[data-act="print"]').click();
  assert(await page.evaluate(() => window.__printed), 'print button prints');
  await page.locator('a', { hasText: 'Start training' }).click();
  await page.waitForURL(/#\/c\/endgame-essentials\/s\/principles$/);
  await page.locator('.tr-lesson__title', { hasText: 'Endgame principles' }).waitFor();
  assert(!page.errors.length, page.errors.join('; '));
  await ctx.close();
});

await test('Save confirmation downloads a PDF with the order details', async () => {
  const { ctx, page } = await newPage();
  await page.goto(`${BASE}/thank-you/complete-training-library/?txn_id=T-77`);
  const code = (await page.locator('[data-code]').textContent()).trim();
  const [dl] = await Promise.all([page.waitForEvent('download'), page.locator('[data-act="pdf"]').click()]);
  const file = path.join(tmp, 'confirm.pdf');
  await dl.saveAs(file);
  const text = fs.readFileSync(file).toString('latin1');
  assert(text.startsWith('%PDF-1.4') && text.includes(code) && text.includes('Complete Training Library') && text.includes('T-77'), 'PDF contents');
  for (const u of ['terms.html', 'refund-policy.html', 'delivery-policy.html']) assert(text.includes(`${BASE}/${u}`), `PDF links ${u}`);
  assert(dl.suggestedFilename() === 'fiancho-chess-confirmation-complete-training-library.pdf', 'file name');
  await ctx.close();
});

await test('activation on a product page flips to the Owned state', async () => {
  const { ctx, page } = await newPage({ state: ownedState([], {}) });
  await page.goto(`${BASE}/endgame-essentials.html`);
  const input = page.locator('#own-code');
  await input.fill('FIAN-EE-2222-2222-2222');
  await page.locator('.own-panel button[type="submit"]').click();
  assert((await page.locator('#own-msg').textContent()).includes('doesn’t check out'), 'checksum error shown');
  await input.fill(await generate('checkmate-patterns', 'P1'));
  await page.locator('.own-panel button[type="submit"]').click();
  assert((await page.locator('#own-msg').textContent()).includes('Checkmate Patterns'), 'other-product message');
  assert(!(await page.locator('.flip').getAttribute('class')).includes('is-flipped'), 'not owned yet');
  await input.fill((await generate('endgame-essentials', 'P2')).toLowerCase().replace(/-/g, ' '));
  await page.locator('.own-panel button[type="submit"]').click();
  await page.waitForSelector('.flip.is-flipped');
  assert(await page.locator('[data-owned] a[href="/train/#/c/endgame-essentials/start"]').count() === 1, 'Start training link');
  await page.reload();
  await page.waitForSelector('.flip.is-flipped');
  assert(!page.errors.length, page.errors.join('; '));
  await ctx.close();
});

await test('activation in the Training Room unlocks the course there', async () => {
  const { ctx, page } = await newPage({ state: ownedState([], {}) });
  await page.goto(`${BASE}/train/`);
  await page.locator('h1', { hasText: 'Activate your license' }).waitFor();
  await page.locator('#room-activate').fill(await generate('positional-play-strategy', 'R1'));
  await page.locator('[data-activate] button[type="submit"]').click();
  await page.locator('h1', { hasText: 'Your courses' }).waitFor();
  assert(await page.locator('.tr-shelf:not(.tr-shelf--other) .tr-card').count() === 1, 'one owned course');
  assert(await page.locator('.tr-shelf:not(.tr-shelf--other) .tr-card h3', { hasText: 'Positional Play & Strategy' }).count() === 1, 'the activated course');
  await ctx.close();
});

await test('a Library license unlocks all seven courses everywhere', async () => {
  const { ctx, page } = await newPage({ state: ownedState([], {}) });
  await page.goto(`${BASE}/train/`);
  await page.locator('#room-activate').fill(await generate('complete-training-library', 'LIB-9'));
  await page.locator('[data-activate] button[type="submit"]').click();
  await page.waitForFunction(() => document.querySelectorAll('.tr-shelf:not(.tr-shelf--other) .tr-card').length === 7);
  for (const slug of [...COURSES, 'complete-training-library']) {
    await page.goto(`${BASE}/${slug}.html`);
    await page.waitForSelector('.flip.is-flipped');
  }
  await ctx.close();
});

/* ================================================================ trainer behaviour */
await test('wrong moves are marked and taken back; correct moves are accepted, including by keyboard', async () => {
  const course = loadCourse('tactics-fundamentals');
  const sec = course.sections.find((s) => s.id === 'forks');
  const idx = sec.items.findIndex((i) => i.type === 'puzzle');
  const item = sec.items[idx];
  const { ctx, page } = await newPage({ state: ownedState([await generate('tactics-fundamentals', 'K1')]) });
  await page.goto(`${BASE}/train/#/c/tactics-fundamentals/s/forks/${idx + 1}`);
  await waitInteractive(page);
  const g = new Chess(item.fen);
  const ok = new Set([item.solution[0], ...((item.accepted && item.accepted[0]) || [])]);
  const wrong = g.moves({ verbose: true }).find((m) => !ok.has(m.lan));
  await playMove(page, wrong.lan);
  await page.waitForSelector('.fc-icon--bad');
  assert((await page.locator('.tr-feedback').textContent()).includes('isn’t the best move'), 'wrong-move message');
  await page.waitForTimeout(1300);
  assert(await boardFen(page) === item.fen, 'wrong move taken back');
  // Keyboard: focus the board, walk the cursor from e2 to the squares, press Enter.
  await page.locator('.fc-board').focus();
  const move = async (from, to) => {
    let cur = await page.locator('.fc-board').getAttribute('data-cursor');
    const walk = async (target) => {
      const sign = (await page.locator('.fc-board').getAttribute('data-orientation')) === 'w' ? 1 : -1;
      const df = (target.charCodeAt(0) - cur.charCodeAt(0)) * sign, dr = (Number(target[1]) - Number(cur[1])) * sign;
      for (let i = 0; i < Math.abs(df); i++) await page.keyboard.press(df > 0 ? 'ArrowRight' : 'ArrowLeft');
      for (let i = 0; i < Math.abs(dr); i++) await page.keyboard.press(dr > 0 ? 'ArrowUp' : 'ArrowDown');
      cur = target;
      await page.keyboard.press('Enter');
    };
    await walk(from); await walk(to);
  };
  await move(item.solution[0].slice(0, 2), item.solution[0].slice(2, 4));
  await page.waitForSelector('.fc-icon--good');
  for (let p = 2; p < item.solution.length; p += 2) await playMove(page, item.solution[p]);
  await page.locator('.tr-result--good').waitFor();
  assert(!page.errors.length, page.errors.join('; '));
  await ctx.close();
});

await test('an equally good alternative is accepted, not marked wrong', async () => {
  let found = null;
  for (const slug of COURSES) {
    const course = loadCourse(slug);
    for (const sec of course.sections) sec.items.forEach((it, i) => {
      if (found || it.type !== 'puzzle' || !it.accepted) return;
      const ply = Object.keys(it.accepted).map(Number).find((k) => it.accepted[k].length);
      if (ply !== undefined) found = { slug, sec: sec.id, idx: i + 1, ply, item: it, alt: it.accepted[ply][0] };
    });
  }
  const { ctx, page } = await newPage({ state: ownedState([await generate('complete-training-library', 'ALT')]) });
  if (!found) {
    // Test fixture: serve an engine-verified position that has an alternative answer as a training position.
    const verified = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/courses/data/verified.json'), 'utf8'));
    let src = null, slot = null;
    for (const [s, list] of Object.entries(verified)) for (const p of list) if (!src && Object.values(p.accepted || {}).some((a) => a.length)) { src = p; slot = s; }
    assert(src, 'at least one verified position has an alternative answer');
    const slug = slot.startsWith('cm-') ? 'checkmate-patterns' : slot.startsWith('tf-') ? 'tactics-fundamentals' : 'calculation-visualization';
    const g = new Chess(src.fen);
    const sans = src.solution.map((u) => g.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] }).san);
    const fixture = { type: 'puzzle', id: 'fixture-alt', fen: src.fen, orientation: src.fen.split(' ')[1], prompt: 'Fixture.', solution: src.solution, sans, accepted: src.accepted, notes: sans.map(() => ''), summary: '' };
    await ctx.route(`**/train/courses/${slug}.json`, async (route) => { const res = await route.fetch(); const c = await res.json(); c.sections[0].items.push(fixture); route.fulfill({ response: res, body: JSON.stringify(c) }); });
    const ply = Object.keys(src.accepted).map(Number).find((k) => src.accepted[k].length);
    const course = loadCourse(slug);
    found = { slug, sec: course.sections[0].id, idx: course.sections[0].items.length + 1, ply, item: fixture, alt: src.accepted[ply][0] };
  }
  await page.goto(`${BASE}/train/#/c/${found.slug}/s/${found.sec}/${found.idx}`);
  for (let p = 0; p < found.ply; p += 2) { await playMove(page, found.item.solution[p]); await page.waitForTimeout(700); }
  await playMove(page, found.alt);
  await page.locator('text=That works too.').waitFor();
  await ctx.close();
});

await test('hints, reveal and the review queue', async () => {
  const course = loadCourse('checkmate-patterns');
  const sec = course.sections.find((s) => s.id === 'backrank');
  const idx = sec.items.findIndex((i) => i.type === 'puzzle');
  const { ctx, page } = await newPage({ state: ownedState([await generate('checkmate-patterns', 'H1')]) });
  await page.goto(`${BASE}/train/#/c/checkmate-patterns/s/backrank/${idx + 1}`);
  await waitInteractive(page);
  await page.locator('[data-act="hint"]').click();
  assert((await page.locator('.tr-feedback').textContent()).startsWith('Hint:'), 'hint text');
  assert(await page.locator('.fc-hint').count() >= 1, 'hint highlight');
  await page.locator('[data-act="reveal"]').click();
  await page.locator('text=Here is the solution.').waitFor({ timeout: 15000 });
  await page.goto(`${BASE}/train/#/c/checkmate-patterns`);
  await page.locator('text=Review queue (1)').waitFor();
  await page.goto(`${BASE}/train/#/c/checkmate-patterns/review`);
  await waitInteractive(page);
  assert(await page.locator('.tr-prompt').count() === 1, 'review shows the missed position');
  await ctx.close();
});

await test('Export PGN downloads a valid PGN file', async () => {
  const { ctx, page } = await newPage({ state: ownedState([await generate('opening-repertoire-white', 'PGN')]) });
  await page.goto(`${BASE}/train/#/c/opening-repertoire-white`);
  const [dl] = await Promise.all([page.waitForEvent('download'), page.locator('[data-act="pgn"]').click()]);
  const file = path.join(tmp, 'x.pgn');
  await dl.saveAs(file);
  const games = fs.readFileSync(file, 'utf8').trim().split(/\n\n(?=\[Event )/);
  assert(games.length > 0, 'games exported');
  for (const g of games) new Chess().loadPgn(g);
  await ctx.close();
});

await test('backup export and import through the Training Room', async () => {
  const code = await generate('calculation-visualization', 'BK');
  const { ctx, page } = await newPage({ state: ownedState([code]) });
  await page.goto(`${BASE}/train/`);
  const [dl] = await Promise.all([page.waitForEvent('download'), page.locator('.tr-tool [data-act="export"]').click()]);
  const file = path.join(tmp, 'backup.json');
  await dl.saveAs(file);
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert(data.format === 'fiancho-chess-backup' && Object.keys(data.licenses).length === 1, 'backup contents');
  await page.evaluate(() => localStorage.setItem('fiancho-chess.v1', JSON.stringify({ version: 1, licenses: {}, progress: {}, settings: { walkthroughDone: true } })));
  await page.reload();
  await page.locator('h1', { hasText: 'Activate your license' }).waitFor();
  await page.locator('input[data-act="import"]').setInputFiles(file);
  await page.locator('text=Backup restored').waitFor();
  await page.locator('.tr-card h3', { hasText: 'Calculation & Visualization Training' }).first().waitFor({ timeout: 5000 });
  await ctx.close();
});

await test('the backup reminder shows when no backup was made in 30 days', async () => {
  const st = ownedState([await generate('tactics-fundamentals', 'OLD')]);
  const old = new Date(Date.now() - 40 * 86400000).toISOString();
  for (const l of Object.values(st.licenses)) l.activatedAt = old;
  st.lastBackupAt = null;
  const { ctx, page } = await newPage({ state: st });
  await page.goto(`${BASE}/train/`);
  await page.locator('.tr-banner', { hasText: 'gentle reminder' }).waitFor();
  await ctx.close();
});

await test('first-run walkthrough is shown once and can be skipped; larger interface setting works', async () => {
  const st = ownedState([await generate('tactics-fundamentals', 'W')]);
  st.settings = {};
  const { ctx, page } = await newPage({ state: st });
  await page.goto(`${BASE}/train/`);
  await page.locator('.tr-walk [role="dialog"]').waitFor();
  await page.keyboard.press('Escape');
  assert(await page.locator('.tr-walk').count() === 0, 'walkthrough closed');
  await page.reload();
  await page.waitForTimeout(500);
  assert(await page.locator('.tr-walk').count() === 0, 'walkthrough not shown again');
  await page.locator('[data-act="large"]').check();
  assert(await page.evaluate(() => document.documentElement.classList.contains('ui-large')), 'larger interface');
  await page.reload();
  assert(await page.evaluate(() => document.documentElement.classList.contains('ui-large')), 'setting persists');
  await ctx.close();
});

await test('Report a problem opens an email with the course and position filled in', async () => {
  const { ctx, page } = await newPage({ state: ownedState([await generate('tactics-fundamentals', 'REP')]) });
  await page.goto(`${BASE}/train/#/c/tactics-fundamentals/s/pins/2`);
  const href = await page.locator('.tr-report').getAttribute('href');
  assert(href.startsWith('mailto:fianchomail@fianchochess.space?subject=') && decodeURIComponent(href).includes('Tactics Fundamentals') && decodeURIComponent(href).includes('Position: '), href);
  await ctx.close();
});

await test('terms checkbox gates buy buttons, which only appear with a checkout link', async () => {
  const { ctx, page } = await newPage();
  await page.goto(`${BASE}/tactics-fundamentals.html`);
  assert(await page.locator('.consent, [data-buy-for] a').count() === 0, 'no checkbox or button without a checkout link');
  // Test-only: serve a products.js with a checkout link to exercise the gate.
  await ctx.route('**/js/products.js', async (route) => { const res = await route.fetch(); route.fulfill({ response: res, body: (await res.text()).replace('checkoutUrl: ""', 'checkoutUrl: "https://checkout.invalid/test"') }); });
  await page.reload();
  const btn = page.locator('.buy-box__action a.btn');
  assert(await btn.getAttribute('aria-disabled') === 'true' && await btn.getAttribute('href') === null, 'disabled until agreed');
  await page.getByLabel('I agree to the Terms of Service and Refund Policy').check();
  assert(await btn.getAttribute('href') === 'https://checkout.invalid/test', 'enabled after agreeing');
  await ctx.close();
});

await test('works offline once loaded, and the service worker caches the courses', async () => {
  const { ctx, page } = await newPage({ sw: true, state: ownedState([await generate('complete-training-library', 'OFF')]) });
  await page.goto(`${BASE}/train/`);
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.waitForFunction(async () => (await caches.keys()).some((k) => k.startsWith('fiancho-') && k !== 'fiancho-runtime'), null, { timeout: 20000 });
  await page.waitForFunction(async () => { const k = (await caches.keys()).find((x) => x.startsWith('fiancho-') && x !== 'fiancho-runtime'); const c = await caches.open(k); return !!(await c.match('/train/courses/endgame-essentials.json')); }, null, { timeout: 20000 });
  await page.reload(); // let the service worker take control of the page
  await ctx.setOffline(true);
  await page.reload();
  await page.locator('h1', { hasText: 'Your courses' }).waitFor();
  await page.goto(`${BASE}/train/#/c/endgame-essentials/s/convert/1`);
  await waitInteractive(page);
  await page.goto(`${BASE}/train/#/c/opening-repertoire-black/s/vs-e4/1`);
  await page.locator('.tr-branches button').first().waitFor();
  await ctx.setOffline(false);
  await ctx.close();
});

/* ================================================================ every course, end to end */
async function walkCourse(slug, mobile) {
  const course = loadCourse(slug);
  const { ctx, page } = await newPage({ mobile, state: ownedState([await generate('complete-training-library', `WALK-${mobile}`)]) });
  let steps = 0;
  for (const sec of course.sections) {
    const list = [{ kind: 'lesson' }];
    for (const it of sec.items) {
      if (it.type === 'drill') {
        const exp = course.sections.flatMap((s) => s.items).find((x) => x.id === it.explorer);
        for (const line of leafPaths(exp.tree)) list.push({ kind: 'item', item: { ...it, line } });
      } else list.push({ kind: 'item', item: it });
    }
    for (let i = 0; i < list.length; i++) {
      const step = list[i];
      const where = `${slug}/${sec.id}/${i}${mobile ? ' (mobile)' : ''}`;
      await page.goto(`${BASE}/train/#/c/${slug}/s/${sec.id}/${i}`);
      if (step.kind === 'lesson') { await page.locator('.tr-lesson__title', { hasText: sec.title }).waitFor(); await noOverflow(page, where); steps++; continue; }
      const it = step.item;
      if (it.type === 'example') {
        await page.locator('[data-step="last"]').click();
        await page.locator('.tr-note strong', { hasText: it.moves[it.moves.length - 1].san }).waitFor();
        assert(await boardFen(page) !== it.fen || it.moves.length === 0, `${where}: example board moved`);
      } else if (it.type === 'puzzle') {
        for (let p = 0; p < it.solution.length; p += 2) await playMove(page, it.solution[p], mobile);
        await page.locator('.tr-result--good', { hasText: 'Solved.' }).waitFor({ timeout: 15000 });
      } else if (it.type === 'visual' || it.type === 'quiz' || (it.type === 'structure' && it.mode === 'choice')) {
        await page.locator(`.tr-choice[data-i="${it.answer}"]`).click();
        await page.locator('.tr-result--good', { hasText: 'Correct.' }).waitFor();
        if (it.type === 'visual') assert(await boardFen(page) === it.finalFen, `${where}: final position revealed`);
      } else if (it.type === 'structure') {
        await tapSquare(page, it.answers[0], mobile);
        await page.locator('.tr-result--good', { hasText: 'Correct.' }).waitFor();
      } else if (it.type === 'practice') {
        const t = tbTables();
        for (let n = 0; n < 60; n++) {
          if (await page.locator('.tr-result--good').count()) break;
          await waitInteractive(page);
          const pos = tb.fromFen(await boardFen(page));
          const moves = tb.scoredMoves(t, pos);
          const pickMove = it.goal === 'win' ? moves.filter((m) => m.value > 0).sort((a, b) => a.value - b.value)[0] : (moves.find((m) => m.value === 0 && m.captured) || moves.find((m) => m.value === 0));
          assert(pickMove, `${where}: no good move found`);
          await playMove(page, pickMove.uci, mobile);
          await page.waitForTimeout(650);
        }
        await page.locator('.tr-result--good').waitFor({ timeout: 10000 });
      } else if (it.type === 'explorer') {
        for (let n = 0; n < 40; n++) {
          if (await page.locator('text=End of this line.').count()) break;
          await page.locator('.tr-branches [data-c="0"]').click();
        }
        await page.locator('text=End of this line.').waitFor();
      } else if (it.type === 'drill') {
        for (const node of it.line) if (node.color === it.side) await playMove(page, node.uci, mobile);
        await page.locator('.tr-result--good', { hasText: 'Line complete, played from memory.' }).waitFor({ timeout: 20000 });
      }
      await noOverflow(page, where);
      steps++;
    }
  }
  assert(!page.errors.length, `${slug}: ${page.errors.join('; ')}`);
  // Everything solved: the course should report full progress.
  await page.goto(`${BASE}/train/#/c/${slug}`);
  const txt = await page.locator('.tr-overview .tr-muted').first().textContent();
  const total = JSON.parse(fs.readFileSync(path.join(ROOT, 'train/courses/index.json'), 'utf8'))[slug].positions;
  assert(txt.startsWith(`${total} of ${total} solved`), `${slug}: progress shows ${txt}`);
  await ctx.close();
  return steps;
}

for (const mobile of [false, true]) {
  for (const slug of COURSES) {
    await test(`walkthrough ${mobile ? 'mobile' : 'desktop'}: ${slug}`, async () => {
      const steps = await walkCourse(slug, mobile);
      console.log(`       ${steps} steps completed`);
    });
  }
}

/* ================================================================ */
await browser.close();
server.close();
fs.rmSync(tmp, { recursive: true, force: true });
const failed = results.filter((r) => !r[0]);
console.log(`\n${results.length - failed.length} passed, ${failed.length} failed`);
process.exit(failed.length ? 1 : 0);
