// Generates the static Fiancho Chess site. Output is plain HTML; no build step is needed to serve it.
import fs from 'node:fs';
import path from 'node:path';
import { products, studyOrder } from './content.mjs';

const OUT = process.argv[2];
const SITE = 'https://discordaccslog-max.github.io/nst-course/';
const UPDATED = 'November 8, 2026';
const UPDATED_ISO = '2026-11-08';
const REVISED = { 'terms.html': ['November 11, 2026', '2026-11-11'], 'delivery-policy.html': ['November 11, 2026', '2026-11-11'], 'faq.html': ['November 11, 2026', '2026-11-11'] };
const updatedFor = (file) => REVISED[file] || [UPDATED, UPDATED_ISO];
const YEAR = 2026;
const HAS_OG_IMAGE = fs.existsSync(path.join(OUT, 'og-image.png'));

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const r = (n) => Math.round(n * 100) / 100;
const usd = (n) => `$${n}`;
const byId = Object.fromEntries(products.map((p) => [p.id, p]));

/* ------------------------------------------------------------------ */
/* Chess pieces: original SVG shapes (100 x 100 symbols)               */
/* ------------------------------------------------------------------ */
const BASE = '<rect x="22" y="76" width="56" height="11" rx="4"/>';
const SYMBOLS = {
  p: `<circle cx="50" cy="30" r="13"/><rect x="35" y="43" width="30" height="8" rx="3"/><path d="M41 50h18l9 27H32z"/>${BASE}`,
  r: `<path d="M27 16h11v8h7v-8h10v8h7v-8h11v20H27z"/><path d="M33 35h34l-2 32H35z"/><path d="M30 65h40l6 12H24z"/>${BASE}`,
  n: `<path d="M30 77c1-14 7-22 16-29-7 2-13 4-19 9-6-2-9-8-6-14 6-10 15-18 22-24l2-9 6 7c15 3 25 17 25 36 0 9-1 17-2 24z"/>${BASE}<circle cx="41" cy="31" r="3.4" fill="currentColor"/><circle cx="26.5" cy="45" r="1.9" fill="currentColor"/>`,
  b: `<circle cx="50" cy="14" r="6"/><path d="M50 20c-11 9-16 19-14 29 1 4 3 7 5 8h18c2-1 4-4 5-8 2-10-3-20-14-29z"/><rect x="34" y="55" width="32" height="8" rx="3"/><path d="M40 62h20l8 15H32z"/>${BASE}<rect x="49" y="27" width="4" height="15" rx="2" transform="rotate(38 51 34.5)" fill="currentColor"/>`,
  q: `<circle cx="18" cy="29" r="5.5"/><circle cx="34" cy="19" r="5.5"/><circle cx="50" cy="14" r="5.5"/><circle cx="66" cy="19" r="5.5"/><circle cx="82" cy="29" r="5.5"/><path d="M18 32l14 32h36l14-32-14 14-2-24-10 20-6-24-6 24-10-20-2 24z"/><rect x="30" y="62" width="40" height="8" rx="3"/><path d="M33 69h34l7 8H26z"/>${BASE}`,
  k: `<rect x="46" y="3" width="8" height="22" rx="2"/><rect x="38" y="9" width="24" height="8" rx="2"/><path d="M50 25c-14 0-23 9-21 21l4 17h34l4-17c2-12-7-21-21-21z"/><rect x="30" y="61" width="40" height="8" rx="3"/><path d="M33 68h34l7 9H26z"/>${BASE}`
};

const sprite = () =>
  `<svg class="sprite" aria-hidden="true" focusable="false"><defs>${Object.entries(SYMBOLS)
    .map(([k, v]) => `<symbol id="s-${k}" viewBox="0 0 100 100">${v}</symbol>`)
    .join('')}</defs></svg>`;

const pieceUses = (type) =>
  `<use href="#s-${type}" class="po" width="100" height="100"/><use href="#s-${type}" class="pf" width="100" height="100"/>`;

const pieceAt = (type, color, x, y, size) =>
  `<g class="pc pc--${color}" transform="translate(${r(x)} ${r(y)}) scale(${r(size / 100)})">${pieceUses(type)}</g>`;

function parseFen(fen) {
  const [placement, side] = fen.split(' ');
  const pieces = [];
  placement.split('/').forEach((row, ri) => {
    let f = 0;
    for (const ch of row) {
      if (/\d/.test(ch)) f += Number(ch);
      else {
        pieces.push({ type: ch.toLowerCase(), color: ch === ch.toUpperCase() ? 'w' : 'b', file: f, row: ri });
        f += 1;
      }
    }
  });
  return { pieces, side };
}

function diagram(fen, x, y, size, { coords = true } = {}) {
  const sq = size / 8;
  const { pieces } = parseFen(fen);
  let s = `<rect x="${r(x - 1.5)}" y="${r(y - 1.5)}" width="${r(size + 3)}" height="${r(size + 3)}" class="pv-edge"/>`;
  for (let row = 0; row < 8; row++) {
    for (let f = 0; f < 8; f++) {
      s += `<rect x="${r(x + f * sq)}" y="${r(y + row * sq)}" width="${r(sq)}" height="${r(sq)}" class="${(f + row) % 2 === 0 ? 'pv-l' : 'pv-d'}"/>`;
    }
  }
  const pad = sq * 0.06;
  for (const p of pieces) s += pieceAt(p.type, p.color, x + p.file * sq + pad, y + p.row * sq + pad, sq - pad * 2);
  if (coords) {
    'abcdefgh'.split('').forEach((l, i) => {
      s += `<text x="${r(x + i * sq + sq / 2)}" y="${r(y + size + 10)}" text-anchor="middle" class="pv-coord">${l}</text>`;
    });
    for (let i = 0; i < 8; i++) {
      s += `<text x="${r(x - 7)}" y="${r(y + i * sq + sq / 2 + 2.3)}" text-anchor="middle" class="pv-coord">${8 - i}</text>`;
    }
  }
  return s;
}

/* ------------------------------------------------------------------ */
/* Preview page illustrations                                          */
/* ------------------------------------------------------------------ */
function pageSvg(id, run, title, desc, inner) {
  return `<svg viewBox="0 0 300 390" role="img" aria-labelledby="${id}-t ${id}-d"><title id="${id}-t">${esc(title)}</title><desc id="${id}-d">${esc(desc)}</desc><rect width="300" height="390" fill="#fbf8f0"/><text x="24" y="27" class="pv-run">FIANCHO CHESS</text><text x="276" y="27" text-anchor="end" class="pv-run">${esc(run.toUpperCase())}</text><line x1="24" y1="35" x2="276" y2="35" class="pv-rule"/>${inner}</svg>`;
}

function sideDot(side, x, y) {
  return `<circle cx="${x}" cy="${y}" r="4.5" class="${side.startsWith('White') ? 'pv-dot-w' : 'pv-dot-b'}"/>`;
}

function diagramPage(id, run, d) {
  const inner =
    `<text x="24" y="58" class="pv-label">TRAINING POSITION</text>` +
    `<text x="24" y="78" class="pv-h">${esc(d.side)}</text>` +
    sideDot(d.side, 270, 74) +
    diagram(d.fen, 46, 92, 208) +
    `<text x="24" y="338" class="pv-body">${esc(d.task)}</text>` +
    `<text x="24" y="356" class="pv-note">${esc(d.note)}</text>`;
  return pageSvg(id, run, `Preview of a training position page: ${d.side.toLowerCase()}`, `A workbook page showing a chessboard diagram, ${d.side.toLowerCase()}, with the task: ${d.task}`, inner);
}

function solutionPage(id, run, s) {
  let inner =
    `<text x="24" y="58" class="pv-label">WORKED SOLUTION</text>` +
    `<text x="24" y="78" class="pv-h">${esc(s.title)}</text>` +
    diagram(s.fen, 25, 92, 104, { coords: false }) +
    `<text x="146" y="104" class="pv-label">POSITION</text>` +
    `<text x="146" y="119" class="pv-body">${esc(s.side)}</text>` +
    `<text x="146" y="142" class="pv-label">THEME</text>`;
  s.theme.forEach((t, i) => {
    inner += `<text x="146" y="${157 + i * 14}" class="pv-body">${esc(t)}</text>`;
  });
  let y = 222;
  inner += `<line x1="24" y1="${y - 14}" x2="276" y2="${y - 14}" class="pv-rule"/>`;
  for (const e of s.entries) {
    inner += `<text x="24" y="${y}" class="pv-move">${esc(e.move)}</text>`;
    y += 15;
    for (const l of e.lines) {
      inner += `<text x="24" y="${y}" class="pv-body">${esc(l)}</text>`;
      y += 14;
    }
    y += 8;
  }
  const text = s.entries.map((e) => `${e.move} ${e.lines.join(' ')}`).join(' ');
  return pageSvg(id, run, `Preview of a worked solution page: ${s.title}`, `A workbook page with a small diagram and the worked solution. ${text}`, inner);
}

