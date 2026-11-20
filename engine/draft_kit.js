// Pure 2D Orthographic Technical Drafting Kit for @saxster/atlas.
// Zero DOM globals (bindDraftIsolation safely no-ops outside browser), zero Node built-ins, zero Three.js imports.
// Implements Plotter-inspired flat drafting relationships:
//   - Tip-first dashed transfer arrows (solid open arrowhead always meets terminal dash)
//   - Witness-derived dimensions with analytical label clearance breaks
//   - Analytically clipped H1 (-45 deg) / H2 (+45 deg) diagonal hatching & S1 support ticks
//   - Even-odd inverse <clipPath> & luminance <mask> clearance (no opaque background patches)
//   - Coordinate-preserving compact-view derivation & non-boosting mark isolation wrappers
import { DRAFT_STANDARD, DRAFT_ROLE_CSS, HIGHLIGHT_OPACITY } from './draft_standard.js';

export { DRAFT_STANDARD, DRAFT_ROLE_CSS, HIGHLIGHT_OPACITY };

const esc = s => String(s ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const finite = (value, name) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`${name} must be a finite number.`);
  }
  return value;
};

const point = (value, name) => {
  if (!Array.isArray(value) || value.length !== 2) {
    throw new TypeError(`${name} must be an [x, y] point.`);
  }
  return [finite(value[0], `${name}[0]`), finite(value[1], `${name}[1]`)];
};

const nonnegative = (value, name) => {
  finite(value, name);
  if (value < 0) throw new RangeError(`${name} cannot be negative.`);
  return value;
};

const positive = (value, name) => {
  finite(value, name);
  if (value <= 0) throw new RangeError(`${name} must be positive.`);
  return value;
};

const num = v => String(Number(finite(v, 'Computed coordinate').toFixed(6)));
const coords = ([x, y]) => `${num(x)} ${num(y)}`;
const segment = (a, b) => `M${coords(a)}L${coords(b)}`;

/** Tip-first shaft and separate solid open arrowhead, in SVG user coordinates. */
export function draftArrow({ kind = 'line', from, to, legLength, angle } = {}) {
  if (kind !== 'line') {
    throw new RangeError('Only straight line arrows are supported by draftArrow.');
  }
  const start = point(from, 'from');
  const tip = point(to, 'to');
  const dx = tip[0] - start[0];
  const dy = tip[1] - start[1];
  const length = positive(Math.hypot(dx, dy), 'Arrow length');
  const ux = dx / length;
  const uy = dy / length;
  const leg = positive(legLength ?? DRAFT_STANDARD.geometry.arrow.legLength, 'legLength');
  const deg = positive(angle ?? DRAFT_STANDARD.geometry.arrow.angle, 'angle');
  if (deg >= 90) throw new RangeError('Arrow angle must be strictly less than 90 degrees.');
  const rad = (deg * Math.PI) / 180;
  const along = leg * Math.cos(rad);
  const across = leg * Math.sin(rad);
  const corners = [-1, 1].map(side => [
    tip[0] - along * ux + side * across * uy,
    tip[1] - along * uy - side * across * ux,
  ]);
  return {
    shaftD: segment(tip, start),
    headD: `M${coords(corners[0])}L${coords(tip)}L${coords(corners[1])}`,
    tip: [tip[0], tip[1]],
    start: [start[0], start[1]],
  };
}

