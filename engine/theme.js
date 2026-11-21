// A host page's colours as a theme for createStage (see parts.js applyTheme), plus pure WCAG 2.x contrast helpers.
// Zero Node imports: tools/vendor.mjs bundles this file into offline Kym textbooks via esbuild.
import { DRAFT_STANDARD } from './draft_standard.js';
import { VOICES, VOICE_IDS, DEFAULT_VOICE, resolveVoice, listVoices } from './voices.js';
import { applyMotionFeel } from './motion.js';
export { VOICES, VOICE_IDS, DEFAULT_VOICE, resolveVoice, listVoices };
export const KYM = { sheet: '--sheet', ink: '--ink', red: '--proton', blue: '--electron', green: '--green', ochre: '--neutron' };

// Oliver Byrne (1847 Chiswick Press / c82.net) primary-colour geometric proof theme.
// Yellow fills (#e5ad16) are keylined in carbon ink (#1b1917) by render.js's edge pass; unbordered prose text uses #8a6200.
export const BYRNE_THEME = {
  sheet: '#f4efe2',
  ink: '#1b1917',
  red: '#d63a24',
  blue: '#1d5b8c',
  ochre: '#e5ad16',
  green: '#226b48',
};

export function readTheme(el = document.documentElement, names = KYM) {
  const cs = getComputedStyle(el), g = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  const hex = v => {
    if (!v) return null;
    g.fillStyle = '#000'; g.fillStyle = v; g.clearRect(0, 0, 1, 1); g.fillRect(0, 0, 1, 1);
    const [r, gg, b] = g.getImageData(0, 0, 1, 1).data;
    return '#' + [r, gg, b].map(x => x.toString(16).padStart(2, '0')).join('');
  };
  const t = {};
  for (const [k, prop] of Object.entries(names)) { const v = hex(cs.getPropertyValue(prop).trim()); if (v) t[k] = v; }
  return t.sheet && t.ink ? t : null;          // without paper and ink there is no theme to follow
}

// Parse #rgb, #rrggbb, #rrggbbaa, rgb(r,g,b), or rgba(r,g,b,a) into { r, g, b, a } with r,g,b in [0..255], a in [0..1].
export function parseColor(input) {
  if (input && typeof input === 'object' && 'r' in input) return { r: +input.r, g: +input.g, b: +input.b, a: input.a ?? 1 };
  const s = String(input ?? '').trim();
  const hex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.exec(s);
  if (hex) {
    let h = hex[1];
    if (h.length <= 4) h = [...h].map(c => c + c).join('');
    const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
    const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
    return { r, g, b, a };
  }
  const rgba = /^rgba?\(\s*([+-]?\d+(?:\.\d+)?)\s*,\s*([+-]?\d+(?:\.\d+)?)\s*,\s*([+-]?\d+(?:\.\d+)?)(?:\s*,\s*([+-]?\d*\.?\d+))?\s*\)$/i.exec(s);
  if (rgba) {
    const [r, g, b] = [1, 2, 3].map(i => +rgba[i]);
    const a = rgba[4] !== undefined ? +rgba[4] : 1;
    if ([r, g, b].some(v => v < 0 || v > 255) || a < 0 || a > 1) throw new Error(`Color out of range: ${s}`);
    return { r, g, b, a };
  }
  throw new Error(`Unparseable color: ${s}`);
}

// Alpha-composite fg over an opaque bg (and optional base surface when bg itself is translucent).
export function compositeOver(fg, bg, surface = null) {
  const f = parseColor(fg);
  let b = parseColor(bg);
  if (b.a < 1 && surface) b = compositeOver(b, surface);
  if (f.a >= 1) return { r: f.r, g: f.g, b: f.b, a: 1 };
  return {
    r: f.r * f.a + b.r * (1 - f.a),
    g: f.g * f.a + b.g * (1 - f.a),
    b: f.b * f.a + b.b * (1 - f.a),
    a: 1,
  };
}

