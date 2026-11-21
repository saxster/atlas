// Diegetic Illustrated Controls, Standard <-> Creative Switcher & Stateless Autoplay Director for @saxster/atlas.
// Zero top-level DOM globals, zero Node built-ins, zero Three.js imports: runs in Node selftests and browsers alike.
//
// Supported spec.ui.kind schemas (all 8):
//   1. 'unit-stepper'   : Dotted-coaster unit slots (1..maxSlots) with solid objects vs dashed coasters
//   2. 'prop-picker'    : Proportional 2.5D isometric segmented/radio picker (cups, jars, cartons, lenses, signs)
//   3. 'coin-slider'    : Horizontal isometric coin row with full-bleed accessible <input type="range"> overlay
//   4. 'stack-slider'   : Vertical growing isometric stack with full-bleed accessible <input type="range"> overlay
//   5. 'slot-tray'      : Recessed-slot wooden/lab tray toggling items on/off (preserves [data-add] when needed)
//   6. 'object-toggles' : Physical clickable switch trio (hanging sign, pendant lamp + light pool, retro radio)
//   7. 'stamp-card'     : Isometric N-hole punch card + rubber stamp pressing onto next hole
//   8. 'tear-stub'      : Perforated voucher stub detaching along tear line on click/Enter

import {
  isoSvg, isoCup, isoCoin, isoCoinStack, isoDiscSlot, isoJar, isoCarton,
  isoPunchCard, isoTicket, isoSignRow, isoTray, isoBox, isoCyl,
} from './iso_kit.js';
import { rubberband, projectMomentum } from './motion.js';

export function wireModeBar(barEl) {
  if (!barEl || typeof document === 'undefined') return null;
  let pill = barEl.querySelector(':scope > .mode-pill');
  if (!pill) {
    pill = document.createElement('span');
    pill.className = 'mode-pill';
    pill.setAttribute('aria-hidden', 'true');
    pill.style.cssText = 'position:absolute;left:0;top:0;z-index:-1;pointer-events:none';
    barEl.prepend(pill);
  }
  const sync = () => {
    const btn = barEl.querySelector('button[aria-pressed="true"]');
    if (!btn) { pill.style.opacity = '0'; return; }
    pill.style.opacity = '';
    pill.style.width = `${btn.offsetWidth}px`;
    pill.style.height = `${btn.offsetHeight}px`;
    pill.style.transform = `translate(${btn.offsetLeft}px, ${btn.offsetTop}px)`;
  };
  sync();
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(sync).observe(barEl);
  const isRender = typeof location !== 'undefined' && /[?&]render\b/.test(location.search);
  if (!isRender && typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(() => requestAnimationFrame(() => { sync(); barEl.setAttribute('data-ready', ''); }));
  }
  return { el: pill, sync };
}

export function ensureInkChromeDefs() {
  if (typeof document === 'undefined' || !document.body) return null;
  let el = document.getElementById('atlas-ink-defs');
  if (el) return el;
  el = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  el.setAttribute('id', 'atlas-ink-defs');
  el.setAttribute('aria-hidden', 'true');
  el.setAttribute('width', '0');
  el.setAttribute('height', '0');
  el.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;overflow:hidden;pointer-events:none;z-index:-1';
  el.innerHTML = `<defs>
    <filter id="atlas-ui-ink-subtle" x="-4%" y="-4%" width="108%" height="108%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.065" numOctaves="2" seed="4" result="warp"/>
      <feDisplacementMap in="SourceGraphic" in2="warp" scale="1.15" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <filter id="atlas-ui-ink-bold" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.075" numOctaves="2" seed="9" result="warp"/>
      <feDisplacementMap in="SourceGraphic" in2="warp" scale="1.85" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
  </defs>`;
  document.body.prepend(el);
  return el;
}

