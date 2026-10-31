// Pure mathematical and stochastic model for Figure S.4: Hypothesis Testing, p-Values, Power & 95% Confidence Intervals.
// Covers null vs. alternative sampling distributions N(0, σ²/n) vs. N(Δ, σ²/n), exact normal CDF Φ(z),
// two-tailed p-values, statistical power 1 − β, and a forest plot of 20 replicated 95% confidence intervals.
// Zero DOM, zero Three.js imports.
import { rng } from '@saxster/atlas/rng.js';

export const MU_0 = 0.0;
export const SIGMA = 1.0;
export const ALPHA = 0.05;
export const Z_CRIT = 1.959963984540054; // Φ⁻¹(0.975) for α = 0.05 two-tailed
export const N_TRIALS = 20;              // 20 replicated studies in the forest plot
export const DURATION = 5.0;             // seconds for the full run

// Standard error of the sample mean SE = σ / √n
export function standardError(n = 25, sigma = SIGMA) {
  return sigma / Math.sqrt(Math.max(1, n));
}

// Normal probability density f(x; μ, s)
export function normalPdf(x, mean = 0, sd = 1) {
  const z = (x - mean) / sd;
  return Math.exp(-0.5 * z * z) / (sd * Math.sqrt(2 * Math.PI));
}

// High-precision Abramowitz & Stegun 7.1.26 error function erf(x) (max error < 1.5e-7)
export function erf(x) {
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const t = 1.0 / (1.0 + 0.3275911 * ax);
  const y = 1.0 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-ax * ax);
  return sign * y;
}

// Standard normal cumulative distribution Φ(z) = P(Z ≤ z)
export function normalCdf(z) {
  return 0.5 * (1.0 + erf(z / Math.SQRT2));
}

// Two-tailed p-value for test statistic z = (x̄ − μ₀) / SE
export function twoTailedPValue(z) {
  return 2.0 * (1.0 - normalCdf(Math.abs(z)));
}

// Exact two-tailed statistical power P(|X̄ − μ₀| > z_{α/2}·SE | H₁: μ = Δ)
export function statisticalPower(delta = 0.4, n = 25, zCrit = Z_CRIT, sigma = SIGMA) {
  const se = standardError(n, sigma);
  const ncp = delta / se; // non-centrality parameter Δ / SE
  return (1.0 - normalCdf(zCrit - ncp)) + normalCdf(-zCrit - ncp);
}

// Simulate N_TRIALS = 20 independent replication studies of sample size n under true effect Δ
export function run({ delta = 0.4, n = 25, seed = 1 } = {}) {
  const se = standardError(n, SIGMA);
  const rand = rng(seed * 251 + n * 17 + Math.round(delta * 100) * 31 + 7);
  const trials = [];
  for (let i = 0; i < N_TRIALS; i++) {
    const xBar = rand.normal(MU_0 + delta, se);
    const ciLo = xBar - Z_CRIT * se;
    const ciHi = xBar + Z_CRIT * se;
    const z = (xBar - MU_0) / se;
    const pVal = twoTailedPValue(z);
    const rejectsH0 = Math.abs(z) > Z_CRIT;
    const coversTrue = (MU_0 + delta) >= ciLo && (MU_0 + delta) <= ciHi;
    trials.push({ i, xBar, ciLo, ciHi, z, pVal, rejectsH0, coversTrue });
  }
  const power = statisticalPower(delta, n);
  return { delta, n, seed, se, power, crit: Z_CRIT * se, trials };
}

export function snapshot(e, t) {
  const frac = Math.max(0, Math.min(1, t / DURATION));
  const k = Math.max(1, Math.min(N_TRIALS, Math.round(frac * N_TRIALS)));
  let rejected = 0, covered = 0;
  for (let i = 0; i < k; i++) {
    if (e.trials[i].rejectsH0) rejected++;
    if (e.trials[i].coversTrue) covered++;
  }
  const last = e.trials[k - 1];
  return { k, frac, rejected, covered, last };
}
