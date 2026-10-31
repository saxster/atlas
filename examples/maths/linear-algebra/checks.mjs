// node examples/maths/linear-algebra/checks.mjs — independent proofs of linearity, shoelace area = det, singular nullspace, eigenvalues, composition, and practice.
import { checks, near, bisect } from '@saxster/atlas/checks.js';
import * as M from './model.js';
import { PRACTICE } from './practice.js';

const C = checks();

// 1. Linearity: A(αu + βv) = α A(u) + β A(v) for arbitrary vectors and scalars
{
  const u = [1.4, -0.7], v = [-0.5, 2.1], alpha = 1.8, beta = -0.9;
  const comb = [alpha * u[0] + beta * v[0], alpha * u[1] + beta * v[1]];
  const lhs = M.applyMat(M.MAT_A, comb);
  const au = M.applyMat(M.MAT_A, u), av = M.applyMat(M.MAT_A, v);
  const rhs = [alpha * au[0] + beta * av[0], alpha * au[1] + beta * av[1]];
  C.check('linearity: A(αu + βv) = α A(u) + β A(v)',
    near(lhs[0], rhs[0], 1e-12) && near(lhs[1], rhs[1], 1e-12));
}

// 2. Shear preserves area (det S_k = 1) and rotation preserves both area (det R_θ = 1) and length
for (const k of [0, 0.6, 1.2]) {
  const S = M.shearMat(k);
  C.check(`shear S_${k}: det = 1 and shoelace area of unit square = 1`,
    near(M.det(S), 1, 1e-12) && near(M.shoelaceArea(M.unitSquareCorners(S)), 1, 1e-12));
}
for (const th of [0.3, 1.1, 2.4]) {
  const R = M.rotMat(th), p = [1.7, -0.9], rp = M.applyMat(R, p);
  C.check(`rotation R(${th}): det = 1 and |R p| = |p|`,
    near(M.det(R), 1, 1e-12) && near(Math.hypot(...rp), Math.hypot(...p), 1e-12));
}

// 3. Determinant equals signed shoelace area of transformed unit square across interpolated matrices
for (const s of [0, 0.25, 0.5, 0.75, 1.0]) {
  const Ms = M.lerpMat(M.MAT_I, M.MAT_A, s);
  const d = M.det(Ms), area = M.shoelaceArea(M.unitSquareCorners(Ms));
  C.check(`det(M(${s})) = ${d.toFixed(4)} matches shoelace polygon area`,
    near(d, area, 1e-12));
}

// 4. Singular collapse: bisect finds d = 0.4 where det(C(d)) = 0, and null vector (−1, 2) maps to (0, 0)
{
  const dRoot = bisect(d => M.det(M.collapseMat(d)), 0.0, 1.0);
  const Csing = M.collapseMat(dRoot);
  const zero = M.applyMat(Csing, M.NULL_VEC);
  // Every image vector lands on the line 2x − 3y = 0
  const img = M.applyMat(Csing, [2.3, -1.7]);
  C.check('singular collapse at d = 0.4: bisect root, nullspace (−1, 2) → (0, 0), and rank-1 line y = ⅔x',
    near(dRoot, M.D_SINGULAR, 1e-10) && near(zero[0], 0, 1e-10) && near(zero[1], 0, 1e-10) && near(2 * img[0] - 3 * img[1], 0, 1e-10));
}

// 5. Eigenvectors of E = [[1.5, 0.5], [0.5, 1.5]]: roots of charPoly via bisect and angles where u × Eu = 0
{
  const l1 = bisect(l => M.charPoly(M.MAT_E, l), 1.5, 2.5);
  const l2 = bisect(l => M.charPoly(M.MAT_E, l), 0.5, 1.4);
  const th1 = bisect(th => M.eigenCrossSin(M.MAT_E, th), 0.2, 1.2);
  const th2 = bisect(th => M.eigenCrossSin(M.MAT_E, th), 1.8, 2.8);
  C.check('eigenvalues λ₁ = 2, λ₂ = 1 match bisect of charPoly and trace/det identities',
    near(l1, M.EIGEN_1.lambda, 1e-9) && near(l2, M.EIGEN_2.lambda, 1e-9) &&
    near(l1 + l2, M.trace(M.MAT_E), 1e-9) && near(l1 * l2, M.det(M.MAT_E), 1e-9));
  C.check('eigenvector angles θ₁ = π/4 and θ₂ = 3π/4 found via bisect of u × Eu = 0',
    near(th1, M.EIGEN_1.angle, 1e-9) && near(th2, M.EIGEN_2.angle, 1e-9));
}

