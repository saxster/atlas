// An atlas figure inside a kym textbook's live widget (live/core.js: Live.register(name, (stage, params, api) => …)).
// The book owns time and Play: its api.loop calls us each frame (dt 0 for a still frame while paused). The figure
// takes the book's theme (sepia, light, dark) and rebuilds when the reader switches it. Between the book's frames the
// adapter draws on its own for a moment after a touch, so a breakdown opens and the camera turns while paused, but
// the physics stays where the reader stopped it. Every part of the page is also a button, the keyboard's way in.
//
// In the book, live/w_<name>.js keeps the literal meta its build reads:
//   import { Live } from './core.js';
//   import { mountAtlas } from './atlas/adapters/kym-live.js';
//   import { CHAPTER } from './atlas/physics/oscillations/chapter.js';
//   Live.register('atlas_shm', (stage, params, api) => mountAtlas(stage, params, api, CHAPTER, { page: 8 }),
//     { label: 'Turn the figure in 3D', three: true });
// params (from :::live atlas_shm {"page": 8, "height": 420}) override the defaults given here. defaults.readout(state)
// gives the book's own words for the readout (one figure, two texts), built from the same model numbers.
import { createStage } from '../engine/stage.js';
import { readTheme } from '../engine/theme.js';

const CSS = `
.atlas-stage { position: relative; width: 100%; border-radius: 6px; overflow: hidden; background: var(--sheet); touch-action: pan-y; }
.atlas-stage canvas { display: block; width: 100%; height: 100%; cursor: grab; }
.atlas-stage canvas.pointing { cursor: pointer; }
.atlas-stage canvas.dragging { cursor: grabbing; }
.atlas-stage .atlas-labels { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
.atlas-stage .lbl { position: absolute; transform: translate(-50%, -50%); white-space: nowrap; }
.atlas-stage .lbl.vec { font: italic 20px/1 Georgia, 'Times New Roman', serif; color: var(--ink); }
.atlas-stage .lbl.vec.red { color: var(--proton); }
.atlas-stage .lbl.vec.blue { color: var(--electron); }
.atlas-stage .lbl.vec.grey, .atlas-stage .lbl.mark { color: var(--muted); }
.atlas-stage .lbl.mark { font: 14px/1 Georgia, serif; }
.atlas-stage .lbl.tick { font: 11px/1 ui-monospace, monospace; color: var(--muted); transform: translate(-100%, -50%); }
.atlas-stage .lbl.board { font: italic 16px/1 Georgia, serif; color: var(--ink); transform: translate(0, -50%); }
.atlas-stage .lbl.axis { font: italic 14px/1 Georgia, serif; color: var(--muted); transform: translate(-100%, -50%); }
.atlas-stage .atlas-title { position: absolute; top: 10px; right: 14px; font: italic 16px/1.3 Georgia, serif; color: var(--ink); pointer-events: none; text-align: right; max-width: 70%; }
.atlas-parts { display: flex; flex-wrap: wrap; gap: 6px; }
`;
let styled = false;
const style = () => { if (styled) return; styled = true; const s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s); };

export function mountAtlas(stage, params, api, chapter, defaults = {}) {
  const opts = { page: 0, height: 400, ...defaults, ...params };
  const page = Math.min(Math.max(opts.page | 0, 0), chapter.PAGES.length - 1), P = chapter.PAGES[page];
  style();
  const wrap = document.createElement('div');
  wrap.className = 'atlas-stage'; wrap.style.height = `${opts.height}px`;
  wrap.setAttribute('role', 'img');
  wrap.setAttribute('aria-label', `${P.fig}. ${P.alt || ''} Drag to turn it; the buttons below take it apart.`.replace(/\s+/g, ' '));
  let canvas = document.createElement('canvas');
  const labels = document.createElement('div'), title = document.createElement('div');
  labels.className = 'atlas-labels'; title.className = 'atlas-title'; title.textContent = P.fig;
  wrap.append(canvas, labels, title); stage.appendChild(wrap);
  const say = api.readout();

  let S = null, clock = chapter.clock0 || 0, hostAt = 0, raf = 0, kickUntil = 0, lastT = 0;
  const describe = k => { const u = S.E.ASM[k].userData, pl = chapter.PLATES[k]; return `<b>${u.title}</b> · ${u.sub}<br>${pl.text}`; };
  function build() {
    if (S) {
      clock = S.clock; S.destroy();
      // a disposed renderer leaves its canvas's context lost for good: the new stage needs a new canvas
      const fresh = document.createElement('canvas'); canvas.replaceWith(fresh); canvas = fresh; listen();
    }
    S = createStage(canvas, labels, chapter, { reduced: api.reduced, touch: matchMedia('(pointer: coarse)').matches, theme: readTheme(stage), dprCap: 2 });
    S.clock = clock;
    S.hooks.onPointerDown = kick; S.hooks.onHover = kick; S.hooks.onSelect = kick;
  }
  function draw(dt, running) {
    const state = S.step({ now: lastT * 1000, dt, s: page, litPage: page, running });
    const k = S.selected;
    say(k ? describe(k) + (chapter.PLATES[k].facts ? '<br>' + chapter.PLATES[k].facts(state).map(([a, b]) => `${a} ${b}`).join(' · ') : '')
      : opts.readout ? opts.readout(state) : chapter.readout(state, P).replace(/\n/g, '<br>'));
  }
  // the book's frames; dt > 0 means it is playing
  api.loop((dt, t) => { lastT = t; if (dt > 0) hostAt = performance.now(); draw(dt, dt > 0); });
  // our own frames for a moment after a touch, when the book is not playing
  function kick() {
    kickUntil = performance.now() + 1600;
    if (!raf) raf = requestAnimationFrame(own);
  }
  let ownLast = 0;
  function own(ts) {
    raf = 0;
    const dt = ownLast ? Math.min((ts - ownLast) / 1000, 0.05) : 1 / 60; ownLast = ts;
    if (performance.now() - hostAt > 120) draw(dt, false);     // the book is not drawing: keep the figure alive
    if (performance.now() < kickUntil || S.dragging) raf = requestAnimationFrame(own); else ownLast = 0;   // then rest: nothing moves
  }
  // a drag turns the camera: keep drawing while it lasts
  function listen() { for (const ev of ['pointermove', 'wheel']) canvas.addEventListener(ev, e => { if (e.buttons || ev === 'wheel') kick(); }, { passive: true }); }
  listen();

  try { build(); } catch (e) {
    wrap.remove();
    const p = document.createElement('p'); p.className = 'live-note'; p.textContent = 'This figure needs WebGL, which this browser has turned off. The drawing above shows it still.';
    stage.appendChild(p);
    return { destroy() { p.remove(); } };
  }
  // the reader switched sepia, light or dark: the figure's paper and ink follow
  const themeObs = new MutationObserver(() => { build(); draw(0, false); });
  themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  // the keyboard's way in: each part on this page as a button; pressing it again puts the part back
  const parts = (P.parts || (P.lit ? [P.lit] : [])).filter(k => chapter.PLATES[k] && S.E.ASM[k]);
  for (const k of parts) {
    const b = api.button(`Take apart: ${S.E.ASM[k].userData.title}`, () => { S.select(S.selected === k ? null : k); b.setAttribute('aria-pressed', String(S.selected === k)); kick(); }, { pressed: false });
  }
  draw(0, false);
  return {
    destroy() { cancelAnimationFrame(raf); themeObs.disconnect(); S.destroy(); wrap.remove(); },
  };
}