/** Witness-derived x/y dimension with optional clearance break around label bounds. */
export function draftDimension({ axis, witnesses, position, extensions = { gap: 8, overshoot: 8 }, label }) {
  if (axis !== 'x' && axis !== 'y') {
    throw new RangeError('Dimension axis must be "x" or "y".');
  }
  if (!Array.isArray(witnesses) || witnesses.length !== 2) {
    throw new TypeError('A dimension needs two feature witnesses.');
  }
  const ends = witnesses.map((w, i) => point(w, `witnesses[${i}]`));
  const along = axis === 'x' ? 0 : 1;
  const across = 1 - along;
  const start = ends[0][along];
  const end = ends[1][along];
  if (start >= end) {
    throw new RangeError('Dimension witnesses must be in increasing axis order.');
  }
  finite(position, 'position');
  const gap = nonnegative(extensions?.gap ?? 8, 'extensions.gap');
  const overshoot = nonnegative(extensions?.overshoot ?? 8, 'extensions.overshoot');
  if (!label || typeof label.text !== 'string') {
    throw new TypeError('Dimension label text must be a string.');
  }
  const anchor = point(label.anchor, 'label.anchor');
  const onLine = val => (axis === 'x' ? [val, position] : [position, val]);

  const witnessD = ends.map(w => {
    const dist = position - w[across];
    if (Math.abs(dist) < gap || dist === 0) {
      throw new RangeError('A dimension line must leave room for its witness gap.');
    }
    const dir = Math.sign(dist);
    const a = [...w];
    const b = [...w];
    a[across] += dir * gap;
    b[across] = position + dir * overshoot;
    return segment(a, b);
  }).join(' ');

  let spans = [[start, end]];
  if (label.clearance) {
    const { x, y, width, height } = label.clearance;
    finite(x, 'label.clearance.x');
    finite(y, 'label.clearance.y');
    positive(width, 'label.clearance.width');
    positive(height, 'label.clearance.height');
    const low = [x, y];
    const high = [x + width, y + height];
    if (position >= low[across] && position <= high[across]) {
      const cutStart = Math.max(start, low[along]);
      const cutEnd = Math.min(end, high[along]);
      if (cutStart < cutEnd) {
        spans = [
          [start, cutStart],
          [cutEnd, end],
        ].filter(([a, b]) => a < b);
        if (!spans.length) {
          throw new RangeError('The label clearance consumes the dimension; move the label outside it.');
        }
      }
    }
  }

  const halfSlash = DRAFT_STANDARD.geometry.dimension.slashExtent / 2;
  const slashD = [onLine(start), onLine(end)]
    .map(([sx, sy]) => segment([sx - halfSlash, sy + halfSlash], [sx + halfSlash, sy - halfSlash]))
    .join(' ');

  return {
    witnessD,
    lineD: spans.map(([a, b]) => segment(onLine(a), onLine(b))).join(' '),
    slashD,
    label: { text: label.text, anchor },
  };
}

/** Analytically clipped diagonal hatching (H1: -45 deg, H2: +45 deg) inside a rectangle. */
export function draftHatch({ region, pattern = 'H1', phase = 0, pitch } = {}) {
  if (!region || region.kind !== 'rect') {
    throw new RangeError('Only rectangular hatch regions ({ kind: "rect", x, y, width, height }) are supported.');
  }
  if (pattern !== 'H1' && pattern !== 'H2') {
    throw new RangeError('Hatch pattern must be "H1" or "H2".');
  }
  const x = finite(region.x, 'region.x');
  const y = finite(region.y, 'region.y');
  const width = positive(region.width, 'region.width');
  const height = positive(region.height, 'region.height');
  finite(phase, 'phase');
  const step = positive(pitch ?? DRAFT_STANDARD.geometry.hatch.edgePitch, 'Hatch edge pitch');
  const offset = ((phase % step) + step) % step;
  const segments = [];
  const dParts = [];
  for (let intercept = offset; intercept < width + height; intercept += step) {
    const left = [Math.max(0, intercept - height), Math.min(height, intercept)];
    const right = [Math.min(width, intercept), Math.max(0, intercept - width)];
    if (left[0] === right[0] && left[1] === right[1]) continue;
    const tx = ([a, b]) => [
      Number((x + a).toFixed(6)),
      Number((y + (pattern === 'H1' ? b : height - b)).toFixed(6)),
    ];
    const p0 = tx(left);
    const p1 = tx(right);
    segments.push([p0, p1]);
    dParts.push(segment(p0, p1));
  }
  return { d: dParts.join(' '), segments };
}

/** One-sided S1 schematic fixed-support ticks along a wall or support line segment. */
export function draftSupportTicks({ from, to, extent, pitch, side = 1 } = {}) {
  const a = point(from, 'from');
  const b = point(to, 'to');
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = positive(Math.hypot(dx, dy), 'Support segment length');
  const ext = positive(extent ?? DRAFT_STANDARD.geometry.support.extent, 'extent');
  const step = positive(pitch ?? DRAFT_STANDARD.geometry.support.pitch, 'pitch');
  const s = side < 0 ? -1 : 1;
  const ux = dx / len;
  const uy = dy / len;
  const nx = -uy * s;
  const ny = ux * s;
  const parts = [];
  for (let dist = 0; dist <= len + 1e-6; dist += step) {
    const bx = a[0] + ux * dist;
    const by = a[1] + uy * dist;
    const tx = bx + (-ux + nx) * ext;
    const ty = by + (-uy + ny) * ext;
    parts.push(segment([bx, by], [tx, ty]));
  }
  return { d: parts.join(' '), count: parts.length };
}

