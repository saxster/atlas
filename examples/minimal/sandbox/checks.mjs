// node examples/minimal/sandbox/checks.mjs — electric field is −∇V, superposition holds, and dipole bisect is perpendicular.
import { checks, near, deriv } from '@saxster/atlas/checks.js';
import * as M from './model.js';

const C = checks();
const dipole = [{ x: -1.2, y: 0, q: 1 }, { x: 1.2, y: 0, q: -1 }];
const quad = [{ x: -1, y: -0.8, q: 1 }, { x: 1, y: -0.8, q: -1 }, { x: 1, y: 0.8, q: 1 }, { x: -1, y: 0.8, q: -1 }];

// 1. E = −∇V at sample points for arbitrary charge sets
for (const [px, py] of [[0, 0.9], [0.5, -0.7], [-1.8, 0.6], [1.9, 1.1]]) {
  const [ex, ey] = M.fieldAt(quad, px, py);
  const dvx = -deriv(x => M.potentialAt(quad, x, py), px);
  const dvy = -deriv(y => M.potentialAt(quad, px, y), py);
  C.check(`E = −∇V at (${px}, ${py})`, near(ex, dvx, 1e-6) && near(ey, dvy, 1e-6));
}

// 2. Superposition: field of dipole equals sum of single-charge fields
{
  const [ex, ey] = M.fieldAt(dipole, 0.4, 0.8);
  const [e1x, e1y] = M.fieldAt([dipole[0]], 0.4, 0.8);
  const [e2x, e2y] = M.fieldAt([dipole[1]], 0.4, 0.8);
  C.check('superposition: E(q1 + q2) = E(q1) + E(q2)', near(ex, e1x + e2x, 1e-12) && near(ey, e1y + e2y, 1e-12));
}

// 3. On the perpendicular bisector x = 0 of a symmetric dipole, V = 0 and Ey = 0 while Ex > 0
for (const y of [-1.2, 0, 1.2]) {
  const [ex, ey] = M.fieldAt(dipole, 0, y);
  C.check(`dipole bisector (0, ${y}): V = 0, Ey = 0, Ex > 0`,
    near(M.potentialAt(dipole, 0, y), 0, 1e-12) && near(ey, 0, 1e-12) && ex > 0);
}

// 4. Electrostatic pair energy of dipole at separation d = 2.4 is −1 / 2.4
C.check('pairEnergy of opposite charges at d = 2.4 is −1/2.4', near(M.pairEnergy(dipole), -1 / 2.4, 1e-12));
C.report();
