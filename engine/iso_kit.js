// Pure 2.5D Isometric Hand-Inked Vector Kit for @saxster/atlas.
// Zero DOM globals, zero Node built-ins, zero Three.js imports: runs identically in Node selftests,
// browser figures, Ligne-Claire comics, and single-file standalone HTML bundles.
//
// Design principles (duplicating & exceeding Colorfigures / ISO-GLOW):
//   1. True 30-degree isometric projection (cos 30 = sqrt(3)/2, sin 30 = 0.5) + plane-sheared typography matrices.
//   2. ViewBox-calibrated 3-stage hand-ink & blotch <filter> (feTurbulence -> feDisplacementMap -> grain + blot multiply),
//      scaled by resolveQuirk(quirk).wobble (0 in 'bland' -> zero <filter> markup).
//   3. Two-layer static/dynamic SVG split: static keylined bodies sit inside <g filter="url(#...-hand)"> (cached once);
//      60fps moving parts sit in sibling <g class="iso-dyn"> so attribute updates never thrash filter raster caches.
//   4. CSS-variable semantic fills (--accent, --accent-mid, --accent-deep, --accent-soft) + two-tier #231e16 carbon
//      keylines (0.48 outer silhouette / 0.18 interior crease) so swatch changes happen in 0ms with zero DOM rebuild.

export const COS30 = Math.sqrt(3) / 2;
export const SIN30 = 0.5;

