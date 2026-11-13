// Generates the static Fiancho Chess site from the course data and storefront copy.
// Run: npm run site   (output is plain HTML/CSS/JS served as-is; no build step on the host)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { products, studyOrder } from './content.mjs';
import { sprite, pieceAt, heroBoard } from './parts.mjs';
import { previews } from '../previews/specs.mjs';

const OUT = process.argv[2] || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SITE = 'https://fiancho-chess.vercel.app';
const UPDATED = 'November 13, 2026';
const UPDATED_ISO = '2026-11-13';
const YEAR = 2026;
const HAS_OG_IMAGE = fs.existsSync(path.join(OUT, 'og-image.png'));
const manifest = JSON.parse(fs.readFileSync(path.join(OUT, 'train/courses/index.json'), 'utf8'));
const courseData = Object.fromEntries(Object.keys(manifest).map((s) => [s, JSON.parse(fs.readFileSync(path.join(OUT, `train/courses/${s}.json`), 'utf8'))]));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const usd = (n) => `$${n}`;
const LIB = 'complete-training-library';
const COURSES = products.filter((p) => p.id !== LIB);
const bySlug = Object.fromEntries(products.map((p) => [p.id, p]));

/* ------------------------------------------------------------------ course facts */
function leafCount(nodes) { return nodes.reduce((n, x) => n + (x.children.length ? leafCount(x.children) : 1), 0); }
function facts(slug) {
  const c = courseData[slug];
  const f = { lessons: 0, examples: 0, positions: 0, visual: 0, quiz: 0, structure: 0, practice: 0, lines: 0, explorers: 0 };
  for (const s of c.sections) {
    if (s.paras && s.paras.length) f.lessons++;
    for (const it of s.items) {
      if (it.type === 'example') f.examples++;
      if (it.type === 'puzzle') f.positions++;
      if (it.type === 'visual') f.visual++;
      if (it.type === 'quiz') f.quiz++;
      if (it.type === 'structure') f.structure++;
      if (it.type === 'practice') f.practice++;
      if (it.type === 'explorer') { f.explorers++; f.lines += leafCount(it.tree); }
    }
  }
  return f;
}
function sectionSummary(sec) {
  const n = (t) => sec.items.filter((i) => i.type === t).length;
  const parts = [];
  if (sec.paras && sec.paras.length) parts.push('lesson');
  const ex = n('example'); if (ex) parts.push(ex === 1 ? 'worked example' : `${ex} worked examples`);
  const pz = n('puzzle'); if (pz) parts.push(`${pz} training position${pz === 1 ? '' : 's'}`);
  const pr = n('practice'); if (pr) parts.push(`${pr} practice position${pr === 1 ? '' : 's'} against exact replies`);
  const st = n('structure'); if (st) parts.push(`${st} board exercise${st === 1 ? '' : 's'}`);
  const vi = n('visual'); if (vi) parts.push(`${vi} visualization exercise${vi === 1 ? '' : 's'}`);
  const qz = n('quiz'); if (qz) parts.push(`${qz} no-board drill${qz === 1 ? '' : 's'}`);
  const exp = sec.items.filter((i) => i.type === 'explorer'); if (exp.length) parts.push(`line explorer, ${exp.reduce((a, e) => a + leafCount(e.tree), 0)} lines`);
  const dr = n('drill'); if (dr) parts.push('drill of every line');
  return parts.join(' · ');
}
function trainableTotal(slug) { return manifest[slug].positions; }
function featureList(slug) {
  if (slug === LIB) {
    const total = COURSES.reduce((n, p) => n + trainableTotal(p.id), 0);
    return ['All seven training programs, unlocked by one license', `${total} training positions, exercises and drill lines across the courses`, 'Hints, solutions, retry and a review queue in every course', 'Progress tracking and accuracy stats', 'PGN export of every course’s positions', 'Works offline once loaded, and installs as an app'];
  }
  const f = facts(slug);
  const items = [`${f.lessons} short lessons with examples on the board`];
  if (f.lines) items.push(`Line explorer with ${f.lines} lines and a note on every move`, 'Drill mode where you play your side of each line');
  if (f.positions) items.push(`${f.positions} training positions you solve on the board`);
  if (f.practice) items.push(`${f.practice} practice positions against exact endgame replies`);
  if (f.visual) items.push(`${f.visual} visualization exercises`);
  if (f.structure) items.push(`${f.structure} structure exercises`);
  items.push('Hints, solutions, retry and a review queue', 'Progress tracking and accuracy stats', 'PGN export of the course’s positions', 'Works offline once loaded');
  return items;
}

/* ------------------------------------------------------------------ layout */
const brandMark = () => `<svg class="brand__mark" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><use href="#s-n" class="brand__mark-piece" width="100" height="100"/></svg>`;
const NAV = [['/#courses', 'Courses', 'courses'], ['/train/', 'Train', 'train'], ['/about.html', 'About', 'about'], ['/faq.html', 'FAQ', 'faq'], ['/contact.html', 'Contact', 'contact']];

function header(active) {
  const links = NAV.map(([href, label, key]) => `<li><a href="${href}"${key === active ? ' aria-current="page"' : ''}>${label}</a></li>`).join('');
  return `<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header" data-header>
  <div class="site-header__bg" aria-hidden="true"></div>
  <div class="container site-header__inner">
    <a class="brand" href="/" aria-label="Fiancho Chess home">${brandMark()}<span class="brand__name">Fiancho Chess</span></a>
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav"><span class="nav-toggle__bars" aria-hidden="true"></span><span class="visually-hidden">Menu</span></button>
    <nav id="site-nav" class="site-nav" aria-label="Main"><ul>${links}</ul></nav>
  </div>
</header>`;
}

function footer() {
  return `<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        <a class="brand" href="/" aria-label="Fiancho Chess home">${brandMark()}<span class="brand__name">Fiancho Chess</span></a>
        <p>Interactive chess training programs that run in your web browser, unlocked with a license code. Self-study, at your own pace.</p>
        <p class="footer-email" data-support-email hidden><span data-email-link></span></p>
      </div>
      <nav aria-label="Courses"><h2 class="footer-heading">Courses</h2><ul class="footer-links">${products.map((p) => `<li><a href="/${p.file}">${esc(p.name)}</a></li>`).join('')}</ul></nav>
      <nav aria-label="Information"><h2 class="footer-heading">Information</h2><ul class="footer-links"><li><a href="/train/">Training Room</a></li><li><a href="/about.html">About</a></li><li><a href="/faq.html">FAQ</a></li><li><a href="/contact.html">Contact</a></li></ul></nav>
      <nav aria-label="Policies"><h2 class="footer-heading">Policies</h2><ul class="footer-links"><li><a href="/terms.html">Terms</a></li><li><a href="/privacy.html">Privacy</a></li><li><a href="/refund-policy.html">Refunds</a></li><li><a href="/delivery-policy.html">Delivery</a></li><li><a href="/consumer-rights.html">Consumer rights</a></li><li><a href="/disclaimer.html">Disclaimer</a></li><li><a href="/contact.html">Contact</a></li></ul></nav>
    </div>
    <div class="footer-bottom">
      <p>&copy; <span data-year>${YEAR}</span> Fiancho Chess. All rights reserved.</p>
      <p>Prices in USD. Applicable taxes are shown at checkout.</p>
    </div>
  </div>
</footer>`;
}