/** Even-odd inverse clipPath so rear transparent linework clears a foreground silhouette without opaque fills. */
export function draftInverseClip(id, frontPathD, { vb = [0, 0, 560, 440] } = {}) {
  const cleanId = esc(id).replace(/[^a-zA-Z0-9_-]/g, '');
  if (!cleanId) throw new TypeError('draftInverseClip requires a non-empty id.');
  const [vx, vy, vw, vh] = vb;
  const d = `M${num(vx)} ${num(vy)}H${num(vx + vw)}V${num(vy + vh)}H${num(vx)}Z ${String(frontPathD || '').trim()}`;
  return {
    id: cleanId,
    defs: `<clipPath id="${cleanId}" clipPathUnits="userSpaceOnUse"><path clip-rule="evenodd" d="${d}" fill="currentColor" stroke="none"/></clipPath>`,
    clipAttr: `clip-path="url(#${cleanId})"`,
  };
}

/** Luminance mask knocking out coincident grid/guide segments behind foreground linework. */
export function draftClearanceMask(id, maskContent, { vb = [0, 0, 560, 440] } = {}) {
  const cleanId = esc(id).replace(/[^a-zA-Z0-9_-]/g, '');
  if (!cleanId) throw new TypeError('draftClearanceMask requires a non-empty id.');
  const [vx, vy, vw, vh] = vb;
  const defs = `<mask id="${cleanId}" maskUnits="userSpaceOnUse" x="${num(vx)}" y="${num(vy)}" width="${num(vw)}" height="${num(vh)}" style="mask-type:luminance"><rect x="${num(vx)}" y="${num(vy)}" width="${num(vw)}" height="${num(vh)}" fill="white" stroke="none"/>${maskContent || ''}</mask>`;
  return {
    id: cleanId,
    defs,
    maskAttr: `mask="url(#${cleanId})"`,
  };
}

/** Complete accessible 2D orthographic drafting SVG builder with embedded role styles and responsive LOD flag. */
export function draftSvg({
  id = 'draft',
  vb = [0, 0, 560, 440],
  title = 'Construction diagram',
  desc = '',
  unit = null,
  mode = 'geometric-construction',
  body = '',
  defs = '',
  embedStyles = true,
  responsiveLod = true,
  cls = 'draft-svg',
} = {}) {
  const cleanId = esc(id).replace(/[^a-zA-Z0-9_-]/g, '') || 'draft';
  if (!Array.isArray(vb) || vb.length !== 4) throw new TypeError('vb must be [x, y, width, height].');
  const [vx, vy, vw, vh] = [finite(vb[0], 'vb[0]'), finite(vb[1], 'vb[1]'), positive(vb[2], 'vb[2]'), positive(vb[3], 'vb[3]')];
  if (mode && !DRAFT_STANDARD.epistemicModes.includes(mode)) {
    throw new RangeError(`Unknown epistemic mode "${mode}". Expected one of: ${DRAFT_STANDARD.epistemicModes.join(', ')}`);
  }
  const titleId = `${cleanId}-title`;
  const descId = desc ? `${cleanId}-desc` : '';
  const aria = `aria-labelledby="${titleId}${descId ? ` ${descId}` : ''}"`;
  const unitAttr = unit !== null && unit !== undefined ? ` data-draft-unit="${num(positive(unit, 'unit'))}"` : '';
  const lodAttr = responsiveLod ? ' data-draft-lod="auto"' : '';
  const modeAttr = mode ? ` data-draft-mode="${esc(mode)}"` : '';
  const styleBlock = embedStyles ? `<style data-atlas-draft-styles="true">${DRAFT_ROLE_CSS}</style>` : '';
  const defsBlock = defs ? `<defs>${defs}</defs>` : '';
  const titleEl = `<title id="${titleId}">${esc(title)}</title>`;
  const descEl = desc ? `<desc id="${descId}">${esc(desc)}</desc>` : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" class="${esc(cls)}" viewBox="${num(vx)} ${num(vy)} ${num(vw)} ${num(vh)}" width="${num(vw)}" height="${num(vh)}" data-draft=""${modeAttr}${unitAttr}${lodAttr} fill="none" stroke="currentColor" role="img" ${aria}>${titleEl}${descEl}${styleBlock}${defsBlock}${body}</svg>`;
}