const esc = s => String(s ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

let diegeticStyleInjected = false;
const DIEGETIC_CSS = `
.dg-ctl { position: relative; display: flex; flex-direction: column; gap: 6px; padding: 10px 12px; border-radius: 12px; }
.dg-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.dg-title { font: 500 11px/1.1 var(--mono, ui-monospace, monospace); letter-spacing: .06em; text-transform: uppercase; color: var(--muted, #686259); }
.dg-pill {
  font: 600 10.5px/1 var(--mono, ui-monospace, monospace); letter-spacing: .04em; text-transform: uppercase;
  padding: 4px 8px; border-radius: 999px; border: 1.5px solid var(--ink-line, #231e16);
  background: var(--card, #fffdf6); color: var(--strong, #231e16); font-variant-numeric: tabular-nums;
}
.dg-pill.accent { background: var(--accent, #ef6a4c); color: var(--accent-on, #ffffff); }
.dg-art { position: relative; width: 100%; min-height: 68px; display: grid; place-items: center; }
.dg-art svg { width: 100%; height: auto; max-height: 112px; display: block; overflow: visible; }
.dg-hit-row {
  position: absolute; inset: 0; display: grid; grid-auto-flow: column; grid-auto-columns: 1fr;
  align-items: stretch; z-index: 2;
}
.dg-hit {
  appearance: none; border: 0; background: transparent; cursor: pointer; padding: 0;
  min-width: 44px; min-height: 44px; border-radius: 8px;
}
.dg-hit:focus-visible { outline: 2px solid var(--strong, #231e16); outline-offset: -2px; background: rgba(35,30,22,0.05); }
.dg-hit:disabled { cursor: default; }
.dg-range-overlay {
  position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; opacity: 0; cursor: ew-resize; z-index: 3;
}
.dg-range-overlay:disabled { cursor: default; }
.dg-ctl:has(.dg-range-overlay:focus-visible) { outline: 2px solid var(--strong, #231e16); outline-offset: 2px; }
.dg-sr-range {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden;
  clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
}
.dg-sub-row { display: flex; justify-content: space-around; gap: 4px; font: 500 11px/1.2 var(--mono, ui-monospace, monospace); color: var(--muted, #686259); }
.dg-sub-row span.is-active { color: var(--accent-ink, #b5381f); font-weight: 700; }
.controlmodebar { margin-top: -4px; }
`;

export function ensureDiegeticStyles() {
  if (diegeticStyleInjected || typeof document === 'undefined' || !document.head) return;
  diegeticStyleInjected = true;
  const st = document.createElement('style');
  st.id = 'atlas-diegetic-styles';
  st.textContent = DIEGETIC_CSS;
  document.head.appendChild(st);
}

const fmtVal = (spec, v) => (typeof spec?.fmt === 'function' ? spec.fmt(v) : String(v ?? ''));

function renderUnitObject(unit, x, y, active, scale = 1) {
  if (!active) return isoDiscSlot({ x, y, z: 0, r: 10.5, active: false, dashed: true, origin: [84, 48], scale });
  if (unit === 'coin') return isoCoinStack({ x, y, z: 0, count: 3, r: 9.5, tone: 'accent', origin: [84, 48], scale });
  if (unit === 'weight' || unit === 'block') return isoBox({ x: x - 7, y: y - 7, z: 0, dx: 14, dy: 14, dz: 12, tone: 'accent', origin: [84, 48], scale });
  if (unit === 'charge') return isoCyl({ x, y, z: 0, r: 9, rTop: 9, h: 9, tone: 'accent', origin: [84, 48], scale });
  return isoCup({ x, y, z: 0, sizeScale: 0.76, active: true, origin: [84, 52], scale });
}

// Render a single control in either 'standard' or 'creative' mode.
// Every numeric control with spec.key ALWAYS emits <input type="range" data-key="..."> and <output data-out="...">
// so explorer.js, sandbox.js, tools/explorertest.mjs, and keyboard users work identically in both modes.
export function renderControl(spec, value, {
  mode = 'creative',
  quirk = 'slightly-quirky',
  disabled = false,
  idPrefix = 'ctl',
} = {}) {
  const key = spec.key || spec.id || 'param';
  const uid = `${idPrefix}-${key}`.replace(/[^a-zA-Z0-9_-]/g, '');
  const ui = spec.ui || null;
  const shown = fmtVal(spec, value);
  const disAttr = disabled ? ' disabled' : '';

  if (mode === 'standard' || !ui?.kind) {
    const min = spec.min ?? 0, max = spec.max ?? 100, step = spec.step ?? 1;
    return `<label class="slider" data-ctl="${esc(key)}" data-mode="standard"><span class="name">${esc(spec.label || key)}</span>` +
      `<input type="range" data-key="${esc(key)}" min="${min}" max="${max}" step="${step}" value="${value ?? min}"${disAttr}>` +
      `<output data-out="${esc(key)}">${esc(shown)}</output></label>`;
  }

  const kind = ui.kind;
  const min = spec.min ?? 1, max = spec.max ?? (ui.maxSlots || 4), step = spec.step ?? 1;

  if (kind === 'unit-stepper') {
    const slots = Math.max(2, Math.min(10, ui.maxSlots || Math.round((max - min) / step) + 1));
    const unit = ui.unit || 'cup';
    const curCount = clamp(Math.round(((value ?? min) - min) / step) + 1, 0, slots);
    const span = 116;
    const itemsSvg = Array.from({ length: slots }, (_, i) => {
      const x = -span / 2 + (slots === 1 ? 0 : (i / (slots - 1)) * span);
      return `<g data-slot-vis="${i + 1}">${renderUnitObject(unit, x, -x * 0.35, i < curCount, 0.92)}</g>`;
    }).join('');
    const svg = isoSvg({ id: `${uid}-step`, vb: [0, 0, 168, 76], quirk, staticBody: itemsSvg, label: `${spec.label || key}: ${shown}` });
    const hits = Array.from({ length: slots }, (_, i) => {
      const slotVal = +(min + i * step).toFixed(4);
      const checked = Math.abs((value ?? min) - slotVal) < step * 0.4;
      return `<button type="button" class="dg-hit" role="radio" aria-checked="${checked}" aria-label="${esc(spec.label || key)}: ${slotVal}" data-ctl-key="${esc(key)}" data-ctl-val="${slotVal}"${disAttr}></button>`;
    }).join('');
    return `<div class="dg-ctl ink-card" data-ctl="${esc(key)}" data-kind="unit-stepper" data-mode="creative">` +
      `<div class="dg-head"><span class="dg-title">${esc(spec.label || key)}</span><output class="dg-pill accent" data-out="${esc(key)}">${esc(shown)}</output></div>` +
      `<div class="dg-art" role="radiogroup" aria-label="${esc(spec.label || key)}">${svg}<div class="dg-hit-row">${hits}</div></div>` +
      `<input type="range" class="dg-sr-range" data-key="${esc(key)}" min="${min}" max="${max}" step="${step}" value="${value ?? min}" aria-label="${esc(spec.label || key)}"${disAttr}>` +
      `</div>`;
  }

  if (kind === 'prop-picker') {
    const opts = ui.options || [
      { value: min, label: 'Low', scale: 0.78 },
      { value: +((min + max) * 0.5).toFixed(2), label: 'Mid', scale: 0.96 },
      { value: max, label: 'High', scale: 1.14 },
    ];
    const glyph = ui.glyph || 'cup';
    const n = opts.length;
    const figs = opts.map((o, i) => {
      const active = String(o.value) === String(value) || Math.abs(Number(o.value) - Number(value)) < (step || 0.01) * 0.45;
      const cx = 30 + (n === 1 ? 54 : (i / (n - 1)) * 108);
      if (glyph === 'jar') return isoJar({ x: 0, y: 0, z: 0, lidLift: active ? 0.85 : 0, active, label: o.short || o.label, origin: [cx, 54], scale: 0.88 });
      if (glyph === 'carton') return isoCarton({ x: -8, y: -8, z: 0, tilt: active ? -11 : 0, active, label: o.short || o.label, origin: [cx, 54], scale: 0.85 });
      return isoCup({ x: 0, y: 0, z: 0, sizeScale: o.scale || (0.78 + i * 0.16), takeaway: true, active, origin: [cx, 58], scale: 0.9 });
    }).join('');
    const svg = isoSvg({ id: `${uid}-prop`, vb: [0, 0, 168, 82], quirk, staticBody: figs, label: `${spec.label || key}: ${shown}` });
    const hits = opts.map((o, i) => {
      const active = String(o.value) === String(value) || Math.abs(Number(o.value) - Number(value)) < (step || 0.01) * 0.45;
      return `<button type="button" class="dg-hit" role="radio" aria-checked="${active}" tabindex="${active || i === 0 ? '0' : '-1'}" aria-label="${esc(o.label)}" data-ctl-key="${esc(key)}" data-ctl-val="${esc(o.value)}"${disAttr}></button>`;
    }).join('');
    const labelsRow = opts.map(o => {
      const active = String(o.value) === String(value) || Math.abs(Number(o.value) - Number(value)) < (step || 0.01) * 0.45;
      return `<span class="${active ? 'is-active' : ''}" data-opt-lbl="${esc(o.value)}">${esc(o.label)}</span>`;
    }).join('');
    const numInput = spec.min !== undefined
      ? `<input type="range" class="dg-sr-range" data-key="${esc(key)}" min="${min}" max="${max}" step="${step}" value="${value ?? min}" aria-label="${esc(spec.label || key)}"${disAttr}>`
      : '';
    return `<div class="dg-ctl ink-card" data-ctl="${esc(key)}" data-kind="prop-picker" data-mode="creative">` +
      `<div class="dg-head"><span class="dg-title">${esc(spec.label || key)}</span><output class="dg-pill accent" data-out="${esc(key)}">${esc(shown)}</output></div>` +
      `<div class="dg-art" role="radiogroup" aria-label="${esc(spec.label || key)}">${svg}<div class="dg-hit-row">${hits}</div></div>` +
      `<div class="dg-sub-row">${labelsRow}</div>` +
      numInput +
      `</div>`;
  }

  if (kind === 'coin-slider' || kind === 'stack-slider') {
    const u = max > min ? clamp(((value ?? min) - min) / (max - min), 0, 1) : 0.5;
    const totalCoins = ui.coins || ui.maxDiscs || 8;
    const litCoins = Math.max(1, Math.round(u * totalCoins));
    let body = '';
    if (kind === 'stack-slider') {
      body = isoCoinStack({ x: 0, y: 0, z: 0, count: litCoins, r: 12, discH: 3.2, tone: 'accent', origin: [84, 62], scale: 1 });
    } else {
      body = Array.from({ length: totalCoins }, (_, i) => {
        const cx = 22 + (i / Math.max(1, totalCoins - 1)) * 124;
        const active = i < litCoins;
        return isoCoin({ x: 0, y: 0, z: active ? 2 : 0, r: 8.2, h: 2.8, tone: active ? 'accent' : 'stone', origin: [cx, 42], scale: 1 });
      }).join('');
    }
    const svg = isoSvg({ id: `${uid}-slider`, vb: [0, 0, 168, 74], quirk, staticBody: body, label: `${spec.label || key}: ${shown}` });
    return `<div class="dg-ctl ink-card" data-ctl="${esc(key)}" data-kind="${kind}" data-mode="creative">` +
      `<div class="dg-head"><span class="dg-title">${esc(spec.label || key)}</span><output class="dg-pill accent" data-out="${esc(key)}">${esc(shown)}</output></div>` +
      `<div class="dg-art">${svg}` +
      `<input type="range" class="dg-range-overlay" data-key="${esc(key)}" min="${min}" max="${max}" step="${step}" value="${value ?? min}" aria-label="${esc(spec.label || key)}"${disAttr}>` +
      `</div></div>`;
  }

  if (kind === 'slot-tray') {
    const slots = ui.slots || [
      { id: 'pos', label: '+q', active: true },
      { id: 'neg', label: '−q', active: true },
    ];
    const bools = slots.map((s, i) => (Array.isArray(value) ? Boolean(value[i]) : (s.active ?? true)));
    const svg = isoSvg({ id: `${uid}-tray`, vb: [0, 0, 168, 84], quirk, staticBody: isoTray({ slots: bools }), label: spec.label || 'Tray slots' });
    const hits = slots.map((s, i) => {
      const addAttr = s.addType ? ` data-add="${esc(s.addType)}"` : '';
      return `<button type="button" class="dg-hit pal-btn" aria-pressed="${bools[i]}" aria-label="${esc(s.label)}" data-tray-slot="${i}" data-slot-id="${esc(s.id || i)}"${addAttr}${disAttr}></button>`;
    }).join('');
    const labelsRow = slots.map((s, i) => `<span class="${bools[i] ? 'is-active' : ''}">${esc(s.label)}</span>`).join('');
    return `<div class="dg-ctl ink-card" data-ctl="${esc(key)}" data-kind="slot-tray" data-mode="creative">` +
      `<div class="dg-head"><span class="dg-title">${esc(spec.label || key)}</span><output class="dg-pill accent" data-out="${esc(key)}">${esc(shown)}</output></div>` +
      `<div class="dg-art" role="group" aria-label="${esc(spec.label || key)}">${svg}<div class="dg-hit-row">${hits}</div></div>` +
      `<div class="dg-sub-row">${labelsRow}</div></div>`;
  }

  if (kind === 'object-toggles') {
    const items = ui.items || [
      { key: 'open', label: 'Open' },
      { key: 'lights', label: 'Lights' },
      { key: 'music', label: 'Music' },
    ];
    const mask = typeof value === 'number' ? value : 0b110;
    const onCount = items.reduce((acc, _, i) => acc + ((mask & (1 << i)) ? 1 : 0), 0);
    const svg = isoSvg({
      id: `${uid}-togs`,
      vb: [0, 0, 168, 76],
      quirk,
      staticBody: isoSignRow({ items: items.map(it => it.label), activeIndex: items.findIndex((_, i) => (mask & (1 << i)) !== 0) }),
      label: `${spec.label || key}: ${onCount} on`,
    });
    const hits = items.map((it, i) => {
      const isOn = Boolean(mask & (1 << i));
      return `<button type="button" class="dg-hit" role="switch" aria-checked="${isOn}" aria-label="${esc(it.label)}" data-tog-bit="${i}" data-ctl-key="${esc(key)}"${disAttr}></button>`;
    }).join('');
    return `<div class="dg-ctl ink-card" data-ctl="${esc(key)}" data-kind="object-toggles" data-mode="creative">` +
      `<div class="dg-head"><span class="dg-title">${esc(spec.label || key)}</span><output class="dg-pill accent" data-out="${esc(key)}">${onCount} on</output></div>` +
      `<div class="dg-art" role="group" aria-label="${esc(spec.label || key)}">${svg}<div class="dg-hit-row">${hits}</div></div></div>`;
  }

  if (kind === 'stamp-card') {
    const total = ui.total || 10;
    const stamped = clamp(Number(value) || 0, 0, total);
    const svg = isoSvg({
      id: `${uid}-stamp`,
      vb: [0, 0, 168, 88],
      quirk,
      staticBody: isoPunchCard({ stamped, total }),
      label: `${spec.label || key}: ${stamped} of ${total}`,
    });
    return `<div class="dg-ctl ink-card" data-ctl="${esc(key)}" data-kind="stamp-card" data-mode="creative">` +
      `<div class="dg-head"><span class="dg-title">${esc(spec.label || key)}</span><output class="dg-pill accent" data-out="${esc(key)}">${stamped}/${total}</output></div>` +
      `<div class="dg-art"><button type="button" class="dg-hit" style="position:absolute;inset:0;width:100%;height:100%" aria-label="Stamp ${esc(spec.label || key)} (${stamped} of ${total})" data-stamp-key="${esc(key)}" data-total="${total}"${disAttr}></button>${svg}</div>` +
      `<input type="range" class="dg-sr-range" data-key="${esc(key)}" min="0" max="${total}" step="1" value="${stamped}" aria-label="${esc(spec.label || key)}"${disAttr}>` +
      `</div>`;
  }

  if (kind === 'tear-stub') {
    const torn = Boolean(value);
    const code = ui.code || 'BUN20';
    const statusText = torn ? (ui.doneLabel || `${code} copied ✓`) : (ui.label || 'Tear to use');
    const svg = isoSvg({
      id: `${uid}-tear`,
      vb: [0, 0, 168, 82],
      quirk,
      staticBody: isoTicket({ title: ui.title || spec.label || '20% OFF', code, torn }),
      label: `${spec.label || key}: ${statusText}`,
    });
    return `<div class="dg-ctl ink-card" data-ctl="${esc(key)}" data-kind="tear-stub" data-mode="creative">` +
      `<div class="dg-head"><span class="dg-title">${esc(spec.label || key)}</span><output class="dg-pill${torn ? ' accent' : ''}" data-out="${esc(key)}">${esc(statusText)}</output></div>` +
      `<div class="dg-art"><button type="button" class="dg-hit" style="position:absolute;inset:0;width:100%;height:100%" aria-pressed="${torn}" aria-label="${esc(spec.label || key)}: ${esc(statusText)}" data-tear-key="${esc(key)}" data-code="${esc(code)}"${disAttr}></button>${svg}</div>` +
      `</div>`;
  }

  return '';
}

// Fast in-place DOM/attribute update for a control without rebuilding filter defs when possible.
export function updateControl(rootEl, spec, value) {
  if (!rootEl || !spec) return;
  const key = spec.key || spec.id || 'param';
  const ctl = rootEl.matches?.(`[data-ctl="${key}"]`) ? rootEl : rootEl.querySelector?.(`[data-ctl="${key}"]`);
  const shown = fmtVal(spec, value);
  const out = ctl?.querySelector?.(`[data-out="${key}"]`) || rootEl.querySelector?.(`input[data-key="${key}"] + output`);
  if (out && out.textContent !== shown) out.textContent = shown;
  const inp = ctl?.querySelector?.(`input[data-key="${key}"]`) || rootEl.querySelector?.(`input[data-key="${key}"]`);
  if (inp && String(inp.value) !== String(value)) inp.value = value;
  if (!ctl) return;
  ctl.querySelectorAll?.('button[data-ctl-val]').forEach((b, idx, list) => {
    const match = String(b.dataset.ctlVal) === String(value) || Math.abs(Number(b.dataset.ctlVal) - Number(value)) < (spec.step || 0.01) * 0.45;
    b.setAttribute('aria-checked', String(match));
    if (b.getAttribute('role') === 'radio') b.setAttribute('tabindex', match || (idx === 0 && ![...list].some(x => x.getAttribute('aria-checked') === 'true')) ? '0' : '-1');
  });
  ctl.querySelectorAll?.('[data-opt-lbl]').forEach(sp => {
    const match = String(sp.dataset.optLbl) === String(value) || Math.abs(Number(sp.dataset.optLbl) - Number(value)) < (spec.step || 0.01) * 0.45;
    sp.classList?.toggle?.('is-active', match);
  });
}

// Delegated event & keyboard binder for diegetic controls inside rootEl.
export function bindControls(rootEl, {
  getParams = () => ({}),
  setParam = null,
  onToggleItem = null,
  onAction = null,
  onSound = null,
} = {}) {
  if (!rootEl || typeof document === 'undefined') {
    return { sync() {}, setDisabled() {}, destroy() {} };
  }
  ensureDiegeticStyles();
  const off = [];
  const on = (el, ev, fn, opt) => { el.addEventListener(ev, fn, opt); off.push(() => el.removeEventListener(ev, fn, opt)); };

  on(rootEl, 'click', e => {
    const radioBtn = e.target.closest?.('button[data-ctl-key][data-ctl-val]');
    if (radioBtn && !radioBtn.disabled) {
      const k = radioBtn.dataset.ctlKey;
      const raw = radioBtn.dataset.ctlVal;
      const numVal = Number(raw);
      const v = Number.isNaN(numVal) ? raw : numVal;
      setParam?.(k, v);
      onSound?.('click');
      return;
    }
    const togBtn = e.target.closest?.('button[data-tog-bit][data-ctl-key]');
    if (togBtn && !togBtn.disabled) {
      const k = togBtn.dataset.ctlKey;
      const bit = +togBtn.dataset.togBit;
      const cur = Number(getParams()?.[k] ?? 0b110);
      const next = cur ^ (1 << bit);
      setParam?.(k, next);
      onSound?.('click');
      return;
    }
    const stampBtn = e.target.closest?.('button[data-stamp-key]');
    if (stampBtn && !stampBtn.disabled) {
      const k = stampBtn.dataset.stampKey;
      const total = +stampBtn.dataset.total || 10;
      const cur = Number(getParams()?.[k] ?? 0);
      const next = (cur + 1) % (total + 1);
      setParam?.(k, next);
      onSound?.('knock');
      return;
    }
    const tearBtn = e.target.closest?.('button[data-tear-key]');
    if (tearBtn && !tearBtn.disabled) {
      const k = tearBtn.dataset.tearKey;
      const cur = Boolean(getParams()?.[k]);
      setParam?.(k, !cur);
      onAction?.('tear', { key: k, code: tearBtn.dataset.code, torn: !cur });
      onSound?.('boop');
      return;
    }
    const trayBtn = e.target.closest?.('button[data-tray-slot]');
    if (trayBtn && !trayBtn.disabled && !trayBtn.hasAttribute('data-add')) {
      const idx = +trayBtn.dataset.traySlot;
      onToggleItem?.(idx, trayBtn.dataset.slotId);
      onSound?.('click');
    }
  });

  // Roving arrow-key navigation for radiogroups
  on(rootEl, 'keydown', e => {
    const radioBtn = e.target.closest?.('button[role="radio"][data-ctl-key]');
    if (!radioBtn) return;
    if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(e.key)) return;
    const grp = radioBtn.closest('[role="radiogroup"]');
    if (!grp) return;
    const btns = [...grp.querySelectorAll('button[role="radio"]:not(:disabled)')];
    const idx = btns.indexOf(radioBtn);
    if (idx < 0) return;
    e.preventDefault();
    const dir = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1 : -1;
    const nextBtn = btns[(idx + dir + btns.length) % btns.length];
    nextBtn.focus();
    nextBtn.click();
  });

  return {
    sync(specs = [], params = {}) {
      for (const s of specs) updateControl(rootEl, s, params[s.key]);
    },
    setDisabled(disabled) {
      rootEl.querySelectorAll('input, button.dg-hit').forEach(el => { el.disabled = Boolean(disabled); });
    },
    destroy() {
      for (const f of off) f();
    },
  };
}