const esc = s => String(s ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const f2 = n => (+Number(n || 0).toFixed(2));

const QUIRK_WOBBLE = {
  bland: 0,
  calm: 0,
  clinical: 0,
  atelier: 0.35,
  creative: 0.35,
  'slightly-quirky': 1.0,
  default: 1.0,
  playful: 1.28,
  wild: 1.45,
};

export function quirkWobble(quirk = 'slightly-quirky') {
  if (typeof quirk === 'number' && Number.isFinite(quirk)) return Math.max(0, Math.min(1.5, quirk * 1.5));
  const k = String(quirk || 'slightly-quirky').trim().toLowerCase();
  return QUIRK_WOBBLE[k] ?? 1.0;
}

// Semantic 3-tone fills (top, left-lit side, right-shaded side) driven by CSS custom properties.
export const ISO_TONES = {
  accent: ['var(--accent, #ef6a4c)', 'var(--accent-mid, #c95940)', 'var(--accent-deep, #9e3f2a)'],
  accentSoft: ['var(--accent-soft, #fce4df)', 'var(--accent, #ef6a4c)', 'var(--accent-mid, #c95940)'],
  paper: ['#fffdf6', '#f2efe7', '#e0d9ca'],
  cream: ['#faf6ec', '#ebe5d6', '#d8d0be'],
  stone: ['#e8e3d7', '#d6cfc0', '#bfb7a6'],
  wood: ['#d8a46f', '#bc8550', '#9c6838'],
  woodDark: ['#a87444', '#8b5b30', '#6e4522'],
  glass: ['#eef7f6', '#dcecec', '#c6dcde'],
  gold: ['#f6ca45', '#dfb028', '#ba8d18'],
  mint: ['#bfe6d2', '#8ec9ab', '#62a484'],
  emerald: ['#52b788', '#3aa57a', '#2b7a5a'],
  cobalt: ['#7b97d9', '#5a79c2', '#435c96'],
  charcoal: ['#3d3935', '#2d2a27', '#1d1b18'],
  ink: ['#2f2b26', '#231e16', '#171512'],
  amberGlow: ['#ffd166', '#f4a261', '#e76f51'],
};

export function resolveIsoTone(tone = 'paper') {
  if (Array.isArray(tone) && tone.length >= 3) return tone;
  return ISO_TONES[tone] || ISO_TONES.paper;
}

// 30-degree isometric projection: +x goes down-right, +y goes down-left, +z goes straight up.
export function isoPt(x, y, z = 0, origin = [80, 56], scale = 1) {
  const ox = origin[0] ?? 80, oy = origin[1] ?? 56;
  const sx = ox + (x - y) * COS30 * scale;
  const sy = oy + (x + y) * SIN30 * scale - z * scale;
  return [f2(sx), f2(sy)];
}

export function isoPath(pts3d, { closed = true, origin = [80, 56], scale = 1 } = {}) {
  if (!pts3d?.length) return '';
  const segs = pts3d.map((p, i) => {
    const [sx, sy] = p.length === 2 ? [f2(p[0]), f2(p[1])] : isoPt(p[0], p[1], p[2] || 0, origin, scale);
    return `${i === 0 ? 'M' : 'L'}${sx},${sy}`;
  });
  return segs.join(' ') + (closed ? ' Z' : '');
}

// Isometric text/glyph affine transform matrices.
// 'flatTop' matches Corner Café's sheared tabletop mono labels: matrix(1.2247 0 0 0.9815 tx ty).
export function isoTextTransform(plane = 'flatTop', x = 0, y = 0, z = 0, { origin = [80, 56], scale = 1 } = {}) {
  const [tx, ty] = isoPt(x, y, z, origin, scale);
  if (plane === 'top') {
    return `matrix(${f2(COS30)} ${f2(SIN30)} ${f2(-COS30)} ${f2(SIN30)} ${tx} ${ty})`;
  }
  if (plane === 'left') {
    return `matrix(${f2(COS30)} ${f2(SIN30)} 0 1 ${tx} ${ty})`;
  }
  if (plane === 'right') {
    return `matrix(${f2(COS30)} ${f2(-SIN30)} 0 1 ${tx} ${ty})`;
  }
  return `matrix(1.2247 0 0 0.9815 ${tx} ${ty})`;
}

// ViewBox-calibrated 3-stage fountain-pen wobble + paper grain + ink blotch <filter>.
export function inkFilterDefs(id, { vbW = 160, quirk = 'slightly-quirky', seed = 4 } = {}) {
  const wob = quirkWobble(quirk);
  if (wob <= 0) return '';
  const safeId = esc(id);
  const w = Math.max(40, Number(vbW) || 160);
  const warpFreq = +(26.3 / w).toFixed(4);
  const dispScale = +(0.0041 * w * Math.min(wob, 1.45)).toFixed(2);
  const grainFreq = +(20 * warpFreq).toFixed(4);
  const blotFreq = +(0.267 * warpFreq).toFixed(4);
  const s1 = (seed | 0) || 4;
  return `<filter id="${safeId}" x="-4%" y="-4%" width="108%" height="108%" color-interpolation-filters="sRGB">` +
    `<feTurbulence type="fractalNoise" baseFrequency="${warpFreq}" numOctaves="2" seed="${s1}" result="warp"/>` +
    `<feDisplacementMap in="SourceGraphic" in2="warp" scale="${dispScale}" xChannelSelector="R" yChannelSelector="G" result="wob"/>` +
    `<feTurbulence type="fractalNoise" baseFrequency="${grainFreq}" numOctaves="3" seed="${s1 + 7}" result="n1"/>` +
    `<feColorMatrix in="n1" type="matrix" values=".3 0 0 0 .84  .3 0 0 0 .84  .3 0 0 0 .84  0 0 0 0 1" result="grain"/>` +
    `<feTurbulence type="fractalNoise" baseFrequency="${blotFreq}" numOctaves="2" seed="${s1 + 3}" result="n2"/>` +
    `<feColorMatrix in="n2" type="matrix" values=".3 0 0 0 .85  .3 0 0 0 .85  .3 0 0 0 .85  0 0 0 0 1" result="blot"/>` +
    `<feBlend in="wob" in2="grain" mode="multiply" result="g1"/>` +
    `<feBlend in="g1" in2="blot" mode="multiply" result="g2"/>` +
    `<feComposite in="g2" in2="wob" operator="in"/>` +
    `</filter>`;
}

// Root isometric SVG builder with static filtered group + sibling 60fps dynamic group and >= 8-unit safe inset.
export function isoSvg({
  id = 'iso',
  vb = [0, 0, 168, 112],
  quirk = 'slightly-quirky',
  seed = 4,
  defs = '',
  staticBody = '',
  dynamicBody = '',
  label = 'Isometric figure',
  desc = '',
  cls = 'iso-svg',
} = {}) {
  const cleanId = esc(id).replace(/[^a-zA-Z0-9_-]/g, '');
  const [vx, vy, vw, vh] = vb;
  const fId = `${cleanId}-hand`;
  const filterXml = inkFilterDefs(fId, { vbW: vw, quirk, seed });
  const hasFilter = Boolean(filterXml);
  const titleId = `${cleanId}-title`;
  const descId = desc ? `${cleanId}-desc` : '';
  const aria = `aria-labelledby="${titleId}${descId ? ` ${descId}` : ''}"`;
  const defsBlock = (filterXml || defs) ? `<defs>${filterXml}${defs}</defs>` : '';
  const staticAttr = hasFilter ? ` class="iso-static" filter="url(#${fId})"` : ' class="iso-static"';
  const dynGroup = dynamicBody ? `<g class="iso-dyn" data-anim="${cleanId}">${dynamicBody}</g>` : '';
  return `<svg class="${esc(cls)}" viewBox="${vx} ${vy} ${vw} ${vh}" role="img" ${aria} data-margin="8">` +
    `<title id="${titleId}">${esc(label)}</title>` +
    (desc ? `<desc id="${descId}">${esc(desc)}</desc>` : '') +
    defsBlock +
    `<g${staticAttr}>${staticBody}</g>` +
    dynGroup +
    `</svg>`;
}

// ---------- 2.5D Keylined Isometric Primitives ----------

const INK = 'var(--ink, #231e16)';

export function isoClipShadow(clipId, plinthPts3d, shadowCircles = [], {
  origin = [84, 62], scale = 1, shadowFill = '#cfc8b8',
} = {}) {
  const cid = esc(clipId);
  const clipPath = `<clipPath id="${cid}"><path d="${isoPath(plinthPts3d, { origin, scale })}"/></clipPath>`;
  const blobs = shadowCircles.map(c => {
    const [cx, cy] = isoPt(c.x || 0, c.y || 0, c.z || 0, origin, scale);
    const rx = f2((c.rx ?? 14) * scale), ry = f2((c.ry ?? 8) * scale);
    return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${c.fill || shadowFill}" opacity="${c.opacity ?? 0.72}"/>`;
  }).join('');
  return {
    defs: clipPath,
    svg: `<g clip-path="url(#${cid})">${blobs}</g>`,
  };
}

export function isoBox({
  x = 0, y = 0, z = 0, dx = 24, dy = 24, dz = 16,
  tone = 'paper', origin = [84, 62], scale = 1,
  outerW = 0.48, innerW = 0.18, cls = '', attr = '',
} = {}) {
  const [topFill, leftFill, rightFill] = resolveIsoTone(tone);
  const p001 = isoPt(x, y, z + dz, origin, scale);
  const p101 = isoPt(x + dx, y, z + dz, origin, scale);
  const p111 = isoPt(x + dx, y + dy, z + dz, origin, scale);
  const p011 = isoPt(x, y + dy, z + dz, origin, scale);
  const p100 = isoPt(x + dx, y, z, origin, scale);
  const p110 = isoPt(x + dx, y + dy, z, origin, scale);
  const p010 = isoPt(x, y + dy, z, origin, scale);

  const topFace = `M${p001} L${p101} L${p111} L${p011} Z`;
  const rightFace = `M${p101} L${p100} L${p110} L${p111} Z`; // +x front-right face
  const leftFace = `M${p011} L${p111} L${p110} L${p010} Z`;  // +y front-left face
  const silhouette = `M${p001} L${p101} L${p100} L${p110} L${p010} L${p011} Z`;
  const creases = `M${p011} L${p111} L${p101} M${p111} L${p110}`;
  const cAttr = cls ? ` class="${esc(cls)}"` : '';
  const extra = attr ? ` ${attr}` : '';

  return `<g${cAttr}${extra}>` +
    `<path d="${leftFace}" fill="${leftFill}" stroke="none"/>` +
    `<path d="${rightFace}" fill="${rightFill}" stroke="none"/>` +
    `<path d="${topFace}" fill="${topFill}" stroke="none"/>` +
    `<path d="${creases}" fill="none" stroke="${INK}" stroke-width="${innerW}" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="${silhouette}" fill="none" stroke="${INK}" stroke-width="${outerW}" stroke-linecap="round" stroke-linejoin="round"/>` +
    `</g>`;
}

export function isoPlinth(opts = {}) {
  return isoBox({ x: -34, y: -34, z: -5, dx: 68, dy: 68, dz: 5, tone: 'stone', ...opts });
}

export function isoPrism({
  pts2d = [[-12, -12], [12, -12], [12, 12], [-12, 12]],
  z = 0, dz = 12, tone = 'paper', origin = [84, 62], scale = 1,
  outerW = 0.48, innerW = 0.18,
} = {}) {
  const [topFill, leftFill, rightFill] = resolveIsoTone(tone);
  const topPts = pts2d.map(([x, y]) => isoPt(x, y, z + dz, origin, scale));
  const botPts = pts2d.map(([x, y]) => isoPt(x, y, z, origin, scale));
  const walls = [];
  for (let i = 0; i < pts2d.length; i++) {
    const j = (i + 1) % pts2d.length;
    const aTop = topPts[i], bTop = topPts[j], bBot = botPts[j], aBot = botPts[i];
    // Front-facing walls have bTop.x < aTop.x or downward screen normal
    const fill = (i % 2 === 0) ? leftFill : rightFill;
    walls.push(`<path d="M${aTop} L${bTop} L${bBot} L${aBot} Z" fill="${fill}" stroke="${INK}" stroke-width="${innerW}" stroke-linejoin="round"/>`);
  }
  const topD = topPts.map((p, i) => `${i ? 'L' : 'M'}${p}`).join(' ') + ' Z';
  return `<g class="iso-prism">${walls.join('')}<path d="${topD}" fill="${topFill}" stroke="${INK}" stroke-width="${outerW}" stroke-linejoin="round"/></g>`;
}

// Isometric vertical cylinder (or tapered frustum with rTop != rBot) with elliptical caps and tangent silhouette.
export function isoCyl({
  x = 0, y = 0, z = 0, r = 12, rTop = r, h = 18,
  tone = 'paper', rimFill = null, origin = [84, 62], scale = 1,
  outerW = 0.48, innerW = 0.18, specular = false, cls = '', attr = '',
} = {}) {
  const [topFill, sideLight, sideDark] = resolveIsoTone(tone);
  const [cxBot, cyBot] = isoPt(x, y, z, origin, scale);
  const [cxTop, cyTop] = isoPt(x, y, z + h, origin, scale);
  const rxB = f2(r * COS30 * scale), ryB = f2(r * SIN30 * scale);
  const rxT = f2(rTop * COS30 * scale), ryT = f2(rTop * SIN30 * scale);

  const bodyD = `M${f2(cxTop - rxT)},${cyTop} L${f2(cxBot - rxB)},${cyBot} A${rxB},${ryB} 0 0 0 ${f2(cxBot + rxB)},${cyBot} L${f2(cxTop + rxT)},${cyTop} Z`;
  const shadeD = `M${cxTop},${f2(cyTop + ryT)} L${cxBot},${f2(cyBot + ryB)} A${rxB},${ryB} 0 0 0 ${f2(cxBot + rxB)},${cyBot} L${f2(cxTop + rxT)},${cyTop} Z`;
  const specSvg = specular
    ? `<path d="M${f2(cxTop - rxT * 0.52)},${f2(cyTop + ryT * 0.6)} L${f2(cxBot - rxB * 0.52)},${f2(cyBot + ryB * 0.4)}" stroke="#ffffff" stroke-width="${f2(Math.max(1.2, rxT * 0.16))}" stroke-linecap="round" opacity="0.62"/>`
    : '';
  const innerRim = rimFill
    ? `<ellipse cx="${cxTop}" cy="${cyTop}" rx="${f2(rxT * 0.82)}" ry="${f2(ryT * 0.82)}" fill="${rimFill}" stroke="${INK}" stroke-width="${innerW}"/>`
    : '';
  const cAttr = cls ? ` class="${esc(cls)}"` : '';
  const extra = attr ? ` ${attr}` : '';

  return `<g${cAttr}${extra}>` +
    `<path d="${bodyD}" fill="${sideLight}" stroke="none"/>` +
    `<path d="${shadeD}" fill="${sideDark}" stroke="none" opacity="0.65"/>` +
    specSvg +
    `<path d="${bodyD}" fill="none" stroke="${INK}" stroke-width="${outerW}" stroke-linejoin="round"/>` +
    `<ellipse cx="${cxTop}" cy="${cyTop}" rx="${rxT}" ry="${ryT}" fill="${topFill}" stroke="${INK}" stroke-width="${outerW}"/>` +
    innerRim +
    `</g>`;
}

// Dashed empty coaster slot vs active accent shadow disc.
export function isoDiscSlot({
  x = 0, y = 0, z = 0, r = 13, active = false, dashed = false,
  origin = [84, 62], scale = 1, label = '',
} = {}) {
  const [cx, cy] = isoPt(x, y, z, origin, scale);
  const rx = f2(r * COS30 * scale), ry = f2(r * SIN30 * scale);
  const fill = active ? 'var(--accent, #ef6a4c)' : (dashed ? 'var(--card, #fffdf6)' : '#e4dfd3');
  const dash = dashed && !active ? ' stroke-dasharray="2.4 2.4"' : '';
  const sw = active ? 0.52 : 0.36;
  const txt = label
    ? `<text transform="${isoTextTransform('flatTop', x, y + r * 1.35, z, { origin, scale })}" text-anchor="middle" font-family="var(--mono, ui-monospace, monospace)" font-size="6.5" font-weight="700" fill="${INK}">${esc(label)}</text>`
    : '';
  return `<g class="iso-slot${active ? ' is-active' : ''}">` +
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${INK}" stroke-width="${sw}"${dash}/>` +
    txt +
    `</g>`;
}

// Isometric coffee / demitasse cup on optional saucer with optional latte-art heart or takeaway lid.
export function isoCup({
  x = 0, y = 0, z = 0, sizeScale = 1, saucer = true, takeaway = false,
  active = false, filled = true, latteHeart = false, origin = [84, 62], scale = 1,
} = {}) {
  const s = scale * sizeScale;
  const discSvg = active
    ? `<ellipse cx="${isoPt(x, y, z, origin, scale)[0]}" cy="${f2(isoPt(x, y, z, origin, scale)[1] + 2)}" rx="${f2(15 * COS30 * s)}" ry="${f2(15 * SIN30 * s)}" fill="var(--accent, #ef6a4c)" opacity="0.32"/>`
    : '';
  const saucerSvg = saucer
    ? isoCyl({ x, y, z, r: 13.5, rTop: 14.5, h: 2.2, tone: active ? 'accent' : 'paper', origin, scale: s })
    : '';
  const cupZ = saucer ? z + 2.2 : z;
  const h = takeaway ? 19 * sizeScale : 11.5 * sizeScale;
  const rBot = 7.4, rTop = takeaway ? 9.6 : 9.8;
  const rim = filled ? (takeaway ? null : '#8c5327') : '#ebe5d6';
  const bodyTone = active && takeaway ? 'accent' : 'paper';
  const cupSvg = isoCyl({ x, y, z: cupZ, r: rBot, rTop, h, tone: bodyTone, rimFill: rim, origin, scale });
  const sleeveSvg = takeaway
    ? isoCyl({ x, y, z: cupZ + h * 0.28, r: 8.1, rTop: 8.9, h: h * 0.36, tone: active ? 'paper' : 'accent', origin, scale })
    : '';
  const lidSvg = takeaway
    ? isoCyl({ x, y, z: cupZ + h, r: rTop + 0.6, rTop: rTop - 0.8, h: 2.8, tone: 'paper', origin, scale })
    : '';
  const [tx, ty] = isoPt(x, y, cupZ + h, origin, scale);
  const heartSvg = latteHeart && filled && !takeaway
    ? `<path d="M${tx},${f2(ty + 1.4)} C${f2(tx - 2.6)},${f2(ty - 0.8)} ${f2(tx - 2.8)},${f2(ty - 2.6)} ${tx},${f2(ty - 1.1)} C${f2(tx + 2.8)},${f2(ty - 2.6)} ${f2(tx + 2.6)},${f2(ty - 0.8)} ${tx},${f2(ty + 1.4)} Z" fill="#fffdf6" stroke="${INK}" stroke-width="0.18"/>`
    : '';
  return `<g class="iso-cup">${discSvg}${saucerSvg}${cupSvg}${sleeveSvg}${lidSvg}${heartSvg}</g>`;
}

export function isoCoin({
  x = 0, y = 0, z = 0, r = 9.5, h = 2.6, tone = 'gold', origin = [84, 62], scale = 1,
} = {}) {
  return isoCyl({ x, y, z, r, rTop: r, h, tone, origin, scale, outerW: 0.42, innerW: 0.16 });
}

export function isoCoinStack({
  x = 0, y = 0, z = 0, count = 4, r = 9.5, discH = 2.6, gap = 0.2,
  tone = 'gold', origin = [84, 62], scale = 1,
} = {}) {
  const n = Math.max(0, Math.min(24, Math.round(count)));
  const shadow = `<ellipse cx="${isoPt(x, y, z, origin, scale)[0]}" cy="${f2(isoPt(x, y, z, origin, scale)[1] + 1.5)}" rx="${f2(r * 1.08 * COS30 * scale)}" ry="${f2(r * 1.08 * SIN30 * scale)}" fill="#cfc8b8" opacity="0.65"/>`;
  const discs = Array.from({ length: n }, (_, i) =>
    isoCoin({ x, y, z: z + i * (discH + gap), r, h: discH, tone, origin, scale })
  ).join('');
  return `<g class="iso-coin-stack" data-count="${n}">${shadow}${discs}</g>`;
}

// Glass apothecary/coffee jar with contents and hinged/lifting lid (lidLift in [0, 1]).
export function isoJar({
  x = 0, y = 0, z = 0, r = 10, h = 18, lidLift = 0, active = false,
  contentsTone = 'wood', label = '', origin = [84, 62], scale = 1,
} = {}) {
  const contents = isoCyl({ x, y, z: z + 1.2, r: r * 0.82, rTop: r * 0.82, h: h * 0.56, tone: contentsTone, origin, scale, outerW: 0.25 });
  const jar = isoCyl({ x, y, z, r, rTop: r, h, tone: 'glass', origin, scale, specular: true });
  const badge = label
    ? `<g transform="${isoTextTransform('flatTop', x, y + r * 0.85, z + h * 0.36, { origin, scale })}">` +
      `<rect x="-11" y="-4.5" width="22" height="8" rx="1.6" fill="${active ? 'var(--accent, #ef6a4c)' : '#fffdf6'}" stroke="${INK}" stroke-width="0.32"/>` +
      `<text x="0" y="1.4" text-anchor="middle" font-family="var(--mono, ui-monospace, monospace)" font-size="5.6" font-weight="800" fill="${active ? 'var(--accent-on, #fff)' : INK}">${esc(label)}</text></g>`
    : '';
  const liftZ = z + h + lidLift * 9;
  const lid = isoCyl({ x: x - lidLift * 2.5, y: y - lidLift * 1.5, z: liftZ, r: r * 0.96, rTop: r * 0.96, h: 3.2, tone: active ? 'accent' : 'wood', origin, scale });
  return `<g class="iso-jar${active ? ' is-active' : ''}">${contents}${jar}${badge}${lid}</g>`;
}

// Gabled milk / reagent carton with optional tilt angle.
export function isoCarton({
  x = 0, y = 0, z = 0, dx = 16, dy = 16, dz = 22, tilt = 0,
  active = false, label = 'OAT', origin = [84, 62], scale = 1,
} = {}) {
  const [cx, cy] = isoPt(x + dx / 2, y + dy / 2, z + dz / 2, origin, scale);
  const rot = tilt ? ` transform="rotate(${f2(tilt)} ${cx} ${cy})"` : '';
  const box = isoBox({ x, y, z, dx, dy, dz, tone: active ? 'accent' : 'paper', origin, scale });
  const roof = isoPrism({
    pts2d: [[x, y], [x + dx, y], [x + dx, y + dy], [x, y + dy]],
    z: z + dz, dz: 5.5, tone: active ? 'accentSoft' : 'cream', origin, scale,
  });
  const txt = `<text transform="${isoTextTransform('flatTop', x + dx * 0.5, y + dy * 0.95, z + dz * 0.45, { origin, scale })}" text-anchor="middle" font-family="var(--mono, ui-monospace, monospace)" font-size="5.8" font-weight="800" fill="${active ? 'var(--accent-on, #fff)' : INK}">${esc(label)}</text>`;
  return `<g class="iso-carton"${rot}>${box}${roof}${txt}</g>`;
}

// Café / conservation table with N pawns and N cups around the perimeter.
export function isoPawnTable({
  count = 3, maxCount = 6, origin = [84, 64], scale = 1,
} = {}) {
  const n = Math.max(1, Math.min(maxCount, Math.round(count)));
  const shadow = `<ellipse cx="${origin[0]}" cy="${f2(origin[1] + 10)}" rx="38" ry="20" fill="#41538f" opacity="0.28"/>`;
  const ped = isoCyl({ x: 0, y: 0, z: -12, r: 4.5, rTop: 3.5, h: 12, tone: 'charcoal', origin, scale });
  const top = isoCyl({ x: 0, y: 0, z: 0, r: 24, rTop: 24, h: 3.2, tone: 'wood', origin, scale });
  const pawnTones = ['accent', 'gold', 'emerald', 'cobalt', 'woodDark', 'mint'];
  const items = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + 0.4;
    const px = Math.cos(a) * 33, py = Math.sin(a) * 33;
    const cx = Math.cos(a) * 12.5, cy = Math.sin(a) * 12.5;
    const pt = pawnTones[i % pawnTones.length];
    items.push(
      isoCyl({ x: px, y: py, z: -10, r: 6.5, rTop: 3.2, h: 11, tone: pt, origin, scale }) +
      isoCyl({ x: px, y: py, z: 1, r: 4.2, rTop: 4.0, h: 4.5, tone: pt, origin, scale }) +
      isoCyl({ x: cx, y: cy, z: 3.2, r: 3.2, rTop: 3.6, h: 4.2, tone: 'paper', rimFill: '#8c5327', origin, scale })
    );
  }
  return `<g class="iso-pawn-table" data-count="${n}">${shadow}${ped}${top}${items.join('')}</g>`;
}

