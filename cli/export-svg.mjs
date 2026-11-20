// Safe, deterministic static SVG exporter with theme & draft-token resolution,
// strict XSS/style hygiene validation, ID prefixing, ARIA normalization, and optional WOFF2 embedding.
import fs from 'node:fs';
import {
  parseSvgXml,
  serializeSvg,
  parseInlineStyle,
  formatInlineStyle,
  walkSvg,
} from './svg-xml.mjs';
import { DRAFT_STANDARD } from '../engine/draft_standard.js';

export const EXPORT_THEMES = Object.freeze({
  light: Object.freeze({
    bg: '#fbfbfa',
    surface: '#f2f2ef',
    ink: '#18181a',
    strong: '#18181a',
    accent: '#26262a',
    ...DRAFT_STANDARD.tokens,
  }),
  dark: Object.freeze({
    bg: '#121917',
    surface: '#18211e',
    ink: '#eef3f0',
    strong: '#eef3f0',
    accent: '#6ec4a8',
    ...DRAFT_STANDARD.tokens,
  }),
  atelier: Object.freeze({
    bg: '#f2efe7',
    surface: '#fffdf6',
    ink: '#231e16',
    strong: '#231e16',
    accent: '#ef6a4c',
    ...DRAFT_STANDARD.tokens,
  }),
});

const FORBIDDEN_TAGS = new Set([
  'script',
  'foreignobject',
  'animate',
  'animatetransform',
  'animatemotion',
  'set',
]);

const DASHED_ROLES = new Set(['hidden', 'absent', 'proposed', 'centerline', 'transfer']);

const ALLOWED_INLINE_PROPS = new Set([
  'mask-type',
  'stroke',
  'stroke-width',
  'stroke-dasharray',
  'stroke-dashoffset',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-miterlimit',
  'stroke-opacity',
  'fill',
  'fill-opacity',
  'fill-rule',
  'clip-rule',
  'opacity',
  'font-family',
  'font-size',
  'font-weight',
  'font-style',
  'letter-spacing',
  'text-anchor',
  'dominant-baseline',
  'alignment-baseline',
  'vector-effect',
  'display',
  'visibility',
  'mix-blend-mode',
  'color',
]);

const COLOR_ATTRS = ['stroke', 'fill', 'color', 'stop-color', 'flood-color', 'lighting-color'];
const PRESENTATION_ATTRS = [
  ...COLOR_ATTRS,
  'stroke-width',
  'stroke-opacity',
  'fill-opacity',
  'opacity',
  'stroke-dasharray',
];

function fmtNum(v) {
  return Number.isInteger(v) ? String(v) : String(Number(v));
}

function buildTokenMap(themeNameOrObj, extraTokens) {
  const base = typeof themeNameOrObj === 'string'
    ? EXPORT_THEMES[themeNameOrObj]
    : themeNameOrObj;
  if (!base) {
    throw new RangeError(`Unknown export theme "${themeNameOrObj}". Expected one of: ${Object.keys(EXPORT_THEMES).join(', ')}`);
  }
  const merged = {
    ...DRAFT_STANDARD.tokens,
    ...base,
    ...(extraTokens || {}),
  };
  merged['--atlas-ink'] = merged['--atlas-ink'] || merged.ink;
  merged['--ink'] = merged['--ink'] || merged.ink;
  merged['--strong'] = merged['--strong'] || merged.strong || merged.ink;
  merged['--sheet'] = merged['--sheet'] || merged.surface || merged.bg;
  merged['--page'] = merged['--page'] || merged.bg;
  merged['--accent'] = merged['--accent'] || merged.accent;
  return merged;
}

function resolveCssVars(value, tokenMap, inkColor) {
  let out = String(value ?? '');
  for (let pass = 0; pass < 4; pass++) {
    const next = out.replace(/var\(\s*(--[A-Za-z0-9_-]+)\s*(?:,\s*([^)]+))?\)/g, (m, varName, fallback) => {
      if (varName in tokenMap && tokenMap[varName] !== undefined) {
        const rep = String(tokenMap[varName]).trim();
        return rep.toLowerCase() === 'currentcolor' ? inkColor : rep;
      }
      if (fallback !== undefined) return fallback.trim();
      return m;
    });
    if (next === out) break;
    out = next;
  }
  return out.replace(/\bcurrentColor\b/gi, inkColor);
}