export function mountControlModeBar(anchorEl, {
  initialMode = 'standard',
  place = 'before',
  onChange = null,
} = {}) {
  if (!anchorEl || typeof document === 'undefined') return null;
  ensureDiegeticStyles();
  let cur = initialMode === 'creative' ? 'creative' : 'standard';
  const bar = document.createElement('div');
  bar.className = 'mode controlmodebar';
  bar.setAttribute('role', 'group');
  bar.setAttribute('aria-label', 'Control style (Standard inputs vs Creative illustrated controls)');
  bar.innerHTML = `<button type="button" data-ctlmode="standard" aria-pressed="${cur === 'standard'}">Standard</button>` +
    `<button type="button" data-ctlmode="creative" aria-pressed="${cur === 'creative'}">Creative</button>`;
  if (place === 'before') anchorEl.before(bar);
  else anchorEl.after(bar);
  const pill = wireModeBar(bar);
  const apply = m => {
    cur = m === 'creative' ? 'creative' : 'standard';
    bar.querySelectorAll('button[data-ctlmode]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.ctlmode === cur)));
    pill?.sync();
    onChange?.(cur);
  };
  bar.addEventListener('click', e => {
    const b = e.target.closest('button[data-ctlmode]');
    if (b) apply(b.dataset.ctlmode);
  });
  return { el: bar, apply, get mode() { return cur; } };
}

// Round-robin widget choreography director supporting both live interactive timers and stateless ?render seek(t).
export function createAutoplayDirector({
  items = [],
  intervalSec = 1.4,
  onTrigger = null,
  onLiveCard = null,
  onSound = null,
} = {}) {
  const n = Math.max(1, items.length);
  const dtStep = Math.max(0.2, Number(intervalSec) || 1.4);
  let running = false;
  let stepIndex = 0;
  let timer = null;

  function fireStep(idx, phaseWithinStep = 0) {
    const normIdx = ((idx % n) + n) % n;
    const item = items[normIdx];
    const res = onTrigger?.(item, normIdx, phaseWithinStep);
    onLiveCard?.(item, normIdx, phaseWithinStep);
    return { index: normIdx, item, phase: phaseWithinStep, result: res };
  }

  function start() {
    if (running) return;
    running = true;
    fireStep(stepIndex++, 0);
    onSound?.('click');
    if (typeof setInterval === 'function') {
      timer = setInterval(() => {
        if (!running) return;
        fireStep(stepIndex++, 0);
        onSound?.('boop');
      }, dtStep * 1000);
    }
  }

  function stop() {
    running = false;
    if (timer !== null && typeof clearInterval === 'function') {
      clearInterval(timer);
      timer = null;
    }
  }

  function toggle() {
    if (running) stop();
    else start();
    return running;
  }

  // Pure order-independent evaluation at tour timestamp t (in seconds).
  function seek(t = 0) {
    const clampedT = Math.max(0, Number(t) || 0);
    const k = Math.floor(clampedT / dtStep);
    const u = (clampedT - k * dtStep) / dtStep;
    return fireStep(k, clamp(u, 0, 1));
  }

  return {
    start,
    stop,
    toggle,
    seek,
    destroy: stop,
    get running() { return running; },
    get duration() { return n * dtStep; },
  };
}

// ---------- 1. Semantic Work-State SVG Orbs ----------
export const STATUS_ORB_VARIANTS = Object.freeze(['pulse', 'orbit', 'sweep', 'globe', 'spark']);

export function statusOrb(variant = 'pulse', {
  size = 18,
  label = '',
  elapsed = null,
  color = 'var(--accent, #ef6a4c)',
  id = '',
  pill = false,
} = {}) {
  const kind = STATUS_ORB_VARIANTS.includes(variant) ? variant : 'pulse';
  const sz = Math.max(12, Number(size) || 18);
  let shapes = '';
  if (kind === 'pulse') {
    shapes = `<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.6" class="orb-ring"/>` +
      `<circle cx="12" cy="12" r="3.6" fill="currentColor" class="orb-core"/>`;
  } else if (kind === 'orbit') {
    shapes = `<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-opacity="0.28" stroke-width="1.5"/>` +
      `<circle cx="12" cy="12" r="2.6" fill="currentColor"/>` +
      `<g class="orb-spin"><circle cx="12" cy="4" r="2.2" fill="currentColor"/></g>`;
  } else if (kind === 'sweep') {
    shapes = `<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-opacity="0.22" stroke-width="1.8"/>` +
      `<path d="M12 3.5 A8.5 8.5 0 0 1 20.5 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="orb-spin"/>` +
      `<circle cx="12" cy="12" r="2.2" fill="currentColor"/>`;
  } else if (kind === 'globe') {
    shapes = `<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.5"/>` +
      `<ellipse cx="12" cy="12" rx="4.2" ry="8.5" fill="none" stroke="currentColor" stroke-width="1.3" class="orb-meridian"/>` +
      `<line x1="3.5" y1="12" x2="20.5" y2="12" stroke="currentColor" stroke-width="1.3"/>`;
  } else {
    shapes = `<path d="M12 3 L14.1 9.9 L21 12 L14.1 14.1 L12 21 L9.9 14.1 L3 12 L9.9 9.9 Z" fill="currentColor" class="orb-sparkle"/>`;
  }
  const svg = `<svg class="atlas-orb orb-${kind}"${id ? ` id="${esc(id)}"` : ''} viewBox="0 0 24 24" width="${sz}" height="${sz}" style="color:${esc(color)}" aria-hidden="true">${shapes}</svg>`;
  if (!label && !pill && elapsed == null) return svg;
  const lblHtml = label ? `<span class="orb-lbl">${esc(label)}</span>` : '';
  const timeHtml = elapsed != null && Number.isFinite(Number(elapsed))
    ? `<span class="orb-time">${Number(elapsed).toFixed(1)}s</span>`
    : '';
  return `<span class="atlas-orb-pill" role="status" aria-live="polite">${svg}${lblHtml}${timeHtml}</span>`;
}

// ---------- 2. Live Split-Curtain Compare Slider ----------
export function compareCurtain({
  id = '',
  beforeHtml = '',
  afterHtml = '',
  beforeLabel = 'Before',
  afterLabel = 'After',
  split = 0.5,
  label = 'Compare before and after',
} = {}) {
  const frac = clamp(Number(split) ?? 0.5, 0, 1);
  const pct = Math.round(frac * 100);
  const idAttr = id ? ` id="${esc(id)}"` : '';
  return `<div class="cc-stage"${idAttr} style="--cc-split:${frac.toFixed(4)}">` +
    `<div class="cc-layer cc-after" aria-label="${esc(afterLabel)}">${afterHtml}<span class="cc-tag after">${esc(afterLabel)}</span></div>` +
    `<div class="cc-layer cc-before" aria-label="${esc(beforeLabel)}">${beforeHtml}<span class="cc-tag before">${esc(beforeLabel)}</span></div>` +
    `<div class="cc-divider" aria-hidden="true"></div>` +
    `<button type="button" class="cc-handle" role="slider" aria-label="${esc(label)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-valuetext="${pct}%">` +
    `<span class="cc-grip" aria-hidden="true">‹ ›</span></button>` +
    `</div>`;
}

export function bindCompareCurtain(rootEl, { onChange = null } = {}) {
  if (!rootEl || typeof document === 'undefined') {
    return { setSplit() {}, getSplit: () => 0.5, destroy() {} };
  }
  const stage = rootEl.classList?.contains('cc-stage') ? rootEl : rootEl.querySelector?.('.cc-stage');
  const handle = stage?.querySelector?.('.cc-handle');
  if (!stage || !handle) return { setSplit() {}, getSplit: () => 0.5, destroy() {} };

  let split = clamp(parseFloat(stage.style.getPropertyValue('--cc-split')) || 0.5, 0, 1);
  let dragging = false;

  const setSplit = next => {
    split = clamp(Number(next), 0, 1);
    const pct = Math.round(split * 100);
    stage.style.setProperty('--cc-split', split.toFixed(4));
    handle.setAttribute('aria-valuenow', String(pct));
    handle.setAttribute('aria-valuetext', `${pct}%`);
    onChange?.(split);
  };

  const fracFromX = clientX => {
    const r = stage.getBoundingClientRect();
    return r.width > 0 ? clamp((clientX - r.left) / r.width, 0, 1) : split;
  };

  const onDown = e => {
    if (e.button !== undefined && e.button !== 0) return;
    dragging = true;
    stage.classList.add('is-dragging');
    try { stage.setPointerCapture?.(e.pointerId); } catch {}
    setSplit(fracFromX(e.clientX));
    handle.focus();
  };
  const onMove = e => {
    if (!dragging) return;
    setSplit(fracFromX(e.clientX));
  };
  const onUp = e => {
    if (!dragging) return;
    dragging = false;
    stage.classList.remove('is-dragging');
    try { stage.releasePointerCapture?.(e.pointerId); } catch {}
  };
  const onKey = e => {
    const step = e.shiftKey ? 0.01 : 0.05;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); setSplit(split - step); }
    else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); setSplit(split + step); }
    else if (e.key === 'Home') { e.preventDefault(); setSplit(0); }
    else if (e.key === 'End') { e.preventDefault(); setSplit(1); }
  };

  stage.addEventListener('pointerdown', onDown);
  stage.addEventListener('pointermove', onMove);
  stage.addEventListener('pointerup', onUp);
  stage.addEventListener('pointercancel', onUp);
  handle.addEventListener('keydown', onKey);

  return {
    setSplit,
    getSplit: () => split,
    destroy() {
      stage.removeEventListener('pointerdown', onDown);
      stage.removeEventListener('pointermove', onMove);
      stage.removeEventListener('pointerup', onUp);
      stage.removeEventListener('pointercancel', onUp);
      handle.removeEventListener('keydown', onKey);
    },
  };
}

