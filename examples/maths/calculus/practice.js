// calculus/practice.js — exam-style practice (A-level, IB, AP Calculus AB), two questions per page.
// Every number is computed from model.js; checks.mjs verifies every answer a second way.
import * as M from './model.js';

const fmt = (x, n = 2) => (x < -1e-12 ? '−' : '') + Math.abs(x).toFixed(n);

// 0 · Secant slope on f(x) = ½x² from x = 1 to x = 2 (h = 1), and limit as h → 0
const a0 = 1, h0 = 1, mSec0 = M.secantSlope(a0, h0), mTan0 = M.df(a0);
// 1 · Derivative of f(x) = ½x² at x = 2.5, and tangent line height at x = 3 from P(2, 2)
const x1 = 2.5, m1 = M.df(x1), a1 = 2, x1b = 3, yTan1 = M.tangentY(a1, x1b);
// 2 · Stationary points of g(x) = ⅓x³ − x² + 2
const gMax = M.g(M.G_MAX_X), gMin = M.g(M.G_MIN_X);
// 3 · Midpoint Riemann sum of f(x) = ½x² on [0, 3] with n = 3 bars vs exact 4.5
const n3 = 3, mid3 = M.riemannSum(M.f, 0, 3, n3, 'mid'), exact3 = M.exactArea(0, 3);
// 4 · Fundamental Theorem: ∫₀² t dt and d/dx ∫₀ˣ ½t² dt at x = 2.4
const x4 = 2, areaSlope4 = M.f(x4) - M.f(0), x4b = 2.4, rateArea4 = M.f(x4b);
// 5 · Signed area of v(t) = cos(½π t) from t = 0 to t = 2 (one positive lobe + one equal negative lobe)
const net1 = M.netWave(1), net2 = M.netWave(2);

