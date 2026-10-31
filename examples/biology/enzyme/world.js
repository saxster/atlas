// Goodsell-style globular enzyme with active-site cleft on the left, and the Michaelis–Menten saturation curve on the right.
// Built with engine/prims.js (blob, particles, axes, plot, vector) and engine/parts.js.
import * as THREE from 'three';
import { PALETTE, part, lines, V } from '@saxster/atlas/parts.js';
import { blob, particles, axes, plot, vector } from '@saxster/atlas/prims.js';
import * as M from './model.js';

PALETTE.enzyme = ['#72a7d0', '#3d79a8', '#24527a']; // globular protein surface
PALETTE.sub    = ['#f5c96b', '#d99b26', '#9e6d14']; // substrate S (amber)
PALETTE.prod   = ['#5ab882', '#2e8b57', '#1e5e3a']; // cleaved product P (green)

export function buildWorld(E) {
  const { scene, asm } = E;
  const root = new THREE.Group(); scene.add(root);
  const labels = [], label = (cls, html, at, text) =>
    typeof html === 'function' ? labels.push({ cls, html: html(), at, text: html }) : labels.push({ cls, html, at, text });

  // ---------- left: globular enzyme with catalytic cleft ----------
  const ge = asm('enzyme', root, {
    title: 'Globular enzyme & catalytic cleft',
    sub: 'amber substrate molecules dock into the active-site pocket (right face) and leave as green product',
  });
  const enzAnchor = new THREE.Group();
  enzAnchor.position.set(-1.95, 1.15, 0);
  ge.add(enzAnchor);

  blob(enzAnchor, {
    radius: 0.92, lobes: 7, cleft: 0.30, seed: 19, pal: 'enzyme', tone: 'mid',
    name: 'Enzyme apoprotein (E)',
  });

  // Substrate molecule docked inside the active-site cleft (+x face)
  const dockedSub = part(enzAnchor, new THREE.SphereGeometry(0.16, 24, 16), {
    pal: 'sub', tone: 'lit', pos: [0.68, 0.02, 0.05], name: 'Bound substrate in cleft (ES complex)',
  });

  // Surrounding substrate (amber) and product (green) clouds
  const subCloud = particles(enzAnchor, 60, { radius: 0.052, color: 'sub', name: 'Free substrate [S]' });
  const prodCloud = particles(enzAnchor, 30, { radius: 0.048, color: 'prod', name: 'Product [P]' });
  const cloudPts = M.moleculeCloud(60, 2026);
  const prodPts = M.moleculeCloud(30, 4099);

  // ---------- right: Michaelis–Menten saturation chart ----------
  const gc = asm('curve', root, {
    title: 'Michaelis–Menten hyperbola',
    sub: 'v([S]) = V_max [S] / (K_m + [S]): linear at low [S], half-maximal at K_m = 2 mM, saturating toward V_max = 120',
  });
  const ax = axes(gc, {
    x: [0, M.S_MAX], y: [0, 130], size: [3.2, 2.3], at: [0.25, 0.0, 0],
    ticks: { x: 5, y: 4 }, names: { x: '[<i>S</i>] mM', y: '<i>v</i> μM/s' }, grid: true,
  });
  labels.push(...ax.labels);

  // Horizontal speed limit V_max = 120 and half-saturation line V_max/2 = 60 up to K_m = 2
  const pV0 = ax.to(0, M.V_MAX), pV1 = ax.to(M.S_MAX, M.V_MAX);
  const pKmX = ax.to(M.K_M, 0), pKmTop = ax.to(M.K_M, 0.5 * M.V_MAX), pKmY = ax.to(0, 0.5 * M.V_MAX);
  lines(gc, [...pV0.toArray(), ...pV1.toArray()], '#2e8b57', 0.65);
  lines(gc, [
    ...pKmY.toArray(), ...pKmTop.toArray(),
    ...pKmTop.toArray(), ...pKmX.toArray(),
  ], '#8a8275', 0.6);

  const mmCurve = plot(gc, s => M.velocity(s), {
    axes: ax, x: [0, M.S_MAX], samples: 120, color: 'prod', width: 0.044, name: 'Michaelis–Menten curve v([S])',
  });

  // Comparison 1: Competitive inhibitor (K_m,app = 6 mM, same V_max = 120)
  const gComp = asm('comp', root, {
    title: 'Competitive inhibition (K_m,app = 6 mM)',
    sub: 'decoy molecules compete for the active site, requiring 3× more [S] to reach ½ V_max while V_max stays 120',
  });
  const compCurve = plot(gComp, s => M.velocityComp(s), {
    axes: ax, x: [0, M.S_MAX], samples: 100, color: 'red', width: 0.036, name: 'Competitive inhibition curve',
  });

  // Comparison 2: Non-competitive inhibitor (V_max,app = 60, same K_m = 2 mM)
  const gNon = asm('noncomp', root, {
    title: 'Non-competitive inhibition (V_max,app = 60)',
    sub: 'allosteric binding disables half the catalytic turnover without blocking substrate docking (K_m = 2 mM)',
  });
  const nonCurve = plot(gNon, s => M.velocityNonComp(s), {
    axes: ax, x: [0, M.S_MAX], samples: 100, color: 'sub', width: 0.036, name: 'Non-competitive inhibition curve',
  });

  const nowDot = part(gc, new THREE.SphereGeometry(0.068, 20, 14), {
    pal: 'prod', tone: 'lit', name: 'Current reaction velocity v([S])',
  });
  const kmDot = part(gc, new THREE.SphereGeometry(0.055, 18, 12), {
    pal: 'ink', tone: 'hi', pos: pKmTop.toArray(), name: 'Half-saturation point (K_m = 2 mM, v = 60)',
  });
  const rateVec = vector(gc, [0, 0, 0], [0, 0.3, 0], {
    color: 'red', name: 'Catalytic turnover v([S])',
  });

  let cur = { S: 0, v: 0, bound: 0, compOn: false, nonOn: false };
  label('board', () => `bound: ${cur.bound.toFixed(0)} / ${M.E_TOT}`, () => V(-2.25, -0.42, 0));
  label('mark', `V_max = ${M.V_MAX} μM/s`, () => pV1.clone().add(V(-0.62, 0.22, 0.05)));
  label('board', `K_m = ${M.K_M} mM`, () => (!cur.compOn && !cur.nonOn) ? ax.to(2.0, 92).add(V(0.32, 0.15, 0.05)) : null);
  label('vec red', 'competitive (K_m = 6)', () => cur.compOn ? ax.to(6.8, 76).add(V(0.15, 0, 0.05)) : null);
  label('board', 'non-comp. (V_max = 60)', () => cur.nonOn ? ax.to(6.8, 76).add(V(0.15, 0, 0.05)) : null);

  function update(s, look = {}) {
    const compOn = (look.comp || 0) > 0.3;
    const nonOn = (look.noncomp || 0) > 0.3;

    // Number of visible substrate beads scales with [S] (from 4 at S=0 up to 60 at S=10)
    const nSub = Math.max(4, Math.min(60, Math.round(4 + (s.S / M.S_MAX) * 56)));
    for (let i = 0; i < nSub; i++) {
      const p = cloudPts[i];
      const wobble = 0.04 * Math.sin(s.S * 1.4 + p.phase);
      subCloud.set(i, [p.x + wobble, p.y - wobble, p.z]);
    }
    subCloud.show(nSub);

    // Product beads near the cleft exit (+x side) scale with reaction rate v / V_max
    const nProd = Math.max(1, Math.min(30, Math.round((s.v / M.V_MAX) * 28)));
    for (let i = 0; i < nProd; i++) {
      const p = prodPts[i];
      prodCloud.set(i, [0.55 + Math.abs(p.x) * 0.55, p.y * 0.55, p.z * 0.55]);
    }
    prodCloud.show(nProd);

    // Cleft occupancy scales docked substrate size
    const sc = 0.35 + 0.85 * s.theta;
    dockedSub.scale.setScalar(sc);
    kmDot.visible = s.S >= M.K_M - 0.05;

    // Progressive draw of v([S]) up to current [S]
    const sEnd = Math.max(0.15, s.S);
    mmCurve.update(u => M.velocity(u), { x: [0, sEnd] });
    compCurve.object.visible = compOn;
    nonCurve.object.visible = nonOn;

    const pNow = ax.to(s.S, s.v, 0.04);
    nowDot.position.copy(pNow);
    const vLen = (s.v / M.V_MAX) * 0.65;
    rateVec.set(pNow, pNow.clone().add(V(0, Math.max(0.04, vLen), 0)));
    rateVec.object.visible = vLen > 0.05;

    cur = { S: s.S, v: s.v, bound: s.bound, compOn, nonOn };
  }

  return { update, labels };
}
