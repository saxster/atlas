// node tools/explorertest.mjs [subject/figure] — an explorer's controls in a browser (serves the site itself): Run and
// the sliders wait for a prediction; a run fills the chips and then reveals the answer with its reason; a slider
// resets the run (and rebuilds the board where it must) without errors; the same seed gives the same pile;
// ?render frames are the same for the same t. Exit 1 on any failure.
import { serve, launch } from './render.mjs';

const fig = process.argv[2] || 'statistics/galton';
const { server, base } = serve(), browser = await launch();
const p = await browser.newPage(); await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
const errors = []; p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
const rows = [], check = (name, ok, info = '') => rows.push([ok ? 'PASS' : 'FAIL', name, info]);
const wait = ms => new Promise(r => setTimeout(r, ms));
const st = () => p.evaluate(() => window.__atlas.state);
const chips = () => p.$$eval('#chips .v', vs => vs.map(v => v.textContent));
const finish = () => p.waitForFunction(() => window.__atlas.state.ran, { timeout: 60000 });
const slide = (key, v) => p.$eval(`#controls input[data-key="${key}"]`, (el, v) => { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); }, v);

await p.goto(`${base}/${fig}/`, { waitUntil: 'networkidle0' }); await p.waitForFunction('window.__atlas'); await wait(300);
const hasPredict = !!await p.$('#predict [data-c]');
if (hasPredict) {
  check('Run waits for a prediction', await p.$eval('#run', b => b.disabled));
  check('…and so do the sliders', await p.$$eval('#controls input', xs => xs.every(x => x.disabled)));
  check('chips wait for a run', (await chips()).every(t => t === '–'));
  await p.click('#predict [data-c="3"]'); await wait(100);
  check('a prediction unlocks Run and the sliders', !await p.$eval('#run', b => b.disabled) && await p.$$eval('#controls input', xs => xs.every(x => !x.disabled)));
}
await p.click('#run'); await wait(700);
check('Run runs it', (await st()).running && (await st()).clock > 0);
check('chips fill in as it runs', (await chips()).some(t => t !== '–'));
await finish();
const first = await chips();
if (hasPredict) check('after the run, the answer and its reason appear', await p.$eval('#predict .why', w => !w.hidden && w.textContent.length > 40) && !!await p.$('#predict .right'));
const sliders = await p.$$eval('#controls input', xs => xs.map(x => ({ key: x.dataset.key, min: x.min, max: x.max, value: x.value })));
for (const s of sliders) { await slide(s.key, s.max); await wait(250); await slide(s.key, s.min); await wait(250); await slide(s.key, s.value); await wait(250); }
check('every slider to both ends and back: no errors, run reset', !errors.length && (await st()).clock === 0, errors.slice(0, 2).join(' | '));
await p.click('#run'); await finish();
check('the same settings and seed give the same result', JSON.stringify(await chips()) === JSON.stringify(first), (await chips()).join(' '));

await p.goto(`${base}/${fig}/?render`, { waitUntil: 'networkidle0' }); await p.waitForFunction('window.seek');
await p.evaluate(async () => { for (let t = 0; t <= DURATION; t += DURATION / 12) seek(t); await document.fonts.ready; }); await wait(300);
await p.evaluate(() => seek(0)); await p.screenshot();
const at = async t => { await p.evaluate(t => seek(t), t); return (await p.$('#right')).screenshot({ encoding: 'base64' }); };
const a = await at(3), b = await at(7), c = await at(1), d = await at(3);
check('render: the same t gives the same frame, in any order', a === d && a !== b && b !== c);
check('no page errors', !errors.length, errors.join(' | '));
for (const r of rows) console.log(r.filter(Boolean).join('  '));
await browser.close(); server.close();
process.exit(rows.every(r => r[0] === 'PASS') ? 0 : 1);
