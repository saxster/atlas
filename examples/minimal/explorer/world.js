// The figure: distance and height axes over the ground, the ball's path traced as it flies, the ball, and its velocity
// arrow. Built from the building blocks; 14 m is one world unit.
import * as THREE from 'three';
import { part, box } from '@saxster/atlas/parts.js';
import { axes, curve, vector, particles } from '@saxster/atlas/prims.js';
import * as M from './model.js';

export function buildWorld(E) {
  const { scene, asm } = E;
  const root = new THREE.Group(); scene.add(root);
  part(root, box(5.6, 0.06, 1.0), { tone: 'lo', pal: 'board', pos: [0, -0.04, 0], name: 'Ground' });
  const A = axes(root, { x: M.X, y: M.Y, size: [5, 2.5], at: [-2.5, 0, 0], ticks: 5, grid: true,
    names: { x: 'distance (m)', y: 'height (m)' } });

  const g = asm('flight', root, { title: 'The flight', sub: 'level speed steady, upward speed falling by g each second' });
  const path = curve(g, u => [u, 0], { t: [0, 1], axes: A, radius: 0.016, color: 'red', name: 'Path' });
  const ball = particles(g, 1, { radius: 0.08, color: 'red', axes: A, name: 'Ball' });
  const vel = vector(g, [0, 0], [1, 1], { color: 'blue', label: '<i>v</i>', axes: A, side: -1, name: 'Velocity' });

  let s = null;
  const labels = [...A.labels, ...vel.labels,
    { cls: 'mark', html: '', at: () => s?.landed ? A.to(s.x, 0).add(new THREE.Vector3(0, 0.3, 0)) : null, text: () => s ? `${s.x.toFixed(1)} m` : '' }];

  function update(state) {
    s = state;
    const { v, angle, t } = state, span = Math.max(t, 1e-3);
    path.update(u => { const p = M.at(v, angle, u * span); return [p.x, p.y]; });
    ball.set(0, [s.x, s.y]);
    vel.set([s.x, s.y], [s.x + s.vx * 0.6, s.y + s.vy * 0.6]);   // the arrow shows 0.6 s of travel at the current velocity
    vel.object.visible = !s.landed && vel.object.visible;
  }
  return { update, labels };
}
