// Pure mathematical model for Chapter 6: Multivariable Calculus (Surfaces, Gradient, Saddle Points, Divergence & Curl).
// Zero DOM or Three.js imports; verified independently in checks.mjs.

// 0–2 · Paraboloid dome: f(x, y) = 2 − ½(x² + y²)
export const dome = (x, y) => 2 - 0.5 * (x * x + y * y);
export const domeFx = (x, _y = 0) => -x;
export const domeFy = (_x, y) => -y;
export const domeGrad = (x, y) => [-x, -y];
export const domeTangentPlane = (x0, y0, x, y) =>
  dome(x0, y0) + domeFx(x0, y0) * (x - x0) + domeFy(x0, y0) * (y - y0);
export const domeNormal = (x0, y0) => [-domeFx(x0, y0), -domeFy(x0, y0), 1]; // [x0, y0, 1]
export const directionalDeriv = (x, y, ux, uy) => {
  const L = Math.hypot(ux, uy) || 1;
  const [gx, gy] = domeGrad(x, y);
  return (gx * ux + gy * uy) / L;
};

// 3 · Hyperbolic paraboloid (Pringle saddle): h(x, y) = ½(x² − y²)
export const saddleSurf = (x, y) => 0.5 * (x * x - y * y);
export const saddleGrad = (x, y) => [x, -y];
export const saddleHessian = () => ({ hxx: 1, hyy: -1, hxy: 0, det: -1 });
export const classifyCritical = (hxx, hyy, hxy) => {
  const D = hxx * hyy - hxy * hxy;
  if (D < 0) return 'saddle';
  if (D > 0) return hxx > 0 ? 'local minimum' : 'local maximum';
  return 'degenerate';
};

// 4 · Source vector field F(x, y) = (a x, b y), default a = 1, b = 1: div F = a + b = 2
export const sourceField = (x, y, a = 1, b = 1) => [a * x, b * y];
export const sourceDiv = (a = 1, b = 1) => a + b;
export const diskFluxExact = (R, a = 1, b = 1) => (a + b) * Math.PI * R * R;

// 5 · Vortex vector field G(x, y) = (−ω y, ω x), default ω = 1: curl_z G = 2ω = 2
export const vortexField = (x, y, w = 1) => [-w * y, w * x];
export const vortexCurl = (w = 1) => 2 * w;
export const diskCirculationExact = (R, w = 1) => 2 * w * Math.PI * R * R;
