// node examples/maths/calculus/checks.mjs — derivatives, stationary points, Riemann convergence, FTC and practice checks.
import { checks, near, deriv, integ, bisect, rk4 } from '@saxster/atlas/checks.js';
import * as M from './model.js';
import { PRACTICE } from './practice.js';

const C = checks();

// 1. Secant slope (f(a + h) − f(a))/h converges to df(a) as h → 0, and matches central-difference deriv
for (const a of [0.5, 1.0, 2.0, 2.5]) {
  C.check(`df(${a}) matches central-difference deriv(f, ${a}) and secant limit`,
    near(M.df(a), deriv(M.f, a), 1e-8) && near(M.secantSlope(a, 1e-7), M.df(a), 1e-6));
}

// 2. Tangent line touches the curve at x = a with the same height and slope
for (const a of [0.8, 1.5, 2.2]) {
  C.check(`tangent line at a = ${a} matches f(a) and f'(a)`,
    near(M.tangentY(a, a), M.f(a), 1e-12) && near(deriv(x => M.tangentY(a, x), a), M.df(a), 1e-9));
}

// 3. Cubic g(x) = ⅓x³ − x² + 2: roots of g'(x) via bisect, second derivative signs, and inflection at g''(x) = 0
{ const r1 = bisect(M.dg, -0.5, 0.8), r2 = bisect(M.dg, 1.2, 2.6), infl = bisect(M.ddg, 0, 2);
  C.check('cubic g′(x) = 0 roots via bisect are x = 0 (max) and x = 2 (min), inflection at x = 1',
    near(r1, M.G_MAX_X, 1e-9) && near(r2, M.G_MIN_X, 1e-9) && near(infl, M.G_INFLECT_X, 1e-9) && M.ddg(r1) < 0 && M.ddg(r2) > 0); }

// 4. Midpoint Riemann sum error shrinks as O(1/n²) and converges to Simpson's rule & F(3) − F(0) = 4.5
{ const exact = M.exactArea(0, 3), simp = integ(M.f, 0, 3);
  const e6 = Math.abs(M.riemannSum(M.f, 0, 3, 6, 'mid') - exact);
  const e24 = Math.abs(M.riemannSum(M.f, 0, 3, 24, 'mid') - exact);
  C.check('exactArea(0, 3) = 4.5 matches Simpson integ(f, 0, 3) and midpoint error quarters when n doubles',
    near(exact, 4.5, 1e-12) && near(exact, simp, 1e-9) && near(e6 / e24, 16, 1e-6), `e6/e24 = ${(e6 / e24).toFixed(2)}`); }

// 5. Fundamental Theorem of Calculus: d/dx ∫₀ˣ f(t) dt = f(x) and ∫₀ˣ f'(t) dt = f(x) − f(0) via rk4 and integ
for (const x of [0.8, 1.6, 2.7]) {
  const dArea = deriv(u => integ(M.f, 0, u, 400), x);
  const intSlope = rk4((t, y) => M.df(t), 0, 0, x, 400).at(-1);
  C.check(`FTC at x = ${x}: d/dx ∫₀ˣ f = f(x) and ∫₀ˣ f′ = f(x) − f(0)`,
    near(dArea, M.f(x), 1e-6) && near(intSlope, M.f(x) - M.f(0), 1e-7));
}

// 6. Signed area wave: ∫₀ˣ cos(½π t) dt matches (2/π) sin(½π x)
for (const x of [1, 2, 3]) {
  C.check(`signed integral of cos(½π t) on [0, ${x}] matches netWave(${x})`,
    near(integ(M.rateWave, 0, x), M.netWave(x), 1e-9));
}

// 7. Practice questions: every question has 4 unique choices and its answer is independently recomputed
const fmt = (x, n = 2) => (x < -1e-12 ? '−' : '') + Math.abs(x).toFixed(n);
const ans = (p, i) => PRACTICE[p][i].choices[PRACTICE[p][i].answer];
for (const [page, qs] of Object.entries(PRACTICE)) {
  for (const [i, q] of qs.entries()) {
    const uniq = new Set(q.choices).size === q.choices.length;
    const valid = q.answer >= 0 && q.answer < q.choices.length && q.why.length > 20;
    C.check(`practice p.${page}#${i + 1} has 4 distinct choices and explanation`, uniq && valid);
  }
}
C.check('practice 0#1: secant slope from x=1 to x=2 via (f(2)-f(1))/(2-1)', ans(0, 0) === fmt((0.5 * 4 - 0.5 * 1) / 1, 2));
C.check('practice 0#2: limit as h -> 0 at x=1 via central-difference deriv(f, 1)', ans(0, 1) === fmt(deriv(M.f, 1), 2));
C.check('practice 1#1: derivative f\'(2.5) via central-difference deriv(f, 2.5)', ans(1, 0) === fmt(deriv(M.f, 2.5), 2));
C.check('practice 1#2: tangent height at x=3 from x=2 via f(2) + deriv(f, 2)*(3-2)', ans(1, 1) === fmt(M.f(2) + deriv(M.f, 2) * (3 - 2), 1));
{ const r1 = bisect(x => deriv(M.g, x), -0.5, 0.8), r2 = bisect(x => deriv(M.g, x), 1.2, 2.6);
  C.check('practice 2#1: stationary points of g(x) via bisect on numerical derivative', ans(2, 0) === `x = ${Math.round(r1)} and x = ${Math.round(r2)}`);
  const d2 = deriv(x => deriv(M.g, x), r2);
  C.check('practice 2#2: nature and height at x=2 via numerical second derivative', d2 > 0 && ans(2, 1) === `minimum, g(2) = ${fmt(M.g(r2), 2)}`); }
{ const midSum = [0.5, 1.5, 2.5].reduce((s, xm) => s + 0.5 * xm * xm * 1, 0);
  C.check('practice 3#1: 3-bar midpoint sum on [0, 3] via explicit midpoint sum', ans(3, 0) === fmt(midSum, 3));
  C.check('practice 3#2: exact area on [0, 3] via Simpson integ(f, 0, 3)', ans(3, 1) === fmt(integ(M.f, 0, 3), 2)); }
C.check('practice 4#1: area under slope curve on [0, 2] via Simpson integ(df, 0, 2)', ans(4, 0) === fmt(integ(M.df, 0, 2), 2));
C.check('practice 4#2: d/dx ∫₀ˣ f(t) dt at x=2.4 via numerical deriv of integ', ans(4, 1) === fmt(deriv(x => integ(M.f, 0, x, 200), 2.4), 2));
C.check('practice 5#1: signed area ∫₀² cos(½π t) dt via Simpson integ', ans(5, 0) === fmt(integ(M.rateWave, 0, 2), 2));
C.check('practice 5#2: first positive arch ∫₀¹ cos(½π t) dt via Simpson integ', ans(5, 1) === fmt(integ(M.rateWave, 0, 1), 2));

C.report();
