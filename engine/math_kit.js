// Shared 3D mathematics & geometry apparatus kit built on Atlas's paper-and-ink parts, prims, kinematics, motion, and CAD kit.
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
export const torus = (R, r, rSeg = 14, tSeg = 36, arc = Math.PI * 2) => new THREE.TorusGeometry(R, r, rSeg, tSeg, arc);
export const cone = (r, h, seg = 20) => new THREE.ConeGeometry(r, h, seg);
export const capsule = (r, len, capSeg = 8, rSeg = 16) => new THREE.CapsuleGeometry(r, len, capSeg, rSeg);

// Faint studio ground grid across mathematical stations
export function studioGrid(root, { x0 = -5, x1 = 60, z0 = -4, z1 = 4, y = 0.001 } = {}) {
  const g = [];
  for (let x = x0; x <= x1; x += 2) g.push(x, y, z0, x, y, z1);
  for (let z = z0; z <= z1; z += 1) g.push(x0, y, z, x1, y, z);
  lines(root, g, '#e6e6e2');
}

// Upright Cartesian coordinate plane grid at station center (cx, cy, cz)
export function coordPlane2D(parent, { cx = 0, cy = 1.35, cz = -0.15, halfW = 1.6, halfH = 1.2, step = 0.4, color = '#dcdad2' } = {}) {
  const pts = [];
  for (let x = -halfW; x <= halfW + 1e-6; x += step) {
    pts.push(cx + x, cy - halfH, cz, cx + x, cy + halfH, cz);
  }
  for (let y = -halfH; y <= halfH + 1e-6; y += step) {
    pts.push(cx - halfW, cy + y, cz, cx + halfW, cy + y, cz);
  }
  return lines(parent, pts, color);
}

// 3D circular sector wedge geometry in XZ or XY plane for Archimedes' πr² sector comb rearrangement
export function sectorWedgeGeo(radius = 1.0, angleSpan = Math.PI / 12, depth = 0.14, segs = 10) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  const half = angleSpan / 2;
  for (let i = 0; i <= segs; i++) {
    const a = -half + (i / segs) * angleSpan;
    shape.lineTo(Math.cos(a) * radius, Math.sin(a) * radius);
  }
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: segs });
  geo.translate(0, 0, -depth / 2);
  return geo;
}

// 3D orthogonal vector triad (î, ĵ, k̂)
export function vectorTriad(parent, { pos = [0, 0, 0], len = 0.85 } = {}) {
  const g = new THREE.Group();
  g.position.set(pos[0], pos[1], pos[2]);
  parent.add(g);
  const ax = arrow(g, { pal: 'red', r: 0.024 });
  const ay = arrow(g, { pal: 'blue', r: 0.024 });
  const az = arrow(g, { pal: 'green', r: 0.024 });
  setArrow(ax, V(0, 0, 0), V(len, 0, 0));
  setArrow(ay, V(0, 0, 0), V(0, len, 0));
  setArrow(az, V(0, 0, 0), V(0, 0, len));
  return { group: g, ax, ay, az };
}

// Gentle Web Audio helper for mathematical sonification (never throws, respects user opt-in)
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


// Semantic colour palette for mathematical proofs
export const MATH_COL = {
  setA: 0xc83e37,   // --proton red
  setB: 0x2e66b8,   // --electron blue
  inter: 0xc88a1e,  // --neutron amber
  warn: 0xd98a1e,   // highlight amber
  proof: 0x1e7a50,  // --green verification
  axis: 0x5d6c66,   // --muted slate
};

function makeMat(color = 0x2e66b8, opacity = 1.0) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.38,
    metalness: 0.08,
    transparent: opacity < 0.99,
    opacity,
  });
}

export function algebraTile({ width = 1, height = 1, depth = 0.16, color = MATH_COL.setB, opacity = 1.0 } = {}) {
  return new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), makeMat(color, opacity));
}

export function barPillar({ x = 0, z = 0, width = 0.3, depth = 0.3, height = 1.0, color = MATH_COL.setB, opacity = 1.0 } = {}) {
  const geo = new THREE.BoxGeometry(width, height, depth);
  geo.translate(0, height / 2, 0);
  const m = new THREE.Mesh(geo, makeMat(color, opacity));
  m.position.set(x, -0.6, z);
  return m;
}

