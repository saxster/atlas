// Figure S.4 as an explorer: predict how often 95% confidence intervals falsely reject H₀ when the true effect is Δ = 0,
// then vary the true effect Δ, sample size n, and replication seed.
import { buildWorld } from './world.js';
import * as M from './model.js';
import { chart, samples } from '@saxster/atlas/chart.js';

let cache = null;
const experiment = p => {
  const key = `${p.delta}|${p.n}|${p.seed}`;
  if (!cache || cache.key !== key) cache = { key, e: M.run(p) };
  return cache.e;
};
const pct = (x, d = 1) => `${(x * 100).toFixed(d)}%`;

export const FIGURE = {
  no: 'S.4',
  title: 'Signal, noise and the 5 % line',
  question: 'When does a sample mean cross the p < 0.05 threshold — and why do small studies miss real effects or find phantom ones?',
  bigIdea: 'a two-tailed test at α = 0.05 rejects the null μ₀ = 0 whenever the sample mean falls beyond ±1.96 standard errors (±1.96 σ/√n) — which is identical to the 95 % confidence interval [x̄ − 1.96 SE, x̄ + 1.96 SE] excluding zero. Increasing n narrows both bells as 1/√n, raising statistical power to separate a true effect Δ from noise.',
  PAGES: [{ cam: { target: [-0.15, 1.15, 0], az: -8, el: 7, dist: 16.8 }, lit: 'bells', fig: 'Sampling bells H₀ vs. H₁ & 20 replicated 95% confidence intervals' }],
  narrowZoom: 1.18,
  params: { delta: 0.4, n: 25, seed: 1 },
  controls: [
    { key: 'delta', label: 'True effect Δ (in σ units)', min: 0.0, max: 1.0, step: 0.1, fmt: v => v.toFixed(1) },
    { key: 'n', label: 'Sample size n per study', min: 10, max: 100, step: 5 },
    { key: 'seed', label: 'Replication batch (seed)', min: 1, max: 25, step: 1 },
  ],
  predict: {
    q: 'Suppose the null hypothesis is completely true (true effect Δ = 0, pure noise) and 20 independent labs each run a study and compute a 95% confidence interval (testing at α = 0.05). On average, how many of those labs will get p < 0.05 and falsely claim a discovery?',
    choices: [
      'About 5% of them (1 in 20 labs on average), because 5% of sample means fall outside ±1.96 SE by chance alone',
      'Zero labs, because when Δ = 0 the sample mean is always inside the 95% interval',
      '50% of labs, because half of sample means are positive and half are negative',
      '95% of labs, because a 95% confidence interval detects noise 95% of the time',
    ],
    answer: () => 0,
    why: p => {
      const pow = M.statisticalPower(p.delta, p.n);
      return `By definition of the α = 0.05 significance level, 2.5% of each tail of H₀ lies beyond ±1.96 SE. When Δ = 0, exactly 5% of studies (1 out of 20 on average) miss 0 and produce a false positive (Type I error). At your current settings (Δ = ${p.delta.toFixed(1)}, n = ${p.n}), theoretical power is ${pct(pow, 1)}.`;
    },
  },
  run: { label: 'Run 20 replication studies', duration: () => M.DURATION },
  buildWorld: (E, p) => { const W = buildWorld(E, p); return { update: s => W.update(s), labels: W.labels }; },
  lookKeys: [],
  state: (clock, reduced, p) => {
    const e = experiment(p), t = reduced ? M.DURATION : clock;
    return { e, t, snap: M.snapshot(e, t) };
  },
  readout: s => `studies ${s.snap.k} / 20   significant (p < 0.05): ${s.snap.rejected} / ${s.snap.k}\ntheoretical power = ${pct(s.e.power, 1)}   95% CIs covering Δ: ${s.snap.covered} / ${s.snap.k}`,
  chips: [
    { label: 'Standard error σ / √n', value: s => `${s.e.se.toFixed(3)} (crit ±${s.e.crit.toFixed(3)})` },
    { label: 'Theoretical power (1 − β)', value: s => pct(s.e.power, 1) },
    { label: 'Studies rejecting H₀ (p < 0.05)', value: s => `${s.snap.rejected} / ${s.snap.k}` },
    { label: '95% CIs covering true Δ', value: s => `${s.snap.covered} / ${s.snap.k}` },
    { label: 'Latest study p-value', value: s => `p = ${s.snap.last.pVal < 0.001 ? '<0.001' : s.snap.last.pVal.toFixed(3)}` },
  ],
  chart: (s, p) => {
    // Power curve 1 − β vs sample size n ∈ [10, 100] for current true effect Δ
    const powPts = samples(10, 100, 60, nVal => M.statisticalPower(p.delta, nVal) * 100);
    const curPow = M.statisticalPower(p.delta, p.n) * 100;
    return chart({
      x0: 10, x1: 100, y0: 0, y1: 100, h: 185,
      xlabel: 'sample size n per study', ylabel: 'statistical power (%)',
      label: `Statistical power P(p < 0.05) vs. sample size n at true effect Δ = ${p.delta.toFixed(1)}`,
      marks: [[p.n, curPow, `${curPow.toFixed(1)}% at n=${p.n}`]],
      series: [
        { cls: 'grid', pts: [[10, 5], [100, 5]] },
        { cls: 'trend', pts: [[10, 80], [100, 80]], tag: [72, 84, '80% benchmark'] },
        { pts: powPts },
      ],
    });
  },
  PLATES: {
    bells: {
      text: 'Jerzy Neyman and Egon Pearson framed hypothesis testing as a trade-off between two errors: Type I error α (falsely rejecting H₀ when Δ = 0, the amber tails of area 5 %) and Type II error β (failing to reject H₀ when Δ > 0). Statistical power 1 − β is the red area of H₁ beyond the critical line +1.96 SE.',
    },
    forest: {
      text: 'Every 95 % confidence interval [x̄ − 1.96 SE, x̄ + 1.96 SE] is dual to a two-tailed α = 0.05 test: the interval fails to cover 0 if and only if |x̄| / SE > 1.96 (p < 0.05). Even when Δ > 0 is fixed, random sampling makes p-values dance wildly from study to study unless power is high.',
    },
  },
};
