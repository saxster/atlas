// Figure C.1 as an explorer: predict where a reversible reaction A ⇌ B settles when k_f = 2 k_r
// (and what happens when k_r = 0, pure radioactive decay), then run and adjust k_f, k_r, n, and seed.
import { buildWorld } from './world.js';
import * as M from './model.js';
import { chart, samples } from '@saxster/atlas/chart.js';

let cache = null;
const experiment = p => {
  const key = `${p.n}|${p.kf}|${p.kr}|${p.seed}`;
  if (!cache || cache.key !== key) cache = { key, e: M.run(p) };
  return cache.e;
};
const f = (x, d = 1) => x.toFixed(d);

export const FIGURE = {
  no: 'C.1',
  title: 'Forward, back and half-life',
  question: 'Why does a reversible reaction stop changing before the reactant runs out?',
  bigIdea: 'each blue A has a chance k_f per second to turn into red B, and each red B has a chance k_r to turn back. When k_r = 0, A decays exponentially to zero with half-life ln 2 / k_f (radioactive decay); when k_r > 0, the reaction settles where forward and reverse traffic balance: [B]/[A] = k_f / k_r = K.',
  PAGES: [{ cam: { target: [-0.15, 1.12, 0], az: -10, el: 8, dist: 16.5 }, lit: 'vessel', fig: 'Reversible reaction A ⇌ B and exponential half-life' }],
  narrowZoom: 1.16,
  params: { n: 200, kf: 0.30, kr: 0.15, seed: 1 },
  controls: [
    { key: 'kf', label: 'Forward rate k_f (s⁻¹)', min: 0.10, max: 0.60, step: 0.05, fmt: v => v.toFixed(2) },
    { key: 'kr', label: 'Reverse rate k_r (s⁻¹, 0 = decay)', min: 0.00, max: 0.30, step: 0.05, fmt: v => v.toFixed(2) },
    { key: 'n', label: 'Molecules N₀', min: 100, max: 300, step: 50, rebuild: true },
    { key: 'seed', label: 'Which run (seed)', min: 1, max: 30, step: 1 },
  ],
  predict: {
    q: 'All 200 molecules start as blue A. The forward rate is k_f = 0.30 s⁻¹ and the reverse rate is half as fast, k_r = 0.15 s⁻¹. Where do the counts of A and B settle?',
    choices: [
      'Roughly 67 A and 133 B (a 1 : 2 split matching K = k_f / k_r = 2), with reactions continuing both ways',
      '100 A and 100 B, because every equilibrium splits 50 : 50',
      '0 A and 200 B, because k_f is larger than k_r',
      'Reactions stop completely once the first half-life passes',
    ],
    answer: () => 0,
    why: p => {
      const aEq = M.eqReactant(p.n, p.kf, p.kr), bEq = M.eqProduct(p.n, p.kf, p.kr);
      const th = M.halfLife(p.kf, p.kr);
      if (p.kr === 0) {
        return `With reverse rate k_r = 0, no B ever turns back into A: this is pure exponential decay N_A(t) = N₀ e^(−k_f t) with half-life ln 2 / k_f = ${th.toFixed(2)} s.`;
      }
      return `Dynamic equilibrium is reached when forward flips per second (k_f N_A) match reverse flips (k_r N_B), so N_B / N_A = k_f / k_r = ${(p.kf / p.kr).toFixed(2)}. Out of ${p.n} molecules, that gives ${aEq.toFixed(0)} A and ${bEq.toFixed(0)} B, approached with half-time ln 2 / (k_f + k_r) = ${th.toFixed(2)} s.`;
    },
  },
  run: { label: 'Start the reaction', duration: () => M.DURATION },
  buildWorld: (E, p) => { const W = buildWorld(E, p); return { update: s => W.update(s), labels: W.labels }; },
  lookKeys: [],
  state: (clock, reduced, p) => {
    const e = experiment(p), t = reduced ? M.DURATION : clock;
    return { e, t, snap: M.snapshot(e, t) };
  },
  readout: (s, p) => `t ${f(s.t, 1)} s   A: ${s.snap.nA} · B: ${s.snap.nB}\nhalf-time ${f(M.halfLife(p.kf, p.kr), 2)} s   K = ${p.kr > 0 ? f(M.eqConstant(p.kf, p.kr), 2) : '∞'}`,
  chips: [
    { label: 'Reactant A', value: s => `${s.snap.nA}` },
    { label: 'Product B', value: s => `${s.snap.nB}` },
    { label: 'Equilibrium K = k_f / k_r', value: (s, p) => p.kr > 0 ? `${f(M.eqConstant(p.kf, p.kr), 2)} (${f(M.eqProduct(p.n, p.kf, p.kr), 0)} B : ${f(M.eqReactant(p.n, p.kf, p.kr), 0)} A)` : '∞ (pure decay)' },
    { label: 'Half-time ln 2 / (k_f + k_r)', value: (s, p) => `${f(M.halfLife(p.kf, p.kr), 2)} s` },
    { label: 'Flips A→B / B→A (last 1 s)', value: s => `${s.snap.fwdRate} → / ← ${s.snap.revRate}` },
  ],
  chart: (s, p) => {
    const e = s.e, upto = s.snap.stepIdx;
    const actualA = e.series.slice(0, Math.max(2, upto + 1)).map(r => [r.t, r.nA]);
    const actualB = e.series.slice(0, Math.max(2, upto + 1)).map(r => [r.t, r.nB]);
    const thA = { cls: 'trend', pts: samples(0, M.DURATION, 80, t => M.expectedA(p.n, p.kf, p.kr, t)), tag: [M.DURATION * 0.72, M.expectedA(p.n, p.kf, p.kr, M.DURATION) + p.n * 0.08, 'theory N_A(t)'] };
    return chart({
      x0: 0, x1: M.DURATION, y0: 0, y1: p.n, h: 185,
      xlabel: 'time t (s)', ylabel: 'molecules N_A and N_B',
      label: 'Reactant A and product B counts over time against exponential relaxation theory',
      series: [thA, { pts: actualA }, { cls: 'curve total', pts: actualB }],
    });
  },
  PLATES: {
    vessel: {
      text: 'In a first-order reaction, each molecule flips independently with a constant probability per second. Set k_r = 0 to watch pure radioactive decay N(t) = N₀ e^(−λt), where half the remaining blue nuclei decay every t_{1/2} = ln 2 / λ seconds.',
    },
    curves: {
      text: 'When k_r > 0, the gap from equilibrium decays exponentially at the combined rate λ = k_f + k_r. Once k_f N_A = k_r N_B, individual molecules still flip back and forth every second, but the macroscopic ratio [B]/[A] = k_f/k_r = K holds steady.',
    },
  },
};
