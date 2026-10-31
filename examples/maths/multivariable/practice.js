// Exam-style practice for Chapter 6: Multivariable Calculus (2 questions per page, 12 total).
import * as M from './model.js';

const fmt = (x, n = 2) => (x < -1e-12 ? '−' : '') + Math.abs(x).toFixed(n);
const fmtVec = ([x, y], n = 2) => `(${fmt(x, n)}, ${fmt(y, n)})`;

const x0_0 = 1.2, y0_0 = 0.8, fx0 = M.domeFx(x0_0, y0_0);
const zTan1 = M.domeTangentPlane(1, 1, 1.5, 1.0);
const gradMag2 = Math.hypot(...M.domeGrad(1.2, 0.9));
const flux4 = M.diskFluxExact(1.5, 1, 1);
const circ5 = M.diskCirculationExact(1.5, 1);

export const PRACTICE = {
  0: [
    { q: `On the surface <i>f</i>(<i>x</i>, <i>y</i>) = 2 − ½(<i>x</i>² + <i>y</i>²), what is the partial derivative ∂<i>f</i>/∂<i>x</i> at the point (<i>x</i>, <i>y</i>) = (${fmt(x0_0, 1)}, ${fmt(y0_0, 1)})?`,
      numeric: { answer: fx0, tol: 0.02, placeholder: '-1.20' },
      target: { label: 'Check x = 1.2 in figure', hint: 'Drag the surface point to x = 1.2', check: s => Math.abs((s?.slice?.x0 ?? 0) - x0_0) <= 0.18 },
      choices: [fmt(fx0, 2), fmt(-y0_0, 2), fmt(M.dome(x0_0, y0_0), 2), '+1.20'], answer: 0,
      why: `<p>Holding <i>y</i> constant treats ½<i>y</i>² as a constant, so ∂/∂<i>x</i> [2 − ½<i>x</i>² − ½<i>y</i>²] = −<i>x</i>. At <i>x</i> = 1.2, the slice slopes down at <b>${fmt(fx0, 2)}</b>.</p>` },
    { q: `What does the partial derivative ∂<i>f</i>/∂<i>y</i>(<i>x</i>₀, <i>y</i>₀) represent geometrically on the surface <i>z</i> = <i>f</i>(<i>x</i>, <i>y</i>)?`,
      choices: ['The slope of the surface cut by the plane x = x₀ (moving purely in the y-direction)', 'The slope of the surface cut by y = y₀', 'The volume under the surface', 'The angle between the x and y axes'], answer: 0,
      why: `<p>∂<i>f</i>/∂<i>y</i> freezes <i>x</i> = <i>x</i>₀ and measures the rate of change of height <i>z</i> per unit step in the <b><i>y</i>-direction</b>.</p>` },
  ],
  1: [
    { q: `At (<i>x</i>₀, <i>y</i>₀) = (1, 1) on <i>f</i>(<i>x</i>, <i>y</i>) = 2 − ½(<i>x</i>² + <i>y</i>²), we have <i>f</i>(1, 1) = 1, <i>f<sub>x</sub></i> = −1, and <i>f<sub>y</sub></i> = −1. What height <i>z</i> does the tangent plane give at (1.5, 1.0)?`,
      numeric: { answer: zTan1, tol: 0.02, placeholder: '0.50' },
      choices: ['0.375', fmt(zTan1, 2), '1.00', '1.50'], answer: 1,
      why: `<div class="eq"><i>z</i> = <i>f</i>(1, 1) + <i>f<sub>x</sub></i>(<i>x</i> − 1) + <i>f<sub>y</sub></i>(<i>y</i> − 1) = 1 − 1(0.5) − 1(0) = ${fmt(zTan1, 2)}</div>` },
    { q: `Which vector is perpendicular (upward normal) to the tangent plane <i>z</i> = <i>z</i>₀ + <i>f<sub>x</sub></i>(<i>x</i> − <i>x</i>₀) + <i>f<sub>y</sub></i>(<i>y</i> − <i>y</i>₀)?`,
      choices: ['(f_x, f_y, 1)', '(−f_x, −f_y, 1)', '(1, 1, f_x + f_y)', '(f_y, −f_x, 0)'], answer: 1,
      why: `<p>Taking the cross product of the two tangent vectors <b>t</b><sub><i>x</i></sub> = (1, 0, <i>f<sub>x</sub></i>) and <b>t</b><sub><i>y</i></sub> = (0, 1, <i>f<sub>y</sub></i>) yields <b>t</b><sub><i>x</i></sub> × <b>t</b><sub><i>y</i></sub> = <b>(−<i>f<sub>x</sub></i>, −<i>f<sub>y</sub></i>, 1)</b>.</p>` },
  ],
  2: [
    { q: `At (<i>x</i>, <i>y</i>) = (1.2, 0.9) on <i>f</i>(<i>x</i>, <i>y</i>) = 2 − ½(<i>x</i>² + <i>y</i>²), the gradient is ∇<i>f</i> = (−1.2, −0.9). What is the steepest uphill slope |∇<i>f</i>| at that point?`,
      numeric: { answer: gradMag2, tol: 0.02, placeholder: '1.50' },
      choices: ['1.05', fmt(gradMag2, 2), '2.10', '2.25'], answer: 1,
      why: `<p>The maximum directional derivative is the length of the gradient vector: |∇<i>f</i>| = √((−1.2)² + (−0.9)²) = √(1.44 + 0.81) = √2.25 = <b>${fmt(gradMag2, 2)}</b>, pointing radially inward toward the summit (0, 0).</p>` },
    { q: `If you walk along a level contour curve <i>f</i>(<i>x</i>(<i>t</i>), <i>y</i>(<i>t</i>)) = constant, what is the directional derivative D<sub><b>u</b></sub><i>f</i> = ∇<i>f</i> · <b>u</b> tangent to the contour?`,
      numeric: { answer: 0, tol: 0.01, placeholder: '0.00' },
      choices: ['−|∇f|', '0.00 (the gradient is always perpendicular to level curves)', '+|∇f|', '1.00'], answer: 1,
      why: `<p>Along a contour, height <i>f</i> does not change, so by the chain rule d<i>f</i>/d<i>t</i> = ∇<i>f</i> · <b>u</b> = <b>0.00</b>: the gradient vector ∇<i>f</i> is orthogonal to every level curve.</p>` },
  ],
  3: [
    { q: `For the saddle surface <i>h</i>(<i>x</i>, <i>y</i>) = ½(<i>x</i>² − <i>y</i>²), what are the second partials <i>h<sub>xx</sub></i>, <i>h<sub>yy</sub></i>, <i>h<sub>xy</sub></i> and the Hessian determinant <i>D</i> = <i>h<sub>xx</sub>h<sub>yy</sub></i> − <i>h<sub>xy</sub></i>²?`,
      numeric: { answer: -1, tol: 0.01, placeholder: '-1.00' },
      choices: ['h_xx = 1, h_yy = −1, h_xy = 0, D = −1 (saddle point)', 'h_xx = 1, h_yy = 1, h_xy = 0, D = +1 (minimum)', 'h_xx = −1, h_yy = −1, D = +1 (maximum)', 'D = 0'], answer: 0,
      why: `<p>Since <i>h<sub>xx</sub></i> = +1 (curving up along <i>x</i>) and <i>h<sub>yy</sub></i> = −1 (curving down along <i>y</i>) with <i>h<sub>xy</sub></i> = 0, the Hessian determinant is <i>D</i> = (1)(−1) − 0² = <b>−1 &lt; 0</b>, the signature of a saddle point.</p>` },
    { q: `Suppose a critical point (∇<i>f</i> = <b>0</b>) has <i>D</i> = <i>f<sub>xx</sub>f<sub>yy</sub></i> − <i>f<sub>xy</sub></i>² &gt; 0 and <i>f<sub>xx</sub></i> &lt; 0. What kind of point is it?`,
      choices: ['A local minimum', 'A local maximum (curving downward in every direction)', 'A saddle point', 'An inflection line'], answer: 1,
      why: `<p><i>D</i> &gt; 0 means both principal curvatures have the same sign, and <i>f<sub>xx</sub></i> &lt; 0 means that sign is negative (concave down in all directions: a <b>local maximum</b>).</p>` },
  ],
  4: [
    { q: `What is the divergence ∇ · <b>F</b> = ∂<i>F<sub>x</sub></i>/∂<i>x</i> + ∂<i>F<sub>y</sub></i>/∂<i>y</i> of the radial source field <b>F</b>(<i>x</i>, <i>y</i>) = (<i>x</i>, <i>y</i>), and what is its outward flux through a circle of radius <i>R</i> = 1.5?`,
      numeric: { answer: flux4, tol: 0.05, placeholder: '14.14' },
      choices: [`div F = 1, flux = 7.07`, `div F = 2, flux = 2πR² ≈ ${fmt(flux4, 2)}`, `div F = 0, flux = 0.00`, `div F = 2, flux = ${fmt(Math.PI * 1.5 * 1.5, 2)}`], answer: 1,
      why: `<p>Here ∂<i>x</i>/∂<i>x</i> + ∂<i>y</i>/∂<i>y</i> = 1 + 1 = <b>2</b> everywhere. By the 2D Divergence Theorem, outward flux is ∬ (∇ · <b>F</b>) d<i>A</i> = 2 × π(1.5²) = 4.5π ≈ <b>${fmt(flux4, 2)}</b>.</p>` },
    { q: `If a fluid velocity field is incompressible (no sources or sinks anywhere), what is its divergence ∇ · <b>F</b>?`,
      numeric: { answer: 0, tol: 0.01, placeholder: '0.00' },
      choices: ['0.00 everywhere', '+1.00', '−1.00', '2π'], answer: 0,
      why: `<p>When ∇ · <b>F</b> = <b>0</b>, exactly as much fluid flows out of any closed region as flows in.</p>` },
  ],
  5: [
    { q: `For the rigid-rotation vortex field <b>G</b>(<i>x</i>, <i>y</i>) = (−<i>y</i>, <i>x</i>), what is its scalar curl (∇ × <b>G</b>)<sub><i>z</i></sub> = ∂<i>G<sub>y</sub></i>/∂<i>x</i> − ∂<i>G<sub>x</sub></i>/∂<i>y</i>, and what is the circulation ∮ <b>G</b> · d<b>r</b> around a circle of radius <i>R</i> = 1.5?`,
      numeric: { answer: circ5, tol: 0.05, placeholder: '14.14' },
      choices: [`curl = 0, circulation = 0`, `curl = 1, circulation = 7.07`, `curl = 2, circulation = 2πR² ≈ ${fmt(circ5, 2)}`, `curl = −2, circulation = −14.14`], answer: 2,
      why: `<p>We have ∂(<i>x</i>)/∂<i>x</i> − ∂(−<i>y</i>)/∂<i>y</i> = 1 − (−1) = <b>2</b>. By Green's theorem, ∮ <b>G</b> · d<b>r</b> = ∬ (∇ × <b>G</b>)<sub><i>z</i></sub> d<i>A</i> = 2 × π(1.5²) ≈ <b>${fmt(circ5, 2)}</b>.</p>` },
    { q: `Why is the curl of any gradient field <b>F</b> = ∇<i>f</i> identically zero (∇ × ∇<i>f</i> = 0)?`,
      choices: ['Because gradients are constant', 'By Clairaut’s theorem of mixed partials: ∂/∂x(∂f/∂y) − ∂/∂y(∂f/∂x) = f_yx − f_xy = 0', 'Because divergence is zero', 'Because level curves are circles'], answer: 1,
      why: `<p>Climbing around any closed loop on a smooth hill <i>z</i> = <i>f</i>(<i>x</i>, <i>y</i>) must return you to the same elevation (net height change ∮ ∇<i>f</i> · d<b>r</b> = 0), which algebraically reflects <i>f<sub>xy</sub></i> = <i>f<sub>yx</sub></i>.</p>` },
  ],
};
