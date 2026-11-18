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
