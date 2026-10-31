// Pure-math Practice questions for Chapter 4: Differential Equations (2 per page, 12 total).
import * as M from './model.js';

const fmt = (x, n = 2) => (x < -1e-12 ? '−' : '') + Math.abs(x).toFixed(n);

const y0_p0 = 1.0, t_p0 = 2.0, yExact0 = M.slopeFieldExact(t_p0, 0, y0_p0);
const y0_p1 = 2.6, t_p1 = 1.25, yCool1 = M.coolingExact(t_p1, y0_p1);
const maxRate2 = M.logisticRhs(M.K_LOG / 2);
const eHarm3 = M.harmonicEnergy(1.5, 2.0);
const spMat = M.spiralMat(), spTr = M.trace(spMat), spDet = M.det(spMat);
const sadDet = M.det(M.SADDLE_MAT), sadL1 = M.eigenvalues(M.SADDLE_MAT).l1;

export const PRACTICE = {
  0: [
    { q: `For the differential equation d<i>y</i>/d<i>t</i> = <i>y</i> − <i>t</i>, what is the slope of the solution curve passing through the point (<i>t</i>, <i>y</i>) = (1.50, 0.50)?`,
      numeric: { answer: -1.0, tol: 0.02, placeholder: '-1.00' },
      target: { label: 'Check point in figure', hint: 'Drag the red initial point to (t, y) = (1.5, 0.5)', check: s => Math.hypot((s?.slope?.t0 ?? 0) - 1.5, (s?.slope?.y0 ?? 0) - 0.5) <= 0.25 },
      choices: ['−1.00', '0.00', '1.00', '2.00'], answer: 0,
      why: `<p>Substitute <i>t</i> = 1.50 and <i>y</i> = 0.50 directly into the right-hand side: d<i>y</i>/d<i>t</i> = 0.50 − 1.50 = <b>−1.00</b>.</p>` },
    { q: `Starting at (<i>t</i>₀, <i>y</i>₀) = (0, 1), the slope is d<i>y</i>/d<i>t</i> = 1 − 0 = 1, and the solution follows the straight isocline <i>y</i>(<i>t</i>) = <i>t</i> + 1. What is <i>y</i>(${fmt(t_p0, 0)})?`,
      numeric: { answer: yExact0, tol: 0.02, placeholder: '3.00' },
      choices: ['1.00', '2.00', fmt(yExact0, 2), '3.72'], answer: 2,
      why: `<p>On the line <i>y</i> = <i>t</i> + 1, the derivative is d<i>y</i>/d<i>t</i> = 1 and the formula gives <i>y</i> − <i>t</i> = (<i>t</i> + 1) − <i>t</i> = 1 everywhere. At <i>t</i> = 2, <i>y</i>(2) = <b>${fmt(yExact0, 2)}</b>.</p>` },
  ],
  1: [
    { q: `For d<i>y</i>/d<i>t</i> = −0.8(<i>y</i> − 1.0), what is the relaxation time constant τ = 1/<i>k</i>?`,
      numeric: { answer: M.coolingTau(), tol: 0.02, placeholder: '1.25' },
      choices: ['0.80 s', `${fmt(M.coolingTau(), 2)} s`, '1.60 s', '2.50 s'], answer: 1,
      why: `<p>Writing the rate as −(<i>y</i> − <i>y</i><sub>eq</sub>)/τ identifies τ = 1/<i>k</i> = 1 / 0.8 = <b>${fmt(M.coolingTau(), 2)} s</b>: the time for the gap from equilibrium to shrink by a factor of <i>e</i>.</p>` },
    { q: `Starting at <i>y</i>(0) = 2.60 (an initial gap of 1.60 above <i>y</i><sub>eq</sub> = 1.00), what is <i>y</i>(τ) after one time constant <i>t</i> = 1.25 s?`,
      numeric: { answer: yCool1, tol: 0.02, placeholder: '1.59' },
      choices: ['1.00', fmt(yCool1, 2), '1.80', '2.01'], answer: 1,
      why: `<div class="eq"><i>y</i>(τ) = 1.00 + 1.60 <i>e</i><sup>−1</sup> ≈ 1.00 + 0.59 = ${fmt(yCool1, 2)}</div>` },
  ],
  2: [
    { q: `For the logistic equation d<i>y</i>/d<i>t</i> = 1.2<i>y</i>(1 − <i>y</i> / 2.4), which equilibrium is stable and which is unstable?`,
      choices: ['y = 0 stable, y = 2.4 unstable', 'y = 0 unstable, y = 2.4 stable', 'Both stable', 'Both unstable'], answer: 1,
      why: `<p>For 0 &lt; <i>y</i> &lt; 2.4, d<i>y</i>/d<i>t</i> &gt; 0 so trajectories move upward away from 0 and toward 2.4; for <i>y</i> &gt; 2.4, d<i>y</i>/d<i>t</i> &lt; 0 so they move downward toward 2.4. Thus <b><i>y</i> = 0 is unstable and <i>y</i> = 2.4 is stable</b>.</p>` },
    { q: `At what population <i>y</i> is the growth rate d<i>y</i>/d<i>t</i> = 1.2<i>y</i>(1 − <i>y</i> / 2.4) largest, and what is that maximum rate?`,
      numeric: { answer: maxRate2, tol: 0.02, placeholder: '0.72' },
      choices: [`y = 1.20, rate = ${fmt(maxRate2, 2)}`, 'y = 2.40, rate = 1.44', 'y = 0.60, rate = 0.54', 'y = 1.20, rate = 1.20'], answer: 0,
      why: `<p>The parabola <i>r y</i>(1 − <i>y</i>/<i>K</i>) peaks halfway between its roots at <i>y</i> = ½<i>K</i> = 1.20, where d<i>y</i>/d<i>t</i> = ¼<i>rK</i> = ¼(1.2)(2.4) = <b>${fmt(maxRate2, 2)}</b>.</p>` },
  ],
  3: [
    { q: `In the undamped oscillator system d<i>x</i>/d<i>t</i> = <i>v</i>, d<i>v</i>/d<i>t</i> = −<i>x</i>, what is the conserved energy <i>E</i> = ½(<i>x</i>² + <i>v</i>²) along the orbit through (<i>x</i>, <i>v</i>) = (1.50, 2.00)?`,
      numeric: { answer: eHarm3, tol: 0.02, placeholder: '3.125' },
      choices: ['2.500', fmt(eHarm3, 3), '4.250', '6.250'], answer: 1,
      why: `<p>Substitute <i>x</i> = 1.5 and <i>v</i> = 2.0: <i>E</i> = ½(1.5² + 2.0²) = ½(2.25 + 4.00) = <b>${fmt(eHarm3, 3)}</b>,corresponding to a circle of radius √(1.5² + 2.0²) = 2.5.</p>` },
    { q: `Which way do trajectories circulate around the origin in the (<i>x</i>, <i>v</i>) phase plane where d<i>x</i>/d<i>t</i> = <i>v</i> and d<i>v</i>/d<i>t</i> = −<i>x</i>?`,
      choices: ['Clockwise (in the upper half-plane v > 0, x increases to the right)', 'Counter-clockwise', 'Straight radially inward', 'Straight radially outward'], answer: 0,
      why: `<p>In the upper half-plane (<i>v</i> &gt; 0), d<i>x</i>/d<i>t</i> = <i>v</i> &gt; 0 so the state moves to the right; in the lower half-plane (<i>v</i> &lt; 0), it moves to the left — a <b>clockwise</b> orbit.</p>` },
  ],
  4: [
    { q: `For the damped oscillator matrix <i>J</i> = [[0, 1], [−1, −0.5]] (γ = 0.25, ω₀ = 1), what are trace(<i>J</i>) and det(<i>J</i>)?`,
      choices: [`trace = ${fmt(spTr, 2)}, det = ${fmt(spDet, 2)}`, 'trace = 0.50, det = 1.00', 'trace = −0.50, det = −1.00', 'trace = 0.00, det = 0.50'], answer: 0,
      why: `<p>trace(<i>J</i>) = 0 + (−0.5) = <b>${fmt(spTr, 2)}</b> &lt; 0 and det(<i>J</i>) = 0(−0.5) − 1(−1) = <b>${fmt(spDet, 2)}</b> &gt; 0. Since Δ = trace² − 4 det = 0.25 − 4 = −3.75 &lt; 0, the origin is a stable spiral sink.</p>` },
    { q: `Why does adding −2γ<i>v</i> to d<i>v</i>/d<i>t</i> turn closed circular orbits into inward spirals?`,
      choices: ['It makes det(J) negative', 'Energy changes at rate dE/dt = x x′ + v v′ = −2γ v² ≤ 0, draining mechanical energy whenever v ≠ 0', 'It reverses the direction of motion', 'It shifts the equilibrium away from (0, 0)'], answer: 1,
      why: `<p>Differentiating <i>E</i> = ½(<i>x</i>² + <i>v</i>²) gives d<i>E</i>/d<i>t</i> = <i>x v</i> + <i>v</i>(−<i>x</i> − 2γ<i>v</i>) = <b>−2γ<i>v</i>² ≤ 0</b>, so the radius shrinks continuously into the origin.</p>` },
  ],
  5: [
    { q: `What is the determinant of the matrix <i>A</i> = [[0.8, 0.4], [0.4, −0.8]], and what type of equilibrium is the origin?`,
      numeric: { answer: sadDet, tol: 0.02, placeholder: '-0.80' },
      choices: [`det = ${fmt(sadDet, 2)}, a saddle point`, 'det = +0.80, a center', 'det = −0.48, a spiral sink', 'det = 0.00, a line of equilibria'], answer: 0,
      why: `<p>det(<i>A</i>) = (0.8)(−0.8) − (0.4)(0.4) = −0.64 − 0.16 = <b>${fmt(sadDet, 2)}</b> &lt; 0. Any 2×2 linear system with det(<i>A</i>) &lt; 0 has one positive and one negative real eigenvalue — a <b>saddle point</b>.</p>` },
    { q: `What is the positive (unstable) eigenvalue λ₁ of <i>A</i> = [[0.8, 0.4], [0.4, −0.8]]?`,
      numeric: { answer: sadL1, tol: 0.01, placeholder: '0.894' },
      choices: ['0.800', fmt(sadL1, 3), '1.200', '1.600'], answer: 1,
      why: `<div class="eq">λ² − trace(<i>A</i>)λ + det(<i>A</i>) = λ² − 0.80 = 0 &nbsp;⇒&nbsp; λ₁ = √0.80 ≈ ${fmt(sadL1, 3)}</div>` },
  ],
};