export function lensDisc({ radius = 0.9, thickness = 0.12, color = MATH_COL.setA, opacity = 0.72, radialSegments = 36 } = {}) {
  const geo = new THREE.CylinderGeometry(radius, radius, thickness, radialSegments);
  geo.rotateX(Math.PI / 2);
  return new THREE.Mesh(geo, makeMat(color, opacity));
}

export function ringTorus({ radius = 1.0, tube = 0.03, color = MATH_COL.axis, opacity = 1.0 } = {}) {
  return new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 16, 48), makeMat(color, opacity));
}

export function nodeSphere({ radius = 0.1, color = MATH_COL.warn, opacity = 1.0 } = {}) {
  return new THREE.Mesh(new THREE.SphereGeometry(radius, 20, 14), makeMat(color, opacity));
}

export function wireBox({ width = 2, height = 1.5, depth = 0.25, color = MATH_COL.axis } = {}) {
  const grp = new THREE.Group();
  const boxGeo = new THREE.BoxGeometry(width, height, depth);
  const edges = new THREE.EdgesGeometry(boxGeo);
  grp.add(new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color })));
  const proxy = new THREE.Mesh(boxGeo, makeMat(color, 0.06));
  grp.add(proxy);
  return grp;
}

export function vectorArrow({ from = [0, 0, 0], to = [1, 0, 0], color = MATH_COL.setA, radius = 0.035 } = {}) {
  const f = new THREE.Vector3(...from);
  const t = new THREE.Vector3(...to);
  const dir = t.clone().sub(f);
  const len = Math.max(0.05, dir.length());
  const grp = new THREE.Group();
  const headLen = Math.min(len * 0.28, radius * 4.2);
  const shaftLen = Math.max(0.02, len - headLen);
  const mat = makeMat(color, 1.0);
  const shaftGeo = new THREE.CylinderGeometry(radius, radius, shaftLen, 14);
  shaftGeo.translate(0, shaftLen / 2, 0);
  const headGeo = new THREE.ConeGeometry(radius * 2.3, headLen, 16);
  headGeo.translate(0, shaftLen + headLen / 2, 0);
  grp.add(new THREE.Mesh(shaftGeo, mat), new THREE.Mesh(headGeo, mat));
  grp.position.copy(f);
  if (dir.lengthSq() > 1e-8) {
    grp.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  }
  return grp;
}

export function numberLine3D({ min = -2, max = 2, step = 0.5, color = MATH_COL.axis } = {}) {
  const grp = new THREE.Group();
  grp.add(vectorArrow({ from: [min, 0, 0], to: [max, 0, 0], color, radius: 0.024 }));
  for (let x = min; x <= max + 1e-6; x += step) {
    const tick = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.16, 0.04), makeMat(color, 0.9));
    tick.position.set(x, 0, 0);
    grp.add(tick);
  }
  return grp;
}

export function axes3D({ length = 1.8, showZ = false } = {}) {
  const grp = new THREE.Group();
  grp.add(vectorArrow({ from: [-length, 0, 0], to: [length, 0, 0], color: MATH_COL.axis, radius: 0.02 }));
  grp.add(vectorArrow({ from: [0, -length * 0.75, 0], to: [0, length * 0.85, 0], color: MATH_COL.axis, radius: 0.02 }));
  if (showZ) {
    grp.add(vectorArrow({ from: [0, 0, -length * 0.6], to: [0, 0, length * 0.6], color: MATH_COL.axis, radius: 0.02 }));
  }
  return grp;
}

export function arcSector({ radius = 1.0, angle = Math.PI / 3, thickness = 0.12, color = MATH_COL.setA, opacity = 0.85 } = {}) {
  const geo = sectorWedgeGeo(radius, angle, thickness, 16);
  return new THREE.Mesh(geo, makeMat(color, opacity));
}

export function rightTrianglePlate({ a = 1.2, b = 0.9, thickness = 0.12, color = MATH_COL.proof, opacity = 0.82 } = {}) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(a, 0);
  shape.lineTo(a, b);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false });
  geo.translate(-a / 2, -b / 2, -thickness / 2);
  return new THREE.Mesh(geo, makeMat(color, opacity));
}

export function curveTube({ fn, segments = 48, radius = 0.035, color = MATH_COL.setB, opacity = 1.0 } = {}) {
  const pts = [];
  for (let i = 0; i <= segments; i++) {
    const u = i / segments;
    const [x, y, z] = fn(u);
    pts.push(new THREE.Vector3(x, y, z || 0));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  const geo = new THREE.TubeGeometry(curve, segments, radius, 12, false);
  return new THREE.Mesh(geo, makeMat(color, opacity));
}