function layout({ file, title, description, active = '', body, noindex = false, product = null, modules = [], trainCss = false }) {
  const urlPath = file === 'index.html' ? '/' : '/' + file.replace(/index\.html$/, '');
  const url = SITE + urlPath;
  const ogImage = HAS_OG_IMAGE
    ? `\n  <meta property="og:image" content="${SITE}/og-image.png">\n  <meta property="og:image:width" content="1200">\n  <meta property="og:image:height" content="630">\n  <meta property="og:image:alt" content="Fiancho Chess: interactive chess training programs">\n  <meta name="twitter:card" content="summary_large_image">`
    : '\n  <meta name="twitter:card" content="summary">';
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  ${noindex ? '<meta name="robots" content="noindex, nofollow">' : `<link rel="canonical" href="${url}">`}
  <meta name="theme-color" content="#1d4a36" media="(prefers-color-scheme: light)">
  <meta name="theme-color" content="#101511" media="(prefers-color-scheme: dark)">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Fiancho Chess">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${url}">${ogImage}
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/icons/icon-192.png">
  <link rel="manifest" href="/manifest.webmanifest">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&amp;family=Inter:wght@400;500;600;700&amp;display=swap">
  <link rel="stylesheet" href="/css/styles.css">${trainCss ? '\n  <link rel="stylesheet" href="/css/train.css">' : ''}
  <script>document.documentElement.classList.add('js');try{if((JSON.parse(localStorage.getItem('fiancho-chess.v1')||'{}').settings||{}).largeUi)document.documentElement.classList.add('ui-large')}catch(e){}</script>
</head>
<body${product ? ` data-product="${product}"` : ''}>
${sprite()}
${header(active)}
<main id="main" tabindex="-1">
${body}
</main>
${footer()}
<script src="/js/site-config.js"></script>
<script src="/js/products.js"></script>
<script src="/js/main.js"></script>${modules.map((m) => `\n<script type="module" src="${m}"></script>`).join('')}
</body>
</html>
`;
}

function write(file, html) {
  const p = path.join(OUT, file);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, html);
}

/* ------------------------------------------------------------------ shared blocks */
function courseIcon(p) {
  const tile = p.icon.library ? 'icon-tile--gold' : p.icon.color === 'b' ? 'icon-tile--alt' : 'icon-tile';
  return `<svg class="course-card__icon" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><rect width="100" height="100" rx="20" class="icon-tile ${tile}"/>${pieceAt(p.icon.type, p.icon.color, 14, 12, 72)}</svg>`;
}
function courseCard(p, i) {
  return `<li class="reveal" style="--i:${i}"><article class="course-card">
  <div class="course-card__top">${courseIcon(p)}<span class="level">${esc(p.level)}</span></div>
  <h3><a href="/${p.file}">${esc(p.name)}</a></h3>
  <p>${esc(p.card)}</p>
  <div class="course-card__foot"><span class="course-card__price"><span class="visually-hidden">Price: </span><span data-price-for="${p.id}">${usd(p.price)}</span></span><span class="course-card__more" aria-hidden="true">View course</span></div>
</article></li>`;
}
const selfStudyChips = '<ul class="chips"><li>Runs in your browser</li><li>Unlocked with a license code</li><li>No video</li><li>No live instruction</li><li>No coaching</li><li>No feedback on your games</li></ul>';
const faqItem = (q, a) => `<details class="faq-item"><summary>${esc(q)}</summary><div class="faq-item__body">${a}</div></details>`;
const ICONS = {
  lesson: '<svg class="feature__icon" viewBox="0 0 54 54" aria-hidden="true" focusable="false"><rect class="fi-stroke" x="7" y="7" width="40" height="40" rx="3"/><path class="fi-stroke" d="M7 20h40M7 33h40M20 7v40M33 7v40"/><rect class="fi-fill" x="20" y="20" width="13" height="13"/></svg>',
  board: '<svg class="feature__icon" viewBox="0 0 54 54" aria-hidden="true" focusable="false"><circle class="fi-stroke" cx="27" cy="27" r="20"/><path class="fi-stroke" d="M18 27.5l6 6 12-13"/><circle class="fi-fill" cx="43" cy="11" r="5"/></svg>',
  progress: '<svg class="feature__icon" viewBox="0 0 54 54" aria-hidden="true" focusable="false"><path class="fi-stroke" d="M8 44h38M14 44V30M24 44V20M34 44V26M44 44V12"/><circle class="fi-fill" cx="44" cy="10" r="4"/></svg>',
  pgn: '<svg class="feature__icon" viewBox="0 0 54 54" aria-hidden="true" focusable="false"><path class="fi-stroke" d="M13 6h20l10 10v32H13z"/><path class="fi-stroke" d="M33 6v10h10"/><path class="fi-stroke" d="M19 26h18M19 32h18M19 38h11"/><rect class="fi-fill" x="19" y="13" width="7" height="7" rx="1"/></svg>'
};

/* ------------------------------------------------------------------ FAQ */
const FAQ = {
  receive: ['What do I receive after I pay, and how?', '<p>Straight after payment you land on an order confirmation page. It shows your license code, activates it in that browser, and has a <strong>Start training</strong> button that takes you into the first lesson. You can save the confirmation as a PDF or print it. Nothing is downloaded or shipped: the course runs in your web browser.</p>'],
  licenses: ['How do licenses work?', '<p>Each purchase comes with one license code, which starts with FIAN. Entering it unlocks that course in your browser; a Complete Training Library code unlocks all seven courses. The license is for your own personal use, on your own devices. Licenses are checked in your browser, so no account or sign-in is needed.</p>'],
  device: ['How do I use a course on another device?', '<p>Open the <a href="/train/">Training Room</a> on the other device, or the course’s product page there, and enter the same license code. Progress is stored separately on each device; to move your progress, use <strong>Export backup</strong> on one device and <strong>Import backup</strong> on the other.</p>'],
  lost: ['I lost my license code. What can I do?', '<p>If the course is still unlocked in your browser, the code is shown on the course’s product page and inside any backup file you exported. Otherwise, contact us through the <a href="/contact.html">Contact page</a> with your order number and the email address you used at checkout, and we will send you a replacement code.</p>'],
  backups: ['Where is my progress stored, and how do backups work?', '<p>Your licenses and training progress are stored only in your own browser and are never sent anywhere. That keeps them private, but it also means clearing your browser data removes them. Use <strong>Export backup</strong> in the Training Room to save a backup file, and <strong>Import backup</strong> to restore it on any device. If you haven’t made a backup in 30 days, the Training Room shows a reminder.</p>'],
  offline: ['Does it work offline?', '<p>Yes. After you have opened the Training Room once while online, the trainer and the courses are saved for offline use. Most browsers also let you install Fiancho Chess as an app from the address bar or the share menu. When the site changes, the saved copy updates itself the next time you are online.</p>'],
  devices: ['Which devices and browsers are supported?', '<p>Any device with a modern web browser: a computer, tablet or phone running a current version of Chrome, Edge, Firefox or Safari, including Safari on iPhone and iPad. You can move pieces with a mouse, by touch, or with the keyboard.</p>'],
  pgn: ['Can I export the positions as PGN files?', '<p>Yes. On each course’s page in the Training Room, <strong>Export PGN</strong> saves every position in the course as a PGN file, with the solutions and explanations as comments. PGN is the standard chess format, so the file opens in any chess software or online analysis board that reads PGN.</p>'],
  video: ['Is there any video, live instruction or coaching?', '<p>No. Fiancho Chess courses are interactive self-study programs: lessons, examples and training positions on the board. There is no video, no live instruction, no coaching, and no feedback on your own games.</p>'],
  level: ['Which course should I start with?', '<p>Each course states its level. If you know how the pieces move and are newer to structured training, start with <a href="/tactics-fundamentals.html">Tactics Fundamentals</a> or <a href="/checkmate-patterns.html">Checkmate Patterns</a>. <a href="/endgame-essentials.html">Endgame Essentials</a> runs from beginner to intermediate, the two opening repertoires are intermediate, and <a href="/positional-play-strategy.html">Positional Play &amp; Strategy</a> and <a href="/calculation-visualization.html">Calculation &amp; Visualization Training</a> run from intermediate to advanced. Every product page also lists who the course is for and who it isn’t for.</p>'],
  error: ['What happens if I find an error in the analysis?', '<p>Every position has a <strong>Report a problem</strong> link that opens an email to us with the course and position already filled in. Every report is checked, and confirmed corrections are applied to the course automatically, so you get them the next time you open it online.</p>'],
  updated: ['Are the courses updated?', '<p>Yes. When we correct an error or improve a lesson, the update reaches you automatically: the trainer picks up the new version the next time you open it while online. Your progress is kept.</p>'],
  coaches: ['Can coaches or clubs use the courses with students?', '<p>A standard purchase is a personal license and doesn’t cover use with students or club members, or sharing your code. If you are a coach, school or club, contact us through the <a href="/contact.html">Contact page</a> to ask about a separate license.</p>'],
  share: ['Can I share my license code?', '<p>No. License codes may not be shared, published, sold or transferred. The license is for your own use on your own devices; see the <a href="/terms.html">Terms of Service</a>.</p>'],
  refunds: ['What is your refund policy?', '<p>You can request a full refund on any purchase within 14 days, no reason required, through the <a href="/contact.html">Contact page</a> with your order number. Refunds go back to your original payment method within 5 business days of your request; your payment provider’s processing time may add a few days. The license ends when a purchase is refunded. See the <a href="/refund-policy.html">Refund Policy</a>.</p>'],
  taxes: ['Are taxes included in the price?', '<p>Prices are shown in US dollars. Applicable taxes are shown at checkout, before you pay.</p>'],
  account: ['Do I need an account?', '<p>No. There are no accounts. Your license code is all you need.</p>']
};

/* ------------------------------------------------------------------ home */
function homePage() {
  const plies = ['1.e4', 'e5', '2.Bc4', 'Nc6', '3.Qh5', 'Nf6', '4.Qxf7#'];
  const plyHtml = plies.map((p, i) => `<span data-ply="${i}"${i === plies.length - 1 ? ' class="is-current"' : ''}>${p}</span>`).join(' ');
  const body = `
<section class="hero">
  <div class="container hero__grid">
    <div class="hero__copy">
      <p class="eyebrow">Interactive chess training</p>
      <h1>Chess training you play on the board, at your own pace.</h1>
      <p class="lede">Fiancho Chess makes interactive training programs that run in your web browser. Each course pairs short lessons with positions you solve yourself on the board, with instant feedback, hints and a review queue that brings back what you missed.</p>
      <div class="hero__actions">
        <a class="btn btn--primary" href="#courses">Browse the courses</a>
        <a class="text-link" href="#how-it-works">How purchase and access work</a>
      </div>
      <dl class="hero__facts">
        <div><dt>Format</dt><dd>Browser-based trainer</dd></div>
        <div><dt>Access</dt><dd>Instant, with a license code</dd></div>
        <div><dt>Refunds</dt><dd><a href="/refund-policy.html">14-day refund policy</a></dd></div>
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
      <h2 id="self-study-heading">Self-study training, plainly stated</h2>
    </div>
    <div>
      <p>Every Fiancho Chess product is an interactive training program that runs in your web browser and is unlocked with a license code. There is no video, no live instruction, no coaching, and no feedback on your own games. You work through the lessons and training positions on your own, and the trainer checks every move.</p>
      ${selfStudyChips}
    </div>
  </div>
</section>

<section class="section" id="courses" aria-labelledby="courses-heading">
  <div class="container">
    <div class="section-head">
      <p class="eyebrow">The courses</p>
      <h2 id="courses-heading">Seven courses and a complete library</h2>
      <p>Every course runs in the same trainer. Each product page shows the level, the full contents, previews from the trainer and the price before any purchase step.</p>
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
      <h2 id="included-heading">What every course includes</h2>
      <p>The same trainer powers every course, so once you know one, you know them all.</p>
    </div>
    <ul class="feature-grid feature-grid--four">
      <li class="reveal" style="--i:0"><div class="feature">${ICONS.lesson}<h3>Lessons on the board</h3><p>Short, original explanations of each idea, with worked examples you step through move by move.</p></div></li>
      <li class="reveal" style="--i:1"><div class="feature">${ICONS.board}<h3>Positions you play</h3><p>Training positions where you make the moves. Every move is checked, with hints, the full solution and a retry when you need them.</p></div></li>
      <li class="reveal" style="--i:2"><div class="feature">${ICONS.progress}<h3>Progress and review</h3><p>Progress and first-try accuracy for each course, and a review queue that brings back the positions you missed.</p></div></li>
      <li class="reveal" style="--i:3"><div class="feature">${ICONS.pgn}<h3>PGN export</h3><p>Export any course’s positions as a PGN file to study them in the chess software you already use.</p></div></li>
    </ul>
  </div>
</section>

<section class="section" id="how-it-works" aria-labelledby="how-heading">
  <div class="container">
    <div class="section-head">
      <p class="eyebrow">Purchase and access</p>
      <h2 id="how-heading">How purchase and access work</h2>
      <p>No account, no download and nothing shipped. You pay once and start training straight away.</p>
    </div>
    <ol class="steps">
      <li class="reveal" style="--i:0"><div class="step"><span class="step__num" aria-hidden="true">01</span><h3>Choose a course</h3><p>Each course page lists the full contents, the level, previews from the trainer and the price.</p></div></li>
      <li class="reveal" style="--i:1"><div class="step"><span class="step__num" aria-hidden="true">02</span><h3>Pay at checkout</h3><p>Agree to the Terms of Service and Refund Policy, then pay on the payment provider’s checkout page. Applicable taxes are shown there.</p></div></li>
      <li class="reveal" style="--i:2"><div class="step"><span class="step__num" aria-hidden="true">03</span><h3>Get your license</h3><p>The order confirmation page shows your license code and activates it in your browser immediately.</p></div></li>
      <li class="reveal" style="--i:3"><div class="step"><span class="step__num" aria-hidden="true">04</span><h3>Start training</h3><p>Start training goes straight into the first lesson. On another device, enter the same code in the Training Room.</p></div></li>
    </ol>
    <p class="after-steps">Every purchase is covered by a <a href="/refund-policy.html">14-day refund policy</a>, no reason required. Full details are in the <a href="/delivery-policy.html">Delivery Policy</a>.</p>
  </div>
</section>

<section class="section section--alt" id="faq" aria-labelledby="faq-heading">
  <div class="container">
    <div class="section-head"><p class="eyebrow">Questions</p><h2 id="faq-heading">Frequently asked questions</h2></div>
    <div class="faq-list">${[FAQ.receive, FAQ.device, FAQ.video, FAQ.level].map(([q, a]) => faqItem(q, a)).join('')}</div>
    <p class="section-foot"><a class="text-link" href="/faq.html">Read all questions</a></p>
  </div>
</section>`;
  write('index.html', layout({ file: 'index.html', title: 'Fiancho Chess | Interactive Chess Training Programs', description: 'Interactive chess training programs that run in your browser: short lessons and training positions you play on the board, unlocked with a license code. Self-study, no video.', body }));
}

/* ------------------------------------------------------------------ product pages */
function productPage(p) {
  const isLib = p.id === LIB;
  const contents = isLib
    ? `<ol class="contents-list">${COURSES.map((c) => `<li><div><h3><a href="/${c.file}">${esc(c.name)}</a></h3><p><strong>${esc(c.level)}.</strong> ${esc(c.card)}</p></div></li>`).join('')}</ol>`
    : `<ol class="contents-list">${courseData[p.id].sections.map((s) => `<li><div><h3>${esc(s.title)}</h3><p>${esc(p.sections[s.id] || '')}</p><p class="contents-meta">${esc(sectionSummary(s))}</p></div></li>`).join('')}</ol>`;
  const specs = previews[p.id] || [];
  const previewHtml = specs.map((s, i) => `<figure class="preview reveal" style="--i:${i}"><div class="preview__shot"><img src="/img/previews/${p.id}-${i + 1}.jpg" width="1280" height="860" loading="lazy" alt="${esc(`Screenshot of the Fiancho Chess trainer: ${s.caption}`)}"></div><figcaption>${esc(s.caption)}</figcaption></figure>`).join('\n      ');
  const others = products.filter((x) => x.id !== p.id);
  const body = `
<section class="product-hero">
  <div class="container">
    <nav class="breadcrumb" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li><a href="/#courses">Courses</a></li><li aria-current="page">${esc(p.name)}</li></ol></nav>
    <div class="product-hero__grid">
      <div>
        <p class="eyebrow">${esc(p.level)} level</p>
        <h1>${esc(p.name)}</h1>
        <p class="lede">${esc(p.lede)}</p>
        <dl class="facts">
          <div><dt>Level</dt><dd>${esc(p.level)}</dd></div>
          <div><dt>Format</dt><dd>${isLib ? 'Seven interactive training programs' : 'Interactive training program in your browser'}</dd></div>
          <div><dt>Access</dt><dd>Instant, with a license code${isLib ? ' that unlocks all seven' : ''}</dd></div>
          <div><dt>Works on</dt><dd>Computer, tablet or phone, also offline once loaded</dd></div>
        </dl>
        <div class="callout"><p><strong>Self-study training.</strong> ${isLib ? 'These courses are' : 'This course is'} interactive lessons and training positions in your browser. There is no video, no live instruction, no coaching, and no feedback on your own games.</p></div>
      </div>
      <div class="flip" data-flip>
        <div class="flip__inner">
          <aside class="buy-box flip__face flip__front" aria-labelledby="buy-heading">
            <h2 id="buy-heading" class="visually-hidden">Price and purchase</h2>
            <p class="buy-box__name">${esc(p.name)}</p>
            <p class="buy-box__level">${esc(p.level)} · browser-based trainer</p>
            <div class="price-row"><p class="price"><span data-price-for="${p.id}">${usd(p.price)}</span><span class="price__cur">USD</span></p></div>
            <p class="buy-box__terms">Instant access with a license · <a href="/refund-policy.html">14-day refund policy</a> · Applicable taxes are shown at checkout</p>
            <div class="buy-box__action" data-buy-for="${p.id}" hidden></div>
            <ul class="buy-box__list">${featureList(p.id).map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
            <section class="own-panel" data-own-panel aria-labelledby="own-h" hidden></section>
          </aside>
          <div class="owned-card flip__face flip__back" data-owned aria-live="polite"></div>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="section section--alt" aria-labelledby="contents-heading">
  <div class="container">
    <div class="section-head"><p class="eyebrow">Full contents</p><h2 id="contents-heading">${isLib ? 'The seven courses included' : 'What the course contains'}</h2><p>${isLib ? 'Each course is included in full and unlocked by the same license code. Follow a link for the full contents of any course.' : 'The course is organized into the sections below, exactly as they appear in the trainer.'}</p></div>
    ${contents}
  </div>
</section>

<section class="section" aria-labelledby="preview-heading">
  <div class="container">
    <div class="section-head"><p class="eyebrow">Inside the trainer</p><h2 id="preview-heading">Previews</h2><p>Screenshots taken from the real trainer.</p></div>
    <div class="preview-grid">
      ${previewHtml}
    </div>
  </div>
</section>

<section class="section section--alt" aria-label="Who this course suits">
  <div class="container fit-grid">
    <div class="fit"><h2>Who it’s for</h2><ul class="check-list check-list--yes">${p.forWho.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
    <div class="fit"><h2>Who it isn’t for</h2><ul class="check-list check-list--no">${p.notFor.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
  </div>
</section>

<section class="section" aria-labelledby="need-heading">
  <div class="container split">
    <div>
      <p class="eyebrow">What you need</p>
      <h2 id="need-heading">A modern web browser</h2>
      <p class="lede">A current version of Chrome, Edge, Firefox or Safari on a computer, tablet or phone. Nothing to install, although you can add it to your home screen as an app.</p>
    </div>
    <ul class="zip-list">
      <li><span class="file-badge" aria-hidden="true">KEY</span><div><strong>A license code</strong><span>Shown on your order confirmation page and activated there automatically. Enter the same code on any other device.</span></div></li>
      <li><span class="file-badge file-badge--alt" aria-hidden="true">OFF</span><div><strong>Works offline</strong><span>After the first visit online, the trainer and your courses work without a connection.</span></div></li>
      <li><span class="file-badge" aria-hidden="true">PGN</span><div><strong>PGN export</strong><span>Export the course’s positions to study them in any chess software that reads PGN.</span></div></li>
    </ul>
  </div>
</section>
${isLib ? `
<section class="section section--alt" aria-labelledby="order-heading">
  <div class="container">
    <div class="section-head"><p class="eyebrow">Using the library</p><h2 id="order-heading">A suggested order</h2><p>The courses can be taken in any order, but this sequence moves from the foundations to the most demanding material.</p></div>
    <ol class="steps">${studyOrder.map(([h, t], i) => `<li class="reveal" style="--i:${i}"><div class="step"><span class="step__num" aria-hidden="true">0${i + 1}</span><h3>${esc(h)}</h3><p>${esc(t)}</p></div></li>`).join('')}</ol>
  </div>
</section>` : ''}
<section class="section section--tight" aria-labelledby="delivery-heading">
  <div class="container">
    <div class="cta-band">
      <div><h2 id="delivery-heading">Access and refunds</h2><p>Your license code appears on the order confirmation page right after payment and is activated in your browser immediately. Any purchase can be refunded in full within 14 days, no reason required.</p></div>
      <div class="cta-band__actions"><a class="btn btn--primary" href="/delivery-policy.html">Delivery Policy</a><a class="btn btn--ghost" href="/refund-policy.html">Refund Policy</a></div>
    </div>
  </div>
</section>
${isLib ? '' : `
<section class="section section--tight section--alt" aria-labelledby="related-heading">
  <div class="container">
    <h2 id="related-heading">Other courses</h2>
    <ul class="related-list">${others.map((x) => `<li><a href="/${x.file}"><span>${esc(x.name)}</span><small data-price-for="${x.id}">${usd(x.price)}</small></a></li>`).join('')}</ul>
  </div>
</section>`}`;
  write(p.file, layout({ file: p.file, title: `${p.name} | Fiancho Chess`, description: p.metaDescription, active: 'courses', body, product: p.id, modules: ['/js/account.js'], trainCss: true }));
}

/* ------------------------------------------------------------------ simple pages */
function pageHero(eyebrow, title, lede, crumb) {
  return `<section class="page-hero"><div class="container">
  <nav class="breadcrumb" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li aria-current="page">${esc(crumb)}</li></ol></nav>
  <p class="eyebrow">${esc(eyebrow)}</p>
  <h1>${title}</h1>
  ${lede ? `<p class="lede">${lede}</p>` : ''}
</div></section>`;
}

function aboutPage() {
  const body = `${pageHero('About', 'About Fiancho Chess', 'Fiancho Chess makes interactive chess training programs that run in your web browser: short lessons and positions you play on the board, at your own pace.', 'About')}
<section class="section section--tight" aria-labelledby="make-heading">
  <div class="container split">
    <div><h2 id="make-heading">What we make</h2></div>
    <div class="prose">
      <p>Each Fiancho Chess course covers one part of the game: tactics, checkmate patterns, an opening repertoire for White or for Black, endgames, positional play, or calculation and visualization. The Complete Training Library brings all seven together under one license.</p>
      <p>Every course follows the same rhythm. An idea is explained in plain language and shown in a worked example on the board, then you practise it in positions where you make the moves yourself. The trainer checks every move, offers hints and the full solution, and brings back the positions you missed.</p>
      <p>The opening courses work differently: a line explorer explains the plan behind every move, and a drill mode lets you play your side of each line until you know it. In the endgame course, practice positions are played against exact replies from complete endgame tables.</p>
    </div>
  </div>
</section>

<section class="section section--alt" aria-labelledby="why-heading">
  <div class="container">
    <div class="section-head"><h2 id="why-heading">Why interactive training</h2><p>Reading about chess helps, but finding the move yourself is what builds the habit.</p></div>
    <ul class="value-grid">
      <li class="reveal" style="--i:0"><h3>You set the pace</h3><p>There is no schedule and nothing to keep up with. Spend five minutes on one position or an evening on a whole section.</p></li>
      <li class="reveal" style="--i:1"><h3>Thinking comes first</h3><p>Positions are set before their solutions, so you do the work of finding the move. Hints and solutions are there when you need them, not before.</p></li>
      <li class="reveal" style="--i:2"><h3>It remembers what you missed</h3><p>Positions you get wrong go into a review queue, so you come back to exactly the ideas that need more work.</p></li>
      <li class="reveal" style="--i:3"><h3>It stays private</h3><p>Your licenses and progress are stored only in your own browser. Nothing you do in the trainer is sent anywhere.</p></li>
    </ul>
  </div>
</section>

<section class="section" aria-labelledby="how-heading">
  <div class="container split">
    <div><h2 id="how-heading">How the material is put together</h2></div>
    <div class="prose">
      <p>All explanations and annotations are original. Training positions are either composed for these courses or drawn from a public-domain (CC0) position database.</p>
      <p>Every solution is checked with a chess engine before release, and any move that is equally good is accepted, so a correct alternative is never marked wrong. No engine runs in the product itself.</p>
      <p>Chess analysis can still contain mistakes, so every position has a Report a problem link. Confirmed corrections are applied to the course automatically.</p>
    </div>
  </div>
</section>

<section class="section section--alt" aria-labelledby="not-heading">
  <div class="container split">
    <div><h2 id="not-heading">What Fiancho Chess doesn’t do</h2></div>
    <div class="prose">
      <p>Fiancho Chess sells self-study training programs and nothing else. There is no video, no live instruction, no coaching, and no feedback on your own games. We don’t promise any particular result: how much a course helps depends on how you study and play, where you start from, and many other individual factors.</p>
      <p>Fiancho Chess is independent. It is not affiliated with or endorsed by any chess federation, rating organization, chess website or software maker.</p>
    </div>
  </div>
</section>

<section class="section section--tight"><div class="container"><div class="cta-band"><div><h2>See the courses</h2><p>Every course page shows the full contents, the level, previews from the trainer and the price.</p></div><div class="cta-band__actions"><a class="btn btn--primary" href="/#courses">Browse the courses</a><a class="btn btn--ghost" href="/contact.html">Contact</a></div></div></div></section>`;
  write('about.html', layout({ file: 'about.html', title: 'About | Fiancho Chess', description: 'About Fiancho Chess: interactive chess training programs that run in your browser, how the lessons and training positions are put together, and what we don’t do.', active: 'about', body }));
}

function faqPage() {
  const groups = [
    ['Buying and access', [FAQ.receive, FAQ.licenses, FAQ.device, FAQ.lost, FAQ.taxes, FAQ.account, FAQ.refunds]],
    ['Using the trainer', [FAQ.video, FAQ.level, FAQ.devices, FAQ.offline, FAQ.backups, FAQ.pgn]],
    ['Corrections, updates and licensing', [FAQ.error, FAQ.updated, FAQ.coaches, FAQ.share]]
  ];
  const body = `${pageHero('FAQ', 'Frequently asked questions', 'How licenses work, using another device, backups, offline use, supported devices, PGN export, corrections, licensing and refunds. If your question isn’t here, contact us through the <a href="/contact.html">Contact page</a>.', 'FAQ')}
<section class="section section--tight"><div class="container">
  <div class="callout" style="max-width:860px;margin-bottom:48px"><p><strong>Self-study training.</strong> Every Fiancho Chess product is an interactive training program that runs in your browser. There is no video, no live instruction, no coaching, and no feedback on your own games.</p></div>
  ${groups.map(([h, items], gi) => `<div class="faq-group"><h2 id="faq-group-${gi + 1}">${h}</h2><div class="faq-list">${items.map(([q, a]) => faqItem(q, a)).join('')}</div></div>`).join('\n  ')}
</div></section>`;
  write('faq.html', layout({ file: 'faq.html', title: 'FAQ | Fiancho Chess', description: 'Fiancho Chess FAQ: what you receive after purchase, how licenses work, other devices, backups, offline use, supported devices, PGN export, corrections, licensing and refunds.', active: 'faq', body }));
}

function contactPage() {
  const body = `${pageHero('Contact', 'Contact Fiancho Chess', 'Questions about a course, a license, an order, a refund or a correction? Fiancho Chess handles support by email, and a person reads and answers every message.', 'Contact')}
<section class="section section--tight"><div class="container contact-grid">
  <div class="contact-stack">
    <div class="contact-card" data-support-email hidden><p class="contact-card__label">Support email</p><p class="contact-card__value" data-email-link></p></div>
    <div class="info-card">
      <h2>Response time</h2>
      <p>We reply to every message within two business days.</p>
      <h2 style="margin-top:28px">What to include</h2>
      <p>To help us answer in one reply, please include:</p>
      <ul><li>Your order number</li><li>The email address you used at checkout</li><li>The name of the course</li><li>For a problem with a position, the <strong>Report a problem</strong> link in the trainer fills in the details for you</li></ul>
    </div>
  </div>
  <div>
    <h2>Common requests</h2>
    <ul class="request-list">
      <li><h3>A lost license code</h3><p>If the course is still unlocked in your browser, the code is on the course’s product page. Otherwise, write to us with your order number and we’ll send a replacement code.</p></li>
      <li><h3>Using a course on another device</h3><p>Enter the same license code in the <a href="/train/">Training Room</a> or on the product page on that device. To move your progress, export a backup and import it there.</p></li>
      <li><h3>Refunds</h3><p>Any purchase can be refunded in full within 14 days, no reason required. Include your order number. See the <a href="/refund-policy.html">Refund Policy</a>.</p></li>
      <li><h3>A problem with a position</h3><p>Use the Report a problem link under the position. Confirmed corrections are applied to the course automatically.</p></li>
      <li><h3>Licenses for coaches and clubs</h3><p>The standard license is for personal use. Ask us about a separate license for using the courses with students or club members.</p></li>
      <li><h3>Privacy requests</h3><p>To access, correct or delete the order information we hold, or to object to its use, see the <a href="/privacy.html">Privacy Policy</a> and write to us.</p></li>
    </ul>
  </div>
</div></section>`;
  write('contact.html', layout({ file: 'contact.html', title: 'Contact | Fiancho Chess', description: 'Contact Fiancho Chess about licenses, orders, refunds, corrections and coach or club licenses. Replies within two business days. Include your order number and checkout email.', active: 'contact', body }));
}

/* ------------------------------------------------------------------ policies */
function docPage({ file, crumb, title, description, lede, summary, sections }) {
  const toc = `<nav class="doc-toc" aria-labelledby="toc-heading"><h2 id="toc-heading">On this page</h2><ol>${sections.map(([id, h]) => `<li><a href="#${id}">${h}</a></li>`).join('')}</ol></nav>`;
  const body = `${pageHero('Policy', esc(title), lede, crumb)}
<section class="section section--tight" style="padding-top:0"><div class="container doc-layout">
  <aside>${toc}</aside>
  <article class="prose">
    <p class="updated">Last updated: <time datetime="${UPDATED_ISO}">${UPDATED}</time></p>
    ${summary ? `<div class="summary-box">${summary}</div>` : ''}
    ${sections.map(([id, h, html]) => `<h2 id="${id}">${h}</h2>\n    ${html}`).join('\n    ')}
  </article>
</div></section>`;
  write(file, layout({ file, title: `${title} | Fiancho Chess`, description, body }));
}
const contact = '<a href="/contact.html">Contact page</a>';

function policyPages() {
  docPage({
    file: 'terms.html', crumb: 'Terms of Service', title: 'Terms of Service',
    description: 'Fiancho Chess Terms of Service: browser-based chess training programs unlocked with a license, the personal-use license, license codes, backups, payment, delivery, refunds and liability.',
    lede: 'The terms that apply when you use this website or buy a Fiancho Chess product, written in plain language.',
    summary: '<p>In short: you buy a personal license to use a browser-based training program on your own devices. Keep your license code to yourself, back up your own data, and contact us if you need a license for students or a club.</p>',
    sections: [
      ['acceptance', 'Acceptance of these terms', `<p>These Terms of Service apply to your use of the Fiancho Chess website and trainer and to every purchase of a Fiancho Chess product. By using the website or buying a product, you agree to these terms. If you do not agree, please do not use the website or buy a product.</p>`],
      ['agreement', 'Agreement before checkout', `<p>Before you can go to checkout, you must agree to these Terms of Service and to the <a href="/refund-policy.html">Refund Policy</a>. Each product page has a checkbox reading &ldquo;I agree to the Terms of Service and Refund Policy,&rdquo; and the buy button stays disabled until it is ticked.</p>`],
      ['products', 'What we sell', `<p>Fiancho Chess sells browser-based chess training programs. Each product is unlocked with a license code and runs in a modern web browser on a computer, tablet or phone. The programs are self-study training: they include lessons, examples and training positions, and do not include video, live instruction, coaching, or feedback on your own games.</p><p>The contents, level, format and price of each product are described on its product page before purchase.</p>`],
      ['license', 'Your license', `<p>When you buy a product, Fiancho Chess grants you a personal, non-exclusive, non-transferable license to use it for your own training. You may activate your license code on your own devices, use the trainer offline once it is loaded, and export the course’s positions as PGN files for your own study.</p>`],
      ['restrictions', 'What the license does not allow', `<p>You may not:</p><ul><li>share, publish, sell or transfer your license code, or let anyone else use it;</li><li>copy, redistribute or publish the course content, including exported PGN files, in whole or in part;</li><li>use the courses with students, teams or club members under a personal license;</li><li>attempt to get around the license system or use a code that wasn’t issued to you.</li></ul>`],
      ['coaches', 'Coaches and clubs', `<p>The personal license does not cover use with students, teams or club members. If you are a coach, school or club, please get in touch through the ${contact} to ask about a separate license.</p>`],
      ['data', 'Your license and data', `<p>Licenses and training progress are stored only in your own browser and are never sent to us. You are responsible for backing up your own data with the Export backup feature in the Training Room. Clearing your browser data, or using a different browser or device, removes the data stored there; your license code can be entered again at any time. If you lose your code, we can replace it as described in the <a href="/delivery-policy.html">Delivery Policy</a>.</p>`],
      ['pricing', 'Prices, taxes and payment', `<p>Prices are shown in US dollars on each product page. Applicable taxes are shown at checkout. Payment is handled by a third-party payment provider, under its own terms and privacy policy; Fiancho Chess never sees your full payment card details. Your purchase is complete when the payment provider confirms your payment.</p>`],
      ['delivery', 'Delivery', `<p>Products are delivered digitally as described in the <a href="/delivery-policy.html">Delivery Policy</a>.</p>`],
      ['refunds', 'Refunds', `<p>Refunds are handled as described in the <a href="/refund-policy.html">Refund Policy</a>. In summary, you can request a full refund on any purchase within 14 days, no reason required. Your license ends when a purchase is refunded.</p>`],
      ['ownership', 'Ownership', `<p>All explanations, annotations, lessons and software in the products and on this website are owned by Fiancho Chess and protected by copyright. Some training positions come from a public-domain (CC0) position database; those positions are not claimed as ours, but the selection, explanations and annotations are. The trainer uses the open-source chess.js library under its own license. Your license gives you the right to use the products as described above; it does not transfer ownership.</p>`],
      ['warranties', 'Disclaimer of warranties', `<p>The products are provided &ldquo;as is.&rdquo; We take care to make them accurate and useful, but to the extent permitted by law, Fiancho Chess disclaims all warranties, express or implied, including implied warranties of merchantability, fitness for a particular purpose and non-infringement. We do not promise any particular result from using the products. See also the <a href="/disclaimer.html">Disclaimer</a>. Nothing in these terms affects rights you have under consumer protection law that cannot be excluded; see <a href="/consumer-rights.html">Your consumer rights</a>.</p>`],
      ['liability', 'Limitation of liability', `<p>To the extent permitted by law, Fiancho Chess’s total liability for any claim relating to a product or to these terms is limited to the amount you paid for that product. Fiancho Chess is not liable for indirect or consequential losses. Nothing in these terms excludes or limits any liability that cannot be excluded or limited by law.</p>`],
      ['changes', 'Changes to these terms', `<p>We may update these terms from time to time. When we do, the new version is posted on this page with a new &ldquo;Last updated&rdquo; date. The terms in effect when you made a purchase apply to that purchase.</p>`],
      ['contact', 'Contact', `<p>Questions about these terms can be sent through the ${contact}.</p>`]
    ]
  });

  docPage({
    file: 'privacy.html', crumb: 'Privacy Policy', title: 'Privacy Policy',
    description: 'Fiancho Chess Privacy Policy: no cookies, analytics or trackers; licenses and progress stay in your browser; the order information we receive and your GDPR and CCPA rights.',
    lede: 'What information Fiancho Chess receives, what stays on your own device, and the rights you have.',
    summary: '<p>In short: this website uses no cookies, no analytics and no advertising trackers. Your licenses and training progress are stored only in your own browser and are never sent anywhere. When you buy a course, we receive basic order information from the payment provider and use it only for support, refunds and the records the law requires. We never sell your information or share it for advertising.</p>',
    sections: [
      ['who', 'Who we are', `<p>This policy covers the Fiancho Chess website and trainer and the sale of Fiancho Chess products. Fiancho Chess is responsible for the personal information described here. You can reach us through the ${contact}.</p>`],
      ['website', 'What this website does not do', `<p>This website uses no cookies, no analytics and no advertising trackers, and has no accounts or sign-ins. Nothing you type into the trainer, including your license code, is sent to us.</p>`],
      ['device', 'What stays on your device', `<p>Your license codes, training progress and settings are stored in your browser’s local storage on your own device, and the trainer’s files are saved by your browser so it can work offline. This information never leaves your device unless you export a backup file yourself. Because only your browser holds it, we can’t recover it for you: please use the Export backup feature in the Training Room.</p>`],
      ['services', 'Services involved in showing the site', `<p>The website is hosted by Vercel. Like any web host, Vercel processes technical information such as IP addresses to deliver the pages and protect the service, under its own privacy policy. Fonts are loaded from Google Fonts, which receives your IP address as part of the normal web request, under Google’s privacy policy. Fiancho Chess does not receive or use this information.</p>`],
      ['payments', 'Payments', `<p>Payments are handled by third-party payment providers. When you buy a course, the payment provider collects your name, email address, billing details and payment information and processes them under its own privacy policy. Fiancho Chess never sees your full payment card details.</p>`],
      ['orders', 'Information we receive when you buy', `<p>From the payment provider we receive order information: your name, your email address, the products you bought and your country. We use it only to provide support, process refunds and meet tax and accounting obligations. If you contact us, we also receive your email address and message, and use them to answer you.</p><p>Personal information is never sold, and never shared for advertising.</p>`],
      ['legal-bases', 'Legal bases for processing', `<p>Where the EU or UK General Data Protection Regulation (GDPR) applies, we process order information because it is necessary to perform our contract with you (support and refunds) and because we have a legal obligation to keep tax and accounting records. We handle support messages on the basis of our legitimate interest in answering the people who write to us.</p>`],
      ['sharing', 'Who else sees your information', `<p>Order information is shared only with the payment provider that processes your order, with service providers we need to run the business, and with authorities where the law requires it. These services may process information in other countries, with the safeguards required by applicable law.</p>`],
      ['retention', 'How long we keep it', `<p>We keep order information for as long as we need it to meet legal, tax and accounting requirements, which can mean several years after a purchase. Support messages are kept as long as needed to resolve the request and keep related records. When information is no longer needed for these purposes, it is deleted.</p>`],
      ['rights', 'Your rights', `<p>Wherever you live, we will honor requests to <strong>access</strong> the personal information we hold about you, <strong>correct</strong> it, <strong>delete</strong> it (unless we must keep it to meet a legal obligation such as tax record-keeping), and <strong>object</strong> to how we use it.</p><h3>GDPR (European Economic Area and United Kingdom)</h3><p>You also have the right to restrict processing, to receive your information in a portable format, and to complain to your local data protection authority.</p><h3>CCPA (California)</h3><p>California residents have the right to know what personal information is collected and how it is used, to delete it, to correct it, and to opt out of its sale or sharing. Fiancho Chess does not sell or share personal information for advertising, and you will not be treated differently for exercising these rights.</p><h3>How to make a request</h3><p>Send your request through the ${contact}, with your order number and the email address you used at checkout so we can confirm the request is yours. We respond within the time the law requires.</p>`],
      ['children', 'Children', `<p>This website is not directed at children under 13, and we do not knowingly collect personal information from them. If you believe a child under 13 has given us personal information, contact us through the ${contact} and we will delete it.</p>`],
      ['changes', 'Changes to this policy', `<p>If this policy changes, the updated version will be posted on this page with a new &ldquo;Last updated&rdquo; date. If a change materially affects how we use order information, we will say so clearly at the top of this page.</p>`],
      ['contact', 'Contact', `<p>Questions about privacy, and requests to exercise your rights, can be sent through the ${contact}.</p>`]
    ]
  });

  docPage({
    file: 'refund-policy.html', crumb: 'Refund Policy', title: 'Refund Policy',
    description: 'Fiancho Chess Refund Policy: a full refund on any purchase within 14 days, no reason required, paid within 5 business days. The license ends when a purchase is refunded.',
    lede: 'A full refund on any purchase within 14 days, with no reason required.',
    summary: '<ul><li>Full refund within 14 days of purchase, no reason required.</li><li>Request it through the Contact page with your order number.</li><li>Refunds go to your original payment method within 5 business days.</li><li>The license ends when a purchase is refunded.</li></ul>',
    sections: [
      ['eligibility', 'The 14-day refund', `<p>You can request a full refund on any Fiancho Chess purchase within 14 days of buying it, whether or not you have started training. You don’t need to give a reason. This applies to every product, including the Complete Training Library, which is refunded as a single purchase.</p>`],
      ['how', 'How to request a refund', `<p>Send your request through the ${contact} and include your order number. Including the email address you used at checkout helps us find your order quickly.</p>`],
      ['payment', 'How refunds are paid', `<p>Refunds go back to your original payment method. They are issued within 5 business days of your request. Your payment provider’s processing time may add a few days before the money appears in your account.</p>`],
      ['license', 'Your license after a refund', `<p>The license ends when a purchase is refunded, and the license code may no longer be used.</p>`],
      ['rights', 'Your statutory rights', `<p>This policy is in addition to any rights you have under consumer protection law. See <a href="/consumer-rights.html">Your consumer rights</a>.</p>`],
      ['contact', 'Contact', `<p>Questions about refunds can be sent through the ${contact}. We reply within two business days.</p>`]
    ]
  });

  docPage({
    file: 'delivery-policy.html', crumb: 'Delivery Policy', title: 'Delivery Policy',
    description: 'Fiancho Chess Delivery Policy: digital products delivered instantly through a license code issued and activated on the order confirmation page. No physical shipment.',
    lede: 'How Fiancho Chess products are delivered, step by step, and how lost licenses are replaced.',
    summary: '<ul><li>All products are digital: browser-based training programs unlocked with a license code.</li><li>Your license code is issued and activated on the order confirmation page immediately after payment.</li><li>There is no physical shipment.</li></ul>',
    sections: [
      ['digital', 'Digital products only', `<p>All Fiancho Chess products are digital. Each one is a training program that runs in your web browser and is unlocked with a license code. There is no physical shipment.</p>`],
      ['steps', 'How delivery works, step by step', `<ol><li><strong>Agree and pay.</strong> On the product page, tick the box to agree to the <a href="/terms.html">Terms of Service</a> and <a href="/refund-policy.html">Refund Policy</a>, then pay on the payment provider’s checkout page.</li><li><strong>Get your license immediately.</strong> As soon as your payment is confirmed, you are shown the order confirmation page. It issues your license code and activates it in that browser. You can copy the code, save the confirmation as a PDF, or print it.</li><li><strong>Start training.</strong> The Start training button on the confirmation page takes you straight into your course.</li><li><strong>Use another device.</strong> To use the course on another device, enter the same license code in the <a href="/train/">Training Room</a> or on the course’s product page there.</li></ol>`],
      ['when', 'When you receive it', `<p>Delivery is immediate: your license code is issued on the confirmation page the moment your payment is confirmed. There is no waiting period and no manual processing.</p>`],
      ['lost', 'Lost licenses', `<p>If the course is still unlocked in your browser, your code is shown on the course’s product page and in any backup file you exported. If you have lost it, contact us through the ${contact} with your order number, and we will send you a replacement code.</p>`],
      ['updates', 'Corrections and updates', `<p>Corrected versions of a course are applied automatically: the trainer picks up the new version the next time you open it while online, and your progress is kept.</p>`],
      ['access', 'How long access lasts', `<p>Online access to your courses continues for as long as Fiancho Chess operates. Once loaded, the trainer also works offline on your device.</p>`],
      ['need', 'What you need', `<p>A current version of Chrome, Edge, Firefox or Safari on a computer, tablet or phone. Licenses and progress are stored in your browser, so use the Export backup feature in the Training Room to keep a copy.</p>`]
    ]
  });

  docPage({
    file: 'consumer-rights.html', crumb: 'Your consumer rights', title: 'Your consumer rights',
    description: 'Consumer rights information for Fiancho Chess customers in the United States, the European Union and the United Kingdom: refunds, digital content that must work as described, and complaints.',
    lede: 'Information about your rights when you buy digital content from Fiancho Chess, including for customers in the European Union and the United Kingdom.',
    summary: '<p>In short: you can get a full refund within 14 days of any purchase, even after you have started training, and the courses must work as described. These rights come on top of anything the law gives you.</p>',
    sections: [
      ['seller', 'Who you are buying from', `<p>You are buying from Fiancho Chess. You can contact us through the ${contact}; we reply within two business days. Payment is processed by a third-party payment provider.</p>`],
      ['before', 'Information before you buy', `<p>Each product page shows the product’s contents, format, level, what you need to use it, and its price in US dollars before any purchase step. Applicable taxes are shown at checkout before you pay. Before checkout you agree to the <a href="/terms.html">Terms of Service</a> and <a href="/refund-policy.html">Refund Policy</a>.</p>`],
      ['withdrawal', 'Cancelling and refunds', `<p>In the European Union and the United Kingdom, consumers normally have 14 days to withdraw from an online purchase, although for digital content that right can end once you start using it. Fiancho Chess goes further: you can request a full refund within 14 days of any purchase whether or not you have started training, with no reason required. To cancel, send a clear statement through the ${contact} with your order number. Refunds are paid to your original payment method within 5 business days of your request. Details are in the <a href="/refund-policy.html">Refund Policy</a>.</p>`],
      ['conformity', 'Digital content that works as described', `<p>Under EU and UK consumer law, digital content must match its description and be of satisfactory quality. If something doesn’t work as described, tell us through the ${contact}. We will fix it, or, if we can’t, refund you. Errors in the chess analysis can also be reported with the Report a problem link on every position, and confirmed corrections are applied automatically.</p>`],
      ['us', 'Customers in the United States', `<p>The 14-day refund applies to every customer. Nothing in our policies limits rights you have under the consumer protection laws of your state.</p>`],
      ['complaints', 'Complaints', `<p>If you are unhappy with a purchase, please contact us first through the ${contact} so we can put it right. You can also contact your local consumer protection authority.</p>`]
    ]
  });

  docPage({
    file: 'disclaimer.html', crumb: 'Disclaimer', title: 'Disclaimer',
    description: 'Fiancho Chess Disclaimer: self-study chess training without coaching, no promised results, how errors in the analysis are corrected, and our independence.',
    lede: 'What Fiancho Chess courses are, what they are not, and what we can and can’t promise.',
    summary: '',
    sections: [
      ['self-study', 'Self-study training, not coaching', `<p>Fiancho Chess courses are self-study training programs. They are not coaching and include no feedback on anyone’s games, no video and no live instruction.</p>`],
      ['results', 'No promised results', `<p>How much any player improves depends on how much they study and play, their starting level, and other individual factors. Fiancho Chess does not promise any specific result and does not promise any rating change.</p>`],
      ['accuracy', 'Accuracy of the analysis', `<p>The analysis in every course is checked carefully, including with a chess engine before release, but errors are still possible. Anyone who finds one can report it through the Report a problem link in the trainer or the ${contact}. Confirmed errors are corrected in updates, which reach the course automatically.</p>`],
      ['independence', 'Independence', `<p>Fiancho Chess is independent. It is not affiliated with or endorsed by any chess federation, rating organization, chess website or software maker. PGN is mentioned only to describe the standard file format used for exports.</p>`],
      ['contact', 'Contact', `<p>Questions about this disclaimer can be sent through the ${contact}.</p>`]
    ]
  });
}

/* ------------------------------------------------------------------ Training Room, confirmation pages, 404 */
function trainPage() {
  const body = `<div id="app" class="tr-app"><section class="tr-room"><div class="container"><h1>Training Room</h1><p class="lede">Loading your courses…</p><noscript><p>The Training Room needs JavaScript. Please enable it in your browser settings.</p></noscript></div></section></div>`;
  write('train/index.html', layout({ file: 'train/index.html', title: 'Training Room | Fiancho Chess', description: 'The Fiancho Chess Training Room: open your courses, track your progress, activate a license, and manage backups.', active: 'train', body, modules: ['/train/app.js'], trainCss: true }));
}

function confirmationPages() {
  for (const p of products) {
    const body = `<section class="confirm"><div class="container"><div class="confirm__card" data-confirm>
      <h1>Your order is complete</h1>
      <p class="lede">Preparing your license code…</p>
      <noscript><p>Your license code is created on this page and needs JavaScript. Please enable it, or contact us through the <a href="/contact.html">Contact page</a> with your order number.</p></noscript>
    </div></div></section>`;
    write(`thank-you/${p.id}/index.html`, layout({ file: `thank-you/${p.id}/index.html`, title: `Order confirmation: ${p.name} | Fiancho Chess`, description: `Order confirmation and license code for ${p.name}.`, body, noindex: true, product: p.id, modules: ['/js/confirm.js'], trainCss: true }));
  }
}

function notFoundPage() {
  let squares = '';
  for (let row = 0; row < 4; row++) for (let f = 0; f < 4; f++) squares += `<rect x="${20 + f * 90}" y="${20 + row * 90}" width="90" height="90" class="${(f + row) % 2 === 0 ? 'sq-l' : 'sq-d'}"/>`;
  const body = `<section><div class="container not-found">
    <div>
      <p class="eyebrow">Error 404</p>
      <h1>This square is empty.</h1>
      <p class="lede">The page you were looking for isn’t here. It may have moved, or the link may have a typo.</p>
      <div class="not-found__links"><a class="btn btn--primary" href="/">Go to the home page</a><a class="btn btn--ghost" href="/#courses">Browse the courses</a></div>
      <p style="margin-top:24px;color:var(--muted)">Looking for your courses? Open the <a href="/train/">Training Room</a>. For help, see the <a href="/faq.html">FAQ</a> or the <a href="/contact.html">Contact page</a>.</p>
    </div>
    <svg class="not-found__board" viewBox="0 0 400 400" role="img" aria-labelledby="nf-t"><title id="nf-t">A lone king on an otherwise empty chessboard</title><rect width="400" height="400" rx="18" class="hb-frame"/>${squares}<rect x="200" y="200" width="90" height="90" fill="none" stroke="var(--band-accent)" stroke-width="5"/>${pieceAt('k', 'w', 206, 206, 78)}</svg>
  </div></section>`;
  write('404.html', layout({ file: '404.html', title: 'Page not found | Fiancho Chess', description: 'The page you were looking for could not be found.', body, noindex: true }));
}

function extras() {
  const pages = ['index.html', ...products.map((p) => p.file), 'train/', 'about.html', 'faq.html', 'contact.html', 'terms.html', 'privacy.html', 'refund-policy.html', 'delivery-policy.html', 'consumer-rights.html', 'disclaimer.html'];
  write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map((f) => `  <url><loc>${SITE}/${f === 'index.html' ? '' : f}</loc><lastmod>${UPDATED_ISO}</lastmod></url>`).join('\n')}\n</urlset>\n`);
  write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
  write('manifest.webmanifest', JSON.stringify({
    name: 'Fiancho Chess', short_name: 'Fiancho Chess', description: 'Interactive chess training programs.',
    start_url: '/train/', scope: '/', display: 'standalone', background_color: '#f7f3e9', theme_color: '#1d4a36',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
    ]
  }, null, 2) + '\n');
}

homePage();
products.forEach(productPage);
aboutPage();
faqPage();
contactPage();
policyPages();
trainPage();
confirmationPages();
notFoundPage();
extras();
console.log('site written to', OUT);
