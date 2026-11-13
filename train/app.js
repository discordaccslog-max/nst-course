/*
  Fiancho Chess — Training Room and course player.
  Courses load only when opened. Everything the learner does is stored in this browser.
*/
import { Board, boardThumbnail } from './board.js';
import * as store from '../js/store.js';
import { coursePgn, downloadText } from './pgn.js';

const products = globalThis.SITE_PRODUCTS || {};
const config = globalThis.SITE_CONFIG || {};
const SUPPORT = (config.supportEmail || '').trim();
const COURSES = Object.keys(products).filter((s) => !products[s].includes);
const app = document.getElementById('app');
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const TRAINABLE = ['puzzle', 'visual', 'quiz', 'structure', 'practice'];

let ChessCtor = null;
async function Chess() {
  if (!ChessCtor) ChessCtor = (await import('../js/vendor/chess.js')).Chess;
  return ChessCtor;
}

let manifestPromise = null;
function manifest() {
  if (!manifestPromise) manifestPromise = fetch('/train/courses/index.json').then((r) => r.json());
  return manifestPromise;
}
const courseCache = {};
function loadCourse(slug) {
  if (!courseCache[slug]) courseCache[slug] = fetch(`/train/courses/${slug}.json`).then((r) => { if (!r.ok) throw new Error('Course unavailable'); return r.json(); });
  return courseCache[slug];
}

let cleanup = null;
function setView(html) {
  if (cleanup) { try { cleanup(); } catch { /* ignore */ } cleanup = null; }
  app.innerHTML = html;
  window.scrollTo(0, 0);
}

function icon(ok) {
  return ok
    ? '<svg class="tr-ico tr-ico--good" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11"/><path d="M6.5 12.5l3.5 3.5 7.5-8"/></svg>'
    : '<svg class="tr-ico tr-ico--bad" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11"/><path d="M8 8l8 8M16 8l-8 8"/></svg>';
}

function reportLink(course, item, extra = '') {
  if (!SUPPORT) return '';
  const subject = `Problem report: ${course.name} – ${item.id}`;
  const body = `Course: ${course.name}\nPosition: ${item.id}\n${item.fen ? `FEN: ${item.fen}\n` : ''}${extra}\nWhat looks wrong:\n`;
  return `<a class="tr-report" href="mailto:${esc(SUPPORT)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}">Report a problem with this position</a>`;
}

function trainableCount(course) {
  let n = 0;
  for (const s of course.sections) for (const it of s.items) {
    if (TRAINABLE.includes(it.type)) n++;
    if (it.type === 'drill') n += leafPaths(findExplorer(course, it.explorer).tree).length;
  }
  return n;
}

function findExplorer(course, id) {
  for (const s of course.sections) for (const it of s.items) if (it.id === id) return it;
  return null;
}

function leafPaths(nodes, path = []) {
  const out = [];
  for (const n of nodes) {
    const p = [...path, n];
    if (!n.children.length) out.push(p); else out.push(...leafPaths(n.children, p));
  }
  return out;
}

/* ================================================================ Training Room */
async function renderRoom() {
  const owned = store.ownedCourses();
  const man = await manifest();
  const due = store.backupDue();
  setView(`
  <section class="tr-room">
    <div class="container">
      <header class="tr-head">
        <p class="eyebrow">Training Room</p>
        <h1>${owned.size ? 'Your courses' : 'Activate your license'}</h1>
        <p class="lede">${owned.size ? 'Pick up where you left off. Your progress is saved in this browser.' : 'Enter the license code from your order confirmation to unlock your course on this device. The same code works on any device.'}</p>
      </header>
      ${due ? `<div class="tr-banner" role="status"><p><strong>A gentle reminder:</strong> you haven’t made a backup in the last 30 days. Your licenses and progress live only in this browser.</p><button type="button" class="btn btn--primary" data-act="export">Export backup</button></div>` : ''}
      ${owned.size ? '' : activationCard('room-activate', 'License code', 'Activate')}
      ${owned.size ? `<h2 class="tr-h2">Your courses</h2><ul class="tr-shelf">${COURSES.filter((s) => owned.has(s)).map((s) => shelfCard(s, man[s], true)).join('')}</ul>` : ''}
      ${COURSES.some((s) => !owned.has(s)) ? `<h2 class="tr-h2">${owned.size ? 'More courses' : 'The courses'}</h2><ul class="tr-shelf tr-shelf--other">${COURSES.filter((s) => !owned.has(s)).map((s) => shelfCard(s, man[s], false)).join('')}</ul>` : ''}
      ${owned.size ? `<div class="tr-more-activate">${activationCard('room-activate', 'Activate another license', 'Activate', true)}</div>` : ''}
      <section class="tr-tools" aria-labelledby="tools-h">
        <h2 class="tr-h2" id="tools-h">Your data and settings</h2>
        <div class="tr-tools__grid">
          <div class="tr-tool">
            <h3>Backups</h3>
            <p>Licenses and progress are stored only in this browser and are never sent anywhere. Export a backup file to keep a copy, or to move your progress to another device.</p>
            <p class="tr-muted">${store.lastBackupAt() ? `Last backup: ${new Date(store.lastBackupAt()).toLocaleString()}` : 'No backup made yet.'}</p>
            <div class="tr-row"><button type="button" class="btn btn--primary" data-act="export">Export backup</button>
            <label class="btn btn--ghost tr-file">Import backup<input type="file" accept="application/json,.json" data-act="import"></label></div>
            <p class="tr-msg" data-msg="backup" role="status"></p>
          </div>
          <div class="tr-tool">
            <h3>Display</h3>
            <label class="tr-switch"><input type="checkbox" data-act="large" ${store.getSetting('largeUi') ? 'checked' : ''}> <span>Larger interface</span></label>
            <p class="tr-muted">Increases text, buttons and the board.</p>
            <button type="button" class="btn btn--ghost" data-act="walkthrough">Show the walkthrough again</button>
            <button type="button" class="btn btn--ghost" data-act="install" hidden>Install the app</button>
          </div>
          <div class="tr-tool">
            <h3>Help</h3>
            <p>To use a course on another device, open the Training Room there and enter the same license code.</p>
            ${SUPPORT ? `<p>Support: <a href="mailto:${esc(SUPPORT)}">${esc(SUPPORT)}</a>. We reply within two business days.</p>` : '<p>Support: see the <a href="/contact.html">Contact page</a>.</p>'}
          </div>
        </div>
      </section>
    </div>
  </section>`);
  for (const host of app.querySelectorAll('[data-thumb]')) host.appendChild(boardThumbnail(host.dataset.thumb, { size: 200, label: host.dataset.label }));
  bindActivation(app, () => renderRoom());
  bindTools(app);
  maybeWalkthrough();
}