// ---------- 3. Preview / Code + 390px Phone + Paper/Sepia/Dark Stage Chrome ----------
export function previewStage({
  id = '',
  title = '',
  previewHtml = '',
  code = '',
  themes = ['paper', 'sepia', 'dark'],
  initialTheme = 'paper',
  initialView = 'preview',
  initialDevice = 'desktop',
  dotGrid = true,
  allowDevice = true,
  allowTheme = true,
  allowCode = true,
} = {}) {
  const themeList = Array.isArray(themes) && themes.length ? themes : ['paper'];
  const curTheme = themeList.includes(initialTheme) ? initialTheme : themeList[0];
  const curView = allowCode && initialView === 'code' ? 'code' : 'preview';
  const curDevice = allowDevice && initialDevice === 'phone' ? 'phone' : 'desktop';
  const idAttr = id ? ` id="${esc(id)}"` : '';
  const viewSeg = allowCode
    ? `<div class="ps-seg" role="group" aria-label="View mode">` +
      `<button type="button" data-ps-view="preview" aria-pressed="${curView === 'preview'}">Preview</button>` +
      `<button type="button" data-ps-view="code" aria-pressed="${curView === 'code'}">Code</button>` +
      `</div>`
    : '';
  const devBtn = allowDevice
    ? `<button type="button" class="ps-btn" data-ps-device="${curDevice}" aria-pressed="${curDevice === 'phone'}" title="Toggle 390px phone frame">${curDevice === 'phone' ? '390px' : 'Desktop'}</button>`
    : '';
  const themeBtn = allowTheme && themeList.length > 1
    ? `<button type="button" class="ps-btn" data-ps-theme="${esc(curTheme)}" data-ps-themes="${esc(themeList.join(','))}" title="Cycle surface theme">${esc(curTheme[0].toUpperCase() + curTheme.slice(1))}</button>`
    : '';
  const copyBtn = code
    ? `<button type="button" class="ps-btn" data-ps-copy="">Copy</button>`
    : '';
  const titleHtml = title ? `<span class="ps-title">${esc(title)}</span>` : '';

  return `<div class="ps-frame"${idAttr} data-ps-state-view="${curView}">` +
    `<div class="ps-bar">` +
    `<div class="ps-bar-l">${viewSeg}${titleHtml}</div>` +
    `<div class="ps-bar-r">${devBtn}${themeBtn}${copyBtn}<span class="ps-msg" data-ps-msg="" aria-live="polite"></span></div>` +
    `</div>` +
    `<div class="ps-body${dotGrid ? ' has-grid' : ''}" data-ps-theme="${esc(curTheme)}" data-ps-device="${curDevice}">` +
    `<div class="ps-canvas"${curView === 'code' ? ' hidden' : ''}><div class="ps-viewport">${previewHtml}</div></div>` +
    (allowCode ? `<div class="ps-code"${curView === 'preview' ? ' hidden' : ''}><pre><code>${esc(code)}</code></pre></div>` : '') +
    `</div>` +
    `</div>`;
}

