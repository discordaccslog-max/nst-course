// Renders og-image.png (1200x630) for link previews, using the installed Chrome.
import { chromium } from 'playwright-core';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
let squares = '';
for (let r = 0; r < 8; r++) for (let f = 0; f < 8; f++) squares += `<rect x="${f * 60}" y="${r * 60}" width="60" height="60" fill="${(r + f) % 2 ? '#7f9c89' : '#ede5d3'}"/>`;
const html = `<html><head><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&family=Inter:wght@400;600&display=swap"><style>
body{margin:0;width:1200px;height:630px;background:#1d4a36;color:#f4eedf;font-family:Inter,sans-serif;display:flex;align-items:center;overflow:hidden;position:relative}
.t{padding-left:80px;width:640px}.b{font:600 36px Fraunces,serif;color:#e4c069}h1{font:600 64px/1.08 Fraunces,serif;margin:22px 0}p{font-size:25px;color:#cfdcd2;margin:0;line-height:1.4}
svg{position:absolute;right:-50px;top:75px;transform:rotate(-8deg);box-shadow:0 30px 60px rgba(0,0,0,.4)}</style></head><body>
<div class="t"><div class="b">Fiancho Chess</div><h1>Interactive chess training programs</h1><p>Lessons and training positions you play on the board, right in your browser.</p></div>
<svg width="480" height="480" viewBox="0 0 480 480">${squares}<rect width="480" height="480" fill="none" stroke="#2c3a32" stroke-width="4"/></svg></body></html>`;
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: path.join(ROOT, 'og-image.png') });
await browser.close();
console.log('og-image.png written');