function shelfCard(slug, m, owned) {
  const p = products[slug];
  const sig = (m && m.signature) || { fen: '8/8/8/8/8/8/8/8 w - - 0 1', caption: '' };
  if (!owned) {
    return `<li class="tr-card tr-card--locked"><div class="tr-card__thumb" data-thumb="${esc(sig.fen)}" data-label="${esc(sig.caption)}"></div><div class="tr-card__body"><h3>${esc(p.name)}</h3><p class="tr-muted">${esc(p.level)}</p><a class="text-link" href="/${slug}.html">View course</a></div></li>`;
  }
  const s = store.summary(slug, m ? m.positions : 0);
  const cp = store.getProgress(slug);
  return `<li class="tr-card"><div class="tr-card__thumb" data-thumb="${esc(sig.fen)}" data-label="${esc(sig.caption)}"></div><div class="tr-card__body">
    <h3>${esc(p.name)}</h3>
    <div class="tr-progress" role="progressbar" aria-label="${esc(p.name)} progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${s.percent}"><span style="width:${s.percent}%"></span></div>
    <p class="tr-muted">${s.solved} of ${s.total} solved${s.accuracy !== null ? ` · ${s.accuracy}% first-try accuracy` : ''}${s.review ? ` · ${s.review} to review` : ''}</p>
    <a class="btn btn--primary" href="#/c/${slug}">${cp.last || s.attempted ? 'Continue' : 'Start'}</a></div></li>`;
}

function activationCard(id, label, button, compact = false) {
  return `<form class="tr-activate${compact ? ' tr-activate--compact' : ''}" data-activate novalidate>
    <label for="${id}">${esc(label)}</label>
    <div class="tr-row"><input id="${id}" name="code" type="text" inputmode="text" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="FIAN-XX-XXXX-XXXX-XXXX" aria-describedby="${id}-msg"><button type="submit" class="btn btn--primary">${esc(button)}</button></div>
    <p class="tr-msg" id="${id}-msg" role="status"></p>
  </form>`;
}

function bindActivation(root, after) {
  for (const form of root.querySelectorAll('[data-activate]')) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.querySelector('input');
      const msg = form.querySelector('.tr-msg');
      const r = store.activate(input.value);
      msg.classList.toggle('is-error', !r.ok);
      if (!r.ok) { msg.textContent = r.message; input.setAttribute('aria-invalid', 'true'); input.focus(); return; }
      input.removeAttribute('aria-invalid');
      msg.innerHTML = `${icon(true)} ${r.already ? 'This license was already active.' : 'License activated.'} ${esc(r.product.name)} is unlocked on this device.`;
      setTimeout(after, 900);
    });
  }
}

function bindTools(root) {
  root.querySelectorAll('[data-act="export"]').forEach((b) => b.addEventListener('click', () => {
    downloadText(`fiancho-chess-backup-${new Date().toISOString().slice(0, 10)}.json`, store.exportBackup(), 'application/json');
    const m = root.querySelector('[data-msg="backup"]');
    if (m) m.textContent = 'Backup file saved.';
    const banner = root.querySelector('.tr-banner'); if (banner) banner.remove();
  }));
  const imp = root.querySelector('[data-act="import"]');
  if (imp) imp.addEventListener('change', async () => {
    const f = imp.files[0]; if (!f) return;
    const r = store.importBackup(await f.text());
    const m = root.querySelector('[data-msg="backup"]');
    m.textContent = r.message; m.classList.toggle('is-error', !r.ok);
    if (r.ok) setTimeout(renderRoom, 1200);
  });
  const large = root.querySelector('[data-act="large"]');
  if (large) large.addEventListener('change', () => { store.setSetting('largeUi', large.checked); document.documentElement.classList.toggle('ui-large', large.checked); });
  const wt = root.querySelector('[data-act="walkthrough"]');
  if (wt) wt.addEventListener('click', () => walkthrough(true));
  const inst = root.querySelector('[data-act="install"]');
  if (inst && deferredInstall) { inst.hidden = false; inst.addEventListener('click', async () => { deferredInstall.prompt(); await deferredInstall.userChoice; deferredInstall = null; inst.hidden = true; }); }
}

let deferredInstall = null;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredInstall = e; const b = document.querySelector('[data-act="install"]'); if (b) { b.hidden = false; } });

/* ================================================================ Walkthrough */
const WALK = [
  ['Welcome to the Training Room', 'Your courses appear here as a row of boards. Progress, accuracy and your review queue are saved in this browser as you train.'],
  ['Playing moves', 'Drag a piece, or click it and then click the square you want. With the keyboard, focus the board, move with the arrow keys and press Enter or Space to pick up and place a piece.'],
  ['When you’re stuck', 'Every position has Hint, Reveal solution and Retry, and Undo takes back moves. Positions you miss come back in your review queue.'],
  ['Keep a backup', 'Your licenses and progress stay on this device. Use Export backup now and then, and enter your license code to use a course on another device.']
];
function maybeWalkthrough() { if (!store.getSetting('walkthroughDone')) walkthrough(false); }
function walkthrough() {
  let step = 0;
  const prevFocus = document.activeElement;
  const overlay = document.createElement('div');
  overlay.className = 'tr-walk';
  overlay.innerHTML = '<div class="tr-walk__card" role="dialog" aria-modal="true" aria-labelledby="walk-h"><p class="tr-walk__step"></p><h2 id="walk-h"></h2><p class="tr-walk__text"></p><div class="tr-row"><button type="button" class="btn btn--ghost" data-w="skip">Skip</button><span class="tr-spacer"></span><button type="button" class="btn btn--ghost" data-w="back">Back</button><button type="button" class="btn btn--primary" data-w="next">Next</button></div></div>';
  document.body.appendChild(overlay);
  const done = () => { store.setSetting('walkthroughDone', true); overlay.remove(); if (prevFocus && prevFocus.focus) prevFocus.focus(); };
  const show = () => {
    overlay.querySelector('.tr-walk__step').textContent = `Step ${step + 1} of ${WALK.length}`;
    overlay.querySelector('#walk-h').textContent = WALK[step][0];
    overlay.querySelector('.tr-walk__text').textContent = WALK[step][1];
    overlay.querySelector('[data-w="back"]').hidden = step === 0;
    overlay.querySelector('[data-w="next"]').textContent = step === WALK.length - 1 ? 'Start training' : 'Next';
    overlay.querySelector('[data-w="next"]').focus();
  };
  overlay.addEventListener('click', (e) => {
    const w = e.target.closest('[data-w]'); if (!w) return;
    if (w.dataset.w === 'skip') done();
    if (w.dataset.w === 'back') { step--; show(); }
    if (w.dataset.w === 'next') { if (step === WALK.length - 1) done(); else { step++; show(); } }
  });
  overlay.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') done();
    if (e.key === 'Tab') {
      const f = [...overlay.querySelectorAll('button:not([hidden])')];
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  });
  show();
}

/* ================================================================ Course overview */
function lockedView(slug) {
  const p = products[slug];
  setView(`<section class="tr-room"><div class="container tr-narrow">
    <nav class="breadcrumb" aria-label="Breadcrumb"><ol><li><a href="#/">Training Room</a></li><li aria-current="page">${esc(p ? p.name : 'Course')}</li></ol></nav>
    <h1>${esc(p ? p.name : 'Course')}</h1>
    <p class="lede">This course isn’t activated in this browser yet. Enter your license code to unlock it here; the same code works on every device.</p>
    ${activationCard('locked-activate', 'License code', 'Activate')}
    ${p ? `<p><a class="text-link" href="/${slug}.html">About ${esc(p.name)}</a></p>` : ''}
  </div></section>`);
  bindActivation(app, () => route());
}

