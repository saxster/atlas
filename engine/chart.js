// Small SVG charts for the left page and explorer/sandbox figures, shared by chapters of every subject (the 15 legacy
// physics chapters keep their own local copies). chart() returns markup; a chart's live cursor is a <circle data-cursor="key">
// that moveCursor() places each frame from the same model values the figure uses.
// Includes paper-masked callout plates, collision-free SVG naming, and conservation-verified waterfall & Sankey builders.
import { isoCoinStack, isoBox, inkFilterDefs } from './iso_kit.js';
const P = { l: 44, r: 14, t: 16, b: 30 };
const num = v => String(v).replace('-', '−');
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

// Per-character width budget in em: 0.62em mono, 0.60em sans, 1.0em East Asian Wide/Fullwidth & astral symbols, 0 combining marks.
export function textAdvanceEm(str, mono = true) {
  const base = mono ? 0.62 : 0.60;
  let em = 0;
  for (const ch of String(str ?? '')) {
    const cp = ch.codePointAt(0);
    if ((cp >= 0x0300 && cp <= 0x036F) || (cp >= 0x1AB0 && cp <= 0x1AFF) || (cp >= 0x1DC0 && cp <= 0x1DFF) || (cp >= 0x20D0 && cp <= 0x20FF) || (cp >= 0xFE20 && cp <= 0xFE2F)) continue;
    const wide = cp >= 0x1100 && (
      cp <= 0x115F || cp === 0x2329 || cp === 0x232A ||
      (cp >= 0x2E80 && cp <= 0xA4CF && cp !== 0x303F) ||
      (cp >= 0xAC00 && cp <= 0xD7A3) || (cp >= 0xF900 && cp <= 0xFAFF) ||
      (cp >= 0xFE10 && cp <= 0xFE19) || (cp >= 0xFE30 && cp <= 0xFE6F) ||
      (cp >= 0xFF00 && cp <= 0xFF60) || (cp >= 0xFFE0 && cp <= 0xFFE6) || cp >= 0x1F000
    );
    em += wide ? 1.0 : base;
  }
  return em;
}

function svgHeader({ w, h, label = '', desc = '', id = '' }) {
  const cleanLabel = esc(label), cleanDesc = esc(desc), cleanId = esc(id);
  const aria = cleanId
    ? `aria-labelledby="${cleanId}-title${cleanDesc ? ` ${cleanId}-desc` : ''}"`
    : `aria-label="${cleanLabel}${cleanDesc ? `. ${cleanDesc}` : ''}"`;
  const titleEl = cleanId ? `<title id="${cleanId}-title">${cleanLabel}</title>` : `<title>${cleanLabel}</title>`;
  const descEl = cleanDesc ? (cleanId ? `<desc id="${cleanId}-desc">${cleanDesc}</desc>` : `<desc>${cleanDesc}</desc>`) : '';
  return `<svg class="chart" viewBox="0 0 ${w} ${h}" role="img" ${aria}>${titleEl}${descEl}`;
}

function calloutPlate(px, py, rawText, { alignEnd = false, above = true, fontSize = 11, cls = 'lab', w = 420, h = 170 } = {}) {
  const text = String(rawText ?? '').trim();
  if (!text) return { mask: '', text: '' };
  const textW = Math.ceil(textAdvanceEm(text, true) * fontSize);
  const maskW = Math.max(16, textW + 6), maskH = 13;
  // 6px stroke clearance gap above or below the point/curve, clamped inside the plot frame
  const rawY = above ? py - 6 - maskH : py + 6;
  const maskY = clamp(rawY, P.t + 1, h - P.b - maskH - 1);
  const rawX = alignEnd ? px - 4 - maskW + 3 : px + 4 - 3;
  const maskX = clamp(rawX, P.l + 1, w - P.r - maskW - 1);
  const tx = alignEnd ? maskX + maskW - 3 : maskX + 3;
  const ty = maskY + 10;
  return {
    mask: `<rect class="mask" x="${maskX.toFixed(1)}" y="${maskY.toFixed(1)}" width="${maskW}" height="${maskH}" rx="2"/>`,
    text: `<text class="${cls}" x="${tx.toFixed(1)}" y="${ty.toFixed(1)}"${alignEnd ? ' text-anchor="end"' : ''}>${esc(text)}</text>`,
  };
}

// the page coordinates of a value on a chart of this size and range
export function scale({ x0, x1, y0, y1, w = 420, h = 170 }) {
  return { sx: x => P.l + (x - x0) / (x1 - x0) * (w - P.l - P.r), sy: y => P.t + (1 - (y - y0) / (y1 - y0)) * (h - P.t - P.b) };
}

