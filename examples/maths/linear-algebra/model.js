// Pure mathematical model for Chapter 3: Linear transformations (Linear Algebra).
// Zero DOM, zero Three.js imports. Every number on screen or in practice.js comes from here.

// 0 · Standard matrix A = [[1.5, 0.5], [0.5, 1.25]]
export const MAT_A = { a: 1.5, b: 0.5, c: 0.5, d: 1.25 };
export const MAT_I = { a: 1, b: 0, c: 0, d: 1 };
export const P0 = [1, 1];

// Apply 2×2 matrix M = { a, b, c, d } to [x, y]
export function applyMat(M, [x, y]) {
  return [M.a * x + M.b * y, M.c * x + M.d * y];
}

// Interpolate between two 2×2 matrices: (1 − s) M0 + s M1
export function lerpMat(M0, M1, s) {
  return {
    a: M0.a + (M1.a - M0.a) * s,
    b: M0.b + (M1.b - M0.b) * s,
    c: M0.c + (M1.c - M0.c) * s,
    d: M0.d + (M1.d - M0.d) * s,
  };
}

// Smooth oscillation s(t) in [0, 1]
export function sSweep(t) {
  return 0.5 - 0.5 * Math.cos(0.65 * t);
}

// 1 · Shear S_k = [[1, k], [0, 1]] and rotation R_θ = [[cos θ, −sin θ], [sin θ, cos θ]]
export function shearMat(k) {
  return { a: 1, b: k, c: 0, d: 1 };
}

export function rotMat(theta) {
  const c = Math.cos(theta), s = Math.sin(theta);
  return { a: c, b: -s, c: s, d: c };
}

export function kAt(t) {
  return 1.2 * sSweep(t);
}

// 2 · Determinant det(M) = ad − bc and polygon signed area (shoelace formula)
export function det(M) {
  return M.a * M.d - M.b * M.c;
}

export function trace(M) {
  return M.a + M.d;
}

export function shoelaceArea(pts) {
  let sum = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    sum += x1 * y2 - x2 * y1;
  }
  return 0.5 * sum;
}

export function unitSquareCorners(M) {
  return [
    applyMat(M, [0, 0]),
    applyMat(M, [1, 0]),
    applyMat(M, [1, 1]),
    applyMat(M, [0, 1]),
  ];
}

// 3 · Singular collapse: C(d) = [[1.2, 0.6], [0.8, d]] where d → 0.4 makes col 2 = ½ col 1
export function collapseMat(d) {
  return { a: 1.2, b: 0.6, c: 0.8, d };
}

export const D_SINGULAR = 0.4;
export const NULL_VEC = [-1, 2]; // 1.2(−1) + 0.6(2) = 0, 0.8(−1) + 0.4(2) = 0

export function dCollapseAt(t) {
  // sweeps between d = 1.15 (det = 0.90) and d = 0.40 (det = 0.00)
  return 0.4 + 0.75 * (1 - sSweep(t));
}

// 4 · Eigenvectors of symmetric matrix E = [[1.5, 0.5], [0.5, 1.5]]
export const MAT_E = { a: 1.5, b: 0.5, c: 0.5, d: 1.5 };
export const EIGEN_1 = { lambda: 2.0, vec: [1, 1], angle: Math.PI / 4 };
export const EIGEN_2 = { lambda: 1.0, vec: [-1, 1], angle: (3 * Math.PI) / 4 };

// Characteristic polynomial p(λ) = λ² − tr(M) λ + det(M)
export function charPoly(M, lambda) {
  return lambda * lambda - trace(M) * lambda + det(M);
}

// Sine of angle between u and E·u: zero iff u is an eigenvector of E
export function eigenCrossSin(M, theta) {
  const u = [Math.cos(theta), Math.sin(theta)];
  const v = applyMat(M, u);
  const lenV = Math.hypot(v[0], v[1]);
  return lenV < 1e-12 ? 0 : (u[0] * v[1] - u[1] * v[0]) / lenV;
}

export function thetaAt(t) {
  return 0.48 * t;
}

// 5 · Composition: S = [[1, 1], [0, 1]] and R = [[0, −1], [1, 0]] (90° rotation)
export const COMP_S = shearMat(1);
export const COMP_R = { a: 0, b: -1, c: 1, d: 0 };

export function mulMat(B, A) {
  return {
    a: B.a * A.a + B.b * A.c,
    b: B.a * A.b + B.b * A.d,
    c: B.c * A.a + B.d * A.c,
    d: B.c * A.b + B.d * A.d,
  };
}

export const MAT_RS = mulMat(COMP_R, COMP_S); // [[0, −1], [1, 1]]
export const MAT_SR = mulMat(COMP_S, COMP_R); // [[1, −1], [1, 0]]
