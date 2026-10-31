// node examples/biology/growth/checks.mjs — exponential doubling, Verhulst's logistic ODE, inflection at K/2, and carrying capacity.
import { checks, near, deriv, rk4, bisect } from '@saxster/atlas/checks.js';
import * as M from './model.js';

const C = checks();

// 1. Doubling every hour in unconstrained growth: N_exp(t + T_d) = 2 · N_exp(t)
{ const td = M.doublingTime();
  C.check('unconstrained doubling time T_d = ln 2 / r is 1 hr, and N_exp(4) = 4 · 2⁴ = 64',
    near(td, 1.0, 1e-12) && near(M.expPop(4), 64, 1e-12)); }

// 2. Closed-form logistic N(t) matches numerical integration of dN/dt = rN(1 − N/K) via rk4
{ const ys = rk4((t, n) => M.R * n * (1 - n / M.K), M.N0, 0, M.HOURS, 1000);
  const endODE = ys.at(-1), endClosed = M.logisticPop(M.HOURS);
  C.check('logistic closed form matches rk4 on dN/dt = rN(1 − N/K) over 10 hr',
    near(endODE, endClosed, 1e-7), `${endODE.toFixed(6)} vs ${endClosed.toFixed(6)}`); }

// 3. Numerical derivative of logisticPop(t) equals logisticRate(t) = rN(1 − N/K)
C.check('dN/dt via central difference matches rN(1 − N/K) at t = 1, 4, 6, 9 hr',
  [1, 4, 6, 9].every(t => near(deriv(u => M.logisticPop(u), t), M.logisticRate(t), 1e-7)));

// 4. Inflection point: second derivative d²N/dt² crosses 0 at t* = ln((K − N₀)/N₀)/r where N(t*) = K/2 and rate = rK/4
{ const d2 = t => deriv(u => M.logisticRate(u), t);
  const tStar = bisect(d2, 2, 8), closedStar = M.inflectionTime();
  C.check('inflection time t* from bisect(d²N/dt² = 0) matches ln((K − N₀)/N₀)/r',
    near(tStar, closedStar, 1e-7) && near(M.logisticPop(tStar), M.K / 2, 1e-6) && near(M.logisticRate(tStar), M.peakRate(), 1e-7),
    `t* = ${tStar.toFixed(4)} hr, N(t*) = ${M.logisticPop(tStar).toFixed(1)}`); }

// 5. Carrying capacity scaling: halving K halves the ceiling and halves the peak growth rate rK/4
{ const endFull = M.logisticPop(20, M.K), endHalf = M.logisticPop(20, M.K_HALF);
  C.check('asymptotic colony size approaches K (240 vs 120 for half-sugar)',
    near(endFull, M.K, 1e-3) && near(endHalf, M.K_HALF, 1e-3) && near(M.peakRate(M.K_HALF), M.peakRate(M.K) / 2, 1e-12)); }

// 6. All seeded colony spots lie strictly inside the Petri dish radius
{ const spots = M.colonySpots();
  const maxR = Math.max(...spots.map(p => Math.hypot(p.x, p.z)));
  C.check('all 240 colony spots sit inside the Petri dish rim', spots.length === M.K && maxR < M.DISH_R, `max r = ${maxR.toFixed(3)} < ${M.DISH_R}`); }

C.report();
