// Chapter 2 of the Atlas of Mathematics: Slope and area (Differential & Integral Calculus).
// Every table cell, chart series and breakdown fact is computed from model.js.
import * as M from './model.js';
import { STATIONS, CY } from './world.js';
import { chart, samples } from '@saxster/atlas/chart.js';

const fmt = (x, n = 2) => (x < -5 * 10 ** -(n + 1) ? '−' : '') + Math.abs(x).toFixed(n);
const at = (k, dx = 0, dy = 0) => [STATIONS[k] + dx, CY + dy, 0];

export const RANGES = {
  secant: { x0: 0, x1: 2, y0: 0.8, y1: 2.0, h: 125 },
  deriv:  { x0: 0, x1: 3, y0: 0, y1: 4.6, h: 125 },
  turn:   { x0: -0.3, x1: 2.9, y0: -1.3, y1: 2.4, h: 125 },
  riem:   { x0: 2, x1: 25, y0: 4.3, y1: 4.55, h: 125 },
  ftc:    { x0: 0, x1: 3, y0: 0, y1: 4.6, h: 125 },
  accum:  { x0: 0, x1: 3, y0: -1.1, y1: 1.1, h: 125 },
};

export const PAGES = [
  {
    kicker: 'Chapter 2', title: 'Slope of a curve', sub: 'from a secant through two points to the tangent at one',
    body: `
      <p class="lede">A straight line has one slope everywhere. A curve changes slope from point to point. To find the slope of <i>f</i>(<i>x</i>) = ½<i>x</i>² at <i>P</i>(1, ½), pick a second point <i>Q</i> a step <i>h</i> further along and draw the <b>secant line</b> through both:</p>
      <div class="eq">secant slope = (<i>f</i>(1 + <i>h</i>) − <i>f</i>(1)) / <i>h</i> = 1 + ½<i>h</i></div>
      <p>Now slide <i>Q</i> toward <i>P</i>. As the step <i>h</i> shrinks toward zero, the term ½<i>h</i> vanishes and the red secant settles onto the blue <b>tangent line</b> of slope 1:</p>
      <table class="data">
        <tr><th>step <i>h</i></th>${[1.0, 0.5, 0.1, 0.01].map(h => `<td>${h}</td>`).join('')}<td>→ 0</td></tr>
        <tr><th>secant slope</th>${[1.0, 0.5, 0.1, 0.01].map(h => `<td>${fmt(M.secantSlope(1, h), 3)}</td>`).join('')}<td><b>1.000</b></td></tr>
      </table>
      <div class="charts">${chart({ ...RANGES.secant, xlabel: 'step h', ylabel: 'secant slope 1 + ½h', cursors: ['sec'], label: 'Secant slope approaching 1 as step h shrinks to 0',
        series: [{ cls: 'grid', pts: [[0, 1], [2, 1]] }, { pts: [[0, 1], [2, 2]] }], marks: [[0, 1, 'limit f′(1) = 1']] })}</div>
      <p class="hintline">Click the board to separate the run h, the rise Δy and the secant line.</p>`,
    cam: { target: at('secant', 0, 0), az: -6, el: 5, dist: 16.5 }, lit: 'secant', scene: 'secant', look: {},
    fig: 'Secant PQ settling onto the tangent',
    alt: 'A parabola f(x) = ½x² with point P at x = 1 and point Q at x = 1 + h; as Q slides toward P, the red secant line aligns with the blue tangent line of slope 1.',
  },
  {
    kicker: '2.1', title: 'The derivative function', sub: 'every x gets its own slope f′(x)',
    body: `
      <p class="lede">Repeat that limit at any point <i>x</i> on <i>f</i>(<i>x</i>) = ½<i>x</i>². Because ½(<i>x</i> + <i>h</i>)² − ½<i>x</i>² = <i>xh</i> + ½<i>h</i>², dividing by <i>h</i> and letting <i>h</i> → 0 gives a new function — the <b>derivative</b>:</p>
      <div class="eq"><i>f</i>′(<i>x</i>) = d/d<i>x</i> (½<i>x</i>²) = <i>x</i></div>
      <p>Where the parabola is flat at <i>x</i> = 0, its derivative is 0. At <i>x</i> = 1 the slope is 1; at <i>x</i> = 2 the slope is 2. More generally, for any power <i>xⁿ</i>, expanding (<i>x</i> + <i>h</i>)<i>ⁿ</i> shows that d/d<i>x</i>(<i>xⁿ</i>) = <i>nx</i><sup><i>n</i>−1</sup>.</p>
      <table class="data">
        <tr><th><i>x</i></th>${[0, 1, 2, 3].map(x => `<td>${x}</td>`).join('')}</tr>
        <tr><th>height ½<i>x</i>²</th>${[0, 1, 2, 3].map(x => `<td>${fmt(M.f(x), 1)}</td>`).join('')}</tr>
        <tr><th>slope <i>f</i>′(<i>x</i>) = <i>x</i></th>${[0, 1, 2, 3].map(x => `<td>${fmt(M.df(x), 1)}</td>`).join('')}</tr>
      </table>
      <div class="charts">${chart({ ...RANGES.deriv, xlabel: 'x', ylabel: 'f(x) and slope f′(x)', cursors: ['f1', 'df1'], label: 'Parabola ½x² and its straight-line derivative x',
        series: [{ pts: samples(0, 3, 90, M.f), tag: [2.5, 3.6, '½x²'] }, { cls: 'curve total', pts: [[0, 0], [3, 3]], tag: [2.4, 1.9, 'f′(x) = x'] }] })}</div>
      <p class="hintline">Click the curve to inspect the sliding tangent and its slope.</p>`,
    cam: { target: at('deriv', 0, 0), az: -6, el: 5, dist: 16.5 }, lit: 'deriv', scene: 'deriv', look: {},
    fig: 'Slope of ½x² traces f′(x) = x',
    alt: 'As a red point glides along the parabola f(x) = ½x² carrying its tangent segment, a blue point below traces the straight line f′(x) = x.',
  },
  {
    kicker: '2.2', title: 'Stationary points', sub: 'peaks and troughs happen where the slope hits zero',
    body: `
      <p class="lede">When a curve stops rising and starts falling, its tangent must pause level for an instant: <i>g</i>′(<i>x</i>) = 0. On the cubic <i>g</i>(<i>x</i>) = ⅓<i>x</i>³ − <i>x</i>² + 2, the derivative is a parabola:</p>
      <div class="eq"><i>g</i>′(<i>x</i>) = <i>x</i>² − 2<i>x</i> = <i>x</i>(<i>x</i> − 2)</div>
      <p>The slope crosses zero twice: at <i>x</i> = 0 (where <i>g</i>′ flips from + to −, a <b>local maximum</b> of height 2) and at <i>x</i> = 2 (where <i>g</i>′ flips from − to +, a <b>local minimum</b> of height ⅔). Halfway between them at <i>x</i> = 1, the second derivative <i>g</i>″(<i>x</i>) = 2<i>x</i> − 2 is zero: the steepest downward point, an <b>inflection point</b>.</p>
      <table class="data">
        <tr><th><i>x</i></th><th><i>g</i>(<i>x</i>)</th><th>slope <i>g</i>′(<i>x</i>)</th><th>curvature <i>g</i>″(<i>x</i>)</th><th>feature</th></tr>
        <tr><td>0</td><td>2.00</td><td>0</td><td>−2</td><td>local max</td></tr>
        <tr><td>1</td><td>1.33</td><td>−1</td><td>0</td><td>inflection</td></tr>
        <tr><td>2</td><td>0.67</td><td>0</td><td>+2</td><td>local min</td></tr>
      </table>
      <div class="charts">${chart({ ...RANGES.turn, xlabel: 'x', ylabel: 'g(x) and g′(x)', cursors: ['g2', 'dg2'], label: 'Cubic g(x) and its quadratic derivative g′(x) crossing 0 at x = 0 and x = 2',
        series: [{ cls: 'grid', pts: [[-0.3, 0], [2.9, 0]] }, { pts: samples(-0.3, 2.9, 100, M.g), tag: [0.35, 2.05, 'g(x)'] }, { cls: 'curve total', pts: samples(-0.3, 2.8, 100, M.dg), tag: [2.35, 1.35, 'g′(x)'] }] })}</div>
      <p class="hintline">Click the cubic to inspect its maximum, minimum and inflection point.</p>`,
    cam: { target: at('turning', 0, 0), az: -6, el: 5, dist: 16.5 }, lit: 'turning', scene: 'turning', look: {},
    fig: 'Horizontal tangents at g′(x) = 0',
    alt: 'A cubic curve with a red dot at its peak (0, 2), a green dot at its trough (2, ⅔), and a blue parabola below showing g′(x) crossing zero under both points.',
  },
  {
    kicker: '2.3', title: 'Area by rectangles', sub: 'slicing a curved region into thin Riemann bars',
    body: `
      <p class="lede">Now reverse the question: how much area lies under <i>f</i>(<i>x</i>) = ½<i>x</i>² between <i>x</i> = 0 and <i>x</i> = 3? Slice the base into <i>n</i> equal strips of width Δ<i>x</i> = 3/<i>n</i>, and raise a rectangle to the curve’s midpoint height on each strip:</p>
      <div class="eq"><i>Sₙ</i> = ∑ <i>f</i>(<i>xᵢ</i>) · Δ<i>x</i>  →  ∫₀³ ½<i>x</i>² d<i>x</i> = 4.5</div>
      <p>where the little triangles sticking out above the curve nearly cancel the triangles missed below it. Each time <i>n</i> doubles, the midpoint error shrinks by a factor of four:</p>
      <table class="data">
        <tr><th>bars <i>n</i></th>${M.BARS_STEPS.map(n => `<td>${n}</td>`).join('')}<td>∞</td></tr>
        <tr><th>midpoint sum</th>${M.BARS_STEPS.map(n => `<td>${fmt(M.riemannSum(M.f, 0, 3, n, 'mid'), 3)}</td>`).join('')}<td><b>4.500</b></td></tr>
      </table>
      <div class="charts">${chart({ ...RANGES.riem, xlabel: 'number of bars n', ylabel: 'midpoint sum', cursors: ['riem'], label: 'Midpoint Riemann sum converging rapidly to 4.5 as n increases',
        series: [{ cls: 'grid', pts: [[2, 4.5], [25, 4.5]] }, { pts: samples(3, 24, 42, n => M.riemannSum(M.f, 0, 3, Math.round(n), 'mid')) }], marks: [[24, 4.5, 'exact 4.500']] })}</div>
      <p class="hintline">Watch the board cycle through 3, 6, 12 and 24 rectangles.</p>`,
    cam: { target: at('riemann', 0, 0), az: -6, el: 5, dist: 16.5 }, lit: 'riemann', scene: 'riemann', look: {},
    fig: 'Midpoint bars under f(x) = ½x²',
    alt: 'Blue rectangles under the red parabola f(x) = ½x² from x = 0 to 3; as the number of bars steps from 3 to 6, 12 and 24, the staircase hugs the curve.',
  },
  {
    kicker: '2.4', title: 'The Fundamental Theorem', sub: 'slope and area are inverses of each other',
    body: `
      <p class="lede">Why does the area under ½<i>x</i>² work out to ⅙<i>x</i>³? Look at the two boards side by side. On the left is the slope curve <i>f</i>′(<i>t</i>) = <i>t</i>. Its shaded area from 0 to <i>x</i> is a right triangle of base <i>x</i> and height <i>x</i> — which is ½<i>x</i>², the height of the parabola on the right:</p>
      <div class="eq">∫₀ˣ <i>f</i>′(<i>t</i>) d<i>t</i> = <i>f</i>(<i>x</i>) − <i>f</i>(0)</div>
      <p>Every tiny step d<i>t</i> adds a sliver of area <i>f</i>′(<i>t</i>) d<i>t</i> = d<i>f</i>, so adding up all the slivers of change reconstructs the total change in <i>f</i>. Differentiating and integrating undo each other.</p>
      <table class="data">
        <tr><th>upper limit <i>x</i></th>${[1, 2, 3].map(x => `<td>${x}</td>`).join('')}</tr>
        <tr><th>blue area ∫₀ˣ <i>t</i> d<i>t</i></th>${[1, 2, 3].map(x => `<td>${fmt(M.f(x), 1)}</td>`).join('')}</tr>
        <tr><th>red height <i>f</i>(<i>x</i>) − <i>f</i>(0)</th>${[1, 2, 3].map(x => `<td>${fmt(M.f(x), 1)}</td>`).join('')}</tr>
      </table>
      <div class="charts">${chart({ ...RANGES.ftc, xlabel: 'upper limit x', ylabel: '∫₀ˣ t dt = ½x²', cursors: ['ftc'], label: 'Accumulated area under t equals the parabola height ½x²',
        series: [{ pts: samples(0, 3, 90, M.f), tag: [2.2, 3.1, '∫₀ˣ t dt = ½x²'] }] })}</div>
      <p class="hintline">Click the board to compare the blue triangle of area with the red bar of height.</p>`,
    cam: { target: at('ftc', 0, 0), az: -5, el: 5, dist: 17.5 }, lit: 'ftc', scene: 'ftc', look: {},
    fig: 'Area under f′(t) equals height f(x)',
    alt: 'Two graphs side by side: on the left, a blue shaded triangle under f′(t) = t from 0 to x; on the right, a red vertical bar of identical value under the parabola f(x) = ½x².',
  },
  {
    kicker: '2.5', title: 'Signed area and net change', sub: 'area above the axis adds; area below takes back',
    body: `
      <p class="lede">When a rate <i>v</i>(<i>t</i>) = cos(½π<i>t</i>) dips below the axis, its slivers <i>v</i>(<i>t</i>) d<i>t</i> are negative. The definite integral counts area above the axis as positive and area below as negative:</p>
      <div class="eq"><i>s</i>(<i>x</i>) = ∫₀ˣ cos(½π<i>t</i>) d<i>t</i> = (2/π) sin(½π<i>x</i>)</div>
      <p>From <i>t</i> = 0 to 1 the rate is positive and accumulates +2/π ≈ +0.64. From <i>t</i> = 1 to 2 the rate goes negative and gives back that exact 0.64, returning the blue net-change curve to zero at <i>x</i> = 2.</p>
      <table class="data">
        <tr><th><i>x</i></th><td>0</td><td>1</td><td>2</td><td>3</td></tr>
        <tr><th>rate cos(½π<i>x</i>)</th><td>1</td><td>0</td><td>−1</td><td>0</td></tr>
        <tr><th>net area <i>s</i>(<i>x</i>)</th><td>0.00</td><td>+${fmt(M.netWave(1))}</td><td>0.00</td><td>${fmt(M.netWave(3))}</td></tr>
      </table>
      <div class="charts">${chart({ ...RANGES.accum, xlabel: 'x', ylabel: 'rate (red) and net area (blue)', cursors: ['rate5', 'net5'], label: 'Rate cos(πt/2) and its accumulated signed area (2/π)sin(πx/2)',
        series: [{ cls: 'grid', pts: [[0, 0], [3, 0]] }, { pts: samples(0, 3, 120, M.rateWave), tag: [0.45, 0.88, 'v(t)'] }, { cls: 'curve total', pts: samples(0, 3, 120, M.netWave), tag: [1.0, 0.78, '∫₀ˣ v(t) dt'] }] })}</div>
      <p class="hintline">Click the board to inspect the positive and negative lobes of area.</p>`,
    cam: { target: at('accum', 0, 0), az: -6, el: 5, dist: 16.5 }, lit: 'accum', scene: 'accum', look: {},
    fig: 'Signed area and net change',
    alt: 'A cosine wave shaded red between the curve and the horizontal axis; above the axis the shading builds up the blue sine curve, and below the axis it brings the blue curve back down.',
  },
];

