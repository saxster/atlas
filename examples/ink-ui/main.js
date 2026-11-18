// Corner Atelier · 24 Live Ink Widgets (examples/ink-ui/main.js)
// Unifies Standard and Creative modes, 0ms WCAG-clamped 6-swatch brand cascade, Quirk Spectrum,
// Autoplay director, WebAudio tactile synthesis, and stateless ?render seek(t) determinism.

import { ACCENT_SWATCHES, deriveAccentTokens, applyAccentTokens, auditTheme, mountSwatchBar } from '@saxster/atlas/theme.js';
import { ensureInkChromeDefs, ensureDiegeticStyles, createAutoplayDirector } from '@saxster/atlas/diegetic.js';
import { mountSoundToggle, playClick, playBoop, playKnock } from '@saxster/atlas/sound.js';
import * as M from './model.js';
import { renderWidget, renderBentoGrid } from './widgets.js';

const normalizeQuirk = q => {
  const k = String(q || 'slightly-quirky').trim().toLowerCase();
  return ['bland', 'atelier', 'slightly-quirky', 'playful', 'wild'].includes(k) ? k : 'slightly-quirky';
};

const $ = id => document.getElementById(id);
const Q = new URLSearchParams(location.search);
const RENDER = Q.has('render');
if (RENDER) document.documentElement.classList.add('render');

ensureInkChromeDefs();
ensureDiegeticStyles();

let state = { ...M.DEFAULT_STATE, traySlots: [...M.DEFAULT_STATE.traySlots] };
let mode = Q.get('controls') === 'standard' ? 'standard' : 'creative';
let quirk = normalizeQuirk(Q.get('quirk') || 'slightly-quirky');
let activeSwatch = Q.get('accent') || 'coral';

document.documentElement.dataset.quirk = quirk;
document.body.classList.add('ink-page');

const gridEl = $('bento-grid');
const liveMetaEl = $('hero-meta');

function syncMeta() {
  if (liveMetaEl) {
    liveMetaEl.textContent = mode === 'creative'
      ? '24 WIDGETS · 24 LIVE FIGURES · ANY BRAND COLOUR'
      : '24 WIDGETS · 11 LIVE FIGURES · ANY BRAND COLOUR';
  }
  document.querySelectorAll('[data-mode-btn]').forEach(b => {
    b.setAttribute('aria-pressed', String(b.dataset.modeBtn === mode));
  });
  document.querySelectorAll('[data-quirk-btn]').forEach(b => {
    b.setAttribute('aria-pressed', String(b.dataset.quirkBtn === quirk));
  });
}

function drawAll() {
  if (!gridEl) return;
  gridEl.innerHTML = renderBentoGrid(state, { mode, quirk });
  syncMeta();
}

function updateCard(widgetId, { pulse = false } = {}) {
  if (!gridEl) return;
  const oldCard = gridEl.querySelector(`[data-widget="${widgetId}"]`);
  if (!oldCard) { drawAll(); return; }
  const tmp = document.createElement('div');
  tmp.innerHTML = renderWidget(widgetId, state, { mode, quirk });
  const nextCard = tmp.firstElementChild;
  if (!nextCard) return;
  if (pulse && !RENDER) nextCard.classList.add('is-live');
  oldCard.replaceWith(nextCard);
}

drawAll();

// ---------- Toolbar: Standard | Creative, 6 Swatches, Quirk, Autoplay & Sound ----------
const soundAnchor = $('sound-slot');
const soundCtl = soundAnchor ? mountSoundToggle(soundAnchor, { label: 'Sound' }) : null;
const soundCue = kind => {
  if (!soundCtl?.on || !soundCtl.ctx) return;
  if (kind === 'knock') playKnock(soundCtl.ctx);
  else if (kind === 'boop') playBoop(soundCtl.ctx);
  else playClick(soundCtl.ctx);
};

document.querySelectorAll('[data-mode-btn]').forEach(btn => {
  btn.addEventListener('click', () => {
    mode = btn.dataset.modeBtn === 'standard' ? 'standard' : 'creative';
    drawAll();
    soundCue('click');
  });
});

document.querySelectorAll('[data-quirk-btn]').forEach(btn => {
  btn.addEventListener('click', () => {
    quirk = normalizeQuirk(btn.dataset.quirkBtn);
    document.documentElement.dataset.quirk = quirk;
    drawAll();
    soundCue('click');
  });
});

const swatchMount = $('swatch-slot');
const swatchCtl = swatchMount ? mountSwatchBar(swatchMount, {
  swatches: ACCENT_SWATCHES,
  initial: activeSwatch,
  place: 'append',
  onChange: (hex, tokens, key) => {
    activeSwatch = key;
    soundCue('boop');
  },
}) : null;

// Autoplay director
const autoBtn = $('autoplay-btn');
const director = createAutoplayDirector({
  items: M.WIDGET_IDS,
  intervalSec: 1.2,
  onTrigger: id => {
    state = M.stepWidget(state, id);
    updateCard(id, { pulse: true });
    return state;
  },
  onSound: kind => soundCue(kind),
});

function syncAutoBtn() {
  if (!autoBtn) return;
  autoBtn.setAttribute('aria-pressed', String(director.running));
  autoBtn.textContent = director.running ? '■ Stop' : '▶ Autoplay';
}

if (autoBtn) {
  autoBtn.addEventListener('click', () => {
    director.toggle();
    syncAutoBtn();
  });
}