function assertSafeHrefOrUrl(value, contextLabel) {
  const v = String(value || '').trim();
  if (!v) return;
  if (/^(https?:|javascript:|vbscript:|data:|\/\/)/i.test(v)) {
    throw new Error(`Unsafe external/script URL "${v}" in ${contextLabel}`);
  }
  for (const m of v.matchAll(/url\(\s*(['"]?)([^)"']+)\1\s*\)/gi)) {
    const inner = m[2].trim();
    if (!inner.startsWith('#')) {
      throw new Error(`Non-local url("${inner}") disallowed in ${contextLabel}`);
    }
  }
}

function validateSafeAst(doc) {
  walkSvg(doc, el => {
    const tag = el.tag.toLowerCase();
    if (FORBIDDEN_TAGS.has(tag)) {
      throw new Error(`Disallowed <${el.tag}> element in exported SVG.`);
    }
    if (tag === 'style' && el.attrs?.['data-atlas-draft-styles'] !== 'true') {
      throw new Error('Arbitrary <style> blocks are disallowed in static SVG export (only data-atlas-draft-styles="true" is permitted).');
    }
    for (const [k, v] of Object.entries(el.attrs || {})) {
      if (/^on[a-z]/i.test(k)) {
        throw new Error(`Disallowed event handler attribute "${k}" on <${el.tag}>.`);
      }
      if (k === 'href' || k === 'xlink:href' || k === 'src') {
        assertSafeHrefOrUrl(v, `<${el.tag} ${k}>`);
      } else if (typeof v === 'string' && v.includes('url(')) {
        assertSafeHrefOrUrl(v, `<${el.tag} ${k}>`);
      }
    }
    if (el.attrs?.style) {
      const styleMap = parseInlineStyle(el.attrs.style);
      for (const [prop, val] of Object.entries(styleMap)) {
        if (!prop.startsWith('--') && !ALLOWED_INLINE_PROPS.has(prop)) {
          throw new Error(`Disallowed inline CSS property "${prop}" on <${el.tag}>.`);
        }
        if (val.includes('url(')) assertSafeHrefOrUrl(val, `<${el.tag} style="${prop}">`);
      }
    }
  });
}

function resolveAttrIfUnset(el, attr, value) {
  const styleMap = parseInlineStyle(el.attrs?.style);
  if (attr in styleMap || (el.attrs && attr in el.attrs)) return;
  el.attrs[attr] = value;
}

function bakeDraftAttributes(doc, tokenMap, compactMode, compactDash) {
  const ink = tokenMap['--atlas-ink'] || tokenMap.ink;
  walkSvg(doc, (el, ancestors) => {
    // Capture inherited and own custom property overrides before stripping runtime styles
    const localTokens = { ...tokenMap };
    for (const anc of ancestors) {
      for (const [k, v] of Object.entries(parseInlineStyle(anc.attrs?.style))) {
        if (k.startsWith('--')) localTokens[k] = v;
      }
    }
    const styleMap = parseInlineStyle(el.attrs?.style);
    for (const [k, v] of Object.entries(styleMap)) {
      if (k.startsWith('--')) localTokens[k] = v;
    }

    const roleName = el.attrs?.['data-draft-role'];
    if (roleName && roleName in DRAFT_STANDARD.roles) {
      const role = DRAFT_STANDARD.roles[roleName];
      const sw = localTokens[role.width] ?? DRAFT_STANDARD.tokens[role.width];
      const op = localTokens[role.opacity] ?? DRAFT_STANDARD.tokens[role.opacity];
      const dash = (compactMode && DASHED_ROLES.has(roleName))
        ? compactDash
        : role.dash;
      resolveAttrIfUnset(el, 'stroke-width', fmtNum(sw));
      resolveAttrIfUnset(el, 'opacity', fmtNum(op));
      if (compactMode && DASHED_ROLES.has(roleName)) {
        el.attrs['stroke-dasharray'] = dash;
      } else {
        resolveAttrIfUnset(el, 'stroke-dasharray', dash);
      }
    }

    if (el.attrs?.['data-draft-fill'] === 'highlight') {
      resolveAttrIfUnset(el, 'fill', ink);
      resolveAttrIfUnset(el, 'fill-opacity', fmtNum(localTokens['--atlas-opacity-highlight'] ?? 0.06));
      resolveAttrIfUnset(el, 'stroke', 'none');
    }

    const textKind = el.attrs?.['data-draft-text'];
    if (textKind === 'label' || textKind === 'note') {
      const tokName = textKind === 'note' ? '--atlas-opacity-note' : '--atlas-opacity-label';
      resolveAttrIfUnset(el, 'fill', ink);
      resolveAttrIfUnset(el, 'fill-opacity', fmtNum(localTokens[tokName] ?? (textKind === 'note' ? 0.66 : 0.82)));
      resolveAttrIfUnset(el, 'stroke', 'none');
      resolveAttrIfUnset(el, 'font-weight', '400');
    }

    // Resolve var(...) and currentColor across presentation attributes
    for (const attr of PRESENTATION_ATTRS) {
      if (attr in (el.attrs || {})) {
        el.attrs[attr] = resolveCssVars(el.attrs[attr], localTokens, ink);
      }
    }

    // Resolve var(...) and currentColor in inline styles (and drop custom `--*` CSS properties once resolved)
    if (el.attrs?.style) {
      const nextStyle = {};
      for (const [k, v] of Object.entries(styleMap)) {
        if (k.startsWith('--')) continue;
        nextStyle[k] = resolveCssVars(v, localTokens, ink);
      }
      const serialized = formatInlineStyle(nextStyle);
      if (serialized) el.attrs.style = serialized;
      else delete el.attrs.style;
    }
  });
}