function explanationPage(id, run, ex) {
  let inner = `<text x="24" y="58" class="pv-label">EXPLANATION</text><text x="24" y="84" class="pv-h2">${esc(ex.title)}</text><line x1="24" y1="96" x2="60" y2="96" class="pv-accent"/>`;
  let y = 120;
  for (const l of ex.para) {
    inner += `<text x="24" y="${y}" class="pv-body">${esc(l)}</text>`;
    y += 15.5;
  }
  y += 8;
  const boxH = ex.key.length * 15 + 34;
  inner += `<rect x="24" y="${y}" width="252" height="${boxH}" rx="4" class="pv-box"/><rect x="24" y="${y}" width="3" height="${boxH}" class="pv-bar"/>`;
  inner += `<text x="38" y="${y + 19}" class="pv-label">KEY IDEA</text>`;
  ex.key.forEach((l, i) => {
    inner += `<text x="38" y="${y + 36 + i * 15}" class="pv-body">${esc(l)}</text>`;
  });
  y += boxH + 26;
  for (const l of ex.para2) {
    inner += `<text x="24" y="${y}" class="pv-body">${esc(l)}</text>`;
    y += 15.5;
  }
  const text = [...ex.para, 'Key idea:', ...ex.key, ...ex.para2].join(' ');
  return pageSvg(id, run, `Preview of an explanation page: ${ex.title}`, `A workbook page from the explanations. ${text}`, inner);
}

/* ------------------------------------------------------------------ */
/* Hero board: 1.e4 e5 2.Bc4 Nc6 3.Qh5 Nf6 4.Qxf7#                     */
/* ------------------------------------------------------------------ */
function heroBoard() {
  const start = [];
  const back = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
  const files = 'abcdefgh';
  for (const color of ['b', 'w']) {
    back.forEach((t, i) => {
      const id = t === 'q' || t === 'k' ? `${color}${t}` : `${color}${t}-${files[i]}`;
      start.push({ id, type: t, color, sq: `${files[i]}${color === 'w' ? 1 : 8}` });
    });
    for (let i = 0; i < 8; i++) start.push({ id: `${color}p-${files[i]}`, type: 'p', color, sq: `${files[i]}${color === 'w' ? 2 : 7}` });
  }
  const finalSq = { 'wp-e': 'e4', 'bp-e': 'e5', 'wb-f': 'c4', 'bn-b': 'c6', wq: 'f7', 'bn-g': 'f6' };
  const xy = (sq) => [(sq.charCodeAt(0) - 97) * 100, (8 - Number(sq[1])) * 100];
  let squares = '';
  for (let row = 0; row < 8; row++) {
    for (let f = 0; f < 8; f++) {
      squares += `<rect x="${f * 100}" y="${row * 100}" width="100" height="100" class="${(f + row) % 2 === 0 ? 'sq-l' : 'sq-d'}"/>`;
    }
  }
  let coords = '';
  for (let i = 0; i < 8; i++) {
    coords += `<text x="${i * 100 + 50}" y="836" text-anchor="middle" class="hb-coord">${files[i]}</text>`;
    coords += `<text x="-22" y="${i * 100 + 56}" text-anchor="middle" class="hb-coord">${8 - i}</text>`;
  }
  const pieces = start
    .map((p) => {
      const sq = finalSq[p.id] || p.sq;
      const [x, y] = xy(sq);
      const hidden = p.id === 'bp-f' ? ';opacity:0' : '';
      return `<g class="hb-piece pc pc--${p.color}" data-piece="${p.id}" data-start="${p.sq}" style="transform:translate(${x}px, ${y}px)${hidden}"><g transform="translate(6 6) scale(.88)">${pieceUses(p.type)}</g></g>`;
    })
    .join('');
  return `<svg viewBox="-44 -6 852 856" role="img" aria-labelledby="hb-title hb-desc"><title id="hb-title">Chessboard showing a four-move checkmate</title><desc id="hb-desc">A chessboard on which White plays 1.e4 e5 2.Bc4 Nc6 3.Qh5 Nf6 4.Qxf7, checkmate. The white queen on f7, protected by the bishop on c4, attacks the black king on e8.</desc>${coords}${squares}<rect x="-2" y="-2" width="804" height="804" class="hb-border"/><rect class="hb-hl is-on" data-hl="from" width="100" height="100" style="transform:translate(700px, 300px)"/><rect class="hb-hl is-on" data-hl="to" width="100" height="100" style="transform:translate(500px, 100px)"/><rect class="hb-mate is-on" data-mate x="404" y="4" width="92" height="92" rx="8"/><g class="hb-pieces">${pieces}</g></svg>`;
}

/* ------------------------------------------------------------------ */
/* Shared layout                                                       */
/* ------------------------------------------------------------------ */
const brandMark = (cls = '') =>
  `<svg class="brand__mark ${cls}" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><use href="#s-n" class="brand__mark-piece" width="100" height="100"/></svg>`;

const NAV = [
  ['index.html#courses', 'Courses', 'courses'],
  ['about.html', 'About', 'about'],
  ['faq.html', 'FAQ', 'faq'],
  ['contact.html', 'Contact', 'contact']
];

function header(active) {
  const links = NAV.map(([href, label, key]) => `<li><a href="${href}"${key === active ? ' aria-current="page"' : ''}>${label}</a></li>`).join('');
  return `<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header" data-header>
  <div class="site-header__bg" aria-hidden="true"></div>
  <div class="container site-header__inner">
    <a class="brand" href="index.html" aria-label="Fiancho Chess home">${brandMark()}<span class="brand__name">Fiancho Chess</span></a>
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav"><span class="nav-toggle__bars" aria-hidden="true"></span><span class="visually-hidden">Menu</span></button>
    <nav id="site-nav" class="site-nav" aria-label="Main"><ul>${links}</ul></nav>
  </div>
</header>`;
}

function footer() {
  const courseLinks = products.map((p) => `<li><a href="${p.file}">${esc(p.name)}</a></li>`).join('');
  return `<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        <a class="brand" href="index.html" aria-label="Fiancho Chess home">${brandMark()}<span class="brand__name">Fiancho Chess</span></a>
        <p>Self-paced chess training courses: PDF workbooks with worked solutions and PGN files of every position. Self-study material, delivered as a digital download.</p>
        <p class="footer-email" data-support-email hidden><span data-email-link></span></p>
      </div>
      <nav aria-label="Courses">
        <h2 class="footer-heading">Courses</h2>
        <ul class="footer-links">${courseLinks}</ul>
      </nav>
      <nav aria-label="Information">
        <h2 class="footer-heading">Information</h2>
        <ul class="footer-links"><li><a href="about.html">About</a></li><li><a href="faq.html">FAQ</a></li><li><a href="contact.html">Contact</a></li></ul>
      </nav>
      <nav aria-label="Policies">
        <h2 class="footer-heading">Policies</h2>
        <ul class="footer-links"><li><a href="terms.html">Terms</a></li><li><a href="privacy.html">Privacy</a></li><li><a href="refund-policy.html">Refunds</a></li><li><a href="delivery-policy.html">Delivery</a></li><li><a href="disclaimer.html">Disclaimer</a></li><li><a href="contact.html">Contact</a></li></ul>
      </nav>
    </div>
    <div class="footer-bottom">
      <p>&copy; <span data-year>${YEAR}</span> Fiancho Chess. All rights reserved.</p>
      <p>Prices in USD. Applicable taxes are calculated at checkout.</p>
    </div>
  </div>
</footer>`;
}

