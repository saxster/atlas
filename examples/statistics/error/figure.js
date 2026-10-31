// Figure S.2 as an explorer: predict how much the standard error of the mean shrinks when you average 16× more readings,
// then run repeated measurements and adjust random noise σ, calibration bias b, sample count n, and seed.
import { buildWorld } from './world.js';
import * as M from './model.js';
import { chart, samples } from '@saxster/atlas/chart.js';

let cache = null;
const experiment = p => {
  const key = `${p.n}|${p.sigma}|${p.bias}|${p.seed}`;
  if (!cache || cache.key !== key) cache = { key, e: M.run(p) };
  return cache.e;
};
const f = (x, d = 2) => x.toFixed(d);

export const FIGURE = {
  no: 'S.2',
  title: 'Repeated readings and the bell of error',
  question: 'How does averaging noisy readings sharpen a measurement — and what can’t it fix?',
  bigIdea: 'individual readings scatter around μ + bias as a normal bell curve of width σ. Averaging n independent readings cancels positive and negative random slips so the sample mean’s uncertainty shrinks as σ / √n — but a systematic calibration bias never averages out.',
  PAGES: [{ cam: { target: [0.0, 1.15, 0], az: -8, el: 7, dist: 16.5 }, lit: 'bell', fig: 'Repeated measurements piling into Gauss’s error curve' }],
  narrowZoom: 1.16,
  params: { n: 160, sigma: 2.0, bias: 0.0, seed: 1 },
  controls: [
    { key: 'sigma', label: 'Random noise σ (mm)', min: 1.0, max: 3.0, step: 0.5, fmt: v => v.toFixed(1) },
    { key: 'bias', label: 'Systematic bias b (mm)', min: -1.5, max: 1.5, step: 0.5, fmt: v => (v >= 0 ? '+' : '') + v.toFixed(1) },
    { key: 'n', label: 'Readings n', min: 40, max: 240, step: 40, rebuild: true },
    { key: 'seed', label: 'Which run (seed)', min: 1, max: 30, step: 1 },
  ],
  predict: {
    q: 'A single reading has random error σ = 2.00 mm (for 10 readings, the standard error of the average is 2 / √10 ≈ 0.63 mm). If you take 16× as many readings (n = 160, with zero bias), how wide is the standard error σ / √n of their average?',
    choices: [
      'One-quarter as wide: σ / √160 ≈ 0.16 mm, because uncertainty shrinks with √n',
      'One-sixteenth as wide: 0.04 mm, shrinking in direct proportion to n',
      'Still 2.00 mm, because taking more readings does not change the instrument',
      'Zero: 160 readings always give the exact true value 100.00 mm',
    ],
    answer: () => 0,
    why: p => {
      const se = M.standardError(p.sigma, p.n);
      return `Variances of independent readings add, so Var(x̄) = σ² / n and the standard error of the sample mean is σ / √n. Multiplying n by 16 divides the standard error by √16 = 4. For σ = ${p.sigma.toFixed(1)} mm and n = ${p.n}, σ / √n = ${se.toFixed(2)} mm.`;
    },
  },
  run: { label: 'Take the readings', duration: () => M.DURATION },
  buildWorld: (E, p) => { const W = buildWorld(E, p); return { update: s => W.update(s), labels: W.labels }; },
  lookKeys: [],
  state: (clock, reduced, p) => {
    const e = experiment(p), t = reduced ? M.DURATION : clock;
    return { e, t, snap: M.snapshot(e, t) };
  },
  readout: (s, p) => `k = ${s.snap.k} / ${p.n} readings   mean x̄ = ${f(s.snap.mean)} mm\nSE = σ/√k = ${f(s.snap.se)} mm   true μ = 100.00 mm`,
  chips: [
    { label: 'Readings taken (k)', value: (s, p) => `${s.snap.k} / ${p.n}` },
    { label: 'Sample mean x̄', value: s => `${f(s.snap.mean)} mm` },
    { label: 'Sample spread s', value: s => `${f(s.snap.sd)} mm (σ = ${f(s.e.sigma, 1)})` },
    { label: 'Standard error σ / √k', value: s => `±${f(s.snap.se)} mm` },
    { label: 'Error from true μ (x̄ − 100)', value: s => `${s.snap.errFromTrue >= 0 ? '+' : ''}${f(s.snap.errFromTrue)} mm` },
  ],
  chart: (s, p) => {
    const e = s.e, kMax = s.snap.k;
    // Running sample mean x̄_k as k grows from 1 to kMax, inside the funnel μ + bias ± σ/√k
    const meanPts = [];
    let sum = 0;
    for (let i = 0; i < kMax; i++) {
      sum += e.readings[i].raw;
      meanPts.push([i + 1, sum / (i + 1)]);
    }
    const center = M.TRUE_MU + p.bias;
    const upper = samples(2, p.n, 60, k => center + M.standardError(p.sigma, k));
    const lower = samples(2, p.n, 60, k => center - M.standardError(p.sigma, k));
    return chart({
      x0: 1, x1: p.n, y0: M.TRUE_MU - 3.5, y1: M.TRUE_MU + 3.5, h: 185,
      xlabel: 'number of readings k', ylabel: 'running mean x̄_k (mm)',
      label: 'Running sample mean converging inside the ±σ/√k standard-error funnel',
      series: [
        { cls: 'grid', pts: [[1, M.TRUE_MU], [p.n, M.TRUE_MU]] },
        { cls: 'trend', pts: upper, tag: [p.n * 0.72, center + M.standardError(p.sigma, p.n * 0.72) + 0.55, 'μ + b ± σ/√k'] },
        { cls: 'trend', pts: lower },
        { pts: meanPts },
      ],
    });
  },
  PLATES: {
    bell: {
      text: 'Gauss derived the normal curve N(μ, σ²) in 1809 to model astronomical measurement errors: when each reading is nudged by many tiny independent disturbances, the Central Limit Theorem shapes their histogram into exp(−(x − μ)² / 2σ²). About 68 % of readings fall within ±1σ and 95 % within ±2σ.',
    },
    mean: {
      text: 'Precision vs. accuracy: increasing n narrows the red ±σ/√k error bar (higher precision), whereas sliding the systematic bias b shifts the entire bell curve away from the green true-value line μ = 100.0 mm (lower accuracy).',
    },
  },
};
