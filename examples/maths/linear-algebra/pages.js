// Chapter 3 of the Atlas of Mathematics: Linear transformations (Linear Algebra).
// Every table cell, chart series and breakdown fact is computed from model.js.
import * as M from './model.js';
import { STATIONS, CY } from './world.js';
import { chart, samples } from '@saxster/atlas/chart.js';

const fmt = (x, n = 2) => (x < -5 * 10 ** -(n + 1) ? '−' : '') + Math.abs(x).toFixed(n);
const fmtVec = ([x, y], n = 2) => `(${fmt(x, n)}, ${fmt(y, n)})`;
const at = (k, dx = 0, dy = 0) => [STATIONS[k] + dx, CY + dy, 0];

export const RANGES = {
  basis:    { x0: 0, x1: 1, y0: 0.9, y1: 2.1, h: 125 },
  shear:    { x0: 0, x1: 1.2, y0: 0.5, y1: 2.3, h: 125 },
  det:      { x0: 0, x1: 1, y0: 0.9, y1: 1.75, h: 125 },
  collapse: { x0: 0.4, x1: 1.15, y0: -0.05, y1: 0.95, h: 125 },
  eigen:    { x0: 0, x1: Math.PI, y0: -0.6, y1: 0.6, h: 125 },
  compose:  { x0: 0, x1: 1, y0: 0.8, y1: 2.4, h: 125 },
};