// series: [{ pts: [[x, y], …], cls?, fill? (shade down to y = 0), tag?: [x, y, text, alignEnd?] }]
// marks: [[x, y, text]]; cursors: keys for moveCursor
export function chart({ x0, x1, y0, y1, w = 420, h = 170, series, xlabel, ylabel, marks = [], cursors = [], tangents = [], livePaths = [], label, desc = '', id = '' }) {
  const { sx, sy } = scale({ x0, x1, y0, y1, w, h });
  const d = pts => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${sx(x).toFixed(1)},${sy(y).toFixed(1)}`).join('');
  const base = sy(Math.min(Math.max(0, y0), y1)).toFixed(1);
  const masks = [], labels = [];
  const paths = series.map(s => {
    if (s.tag && String(s.tag[2] ?? '').trim()) {
      const c = calloutPlate(sx(s.tag[0]), sy(s.tag[1]), s.tag[2], { alignEnd: !!s.tag[3], above: true, fontSize: 11.5, cls: 'lab', w, h });
      masks.push(c.mask); labels.push(c.text);
    }
    const pAttr = s.part ? ` data-part="${esc(s.part)}"` : '';
    return (s.fill ? `<path class="area"${pAttr} d="${d(s.pts)}L${sx(s.pts.at(-1)[0]).toFixed(1)},${base}L${sx(s.pts[0][0]).toFixed(1)},${base}Z"/>` : '') +
      `<path class="${s.cls || 'curve'}"${pAttr} d="${d(s.pts)}"/>`;
  }).join('');
  const zero = y0 < 0 && y1 > 0 ? `<line class="zero" x1="${P.l}" x2="${w - P.r}" y1="${sy(0)}" y2="${sy(0)}"/>` : '';
  const dots = marks.map(([x, y, t]) => {
    const px = sx(x), py = sy(y);
    if (String(t ?? '').trim()) {
      const above = py > h - P.b - 20;
      const alignEnd = px > w - P.r - 48;
      const c = calloutPlate(px, py, t, { alignEnd, above, fontSize: 10.5, cls: 'ax', w, h });
      masks.push(c.mask); labels.push(c.text);
    }
    return `<circle class="mark" cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="3.5"/>`;
  }).join('');
  const liveSvg = livePaths.map(k => `<path class="curve live-path" data-live="${esc(k)}" d=""/>`).join('');
  const tanSvg = tangents.map(k => `<line class="tangent" data-tangent="${esc(k)}" x1="0" y1="0" x2="0" y2="0"/>`).join('');
  return `${svgHeader({ w, h, label, desc, id })}
    <rect class="frame" x="${P.l}" y="${P.t}" width="${w - P.l - P.r}" height="${h - P.t - P.b}"/>${zero}${paths}${liveSvg}${tanSvg}${masks.join('')}${dots}${labels.join('')}
    <text class="ax" x="${P.l - 6}" y="${sy(y1) + 4}" text-anchor="end">${esc(num(y1))}</text><text class="ax" x="${P.l - 6}" y="${sy(y0) + 4}" text-anchor="end">${esc(num(y0))}</text>
    <text class="ax" x="${P.l}" y="${h - 9}">${esc(num(x0))}</text><text class="ax" x="${w - P.r}" y="${h - 9}" text-anchor="end">${esc(num(x1))}</text>
    <text class="lab" x="${P.l + 6}" y="${P.t + 13}">${esc(ylabel)}</text><text class="ax" x="${(P.l + w - P.r) / 2}" y="${h - 9}" text-anchor="middle">${esc(xlabel)}</text>
    ${cursors.map(c => `<circle class="cursor" r="4.5" data-cursor="${esc(c)}"/>`).join('')}
  </svg>`;
}

// n + 1 evenly spaced samples of fn on [a, b], as chart points
export const samples = (a, b, n, fn) => Array.from({ length: n + 1 }, (_, i) => { const x = a + (b - a) * i / n; return [x, fn(x)]; });

// place every cursor named key, in each of the given page elements (the sheet and the turning leaf)
export function moveCursor(sheets, key, range, x, y) {
  const { sx, sy } = scale(range);
  const roots = Array.isArray(sheets) ? sheets : [sheets];
  for (const el of roots) el?.querySelectorAll?.(`circle[data-cursor="${key}"]`).forEach(c => { c.setAttribute('cx', sx(x).toFixed(1)); c.setAttribute('cy', sy(y).toFixed(1)); });
}

// update a tangent slope segment (y(x +/- dx) = y +/- slope * dx) in place at 60fps without re-parsing SVG
export function moveTangent(sheets, key, range, x, y, slope, dx = (range.x1 - range.x0) * 0.12) {
  const { sx, sy } = scale(range);
  const xa = Math.max(range.x0, x - dx), xb = Math.min(range.x1, x + dx);
  const ya = clamp(y + slope * (xa - x), range.y0, range.y1);
  const yb = clamp(y + slope * (xb - x), range.y0, range.y1);
  const roots = Array.isArray(sheets) ? sheets : [sheets];
  for (const el of roots) {
    el?.querySelectorAll?.(`line[data-tangent="${key}"]`).forEach(ln => {
      ln.setAttribute('x1', sx(xa).toFixed(1)); ln.setAttribute('y1', sy(ya).toFixed(1));
      ln.setAttribute('x2', sx(xb).toFixed(1)); ln.setAttribute('y2', sy(yb).toFixed(1));
    });
  }
}

// update a progressive live <path data-live="key"> in place at 60fps without innerHTML DOM thrash
export function setLivePath(sheets, key, range, pts) {
  const { sx, sy } = scale(range);
  const d = pts.length ? pts.map(([x, y], i) => `${i ? 'L' : 'M'}${sx(x).toFixed(1)},${sy(y).toFixed(1)}`).join('') : '';
  const roots = Array.isArray(sheets) ? sheets : [sheets];
  for (const el of roots) {
    el?.querySelectorAll?.(`path[data-live="${key}"]`).forEach(p => p.setAttribute('d', d));
  }
}

// ---------- Waterfall chart (conservation-verified running-total bridge) ----------
// steps: [{ name, value, role?: 'start' | 'delta' | 'subtotal' | 'end' }]
export function waterfallWalk(steps) {
  if (!Array.isArray(steps) || steps.length < 3) throw new Error('waterfallWalk requires at least 3 steps (start, delta, end)');
  if ((steps[0].role || 'start') !== 'start' || !(steps[0].value > 0)) throw new Error('waterfallWalk: first step must be a positive start total');
  if ((steps.at(-1).role || 'end') !== 'end') throw new Error('waterfallWalk: last step must have role "end"');
  let running = 0, minV = 0, maxV = 0;
  const bars = [], carries = [];
  steps.forEach((s, i) => {
    const role = s.role || (i === 0 ? 'start' : i === steps.length - 1 ? 'end' : 'delta');
    const val = Number(s.value);
    if (!Number.isFinite(val)) throw new Error(`waterfallWalk: non-finite value at "${s.name}"`);
    let from, to, text;
    if (role === 'start') {
      from = 0; to = val; running = val; text = num(val);
    } else if (role === 'delta') {
      if (Math.abs(val) < 1e-12) throw new Error(`waterfallWalk: zero delta at "${s.name}" occupies a column with no bridge`);
      from = running; to = running + val; running = to;
      text = val > 0 ? `+${num(val)}` : `−${num(Math.abs(val))}`;
    } else if (role === 'subtotal' || role === 'end') {
      if (Math.abs(running - val) > 1e-6) throw new Error(`waterfallWalk conservation failed at "${s.name}": running=${running}, declared=${val}`);
      from = 0; to = running; text = num(val);
    } else {
      throw new Error(`waterfallWalk: unknown role "${role}"`);
    }
    const bottom = Math.min(from, to), top = Math.max(from, to);
    minV = Math.min(minV, bottom); maxV = Math.max(maxV, top);
    bars.push({ name: String(s.name), role, value: val, from, to, bottom, top, text });
    if (i < steps.length - 1) carries.push({ fromIndex: i, toIndex: i + 1, value: running });
  });
  return { bars, carries, y0: Math.min(0, minV), y1: maxV * 1.15 };
}

export function waterfallChart({ steps, w = 420, h = 180, ylabel = '', label = 'Waterfall bridge', desc = '', id = '' }) {
  const { bars, carries, y0, y1 } = waterfallWalk(steps);
  const { sy } = scale({ x0: 0, x1: 1, y0, y1, w, h });
  const plotW = w - P.l - P.r, n = bars.length, slotW = plotW / n, barW = Math.min(38, slotW * 0.62);
  const xCenter = i => P.l + (i + 0.5) * slotW;
  const carrySvg = carries.map(c => {
    const x1 = xCenter(c.fromIndex) + barW / 2, x2 = xCenter(c.toIndex) - barW / 2, y = sy(c.value).toFixed(1);
    return `<line class="wf-carry" data-carry="${c.value}" x1="${x1.toFixed(1)}" y1="${y}" x2="${x2.toFixed(1)}" y2="${y}"/>`;
  }).join('');
  const masks = [], texts = [];
  const barSvg = bars.map((b, i) => {
    const cx = xCenter(i), x = cx - barW / 2, yTop = sy(b.top), yBot = sy(b.bottom), bh = Math.max(1.5, yBot - yTop);
    const cls = b.role === 'delta' ? (b.value > 0 ? 'wf-up' : 'wf-down') : 'wf-total';
    const mw = Math.max(20, Math.ceil(textAdvanceEm(b.text, true) * 10.5) + 6), mh = 12;
    const my = clamp(yTop - 5 - mh, P.t + 1, h - P.b - mh - 1);
    const mx = clamp(cx - mw / 2, P.l + 1, w - P.r - mw - 1);
    masks.push(`<rect class="mask" x="${mx.toFixed(1)}" y="${my.toFixed(1)}" width="${mw}" height="${mh}" rx="2"/>`);
    texts.push(`<text class="lab" x="${cx.toFixed(1)}" y="${(my + 9.5).toFixed(1)}" text-anchor="middle">${esc(b.text)}</text>`);
    texts.push(`<text class="ax" x="${cx.toFixed(1)}" y="${h - 9}" text-anchor="middle">${esc(b.name)}</text>`);
    return `<rect class="${cls}" data-role="${b.role}" data-value="${b.value}" data-name="${esc(b.name)}" x="${x.toFixed(1)}" y="${yTop.toFixed(1)}" width="${barW.toFixed(1)}" height="${bh.toFixed(1)}" rx="2"/>`;
  }).join('');
  const zero = `<line class="zero" x1="${P.l}" x2="${w - P.r}" y1="${sy(0).toFixed(1)}" y2="${sy(0).toFixed(1)}"/>`;
  return `${svgHeader({ w, h, label, desc, id })}
    <rect class="frame" x="${P.l}" y="${P.t}" width="${plotW}" height="${h - P.t - P.b}"/>${zero}${carrySvg}${barSvg}${masks.join('')}${texts.join('')}
    <text class="ax" x="${P.l - 6}" y="${sy(bMax(bars)) + 4}" text-anchor="end">${esc(num(bMax(bars)))}</text><text class="ax" x="${P.l - 6}" y="${sy(0) + 4}" text-anchor="end">0</text>
    ${ylabel ? `<text class="lab" x="${P.l + 6}" y="${P.t + 13}">${esc(ylabel)}</text>` : ''}
  </svg>`;
}
const bMax = bars => Math.max(...bars.map(b => b.top));

// ---------- Sankey diagram (conservation-verified volume ribbons with midline horizontal Bezier tangents) ----------
// stages: [[{ id, name, value?, focal? }, ...], ...], links: [{ from, to, value, focal? }]
export function sankeyLayout({ stages, links, w = 420, h = 190, nodeW = 10, pad = 12 }) {
  if (!Array.isArray(stages) || stages.length < 2) throw new Error('sankeyLayout requires at least 2 stage columns');
  if (!Array.isArray(links) || !links.length) throw new Error('sankeyLayout requires at least 1 link');
  const nodeMap = new Map();
  stages.forEach((col, cIdx) => {
    if (!Array.isArray(col) || !col.length) throw new Error(`sankeyLayout: empty stage column ${cIdx}`);
    col.forEach(n => {
      if (!n?.id || nodeMap.has(n.id)) throw new Error(`sankeyLayout: missing or duplicate node id "${n?.id}"`);
      nodeMap.set(n.id, { ...n, col: cIdx, inSum: 0, outSum: 0 });
    });
  });
  for (const l of links) {
    const val = Number(l.value);
    if (!(val > 0)) throw new Error(`sankeyLayout: link ${l.from}->${l.to} must have positive value`);
    const u = nodeMap.get(l.from), v = nodeMap.get(l.to);
    if (!u || !v) throw new Error(`sankeyLayout: unresolved endpoint in ${l.from}->${l.to}`);
    if (v.col !== u.col + 1) throw new Error(`sankeyLayout: link ${l.from}->${l.to} must connect adjacent stages (${u.col} -> ${v.col})`);
    u.outSum += val; v.inSum += val;
  }
  const colTotals = stages.map((col, cIdx) => {
    let sum = 0;
    for (const raw of col) {
      const n = nodeMap.get(raw.id);
      const vol = cIdx === 0 ? n.outSum : cIdx === stages.length - 1 ? n.inSum : n.inSum;
      if (!(vol > 0)) throw new Error(`sankeyLayout: node "${n.id}" carries zero volume`);
      if (cIdx > 0 && cIdx < stages.length - 1 && Math.abs(n.inSum - n.outSum) > 1e-6) {
        throw new Error(`sankeyLayout conservation failed at node "${n.id}": in=${n.inSum}, out=${n.outSum}`);
      }
      if (n.value !== undefined && Math.abs(Number(n.value) - vol) > 1e-6) {
        throw new Error(`sankeyLayout value mismatch at "${n.id}": declared=${n.value}, flow=${vol}`);
      }
      n.volume = vol; sum += vol;
    }
    return sum;
  });
  for (let c = 1; c < colTotals.length; c++) {
    if (Math.abs(colTotals[c] - colTotals[0]) > 1e-6) {
      throw new Error(`sankeyLayout stage total mismatch: stage 0=${colTotals[0]}, stage ${c}=${colTotals[c]}`);
    }
  }
  const maxNodes = Math.max(...stages.map(c => c.length));
  const availH = (h - P.t - P.b) - Math.max(0, maxNodes - 1) * pad;
  const scaleY = availH / colTotals[0];
  const plotW = w - P.l - P.r;
  const colStep = (plotW - nodeW) / (stages.length - 1);
  const nodes = [];
  stages.forEach((col, cIdx) => {
    const x = P.l + cIdx * colStep;
    const totalH = colTotals[cIdx] * scaleY + (col.length - 1) * pad;
    let y = P.t + ((h - P.t - P.b) - totalH) / 2;
    for (const raw of col) {
      const n = nodeMap.get(raw.id), nh = n.volume * scaleY;
      Object.assign(n, { x, y, w: nodeW, h: nh, inY: y, outY: y });
      nodes.push(n);
      y += nh + pad;
    }
  });
  // Ribbons: both Bezier controls sit on the corridor midline so B'(0) and B'(1) are strictly horizontal.
  const ribbons = links.map(l => {
    const u = nodeMap.get(l.from), v = nodeMap.get(l.to), thick = l.value * scaleY;
    const x0 = u.x + u.w, x1 = v.x, midX = (x0 + x1) / 2;
    const y0Top = u.outY, y0Bot = y0Top + thick; u.outY += thick;
    const y1Top = v.inY, y1Bot = y1Top + thick; v.inY += thick;
    const d = `M ${x0.toFixed(1)},${y0Top.toFixed(1)} C ${midX.toFixed(1)},${y0Top.toFixed(1)} ${midX.toFixed(1)},${y1Top.toFixed(1)} ${x1.toFixed(1)},${y1Top.toFixed(1)} ` +
              `L ${x1.toFixed(1)},${y1Bot.toFixed(1)} C ${midX.toFixed(1)},${y1Bot.toFixed(1)} ${midX.toFixed(1)},${y0Bot.toFixed(1)} ${x0.toFixed(1)},${y0Bot.toFixed(1)} Z`;
    return { from: l.from, to: l.to, value: l.value, focal: !!l.focal, x0, x1, midX, y0Top, y0Bot, y1Top, y1Bot, thick, d };
  });
  return { nodes, ribbons, total: colTotals[0], scaleY };
}

export function sankeyChart({ stages, links, w = 420, h = 190, nodeW = 10, pad = 12, unit = '', label = 'Sankey flow diagram', desc = '', id = '' }) {
  const { nodes, ribbons } = sankeyLayout({ stages, links, w, h, nodeW, pad });
  const lastCol = stages.length - 1;
  const ribbonSvg = ribbons.map(r => `<path class="sk-ribbon${r.focal ? ' focal' : ''}" data-from="${esc(r.from)}" data-to="${esc(r.to)}" data-value="${r.value}" d="${r.d}"/>`).join('');
  const masks = [], texts = [];
  const nodeSvg = nodes.map(n => {
    const rightSide = n.col === lastCol;
    const txt = `${n.name} (${num(n.volume)}${unit ? ' ' + unit : ''})`;
    const px = rightSide ? n.x - 2 : n.x + n.w + 2, py = n.y + n.h / 2 + 4;
    const c = calloutPlate(px, py, txt, { alignEnd: rightSide, above: true, fontSize: 10.5, cls: 'lab', w, h });
    masks.push(c.mask); texts.push(c.text);
    return `<rect class="sk-node${n.focal ? ' focal' : ''}" data-node="${esc(n.id)}" data-value="${n.volume}" x="${n.x.toFixed(1)}" y="${n.y.toFixed(1)}" width="${n.w}" height="${n.h.toFixed(1)}" rx="2"/>`;
  }).join('');
  return `${svgHeader({ w, h, label, desc, id })}
    <rect class="frame" x="${P.l}" y="${P.t}" width="${w - P.l - P.r}" height="${h - P.t - P.b}"/>${ribbonSvg}${nodeSvg}${masks.join('')}${texts.join('')}
  </svg>`;
}

// ---------- Stepped 2D SVG cinematography (geometric-zoom viewBox framing & constant-speed arc-length beads) ----------
// Interpolates center linearly and width/height geometrically (2D analogue of logFovLerp) so 5x zoom-ins feel uniform.
export function interpViewBox(boxA, boxB = boxA, u = 0) {
  const t = clamp(u, 0, 1);
  const [x0, y0, w0, h0] = boxA;
  const [x1, y1, w1, h1] = boxB || boxA;
  const cx = (x0 + w0 * 0.5) + ((x1 + w1 * 0.5) - (x0 + w0 * 0.5)) * t;
  const cy = (y0 + h0 * 0.5) + ((y1 + h1 * 0.5) - (y0 + h0 * 0.5)) * t;
  const w = Math.exp(Math.log(Math.max(1e-6, w0)) * (1 - t) + Math.log(Math.max(1e-6, w1)) * t);
  const h = Math.exp(Math.log(Math.max(1e-6, h0)) * (1 - t) + Math.log(Math.max(1e-6, h1)) * t);
  return `${(cx - w * 0.5).toFixed(1)} ${(cy - h * 0.5).toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`;
}

// Mutates svg[data-stage="key"] viewBox in place at 60fps across sheet elements without re-parsing SVG.
export function focusViewBox(sheets, key, boxA, boxB = boxA, u = 0) {
  const vb = interpViewBox(boxA, boxB, u);
  const roots = Array.isArray(sheets) ? sheets : [sheets];
  for (const el of roots) {
    el?.querySelectorAll?.(`svg[data-stage="${key}"]`).forEach(svg => svg.setAttribute('viewBox', vb));
  }
  return vb;
}

// Samples [x, y, angleDeg] at normalized Euclidean arc-length fraction u in [0, 1) so beads travel at constant speed.
export function samplePolyline(pts, u = 0) {
  if (!Array.isArray(pts) || !pts.length) return [0, 0, 0];
  if (pts.length === 1) return [pts[0][0], pts[0][1], 0];
  const cum = [0];
  for (let i = 1; i < pts.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  }
  const total = cum.at(-1);
  if (total < 1e-9) return [pts[0][0], pts[0][1], 0];
  const d = (((u % 1) + 1) % 1) * total;
  let seg = 0;
  while (seg < pts.length - 2 && cum[seg + 1] < d) seg++;
  const segLen = Math.max(1e-9, cum[seg + 1] - cum[seg]);
  const f = clamp((d - cum[seg]) / segLen, 0, 1);
  const ax = pts[seg][0], ay = pts[seg][1], bx = pts[seg + 1][0], by = pts[seg + 1][1];
  const deg = (Math.atan2(by - ay, bx - ax) * 180) / Math.PI;
  return [ax + (bx - ax) * f, ay + (by - ay) * f, deg];
}

export function beadSlots(key, count = 6, r = 3.2) {
  return `<g class="svg-beads" data-beads="${esc(key)}">${Array.from({ length: count }, () => `<circle class="svg-bead" r="${r}"/>`).join('')}</g>`;
}

// Statelessly positions <g data-beads="key"> circles along pts at phaseOffset (order-independent for ?render seeking).
export function pathBeads(sheets, key, pts, phaseOffset = 0) {
  const roots = Array.isArray(sheets) ? sheets : [sheets];
  for (const el of roots) {
    el?.querySelectorAll?.(`g[data-beads="${key}"]`).forEach(g => {
      const dots = g.querySelectorAll('circle');
      const n = dots.length;
      if (!n) return;
      dots.forEach((c, idx) => {
        const [x, y] = samplePolyline(pts, idx / n + phaseOffset);
        c.setAttribute('cx', x.toFixed(1));
        c.setAttribute('cy', y.toFixed(1));
      });
    });
  }
}

// Declarative 2D sequence swimlane diagram with slanted propagation-delay arrows and pathBeads-ready polylines.
export function sequenceLanes({
  actors = [], messages = [], w = 420, h = 200, padX = 48, topY = 28, stage = '', label = 'Sequence swimlane diagram', desc = '', id = '',
} = {}) {
  const n = Math.max(1, actors.length);
  const spanX = Math.max(1, w - padX * 2);
  const xByActor = new Map();
  const actorSvg = actors.map((a, i) => {
    const x = n === 1 ? w * 0.5 : padX + (i / (n - 1)) * spanX;
    xByActor.set(a.id, x);
    return `<g class="seq-actor" data-actor="${esc(a.id)}">` +
      `<rect class="frame" x="${(x - 38).toFixed(1)}" y="6" width="76" height="18" rx="4"/>` +
      `<text class="lab" x="${x.toFixed(1)}" y="18" text-anchor="middle">${esc(a.label || a.id)}</text>` +
      `<line class="grid" x1="${x.toFixed(1)}" y1="${topY}" x2="${x.toFixed(1)}" y2="${h - 8}" stroke-dasharray="3 3"/>` +
      `</g>`;
  }).join('');
  const paths = {};
  const msgSvg = messages.map((m, idx) => {
    const x0 = xByActor.get(m.from) ?? padX;
    const x1 = xByActor.get(m.to) ?? (w - padX);
    const y0 = m.y0 ?? (topY + 18 + idx * 36);
    const y1 = m.y1 ?? (y0 + 18);
    const key = m.key || `msg-${idx}`;
    paths[key] = [[x0, y0], [x1, y1]];
    const mx = (x0 + x1) * 0.5, my = (y0 + y1) * 0.5 - 5;
    const beadsHtml = m.beads ? beadSlots(key, m.beads, 3) : '';
    return `<g class="seq-msg" data-msg="${esc(key)}">` +
      `<line class="curve${m.focal ? ' focal' : ''}" x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}"/>` +
      `<circle class="dot" cx="${x1.toFixed(1)}" cy="${y1.toFixed(1)}" r="2.6"/>` +
      (m.label ? `<text class="lab" x="${mx.toFixed(1)}" y="${my.toFixed(1)}" text-anchor="middle">${esc(m.label)}</text>` : '') +
      beadsHtml +
      `</g>`;
  }).join('');
  const stAttr = stage ? ` data-stage="${esc(stage)}"` : '';
  const head = svgHeader({ w, h, label, desc, id }).replace('<svg ', `<svg${stAttr} `);
  return { svg: `${head}${actorSvg}${msgSvg}</svg>`, paths, xByActor };
}

