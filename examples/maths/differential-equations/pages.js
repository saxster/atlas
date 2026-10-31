// Prose, breakdowns, and SVG charts for Chapter 4: Differential Equations & Phase Portraits (6 pages).
import * as M from './model.js';
import { at } from './world.js';

const chartSlope = () => {
  const path = (t0, y0) => {
    const pts = [];
    for (let i = 0; i <= 40; i++) {
      const t = t0 + (i / 40) * (3 - t0);
      const y = Math.max(-1, Math.min(3, M.slopeFieldExact(t, t0, y0)));
      pts.push(`${i ? 'L' : 'M'}${(40 + (t / 3) * 320).toFixed(1)},${(115 - ((y + 1) / 4) * 95).toFixed(1)}`);
    }
    return pts.join(' ');
  };
  return `<div class="charts"><svg class="chart" viewBox="0 0 400 135" aria-label="Family of solution curves for dy/dt = y - t">
    <rect class="frame" x="40" y="15" width="320" height="100"/>
    <path class="trend" d="${path(0, 1.0)}" style="stroke:#2e8b57"/>
    <path class="curve" d="${path(0, 1.25)}" style="stroke:#c83e37"/>
    <path class="curve" d="${path(0, 0.75)}" style="stroke:#2e66b8"/>
    <text x="240" y="32" class="lab" style="fill:#c83e37">y₀ &gt; t₀ + 1 (curves up)</text>
    <text x="235" y="64" class="lab" style="fill:#2e8b57">y = t + 1 (straight)</text>
    <text x="225" y="108" class="lab" style="fill:#2e66b8">y₀ &lt; t₀ + 1 (curves down)</text>
  </svg></div>`;
};

const chartPhase = () => {
  return `<div class="charts"><svg class="chart" viewBox="0 0 400 135" aria-label="Trace-determinant stability plane">
    <rect class="frame" x="40" y="15" width="320" height="100"/>
    <line class="zero" x1="200" y1="15" x2="200" y2="115"/>
    <line class="zero" x1="40" y1="75" x2="360" y2="75"/>
    <path class="trend" d="M 80,18 Q 200,132 320,18"/>
    <text x="305" y="88">trace T</text>
    <text x="206" y="28">det Δ</text>
    <text x="72" y="52" class="lab" style="fill:#2e8b57">spiral sink (T&lt;0, Δ&gt;0)</text>
    <text x="225" y="52" class="lab">spiral source (T&gt;0)</text>
    <text x="155" y="106" class="lab" style="fill:#c83e37">saddle (det &lt; 0)</text>
  </svg></div>`;
};

