// linear-algebra/practice.js — exam-style practice (A-level Further Maths, IB HL, Linear Algebra), two questions per page.
// Every number is computed from model.js; checks.mjs verifies every answer a second way.
import * as M from './model.js';

const fmt = (x, n = 2) => (x < -1e-12 ? '−' : '') + Math.abs(x).toFixed(n);
const fmtVec = ([x, y], n = 2) => `(${fmt(x, n)}, ${fmt(y, n)})`;

// 0 · Basis columns: A = [[1.5, 0.5], [0.5, 1.25]] acting on (2, 2) and (1, 0)
const p0 = [2, 2], ap0 = M.applyMat(M.MAT_A, p0), ai0 = M.applyMat(M.MAT_A, [1, 0]);
// 1 · Shear S_1.2 acting on (1, 2) and determinant of any shear
const k1 = 1.2, p1 = [1, 2], sp1 = M.applyMat(M.shearMat(k1), p1);
// 2 · Determinant of A = [[1.5, 0.5], [0.5, 1.25]] and area of a 4 cm² shape under A
const detA = M.det(M.MAT_A), area2 = 4 * detA;
// 3 · Singular collapse of C(d) = [[1.2, 0.6], [0.8, d]] when d = 0.4, and image of null vector (−1, 2)
const dSing = M.D_SINGULAR, nullImg = M.applyMat(M.collapseMat(dSing), M.NULL_VEC);
// 4 · Eigenvalues of E = [[1.5, 0.5], [0.5, 1.5]] and E acting on (3, 3)
const ev3 = M.applyMat(M.MAT_E, [3, 3]);
// 5 · Composition RS vs SR on (1, 1)
const rs11 = M.applyMat(M.MAT_RS, [1, 1]), sr11 = M.applyMat(M.MAT_SR, [1, 1]);

