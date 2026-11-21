// Corner Atelier · 24 Live Ink Widgets & Pattern Suite (examples/ink-ui/main.js)
// Unifies Standard and Creative modes, 0ms WCAG-clamped 6-swatch brand cascade + optional tinted neutrals,
// orthogonal Headline/Corner/Motion registers, Floating Dock, Split Compare, Span Timeline, Orbs, 2D Deck,
// Autoplay director, WebAudio tactile synthesis, and stateless ?render seek(t) determinism.

import {
  ACCENT_SWATCHES, TYPOGRAPHY_PRESETS, RADIUS_PRESETS,
  deriveAccentTokens, applyAccentTokens, auditTheme, mountSwatchBar, buildThemeCssSnippet, mountThemeStudio,
} from '@saxster/atlas/theme.js';
import { draftSvg, draftArrow, draftDimension, draftHatch, draftSupportTicks, draftIsolationWrap, bindDraftIsolation } from '@saxster/atlas/draft_kit.js';
import {
  ensureInkChromeDefs, ensureDiegeticStyles, createAutoplayDirector,
  STATUS_ORB_VARIANTS, statusOrb, compareCurtain, bindCompareCurtain, previewStage, bindPreviewStage,
  mountFloatingDock, createUndoStack, showActionReceipt, mountSpaceDeck,
} from '@saxster/atlas/diegetic.js';
import { spanTimeline, bindSpanTimeline } from '@saxster/atlas/chart.js';
import { MOTION_FEELS, applyMotionFeel } from '@saxster/atlas/motion.js';
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
let tintNeutrals = Q.get('neutrals') === 'tinted';
let typeReg = TYPOGRAPHY_PRESETS[Q.get('type')] ? Q.get('type') : 'clean';
let radiusReg = RADIUS_PRESETS.includes(Q.get('radius')) ? Q.get('radius') : 'soft';
let motionReg = MOTION_FEELS.includes(Q.get('motion')) ? Q.get('motion') : 'spring';

document.documentElement.dataset.quirk = quirk;
document.body.classList.add('ink-page');

const gridEl = $('bento-grid');
const liveMetaEl = $('hero-meta');
let dockCtl = null;
let studioCtl = null;
let studioSyncing = false;

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

function applyPageRegisters(hexOverride = null) {
  const hex = hexOverride || ACCENT_SWATCHES[activeSwatch] || swatchCtl?.hex || activeSwatch;
  applyAccentTokens(document.documentElement, hex, {
    page: '#f2efe7',
    card: '#fffdf6',
    board: '#e7e2d6',
    ink: '#231e16',
    tintNeutrals,
    type: typeReg,
    radius: radiusReg,
  });
  applyMotionFeel(document.documentElement, motionReg);
  dockCtl?.sync({
    mode,
    quirk,
    colour: activeSwatch,
    neutrals: String(tintNeutrals),
    type: typeReg,
    radius: radiusReg,
    motion: motionReg,
    ...(soundCtl ? { sound: soundCtl.on } : {}),
  });
}

document.querySelectorAll('[data-mode-btn]').forEach(btn => {
  btn.addEventListener('click', () => {
    mode = btn.dataset.modeBtn === 'standard' ? 'standard' : 'creative';
    drawAll();
    dockCtl?.sync({ mode });
    soundCue('click');
  });
});

document.querySelectorAll('[data-quirk-btn]').forEach(btn => {
  btn.addEventListener('click', () => {
    quirk = normalizeQuirk(btn.dataset.quirkBtn);
    document.documentElement.dataset.quirk = quirk;
    drawAll();
    dockCtl?.sync({ quirk });
    soundCue('click');
  });
});

const swatchMount = $('swatch-slot');
let swatchCtl = null;
swatchCtl = swatchMount ? mountSwatchBar(swatchMount, {
  swatches: ACCENT_SWATCHES,
  initial: activeSwatch,
  place: 'append',
  onChange: (hex, tokens, key) => {
    activeSwatch = key;
    applyPageRegisters(hex);
    if (!studioSyncing) studioCtl?.setAccent(hex);
    soundCue('boop');
  },
}) : null;
applyPageRegisters();

