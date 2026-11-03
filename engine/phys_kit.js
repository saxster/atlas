// Shared 3D physics & apparatus kit built on Atlas's paper-and-ink parts, prims, kinematics, and motion.
import * as THREE from 'three';
import { part, box, cyl, lines, arrow as rawArrow, setArrow as rawSetArrow, rod as rawRod, liveTube, gear, spring, shadeMat, V, xAxis, zAxis } from './parts.js';
import * as rawPrims from './prims.js';
import * as K from './kinematics.js';
import * as motion from './motion.js';
export * from './cad_kit.js';

export function arrow(parent, palOrOpts = 'red', opts = {}) {
  if (palOrOpts && typeof palOrOpts === 'object') {
    const { pal = 'red', ...rest } = palOrOpts;
    return rawArrow(parent, pal, rest);
  }
  return rawArrow(parent, palOrOpts, opts);
}

export function setArrow(a, from, to, opacity = 1) {
  const f = from.isVector3 ? from : V(...from);
  const t = to.isVector3 ? to : V(...to);
  return rawSetArrow(a, f, t.clone().sub(f), opacity);
}

export function rod(parent, opts = {}) {
  const m = rawRod(parent, opts);
  const origSet = m.set.bind(m);
  m.set = (a, b) => origSet(a.isVector3 ? a : V(...a), b.isVector3 ? b : V(...b));
  return m;
}

export const prims = {
  ...rawPrims,
  molecule(parent, xyzOrSpec, opts = {}) {
    if (xyzOrSpec && typeof xyzOrSpec === 'object' && Array.isArray(xyzOrSpec.atoms)) {
      const xyz = xyzOrSpec.atoms.map(([e, x, y, z]) => `${e} ${x} ${y} ${z}`).join('\n');
      return rawPrims.molecule(parent, xyz, { names: false, ...xyzOrSpec, ...opts });
    }
    return rawPrims.molecule(parent, xyzOrSpec, opts);
  },
  particles(parent, countOrOpts, opts = {}) {
    const isObj = countOrOpts && typeof countOrOpts === 'object';
    const o = isObj ? countOrOpts : opts;
    const count = isObj ? (o.count ?? 32) : countOrOpts;
    const radius = o.r ?? o.radius ?? 0.05;
    const color = o.pal ?? o.color ?? 'red';
    const inst = rawPrims.particles(parent, count, { ...o, radius, color });
    const rawSet = inst.set.bind(inst);
    inst.set = (iOrPts, xyz) => {
      if (Array.isArray(iOrPts)) {
        const n = Math.min(count, iOrPts.length);
        for (let i = 0; i < n; i++) rawSet(i, iOrPts[i]);
        inst.show(n);
      } else {
        rawSet(iOrPts, xyz);
      }
    };
    return inst;
  },
};

export { THREE, part, box, cyl, lines, liveTube, gear, spring, shadeMat, V, xAxis, zAxis, K, motion };

export const sphere = (r, seg = 24) => new THREE.SphereGeometry(r, seg, Math.max(12, seg >> 1));
export const torus = (R, r, rSeg = 14, tSeg = 32, arc = Math.PI * 2) => new THREE.TorusGeometry(R, r, rSeg, tSeg, arc);
export const cone = (r, h, seg = 20) => new THREE.ConeGeometry(r, h, seg);
export const capsule = (r, len, capSeg = 8, rSeg = 16) => new THREE.CapsuleGeometry(r, len, capSeg, rSeg);

// Real 3D molecular & crystal lattice coordinate tables (Ångströms, scaled for scene placement)
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
  co2: {
    atoms: [
      ['C', 0.0, 0.0, 0.0],
      ['O', -1.16, 0.0, 0.0],
      ['O', 1.16, 0.0, 0.0],
    ],
    bonds: [[0, 1, 2], [0, 2, 2]],
  },
  ccl4: {
    atoms: [
      ['C', 0.0, 0.0, 0.0],
      ['Cl', 0.0, 1.77, 0.0],
      ['Cl', 1.67, -0.59, 0.0],
      ['Cl', -0.83, -0.59, 1.44],
      ['Cl', -0.83, -0.59, -1.44],
    ],
    bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]],
  },
  siLattice: {
    atoms: [
      ['Si', 0.0, 0.0, 0.0],
      ['Si', 1.35, 1.35, 1.35],
      ['Si', -1.35, -1.35, 1.35],
      ['Si', 1.35, -1.35, -1.35],
      ['Si', -1.35, 1.35, -1.35],
    ],
    bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]],
  },
};

// Faint studio ground grid across stations
export function studioGrid(root, { x0 = -5, x1 = 60, z0 = -4, z1 = 4, y = 0.001 } = {}) {
  const g = [];
  for (let x = x0; x <= x1; x += 2) g.push(x, y, z0, x, y, z1);
  for (let z = z0; z <= z1; z += 1) g.push(x0, y, z, x1, y, z);
  lines(root, g, '#e6e6e2');
}

// Helical coil / solenoid / spring tube geometry
export function coilGeo(R = 0.35, height = 1.6, turns = 8, rTube = 0.035, segs = 96) {
  const pts = [];
  for (let i = 0; i <= segs; i++) {
    const u = i / segs;
    const ang = u * turns * Math.PI * 2;
    const y = (u - 0.5) * height;
    pts.push(V(R * Math.cos(ang), y, R * Math.sin(ang)));
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), segs, rTube, 8, false);
}

// 3D orthogonal vector triad (e.g. reference frame or E/B/k wave triad)
export function vectorTriad(parent, { pos = [0, 0, 0], len = 0.85 } = {}) {
  const g = new THREE.Group();
  g.position.set(pos[0], pos[1], pos[2]);
  parent.add(g);
  const ax = arrow(g, { pal: 'red', r: 0.024 });
  const ay = arrow(g, { pal: 'green', r: 0.024 });
  const az = arrow(g, { pal: 'blue', r: 0.024 });
  setArrow(ax, V(0, 0, 0), V(len, 0, 0));
  setArrow(ay, V(0, 0, 0), V(0, len, 0));
  setArrow(az, V(0, 0, 0), V(0, 0, len));
  return { group: g, ax, ay, az };
}

// Gentle Web Audio helper for physical sonification (never throws, respects user opt-in)
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
