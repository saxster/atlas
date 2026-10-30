// The derivative is the slope, page by page: text on the left, on the right the camera, the lit thing and what is
// shown (look). Every number is read from model.js.
import * as M from './model.js';

const f = (x, n = 2) => (x < -5 * 10 ** -(n + 1) ? '−' : '') + Math.abs(x).toFixed(n);
const view = { target: [0, 0, 0], az: -8, el: 6, dist: 17 };

export const PAGES = [
  {
    kicker: 'Chapter 1', title: 'A curve', sub: 'one rule, one height for every x',
    body: `
      <p class="lede">The curve is the graph of one rule: for each <i>x</i>, go up to the height</p>
      <div class="eq"><i>f</i>(<i>x</i>) = <i>x</i>³/3 − <i>x</i></div>
      <p>It rises, turns over at <i>x</i> = ${M.STATIONARY[0]}, falls, and turns up again at <i>x</i> = ${M.STATIONARY[1]}. The red point <i>P</i> slides along it.</p>
      <table class="data"><tr><th><i>x</i></th>${[-2, -1, 0, 1, 2].map(x => `<td>${f(x, 0)}</td>`).join('')}</tr>
        <tr><th><i>f</i>(<i>x</i>)</th>${[-2, -1, 0, 1, 2].map(x => `<td>${f(M.f(x))}</td>`).join('')}</tr></table>`,
    cam: view, lit: 'curve', look: {}, fig: 'y = x³/3 − x',
    alt: 'The curve y = x³/3 − x on axes, a red point sliding along it.',
  },
  {
    kicker: '1.1', title: 'The tangent and its slope', sub: 'run one across, and see how far it rises',
    body: `
      <p class="lede">Zoom in on <i>P</i> far enough and the curve looks straight. That straight line is the <b>tangent</b>. Its slope is how steep the curve is at <i>P</i>.</p>
      <p>Go 1 across along the tangent (grey). It rises by the slope (blue): up where the curve climbs, down where it falls, nothing at the top and bottom.</p>
      <div class="eq">slope at <i>x</i> = rise ÷ run = <i>f</i>&#8202;′(<i>x</i>)</div>
      <p>At <i>x</i> = 1.5 the rise is ${f(M.df(1.5))}: the tangent climbs ${f(M.df(1.5))} for every 1 across.</p>`,
    cam: { ...view, target: [0.3, 0, 0], dist: 16 }, lit: 'tangent', look: { tangent: 1 }, fig: 'The tangent at P',
    alt: 'A red tangent line touching the curve at P, with a grey arrow one unit across and a blue arrow rising by the slope.',
  },
  {
    kicker: '1.2', title: 'The slope has its own graph', sub: 'f′(x) = x² − 1',
    body: `
      <p class="lede">Plot the slope at every <i>x</i> and you get a new curve, the <b>derivative</b>:</p>
      <div class="eq"><i>f</i>&#8202;′(<i>x</i>) = <i>x</i>² − 1</div>
      <p>The blue point <i>Q</i> stands as high as the blue rise arrow is long. Where <i>f</i> turns over, at <i>x</i> = ±1, the slope is 0 and <i>Q</i> crosses the <i>x</i> axis.</p>`,
    cam: view, lit: 'slope', look: { tangent: 1, deriv: 1 }, fig: 'The slope’s own graph',
    alt: 'The blue parabola y = x² − 1 drawn with the cubic, a blue point Q at the height of the tangent’s slope.',
  },
];

export const PLATES = {
  curve: { text: 'The graph of f(x) = x³/3 − x. P is the point (x, f(x)).', facts: s => [['x', f(s.x)], ['f(x)', f(M.f(s.x))]] },
  tangent: { text: 'The tangent touches the curve at P and has the curve’s steepness there. One across, it rises f′(x).', facts: s => [['run', '1'], ['rise f′(x)', f(M.df(s.x))]] },
  slope: { text: 'Each point Q of this graph is (x, f′(x)): the slope of the cubic at x, drawn as a height.', facts: s => [['x', f(s.x)], ['f′(x)', f(M.df(s.x))]] },
};
