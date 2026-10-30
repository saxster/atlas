// Shared harness for tools that draw frames by time: serves the site itself, opens a chapter in ?render mode and
// gives seek(t) and the page tour. open(chapter, w, h) → { page, seek, shot, duration, pages, mid(i), close }.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
import { ROOT } from './chapters.mjs';

const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml' };
export function serve() {
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
  return puppeteer.launch({ executablePath: process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
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
  // the first frame after load rasterises a little differently; one throwaway frame settles it
  await seek(0); await page.screenshot();
  const { duration, dwells, turn } = await page.evaluate(() => ({ duration: window.DURATION, dwells: window.__atlas.tour.dwells, turn: window.__atlas.tour.turn }));
  const starts = dwells.map((_, i) => dwells.slice(0, i).reduce((a, d) => a + d + turn, 0));
  return { page, errors, seek, duration, pages: dwells.length, starts, dwells, turn,
    mid: i => starts[i] + dwells[i] / 2,                     // the middle of page i's dwell
    shot: (file, t) => seek(t).then(() => page.screenshot({ path: file })) };
}
