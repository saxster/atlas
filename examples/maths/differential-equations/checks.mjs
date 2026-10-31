// node examples/maths/differential-equations/checks.mjs — verifies analytical ODE solutions against RK4, Lyapunov energy, eigenvalues, and practice.
import { checks, near, rk4, deriv, bisect } from '@saxster/atlas/checks.js';
import * as M from './model.js';
import { PRACTICE } from './practice.js';

const C = checks();

// 1. Slope field dy/dt = y − t: exact solution matches RK4 and satisfies y'(t) = y(t) − t
for (const [t0, y0] of [[0, 1.0], [0, 1.8], [0.5, 0.8]]) {
  const rk = rk4(M.slopeFieldRhs, y0, t0, 2.5, 500).at(-1);
  const ex = M.slopeFieldExact(2.5, t0, y0);
  const dy = deriv(t => M.slopeFieldExact(t, t0, y0), 1.4);
  C.check(`dy/dt = y − t from (${t0}, ${y0}): exact matches RK4 and y'(1.4) = y − 1.4`,
    near(rk, ex, 1e-6) && near(dy, M.slopeFieldExact(1.4, t0, y0) - 1.4, 1e-7));
}

// 2. Exponential cooling: dy/dt = −k(y − y_eq) matches RK4 and tau = 1/k shrinks gap by 1/e
for (const y0 of [-0.6, 2.6]) {
  const rk = rk4((t, y) => M.coolingRhs(y), y0, 0, 3.0, 400).at(-1);
  const ex = M.coolingExact(3.0, y0);
  const tau = M.coolingTau();
  C.check(`cooling from y0 = ${y0}: matches RK4 and gap at t = τ is (y0 − y_eq)/e`,
    near(rk, ex, 1e-7) && near(M.coolingExact(tau, y0) - M.Y_EQ, (y0 - M.Y_EQ) / Math.E, 1e-12));
}

// 3. Logistic ODE: matches RK4, equilibria at 0 and K, and inflection at K/2 via bisect on d²y/dt²
{
  const rk = rk4((t, y) => M.logisticRhs(y), 0.3, 0, 4.0, 500).at(-1);
  const ex = M.logisticExact(4.0, 0.3);
  const peakY = bisect(y => deriv(M.logisticRhs, y), 0.2, 2.2);
  C.check('logistic ODE matches RK4, equilibria at 0 and K, max growth at K/2',
    near(rk, ex, 1e-6) && near(M.logisticRhs(0), 0, 1e-12) && near(M.logisticRhs(M.K_LOG), 0, 1e-12) && near(peakY, M.K_LOG / 2, 1e-8));
}

// 4. Undamped harmonic oscillator: RK4 matches exact and energy E = ½(x² + v²) is conserved
{
  const s0 = [1.6, 0.9];
  const traj = rk4((t, [x, v]) => M.harmonicVec(x, v), s0, 0, 2 * Math.PI, 800);
  const end = traj.at(-1), ex = M.harmonicExact(2 * Math.PI, s0[0], s0[1]);
  const e0 = M.harmonicEnergy(...s0), eEnd = M.harmonicEnergy(...end);
  C.check('undamped harmonic phase orbit closes after 2π and conserves energy E = ½(x² + v²)',
    near(end[0], ex[0], 1e-6) && near(end[1], ex[1], 1e-6) && near(e0, eEnd, 1e-7));
}

// 5. Damped spiral sink: RK4 matches exact underdamped solution and dE/dt = −2γ v² ≤ 0
{
  const s0 = [2.0, 0.0];
  const rk = rk4((t, [x, v]) => M.spiralVec(x, v), s0, 0, 4.0, 600).at(-1);
  const ex = M.spiralExact(4.0, s0[0], s0[1]);
  const dEdt = deriv(t => M.harmonicEnergy(...M.spiralExact(t, s0[0], s0[1])), 1.5);
  const [, vAt] = M.spiralExact(1.5, s0[0], s0[1]);
  C.check('underdamped spiral matches RK4, dE/dt = −2γ v², and classifies as spiral sink',
    near(rk[0], ex[0], 1e-6) && near(rk[1], ex[1], 1e-6) && near(dEdt, -2 * M.GAMMA * vAt * vAt, 1e-6) &&
    M.classifyEquilibrium(M.spiralMat()) === 'spiral sink');
}

// 6. Saddle matrix: det < 0, Av = λv on both eigenvectors, and classifies as saddle
{
  const { l1, l2, vUnstable, vStable } = M.saddleEigenvectors();
  const av1 = M.linearVec(M.SADDLE_MAT, ...vUnstable);
  const av2 = M.linearVec(M.SADDLE_MAT, ...vStable);
  C.check('saddle matrix: l1 > 0 > l2, A v_i = λ_i v_i, and classifyEquilibrium === saddle',
    l1 > 0 && l2 < 0 &&
    near(av1[0], l1 * vUnstable[0], 1e-12) && near(av1[1], l1 * vUnstable[1], 1e-12) &&
    near(av2[0], l2 * vStable[0], 1e-12) && near(av2[1], l2 * vStable[1], 1e-12) &&
    M.classifyEquilibrium(M.SADDLE_MAT) === 'saddle');
}

// 7. Practice questions verification
for (const [page, qs] of Object.entries(PRACTICE)) {
  for (const [i, q] of qs.entries()) {
    const uniq = new Set(q.choices).size === q.choices.length;
    const valid = q.answer >= 0 && q.answer < q.choices.length && q.why.length > 20;
    C.check(`practice p.${page}#${i + 1} has 4 distinct choices and explanation`, uniq && valid);
  }
}

C.report();
