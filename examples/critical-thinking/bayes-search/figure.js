import { buildWorld } from './world.js';
import * as M from './model.js';
import { chart, samples } from '@saxster/atlas/chart.js';

let cache = null;
const experiment = p => {
  const key = `${p.priorA}|${p.pd}|${p.sweepsOnA}|${p.buggy}`;
  if (!cache || cache.key !== key) cache = { key, e: M.run(p) };
  return cache.e;
};
const pct = x => `${(x * 100).toFixed(1)}%`;

export const FIGURE = {
  no: 'CT.5',
  title: 'Bayesian search & mean reversion',
  question: 'When an imperfect sonar sweep finds nothing in the primary zone, why was AF447 eventually found inside the area already searched?',
  bigIdea: 'Absence of evidence under imperfect detection Pd < 1 lowers a cell’s posterior probability by factor (1 − Pd) without dropping it to zero. During the 2009–2011 search for Air France 447, Bayesian updating by Metron preserved non-zero probability inside previously swept sectors where earlier sonar passes had missed the debris.',
  PAGES: [{ cam: { target: [0, 1.05, 0], az: -8, el: 13, dist: 15.2 }, lit: 'grid', fig: '4-sector Atlantic Bayesian search probability surface' }],
  narrowZoom: 1.15,
  params: { priorA: 0.55, pd: 0.70, sweepsOnA: 2, buggy: 0 },
  controls: [
    { key: 'priorA', label: 'Initial prior P(wreck in Zone A)', min: 0.25, max: 0.85, step: 0.05, fmt: v => `${Math.round(v * 100)}%` },
    { key: 'pd', label: 'Sonar sweep detection accuracy Pd', min: 0.30, max: 0.95, step: 0.05, fmt: v => `${Math.round(v * 100)}%` },
    { key: 'sweepsOnA', label: 'Failed sweeps completed on Zone A', min: 0, max: 5, step: 1 },
    { key: 'buggy', label: 'Updating rule', min: 0, max: 1, step: 1, fmt: v => v ? 'Buggy: Cross Out Cleared Zone (0%)' : 'Bayes: Scale by (1 − Pd)^k' },
  ],
  predict: {
    q: 'A wreck has a 55% chance of lying in Zone A. A sonar sweep with 70% detection probability searches Zone A and finds nothing. What should your updated probability for Zone A be?',
    choices: [
      'About 27%, because a 30% miss likelihood leaves non-zero probability compared to 45% elsewhere',
      'Exactly 0% — Zone A was searched and cleared',
      'Still 55% — an unsuccessful search gives zero information',
      '85% — failing to find it makes Zone A more likely',
    ],
    answer: () => 0,
    why: p => {
      const s = M.searchUpdate({ priorA: p.priorA, pd: p.pd, sweepsOnA: 1 });
      return `By Bayes’ theorem, 1 missed sweep with Pd = ${pct(p.pd)} shrinks Zone A’s likelihood to (1 − Pd) = ${pct(1 - p.pd)}, giving posterior P(A | miss) = ${pct(s.postA)} — smaller, yet far from zero.`;
    },
  },
  run: { label: 'Sweep Zone A & update map', duration: () => M.DURATION },
  buildWorld: (E, p) => buildWorld(E, p),
  lookKeys: [],
  state: (clock, reduced, p) => {
    const e = experiment(p), t = reduced ? M.DURATION : clock;
    return { e, t, snap: M.snapshot(e, t) };
  },
  readout: s => `sweeps on A: ${s.snap.stepSweeps.toFixed(1)} | Pd=${pct(s.e.pd)}\nP(A|misses)=${pct(s.e.buggy && s.snap.stepSweeps > 0.1 ? 0 : s.snap.postA)} · P(each other)=${pct(s.snap.postEachOther)}`,
  chips: [
    { label: 'Posterior Zone A', value: s => pct(s.e.buggy && s.snap.stepSweeps > 0.1 ? 0 : s.snap.postA) },
    { label: 'Posterior Zones B / C / D (each)', value: s => pct(s.snap.postEachOther) },
    { label: 'Cumulative probability searched', value: s => pct(s.snap.pFoundAfterK) },
    { label: 'Speed-camera mean reversion', value: s => `${s.e.reg.extremeSpike} -> ${s.e.reg.expectedNextNatural.toFixed(1)} naturally` },
    { label: 'Rule summary', value: () => 'Absent ≠ Zero when Pd < 1' },
  ],
  chart: (s, p) => {
    const pts = samples(0, 5, 25, k => M.searchUpdate({ priorA: p.priorA, pd: p.pd, sweepsOnA: k }).postA * 100);
    const curY = s.snap.postA * 100;
    return chart({
      x0: 0, x1: 5, y0: 0, y1: 100, h: 180,
      xlabel: 'failed sweeps on Zone A', ylabel: 'posterior P(Zone A) (%)',
      label: 'Posterior decay of Zone A across consecutive unsuccessful sonar passes',
      marks: [[s.snap.stepSweeps, curY, `${curY.toFixed(1)}%`]],
      series: [
        { cls: 'trend', pts: [[0, 100 / 4], [5, 100 / 4]], tag: [3.2, 29, 'uniform 25%'] },
        { pts },
      ],
    });
  },
  PLATES: {
    grid: { text: 'Metron’s 2011 Bayesian search plan assigned explicit probability weights to prior acoustic, drift, and visual sweeps. Re-searching high-prior grid squares located the Air France 447 wreckage in 3,900 m of water.' },
  },
};
