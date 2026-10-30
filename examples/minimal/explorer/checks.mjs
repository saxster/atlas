// node examples/minimal/explorer/checks.mjs — the range formula against an RK4 flight, and the best angle found by
// search. Exit 1 on any failure.
import { checks, rk4 } from '@saxster/atlas/checks.js';
import * as M from './model.js';

const C = checks();
// fly the ball by integrating x'' = 0, y'' = −g from the ground, then find the landing by bisecting the last step
function flown(v, deg) {
  const f = (t, [, , vx, vy]) => [vx, vy, 0, -M.G], h = 0.01, a = deg * Math.PI / 180;
  let s = [0, 0, v * Math.cos(a), v * Math.sin(a)], t = 0;
  for (;;) {
    const n = rk4(f, s, 0, h, 1).at(-1);
    if (t > 0 && n[1] < 0) {
      let lo = 0, hi = h;
      for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2; if (rk4(f, s, 0, mid, 1).at(-1)[1] > 0) lo = mid; else hi = mid; }
      const end = rk4(f, s, 0, lo, 1).at(-1);
      return { range: end[0], time: t + lo };
    }
    s = n; t += h;
  }
}
const rel = (a, b) => Math.abs(a - b) / Math.abs(b);
const cases = [10, 20, 25].flatMap(v => [10, 25, 30, 45, 60, 75, 80].map(d => [v, d]));
const worst = Math.max(...cases.map(([v, d]) => rel(M.range(v, d), flown(v, d).range)));
C.check('range v² sin 2θ / g agrees with an RK4 flight to 1e-6 relative (21 throws)', worst < 1e-6, worst.toExponential(1));
C.check('flight time 2v sin θ / g agrees with the RK4 landing time', cases.every(([v, d]) => rel(M.flightTime(v, d), flown(v, d).time) < 1e-6));
C.check('the highest point v² sin²θ / 2g is where the vertical speed is 0', cases.every(([v, d]) => { const T = M.flightTime(v, d), p = M.at(v, d, T / 2); return Math.abs(p.vy) < 1e-9 && rel(p.y, M.peak(v, d)) < 1e-12; }));
{ // search the formula every 0.01° from 1° to 89°, then check the RK4 flights agree around its best
  const angles = Array.from({ length: 8801 }, (_, i) => 1 + i * 0.01), r = angles.map(d => M.range(20, d)), best = angles[r.indexOf(Math.max(...r))];
  C.check('the formula is largest at 45° (search every 0.01°)', Math.abs(best - M.BEST) < 1e-9, `${best}°`);
  const near45 = [44, 44.5, 45, 45.5, 46].map(d => flown(20, d).range);
  C.check('…and so are RK4 flights around it', near45.indexOf(Math.max(...near45)) === 2, near45.map(x => x.toFixed(4)).join(' ')); }
C.check('45° ± a land together: 30° and 60° tie, 15° and 75° tie', [[30, 60], [15, 75]].every(([a, b]) => rel(flown(20, a).range, flown(20, b).range) < 1e-6));
C.check('every throw the sliders allow stays on the axes', [10, 25].every(v => [10, 45, 80].every(d => M.range(v, d) <= M.X[1] && M.peak(v, d) <= M.Y[1])));
C.report();