// Isometric rubber stamp + N-hole loyalty punch card.
export function isoStamp({ x = 18, y = -14, z = 8, press = 0, origin = [84, 62], scale = 1 } = {}) {
  const dz = z - press * 5.5;
  const base = isoBox({ x: x - 7, y: y - 7, z: dz, dx: 14, dy: 14, dz: 3.5, tone: 'stone', origin, scale });
  const pad = isoCyl({ x, y, z: dz + 3.5, r: 5, rTop: 3.5, h: 5, tone: 'accent', origin, scale });
  const knob = isoCyl({ x, y, z: dz + 8.5, r: 4.8, rTop: 4.8, h: 5.5, tone: 'accent', origin, scale });
  return `<g class="iso-stamp">${base}${pad}${knob}</g>`;
}

export function isoPunchCard({
  stamped = 7, total = 10, press = 0, origin = [78, 62], scale = 1,
} = {}) {
  const n = Math.max(1, Math.min(12, total));
  const k = Math.max(0, Math.min(n, stamped));
  const card = isoBox({ x: -34, y: -22, z: 0, dx: 68, dy: 44, dz: 2.6, tone: 'cream', origin, scale });
  const header = isoBox({ x: -30, y: -18, z: 2.6, dx: 22, dy: 36, dz: 0.6, tone: 'accent', origin, scale });
  const cols = Math.ceil(n / 2);
  const holes = [];
  for (let i = 0; i < n; i++) {
    const row = i < cols ? 0 : 1;
    const col = i % cols;
    const hx = -2 + col * (30 / Math.max(1, cols - 1));
    const hy = -12 + row * 24;
    const isHit = i < k;
    holes.push(isoDiscSlot({ x: hx, y: hy, z: 2.8, r: 4.8, active: isHit, dashed: !isHit, origin, scale }));
  }
  const targetIdx = Math.min(n - 1, k);
  const tRow = targetIdx < cols ? 0 : 1, tCol = targetIdx % cols;
  const sx = -2 + tCol * (30 / Math.max(1, cols - 1));
  const sy = -12 + tRow * 24;
  const stamp = isoStamp({ x: sx, y: sy, z: 7, press, origin, scale });
  return `<g class="iso-punch-card" data-stamped="${k}" data-total="${n}">${card}${header}${holes.join('')}${stamp}</g>`;
}

