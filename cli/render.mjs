// The browser harness every check uses: serves a folder (the current one by default), opens a figure in ?render mode
// and gives seek(t) and its tour. open(browser, base, figure, w, h) → { page, errors, seek, shot, duration, pages, starts, mid(i) }.
// figure: the figure's folder, relative to the served one ('biology/heart', 'examples/physics/newton').
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
import { CHROME, GL_ARGS } from './chrome.mjs';

const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml' };
export function serve(root = process.cwd()) {
  const ROOT = path.resolve(root);
  const server = http.createServer((req, res) => {
    let p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
    if (!p.startsWith(ROOT) || !fs.existsSync(p)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' });
    fs.createReadStream(p).pipe(res);
  }).listen(0);
  return { server, base: `http://localhost:${server.address().port}` };
}

export async function launch() {
  return puppeteer.launch({ executablePath: CHROME, headless: 'new', args: GL_ARGS });
}

export async function open(browser, base, chapter, w = 1440, h = 900, query = 'render') {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !m.location().url?.includes('/_vercel/insights/')) errors.push(m.text()); });
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  await page.goto(`${base}/${chapter}/?${query}`, { waitUntil: 'networkidle0' });
  await page.waitForFunction('window.seek', { timeout: 30000 });
  const seek = t => page.evaluate(t => window.seek(t), t);
  // pre-roll: draw the tour once and let the fonts settle, so glyphs that need a fallback font (₹ is not in EB Garamond)
  // are loaded before any frame is kept; the first frame after load also rasterises a little differently
  for (let t = 0, D = await page.evaluate(() => window.DURATION); t <= D; t += D / 12) await seek(t);
  await page.evaluate(() => document.fonts.ready); await new Promise(r => setTimeout(r, 300));
  await seek(0); await page.screenshot();
  // a book's tour is dwells and turns; a machine or explorer gives its stretches' starts outright
  const { duration, dwells, turn = 0, given } = await page.evaluate(() => ({ duration: window.DURATION, dwells: window.__atlas.tour.dwells, turn: window.__atlas.tour.turn, given: window.__atlas.tour.starts }));
  const starts = given || dwells.map((_, i) => dwells.slice(0, i).reduce((a, d) => a + d + turn, 0));
  return { page, errors, seek, duration, pages: dwells.length, starts, dwells, turn,
    mid: i => starts[i] + dwells[i] / 2,                     // the middle of page i's dwell
    shot: (file, t) => seek(t).then(() => page.screenshot({ path: file })) };
}