export const PAGES = [
  {
    kicker: 'Chapter 3', title: 'Columns are landing spots', sub: 'a linear map keeps gridlines parallel and evenly spaced',
    body: `
      <p class="lede">Think of a 2×2 matrix not as four static numbers in a box, but as a <b>move</b> that carries every point of the plane to a new home while keeping gridlines straight, parallel and evenly spaced. Once you know where the two unit basis vectors <b>î</b> = (1, 0) and <b>ĵ</b> = (0, 1) land, you know where every point (<i>x</i>, <i>y</i>) = <i>x</i><b>î</b> + <i>y</i><b>ĵ</b> must land:</p>
      <div class="eq"><i>A</i> [<i>x</i>, <i>y</i>]ᵀ = <i>x</i> (column 1) + <i>y</i> (column 2)</div>
      <p>For <i>A</i> = [[1.50, 0.50], [0.50, 1.25]], the red first column <i>A</i><b>î</b> = (1.50, 0.50) and blue second column <i>A</i><b>ĵ</b> = (0.50, 1.25) carry the corner (1, 1) to their vector sum (2.00, 1.75):</p>
      <table class="data">
        <tr><th>input (<i>x</i>, <i>y</i>)</th><td><b>î</b> (1, 0)</td><td><b>ĵ</b> (0, 1)</td><td>(1, 1)</td><td>(2, 2)</td></tr>
        <tr><th>output <i>A</i>(<i>x</i>, <i>y</i>)</th><td>${fmtVec(M.applyMat(M.MAT_A, [1, 0]))}</td><td>${fmtVec(M.applyMat(M.MAT_A, [0, 1]))}</td><td>${fmtVec(M.applyMat(M.MAT_A, [1, 1]))}</td><td>${fmtVec(M.applyMat(M.MAT_A, [2, 2]))}</td></tr>
      </table>
      <div class="charts">${chart({ ...RANGES.basis, xlabel: 'blend s from I to A', ylabel: 'image of (1, 1)', cursors: ['bx', 'by'], label: 'Coordinates of M(s)(1, 1) as s glides from 0 to 1',
        series: [{ pts: samples(0, 1, 50, s => M.applyMat(M.lerpMat(M.MAT_I, M.MAT_A, s), [1, 1])[0]), tag: [0.72, 1.92, 'x′ = 1 + s'] },
                 { cls: 'curve total', pts: samples(0, 1, 50, s => M.applyMat(M.lerpMat(M.MAT_I, M.MAT_A, s), [1, 1])[1]), tag: [0.68, 1.48, 'y′ = 1 + 0.75s'] }] })}</div>
      <p class="hintline">Click the board to inspect the two basis columns Aî, Aĵ and the deformed lattice.</p>`,
    cam: { target: at('basis', 0, 0), az: -6, el: 5, dist: 16.5 }, lit: 'basis', scene: 'basis', look: {},
    fig: 'Columns Aî and Aĵ carry the grid',
    alt: 'A 2D coordinate grid deforming smoothly as the red basis vector î moves to (1.5, 0.5) and the blue basis vector ĵ moves to (0.5, 1.25), carrying (1, 1) to (2.0, 1.75).',
  },
  {
    kicker: '3.1', title: 'Shear and rotation', sub: 'sliding layers sideways preserves both height and area',
    body: `
      <p class="lede">Two elementary moves build intuition for all matrices. A <b>horizontal shear</b> <i>S<sub>k</sub></i> leaves the horizontal axis <b>î</b> = (1, 0) untouched while tilting <b>ĵ</b> = (0, 1) sideways to (<i>k</i>, 1), sliding every horizontal layer by <i>ky</i>:</p>
      <div class="eq"><i>S<sub>k</sub></i> [<i>x</i>, <i>y</i>]ᵀ = [<i>x</i> + <i>ky</i>, <i>y</i>]ᵀ,   det(<i>S<sub>k</sub></i>) = 1·1 − <i>k</i>·0 = 1</div>
      <p>Like a deck of cards pushed sideways, the unit square tilts into a parallelogram of the same base 1 and vertical height 1, so its area stays <b>1.00</b> for every <i>k</i>. A pure rotation <i>R<sub>θ</sub></i> turns both basis vectors rigidly by angle <i>θ</i>, keeping lengths and area (cos²<i>θ</i> + sin²<i>θ</i> = 1) unchanged.</p>
      <table class="data">
        <tr><th>shear factor <i>k</i></th>${[0.0, 0.4, 0.8, 1.2].map(k => `<td>${fmt(k, 1)}</td>`).join('')}</tr>
        <tr><th><i>S<sub>k</sub></i>(1, 1)</th>${[0.0, 0.4, 0.8, 1.2].map(k => `<td>${fmtVec(M.applyMat(M.shearMat(k), [1, 1]), 1)}</td>`).join('')}</tr>
        <tr><th>area det(<i>S<sub>k</sub></i>)</th>${[0.0, 0.4, 0.8, 1.2].map(k => `<td>${fmt(M.det(M.shearMat(k)), 2)}</td>`).join('')}</tr>
      </table>
      <div class="charts">${chart({ ...RANGES.shear, xlabel: 'shear factor k', ylabel: 'x′ of (1, 1) and area', cursors: ['shx', 'sha'], label: 'Top corner x′ = 1 + k rising while area stays 1.00',
        series: [{ pts: [[0, 1], [1.2, 2.2]], tag: [0.85, 2.02, 'x′ = 1 + k'] },
                 { cls: 'curve total', pts: [[0, 1], [1.2, 1]], tag: [0.85, 1.12, 'area = 1.00'] }] })}</div>
      <p class="hintline">Click the board to compare the fixed red vector î with the tilting blue vector Sĵ.</p>`,
    cam: { target: at('shear', 0, 0), az: -6, el: 5, dist: 16.5 }, lit: 'shear', scene: 'shear', look: {},
    fig: 'Horizontal shear of a deck of layers',
    alt: 'A unit square tilting horizontally into a blue parallelogram as Sĵ moves from (0, 1) to (1.2, 1) while its base î = (1, 0) and area 1.00 remain constant.',
  },
  {
    kicker: '3.2', title: 'The determinant is area', sub: 'ad − bc measures how much a matrix scales any region’s area',
    body: `
      <p class="lede">Under a general matrix <i>M</i> = [[<i>a</i>, <i>b</i>], [<i>c</i>, <i>d</i>]], the unit square becomes a parallelogram spanned by (<i>a</i>, <i>c</i>) and (<i>b</i>, <i>d</i>). Enclosing that parallelogram in an (<i>a</i> + <i>b</i>) × (<i>c</i> + <i>d</i>) box and subtracting the four corner right triangles leaves its exact signed area — the <b>determinant</b>:</p>
      <div class="eq">det(<i>M</i>) = <i>ad</i> − <i>bc</i></div>
      <p>Because every region can be tiled by tiny grid squares, and every grid square is scaled by the same factor, |det(<i>M</i>)| multiplies the area of <i>any</i> shape in the plane. If the columns flip orientation (<b>ĵ</b> lands clockwise of <b>î</b>), det(<i>M</i>) turns negative.</p>
      <table class="data">
        <tr><th>blend <i>s</i></th>${[0.0, 0.25, 0.5, 0.75, 1.0].map(s => `<td>${fmt(s)}</td>`).join('')}</tr>
        <tr><th>det(<i>M</i>(<i>s</i>))</th>${[0.0, 0.25, 0.5, 0.75, 1.0].map(s => `<td>${fmt(M.det(M.lerpMat(M.MAT_I, M.MAT_A, s)), 3)}</td>`).join('')}</tr>
      </table>
      <div class="charts">${chart({ ...RANGES.det, xlabel: 'blend s from I to A', ylabel: 'area det(M(s))', cursors: ['det'], label: 'Parallelogram area growing from 1.000 to 1.625',
        series: [{ pts: samples(0, 1, 60, s => M.det(M.lerpMat(M.MAT_I, M.MAT_A, s))), tag: [0.62, 1.52, 'det = ad − bc'] }], marks: [[1, 1.625, '1.625']] })}</div>
      <p class="hintline">Click the parallelogram to inspect its four sides and area scale factor.</p>`,
    cam: { target: at('det', 0, 0), az: -6, el: 5, dist: 16.5 }, lit: 'det', scene: 'det', look: {},
    fig: 'Unit square stretched to area ad − bc',
    alt: 'A red shaded parallelogram spanned by Aî and Aĵ subdivided into 16 smaller parallelograms, expanding from area 1.000 to det(A) = 1.625.',
  },
  {
    kicker: '3.3', title: 'Zero determinant and collapse', sub: 'when columns line up, all of 2D squashes onto a 1D line',
    body: `
      <p class="lede">What happens when the second column becomes a scalar multiple of the first? In <i>C</i> = [[1.2, 0.6], [0.8, <i>d</i>]], as <i>d</i> drops to 0.40, column 2 becomes (0.6, 0.4) = ½(1.2, 0.8). Both basis vectors now point along the same line <i>y</i> = ⅔<i>x</i>, and the parallelogram flattens to zero area:</p>
      <div class="eq">det(<i>C</i>) = 1.2<i>d</i> − (0.6)(0.8) = 0   at <i>d</i> = 0.40</div>
      <p>A matrix with det = 0 is <b>singular</b>: it cannot be inverted because an entire line of inputs — the <b>null space</b> spanned by (−1, 2) — gets crushed onto the single point (0, 0).</p>
      <table class="data">
        <tr><th>entry <i>d</i></th><td>1.15</td><td>0.90</td><td>0.65</td><td><b>0.40</b></td></tr>
        <tr><th>area det(<i>C</i>)</th><td>0.90</td><td>0.60</td><td>0.30</td><td><b>0.00</b></td></tr>
        <tr><th>rank</th><td>2 (plane)</td><td>2 (plane)</td><td>2 (plane)</td><td><b>1 (line)</b></td></tr>
      </table>
      <div class="charts">${chart({ ...RANGES.collapse, xlabel: 'second-column entry d', ylabel: 'area det(C) = 1.2d − 0.48', cursors: ['col'], label: 'Area shrinking linearly to 0 as d approaches 0.40',
        series: [{ cls: 'grid', pts: [[0.4, 0], [1.15, 0]] }, { pts: [[0.4, 0], [1.15, 0.9]], tag: [0.82, 0.62, 'det = 1.2d − 0.48'] }], marks: [[0.4, 0, 'singular d = 0.4']] })}</div>
      <p class="hintline">Watch the blue vector ĵ fold onto the red vector î along y = ⅔x.</p>`,
    cam: { target: at('collapse', 0, 0), az: -6, el: 5, dist: 16.5 }, lit: 'collapse', scene: 'collapse', look: {},
    fig: 'Singular matrix squashing 2D onto a line',
    alt: 'As the blue basis vector (0.6, d) tilts down toward (0.6, 0.4), the 2D lattice and red parallelogram flatten completely onto the line y = 2/3 x.',
  },
  {
    kicker: '3.4', title: 'Eigenvectors stay on their span', sub: 'special directions that a matrix stretches without turning',
    body: `
      <p class="lede">Spin a unit vector <b>u</b>(<i>θ</i>) around the origin and watch its image <i>E</i><b>u</b>(<i>θ</i>) under <i>E</i> = [[1.5, 0.5], [0.5, 1.5]]. Almost every direction gets knocked off its own line. Only along two special axes does the red output arrow line up purely with the dark input arrow:</p>
      <div class="eq"><i>E</i><b>v</b> = <i>λ</i><b>v</b>   ⇔   det(<i>E</i> − <i>λI</i>) = <i>λ</i>² − 3<i>λ</i> + 2 = 0</div>
      <p>Along the 45° diagonal <b>v</b>₁ = (1, 1), <i>E</i> stretches every vector by eigenvalue <b><i>λ</i>₁ = 2</b>. Along the 135° diagonal <b>v</b>₂ = (−1, 1), <i>E</i> leaves vectors unchanged (<b><i>λ</i>₂ = 1</b>). Notice that <i>λ</i>₁ + <i>λ</i>₂ = 3 = trace(<i>E</i>) and <i>λ</i>₁<i>λ</i>₂ = 2 = det(<i>E</i>).</p>
      <table class="data">
        <tr><th>direction</th><th>vector <b>v</b></th><th>image <i>E</i><b>v</b></th><th>eigenvalue <i>λ</i></th></tr>
        <tr><td>0° (horizontal)</td><td>(1, 0)</td><td>(1.5, 0.5)</td><td>off-axis</td></tr>
        <tr><td><b>45° (eigen 1)</b></td><td><b>(1, 1)</b></td><td><b>(2, 2)</b></td><td><b>λ₁ = 2</b></td></tr>
        <tr><td><b>135° (eigen 2)</b></td><td><b>(−1, 1)</b></td><td><b>(−1, 1)</b></td><td><b>λ₂ = 1</b></td></tr>
      </table>
      <div class="charts">${chart({ ...RANGES.eigen, xlabel: 'angle θ (rad)', ylabel: 'cross sin(u, Eu)', cursors: ['eig'], label: 'Off-axis deflection crossing zero at θ = π/4 and 3π/4',
        series: [{ cls: 'grid', pts: [[0, 0], [Math.PI, 0]] }, { pts: samples(0, Math.PI, 90, th => M.eigenCrossSin(M.MAT_E, th)) }],
        marks: [[Math.PI / 4, 0, 'λ₁ = 2 (45°)'], [(3 * Math.PI) / 4, 0, 'λ₂ = 1 (135°)']] })}</div>
      <p class="hintline">Watch the red output vector lock onto the dark input vector as θ passes 45° and 135°.</p>`,
    cam: { target: at('eigen', 0, 0), az: -6, el: 5, dist: 16.5 }, lit: 'eigen', scene: 'eigen', look: {},
    fig: 'Invariant eigen-axes at 45° and 135°',
    alt: 'A dark unit vector u(θ) revolving in a circle while its red image Eu(θ) sweeps around an ellipse, aligning with u(θ) along the red line y = x (λ₁ = 2) and blue line y = −x (λ₂ = 1).',
  },
  {
    kicker: '3.5', title: 'Matrix multiplication is composition', sub: 'applying one transformation after another depends on order',
    body: `
      <p class="lede">Why is the product <i>BA</i> of two matrices defined by feeding each column of <i>A</i> into <i>B</i>? Because <i>BA</i> is the single matrix that performs move <i>A</i> first and move <i>B</i> second. Compare a unit shear <i>S</i> = [[1, 1], [0, 1]] and a 90° rotation <i>R</i> = [[0, −1], [1, 0]]:</p>
      <div class="eq"><i>RS</i> = [[0, −1], [1, 1]]   ≠   <i>SR</i> = [[1, −1], [1, 0]]</div>
      <p>On the left board (<i>RS</i>: shear first, then rotate 90°), the corner (1, 1) lands at <b>(−1, 2)</b>. On the right board (<i>SR</i>: rotate 90° first, then shear), the same corner (1, 1) lands at <b>(0, 1)</b>. Order changes the destination, even though both products preserve area: det(<i>RS</i>) = det(<i>R</i>) det(<i>S</i>) = 1 × 1 = 1.</p>
      <table class="data">
        <tr><th>composition</th><th>matrix</th><th>image of <b>î</b></th><th>image of <b>ĵ</b></th><th>image of (1, 1)</th></tr>
        <tr><td>shear then rotate <i>RS</i></td><td>[[0, −1], [1, 1]]</td><td>(0, 1)</td><td>(−1, 1)</td><td><b>(−1, 2)</b></td></tr>
        <tr><td>rotate then shear <i>SR</i></td><td>[[1, −1], [1, 0]]</td><td>(1, 1)</td><td>(−1, 0)</td><td><b>(0, 1)</b></td></tr>
      </table>
      <div class="charts">${chart({ ...RANGES.compose, xlabel: 'blend s', ylabel: 'length |(1, 1) image|', cursors: ['crs', 'csr'], label: 'Length of image of (1, 1) under RS (reaching √5 ≈ 2.24) vs SR (reaching 1.00)',
        series: [{ pts: samples(0, 1, 50, s => Math.hypot(...M.applyMat(M.lerpMat(M.MAT_I, M.MAT_RS, s), [1, 1]))), tag: [0.68, 2.15, '|RS(1,1)| → 2.24'] },
                 { cls: 'curve total', pts: samples(0, 1, 50, s => Math.hypot(...M.applyMat(M.lerpMat(M.MAT_I, M.MAT_SR, s), [1, 1]))), tag: [0.68, 1.15, '|SR(1,1)| → 1.00'] }] })}</div>
      <p class="hintline">Click the board to compare the red parallelogram RS with the blue parallelogram SR.</p>`,
    cam: { target: at('compose', 0, 0), az: -5, el: 5, dist: 17.5 }, lit: 'compose', scene: 'compose', look: {},
    fig: 'Non-commutative composition RS ≠ SR',
    alt: 'Two coordinate boards side by side: on the left, RS sends the unit square to a red parallelogram reaching (−1, 2); on the right, SR sends it to a blue parallelogram reaching (0, 1).',
  },
];

