// node examples/biology/enzyme/checks.mjs — independent proofs of Michaelis–Menten kinetics, mass-action ODE convergence, and inhibition.
import { checks, near, deriv, bisect, rk4 } from '@saxster/atlas/checks.js';
import * as M from './model.js';

const C = checks();

// 1. K_m = (k_off + k_cat) / k_on = 2.0 mM and V_max = k_cat * E_tot = 120 μM/s
C.check('K_m = (k_off + k_cat)/k_on = 2.0 mM and V_max = 120 μM/s',
  near(M.K_M, 2.0, 1e-12) && near(M.V_MAX, 120, 1e-12));

// 2. At [S] = K_m, exactly half of enzyme sites are bound and velocity is ½ V_max = 60 μM/s
C.check('at [S] = K_m = 2 mM, bound fraction θ = 0.5 and v(K_m) = ½ V_max = 60 μM/s',
  near(M.boundFraction(M.K_M), 0.5, 1e-12) && near(M.velocity(M.K_M), 0.5 * M.V_MAX, 1e-12));

// 3. Initial slope dv/d[S] at [S] = 0 matches V_max / K_m = 60 via central difference
{
  const numSlope = deriv(s => M.velocity(Math.max(0, s)), 1e-4, 1e-6);
  C.check('initial slope dv/d[S] at [S] → 0 matches V_max / K_m = 60',
    near(numSlope, M.initialSlope(), 1e-3), `numeric = ${numSlope.toFixed(4)}`);
}

// 4. Mass-action ODE d[ES]/dt integrated via rk4 relaxes to exact Michaelis–Menten steady state [ES]_ss
for (const S of [0.5, 2.0, 6.0, 10.0]) {
  const esRK4 = rk4((t, es) => M.dESdt(S, es), 0, 0, 2.5, 500).at(-1);
  const esExact = M.boundSites(S);
  C.check(`mass-action rk4 at [S] = ${S} mM matches steady-state [ES] = ${esExact.toFixed(3)}`,
    near(esRK4, esExact, 1e-6));
}

// 5. Competitive inhibition triples apparent K_m to 6.0 mM (found via bisect) while sharing the same V_max asymptote
{
  const kmComp = bisect(s => M.velocityComp(s) - 0.5 * M.V_MAX, 0.5, 9.5);
  C.check('competitive inhibitor shifts half-saturation to K_m,app = 6.0 mM via bisect',
    near(kmComp, M.K_M * M.COMP_FACTOR, 1e-8) && near(M.velocityComp(1e6), M.V_MAX, 1e-2));
}

// 6. Non-competitive inhibition halves V_max to 60 μM/s while keeping half-maximal [S] at K_m = 2.0 mM
{
  const kmNonComp = bisect(s => M.velocityNonComp(s) - 0.5 * (M.V_MAX * M.NONCOMP_FACTOR), 0.2, 8.0);
  C.check('non-competitive inhibitor keeps half-maximal [S] at K_m = 2.0 mM while halving V_max',
    near(kmNonComp, M.K_M, 1e-8) && near(M.velocityNonComp(1e6), M.V_MAX * M.NONCOMP_FACTOR, 1e-2));
}

C.report();
