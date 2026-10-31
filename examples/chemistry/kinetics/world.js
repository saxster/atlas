// Reaction vessel on the left where blue reactant A and red product B interconvert,
// paired with the concentration relaxation curves on the right.
import * as THREE from 'three';
import { PALETTE, part, cyl, lines, V } from '@saxster/atlas/parts.js';
import { axes, plot, particles } from '@saxster/atlas/prims.js';
import * as M from './model.js';

PALETTE.glass = ['#f4f1ea', '#e5dfd2', '#cdc4b2'];

export function buildWorld(E, p = { n: 200, kf: 0.30, kr: 0.15 }) {
  const { scene, asm } = E;
  const root = new THREE.Group(); scene.add(root);
  const labels = [], label = (cls, html, at, text) =>
    typeof html === 'function' ? labels.push({ cls, html: html(), at, text: html }) : labels.push({ cls, html, at, text });

  // ---------- left: reaction flask / vessel ----------
  const gv = asm('vessel', root, {
    title: 'Reaction vessel (A ⇌ B)',
    sub: 'blue reactant A flips to red product B at rate k_f; red B flips back to blue A at rate k_r',
  });
  gv.userData.focus = () => ({ target: [-1.95, 1.15, 0], radius: 1.45 });
  const vessel = new THREE.Group();
  vessel.position.set(-1.95, 1.15, 0);
  gv.add(vessel);

  // Base and top rim of cylindrical reaction chamber
  part(vessel, cyl(1.18, 0.08, 48), {
    pal: 'glass', tone: 'lo', pos: [0, -0.88, 0], name: 'Vessel floor',
  });
  const topRim = part(vessel, new THREE.TorusGeometry(1.18, 0.025, 14, 64), {
    pal: 'dark', tone: 'mid', pos: [0, 0.88, 0], rot: [Math.PI / 2, 0, 0], name: 'Vessel rim',
  });
  topRim.userData.noEdge = true;
  const botRim = part(vessel, new THREE.TorusGeometry(1.18, 0.025, 14, 64), {
    pal: 'dark', tone: 'mid', pos: [0, -0.84, 0], rot: [Math.PI / 2, 0, 0], name: 'Vessel base ring',
  });
  botRim.userData.noEdge = true;

  const beadsA = particles(vessel, p.n, { radius: 0.052, color: 'blue', name: 'Reactant A molecules' });
  const beadsB = particles(vessel, p.n, { radius: 0.052, color: 'red', name: 'Product B molecules' });

  // ---------- right: relaxation & half-life chart ----------
  const gc = asm('curves', root, {
    title: 'Exponential relaxation to equilibrium',
    sub: 'N_A(t) decays with half-time ln 2 / (k_f + k_r) toward [B]_eq / [A]_eq = k_f / k_r',
  });
  const yMax = Math.ceil((p.n * 1.05) / 20) * 20;
  const ax = axes(gc, {
    x: [0, M.DURATION], y: [0, yMax], size: [3.2, 2.3], at: [0.25, 0.0, 0],
    ticks: { x: 5, y: 4 }, names: { x: '<i>t</i> (s)', y: 'molecules' }, grid: true,
  });
  labels.push(...ax.labels);

  const curveA = plot(gc, t => M.expectedA(p.n, p.kf, p.kr, t), {
    axes: ax, x: [0, M.DURATION], samples: 100, color: 'blue', width: 0.038, name: 'Reactant A curve N_A(t)',
  });
  const curveB = plot(gc, t => M.expectedB(p.n, p.kf, p.kr, t), {
    axes: ax, x: [0, M.DURATION], samples: 100, color: 'red', width: 0.038, name: 'Product B curve N_B(t)',
  });

  const dotA = part(gc, new THREE.SphereGeometry(0.065, 20, 14), {
    pal: 'blue', tone: 'lit', name: 'Live count N_A(t)',
  });
  const dotB = part(gc, new THREE.SphereGeometry(0.065, 20, 14), {
    pal: 'red', tone: 'lit', name: 'Live count N_B(t)',
  });

  let cur = { nA: p.n, nB: 0, kf: p.kf, kr: p.kr, n: p.n };
  label('board', () => `A: ${cur.nA} · B: ${cur.nB}`, () => V(-2.05, 2.28, 0));
  label('vec blue', () => `<i>A</i> (eq ${M.eqReactant(cur.n, cur.kf, cur.kr).toFixed(0)})`, () => {
    const y = M.expectedA(cur.n, cur.kf, cur.kr, 5.5);
    return ax.to(5.5, y).add(V(-0.15, -0.26, 0.05));
  });
  label('vec red', () => `<i>B</i> (eq ${M.eqProduct(cur.n, cur.kf, cur.kr).toFixed(0)})`, () => {
    const y = M.expectedB(cur.n, cur.kf, cur.kr, 6.5);
    return ax.to(6.5, y).add(V(-0.15, 0.26, 0.05));
  });

  function update(s) {
    const { e, t, snap } = s;
    const { homes } = e;
    const { stateB } = snap;
    let iA = 0, iB = 0;
    for (let i = 0; i < e.n; i++) {
      const h = homes[i];
      const wx = h.x + 0.03 * Math.sin(t * 2.2 + h.phase);
      const wy = h.y + 0.03 * Math.cos(t * 1.9 + h.phase);
      if (stateB[i] === 0) {
        beadsA.set(iA++, [wx, wy, h.z]);
      } else {
        beadsB.set(iB++, [wx, wy, h.z]);
      }
    }
    beadsA.show(iA);
    beadsB.show(iB);

    curveA.update(u => M.expectedA(e.n, e.kf, e.kr, u));
    curveB.update(u => M.expectedB(e.n, e.kf, e.kr, u));
    dotA.position.copy(ax.to(t, snap.nA, 0.04));
    dotB.position.copy(ax.to(t, snap.nB, 0.04));
    cur = { nA: snap.nA, nB: snap.nB, kf: e.kf, kr: e.kr, n: e.n };
  }

  return { update, labels };
}
