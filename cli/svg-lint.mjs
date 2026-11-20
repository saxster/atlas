// SVG structural & Plotter-orthographic drafting linter.
// Catches duplicate IDs, dangling #id refs, stroked text, upside-down rotated text,
// missing viewBox, and strict drafting violations (--strict-draft / --compact).
import fs from 'node:fs';
import { parseSvgXml, walkSvg, parseInlineStyle, extractLocalUrls } from './svg-xml.mjs';

const GEOMETRY_TAGS = new Set(['path', 'line', 'circle', 'rect', 'ellipse', 'polyline', 'polygon']);
const NON_RENDER_CONTAINERS = new Set(['defs', 'clippath', 'mask', 'pattern', 'marker', 'symbol']);
const REF_ATTRS = ['clip-path', 'mask', 'filter', 'fill', 'stroke', 'marker-start', 'marker-mid', 'marker-end'];
const HREF_ATTRS = ['href', 'xlink:href'];
const IDREF_LIST_ATTRS = ['aria-labelledby', 'aria-describedby'];

function ownProp(el, prop) {
  const style = parseInlineStyle(el.attrs?.style);
  if (prop in style) return style[prop];
  if (el.attrs && prop in el.attrs) return el.attrs[prop];
  return undefined;
}

function resolveProp(el, ancestors, prop) {
  const direct = ownProp(el, prop);
  if (direct !== undefined) return direct;
  for (let i = ancestors.length - 1; i >= 0; i--) {
    const v = ownProp(ancestors[i], prop);
    if (v !== undefined) return v;
  }
  return undefined;
}