export const PAGES = [
  {
    kicker: 'Chapter 4 · Differential equations',
    title: 'An equation for the slope at every point',
    sub: 'Instead of giving y(t) outright, a differential equation hands you a compass needle at every point (t, y)',
    fig: 'Slope field of dy/dt = y − t and an integral curve through (t₀, y₀)',
    alt: 'A 2D grid of slope arrows for dy/dt = y − t with a red integral curve threading through a draggable initial value dot.',
    cam: { target: at(0, 0, 2.0, 0), az: 0, el: 5, dist: 16.5 },
    lit: 'integralCurve',
    parts: ['slopeField', 'integralCurve'],
    look: {},
    body: `
      <p class="lede">An ordinary algebra equation asks for a number; a <b>differential equation</b> asks for a whole curve <i>y</i>(<i>t</i>) whose tangent slope at every point matches a rule:</p>
      <div class="eq">d<i>y</i> / d<i>t</i> = <i>f</i>(<i>t</i>, <i>y</i>) = <i>y</i> − <i>t</i></div>
      <p>Even before solving the equation with algebra, you can see every possible solution at once by drawing a tiny arrow of run 1 and rise <i>f</i>(<i>t</i>, <i>y</i>) at each grid point. That carpet of arrows is the <b>slope field</b>.</p>
      <p>Picking a starting point (<i>t</i>₀, <i>y</i>₀) pins down one curve: step forward in the direction of the local arrow, re-aim at the next arrow, and repeat. <b>Drag the red initial point (<i>t</i>₀, <i>y</i>₀) directly on the board</b> to watch its integral curve jump across the green dividing line <i>y</i> = <i>t</i> + 1.</p>
      ${chartSlope()}
      <p class="live" data-live="slope"></p>`,
  },
  {
    kicker: '4.1 · First-order relaxation',
    title: 'Closing the gap: exponential decay to equilibrium',
    sub: 'When the rate of change is proportional to the remaining gap, the gap shrinks by 1/e every τ = 1/k seconds',
    fig: 'Trajectories above and below y_eq = 1 relaxing exponentially',
    alt: 'Upper red and lower blue curves converging exponentially onto the green horizontal line y_eq = 1 with a draggable time marker.',
    cam: { target: at(1, 0, 2.0, 0), az: 0, el: 5, dist: 16.5 },
    lit: 'relaxCurves',
    parts: ['eqLine', 'relaxCurves'],
    look: {},
    body: `
      <p class="lede">A hot cup of coffee cooling toward room temperature, a RC circuit charging, and a chemical reaction approaching equilibrium all obey the same law: the rate is proportional to how far the system still is from its resting state <i>y</i><sub>eq</sub>:</p>
      <div class="eq">d<i>y</i> / d<i>t</i> = −<i>k</i>(<i>y</i> − <i>y</i><sub>eq</sub>) &nbsp;⇒&nbsp; <i>y</i>(<i>t</i>) = <i>y</i><sub>eq</sub> + (<i>y</i>₀ − <i>y</i><sub>eq</sub>) <i>e</i><sup>−<i>kt</i></sup></div>
      <p>Along the horizontal line <i>y</i> = <i>y</i><sub>eq</sub> = 1, the right-hand side is zero so the slope arrows lie completely flat. Above that line, arrows point down; below it, arrows point up.</p>
      <p>The reciprocal τ = 1/<i>k</i> = 1.25 s is the <b>time constant</b>. Drag the red point along the upper curve to verify that every 1.25 s cuts the amber vertical gap <i>y</i> − <i>y</i><sub>eq</sub> by a factor of <i>e</i> ≈ 2.718.</p>
      <p class="live" data-live="exp"></p>`,
  },
  {
    kicker: '4.2 · Autonomous equilibria',
    title: 'Stable attractors and unstable tipping points',
    sub: 'In dy/dt = r y (1 − y/K), arrows flee y = 0 and crowd into the carrying capacity y = K',
    fig: 'Logistic S-curve between unstable y = 0 and stable y = K = 2.4',
    alt: 'Logistic slope field and S-curve rising from near y = 0 through its steepest inflection at y = 1.2 and levelling off at K = 2.4.',
    cam: { target: at(2, 0, 2.0, 0), az: 0, el: 5, dist: 16.5 },
    lit: 'logisticCurve',
    parts: ['logisticCurve'],
    look: {},
    body: `
      <p class="lede">When the rate d<i>y</i>/d<i>t</i> = <i>f</i>(<i>y</i>) depends only on the state <i>y</i> and not on time <i>t</i>, the equation is <b>autonomous</b>. Every root where <i>f</i>(<i>y</i>*) = 0 gives a constant equilibrium solution.</p>
      <div class="eq">d<i>y</i> / d<i>t</i> = <i>r y</i> (1 − <i>y</i> / <i>K</i>)</div>
      <p>Here <i>f</i>(<i>y</i>) vanishes at two heights: <i>y</i> = 0 and <i>y</i> = <i>K</i> = 2.4. A small nudge above <i>y</i> = 0 puts the state where d<i>y</i>/d<i>t</i> &gt; 0, pushing it further away (an <b>unstable</b> equilibrium). Near <i>y</i> = <i>K</i>, arrows from both below and above point back toward <i>K</i> (a <b>stable</b> equilibrium).</p>
      <p>Halfway up at <i>y</i> = ½<i>K</i> = 1.2, the parabola <i>r y</i>(1 − <i>y</i>/<i>K</i>) reaches its peak ¼<i>rK</i> = 0.72: the S-curve's <b>inflection point</b> where growth switches from accelerating to decelerating.</p>
      <p class="live" data-live="logistic"></p>`,
  },
  {
    kicker: '4.3 · The phase plane',
    title: 'Turning acceleration into a 2D flow',
    sub: 'Plotting position x and velocity v together turns a second-order oscillation into a closed circle',
    fig: 'Undamped harmonic oscillator orbit in the (x, v) phase plane',
    alt: 'Circular clockwise orbit in the (x, v) phase plane with a red velocity vector tangent to the circle.',
    cam: { target: at(3, 0, 2.0, 0), az: 0, el: 5, dist: 16.2 },
    lit: 'phaseCircle',
    parts: ['phaseCircle'],
    look: {},
    body: `
      <p class="lede">Newton's laws are second-order: they prescribe acceleration d²<i>x</i>/d<i>t</i>². By naming velocity <i>v</i> = d<i>x</i>/d<i>t</i> as a second coordinate, any second-order equation becomes a first-order vector field in the <b>phase plane</b> (<i>x</i>, <i>v</i>):</p>
      <div class="eq">d<i>x</i> / d<i>t</i> = <i>v</i>, &nbsp;&nbsp; d<i>v</i> / d<i>t</i> = −ω₀² <i>x</i></div>
      <p>For ω₀ = 1, the velocity vector (<i>v</i>, −<i>x</i>) is always perpendicular to the radius vector (<i>x</i>, <i>v</i>) because their dot product is <i>x v</i> − <i>v x</i> = 0. So total mechanical energy <i>E</i> = ½(<i>x</i>² + <i>v</i>²) never changes, and every trajectory is a closed circle.</p>
      <p><b>Drag the red state ball in the 3D phase plane</b> to move onto a larger or smaller energy circle.</p>
      <p class="live" data-live="harmonic"></p>`,
  },
  {
    kicker: '4.4 · Damping and spiral sinks',
    title: 'Friction winds the circle into a spiral',
    sub: 'When trace(J) = −2γ < 0 and det(J) = ω₀² > 0, eigenvalues are complex with negative real part',
    fig: 'Inward spiral trajectory of the underdamped oscillator',
    alt: 'Red phase-plane trajectory spiralling clockwise into the origin as damping drains mechanical energy.',
    cam: { target: at(4, 0, 2.0, 0), az: 0, el: 5, dist: 16.2 },
    lit: 'spiralSink',
    parts: ['spiralSink'],
    look: {},
    body: `
      <p class="lede">Add a friction drag −2γ<i>v</i> opposing velocity, and the phase-plane vector field tilts slightly inward across every circle:</p>
      <div class="eq">d<i>x</i> / d<i>t</i> = <i>v</i>, &nbsp;&nbsp; d<i>v</i> / d<i>t</i> = −ω₀² <i>x</i> − 2γ <i>v</i></div>
      <p>Written as a matrix <b>x</b>′ = <i>J</i><b>x</b> with <i>J</i> = [[0, 1], [−ω₀², −2γ]], the trace is trace(<i>J</i>) = −2γ = −0.50 &lt; 0 and the determinant is det(<i>J</i>) = ω₀² = 1.00 &gt; 0. Its eigenvalues are complex conjugates:</p>
      <div class="eq">λ = −γ ± <i>i</i> √(ω₀² − γ²) = −0.25 ± 0.968 <i>i</i></div>
      <p>The imaginary part keeps the state turning clockwise, while the negative real part <i>e</i><sup>−γ<i>t</i></sup> shrinks the amplitude into a <b>spiral sink</b>.</p>
      <p class="live" data-live="spiral"></p>`,
  },
  {
    kicker: '4.5 · Saddles and the trace–determinant map',
    title: 'One axis pulls in, the other flings out',
    sub: 'Whenever det(A) < 0, the eigenvalues have opposite signs and the origin is a hyperbolic saddle',
    fig: 'Hyperbolic saddle trajectories along stable and unstable eigenvectors',
    alt: 'Phase portrait of a saddle point with a green stable eigenvector line pulling trajectories in and a red unstable eigenvector line flinging them out.',
    cam: { target: at(5, 0, 2.0, 0), az: 0, el: 5, dist: 16.2 },
    lit: 'saddle',
    parts: ['saddle'],
    look: {},
    body: `
      <p class="lede">Every 2×2 linear system <b>x</b>′ = <i>A</i><b>x</b> has characteristic polynomial λ² − trace(<i>A</i>)λ + det(<i>A</i>) = 0. Because λ₁ + λ₂ = trace(<i>A</i>) and λ₁λ₂ = det(<i>A</i>), two numbers classify the entire geometry:</p>
      <ul class="rules">
        <li><b>det(<i>A</i>) &lt; 0 (Saddle):</b> λ₁ and λ₂ have opposite signs. States on the green stable axis (λ₂ &lt; 0) decay to (0, 0); every other state is swept out along the red unstable axis (λ₁ &gt; 0).</li>
        <li><b>det(<i>A</i>) &gt; 0, trace(<i>A</i>) &lt; 0 (Sink):</b> Both eigenvalues have negative real part — a nodal sink or spiral sink.</li>
        <li><b>det(<i>A</i>) &gt; 0, trace(<i>A</i>) &gt; 0 (Source):</b> Both eigenvalues have positive real part — trajectories flee the origin.</li>
      </ul>
      ${chartPhase()}
      <p class="live" data-live="saddle"></p>`,
  },
];

