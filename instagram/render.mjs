// Renders every Mountain Rangers design to PNG.
// Usage: node render.mjs            (everything)
//        node render.mjs story      (only jobs whose output path contains "story")
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
let playwright;
try { playwright = require('playwright'); }
catch { playwright = require('/opt/node-tools/node_modules/playwright'); }

const root = path.dirname(fileURLToPath(import.meta.url));
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png' };

const HIGHLIGHTS = ['events', 'hikes', 'camping', 'ski', 'gallery', 'reviews'];
const jobs = [
  // [page, output, width, height, scales]
  ['apple-picking/index.html', 'apple-picking/apple-picking-post', 1080, 1440, [1, 2]],
  ['apple-picking/slide-2.html', 'apple-picking/apple-picking-slide-2', 1080, 1440, [1]],
  ['apple-picking/slide-3.html', 'apple-picking/apple-picking-slide-3', 1080, 1440, [1]],
  ['apple-picking/story.html', 'apple-picking/apple-picking-story', 1080, 1920, [1]],
  ...HIGHLIGHTS.map(h => [`highlights/cover.html?icon=${h}`, `highlights/highlight-${h}`, 1080, 1920, [1]]),
  ['highlights/preview.html', 'highlights/highlights-preview', 1080, 1440, [1]],
];
const only = process.argv[2];

// Canvas pixel reads need same-origin images, so serve over http rather than file://
const server = http.createServer(async (req, res) => {
  try {
    const p = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!p.startsWith(root)) throw new Error('outside root');
    const body = await fs.readFile(p);
    res.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' });
    res.end(body);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(ok => server.listen(0, ok));
const base = `http://127.0.0.1:${server.address().port}/`;

const browser = await playwright.chromium.launch();
for (const [page, out, width, height, scales] of jobs) {
  if (only && !out.includes(only)) continue;
  for (const scale of scales) {
    const tab = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: scale });
    tab.on('pageerror', e => console.error(`${page}: ${e.message}`));
    tab.on('console', m => m.type() === 'error' && console.error(`${page}: ${m.text()}`));
    await tab.goto(base + page);
    await tab.waitForSelector('body[data-ready="1"]', { timeout: 120000 });
    const file = path.join(root, `${out}${scale === 1 ? '' : `@${scale}x`}.png`);
    await tab.locator('#post').screenshot({ path: file });
    console.log('wrote', path.relative(root, file));
    await tab.close();
  }
}
await browser.close();
server.close();
