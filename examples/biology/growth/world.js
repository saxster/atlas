// The Petri dish on the left and the 10-hour population chart on the right.
// Built with engine/prims.js (axes, plot, particles, vector) and engine/parts.js.
import * as THREE from 'three';
import { PALETTE, part, cyl, lines, V } from '@saxster/atlas/parts.js';
import { axes, plot, particles, vector } from '@saxster/atlas/prims.js';
import * as M from './model.js';

PALETTE.agar = ['#f6efe0', '#eadfc7', '#d2c3a3'];    // warm nutrient agar broth
PALETTE.cell = ['#5ab882', '#2e8b57', '#1e5e3a'];    // living bacteria
PALETTE.amber = ['#f3d68e', '#e4b552', '#bf9030'];   // half-sugar comparison

export function buildWorld(E) {
  const { scene, asm } = E;
  const root = new THREE.Group(); scene.add(root);
  const labels = [], label = (cls, html, at, text) =>
    typeof html === 'function' ? labels.push({ cls, html: html(), at, text: html }) : labels.push({ cls, html, at, text });

  // ---------- left: Petri dish tilted toward the viewer ----------
  const gd = asm('dish', root, {
    title: 'The nutrient agar plate',
    sub: 'each green bead is a living bacterium dividing on the agar surface',
  });
  const dish = new THREE.Group();
  dish.position.set(-1.95, 1.15, 0);
  dish.rotation.x = 0.78;
  gd.add(dish);

  part(dish, cyl(M.DISH_R, 0.10, 48), {
    pal: 'agar', tone: 'lo', pos: [0, -0.02, 0], name: 'Nutrient agar', ex: [0, -0.25, 0],
  });
  const rim = part(dish, new THREE.TorusGeometry(M.DISH_R + 0.03, 0.03, 14, 64), {
    pal: 'dark', tone: 'mid', pos: [0, 0.02, 0], rot: [Math.PI / 2, 0, 0], name: 'Dish rim', ex: [0, 0.25, 0],
  });
  rim.userData.noEdge = true;

  const colony = particles(dish, M.K, { radius: 0.045, color: 'cell', name: 'Bacteria' });
  const spots = M.colonySpots();

  // ---------- right: 10-hour population chart ----------
  const gc = asm('curve', root, {
    title: 'The logistic S-curve',
    sub: 'dN/dt = r · N · (1 − N / K): exponential at first, fastest at K/2, flat at K',
  });
  const ax = axes(gc, {
    x: [0, M.HOURS], y: [0, 260], size: [3.2, 2.3], at: [0.25, 0.0, 0],
    ticks: { x: 5, y: 4 }, names: { x: 'hours <i>t</i>', y: 'cells <i>N</i>' }, grid: true,
  });
  labels.push(...ax.labels);

  // horizontal ceiling lines at K = 240 and K/2 = 120
  const pK0 = ax.to(0, M.K), pK1 = ax.to(M.HOURS, M.K);
  const pH0 = ax.to(0, M.K_HALF), pH1 = ax.to(M.HOURS, M.K_HALF);
  lines(gc, [...pK0.toArray(), ...pK1.toArray()], '#2e8b57', 0.65);
  const halfLine = lines(gc, [...pH0.toArray(), ...pH1.toArray()], '#bf9030', 0.65);

  const logCurve = plot(gc, t => M.logisticPop(t, M.K), {
    axes: ax, x: [0, M.HOURS], samples: 120, color: 'cell', width: 0.045, name: 'Logistic S-curve',
  });

  const ge = asm('exp', root, {
    title: 'Unconstrained doubling 4 · 2ᵗ',
    sub: 'without the (1 − N/K) crowding brake, 4 cells double every hour to 4,096 by hour 10',
  });
  const expCurve = plot(ge, t => Math.min(262, M.expPop(t)), {
    axes: ax, x: [0, 6.02], samples: 80, color: 'red', width: 0.036, name: 'Unconstrained 2^t',
  });

  const gh = asm('half', root, {
    title: 'Half the sugar (K = 120)',
    sub: 'halving the nutrient broth leaves the initial doubling time unchanged, but halves the ceiling',
  });
  const halfCurve = plot(gh, t => M.logisticPop(t, M.K_HALF), {
    axes: ax, x: [0, M.HOURS], samples: 120, color: 'amber', width: 0.038, name: 'Half-sugar curve',
  });

  const nowDot = part(gc, new THREE.SphereGeometry(0.065, 20, 14), {
    pal: 'cell', tone: 'lit', name: 'Current colony size',
  });
  const rateVec = vector(gc, [0, 0, 0], [0, 0.3, 0], {
    color: 'red', name: 'Growth rate dN/dt',
  });

  let cur = { t: 0, count: M.N0, open: 1, expOn: false, halfOn: false };
  label('board', () => `Petri dish: ${cur.count} cells`, () => V(-1.95, -0.35, 1.15));
  label('mark', `ceiling K = ${M.K}`, () => pK1.clone().add(V(-0.45, 0.20, 0.05)));
  label('vec red', '4 · 2ᵗ', () => cur.expOn ? ax.to(5.1, 215).add(V(0.42, 0, 0.05)) : null);
  label('board', `half sugar K = ${M.K_HALF}`, () => cur.halfOn ? pH1.clone().add(V(-0.55, -0.22, 0.05)) : null);

  function update(s, look = {}) {
    const expOn = (look.exp || 0) > 0.3;
    const halfOn = (look.half || 0) > 0.3;
    const count = Math.max(1, Math.min(M.K, Math.round(s.N)));
    for (let i = 0; i < count; i++) {
      const sp = spots[i];
      colony.set(i, [sp.x, 0.065, sp.z]);
    }
    colony.show(count);

    // progressive draw of the logistic curve up to current time s.t (minimum span 0.15 hr so liveTube has non-zero tangent)
    const tEnd = Math.max(0.15, s.t);
    logCurve.update(t => M.logisticPop(t, M.K), { x: [0, tEnd] });
    expCurve.object.visible = expOn;
    halfCurve.object.visible = halfOn;
    halfLine.visible = halfOn || Math.abs(s.t - M.inflectionTime()) < 1.2;

    const pNow = ax.to(s.t, s.N, 0.04);
    nowDot.position.copy(pNow);
    const vLen = (s.rate / M.peakRate(M.K)) * 0.65;
    rateVec.set(pNow, pNow.clone().add(V(0, Math.max(0.03, vLen), 0)));
    rateVec.object.visible = vLen > 0.05;

    cur = { t: s.t, count, open: s.open, expOn, halfOn };
  }

  return { update, labels };
}