// Perforated paper ticket / voucher with detachable right stub (tornOffset in [0, 1]).
export function isoTicket({
  title = '20% OFF ANY PASTRY', code = 'BUN20', torn = false, tornOffset = torn ? 1 : 0,
  origin = [84, 56], scale = 1,
} = {}) {
  const dx = f2(tornOffset * 8), dy = f2(tornOffset * 3.5), rot = f2(tornOffset * 4.5);
  return `<g class="iso-ticket${tornOffset > 0.1 ? ' is-torn' : ''}">` +
    `<rect x="14" y="24" width="96" height="44" rx="5" fill="var(--accent-soft, #fce4df)" stroke="${INK}" stroke-width="0.55"/>` +
    `<text x="62" y="44" text-anchor="middle" font-family="var(--sans, system-ui, sans-serif)" font-size="7.8" font-weight="800" fill="${INK}">${esc(title)}</text>` +
    `<text x="62" y="56" text-anchor="middle" font-family="var(--mono, ui-monospace, monospace)" font-size="6.2" fill="var(--muted, #686259)">VALID AT COUNTER · 1 USE</text>` +
    `<line x1="110" y1="26" x2="110" y2="66" stroke="${INK}" stroke-width="0.55" stroke-dasharray="2.2 2.2"/>` +
    `<g transform="translate(${dx} ${dy}) rotate(${rot} 128 46)">` +
      `<rect x="110" y="24" width="42" height="44" rx="5" fill="var(--accent, #ef6a4c)" stroke="${INK}" stroke-width="0.55"/>` +
      `<text x="131" y="49" text-anchor="middle" font-family="var(--mono, ui-monospace, monospace)" font-size="7.5" font-weight="800" fill="var(--accent-on, #fff)">${esc(code)}</text>` +
    `</g>` +
    `</g>`;
}

