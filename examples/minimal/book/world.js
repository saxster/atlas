// The figure: y = f(x) on axes, a point P sliding along it, the tangent at P with its run-1, rise-f′ triangle, and
// the slope's own graph f′(x) with a point Q at P's slope. Built from the building blocks; one unit is one world unit.
import * as THREE from 'three';
import { axes, plot, curve, vector, particles } from '@saxster/atlas/prims.js';
import * as M from './model.js';

export function buildWorld(E) {
  const { scene, asm } = E;
  const root = new THREE.Group(); scene.add(root);
  const A = axes(root, { x: M.X, y: M.Y, size: [5, 4], ticks: 5, grid: true, names: { x: '<i>x</i>', y: '<i>y</i>' } });

  const gc = asm('curve', root, { title: 'The curve', sub: 'f(x) = x³/3 − x' });
  plot(gc, M.f, { axes: A, x: M.XF, color: 'hi' });
  const P = particles(gc, 1, { radius: 0.07, color: 'red', axes: A, name: 'Point P' });

  const gt = asm('tangent', root, { title: 'The tangent at P', sub: 'run 1 across, rise f′(x) up' });
  const line = curve(gt, t => [t, 0], { t: [-0.9, 0.9], samples: 2, radius: 0.014, axes: A, color: 'red', name: 'Tangent' });
  const run = vector(gt, [0, 0], [1, 0], { color: 'grey', label: 'run 1', axes: A, name: 'Run' });
  const rise = vector(gt, [1, 0], [1, 1], { color: 'blue', label: 'rise <i>f</i>&#8202;′(<i>x</i>)', axes: A, gap: 0.55, name: 'Rise' });

  const gs = asm('slope', root, { title: 'The slope graph', sub: 'f′(x) = x² − 1, the tangent’s slope at every x' });
  plot(gs, M.df, { axes: A, x: M.XD, color: 'blue' });
  const Q = particles(gs, 1, { radius: 0.06, color: 'blue', axes: A, name: 'Point Q' });

  let x0 = 0;
  const apart = () => M.df(x0) >= M.f(x0) ? 1 : -1;
  const labels = [
    ...A.labels, ...run.labels, ...rise.labels,
    { cls: 'board', html: '<i>f</i>(<i>x</i>)', at: () => A.to(M.XF[1] + 0.08, M.f(M.XF[1])) },
    // P's and Q's names stand apart: each on the side away from the other
    { cls: 'vec red', html: '<i>P</i>', at: () => A.to(x0 - 0.24, M.f(x0) - 0.22 * apart()) },
    { cls: 'vec blue', html: '<i>f</i>&#8202;′(<i>x</i>)', at: () => gs.visible ? A.to(M.XD[1] + 0.12, M.df(M.XD[1])) : null },
    { cls: 'vec blue', html: '<i>Q</i>', at: () => gs.visible ? A.to(x0 - 0.24, M.df(x0) + 0.22 * apart()) : null },
  ];

  function update(s, look) {
    x0 = s.x;
    const y0 = M.f(x0), m = M.df(x0);
    P.set(0, [x0, y0]);
    gt.visible = look.tangent > 0.5;
    line.update(t => [x0 + t, y0 + m * t]);
    // the labels go outside the run-rise triangle, whichever way it hangs
    run.set([x0, y0], [x0 + 1, y0], m >= 0 ? 1 : -1);
    rise.set([x0 + 1, y0], [x0 + 1, y0 + m], m >= 0 ? 1 : -1);
    gs.visible = look.deriv > 0.5;
    Q.set(0, [x0, m]);
  }
  return { update, labels };
}
