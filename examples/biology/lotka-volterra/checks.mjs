// node examples/biology/lotka-volterra/checks.mjs — independent proofs of Lotka–Volterra equilibrium,
// Volterra's principle, conservation of the first integral V(R, F) along RK4 orbits, quarter-cycle lag,
// and Hardy–Weinberg vs directional natural selection.
import { checks, near, rk4 } from '@saxster/atlas/checks.js';
import * as M from './model.js';

const C = checks();

// 1. Coexistence equilibrium (R*, F*) = (γ/δ, α/β) has identically zero time derivatives
{
  const eq = M.equilibrium(M.DEFAULT_PARAMS);
  const [dR, dF] = M.lvDeriv(eq.Rstar, eq.Fstar, M.DEFAULT_PARAMS);
  C.check('equilibrium (R*, F*) = (γ/δ = 30, α/β = 20) has zero velocity dR/dt = dF/dt = 0',
    near(eq.Rstar, 30, 1e-12) && near(eq.Fstar, 20, 1e-12) && near(dR, 0, 1e-12) && near(dF, 0, 1e-12));
}

// 2. Volterra's principle: doubling prey birth rate α doubles equilibrium predators F* while leaving average prey R* unchanged
{
  const eq1 = M.equilibrium({ ...M.DEFAULT_PARAMS, alpha: 0.8 });
  const eq2 = M.equilibrium({ ...M.DEFAULT_PARAMS, alpha: 1.6 });
  C.check('Volterra’s principle: doubling α from 0.8 to 1.6 leaves R* = γ/δ = 30 fixed while doubling F* from 16 to 32',
    near(eq1.Rstar, eq2.Rstar, 1e-12) && near(eq2.Fstar, 2 * eq1.Fstar, 1e-12));
}

// 3. First integral V(R, F) = δR − γ ln R + βF − α ln F is conserved along RK4 trajectories to < 10⁻⁶
{
  const sim = M.simulate(M.DEFAULT_PARAMS, 1600);
  const v0 = sim.traj[0].V;
  const maxDrift = Math.max(...sim.traj.map(pt => Math.abs(pt.V - v0)));
  const extRK4 = rk4((t, y) => M.lvDeriv(y[0], y[1], M.DEFAULT_PARAMS), [M.DEFAULT_PARAMS.R0, M.DEFAULT_PARAMS.F0], 0, M.T_MAX, 1600).at(-1);
  const simEnd = sim.traj.at(-1);
  C.check('first integral V(R(t), F(t)) is conserved along the closed orbit (drift < 1e-6) and matches checks.rk4',
    maxDrift < 1e-6 && near(simEnd.R, extRK4[0], 1e-9) && near(simEnd.F, extRK4[1], 1e-9),
    `max |ΔV| = ${maxDrift.toExponential(2)}`);
}

// 4. Prey peaks precede predator peaks by approximately a quarter cycle
{
  const sim = M.simulate(M.DEFAULT_PARAMS, 2000);
  let tPreyPeak = null, tPredPeak = null;
  for (let i = 1; i < sim.traj.length - 1; i++) {
    const prev = sim.traj[i - 1], cur = sim.traj[i], next = sim.traj[i + 1];
    if (tPreyPeak === null && cur.t > 0.5 && cur.R > prev.R && cur.R > next.R) tPreyPeak = cur.t;
    if (tPreyPeak !== null && tPredPeak === null && cur.t > tPreyPeak && cur.F > prev.F && cur.F > next.F) tPredPeak = cur.t;
  }
  const T0 = M.smallAmplitudePeriod(M.DEFAULT_PARAMS);
  const lagRatio = (tPredPeak - tPreyPeak) / T0;
  C.check('prey maximum precedes predator maximum by ~¼ period',
    tPreyPeak !== null && tPredPeak > tPreyPeak && lagRatio > 0.18 && lagRatio < 0.34,
    `Δt / T₀ = ${lagRatio.toFixed(3)}`);
}

// 5. Hardy–Weinberg equilibrium holds when fitnesses are equal (w_AA = w_Aa = w_aa = 1), and directional selection increases p when w_AA > w_Aa > w_aa
{
  const p0 = 0.35;
  const pHW = M.nextAlleleFreq(p0, 1.0, 1.0, 1.0);
  const pSel = M.nextAlleleFreq(p0, 1.2, 1.1, 1.0);
  C.check('Hardy–Weinberg preserves allele frequency p when w = 1, while advantageous allele A increases under selection',
    near(pHW, p0, 1e-12) && pSel > p0);
}

C.report();
