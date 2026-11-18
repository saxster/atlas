// node examples/statistics/effort-transfer/checks.mjs — independent proofs of inverse-variance pooled meta-analysis across
// N = 1,457 (n = [228, 255, 241, 233, 500]), single-study vs. pooled statistical power at d = 0.22,
// optimal unrewarded demand dV/dL = 0 via numerical derivative, and quadratic transfer retention.
// Grounding: Clay, Mlynski, Korb, Goschke & Job (2022), PNAS 119(5): e2111785119 (DOI: 10.1073/pnas.2111785119).
import { checks, near, deriv, integ } from '@saxster/atlas/checks.js';
import * as M from './model.js';

const C = checks();

// 1. Sample sizes sum to N = 1,457 and inverse-variance pooled SE shrinks strictly below every individual study's SE
{
  const sumN = M.STUDY_SAMPLE_SIZES.reduce((a, b) => a + b, 0);
  const studies = M.STUDY_SAMPLE_SIZES.map((n, idx) => ({
    n,
    dHat: 0.22 + (idx - 2) * 0.04,
    se: M.cohenDStandardError(0.22, n),
  }));
  const meta = M.poolInverseVariance(studies);
  const manualWeights = studies.map(s => 1 / (s.se * s.se));
  const wSum = manualWeights.reduce((a, b) => a + b, 0);
  const expectedSE = Math.sqrt(1 / wSum);
  const smallerThanAll = studies.every(s => meta.pooledSE < s.se * 0.65);
  C.check('5-study replication sizes sum to N = 1,457 and inverse-variance pooled SE < 0.65 × every single study SE',
    sumN === 1457 && near(meta.pooledSE, expectedSE, 1e-9) && smallerThanAll);
}

// 2. At true effect d = 0.22, a single n = 240 study has < 45% two-tailed power (explaining individual p-value flicker),
//    whereas pooling all N = 1,457 participants exceeds 98% statistical power!
{
  const singlePow = M.twoTailedPowerForD(0.22, 240);
  const largeStudyPow = M.twoTailedPowerForD(0.22, 500);
  const pooledPow = M.twoTailedPowerForD(0.22, 1457);
  C.check('at d = 0.22: single n = 240 power is ~40% (< 0.45), n = 500 power is ~69%, and pooled N = 1,457 power > 98%',
    singlePow > 0.35 && singlePow < 0.45 && largeStudyPow > 0.65 && largeStudyPow < 0.74 && pooledPow > 0.98);
}

// 3. Optimal unrewarded transfer demand L*(v_learned) satisfies ∂V_net/∂L = 0 at interior optima (checked against numerical deriv)
for (const vLearned of [0.0, 0.25, 0.50]) {
  const lStar = M.optimalTransferDemand(vLearned);
  const slope = deriv(L => M.netControlValue(L, vLearned), lStar);
  C.check(`interior optimal demand L*(v=${vLearned}) = ${lStar.toFixed(3)} satisfies dV_net/dL = 0 within 1e-6`,
    lStar > 1.0 && lStar < 5.0 && near(slope, 0.0, 1e-6));
}

// 4. Average transfer demand across u ∈ [0, 1] matches closed-form definite integral and buffers late-session quadratic slump
{
  const vLearned = 0.45;
  const numMeanCtrl = integ(u => M.demandTrajectory(u, 0.0), 0, 1, 200);
  const numMeanExp = integ(u => M.demandTrajectory(u, vLearned), 0, 1, 200);
  const closedCtrl = M.meanDemandAcrossSession(0.0);
  const closedExp = M.meanDemandAcrossSession(vLearned);
  const dropCtrl = M.demandTrajectory(1.0, 0.0) - M.demandTrajectory(0.45, 0.0);
  const dropExp = M.demandTrajectory(1.0, vLearned) - M.demandTrajectory(0.45, vLearned);
  C.check('session mean demand matches ∫₀¹ D(u) du and effort reinforcement reduces late-session slump (dropExp > dropCtrl)',
    near(numMeanCtrl, closedCtrl, 1e-6) && near(numMeanExp, closedExp, 1e-6) && closedExp > closedCtrl && dropExp > dropCtrl);
}

C.report();
