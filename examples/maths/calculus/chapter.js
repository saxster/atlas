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
    return { update: s => W.update(s.t), labels: W.labels };
  },
  state: (clock, reduced) => ({ t: reduced ? 2.2 : clock }),
  readout({ t }, page) {
    switch (page.scene) {
      case 'secant': {
        const h = M.hAt(t);
        return `h = ${fmt(h, 3)}   secant ${fmt(M.secantSlope(M.A0, h), 3)}\ntangent limit f′(1) = 1.000`;
      }
      case 'deriv': {
        const x = M.xSweep(t);
        return `x = ${fmt(x)}   f(x) = ${fmt(M.f(x))}\nslope f′(x) = ${fmt(M.df(x))}`;
      }
      case 'turning': {
        const x = M.xCubic(t);
        return `x = ${fmt(x)}   g(x) = ${fmt(M.g(x))}\nslope g′(x) = ${fmt(M.dg(x))}`;
      }
      case 'riemann': {
        const n = M.barsAt(t);
        return `n = ${n} bars   sum = ${fmt(M.riemannSum(M.f, 0, 3, n, 'mid'), 3)}\nexact ∫₀³ ½x² dx = 4.500`;
      }
      case 'ftc': {
        const x = M.xSweep(t);
        return `x = ${fmt(x)}   area ∫₀ˣ t dt = ${fmt(M.f(x))}\nheight f(x) − f(0) = ${fmt(M.f(x))}`;
      }
      case 'accum': {
        const x = M.xSweep(t);
        return `x = ${fmt(x)}   rate v(x) = ${fmt(M.rateWave(x))}\nnet area ∫₀ˣ v dt = ${fmt(M.netWave(x))}`;
      }
    }
    return '';
  },
  onFrame({ t }, sheets) {
    const put = (key, range, x, y) => moveCursor(sheets, key, RANGES[range], x, y);
    const h = M.hAt(t), x = M.xSweep(t), xc = M.xCubic(t), n = M.barsAt(t);
    put('sec', 'secant', h, M.secantSlope(M.A0, h));
    put('f1', 'deriv', x, M.f(x));
    put('df1', 'deriv', x, M.df(x));
    put('g2', 'turn', xc, M.g(xc));
    put('dg2', 'turn', xc, M.dg(xc));
    put('riem', 'riem', n, M.riemannSum(M.f, 0, 3, n, 'mid'));
    put('ftc', 'ftc', x, M.f(x));
    put('rate5', 'accum', x, M.rateWave(x));
    put('net5', 'accum', x, M.netWave(x));
  },
};