function stripTaggedElements(markup, shouldStrip) {
  let out = '';
  let i = 0;
  let skipDepth = 0;
  while (i < markup.length) {
    if (markup[i] !== '<') {
      if (skipDepth === 0) out += markup[i];
      i++;
      continue;
    }
    if (markup.startsWith('<!--', i)) {
      const end = markup.indexOf('-->', i + 4);
      const stop = end < 0 ? markup.length : end + 3;
      if (skipDepth === 0) out += markup.slice(i, stop);
      i = stop;
      continue;
    }
    const gt = markup.indexOf('>', i + 1);
    if (gt < 0) {
      if (skipDepth === 0) out += markup.slice(i);
      break;
    }
    const rawTag = markup.slice(i, gt + 1);
    const isClose = rawTag.startsWith('</');
    const isSelf = !isClose && rawTag.endsWith('/>');
    const tagMatch = /^<\/?([A-Za-z_][\w:.-]*)/.exec(rawTag);
    const tagName = tagMatch ? tagMatch[1].toLowerCase() : '';
    if (skipDepth > 0) {
      if (isClose) skipDepth--;
      else if (!isSelf && tagName) skipDepth++;
    } else if (!isClose && tagName && shouldStrip(tagName, rawTag)) {
      if (!isSelf) skipDepth = 1;
    } else {
      out += rawTag;
    }
    i = gt + 1;
  }
  return out;
}

/**
 * Derives a compact placement view from a full-scale SVG without rescaling geometry:
 * crops viewBox around cropBox + margin, removes unreadable text & secondary annotation roles,
 * enforces vector-effect="non-scaling-stroke", and adapts dash patterns to compact pixel scale.
 */
export function draftCompactSvg(svgMarkup, {
  cropBox,
  margin = DRAFT_STANDARD.geometry.compact.margin,
  dash = DRAFT_STANDARD.geometry.compact.dash,
  stripText = true,
  stripRoles = ['dimension', 'leader', 'grid'],
} = {}) {
  let src = String(svgMarkup || '');
  if (!/<svg\b/i.test(src)) throw new TypeError('draftCompactSvg expects SVG markup.');
  nonnegative(margin, 'margin');
  let x, y, width, height;
  if (Array.isArray(cropBox) && cropBox.length === 4) {
    [x, y, width, height] = cropBox.map((v, idx) => (idx < 2 ? finite(v, `cropBox[${idx}]`) : positive(v, `cropBox[${idx}]`)));
  } else if (cropBox && typeof cropBox === 'object') {
    x = finite(cropBox.x, 'cropBox.x');
    y = finite(cropBox.y, 'cropBox.y');
    width = positive(cropBox.width, 'cropBox.width');
    height = positive(cropBox.height, 'cropBox.height');
  } else {
    throw new TypeError('draftCompactSvg requires cropBox as [x, y, width, height] or { x, y, width, height }.');
  }

  const vx = x - margin;
  const vy = y - margin;
  const vw = width + margin * 2;
  const vh = height + margin * 2;
  const roleSet = new Set(stripRoles);

  src = stripTaggedElements(src, (tagName, rawTag) => {
    if (stripText && tagName === 'text') return true;
    const roleMatch = /\bdata-draft-role="([^"]+)"/.exec(rawTag);
    if (roleMatch && roleSet.has(roleMatch[1])) return true;
    return false;
  });

  const SHAPES = new Set(['path', 'line', 'circle', 'rect', 'ellipse', 'polyline', 'polygon']);
  const NON_RENDER = new Set(['defs', 'clippath', 'mask', 'pattern', 'marker', 'symbol']);
  const DASHED_ROLES = new Set(['hidden', 'absent', 'proposed', 'centerline', 'transfer']);
  let out = '';
  let i = 0;
  let nonRenderDepth = 0;
  while (i < src.length) {
    if (src[i] !== '<') { out += src[i++]; continue; }
    if (src.startsWith('<!--', i)) {
      const end = src.indexOf('-->', i + 4);
      const stop = end < 0 ? src.length : end + 3;
      out += src.slice(i, stop);
      i = stop;
      continue;
    }
    const gt = src.indexOf('>', i + 1);
    if (gt < 0) { out += src.slice(i); break; }
    let tag = src.slice(i, gt + 1);
    const isClose = tag.startsWith('</');
    const isSelf = !isClose && tag.endsWith('/>');
    const nameMatch = /^<\/?([A-Za-z_][\w:.-]*)/.exec(tag);
    const name = nameMatch ? nameMatch[1].toLowerCase() : '';

    if (NON_RENDER.has(name)) {
      if (isClose && nonRenderDepth > 0) nonRenderDepth--;
      else if (!isClose && !isSelf) nonRenderDepth++;
    } else if (!isClose && name === 'svg') {
      const vbStr = `${num(vx)} ${num(vy)} ${num(vw)} ${num(vh)}`;
      tag = /\bviewBox="[^"]*"/.test(tag)
        ? tag.replace(/\bviewBox="[^"]*"/, `viewBox="${vbStr}"`)
        : tag.replace(/>$/, ` viewBox="${vbStr}">`);
      tag = /\bwidth="[^"]*"/.test(tag) ? tag.replace(/\bwidth="[^"]*"/, `width="${num(vw)}"`) : tag;
      tag = /\bheight="[^"]*"/.test(tag) ? tag.replace(/\bheight="[^"]*"/, `height="${num(vh)}"`) : tag;
      if (!/\bdata-draft-compact=/.test(tag)) tag = tag.replace(/>$/, ' data-draft-compact="true">');
      if (/\bstyle="([^"]*)"/.test(tag)) {
        tag = tag.replace(/\bstyle="([^"]*)"/, (m, s) => {
          const clean = s.replace(/--atlas-compact-dash\s*:[^;]*;?/gi, '').trim();
          const sep = clean && !clean.endsWith(';') ? ';' : '';
          return `style="${clean}${sep}--atlas-compact-dash:${esc(dash)}"`;
        });
      } else {
        tag = tag.replace(/>$/, ` style="--atlas-compact-dash:${esc(dash)}">`);
      }
    } else if (!isClose && nonRenderDepth === 0) {
      if (/\bstroke-dasharray="([^"]+)"/.test(tag)) {
        tag = tag.replace(/\bstroke-dasharray="([^"]+)"/, (m, v) => (v === 'none' ? m : `stroke-dasharray="${dash}"`));
      } else {
        const rm = /\bdata-draft-role="([^"]+)"/.exec(tag);
        if (rm && DASHED_ROLES.has(rm[1])) {
          tag = tag.replace(isSelf ? /\s*\/>$/ : />$/, ` stroke-dasharray="${dash}"${isSelf ? '/>' : '>'}`);
        }
      }
      if (SHAPES.has(name) && !/\bvector-effect=/.test(tag) && !/\bstroke="none"/.test(tag)) {
        tag = tag.replace(isSelf ? /\s*\/>$/ : />$/, ` vector-effect="non-scaling-stroke"${isSelf ? '/>' : '>'}`);
      }
    }
    out += tag;
    i = gt + 1;
  }
  return out;
}

