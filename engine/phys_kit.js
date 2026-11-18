// Shared 3D physics & apparatus kit built on Atlas's paper-and-ink parts, prims, kinematics, and motion.
import * as THREE from 'three';
import { part, box, cyl, lines, arrow as rawArrow, setArrow as rawSetArrow, rod as rawRod, liveTube, gear, spring, shadeMat, TONE, V, xAxis, zAxis } from './parts.js';
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

// Gentle Web Audio helper for physical sonification (consolidated in engine/sound.js)
export { playTone, playBoop, playClick, playKnock, createHum } from './sound.js';

// ── 3D Electronics, Microcontroller, Breadboard & Braided Rope Kit ──

export function breadboard(parent, {
  cols = 14,
  rows = 5,
  pitch = 0.11,
  pos = [0, 0, 0],
  pal = 'paper',
  name = 'Breadboard',
} = {}) {
  const group = new THREE.Group();
  group.position.set(pos[0], pos[1], pos[2]);
  parent.add(group);
  const w = Math.max(0.8, cols * pitch + 0.24);
  const d = Math.max(0.55, rows * pitch + 0.34);
  const h = 0.12;
  const slab = part(group, box(w, h, d, 0.025), { pal, pos: [0, 0, 0], tone: 'hi', name });
  part(group, box(w - 0.08, 0.02, 0.06, 0.005), { pal: 'dark', pos: [0, h * 0.45, 0], tone: 'faint', name });
  part(group, box(w - 0.12, 0.012, 0.022, 0.003), { pal: 'red', pos: [0, h * 0.49, -d * 0.41], tone: 'lo', name });
  part(group, box(w - 0.12, 0.012, 0.022, 0.003), { pal: 'blue', pos: [0, h * 0.49, d * 0.41], tone: 'lo', name });
  const holePos = (col = 0, row = 0) => V(
    pos[0] + (col - (cols - 1) * 0.5) * pitch,
    pos[1] + h * 0.5,
    pos[2] + (row - (rows - 1) * 0.5) * pitch,
  );
  return { group, slab, holePos };
}

export function mcuBoard(parent, {
  kind = 'uno',
  pos = [0, 0, 0],
  pal = 'blue',
  name = 'Microcontroller board',
} = {}) {
  const group = new THREE.Group();
  group.position.set(pos[0], pos[1], pos[2]);
  parent.add(group);
  const isEsp = String(kind).toLowerCase().includes('esp');
  const w = isEsp ? 1.15 : 1.48;
  const d = isEsp ? 0.62 : 1.04;
  const h = 0.08;
  const pcb = part(group, box(w, h, d, 0.02), { pal: isEsp ? 'ink' : pal, pos: [0, 0, 0], tone: 'hi', name });
  part(group, box(0.24, 0.12, 0.22, 0.015), { pal: 'paper', pos: [-w * 0.46, 0.06, isEsp ? 0 : -0.18], tone: 'mid', name });
  const chip = part(group, box(isEsp ? 0.46 : 0.62, 0.07, isEsp ? 0.38 : 0.22, 0.01), { pal: isEsp ? 'paper' : 'ink', pos: [0.08, 0.06, 0.04], tone: 'hi', name });
  part(group, box(w * 0.74, 0.09, 0.07, 0.008), { pal: 'ink', pos: [0.06, 0.065, -d * 0.42], tone: 'mid', name });
  part(group, box(w * 0.74, 0.09, 0.07, 0.008), { pal: 'ink', pos: [0.06, 0.065, d * 0.42], tone: 'mid', name });
  const ledTx = part(group, box(0.06, 0.03, 0.04, 0.005), { pal: 'ochre', pos: [-0.24, 0.05, -0.12], tone: 'mid', name });
  const ledRx = part(group, box(0.06, 0.03, 0.04, 0.005), { pal: 'ochre', pos: [-0.24, 0.05, 0.0], tone: 'mid', name });
  const ledOn = part(group, box(0.06, 0.03, 0.04, 0.005), { pal: 'green', pos: [-0.24, 0.05, 0.12], tone: 'mid', name });
  const leds = { tx: ledTx, rx: ledRx, led: ledOn };
  const pinPos = (index = 0) => {
    const side = index % 2 === 0 ? -1 : 1;
    const slot = Math.floor(index / 2);
    const x = -w * 0.32 + (slot % 8) * ((w * 0.68) / 7);
    return V(pos[0] + x, pos[1] + 0.11, pos[2] + side * d * 0.42);
  };
  const setStatus = (st = {}) => {
    for (const k of ['tx', 'rx', 'led']) {
      if (k in st && leds[k]) {
        const on = Number(st[k]) > 0;
        leds[k].userData.tone = on ? TONE.lit : TONE.mid;
        if (leds[k].material?.uniforms?.uLit) leds[k].material.uniforms.uLit.value = on ? 1.0 : 0.0;
      }
    }
  };
  return { group, pcb, chip, leds, pinPos, setStatus };
}

