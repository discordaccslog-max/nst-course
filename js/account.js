/*
  Fiancho Chess — license activation on product pages.
  "Already own this course?" panel under the price area; once the course is owned, the price area
  flips over to reveal Start training, progress and license details.
*/
import * as store from './store.js';

const products = globalThis.SITE_PRODUCTS || {};
const slug = document.body.dataset.product;
const product = products[slug];
const flip = document.querySelector('[data-flip]');
const back = document.querySelector('[data-owned]');
const panel = document.querySelector('[data-own-panel]');
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const okIcon = '<svg class="tr-ico tr-ico--good" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11"/><path d="M6.5 12.5l3.5 3.5 7.5-8"/></svg>';

async function positionsFor(courseSlugs) {
  try {
    const man = await fetch('/train/courses/index.json').then((r) => r.json());
    return courseSlugs.map((s) => ({ slug: s, total: man[s] ? man[s].positions : 0 }));
  } catch {
    return courseSlugs.map((s) => ({ slug: s, total: 0 }));
  }
}

async function renderOwned(animate) {
  const lic = store.licenseFor(slug);
  if (!lic || !back) return;
  const courses = store.unlocks(slug);
  const totals = await positionsFor(courses);
  let solved = 0, total = 0;
  for (const t of totals) { const s = store.summary(t.slug, t.total); solved += s.solved; total += t.total; }
  const pct = total ? Math.round((solved / total) * 100) : 0;
  const via = lic.product !== slug ? products[lic.product] : null;
  const start = product.includes ? '/train/' : `/train/#/c/${slug}/start`;
  back.innerHTML = `
    <svg class="owned-medal" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" stroke-width="4" opacity=".5"/><g transform="translate(18 14) scale(.64)" class="pc pc--w"><use href="#s-k" class="po" width="100" height="100"/><use href="#s-k" class="pf" width="100" height="100"/></g></svg>
    <p class="eyebrow">You own this course</p>
    <h2>${esc(product.name)}</h2>
    <p>${product.includes ? 'All seven courses are unlocked in this browser.' : 'Unlocked in this browser. Your progress is saved here as you train.'}</p>
    <div class="tr-progress" role="progressbar" aria-label="Progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><span style="width:${pct}%"></span></div>
    <p>${solved} of ${total} positions solved</p>
    <a class="btn btn--primary btn--block" href="${start}" data-start>${product.includes ? 'Open the Training Room' : 'Start training'}</a>
    <dl>
      <div><dt>License code</dt><dd>${esc(lic.code)}</dd></div>
      <div><dt>License</dt><dd>${esc(products[lic.product].name)}</dd></div>
      <div><dt>Activated here</dt><dd>${esc(new Date(lic.activatedAt).toLocaleDateString())}</dd></div>
    </dl>
    ${via ? `<p>Unlocked by your ${esc(via.name)} license.</p>` : ''}
    <p>To train on another device, enter the same license code in the Training Room or on this page there.</p>`;
  if (!animate) flip.classList.add('no-anim');
  flip.classList.add('is-flipped');
  if (!animate) requestAnimationFrame(() => requestAnimationFrame(() => flip.classList.remove('no-anim')));
  else setTimeout(() => back.querySelector('[data-start]').focus(), 500);
}

function renderPanel() {
  if (!panel) return;
  panel.innerHTML = `
    <h2 id="own-h">Already own this course?</h2>
    <p>Enter your license code to unlock it in this browser. The same code works on any device.</p>
    <form novalidate aria-labelledby="own-h">
      <label class="visually-hidden" for="own-code">License code</label>
      <input id="own-code" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="FIAN-XX-XXXX-XXXX-XXXX" aria-describedby="own-msg">
      <button type="submit" class="btn btn--primary">Activate</button>
    </form>
    <p class="tr-msg" id="own-msg" role="status"></p>`;
  panel.hidden = false;
  const form = panel.querySelector('form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = form.querySelector('input');
    const msg = panel.querySelector('.tr-msg');
    const r = store.activate(input.value);
    msg.classList.toggle('is-error', !r.ok);
    if (!r.ok) { msg.textContent = r.message; input.setAttribute('aria-invalid', 'true'); input.focus(); return; }
    input.removeAttribute('aria-invalid');
    if (store.owns(slug)) { msg.innerHTML = `${okIcon} License activated.`; renderOwned(true); }
    else msg.innerHTML = `${okIcon} That code is for <a href="/${esc(r.product.slug)}.html">${esc(r.product.name)}</a> and is now active in this browser. It doesn’t unlock ${esc(product.name)}.`;
  });
}

if (product && flip) {
  renderPanel();
  if (store.owns(slug)) renderOwned(false);
}