// IEC 61966-2-1 relative luminance in [0, 1].
export function srgbLuminance(color) {
  const { r, g, b } = parseColor(color);
  const lin = c => { const v = c / 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

// WCAG 2.x contrast ratio in [1, 21], compositing translucent fg (and translucent bg when surface is provided).
export function wcagContrast(fg, bg, surface = null) {
  const bgEff = surface ? compositeOver(bg, surface) : parseColor(bg);
  const fgEff = compositeOver(fg, bgEff);
  const l1 = srgbLuminance(fgEff), l2 = srgbLuminance(bgEff);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

const MIN_RATIO = { text: 4.5, largeText: 3.0, mark: 3.0 };

// Audit an array of { role, fg, bg, surface?, kind?: 'text' | 'largeText' | 'mark', min? } entries.
export function auditTheme(entries) {
  const findings = [];
  for (const e of entries) {
    const min = e.min ?? MIN_RATIO[e.kind || 'text'] ?? 4.5;
    const ratio = wcagContrast(e.fg, e.bg, e.surface || null);
    if (ratio + 1e-9 < min) findings.push({ role: e.role, fg: e.fg, bg: e.bg, ratio: +ratio.toFixed(2), min });
  }
  return { ok: findings.length === 0, findings };
}

export const ACCENT_SWATCHES = {
  coral: '#ef6a4c',
  amber: '#f4b829',
  emerald: '#3aa57a',
  cobalt: '#5a79c2',
  plum: '#8c6bb5',
  crimson: '#d63a24',
};

export const TONAL_STOPS = Object.freeze([0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99, 100]);

export const TYPOGRAPHY_PRESETS = Object.freeze({
  editorial: { label: 'Editorial', display: "'EB Garamond', Georgia, serif" },
  clean: { label: 'Clean', display: "'Inter', system-ui, sans-serif" },
  technical: { label: 'Technical', display: "'JetBrains Mono', ui-monospace, monospace" },
});

export const RADIUS_PRESETS = Object.freeze(['sharp', 'soft', 'round']);

const toHex = ({ r, g, b }) => '#' + [r, g, b]
  .map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'))
  .join('');

const mixRgb = (a, b, t) => ({
  r: a.r + (b.r - a.r) * t,
  g: a.g + (b.g - a.g) * t,
  b: a.b + (b.b - a.b) * t,
  a: 1,
});

const resolveHex = hex => ACCENT_SWATCHES[String(hex || '').toLowerCase()] || hex || ACCENT_SWATCHES.coral;

// Perceptual L* -> relative luminance Y scale (0..100) so tone 40 achieves uniform >= 4.5:1 contrast vs white in any hue.
export function tonalScale(hex) {
  const base = parseColor(resolveHex(hex));
  const baseY = srgbLuminance(base);
  const black = { r: 0, g: 0, b: 0, a: 1 };
  const white = { r: 255, g: 255, b: 255, a: 1 };
  const out = {};
  for (const tone of TONAL_STOPS) {
    if (tone === 0) { out[0] = '#000000'; continue; }
    if (tone === 100) { out[100] = '#ffffff'; continue; }
    const L = tone / 100;
    const targetY = Math.max(0, Math.min(1, L <= 0.08 ? L / 9.033 : ((L + 0.16) / 1.16) ** 3));
    const pole = targetY < baseY ? black : white;
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 20; i++) {
      const mid = (lo + hi) * 0.5;
      const y = srgbLuminance(mixRgb(base, pole, mid));
      if (targetY < baseY ? y > targetY : y < targetY) lo = mid;
      else hi = mid;
    }
    out[tone] = toHex(mixRgb(base, pole, (lo + hi) * 0.5));
  }
  return Object.freeze(out);
}

// Proportional corner radii derived from control height (~h/3 even-rounded in Soft mode).
export function controlRadius(heightPx = 36, preset = 'soft') {
  const h = Math.max(8, Number(heightPx) || 36);
  const p = RADIUS_PRESETS.includes(preset) ? preset : 'soft';
  if (p === 'sharp') return { preset: p, control: 2, chip: 2, card: 4, pill: 4 };
  if (p === 'round') return { preset: p, control: Math.round(h / 2), chip: 999, card: Math.round(h * 0.55), pill: 999 };
  const control = Math.max(4, Math.round(h / 6) * 2);
  return {
    preset: p,
    control,
    chip: Math.max(4, Math.round(control * 0.75)),
    card: Math.round(control * 1.35),
    pill: 999,
  };
}

// Optional brand-hue-tinted neutral surfaces/inks with WCAG floor clamping against card surface.
export function deriveNeutralTokens(hex, {
  page = '#f2efe7',
  card = '#fffdf6',
  board = '#e7e2d6',
  faint = '#d4d4d6',
  muted = '#68686d',
  text = '#453f34',
  strong = '#231e16',
  tint = false,
} = {}) {
  const base = { page, card, board, faint, muted, text, strong };
  if (!tint) return base;
  const brand = parseColor(resolveHex(hex));
  const tintHex = (src, amount) => toHex(mixRgb(parseColor(src), brand, amount));
  const clampContrast = (fgHex, bgHex, minRatio) => {
    if (wcagContrast(fgHex, bgHex) >= minRatio) return fgHex;
    const fg = parseColor(fgHex);
    const pole = wcagContrast('#111111', bgHex) >= wcagContrast('#ffffff', bgHex)
      ? parseColor('#111111')
      : parseColor('#ffffff');
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 18; i++) {
      const mid = (lo + hi) * 0.5;
      if (wcagContrast(mixRgb(fg, pole, mid), bgHex) >= minRatio) hi = mid;
      else lo = mid;
    }
    return toHex(mixRgb(fg, pole, hi));
  };
  const tintedCard = tintHex(card, 0.012);
  const tintedPage = tintHex(page, 0.02);
  const mutedTarget = Math.min(4.55, wcagContrast(muted, card));
  return {
    page: tintedPage,
    card: tintedCard,
    board: tintHex(board, 0.032),
    faint: tintHex(faint, 0.07),
    muted: clampContrast(tintHex(muted, 0.07), tintedCard, mutedTarget),
    text: clampContrast(tintHex(text, 0.06), tintedCard, 4.55),
    strong: clampContrast(tintHex(strong, 0.08), tintedCard, 10.0),
  };
}

// Derive a 6-token perceptual & WCAG-clamped accent cascade from a single hex swatch, plus tonal scale & neutral/type/radius registers.
// Ensures unbordered text/icon ink (--accent-ink) achieves >= 4.5:1 against page, card, and accentSoft,
// and solid badge foreground (--accent-on) achieves >= 4.5:1 against accent.
export function deriveAccentTokens(hex, {
  page = '#f2efe7',
  card = '#fffdf6',
  board = '#e7e2d6',
  faint = '#d4d4d6',
  muted = '#68686d',
  text = '#453f34',
  ink = '#231e16',
  tintNeutrals = false,
  type = null,
  radius = null,
} = {}) {
  const raw = resolveHex(hex);
  const base = parseColor(raw);
  const tones = tonalScale(raw);
  const neutrals = deriveNeutralTokens(raw, {
    page, card, board, faint, muted, text, strong: ink, tint: !!tintNeutrals,
  });
  const pg = parseColor(neutrals.page);
  const cd = parseColor(neutrals.card);
  const ik = parseColor(neutrals.strong);

  const accent = toHex(base);
  const accentMid = toHex(mixRgb(base, ik, 0.18));
  const accentDeep = toHex(mixRgb(base, ik, 0.34));
  const softRgb = mixRgb(base, cd, 0.85);
  const accentSoft = toHex(softRgb);

  const passesInk = c => (
    wcagContrast(c, pg) >= 4.55 &&
    wcagContrast(c, cd) >= 4.55 &&
    wcagContrast(c, softRgb) >= 4.55
  );

  let accentInk = accent;
  if (!passesInk(base)) {
    // Try towards ink first; if ink itself doesn't pass on dark/light extremes, pick whichever pole (#111 vs #fff) has higher contrast.
    const pole = passesInk(ik)
      ? ik
      : (wcagContrast('#ffffff', cd) > wcagContrast('#111111', cd) ? parseColor('#ffffff') : parseColor('#111111'));
    let lo = 0, hi = 1;
    for (let i = 0; i < 18; i++) {
      const mid = (lo + hi) * 0.5;
      if (passesInk(mixRgb(base, pole, mid))) hi = mid;
      else lo = mid;
    }
    accentInk = toHex(mixRgb(base, pole, hi));
  }

  const darkPole = srgbLuminance(ik) < 0.5 ? ik : parseColor('#231e16');
  const lightPole = parseColor('#ffffff');
  const cDark = wcagContrast(darkPole, base);
  const cLight = wcagContrast(lightPole, base);
  let accentOn = cDark >= cLight ? toHex(darkPole) : '#ffffff';
  if (Math.max(cDark, cLight) < 4.5) {
    accentOn = wcagContrast('#000000', base) >= wcagContrast('#ffffff', base) ? '#000000' : '#ffffff';
  }

  const res = {
    accent,
    accentMid,
    accentDeep,
    accentSoft,
    accentInk,
    accentOn,
    tones,
    neutrals,
    tintNeutrals: !!tintNeutrals,
  };
  if (type) {
    const tKey = TYPOGRAPHY_PRESETS[type] ? type : 'editorial';
    res.type = tKey;
    res.displayFont = TYPOGRAPHY_PRESETS[tKey].display;
  }
  if (radius) {
    res.radius = controlRadius(36, radius);
  }
  return res;
}

const NEUTRAL_VAR_PROPS = [
  ['page', '--page'],
  ['card', '--card'],
  ['board', '--board'],
  ['faint', '--faint'],
  ['muted', '--muted'],
  ['text', '--text'],
  ['strong', '--strong'],
];

export function applyAccentTokens(el, tokensOrHex, opts = {}) {
  if (!el?.style?.setProperty) return null;
  const t = typeof tokensOrHex === 'string' ? deriveAccentTokens(tokensOrHex, opts) : tokensOrHex;
  if (!t) return null;
  el.style.setProperty('--accent', t.accent);
  el.style.setProperty('--accent-mid', t.accentMid);
  el.style.setProperty('--accent-deep', t.accentDeep);
  el.style.setProperty('--accent-soft', t.accentSoft);
  el.style.setProperty('--accent-ink', t.accentInk);
  el.style.setProperty('--accent-on', t.accentOn);
  if (t.tones) {
    el.style.setProperty('--accent-tone-40', t.tones[40]);
    el.style.setProperty('--accent-tone-90', t.tones[90]);
  }
  const shouldTint = opts.tintNeutrals !== undefined ? !!opts.tintNeutrals : !!t.tintNeutrals;
  if (shouldTint && t.neutrals) {
    for (const [key, cssVar] of NEUTRAL_VAR_PROPS) {
      if (t.neutrals[key]) el.style.setProperty(cssVar, t.neutrals[key]);
    }
    if (el.dataset) el.dataset.neutralTint = 'tinted';
  } else if (opts.tintNeutrals === false || (typeof tokensOrHex === 'object' && t.tintNeutrals === false)) {
    for (const [, cssVar] of NEUTRAL_VAR_PROPS) el.style.removeProperty?.(cssVar);
    if (el.dataset) el.dataset.neutralTint = 'neutral';
  }
  const typeKey = opts.type || t.type;
  if (typeKey) {
    const resolved = TYPOGRAPHY_PRESETS[typeKey] ? typeKey : 'editorial';
    if (el.dataset) el.dataset.type = resolved;
    el.style.setProperty('--display-font', TYPOGRAPHY_PRESETS[resolved].display);
  }
  const radiusSpec = opts.radius
    ? (typeof opts.radius === 'string' ? controlRadius(36, opts.radius) : opts.radius)
    : t.radius;
  if (radiusSpec) {
    if (el.dataset) el.dataset.radius = radiusSpec.preset;
    el.style.setProperty('--atlas-r-ctl', `${radiusSpec.control}px`);
    el.style.setProperty('--atlas-r-chip', `${radiusSpec.chip}px`);
    el.style.setProperty('--atlas-r-card', `${radiusSpec.card}px`);
    el.style.setProperty('--atlas-r-pill', `${radiusSpec.pill}px`);
    el.style.setProperty('--ink-r', `${radiusSpec.card}px`);
  }
  return t;
}

/**
 * Apply a single-source Creator Voice (`engine/voices.js`) to a DOM element across colour surfaces,
 * WCAG-clamped accent cascade, typography, corner radius, quirk/medium datasets, and motion feel,
 * optionally syncing a live Three.js stage.
 */
export function applyVoice(el, voiceOrId = DEFAULT_VOICE, {
  stage = null,
  syncMotion = true,
  setSurfaces = true,
} = {}) {
  const v = resolveVoice(voiceOrId);
  const tokens = deriveAccentTokens(v.accent, {
    page: v.paper,
    card: v.card,
    ink: v.ink,
    tintNeutrals: v.tintNeutrals,
    type: v.typography,
    radius: v.radius,
  });
  if (el) {
    applyAccentTokens(el, tokens, {
      tintNeutrals: v.tintNeutrals,
      type: v.typography,
      radius: v.radius,
    });
    if (setSurfaces && el.style?.setProperty && tokens.neutrals) {
      el.style.setProperty('--page', tokens.neutrals.page);
      el.style.setProperty('--card', tokens.neutrals.card);
      el.style.setProperty('--strong', tokens.neutrals.strong);
      el.style.setProperty('--ink-line', tokens.neutrals.strong);
      el.style.setProperty('--board', tokens.neutrals.board);
    }
    if (el.dataset) {
      el.dataset.voice = v.id;
      el.dataset.quirk = v.quirk;
      el.dataset.medium = v.medium;
    }
    if (syncMotion) {
      applyMotionFeel(el, v.feel);
      if (el.dataset) el.dataset.feel = v.feel;
    }
  }
  if (stage) {
    stage.setQuirk?.(v.quirk, { syncMedium: false });
    stage.setMedium?.(v.medium);
    stage.setAccent?.(v.accent, { page: v.paper, card: v.card, ink: v.ink });
  }
  return { voice: v, tokens };
}

export function mountVoiceBar(anchorEl, {
  voices = VOICE_IDS,
  initialVoice = null,
  place = 'after',
  getStage = () => null,
  targetEl = null,
  onChange = null,
  setSurfaces = true,
} = {}) {
  if (!anchorEl || typeof document === 'undefined') return null;
  const list = (Array.isArray(voices) && voices.length ? voices : VOICE_IDS).map(id => resolveVoice(id));
  const host = targetEl || document.documentElement;
  let cur = resolveVoice(initialVoice || host?.dataset?.voice || getStage?.()?.voice || undefined).id;
  if (!list.some(v => v.id === cur)) cur = list[0]?.id || DEFAULT_VOICE;

  const bar = document.createElement('div');
  bar.className = 'mode voicebar';
  bar.setAttribute('role', 'group');
  bar.setAttribute('aria-label', 'Creator voice');
  bar.innerHTML = list.map(v => (
    `<button type="button" data-voice="${v.id}" aria-pressed="${v.id === cur}" title="${v.summary}">${v.shortLabel || v.label}</button>`
  )).join('');
  if (place === 'before') anchorEl.before(bar);
  else if (place === 'append') anchorEl.appendChild(bar);
  else anchorEl.after(bar);

  const apply = id => {
    const v = resolveVoice(id);
    cur = v.id;
    bar.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.voice === cur)));
    const S = getStage?.();
    const res = S?.setVoice
      ? (applyVoice(host, v.id, { stage: null, setSurfaces }), S.setVoice(v.id, { targetEl: host, setSurfaces }))
      : applyVoice(host, v.id, { stage: S, setSurfaces });
    onChange?.(v, res);
    return v;
  };
  bar.addEventListener('click', e => {
    const b = e.target.closest('[data-voice]');
    if (b) apply(b.dataset.voice);
  });
  return { el: bar, apply, get voice() { return cur; } };
}