export function jumperWire(parent, {
  from = [0, 0, 0],
  to = [1, 0, 0],
  lift = 0.28,
  r = 0.018,
  segs = 28,
  pal = 'red',
  name = 'Jumper wire',
} = {}) {
  const group = new THREE.Group();
  parent.add(group);
  const buildCurve = (a, b, hLift) => {
    const p0 = a.isVector3 ? a.clone() : V(a[0], a[1], a[2]);
    const p4 = b.isVector3 ? b.clone() : V(b[0], b[1], b[2]);
    const p1 = p0.clone().add(V(0, hLift * 0.65, 0));
    const p3 = p4.clone().add(V(0, hLift * 0.65, 0));
    const mid = p0.clone().lerp(p4, 0.5);
    mid.y = Math.max(p0.y, p4.y) + hLift;
    return new THREE.CatmullRomCurve3([p0, p1, mid, p3, p4]);
  };
  let curCurve = buildCurve(from, to, lift);
  const wire = part(group, new THREE.TubeGeometry(curCurve, segs, r, 8, false), { pal, tone: 'hi', name });
  const pA = from.isVector3 ? [from.x, from.y, from.z] : from;
  const pB = to.isVector3 ? [to.x, to.y, to.z] : to;
  const pinA = part(group, box(r * 2.5, 0.09, r * 2.5, 0.004), { pal: 'ink', pos: pA, tone: 'mid', name });
  const pinB = part(group, box(r * 2.5, 0.09, r * 2.5, 0.004), { pal: 'ink', pos: pB, tone: 'mid', name });
  const setEndpoints = (a, b, hLift = lift) => {
    curCurve = buildCurve(a, b, hLift);
    wire.geometry.dispose();
    wire.geometry = new THREE.TubeGeometry(curCurve, segs, r, 8, false);
    const pa = a.isVector3 ? a : V(a[0], a[1], a[2]);
    const pb = b.isVector3 ? b : V(b[0], b[1], b[2]);
    pinA.position.copy(pa);
    pinB.position.copy(pb);
  };
  const curvePoints = (n = 16) => curCurve.getPoints(Math.max(1, n - 1)).map((p) => [p.x, p.y, p.z]);
  return { group, wire, pinA, pinB, setEndpoints, curvePoints };
}

export function ledComponent(parent, {
  pos = [0, 0, 0],
  pal = 'red',
  r = 0.075,
  h = 0.16,
  leads = 0.16,
  name = 'LED',
} = {}) {
  const group = new THREE.Group();
  group.position.set(pos[0], pos[1], pos[2]);
  parent.add(group);
  part(group, cyl(0.012, leads, 8), { pal: 'dark', pos: [-r * 0.42, -leads * 0.5, 0], tone: 'lo', name });
  part(group, cyl(0.012, leads, 8), { pal: 'dark', pos: [r * 0.42, -leads * 0.5, 0], tone: 'lo', name });
  const dome = part(group, cyl(r, h, 18), { pal, pos: [0, h * 0.5, 0], tone: 'mid', name });
  const setBrightness = (u = 0) => {
    const b = Math.max(0, Math.min(1, Number(u) || 0));
    dome.userData.tone = b > 0.25 ? TONE.lit : TONE.mid;
    if (dome.material?.uniforms?.uLit) dome.material.uniforms.uLit.value = b;
  };
  return { group, dome, setBrightness };
}

const EIA_NAMES = ['black', 'brown', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'grey', 'white'];
const EIA_PAL = {
  black: 'ink',
  brown: 'ochre',
  red: 'red',
  orange: 'ochre',
  yellow: 'driver',
  green: 'green',
  blue: 'blue',
  violet: 'compound',
  grey: 'dark',
  white: 'paper',
  gold: 'ochre',
};

function ohmsToBands(ohms = 220) {
  const v = Math.max(1, Number(ohms) || 220);
  const exp = Math.max(0, Math.min(9, Math.floor(Math.log10(v)) - 1));
  const twoDigits = Math.max(10, Math.min(99, Math.round(v / (10 ** exp))));
  const d1 = Math.floor(twoDigits / 10);
  const d2 = twoDigits % 10;
  return [EIA_NAMES[d1], EIA_NAMES[d2], EIA_NAMES[exp], 'gold'];
}