// ---------- Orthographic Drafting Preview & Token Studio ----------
const studioStageEl = $('token-studio-stage');
const studioCtrlEl = $('token-studio-controls');
let studioPreviewEl = null;

if (studioStageEl && studioCtrlEl) {
  const wallX = 92;
  const block = { kind: 'rect', x: wallX, y: 84, width: 88, height: 112 };
  const hatch = draftHatch({ region: block, pattern: 'H1', phase: 4 });
  const ticks = draftSupportTicks({ from: [wallX, 64], to: [wallX, 224], extent: 14, pitch: 16, side: -1 });
  const dim = draftDimension({
    axis: 'x',
    witnesses: [[wallX, 84], [430, 140]],
    position: 50,
    extensions: { gap: 8, overshoot: 8 },
    label: { text: '338 mm', anchor: [261, 50], clearance: { x: 230, y: 40, width: 62, height: 20 } },
  });
  const vec = draftArrow({ from: [240, 198], to: [430, 140], legLength: 6, angle: 45 });

  const body = [
    `<g data-draft-role="grid"><path d="M56 140H504M261 28V248"/></g>`,
    `<path data-draft-role="hatch" d="${hatch.d}"/>`,
    `<path data-draft-role="guide" d="${ticks.d}"/>`,
    `<line data-draft-role="section" x1="${wallX}" y1="64" x2="${wallX}" y2="224"/>`,
    `<rect data-draft-fill="highlight" x="${block.x}" y="${block.y}" width="${block.width}" height="${block.height}"/>`,
    `<rect data-draft-role="secondary" x="${block.x}" y="${block.y}" width="${block.width}" height="${block.height}"/>`,
    `<path data-draft-role="primary" d="M${wallX + block.width} 140H430"/>`,
    `<circle data-draft-role="primary" cx="430" cy="140" r="4"/>`,
    `<g data-draft-focus="true">`,
    `  <path data-draft-role="transfer" d="${vec.shaftD}" style="stroke:var(--accent-ink,var(--atlas-ink,currentColor))"/>`,
    `  <path data-draft-role="primary" d="${vec.headD}" style="stroke:var(--accent-ink,var(--atlas-ink,currentColor))"/>`,
    `  <text data-draft-text="label" x="342" y="188" font-size="11" font-family="var(--mono,monospace)">F = tip-first transfer</text>`,
    `</g>`,
    `<g data-draft-role="dimension"><path d="${dim.witnessD}"/><path d="${dim.lineD}"/><path d="${dim.slashD}"/></g>`,
    `<text data-draft-text="label" x="${dim.label.anchor[0]}" y="${dim.label.anchor[1] + 4}" text-anchor="middle" font-size="11" font-family="var(--mono,monospace)">${dim.label.text}</text>`,
    `<text data-draft-text="note" data-draft-isolation-only="true" x="261" y="238" text-anchor="middle" font-size="10.5" font-family="var(--mono,monospace)">Isolated: transfer vector + open tip</text>`,
  ].join('');

  const svg = draftSvg({
    id: 'studio-cantilever',
    vb: [0, 0, 560, 260],
    title: 'Cantilever beam drafting specimen',
    desc: 'Orthographic wall ticks, H1 hatch, witness-broken span dimension, and tip-first transfer vector.',
    mode: 'geometric-construction',
    body,
  });

  const draftSnippetCode = [
    `import { draftSvg, draftArrow, draftDimension, draftHatch } from '@saxster/atlas/draft_kit.js';`,
    `const hatch = draftHatch({ region: { kind: 'rect', x: 92, y: 84, width: 88, height: 112 }, pattern: 'H1' });`,
    `const dim = draftDimension({ axis: 'x', witnesses: [[92, 84], [430, 140]], position: 50, label: { text: '338 mm' } });`,
    `const vec = draftArrow({ from: [240, 198], to: [430, 140], legLength: 6, angle: 45 });`,
  ].join('\n');

  studioStageEl.innerHTML = previewStage({
    id: 'studio-preview-stage',
    title: 'draft_kit.js',
    previewHtml: '<div id="token-studio-preview"></div>',
    code: draftSnippetCode,
    themes: ['paper', 'sepia', 'dark'],
    initialTheme: 'paper',
  });
  bindPreviewStage(studioStageEl);

  studioPreviewEl = $('token-studio-preview');
  studioPreviewEl.innerHTML = draftIsolationWrap({
    id: 'studio-iso-plate',
    title: 'Cantilever transfer isolation plate',
    caption: 'Hover, focus, or toggle to isolate the transfer vector without boosting weights.',
    svg,
    buttonLabel: 'Isolate vector',
  });
  bindDraftIsolation(studioPreviewEl);

  studioCtl = mountThemeStudio(studioCtrlEl, {
    targetEl: studioPreviewEl,
    initial: {
      ink: '#231e16',
      accent: swatchCtl?.hex || ACCENT_SWATCHES[activeSwatch] || ACCENT_SWATCHES.coral,
      page: '#f2efe7',
      surface: '#fffdf6',
      tintNeutrals,
      type: typeReg,
      radius: radiusReg,
      motion: motionReg,
    },
    onChange(cfg) {
      if (studioSyncing) return;
      const changed = cfg.tintNeutrals !== tintNeutrals || cfg.type !== typeReg || cfg.radius !== radiusReg || cfg.motion !== motionReg;
      tintNeutrals = Boolean(cfg.tintNeutrals);
      typeReg = cfg.type || typeReg;
      radiusReg = cfg.radius || radiusReg;
      motionReg = cfg.motion || motionReg;
      if (changed) {
        studioSyncing = true;
        applyPageRegisters();
        studioSyncing = false;
      }
    },
  });
}

