// node examples/maths/fourier/checks.mjs — verifies Fourier coefficients by numerical integration, orthogonality, Parseval, and Gibbs overshoot.
import { checks, near, integ, deriv } from '@saxster/atlas/checks.js';
import * as M from './model.js';
import { PRACTICE } from './practice.js';

const C = checks();

// 1. Orthogonality of sin(m t) and sin(n t) on [−π, π] via Simpson integration
for (const [m, n] of [[1, 1], [2, 2], [1, 2], [2, 3], [3, 5]]) {
  const num = integ(t => Math.sin(m * t) * Math.sin(n * t), -Math.PI, Math.PI, 1200) / Math.PI;
  const expected = m === n ? 1 : 0;
  C.check(`orthogonality (1/π) ∫ sin(${m}t) sin(${n}t) dt = ${expected}`, near(num, expected, 1e-9));
}

// 2. Square-wave coefficients b_n = (2/π) ∫_0^π sin(n t) dt match 4/(nπ) for odd n and 0 for even n
for (let n = 1; n <= 6; n++) {
  const num = (2 / Math.PI) * integ(t => Math.sin(n * t), 0, Math.PI, 1000);
  C.check(`square wave b_${n} matches numerical Euler–Fourier integral`, near(M.squareCoeff(n), num, 1e-8));
}

// 3. Sawtooth coefficients b_n = (1/π) ∫_{-π}^π (t/π) sin(n t) dt match (−1)^(n+1) 2/(nπ)
for (let n = 1; n <= 6; n++) {
  const num = (1 / Math.PI) * integ(t => (t / Math.PI) * Math.sin(n * t), -Math.PI, Math.PI, 1200);
  C.check(`sawtooth b_${n} matches numerical Euler–Fourier integral`, near(M.sawtoothCoeff(n), num, 1e-8));
}

// 4. Epicycle chain tip y-coordinate equals partial sum S_N(t)
for (const t of [0.3, 1.1, 2.4]) {
  const chainSq = M.epicycleChain(M.squareHarmonics(5), t);
  const chainSaw = M.epicycleChain(M.sawtoothHarmonics(6), t);
  C.check(`epicycle tip y at t = ${t} equals squarePartial and sawtoothPartial`,
    near(chainSq.at(-1)[1], M.squarePartial(t, 5), 1e-12) &&
    near(chainSaw.at(-1)[1], M.sawtoothPartial(t, 6), 1e-12));
}

// 5. Parseval's theorem: ½ Σ b_n² equals (1/2π) ∫_{-π}^π S_N(t)² dt and converges toward 1
{
  const e5 = M.squareParsevalSum(5);
  const mse5 = integ(t => M.squarePartial(t, 5) ** 2, -Math.PI, Math.PI, 1600) / (2 * Math.PI);
  const e200 = M.squareParsevalSum(200);
  C.check('Parseval energy ½ Σ b_n² matches mean square of S_5(t) and converges to 1',
    near(e5, mse5, 1e-7) && near(e200, 1, 1e-2));
}

// 6. Gibbs overshoot: (2/π) ∫_0^π (sin u / u) du matches GIBBS_PEAK and S_40(π/80) approaches it
{
  const siPi = (2 / Math.PI) * integ(u => u < 1e-12 ? 1 : Math.sin(u) / u, 0, Math.PI, 1000);
  const N = 40, tPeak = M.gibbsPeakAngle(N), sPeak = M.squarePartial(tPeak, N);
  const dAtPeak = deriv(t => M.squarePartial(t, N), tPeak);
  C.check('Gibbs peak matches (2/π) Si(π) ≈ 1.17898 and is a stationary maximum of S_N(t)',
    near(siPi, M.GIBBS_PEAK, 1e-9) && near(sPeak, M.GIBBS_PEAK, 1e-3) && near(dAtPeak, 0, 1e-5));
}

// 7. Practice questions check
for (const [page, qs] of Object.entries(PRACTICE)) {
  for (const [i, q] of qs.entries()) {
    const uniq = new Set(q.choices).size === q.choices.length;
    const valid = q.answer >= 0 && q.answer < q.choices.length && q.why.length > 20;
    C.check(`practice p.${page}#${i + 1} has 4 distinct choices and explanation`, uniq && valid);
  }
}

C.report();