// ---------- Isometric Unit-Stack Bar Chart (coins, blocks, quanta) ----------
// Validates finite non-negative bars: [{ key?, label, value, fmt? }], quantizes disc counts in [0..maxDiscs],
// and computes exact delta vs predecessor (with Unicode minus '−' and zero-baseline guard).
export function computeBarDelta(bars, activeIndex = (bars?.length || 1) - 1, { maxDiscs = 10 } = {}) {
  if (!Array.isArray(bars) || !bars.length) throw new Error('computeBarDelta requires a non-empty bars array');
  const vals = bars.map((b, i) => {
    const v = Number(b?.value);
    if (!Number.isFinite(v) || v < 0) throw new Error(`computeBarDelta: invalid bar value at index ${i}`);
    return v;
  });
  const maxVal = Math.max(...vals, 1e-9);
  const discs = vals.map(v => (v <= 0 ? 0 : Math.max(1, Math.min(maxDiscs, Math.round((v / maxVal) * maxDiscs)))));
  const idx = clamp(Math.round(activeIndex), 0, bars.length - 1);
  const cur = bars[idx], curVal = vals[idx];
  const prevIdx = idx > 0 ? idx - 1 : idx;
  const prev = bars[prevIdx], prevVal = vals[prevIdx];
  const diff = curVal - prevVal;
  let pct = 0, deltaText = 'baseline';
  if (idx > 0 && prevVal > 1e-9) {
    pct = Math.round((diff / prevVal) * 100);
    const sign = pct > 0 ? '+' : pct < 0 ? '−' : '';
    deltaText = `${sign}${Math.abs(pct)}% vs ${prev.label}`;
  } else if (idx > 0 && curVal > 0) {
    deltaText = `+new vs ${prev.label}`;
  }
  const valueText = cur.fmt ? cur.fmt(curVal) : num(curVal);
  return {
    activeIndex: idx,
    activeBar: cur,
    value: curVal,
    valueText,
    prevIndex: prevIdx,
    diff,
    pct,
    deltaText,
    summaryText: `${deltaText} · ${valueText}`,
    discs,
    maxVal,
  };
}

