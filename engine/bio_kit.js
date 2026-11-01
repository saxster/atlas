// Shared 3D biological & anatomical kit built on Atlas's paper-and-ink parts, prims, kinematics, and motion.
import * as THREE from 'three';
import { part, box, cyl, lines, arrow, setArrow, rod, liveTube, gear, spring, shadeMat, V, xAxis, zAxis } from './parts.js';
import * as prims from './prims.js';
import * as K from './kinematics.js';
import * as motion from './motion.js';

export { THREE, part, box, cyl, lines, arrow, setArrow, rod, liveTube, gear, spring, shadeMat, V, xAxis, zAxis, prims, K, motion };

export const sphere = (r, seg = 24) => new THREE.SphereGeometry(r, seg, Math.max(12, seg >> 1));
export const torus = (R, r, rSeg = 14, tSeg = 32, arc = Math.PI * 2) => new THREE.TorusGeometry(R, r, rSeg, tSeg, arc);
export const cone = (r, h, seg = 20) => new THREE.ConeGeometry(r, h, seg);
export const capsule = (r, len, capSeg = 8, rSeg = 16) => new THREE.CapsuleGeometry(r, len, capSeg, rSeg);

// Real 3D molecular coordinate tables (Ångströms, scaled for scene placement)
export const MOLECULES = {
  waterCluster: {
    atoms: [
      ['O', 0.0, 0.0, 0.0], ['H', 0.76, 0.59, 0.0], ['H', -0.76, 0.59, 0.0],
      ['O', 2.1, 1.6, 0.4], ['H', 2.7, 2.1, -0.1], ['H', 2.4, 1.5, 1.3],
      ['O', -2.1, 1.6, -0.4], ['H', -2.7, 2.1, 0.1], ['H', -2.4, 1.5, -1.3],
      ['O', 0.0, -2.2, 1.1], ['H', 0.0, -1.3, 0.7], ['H', 0.8, -2.6, 1.4],
    ],
    bonds: [[0, 1, 1], [0, 2, 1], [3, 4, 1], [3, 5, 1], [6, 7, 1], [6, 8, 1], [9, 10, 1], [9, 11, 1]],
  },
  glucose: {
    atoms: [
      ['C', 1.4, 0.2, 0.1], ['C', 0.7, 1.4, -0.3], ['C', -0.7, 1.4, 0.2],
      ['C', -1.4, 0.1, -0.2], ['C', -0.6, -1.1, 0.2], ['O', 0.7, -1.0, -0.2],
      ['C', -1.3, -2.4, -0.2], ['O', 2.7, 0.2, -0.3], ['O', 1.4, 2.6, 0.1],
      ['O', -1.4, 2.5, -0.2], ['O', -2.7, 0.1, 0.3], ['O', -2.6, -2.4, 0.3],
    ],
    bonds: [
      [0, 1, 1], [1, 2, 1], [2, 3, 1], [3, 4, 1], [4, 5, 1], [5, 0, 1],
      [4, 6, 1], [0, 7, 1], [1, 8, 1], [2, 9, 1], [3, 10, 1], [6, 11, 1],
    ],
  },
  atpCore: {
    atoms: [
      ['N', -2.6, 0.4, 0.0], ['C', -1.5, 1.1, 0.1], ['N', -0.4, 0.4, 0.0],
      ['C', -0.7, -0.9, -0.1], ['C', -2.0, -0.9, -0.1],
      ['C', 0.9, 0.8, 0.2], ['O', 1.8, -0.1, -0.2],
      ['P', 3.1, 0.2, 0.0], ['O', 3.3, 1.6, 0.2], ['O', 4.2, -0.6, -0.2],
      ['P', 5.5, -0.2, 0.0], ['O', 5.7, 1.2, 0.3], ['O', 6.6, -1.0, -0.2],
      ['P', 7.9, -0.5, 0.1], ['O', 8.2, 0.9, 0.3], ['O', 9.0, -1.3, -0.1],
    ],
    bonds: [
      [0, 1, 1], [1, 2, 2], [2, 3, 1], [3, 4, 2], [4, 0, 1],
      [2, 5, 1], [5, 6, 1], [6, 7, 1], [7, 8, 2], [7, 9, 1],
      [9, 10, 1], [10, 11, 2], [10, 12, 1], [12, 13, 1], [13, 14, 2], [13, 15, 1],
    ],
  },
  peptide: {
    atoms: [
      ['N', -2.2, 0.1, 0.0], ['C', -0.9, 0.7, 0.1], ['C', 0.2, -0.3, 0.0],
      ['O', 0.0, -1.5, -0.1], ['N', 1.4, 0.3, 0.1], ['C', 2.6, -0.5, 0.0],
      ['C', -0.8, 2.1, -0.4], ['C', 2.8, -1.8, 0.6],
    ],
    bonds: [[0, 1, 1], [1, 2, 1], [2, 3, 2], [2, 4, 1], [4, 5, 1], [1, 6, 1], [5, 7, 1]],
  },
};

