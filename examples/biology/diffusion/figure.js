// Figure B.1 as an explorer: predict what happens when molecules reach 50 : 50 across a porous cell membrane,
// then release them and adjust channels, thermal speed D, molecule count and random seed.
import { buildWorld } from './world.js';
import * as M from './model.js';
import { chart, samples } from '@saxster/atlas/chart.js';

let cache = null;
const experiment = p => {
  const key = `${p.n}|${p.channels}|${p.D}|${p.seed}`;
  if (!cache || cache.key !== key) cache = { key, e: M.run(p) };
  return cache.e;
};
const f = (x, d = 1) => x.toFixed(d);

export const FIGURE = {
  no: 'B.1',
  title: 'Across a cell membrane',
  question: 'How do molecules cross a membrane with no pump?',
  bigIdea: 'no molecule aims for the empty side. Each jiggles at random, but while more sit outside than inside, more stumble inward than outward — until the two sides reach 50 : 50 and crossings continue at equal rates both ways.',
  PAGES: [{ cam: { target: [0, 0.02, 0], az: -12, el: 10, dist: 15.5 }, lit: 'membrane', fig: 'A porous cell membrane' }],
  narrowZoom: 1.08,
  params: { n: 200, channels: 4, D: 1.0, seed: 1 },
  controls: [
    { key: 'channels', label: 'Open protein channels', min: 1, max: 8, step: 1, rebuild: true },
    { key: 'D', label: 'Thermal jiggling speed (D)', min: 0.4, max: 2.0, step: 0.2, fmt: v => v.toFixed(1) },
    { key: 'n', label: 'Molecules', min: 80, max: 320, step: 40, rebuild: true },
    { key: 'seed', label: 'Which run (same seed, same walk)', min: 1, max: 30, step: 1 },
  ],
  predict: {
    q: 'All 200 molecules start outside the cell (left). Once the inside and outside reach roughly 100 molecules each, what do the molecules do next?',
    choices: [
      'They keep crossing both ways at equal rates, so the 50 : 50 split holds steady',
      'They stop crossing the channels once the two sides are equal',
      'All 200 molecules continue into the cell until the outside is empty',
      'They bounce back and forth in unison between the two sides',
    ],
    answer: () => 0,
    why: p => {
      const th = M.halfTime(p.channels, p.D);
      return `Thermal motion never stops. At 50 : 50, a molecule inside is just as likely to wander through a pore as one outside, so inward and outward traffic match (dynamic equilibrium). With ${p.channels} channels and D = ${p.D.toFixed(1)}, the gap halves every ${th.toFixed(2)} s.`;
    },
  },
  run: { label: 'Release the molecules', duration: () => M.DURATION },
  buildWorld: (E, p) => { const W = buildWorld(E, p); return { update: s => W.update(s), labels: W.labels }; },
  lookKeys: [],
  state: (clock, reduced, p) => {
    const e = experiment(p), t = reduced ? M.DURATION : clock;
    return { e, t, snap: M.snapshot(e, t) };
  },
  readout: (s, p) => `t ${f(s.t, 1)} s   outside ${s.snap.outside} · inside ${s.snap.inside}\ntheory inside ${f(M.expectedIn(p.n, p.channels, p.D, s.t), 1)}`,
  chips: [
    { label: 'Outside (left)', value: s => `${s.snap.outside}` },
    { label: 'Inside (right)', value: s => `${s.snap.inside}` },
    { label: 'Theory: ½n(1 − e⁻²ᵏᵗ)', value: (s, p) => f(M.expectedIn(p.n, p.channels, p.D, s.t), 1) },
    { label: 'Crossings in / out (last 1 s)', value: s => `${s.snap.inFlow} → / ← ${s.snap.outFlow}` },
    { label: 'Half-time ln 2 / (2k)', value: (s, p) => `${f(M.halfTime(p.channels, p.D), 2)} s` },
  ],
  chart: (s, p) => {
    const e = s.e, upto = s.snap.stepIdx;
    const actual = e.series.slice(0, Math.max(2, upto + 1)).map(r => [r.t, r.inside]);
    const eqLine = { cls: 'grid', pts: [[0, p.n / 2], [M.DURATION, p.n / 2]] };
    const theory = { cls: 'trend', pts: samples(0, M.DURATION, 80, t => M.expectedIn(p.n, p.channels, p.D, t)), tag: [M.DURATION * 0.72, p.n * 0.56, 'Fick ½n(1−e⁻²ᵏᵗ)'] };
    return chart({
      x0: 0, x1: M.DURATION, y0: 0, y1: p.n, h: 185,
      xlabel: 'time t (s)', ylabel: 'molecules inside',
      label: 'Molecules inside the cell over time against Fick’s exponential approach to ½n',
      series: [eqLine, theory, { pts: actual }],
    });
  },
  PLATES: {
    membrane: {
      text: 'The yellow lipid bilayer blocks water-soluble molecules, while the blue protein channels form open water-filled pores across it. Doubling the number of open channels doubles the permeability k, cutting the equilibration half-time in half.',
    },
    molecules: {
      text: 'Each molecule’s thermal motion is a 3D random walk with mean-squared displacement ⟨Δx²⟩ = 2Dt along each axis. Fick’s first law — net flux proportional to the concentration difference (N_out − N_in) — is simply the law of large numbers acting on hundreds of independent random walks.',
    },
  },
};
