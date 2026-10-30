// node tools/adaptertest.mjs [out-dir] [subject/chapter page] — an atlas figure inside a stand-in kym textbook
// (tools/kymhost/): its paper matches the book's sheet in sepia, light and dark, and follows a theme switch; Play
// runs it and Pause holds it; a part button opens a breakdown and closes it; dragging while paused turns the camera
// but leaves the physics where it stopped; closing removes it. Screenshots of each theme go to out-dir. Exit 1 on failure.
import fs from 'node:fs';
import path from 'node:path';
import { serve, launch } from './render.mjs';
import { key } from './chapters.mjs';

const [outArg, chArg = 'physics/oscillations', pg = '8'] = process.argv.slice(2), chapter = key(chArg);
const out = outArg && path.resolve(outArg); if (out) fs.mkdirSync(out, { recursive: true });
const { server, base } = serve(), browser = await launch();
const p = await browser.newPage(); await p.setViewport({ width: 900, height: 900, deviceScaleFactor: 1 });
const errors = []; p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
const rows = [], check = (name, ok, info = '') => rows.push([ok ? 'PASS' : 'FAIL', name, info]);
const wait = ms => new Promise(r => setTimeout(r, ms));
await p.goto(`${base}/tools/kymhost/?chapter=${chapter}&page=${pg}`, { waitUntil: 'networkidle0' });
await p.waitForFunction('window.__host', { timeout: 30000 }); await wait(400);
const readout = () => p.$eval('.live-readout', e => e.innerHTML);
// the figure's paper: the commonest colour along the canvas's top edge, against the book's --sheet
const paper = () => p.evaluate(() => {
  const cv = document.querySelector('.atlas-stage canvas'), g = document.createElement('canvas').getContext('2d');
  g.canvas.width = cv.width; g.canvas.height = cv.height; g.drawImage(cv, 0, 0);
  const d = g.getImageData(0, 2, cv.width, 1).data, n = {};
  for (let k = 0; k < d.length; k += 4) { const h = [d[k], d[k + 1], d[k + 2]].join(','); n[h] = (n[h] || 0) + 1; }
  const top = Object.entries(n).sort((a, b) => b[1] - a[1])[0][0].split(',').map(Number);
  const v = getComputedStyle(document.documentElement).getPropertyValue('--sheet').trim();
  return { got: top, want: [1, 3, 5].map(i => parseInt(v.slice(i, i + 2), 16)) };
});
for (const theme of ['sepia', 'light', 'dark']) {
  await p.evaluate(t => document.documentElement.setAttribute('data-theme', t), theme); await wait(500);
  const { got, want } = await paper(), off = Math.max(...got.map((c, i) => Math.abs(c - want[i])));
  check(`${theme}: the figure's paper is the book's sheet`, off <= 3, `rgb(${got}) vs rgb(${want})`);
  if (out) await (await p.$('#fig')).screenshot({ path: path.join(out, `${chapter.replace('/', '-')}-p${pg}-${theme}.png`) });
}
await p.evaluate(() => document.documentElement.setAttribute('data-theme', 'sepia')); await wait(300);

await p.click('.live-play'); await wait(300); const r1 = await readout(); await wait(700); const r2 = await readout();
check('Play runs the figure', r1 !== r2);
await p.click('.live-play'); await wait(200); const r3 = await readout(); await wait(700);
check('Pause holds it', r3 === await readout());
const shot = () => p.$eval('.atlas-stage canvas', c => c.toDataURL());
const before = await shot(), box = await (await p.$('.atlas-stage canvas')).boundingBox();
await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await p.mouse.down();
for (let i = 1; i <= 12; i++) await p.mouse.move(box.x + box.width / 2 - i * 12, box.y + box.height / 2);
await p.mouse.up(); await wait(500);
check('dragging while paused turns the camera', before !== await shot());
check('…and leaves the physics where it stopped', r3 === await readout());
const partBtn = await p.$('button.live-ctl:not(.live-play)');
check('each part of the page is a button', !!partBtn, partBtn ? await partBtn.evaluate(b => b.textContent) : '');
if (partBtn) {
  await partBtn.click(); await wait(900);
  check('a part button opens its breakdown', (await readout()).startsWith('<b>') && await partBtn.evaluate(b => b.getAttribute('aria-pressed')) === 'true');
  await partBtn.click(); await wait(600);
  check('pressing it again puts the part back', !(await readout()).startsWith('<b>'));
}
await p.evaluate(() => window.__host.close()); await wait(200);
check('closing removes the figure', await p.$('.atlas-stage') === null);
check('no page errors', !errors.length, errors.join(' | '));
for (const r of rows) console.log(r.filter(Boolean).join('  '));
await browser.close(); server.close();
process.exit(rows.every(r => r[0] === 'PASS') ? 0 : 1);
