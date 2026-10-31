// node examples/chemistry/kinetics/checks.mjs — independent proofs of radioactive decay (kr = 0), reversible equilibrium K = kf/kr, rk4 agreement, and ensemble mean.
import { checks, near, deriv, bisect, rk4, meanWithin } from '@saxster/atlas/checks.js';
import * as M from './model.js';

const C = checks();

// 1. Pure radioactive decay (kr = 0): N_A(t) = N_0 e^(−kf t) halves every t_{1/2} = ln 2 / kf
{
  const n = 200, kf = 0.30, kr = 0, th = M.halfLife(kf, kr);
  const rootTh = bisect(t => M.expectedA(n, kf, kr, t) - n / 2, 0.1, 9.0);
  C.check('radioactive decay (k_r = 0): half-life ln 2 / λ halves N_0 and matches bisect root',
    near(M.expectedA(n, kf, kr, th), n / 2, 1e-12) &&
    near(M.expectedA(n, kf, kr, 2 * th), n / 4, 1e-12) &&
    near(rootTh, th, 1e-10));
}

// 2. Reversible equilibrium: as t → ∞, [B]_eq / [A]_eq = k_f / k_r = K and forward rate equals reverse rate
for (const [kf, kr] of [[0.30, 0.15], [0.40, 0.10], [0.25, 0.25]]) {
  const n = 240;
  const aEq = M.eqReactant(n, kf, kr), bEq = M.eqProduct(n, kf, kr);
  C.check(`equilibrium K = k_f/k_r = ${(kf / kr).toFixed(2)}: [B]_eq/[A]_eq = K and k_f [A]_eq = k_r [B]_eq`,
    near(bEq / aEq, M.eqConstant(kf, kr), 1e-12) &&
    near(kf * aEq, kr * bEq, 1e-12) &&
    near(M.expectedA(n, kf, kr, 200), aEq, 1e-9));
}

// 3. Analytical expectedA(t) satisfies dN_A/dt = −k_f N_A + k_r (n − N_A) via central-difference deriv and rk4
{
  const n = 200, kf = 0.30, kr = 0.15;
  const aRK4 = rk4((t, a) => M.dAdt(n, kf, kr, a), n, 0, M.DURATION, 400).at(-1);
  const dNum = deriv(t => M.expectedA(n, kf, kr, t), 2.5);
  const dExact = M.dAdt(n, kf, kr, M.expectedA(n, kf, kr, 2.5));
  C.check('expectedA(t) matches rk4 integration and central-difference derivative dN_A/dt',
    near(aRK4, M.expectedA(n, kf, kr, M.DURATION), 1e-7) && near(dNum, dExact, 1e-8));
}

// 4. Conservation of matter: N_A(t) + N_B(t) = n at every frame of a stochastic run
{
  const e = M.run({ n: 200, kf: 0.30, kr: 0.15, seed: 3 });
  const conserved = e.series.every(r => r.nA + r.nB === 200);
  C.check('stochastic run conserves total molecules N_A + N_B = 200 at all steps', conserved);
}

// 5. Ensemble average over 40 seeds at t = 4 s and t = 10 s matches analytical expectedA within 3 SE
{
  const n = 200, kf = 0.30, kr = 0.15;
  const p = M.expectedA(n, kf, kr, 10.0) / n;
  const sd = Math.sqrt(n * p * (1 - p));
  const samples10 = Array.from({ length: 40 }, (_, i) =>
    M.snapshot(M.run({ n, kf, kr, seed: i + 1 }), 10.0).nA
  );
  C.check('ensemble mean at t = 10 s across 40 seeds matches expectedA(10) = 66.7 within 3 SE',
    meanWithin(samples10, M.expectedA(n, kf, kr, 10.0), sd));
}

C.report();