export function bindPreviewStage(rootEl, { onChange = null } = {}) {
  if (!rootEl || typeof document === 'undefined') {
    return { setView() {}, setDevice() {}, setTheme() {}, destroy() {} };
  }
  const frame = rootEl.classList?.contains('ps-frame') ? rootEl : rootEl.querySelector?.('.ps-frame');
  if (!frame) return { setView() {}, setDevice() {}, setTheme() {}, destroy() {} };
  const body = frame.querySelector('.ps-body');
  const canvasEl = frame.querySelector('.ps-canvas');
  const codeEl = frame.querySelector('.ps-code');
  const devBtn = frame.querySelector('[data-ps-device]');
  const themeBtn = frame.querySelector('[data-ps-theme]');
  const msgEl = frame.querySelector('[data-ps-msg]');
  const themes = (themeBtn?.dataset?.psThemes || 'paper,sepia,dark').split(',').filter(Boolean);

  const state = () => ({
    view: frame.dataset.psStateView || 'preview',
    device: body?.dataset.psDevice || 'desktop',
    theme: body?.dataset.psTheme || 'paper',
  });

  function setView(view) {
    const next = view === 'code' && codeEl ? 'code' : 'preview';
    frame.dataset.psStateView = next;
    if (canvasEl) canvasEl.hidden = next === 'code';
    if (codeEl) codeEl.hidden = next !== 'code';
    frame.querySelectorAll('[data-ps-view]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.psView === next)));
    onChange?.(state());
  }

  function setDevice(device) {
    const next = device === 'phone' ? 'phone' : 'desktop';
    if (body) body.dataset.psDevice = next;
    if (devBtn) {
      devBtn.dataset.psDevice = next;
      devBtn.setAttribute('aria-pressed', String(next === 'phone'));
      devBtn.textContent = next === 'phone' ? '390px' : 'Desktop';
    }
    onChange?.(state());
  }

  function setTheme(theme) {
    const next = themes.includes(theme) ? theme : themes[0] || 'paper';
    if (body) body.dataset.psTheme = next;
    if (themeBtn) {
      themeBtn.dataset.psTheme = next;
      themeBtn.textContent = next[0].toUpperCase() + next.slice(1);
    }
    onChange?.(state());
  }

  const onClick = async e => {
    const vBtn = e.target.closest?.('[data-ps-view]');
    if (vBtn && frame.contains(vBtn)) { setView(vBtn.dataset.psView); return; }
    const dBtn = e.target.closest?.('button[data-ps-device]');
    if (dBtn && frame.contains(dBtn)) { setDevice(body?.dataset.psDevice === 'phone' ? 'desktop' : 'phone'); return; }
    const tBtn = e.target.closest?.('button[data-ps-theme]');
    if (tBtn && frame.contains(tBtn)) {
      const cur = body?.dataset.psTheme || themes[0];
      const idx = themes.indexOf(cur);
      setTheme(themes[(idx + 1) % themes.length]);
      return;
    }
    const cBtn = e.target.closest?.('[data-ps-copy]');
    if (cBtn && frame.contains(cBtn)) {
      const txt = codeEl?.querySelector('code')?.textContent || '';
      let ok = false;
      if (txt && typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        try { await navigator.clipboard.writeText(txt); ok = true; } catch {}
      }
      if (msgEl) {
        msgEl.textContent = ok ? 'Copied' : 'Code ready';
        setTimeout(() => { if (msgEl.textContent) msgEl.textContent = ''; }, 1800);
      }
    }
  };

  frame.addEventListener('click', onClick);
  return {
    setView,
    setDevice,
    setTheme,
    destroy() { frame.removeEventListener('click', onClick); },
  };
}

// ---------- 4. Inverted-Polarity Inline-Expanding Floating Control Dock ----------
export function mountFloatingDock(containerEl, {
  items = [],
  cta = null,
  label = 'Page controls',
} = {}) {
  if (!containerEl || typeof document === 'undefined') {
    return { el: null, sync() {}, collapse() {}, destroy() {} };
  }
  const nav = document.createElement('div');
  nav.className = 'atlas-dock';
  nav.setAttribute('role', 'toolbar');
  nav.setAttribute('aria-label', label);

  const ctaHtml = cta
    ? (cta.href
      ? `<a class="dock-cta" href="${esc(cta.href)}">${esc(cta.label)}</a>`
      : `<button type="button" class="dock-cta" data-dock-cta="">${esc(cta.label)}</button>`)
    : '';

  const itemHtml = (items || []).map(it => {
    const id = esc(it.id);
    if (it.kind === 'toggle') {
      return `<button type="button" class="dock-btn" data-dock-toggle="${id}" aria-pressed="${Boolean(it.pressed)}">${esc(it.label)}</button>`;
    }
    const opts = it.options || [];
    const active = opts.find(o => o.value === it.value) || opts[0];
    const swatchDot = active?.swatch ? `<i class="dock-swatch" data-dock-swatch="${id}" style="background:${esc(active.swatch)}" aria-hidden="true"></i>` : '';
    const optHtml = opts.map(o => {
      const sw = o.swatch ? `<i class="dock-swatch" style="background:${esc(o.swatch)}" aria-hidden="true"></i>` : '';
      return `<button type="button" class="dock-opt" data-dock-opt="${id}" data-dock-val-opt="${esc(o.value)}" aria-pressed="${o.value === it.value}" title="${esc(o.label)}">${sw}<span>${esc(o.label)}</span></button>`;
    }).join('');
    return `<div class="dock-group" data-dock-group="${id}" data-open="false">` +
      `<button type="button" class="dock-btn dock-group-btn" data-dock-trigger="${id}" aria-expanded="false" aria-label="${esc(it.label)}">` +
      `${swatchDot}<span class="dock-glbl">${esc(it.label)}</span>` +
      `${active?.swatch ? '' : `<span class="dock-gval" data-dock-val="${id}">${esc(active?.label || '')}</span>`}` +
      `</button>` +
      `<div class="dock-inline" data-dock-inline="${id}" hidden role="group" aria-label="${esc(it.label)}">${optHtml}</div>` +
      `</div>`;
  }).join('');

  nav.innerHTML = `${ctaHtml}${ctaHtml && itemHtml ? '<span class="dock-sep" aria-hidden="true"></span>' : ''}${itemHtml}`;
  containerEl.appendChild(nav);

  const byId = new Map((items || []).map(it => [String(it.id), { ...it }]));

  function collapse() {
    nav.querySelectorAll('.dock-group[data-dock-group]').forEach(grp => {
      grp.dataset.open = 'false';
      grp.querySelector('[data-dock-trigger]')?.setAttribute('aria-expanded', 'false');
      const inline = grp.querySelector('[data-dock-inline]');
      if (inline) inline.hidden = true;
    });
  }

  function sync(patch = {}) {
    for (const [id, val] of Object.entries(patch || {})) {
      const it = byId.get(id);
      if (!it) continue;
      if (it.kind === 'toggle') {
        it.pressed = Boolean(val);
        nav.querySelector(`[data-dock-toggle="${CSS.escape(id)}"]`)?.setAttribute('aria-pressed', String(it.pressed));
      } else {
        it.value = val;
        const opt = (it.options || []).find(o => o.value === val);
        const valEl = nav.querySelector(`[data-dock-val="${CSS.escape(id)}"]`);
        if (valEl && opt) valEl.textContent = opt.label;
        const swEl = nav.querySelector(`[data-dock-swatch="${CSS.escape(id)}"]`);
        if (swEl && opt?.swatch) swEl.style.background = opt.swatch;
        nav.querySelectorAll(`[data-dock-opt="${CSS.escape(id)}"]`).forEach(b => {
          b.setAttribute('aria-pressed', String(b.dataset.dockValOpt === String(val)));
        });
      }
    }
  }

  const onClick = e => {
    const ctaBtn = e.target.closest?.('[data-dock-cta]');
    if (ctaBtn && nav.contains(ctaBtn)) { cta?.onClick?.(ctaBtn); return; }

    const togBtn = e.target.closest?.('[data-dock-toggle]');
    if (togBtn && nav.contains(togBtn)) {
      const it = byId.get(togBtn.dataset.dockToggle);
      if (!it) return;
      it.pressed = !it.pressed;
      togBtn.setAttribute('aria-pressed', String(it.pressed));
      it.onToggle?.(it.pressed);
      return;
    }

    const trig = e.target.closest?.('[data-dock-trigger]');
    if (trig && nav.contains(trig)) {
      const id = trig.dataset.dockTrigger;
      const grp = trig.closest('.dock-group');
      const wasOpen = grp?.dataset.open === 'true';
      collapse();
      if (!wasOpen && grp) {
        grp.dataset.open = 'true';
        trig.setAttribute('aria-expanded', 'true');
        const inline = grp.querySelector('[data-dock-inline]');
        if (inline) inline.hidden = false;
      }
      return;
    }

    const optBtn = e.target.closest?.('[data-dock-opt]');
    if (optBtn && nav.contains(optBtn)) {
      const id = optBtn.dataset.dockOpt;
      const val = optBtn.dataset.dockValOpt;
      const it = byId.get(id);
      if (!it) return;
      sync({ [id]: val });
      it.onChange?.(val);
    }
  };

  const onDocClick = e => {
    if (!nav.contains(e.target)) collapse();
  };
  const onKey = e => {
    if (e.key === 'Escape') collapse();
  };

  nav.addEventListener('click', onClick);
  document.addEventListener('click', onDocClick);
  nav.addEventListener('keydown', onKey);

  return {
    el: nav,
    sync,
    collapse,
    destroy() {
      nav.removeEventListener('click', onClick);
      document.removeEventListener('click', onDocClick);
      nav.removeEventListener('keydown', onKey);
      nav.remove();
    },
  };
}

// ---------- 5. Bounded Undo/Redo Stack & Undo-Over-Confirm Action Receipt ----------
export function createUndoStack({
  limit = 25,
  clone = v => JSON.parse(JSON.stringify(v)),
} = {}) {
  const cap = Math.max(1, Math.floor(Number(limit) || 25));
  const past = [];
  const future = [];

  return {
    push(snapshot, label = '') {
      past.push({ snapshot: clone(snapshot), label: String(label || '') });
      if (past.length > cap) past.shift();
      future.length = 0;
      return past.length;
    },
    undo(currentSnapshot) {
      if (!past.length) return null;
      const entry = past.pop();
      if (currentSnapshot !== undefined) {
        future.push({ snapshot: clone(currentSnapshot), label: entry.label });
        if (future.length > cap) future.shift();
      }
      return { snapshot: clone(entry.snapshot), label: entry.label };
    },
    redo(currentSnapshot) {
      if (!future.length) return null;
      const entry = future.pop();
      if (currentSnapshot !== undefined) {
        past.push({ snapshot: clone(currentSnapshot), label: entry.label });
        if (past.length > cap) past.shift();
      }
      return { snapshot: clone(entry.snapshot), label: entry.label };
    },
    clear() {
      past.length = 0;
      future.length = 0;
    },
    get canUndo() { return past.length > 0; },
    get canRedo() { return future.length > 0; },
    get size() { return past.length; },
  };
}

export function showActionReceipt(anchorEl, {
  message = 'Done',
  undoLabel = 'Undo',
  onUndo = null,
  durationMs = 6500,
} = {}) {
  if (!anchorEl || typeof document === 'undefined') return { dismiss() {}, el: null };
  const host = anchorEl === document.body ? document.body : (anchorEl.parentElement || document.body);
  const existing = host.querySelector('.atlas-receipt[data-receipt-managed="1"]')
    || document.querySelector('.atlas-receipt[data-receipt-managed="1"]');
  if (existing) existing.remove();

  const el = document.createElement('div');
  el.className = 'atlas-receipt';
  el.dataset.receiptManaged = '1';
  if (anchorEl === document.body) el.classList.add('is-floating');
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  el.innerHTML = `<span class="receipt-msg">${esc(message)}</span>` +
    (onUndo ? `<button type="button" class="receipt-undo">${esc(undoLabel)}</button>` : '') +
    `<button type="button" class="receipt-close" aria-label="Dismiss">×</button>`;

  if (anchorEl === document.body) document.body.appendChild(el);
  else anchorEl.after(el);

  let timer = null;
  const clearTimer = () => { if (timer !== null) { clearTimeout(timer); timer = null; } };
  const dismiss = () => { clearTimer(); el.remove(); };
  const armTimer = () => {
    clearTimer();
    if (durationMs > 0) timer = setTimeout(dismiss, durationMs);
  };
  armTimer();

  el.addEventListener('pointerenter', clearTimer);
  el.addEventListener('pointerleave', armTimer);
  el.addEventListener('focusin', clearTimer);
  el.addEventListener('focusout', armTimer);

  const undoBtn = el.querySelector('.receipt-undo');
  if (undoBtn && onUndo) {
    undoBtn.addEventListener('click', () => {
      dismiss();
      onUndo();
    });
  }
  el.querySelector('.receipt-close')?.addEventListener('click', dismiss);

  return { el, dismiss };
}

// ---------- 6. 2D Axis-Locked Space Deck Navigator (No Wrap + Edge Rubberband) ----------
export function clampSpaceDeckZoom(z) {
  return Math.round(clamp(Number(z) || 1, 0.6, 1.4) * 100) / 100;
}

export function stepSpaceDeck(state = { row: 0, col: 0 }, { dRow = 0, dCol = 0, rowLengths = [] } = {}) {
  if (!Array.isArray(rowLengths) || !rowLengths.length) {
    return { row: 0, col: 0, moved: false, hitEdge: true };
  }
  const maxRow = rowLengths.length - 1;
  const prevRow = clamp(Math.round(Number(state?.row) || 0), 0, maxRow);
  const prevMaxCol = Math.max(0, (Number(rowLengths[prevRow]) || 1) - 1);
  const prevCol = clamp(Math.round(Number(state?.col) || 0), 0, prevMaxCol);

  const rawRow = prevRow + Math.round(Number(dRow) || 0);
  const nextRow = clamp(rawRow, 0, maxRow);
  const nextMaxCol = Math.max(0, (Number(rowLengths[nextRow]) || 1) - 1);
  const rawCol = (dRow ? prevCol : prevCol + Math.round(Number(dCol) || 0));
  const nextCol = clamp(rawCol, 0, nextMaxCol);

  const hitEdge = (rawRow !== nextRow) || (!dRow && rawCol !== nextCol);
  const moved = nextRow !== prevRow || nextCol !== prevCol;
  return { row: nextRow, col: nextCol, moved, hitEdge };
}

export function mountSpaceDeck(containerEl, {
  rows = [],
  initialRow = 0,
  initialCol = 0,
  onChange = null,
  onOpen = null,
} = {}) {
  if (!containerEl || typeof document === 'undefined' || !rows.length) {
    return { el: null, goto() {}, getState: () => ({ row: 0, col: 0 }), destroy() {} };
  }
  const CARD_W = 204;
  const CARD_H = 124;
  const GAP = 14;
  const STEP_X = CARD_W + GAP;
  const STEP_Y = CARD_H + GAP;

  const rowLengths = rows.map(r => Math.max(1, (r.items || []).length));
  let pos = stepSpaceDeck({ row: initialRow, col: initialCol }, { rowLengths });
  let zoom = 1.0;

  const vp = document.createElement('div');
  vp.className = 'sd-viewport';
  vp.tabIndex = 0;
  vp.setAttribute('role', 'region');
  vp.setAttribute('aria-roledescription', '2D space deck navigator');
  vp.setAttribute('aria-label', 'Spaces and items deck');

  const rowsMarkup = rows.map((r, ri) => {
    const colStyle = r.color ? `--sd-row-col:${esc(r.color)}` : '';
    const cardsHtml = (r.items || []).map((it, ci) => {
      const thumb = it.img ? `<img class="sd-thumb" src="${esc(it.img)}" alt="" loading="lazy">` : '';
      return `<div class="sd-card" data-sd-row="${ri}" data-sd-col="${ci}" style="${colStyle}">` +
        thumb +
        `<div class="sd-card-meta"><span class="sd-card-k">${esc(it.kicker || r.label)}</span>` +
        `<strong class="sd-card-t">${esc(it.title)}</strong>` +
        (it.sub ? `<span class="sd-card-s">${esc(it.sub)}</span>` : '') +
        `</div></div>`;
    }).join('');
    return `<div class="sd-row" data-sd-row-track="${ri}">${cardsHtml}</div>`;
  }).join('');

  vp.innerHTML = `<div class="sd-hud">` +
    `<div class="sd-crumb"><span class="sd-dot" data-sd-dot></span><strong data-sd-row-lbl></strong><span data-sd-counter></span></div>` +
    `<div class="sd-nav" aria-label="Directional and zoom controls">` +
    `<span class="sd-zoom" data-sd-zoom>100%</span>` +
    `<button type="button" data-sd-zoom-act="out" aria-label="Zoom out">−</button>` +
    `<button type="button" data-sd-zoom-act="in" aria-label="Zoom in">+</button>` +
    `<button type="button" data-sd-dir="left" aria-label="Previous item">←</button>` +
    `<button type="button" data-sd-dir="up" aria-label="Previous space">↑</button>` +
    `<button type="button" data-sd-dir="down" aria-label="Next space">↓</button>` +
    `<button type="button" data-sd-dir="right" aria-label="Next item">→</button>` +
    `</div></div>` +
    `<div class="sd-stage">` +
    `<div class="sd-focus-ring" data-sd-ring aria-hidden="true"></div>` +
    `<div class="sd-track" data-sd-track>${rowsMarkup}</div>` +
    `</div>` +
    `<div class="sd-foot" data-sd-foot aria-live="polite"></div>`;

  containerEl.innerHTML = '';
  containerEl.appendChild(vp);

  const track = vp.querySelector('[data-sd-track]');
  const ring = vp.querySelector('[data-sd-ring]');
  const dot = vp.querySelector('[data-sd-dot]');
  const rowLbl = vp.querySelector('[data-sd-row-lbl]');
  const counterEl = vp.querySelector('[data-sd-counter]');
  const footEl = vp.querySelector('[data-sd-foot]');
  const zoomEl = vp.querySelector('[data-sd-zoom]');

  function activeItem() {
    return rows[pos.row]?.items?.[pos.col] || null;
  }

  function renderPos(dragX = 0, dragY = 0) {
    const r = rows[pos.row];
    const it = activeItem();
    const color = r?.color || 'var(--accent, #ef6a4c)';
    vp.style.setProperty('--sd-col', color);
    if (ring) {
      ring.style.borderColor = color;
      ring.style.transform = `translate(-50%, -50%) scale(${zoom})`;
    }
    if (dot) dot.style.background = color;
    if (rowLbl) rowLbl.textContent = r?.label || '';
    if (counterEl) counterEl.textContent = `${pos.col + 1} / ${rowLengths[pos.row]}`;
    if (zoomEl) zoomEl.textContent = `${Math.round(zoom * 100)}%`;
    if (footEl) footEl.textContent = it ? `${it.title}${it.sub ? ` — ${it.sub}` : ''}` : '';

    const tx = -(pos.col * STEP_X + CARD_W * 0.5) + dragX;
    const ty = -(pos.row * STEP_Y + CARD_H * 0.5) + dragY;
    if (track) track.style.transform = `scale(${zoom}) translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0)`;

    vp.querySelectorAll('.sd-card').forEach(el => {
      const on = +el.dataset.sdRow === pos.row && +el.dataset.sdCol === pos.col;
      el.classList.toggle('is-active', on);
      el.setAttribute('aria-current', on ? 'true' : 'false');
    });
  }

  function goto(row, col, emit = true) {
    const next = stepSpaceDeck({ row, col }, { rowLengths });
    const changed = next.row !== pos.row || next.col !== pos.col;
    pos = next;
    renderPos(0, 0);
    if (changed && emit) onChange?.({ ...pos, rowObj: rows[pos.row], item: activeItem() });
  }

  function step(dRow, dCol) {
    const next = stepSpaceDeck(pos, { dRow, dCol, rowLengths });
    const changed = next.row !== pos.row || next.col !== pos.col;
    pos = next;
    renderPos(0, 0);
    if (changed) onChange?.({ ...pos, rowObj: rows[pos.row], item: activeItem() });
    return next;
  }

  let drag = null;
  const stage = vp.querySelector('.sd-stage');

  const onDown = e => {
    if (e.button !== undefined && e.button !== 0) return;
    drag = {
      id: e.pointerId,
      x0: e.clientX,
      y0: e.clientY,
      t0: performance.now(),
      lastX: e.clientX,
      lastY: e.clientY,
      lastT: performance.now(),
      vx: 0,
      vy: 0,
      axis: null,
      dx: 0,
      dy: 0,
    };
    try { stage.setPointerCapture?.(e.pointerId); } catch {}
  };

  const onMove = e => {
    if (!drag) return;
    const rawX = e.clientX - drag.x0;
    const rawY = e.clientY - drag.y0;
    const now = performance.now();
    const dt = Math.max(1, now - drag.lastT);
    drag.vx = (e.clientX - drag.lastX) / dt;
    drag.vy = (e.clientY - drag.lastY) / dt;
    drag.lastX = e.clientX;
    drag.lastY = e.clientY;
    drag.lastT = now;

    if (!drag.axis && Math.hypot(rawX, rawY) > 8) {
      drag.axis = Math.abs(rawX) >= Math.abs(rawY) ? 'x' : 'y';
      vp.classList.add('is-dragging');
    }
    if (!drag.axis) return;

    if (drag.axis === 'x') {
      const atStart = pos.col === 0 && rawX > 0;
      const atEnd = pos.col === rowLengths[pos.row] - 1 && rawX < 0;
      drag.dx = (atStart || atEnd) ? Math.sign(rawX) * rubberband(Math.abs(rawX), STEP_X, 0.33) : rawX;
      drag.dy = 0;
    } else {
      const atStart = pos.row === 0 && rawY > 0;
      const atEnd = pos.row === rowLengths.length - 1 && rawY < 0;
      drag.dy = (atStart || atEnd) ? Math.sign(rawY) * rubberband(Math.abs(rawY), STEP_Y, 0.33) : rawY;
      drag.dx = 0;
    }
    renderPos(drag.dx, drag.dy);
  };

  const onUp = e => {
    if (!drag) return;
    const d = drag;
    drag = null;
    vp.classList.remove('is-dragging');
    try { stage.releasePointerCapture?.(e.pointerId); } catch {}

    if (!d.axis) {
      const card = e.target.closest?.('.sd-card');
      if (card) {
        const cr = +card.dataset.sdRow;
        const cc = +card.dataset.sdCol;
        if (cr === pos.row && cc === pos.col) {
          const it = activeItem();
          if (onOpen) onOpen(it, pos);
          else if (it?.href) location.href = it.href;
        } else {
          goto(cr, cc, true);
        }
      }
      return;
    }

    if (d.axis === 'x') {
      const proj = d.dx + projectMomentum(d.vx * 16, 0.99) * 0.25;
      if (Math.abs(proj) > 44) step(0, proj < 0 ? 1 : -1);
      else renderPos(0, 0);
    } else {
      const proj = d.dy + projectMomentum(d.vy * 16, 0.99) * 0.25;
      if (Math.abs(proj) > 36) step(proj < 0 ? 1 : -1, 0);
      else renderPos(0, 0);
    }
  };

  function setZoom(z) {
    const next = clampSpaceDeckZoom(z);
    if (next === zoom) return zoom;
    zoom = next;
    renderPos(0, 0);
    onChange?.({ ...pos, zoom, rowObj: rows[pos.row], item: activeItem() });
    return zoom;
  }

  const onClick = e => {
    const zBtn = e.target.closest?.('[data-sd-zoom-act]');
    if (zBtn && vp.contains(zBtn)) {
      setZoom(zoom + (zBtn.dataset.sdZoomAct === 'in' ? 0.12 : -0.12));
      return;
    }
    const dirBtn = e.target.closest?.('[data-sd-dir]');
    if (!dirBtn || !vp.contains(dirBtn)) return;
    const d = dirBtn.dataset.sdDir;
    if (d === 'left') step(0, -1);
    else if (d === 'right') step(0, 1);
    else if (d === 'up') step(-1, 0);
    else if (d === 'down') step(1, 0);
  };

  const onKey = e => {
    if (e.target?.closest?.('input, textarea, select, [contenteditable]')) return;
    if ((e.metaKey || e.ctrlKey) && (e.key === '=' || e.key === '+')) { e.preventDefault(); setZoom(zoom + 0.12); return; }
    if ((e.metaKey || e.ctrlKey) && e.key === '-') { e.preventDefault(); setZoom(zoom - 0.12); return; }
    if (e.shiftKey && (e.code === 'Digit0' || e.key === ')')) { e.preventDefault(); setZoom(1.0); return; }
    if (e.shiftKey && (e.code === 'Digit1' || e.key === '!')) { e.preventDefault(); setZoom(0.72); return; }
    if (e.shiftKey && (e.code === 'Digit2' || e.key === '@')) { e.preventDefault(); setZoom(1.12); return; }
    if (e.key === 'ArrowLeft') { e.preventDefault(); step(0, -1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); step(0, 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); step(-1, 0); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); step(1, 0); }
    else if (e.key === 'Enter' || e.key === ' ') {
      const it = activeItem();
      if (!it) return;
      e.preventDefault();
      if (onOpen) onOpen(it, pos);
      else if (it.href) location.href = it.href;
    }
  };

  stage.addEventListener('pointerdown', onDown);
  stage.addEventListener('pointermove', onMove);
  stage.addEventListener('pointerup', onUp);
  stage.addEventListener('pointercancel', onUp);
  vp.addEventListener('click', onClick);
  vp.addEventListener('keydown', onKey);

  renderPos(0, 0);

  return {
    el: vp,
    goto: (r, c) => goto(r, c, true),
    step,
    setZoom,
    getState: () => ({ ...pos, zoom, item: activeItem() }),
    destroy() {
      stage.removeEventListener('pointerdown', onDown);
      stage.removeEventListener('pointermove', onMove);
      stage.removeEventListener('pointerup', onUp);
      stage.removeEventListener('pointercancel', onUp);
      vp.removeEventListener('click', onClick);
      vp.removeEventListener('keydown', onKey);
      vp.remove();
    },
  };
}
