// node examples/economics/multiplier/checks.mjs — independent proofs of geometric partial sums, infinite multiplier convergence, savings-injection identity, and Keynesian Cross equilibrium.
import { checks, near, bisect } from '@saxster/atlas/checks.js';
import * as M from './model.js';

const C = checks();

// 1. Explicit sum ∑_{k=0}^{n-1} ΔG·c^k matches closed-form ΔG·(1 − c^n)/(1 − c) for n = 1, 2, 5, 12, 30
for (const n of [1, 2, 5, 12, 30]) {
  C.check(`explicit sum over ${n} rounds matches closed-form ΔG(1 − c^${n})/(1 − c) = ${M.cumulativeIncome(n).toFixed(4)}`,
    near(M.sumIncomeRounds(n), M.cumulativeIncome(n), 1e-11));
}

// 2. Geometric series converges to Y_∞ = ΔG / (1 − c) = ₹400 Cr within 1e-8 by round 80
{
  const y80 = M.cumulativeIncome(80);
  C.check('cumulativeIncome(80) converges to Y_∞ = ₹400 Cr within 1e-7',
    near(y80, M.Y_INF, 1e-7) && near(M.Y_INF, 400, 1e-12));
}

// 3. Leakages balance the injection: at every round n, ΔG − S_n equals the next round's unspent injection ΔG·c^n, and S_∞ = ΔG = ₹100 Cr
for (const n of [1, 3, 8, 80]) {
  const sN = M.cumulativeSaving(n);
  const rem = M.roundSpending(n);
  C.check(`after ${n} rounds, cumulative saving S_${n} (${sN.toFixed(2)}) + remaining flow (${rem.toFixed(2)}) = ΔG (100)`,
    near(sN + rem, M.DELTA_G, 1e-11));
}

// 4. Keynesian Cross equilibrium where AE(ΔY) = ΔG + c·ΔY crosses the 45° line ΔY found via bisect matches Y_∞ = 400
{
  const yStar = bisect(y => M.aggregateExpenditure(y) - y, 0, 600);
  C.check('Keynesian Cross bisect(AE(Y) − Y = 0) matches multiplier equilibrium Y* = 400',
    near(yStar, M.Y_INF, 1e-9) && near(M.aggregateExpenditure(M.Y_INF), M.Y_INF, 1e-12));
}

C.report();