// Electric gooseneck kettle on dark base with LED status dots.
export function isoKettle({ progress = 0.5, ready = false, origin = [84, 66], scale = 1 } = {}) {
  const base = isoBox({ x: -22, y: -22, z: -4, dx: 44, dy: 44, dz: 4.5, tone: 'charcoal', origin, scale });
  const body = isoCyl({ x: 0, y: 0, z: 0.5, r: 14, rTop: 10.5, h: 22, tone: 'ink', origin, scale, specular: true });
  const lid = isoCyl({ x: 0, y: 0, z: 22.5, r: 9.5, rTop: 9.5, h: 2, tone: 'accent', origin, scale });
  const knob = isoCyl({ x: 0, y: 0, z: 24.5, r: 3, rTop: 3, h: 2.5, tone: 'gold', origin, scale });
  const [sx0, sy0] = isoPt(10, -4, 6, origin, scale);
  const [sx1, sy1] = isoPt(24, -14, 24, origin, scale);
  const spout = `<path d="M${sx0},${sy0} C${f2(sx0 + 12)},${sy0} ${f2(sx1 - 6)},${f2(sy1 + 10)} ${sx1},${sy1}" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>`;
  const [lx, ly] = isoPt(-12, 16, 1.5, origin, scale);
  const ledCol = ready ? '#43c25c' : 'var(--accent, #ef6a4c)';
  const leds = `<circle cx="${lx}" cy="${ly}" r="2.2" fill="${ledCol}"/><circle cx="${f2(lx + 6)}" cy="${f2(ly - 3)}" r="2.2" fill="${progress > 0.5 || ready ? ledCol : '#555'}"/>`;
  return `<g class="iso-kettle">${base}${spout}${body}${lid}${knob}${leds}</g>`;
}

