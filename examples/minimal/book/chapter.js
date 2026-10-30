// The derivative is the slope, as a figure: pages, world, clock and readout. main.js opens it as a book.
import { SUBJECT } from '../subject.js';
import { buildWorld } from './world.js';
import { PAGES, PLATES } from './pages.js';
import * as M from './model.js';

const f = x => (x < -0.005 ? '−' : '') + Math.abs(x).toFixed(2);

export const CHAPTER = {
  subject: SUBJECT,
  no: 1, PAGES, PLATES,
  clock0: 11,   // P starts where the tour's mid-page moments keep the triangle's labels clear of the tick numbers
  lookKeys: ['tangent', 'deriv'], narrowZoom: 1.2,
  buildWorld(E) { const W = buildWorld(E); return { update: W.update, labels: W.labels }; },
  state: (clock, reduced) => ({ x: reduced ? 0.7 : M.xAt(clock) }),
  readout: s => `x ${f(s.x)}   f(x) ${f(M.f(s.x))}\nslope f′(x) ${f(M.df(s.x))}`,
};