export function mountSwatchBar(anchorEl, {
  swatches = ACCENT_SWATCHES,
  initial = 'coral',
  getStage = () => null,
  place = 'after',
  onChange = null,
  targetEl = null,
} = {}) {
  if (!anchorEl || typeof document === 'undefined') return null;
  const entries = Object.entries(swatches);
  let curKey = swatches[initial] ? initial : (entries.find(([, hex]) => hex.toLowerCase() === String(initial).toLowerCase())?.[0] || entries[0]?.[0] || 'coral');
  const bar = document.createElement('div');
  bar.className = 'swatchbar';
  bar.setAttribute('role', 'group');
  bar.setAttribute('aria-label', 'Brand accent colour');
  bar.innerHTML = `<span class="swatch-label">Try a colour</span>` + entries.map(([k, hex]) => {
    const label = k[0].toUpperCase() + k.slice(1);
    return `<button type="button" class="swatch-btn" data-swatch="${k}" data-hex="${hex}" aria-pressed="${k === curKey}" aria-label="Accent colour: ${label}" title="${label} (${hex})" style="--sw:${hex}"></button>`;
  }).join('');
  if (place === 'before') anchorEl.before(bar);
  else if (place === 'append') anchorEl.appendChild(bar);
  else anchorEl.after(bar);

  const apply = keyOrHex => {
    const found = entries.find(([k, h]) => k === keyOrHex || h.toLowerCase() === String(keyOrHex).toLowerCase());
    const [k, hex] = found || [String(keyOrHex), swatches[keyOrHex] || String(keyOrHex)];
    curKey = k;
    bar.querySelectorAll('button[data-swatch]').forEach(b => {
      b.setAttribute('aria-pressed', String(b.dataset.swatch === curKey || b.dataset.hex.toLowerCase() === hex.toLowerCase()));
    });
    const host = targetEl || document.documentElement;
    const tokens = applyAccentTokens(host, hex);
    const S = getStage?.();
    if (S?.setAccent) S.setAccent(hex);
    onChange?.(hex, tokens, curKey);
    return tokens;
  };
  apply(curKey);
  bar.addEventListener('click', e => {
    const b = e.target.closest('button[data-swatch]');
    if (b) apply(b.dataset.swatch);
  });
  return { el: bar, apply, get swatch() { return curKey; }, get hex() { return swatches[curKey] || curKey; } };
}