export const PLATES = {
  slopeField: {
    text: 'At each grid point (t, y), the differential equation dy/dt = f(t, y) specifies the tangent slope of whichever solution curve passes through that point. Even when no closed-form formula exists, Euler or Runge–Kutta (RK4) stepping traces the curve to arbitrary precision.',
    facts: s => [
      ['equation', 'dy/dt = y − t'],
      ['separating isocline', 'y = t + 1 (slope = 1)'],
      ['initial point (t₀, y₀)', `(${s.slope.t0.toFixed(2)}, ${s.slope.y0.toFixed(2)})`],
      ['initial slope y₀ − t₀', s.slope.m0.toFixed(2)],
    ],
  },
  integralCurve: {
    text: 'By Picard–Lindelöf uniqueness, smooth slope fields have a single integral curve through each starting point (t₀, y₀), so distinct solution curves can never cross.',
    facts: s => [
      ['(t₀, y₀)', `(${s.slope.t0.toFixed(2)}, ${s.slope.y0.toFixed(2)})`],
      ['y(2.0)', M.slopeFieldExact(2.0, s.slope.t0, s.slope.y0).toFixed(3)],
    ],
  },
  eqLine: {
    text: 'An equilibrium y_eq is a constant solution where dy/dt = 0. Because the rate is zero on the green line y = 1, a trajectory that starts on it stays there forever, and nearby trajectories can only approach it asymptotically.',
    facts: () => [
      ['equilibrium y_eq', M.Y_EQ.toFixed(2)],
      ['rate constant k', `${M.K_COOL.toFixed(2)} s⁻¹`],
      ['time constant τ = 1/k', `${M.coolingTau().toFixed(2)} s`],
    ],
  },
  relaxCurves: {
    text: 'Every time interval of length τ = 1/k multiplies the remaining distance from equilibrium by 1/e ≈ 36.8 %. After 3τ, 95 % of the adjustment is complete.',
    facts: s => [
      ['time t', `${s.exp.t.toFixed(2)} s`],
      ['value y(t)', s.exp.y.toFixed(3)],
      ['gap y − y_eq', (s.exp.y - M.Y_EQ).toFixed(3)],
      ['slope dy/dt', s.exp.rate.toFixed(3)],
    ],
  },
  logisticCurve: {
    text: 'Near y = 0, (1 − y/K) ≈ 1 so growth is nearly exponential (dy/dt ≈ ry). As y approaches K, crowding reduces the per-capita growth rate linearly to zero.',
    facts: s => [
      ['time t', `${s.logistic.t.toFixed(2)} s`],
      ['population y(t)', s.logistic.y.toFixed(3)],
      ['growth rate dy/dt', s.logistic.rate.toFixed(3)],
      ['max rate ¼rK (at y = 1.2)', M.logisticRhs(M.K_LOG / 2).toFixed(3)],
    ],
  },
  phaseCircle: {
    text: 'In the phase plane, time is the parameter along the curve. A closed loop means periodic motion: every 2π/ω₀ seconds the state returns to the same position and velocity.',
    facts: s => [
      ['position x', s.harmonic.x.toFixed(3)],
      ['velocity v', s.harmonic.v.toFixed(3)],
      ['conserved energy E', s.harmonic.E.toFixed(3)],
    ],
  },
  spiralSink: {
    text: 'When 0 < γ < ω₀, the system is underdamped: it still oscillates through zero with quasi-frequency ω_d = √(ω₀² − γ²), but its envelope decays as e^(−γt).',
    facts: s => [
      ['damping γ', M.GAMMA.toFixed(2)],
      ['position x(t)', s.spiral.x.toFixed(3)],
      ['velocity v(t)', s.spiral.v.toFixed(3)],
      ['instantaneous energy E', s.spiral.E.toFixed(3)],
    ],
  },
  saddle: {
    text: 'Near a saddle point, trajectories are hyperbolas asymptoting to the two eigenvector axes: they are drawn in along the stable manifold (λ₂ < 0) before being flung out along the unstable manifold (λ₁ > 0).',
    facts: () => {
      const { l1, l2 } = M.saddleEigenvectors();
      return [
        ['matrix A', '[[0.8, 0.4], [0.4, −0.8]]'],
        ['trace(A), det(A)', `0.00, ${M.det(M.SADDLE_MAT).toFixed(2)}`],
        ['eigenvalues λ₁, λ₂', `+${l1.toFixed(3)}, ${l2.toFixed(3)}`],
      ];
    },
  },
};
