// Pure mathematical and stochastic model for Figure S.3: Bayes' Theorem — Geometric Area & Tree Updating.
// Covers prior prevalence p = P(D), sensitivity s = P(+|D), false-positive rate f = P(+|¬D),
// posterior probability P(D|+), odds-ratio updating, and cohort simulation of N = 1,000 individuals.
// Zero DOM, zero Three.js imports.
import { rng } from '@saxster/atlas/rng.js';

export const N_COHORT = 1000;
export const DURATION = 5.0; // seconds for the full run

// Joint probabilities of the 4 quadrants: TP, FN, FP, TN
export function jointProbs(p = 0.02, sens = 0.95, fp = 0.05) {
  const tp = p * sens;
  const fn = p * (1 - sens);
  const fpProb = (1 - p) * fp;
  const tn = (1 - p) * (1 - fp);
  return { tp, fn, fp: fpProb, tn };
}

// Total probability of a positive test P(+) = p·sens + (1 − p)·fp
export function probPositive(p = 0.02, sens = 0.95, fp = 0.05) {
  return p * sens + (1 - p) * fp;
}

// Exact Bayes' theorem: P(D | +) = P(+ | D) P(D) / P(+)
export function posteriorGivenPos(p = 0.02, sens = 0.95, fp = 0.05) {
  const pPos = probPositive(p, sens, fp);
  return pPos > 0 ? (p * sens) / pPos : 0;
}

// Posterior probability given a negative test: P(D | −) = p·(1 − sens) / (p·(1 − sens) + (1 − p)·(1 − fp))
export function posteriorGivenNeg(p = 0.02, sens = 0.95, fp = 0.05) {
  const pNeg = 1 - probPositive(p, sens, fp);
  return pNeg > 0 ? (p * (1 - sens)) / pNeg : 0;
}

// Prior odds P(D) / P(¬D), positive likelihood ratio LR+ = sens / fp, and posterior odds
export function priorOdds(p = 0.02) {
  return p / (1 - p);
}

export function likelihoodRatioPos(sens = 0.95, fp = 0.05) {
  return sens / fp;
}

export function posteriorOddsPos(p = 0.02, sens = 0.95, fp = 0.05) {
  return priorOdds(p) * likelihoodRatioPos(sens, fp);
}

// Expected counts in a cohort of N = 1,000 people
export function expectedCounts(p = 0.02, sens = 0.95, fp = 0.05, N = N_COHORT) {
  const j = jointProbs(p, sens, fp);
  return {
    N,
    diseased: N * p,
    healthy: N * (1 - p),
    tp: N * j.tp,
    fn: N * j.fn,
    fp: N * j.fp,
    tn: N * j.tn,
    posTotal: N * (j.tp + j.fp),
    ppv: posteriorGivenPos(p, sens, fp),
  };
}

// Deterministic cohort simulation of N individuals screened over DURATION seconds
export function run({ p = 0.02, sens = 0.95, fp = 0.05, seed = 1 } = {}) {
  const rand = rng(seed * 313 + Math.round(p * 1000) * 19 + Math.round(sens * 1000) * 7 + Math.round(fp * 1000) * 3);
  const exp = expectedCounts(p, sens, fp, N_COHORT);
  // Exact integer counts matching expected proportions closely, shuffled across the run
  const nTP = Math.round(exp.tp);
  const nFN = Math.round(exp.diseased) - nTP;
  const nFP = Math.round(exp.fp);
  const nTN = N_COHORT - nTP - nFN - nFP;

  const pool = [];
  for (let i = 0; i < nTP; i++) pool.push('tp');
  for (let i = 0; i < nFN; i++) pool.push('fn');
  for (let i = 0; i < nFP; i++) pool.push('fp');
  for (let i = 0; i < nTN; i++) pool.push('tn');

  // Fisher–Yates shuffle with seeded RNG
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand.next() * (i + 1));
    const tmp = pool[i];
    pool[i] = pool[j];
    pool[j] = tmp;
  }

  return { p, sens, fp, seed, pool, target: { tp: nTP, fn: nFN, fp: nFP, tn: nTN }, exp };
}

export function snapshot(e, t) {
  const frac = Math.max(0, Math.min(1, t / DURATION));
  const k = Math.max(1, Math.min(N_COHORT, Math.round(frac * N_COHORT)));
  let tp = 0, fn = 0, fp = 0, tn = 0;
  for (let i = 0; i < k; i++) {
    const q = e.pool[i];
    if (q === 'tp') tp++;
    else if (q === 'fn') fn++;
    else if (q === 'fp') fp++;
    else tn++;
  }
  const pos = tp + fp;
  const ppv = pos > 0 ? tp / pos : e.exp.ppv;
  return { k, frac, tp, fn, fp, tn, pos, ppv };
}
