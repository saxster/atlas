// Pure mathematical model for Chapter 4: Differential Equations & Phase Portraits.
// Zero DOM or Three.js imports; every formula and trajectory is verified independently in checks.mjs.

// 0 · Slope field: dy/dt = y − t, with exact solution y(t) = t + 1 + (y0 − t0 − 1) e^(t − t0)
export const slopeFieldRhs = (t, y) => y - t;
export const slopeFieldExact = (t, t0, y0) => t + 1 + (y0 - t0 - 1) * Math.exp(t - t0);

// 1 · Exponential relaxation (Newton cooling / first-order linear): dy/dt = −k(y − y_eq)
export const K_COOL = 0.8;
export const Y_EQ = 1.0;
export const coolingRhs = (y, k = K_COOL, yEq = Y_EQ) => -k * (y - yEq);
export const coolingExact = (t, y0, k = K_COOL, yEq = Y_EQ) => yEq + (y0 - yEq) * Math.exp(-k * t);
export const coolingTau = (k = K_COOL) => 1 / k;

// 2 · Autonomous logistic equation: dy/dt = r y (1 − y / K)
export const R_LOG = 1.2;
export const K_LOG = 2.4;
export const logisticRhs = (y, r = R_LOG, K = K_LOG) => r * y * (1 - y / K);
export const logisticExact = (t, y0, r = R_LOG, K = K_LOG) => {
  if (Math.abs(y0) < 1e-12) return 0;
  return K / (1 + ((K - y0) / y0) * Math.exp(-r * t));
};

// 3 · Undamped harmonic oscillator phase plane: x' = v, v' = −ω₀² x (ω₀ = 1)
export const OMEGA0 = 1.0;
export const harmonicVec = (x, v, w = OMEGA0) => [v, -w * w * x];
export const harmonicExact = (t, x0, v0, w = OMEGA0) => [
  x0 * Math.cos(w * t) + (v0 / w) * Math.sin(w * t),
  -x0 * w * Math.sin(w * t) + v0 * Math.cos(w * t),
];
export const harmonicEnergy = (x, v, w = OMEGA0) => 0.5 * (w * w * x * x + v * v);

// 4 · Underdamped spiral sink: x' = v, v' = −ω₀² x − 2γ v
export const GAMMA = 0.25;
export const spiralVec = (x, v, g = GAMMA, w = OMEGA0) => [v, -w * w * x - 2 * g * v];
export const spiralExact = (t, x0, v0, g = GAMMA, w = OMEGA0) => {
  const wd = Math.sqrt(w * w - g * g);
  const env = Math.exp(-g * t);
  const A = x0, B = (v0 + g * x0) / wd;
  const x = env * (A * Math.cos(wd * t) + B * Math.sin(wd * t));
  const v = env * ((B * wd - A * g) * Math.cos(wd * t) - (A * wd + B * g) * Math.sin(wd * t));
  return [x, v];
};
export const spiralMat = (g = GAMMA, w = OMEGA0) => ({ a: 0, b: 1, c: -w * w, d: -2 * g });

// 5 · Hyperbolic saddle & trace-determinant classification: x' = A x
export const SADDLE_MAT = { a: 0.8, b: 0.4, c: 0.4, d: -0.8 };
export const linearVec = (M, x, y) => [M.a * x + M.b * y, M.c * x + M.d * y];
export const trace = M => M.a + M.d;
export const det = M => M.a * M.d - M.b * M.c;
export const discriminant = M => trace(M) ** 2 - 4 * det(M);
export const eigenvalues = M => {
  const tr = trace(M), disc = discriminant(M);
  if (disc >= 0) {
    const s = Math.sqrt(disc);
    return { real: true, l1: 0.5 * (tr + s), l2: 0.5 * (tr - s), im: 0 };
  }
  return { real: false, l1: 0.5 * tr, l2: 0.5 * tr, im: 0.5 * Math.sqrt(-disc) };
};
export const classifyEquilibrium = M => {
  const tr = trace(M), d = det(M), disc = tr * tr - 4 * d;
  if (d < 0) return 'saddle';
  if (disc < 0) return Math.abs(tr) < 1e-9 ? 'center' : (tr < 0 ? 'spiral sink' : 'spiral source');
  return tr < 0 ? 'nodal sink' : 'nodal source';
};
// Unit unstable (+) and stable (−) eigenvectors for SADDLE_MAT
export const saddleEigenvectors = (M = SADDLE_MAT) => {
  const { l1, l2 } = eigenvalues(M);
  const norm = (vx, vy) => { const L = Math.hypot(vx, vy) || 1; return [vx / L, vy / L]; };
  return {
    l1, l2,
    vUnstable: norm(M.b, l1 - M.a),
    vStable: norm(M.b, l2 - M.a),
  };
};
