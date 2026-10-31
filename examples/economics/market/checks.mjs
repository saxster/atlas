// node examples/economics/market/checks.mjs — independent proofs of MC = dC/dQ, market clearing Q_d(P*) = Q_s(P*), surplus integrals, and deadweight loss.
import { checks, near, deriv, integ, bisect } from '@saxster/atlas/checks.js';
import * as M from './model.js';

const C = checks();

// 1. Marginal cost MC(Q) equals central-difference derivative dC/dQ of totalCost(Q)
for (const q of [10, 25, 40, 55]) {
  C.check(`MC(${q}) = ${M.marginalCost(q)} matches central-difference deriv(totalCost, ${q})`,
    near(M.marginalCost(q), deriv(M.totalCost, q), 1e-8));
}

// 2. Fundamental Theorem on cost: ∫₀^Q MC(q) dq equals variable cost C(Q) − C(0)
for (const q of [20, 40, 60]) {
  C.check(`∫₀^${q} MC(q) dq matches variable cost C(${q}) − C(0)`,
    near(integ(M.marginalCost, 0, q), M.totalCost(q) - M.totalCost(0), 1e-8));
}

// 3. Equilibrium (Q* = 40, P* = 50) found via bisect of Q_d(P) − Q_s(P) = 0
{
  const pRoot = bisect(p => M.quantityDemanded(p) - M.quantitySupplied(p), 10, 90);
  const qRoot = bisect(q => M.demandPrice(q) - M.supplyPrice(q), 0, 60);
  C.check('market clearing P* = 50, Q* = 40 matches bisect of Q_d(P) = Q_s(P)',
    near(pRoot, M.P_STAR, 1e-9) && near(qRoot, M.Q_STAR, 1e-9) &&
    near(M.quantityDemanded(M.P_STAR), M.quantitySupplied(M.P_STAR), 1e-12));
}

// 4. Consumer surplus and producer surplus at (Q*, P*) match Simpson integration and maximize total surplus
{
  const csSimp = integ(q => M.demandPrice(q) - M.P_STAR, 0, M.Q_STAR);
  const psSimp = integ(q => M.P_STAR - M.marginalCost(q), 0, M.Q_STAR);
  const dTotalAtStar = deriv(M.totalSurplus, M.Q_STAR);
  C.check('CS(40) = 800 and PS(40) = 800 match Simpson integrals and d(TotalSurplus)/dQ = 0 at Q* = 40',
    near(M.consumerSurplus(M.Q_STAR), csSimp, 1e-8) &&
    near(M.producerSurplus(M.Q_STAR), psSimp, 1e-8) &&
    near(dTotalAtStar, 0, 1e-8));
}

// 5. Price ceiling P = 30 caps trade at Q_s(30) = 20 and creates deadweight loss = 400 matching lost surplus integral
{
  const lostSimp = integ(q => M.demandPrice(q) - M.marginalCost(q), M.Q_CEIL, M.Q_STAR);
  C.check('price ceiling P = 30: deadweightLoss(20) = 400 matches ∫₂₀⁴⁰ (P_d − MC) dq',
    near(M.deadweightLoss(M.Q_CEIL), 400, 1e-12) &&
    near(M.deadweightLoss(M.Q_CEIL), lostSimp, 1e-8) &&
    near(M.totalSurplus(M.Q_STAR) - M.totalSurplus(M.Q_CEIL), 400, 1e-8));
}

C.report();