function parseRotateSum(transformStr) {
  let sum = 0;
  for (const m of String(transformStr || '').matchAll(/\brotate\(\s*([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)/gi)) {
    const deg = Number(m[1]);
    if (Number.isFinite(deg)) sum += deg;
  }
  return sum;
}

function normalizeDeg(deg) {
  let a = ((deg % 360) + 360) % 360;
  if (a > 180) a -= 360;
  return a;
}

function parseCssNumber(val) {
  if (val === undefined || val === null) return null;
  const m = /^\s*([+-]?(?:\d+\.?\d*|\.\d+))\s*(?:px)?\s*$/i.exec(String(val));
  return m ? Number(m[1]) : null;
}

function textContent(node) {
  if (!node) return '';
  if (node.type === 'text' || node.type === 'cdata') return node.value || '';
  if (node.type === 'element' && node.tag.toLowerCase() !== 'title' && node.tag.toLowerCase() !== 'desc') {
    return (node.children || []).map(textContent).join('');
  }
  return '';
}

function hasEmbeddedDraftTextRule(doc) {
  let found = false;
  walkSvg(doc, el => {
    if (el.tag.toLowerCase() === 'style') {
      const css = (el.children || []).map(c => c.value || '').join('');
      if (el.attrs?.['data-atlas-draft-styles'] === 'true' || /data-draft-text/.test(css)) {
        found = true;
      }
    }
  });
  return found;
}

export function lintSvg(svgText, { strictDraft = false, compact = false, source = '<svg>' } = {}) {
  const findings = [];
  const push = (severity, rule, message, el = null) => {
    findings.push({
      severity,
      rule,
      message,
      source,
      tag: el?.tag || null,
      id: el?.attrs?.id || undefined,
      line: el?.line || undefined,
    });
  };

  let doc;
  try {
    doc = parseSvgXml(svgText);
  } catch (err) {
    push('error', 'xml-parse', err.message || 'Invalid SVG XML');
    return { ok: false, findings, summary: { errors: 1, warnings: 0, source } };
  }

  const root = doc.root;
  if (!root || root.tag.toLowerCase() !== 'svg') {
    push('error', 'missing-svg-root', 'Root element must be <svg>.', root);
    return { ok: false, findings, summary: { errors: 1, warnings: 0, source } };
  }
  if (!String(root.attrs?.viewBox || '').trim()) {
    push('error', 'missing-viewbox', 'Root <svg> is missing a viewBox attribute.', root);
  }

  const draftCssTextRule = hasEmbeddedDraftTextRule(doc);
  const idCounts = new Map();
  walkSvg(doc, el => {
    const id = el.attrs?.id;
    if (id !== undefined) {
      if (!String(id).trim()) {
        push('error', 'empty-id', `Empty id attribute on <${el.tag}>.`, el);
      } else {
        idCounts.set(id, (idCounts.get(id) || 0) + 1);
      }
    }
  });

  const seenDupes = new Set();
  walkSvg(doc, (el, ancestors) => {
    const tag = el.tag.toLowerCase();
    const id = el.attrs?.id;
    if (id && idCounts.get(id) > 1 && !seenDupes.has(id)) {
      seenDupes.add(id);
      push('error', 'duplicate-id', `Duplicate id "#${id}" (${idCounts.get(id)} occurrences).`, el);
    }

    // Dangling local #id references
    for (const attr of REF_ATTRS) {
      const val = el.attrs?.[attr];
      if (!val) continue;
      for (const refId of extractLocalUrls(val)) {
        if (!idCounts.has(refId)) {
          push('error', 'dangling-ref', `Attribute ${attr} references missing #${refId}.`, el);
        }
      }
    }
    if (el.attrs?.style) {
      for (const refId of extractLocalUrls(el.attrs.style)) {
        if (!idCounts.has(refId)) {
          push('error', 'dangling-ref', `Inline style references missing #${refId}.`, el);
        }
      }
    }
    for (const hAttr of HREF_ATTRS) {
      const hv = el.attrs?.[hAttr];
      if (hv && hv.startsWith('#')) {
        const refId = hv.slice(1);
        if (!idCounts.has(refId)) {
          push('error', 'dangling-ref', `Attribute ${hAttr} references missing #${refId}.`, el);
        }
      }
    }
    for (const aAttr of IDREF_LIST_ATTRS) {
      const av = el.attrs?.[aAttr];
      if (!av) continue;
      for (const tok of av.trim().split(/\s+/)) {
        if (tok && !idCounts.has(tok)) {
          push('error', 'dangling-ref', `Attribute ${aAttr} references missing #${tok}.`, el);
        }
      }
    }

    const inNonRender = ancestors.some(a => NON_RENDER_CONTAINERS.has(a.tag.toLowerCase()));

    // Stroked text check & upside-down rotated text check
    if (tag === 'text' || tag === 'tspan') {
      const ownStroke = ownProp(el, 'stroke');
      const resolvedStroke = resolveProp(el, ancestors, 'stroke');
      const hasDraftTextSuppression =
        draftCssTextRule &&
        (el.attrs?.['data-draft-text'] !== undefined ||
          ancestors.some(a => a.tag.toLowerCase() === 'text' && a.attrs?.['data-draft-text'] !== undefined));

      const effectiveStroke = ownStroke !== undefined
        ? ownStroke
        : (hasDraftTextSuppression ? 'none' : resolvedStroke);

      if (effectiveStroke && effectiveStroke.trim().toLowerCase() !== 'none') {
        push('error', 'stroked-text', `<${tag}> must not carry a stroke (got "${effectiveStroke}").`, el);
      }

      // Cumulative rotation around Z on text
      let deg = 0;
      for (const a of ancestors) deg += parseRotateSum(a.attrs?.transform);
      deg += parseRotateSum(el.attrs?.transform);
      const norm = normalizeDeg(deg);
      if (Math.abs(norm) > 90 + 1e-6) {
        push('error', 'upside-down-text', `<${tag}> is rotated ${norm.toFixed(1)}deg (upside-down text > 90deg).`, el);
      }
    }

    if (strictDraft) {
      if (tag === 'lineargradient' || tag === 'radialgradient' || tag === 'filter') {
        push('error', 'forbidden-effect', `<${el.tag}> is disallowed in strict orthographic drafting mode.`, el);
      }
      if (/\bskew[xy]\s*\(/i.test(el.attrs?.transform || '')) {
        push('error', 'forbidden-skew', `Skew transforms are disallowed on <${el.tag}>.`, el);
      }
      if (tag === 'text' || tag === 'tspan') {
        const fw = ownProp(el, 'font-weight');
        if (fw !== undefined) {
          const fwNum = parseCssNumber(fw);
          if (/bold/i.test(fw) || (fwNum !== null && fwNum > 500)) {
            push('error', 'forbidden-text-style', `Bold font-weight ("${fw}") disallowed on <${tag}>.`, el);
          }
        }
        const fs = ownProp(el, 'font-style');
        if (fs !== undefined && /italic|oblique/i.test(fs)) {
          push('error', 'forbidden-text-style', `Italic/oblique font-style ("${fs}") disallowed on <${tag}>.`, el);
        }
        const ls = ownProp(el, 'letter-spacing');
        if (ls !== undefined) {
          const lsNum = parseCssNumber(ls);
          if (ls !== 'normal' && (lsNum === null || Math.abs(lsNum) > 1e-6)) {
            push('error', 'forbidden-caps-spacing', `Non-zero letter-spacing ("${ls}") disallowed on <${tag}>.`, el);
          }
        }
        const tt = ownProp(el, 'text-transform');
        if (tt && /uppercase/i.test(tt)) {
          push('error', 'forbidden-caps-spacing', `Uppercase text-transform disallowed on <${tag}>.`, el);
        }
        if (tag === 'text') {
          const txt = textContent(el).trim();
          const letters = txt.match(/[A-Za-z]/g) || [];
          if (letters.length >= 4 && !/[a-z]/.test(txt)) {
            push('error', 'forbidden-caps-spacing', `All-caps prose label "${txt}" disallowed in orthographic draft.`, el);
          }
        }
        const fsz = parseCssNumber(ownProp(el, 'font-size'));
        if (fsz !== null && (fsz < 9 || fsz > 13)) {
          push('error', 'font-size-range', `<${tag}> font-size ${fsz}px outside orthographic range [9, 13].`, el);
        }
        const lop = parseCssNumber(ownProp(el, 'fill-opacity') ?? ownProp(el, 'opacity'));
        if (lop !== null && (lop < 0.55 || lop > 0.90)) {
          push('error', 'label-opacity-range', `<${tag}> opacity ${lop} outside WCAG-safe label range [0.55, 0.90].`, el);
        }
      }
      if (!inNonRender && GEOMETRY_TAGS.has(tag)) {
        const sw = parseCssNumber(ownProp(el, 'stroke-width'));
        if (sw !== null && Math.abs(sw - 1) > 1e-6) {
          push('error', 'stroke-width-drift', `<${el.tag}> stroke-width ${sw} differs from uniform 1px drafting weight.`, el);
        }
      }
    }

    if (compact) {
      if (!inNonRender && GEOMETRY_TAGS.has(tag)) {
        const stroke = resolveProp(el, ancestors, 'stroke');
        const ve = ownProp(el, 'vector-effect');
        if (stroke && stroke.trim().toLowerCase() !== 'none' && ve !== 'non-scaling-stroke') {
          push('error', 'compact-non-scaling-stroke', `Compact <${el.tag}> must set vector-effect="non-scaling-stroke".`, el);
        }
      }
      if (!inNonRender && tag === 'text') {
        push('warn', 'compact-text-present', 'Compact SVG still contains <text>; consider stripping annotations.', el);
      }
    }
  });

  const errors = findings.filter(f => f.severity === 'error').length;
  const warnings = findings.filter(f => f.severity === 'warn').length;
  return {
    ok: errors === 0,
    findings,
    summary: { errors, warnings, source },
  };
}

export function lintSvgCollection(items, opts = {}) {
  const reports = items.map(item => lintSvg(item.svg, { ...opts, source: item.source || '<svg>' }));
  const errors = reports.reduce((s, r) => s + r.summary.errors, 0);
  const warnings = reports.reduce((s, r) => s + r.summary.warnings, 0);
  return { ok: errors === 0, reports, summary: { files: reports.length, errors, warnings } };
}

export function svgLintCli(filePaths, opts = {}) {
  if (!filePaths.length) {
    console.error('atlas svg-lint <file...> [--strict-draft] [--compact] [--json]');
    return 2;
  }
  const items = filePaths.map(file => ({
    source: file,
    svg: fs.readFileSync(file, 'utf8'),
  }));
  const col = lintSvgCollection(items, opts);
  if (opts.json) {
    console.log(JSON.stringify(col, null, 2));
  } else {
    for (const r of col.reports) {
      if (r.ok && r.summary.warnings === 0) {
        console.log(`PASS  ${r.summary.source}`);
      } else {
        const tag = r.ok ? 'WARN' : 'FAIL';
        console.log(`${tag}  ${r.summary.source}: ${r.summary.errors} error(s), ${r.summary.warnings} warning(s)`);
        for (const f of r.findings) {
          console.log(`  [${f.severity}] ${f.rule}${f.line ? ` (line ${f.line})` : ''}: ${f.message}`);
        }
      }
    }
  }
  return col.ok ? 0 : 1;
}