// Faint studio ground grid across stations
export function studioGrid(root, { x0 = -5, x1 = 48, z0 = -4, z1 = 4, y = 0.001 } = {}) {
  const g = [];
  for (let x = x0; x <= x1; x += 2) g.push(x, y, z0, x, y, z1);
  for (let z = z0; z <= z1; z += 1) g.push(x0, y, z, x1, y, z);
  lines(root, g, '#e6e6e2');
}

// Biconcave red blood cell mesh (or sickled when sickle > 0)
export function rbcGeo(R = 0.9, sickle = 0) {
  const sh = [];
  const N = 24;
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const th = u * Math.PI;
    const r = Math.sin(th) * R;
    const pinch = 0.38 + 0.62 * Math.pow(Math.sin(th), 2);
    const y = Math.cos(th) * R * 0.34 * pinch;
    sh.push(new THREE.Vector2(Math.max(0.001, r), y));
  }
  const g = new THREE.LatheGeometry(sh, 32);
  if (sickle > 0.01) {
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const bend = sickle * 0.55 * (x * x);
      const tap = 1 - sickle * 0.45 * Math.min(1, Math.abs(x) / R);
      p.setXYZ(i, x * (1 + sickle * 0.45), y * tap, z * tap + bend);
    }
    g.computeVertexNormals();
  }
  return g;
}

// Phospholipid bilayer slab with individual head spheres and tail rods
export function buildBilayer(parent, { cols = 9, rows = 3, dx = 0.34, dz = 0.34, gap = 0.95, x0 = 0, y0 = 1.3, z0 = 0, skipCenter = false, name = 'Phospholipid bilayer' } = {}) {
  const g = new THREE.Group();
  g.position.set(x0, y0, z0);
  parent.add(g);
  const headGeo = sphere(0.11, 14);
  const tailGeo = cyl(0.025, gap * 0.42, 8);
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const cx = (i - (cols - 1) / 2) * dx;
      const cz = (j - (rows - 1) / 2) * dz;
      if (skipCenter && Math.hypot(cx, cz) < 0.48) continue;
      for (const s of [1, -1]) {
        part(g, headGeo, { pal: 'ochre', tone: 'mid', pos: [cx, s * (gap * 0.5), cz], ex: [0, s * 0.35, 0], name });
        part(g, tailGeo, { pal: 'paper', tone: 'lo', pos: [cx - 0.04, s * (gap * 0.24), cz], ex: [0, s * 0.2, 0], name });
        part(g, tailGeo, { pal: 'paper', tone: 'lo', pos: [cx + 0.04, s * (gap * 0.24), cz], ex: [0, s * 0.2, 0], name });
      }
    }
  }
  return g;
}

