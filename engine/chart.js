// Small SVG charts for the left page, shared by chapters of every subject (the physics chapters keep their own
// copies, which grew apart). chart() returns markup; a chart's live cursor is a <circle data-cursor="key"> that
// moveCursor() places each frame from the same model values the figure uses.
const P = { l: 44, r: 14, t: 16, b: 30 };
const num = v => String(v).replace('-', '−');

// the page coordinates of a value on a chart of this size and range
export function scale({ x0, x1, y0, y1, w = 420, h = 170 }) {
  return { sx: x => P.l + (x - x0) / (x1 - x0) * (w - P.l - P.r), sy: y => P.t + (1 - (y - y0) / (y1 - y0)) * (h - P.t - P.b) };
}

// series: [{ pts: [[x, y], …], cls?, fill? (shade down to y = 0), tag?: [x, y, text, alignEnd?] }]
// marks: [[x, y, text]]; cursors: keys for moveCursor
export function chart({ x0, x1, y0, y1, w = 420, h = 170, series, xlabel, ylabel, marks = [], cursors = [], label }) {
  const { sx, sy } = scale({ x0, x1, y0, y1, w, h });
  const d = pts => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${sx(x).toFixed(1)},${sy(y).toFixed(1)}`).join('');
  const base = sy(Math.min(Math.max(0, y0), y1)).toFixed(1);
  const paths = series.map(s => (s.fill ? `<path class="area" d="${d(s.pts)}L${sx(s.pts.at(-1)[0]).toFixed(1)},${base}L${sx(s.pts[0][0]).toFixed(1)},${base}Z"/>` : '') +
    `<path class="${s.cls || 'curve'}" d="${d(s.pts)}"/>` +
    (s.tag ? `<text class="lab" x="${sx(s.tag[0]) + (s.tag[3] ? -4 : 4)}" y="${sy(s.tag[1]) - 6}"${s.tag[3] ? ' text-anchor="end"' : ''}>${s.tag[2]}</text>` : '')).join('');
  const zero = y0 < 0 && y1 > 0 ? `<line class="zero" x1="${P.l}" x2="${w - P.r}" y1="${sy(0)}" y2="${sy(0)}"/>` : '';
  const mk = marks.map(([x, y, t]) => `<circle class="mark" cx="${sx(x)}" cy="${sy(y)}" r="3.5"/><text class="ax" x="${sx(x) + 6}" y="${sy(y) + 14}">${t}</text>`).join('');
  return `<svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="${label}">
    <rect class="frame" x="${P.l}" y="${P.t}" width="${w - P.l - P.r}" height="${h - P.t - P.b}"/>${zero}${paths}${mk}
    <text class="ax" x="${P.l - 6}" y="${sy(y1) + 4}" text-anchor="end">${num(y1)}</text><text class="ax" x="${P.l - 6}" y="${sy(y0) + 4}" text-anchor="end">${num(y0)}</text>
    <text class="ax" x="${P.l}" y="${h - 9}">${num(x0)}</text><text class="ax" x="${w - P.r}" y="${h - 9}" text-anchor="end">${num(x1)}</text>
    <text class="lab" x="${P.l + 6}" y="${P.t + 13}">${ylabel}</text><text class="ax" x="${(P.l + w - P.r) / 2}" y="${h - 9}" text-anchor="middle">${xlabel}</text>
    ${cursors.map(c => `<circle class="cursor" r="4.5" data-cursor="${c}"/>`).join('')}
  </svg>`;
}

// n + 1 evenly spaced samples of fn on [a, b], as chart points
export const samples = (a, b, n, fn) => Array.from({ length: n + 1 }, (_, i) => { const x = a + (b - a) * i / n; return [x, fn(x)]; });

// place every cursor named key, in each of the given page elements (the sheet and the turning leaf)
export function moveCursor(sheets, key, range, x, y) {
  const { sx, sy } = scale(range);
  for (const el of sheets) el.querySelectorAll(`circle[data-cursor="${key}"]`).forEach(c => { c.setAttribute('cx', sx(x)); c.setAttribute('cy', sy(y)); });
}
