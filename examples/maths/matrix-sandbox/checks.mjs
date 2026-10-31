// node examples/maths/matrix-sandbox/checks.mjs — verifies det = shoelaceArea, eigenvalues/eigenvectors, and rotation complex eigenvalues.
import { checks, near } from '@saxster/atlas/checks.js';
import * as M from './model.js';

const C = checks();

// 1. Determinant matches signed shoelace area across positive, zero, and negative determinants
for (const m of [
  { a: 1.5, b: 0.5, c: 0.5, d: 1.25 },
  { a: 1, b: 1.2, c: 0, d: 1 },
  { a: 0, b: 1, c: 1, d: 0 },
  { a: 1.2, b: 0.6, c: 0.8, d: 0.4 },
]) {
  C.check(`det([[${m.a},${m.b}],[${m.c},${m.d}]]) matches shoelace area`,
    near(M.det(m), M.shoelaceArea(M.unitSquareCorners(m)), 1e-12));
}

// 2. Eigenvectors returned by eigenInfo satisfy A v = λ v
for (const m of [
  { a: 1.5, b: 0.5, c: 0.5, d: 1.5 },
  { a: 2.0, b: 0.6, c: 0.0, d: 0.8 },
  { a: 0.0, b: 1.0, c: 1.0, d: 0.0 },
]) {
  const info = M.eigenInfo(m);
  const ok = info.real && info.dirs.every(({ lambda, v }) => {
    const av = M.apply(m, v);
    return near(av[0], lambda * v[0], 1e-10) && near(av[1], lambda * v[1], 1e-10);
  });
  C.check(`eigenInfo eigenvectors satisfy A v = λ v for [[${m.a},${m.b}],[${m.c},${m.d}]]`, ok && near(info.l1 + info.l2, M.trace(m), 1e-12) && near(info.l1 * info.l2, M.det(m), 1e-12));
}

// 3. 90° rotation [[0, −1], [1, 0]] has no real eigenvectors (im = 1)
{
  const rot = M.eigenInfo({ a: 0, b: -1, c: 1, d: 0 });
  C.check('90° rotation has complex eigenvalues ±i and 0 real eigenvector lines', !rot.real && near(rot.im, 1, 1e-12));
}

C.report();