async function renderOverview(slug) {
  if (!store.owns(slug)) return lockedView(slug);
  const course = await loadCourse(slug);
  const total = trainableCount(course);
  const s = store.summary(slug, total);
  const cp = store.getProgress(slug);
  const due = store.backupDue();
  const sectionRows = course.sections.map((sec) => {
    const ids = sectionItemIds(course, sec);
    const done = ids.filter((id) => cp.items[id] && cp.items[id].solved).length;
    const seen = cp.seen.includes(sec.id);
    const status = ids.length ? `${done} of ${ids.length} solved` : seen ? 'Read' : 'Lesson';
    const complete = ids.length ? done === ids.length : seen;
    return `<li class="tr-sec${complete ? ' is-done' : ''}"><a href="#/c/${slug}/s/${sec.id}"><span class="tr-sec__title">${complete ? icon(true) : ''}${esc(sec.title)}</span><span class="tr-muted">${status}</span></a></li>`;
  }).join('');
  const last = cp.last ? `#/c/${slug}/s/${cp.last.section}/${cp.last.index}` : `#/c/${slug}/s/${course.sections[0].id}`;
  setView(`<section class="tr-room"><div class="container">
    <nav class="breadcrumb" aria-label="Breadcrumb"><ol><li><a href="#/">Training Room</a></li><li aria-current="page">${esc(course.name)}</li></ol></nav>
    <div class="tr-overview">
      <div class="tr-overview__thumb" data-thumb="${esc(course.signature.fen)}" data-label="${esc(course.signature.caption)}"></div>
      <div>
        <p class="eyebrow">${esc(course.level)}</p>
        <h1>${esc(course.name)}</h1>
        <div class="tr-progress" role="progressbar" aria-label="Course progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${s.percent}"><span style="width:${s.percent}%"></span></div>
        <p class="tr-muted">${s.solved} of ${total} solved${s.accuracy !== null ? ` · ${s.accuracy}% first-try accuracy` : ''}</p>
        <div class="tr-row">
          <a class="btn btn--primary" href="${last}">${cp.last ? 'Continue' : 'Start the first lesson'}</a>
          <a class="btn btn--ghost${s.review ? '' : ' is-disabled'}" ${s.review ? `href="#/c/${slug}/review"` : 'aria-disabled="true"'}>Review queue (${s.review})</a>
          <button type="button" class="btn btn--ghost" data-act="pgn">Export PGN</button>
        </div>
      </div>
    </div>
    ${due ? `<div class="tr-banner" role="status"><p><strong>A gentle reminder:</strong> you haven’t made a backup in the last 30 days.</p><button type="button" class="btn btn--primary" data-act="export">Export backup</button></div>` : ''}
    <h2 class="tr-h2">Contents</h2>
    <ol class="tr-secs">${sectionRows}</ol>
  </div></section>`);
  for (const host of app.querySelectorAll('[data-thumb]')) host.appendChild(boardThumbnail(host.dataset.thumb, { size: 220, label: host.dataset.label }));
  app.querySelector('[data-act="pgn"]').addEventListener('click', () => downloadText(`fiancho-chess-${slug}.pgn`, coursePgn(course)));
  bindTools(app);
  maybeWalkthrough();
}

function sectionItemIds(course, sec) {
  const ids = [];
  for (const it of sec.items) {
    if (TRAINABLE.includes(it.type)) ids.push(it.id);
    if (it.type === 'drill') for (const path of leafPaths(findExplorer(course, it.explorer).tree)) ids.push(drillLineId(it, path));
  }
  return ids;
}
const drillLineId = (drill, path) => `${drill.id}:${path.map((n) => n.uci).join(' ')}`;

/* ================================================================ Player */
async function renderSection(slug, sectionId, index, reviewMode = false) {
  if (!store.owns(slug)) return lockedView(slug);
  const course = await loadCourse(slug);
  let steps; // [{ kind: 'lesson' | 'item', item, section }]
  let title, backHref = `#/c/${slug}`;
  if (reviewMode) {
    const queue = store.getProgress(slug).review;
    steps = queue.map((id) => resolveId(course, id)).filter(Boolean);
    title = 'Review queue';
    if (!steps.length) {
      setView(`<section class="tr-room"><div class="container tr-narrow"><nav class="breadcrumb" aria-label="Breadcrumb"><ol><li><a href="#/">Training Room</a></li><li><a href="${backHref}">${esc(course.name)}</a></li><li aria-current="page">Review queue</li></ol></nav><h1>Review queue</h1><p class="lede">${icon(true)} Nothing to review. Positions you miss will come back here.</p><a class="btn btn--primary" href="${backHref}">Back to the course</a></div></section>`);
      return;
    }
  } else {
    const sec = course.sections.find((s) => s.id === sectionId);
    if (!sec) { location.hash = `#/c/${slug}`; return; }
    title = sec.title;
    steps = [{ kind: 'lesson', section: sec }];
    for (const it of sec.items) {
      if (it.type === 'drill') for (const path of leafPaths(findExplorer(course, it.explorer).tree)) steps.push({ kind: 'item', section: sec, item: { ...it, line: path, id: drillLineId(it, path) } });
      else steps.push({ kind: 'item', section: sec, item: it });
    }
    store.markSeen(slug, sec.id);
  }
  index = Math.max(0, Math.min(steps.length - 1, index || 0));
  const step = steps[index];
  if (!reviewMode) store.setLast(slug, { section: sectionId, index });
  const base = reviewMode ? `#/c/${slug}/review` : `#/c/${slug}/s/${sectionId}`;
  const secIdx = course.sections.findIndex((s) => s.id === sectionId);
  const nextSection = !reviewMode && course.sections[secIdx + 1];
  const nextHref = index < steps.length - 1 ? `${base}/${index + 1}` : nextSection ? `#/c/${slug}/s/${nextSection.id}` : backHref;
  const nextLabel = index < steps.length - 1 ? 'Next' : nextSection ? `Next: ${nextSection.title}` : 'Back to the course';
  const hasBoard = step.kind === 'item' && step.item.type !== 'quiz';

  setView(`<section class="tr-player"><div class="container">
    <div class="tr-topbar">
      <nav class="breadcrumb" aria-label="Breadcrumb"><ol><li><a href="#/">Training Room</a></li><li><a href="${backHref}">${esc(course.name)}</a></li><li aria-current="page">${esc(title)}</li></ol></nav>
      <div class="tr-topbar__nav">
        <span class="tr-muted">${index + 1} of ${steps.length}</span>
        <a class="btn btn--ghost btn--small${index === 0 ? ' is-disabled' : ''}" ${index === 0 ? 'aria-disabled="true"' : `href="${base}/${index - 1}"`}>Previous</a>
        <a class="btn btn--ghost btn--small" href="${nextHref}" data-next>${esc(nextLabel)}</a>
      </div>
    </div>
    <div class="tr-stage${hasBoard ? '' : ' tr-stage--noboard'}">
      ${hasBoard ? '<div class="tr-board-col"><div class="tr-board-host"></div></div>' : ''}
      <div class="tr-panel" aria-live="off"></div>
    </div>
  </div></section>`);

  const panel = app.querySelector('.tr-panel');
  const host = app.querySelector('.tr-board-host');
  const ctx = { course, slug, panel, host, reviewMode, nextHref, nextLabel };
  if (step.kind === 'lesson') return lessonView(ctx, step.section, steps.length > 1 ? `${base}/1` : nextHref, steps.length > 1 ? 'Start' : nextLabel);
  const handler = { example: exampleView, puzzle: puzzleView, visual: visualView, quiz: quizView, structure: structureView, practice: practiceView, explorer: explorerView, drill: drillView }[step.item.type];
  const c = await handler(ctx, step.item);
  if (typeof c === 'function') cleanup = c;
}

