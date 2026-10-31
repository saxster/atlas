// Figure S.3 as an explorer: predict why a 95% accurate screening test at 2% disease prevalence gives only a ~28%
// chance of actually having the condition, then vary prevalence p, sensitivity, and false-positive rate.
import { buildWorld } from './world.js';
import * as M from './model.js';
import { chart, samples } from '@saxster/atlas/chart.js';

let cache = null;
const experiment = p => {
  const key = `${p.p}|${p.sens}|${p.fp}|${p.seed}`;
  if (!cache || cache.key !== key) cache = { key, e: M.run(p) };
  return cache.e;
};
const pct = (x, d = 1) => `${(x * 100).toFixed(d)}%`;

export const FIGURE = {
  no: 'S.3',
  title: 'Why a 95 % accurate test can still be mostly wrong',
  question: 'If a rare disease affects 2 % of people and a 95 % accurate test comes back positive, what is the chance you actually have it?',
  bigIdea: 'Bayes’ theorem weighs true positives against false positives across the whole population: P(D | +) = p·sens / (p·sens + (1 − p)·fp). When a condition is rare (p = 2 %), the 980 healthy people generate 49 false alarms that outnumber the 19 true catches more than 2-to-1 — leaving P(D | +) = 19 / 68 ≈ 27.9 %.',
  PAGES: [{ cam: { target: [0.05, 1.15, 0], az: -8, el: 7, dist: 16.8 }, lit: 'square', fig: 'Bayes’ unit square & isolated positive tests' }],
  narrowZoom: 1.16,
  params: { p: 0.02, sens: 0.95, fp: 0.05, seed: 1 },
  controls: [
    { key: 'p', label: 'Base rate (prevalence p)', min: 0.01, max: 0.30, step: 0.01, fmt: v => `${Math.round(v * 100)}%` },
    { key: 'sens', label: 'Sensitivity P(+ | D)', min: 0.70, max: 0.99, step: 0.01, fmt: v => `${Math.round(v * 100)}%` },
    { key: 'fp', label: 'False-positive rate P(+ | ¬D)', min: 0.01, max: 0.20, step: 0.01, fmt: v => `${Math.round(v * 100)}%` },
    { key: 'seed', label: 'Cohort shuffle (seed)', min: 1, max: 20, step: 1 },
  ],
  predict: {
    q: 'Out of 1,000 people, 2% (20 people) have a condition and 98% (980 people) are healthy. A test has 95% sensitivity (catches 19 of the 20 sick) and a 5% false-positive rate (flags 49 of the 980 healthy). If you test positive, what is the probability P(D | +) that you actually have the condition?',
    choices: [
      'About 28% (19 out of 68 positive tests), because 49 false alarms outnumber the 19 true catches',
      '95%, because the test is 95% sensitive and 95% specific',
      '90%, subtracting the 5% false-positive rate and 5% false-negative rate from 100%',
      '2%, because a noisy test cannot change the base rate',
    ],
    answer: () => 0,
    why: p => {
      const exp = M.expectedCounts(p.p, p.sens, p.fp, 1000);
      return `Out of 1,000 people, ${exp.diseased.toFixed(0)} have the condition and ${exp.tp.toFixed(1)} test positive (TP). Meanwhile ${exp.healthy.toFixed(0)} are healthy and ${exp.fp.toFixed(1)} of them also test positive (FP). Among all ${(exp.tp + exp.fp).toFixed(1)} positive results, the true-positive share is TP / (TP + FP) = ${pct(exp.ppv, 1)}.`;
    },
  },
  run: { label: 'Screen 1,000 people', duration: () => M.DURATION },
  buildWorld: (E, p) => { const W = buildWorld(E, p); return { update: s => W.update(s), labels: W.labels }; },
  lookKeys: [],
  state: (clock, reduced, p) => {
    const e = experiment(p), t = reduced ? M.DURATION : clock;
    return { e, t, snap: M.snapshot(e, t) };
  },
  readout: s => `screened ${s.snap.k} / 1,000   TP = ${s.snap.tp} · FP = ${s.snap.fp}\nposterior P(D | +) = ${pct(s.snap.ppv, 1)} (theory ${pct(s.e.exp.ppv, 1)})`,
  chips: [
    { label: 'Screened cohort', value: s => `${s.snap.k} / 1,000` },
    { label: 'True Positives (TP)', value: s => `${s.snap.tp} (expected ${s.e.exp.tp.toFixed(1)})` },
    { label: 'False Positives (FP)', value: s => `${s.snap.fp} (expected ${s.e.exp.fp.toFixed(1)})` },
    { label: 'Likelihood ratio LR+ = sens / fp', value: (_, p) => `${M.likelihoodRatioPos(p.sens, p.fp).toFixed(1)}×` },
    { label: 'Posterior P(D | +)', value: s => `${pct(s.snap.ppv, 1)} (exact ${pct(s.e.exp.ppv, 1)})` },
  ],
  chart: (s, p) => {
    // Posterior P(D | +) as a function of base rate p ∈ [1%, 30%] for current sens and fp
    const curvePts = samples(1, 30, 60, uPct => M.posteriorGivenPos(uPct / 100, p.sens, p.fp) * 100);
    const curX = p.p * 100;
    const curY = M.posteriorGivenPos(p.p, p.sens, p.fp) * 100;
    return chart({
      x0: 0, x1: 30, y0: 0, y1: 100, h: 185,
      xlabel: 'base rate / prevalence p (%)', ylabel: 'posterior P(D | +) (%)',
      label: 'Posterior probability P(D | +) vs. base rate p for current sensitivity and false-positive rate',
      marks: [[curX, curY, `${curY.toFixed(1)}%`]],
      series: [
        { cls: 'grid', pts: [[curX, 0], [curX, curY]] },
        { cls: 'trend', pts: [[0, p.sens * 100], [30, p.sens * 100]], tag: [22, p.sens * 100 - 8, `sensitivity ${Math.round(p.sens * 100)}%`] },
        { pts: curvePts, tag: [Math.min(22, curX + 2.5), Math.min(92, curY + 8), `P(D|+)`] },
      ],
    });
  },
  PLATES: {
    square: {
      text: 'Thomas Bayes (1763) and Pierre-Simon Laplace showed that evidence never acts in a vacuum — it updates a prior base rate. Geometrically, the unit square has area 1: the narrow left strip of width p holds everyone with the condition, while the wide right region of width 1 − p holds everyone without it.',
    },
    posterior: {
      text: 'Conditioning on a positive test (+) discards the negative regions (FN and TN) and renormalizes the two positive blocks: P(D | +) = Area(TP) / [Area(TP) + Area(FP)]. In odds form, Posterior Odds = Prior Odds × (Sensitivity / False-Positive Rate).',
    },
  },
};
