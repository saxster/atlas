// Chapter 1: the unit circle
// The chapter as a figure: its pages, world, clock and readout. main.js opens it as a book; a textbook can embed it.
import { SUBJECT } from '../subject.js';
import { buildWorld } from './world.js';
import { PAGES, PLATES, RANGES } from './pages.js';
import { moveCursor } from '../../engine/chart.js';
import * as M from './model.js';

const f = (x, n = 3) => (x < -5 * 10 ** -(n + 1) ? '−' : '') + Math.abs(x).toFixed(n);
const deg = th => ((th / M.DEG) % 360 + 360) % 360;

export const CHAPTER = {
  subject: SUBJECT,
  no: 1, PAGES, PLATES, clock0: 30 / 360 * M.TURN,     // P starts at 30°
  lookKeys: ['unfold'], narrowZoom: 1.12,
  buildWorld(E) {
    const W = buildWorld(E);
    return { update: (s, look) => W.update(s.t, look), labels: W.labels };
  },
  // a reduced-motion reader gets one still moment: P at 40°
  state: (clock, reduced) => ({ t: reduced ? 40 / 360 * M.TURN : clock }),
  readout({ t }, page) {
    const a = M.steady(t);
    switch (page.scene) {
      case 'circle': return `θ ${f(deg(a), 1)}°\nP (${f(Math.cos(a))}, ${f(Math.sin(a))})`;
      case 'sine': return `θ ${f(deg(a), 1)}°\nsin θ ${f(Math.sin(a))}`;
      case 'cosine': return `θ ${f(deg(a), 1)}°\ncos θ ${f(Math.cos(a))}`;
      case 'pythag': { const b = M.sway(t), s = Math.sin(b) ** 2, c = Math.cos(b) ** 2; return `θ ${f(b / M.DEG, 1)}°\nsin²θ ${f(s)} + cos²θ ${f(c)} = ${f(s + c)}`; }
      case 'radian': { const b = M.unwind(t); return `θ ${f(b / M.DEG, 1)}° = ${f(b)} rad\narc s ${f(M.arc(b))}`; }
      case 'wave': return `t ${f(a % M.TAU)}   (one turn 2π = ${f(M.TAU)})\ny = sin t ${f(Math.sin(a))}`;
      case 'tangent': { const b = M.tsway(t); return `θ ${f(b / M.DEG, 1)}°\ntan θ ${f(M.tan(b))}`; }
      case 'signs': { const sg = M.signs(a), w = v => (v > 0 ? '+' : '−'); return `θ ${f(deg(a), 1)}°  quadrant ${M.quadrant(a)}\nsin ${w(sg.sin)}  cos ${w(sg.cos)}  tan ${w(sg.tan)}`; }
    }
    return '';
  },
  // chart cursors follow the same moment the figure shows
  onFrame({ t }, sheets) {
    const a = M.steady(t), d = deg(a), b = M.sway(t), r = M.unwind(t), g = M.tsway(t);
    const put = (key, range, x, y) => moveCursor(sheets, key, RANGES[range], x, y);
    put('sin', 'sin', d, Math.sin(a)); put('cos', 'cos', d, Math.cos(a));
    put('s2', 'sq', b / M.DEG, Math.sin(b) ** 2); put('c2', 'sq', b / M.DEG, Math.cos(b) ** 2);
    put('arc', 'arc', r / M.DEG, M.arc(r));
    put('wave', 'wave', a % M.TAU, Math.sin(a));
    put('tan', 'tan', g / M.DEG, M.tan(g));
    put('sg', 'signs', d, Math.sin(a)); put('cg', 'signs', d, Math.cos(a));
  },
};