/** Wraps an SVG containing [data-draft-focus="true"] marks inside a non-boosting hover/focus/toggle isolation frame. */
export function draftIsolationWrap({
  id = 'grammar-item',
  title,
  caption = '',
  svg,
  buttonLabel = 'Isolate element',
} = {}) {
  const cleanId = esc(id).replace(/[^a-zA-Z0-9_-]/g, '') || 'grammar-item';
  const drawingId = `${cleanId}-drawing`;
  const instrId = `${cleanId}-instruction`;
  const aria = esc(caption ? `${title}. ${caption}` : title || cleanId);
  return `<figure class="draft-frame" id="${cleanId}">` +
    `<div class="draft-iso" id="${drawingId}" role="img" tabindex="0" aria-label="${aria}" aria-describedby="${instrId}">${svg}</div>` +
    `<figcaption class="draft-cap"><span>${esc(caption)}</span>` +
    `<button type="button" class="draft-iso-btn" data-draft-iso-btn="" aria-controls="${drawingId}" aria-pressed="false">${esc(buttonLabel)}</button>` +
    `</figcaption>` +
    `<p class="sr-only" id="${instrId}" hidden>Hover or focus to reveal the element. Use ${esc(buttonLabel)} to keep it isolated.</p>` +
    `</figure>`;
}

/** Delegates click toggles on [data-draft-iso-btn] inside `root` (safe no-op outside browser). */
export function bindDraftIsolation(root) {
  if (typeof document === 'undefined' || !root?.addEventListener) return () => {};
  const onClick = e => {
    const btn = e.target.closest?.('[data-draft-iso-btn]');
    if (!btn) return;
    const targetId = btn.getAttribute('aria-controls');
    const target = targetId ? (root.querySelector?.(`#${targetId}`) || document.getElementById(targetId)) : null;
    if (!target) return;
    const next = !target.hasAttribute('data-isolated');
    if (next) target.setAttribute('data-isolated', '');
    else target.removeAttribute('data-isolated');
    btn.setAttribute('aria-pressed', String(next));
  };
  root.addEventListener('click', onClick);
  return () => root.removeEventListener('click', onClick);
}
