// Fulfillment evidence kit: regenerates fulfillment-kit/ from the LIVE site.
// Run: npm run kit      (KIT_BASE=https://... to point at another live address)
//
// Captures, for every product: the product page, the confirmation page, the saved confirmation PDF,
// activation on the product page and in the Training Room, the Owned state, and the course in use.
// Records one video from confirmation page to course in use, then compiles Fulfillment-Overview.pdf.
// Checkout screenshots are included only when every product has a checkoutUrl; test links are never used.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';
import '../../js/products.js';
import { validate } from '../../js/license.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const KIT = path.join(ROOT, 'fulfillment-kit');
const SHOTS = path.join(KIT, 'screenshots');
const BASE = (process.env.KIT_BASE || 'https://fiancho-chess.vercel.app').replace(/\/$/, '');
const products = globalThis.SITE_PRODUCTS;
const SLUGS = Object.keys(products);
const support = /supportEmail:\s*"([^"]*)"/.exec(fs.readFileSync(path.join(ROOT, 'js/site-config.js'), 'utf8'))[1];
const allCheckout = SLUGS.every((s) => (products[s].checkoutUrl || '').trim());
const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

fs.rmSync(KIT, { recursive: true, force: true });
fs.mkdirSync(SHOTS, { recursive: true });
fs.mkdirSync(path.join(KIT, 'confirmation-pdfs'), { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const ctxOpts = { viewport: { width: 1280, height: 860 }, colorScheme: 'light', reducedMotion: 'reduce', acceptDownloads: true };
const shots = [];
const codes = {};
const errors = [];
const shot = async (page, slug, step, caption, { full = false, el = null } = {}) => {
  const file = `${String(shots.length + 1).padStart(3, '0')}-${slug}-${step}.png`;
  if (el) await page.locator(el).screenshot({ path: path.join(SHOTS, file) });
  else await page.screenshot({ path: path.join(SHOTS, file), fullPage: full });
  shots.push({ file, slug, step, caption });
};
async function freshPage(extra = {}) {
  const ctx = await browser.newContext({ ...ctxOpts, ...extra });
  await ctx.addInitScript(() => { try { const s = JSON.parse(localStorage.getItem('fiancho-chess.v1') || 'null'); if (!s) localStorage.setItem('fiancho-chess.v1', JSON.stringify({ version: 1, licenses: {}, progress: {}, settings: { walkthroughDone: true }, lastBackupAt: null })); } catch (e) { /* ignore */ } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`${page.url()}: ${e.message}`));
  return { ctx, page };
}
const settle = async (page) => { await page.evaluate(() => document.querySelectorAll('.reveal').forEach((e) => e.classList.add('is-visible'))); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(600); };
async function squarePoint(page, sq) {
  return page.evaluate((sq) => {
    const wrap = document.querySelector('.fc-board'); const r = wrap.querySelector('svg').getBoundingClientRect();
    const o = wrap.dataset.orientation, f = 'abcdefgh'.indexOf(sq[0]), rk = Number(sq[1]);
    const x = o === 'w' ? f : 7 - f, y = o === 'w' ? 8 - rk : rk - 1;
    return { x: r.left + ((x + 0.5) * r.width) / 8, y: r.top + ((y + 0.5) * r.height) / 8 };
  }, sq);
}
async function play(page, uci) {
  await page.waitForSelector('.fc-board.is-interactive');
  for (const sq of [uci.slice(0, 2), uci.slice(2, 4)]) { const p = await squarePoint(page, sq); await page.mouse.click(p.x, p.y); await page.waitForTimeout(80); }
}
function course(slug) { return JSON.parse(fs.readFileSync(path.join(ROOT, `train/courses/${slug}.json`), 'utf8')); }

// "Course in use" for each product: open real content and make a move or step through it.
async function courseInUse(page, slug) {
  if (slug === 'complete-training-library') {
    await page.goto(`${BASE}/train/`); await settle(page);
    return 'The Training Room with all seven courses unlocked by the Library license.';
  }
  const c = course(slug);
  for (const sec of c.sections) {
    const idx = sec.items.findIndex((i) => i.type === 'puzzle');
    if (idx >= 0) {
      await page.goto(`${BASE}/train/#/c/${slug}/s/${sec.id}/${idx + 1}`); await settle(page);
      await play(page, sec.items[idx].solution[0]); await page.waitForTimeout(500);
      return `${products[slug].name}: a training position after the learner plays the correct first move on the board.`;
    }
  }
  const exp = c.sections.find((s) => s.items.some((i) => i.type === 'explorer'));
  if (exp) {
    await page.goto(`${BASE}/train/#/c/${slug}/s/${exp.id}/1`); await settle(page);
    for (let k = 0; k < 6; k++) { const b = page.locator('.tr-branches [data-c="0"]'); if (await b.count()) await b.click(); }
    return `${products[slug].name}: the line explorer, with a note on the plan behind the current move.`;
  }
  const pr = c.sections.find((s) => s.items.some((i) => i.type === 'practice'));
  if (pr) {
    const idx = pr.items.findIndex((i) => i.type === 'practice');
    await page.goto(`${BASE}/train/#/c/${slug}/s/${pr.id}/${idx + 1}`); await settle(page);
    return `${products[slug].name}: an endgame practice position played against exact replies.`;
  }
  const st = c.sections.find((s) => s.items.some((i) => i.type === 'structure'));
  await page.goto(`${BASE}/train/#/c/${slug}/s/${st.id}/1`); await settle(page);
  return `${products[slug].name}: a structure exercise on the board.`;
}

/* ---------------- per-product delivery walk-through ---------------- */
for (const slug of SLUGS) {
  const p = products[slug];
  // 1. Product page
  let { ctx, page } = await freshPage();
  await page.goto(`${BASE}/${slug}.html`); await settle(page);
  await shot(page, slug, 'product-page', `${p.name} product page: price ($${p.price} USD), level, contents, previews, the access and refund line beside the price, and links to the Delivery and Refund policies.`, { full: true });
  if (allCheckout) {
    await shot(page, slug, 'checkout-box-before', `${p.name}: the buy box before agreeing. The buy button stays disabled until the terms checkbox is ticked.`, { el: '.buy-box' });
    await page.getByLabel('I agree to the Terms of Service and Refund Policy').check();
    await shot(page, slug, 'checkout-box-after', `${p.name}: after ticking the box, the buy button links to the payment provider’s checkout.`, { el: '.buy-box' });
  }
  // 2. Confirmation page, 3. saved PDF, 4. Start training, 5. course in use
  await page.goto(`${BASE}${p.confirmationPath}`); await page.locator('[data-code]').waitFor(); await settle(page);
  const code = (await page.locator('[data-code]').textContent()).trim();
  if (!validate(code).ok) throw new Error(`Invalid code from ${slug} confirmation page`);
  codes[slug] = code;
  await shot(page, slug, 'confirmation-page', `${p.name} order confirmation page: states the order is complete and the product delivered, shows the product, date and time and the license code with a copy button, and activates the license in that browser.`, { full: true });
  const [dl] = await Promise.all([page.waitForEvent('download'), page.locator('[data-act="pdf"]').click()]);
  const pdfPath = path.join(KIT, 'confirmation-pdfs', `${slug}-confirmation.pdf`);
  await dl.saveAs(pdfPath);
  const pdfPage = await ctx.newPage();
  await pdfPage.setContent(`<html><body style="margin:0;background:#e9e6df"><canvas id="c" style="display:block;margin:24px auto;box-shadow:0 2px 12px rgba(0,0,0,.25)"></canvas><script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script><script>
    pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const data=Uint8Array.from(atob('${fs.readFileSync(pdfPath).toString('base64')}'),c=>c.charCodeAt(0));
    pdfjsLib.getDocument({data}).promise.then(d=>d.getPage(1)).then(pg=>{const v=pg.getViewport({scale:1.4});const c=document.getElementById('c');c.width=v.width;c.height=v.height;return pg.render({canvasContext:c.getContext('2d'),viewport:v}).promise}).then(()=>document.body.dataset.done='1');
  </script></body></html>`);
  await pdfPage.waitForSelector('body[data-done="1"]', { timeout: 30000 });
  await pdfPage.setViewportSize({ width: 960, height: 1160 });
  await shot(pdfPage, slug, 'confirmation-pdf', `${p.name}: the saved confirmation PDF (Save confirmation button), with the order details and links to the Terms of Service, Refund Policy and Delivery Policy.`, { el: '#c' });
  await pdfPage.close();
  await page.locator('a', { hasText: 'Start training' }).click();
  await page.waitForURL(/#\/c\//); await settle(page);
  await shot(page, slug, 'start-training', `${p.name}: Start training opens the first lesson${p.includes ? ' of the first course' : ''} directly.`);
  const inUse = await courseInUse(page, slug);
  await shot(page, slug, 'course-in-use', inUse);
  await ctx.close();

  // 6. Activation on the product page and the Owned state (a different, fresh browser)
  ({ ctx, page } = await freshPage());
  await page.goto(`${BASE}/${slug}.html`); await settle(page);
  await page.locator('#own-code').fill(code);
  await page.locator('#own-code').scrollIntoViewIfNeeded();
  await shot(page, slug, 'activate-product-page', `${p.name}: on another device, the license code is entered in the “Already own this course?” panel under the price.`);
  await page.locator('.own-panel button[type="submit"]').click();
  await page.waitForSelector('.flip.is-flipped'); await page.waitForTimeout(900);
  await page.locator('.flip').scrollIntoViewIfNeeded();
  await shot(page, slug, 'owned-state', `${p.name}: after activation the price area flips to the Owned state, with Start training, progress and the license details.`);
  await ctx.close();

  // 7. Activation in the Training Room (another fresh browser)
  ({ ctx, page } = await freshPage());
  await page.goto(`${BASE}/train/`); await settle(page);
  await page.locator('#room-activate').fill(code);
  await shot(page, slug, 'activate-training-room', `${p.name}: in the Training Room, a browser with no license shows a single field for the license code.`);
  await page.locator('[data-activate] button[type="submit"]').click();
  await page.locator('h1', { hasText: 'Your courses' }).waitFor(); await settle(page);
  await shot(page, slug, 'training-room-unlocked', `${p.name}: after activation the Training Room shows ${p.includes ? 'all seven courses' : 'the course'} with progress, and every other course with a link to its product page.`);
  await ctx.close();
  console.log('captured', slug);
}

/* ---------------- one screen recording: confirmation page to course in use ---------------- */
{
  const { ctx, page } = await freshPage({ recordVideo: { dir: KIT, size: { width: 1280, height: 860 } }, reducedMotion: 'no-preference' });
  const slug = 'tactics-fundamentals';
  await page.goto(`${BASE}${products[slug].confirmationPath}`); await page.locator('[data-code]').waitFor();
  await page.waitForTimeout(3500);
  await page.locator('a', { hasText: 'Start training' }).click();
  await page.waitForURL(/#\/c\//); await page.waitForTimeout(3000);
  await page.locator('a.btn', { hasText: 'Start' }).first().click(); await page.waitForTimeout(2500);
  for (let k = 0; k < 3; k++) { await page.locator('[data-step="next"]').click(); await page.waitForTimeout(1300); }
  const c = course(slug); const sec = c.sections.find((s) => s.id === 'forks'); const idx = sec.items.findIndex((i) => i.type === 'puzzle');
  await page.goto(`${BASE}/train/#/c/${slug}/s/forks/${idx + 1}`); await page.waitForTimeout(1500);
  for (let k = 0; k < sec.items[idx].solution.length; k += 2) { await play(page, sec.items[idx].solution[k]); await page.waitForTimeout(1600); }
  await page.locator('.tr-result--good').waitFor(); await page.waitForTimeout(3500);
  const video = page.video(); await ctx.close();
  fs.renameSync(await video.path(), path.join(KIT, 'delivery-flow-recording.webm'));
}
await browser.close();
if (errors.length) throw new Error(`Page errors during capture:\n${errors.join('\n')}`);

/* ---------------- texts ---------------- */
const productLines = SLUGS.map((s) => `- ${products[s].name}: $${products[s].price} USD (${products[s].level})${products[s].includes ? ', unlocks all seven courses with one license' : ''}`).join('\n');
const summary = `FIANCHO CHESS: BUSINESS AND FULFILLMENT SUMMARY
Website: ${BASE}

WHAT WE SELL
Fiancho Chess sells interactive chess training programs that run in a web browser and are unlocked with a license code. There are seven courses (tactics, checkmate patterns, an opening repertoire for Black, an opening repertoire for White, endgames, positional play, and calculation and visualization) and a Complete Training Library that unlocks all seven with one license. The courses are self-study training: lessons and positions the customer plays on the board. There is no video, live instruction or coaching.
${productLines}

HOW AND WHEN PRODUCTS ARE DELIVERED
Delivery is digital and immediate. On the product page the customer agrees to the Terms of Service and Refund Policy, then pays on our third-party payment provider's checkout page. After payment the customer is returned to the product's order confirmation page, which states that the order is complete, issues the customer's license code, activates it in that browser at once, and offers Start training, which opens the course. The confirmation can be saved as a PDF or printed. To use the course on another device, the customer enters the same license code in the Training Room (${BASE}/train/) or on the product page there. No account is needed. Corrections to a course are applied automatically.

NO PHYSICAL SHIPMENT
All products are digital. Nothing is shipped.

REFUND POLICY
Full refund on any purchase if requested within 14 days, no reason required. Customers request a refund through the Contact page with their order number. Refunds go back to the original payment method within 5 business days of the request; the payment provider's processing time may add a few days. The license ends when a purchase is refunded.

CUSTOMER SUPPORT
Customers contact us by email at ${support}, or through the Contact page (${BASE}/contact.html). We reply within two business days. Lost license codes are replaced on request with the order number.

POLICIES
Terms of Service: ${BASE}/terms.html
Refund Policy: ${BASE}/refund-policy.html
Delivery Policy: ${BASE}/delivery-policy.html
Privacy Policy: ${BASE}/privacy.html
Consumer rights: ${BASE}/consumer-rights.html
`;
fs.writeFileSync(path.join(KIT, 'Business-Summary.txt'), summary.replace(/\n/g, '\r\n'));

/* ---------------- overview PDF ---------------- */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// Images are embedded as JPEG data (smaller PDF, and no reliance on long file paths). Full-page shots are
// cropped to the top of the page, as their captions say; the full PNGs stay in screenshots/.
const conv = await chromium.launch({ channel: 'chrome' });
const convPage = await conv.newPage({ viewport: { width: 1280, height: 860 } });
const jpeg = {};
for (const s of shots) {
  const crop = s.step === 'product-page' || s.step === 'confirmation-page';
  await convPage.setContent(`<html><body style="margin:0"><img id="i" style="display:block" src="data:image/png;base64,${fs.readFileSync(path.join(SHOTS, s.file)).toString('base64')}"></body></html>`);
  const box = await convPage.locator('#i').boundingBox();
  await convPage.setViewportSize({ width: Math.ceil(box.width), height: Math.min(Math.ceil(box.height), crop ? 1500 : 4000) });
  const buf = await convPage.screenshot({ type: 'jpeg', quality: 76, clip: { x: 0, y: 0, width: box.width, height: Math.min(box.height, crop ? 1500 : 4000) } });
  jpeg[s.file] = 'data:image/jpeg;base64,' + buf.toString('base64');
}
await conv.close();
const img = (f) => jpeg[f];
const STEP_ORDER = ['product-page', 'checkout-box-before', 'checkout-box-after', 'confirmation-page', 'confirmation-pdf', 'start-training', 'course-in-use', 'activate-product-page', 'owned-state', 'activate-training-room', 'training-room-unlocked'];
const figure = (s, crop) => `<figure><div class="frame"><img src="${img(s.file)}"></div><figcaption>${esc(s.caption)}<span>screenshots/${esc(s.file)}${crop ? ' (top of the page shown; the file is the full page)' : ''}</span></figcaption></figure>`;
const productSections = SLUGS.map((slug) => {
  const list = STEP_ORDER.map((st) => shots.find((s) => s.slug === slug && s.step === st)).filter(Boolean);
  return `<section><h2>${esc(products[slug].name)}</h2><p class="meta">$${products[slug].price} USD · Product page: <a href="${BASE}/${slug}.html">${BASE}/${slug}.html</a> · Confirmation page: <a href="${BASE}${products[slug].confirmationPath}">${BASE}${products[slug].confirmationPath}</a></p>${list.map((s) => figure(s, s.step === 'product-page' || s.step === 'confirmation-page')).join('')}</section>`;
}).join('');
const checkoutText = allCheckout
  ? 'Each product page shows a checkbox reading “I agree to the Terms of Service and Refund Policy” above the buy button. The buy button stays disabled until the box is ticked, then opens the payment provider’s checkout. Screenshots of the buy box before and after ticking the box are included for every product.'
  : 'Checkout takes place on the payment provider’s own pages. On each product page the customer ticks “I agree to the Terms of Service and Refund Policy”, which enables the buy button, and pays on the payment provider’s checkout page. After payment the payment provider returns the customer to the product’s confirmation page listed below. This step is described in writing only.';
const html = `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&family=Inter:wght@400;600;700&display=swap"><style>
  @page { size: Letter; margin: 0.65in 0.7in; }
  body { font: 10.3pt/1.5 Inter, sans-serif; color: #1a231e; margin: 0; }
  h1, h2, h3 { font-family: Fraunces, Georgia, serif; font-weight: 600; }
  h1 { font-size: 26pt; margin: 0 0 4pt; } h2 { font-size: 16pt; border-bottom: 1.5pt solid #b98a2c; padding-bottom: 5pt; margin: 0 0 10pt; } h3 { font-size: 12pt; margin: 14pt 0 5pt; }
  section { break-before: page; } section.first { break-before: auto; }
  .meta { color: #4d5951; font-size: 9pt; } .meta a, a { color: #1d4a36; }
  .summary { white-space: pre-wrap; background: #f7f3e9; border: 1pt solid #ddd3be; border-left: 3pt solid #b98a2c; padding: 11pt 13pt; font-size: 9.4pt; border-radius: 3pt; }
  figure { margin: 10pt 0 16pt; break-inside: avoid; } .frame { border: 1pt solid #ddd3be; border-radius: 3pt; } .frame img { width: 100%; display: block; }
  figcaption { font-size: 8.8pt; color: #4d5951; margin-top: 4pt; } figcaption span { display: block; font-size: 7.6pt; color: #7b847d; }
  table { width: 100%; border-collapse: collapse; font-size: 9.4pt; } th, td { text-align: left; padding: 5pt 6pt; border-bottom: 1pt solid #ddd3be; } th { font-size: 7.8pt; text-transform: uppercase; letter-spacing: .1em; color: #6a4529; }
  code { font: 700 9.6pt Inter, sans-serif; letter-spacing: .04em; white-space: nowrap; } ol li, ul li { margin-bottom: 4pt; }
</style></head><body>
<section class="first">
  <h1>Fiancho Chess</h1><p class="meta">Fulfillment overview · ${esc(BASE)} · Prepared ${esc(today)} from the live website</p>
  <h2>Business and Fulfillment Summary</h2>
  <p>Plain text for payment processor forms. The same text is saved as Business-Summary.txt.</p>
  <div class="summary">${esc(summary)}</div>
</section>
<section>
  <h2>The delivery process, step by step</h2>
  <ol>
    <li><strong>Product page.</strong> The customer chooses a course. The page shows the price in USD, the level, the full contents, previews from the trainer, and the line “Instant access with a license · 14-day refund policy · Applicable taxes are shown at checkout”.</li>
    <li><strong>Agreement and checkout.</strong> ${esc(checkoutText)}</li>
    <li><strong>Confirmation page.</strong> The confirmation page states that the order is complete and the product is delivered, shows the product, date and time, the order reference when the payment provider supplies one, and the license code with a copy button. It activates the license in that browser immediately.</li>
    <li><strong>Saved confirmation.</strong> Save confirmation downloads a PDF with the same details and links to the Terms of Service, Refund Policy and Delivery Policy. A Print button prints the page.</li>
    <li><strong>Start training.</strong> The Start training button opens the first lesson of the course.</li>
    <li><strong>Other devices.</strong> The same license code activates the course on any other device, in the Training Room (${esc(BASE)}/train/) or in the “Already own this course?” panel on the product page, which then flips to the Owned state.</li>
  </ol>
  <p>There is no physical shipment. Delivery is immediate and needs no manual processing. Licenses and progress are stored in the customer’s browser; the Training Room offers backup export and import.</p>
  <p>The following pages show every step for every product, captured from the live website on ${esc(today)}. A screen recording of the flow from confirmation page to course in use is saved as delivery-flow-recording.webm.</p>
</section>
${productSections}
<section>
  <h2>Replacement licenses</h2>
  <ul>
    <li>If the course is still unlocked in the customer’s browser, the license code is shown on the course’s product page (Owned state) and in any backup file the customer exported.</li>
    <li>Otherwise the customer contacts us at ${esc(support)} or through the Contact page (${esc(BASE)}/contact.html) with the order number and the email address used at checkout, and we send a replacement license code.</li>
    <li>We reply within two business days.</li>
  </ul>
  <h2 style="margin-top:22pt">Refunds</h2>
  <ul>
    <li>Full refund on any purchase if requested within 14 days, no reason required, whether or not the course has been used.</li>
    <li>Requested through the Contact page with the order number.</li>
    <li>Refunded to the original payment method within 5 business days of the request; the payment provider’s processing time may add a few days.</li>
    <li>The license ends when a purchase is refunded. Full policy: <a href="${BASE}/refund-policy.html">${BASE}/refund-policy.html</a></li>
  </ul>
</section>
<section>
  <h2>Reviewer access</h2>
  <p>Each code below is a working license code issued on the live confirmation page while this overview was prepared. To review a product, open its product page or the Training Room (${esc(BASE)}/train/), enter the code, and choose Start training. The Complete Training Library code unlocks all seven courses.</p>
  <table><tr><th>Product</th><th>License code</th><th>Product page</th></tr>
  ${SLUGS.map((s) => `<tr><td>${esc(products[s].name)}</td><td><code>${esc(codes[s])}</code></td><td><a href="${BASE}/${s}.html">${BASE}/${s}.html</a></td></tr>`).join('')}
  </table>
  <h3>Policies</h3>
  <p><a href="${BASE}/terms.html">Terms of Service</a> · <a href="${BASE}/refund-policy.html">Refund Policy</a> · <a href="${BASE}/delivery-policy.html">Delivery Policy</a> · <a href="${BASE}/privacy.html">Privacy Policy</a> · <a href="${BASE}/consumer-rights.html">Consumer rights</a> · <a href="${BASE}/faq.html">FAQ</a></p>
</section>
</body></html>`;
const htmlPath = path.join(KIT, '_overview.html');
fs.writeFileSync(htmlPath, html);
const b2 = await chromium.launch({ channel: 'chrome' });
const pg = await b2.newPage();
await pg.goto(pathToFileURL(htmlPath).href, { waitUntil: 'networkidle' });
await pg.evaluate(() => document.fonts.ready);
await pg.pdf({ path: path.join(KIT, 'Fulfillment-Overview.pdf'), format: 'Letter', printBackground: true, margin: { top: '0.65in', bottom: '0.65in', left: '0.7in', right: '0.7in' } });
await b2.close();
fs.unlinkSync(htmlPath);
fs.writeFileSync(path.join(KIT, 'reviewer-license-codes.txt'), SLUGS.map((s) => `${products[s].name}: ${codes[s]}`).join('\r\n') + '\r\n');

/* ---------------- verify every claim that can be checked automatically ---------------- */
const urls = [...new Set((summary + html).match(/https:\/\/[^\s"<)]+/g).filter((u) => u.startsWith(BASE)).map((u) => u.replace(/[.,]$/, '')))];
const bad = [];
for (const u of urls) { const r = await fetch(u); if (!r.ok) bad.push(`${r.status} ${u}`); }
const cfg = await (await fetch(`${BASE}/js/site-config.js`)).text();
if (!cfg.includes(support)) bad.push('support email on the live site differs from the kit');
const host = (await fetch(`${BASE}/`)).headers.get('server') || '';
if (!/vercel/i.test(host)) bad.push(`hosting header is "${host}", expected Vercel`);
const livePrices = await (await fetch(`${BASE}/js/products.js`)).text();
for (const s of SLUGS) if (!new RegExp(`"${s}"[\\s\\S]*?price: ${products[s].price},`).test(livePrices)) bad.push(`price for ${s} differs on the live site`);
if (bad.length) throw new Error(`Kit check failed:\n${bad.join('\n')}`);
console.log(`kit written: ${shots.length} screenshots, ${urls.length} live URLs checked, checkout screenshots: ${allCheckout ? 'included' : 'not included (checkout links not set)'}`);
