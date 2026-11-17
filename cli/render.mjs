// The browser harness every check uses: serves a folder (the current one by default), opens a figure in ?render mode
// and gives seek(t) and its tour. open(browser, base, figure, w, h) → { page, errors, seek, shot, duration, pages, starts, mid(i) }.
// figure: the figure's folder, relative to the served one ('biology/heart', 'examples/physics/newton').
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
import { CHROME, GL_ARGS } from './chrome.mjs';

const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml' };

function headlessBookIndexHtml(title = 'Atlas Chapter') {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<link rel="icon" href="data:,">
<link rel="stylesheet" href="/engine/atlas.css">
<link rel="stylesheet" href="/engine/book.css">
<script type="importmap">
{ "imports": { "@saxster/atlas": "/engine/index.js", "@saxster/atlas/adapters/": "/adapters/", "@saxster/atlas/": "/engine/", "three": "/node_modules/three/build/three.module.js", "three/addons/": "/node_modules/three/examples/jsm/" } }
</script>
</head>
<body class="book-body">
  <header class="topbar">
    <a href="../" class="brand">Atlas</a>
    <span class="crumb">${title}</span>
    <nav class="dots" id="dots" aria-label="Pages"></nav>
  </header>
  <div class="scroll-space" id="space"></div>
  <main class="book" id="book">
    <section class="page left" id="left" aria-live="polite">
      <article class="sheet" id="sheet"></article>
      <article class="plate" id="plate" hidden></article>
      <footer class="folio"><span>${title}</span><span id="folio">1</span></footer>
    </section>
    <section class="page right" id="right">
      <div class="figure">
        <canvas id="gl" aria-label="Interactive 3D figure"></canvas>
        <div id="labels" aria-hidden="true"></div>
        <div class="corner tl" id="figno">Fig. 1</div>
        <div class="corner tr" id="figtitle"></div>
        <div class="corner bl" id="hint">Drag to turn · shift-drag to pan · click to break it down</div>
        <div class="corner br readout" id="readout"></div>
      </div>
    </section>
    <div class="leaf" id="leaf" aria-hidden="true">
      <div class="leaf-front"><span id="leafnext"></span></div>
      <div class="leaf-back"><article class="sheet" id="leafsheet"></article></div>
    </div>
    <div class="spine" aria-hidden="true"></div>
  </main>
  <p class="scroll-cue" id="cue">Scroll to turn the page</p>
  <script type="module" src="./main.js"></script>
</body>
</html>`;
}

export function serve(root = process.cwd()) {
  const ROOT = path.resolve(root);
  const server = http.createServer((req, res) => {
    let p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
    if (p.startsWith(ROOT) && !fs.existsSync(p)) {
      const dir = path.dirname(p), base = path.basename(p);
      if (fs.existsSync(path.join(dir, 'chapter.js'))) {
        if (base === 'index.html') {
          res.writeHead(200, { 'content-type': 'text/html' });
          return res.end(headlessBookIndexHtml(path.basename(dir)));
        }
        if (base === 'main.js') {
          res.writeHead(200, { 'content-type': 'text/javascript' });
          return res.end(`import { startBook } from '@saxster/atlas/book.js';\nimport { CHAPTER } from './chapter.js';\nstartBook(CHAPTER);\n`);
        }
        if (base === 'practice.js') {
          res.writeHead(200, { 'content-type': 'text/javascript' });
          return res.end(`export const PRACTICE = {};\n`);
        }
      }
    }
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
  let rejectBoot;
  const bootErrPromise = new Promise((_, rej) => { rejectBoot = rej; });
  bootErrPromise.catch(() => {});
  page.on('pageerror', e => { errors.push(e.message); rejectBoot?.(new Error(`Page error in ${chapter}: ${e.stack || e.message}`)); });
  page.on('console', m => { if (m.type() === 'error' && !m.location().url?.includes('/_vercel/insights/')) errors.push(m.text()); });
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  await page.goto(`${base}/${chapter}/?${query}`, { waitUntil: 'networkidle0' });
  if (errors.length && !(await page.evaluate(() => Boolean(window.seek)))) {
    throw new Error(`Boot failed in ${chapter}: ${errors.join(' | ')}`);
  }
  await Promise.race([page.waitForFunction('window.seek', { timeout: 30000 }), bootErrPromise]);
  rejectBoot = null;
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