// Pure CSS token snippet builder combining WCAG-clamped accent cascades with @saxster/atlas draft & register tokens.
export function buildThemeCssSnippet({
  selector = ':root',
  accent = null,
  ink = '#18181a',
  surface = '#fbfbfa',
  page = '#f2f2ef',
  tintNeutrals = false,
  type = null,
  radius = null,
  motion = null,
  tokens = {},
} = {}) {
  const merged = { ...DRAFT_STANDARD.tokens, ...(tokens || {}) };
  const decls = [];
  if (ink) decls.push(`  --atlas-ink: ${String(ink).trim()};`);
  if (accent) {
    let derived = null;
    try {
      derived = deriveAccentTokens(accent, { page, card: surface, ink, tintNeutrals: !!tintNeutrals, type, radius });
    } catch {
      derived = null;
    }
    if (derived) {
      decls.push(
        `  --accent: ${derived.accent};`,
        `  --accent-mid: ${derived.accentMid};`,
        `  --accent-deep: ${derived.accentDeep};`,
        `  --accent-soft: ${derived.accentSoft};`,
        `  --accent-ink: ${derived.accentInk};`,
        `  --accent-on: ${derived.accentOn};`,
      );
      if (derived.tones) {
        decls.push(
          `  --accent-tone-40: ${derived.tones[40]};`,
          `  --accent-tone-90: ${derived.tones[90]};`,
        );
      }
      if (tintNeutrals && derived.neutrals) {
        decls.push(
          `  --page: ${derived.neutrals.page};`,
          `  --card: ${derived.neutrals.card};`,
          `  --strong: ${derived.neutrals.strong};`,
          `  --text: ${derived.neutrals.text};`,
          `  --faint: ${derived.neutrals.faint};`,
        );
      }
    } else {
      decls.push(`  --accent: ${String(accent).trim()};`);
    }
  }
  if (type && TYPOGRAPHY_PRESETS[type]) {
    decls.push(`  --display-font: ${TYPOGRAPHY_PRESETS[type].display};`);
  }
  if (radius) {
    const r = controlRadius(36, radius);
    decls.push(
      `  --atlas-r-ctl: ${r.control}px;`,
      `  --atlas-r-chip: ${r.chip}px;`,
      `  --atlas-r-card: ${r.card}px;`,
    );
  }
  if (motion) {
    decls.push(`  --atlas-motion: ${String(motion).trim()};`);
  }
  const tokenKeys = Object.keys(merged).filter(k => k.startsWith('--atlas-'));
  for (const k of tokenKeys) {
    const v = merged[k];
    if (v === undefined || v === null) continue;
    decls.push(`  ${k}: ${typeof v === 'number' ? Number(v.toFixed(4)) : String(v).trim()};`);
  }
  return `${selector} {\n${decls.join('\n')}\n}\n`;
}

