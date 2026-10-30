// node tools/machinetest.mjs [subject/figure] — a machine's controls in a browser (serves the site itself): Manual
// waits for each press and only the next step is live; chips stay "–" until a step earns them; a step plays, shows
// its speed, and finishes; Space runs the next step; Start over resets; Auto plays on by itself, loops, and is
// remembered on the next visit; ?render frames are the same for the same t. Exit 1 on any failure.
import { serve, launch } from './render.mjs';

const fig = process.argv[2] || 'economics/compound';
const { server, base } = serve(), browser = await launch();
const p = await browser.newPage(); await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
const errors = []; p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
const rows = [], check = (name, ok, info = '') => rows.push([ok ? 'PASS' : 'FAIL', name, info]);
const wait = ms => new Promise(r => setTimeout(r, ms));
const st = () => p.evaluate(() => window.__atlas.state);
const live = () => p.$$eval('#steps .step', bs => bs.map(b => !b.disabled));
const open = async (q = '') => { await p.goto(`${base}/${fig}/${q}`, { waitUntil: 'networkidle0' }); await p.waitForFunction('window.__atlas'); await wait(400); };

await p.goto(`${base}/${fig}/`, { waitUntil: 'networkidle0' }); await p.evaluate(() => localStorage.clear()); await open();
const n = (await live()).length;
check('Manual by default, nothing moves', (await st()).mode === 'manual' && (await st()).k === 0 && await p.$eval('#mode [data-mode="manual"]', b => b.getAttribute('aria-pressed')) === 'true');
check('only the first step is live', JSON.stringify(await live()) === JSON.stringify([true, ...Array(n - 1).fill(false)]));
check('chips wait for their step', (await p.$$eval('#chips .v', vs => vs.map(v => v.textContent))).every(t => t === '–'));
await p.click('#steps .step[data-k="1"]'); await wait(300);
check('pressing a step plays it, every button waits', (await st()).k === 1 && (await live()).every(x => !x));
check('a step faster than life shows its speed', await p.$eval('#speed', e => !e.hidden && e.textContent.length > 0), await p.$eval('#speed', e => e.textContent));
check('chips earned by step 1 fill in', await p.$eval('#chips .chip .v', v => v.textContent !== '–'));
await p.waitForFunction(() => window.__atlas.state.k === 0, { timeout: 30000 });
check('when it ends, the next step is live and pulses', (await st()).done === 1 && (await live())[1] === true && await p.$eval('#steps .step[data-k="2"]', b => b.classList.contains('next')));
await p.focus('body'); await p.keyboard.press('Space'); await wait(200);
check('Space runs the next step', (await st()).k === 2);
await p.waitForFunction(() => window.__atlas.state.k === 0, { timeout: 30000 });
await p.click('#again');
// the buttons follow on the next drawn frame, which on a software renderer (CI) can take longer than a fixed wait
await p.waitForFunction(() => !document.querySelector('#steps .step[data-k="1"]').disabled, { timeout: 5000 }).catch(() => {});
check('Start over puts it back at step 1', (await st()).done === 0 && (await live())[0] === true);
await p.click('#mode [data-mode="auto"]'); await wait(1500);
check('Auto plays on by itself', (await st()).k >= 1 || (await st()).done >= 1);
await open();
check('Auto is remembered on the next visit', (await st()).mode === 'auto');
await p.evaluate(() => { window.__atlas.startOver(); });
const total = await p.evaluate(() => window.__atlas.S ? 0 : 0);
await p.waitForFunction(n => window.__atlas.state.done === n, { timeout: 120000 }, n).catch(() => {});
check('Auto reaches the last step', (await st()).done === n);
await p.waitForFunction(() => window.__atlas.state.done === 0, { timeout: 15000 }).catch(() => {});
check('…and loops back to the start', (await st()).done === 0 || (await st()).k === 1);
await p.evaluate(() => localStorage.clear());

await open('?render');
// pre-roll the tour once so fallback-font glyphs (₹) are loaded before frames are compared
await p.evaluate(async () => { for (let t = 0; t <= DURATION; t += DURATION / 12) seek(t); await document.fonts.ready; }); await wait(300);
await p.evaluate(() => seek(0)); await p.screenshot();
const at = async t => { await p.evaluate(t => seek(t), t); return (await p.$('#right')).screenshot({ encoding: 'base64' }); };
const a = await at(5), b = await at(20), c = await at(1), d = await at(5);
check('render: the same t gives the same frame, in any order', a === d && a !== b && b !== c);
check('no page errors', !errors.length, errors.join(' | '));
for (const r of rows) console.log(r.filter(Boolean).join('  '));
await browser.close(); server.close();
process.exit(rows.every(r => r[0] === 'PASS') ? 0 : 1);