function stripRuntimeDraftStyles(node) {
  if (!node.children) return;
  node.children = node.children.filter(child => {
    if (child.type === 'element' && child.tag.toLowerCase() === 'style' && child.attrs?.['data-atlas-draft-styles'] === 'true') {
      return false;
    }
    stripRuntimeDraftStyles(child);
    return true;
  });
}

function findDirectChild(parent, tagName) {
  return (parent.children || []).find(c => c.type === 'element' && c.tag.toLowerCase() === tagName);
}

function normalizeAccessibility(root, { title, desc }) {
  root.attrs = root.attrs || {};
  if (!root.attrs.xmlns) root.attrs.xmlns = 'http://www.w3.org/2000/svg';
  root.attrs.role = 'img';

  let titleEl = findDirectChild(root, 'title');
  if (!titleEl) {
    titleEl = {
      type: 'element',
      tag: 'title',
      attrs: { id: 'draft-title' },
      children: [{ type: 'text', value: title || 'Technical diagram' }],
    };
    root.children.unshift(titleEl);
  } else {
    titleEl.attrs = titleEl.attrs || {};
    if (!titleEl.attrs.id) titleEl.attrs.id = 'draft-title';
    if (title !== undefined) titleEl.children = [{ type: 'text', value: String(title) }];
  }

  let descEl = findDirectChild(root, 'desc');
  if (desc !== undefined) {
    if (!descEl) {
      descEl = {
        type: 'element',
        tag: 'desc',
        attrs: { id: 'draft-desc' },
        children: [{ type: 'text', value: String(desc) }],
      };
      const tIdx = root.children.indexOf(titleEl);
      root.children.splice(tIdx + 1, 0, descEl);
    } else {
      descEl.attrs = descEl.attrs || {};
      if (!descEl.attrs.id) descEl.attrs.id = 'draft-desc';
      descEl.children = [{ type: 'text', value: String(desc) }];
    }
  } else if (descEl) {
    descEl.attrs = descEl.attrs || {};
    if (!descEl.attrs.id) descEl.attrs.id = 'draft-desc';
  }

  root.attrs['aria-labelledby'] = titleEl.attrs.id;
  if (descEl) root.attrs['aria-describedby'] = descEl.attrs.id;
}

function applyIdPrefix(doc, prefix) {
  if (!prefix) return;
  const idMap = new Map();
  walkSvg(doc, el => {
    const id = el.attrs?.id;
    if (id && !idMap.has(id)) idMap.set(id, `${prefix}${id}`);
  });
  if (!idMap.size) return;

  const rewriteUrls = str => String(str).replace(/url\(\s*(['"]?)#([^)"'\s]+)\1\s*\)/gi, (m, q, id) => {
    const next = idMap.get(id);
    return next ? `url(#${next})` : m;
  });

  walkSvg(doc, el => {
    if (el.attrs?.id && idMap.has(el.attrs.id)) {
      el.attrs.id = idMap.get(el.attrs.id);
    }
    for (const [k, v] of Object.entries(el.attrs || {})) {
      if (k === 'id' || typeof v !== 'string') continue;
      if (k === 'href' || k === 'xlink:href') {
        if (v.startsWith('#') && idMap.has(v.slice(1))) el.attrs[k] = `#${idMap.get(v.slice(1))}`;
      } else if (k === 'aria-labelledby' || k === 'aria-describedby') {
        el.attrs[k] = v.trim().split(/\s+/).map(tok => idMap.get(tok) || tok).join(' ');
      } else if (v.includes('url(#')) {
        el.attrs[k] = rewriteUrls(v);
      }
    }
  });
}