function layout({ file, title, description, active = '', body, is404 = false }) {
  const url = file === 'index.html' ? SITE : SITE + file;
  const baseScript = is404
    ? `<script>(function(){var p=location.pathname.split('/');var b=/\\.github\\.io$/i.test(location.hostname)&&p.length>2&&p[1]?'/'+p[1]+'/':'/';var e=document.createElement('base');e.href=b;document.head.appendChild(e);})();</script>\n  `
    : '';
  const ogImage = HAS_OG_IMAGE
    ? `\n  <meta property="og:image" content="${SITE}og-image.png">\n  <meta property="og:image:width" content="1200">\n  <meta property="og:image:height" content="630">\n  <meta property="og:image:alt" content="Fiancho Chess: self-paced chess training courses">\n  <meta name="twitter:card" content="summary_large_image">`
    : `\n  <meta name="twitter:card" content="summary">`;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  ${baseScript}<title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  ${is404 ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${url}">`}
  <meta name="theme-color" content="#1d4a36" media="(prefers-color-scheme: light)">
  <meta name="theme-color" content="#101511" media="(prefers-color-scheme: dark)">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Fiancho Chess">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${is404 ? SITE : url}">${ogImage}
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <link rel="icon" href="favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&amp;family=Inter:wght@400;500;600;700&amp;display=swap">
  <link rel="stylesheet" href="css/styles.css">
  <script>document.documentElement.classList.add('js');</script>
</head>
<body>
${sprite()}
${header(active)}
<main id="main" tabindex="-1">
${body}
</main>
${footer()}
<script src="js/site-config.js"></script>
<script src="js/products.js"></script>
<script src="js/main.js"></script>
</body>
</html>
`;
}

function write(file, html) {
  fs.mkdirSync(path.dirname(path.join(OUT, file)), { recursive: true });
  fs.writeFileSync(path.join(OUT, file), html);
}

/* ------------------------------------------------------------------ */
/* Reusable blocks                                                     */
/* ------------------------------------------------------------------ */
function courseIcon(p) {
  const tile = p.icon.library ? 'icon-tile--gold' : p.icon.color === 'b' ? 'icon-tile--alt' : 'icon-tile';
  return `<svg class="course-card__icon" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><rect width="100" height="100" rx="20" class="icon-tile ${tile}"/>${pieceAt(p.icon.type, p.icon.color, 14, 12, 72)}</svg>`;
}

function courseCard(p, i) {
  return `<li class="reveal" style="--i:${i}"><article class="course-card">
  <div class="course-card__top">${courseIcon(p)}<span class="level">${esc(p.level)}</span></div>
  <h3><a href="${p.file}">${esc(p.name)}</a></h3>
  <p>${esc(p.card)}</p>
  <div class="course-card__foot"><span class="course-card__price"><span class="visually-hidden">Price: </span><span data-price-for="${p.id}">${usd(p.price)}</span></span><span class="course-card__more" aria-hidden="true">View course</span></div>
</article></li>`;
}

const selfStudyChips = `<ul class="chips"><li>PDF workbook</li><li>PGN files</li><li>No video</li><li>No live instruction</li><li>No coaching</li><li>No feedback on your games</li></ul>`;

function faqItem(q, a, open = false) {
  return `<details class="faq-item"${open ? ' open' : ''}><summary>${esc(q)}</summary><div class="faq-item__body">${a}</div></details>`;
}

const FEATURE_ICONS = {
  pdf: `<svg class="feature__icon" viewBox="0 0 54 54" aria-hidden="true" focusable="false"><path class="fi-stroke" d="M27 14c-5-4-12-5-20-4v30c8-1 15 0 20 4 5-4 12-5 20-4V10c-8-1-15 0-20 4z"/><path class="fi-stroke" d="M27 14v30"/><rect class="fi-fill" x="12" y="18" width="5" height="5"/><rect class="fi-fill" x="17" y="23" width="5" height="5"/><rect class="fi-fill" x="12" y="28" width="5" height="5"/><path class="fi-stroke" d="M32 20h9M32 26h9M32 32h6"/></svg>`,
  pgn: `<svg class="feature__icon" viewBox="0 0 54 54" aria-hidden="true" focusable="false"><path class="fi-stroke" d="M13 6h20l10 10v32H13z"/><path class="fi-stroke" d="M33 6v10h10"/><path class="fi-stroke" d="M19 26h18M19 32h18M19 38h11"/><rect class="fi-fill" x="19" y="13" width="7" height="7" rx="1"/></svg>`,
  solution: `<svg class="feature__icon" viewBox="0 0 54 54" aria-hidden="true" focusable="false"><circle class="fi-stroke" cx="27" cy="27" r="20"/><path class="fi-stroke" d="M18 27.5l6 6 12-13"/><circle class="fi-fill" cx="43" cy="11" r="5"/></svg>`
};


/* ------------------------------------------------------------------ */
/* FAQ content                                                         */
/* ------------------------------------------------------------------ */
const FAQ = {
  afterPurchase: ['What do I receive after I pay, and how?', `<p>Right after your payment is confirmed, the payment provider&rsquo;s order confirmation screen shows a download link for your course, and the same link is emailed to the address you used at checkout. The link downloads a single .zip file containing the course&rsquo;s PDF workbook and PGN files (for the Complete Training Library, all seven courses, each in its own folder).</p><p>There is no license key, no account and no physical shipment. If the email doesn&rsquo;t arrive within an hour, check your spam folder, then contact us through the <a href="contact.html">Contact page</a> and we&rsquo;ll resend the link. The full steps are in the <a href="delivery-policy.html">Delivery Policy</a>.</p>`],
  receive: ['What exactly do I receive?', `<p>A single .zip file containing a PDF workbook and PGN files. The PDF holds the explanations, board diagrams, training positions and fully worked solutions. The PGN files hold every position and line from the course, so you can play through them in any chess software or online analysis board that opens PGN files. The Complete Training Library contains all seven courses, each in its own folder.</p>`],
  delivery: ['How is the course delivered?', `<p>Every course is a digital download. Right after payment, a download link appears on the order confirmation screen and is sent to the email address you used at checkout. Nothing is shipped. The full details are in the <a href="delivery-policy.html">Delivery Policy</a>.</p>`],
  open: ['How do I open the PDF and PGN files?', `<p>First unzip the download. On most computers you can double-click the .zip file; on phones and tablets the built-in files app can usually extract it.</p><p>The PDF opens in any PDF reader, including the one built into most web browsers. PGN is the standard text format for chess games and positions: open the PGN files in any chess software or online analysis board that imports PGN, and you can step through every move. Because PGN is plain text, you can also read it in any text editor.</p>`],
  level: ['Which level should I start with?', `<p>Each course states its level: beginner, intermediate or advanced. If you know how the pieces move and are newer to structured study, start with <a href="tactics-fundamentals.html">Tactics Fundamentals</a> or <a href="checkmate-patterns.html">Checkmate Patterns</a>. <a href="endgame-essentials.html">Endgame Essentials</a> runs from beginner to intermediate. The two opening repertoires are intermediate, and <a href="positional-play-strategy.html">Positional Play &amp; Strategy</a> and <a href="calculation-visualization.html">Calculation &amp; Visualization Training</a> run from intermediate to advanced.</p><p>Every course page also lists who the course is for and who it isn&rsquo;t for, so you can check before buying.</p>`],
  video: ['Is there any video, live instruction or coaching?', `<p>No. Fiancho Chess products are written self-study materials: a PDF workbook and PGN files. There is no video, no live instruction, no coaching, and no feedback on your games. You work through the material on your own, at your own pace.</p>`],
  updated: ['Are the courses updated?', `<p>Yes, when there is a reason to. If we correct an error or improve a section, we release an updated version of that course. If you bought an earlier version, you can request the updated files free of charge through the <a href="contact.html">Contact page</a>.</p>`],
  error: ['What happens if I find an error in the analysis?', `<p>Please tell us through the <a href="contact.html">Contact page</a>, with the course name and where the error appears (the chapter and the position or diagram). Every report is checked. If the analysis needs correcting, the correction goes into an updated version of the course, which every buyer can request free of charge.</p>`],
  print: ['Can I print the workbook?', `<p>Yes. Your license lets you print copies of the PDF for your own study.</p>`],
  coaches: ['Can coaches or clubs use the courses with students?', `<p>A standard purchase is a personal license. It covers your own study and doesn&rsquo;t allow sharing the files or copies with students or club members. If you are a coach, school or club and want to use the material with others, contact us through the <a href="contact.html">Contact page</a> to ask about a separate license.</p>`],
  refunds: ['What is your refund policy?', `<p>You can request a full refund on any purchase within 14 days, no reason required. Send your request through the <a href="contact.html">Contact page</a> with your order number. Refunds go back to your original payment method and are issued within 5 business days of your request; your payment provider&rsquo;s processing time may add a few days. Nothing needs to be returned. If a file is damaged or won&rsquo;t open, we can send a replacement instead if you prefer. See the <a href="refund-policy.html">Refund Policy</a> for details.</p>`],
  missing: ['My download hasn’t arrived. What should I do?', `<p>The download link is sent by email immediately after payment and is also shown on the order confirmation screen. If the email hasn&rsquo;t arrived within an hour, check your spam or junk folder. If it isn&rsquo;t there, contact us through the <a href="contact.html">Contact page</a> with your order number and the email address you used at checkout, and we&rsquo;ll resend the link.</p>`],
  taxes: ['Are taxes included in the price?', `<p>Prices are shown in US dollars. Applicable taxes are calculated at checkout, before you complete payment.</p>`],
  account: ['Do I need an account?', `<p>No. There are no accounts on this website. You choose a course, pay at checkout, and download your files.</p>`]
};

/* ------------------------------------------------------------------ */
/* Home                                                                */
/* ------------------------------------------------------------------ */
function homePage() {
  const plies = ['1.e4', 'e5', '2.Bc4', 'Nc6', '3.Qh5', 'Nf6', '4.Qxf7#'];
  const plyHtml = plies.map((p, i) => `<span data-ply="${i}"${i === plies.length - 1 ? ' class="is-current"' : ''}>${p}</span>`).join(' ');
  const body = `
<section class="hero">
  <div class="container hero__grid">
    <div class="hero__copy">
      <p class="eyebrow">Self-paced chess training</p>
      <h1>Chess courses you study at your own board, at your own pace.</h1>
      <p class="lede">Fiancho Chess makes written training courses. Each one is a PDF workbook with clear explanations, board diagrams, training positions and fully worked solutions, plus PGN files of every position and line. You download it and work through it yourself.</p>
      <div class="hero__actions">
        <a class="btn btn--primary" href="#courses">Browse the courses</a>
        <a class="text-link" href="#how-it-works">How purchase and delivery work</a>
      </div>
      <dl class="hero__facts">
        <div><dt>Format</dt><dd>PDF workbook + PGN files</dd></div>
        <div><dt>Delivery</dt><dd>Instant digital download</dd></div>
        <div><dt>Refunds</dt><dd><a href="refund-policy.html">14-day refund policy</a></dd></div>
      </dl>
    </div>
    <figure class="hero-board">
      <div class="hero-board__plate" data-hero-board>${heroBoard()}</div>
      <figcaption><span class="hero-board__label">Diagram</span><span class="hero-board__text">A four-move checkmate against the f7-square.</span><span class="hb-moves">${plyHtml}</span></figcaption>
    </figure>
  </div>
</section>

<section class="band" aria-labelledby="self-study-heading">
  <div class="container notice">
    <div>
      <p class="eyebrow">Please read before buying</p>
      <h2 id="self-study-heading">Self-study material, plainly stated</h2>
    </div>
    <div>
      <p>Every Fiancho Chess product is a written workbook with PGN files. There is no video, no live instruction, no coaching, and no feedback on your games. You read the explanations, work through the training positions on your own, and check your answers against the worked solutions.</p>
      ${selfStudyChips}
    </div>
  </div>
</section>

<section class="section" id="courses" aria-labelledby="courses-heading">
  <div class="container">
    <div class="section-head">
      <p class="eyebrow">The courses</p>
      <h2 id="courses-heading">Eight products, one consistent format</h2>
      <p>Seven individual courses and a complete library of all seven. Every course comes in the same format, and each page states the level, the full contents and the price before any purchase step.</p>
    </div>
    <ul class="course-grid">
      ${products.map(courseCard).join('\n      ')}
    </ul>
  </div>
</section>

<section class="section section--alt" id="included" aria-labelledby="included-heading">
  <div class="container">
    <div class="section-head">
      <p class="eyebrow">In every course</p>
      <h2 id="included-heading">What&rsquo;s included in every course</h2>
      <p>Each course is delivered as a single .zip file. Inside are two things that work together: a workbook to read and PGN files to play through.</p>
    </div>
    <ul class="feature-grid">
      <li class="reveal" style="--i:0"><div class="feature">${FEATURE_ICONS.pdf}<h3>PDF workbook</h3><p>Written explanations of each idea, board diagrams wherever a position needs to be seen, and training positions grouped by theme. Read it on screen or print it for your own study.</p></div></li>
      <li class="reveal" style="--i:1"><div class="feature">${FEATURE_ICONS.pgn}<h3>PGN files</h3><p>Every example, training position and solution line in standard PGN format, ready to load into any chess software or online analysis board that opens PGN files.</p></div></li>
      <li class="reveal" style="--i:2"><div class="feature">${FEATURE_ICONS.solution}<h3>Worked solutions</h3><p>Each training position has a fully worked solution: the main line, the important defensive tries, and a plain explanation of why the moves work.</p></div></li>
    </ul>
  </div>
</section>

<section class="section" id="how-it-works" aria-labelledby="how-heading">
  <div class="container">
    <div class="section-head">
      <p class="eyebrow">Purchase and delivery</p>
      <h2 id="how-heading">How purchase and delivery work</h2>
      <p>There are no accounts to create and nothing is shipped. You pay once and download your files.</p>
    </div>
    <ol class="steps">
      <li class="reveal" style="--i:0"><div class="step"><span class="step__num" aria-hidden="true">01</span><h3>Choose a course</h3><p>Each course page lists the full contents, the level, the format and the price, so you can decide before you buy.</p></div></li>
      <li class="reveal" style="--i:1"><div class="step"><span class="step__num" aria-hidden="true">02</span><h3>Pay at checkout</h3><p>Payment is handled by a third-party payment provider. Applicable taxes are calculated at checkout.</p></div></li>
      <li class="reveal" style="--i:2"><div class="step"><span class="step__num" aria-hidden="true">03</span><h3>Download right away</h3><p>A download link appears on the order confirmation screen and is emailed to you immediately after payment.</p></div></li>
      <li class="reveal" style="--i:3"><div class="step"><span class="step__num" aria-hidden="true">04</span><h3>Study at your own pace</h3><p>Unzip the file, open the PDF in any PDF reader, and load the PGN files into the chess software you already use.</p></div></li>
    </ol>
    <p class="after-steps">Every purchase is covered by a <a href="refund-policy.html">14-day refund policy</a>, no reason required. Full delivery details are in the <a href="delivery-policy.html">Delivery Policy</a>.</p>
  </div>
</section>

<section class="section section--alt" id="faq" aria-labelledby="faq-heading">
  <div class="container">
    <div class="section-head">
      <p class="eyebrow">Questions</p>
      <h2 id="faq-heading">Frequently asked questions</h2>
    </div>
    <div class="faq-list">
      ${[FAQ.afterPurchase, FAQ.receive, FAQ.video, FAQ.missing].map(([q, a]) => faqItem(q, a)).join('\n      ')}
    </div>
    <p class="section-foot"><a class="text-link" href="faq.html">Read all questions</a></p>
  </div>
</section>`;
  write('index.html', layout({
    file: 'index.html',
    title: 'Fiancho Chess | Self-Paced Chess Training Courses (PDF + PGN)',
    description: 'Self-paced chess training courses from Fiancho Chess: PDF workbooks with explanations, diagrams, training positions and worked solutions, plus PGN files. Self-study, no video.',
    active: '',
    body
  }));
}

/* ------------------------------------------------------------------ */
/* Product pages                                                       */
/* ------------------------------------------------------------------ */
function productPage(p) {
  const isLibrary = p.id === 'complete-training-library';
  const runFor = (k) => (p.preview.runFrom ? p.preview.runFrom[k] : p.run);
  const previews = [
    ['Training position', 'A board diagram with the task stated underneath, the way every training position is set out.', diagramPage(`pv-${p.id}-1`, runFor('diagram'), p.preview.diagram.diagram)],
    ['Worked solution', 'The full solution line with the defensive tries and a plain-language explanation of each step.', solutionPage(`pv-${p.id}-2`, runFor('solution'), p.preview.solution.solution)],
    ['From the explanations', 'An explanation section introducing an idea, with a key point set apart for quick review.', explanationPage(`pv-${p.id}-3`, runFor('explanation'), p.preview.explanation.explanation)]
  ];

  const contentsHtml = isLibrary
    ? `<ol class="contents-list">${products
        .filter((x) => x.id !== p.id)
        .map((x) => `<li><div><h3><a href="${x.file}">${esc(x.name)}</a></h3><p><strong>${esc(x.level)}.</strong> ${esc(x.card)}</p></div></li>`)
        .join('')}</ol>`
    : `<ol class="contents-list">${p.contents.map(([h, t]) => `<li><div><h3>${esc(h)}</h3><p>${esc(t)}</p></div></li>`).join('')}</ol>`;

  const zipItems = isLibrary
    ? [
        ['ZIP', 'One .zip file', 'A single download with a separate folder for each of the seven courses.'],
        ['PDF', 'Seven PDF workbooks', 'One per course, each with explanations, board diagrams, training positions and fully worked solutions.'],
        ['PGN', 'PGN files for every course', 'Every position and line from each course, ready for any chess software or online analysis board that opens PGN files.']
      ]
    : [
        ['PDF', 'PDF workbook', 'The explanations, board diagrams, training positions and fully worked solutions, organized by chapter.'],
        ['PGN', 'PGN files', 'Every position and line in the course, so you can load them into any chess software or online analysis board that opens PGN files.']
      ];

  const others = products.filter((x) => x.id !== p.id);
  const relatedHtml = isLibrary
    ? ''
    : `
<section class="section section--tight section--alt" aria-labelledby="related-heading">
  <div class="container">
    <h2 id="related-heading">Other courses</h2>
    <ul class="related-list">${others.map((x) => `<li><a href="${x.file}"><span>${esc(x.name)}</span><small data-price-for="${x.id}">${usd(x.price)}</small></a></li>`).join('')}</ul>
  </div>
</section>`;

  const studyOrderHtml = isLibrary
    ? `
<section class="section section--alt" aria-labelledby="order-heading">
  <div class="container">
    <div class="section-head"><p class="eyebrow">Using the library</p><h2 id="order-heading">A suggested study order</h2><p>The courses can be studied in any order, but this sequence moves from the foundations to the most demanding material.</p></div>
    <ol class="steps">${studyOrder.map(([h, t], i) => `<li class="reveal" style="--i:${i}"><div class="step"><span class="step__num" aria-hidden="true">0${i + 1}</span><h3>${esc(h)}</h3><p>${esc(t)}</p></div></li>`).join('')}</ol>
  </div>
</section>`
    : '';

  const body = `
<section class="product-hero">
  <div class="container">
    <nav class="breadcrumb" aria-label="Breadcrumb"><ol><li><a href="index.html">Home</a></li><li><a href="index.html#courses">Courses</a></li><li aria-current="page">${esc(p.name)}</li></ol></nav>
    <div class="product-hero__grid">
      <div>
        <p class="eyebrow">${esc(p.level)} level</p>
        <h1>${esc(p.name)}</h1>
        <p class="lede">${esc(p.lede)}</p>
        <dl class="facts">
          <div><dt>Level</dt><dd>${esc(p.level)}</dd></div>
          <div><dt>Format</dt><dd>${isLibrary ? 'One .zip with seven PDF workbooks and PGN files' : '.zip with a PDF workbook and PGN files'}</dd></div>
          <div><dt>Study</dt><dd>Self-paced, self-study</dd></div>
          <div><dt>Delivery</dt><dd>Instant download link by email and on screen</dd></div>
        </dl>
        <div class="callout"><p><strong>Self-study material.</strong> ${isLibrary ? 'These courses are written workbooks with PGN files.' : 'This course is a written workbook with PGN files.'} There is no video, no live instruction, no coaching, and no feedback on your games.</p></div>
      </div>
      <aside class="buy-box" aria-labelledby="buy-heading">
        <h2 id="buy-heading" class="visually-hidden">Price and purchase</h2>
        <p class="buy-box__name">${esc(p.name)}</p>
        <p class="buy-box__level">${esc(p.level)} &middot; PDF + PGN</p>
        <div class="price-row"><p class="price"><span data-price-for="${p.id}">${usd(p.price)}</span><span class="price__cur">USD</span></p></div>
        <p class="buy-box__terms">Instant digital download &middot; <a href="refund-policy.html">14-day refund policy</a> &middot; Taxes calculated at checkout</p>
        <div class="buy-box__action" data-buy-for="${p.id}" hidden></div>
        <ul class="buy-box__list">
          <li>${isLibrary ? 'All seven courses, complete' : 'PDF workbook with fully worked solutions'}</li>
          <li>PGN files of every position and line</li>
          <li>Download link by email and on the order confirmation screen</li>
          <li>Applicable taxes are calculated at checkout</li>
        </ul>
      </aside>
    </div>
  </div>
</section>

<section class="section section--alt" aria-labelledby="contents-heading">
  <div class="container">
    <div class="section-head"><p class="eyebrow">Full contents</p><h2 id="contents-heading">${isLibrary ? 'The seven courses included' : 'What the course covers'}</h2><p>${isLibrary ? 'Each course is included in full, with its own PDF workbook and PGN files. Follow a link for the full contents of any course.' : 'The workbook is organized into the parts below. Each part explains its ideas first, shows them in annotated examples, and then gives training positions with worked solutions.'}</p></div>
    ${contentsHtml}
  </div>
</section>

<section class="section" aria-labelledby="preview-heading">
  <div class="container">
    <div class="section-head"><p class="eyebrow">Inside the workbook</p><h2 id="preview-heading">Preview pages</h2><p>Illustrations of representative pages, showing how ${isLibrary ? 'the workbooks are' : 'the workbook is'} laid out: a training position, a worked solution and a section from the explanations.</p></div>
    <div class="preview-grid">
      ${previews.map(([h, c, svg], i) => `<figure class="preview reveal" style="--i:${i}"><div class="preview__page">${svg}</div><figcaption><strong>${h}</strong>${c}</figcaption></figure>`).join('\n      ')}
    </div>
  </div>
</section>

<section class="section section--alt" aria-label="Who this course suits">
  <div class="container fit-grid">
    <div class="fit"><h2>Who it&rsquo;s for</h2><ul class="check-list check-list--yes">${p.forWho.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
    <div class="fit"><h2>Who it isn&rsquo;t for</h2><ul class="check-list check-list--no">${p.notFor.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
  </div>
</section>

<section class="section" aria-labelledby="zip-heading">
  <div class="container split">
    <div>
      <p class="eyebrow">The download</p>
      <h2 id="zip-heading">What&rsquo;s in the .zip</h2>
      <p class="lede">${isLibrary ? 'One download holds the whole library.' : 'One download holds the whole course.'} Open the PDF in any PDF reader and load the PGN files into any chess software or online analysis board that opens PGN files. The <a href="faq.html">FAQ</a> explains how to open both.</p>
    </div>
    <ul class="zip-list">${zipItems.map(([b, h, t], i) => `<li><span class="file-badge${i % 2 ? ' file-badge--alt' : ''}" aria-hidden="true">${b}</span><div><strong>${h}</strong><span>${t}</span></div></li>`).join('')}</ul>
  </div>
</section>
${studyOrderHtml}
<section class="section section--tight" aria-labelledby="delivery-heading">
  <div class="container">
    <div class="cta-band">
      <div>
        <h2 id="delivery-heading">Delivery and refunds</h2>
        <p>Your download link arrives by email right after payment and is shown on the confirmation screen. Any purchase can be refunded in full within 14 days, no reason required.</p>
      </div>
      <div class="cta-band__actions"><a class="btn btn--primary" href="delivery-policy.html">Delivery Policy</a><a class="btn btn--ghost" href="refund-policy.html">Refund Policy</a></div>
    </div>
  </div>
</section>
${relatedHtml}`;

  write(p.file, layout({
    file: p.file,
    title: `${p.name} | Fiancho Chess`,
    description: p.metaDescription,
    active: 'courses',
    body
  }));
}

/* ------------------------------------------------------------------ */
/* Simple pages                                                        */
/* ------------------------------------------------------------------ */
function pageHero(eyebrow, title, lede, crumb) {
  return `<section class="page-hero"><div class="container">
  <nav class="breadcrumb" aria-label="Breadcrumb"><ol><li><a href="index.html">Home</a></li><li aria-current="page">${esc(crumb)}</li></ol></nav>
  <p class="eyebrow">${esc(eyebrow)}</p>
  <h1>${title}</h1>
  ${lede ? `<p class="lede">${lede}</p>` : ''}
</div></section>`;
}

function aboutPage() {
  const body = `${pageHero('About', 'About Fiancho Chess', 'Fiancho Chess makes self-paced chess training courses in a written format: PDF workbooks and PGN files that you study on your own, at your own board and in your own time.', 'About')}
<section class="section section--tight" aria-labelledby="make-heading">
  <div class="container split">
    <div><h2 id="make-heading">What we make</h2></div>
    <div class="prose">
      <p>Each Fiancho Chess product covers one part of the game: tactics, checkmate patterns, an opening repertoire for White or for Black, endgames, positional play, or calculation and visualization. A seventh product, the Complete Training Library, brings all of them together.</p>
      <p>Every course follows the same structure. An idea is explained in plain language, shown in annotated examples with board diagrams, and then practiced in training positions. Every training position has a fully worked solution that gives the main line, the defensive tries that matter, and the reasoning behind the moves.</p>
      <p>Alongside the PDF, each course includes PGN files of every position and line, so you can step through the material in whatever chess software or online analysis board you already use.</p>
    </div>
  </div>
</section>

<section class="section section--alt" aria-labelledby="why-heading">
  <div class="container">
    <div class="section-head"><h2 id="why-heading">Why written courses</h2><p>A workbook suits a particular way of studying: slowly, at a board, with time to think before checking the answer.</p></div>
    <ul class="value-grid">
      <li class="reveal" style="--i:0"><h3>You set the pace</h3><p>There is no schedule and nothing to keep up with. Spend an evening on one position or work through a whole chapter; the material waits for you.</p></li>
      <li class="reveal" style="--i:1"><h3>Thinking comes first</h3><p>Training positions are set out before their solutions, so you do the work of finding the move before you see it. The solutions are there to check and explain, not to replace that work.</p></li>
      <li class="reveal" style="--i:2"><h3>It works with your tools</h3><p>PDF and PGN are open, widely supported formats. The workbook opens in any PDF reader, and the PGN files load into any chess software or online analysis board that opens PGN.</p></li>
      <li class="reveal" style="--i:3"><h3>It stays useful</h3><p>A workbook is easy to come back to. Print the pages you want at the board, revisit a chapter months later, or use the PGN files to review a single line.</p></li>
    </ul>
  </div>
</section>

<section class="section" aria-labelledby="how-heading">
  <div class="container split">
    <div><h2 id="how-heading">How the material is put together</h2></div>
    <div class="prose">
      <p>The explanations, annotations and training positions are original, or are drawn from historical games and given original annotations. Nothing is copied from books, puzzle sites or other courses.</p>
      <p>Every diagram is drawn for the course, and the analysis is checked carefully before release. Chess analysis can still contain mistakes, so anyone who finds one can report it through the <a href="contact.html">Contact page</a>. Confirmed corrections go into an updated version of the course, and buyers can request the updated files free of charge.</p>
      <p>Each course describes what it covers and states its level as beginner, intermediate or advanced, so you can choose the right starting point. The <a href="faq.html">FAQ</a> has more guidance on where to begin.</p>
    </div>
  </div>
</section>

<section class="section section--alt" aria-labelledby="not-heading">
  <div class="container split">
    <div><h2 id="not-heading">What Fiancho Chess doesn&rsquo;t do</h2></div>
    <div class="prose">
      <p>Fiancho Chess sells self-study materials and nothing else. There is no video, no live instruction, no coaching, and no feedback on your games. We don&rsquo;t promise any particular result: how much a course helps depends on how you study and play, where you start from, and many other individual factors.</p>
      <p>Fiancho Chess is independent. It is not affiliated with or endorsed by any chess federation, rating organization, chess website or software maker.</p>
    </div>
  </div>
</section>

<section class="section section--tight">
  <div class="container">
    <div class="cta-band">
      <div><h2>See the courses</h2><p>Every course page shows the full contents, the level, preview pages and the price.</p></div>
      <div class="cta-band__actions"><a class="btn btn--primary" href="index.html#courses">Browse the courses</a><a class="btn btn--ghost" href="contact.html">Contact</a></div>
    </div>
  </div>
</section>`;
  write('about.html', layout({
    file: 'about.html',
    title: 'About | Fiancho Chess',
    description: 'About Fiancho Chess: what the self-paced chess training courses contain, why they are written as PDF workbooks with PGN files, and how the material is put together.',
    active: 'about',
    body
  }));
}

function faqPage() {
  const groups = [
    ['Buying and delivery', [FAQ.afterPurchase, FAQ.delivery, FAQ.missing, FAQ.taxes, FAQ.account, FAQ.refunds]],
    ['The materials', [FAQ.receive, FAQ.open, FAQ.video, FAQ.level, FAQ.print]],
    ['Corrections, updates and licensing', [FAQ.updated, FAQ.error, FAQ.coaches]]
  ];
  const body = `${pageHero('FAQ', 'Frequently asked questions', 'Answers about delivery, the files, levels, corrections, licensing and refunds. If your question isn&rsquo;t here, contact us through the <a href="contact.html">Contact page</a>.', 'FAQ')}
<section class="section section--tight">
  <div class="container">
    <div class="callout" style="max-width:860px;margin-bottom:48px"><p><strong>Self-study material.</strong> Every Fiancho Chess product is a PDF workbook with PGN files. There is no video, no live instruction, no coaching, and no feedback on your games.</p></div>
    ${groups
      .map(
        ([h, items], gi) => `<div class="faq-group"><h2 id="faq-group-${gi + 1}">${h}</h2><div class="faq-list">${items.map(([q, a]) => faqItem(q, a)).join('')}</div></div>`
      )
      .join('\n    ')}
  </div>
</section>`;
  write('faq.html', layout({
    file: 'faq.html',
    title: 'FAQ | Fiancho Chess',
    description: 'Fiancho Chess FAQ: delivery, what is in the .zip, opening PDF and PGN files, which level to start with, updates, corrections, licensing for coaches and clubs, and refunds.',
    active: 'faq',
    body
  }));
}

function contactPage() {
  const body = `${pageHero('Contact', 'Contact Fiancho Chess', 'Questions about a course, an order, a refund or a correction? Fiancho Chess handles all support by email, and a person reads and answers every message.', 'Contact')}
<section class="section section--tight">
  <div class="container contact-grid">
    <div class="contact-stack">
      <div class="contact-card" data-support-email hidden>
        <p class="contact-card__label">Support email</p>
        <p class="contact-card__value" data-email-link></p>
      </div>
      <div class="info-card">
        <h2>Response time</h2>
        <p>We reply to every message within two business days.</p>
        <h2 style="margin-top:28px">What to include</h2>
        <p>To help us answer in one reply, please include:</p>
        <ul>
          <li>Your order number</li>
          <li>The email address you used at checkout</li>
          <li>The name of the course</li>
          <li>For a suspected error in the analysis, the chapter and the position or diagram</li>
        </ul>
      </div>
    </div>
    <div>
      <h2>Common requests</h2>
      <ul class="request-list">
        <li><h3>Refunds</h3><p>Any purchase can be refunded in full within 14 days, no reason required. Include your order number. See the <a href="refund-policy.html">Refund Policy</a>.</p></li>
        <li><h3>A download that hasn&rsquo;t arrived</h3><p>If the email hasn&rsquo;t arrived within an hour, check your spam folder first. If it isn&rsquo;t there, write to us and we&rsquo;ll resend the link. See the <a href="delivery-policy.html">Delivery Policy</a>.</p></li>
        <li><h3>A damaged file</h3><p>If a file is damaged or won&rsquo;t open, we&rsquo;ll send a replacement, or a refund if you prefer.</p></li>
        <li><h3>An error in the analysis</h3><p>Tell us where it is. Confirmed corrections go into an updated version, which you can request free of charge.</p></li>
        <li><h3>Licenses for coaches and clubs</h3><p>The standard license is for personal study. Ask us about a separate license for using the material with students or club members.</p></li>
        <li><h3>Privacy requests</h3><p>To access, correct or delete your personal information, or to object to its use, see the <a href="privacy.html">Privacy Policy</a> and write to us.</p></li>
      </ul>
      <p style="margin-top:24px;color:var(--muted)">This site has no contact form and collects no information through forms.</p>
    </div>
  </div>
</section>`;
  write('contact.html', layout({
    file: 'contact.html',
    title: 'Contact | Fiancho Chess',
    description: 'Contact Fiancho Chess about orders, downloads, refunds, corrections and licenses. Replies within two business days. Include your order number and checkout email.',
    active: 'contact',
    body
  }));
}

/* ------------------------------------------------------------------ */
/* Policy pages                                                        */
/* ------------------------------------------------------------------ */
function docPage({ file, crumb, title, description, lede, summary, sections }) {
  const toc = `<nav class="doc-toc" aria-labelledby="toc-heading"><h2 id="toc-heading">On this page</h2><ol>${sections.map(([id, h]) => `<li><a href="#${id}">${h}</a></li>`).join('')}</ol></nav>`;
  const body = `${pageHero('Policy', esc(title), `${lede}`, crumb)}
<section class="section section--tight" style="padding-top:0">
  <div class="container doc-layout">
    <aside>${toc}</aside>
    <article class="prose">
      <p class="updated">Last updated: <time datetime="${updatedFor(file)[1]}">${updatedFor(file)[0]}</time></p>
      ${summary ? `<div class="summary-box">${summary}</div>` : ''}
      ${sections.map(([id, h, html]) => `<h2 id="${id}">${h}</h2>\n      ${html}`).join('\n      ')}
    </article>
  </div>
</section>`;
  write(file, layout({ file, title: `${title} | Fiancho Chess`, description, body }));
}

const contactLink = '<a href="contact.html">Contact page</a>';

function policyPages() {
  docPage({
    file: 'terms.html',
    crumb: 'Terms of Service',
    title: 'Terms of Service',
    description: 'Fiancho Chess Terms of Service: the personal-use license for chess training materials, what is not allowed, pricing and payment, delivery, refunds and liability.',
    lede: 'The terms that apply when you use this website or buy a Fiancho Chess product, written in plain language.',
    summary: '<p>In short: you buy a personal license to study the materials yourself. You can keep and print them for your own use, but you can&rsquo;t share, resell or upload them. Coaches and clubs can ask about a separate license.</p>',
    sections: [
      ['acceptance', 'Acceptance of these terms', `<p>These Terms of Service apply to your use of the Fiancho Chess website and to every purchase of a Fiancho Chess product. By using the website or buying a product, you agree to these terms. If you do not agree, please do not use the website or buy a product.</p>`],
      ['agreement', 'Agreement before checkout', `<p>Before you can go to checkout, you must agree to these Terms of Service and to the <a href="refund-policy.html">Refund Policy</a>. Each product page has a checkbox reading &ldquo;I agree to the Terms of Service and Refund Policy,&rdquo; and the buy button stays disabled until it is ticked. By ticking the box and continuing to checkout, you confirm that you have read and accept both documents.</p>`],
      ['products', 'What we sell', `<p>Fiancho Chess sells self-paced digital training materials for chess. Each product is a .zip file containing a PDF workbook and PGN files. The materials are for self-study: they do not include video, live instruction, coaching, or feedback on your games.</p><p>The contents, level, format and price of each product are described on its product page before purchase.</p>`],
      ['license', 'Your license', `<p>When you buy a product, Fiancho Chess grants you a personal, non-exclusive, non-transferable license to use the materials for your own study. Under this license you may:</p><ul><li>download the files and keep copies on your own devices;</li><li>load the PGN files into your own chess software or an online analysis board for your own study;</li><li>print copies of the PDF workbook for your own use.</li></ul>`],
      ['restrictions', 'What the license does not allow', `<p>You may not:</p><ul><li>resell, sublicense or redistribute the materials, in whole or in part;</li><li>share the files, or copies of them, with students, club members, friends or anyone else;</li><li>upload the materials to file-sharing sites, shared drives, forums or any other public or shared location;</li><li>claim the materials, or any part of them, as your own, or remove copyright notices from them.</li></ul><p>These restrictions apply to the PDF workbook, the PGN files and any printed copies.</p>`],
      ['coaches', 'Coaches and clubs', `<p>The personal license does not cover use with students, teams or club members. If you are a coach, school or club and would like to use the materials with others, please get in touch through the ${contactLink} to ask about a separate license.</p>`],
      ['pricing', 'Prices, taxes and payment', `<p>Prices are shown in US dollars on each product page. Applicable taxes are calculated at checkout.</p><p>Payment is handled at checkout by a third-party payment provider, under its own terms and privacy policy. Fiancho Chess never sees your full payment card details. Your purchase is complete when the payment provider confirms your payment.</p>`],
      ['delivery', 'Delivery', `<p>Products are delivered digitally by download, as described in the <a href="delivery-policy.html">Delivery Policy</a>.</p>`],
      ['refunds', 'Refunds', `<p>Refunds are handled as described in the <a href="refund-policy.html">Refund Policy</a>. In summary, you can request a full refund on any purchase within 14 days, no reason required.</p>`],
      ['ownership', 'Ownership', `<p>All written content, explanations, annotations, diagrams and illustrations in the materials, and the content and design of this website, are owned by Fiancho Chess and protected by copyright. Your license gives you the right to use the materials as described above; it does not transfer ownership of them to you.</p>`],
      ['warranties', 'Disclaimer of warranties', `<p>The materials are provided &ldquo;as is.&rdquo; We take care to make them accurate and useful, but to the extent permitted by law, Fiancho Chess disclaims all warranties, express or implied, including implied warranties of merchantability, fitness for a particular purpose and non-infringement. We do not promise any particular result from using the materials. See also the <a href="disclaimer.html">Disclaimer</a>.</p><p>Nothing in these terms affects rights you have under consumer protection law that cannot be excluded.</p>`],
      ['liability', 'Limitation of liability', `<p>To the extent permitted by law, Fiancho Chess&rsquo;s total liability for any claim relating to a product or to these terms is limited to the amount you paid for that product. Fiancho Chess is not liable for indirect or consequential losses.</p><p>Nothing in these terms excludes or limits any liability that cannot be excluded or limited by law.</p>`],
      ['changes', 'Changes to these terms', `<p>We may update these terms from time to time. When we do, the new version is posted on this page with a new &ldquo;Last updated&rdquo; date. The terms in effect when you made a purchase apply to that purchase.</p>`],
      ['contact', 'Contact', `<p>Questions about these terms can be sent through the ${contactLink}.</p>`]
    ]
  });

  docPage({
    file: 'privacy.html',
    crumb: 'Privacy Policy',
    title: 'Privacy Policy',
    description: 'Fiancho Chess Privacy Policy: no cookies, analytics, trackers or forms. What order information is received, how it is used, retention, and your GDPR and CCPA rights.',
    lede: 'What information Fiancho Chess receives, what it is used for, and the rights you have over it.',
    summary: '<p>In short: this website uses no cookies, no analytics, no advertising trackers and no forms. When you buy a course, we receive basic order information and use it only to deliver your course, support you, process refunds and keep the records the law requires. We never sell your information or share it for advertising.</p>',
    sections: [
      ['who', 'Who we are', `<p>This policy covers the Fiancho Chess website and the sale of Fiancho Chess products. Fiancho Chess is responsible for the personal information described here. You can reach us through the ${contactLink}.</p>`],
      ['website', 'What this website does not do', `<p>This website uses no cookies, no analytics, no advertising trackers and no forms. There are no accounts or sign-ins, and nothing you do on the site is recorded by Fiancho Chess.</p><p>Two technical services are involved in showing you the site. The site is hosted on GitHub Pages, and the hosting provider may log technical information such as IP addresses for security and operation, under its own privacy policy. Fonts are loaded from Google Fonts, which receives your IP address as part of the normal web request, under Google&rsquo;s privacy policy. Fiancho Chess does not receive or use this information.</p>`],
      ['payments', 'Payments', `<p>Payments are handled by a third-party payment provider. When you buy a course, the payment provider collects your name, email address, billing details and payment information, and processes them under its own privacy policy. Fiancho Chess never sees your full payment card details.</p>`],
      ['orders', 'Information we receive when you buy', `<p>From each order we receive:</p><ul><li>your name;</li><li>your email address;</li><li>the products you bought;</li><li>your country.</li></ul>`],
      ['use', 'How we use it', `<p>We use order information only to:</p><ul><li>deliver your products;</li><li>provide support;</li><li>process refunds;</li><li>meet tax and accounting obligations.</li></ul><p>Personal information is never sold, and never shared for advertising.</p><p>If you contact us, we receive your email address and the contents of your message, and use them to answer you and keep a record of the request.</p>`],
      ['legal-bases', 'Legal bases for processing', `<p>Where the EU or UK General Data Protection Regulation (GDPR) applies, we process order information because it is necessary to perform our contract with you (delivering your course and providing support and refunds), and because we have a legal obligation to keep tax and accounting records. We handle support messages on the basis of our legitimate interest in answering the people who write to us.</p>`],
      ['sharing', 'Who else sees your information', `<p>Your information is shared only with the payment provider that processes your order, with service providers that we need to deliver your download and run the business, and with authorities where the law requires it. These services may process information in countries other than your own, with the safeguards required by applicable law.</p>`],
      ['retention', 'How long we keep it', `<p>We keep order information for as long as we need it to meet legal, tax and accounting requirements, which can mean several years after a purchase. Support messages are kept as long as needed to resolve the request and keep related records. When information is no longer needed for these purposes, it is deleted.</p>`],
      ['rights', 'Your rights', `<p>Depending on where you live, you have rights over your personal information. Wherever you are, we will honor requests to:</p><ul><li><strong>access</strong> the personal information we hold about you;</li><li><strong>correct</strong> information that is inaccurate;</li><li><strong>delete</strong> your information, unless we must keep it to meet a legal obligation such as tax record-keeping;</li><li><strong>object</strong> to how we use your information.</li></ul><h3>GDPR (European Economic Area and United Kingdom)</h3><p>You also have the right to restrict processing, to receive your information in a portable format, and to complain to your local data protection authority.</p><h3>CCPA (California)</h3><p>California residents have the right to know what personal information is collected and how it is used, to delete it, to correct it, and to opt out of its sale or sharing. Fiancho Chess does not sell or share personal information for advertising. You will not be treated differently for exercising any of these rights.</p><h3>How to make a request</h3><p>Send your request through the ${contactLink}, with your order number and the email address you used at checkout so we can confirm the request is yours. We respond within the time the law requires.</p>`],
      ['children', 'Children', `<p>This website is not directed at children under 13, and we do not knowingly collect personal information from them. If you believe a child under 13 has given us personal information, contact us through the ${contactLink} and we will delete it.</p>`],
      ['changes', 'Changes to this policy', `<p>If this policy changes, the updated version will be posted on this page with a new &ldquo;Last updated&rdquo; date. If a change materially affects how we use order information, we will say so clearly at the top of this page.</p>`],
      ['contact', 'Contact', `<p>Questions about privacy, and requests to exercise your rights, can be sent through the ${contactLink}.</p>`]
    ]
  });

  docPage({
    file: 'refund-policy.html',
    crumb: 'Refund Policy',
    title: 'Refund Policy',
    description: 'Fiancho Chess Refund Policy: a full refund on any purchase within 14 days, no reason required, issued within 5 business days. Nothing needs to be returned.',
    lede: 'A full refund on any purchase within 14 days, with no reason required.',
    summary: '<ul><li>Full refund within 14 days of purchase, no reason required.</li><li>Request it through the Contact page with your order number.</li><li>Refunds are issued within 5 business days, to your original payment method.</li><li>Nothing needs to be returned.</li></ul>',
    sections: [
      ['eligibility', 'The 14-day refund', `<p>You can request a full refund on any Fiancho Chess purchase within 14 days of buying it. You don&rsquo;t need to give a reason. This applies to every product, including the Complete Training Library, which is refunded as a single purchase.</p>`],
      ['how', 'How to request a refund', `<p>Send your request through the ${contactLink} and include your order number. Including the email address you used at checkout helps us find your order quickly.</p>`],
      ['payment', 'How refunds are paid', `<p>Refunds go back to your original payment method. They are issued within 5 business days of your request. Your payment provider&rsquo;s processing time may add a few days before the money appears in your account.</p>`],
      ['returns', 'Nothing to return', `<p>Because the products are digital downloads, nothing needs to be returned.</p>`],
      ['damaged', 'Damaged files', `<p>If a file is damaged or won&rsquo;t open, tell us through the ${contactLink}. If you prefer, we&rsquo;ll send you a replacement instead of a refund.</p>`],
      ['contact', 'Contact', `<p>Questions about refunds can be sent through the ${contactLink}. We reply within two business days.</p>`]
    ]
  });

  docPage({
    file: 'delivery-policy.html',
    crumb: 'Delivery Policy',
    title: 'Delivery Policy',
    description: 'Fiancho Chess Delivery Policy: every product is a digital .zip download, with the link emailed immediately after payment and shown on the confirmation screen.',
    lede: 'How Fiancho Chess products are delivered, and what to do if your download link doesn&rsquo;t arrive.',
    summary: '<ul><li>All products are digital and delivered by download as a .zip file.</li><li>The download link is emailed immediately after payment and shown on the order confirmation screen.</li><li>There is no physical shipment.</li></ul>',
    sections: [
      ['digital', 'Digital products only', `<p>All Fiancho Chess products are digital. Each one is delivered by download as a .zip file containing a PDF workbook and PGN files. There is no physical shipment.</p>`],
      ['steps', 'How delivery works, step by step', `<ol><li><strong>Choose a course on this website.</strong> Each product page shows the price, the contents, the format and these policies before any purchase step.</li><li><strong>Agree to the terms.</strong> Tick the box confirming that you agree to the <a href="terms.html">Terms of Service</a> and <a href="refund-policy.html">Refund Policy</a>. This enables the buy button.</li><li><strong>Pay on the payment provider&rsquo;s checkout page.</strong> The buy button takes you to a checkout page run by our third-party payment provider. You enter your email address and payment details there, and applicable taxes are calculated there. This website never handles your payment details.</li><li><strong>Get your download link on screen.</strong> As soon as the payment is confirmed, the payment provider shows an order confirmation screen with a link to download your course.</li><li><strong>Get the same link by email.</strong> At the same moment, the download link is emailed to the address you entered at checkout, so you can download again later.</li><li><strong>Download and open your files.</strong> The link downloads a single .zip file. Unzip it to find the PDF workbook and the PGN files.</li></ol><p>There are no license keys, no accounts to create, and nothing to unlock on this website.</p>`],
      ['when', 'When you receive it', `<p>Delivery is immediate: the download link appears on the order confirmation screen and is emailed to you as soon as your payment is confirmed. There is no waiting period and no manual processing.</p>`],
      ['missing', 'If the email doesn&rsquo;t arrive', `<p>If the email hasn&rsquo;t arrived within an hour, check your spam or junk folder first. If it isn&rsquo;t there, get in touch through the ${contactLink} with your order number and the email address you used at checkout, and the link will be resent.</p>`],
      ['problems', 'Problems with a file', `<p>If a file is damaged or won&rsquo;t open, contact us through the ${contactLink} and we&rsquo;ll send a replacement. The <a href="refund-policy.html">Refund Policy</a> also applies.</p>`],
      ['updates', 'Corrected versions', `<p>If a corrected version of a course is released, buyers of that course can request the updated files free of charge through the ${contactLink}.</p>`],
      ['opening', 'Opening your files', `<p>Unzip the download, open the PDF in any PDF reader, and load the PGN files into any chess software or online analysis board that opens PGN files. The <a href="faq.html">FAQ</a> has more detail.</p>`]
    ]
  });

  docPage({
    file: 'disclaimer.html',
    crumb: 'Disclaimer',
    title: 'Disclaimer',
    description: 'Fiancho Chess Disclaimer: self-study chess training materials, not coaching. No specific results are promised, analysis corrections are welcome, and Fiancho Chess is independent.',
    lede: 'What Fiancho Chess materials are, what they are not, and what we can and can&rsquo;t promise.',
    summary: '',
    sections: [
      ['self-study', 'Self-study materials, not coaching', `<p>Fiancho Chess courses are self-study training materials: PDF workbooks and PGN files. They are not coaching. They include no video, no live instruction, and no feedback on anyone&rsquo;s games.</p>`],
      ['results', 'No promised results', `<p>How much any player improves depends on how much they study and play, their starting level, and other individual factors. Fiancho Chess does not promise any specific result, and does not promise any rating change.</p>`],
      ['accuracy', 'Accuracy of the analysis', `<p>The analysis in every course is checked carefully, but chess analysis can contain errors. Anyone who finds one can report it through the ${contactLink}. Corrections are made in updated versions of the course, and buyers can request the updated files free of charge.</p>`],
      ['independence', 'Independence', `<p>Fiancho Chess is independent. It is not affiliated with or endorsed by any chess federation, rating organization, chess website or software maker. PDF and PGN are mentioned only to describe the file formats the materials use.</p>`],
      ['contact', 'Contact', `<p>Questions about this disclaimer can be sent through the ${contactLink}.</p>`]
    ]
  });
}

function notFoundPage() {
  const body = `<section>
  <div class="container not-found">
    <div>
      <p class="eyebrow">Error 404</p>
      <h1>This square is empty.</h1>
      <p class="lede">The page you were looking for isn&rsquo;t here. It may have moved, or the link may have a typo. Everything on the site is reachable from the links below.</p>
      <div class="not-found__links">
        <a class="btn btn--primary" href="index.html">Go to the home page</a>
        <a class="btn btn--ghost" href="index.html#courses">Browse the courses</a>
      </div>
      <p style="margin-top:24px;color:var(--muted)">Looking for help? See the <a href="faq.html">FAQ</a> or the <a href="contact.html">Contact page</a>.</p>
    </div>
    <svg class="not-found__board" viewBox="0 0 400 400" role="img" aria-labelledby="nf-t"><title id="nf-t">A lone king on an otherwise empty chessboard</title><rect width="400" height="400" rx="18" class="hb-frame"/>${(() => {
      let s = '';
      for (let row = 0; row < 4; row++) for (let f = 0; f < 4; f++) s += `<rect x="${20 + f * 90}" y="${20 + row * 90}" width="90" height="90" class="${(f + row) % 2 === 0 ? 'sq-l' : 'sq-d'}"/>`;
      return s;
    })()}<rect x="200" y="200" width="90" height="90" fill="none" stroke="var(--band-accent)" stroke-width="5"/>${pieceAt('k', 'w', 206, 206, 78)}</svg>
  </div>
</section>`;
  write('404.html', layout({
    file: '404.html',
    title: 'Page not found | Fiancho Chess',
    description: 'The page you were looking for could not be found. Browse the Fiancho Chess chess training courses or read the FAQ.',
    body,
    is404: true
  }));
}

/* ------------------------------------------------------------------ */
/* Data files and static extras                                        */
/* ------------------------------------------------------------------ */
function dataFiles() {
  const productObj = products
    .map((p) => `  "${p.id}": {\n    name: "${p.name}",\n    price: ${p.price},\n    checkoutUrl: ""\n  }`)
    .join(',\n');
  if (!fs.existsSync(path.join(OUT, 'js/products.js'))) write('js/products.js', `/*
  Fiancho Chess — product data
  Prices are in USD. Each product page renders its price and buy button from this file.
  Leave checkoutUrl empty ("") and no buy button is shown on that product's page.
  Paste a checkout link between the quotes and the button appears automatically.
*/
window.SITE_PRODUCTS = {
${productObj}
};
`);

  if (!fs.existsSync(path.join(OUT, 'js/site-config.js'))) {
    write('js/site-config.js', `/*
  Fiancho Chess — site configuration
  supportEmail is shown as a mailto link on the Contact page and in the footer of every page.
  Leave it empty ("") and the email line is simply not shown.
*/
window.SITE_CONFIG = {
  supportEmail: ""
};
`);
  }

  write('favicon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="24" fill="#1d4a36"/><g transform="translate(13 9) scale(.74)" fill="#f7f3e9"><path d="M30 77c1-14 7-22 16-29-7 2-13 4-19 9-6-2-9-8-6-14 6-10 15-18 22-24l2-9 6 7c15 3 25 17 25 36 0 9-1 17-2 24z"/><rect x="22" y="76" width="56" height="11" rx="4"/><circle cx="41" cy="31" r="3.4" fill="#1d4a36"/></g></svg>
`);

  const pages = ['index.html', ...products.map((p) => p.file), 'about.html', 'faq.html', 'contact.html', 'terms.html', 'privacy.html', 'refund-policy.html', 'delivery-policy.html', 'disclaimer.html'];
  write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((f) => `  <url><loc>${f === 'index.html' ? SITE : SITE + f}</loc><lastmod>${updatedFor(f)[1]}</lastmod></url>`).join('\n')}
</urlset>
`);
  write('robots.txt', `User-agent: *
Allow: /

Sitemap: ${SITE}sitemap.xml
`);
  write('.nojekyll', '');
}

homePage();
products.forEach(productPage);
aboutPage();
faqPage();
contactPage();
policyPages();
notFoundPage();
dataFiles();
console.log('Built site into', OUT, HAS_OG_IMAGE ? '(with og image)' : '(no og image)');