export function isoStackChart({
  bars = [],
  activeIndex = (bars.length || 1) - 1,
  maxDiscs = 10,
  unitShape = 'coin',
  w = 420,
  h = 185,
  kicker = '',
  label = 'Isometric unit stack chart',
  desc = '',
  id = 'iso-chart',
  quirk = 'slightly-quirky',
} = {}) {
  const info = computeBarDelta(bars, activeIndex, { maxDiscs });
  const cleanId = esc(id).replace(/[^a-zA-Z0-9_-]/g, '') || 'iso-chart';
  const fId = `${cleanId}-hand`;
  const filterDef = inkFilterDefs(fId, { vbW: w, quirk });
  const defs = filterDef ? `<defs>${filterDef}</defs>` : '';
  const fAttr = filterDef ? ` filter="url(#${fId})"` : '';
  const n = bars.length;
  const plotL = 24, plotR = w - 24, plotW = plotR - plotL;
  const slotW = plotW / n;
  const baseLineY = h - 34;

  const stacksSvg = bars.map((b, i) => {
    const cx = +(plotL + (i + 0.5) * slotW).toFixed(1);
    const active = i === info.activeIndex;
    const count = info.discs[i];
    const tone = active ? 'accent' : (unitShape === 'coin' ? 'stone' : 'paper');
    const r = Math.min(13, slotW * 0.28);
    let stackArt = '';
    if (unitShape === 'block') {
      stackArt = Array.from({ length: count }, (_, k) =>
        isoBox({ x: -r * 0.8, y: -r * 0.8, z: k * 5.2, dx: r * 1.6, dy: r * 1.6, dz: 4.6, tone, origin: [cx, baseLineY - 4], scale: 1 })
      ).join('');
    } else {
      stackArt = isoCoinStack({ x: 0, y: 0, z: 0, count, r, discH: 3.1, gap: 0.25, tone, origin: [cx, baseLineY - 4], scale: 1 });
    }
    const valStr = b.fmt ? b.fmt(b.value) : num(b.value);
    const topY = Math.max(28, baseLineY - 14 - count * (unitShape === 'block' ? 5.2 : 3.35));
    return `<g class="iso-bar-col${active ? ' is-active' : ''}" data-bar-idx="${i}" data-active="${active}" role="button" tabindex="0" aria-pressed="${active}" aria-label="${esc(b.label)}: ${esc(valStr)}">` +
      stackArt +
      `<text class="lab iso-bar-val" x="${cx}" y="${topY.toFixed(1)}" text-anchor="middle" opacity="${active ? '1' : '0.68'}">${esc(valStr)}</text>` +
      `<rect class="iso-bar-pill" x="${(cx - slotW * 0.38).toFixed(1)}" y="${baseLineY + 6}" width="${(slotW * 0.76).toFixed(1)}" height="18" rx="9" fill="${active ? 'var(--accent, #ef6a4c)' : 'var(--card, #fffdf6)'}" stroke="var(--ink, #231e16)" stroke-width="0.9"/>` +
      `<text class="ax iso-bar-lbl" x="${cx}" y="${baseLineY + 18}" text-anchor="middle" fill="${active ? 'var(--accent-on, #fff)' : 'var(--strong, #231e16)'}" font-weight="${active ? '700' : '500'}">${esc(b.label)}</text>` +
      `</g>`;
  }).join('');

  const headTitle = kicker || `${ info.activeBar.label } · ${ info.valueText }`;
  return `${svgHeader({ w, h, label, desc, id: cleanId })}${defs}` +
    `<line class="zero" x1="${plotL}" x2="${plotR}" y1="${baseLineY}" y2="${baseLineY}" stroke="var(--ink, #231e16)" stroke-width="1" stroke-dasharray="2.5 2.5"/>` +
    `<text class="lab iso-chart-head" data-iso-head x="${plotL}" y="18" font-weight="700">${esc(headTitle)}</text>` +
    `<text class="ax iso-chart-delta" data-iso-delta x="${plotR}" y="18" text-anchor="end" fill="var(--accent-ink, #b5381f)" font-weight="700">${esc(info.summaryText)}</text>` +
    `<g class="iso-bars-static"${fAttr}>${stacksSvg}</g>` +
    `</svg>`;
}