// 3D Double Helix segment with base-pair rungs
export function buildHelix(parent, { turns = 1.6, rungs = 14, radius = 0.55, height = 2.6, x0 = 0, y0 = 1.4, z0 = 0, palA = 'blue', palB = 'ochre', name = 'DNA double helix' } = {}) {
  const g = new THREE.Group();
  g.position.set(x0, y0, z0);
  parent.add(g);
  const ptsA = [], ptsB = [];
  const N = 48;
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const ang = u * turns * Math.PI * 2;
    const y = (u - 0.5) * height;
    ptsA.push(V(radius * Math.cos(ang), y, radius * Math.sin(ang)));
    ptsB.push(V(radius * Math.cos(ang + Math.PI), y, radius * Math.sin(ang + Math.PI)));
  }
  const geoA = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ptsA), 48, 0.055, 8, false);
  const geoB = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ptsB), 48, 0.055, 8, false);
  part(g, geoA, { pal: palA, tone: 'hi', ex: [-0.45, 0, 0], name: `${name} strand A` });
  part(g, geoB, { pal: palB, tone: 'hi', ex: [0.45, 0, 0], name: `${name} strand B` });
  const rungPals = ['green', 'red', 'blue', 'ochre'];
  for (let k = 0; k < rungs; k++) {
    const u = (k + 0.5) / rungs;
    const ang = u * turns * Math.PI * 2;
    const y = (u - 0.5) * height;
    const r1 = rod(g, { r: 0.032, pal: rungPals[k % 4], tone: 'mid', ex: [0, 0.2, 0], name: 'Base pair rung' });
    r1.set(V(radius * 0.92 * Math.cos(ang), y, radius * 0.92 * Math.sin(ang)), V(0, y, 0));
    const r2 = rod(g, { r: 0.032, pal: rungPals[(k + 1) % 4], tone: 'mid', ex: [0, -0.2, 0], name: 'Base pair rung' });
    r2.set(V(0, y, 0), V(radius * 0.92 * Math.cos(ang + Math.PI), y, radius * 0.92 * Math.sin(ang + Math.PI)));
  }
  return g;
}

// Rotary F0F1 ATP Synthase molecular turbine
export function buildAtpSynthase(parent, { x0 = 0, y0 = 1.4, z0 = 0, scale = 1, name = 'ATP synthase rotor' } = {}) {
  const g = new THREE.Group();
  g.position.set(x0, y0, z0);
  g.scale.setScalar(scale);
  parent.add(g);
  const rotor = new THREE.Group();
  g.add(rotor);
  // F0 c-ring gear in membrane
  gear(rotor, { teeth: 12, r: 0.42, width: 0.36, pal: 'ochre', tone: 'hi', pos: [0, -0.55, 0], rot: [Math.PI / 2, 0, 0], ex: [0, -0.45, 0], name: 'F0 c-ring proton turbine' });
  // Central gamma stalk
  part(rotor, cyl(0.09, 1.05, 16), { pal: 'red', tone: 'hi', pos: [0, 0.0, 0], ex: [0, 0.2, 0], name: 'Gamma rotary shaft' });
  // F1 alpha3-beta3 catalytic hexamer crown
  const crown = new THREE.Group();
  crown.position.set(0, 0.62, 0);
  g.add(crown);
  for (let i = 0; i < 6; i++) {
    const ang = (i * Math.PI) / 3;
    const pal = i % 2 === 0 ? 'blue' : 'green';
    part(crown, capsule(0.19, 0.28, 8, 14), {
      pal,
      tone: 'hi',
      pos: [0.38 * Math.cos(ang), 0, 0.38 * Math.sin(ang)],
      ex: [0.32 * Math.cos(ang), 0.35, 0.32 * Math.sin(ang)],
      name: i % 2 === 0 ? 'F1 alpha subunit' : 'F1 beta catalytic subunit',
    });
  }
  // Peripheral stator arm
  part(g, cyl(0.045, 1.35, 12), { pal: 'dark', tone: 'mid', pos: [0.68, 0.05, 0], ex: [0.4, 0, 0], name: 'Peripheral stator b-stalk' });
  part(g, sphere(0.14, 14), { pal: 'dark', tone: 'mid', pos: [0, 0.95, 0], ex: [0, 0.5, 0], name: 'Delta cap' });
  return { group: g, rotor, crown };
}

// Gentle Web Audio helper for biological sonification (never throws, respects user opt-in)
export function playTone(ctx, { freq = 220, dur = 0.07, type = 'sine', gain = 0.04, slideTo = null } = {}) {
  if (!ctx || ctx.state === 'closed') return;
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(Math.max(40, Math.min(2400, freq)), now);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(40, Math.min(2400, slideTo)), now + dur);
  g.gain.setValueAtTime(gain, now);
  g.gain.exponentialRampToValueAtTime(0.0008, now + dur);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + dur + 0.01);
}
