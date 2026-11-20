// A host page's colours as a theme for createStage (see parts.js applyTheme), plus pure WCAG 2.x contrast helpers.
// Zero Node imports: tools/vendor.mjs bundles this file into offline Kym textbooks via esbuild.
import { DRAFT_STANDARD } from './draft_standard.js';
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

const toHex = ({ r, g, b }) => '#' + [r, g, b]
  .map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'))
  .join('');

const mixRgb = (a, b, t) => ({
  r: a.r + (b.r - a.r) * t,
  g: a.g + (b.g - a.g) * t,
  b: a.b + (b.b - a.b) * t,
  a: 1,
});

// Derive a 6-token perceptual & WCAG-clamped accent cascade from a single hex swatch.
// Ensures unbordered text/icon ink (--accent-ink) achieves >= 4.5:1 against page, card, and accentSoft,
// and solid badge foreground (--accent-on) achieves >= 4.5:1 against accent.
export function deriveAccentTokens(hex, {
  page = '#f2efe7',
  card = '#fffdf6',
  ink = '#231e16',
} = {}) {
  const raw = ACCENT_SWATCHES[String(hex || '').toLowerCase()] || hex || ACCENT_SWATCHES.coral;
  const base = parseColor(raw);
  const pg = parseColor(page);
  const cd = parseColor(card);
  const ik = parseColor(ink);

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

  return { accent, accentMid, accentDeep, accentSoft, accentInk, accentOn };
}

export function applyAccentTokens(el, tokensOrHex, surfaces = {}) {
  if (!el?.style?.setProperty) return null;
  const t = typeof tokensOrHex === 'string' ? deriveAccentTokens(tokensOrHex, surfaces) : tokensOrHex;
  if (!t) return null;
  el.style.setProperty('--accent', t.accent);
  el.style.setProperty('--accent-mid', t.accentMid);
  el.style.setProperty('--accent-deep', t.accentDeep);
  el.style.setProperty('--accent-soft', t.accentSoft);
  el.style.setProperty('--accent-ink', t.accentInk);
  el.style.setProperty('--accent-on', t.accentOn);
  return t;
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

// Pure CSS token snippet builder combining WCAG-clamped accent cascades with @saxster/atlas draft tokens.
export function buildThemeCssSnippet({
  selector = ':root',
  accent = null,
  ink = '#18181a',
  surface = '#fbfbfa',
  page = '#f2f2ef',
  tokens = {},
} = {}) {
  const merged = { ...DRAFT_STANDARD.tokens, ...(tokens || {}) };
  const decls = [];
  if (ink) decls.push(`  --atlas-ink: ${String(ink).trim()};`);
  if (accent) {
    let derived = null;
    try {
      derived = deriveAccentTokens(accent, { page, card: surface, ink });
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
    } else {
      decls.push(`  --accent: ${String(accent).trim()};`);
    }
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
    tokens: { ...DRAFT_STANDARD.tokens, ...(initial.tokens || {}) },
  });
  let state = baseState();

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
          applyAccentTokens(h, state.accent, { page: state.page, card: state.surface, ink: state.ink });
        } catch {}
      }
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
    reset: onReset,
    destroy() {
      inkIn.removeEventListener('input', onInkInput);
      accIn.removeEventListener('input', onAccInput);
      root.removeEventListener('input', onSliderInput);
      copyBtn.removeEventListener('click', onCopy);
      resetBtn.removeEventListener('click', onReset);
      root.remove();
    },
  };
}