function resolveId(course, id) {
  for (const sec of course.sections) {
    for (const it of sec.items) {
      if (it.id === id) return { kind: 'item', section: sec, item: it };
      if (it.type === 'drill' && id.startsWith(it.id + ':')) {
        const path = leafPaths(findExplorer(course, it.explorer).tree).find((p) => drillLineId(it, p) === id);
        if (path) return { kind: 'item', section: sec, item: { ...it, line: path, id } };
      }
    }
  }
  return null;
}

function lessonView(ctx, sec, href, label) {
  ctx.panel.innerHTML = `<div class="tr-lesson">
    <p class="eyebrow">Lesson</p>
    <h1 class="tr-lesson__title">${esc(sec.title)}</h1>
    ${sec.paras.map((p) => `<p>${p}</p>`).join('')}
    ${sec.key ? `<div class="tr-key"><p class="tr-key__label">Key idea</p><p>${esc(sec.key)}</p></div>` : ''}
    <a class="btn btn--primary" href="${href}">${esc(label)}</a>
  </div>`;
}

function makeBoard(ctx, item, opts = {}) {
  return new Board(ctx.host, { orientation: item.orientation || 'w', label: opts.label || 'Training board', onMove: opts.onMove, onSquare: opts.onSquare });
}

function footerLinks(ctx, item) {
  return `<div class="tr-foot">${reportLink(ctx.course, item)}</div>`;
}

function successBlock(ctx, html) {
  return `<div class="tr-result tr-result--good" role="status">${icon(true)}<div>${html}</div></div><div class="tr-row"><a class="btn btn--primary" href="${ctx.nextHref}">${esc(ctx.nextLabel)}</a><button type="button" class="btn btn--ghost" data-act="retry">Retry</button></div>`;
}

/* ---------------- worked example / demonstration */
async function exampleView(ctx, item) {
  const C = await Chess();
  const fens = [item.fen];
  const g = new C(item.fen);
  for (const m of item.moves) { g.move(m.san); fens.push(g.fen()); }
  const board = makeBoard(ctx, item, { label: `${item.title}. Use the buttons to step through the moves.` });
  let i = 0;
  ctx.panel.innerHTML = `<p class="eyebrow">${esc(item.title)}</p><p class="tr-prompt">${esc(item.prompt)}</p>
    <ol class="tr-moves">${item.moves.map((m, k) => `<li><button type="button" data-k="${k + 1}">${esc(m.label)} ${esc(m.san)}</button></li>`).join('')}</ol>
    <div class="tr-note" aria-live="polite"></div>
    <div class="tr-row tr-steps"><button type="button" class="btn btn--ghost btn--small" data-step="first" aria-label="Go to the start">« Start</button><button type="button" class="btn btn--ghost btn--small" data-step="prev">‹ Back</button><button type="button" class="btn btn--primary btn--small" data-step="next">Next move ›</button><button type="button" class="btn btn--ghost btn--small" data-step="last" aria-label="Go to the end">End »</button></div>
    <div class="tr-row"><a class="btn btn--ghost" href="${ctx.nextHref}">${esc(ctx.nextLabel)}</a></div>${footerLinks(ctx, item)}`;
  const note = ctx.panel.querySelector('.tr-note');
  const show = (k, animate) => {
    i = Math.max(0, Math.min(item.moves.length, k));
    board.setPosition(fens[i], { lastMove: i ? item.moves[i - 1].uci : null, animate });
    ctx.panel.querySelectorAll('[data-k]').forEach((b) => b.classList.toggle('is-current', Number(b.dataset.k) === i));
    if (i === 0) note.innerHTML = `<p>Starting position. ${esc(item.prompt)}</p>`;
    else note.innerHTML = `<p><strong>${esc(item.moves[i - 1].label)} ${esc(item.moves[i - 1].san)}</strong> ${esc(item.moves[i - 1].note)}</p>${i === item.moves.length && item.summary ? `<p class="tr-summary">${esc(item.summary)}</p>` : ''}`;
    if (i > 0) board.say(`${item.moves[i - 1].label} ${item.moves[i - 1].san}. ${item.moves[i - 1].note}`);
  };
  ctx.panel.addEventListener('click', (e) => {
    const s = e.target.closest('[data-step]'); const k = e.target.closest('[data-k]');
    if (k) show(Number(k.dataset.k), false);
    if (s) show({ first: 0, prev: i - 1, next: i + 1, last: item.moves.length }[s.dataset.step], s.dataset.step === 'next');
  });
  show(0);
}