export const PLATES = {
  secant: {
    text: 'The blue segment is the horizontal step h; the red vertical segment is the rise Δy = f(1 + h) − f(1). Their ratio Δy/h is the slope of the red secant line. As h → 0, both segments vanish, but their ratio approaches the clean limit f′(1) = 1.',
    facts: s => {
      const h = M.hAt(s.t);
      return [['step h', fmt(h, 3)], ['rise Δy', fmt(M.f(1 + h) - M.f(1), 3)], ['secant slope Δy/h', fmt(M.secantSlope(1, h), 3)], ['tangent limit f′(1)', '1.000']];
    },
  },
  deriv: {
    text: 'At each x, the height of the blue line equals the steepness (rise per unit run) of the red tangent segment on the parabola above it.',
    facts: s => {
      const x = M.xSweep(s.t);
      return [['x', fmt(x)], ['height f(x) = ½x²', fmt(M.f(x))], ['slope f′(x) = x', fmt(M.df(x))]];
    },
  },
  turning: {
    text: 'A stationary point occurs wherever the blue derivative curve crosses the horizontal axis g′(x) = 0. Looking at whether g′ crosses downward (maximum) or upward (minimum) distinguishes peaks from troughs.',
    facts: s => {
      const x = M.xCubic(s.t);
      return [['x', fmt(x)], ['cubic height g(x)', fmt(M.g(x))], ['slope g′(x)', fmt(M.dg(x))], ['curvature g″(x)', fmt(M.ddg(x))]];
    },
  },
  riemann: {
    text: 'Each midpoint bar has width Δx = 3/n and height f(x_mid). Because the curve slopes nearly linearly across a narrow bar, the triangle of bar sticking above the curve on the left almost matches the triangle of curve sticking above the bar on the right.',
    facts: s => {
      const n = M.barsAt(s.t), sum = M.riemannSum(M.f, 0, 3, n, 'mid');
      return [['rectangles n', `${n}`], ['bar width Δx', fmt(3 / n, 3)], ['midpoint sum', fmt(sum, 4)], ['exact ∫₀³ ½x² dx', '4.5000'], ['error', fmt(Math.abs(sum - 4.5), 4)]];
    },
  },
  ftc: {
    text: 'The Fundamental Theorem bridges the two halves of calculus: to compute the area under a rate curve f′(t) from 0 to x, you do not need to sum infinitely many bars — you simply evaluate the antiderivative f(x) − f(0).',
    facts: s => {
      const x = M.xSweep(s.t);
      return [['upper limit x', fmt(x)], ['slope f′(x) = x', fmt(M.df(x))], ['shaded area ∫₀ˣ t dt', fmt(M.f(x))], ['height f(x) − f(0)', fmt(M.f(x))]];
    },
  },
  accum: {
    text: 'Whenever the red rate curve lies above the axis (0 < t < 1), the blue accumulation curve climbs. At t = 1 the rate crosses zero and the blue curve reaches its peak (+2/π ≈ 0.64). For 1 < t < 3 the rate is negative and the blue curve descends.',
    facts: s => {
      const x = M.xSweep(s.t);
      return [['upper limit x', fmt(x)], ['rate v(x) = cos(½πx)', fmt(M.rateWave(x))], ['net signed area s(x)', fmt(M.netWave(x))]];
    },
  },
};
