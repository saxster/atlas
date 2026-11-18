// A host page's colours as a theme for createStage (see parts.js applyTheme), plus pure WCAG 2.x contrast helpers.
// Zero Node imports: tools/vendor.mjs bundles this file into offline Kym textbooks via esbuild.
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