/* ---------------- training position */
async function puzzleView(ctx, item) {
  const C = await Chess();
  let game, ply, clean, hintLevel, finished, timers = [];
  const learner = item.orientation;
  const board = makeBoard(ctx, item, { label: `Training position. ${item.prompt}`, onMove: (f, t, p) => onMove(f, t, p) });
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));

  const render = () => {
    ctx.panel.innerHTML = `<p class="eyebrow">Training position</p><p class="tr-prompt">${esc(item.prompt)}</p>
      <div class="tr-feedback" role="status" aria-live="polite"></div>
      <div class="tr-row tr-tools-row">
        <button type="button" class="btn btn--ghost btn--small" data-act="hint">Hint</button>
        <button type="button" class="btn btn--ghost btn--small" data-act="undo" disabled>Undo</button>
        <button type="button" class="btn btn--ghost btn--small" data-act="reveal">Reveal solution</button>
        <button type="button" class="btn btn--ghost btn--small" data-act="retry">Retry</button>
      </div>
      <div class="tr-explain"></div>${footerLinks(ctx, item)}`;
  };
  const fb = (html, ok) => { const el = ctx.panel.querySelector('.tr-feedback'); el.className = `tr-feedback ${ok === true ? 'is-good' : ok === false ? 'is-bad' : ''}`; el.innerHTML = html; };
  const legal = (sq) => game.moves({ square: sq, verbose: true }).map((m) => ({ to: m.to, promotion: m.promotion }));
  const sync = () => { const undo = ctx.panel.querySelector('[data-act="undo"]'); if (undo) undo.disabled = finished || ply < 2; };

  const reset = () => {
    timers.forEach(clearTimeout); timers = [];
    game = new C(item.fen); ply = 0; clean = true; hintLevel = 0; finished = false;
    render();
    board.setPosition(item.fen, { animate: false });
    board.setMovable(learner, legal);
    fb(`${learner === 'w' ? 'White' : 'Black'} to move.`);
    sync();
  };

  const explanation = () => {
    const g = new C(item.fen);
    const rows = item.sans.map((san, k) => { const label = `${g.moveNumber()}${g.turn() === 'w' ? '.' : '...'}`; g.move(san); return `<li><strong>${esc(label)} ${esc(san)}</strong> ${esc(item.notes[k])}</li>`; }).join('');
    return `<ol class="tr-solution">${rows}</ol><p class="tr-summary">${esc(item.summary)}</p>`;
  };

  const finish = (solved, alt) => {
    finished = true;
    board.setMovable(null);
    store.recordResult(ctx.slug, item.id, { correct: solved, clean: solved && clean, inReview: ctx.reviewMode });
    const head = solved ? (alt ? '<p><strong>That works too.</strong> The main line is shown below.</p>' : `<p><strong>${clean ? 'Solved.' : 'Solved, with some help.'}</strong>${clean ? '' : ' This position goes into your review queue.'}</p>`) : '<p><strong>Here is the solution.</strong> This position goes into your review queue.</p>';
    fb('', null);
    ctx.panel.querySelector('.tr-explain').innerHTML = (solved ? successBlock(ctx, head) : `<div class="tr-result tr-result--info" role="status"><div>${head}</div></div><div class="tr-row"><a class="btn btn--primary" href="${ctx.nextHref}">${esc(ctx.nextLabel)}</a><button type="button" class="btn btn--ghost" data-act="retry">Retry</button></div>`) + explanation();
    sync();
  };

  const playReply = () => {
    if (ply >= item.solution.length) return finish(true, false);
    later(() => {
      const u = item.solution[ply];
      const mv = game.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] });
      ply++;
      board.setPosition(game.fen(), { lastMove: u });
      board.say(`Reply: ${mv.san}`);
      if (ply >= item.solution.length) return finish(true, false);
      board.setMovable(learner, legal);
      fb(`${mv.san}. Your move.`);
      sync();
    }, 550);
  };

  function onMove(from, to, promotion) {
    if (finished) return;
    const uci = from + to + (promotion || '');
    const expected = item.solution[ply];
    const alts = (item.accepted && item.accepted[ply]) || [];
    const matches = (u) => u === uci || (u.length === 5 && !promotion && u.slice(0, 4) === uci);
    if (matches(expected) || alts.some(matches)) {
      const isAlt = !matches(expected);
      const mv = game.move({ from, to, promotion: (isAlt ? alts.find(matches) : expected)[4] || promotion });
      board.setPosition(game.fen(), { lastMove: from + to });
      board.feedback(to, true);
      board.say(`${mv.san}. Correct.`);
      fb(`${icon(true)} <strong>${esc(mv.san)}</strong> is correct.`, true);
      ply++;
      board.setMovable(null);
      sync();
      if (isAlt) return finish(true, true);
      playReply();
    } else {
      clean = false;
      const tmp = new C(game.fen());
      let san = '';
      try { san = tmp.move({ from, to, promotion }).san; } catch { /* illegal moves never reach here */ }
      board.setPosition(tmp.fen(), { lastMove: from + to });
      board.feedback(to, false);
      board.setMovable(null);
      board.say(`${san} is not the best move. The move is taken back.`);
      fb(`${icon(false)} <strong>${esc(san)}</strong> isn’t the best move here. Try again, or use a hint.`, false);
      later(() => { board.setPosition(game.fen(), { animate: false }); board.clearMarks(); board.setMovable(learner, legal); }, 900);
    }
  }

  ctx.panel.addEventListener('click', (e) => {
    const a = e.target.closest('[data-act]'); if (!a) return;
    if (a.dataset.act === 'retry') reset();
    if (a.dataset.act === 'hint' && !finished) {
      clean = false;
      hintLevel = Math.min(2, hintLevel + 1);
      const u = item.solution[ply];
      board.clearHints();
      board.highlightSquare(u.slice(0, 2), 'fc-hint');
      const piece = game.get(u.slice(0, 2));
      const names = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' };
      if (hintLevel === 2) board.highlightSquare(u.slice(2, 4), 'fc-hint fc-hint--to');
      fb(hintLevel === 1 ? `Hint: look at the ${names[piece.type]} on ${u.slice(0, 2)}.` : `Hint: the ${names[piece.type]} goes to ${u.slice(2, 4)}.`);
    }
    if (a.dataset.act === 'undo' && ply >= 2 && !finished) {
      game.undo(); game.undo(); ply -= 2;
      board.setPosition(game.fen(), { animate: false });
      board.setMovable(learner, legal);
      fb('Move taken back. Your move.');
      sync();
    }
    if (a.dataset.act === 'reveal' && !finished) {
      clean = false; finished = true;
      board.setMovable(null);
      const step = () => {
        if (ply >= item.solution.length) { finished = false; return finish(false); }
        const u = item.solution[ply];
        game.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] });
        ply++;
        board.setPosition(game.fen(), { lastMove: u });
        later(step, 700);
      };
      step();
    }
  });
  reset();
  return () => timers.forEach(clearTimeout);
}

/* ---------------- visualization */
async function visualView(ctx, item) {
  const board = makeBoard(ctx, item, { label: 'Starting position. The board does not change while you read the moves.' });
  board.setPosition(item.fen, { animate: false });
  const level = ['', 'Level 1', 'Level 2', 'Level 3', 'Level 4'][item.level] || '';
  ctx.panel.innerHTML = `<p class="eyebrow">Visualization · ${level}</p>
    <p class="tr-prompt">The board shows the starting position and will not move. Read the moves, picture them, then answer.</p>
    <p class="tr-movetext">${item.moves.map(esc).join(' ')}</p>
    <fieldset class="tr-choices"><legend>${esc(item.question)}</legend>${item.choices.map((c, i) => `<button type="button" class="tr-choice" data-i="${i}">${esc(c)}</button>`).join('')}</fieldset>
    <div class="tr-explain"></div>${footerLinks(ctx, item)}`;
  choiceLogic(ctx, item, (ok) => {
    board.setPosition(item.finalFen, { animate: false });
    board.say('The board now shows the final position.');
    return `${item.explanation}`;
  });
}

function choiceLogic(ctx, item, after) {
  let answered = false;
  ctx.panel.addEventListener('click', (e) => {
    const b = e.target.closest('.tr-choice'); if (!b || answered) return;
    answered = true;
    const ok = Number(b.dataset.i) === item.answer;
    ctx.panel.querySelectorAll('.tr-choice').forEach((x) => {
      x.disabled = true;
      const i = Number(x.dataset.i);
      if (i === item.answer) { x.classList.add('is-right'); x.insertAdjacentHTML('afterbegin', icon(true)); }
      else if (x === b) { x.classList.add('is-wrong'); x.insertAdjacentHTML('afterbegin', icon(false)); }
    });
    store.recordResult(ctx.slug, item.id, { correct: ok, clean: ok, inReview: ctx.reviewMode });
    const extra = after(ok);
    ctx.panel.querySelector('.tr-explain').innerHTML = `<div class="tr-result ${ok ? 'tr-result--good' : 'tr-result--bad'}" role="status">${icon(ok)}<div><p><strong>${ok ? 'Correct.' : `Not quite. The answer is ${esc(item.choices[item.answer])}.`}</strong>${ok ? '' : ' This one goes into your review queue.'}</p><p>${esc(extra)}</p></div></div><div class="tr-row"><a class="btn btn--primary" href="${ctx.nextHref}">${esc(ctx.nextLabel)}</a><button type="button" class="btn btn--ghost" data-act="again">Try again</button></div>`;
    ctx.panel.querySelector('[data-act="again"]').addEventListener('click', () => route());
  });
}

async function quizView(ctx, item) {
  ctx.panel.innerHTML = `<p class="eyebrow">Visualization basics</p><p class="tr-prompt">Answer from your picture of the board. There is no board on purpose.</p>
    <fieldset class="tr-choices"><legend>${esc(item.question)}</legend>${item.choices.map((c, i) => `<button type="button" class="tr-choice" data-i="${i}">${esc(c)}</button>`).join('')}</fieldset>
    <div class="tr-explain"></div>${footerLinks(ctx, item)}`;
  choiceLogic(ctx, item, () => item.explanation);
}

