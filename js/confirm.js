/*
  Fiancho Chess — order confirmation page.
  Issues the license code (from the payment provider's order reference when the URL carries one, so the
  same order always gets the same code), activates it in this browser, and offers copy, PDF and print.
*/
import { generate, orderRefFrom } from './license.js';
import * as store from './store.js';
import { buildPdf, confirmationBlocks } from './pdf.js';

const products = globalThis.SITE_PRODUCTS || {};
const config = globalThis.SITE_CONFIG || {};
const slug = document.body.dataset.product;
const product = products[slug];
const root = document.querySelector('[data-confirm]');
const ISSUED_KEY = 'fiancho-chess.issued';
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function issuedMap() {
  try { return JSON.parse(localStorage.getItem(ISSUED_KEY) || '{}'); } catch { return {}; }
}
function saveIssued(map) {
  try { localStorage.setItem(ISSUED_KEY, JSON.stringify(map)); } catch { /* storage unavailable */ }
}

async function issue() {
  const ref = orderRefFrom(location.search);
  const map = issuedMap();
  const key = ref ? `${slug}|${ref.value}` : `${slug}|no-reference`;
  if (map[key]) return { ...map[key], ref };
  const code = await generate(slug, ref ? ref.value : null);
  const rec = { code, issuedAt: new Date().toISOString() };
  map[key] = rec;
  saveIssued(map);
  return { ...rec, ref };
}

function formatDate(iso) {
  const d = new Date(iso);
  // dateStyle/timeStyle can't be combined with timeZoneName, so spell the fields out.
  return d.toLocaleString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
}

async function render() {
  if (!product || !root) return;
  const { code, issuedAt, ref } = await issue();
  const act = store.activate(code, { source: 'confirmation' });
  const firstCourse = product.includes ? product.includes[0] : slug;
  const startUrl = `/train/#/c/${firstCourse}/start`;
  const support = (config.supportEmail || '').trim();
  root.innerHTML = `
    <p class="confirm__status"><svg class="tr-ico tr-ico--good" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11"/><path d="M6.5 12.5l3.5 3.5 7.5-8"/></svg>Order complete</p>
    <h1>Your order is complete and your course is delivered.</h1>
    <p class="lede">Your license code is below and ${act.ok ? 'is already active in this browser' : 'is ready to activate'}. ${product.includes ? 'It unlocks all seven courses.' : ''}</p>
    <dl>
      <dt>Product</dt><dd>${esc(product.name)}</dd>
      <dt>Date and time</dt><dd>${esc(formatDate(issuedAt))}</dd>
      ${ref ? `<dt>Order reference</dt><dd>${esc(ref.value)}</dd>` : ''}
    </dl>
    <p class="tr-key__label">License code</p>
    <div class="license-box"><code data-code>${esc(code)}</code><button type="button" class="btn btn--ghost btn--small" data-act="copy">Copy code</button><span class="tr-msg" role="status" data-copy-msg></span></div>
    <a class="btn btn--primary" href="${startUrl}">Start training</a>
    <div class="confirm__actions">
      <button type="button" class="btn btn--ghost" data-act="pdf">Save confirmation (PDF)</button>
      <button type="button" class="btn btn--ghost" data-act="print">Print</button>
    </div>
    <h2 class="tr-h2">Good to know</h2>
    <ul>
      <li>To use ${product.includes ? 'the courses' : 'the course'} on another device, open the <a href="/train/">Training Room</a> or the product page there and enter the same license code.</li>
      <li>Your licenses and progress are stored only in your own browser. Use <strong>Export backup</strong> in the Training Room to keep a copy.</li>
      <li>Keep this code private. Your license is for your own use: see the <a href="/terms.html">Terms of Service</a>.</li>
      <li>Refunds: <a href="/refund-policy.html">Refund Policy</a> · Delivery: <a href="/delivery-policy.html">Delivery Policy</a></li>
      <li>Questions? ${support ? `Email <a href="mailto:${esc(support)}">${esc(support)}</a> or use the <a href="/contact.html">Contact page</a>` : 'Use the <a href="/contact.html">Contact page</a>'}, with your order number and the email address you used at checkout.</li>
    </ul>`;

  root.querySelector('[data-act="copy"]').addEventListener('click', async () => {
    const msg = root.querySelector('[data-copy-msg]');
    try { await navigator.clipboard.writeText(code); msg.textContent = 'Copied.'; }
    catch {
      const r = document.createRange(); r.selectNodeContents(root.querySelector('[data-code]'));
      const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
      msg.textContent = 'Selected: press Ctrl+C (or Cmd+C) to copy.';
    }
  });
  root.querySelector('[data-act="print"]').addEventListener('click', () => window.print());
  root.querySelector('[data-act="pdf"]').addEventListener('click', () => {
    const bytes = buildPdf(confirmationBlocks({
      productName: product.name, price: product.price, dateText: formatDate(issuedAt), orderRef: ref ? ref.value : null,
      code, origin: location.origin, supportEmail: support, startUrl: `${location.origin}/train/`
    }), { title: `Fiancho Chess order confirmation: ${product.name}` });
    const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
    const a = document.createElement('a');
    a.href = url; a.download = `fiancho-chess-confirmation-${slug}.pdf`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  });
}

render();
