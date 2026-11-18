// Pure mathematical and stochastic model for Figure S.5: Effort Transfer, Replication Power & Inverse-Variance Meta-Analysis.
// Grounding (non-derivative mathematical model from documented summary statistics):
// - Clay, Mlynski, Korb, Goschke & Job (2022), PNAS 119(5): e2111785119 (DOI: 10.1073/pnas.2111785119):
//   * 5 online community replications: n = [228, 255, 241, 233, 500] (N_total = 1,457), pooled d = 0.22, 95% CI [0.12, 0.33], z = 4.24.
//   * 50-trial Math Effort Task (Levels 1..5, zero extrinsic reward): quadratic inverted-U demand trajectory with buffered late-session slump (d = -0.24).
// - Hedges & Olkin (1985): large-sample variance of standardized mean difference SE(d) = sqrt(4/n + d^2 / (2n)).
// Zero DOM, zero Three.js imports.
import { rng } from '@saxster/atlas/rng.js';

export const STUDY_SAMPLE_SIZES = [228, 255, 241, 233, 500];
export const STUDY_LABELS = ['Study 2a', 'Study 2b', 'Study 2c', 'Study 2d', 'Study 2e'];
export const TOTAL_N = 1457;
export const Z_CRIT = 1.959963984540054; // two-tailed alpha = 0.05
export const N_TRANSFER_TRIALS = 50;
export const DURATION = 4.8;

// Cost-value parameters for unrewarded transfer demand L in [1, 5]
export const BASE_CURIOSITY_SLOPE = 0.88; // baseline preference above Level 1 -> L*(0) ≈ 2.87
export const EFFORT_COST_CURVATURE = 0.47; // c_0 quadratic control cost

export function erf(x) {
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const t = 1.0 / (1.0 + 0.3275911 * ax);
  const y = 1.0 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-ax * ax);
  return sign * y;
}

export function normalCdf(z) {
  return 0.5 * (1.0 + erf(z / Math.SQRT2));
}

export function twoTailedPValue(z) {
  return 2.0 * (1.0 - normalCdf(Math.abs(z)));
}

// Hedges & Olkin balanced two-group standard error of Cohen's d for total sample size n
export function cohenDStandardError(d = 0.22, n = 240) {
  const safeN = Math.max(4, n);
  return Math.sqrt((4.0 / safeN) + (d * d) / (2.0 * safeN));
}

// Two-tailed statistical power at alpha = 0.05 for true standardized effect d and total sample size n
export function twoTailedPowerForD(d = 0.22, n = 240) {
  const se0 = cohenDStandardError(0.0, n);
  const ncp = d / se0;
  return (1.0 - normalCdf(Z_CRIT - ncp)) + normalCdf(-Z_CRIT - ncp);
}

// Fixed-effect inverse-variance meta-analysis over [{ n, dHat, se }]
export function poolInverseVariance(studies) {
  let wSum = 0.0;
  let wdSum = 0.0;
  for (const s of studies) {
    const w = 1.0 / (s.se * s.se);
    wSum += w;
    wdSum += w * s.dHat;
  }
  const pooledD = wdSum / wSum;
  const pooledSE = Math.sqrt(1.0 / wSum);
  const z = pooledD / pooledSE;
  return {
    pooledD,
    pooledSE,
    ciLo: pooledD - Z_CRIT * pooledSE,
    ciHi: pooledD + Z_CRIT * pooledSE,
    z,
    pVal: twoTailedPValue(z),
    rejectsH0: Math.abs(z) > Z_CRIT,
  };
}

// Expected Value of Control in unrewarded transfer phase (R_ext = 0) across demand levels L in [1, 5]
export function netControlValue(L, vLearned = 0.35, c0 = EFFORT_COST_CURVATURE) {
  const x = L - 1.0;
  return (BASE_CURIOSITY_SLOPE + vLearned) * x - 0.5 * c0 * x * x;
}

// Closed-form optimal transfer demand level L*(v_learned) clamped to [1, 5]
export function optimalTransferDemand(vLearned = 0.35, c0 = EFFORT_COST_CURVATURE) {
  const raw = 1.0 + (BASE_CURIOSITY_SLOPE + vLearned) / c0;
  return Math.max(1.0, Math.min(5.0, raw));
}

// Quadratic growth-curve trajectory across normalized session progress u in [0, 1] (50 MET trials)
export function demandTrajectory(u, vLearned = 0.0) {
  const clampedU = Math.max(0.0, Math.min(1.0, u));
  const baseCtrl = 2.66 + 1.08 * clampedU - 1.47 * clampedU * clampedU;
  const learnedLift = 0.56 * vLearned + 0.84 * vLearned * clampedU * clampedU;
  return Math.max(1.0, Math.min(5.0, baseCtrl + learnedLift));
}

// Exact analytical mean of demandTrajectory(u, vLearned) on [0, 1] (for un-clamped interior trajectories)
export function meanDemandAcrossSession(vLearned = 0.0) {
  // ∫₀¹ (a + b u + c u²) du = a + b/2 + c/3
  const a = 2.66 + 0.56 * vLearned;
  const b = 1.08;
  const c = -1.47 + 0.84 * vLearned;
  return a + 0.5 * b + (1.0 / 3.0) * c;
}

export function run({ trueD = 0.22, vLearned = 0.35, seed = 1 } = {}) {
  const rand = rng(seed * 313 + Math.round(trueD * 100) * 43 + Math.round(vLearned * 100) * 19 + 11);
  const studies = STUDY_SAMPLE_SIZES.map((n, idx) => {
    const se = cohenDStandardError(trueD, n);
    // Seed 1 reproduces the characteristic pattern where underpowered n~240 studies flicker around 0 while n=500 & pooled resolve cleanly
    const dHat = rand.normal(trueD, se);
    const ciLo = dHat - Z_CRIT * se;
    const ciHi = dHat + Z_CRIT * se;
    const z = dHat / se;
    const pVal = twoTailedPValue(z);
    const rejectsH0 = Math.abs(z) > Z_CRIT;
    const power = twoTailedPowerForD(trueD, n);
    return { idx, label: STUDY_LABELS[idx], n, dHat, se, ciLo, ciHi, z, pVal, rejectsH0, power };
  });

  const meta = poolInverseVariance(studies);
  const single240Power = twoTailedPowerForD(trueD, 240);
  const pooledPower = twoTailedPowerForD(trueD, TOTAL_N);
  const meanCtrl = meanDemandAcrossSession(0.0);
  const meanExp = meanDemandAcrossSession(vLearned);
  const lStarExp = optimalTransferDemand(vLearned);

  return {
    trueD,
    vLearned,
    seed,
    studies,
    meta,
    single240Power,
    pooledPower,
    meanCtrl,
    meanExp,
    lStarExp,
  };
}

export function snapshot(e, t) {
  const frac = Math.max(0.0, Math.min(1.0, t / DURATION));
  const trialIndex = Math.max(1, Math.min(N_TRANSFER_TRIALS, Math.round(frac * N_TRANSFER_TRIALS)));
  const u = (trialIndex - 1) / (N_TRANSFER_TRIALS - 1);
  const sigCount = e.studies.filter(s => s.rejectsH0).length;
  return {
    frac,
    u,
    trialIndex,
    sigCount,
    curCtrl: demandTrajectory(u, 0.0),
    curExp: demandTrajectory(u, e.vLearned),
  };
}