/* ---------------- pawn structure */
async function structureView(ctx, item) {
  if (item.mode === 'choice') {
    const board = makeBoard(ctx, item, { label: 'Position to assess' });
    board.setPosition(item.fen, { animate: false });
    for (const sq of item.highlight || []) board.highlightSquare(sq, 'fc-hint');
    ctx.panel.innerHTML = `<p class="eyebrow">Structure</p><fieldset class="tr-choices"><legend>${esc(item.question)}</legend>${item.choices.map((c, i) => `<button type="button" class="tr-choice" data-i="${i}">${esc(c)}</button>`).join('')}</fieldset><div class="tr-explain"></div>${footerLinks(ctx, item)}`;
    choiceLogic(ctx, item, () => item.explanation);
    return;
  }
  let answered = false;
  const board = makeBoard(ctx, item, {
    label: `${item.question} Use the arrow keys to choose a square and press Enter.`,
    onSquare: (sq) => {
      if (answered) return;
      answered = true;
      board.setSquareMode(false);
      const ok = item.answers.includes(sq);
      board.feedback(sq, ok, { keep: true });
      if (!ok) for (const a of item.answers) board.feedback(a, true, { keep: true });
      store.recordResult(ctx.slug, item.id, { correct: ok, clean: ok, inReview: ctx.reviewMode });
      board.say(ok ? `${sq} is correct.` : `${sq} is not correct. The answer is ${item.answers.join(' or ')}.`);
      ctx.panel.querySelector('.tr-explain').innerHTML = `<div class="tr-result ${ok ? 'tr-result--good' : 'tr-result--bad'}" role="status">${icon(ok)}<div><p><strong>${ok ? 'Correct.' : `Not quite: you chose ${sq}.`}</strong>${ok ? '' : ' This one goes into your review queue.'}</p><p>${esc(item.explanation)}</p></div></div><div class="tr-row"><a class="btn btn--primary" href="${ctx.nextHref}">${esc(ctx.nextLabel)}</a><button type="button" class="btn btn--ghost" data-act="again">Try again</button></div>`;
      ctx.panel.querySelector('[data-act="again"]').addEventListener('click', () => route());
    }
  });
  board.setPosition(item.fen, { animate: false });
  board.setSquareMode(true);
  ctx.panel.innerHTML = `<p class="eyebrow">Structure</p><p class="tr-prompt">${esc(item.question)}</p><p class="tr-muted">Click or tap a square, or focus the board, move with the arrow keys and press Enter.</p><div class="tr-explain"></div>${footerLinks(ctx, item)}`;
}

/* ---------------- endgame practice against exact replies */
let tablesPromise = null;
async function endgameTables() {
  if (!tablesPromise) tablesPromise = (async () => {
    if (typeof DecompressionStream === 'undefined') throw new Error('This browser is too old for endgame practice. Please update it.');
    const core = await import('./tb-core.js');
    const out = {};
    for (const t of ['q', 'r', 'p']) {
      const res = await fetch(`/train/tb/${t}.bin.gz`);
      const stream = res.body.pipeThrough(new DecompressionStream('gzip'));
      const buf = new Uint8Array(await new Response(stream).arrayBuffer());
      out[t] = { w: buf.subarray(0, core.SIZE), b: buf.subarray(core.SIZE) };
    }
    return { core, tables: out };
  })();
  return tablesPromise;
}

