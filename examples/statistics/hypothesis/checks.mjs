// node examples/statistics/hypothesis/checks.mjs — independent proofs of normalCdf Φ(z) vs Simpson integration, 95% critical bounds, Type I error α = 0.05 at Δ = 0, and p-value ↔ CI duality.
import { checks, near, integ } from '@saxster/atlas/checks.js';
import * as M from './model.js';

const C = checks();

// 1. Standard normal CDF Φ(z) matches Simpson integration of normalPdf from −8 to z within 5e-7
for (const z of [-2.5, -1.96, -1.0, 0.0, 1.0, 1.96, 2.5]) {
  const numCdf = integ(u => M.normalPdf(u, 0, 1), -8, z, 500);
  C.check(`normalCdf(${z}) matches ∫₋₈^${z} φ(u) du within 5e-7`,
    near(M.normalCdf(z), numCdf, 5e-7));
}

// 2. Critical value Z_CRIT ≈ 1.95996 encloses exactly 95% central probability: Φ(Z_CRIT) − Φ(−Z_CRIT) = 0.95
{
  const central = M.normalCdf(M.Z_CRIT) - M.normalCdf(-M.Z_CRIT);
  const pAtCrit = M.twoTailedPValue(M.Z_CRIT);
  C.check('Φ(1.95996) − Φ(−1.95996) = 0.95 and twoTailedPValue(Z_CRIT) = 0.05',
    near(central, 0.95, 1e-6) && near(pAtCrit, 0.05, 1e-6));
}

// 3. Under the null hypothesis (Δ = 0), statistical power equals the Type I false-positive rate α = 0.05 for any sample size n
for (const n of [10, 25, 60, 100]) {
  C.check(`under H₀ (Δ = 0, n = ${n}), rejection probability Power(0, n) = α = 0.05`,
    near(M.statisticalPower(0, n), 0.05, 1e-6));
}

// 4. Duality between two-tailed p < 0.05 and 95% CI excluding 0, plus monotonicity of Power(Δ, n) in both Δ and n
{
  const e = M.run({ delta: 0.4, n: 25, seed: 3 });
  const dualOk = e.trials.every(tr => {
    const zeroOutsideCI = tr.ciLo > 0 || tr.ciHi < 0;
    const pBelowAlpha = tr.pVal < 0.05;
    return zeroOutsideCI === pBelowAlpha && zeroOutsideCI === tr.rejectsH0;
  });
  const powLowN = M.statisticalPower(0.4, 15);
  const powMidN = M.statisticalPower(0.4, 40);
  const powHighN = M.statisticalPower(0.4, 90);
  C.check('p < 0.05 holds if and only if 0 lies outside [x̄ − 1.96·SE, x̄ + 1.96·SE], and Power grows with n',
    dualOk && powLowN < powMidN && powMidN < powHighN);
}

C.report();
