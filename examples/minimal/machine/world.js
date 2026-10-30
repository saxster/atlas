// The figure: 200 nuclei in a grid on a table, red while radioactive, grey and sunk once decayed; behind them a graph
// of the count, the smooth N/2ᵏ against the count this run actually left. Built from the building blocks.
import * as THREE from 'three';
import { part, box } from '@saxster/atlas/parts.js';
import { axes, curve, particles } from '@saxster/atlas/prims.js';
import * as M from './model.js';

const GAP = 0.2, R = 0.07;
const spot = i => [(i % M.COLS - (M.COLS - 1) / 2) * GAP, R, (Math.floor(i / M.COLS) - (M.ROWS - 1) / 2) * GAP];

export function buildWorld(E) {
  const { scene, asm } = E;
  const root = new THREE.Group(); scene.add(root);
  part(root, box(M.COLS * GAP + 0.4, 0.08, M.ROWS * GAP + 0.4), { tone: 'lo', pal: 'board', pos: [0, -0.04, 0], name: 'Table' });

  const gn = asm('nuclei', root, { title: 'The nuclei', sub: 'red: not decayed yet · grey: decayed' });
  const live = particles(gn, M.N, { radius: R, color: 'red', name: 'Radioactive' });
  const gone = particles(gn, M.N, { radius: R, color: 'grey', name: 'Decayed' });

  const gg = asm('graph', root, { title: 'The count', sub: 'ink: N/2ᵏ · red: this run' });
  const A = axes(gg, { x: [0, 5], y: [0, M.N], size: [4, 2], at: [-2, 0.35, -1.6], ticks: { x: 5, y: 4 }, grid: true, names: { x: 'half-lives', y: 'nuclei left' } });
  const smooth = curve(gg, u => [u, M.N], { t: [0, 1], axes: A, radius: 0.016, color: 'hi', name: 'N/2ᵏ' });
  const counted = curve(gg, u => [u, M.N], { t: [0, 1], axes: A, radius: 0.016, color: 'red', name: 'Counted' });
  const now = particles(gg, 1, { radius: 0.06, color: 'red', axes: A, name: 'Now' });

  let k = 0;
  const labels = [...A.labels,
    // the curve's name rides its tip early on, then stays near the steep start, clear of the axis name at the far end
    { cls: 'board', html: '<i>N</i>/2<sup><i>k</i></sup>', at: () => { const u = Math.min(Math.max(k, 0.6), 1.2); return A.to(u + 0.1, M.expected(u) + 18); } }];

  function update(s) {
    k = s.k;
    let a = 0, b = 0;
    s.lives.forEach((life, i) => {
      const p = spot(i);
      // a decayed nucleus turns grey at once and sinks into the table over a tenth of a half-life
      if (life > k) live.set(a++, p);
      else gone.set(b++, [p[0], R - 0.6 * R * Math.min(1, (k - life) / 0.1), p[2]]);
    });
    live.show(a); gone.show(b);
    const span = Math.max(k, 1e-3);
    smooth.update(u => [u * span, M.expected(u * span)]);
    counted.update(u => [u * span, M.left(s.lives, u * span)]);
    now.set(0, [k, s.left]);
  }
  return { update, labels };
}