async function practiceView(ctx, item) {
  const C = await Chess();
  ctx.panel.innerHTML = '<p class="tr-muted">Loading the endgame tables…</p>';
  let tb;
  try { tb = await endgameTables(); } catch (err) { ctx.panel.innerHTML = `<p class="tr-result tr-result--bad">${esc(err.message)}</p>`; return; }
  const { core, tables } = tb;
  const learner = item.fen.split(' ')[1];
  let game, history, finished, clean, learnerMoves, timers = [];
  const board = makeBoard(ctx, item, { label: `Endgame practice. ${item.prompt}`, onMove: (f, t, p) => onMove(f, t, p) });
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  const pieceCount = (fen) => fen.split(' ')[0].replace(/[^a-zA-Z]/g, '').length;

  // Table value for the side to move in `fen`: 'win' | 'draw' | 'loss', from that side's view.
  const status = (fen) => {
    if (pieceCount(fen) < 3) return 'draw';
    const pos = core.fromFen(fen);
    const v = core.probe(tables, pos);
    return v === 0 ? 'draw' : pos.strongToMove ? 'win' : 'loss';
  };
  const legal = (sq) => game.moves({ square: sq, verbose: true }).map((m) => ({ to: m.to, promotion: m.promotion }));

  const render = () => {
    ctx.panel.innerHTML = `<p class="eyebrow">Endgame practice</p><p class="tr-prompt">${esc(item.prompt)}</p>
      <p class="tr-muted">The trainer replies with exact best play from complete endgame tables.</p>
      <p class="tr-counter" aria-live="polite"></p>
      <div class="tr-feedback" role="status" aria-live="polite"></div>
      <div class="tr-row tr-tools-row"><button type="button" class="btn btn--ghost btn--small" data-act="hint">Hint</button><button type="button" class="btn btn--ghost btn--small" data-act="undo" disabled>Undo</button><button type="button" class="btn btn--ghost btn--small" data-act="idea">Show the idea</button><button type="button" class="btn btn--ghost btn--small" data-act="retry">Retry</button></div>
      <div class="tr-explain"></div>${footerLinks(ctx, item)}`;
  };
  const fb = (html, ok) => { const el = ctx.panel.querySelector('.tr-feedback'); el.className = `tr-feedback ${ok === true ? 'is-good' : ok === false ? 'is-bad' : ''}`; el.innerHTML = html; };
  const counter = () => {
    const el = ctx.panel.querySelector('.tr-counter');
    if (item.goal === 'draw' && item.holdMoves) el.textContent = `Moves held: ${learnerMoves} of ${item.holdMoves}`;
    else if (item.goal === 'win') el.textContent = `Moves played: ${learnerMoves} (50 allowed)`;
    else el.textContent = `Moves played: ${learnerMoves}`;
    const u = ctx.panel.querySelector('[data-act="undo"]'); if (u) u.disabled = finished || !history.length;
  };

  const reset = () => {
    timers.forEach(clearTimeout); timers = [];
    game = new C(item.fen); history = []; finished = false; clean = true; learnerMoves = 0;
    render(); board.setPosition(item.fen, { animate: false }); board.setMovable(learner, legal);
    fb('Your move.'); counter();
  };

  const end = (ok, text) => {
    finished = true; board.setMovable(null);
    store.recordResult(ctx.slug, item.id, { correct: ok, clean: ok && clean, inReview: ctx.reviewMode });
    ctx.panel.querySelector('.tr-explain').innerHTML = (ok ? successBlock(ctx, `<p><strong>${esc(text)}</strong></p>`) : `<div class="tr-result tr-result--bad" role="status">${icon(false)}<div><p><strong>${esc(text)}</strong> This position goes into your review queue.</p></div></div><div class="tr-row"><button type="button" class="btn btn--primary" data-act="retry">Retry</button><a class="btn btn--ghost" href="${ctx.nextHref}">${esc(ctx.nextLabel)}</a></div>`) + `<p class="tr-summary">${esc(item.explanation)}</p>`;
    counter();
  };

  const bestReply = () => {
    const pos = core.fromFen(game.fen());
    const moves = core.scoredMoves(tables, pos);
    if (!moves.length) return null;
    if (pos.strongToMove) {
      const wins = moves.filter((m) => m.value > 0).sort((a, b) => a.value - b.value);
      if (wins.length) return wins[0].uci;
      // Drawn: choose the try that gives the defender the most ways to go wrong.
      let best = null, bestScore = -1;
      for (const m of moves) {
        const g = new C(game.fen()); g.move({ from: m.uci.slice(0, 2), to: m.uci.slice(2, 4), promotion: m.uci[4] });
        if (pieceCount(g.fen()) < 3) continue;
        const replies = core.scoredMoves(tables, core.fromFen(g.fen()));
        const traps = replies.filter((r) => r.value > 0 && !r.captured).length;
        if (traps > bestScore) { bestScore = traps; best = m.uci; }
      }
      return best || moves[0].uci;
    }
    // Defender: a drawing move if one exists, otherwise the longest resistance.
    const draws = moves.filter((m) => m.value === 0);
    if (draws.length) return (draws.find((m) => m.captured) || draws[0]).uci;
    return moves.sort((a, b) => b.value - a.value)[0].uci;
  };

  const after = (uci) => {
    const mv = game.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
    history.push(uci);
    board.setPosition(game.fen(), { lastMove: uci });
    return mv;
  };

  function onMove(from, to, promotion) {
    if (finished) return;
    const uci = from + to + (promotion || '');
    const g = new C(game.fen());
    const mv = g.move({ from, to, promotion });
    const st = status(g.fen()); // from the trainer's view (trainer to move)
    const keeps = item.goal === 'win' ? (g.isCheckmate() || st === 'loss') : (st !== 'win');
    if (!keeps) {
      clean = false;
      board.setPosition(g.fen(), { lastMove: from + to }); board.feedback(to, false); board.setMovable(null);
      const why = item.goal === 'win' ? (g.isStalemate() ? 'stalemates the king, which is a draw' : 'lets the win slip') : 'loses the draw';
      fb(`${icon(false)} <strong>${esc(mv.san)}</strong> ${why}. The move is taken back: try another.`, false);
      board.say(`${mv.san} ${why}. Taken back.`);
      later(() => { board.setPosition(game.fen(), { animate: false }); board.clearMarks(); board.setMovable(learner, legal); }, 1200);
      return;
    }
    after(uci); learnerMoves++;
    board.feedback(to, true);
    fb(`${icon(true)} <strong>${esc(mv.san)}</strong> keeps the ${item.goal === 'win' ? 'win' : 'draw'}.`, true);
    counter();
    if (game.isCheckmate()) return end(true, 'Checkmate. Well converted.');
    if (item.goal === 'win' && mv.promotion && item.table === 'p') return end(true, 'The pawn promotes safely. The ending is won.');
    if (item.goal === 'draw' && (pieceCount(game.fen()) < 3 || game.isStalemate())) return end(true, pieceCount(game.fen()) < 3 ? 'The pawn is gone: a draw. Well defended.' : 'Stalemate: a draw. Well defended.');
    if (item.goal === 'draw' && item.holdMoves && learnerMoves >= item.holdMoves) return end(true, `You held the draw for ${item.holdMoves} moves.`);
    if (item.goal === 'draw' && !item.holdMoves && learnerMoves >= 12) return end(true, 'You stopped the pawn. Well defended.');
    if (game.isDrawByFiftyMoves() || game.isThreefoldRepetition()) return end(false, game.isThreefoldRepetition() ? 'The position repeated three times: a draw.' : 'Fifty moves without a capture or pawn move: a draw.');
    board.setMovable(null);
    later(() => {
      const r = bestReply();
      if (!r) return;
      const rm = after(r);
      board.say(`Reply: ${rm.san}`);
      if (item.goal === 'draw' && (pieceCount(game.fen()) < 3)) return end(true, 'The pawn is gone: a draw. Well defended.');
      if (game.isStalemate() && item.goal === 'draw') return end(true, 'Stalemate: a draw.');
      if (game.isDrawByFiftyMoves()) return end(false, 'Fifty moves without a capture or pawn move: a draw.');
      board.setMovable(learner, legal);
      fb(`${esc(rm.san)}. Your move.`);
    }, 500);
  }

  ctx.panel.addEventListener('click', (e) => {
    const a = e.target.closest('[data-act]'); if (!a) return;
    if (a.dataset.act === 'retry') reset();
    if (a.dataset.act === 'idea') { ctx.panel.querySelector('.tr-explain').innerHTML = `<p class="tr-summary">${esc(item.explanation)}</p>`; }
    if (a.dataset.act === 'hint' && !finished) {
      clean = false;
      const pos = core.fromFen(game.fen());
      const moves = core.scoredMoves(tables, pos);
      const good = item.goal === 'win' ? moves.filter((m) => m.value > 0).sort((x, y) => x.value - y.value) : moves.filter((m) => m.value === 0);
      if (good[0]) { board.clearHints(); board.highlightSquare(good[0].uci.slice(0, 2)); board.highlightSquare(good[0].uci.slice(2, 4), 'fc-hint fc-hint--to'); fb(`Hint: one good move goes from ${good[0].uci.slice(0, 2)} to ${good[0].uci.slice(2, 4)}.`); }
    }
    if (a.dataset.act === 'undo' && history.length && !finished) {
      game.undo(); history.pop();
      if (game.turn() !== learner && history.length) { game.undo(); history.pop(); }
      learnerMoves = Math.max(0, learnerMoves - 1);
      board.setPosition(game.fen(), { animate: false }); board.setMovable(learner, legal); fb('Move taken back. Your move.'); counter();
    }
  });
  reset();
  return () => timers.forEach(clearTimeout);
}

/* ---------------- opening explorer */
async function explorerView(ctx, item) {
  const C = await Chess();
  let path = [];
  const board = makeBoard(ctx, { orientation: item.side }, { label: 'Opening explorer. Play a move from the list on the board, or use the buttons.', onMove: (f, t, p) => {
    const kids = children(); const n = kids.find((k) => k.uci.slice(0, 4) === f + t);
    if (n) { path.push(n); show(true); }
  } });
  const children = () => (path.length ? path[path.length - 1].children : item.tree);
  const fenAt = () => { const g = new C(); for (const n of path) g.move(n.san); return g; };
  ctx.panel.innerHTML = `<p class="eyebrow">Line explorer</p><nav class="tr-path" aria-label="Moves so far"></nav><div class="tr-note" aria-live="polite"></div><div class="tr-branches"></div>
    <div class="tr-row tr-steps"><button type="button" class="btn btn--ghost btn--small" data-act="start">« Start</button><button type="button" class="btn btn--ghost btn--small" data-act="back">‹ Undo move</button></div>
    <p class="tr-muted">Ready to test yourself? The Drill section at the end of the course lets you play your side of every line.</p>${footerLinks(ctx, item)}`;
  const show = (animate) => {
    const g = fenAt();
    const last = path[path.length - 1];
    board.setPosition(g.fen(), { lastMove: last ? last.uci : null, animate });
    const kids = children();
    board.setMovable(kids.length ? g.turn() : null, (sq) => kids.filter((k) => k.uci.startsWith(sq)).map((k) => ({ to: k.uci.slice(2, 4), promotion: k.uci[4] })));
    const g2 = new C();
    ctx.panel.querySelector('.tr-path').innerHTML = path.length ? path.map((n, i) => { const lbl = g2.turn() === 'w' ? `${g2.moveNumber()}.` : (i === 0 ? `${g2.moveNumber()}...` : ''); g2.move(n.san); return `<button type="button" data-p="${i + 1}">${lbl}${esc(n.san)}</button>`; }).join(' ') : '<span class="tr-muted">Starting position</span>';
    ctx.panel.querySelector('.tr-note').innerHTML = last ? `<p><strong>${esc(last.san)}</strong> ${esc(last.note)}</p>` : '<p>Choose White’s first move to begin.</p>';
    ctx.panel.querySelector('.tr-branches').innerHTML = kids.length ? `<p class="tr-muted">${kids.length > 1 ? 'Choose a line:' : 'Next move:'}</p><div class="tr-row">${kids.map((k, i) => `<button type="button" class="btn ${i === 0 ? 'btn--primary' : 'btn--ghost'} btn--small" data-c="${i}">${esc(k.san)}${kids.length > 1 && i === 0 ? ' (main line)' : ''}</button>`).join('')}</div>` : `<div class="tr-result tr-result--good">${icon(true)}<div><p><strong>End of this line.</strong> Go back to explore another branch.</p></div></div>`;
    if (last) board.say(`${last.san}. ${last.note}`);
  };
  ctx.panel.addEventListener('click', (e) => {
    const c = e.target.closest('[data-c]'); const p = e.target.closest('[data-p]'); const a = e.target.closest('[data-act]');
    if (c) { path.push(children()[Number(c.dataset.c)]); show(true); }
    if (p) { path = path.slice(0, Number(p.dataset.p)); show(false); }
    if (a && a.dataset.act === 'start') { path = []; show(false); }
    if (a && a.dataset.act === 'back') { path.pop(); show(false); }
  });
  show(false);
}

