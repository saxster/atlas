// node examples/minimal/book/checks.mjs — the model proved a second way: the slope measured numerically, and the
// practice answers recomputed from the definitions. Exit 1 on any failure.
import { checks, deriv, bisect } from '@saxster/atlas/checks.js';
import * as M from './model.js';
import { PRACTICE } from './practice.js';

const C = checks();
const xs = Array.from({ length: 401 }, (_, i) => -3 + i * 0.015);
const worst = Math.max(...xs.map(x => Math.abs(deriv(M.f, x) - (x * x - 1))));
C.check('a numerical derivative of f matches x² − 1 at 401 points, to 1e-6', worst < 1e-6, worst.toExponential(1));
// the tangent touches: the gap to the curve shrinks like h² (halving h quarters it)
const gap = (x0, h) => Math.abs(M.f(x0 + h) - M.tangent(x0)(x0 + h));
C.check('the tangent touches: its gap to the curve is O(h²)', [-1.3, 0.4, 2].every(x0 => Math.abs(gap(x0, 1e-3) / gap(x0, 5e-4) - 4) < 0.01));
C.check('slope 0 at the turning points: bisection finds ±1', M.STATIONARY.every(s => Math.abs(bisect(x => deriv(M.f, x), s - 0.5, s + 0.5) - s) < 1e-6));
C.check('f and f′ stay on the axes over their drawn ranges', [M.f, M.df].every((g, k) => { const [a, b] = k ? M.XD : M.XF;
  return Array.from({ length: 101 }, (_, i) => g(a + (b - a) * i / 100)).every(y => y >= M.Y[0] && y <= M.Y[1]); }));
C.check('the run-1 triangle stays on the axes as P sways', Array.from({ length: 161 }, (_, i) => M.xAt(i / 10)).every(x => x + 1 <= M.X[1] && M.f(x) + M.df(x) <= M.Y[1] && M.f(x) + M.df(x) >= M.Y[0]));

// practice, recomputed: the slope by a difference quotient, the crossings by bisection, rising by comparing heights
const r = s => (+s.replace('−', '-'));
const q = (p, i) => PRACTICE[p][i], picked = (p, i) => q(p, i).choices[q(p, i).answer];
C.check('p0 q1: f(3) = 6', Math.abs(r(picked(0, 0)) - (27 / 3 - 3)) < 0.005);
C.check('p0 q2: the other crossing is √3', Math.abs(bisect(M.f, 1, 3) - Math.sqrt(3)) < 1e-9 && picked(0, 1).includes('√3'));
C.check('p1 q1: slope at 2 is 3', Math.abs(r(picked(1, 0)) - deriv(M.f, 2)) < 0.005);
C.check('p1 q2: slope at 0 is −1', Math.abs(r(picked(1, 1)) - deriv(M.f, 0)) < 1e-6);
C.check('p2 q1: level at ±1', picked(2, 0) === '±1' && Math.abs(deriv(M.f, 1)) < 1e-9 && Math.abs(deriv(M.f, -1)) < 1e-9);
C.check('p2 q2: rising at −2', picked(2, 1) === (M.f(-1.999) > M.f(-2.001) ? 'rising' : 'falling'));
C.check('p2 q3: the tangent at 3 meets the y axis at −18', Math.abs(r(picked(2, 2)) - (M.f(3) - deriv(M.f, 3) * 3)) < 0.005);
C.check('every page has two or three questions', [0, 1, 2].every(p => PRACTICE[p].length >= 2 && PRACTICE[p].length <= 3));
C.report();
