// Checks that every internal link, script, stylesheet, image and #anchor in the site resolves.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pages = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (!/^(node_modules|tools|tests|fulfillment-kit|\.git|\.vercel)$/.test(e.name)) walk(p); }
    else if (e.name.endsWith('.html')) pages.push(p);
  }
})(ROOT);
const toFile = (url) => { const clean = url.split('#')[0].split('?')[0]; const f = path.join(ROOT, clean); return clean.endsWith('/') ? path.join(f, 'index.html') : f; };
const ids = new Map();
const idsOf = (file) => { if (!ids.has(file)) ids.set(file, new Set([...fs.readFileSync(file, 'utf8').matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]))); return ids.get(file); };
let checked = 0; const bad = [];
for (const page of pages) {
  const html = fs.readFileSync(page, 'utf8');
  const rel = path.relative(ROOT, page).split(path.sep).join('/');
  for (const [, url] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if (/^(https?:|mailto:|data:)/.test(url)) continue;
    checked++;
    if (url.startsWith('#')) { if (url.length > 1 && !idsOf(page).has(url.slice(1))) bad.push(`${rel}: missing anchor ${url}`); continue; }
    if (!url.startsWith('/')) { bad.push(`${rel}: relative link ${url}`); continue; }
    const file = toFile(url);
    if (!fs.existsSync(file)) { bad.push(`${rel}: missing ${url}`); continue; }
    const hash = url.split('#')[1];
    if (hash && file.endsWith('.html') && !hash.startsWith('/') && !idsOf(file).has(hash)) bad.push(`${rel}: missing anchor ${url}`);
  }
}
// The trainer and scripts reference these paths at runtime.
for (const f of ['train/courses/index.json', 'js/vendor/chess.js', 'train/tb/q.bin.gz', 'train/tb/r.bin.gz', 'train/tb/p.bin.gz', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'og-image.png']) { checked++; if (!fs.existsSync(path.join(ROOT, f))) bad.push(`missing ${f}`); }
console.log(`${pages.length} pages, ${checked} internal references checked, ${bad.length} problems`);
for (const b of bad) console.log('  ' + b);
process.exit(bad.length ? 1 : 0);