export function updateIsoStackChart(rootEl, { bars = [], activeIndex = 0, maxDiscs = 10, kicker = '' } = {}) {
  if (!rootEl || !bars.length) return null;
  const info = computeBarDelta(bars, activeIndex, { maxDiscs });
  const headEl = rootEl.querySelector?.('[data-iso-head]');
  if (headEl) headEl.textContent = kicker || `${info.activeBar.label} · ${info.valueText}`;
  const deltaEl = rootEl.querySelector?.('[data-iso-delta]');
  if (deltaEl) deltaEl.textContent = info.summaryText;
  rootEl.querySelectorAll?.('[data-bar-idx]').forEach(col => {
    const idx = +col.getAttribute('data-bar-idx');
    const active = idx === info.activeIndex;
    col.setAttribute('data-active', String(active));
    col.setAttribute('aria-pressed', String(active));
    col.classList?.toggle?.('is-active', active);
    const pill = col.querySelector?.('.iso-bar-pill');
    if (pill) pill.setAttribute('fill', active ? 'var(--accent, #ef6a4c)' : 'var(--card, #fffdf6)');
    const lbl = col.querySelector?.('.iso-bar-lbl');
    if (lbl) {
      lbl.setAttribute('fill', active ? 'var(--accent-on, #fff)' : 'var(--strong, #231e16)');
      lbl.setAttribute('font-weight', active ? '700' : '500');
    }
  });
  return info;
}