// Bakery / furnace oven with opening door and glowing interior.
export function isoOven({ progress = 0.7, origin = [84, 66], scale = 1 } = {}) {
  const u = Math.max(0, Math.min(1, progress));
  const chassis = isoBox({ x: -26, y: -20, z: 0, dx: 52, dy: 40, dz: 28, tone: 'cream', origin, scale });
  const glowTone = u > 0.35 ? 'amberGlow' : 'charcoal';
  const cavity = isoBox({ x: -18, y: 18, z: 5, dx: 36, dy: 3, dz: 14, tone: glowTone, origin, scale });
  const bun1 = isoCyl({ x: -7, y: 14, z: 7, r: 5, rTop: 5.5, h: 3.8, tone: 'wood', origin, scale });
  const bun2 = isoCyl({ x: 7, y: 14, z: 7, r: 5, rTop: 5.5, h: 3.8, tone: 'wood', origin, scale });
  const header = isoBox({ x: -26, y: -20, z: 28, dx: 52, dy: 40, dz: 4.5, tone: 'accent', origin, scale });
  return `<g class="iso-oven">${chassis}${cavity}${bun1}${bun2}${header}</g>`;
}

export function isoEspressoMachine({ stage = 1, origin = [84, 66], scale = 1 } = {}) {
  const base = isoBox({ x: -24, y: -18, z: 0, dx: 48, dy: 36, dz: 4, tone: 'stone', origin, scale });
  const tower = isoBox({ x: -22, y: -16, z: 4, dx: 44, dy: 20, dz: 22, tone: 'accent', origin, scale });
  const head = isoCyl({ x: 0, y: 10, z: 16, r: 6.5, rTop: 6.5, h: 4.5, tone: 'charcoal', origin, scale });
  const cup = isoCup({ x: 0, y: 10, z: 4, sizeScale: 0.75, saucer: false, filled: stage >= 1, origin, scale });
  const [sx, sy] = isoPt(0, 10, 14, origin, scale);
  const stream = stage === 1 ? `<line x1="${sx}" y1="${f2(sy - 3)}" x2="${sx}" y2="${f2(sy + 5)}" stroke="#6e4522" stroke-width="1.4" stroke-linecap="round"/>` : '';
  return `<g class="iso-espresso">${base}${tower}${head}${stream}${cup}</g>`;
}

// Pop-up toaster with rising toast slice (pop in [0, 1]).
export function isoToaster({ pop = 1, origin = [42, 46], scale = 1 } = {}) {
  const zToast = 10 + pop * 8;
  const slice = isoBox({ x: -9, y: -5, z: zToast, dx: 18, dy: 4, dz: 12, tone: 'wood', origin, scale });
  const body = isoBox({ x: -15, y: -10, z: 0, dx: 30, dy: 20, dz: 15, tone: 'accent', origin, scale });
  const knob = isoBox({ x: 15, y: -2, z: 5 + pop * 5, dx: 4, dy: 4, dz: 2.5, tone: 'charcoal', origin, scale });
  return `<g class="iso-toaster">${body}${slice}${knob}</g>`;
}