// 6. Matrix multiplication is composition: (BA)v = B(Av) and det(BA) = det(B) det(A), while RS ≠ SR
{
  const v = [1.3, -0.8];
  const rsDirect = M.applyMat(M.MAT_RS, v);
  const rsStep = M.applyMat(M.COMP_R, M.applyMat(M.COMP_S, v));
  const srDirect = M.applyMat(M.MAT_SR, v);
  const srStep = M.applyMat(M.COMP_S, M.applyMat(M.COMP_R, v));
  C.check('(RS)v = R(Sv), (SR)v = S(Rv), det(RS) = det(R)det(S) = 1, and RS ≠ SR',
    near(rsDirect[0], rsStep[0], 1e-12) && near(rsDirect[1], rsStep[1], 1e-12) &&
    near(srDirect[0], srStep[0], 1e-12) && near(srDirect[1], srStep[1], 1e-12) &&
    near(M.det(M.MAT_RS), M.det(M.COMP_R) * M.det(M.COMP_S), 1e-12) &&
    Math.hypot(rsDirect[0] - srDirect[0], rsDirect[1] - srDirect[1]) > 0.5);
}

// 7. Practice questions: every question has 4 unique choices and its answer is independently recomputed
const fmt = (x, n = 2) => (x < -1e-12 ? '−' : '') + Math.abs(x).toFixed(n);
const fmtVec = ([x, y], n = 2) => `(${fmt(x, n)}, ${fmt(y, n)})`;
const ans = (p, i) => PRACTICE[p][i].choices[PRACTICE[p][i].answer];
for (const [page, qs] of Object.entries(PRACTICE)) {
  for (const [i, q] of qs.entries()) {
    const uniq = new Set(q.choices).size === q.choices.length;
    const valid = q.answer >= 0 && q.answer < q.choices.length && q.why.length > 20;
    C.check(`practice p.${page}#${i + 1} has 4 distinct choices and explanation`, uniq && valid);
  }
}
C.check('practice 0#1: A(2, 2) via 2*(col 1) + 2*(col 2)', ans(0, 0) === fmtVec([2 * 1.5 + 2 * 0.5, 2 * 0.5 + 2 * 1.25]));
C.check('practice 0#2: first column is landing spot of (1, 0)', ans(0, 1).endsWith(fmtVec([M.MAT_A.a, M.MAT_A.c])));
C.check('practice 1#1: horizontal shear k=1.2 on (1, 2) via (x + k*y, y)', ans(1, 0) === fmtVec([1 + 1.2 * 2, 2]));
C.check('practice 1#2: shear area multiplier via shoelaceArea of sheared unit square', ans(1, 1).startsWith(fmt(M.shoelaceArea(M.unitSquareCorners(M.shearMat(1.2))), 2)));
{ const shoelaceA = M.shoelaceArea(M.unitSquareCorners(M.MAT_A));
  C.check('practice 2#1: det(A) via shoelace area of transformed unit square', ans(2, 0) === fmt(shoelaceA, 3));
  const scaledRect = [[0, 0], [2, 0], [2, 2], [0, 2]].map(p => M.applyMat(M.MAT_A, p));
  C.check('practice 2#2: area of 2×2 square under A via shoelace polygon area', ans(2, 1) === fmt(M.shoelaceArea(scaledRect), 2)); }
{ const dSing = bisect(d => M.shoelaceArea(M.unitSquareCorners(M.collapseMat(d))), 0, 1);
  C.check('practice 3#1: singular d via bisect on shoelace area = 0', ans(3, 0) === fmt(dSing, 2));
  const col1 = [1.2, 0.8], col2 = [0.6, dSing];
  C.check('practice 3#2: null vector (−1, 2) via −1*col1 + 2*col2', ans(3, 1) === fmtVec([-col1[0] + 2 * col2[0], -col1[1] + 2 * col2[1]])); }
{ const l1 = bisect(l => M.charPoly(M.MAT_E, l), 1.5, 2.5), l2 = bisect(l => M.charPoly(M.MAT_E, l), 0.5, 1.4);
  C.check('practice 4#1: E(3, 3) via eigenvalue scaling λ₁*(3, 3)', ans(4, 0) === fmtVec([l1 * 3, l1 * 3]));
  C.check('practice 4#2: sum and product of bisect roots λ₁, λ₂ match trace and det', ans(4, 1) === `sum = trace(E) = ${fmt(l1 + l2, 0)}, product = det(E) = ${fmt(l1 * l2, 0)}`); }
{ const sFirst = M.applyMat(M.COMP_S, [1, 1]), rsSeq = M.applyMat(M.COMP_R, sFirst);
  const rFirst = M.applyMat(M.COMP_R, [1, 1]), srSeq = M.applyMat(M.COMP_S, rFirst);
  C.check('practice 5#1: RS(1, 1) via sequential application R(S(1, 1))', ans(5, 0) === fmtVec(rsSeq));
  C.check('practice 5#2: SR(1, 1) via sequential application S(R(1, 1))', ans(5, 1) === fmtVec(srSeq)); }

C.report();
