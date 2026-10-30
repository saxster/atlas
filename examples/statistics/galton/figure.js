// Figure S.1 as an explorer: predict where 500 balls land, drop them, then change the board and try to break the bell.
import { buildWorld } from './world.js';
import * as M from './model.js';
import { binomial } from './rand.js';
import { chart } from '@saxster/atlas/chart.js';

// one experiment per setting, made once: the run is the expensive part, the frames only read it
let cache = null;
const experiment = p => { const key = `${p.rows}|${p.p}|${p.n}|${p.seed}`; if (!cache || cache.key !== key) cache = { key, e: M.run(p) }; return cache.e; };
const f = (x, d = 2) => x.toFixed(d);

export const FIGURE = {
  no: 'S.1', title: 'Where 500 balls land', question: 'Where do 500 balls land?',
  bigIdea: 'each ball\'s fall is a string of coin tosses, one at every peg. No single ball can be predicted, but add up hundreds and the pile always takes the same bell shape, centred on rows × p.',
  // the view frames the whole board, whose height follows the settings (taller slots for taller piles)
  PAGES: p => { const T = M.top(p.rows, p.p, p.n) + 0.6, w = (p.rows + 2) * M.DX; return [{ cam: { target: [0, T / 2, 0], az: 0, el: 4, dist: 1.25 * Math.max(T, w * 0.9) / Math.tan(9 * Math.PI / 180) / 2 }, lit: 'pile', fig: 'A Galton board' }]; },
  narrowZoom: 0.65,   // a tall board: the stage's portrait allowance (made for wide scenes) stands it too far back
  params: { rows: 12, p: 0.5, n: 500, seed: 1 },
  controls: [
    { key: 'rows', label: 'Rows of pegs', min: 4, max: 16, step: 1, rebuild: true },
    { key: 'p', label: 'Chance of bouncing right', min: 0.1, max: 0.9, step: 0.05, fmt: v => v.toFixed(2), rebuild: true },
    { key: 'n', label: 'Balls', min: 100, max: 1000, step: 100, rebuild: true },
    { key: 'seed', label: 'Which run (the same number, the same pile)', min: 1, max: 50, step: 1 },
  ],
  predict: {
    q: 'Drop 500 balls through 12 rows of pegs. Each ball is equally likely to bounce left or right at every peg. Which slot ends up with the most balls?',
    choices: ['The middle slot', 'A slot off to one side', 'The two slots at the edges', 'All the slots get about the same'],
    answer: p => { const k = M.mode(p.rows, p.p); return k === 0 || k === p.rows ? 2 : Math.abs(k - p.rows / 2) < 0.6 ? 0 : 1; },
    why: p => {
      const k = M.mode(p.rows, p.p), ways = Math.round(binomial(p.rows, k));
      return `To land in slot ${k} a ball needs ${k} rights and ${p.rows - k} lefts, in any order, and there are ${ways.toLocaleString('en-IN')} such orders. ` +
        `An edge slot needs every bounce the same way: one order. ` + (p.p === 0.5 ? `With left and right equally likely, every order is equally likely, so slot ${k} gets about ${(100 * M.pmf(p.rows, p.p, k)).toFixed(1)} % of the balls and an edge almost none.`
          : `With a chance of ${p.p.toFixed(2)} of going right, the pile centres on rows × p = ${(p.rows * p.p).toFixed(1)}: slot ${k} is the most likely, with ${(100 * M.pmf(p.rows, p.p, k)).toFixed(1)} % of the balls.`);
    },
  },
  run: { label: 'Drop the balls', duration: p => M.duration(p) },
  buildWorld: (E, p) => { const W = buildWorld(E, p); return { update: s => W.update(s), labels: W.labels }; },
  lookKeys: [],
  state: (clock, reduced, p) => { const e = experiment(p), t = reduced ? M.duration(p) : clock; return { e, t, pile: M.pileAt(e, t), showBell: t > 0 }; },
  readout: s => `landed ${s.pile.landed} of ${s.e.n}\nmean ${f(s.pile.mean)} rights   theory ${f(M.theoryMean(s.e.rows, s.e.p))}`,
  chips: [
    { label: 'Balls landed', value: s => `${s.pile.landed}` },
    { label: 'Mean rights', value: s => s.pile.landed ? f(s.pile.mean) : '–' },
    { label: 'Theory: rows × p', value: s => f(M.theoryMean(s.e.rows, s.e.p)) },
    { label: 'Spread (variance)', value: s => s.pile.landed > 1 ? f(s.pile.variance) : '–' },
    { label: 'Theory: rows × p × (1 − p)', value: s => f(M.theoryVar(s.e.rows, s.e.p)) },
  ],
  chart: s => {
    const e = s.e, ex = M.expected(e.rows, e.p, e.n), top = Math.ceil(Math.max(...ex, ...s.pile.counts) / 20) * 20 || 20;
    const bars = s.pile.counts.map((c, k) => ({ cls: 'bar', pts: [[k - 0.4, 0], [k - 0.4, c], [k + 0.4, c], [k + 0.4, 0]] }));
    return chart({ x0: -0.5, x1: e.rows + 0.5, y0: 0, y1: top, h: 190, xlabel: 'number of rights (the slot)', ylabel: 'balls', label: 'Balls in each slot against the binomial expectation',
      series: [...bars, { cls: 'trend', pts: ex.map((c, k) => [k, c]), tag: [M.mode(e.rows, e.p), ex[M.mode(e.rows, e.p)], 'expected'] }] });
  },
  PLATES: {
    pegs: { text: 'At every peg the ball goes right or left. Each bounce is like a coin toss: it cannot be predicted, and it does not remember the bounce before. The slot a ball ends in is simply how many times it went right.' },
    pile: { text: 'The pile counts how many balls took each number of rights. There are many more ways to get a middle number of rights than an extreme one, so the middle fills fastest. This is the binomial distribution; with many rows it looks like the normal "bell" curve, which is why that curve turns up wherever many small random pushes add together.' },
  },
};