// Hanging wooden signs on crossbar (Tabs).
export function isoSignRow({ items = ['Menu', 'Orders', 'Rewards'], activeIndex = 0 } = {}) {
  const n = items.length || 1;
  const slotW = 140 / n;
  const bar = `<line x1="12" y1="18" x2="156" y2="18" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>`;
  const signs = items.map((lbl, i) => {
    const cx = f2(14 + (i + 0.5) * slotW);
    const active = i === activeIndex;
    const yOff = active ? 26 : 29;
    const fill = active ? 'var(--accent, #ef6a4c)' : '#e8e3d7';
    const textFill = active ? 'var(--accent-on, #fff)' : INK;
    return `<g class="iso-sign${active ? ' is-active' : ''}" data-tab="${i}">` +
      `<line x1="${f2(cx - 10)}" y1="18" x2="${f2(cx - 10)}" y2="${yOff}" stroke="${INK}" stroke-width="0.7"/>` +
      `<line x1="${f2(cx + 10)}" y1="18" x2="${f2(cx + 10)}" y2="${yOff}" stroke="${INK}" stroke-width="0.7"/>` +
      `<rect x="${f2(cx - slotW * 0.43)}" y="${yOff}" width="${f2(slotW * 0.86)}" height="24" rx="4" fill="${fill}" stroke="${INK}" stroke-width="0.6"/>` +
      `<text x="${cx}" y="${f2(yOff + 15)}" text-anchor="middle" font-family="var(--mono, ui-monospace, monospace)" font-size="7.2" font-weight="800" fill="${textFill}">${esc(lbl)}</text>` +
      `</g>`;
  }).join('');
  return `<g class="iso-sign-row">${bar}${signs}</g>`;
}

// Two-sided counter notice board (Chat).
export function isoNoticeBoard({ lines = ['MAYA: Extra hot?', 'CAFE: On it!'], typing = false, origin = [84, 62], scale = 1 } = {}) {
  const board = isoBox({ x: -32, y: -12, z: 0, dx: 64, dy: 24, dz: 22, tone: 'wood', origin, scale });
  const card1 = `<rect x="24" y="24" width="120" height="22" rx="4" fill="#fffdf6" stroke="${INK}" stroke-width="0.55"/>` +
    `<text x="32" y="38" font-family="var(--mono, ui-monospace, monospace)" font-size="7.2" font-weight="700" fill="${INK}">${esc(lines[0] || '')}</text>`;
  const reply = typing ? 'CAFE: Typing…' : (lines[1] || '');
  const card2 = `<rect x="24" y="52" width="120" height="22" rx="4" fill="var(--accent-soft, #fce4df)" stroke="${INK}" stroke-width="0.55"/>` +
    `<text x="32" y="66" font-family="var(--mono, ui-monospace, monospace)" font-size="7.2" font-weight="700" fill="${INK}">${esc(reply)}</text>`;
  return `<g class="iso-notice-board">${board}${card1}${card2}</g>`;
}

// Leather wallet + cards + falling gold coin.
export function isoWallet({ coinDrop = 0, origin = [84, 66], scale = 1 } = {}) {
  const back = isoBox({ x: -26, y: -16, z: 0, dx: 52, dy: 32, dz: 14, tone: 'woodDark', origin, scale });
  const card = isoBox({ x: -20, y: -12, z: 10, dx: 28, dy: 20, dz: 8, tone: 'accent', origin, scale });
  const front = isoBox({ x: -26, y: 2, z: 0, dx: 52, dy: 14, dz: 12, tone: 'wood', origin, scale });
  const coinZ = 26 - coinDrop * 10;
  const coin = isoCoin({ x: 10, y: -4, z: coinZ, r: 7.5, h: 2.4, tone: 'gold', origin, scale });
  return `<g class="iso-wallet">${back}${card}${front}${coin}</g>`;
}

// Long latte cup with rising waveform foam bars (Audio player).
export function isoWaveformCup({ bars = [0.4, 0.8, 0.6, 1.0, 0.7, 0.5, 0.9, 0.4, 0.6, 0.8, 0.5, 0.3], activeBar = 4 } = {}) {
  const cup = `<rect x="18" y="42" width="132" height="28" rx="12" fill="var(--accent-soft, #fce4df)" stroke="${INK}" stroke-width="0.6"/>`;
  const w = 112 / Math.max(1, bars.length);
  const barSvg = bars.map((v, i) => {
    const x = f2(28 + i * w);
    const bh = f2(8 + v * 24);
    const y = f2(48 - bh);
    const fill = i <= activeBar ? 'var(--accent, #ef6a4c)' : '#d6cfc0';
    return `<rect x="${x}" y="${y}" width="${f2(w * 0.58)}" height="${bh}" rx="1.6" fill="${fill}" stroke="${INK}" stroke-width="0.38"/>`;
  }).join('');
  return `<g class="iso-waveform-cup">${cup}${barSvg}</g>`;
}

// Wooden serving / lab tray with 3 recessed coaster slots.
export function isoTray({ slots = [true, true, false], origin = [84, 62], scale = 1 } = {}) {
  const base = `<rect x="14" y="28" width="140" height="48" rx="8" fill="#d8a46f" stroke="${INK}" stroke-width="0.65"/>` +
    `<rect x="19" y="33" width="130" height="38" rx="5" fill="#e8c396" stroke="${INK}" stroke-width="0.4"/>`;
  const xs = [44, 84, 124];
  const items = xs.map((cx, i) => {
    const on = Boolean(slots[i]);
    if (!on) {
      return `<ellipse cx="${cx}" cy="52" rx="14" ry="8.5" fill="#d8a46f" stroke="${INK}" stroke-width="0.42" stroke-dasharray="2.4 2.4"/>`;
    }
    if (i === 0) return isoCup({ x: -24, y: 0, z: 6, sizeScale: 0.78, active: true, origin: [cx + 20, 56], scale });
    if (i === 1) return isoCyl({ x: 0, y: 0, z: 4, r: 9.5, rTop: 8.5, h: 6.5, tone: 'wood', rimFill: 'var(--accent, #ef6a4c)', origin: [cx, 54], scale });
    return isoCyl({ x: 0, y: 0, z: 4, r: 7.5, rTop: 6.5, h: 11, tone: 'paper', rimFill: '#fffdf6', origin: [cx, 56], scale });
  }).join('');
  return `<g class="iso-tray">${base}${items}</g>`;
}

