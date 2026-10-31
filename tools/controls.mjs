// node tools/controls.mjs [subject/chapter] — the book's controls in a browser (needs the static server on :8137):
// Play/Pause, calm mode (?calm: still until asked), a page's parts as keyboard buttons, Esc returning focus, and
// the top bar fitting phones from 360 px, ?render determinism and ?embed. Exit 1 on any failure.
import puppeteer from 'puppeteer-core';
import { chapters as allChapters, key } from './chapters.mjs';
import { CHROME, GL_ARGS } from '../cli/chrome.mjs';

const c = key(process.argv[2] || 'physics/newton'), base = 'http://127.0.0.1:8137';
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: GL_ARGS });
const p = await browser.newPage(); await p.setViewport({ width: 1440, height: 900 });
const errors = []; p.on('pageerror', e => errors.push(e.message));
const wait = ms => new Promise(r => setTimeout(r, ms));
const rows = [], check = (name, ok, info = '') => rows.push([ok ? 'PASS' : 'FAIL', name, info]);
const open = async url => { await p.goto(base + url, { waitUntil: 'networkidle0' }); await p.waitForFunction('window.__atlas'); };
const clock = () => p.evaluate(() => __atlas.clock);

await open(`/${c}/`); await wait(600);
check('plays at once by default', await p.evaluate(() => __atlas.started) && await p.$eval('#play', e => e.getAttribute('aria-label')) === 'Pause');

await open(`/${c}/?calm&t=4.25#1`);
const c0 = await clock(); await wait(900);
check('calm: still until asked and honors ?t=4.25', Math.abs(c0 - 4.25) < 0.05 && c0 === await clock() && await p.$eval('#play', e => e.getAttribute('aria-pressed')) === 'false' && !!await p.$('#share'));
await p.click('#play'); await p.waitForFunction(c => __atlas.clock > c, { timeout: 15000 }, c0).catch(() => {}); const c1 = await clock();
check('calm: Play starts it', c1 > c0, `clock ${c1.toFixed(2)} s`);
await p.click('#play'); await wait(300); const c2 = await clock(); await wait(700);
check('Pause stops it', c2 === await clock());

// the first page with a part button: open it from the keyboard, close with Esc, focus comes back
const n = await p.evaluate(() => __atlas.N);
let page = -1;
for (let i = 0; i < n && page < 0; i++) { await p.evaluate(i => __atlas.goto(i, true), i); await wait(250); if (await p.$('#sheet .parts button')) page = i; }
check('pages list their parts as buttons', page >= 0, `first on page ${page}`);
if (page >= 0) {
  const key = await p.$eval('#sheet .parts button', b => b.dataset.part);
  await p.focus('#sheet .parts button'); await p.keyboard.press('Enter'); await wait(500);
  check('Enter on a part opens its breakdown, focus on Close', await p.evaluate(() => !document.getElementById('plate').hidden && document.activeElement.classList.contains('close')));
  await p.keyboard.press('Escape'); await wait(300);
  check('Esc closes it and focus returns to the part', await p.evaluate(k => document.getElementById('plate').hidden && document.activeElement.dataset.part === k, key));
}

// ?render: seek(t) is a pure function of t, so the same t gives the same pixels in any order
await open(`/${c}/?render`);
await p.evaluate(async () => { for (let t = 0; t <= DURATION; t += DURATION / 12) seek(t); await document.fonts.ready; }); await wait(300);   // pre-roll: fonts settle
await p.evaluate(() => seek(0)); await p.screenshot();
// the figure (canvas, labels, readout): the top bar's dots re-rasterise a few pixels differently after a repaint
const at = async t => { await p.evaluate(t => seek(t), t); return (await p.$('#right')).screenshot({ encoding: 'base64' }); };
const f1 = await at(3.2), f2 = await at(20), f3 = await at(1), f4 = await at(3.2);
check('render: seek(3.2) identical twice, out of order', f1 === f4 && f1 !== f2 && f2 !== f3);
check('render: DURATION covers every page', await p.evaluate(() => DURATION > __atlas.N * 4));

// ?embed&page=i: only the figure, held on that page, still until asked
await open(`/${c}/?embed&page=2`); await wait(500);
const e0 = await clock(); await wait(600);
check('embed: figure only, page held, calm', await p.evaluate(() => getComputedStyle(document.querySelector('.page.left')).display === 'none' && getComputedStyle(document.querySelector('.topbar')).display === 'none') &&
  await p.$eval('#pagenum', e => e.textContent.startsWith('3 /')) && e0 === await clock() && !!await p.$('.figure #play'));

// the top bar fits phones, for every chapter at the narrowest width
const narrow = [];
for (const ch of await allChapters()) for (const w of [360, 390]) {
  await p.setViewport({ width: w, height: 800, isMobile: true, hasTouch: true });
  await open(`/${ch}/`);
  const r = await p.evaluate(() => Math.max(...[...document.querySelectorAll('.topbar > *')].filter(e => getComputedStyle(e).display !== 'none').map(e => e.getBoundingClientRect().right)));
  if (r > w) narrow.push(`${ch}@${w}: ${r.toFixed(0)}px`);
}
check('top bar fits phones (360, 390) in every chapter', !narrow.length, narrow.join(', '));
check('no page errors', !errors.length, errors.join(' | '));
for (const r of rows) console.log(r.filter(Boolean).join('  '));
await browser.close();
process.exit(rows.every(r => r[0] === 'PASS') ? 0 : 1);
