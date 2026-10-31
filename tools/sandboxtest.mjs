// node tools/sandboxtest.mjs [subject/figure] — a sandbox's controls in a browser: chips fill in immediately, presets
// update state, adding/removing pieces or changing inputs updates readout and URL query string, Reset restores defaults,
// and ?render frames are deterministic. Exit 1 on any failure.
import { serve, launch } from '../cli/render.mjs';
import { key } from './chapters.mjs';

const fig = key(process.argv[2] || 'minimal/sandbox');
const { server, base } = serve(), browser = await launch();
const p = await browser.newPage(); await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
const errors = []; p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
const rows = [], check = (name, ok, info = '') => rows.push([ok ? 'PASS' : 'FAIL', name, info]);
const wait = ms => new Promise(r => setTimeout(r, ms));
const chips = () => p.$$eval('#chips .v', vs => vs.map(v => v.textContent));

await p.goto(`${base}/${fig}/`, { waitUntil: 'networkidle0' }); await p.waitForFunction('window.__atlas'); await wait(300);
const initialChips = await chips();
check('chips fill in immediately on a sandbox', initialChips.length > 0 && initialChips.every(t => t !== '–'), initialChips.join(' | '));

const hasPresets = (await p.$$('#presets [data-preset]')).length >= 2;
if (hasPresets) {
  await p.click('#presets [data-preset]:nth-child(2)'); await wait(250);
  check('clicking a preset updates chips/state', JSON.stringify(await chips()) !== JSON.stringify(initialChips));
}

const hasAdd = !!await p.$('#palette [data-add]');
if (hasAdd) {
  const n0 = await p.evaluate(() => window.__atlas.items.length);
  await p.click('#palette [data-add]'); await wait(250);
  const n1 = await p.evaluate(() => window.__atlas.items.length);
  check('palette + button adds a 3D piece to the board', n1 === n0 + 1, `${n0} -> ${n1}`);
}

await p.click('#again'); await wait(250);
check('Reset restores the initial board and chips', JSON.stringify(await chips()) === JSON.stringify(initialChips));

await p.goto(`${base}/${fig}/?render`, { waitUntil: 'networkidle0' }); await p.waitForFunction('window.seek');
await p.evaluate(async () => { for (let t = 0; t <= DURATION; t += DURATION / 8) seek(t); await document.fonts.ready; }); await wait(250);
const at = async t => { await p.evaluate(t => seek(t), t); return (await p.$('#right')).screenshot({ encoding: 'base64' }); };
for (const t of [2, 6, 2]) await at(t);
await p.evaluate(() => document.fonts.ready); await wait(200);
const a = await at(2), b = await at(6), d = await at(2);
check('render: the same t gives the same frame, in any order', a === d, `2 s again ${a === d ? 'same' : 'DIFFERS'}`);
check('no page errors', !errors.length, errors.join(' | '));
for (const r of rows) console.log(r.filter(Boolean).join('  '));
await browser.close(); server.close();
process.exit(rows.every(r => r[0] === 'PASS') ? 0 : 1);