// Spiral-bound notepad + animated pencil writing query text (Search).
export function isoNotepad({ text = 'flat white', progress = 1 } = {}) {
  const shown = String(text || '').slice(0, Math.max(1, Math.round(String(text || '').length * progress)));
  const Rings = Array.from({ length: 5 }, (_, i) => `<rect x="16" y="${22 + i * 7}" width="7" height="3.2" rx="1.5" fill="#3d3935" stroke="${INK}" stroke-width="0.35"/>`).join('');
  const penX = f2(38 + Math.min(92, shown.length * 7.5));
  return `<g class="iso-notepad">` +
    `<rect x="20" y="20" width="128" height="38" rx="4" fill="#d6cfc0" stroke="${INK}" stroke-width="0.55"/>` +
    `<rect x="20" y="17" width="128" height="38" rx="4" fill="#fffdf6" stroke="${INK}" stroke-width="0.55"/>` +
    `<line x1="28" y1="45" x2="140" y2="45" stroke="#cfc8b8" stroke-width="0.5" stroke-dasharray="2 2"/>` +
    Rings +
    `<text x="34" y="41" font-family="var(--mono, ui-monospace, monospace)" font-size="11.5" font-weight="700" fill="${INK}">${esc(shown)}</text>` +
    `<g transform="translate(${penX} 14) rotate(22)">` +
      `<rect x="0" y="0" width="5.5" height="24" rx="1.2" fill="var(--accent, #ef6a4c)" stroke="${INK}" stroke-width="0.45"/>` +
      `<rect x="0" y="-4" width="5.5" height="4" rx="1" fill="#f07a7e" stroke="${INK}" stroke-width="0.45"/>` +
      `<polygon points="0,24 5.5,24 2.75,30" fill="#231e16"/>` +
    `</g>` +
    `</g>`;
}

// Hanging 5-day flip calendar cards (Date picker).
export function isoFlipCalendar({ days = ['Wed 16', 'Thu 17', 'Fri 18', 'Sat 19', 'Sun 20'], activeIndex = 3 } = {}) {
  const n = days.length || 1;
  const w = 140 / n;
  const cards = days.map((d, i) => {
    const [dow, num] = String(d).split(/\s+/);
    const x = f2(14 + i * w);
    const active = i === activeIndex;
    const y = active ? 20 : 24;
    const fill = active ? 'var(--accent, #ef6a4c)' : '#fffdf6';
    const fg = active ? 'var(--accent-on, #fff)' : INK;
    return `<g class="iso-cal-day${active ? ' is-active' : ''}" data-day="${i}">` +
      `<rect x="${x}" y="${y}" width="${f2(w - 4)}" height="36" rx="4" fill="${fill}" stroke="${INK}" stroke-width="0.55"/>` +
      `<circle cx="${f2(x + (w - 4) * 0.5)}" cy="${f2(y + 5)}" r="1.5" fill="${INK}"/>` +
      `<text x="${f2(x + (w - 4) * 0.5)}" y="${f2(y + 16)}" text-anchor="middle" font-family="var(--mono, ui-monospace, monospace)" font-size="6.2" font-weight="700" fill="${fg}">${esc(dow || '')}</text>` +
      `<text x="${f2(x + (w - 4) * 0.5)}" y="${f2(y + 29)}" text-anchor="middle" font-family="var(--sans, system-ui, sans-serif)" font-size="10.5" font-weight="800" fill="${fg}">${esc(num || '')}</text>` +
      `</g>`;
  }).join('');
  return `<g class="iso-flip-cal">${cards}</g>`;
}

// Pour-over glass carafe & dripper with 3 step callout nodes (Stepper).
export function isoPourOver({ step = 1, steps = ['Drinks', 'Pastry', 'Pickup'], origin = [64, 68], scale = 1 } = {}) {
  const k = Math.max(0, Math.min(steps.length - 1, step));
  const fillH = 4 + (k + 1) * 4.2;
  const liquid = isoCyl({ x: 0, y: 0, z: 1, r: 12.5, rTop: 11, h: fillH, tone: 'woodDark', origin, scale });
  const carafe = isoCyl({ x: 0, y: 0, z: 0, r: 14, rTop: 10, h: 18, tone: 'glass', origin, scale, specular: true });
  const dripper = isoCyl({ x: 0, y: 0, z: 18, r: 7, rTop: 13, h: 11, tone: 'accent', origin, scale });
  const nodes = steps.map((lbl, i) => {
    const ny = 24 + i * 20;
    const done = i <= k;
    const fill = done ? 'var(--accent, #ef6a4c)' : '#fffdf6';
    const fg = done ? 'var(--accent-on, #fff)' : INK;
    return `<g class="iso-step-node${done ? ' is-done' : ''}" data-step="${i}">` +
      `<line x1="82" y1="${ny}" x2="102" y2="${ny}" stroke="${INK}" stroke-width="0.5" stroke-dasharray="2 2"/>` +
      `<rect x="102" y="${ny - 7}" width="52" height="14" rx="7" fill="${fill}" stroke="${INK}" stroke-width="0.5"/>` +
      `<text x="128" y="${ny + 2.5}" text-anchor="middle" font-family="var(--mono, ui-monospace, monospace)" font-size="6.8" font-weight="700" fill="${fg}">${i + 1} ${esc(lbl)}</text>` +
      `</g>`;
  }).join('');
  return `<g class="iso-pour-over">${liquid}${carafe}${dripper}${nodes}</g>`;
}
