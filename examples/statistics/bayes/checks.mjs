// node examples/statistics/bayes/checks.mjs — independent proofs of Bayes' theorem, odds-ratio updating, base-rate fallacy counts, and monotonicity.
import { checks, near } from '@saxster/atlas/checks.js';
import * as M from './model.js';

const C = checks();

// 1. Canonical base-rate fallacy case (p = 2%, sens = 95%, fp = 5%): TP = 19, FP = 49, P(D|+) = 19/68 ≈ 27.94%
{
  const exp = M.expectedCounts(0.02, 0.95, 0.05, 1000);
  C.check('at p = 2%, sens = 95%, fp = 5% (N = 1,000): TP = 19, FP = 49, FN = 1, TN = 931, P(D|+) = 19/68 ≈ 27.94%',
    near(exp.tp, 19, 1e-12) &&
    near(exp.fp, 49, 1e-12) &&
    near(exp.fn, 1, 1e-12) &&
    near(exp.tn, 931, 1e-12) &&
    near(exp.ppv, 19 / 68, 1e-12));
}

// 2. Bayes' formula matches odds-ratio identity: P(D|+) / (1 − P(D|+)) = (p / (1 − p)) · (sens / fp) across parameter grid
for (const p of [0.01, 0.02, 0.10, 0.25]) {
  for (const sens of [0.80, 0.95]) {
    for (const fp of [0.02, 0.05, 0.15]) {
      const post = M.posteriorGivenPos(p, sens, fp);
      const oddsFromProb = post / (1 - post);
      const oddsFormula = M.posteriorOddsPos(p, sens, fp);
      C.check(`odds form matches probability form at p=${p}, sens=${sens}, fp=${fp}`,
        near(oddsFromProb, oddsFormula, 1e-12));
    }
  }
}

// 3. Joint probabilities TP + FN + FP + TN sum to 1 and marginals match p and P(+)
for (const p of [0.01, 0.05, 0.20]) {
  const j = M.jointProbs(p, 0.92, 0.08);
  C.check(`joint probabilities sum to 1 and recover marginals at p = ${p}`,
    near(j.tp + j.fn + j.fp + j.tn, 1.0, 1e-12) &&
    near(j.tp + j.fn, p, 1e-12) &&
    near(j.tp + j.fp, M.probPositive(p, 0.92, 0.08), 1e-12));
}

// 4. Posterior P(D|+) is strictly increasing in prevalence p and sensitivity, and strictly decreasing in false-positive rate fp
{
  const p1 = M.posteriorGivenPos(0.01, 0.95, 0.05);
  const p2 = M.posteriorGivenPos(0.05, 0.95, 0.05);
  const p3 = M.posteriorGivenPos(0.20, 0.95, 0.05);
  const fLow = M.posteriorGivenPos(0.02, 0.95, 0.01);
  const fHigh = M.posteriorGivenPos(0.02, 0.95, 0.10);
  C.check('P(D|+) increases with prevalence p (1% → 5% → 20%) and decreases with false-positive rate fp (1% → 10%)',
    p1 < p2 && p2 < p3 && fLow > fHigh);
}

C.report();