export const PRACTICE = {
  0: [
    { q: `The matrix <i>A</i> sends <b>î</b> = (1, 0) to (1.50, 0.50) and <b>ĵ</b> = (0, 1) to (0.50, 1.25). Where does <i>A</i> send the point (2, 2) = 2<b>î</b> + 2<b>ĵ</b>?`,
      choices: [fmtVec([3.0, 2.5]), fmtVec(ap0), fmtVec([2.0, 1.75]), fmtVec([3.5, 3.0])], answer: 1,
      why: `<p>By linearity, <i>A</i>(2<b>î</b> + 2<b>ĵ</b>) = 2(1.50, 0.50) + 2(0.50, 1.25) = (3.00, 1.00) + (1.00, 2.50) = <b>${fmtVec(ap0)}</b>.</p>` },
    { q: `What does the first column of any 2×2 matrix <i>M</i> tell you geometrically?`,
      choices: ['Where (1, 1) lands', `Where the unit basis vector î = (1, 0) lands: ${fmtVec(ai0)}`, 'The area scale factor det(M)', 'The slope of the y-axis'], answer: 1,
      why: `<p>Multiplying <i>M</i> by <b>î</b> = [1, 0]ᵀ picks out 1 × (column 1) + 0 × (column 2), which is the first column itself.</p>` },
  ],
  1: [
    { q: `Under the horizontal shear <i>S</i> = [[1, 1.2], [0, 1]], where does the point (1, 2) land?`,
      choices: [fmtVec([1, 2.4]), fmtVec(sp1), fmtVec([2.2, 2]), fmtVec([1.2, 2.4])], answer: 1,
      why: `<p>A horizontal shear adds <i>k y</i> = 1.2 × 2 = 2.4 to the <i>x</i>-coordinate while keeping <i>y</i> = 2 unchanged: (1 + 2.4, 2) = <b>${fmtVec(sp1)}</b>.</p>` },
    { q: `How much does a horizontal shear <i>S<sub>k</sub></i> = [[1, <i>k</i>], [0, 1]] multiply the area of the unit square?`,
      choices: ['1 + k', '1.00 (area is unchanged)', 'k', '1 + k²'], answer: 1,
      why: `<p>Shearing slides the top of the unit square sideways without changing its base (1) or its vertical height (1), matching det(<i>S<sub>k</sub></i>) = 1·1 − <i>k</i>·0 = <b>1.00</b>.</p>` },
  ],
  2: [
    { q: `What is the determinant det(<i>A</i>) = <i>ad</i> − <i>bc</i> of <i>A</i> = [[1.50, 0.50], [0.50, 1.25]]?`,
      numeric: { answer: detA, tol: 0.01, placeholder: '1.625' },
      choices: ['1.375', fmt(detA, 3), '1.875', '2.125'], answer: 1,
      why: `<div class="eq">det(<i>A</i>) = (1.50)(1.25) − (0.50)(0.50) = 1.875 − 0.250 = ${fmt(detA, 3)}</div>` },
    { q: `A region of area 4.00 sits in the plane. After applying <i>A</i> with det(<i>A</i>) = ${fmt(detA, 3)}, what is the area of the transformed region?`,
      numeric: { answer: area2, tol: 0.02, placeholder: '6.50' },
      choices: ['4.00', '5.63', fmt(area2, 2), '7.50'], answer: 2,
      why: `<p>Every tiny grid square is scaled in area by |det(<i>A</i>)| = ${fmt(detA, 3)}, so a region of area 4 becomes 4 × ${fmt(detA, 3)} = <b>${fmt(area2, 2)}</b>.</p>` },
  ],
  3: [
    { q: `For <i>C</i> = [[1.2, 0.6], [0.8, <i>d</i>]], what value of <i>d</i> makes the matrix singular (det(<i>C</i>) = 0) so the entire 2D grid collapses onto a line?`,
      numeric: { answer: dSing, tol: 0.01, placeholder: '0.40' },
      target: { label: 'Check singular collapse in figure', hint: 'Drag Cĵ to d = 0.40 where det(C) = 0', check: s => Math.abs(s?.collapse?.detC ?? 1) <= 0.08 },
      choices: ['0.20', fmt(dSing, 2), '0.60', '0.80'], answer: 1,
      why: `<p>Setting det(<i>C</i>) = 1.2<i>d</i> − (0.6)(0.8) = 1.2<i>d</i> − 0.48 = 0 gives <i>d</i> = 0.48 / 1.2 = <b>${fmt(dSing, 2)}</b>. Then column 2 is exactly ½ of column 1.</p>` },
    { q: `When <i>d</i> = ${fmt(dSing, 1)}, where does the singular matrix <i>C</i> = [[1.2, 0.6], [0.8, 0.4]] send the vector (−1, 2)?`,
      choices: [fmtVec([-1.2, 1.6]), fmtVec(nullImg), fmtVec([0.6, 0.4]), fmtVec([1.2, 0.8])], answer: 1,
      why: `<p>Because column 2 is half of column 1, −1 × (column 1) + 2 × (column 2) cancels completely to <b>${fmtVec(nullImg)}</b>: (−1, 2) lies in the null space of <i>C</i>.</p>` },
  ],
  4: [
    { q: `For <i>E</i> = [[1.5, 0.5], [0.5, 1.5]], the vector <b>v</b>₁ = (1, 1) satisfies <i>E</i><b>v</b>₁ = (2, 2) = 2<b>v</b>₁. Where does <i>E</i> send (3, 3)?`,
      target: { label: 'Check eigenvector alignment in figure', hint: 'Drag u(θ) onto an eigenvector axis where u × Eu ≈ 0', check: s => Math.abs(s?.eigen?.cross ?? 1) <= 0.12 },
      choices: [fmtVec([3, 3]), fmtVec([4.5, 4.5]), fmtVec(ev3), fmtVec([6, 3])], answer: 2,
      why: `<p>The point (3, 3) lies on the λ₁ = 2 eigenvector axis <i>y</i> = <i>x</i>, so <i>E</i> simply stretches it by a factor of 2 to <b>${fmtVec(ev3)}</b>.</p>` },
    { q: `The eigenvalues of <i>E</i> = [[1.5, 0.5], [0.5, 1.5]] are λ₁ = 2 and λ₂ = 1. What do their sum λ₁ + λ₂ and product λ₁λ₂ equal?`,
      choices: ['sum = 2, product = 3', `sum = trace(E) = ${fmt(M.trace(M.MAT_E), 0)}, product = det(E) = ${fmt(M.det(M.MAT_E), 0)}`, 'sum = 1.5, product = 2.25', 'sum = 3, product = 2.25'], answer: 1,
      why: `<p>For any 2×2 matrix, the sum of eigenvalues equals the trace <i>a</i> + <i>d</i> = 1.5 + 1.5 = <b>3</b>, and their product equals the determinant <i>ad</i> − <i>bc</i> = 2.25 − 0.25 = <b>2</b>.</p>` },
  ],
  5: [
    { q: `Let <i>S</i> = [[1, 1], [0, 1]] (shear) and <i>R</i> = [[0, −1], [1, 0]] (90° rotation). Where does (1, 1) land when you shear first and rotate second (<i>RS</i>)?`,
      choices: [fmtVec(sr11), fmtVec(rs11), fmtVec([2, 1]), fmtVec([-1, 1])], answer: 1,
      why: `<p>First <i>S</i>(1, 1) = (2, 1). Then rotating (2, 1) counter-clockwise by 90° gives <i>R</i>(2, 1) = <b>${fmtVec(rs11)}</b>.</p>` },
    { q: `If instead you rotate (1, 1) by 90° first and shear second (<i>SR</i>), where does (1, 1) land?`,
      choices: [fmtVec(rs11), fmtVec(sr11), fmtVec([-1, 1]), fmtVec([1, 2])], answer: 1,
      why: `<p>First <i>R</i>(1, 1) = (−1, 1). Then shearing horizontally adds <i>y</i> = 1 to <i>x</i>: <i>S</i>(−1, 1) = <b>${fmtVec(sr11)}</b> ≠ (−1, 2). Matrix multiplication is not commutative.</p>` },
  ],
};
