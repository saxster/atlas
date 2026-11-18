// Figure S.5 as an explorer: predict why small replications (n ≈ 240) flicker when true d = 0.22 while N = 1,457 meta-analysis resolves it,
// and explore how effort-contingent reinforcement lifts voluntary challenge-seeking across 50 unrewarded transfer trials.
import { buildWorld } from './world.js';
import * as M from './model.js';
import { chart, samples } from '@saxster/atlas/chart.js';

let cache = null;
const experiment = p => {
  const key = `${p.trueD}|${p.vLearned}|${p.seed}`;
  if (!cache || cache.key !== key) cache = { key, e: M.run(p) };
  return cache.e;
};
const pct = (x, d = 1) => `${(x * 100).toFixed(d)}%`;

export const FIGURE = {
  no: 'S.5',
  title: 'Rewarding effort & pooling replications',
  question: 'Why did four n ≈ 240 studies flicker around p = 0.05 while N = 1,457 resolved d = 0.22 — and what happens to hard-task choice when effort itself is reinforced?',
  bigIdea: 'for a real standardized effect d = 0.22, a single study of n = 240 has SE ≈ 0.13 and only ~40 % two-tailed power, so over half of honest replications cross zero by sampling noise alone. Pooling all five replications (N = 1,457) cuts SE to 0.052 (> 98 % power), revealing that reinforcing cognitive effort raises voluntary challenge-seeking and buffers the late-session fatigue slump even after all external rewards stop (Clay et al., PNAS 2022).',
  PAGES: [{ cam: { target: [-0.15, 1.15, 0], az: -7, el: 7, dist: 16.9 }, lit: 'meta', fig: '5-study meta-analysis forest plot (N = 1,457) & 50-trial voluntary demand curve' }],
  narrowZoom: 1.18,
  params: { trueD: 0.22, vLearned: 0.35, seed: 1 },
  controls: [
    { key: 'trueD', label: 'True transfer effect d (SD units)', min: 0.0, max: 0.50, step: 0.02, fmt: v => v.toFixed(2) },
    { key: 'vLearned', label: 'Learned effort value v_learned', min: 0.0, max: 0.70, step: 0.05, fmt: v => v.toFixed(2) },
    { key: 'seed', label: 'Replication draw (seed)', min: 1, max: 20, step: 1 },
  ],
  predict: {
    q: 'Suppose rewarding cognitive effort truly boosts unrewarded challenge-seeking by d = 0.22 SD, and four labs each test n = 240 people at α = 0.05. Roughly how often will an individual n = 240 study cross p < 0.05 — and what happens when all five studies (N = 1,457) are pooled?',
    choices: [
      'Each n = 240 study has only ~40% power (so mixed p-values are expected), while pooling N = 1,457 shrinks SE by √6 and achieves > 98% power',
      'Every n = 240 study is guaranteed to get p < 0.05 whenever d > 0',
      'Mixed p-values across four studies prove the true effect must be exactly d = 0',
      'Pooling studies never narrows a 95% confidence interval',
    ],
    answer: () => 0,
    why: p => {
      const pow240 = M.twoTailedPowerForD(p.trueD, 240);
      const powPool = M.twoTailedPowerForD(p.trueD, M.TOTAL_N);
      return `At d = ${p.trueD.toFixed(2)}, a single n = 240 study has SE ≈ 0.129, so 1.96 × SE ≈ 0.253 is wider than the true effect itself — giving just ${pct(pow240, 1)} power! Pooling N = 1,457 shrinks SE to ~0.052 (${pct(powPool, 1)} power), separating signal from sampling noise.`;
    },
  },
  run: { label: 'Sweep 50 unrewarded transfer trials', duration: () => M.DURATION },
  buildWorld: (E, p) => { const W = buildWorld(E, p); return { update: s => W.update(s), labels: W.labels }; },
  lookKeys: [],
  state: (clock, reduced, p) => {
    const e = experiment(p), t = reduced ? M.DURATION : clock;
    return { e, t, snap: M.snapshot(e, t) };
  },
  readout: s => `trial ${s.snap.trialIndex}/50 · effort ${s.snap.curExp.toFixed(2)} vs ctrl ${s.snap.curCtrl.toFixed(2)}\npooled d̂ = ${s.e.meta.pooledD.toFixed(2)} [${s.e.meta.ciLo.toFixed(2)}, ${s.e.meta.ciHi.toFixed(2)}] (z = ${s.e.meta.z.toFixed(2)})`,
  chips: [
    { label: 'Single-study power (n = 240)', value: s => pct(s.e.single240Power, 1) },
    { label: 'Pooled power (N = 1,457)', value: s => pct(s.e.pooledPower, 1) },
    { label: 'Pooled d̂ (95% CI)', value: s => `${s.e.meta.pooledD.toFixed(2)} [${s.e.meta.ciLo.toFixed(2)}, ${s.e.meta.ciHi.toFixed(2)}]` },
    { label: 'Mean transfer level (Exp vs Ctrl)', value: s => `${s.e.meanExp.toFixed(2)} vs ${s.e.meanCtrl.toFixed(2)}` },
    { label: 'Optimal unrewarded level L*', value: s => s.e.lStarExp.toFixed(2) },
  ],
  chart: (s, p) => {
    // Unrewarded net control value V_net(L) across demand levels L ∈ [1, 5]
    const expValPts = samples(1, 5, 60, L => M.netControlValue(L, p.vLearned));
    const ctrlValPts = samples(1, 5, 60, L => M.netControlValue(L, 0.0));
    const lStar = M.optimalTransferDemand(p.vLearned);
    const vPeak = M.netControlValue(lStar, p.vLearned);
    return chart({
      x0: 1, x1: 5, y0: -0.2, y1: 2.6, h: 185,
      xlabel: 'voluntary math demand level L (zero external reward)', ylabel: 'net value V(L)',
      label: `Unrewarded net control value V(L) at learned effort valuation v = ${p.vLearned.toFixed(2)}`,
      marks: [[lStar, vPeak, `L* = ${lStar.toFixed(2)}`]],
      series: [
        { cls: 'grid', pts: [[1, 0], [5, 0]] },
        { cls: 'trend', pts: ctrlValPts, tag: [3.8, M.netControlValue(3.8, 0.0) - 0.25, 'control (v = 0)'] },
        { pts: expValPts },
      ],
    });
  },
  PLATES: {
    meta: {
      text: 'When a genuine psychological effect is modest (d = 0.22), individual studies of n ≈ 240 have only ~40 % statistical power: random sampling noise makes p-values flicker above and below 0.05 across replications. Inverse-variance meta-analysis weights each study by 1 / SE² across N = 1,457 participants, shrinking uncertainty until the underlying signal stands clear.',
    },
    transfer: {
      text: 'When grades or rewards depend solely on right answers, harder tasks carry higher failure rates — conditioning mental strain as a warning to stop. Reinforcing mobilized effort itself flips cognitive strain into a secondary reinforcer, raising voluntary challenge selection and buffering late-session fatigue even after external rewards end.',
    },
  },
};
