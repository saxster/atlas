// node examples/maths/multivariable/checks.mjs — verifies partials, tangent plane, directional derivative, Hessian, divergence theorem, and Green's theorem.
import { checks, near, deriv, integ } from '@saxster/atlas/checks.js';
import * as M from './model.js';
import { PRACTICE } from './practice.js';

const C = checks();

// 1. Partial derivatives of dome f(x, y) = 2 − ½(x² + y²) match numerical finite differences
for (const [x, y] of [[1.2, 0.8], [-0.7, 1.5], [0, 0]]) {
  const numFx = deriv(u => M.dome(u, y), x);
  const numFy = deriv(v => M.dome(x, v), y);
  C.check(`dome partials at (${x}, ${y}) match numerical derivatives`,
    near(M.domeFx(x, y), numFx, 1e-8) && near(M.domeFy(x, y), numFy, 1e-8));
}

// 2. Tangent plane touches dome at (x0, y0) with matching first partials and upward normal orthogonal to tangent vectors
{
  const x0 = 1.1, y0 = -0.6;
  const tx = [1, 0, M.domeFx(x0, y0)], ty = [0, 1, M.domeFy(x0, y0)];
  const n = M.domeNormal(x0, y0);
  const dotX = tx[0] * n[0] + tx[1] * n[1] + tx[2] * n[2];
  const dotY = ty[0] * n[0] + ty[1] * n[1] + ty[2] * n[2];
  C.check('tangent plane touches surface at (x0, y0) and normal (−fx, −fy, 1) is orthogonal to both tangent vectors',
    near(M.domeTangentPlane(x0, y0, x0, y0), M.dome(x0, y0), 1e-12) && near(dotX, 0, 1e-12) && near(dotY, 0, 1e-12));
}

// 3. Directional derivative D_u f = ∇f · u matches d/ds f(x + s ux, y + s uy) at s = 0, and is 0 tangent to level curve
{
  const x = 1.2, y = 0.9, ux = 0.6, uy = -0.8;
  const dNum = deriv(s => M.dome(x + s * ux, y + s * uy), 0);
  const dGrad = M.directionalDeriv(x, y, ux, uy);
  // Tangent to circle x² + y² = r² is (−y, x)
  const dContour = M.directionalDeriv(x, y, -y, x);
  C.check('directional derivative matches numerical derivative along u and vanishes tangent to level contour',
    near(dNum, dGrad, 1e-8) && near(dContour, 0, 1e-12));
}

// 4. Saddle surface h(x, y) = ½(x² − y²): numerical second partials match Hessian and D = −1 < 0
{
  const hxx = deriv(x => deriv(u => M.saddleSurf(u, 0), x), 0);
  const hyy = deriv(y => deriv(v => M.saddleSurf(0, v), y), 0);
  const H = M.saddleHessian();
  C.check('saddle Hessian h_xx = +1, h_yy = −1, D = −1 classifies as saddle',
    near(hxx, H.hxx, 1e-5) && near(hyy, H.hyy, 1e-5) && M.classifyCritical(H.hxx, H.hyy, H.hxy) === 'saddle');
}

// 5. 2D Divergence Theorem: line integral ∮ F · n ds around circle of radius R equals ∬ (∇·F) dA = (a + b) π R²
for (const [R, a, b] of [[1.5, 1, 1], [1.2, 1.5, 0.5]]) {
  // On x = R cos θ, y = R sin θ, outward normal n = (cos θ, sin θ), ds = R dθ
  const lineFlux = integ(th => {
    const x = R * Math.cos(th), y = R * Math.sin(th);
    const [fx, fy] = M.sourceField(x, y, a, b);
    return (fx * Math.cos(th) + fy * Math.sin(th)) * R;
  }, 0, 2 * Math.PI, 800);
  C.check(`Divergence Theorem on R = ${R}: ∮ F·n ds matches (div F) π R²`,
    near(lineFlux, M.diskFluxExact(R, a, b), 1e-9));
}

// 6. Green's Theorem (2D Stokes): circulation ∮ G · dr around circle of radius R equals ∬ (curl G) dA = 2ω π R²
for (const [R, w] of [[1.5, 1], [1.1, 1.8]]) {
  // dr = (−R sin θ, R cos θ) dθ
  const lineCirc = integ(th => {
    const x = R * Math.cos(th), y = R * Math.sin(th);
    const [gx, gy] = M.vortexField(x, y, w);
    return gx * (-R * Math.sin(th)) + gy * (R * Math.cos(th));
  }, 0, 2 * Math.PI, 800);
  C.check(`Green's Theorem on R = ${R}: ∮ G·dr matches (curl G) π R²`,
    near(lineCirc, M.diskCirculationExact(R, w), 1e-9));
}

// 7. Practice questions check
for (const [page, qs] of Object.entries(PRACTICE)) {
  for (const [i, q] of qs.entries()) {
    const uniq = new Set(q.choices).size === q.choices.length;
    const valid = q.answer >= 0 && q.answer < q.choices.length && q.why.length > 20;
    C.check(`practice p.${page}#${i + 1} has 4 distinct choices and explanation`, uniq && valid);
  }
}

C.report();