function insertEmbeddedFont(root, fontPath) {
  if (!fontPath) return;
  const bytes = fs.readFileSync(fontPath);
  const b64 = bytes.toString('base64');
  let defs = findDirectChild(root, 'defs');
  if (!defs) {
    defs = { type: 'element', tag: 'defs', attrs: {}, children: [] };
    const insertAt = root.children.findIndex(c => c.type === 'element' && !['title', 'desc'].includes(c.tag.toLowerCase()));
    root.children.splice(insertAt < 0 ? root.children.length : insertAt, 0, defs);
  }
  defs.children.unshift({
    type: 'element',
    tag: 'style',
    attrs: { 'data-atlas-embedded-font': 'true' },
    children: [{
      type: 'text',
      value: `@font-face{font-family:'AtlasDraft';src:url(data:font/woff2;base64,${b64}) format('woff2');font-weight:400;font-style:normal;}`,
    }],
  });
}

function insertBackgroundRect(root, bgFill) {
  const vbParts = String(root.attrs?.viewBox || '0 0 560 440').trim().split(/[\s,]+/).map(Number);
  const [x, y, width, height] = vbParts.length === 4 && vbParts.every(Number.isFinite)
    ? vbParts
    : [0, 0, 560, 440];
  const rect = {
    type: 'element',
    tag: 'rect',
    attrs: {
      x: String(x),
      y: String(y),
      width: String(width),
      height: String(height),
      fill: bgFill,
      stroke: 'none',
      'data-export-bg': 'true',
    },
    children: [],
  };
  let insertAt = 0;
  for (let i = 0; i < root.children.length; i++) {
    const c = root.children[i];
    if (c.type === 'element' && ['title', 'desc', 'defs', 'metadata'].includes(c.tag.toLowerCase())) {
      insertAt = i + 1;
    }
  }
  root.children.splice(insertAt, 0, rect);
}

export function exportSvg(svgText, {
  theme = 'light',
  tokens = {},
  idPrefix = '',
  title = undefined,
  desc = undefined,
  embedFontPath = null,
  background = null,
} = {}) {
  const doc = parseSvgXml(svgText);
  const root = doc.root;
  if (!root || root.tag.toLowerCase() !== 'svg') {
    throw new Error('Root element must be <svg>.');
  }

  validateSafeAst(doc);

  const tokenMap = buildTokenMap(theme, tokens);
  const rootStyle = parseInlineStyle(root.attrs?.style);
  const compactMode = root.attrs?.['data-draft-compact'] === 'true';
  const compactDash = rootStyle['--atlas-compact-dash'] || tokenMap['--atlas-compact-dash'] || DRAFT_STANDARD.geometry.compact.dash;

  bakeDraftAttributes(doc, tokenMap, compactMode, compactDash);
  stripRuntimeDraftStyles(root);
  normalizeAccessibility(root, { title, desc });
  applyIdPrefix(doc, idPrefix);
  insertEmbeddedFont(root, embedFontPath);

  if (background !== null && background !== undefined && background !== 'none') {
    const bgFill = background === 'theme' ? tokenMap.bg : String(background);
    insertBackgroundRect(root, bgFill);
  }

  // Ensure root SVG stroke is concrete (resolved currentColor -> ink)
  if (!root.attrs.stroke || root.attrs.stroke === 'currentColor') {
    root.attrs.stroke = tokenMap.ink;
  }

  return {
    svg: serializeSvg(doc),
    theme: typeof theme === 'string' ? theme : 'custom',
    warnings: [],
  };
}

export function exportSvgCli(inputPath, opts = {}) {
  if (!inputPath) {
    console.error('atlas export-svg <in.svg> [--out <out.svg>] [--theme light|dark|atelier] [--id-prefix <p>] [--bg <hex|theme>] [--embed-font <woff2>]');
    return 2;
  }
  const src = fs.readFileSync(inputPath, 'utf8');
  const res = exportSvg(src, {
    theme: opts.theme || 'light',
    idPrefix: opts.idPrefix || '',
    background: opts.bg ?? null,
    embedFontPath: opts.embedFont || null,
  });
  if (opts.out) {
    fs.writeFileSync(opts.out, res.svg, 'utf8');
    console.log(`exported -> ${opts.out} (${res.theme})`);
  } else {
    process.stdout.write(res.svg);
  }
  return 0;
}
