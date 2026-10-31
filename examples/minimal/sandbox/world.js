// The charge sandbox world: a 2D plane with a live vector field E(x, y), a draggable probe, and draggable point charges.
import * as THREE from 'three';
import { PALETTE, part, box, V } from '@saxster/atlas/parts.js';
import { axes, field, vector } from '@saxster/atlas/prims.js';
import { draggable } from '@saxster/atlas/stage.js';
import * as M from './model.js';

const setPos = (m, p) => { m.position.copy(p); m.userData.home.copy(p); };
const dot = (g, r, pal, name, tone = 'hi', ex = [0, 0, 0]) =>
  part(g, new THREE.SphereGeometry(r, 24, 16), { pal, name, tone, ex });

export function buildWorld(E, params, items, hooks) {
  const { scene, asm } = E;
  PALETTE.amber = ['#f5c96b', '#d99b26', '#9e6d14'];

  const root = new THREE.Group(); scene.add(root);
  const brd = part(root, box(6.8, 4.6, 0.006), { tone: 'lo', pal: 'board', pos: [0, 0, -0.14], name: 'Board' });
  brd.userData.noEdge = true;

  const A = axes(root, { x: M.X, y: M.Y, size: [6.0, 4.0], at: [0, 0, 0], ticks: 6, grid: true,
    names: { x: 'x', y: 'y' } });

  const g = asm('field', root, { title: 'Custom electric field', sub: 'superposition of every charge on the board' });
  const vf = field(g, (x, y) => {
    const [ex, ey] = M.fieldAt(items, x, y), m = Math.hypot(ex, ey);
    const s = m > 1e-6 ? Math.min(m, 1.4) / m : 0;
    return [ex * s, ey * s];
  }, { axes: A, n: [9, 6], scale: 0.30, color: 'blue', name: 'Electric field' });

  const probe = dot(g, 0.085, 'amber', 'Test probe');
  const probeVec = vector(g, [0, 0], [0.5, 0], { axes: A, color: 'amber', label: '<b>E</b><sub>probe</sub>', name: 'Probe field' });
  draggable(probe, {
    axes: A,
    constrain: ([x, y]) => [Math.max(-2.7, Math.min(2.7, x)), Math.max(-1.7, Math.min(1.7, y)), 0.04],
    onDrag: ([x, y]) => hooks?.setParams({ px: +x.toFixed(2), py: +y.toFixed(2) }),
  });

  const chargeMeshes = items.map((c, idx) => {
    const m = dot(g, 0.14, c.q > 0 ? 'red' : 'blue', `Charge ${idx + 1}`);
    setPos(m, A.to(c.x, c.y, 0.04));
    draggable(m, {
      axes: A,
      constrain: ([x, y]) => [Math.max(-2.7, Math.min(2.7, x)), Math.max(-1.7, Math.min(1.7, y)), 0.04],
      onDrag: ([x, y]) => hooks?.updateItem(idx, { x: +x.toFixed(2), y: +y.toFixed(2) }),
    });
    return m;
  });

  const chargeLabels = items.map((c, idx) => ({
    cls: c.q > 0 ? 'vec red' : 'vec blue',
    html: c.q > 0 ? '+q' : '−q',
    at: () => A.to(items[idx]?.x ?? c.x, items[idx]?.y ?? c.y, 0.08).add(V(0, 0.22, 0)),
  }));

  function update(state) {
    state.items.forEach((c, i) => { if (chargeMeshes[i]) setPos(chargeMeshes[i], A.to(c.x, c.y, 0.04)); });
    setPos(probe, A.to(state.px, state.py, 0.04));
    vf.update((x, y) => {
      const [ex, ey] = M.fieldAt(state.items, x, y), m = Math.hypot(ex, ey);
      const s = m > 1e-6 ? Math.min(m, 1.4) / m : 0;
      return [ex * s, ey * s];
    });
    const [ex, ey] = state.eProbe, mag = Math.hypot(ex, ey);
    const len = Math.min(mag * 0.45, 1.1);
    const ux = mag > 1e-6 ? ex / mag : 1, uy = mag > 1e-6 ? ey / mag : 0;
    probeVec.set([state.px, state.py], [state.px + ux * len, state.py + uy * len]);
  }
  return { update, labels: [...A.labels, ...probeVec.labels, ...chargeLabels] };
}