// ---------- Interactive Patterns Showcase (#patterns, hidden during ?render) ----------
const patterns = { compare: null, timeline: null, deck: null };
const undoStack = createUndoStack({ limit: 15 });

if (!RENDER) {
  const cmpHost = $('pattern-compare-host');
  if (cmpHost) {
    const compareHtml = compareCurtain({
      id: 'ink-compare',
      beforeLabel: 'Standard',
      afterLabel: 'Creative',
      beforeHtml: renderWidget('stepper', state, { mode: 'standard', quirk }),
      afterHtml: renderWidget('stepper', state, { mode: 'creative', quirk }),
      label: 'Compare Standard and Creative widget editions',
    });
    cmpHost.innerHTML = previewStage({
      id: 'pattern-compare-stage',
      title: 'compareCurtain',
      previewHtml: compareHtml,
      code: `const html = compareCurtain({\n  beforeLabel: 'Standard', afterLabel: 'Creative',\n  beforeHtml: stdCard, afterHtml: creativeCard,\n});\nbindCompareCurtain(host);`,
      themes: ['paper', 'sepia', 'dark'],
      initialTheme: 'paper',
    });
    bindPreviewStage(cmpHost);
    patterns.compare = bindCompareCurtain(cmpHost);
  }

  const tlHost = $('pattern-timeline-host');
  if (tlHost) {
    tlHost.innerHTML = spanTimeline({
      id: 'ink-span-timeline',
      title: 'atlas check · physics/dc-motor',
      subtitle: 'Model-first pipeline trace',
      unit: 'ms',
      spans: [
        { id: 'model', label: 'Parse model.js', start: 0, duration: 180, kind: 'model', detail: 'Zero DOM, zero Three.js' },
        { id: 'checks', label: 'Verify checks.mjs', start: 190, duration: 240, kind: 'handoff', parentId: 'model', detail: '14 conservation & limit checks' },
        { id: 'world', label: 'Build 3D stage', start: 440, duration: 420, kind: 'tool', detail: 'revolveSection + idOff flush seams' },
        { id: 'edges', label: 'Edge & hatch pass', start: 490, duration: 290, kind: 'model', parentId: 'world', detail: 'HalfFloat normalRT NearestFilter' },
        { id: 'critic', label: 'Critics: clip & labels', start: 870, duration: 310, kind: 'wait', detail: '1440x900 & 390x844 passes' },
      ],
      summary: [
        { label: 'Duration', value: '1.18s' },
        { label: 'Checks', value: '14 / 14' },
        { label: 'Viewports', value: '2' },
        { label: 'Errors', value: '0' },
      ],
    });
    patterns.timeline = bindSpanTimeline(tlHost);
  }

  const orbsHost = $('pattern-orbs-host');
  if (orbsHost) {
    const orbsHtml = [
      statusOrb('pulse', { label: 'Thinking', elapsed: 0.7 }),
      statusOrb('orbit', { label: 'Solving', elapsed: 1.4 }),
      statusOrb('sweep', { label: 'Drafting' }),
      statusOrb('globe', { label: 'Sourcing' }),
      statusOrb('spark', { label: 'Verified' }),
    ].join('');
    orbsHost.innerHTML = `<div class="ink-orb-grid">${orbsHtml}</div>` +
      `<div class="ink-receipt-bar"><button type="button" class="studio-btn primary" id="pattern-reset-btn">Reset 24 widgets</button></div>`;
    const resetBtn = $('pattern-reset-btn');
    resetBtn?.addEventListener('click', () => {
      undoStack.push({ ...state, traySlots: [...state.traySlots] }, 'Reset 24 widgets');
      state = { ...M.DEFAULT_STATE, traySlots: [...M.DEFAULT_STATE.traySlots] };
      drawAll();
      soundCue('click');
      showActionReceipt(resetBtn, {
        message: 'Reset all 24 widgets',
        onUndo: () => {
          const prev = undoStack.undo();
          if (prev) {
            state = prev.snapshot;
            drawAll();
            soundCue('boop');
          }
        },
      });
    });
  }

  const deckHost = $('pattern-deck-host');
  if (deckHost) {
    patterns.deck = mountSpaceDeck(deckHost, {
      rows: [
        {
          id: 'reg1', label: 'Register 1 · Textbook', color: '#5a79c2',
          items: [
            { id: 'textbook-pure', title: 'textbook-pure', sub: 'Paper-ink plate · calm defaults', quirk: 'bland' },
            { id: 'plotter-draft', title: 'plotter-draft', sub: '2D orthographic hairline plate', quirk: 'atelier' },
          ],
        },
        {
          id: 'reg2', label: 'Register 2 · Atelier', color: '#3aa57a',
          items: [
            { id: 'ciechanowski', title: 'ciechanowski-mechanism', sub: 'Driver / driven / idler role gears', quirk: 'atelier' },
            { id: 'byrne', title: 'byrne-visual-proof', sub: 'Primary ink Euclidean chips', quirk: 'atelier' },
            { id: 'moebius', title: 'moebius-printmaking', sub: 'Cross-hatch & Risograph dots', quirk: 'slightly-quirky' },
          ],
        },
        {
          id: 'reg3', label: 'Register 3 · Sketchbook', color: '#ef6a4c',
          items: [
            { id: 'bugged', title: 'bugged-sketchbook', sub: 'Default watercolor & ink wobble', quirk: 'slightly-quirky' },
            { id: 'ncase', title: 'ncase-playable-toy', sub: 'Playable arc & :nutshell asides', quirk: 'playful' },
          ],
        },
        {
          id: 'reg4', label: 'Register 4 · Wild Lab', color: '#8c6bb5',
          items: [
            { id: 'whacky', title: 'whacky-lab', sub: '12 Hz boil + rubber-hose springs', quirk: 'wild' },
          ],
        },
      ],
      initialRow: 2,
      initialCol: 0,
      onOpen(item) {
        if (!item?.quirk) return;
        quirk = normalizeQuirk(item.quirk);
        document.documentElement.dataset.quirk = quirk;
        drawAll();
        applyPageRegisters();
        soundCue('boop');
      },
    });
  }

  // Inline-expanding inverted floating dock
  const swatchOpts = Object.entries(ACCENT_SWATCHES).map(([k, hex]) => ({
    value: k,
    label: k[0].toUpperCase() + k.slice(1),
    swatch: hex,
  }));
  dockCtl = mountFloatingDock(document.body, {
    label: 'Corner Atelier controls',
    cta: {
      label: 'Copy prompt',
      onClick: async btn => {
        const prompt = 'Use @saxster/atlas (`npx atlas boot ink-ui`) to build model-first diegetic ink controls, WCAG-clamped swatches, and deterministic ?render tours.';
        try { await navigator.clipboard?.writeText(prompt); } catch {}
        const prev = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.textContent = prev; }, 1600);
      },
    },
    items: [
      {
        id: 'mode', kind: 'group', label: 'Mode', value: mode,
        options: [{ value: 'standard', label: 'Standard' }, { value: 'creative', label: 'Creative' }],
        onChange: v => { mode = v; drawAll(); soundCue('click'); },
      },
      {
        id: 'quirk', kind: 'group', label: 'Quirk', value: quirk,
        options: [
          { value: 'bland', label: 'Crisp' },
          { value: 'slightly-quirky', label: 'Inked' },
          { value: 'playful', label: 'Playful' },
        ],
        onChange: v => { quirk = normalizeQuirk(v); document.documentElement.dataset.quirk = quirk; drawAll(); soundCue('click'); },
      },
      {
        id: 'colour', kind: 'group', label: 'Colour', value: activeSwatch,
        options: swatchOpts,
        onChange: k => { swatchCtl?.apply(k); },
      },
      {
        id: 'neutrals', kind: 'group', label: 'Neutrals', value: String(tintNeutrals),
        options: [{ value: 'false', label: 'Pure' }, { value: 'true', label: 'Tinted' }],
        onChange: v => {
          tintNeutrals = v === 'true';
          applyPageRegisters();
          studioSyncing = true; studioCtl?.setTintNeutrals(tintNeutrals); studioSyncing = false;
        },
      },
      {
        id: 'type', kind: 'group', label: 'Aa', value: typeReg,
        options: [{ value: 'clean', label: 'Clean' }, { value: 'editorial', label: 'Editorial' }, { value: 'technical', label: 'Technical' }],
        onChange: v => {
          typeReg = v;
          applyPageRegisters();
          studioSyncing = true; studioCtl?.setType(typeReg); studioSyncing = false;
        },
      },
      {
        id: 'radius', kind: 'group', label: 'Corners', value: radiusReg,
        options: [{ value: 'sharp', label: 'Sharp' }, { value: 'soft', label: 'Soft' }, { value: 'round', label: 'Round' }],
        onChange: v => {
          radiusReg = v;
          applyPageRegisters();
          studioSyncing = true; studioCtl?.setRadius(radiusReg); studioSyncing = false;
        },
      },
      {
        id: 'motion', kind: 'group', label: 'Motion', value: motionReg,
        options: [{ value: 'spring', label: 'Spring' }, { value: 'smooth', label: 'Smooth' }, { value: 'instant', label: 'Instant' }],
        onChange: v => {
          motionReg = v;
          applyPageRegisters();
          studioSyncing = true; studioCtl?.setMotion(motionReg); studioSyncing = false;
        },
      },
    ],
  });
}

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
  get registers() { return { tintNeutrals, type: typeReg, radius: radiusReg, motion: motionReg }; },
  studio: studioCtl,
  dock: dockCtl,
  patterns,
  buildThemeCssSnippet,
  setMode(m) { mode = m === 'standard' ? 'standard' : 'creative'; drawAll(); dockCtl?.sync({ mode }); },
  setSwatch(k) { return swatchCtl?.apply(k); },
  auditCurrentTheme() {
    const tokens = deriveAccentTokens(swatchCtl?.hex || activeSwatch, {
      page: '#f2efe7',
      card: '#fffdf6',
      ink: '#231e16',
      tintNeutrals,
    });
    return auditTheme([
      { role: 'accentInk on page', fg: tokens.accentInk, bg: tokens.neutrals.page, kind: 'text' },
      { role: 'accentInk on card', fg: tokens.accentInk, bg: tokens.neutrals.card, kind: 'text' },
      { role: 'accentInk on soft', fg: tokens.accentInk, bg: tokens.accentSoft, kind: 'text' },
      { role: 'accentOn on accent', fg: tokens.accentOn, bg: tokens.accent, kind: 'text' },
      { role: 'strong on card', fg: tokens.neutrals.strong, bg: tokens.neutrals.card, kind: 'text' },
      { role: 'text on card', fg: tokens.neutrals.text, bg: tokens.neutrals.card, kind: 'text' },
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