export const PRACTICE = {
  0: [
    { q: `On <i>f</i>(<i>x</i>) = ½<i>x</i>², what is the slope of the secant line through <i>P</i> at <i>x</i> = ${a0} and <i>Q</i> at <i>x</i> = ${a0 + h0} (step <i>h</i> = ${h0})?`,
      numeric: { answer: mSec0, tol: 0.02, placeholder: '1.50' },
      target: { label: 'Check Q at x = 2 in figure', hint: 'Drag Q on the curve to x = 2.0 (h = 1.0)', check: s => Math.abs((s?.secant?.h ?? 0) - h0) <= 0.15 },
      choices: [fmt(M.f(a0), 2), fmt(mSec0, 2), fmt(mTan0, 2), fmt(2.0, 2)], answer: 1,
      why: `<p>At <i>x</i> = 1, <i>f</i>(1) = 0.5; at <i>x</i> = 2, <i>f</i>(2) = 2.0. Rise over run is (2.0 − 0.5) / (2 − 1) = <b>${fmt(mSec0, 2)}</b>, which equals <i>a</i> + ½<i>h</i> = 1 + 0.5.</p>` },
    { q: `As the step <i>h</i> → 0, what limit does the secant slope (<i>f</i>(1 + <i>h</i>) − <i>f</i>(1)) / <i>h</i> = 1 + ½<i>h</i> approach?`,
      numeric: { answer: mTan0, tol: 0.02, placeholder: '1.00' },
      choices: ['0.50', '1.00', '1.50', '2.00'], answer: 1,
      why: `<p>As <i>h</i> shrinks toward zero, the term ½<i>h</i> vanishes, leaving the instantaneous slope <i>f</i>′(1) = <b>1.00</b>.</p>` },
  ],
  1: [
    { q: `For <i>f</i>(<i>x</i>) = ½<i>x</i>², what is the derivative <i>f</i>′(${fmt(x1, 1)})?`,
      numeric: { answer: m1, tol: 0.02, placeholder: '2.50' },
      target: { label: 'Check P at x = 2.5 in figure', hint: 'Drag P on the upper curve to x = 2.5', check: s => Math.abs((s?.deriv?.x ?? 0) - x1) <= 0.15 },
      choices: [fmt(M.f(x1), 2), fmt(m1, 2), fmt(2 * x1, 2), fmt(x1 / 2, 2)], answer: 1,
      why: `<p>By the power rule, d/d<i>x</i>(½<i>x</i>²) = ½ · 2<i>x</i> = <i>x</i>. At <i>x</i> = ${fmt(x1, 1)}, the slope is <b>${fmt(m1, 2)}</b>.</p>` },
    { q: `The tangent line to <i>f</i>(<i>x</i>) = ½<i>x</i>² at <i>x</i> = ${a1} passes through (${a1}, ${fmt(M.f(a1), 0)}) with slope <i>f</i>′(${a1}) = ${fmt(M.df(a1), 0)}. What is its height <i>y</i> at <i>x</i> = ${x1b}?`,
      numeric: { answer: yTan1, tol: 0.02, placeholder: '4.0' },
      choices: [fmt(M.f(x1b), 1), fmt(yTan1, 1), fmt(3.0, 1), fmt(5.0, 1)], answer: 1,
      why: `<div class="eq"><i>y</i> = <i>f</i>(2) + <i>f</i>′(2)(<i>x</i> − 2) = 2 + 2(3 − 2) = ${fmt(yTan1, 1)}</div><p>Notice the curve itself reaches <i>f</i>(3) = 4.5, which is 0.5 higher because the parabola curves upward.</p>` },
  ],
  2: [
    { q: `At which two values of <i>x</i> does <i>g</i>(<i>x</i>) = ⅓<i>x</i>³ − <i>x</i>² + 2 have a horizontal tangent (<i>g</i>′(<i>x</i>) = 0)?`,
      choices: ['x = 0 and x = 1', 'x = 0 and x = 2', 'x = 1 and x = 2', 'x = −1 and x = 2'], answer: 1,
      why: `<p>Differentiate term by term: <i>g</i>′(<i>x</i>) = <i>x</i>² − 2<i>x</i> = <i>x</i>(<i>x</i> − 2). Setting <i>g</i>′(<i>x</i>) = 0 gives <b><i>x</i> = 0 and <i>x</i> = 2</b>.</p>` },
    { q: `At <i>x</i> = 2 on <i>g</i>(<i>x</i>) = ⅓<i>x</i>³ − <i>x</i>² + 2, is the stationary point a local maximum or local minimum, and what is <i>g</i>(2)?`,
      numeric: { answer: gMin, tol: 0.02, placeholder: '0.67' },
      target: { label: 'Check local minimum in figure', hint: 'Drag the glider on the cubic to the local minimum at x = 2', check: s => Math.abs((s?.turning?.x ?? 0) - M.G_MIN_X) <= 0.18 },
      choices: [`maximum, g(2) = ${fmt(gMax, 2)}`, `minimum, g(2) = ${fmt(gMin, 2)}`, `maximum, g(2) = ${fmt(gMin, 2)}`, `inflection, g(2) = ${fmt(M.g(1), 2)}`], answer: 1,
      why: `<p>The second derivative is <i>g</i>″(<i>x</i>) = 2<i>x</i> − 2, so <i>g</i>″(2) = +2 > 0 ( curving up: a <b>local minimum</b>) of height <i>g</i>(2) = 8/3 − 4 + 2 = 2/3 ≈ ${fmt(gMin, 2)}.</p>` },
  ],
  3: [
    { q: `Approximate ∫₀³ ½<i>x</i>² d<i>x</i> with <i>n</i> = 3 midpoint rectangles of width Δ<i>x</i> = 1 (midpoints at <i>x</i> = 0.5, 1.5, 2.5). What is their total area?`,
      choices: [fmt(M.riemannSum(M.f, 0, 3, 3, 'left'), 3), fmt(mid3, 3), fmt(exact3, 3), fmt(M.riemannSum(M.f, 0, 3, 3, 'right'), 3)], answer: 1,
      why: `<p>Each bar has width Δ<i>x</i> = 1, so the sum is ½(0.5² + 1.5² + 2.5²) = ½(0.25 + 2.25 + 6.25) = <b>${fmt(mid3, 3)}</b> — already within 0.125 of the exact area 4.500.</p>` },
    { q: `As the number of rectangles <i>n</i> → ∞, what is the exact area ∫₀³ ½<i>x</i>² d<i>x</i>?`,
      choices: ['3.00', '4.38', '4.50', '6.75'], answer: 2,
      why: `<p>An antiderivative of ½<i>x</i>² is ⅙<i>x</i>³, so ∫₀³ ½<i>x</i>² d<i>x</i> = ⅙(3³ − 0³) = 27/6 = <b>4.50</b>.</p>` },
  ],
  4: [
    { q: `By the Fundamental Theorem of Calculus, the area under the slope curve <i>f</i>′(<i>t</i>) = <i>t</i> from <i>t</i> = 0 to <i>t</i> = ${x4} equals <i>f</i>(${x4}) − <i>f</i>(0). What is that area?`,
      choices: [fmt(1.0, 2), fmt(areaSlope4, 2), fmt(M.F(x4), 2), fmt(4.0, 2)], answer: 1,
      why: `<p>∫₀² <i>t</i> d<i>t</i> = [½<i>t</i>²]₀² = ½(2²) − 0 = <b>${fmt(areaSlope4, 2)}</b>, which is also the area of a triangle of base 2 and height 2.</p>` },
    { q: `Let <i>A</i>(<i>x</i>) = ∫₀ˣ ½<i>t</i>² d<i>t</i> be the area under the parabola up to <i>x</i>. How fast is <i>A</i>(<i>x</i>) growing with <i>x</i> at the moment <i>x</i> = ${fmt(x4b, 1)}?`,
      choices: [fmt(M.F(x4b), 2), fmt(rateArea4, 2), fmt(M.df(x4b), 2), fmt(4.5, 2)], answer: 1,
      why: `<p>By the first part of the Fundamental Theorem, d<i>A</i>/d<i>x</i> = <i>f</i>(<i>x</i>) = ½<i>x</i>² — the height of the curve at the moving right wall. At <i>x</i> = ${fmt(x4b, 1)}, d<i>A</i>/d<i>x</i> = ½(2.4²) = <b>${fmt(rateArea4, 2)}</b>.</p>` },
  ],
  5: [
    { q: `The rate curve <i>v</i>(<i>t</i>) = cos(½π<i>t</i>) is positive on [0, 1] and equally negative on [1, 2]. What is the net signed area ∫₀² cos(½π<i>t</i>) d<i>t</i>?`,
      choices: [fmt(net1, 2), fmt(net2, 2), fmt(2 * net1, 2), '1.00'], answer: 1,
      why: `<p>The positive arch from 0 to 1 adds +2/π ≈ +${fmt(net1, 2)}, and the negative arch from 1 to 2 subtracts −2/π, so at <i>t</i> = 2 the net change is exactly <b>${fmt(net2, 2)}</b>.</p>` },
    { q: `How much area does the first positive arch of cos(½π<i>t</i>) enclose between <i>t</i> = 0 and <i>t</i> = 1?`,
      choices: ['0.50', fmt(net1, 2), '0.79', '1.00'], answer: 1,
      why: `<div class="eq">∫₀¹ cos(½π<i>t</i>) d<i>t</i> = [(2/π) sin(½π<i>t</i>)]₀¹ = 2/π ≈ ${fmt(net1, 2)}</div>` },
  ],
};
