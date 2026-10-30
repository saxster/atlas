// The figure: an upright board of pegs, slots below, and the balls, all drawn as instances (up to a thousand balls).
// A red curve over the slots is the pile the theory expects; the balls build up under it.
import * as THREE from 'three';
import { part, lines, shadeMat, TONE, V } from '../../engine/parts.js';
import * as M from './model.js';

export function buildWorld(E, params) {
  const { scene, asm } = E, rows = params.rows, T = M.top(rows, params.p, params.n), H = M.pileH(rows, params.p, params.n), wide = (rows + 1) * M.DX;
  const root = new THREE.Group(); scene.add(root);
  const labels = [], label = (cls, html, at) => labels.push({ cls, html, at });

  // the backboard and floor
  part(root, new THREE.BoxGeometry(wide + 0.5, T + 0.9, 0.06), { tone: 'lo', pal: 'board', pos: [0, (T + 0.9) / 2 - 0.05, -0.12], name: 'Board' });
  part(root, new THREE.BoxGeometry(wide + 0.5, 0.06, 0.4), { tone: 'lo', pal: 'base', pos: [0, -0.03, 0], name: 'Floor' });

  // pegs: one assembly, instanced, just under where a ball touches each one
  const gp = asm('pegs', root, { title: 'The pegs', sub: 'every peg is a coin toss: right with probability p' });
  const npeg = rows * (rows + 1) / 2, pegGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.22, 14).rotateX(Math.PI / 2);
  const pegs = new THREE.InstancedMesh(pegGeo, shadeMat('dark'), npeg);
  pegs.userData = { tone: TONE.mid, baseTone: TONE.mid, part: 'Pegs', home: V(), ex: V() };
  const m4 = new THREE.Matrix4();
  let n = 0;
  for (let k = 0; k < rows; k++) for (let j = 0; j <= k; j++) pegs.setMatrixAt(n++, m4.makeTranslation((j - k / 2) * M.DX, T - k * M.ROW_DY - M.R - 0.035, 0));
  pegs.instanceMatrix.needsUpdate = true; pegs.computeBoundingBox?.(); pegs.computeBoundingSphere();
  gp.add(pegs);

  // slots: thin walls between them
  const gs = asm('pile', root, { title: 'The pile', sub: 'how many balls landed in each slot' });
  for (let s = 0; s <= rows + 1; s++) part(gs, new THREE.BoxGeometry(0.02, H, 0.24), { tone: 'lo', pal: 'paper', pos: [(s - rows / 2 - 0.5) * M.DX, H / 2, 0], name: 'Slot wall' });
  // the slot numbers are the numbers of rights; the end ticks say so (a separate axis label crowded them on phones)
  for (const s of [0, rows / 2 | 0, rows]) label('tick', s === rows / 2 | 0 ? String(s) : `${s} rights`, () => V(M.slotX(rows, s) + 0.04, -0.12, 0.2));

  // the balls
  const balls = new THREE.InstancedMesh(new THREE.SphereGeometry(M.R, 12, 8), shadeMat('red'), 1000);
  balls.userData = { tone: TONE.hi, baseTone: TONE.hi, part: 'Balls', home: V(), ex: V() };
  balls.frustumCulled = false; gs.add(balls);
  // the expected pile, as a curve over the slots (drawn over everything, like a ruler held up to it)
  const bell = lines(root, [], '#e5484d'); bell.material.depthTest = false; bell.renderOrder = 6;
  label('mark', 'expected', () => bell.userData.tip || null);

  const zero = new THREE.Matrix4().makeScale(0, 0, 0);
  function update(s) {
    const e = s.e;
    for (let i = 0; i < 1000; i++) {
      const b = i < e.n ? M.ballAt(e, i, s.t) : null;
      balls.setMatrixAt(i, b ? m4.makeTranslation(b.x, b.y, 0) : zero);
    }
    balls.instanceMatrix.needsUpdate = true;
    // the curve: expected count per slot → pile height (balls side by side, PER_LAYER to a layer), joined smoothly
    const ex = M.expected(rows, e.p, e.n), h = c => c / M.PER_LAYER * 2 * M.R, pts = [];
    let prev = null, tipK = 0;
    for (let x = -0.5; x <= rows + 0.5; x += 0.1) {
      const mu = rows * e.p, sd = Math.sqrt(rows * e.p * (1 - e.p)) || 1e-6;
      const c = e.n * M.normalPdf(x, mu, sd), p = [M.slotX(rows, x), h(c), 0.13];
      if (prev) pts.push(...prev, ...p); prev = p;
    }
    bell.geometry.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    bell.visible = s.showBell;
    const kTop = M.mode(rows, e.p); bell.userData.tip = s.showBell ? V(M.slotX(rows, kTop) + 0.55, h(ex[kTop]) + 0.12, 0.13) : null;
  }
  return { update, labels };
}
