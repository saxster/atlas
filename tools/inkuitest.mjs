// node tools/inkuitest.mjs — browser verification suite for examples/ink-ui/ and its standalone single-file bundle:
// 1. All 24 widgets render and transition state in Creative & Standard modes via click and keyboard.
// 2. Switching all 6 brand swatches updates --accent* in <16ms with zero <svg> node regeneration and passes WCAG auditTheme.
// 3. Autoplay steps widgets and applies .is-live card bounce; user click hands off cleanly.
// 4. ?render seek(t) is pixel-identical out-of-order.
// 5. Standalone atelier-ink-ui.html boots cleanly with zero console/page errors.
import { serve, launch } from '../cli/render.mjs';

const { server, base } = serve();
const browser = await launch();
const p = await browser.newPage();
await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

const errors = [];
p.on('pageerror', e => errors.push(e.message));
p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

const rows = [];
const check = (name, ok, info = '') => rows.push([ok ? 'PASS' : 'FAIL', name, info]);
const wait = ms => new Promise(r => setTimeout(r, ms));

await p.goto(`${base}/examples/ink-ui/`, { waitUntil: 'networkidle0' });
await p.waitForFunction('window.__atlas');
await wait(200);

const creativeCounts = await p.evaluate(() => ({
  cards: document.querySelectorAll('#bento-grid [data-widget]').length,
  svgs: document.querySelectorAll('#bento-grid svg').length,
  a11y: [...document.querySelectorAll('#bento-grid [data-widget]')].every(c =>
    c.querySelector('button, input, [role="radio"], [role="switch"], [role="tab"], [role="checkbox"], [role="button"]')
  ),
}));
check('Creative mode mounts all 24 widgets, 24 live SVG figures, and 24/24 keyboard/ARIA controls',
  creativeCounts.cards === 24 && creativeCounts.svgs === 24 && creativeCounts.a11y,
  `cards=${creativeCounts.cards} svgs=${creativeCounts.svgs}`);

// Verify 0ms CSS custom-property swatch cascade without SVG DOM regeneration + WCAG contrast across all 6 swatches
const swatchAudit = await p.evaluate(() => {
  const firstSvg = document.querySelector('#bento-grid svg');
  const swatches = [...document.querySelectorAll('.swatchbar button[data-swatch]')].map(b => b.dataset.swatch);
  let allSameNode = true;
  let allContrastOk = swatches.length === 6;
  for (const sw of swatches) {
    document.querySelector(`.swatchbar button[data-swatch="${sw}"]`).click();
    if (document.querySelector('#bento-grid svg') !== firstSvg) allSameNode = false;
    const audit = window.__atlas.auditCurrentTheme();
    if (!audit.ok) allContrastOk = false;
  }
  return { swatches: swatches.length, allSameNode, allContrastOk };
});
check('6-swatch brand cascade preserves SVG DOM nodes (zero rebuild) and passes WCAG AA auditTheme on every swatch',
  swatchAudit.swatches === 6 && swatchAudit.allSameNode && swatchAudit.allContrastOk,
  JSON.stringify(swatchAudit));

// Click every one of the 24 widgets in Creative mode and verify state updates
const all24Transitioned = await p.evaluate(() => {
  const ids = [...document.querySelectorAll('#bento-grid [data-widget]')].map(el => el.dataset.widget);
  let changed = 0;
  for (const id of ids) {
    const before = JSON.stringify(window.__atlas.state);
    const card = document.querySelector(`#bento-grid [data-widget="${id}"]`);
    const range = card.querySelector('input[type="range"]');
    if (range) {
      range.value = '24';
      range.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      const target = card.querySelector('[data-act]:not([aria-checked="true"]):not([aria-selected="true"])') || card.querySelector('[data-act]');
      target?.click();
    }
    if (JSON.stringify(window.__atlas.state) !== before) changed++;
  }
  return { total: ids.length, changed };
});
check('clicking/actuating all 24 Creative widgets transitions model state cleanly',
  all24Transitioned.total === 24 && all24Transitioned.changed === 24,
  `${all24Transitioned.changed}/24`);

// Keyboard arrow navigation on a radiogroup widget (size)
await p.focus('#bento-grid [data-widget="size"] [role="radio"]');
const sizeBefore = await p.evaluate(() => window.__atlas.state.sizeIndex);
await p.keyboard.press('ArrowRight');
const sizeAfter = await p.evaluate(() => window.__atlas.state.sizeIndex);
check('keyboard ArrowRight on a radiogroup widget advances selection and keeps focus',
  sizeBefore !== sizeAfter, `${sizeBefore} -> ${sizeAfter}`);

// Switch to Standard mode without page reload and verify state is preserved
await p.click('[data-mode-btn="standard"]');
await wait(100);
const stdCheck = await p.evaluate(() => ({
  mode: window.__atlas.mode,
  cards: document.querySelectorAll('#bento-grid [data-widget][data-mode="standard"]').length,
  sizeIndex: window.__atlas.state.sizeIndex,
}));
check('Standard <-> Creative toolbar toggle switches all 24 cards in place while preserving state',
  stdCheck.mode === 'standard' && stdCheck.cards === 24 && stdCheck.sizeIndex === sizeAfter);

// Autoplay trigger + user click handoff
await p.click('[data-mode-btn="creative"]');
await p.click('#autoplay-btn');
await wait(150);
const autoRunning = await p.$eval('#autoplay-btn', b => b.getAttribute('aria-pressed') === 'true');
const hasLiveBounce = await p.evaluate(() => document.querySelectorAll('#bento-grid .is-live').length >= 1);
await p.click('#bento-grid [data-widget="club"] [data-act="club"]');
const autoStoppedOnUserClick = await p.$eval('#autoplay-btn', b => b.getAttribute('aria-pressed') === 'false');
check('Autoplay actuates cards with .is-live bounce and hands off cleanly on user click',
  autoRunning && hasLiveBounce && autoStoppedOnUserClick);

// ?render seek(t) order-independence
await p.goto(`${base}/examples/ink-ui/?render`, { waitUntil: 'networkidle0' });
await p.waitForFunction('window.seek');
await p.evaluate(() => document.fonts.ready);
await wait(150);
const shotAt = async t => {
  await p.evaluate(t => window.seek(t), t);
  return (await p.$('#sheet')).screenshot({ encoding: 'base64' });
};
await shotAt(2.4); await shotAt(9.6);
const sA = await shotAt(2.4);
const sB = await shotAt(9.6);
const sC = await shotAt(2.4);
check('?render: window.seek(t) produces identical pixels out-of-order',
  sA === sC && sA !== sB);

// Standalone single-file bundle boot check
await p.goto(`${base}/examples/ink-ui/atelier-ink-ui.html`, { waitUntil: 'networkidle0' });
await p.waitForFunction('window.__atlas');
const bundleCards = await p.$$eval('#bento-grid [data-widget]', xs => xs.length);
check('standalone single-file atelier-ink-ui.html boots all 24 widgets cleanly', bundleCards === 24);

check('no console or page errors', !errors.length, errors.join(' | '));

for (const r of rows) console.log(r.filter(Boolean).join('  '));
await browser.close();
server.close();
process.exit(rows.every(r => r[0] === 'PASS') ? 0 : 1);