// ---------- Delegated Widget Interactions (Pointer + Keyboard) ----------
gridEl?.addEventListener('click', e => {
  const barCol = e.target.closest?.('[data-bar-idx]');
  if (barCol) {
    if (director.running) { director.stop(); syncAutoBtn(); }
    state = { ...state, chartMonthIndex: +barCol.getAttribute('data-bar-idx') };
    updateCard('chart');
    soundCue('click');
    return;
  }
  const btn = e.target.closest?.('[data-act]');
  if (!btn) return;
  if (director.running) { director.stop(); syncAutoBtn(); }
  const act = btn.dataset.act;
  const val = btn.dataset.val;

  if (act === 'filter' && val !== undefined) state = { ...state, filterCategory: val };
  else if (act === 'date' && val !== undefined) state = { ...state, dateIndex: +val };
  else if (act === 'stepper' && val !== undefined) state = { ...state, brewStep: +val };
  else if (act === 'toggles' && val !== undefined) state = { ...state, toggleMask: state.toggleMask ^ (1 << (+val)) };
  else if (act === 'split' && val !== undefined) state = { ...state, splitCount: +val };
  else if (act === 'size' && val !== undefined) state = { ...state, sizeIndex: +val };
  else if (act === 'rating' && val !== undefined) state = { ...state, rating: +val };
  else if (act === 'milk' && val !== undefined) state = { ...state, milkIndex: +val };
  else if (act === 'order' && val !== undefined) state = { ...state, orderStage: +val };
  else if (act === 'tray' && val !== undefined) {
    const nextSlots = [...state.traySlots];
    nextSlots[+val] = !nextSlots[+val];
    state = { ...state, traySlots: nextSlots };
  }
  else if (act === 'tabs' && val !== undefined) state = { ...state, tabIndex: +val };
  else if (act === 'shots' && val !== undefined) state = { ...state, shots: +val };
  else if (act === 'chart' && val !== undefined) state = { ...state, chartMonthIndex: +val };
  else state = M.stepWidget(state, act);

  if (act === 'coupon' && state.couponTorn) {
    navigator.clipboard?.writeText('BUN20').catch(() => {});
  }
  updateCard(act);
  soundCue(act === 'club' || act === 'pay' ? 'knock' : 'click');
});

gridEl?.addEventListener('input', e => {
  if (e.target.matches?.('[data-tip-range]')) {
    if (director.running) { director.stop(); syncAutoBtn(); }
    state = { ...state, tipPct: +e.target.value };
    updateCard('tip');
    const restored = gridEl.querySelector('[data-tip-range]');
    restored?.focus();
    return;
  }
  if (e.target.matches?.('[data-search-input]')) {
    if (director.running) { director.stop(); syncAutoBtn(); }
    const val = e.target.value;
    state = { ...state, searchQuery: val };
    const pillEl = gridEl.querySelector('[data-widget="search"] [data-pill]');
    if (pillEl) pillEl.textContent = M.searchMenu(val).badge;
  }
});

gridEl?.addEventListener('keydown', e => {
  const barCol = e.target.closest?.('[data-bar-idx]');
  if (barCol && (e.key === 'Enter' || e.key === ' ')) {
    e.preventDefault();
    barCol.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    return;
  }
  const radio = e.target.closest?.('[role="radio"][data-act], [role="tab"][data-act]');
  if (!radio || !['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(e.key)) return;
  const grp = radio.closest('[role="radiogroup"], [role="tablist"]');
  if (!grp) return;
  const items = [...grp.querySelectorAll('[role="radio"], [role="tab"]')];
  const idx = items.indexOf(radio);
  if (idx < 0) return;
  e.preventDefault();
  const dir = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1 : -1;
  const nextIdx = (idx + dir + items.length) % items.length;
  const widgetId = radio.dataset.act;
  items[nextIdx].click();
  const newGrp = gridEl.querySelector(`[data-widget="${widgetId}"] [role="radiogroup"], [data-widget="${widgetId}"] [role="tablist"]`);
  const newItems = newGrp ? [...newGrp.querySelectorAll('[role="radio"], [role="tab"]')] : [];
  newItems[nextIdx]?.focus();
});

// ---------- ?render Tour & Atlas Harness Contract ----------
const starts = M.WIDGET_IDS.map((_, i) => +(i * M.TOUR_STEP_SEC).toFixed(2));
const dwells = M.WIDGET_IDS.map(() => M.TOUR_STEP_SEC);

window.DURATION = M.TOUR_DURATION;
window.seek = t => {
  const { state: st } = M.tourStateAt(t);
  state = st;
  drawAll();
  return state;
};

window.__atlas = {
  get state() { return state; },
  get mode() { return mode; },
  get quirk() { return quirk; },
  get accent() { return swatchCtl?.hex || activeSwatch; },
  setMode(m) { mode = m === 'standard' ? 'standard' : 'creative'; drawAll(); },
  setSwatch(k) { return swatchCtl?.apply(k); },
  auditCurrentTheme() {
    const tokens = deriveAccentTokens(swatchCtl?.hex || activeSwatch);
    return auditTheme([
      { role: 'accentInk on page', fg: tokens.accentInk, bg: '#f2efe7', kind: 'text' },
      { role: 'accentInk on card', fg: tokens.accentInk, bg: '#fffdf6', kind: 'text' },
      { role: 'accentInk on soft', fg: tokens.accentInk, bg: tokens.accentSoft, kind: 'text' },
      { role: 'accentOn on accent', fg: tokens.accentOn, bg: tokens.accent, kind: 'text' },
    ]);
  },
  tour: { starts, dwells, turn: 0.2 },
  labelReport: () => [],
  sceneReport: () => ({
    framing: { subject: 'ink-ui', inFrame: true, centerInFrame: true, center: [0.5, 0.5], empty: false },
    occlusion: { subject: 'ink-ui', blocked: false, occludedBy: null },
    intersections: [],
  }),
};
