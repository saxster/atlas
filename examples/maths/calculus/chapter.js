// Chapter 2: Slope and area (Differential & Integral Calculus)
import { SUBJECT } from '../subject.js';
import { buildWorld } from './world.js';
import { PAGES, PLATES, RANGES } from './pages.js';
import { moveCursor } from '@saxster/atlas/chart.js';
import * as M from './model.js';

const fmt = (x, n = 2) => (x < -5 * 10 ** -(n + 1) ? '−' : '') + Math.abs(x).toFixed(n);

export const CHAPTER = {
  subject: SUBJECT,
  no: 2,
  PAGES,
  PLATES,
  clock0: 2.2,
  events: [15.3, 17.8, 20.3, 22.8],
  lookKeys: [],
  narrowZoom: 1.14,
  buildWorld(E) {
    const W = buildWorld(E);
    this._W = W;
    return { update: s => W.update(s.t), labels: W.labels, stateAt: W.stateAt, drag: W.drag };
  },
  state(clock, reduced) {
    const t = reduced ? 2.2 : clock;
    const st = this._W ? this._W.stateAt(t) : { h: M.hAt(t), x1: M.xSweep(t), x2: M.xCubic(t), n: M.barsAt(t), x4: M.xSweep(t), x5: M.xSweep(t) };
    return { t, ...st, secant: { h: st.h }, deriv: { x: st.x1 }, turning: { x: st.x2 } };
  },
  readout(st, page) {
    switch (page.scene) {
      case 'secant': {
        const h = st.h;
        return `h = ${fmt(h, 3)}   secant ${fmt(M.secantSlope(M.A0, h), 3)}\ntangent limit f′(1) = 1.000`;
      }
      case 'deriv': {
        const x = st.x1;
        return `x = ${fmt(x)}   f(x) = ${fmt(M.f(x))}\nslope f′(x) = ${fmt(M.df(x))}`;
      }
      case 'turning': {
        const x = st.x2;
        return `x = ${fmt(x)}   g(x) = ${fmt(M.g(x))}\nslope g′(x) = ${fmt(M.dg(x))}`;
      }
      case 'riemann': {
        const n = st.n;
        return `n = ${n} bars   sum = ${fmt(M.riemannSum(M.f, 0, 3, n, 'mid'), 3)}\nexact ∫₀³ ½x² dx = 4.500`;
      }
      case 'ftc': {
        const x = st.x4;
        return `x = ${fmt(x)}   area ∫₀ˣ t dt = ${fmt(M.f(x))}\nheight f(x) − f(0) = ${fmt(M.f(x))}`;
      }
      case 'accum': {
        const x = st.x5;
        return `x = ${fmt(x)}   rate v(x) = ${fmt(M.rateWave(x))}\nnet area ∫₀ˣ v dt = ${fmt(M.netWave(x))}`;
      }
    }
    return '';
  },
  onFrame(st, sheets) {
    const put = (key, range, x, y) => moveCursor(sheets, key, RANGES[range], x, y);
    put('sec', 'secant', st.h, M.secantSlope(M.A0, st.h));
    put('f1', 'deriv', st.x1, M.f(st.x1));
    put('df1', 'deriv', st.x1, M.df(st.x1));
    put('g2', 'turn', st.x2, M.g(st.x2));
    put('dg2', 'turn', st.x2, M.dg(st.x2));
    put('riem', 'riem', st.n, M.riemannSum(M.f, 0, 3, st.n, 'mid'));
    put('ftc', 'ftc', st.x4, M.f(st.x4));
    put('rate5', 'accum', st.x5, M.rateWave(st.x5));
    put('net5', 'accum', st.x5, M.netWave(st.x5));
  },
};