export function resistorComponent(parent, {
  pos = [0, 0, 0],
  rot = [0, 0, 0],
  ohms = 220,
  len = 0.36,
  r = 0.052,
  leads = 0.2,
  name = 'Resistor',
} = {}) {
  const group = new THREE.Group();
  group.position.set(pos[0], pos[1], pos[2]);
  group.rotation.set(rot[0], rot[1], rot[2]);
  parent.add(group);
  part(group, xAxis(cyl(0.012, len + leads * 2, 8)), { pal: 'dark', pos: [0, 0, 0], tone: 'lo', name });
  const body = part(group, xAxis(cyl(r, len, 16)), { pal: 'paper', pos: [0, 0, 0], tone: 'hi', name });
  const bands = ohmsToBands(ohms);
  const xs = [-len * 0.3, -len * 0.1, len * 0.1, len * 0.3];
  const bandMeshes = bands.map((bName, i) => part(
    group,
    xAxis(cyl(r * 1.06, len * 0.09, 14)),
    { pal: EIA_PAL[bName] || 'ink', pos: [xs[i], 0, 0], tone: 'mid', name },
  ));
  const setOhms = (newOhms) => {
    const next = ohmsToBands(newOhms);
    for (let i = 0; i < 4; i++) bands[i] = next[i];
  };
  return { group, body, bands, bandMeshes, setOhms };
}

export function servoComponent(parent, {
  pos = [0, 0, 0],
  angle = 0,
  pal = 'blue',
  name = 'Servo motor',
} = {}) {
  const group = new THREE.Group();
  group.position.set(pos[0], pos[1], pos[2]);
  parent.add(group);
  const body = part(group, box(0.46, 0.38, 0.24, 0.02), { pal, pos: [0, 0, 0], tone: 'hi', name });
  part(group, box(0.62, 0.05, 0.24, 0.01), { pal, pos: [0, 0.08, 0], tone: 'mid', name });
  const horn = new THREE.Group();
  horn.position.set(0.12, 0.23, 0);
  horn.rotation.y = angle;
  group.add(horn);
  part(horn, cyl(0.06, 0.06, 14), { pal: 'paper', pos: [0, 0, 0], tone: 'hi', name });
  part(horn, box(0.32, 0.04, 0.09, 0.01), { pal: 'paper', pos: [0.1, 0, 0], tone: 'hi', name });
  const setAngle = (rad = 0) => { horn.rotation.y = rad; };
  return { group, body, horn, setAngle };
}

export function ultrasonicComponent(parent, {
  pos = [0, 0, 0],
  rot = [0, 0, 0],
  pal = 'blue',
  name = 'Ultrasonic transceiver',
} = {}) {
  const group = new THREE.Group();
  group.position.set(pos[0], pos[1], pos[2]);
  group.rotation.set(rot[0], rot[1], rot[2]);
  parent.add(group);
  const pcb = part(group, box(0.12, 0.42, 0.88, 0.015), { pal, pos: [0, 0, 0], tone: 'hi', name });
  const txCan = part(group, xAxis(cyl(0.16, 0.22, 20)), { pal: 'paper', pos: [0.14, 0.02, -0.22], tone: 'hi', name });
  const rxCan = part(group, xAxis(cyl(0.16, 0.22, 20)), { pal: 'paper', pos: [0.14, 0.02, 0.22], tone: 'hi', name });
  part(group, xAxis(cyl(0.11, 0.23, 16)), { pal: 'ink', pos: [0.14, 0.02, -0.22], tone: 'mid', name });
  part(group, xAxis(cyl(0.11, 0.23, 16)), { pal: 'ink', pos: [0.14, 0.02, 0.22], tone: 'mid', name });
  const emitOrigin = V(pos[0] + 0.25, pos[1] + 0.02, pos[2]);
  return { group, pcb, txCan, rxCan, emitOrigin };
}

export function braidedRope(parent, {
  points = [[-1, 0, 0], [0, 0.3, 0], [1, 0, 0]],
  radius = 0.038,
  segments = 48,
  radialSegments = 8,
  pal = 'ochre',
  name = 'Braided rope',
} = {}) {
  const group = new THREE.Group();
  parent.add(group);
  const toVecs = (pts) => pts.map((p) => (p.isVector3 ? p.clone() : V(p[0], p[1], p[2])));
  const makeGeo = (pts) => new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(toVecs(pts), false, 'centripetal', 0.5),
    segments,
    radius,
    radialSegments,
    false,
  );
  const mesh = part(group, makeGeo(points), { pal, tone: 'hi', name });
  const setPoints = (pts) => {
    mesh.geometry.dispose();
    mesh.geometry = makeGeo(pts);
  };
  const morph = (ptsA, ptsB, u = 0) => {
    const t = Math.max(0, Math.min(1, Number(u) || 0));
    const va = toVecs(ptsA);
    const vb = toVecs(ptsB);
    const n = Math.min(va.length, vb.length);
    const blended = [];
    for (let i = 0; i < n; i++) blended.push(va[i].clone().lerp(vb[i], t));
    setPoints(blended);
  };
  return { group, mesh, setPoints, morph };
}

