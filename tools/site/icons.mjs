// Renders the app icons (PNG) from the original knight mark using the installed Chrome.
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const knight = '<path d="M30 77c1-14 7-22 16-29-7 2-13 4-19 9-6-2-9-8-6-14 6-10 15-18 22-24l2-9 6 7c15 3 25 17 25 36 0 9-1 17-2 24z"/><rect x="22" y="76" width="56" height="11" rx="4"/>';
const svg = (maskable) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="512" height="512">${maskable ? '<rect width="100" height="100" fill="#1d4a36"/>' : '<rect width="100" height="100" rx="22" fill="#1d4a36"/>'}<g transform="${maskable ? 'translate(24 20) scale(.52)' : 'translate(13 9) scale(.74)'}" fill="#f7f3e9">${knight}<circle cx="41" cy="31" r="3.4" fill="#1d4a36"/></g></svg>`;
fs.mkdirSync(path.join(ROOT, 'icons'), { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
for (const [name, size, maskable] of [['icon-192.png', 192, false], ['icon-512.png', 512, false], ['icon-maskable-512.png', 512, true]]) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(`<html><body style="margin:0;background:transparent">${svg(maskable).replace('width="512" height="512"', `width="${size}" height="${size}"`)}</body></html>`);
  await page.screenshot({ path: path.join(ROOT, 'icons', name), omitBackground: true });
  await page.close();
}
await browser.close();
console.log('icons written');