/* ---------------- repertoire drill: one line */
async function drillView(ctx, item) {
  const C = await Chess();
  const line = item.line;
  let i, game, mistakes, finished, timers = [];
  const learner = item.side;
  const board = makeBoard(ctx, { orientation: learner }, { label: `Drill: play ${learner === 'w' ? 'White' : 'Black'}’s moves from the repertoire.`, onMove: (f, t, p) => onMove(f, t, p) });
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  const legal = (sq) => game.moves({ square: sq, verbose: true }).map((m) => ({ to: m.to, promotion: m.promotion }));
  const render = () => {
    ctx.panel.innerHTML = `<p class="eyebrow">Drill · ${esc(item.title)}</p><p class="tr-prompt">Play ${learner === 'w' ? 'White' : 'Black'}’s repertoire moves. The trainer plays the other side.</p><p class="tr-movetext" aria-live="polite"></p><div class="tr-feedback" role="status" aria-live="polite"></div><div class="tr-row tr-tools-row"><button type="button" class="btn btn--ghost btn--small" data-act="hint">Hint</button><button type="button" class="btn btn--ghost btn--small" data-act="retry">Retry</button></div><div class="tr-explain"></div>${footerLinks(ctx, { id: item.id })}`;
  };
  const fb = (html, ok) => { const el = ctx.panel.querySelector('.tr-feedback'); el.className = `tr-feedback ${ok === true ? 'is-good' : ok === false ? 'is-bad' : ''}`; el.innerHTML = html; };
  const moveText = () => { ctx.panel.querySelector('.tr-movetext').textContent = game.history().map((s, k) => (k % 2 === 0 ? `${k / 2 + 1}.${s}` : s)).join(' '); };
  const advance = () => {
    if (i >= line.length) {
      finished = true; board.setMovable(null);
      store.recordResult(ctx.slug, item.id, { correct: true, clean: mistakes === 0, inReview: ctx.reviewMode });
      ctx.panel.querySelector('.tr-explain').innerHTML = successBlock(ctx, `<p><strong>${mistakes ? `Line complete, with ${mistakes} ${mistakes === 1 ? 'correction' : 'corrections'}.` : 'Line complete, played from memory.'}</strong>${mistakes ? ' This line goes into your review queue.' : ''}</p>`);
      return;
    }
    const node = line[i];
    if (node.color === learner) { board.setMovable(learner, legal); return; }
    board.setMovable(null);
    later(() => { game.move(node.san); board.setPosition(game.fen(), { lastMove: node.uci }); board.say(`${node.san}. ${node.note}`); fb(`<strong>${esc(node.san)}</strong> ${esc(node.note)}`); moveText(); i++; advance(); }, i === 0 ? 300 : 650);
  };
  function onMove(from, to, promotion) {
    if (finished) return;
    const node = line[i];
    const uci = from + to + (promotion || '');
    if (node.uci === uci || node.uci.slice(0, 4) === uci) {
      game.move(node.san); board.setPosition(game.fen(), { lastMove: node.uci }); board.feedback(node.uci.slice(2, 4), true);
      fb(`${icon(true)} <strong>${esc(node.san)}</strong> ${esc(node.note)}`, true); moveText(); i++; board.setMovable(null); later(advance, 500);
    } else {
      mistakes++;
      const g = new C(game.fen()); let san = ''; try { san = g.move({ from, to, promotion }).san; } catch { /* not reachable */ }
      board.setPosition(g.fen(), { lastMove: from + to }); board.feedback(to, false); board.setMovable(null);
      fb(`${icon(false)} <strong>${esc(san)}</strong> isn’t this repertoire’s move. The repertoire plays <strong>${esc(node.san)}</strong>: ${esc(node.note)}`, false);
      later(() => { game.move(node.san); board.setPosition(game.fen(), { lastMove: node.uci }); board.clearMarks(); moveText(); i++; advance(); }, 2200);
    }
  }
  const reset = () => {
    timers.forEach(clearTimeout); timers = [];
    game = new C(); i = 0; mistakes = 0; finished = false;
    render(); board.setPosition(game.fen(), { animate: false }); fb('The line starts from the initial position.'); advance();
  };
  ctx.panel.addEventListener('click', (e) => {
    const a = e.target.closest('[data-act]'); if (!a) return;
    if (a.dataset.act === 'retry') reset();
    if (a.dataset.act === 'hint' && !finished && line[i] && line[i].color === learner) { mistakes = Math.max(mistakes, 1); board.highlightSquare(line[i].uci.slice(0, 2)); fb(`Hint: the move starts from ${line[i].uci.slice(0, 2)}.`); }
  });
  reset();
  return () => timers.forEach(clearTimeout);
}

/* ================================================================ Router */
async function route() {
  const h = location.hash.replace(/^#\/?/, '');
  const parts = h.split('/').filter(Boolean);
  try {
    if (parts[0] === 'c' && parts[1]) {
      const slug = parts[1];
      if (!COURSES.includes(slug)) { location.hash = '#/'; return; }
      if (parts[2] === 'start') {
        const course = store.owns(slug) ? await loadCourse(slug) : null;
        location.replace(course ? `#/c/${slug}/s/${course.sections[0].id}` : `#/c/${slug}`);
        return;
      }
      if (parts[2] === 's') return await renderSection(slug, parts[3], Number(parts[4] || 0));
      if (parts[2] === 'review') return await renderSection(slug, null, Number(parts[3] || 0), true);
      return await renderOverview(slug);
    }
    return await renderRoom();
  } catch (err) {
    setView(`<section class="tr-room"><div class="container tr-narrow"><h1>Something went wrong</h1><p class="lede">This part of the trainer couldn’t load. If you are offline, open it once while online so it can be saved for offline use.</p><p class="tr-muted">${esc(err.message)}</p><a class="btn btn--primary" href="#/">Back to the Training Room</a></div></section>`);
  }
}

if (store.getSetting('largeUi')) document.documentElement.classList.add('ui-large');
store.requestPersistence();
window.addEventListener('hashchange', route);
route();