const STUDIO_SLIDERS = [
  { key: '--atlas-stroke-primary', label: 'Primary stroke (px)', min: 0.5, max: 2.5, step: 0.1 },
  { key: '--atlas-opacity-secondary', label: 'Secondary opacity', min: 0.15, max: 0.80, step: 0.01 },
  { key: '--atlas-opacity-guide', label: 'Guide opacity', min: 0.05, max: 0.50, step: 0.01 },
  { key: '--atlas-opacity-hatch', label: 'Hatch opacity', min: 0.05, max: 0.50, step: 0.01 },
  { key: '--atlas-opacity-label', label: 'Label opacity', min: 0.55, max: 1.00, step: 0.01 },
];

const isValidCssColor = val => {
  const s = String(val || '').trim();
  if (!s) return false;
  if (typeof CSS !== 'undefined' && typeof CSS.supports === 'function') return CSS.supports('color', s);
  return /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(s);
};

/**
 * Interactive vanilla-DOM theme & drafting-token configurator with CSS.supports validation,
 * live host property updates, clipboard CSS snippet copy, and reset to defaults.
 */
export function mountThemeStudio(containerEl, {
  targetEl = null,
  initial = {},
  onChange = null,
} = {}) {
  if (!containerEl || typeof document === 'undefined') return null;

  const baseState = () => ({
    ink: initial.ink ?? '#18181a',
    accent: initial.accent ?? ACCENT_SWATCHES.coral,
    page: initial.page ?? '#f2efe7',
    surface: initial.surface ?? '#fffdf6',
    tintNeutrals: Boolean(initial.tintNeutrals),
    type: TYPOGRAPHY_PRESETS[initial.type] ? initial.type : 'editorial',
    radius: RADIUS_PRESETS.includes(initial.radius) ? initial.radius : 'soft',
    motion: ['spring', 'smooth', 'instant'].includes(initial.motion) ? initial.motion : 'spring',
    tokens: { ...DRAFT_STANDARD.tokens, ...(initial.tokens || {}) },
  });
  let state = baseState();

  const segGroup = (lbl, attr, opts) => (
    `<div class="studio-reg">` +
    `<span class="studio-lbl">${lbl}</span>` +
    `<div class="studio-seg" role="group" aria-label="${lbl}">` +
    opts.map(([val, text]) => `<button type="button" ${attr}="${val}" aria-pressed="false">${text}</button>`).join('') +
    `</div></div>`
  );

  const root = document.createElement('div');
  root.className = 'atlas-studio';
  root.innerHTML = [
    '<div class="studio-grid">',
    '  <div class="studio-field">',
    '    <label class="studio-lbl" for="studio-ink-input">Ink colour (CSS color)</label>',
    '    <input id="studio-ink-input" class="studio-text" type="text" data-studio-ink="" autocomplete="off" spellcheck="false">',
    '    <div class="studio-msg" data-studio-ink-msg="" aria-live="polite"></div>',
    '  </div>',
    '  <div class="studio-field">',
    '    <label class="studio-lbl" for="studio-accent-input">Accent hex</label>',
    '    <input id="studio-accent-input" class="studio-text" type="text" data-studio-accent="" autocomplete="off" spellcheck="false">',
    '    <div class="studio-msg" data-studio-accent-msg="" aria-live="polite"></div>',
    '  </div>',
    '</div>',
    '<div class="studio-registers">',
    segGroup('Neutrals', 'data-studio-tint', [['false', 'Pure'], ['true', 'Tinted']]),
    segGroup('Headlines', 'data-studio-type', [['editorial', 'Editorial'], ['clean', 'Clean'], ['technical', 'Technical']]),
    segGroup('Corners', 'data-studio-radius', [['sharp', 'Sharp'], ['soft', 'Soft'], ['round', 'Round']]),
    segGroup('Motion', 'data-studio-motion', [['spring', 'Spring'], ['smooth', 'Smooth'], ['instant', 'Instant']]),
    '</div>',
    '<div class="studio-sliders">',
    ...STUDIO_SLIDERS.map((s, idx) => (
      `<label class="studio-slider-row">` +
      `<span class="studio-lbl">${s.label}</span>` +
      `<input type="range" id="studio-sl-${idx}" data-studio-token="${s.key}" min="${s.min}" max="${s.max}" step="${s.step}" aria-label="${s.label}">` +
      `<output class="studio-val" for="studio-sl-${idx}" data-studio-out="${s.key}"></output>` +
      `</label>`
    )),
    '</div>',
    '<div class="studio-actions">',
    '  <button type="button" class="studio-btn primary" data-studio-copy="">Copy CSS</button>',
    '  <button type="button" class="studio-btn" data-studio-reset="">Reset</button>',
    '  <span class="studio-status" data-studio-status="" aria-live="polite"></span>',
    '</div>',
    '<textarea class="studio-css" data-studio-css="" readonly rows="10" aria-label="Generated theme CSS"></textarea>',
  ].join('\n');

  containerEl.appendChild(root);

  const inkIn = root.querySelector('[data-studio-ink]');
  const inkMsg = root.querySelector('[data-studio-ink-msg]');
  const accIn = root.querySelector('[data-studio-accent]');
  const accMsg = root.querySelector('[data-studio-accent-msg]');
  const cssArea = root.querySelector('[data-studio-css]');
  const copyBtn = root.querySelector('[data-studio-copy]');
  const resetBtn = root.querySelector('[data-studio-reset]');
  const statusEl = root.querySelector('[data-studio-status]');

  const hostEl = () => targetEl || document.documentElement;

  const syncHostAndCss = () => {
    const h = hostEl();
    if (h?.style?.setProperty) {
      h.style.setProperty('--atlas-ink', state.ink);
      for (const s of STUDIO_SLIDERS) {
        h.style.setProperty(s.key, String(state.tokens[s.key]));
      }
      if (isValidCssColor(state.accent)) {
        try {
          applyAccentTokens(h, state.accent, {
            page: state.page,
            card: state.surface,
            ink: state.ink,
            tintNeutrals: state.tintNeutrals,
            type: state.type,
            radius: state.radius,
          });
        } catch {}
      }
      if (h.dataset) h.dataset.motion = state.motion;
    }
    const snippet = buildThemeCssSnippet(state);
    cssArea.value = snippet;
    onChange?.({ ...state, tokens: { ...state.tokens }, css: snippet });
  };

  const syncControlsFromState = () => {
    inkIn.value = state.ink;
    inkIn.removeAttribute('aria-invalid');
    inkMsg.textContent = '';
    accIn.value = state.accent;
    accIn.removeAttribute('aria-invalid');
    accMsg.textContent = '';
    for (const s of STUDIO_SLIDERS) {
      const sl = root.querySelector(`input[data-studio-token="${s.key}"]`);
      const out = root.querySelector(`output[data-studio-out="${s.key}"]`);
      const v = state.tokens[s.key];
      if (sl) sl.value = String(v);
      if (out) out.textContent = Number(v).toFixed(2);
    }
    root.querySelectorAll('[data-studio-tint]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.studioTint === String(state.tintNeutrals))));
    root.querySelectorAll('[data-studio-type]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.studioType === state.type)));
    root.querySelectorAll('[data-studio-radius]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.studioRadius === state.radius)));
    root.querySelectorAll('[data-studio-motion]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.studioMotion === state.motion)));
  };

  const onInkInput = () => {
    const raw = inkIn.value.trim();
    if (!isValidCssColor(raw)) {
      inkIn.setAttribute('aria-invalid', 'true');
      inkMsg.textContent = 'Enter a valid CSS colour (e.g. #18181a or oklch(24% 0.02 250)).';
      return;
    }
    inkIn.removeAttribute('aria-invalid');
    inkMsg.textContent = '';
    state.ink = raw;
    syncHostAndCss();
  };

  const onAccInput = () => {
    const raw = accIn.value.trim();
    const candidate = ACCENT_SWATCHES[raw.toLowerCase()] || raw;
    let ok = true;
    try { parseColor(candidate); } catch { ok = false; }
    if (!ok) {
      accIn.setAttribute('aria-invalid', 'true');
      accMsg.textContent = 'Enter a swatch key or valid hex/rgb colour.';
      return;
    }
    accIn.removeAttribute('aria-invalid');
    accMsg.textContent = '';
    state.accent = candidate;
    syncHostAndCss();
  };

  const onSliderInput = e => {
    const sl = e.target.closest?.('input[data-studio-token]');
    if (!sl) return;
    const key = sl.dataset.studioToken;
    const val = Number(sl.value);
    if (!Number.isFinite(val)) return;
    state.tokens[key] = val;
    const out = root.querySelector(`output[data-studio-out="${key}"]`);
    if (out) out.textContent = val.toFixed(2);
    syncHostAndCss();
  };

  const onRegClick = e => {
    const tBtn = e.target.closest?.('[data-studio-tint]');
    if (tBtn) { state.tintNeutrals = tBtn.dataset.studioTint === 'true'; syncControlsFromState(); syncHostAndCss(); return; }
    const tyBtn = e.target.closest?.('[data-studio-type]');
    if (tyBtn && TYPOGRAPHY_PRESETS[tyBtn.dataset.studioType]) { state.type = tyBtn.dataset.studioType; syncControlsFromState(); syncHostAndCss(); return; }
    const rBtn = e.target.closest?.('[data-studio-radius]');
    if (rBtn && RADIUS_PRESETS.includes(rBtn.dataset.studioRadius)) { state.radius = rBtn.dataset.studioRadius; syncControlsFromState(); syncHostAndCss(); return; }
    const mBtn = e.target.closest?.('[data-studio-motion]');
    if (mBtn && ['spring', 'smooth', 'instant'].includes(mBtn.dataset.studioMotion)) { state.motion = mBtn.dataset.studioMotion; syncControlsFromState(); syncHostAndCss(); }
  };

  const onCopy = async () => {
    const text = cssArea.value;
    let ok = false;
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        ok = true;
      } catch {}
    }
    if (!ok) {
      try {
        cssArea.focus();
        cssArea.select();
        ok = !!document.execCommand?.('copy');
      } catch {}
    }
    statusEl.textContent = ok ? 'Copied CSS tokens' : 'Select CSS snippet above to copy';
  };

  const onReset = () => {
    state = baseState();
    syncControlsFromState();
    syncHostAndCss();
    statusEl.textContent = 'Reset to defaults';
  };

  inkIn.addEventListener('input', onInkInput);
  accIn.addEventListener('input', onAccInput);
  root.addEventListener('input', onSliderInput);
  root.addEventListener('click', onRegClick);
  copyBtn.addEventListener('click', onCopy);
  resetBtn.addEventListener('click', onReset);

  syncControlsFromState();
  syncHostAndCss();

  return {
    el: root,
    getConfig() {
      return { ...state, tokens: { ...state.tokens }, css: cssArea.value };
    },
    setAccent(hexOrKey) {
      const resolved = ACCENT_SWATCHES[String(hexOrKey || '').toLowerCase()] || String(hexOrKey || '');
      if (!resolved) return;
      state.accent = resolved;
      accIn.value = resolved;
      accIn.removeAttribute('aria-invalid');
      accMsg.textContent = '';
      syncHostAndCss();
    },
    setTintNeutrals(flag) {
      state.tintNeutrals = Boolean(flag);
      syncControlsFromState();
      syncHostAndCss();
    },
    setType(type) {
      if (!TYPOGRAPHY_PRESETS[type]) return;
      state.type = type;
      syncControlsFromState();
      syncHostAndCss();
    },
    setRadius(radius) {
      if (!RADIUS_PRESETS.includes(radius)) return;
      state.radius = radius;
      syncControlsFromState();
      syncHostAndCss();
    },
    setMotion(motion) {
      if (!['spring', 'smooth', 'instant'].includes(motion)) return;
      state.motion = motion;
      syncControlsFromState();
      syncHostAndCss();
    },
    reset: onReset,
    destroy() {
      inkIn.removeEventListener('input', onInkInput);
      accIn.removeEventListener('input', onAccInput);
      root.removeEventListener('input', onSliderInput);
      root.removeEventListener('click', onRegClick);
      copyBtn.removeEventListener('click', onCopy);
      resetBtn.removeEventListener('click', onReset);
      root.remove();
    },
  };
}


