// Renders index.html to a 1080x1440 Instagram post (plus a 2x master).
// Usage: node render.mjs [output-basename]
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
let playwright;
try { playwright = require('playwright'); }
catch { playwright = require('/opt/node-tools/node_modules/playwright'); }

const dir = path.dirname(fileURLToPath(import.meta.url));
const out = process.argv[2] || 'apple-picking-post';
const types = { '.html': 'text/html', '.jpg': 'image/jpeg', '.png': 'image/png' };

// Canvas pixel reads need same-origin images, so serve over http rather than file://
const server = http.createServer(async (req, res) => {
  try {
    const p = path.join(dir, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    const body = await fs.readFile(p.endsWith(path.sep) ? path.join(p, 'index.html') : p);
    res.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' });
    res.end(body);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(ok => server.listen(0, ok));
const url = `http://127.0.0.1:${server.address().port}/index.html`;

const browser = await playwright.chromium.launch();
for (const [scale, suffix] of [[2, '@2x'], [1, '']]) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1440 }, deviceScaleFactor: scale });
  page.on('pageerror', e => console.error('page error:', e.message));
  await page.goto(url);
  await page.waitForSelector('body[data-ready="1"]', { timeout: 120000 });
  const file = path.join(dir, `${out}${suffix}.png`);
  await page.locator('#post').screenshot({ path: file });
  console.log('wrote', file);
  await page.close();
}
await browser.close();
server.close();