export const PLATES = {
  basis: {
    text: 'The first column of A is the red vector Aî; the second column is the blue vector Aĵ. Every grid intersection (x, y) rides along to x Aî + y Aĵ.',
    facts: s => {
      const Ms = M.lerpMat(M.MAT_I, M.MAT_A, M.sSweep(s.t));
      return [['blend s', fmt(M.sSweep(s.t))], ['column 1 (Aî)', fmtVec([Ms.a, Ms.c])], ['column 2 (Aĵ)', fmtVec([Ms.b, Ms.d])], ['image of (1, 1)', fmtVec(M.applyMat(Ms, [1, 1]))]];
    },
  },
  shear: {
    text: 'A horizontal shear slides every point horizontally by k times its height y. Points on the x-axis (y = 0) never move, and the vertical height of the parallelogram stays 1, so its area is always 1.',
    facts: s => {
      const k = M.kAt(s.t), Sk = M.shearMat(k);
      return [['shear factor k', fmt(k)], ['column 1 (Sî)', '(1.00, 0.00)'], ['column 2 (Sĵ)', fmtVec([k, 1])], ['area det(S_k)', fmt(M.det(Sk))]];
    },
  },
  det: {
    text: 'The red parallelogram is the image of the unit square [0, 1] × [0, 1]. Its area det(M) = ad − bc is the universal area multiplier for every shape in the plane.',
    facts: s => {
      const Ms = M.lerpMat(M.MAT_I, M.MAT_A, M.sSweep(s.t));
      return [['ad', fmt(Ms.a * Ms.d, 3)], ['bc', fmt(Ms.b * Ms.c, 3)], ['det = ad − bc', fmt(M.det(Ms), 3)], ['polygon area', fmt(M.shoelaceArea(M.unitSquareCorners(Ms)), 3)]];
    },
  },
  collapse: {
    text: 'When d reaches 0.40, the blue column (0.6, 0.4) is exactly half of the red column (1.2, 0.8). With both columns on the same line y = ⅔x, 2D space loses a dimension and det(C) = 0.',
    facts: s => {
      const d = M.dCollapseAt(s.t), C = M.collapseMat(d);
      return [['entry d', fmt(d)], ['column 1', '(1.20, 0.80)'], ['column 2', fmtVec([0.6, d])], ['area det(C)', fmt(M.det(C), 3)]];
    },
  },
  eigen: {
    text: 'An eigenvector is a direction that the matrix scales purely along its own line without rotating. Symmetric 2×2 matrices always have two perpendicular eigenvector axes.',
    facts: s => {
      const th = M.thetaAt(s.t) % Math.PI;
      const u = [Math.cos(th), Math.sin(th)], eu = M.applyMat(M.MAT_E, u);
      return [['angle θ', `${fmt((th * 180) / Math.PI, 0)}°`], ['input u(θ)', fmtVec(u)], ['output E u(θ)', fmtVec(eu)], ['eigenvalues', 'λ₁ = 2, λ₂ = 1']];
    },
  },
  compose: {
    text: 'In matrix notation RS v = R(S v), the rightmost matrix S acts first. Changing the order to SR changes the columns and lands the unit square in a completely different place.',
    facts: s => {
      const u = M.sSweep(s.t);
      const pRS = M.applyMat(M.lerpMat(M.MAT_I, M.MAT_RS, u), [1, 1]);
      const pSR = M.applyMat(M.lerpMat(M.MAT_I, M.MAT_SR, u), [1, 1]);
      return [['RS(1, 1) (shear→rot)', fmtVec(pRS)], ['SR(1, 1) (rot→shear)', fmtVec(pSR)], ['det(RS) = det(SR)', '1.00']];
    },
  },
};
