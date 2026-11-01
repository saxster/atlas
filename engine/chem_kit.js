// Shared 3D chemistry kit for Atlas of Chemistry chapters: paper-and-ink shaders,
// real 3D molecular coordinates, deterministic nucleon clusters, crystal lattices,
// laboratory glassware/electrochemical apparatus, and Web Audio sonification helpers.
import * as THREE from 'three';
import { PALETTE as PAL, shadeMat, part, box, lines, arrow, setArrow, rod, liveTube, gear, spring, V, xAxis, zAxis } from './parts.js';
import * as prims from './prims.js';

export { THREE, PAL, shadeMat, part, box, lines, arrow, setArrow, rod, liveTube, gear, spring, V, xAxis, zAxis, prims };

export const cyl = (r, h, seg = 32, openOrR2 = r) =>
  typeof openOrR2 === 'boolean'
    ? new THREE.CylinderGeometry(r, r, h, seg, 1, openOrR2)
    : new THREE.CylinderGeometry(openOrR2, r, h, seg);
export const sphere = (r, seg = 24) => new THREE.SphereGeometry(r, seg, Math.max(12, seg >> 1));
export const torus = (R, r, rSeg = 14, tSeg = 32, arc = Math.PI * 2) => new THREE.TorusGeometry(R, r, rSeg, tSeg, arc);
export const cone = (r, h, seg = 20) => new THREE.ConeGeometry(r, h, seg);
export const ring = (rIn, rOut, seg = 32) => new THREE.RingGeometry(rIn, rOut, seg);

export function arrow3(parent, { r = 0.035, headR = 0.09, headL = 0.16, pal = 'red', tone = 'hi', name = 'Vector arrow' } = {}) {
  const a = arrow(parent, pal, { r, head: headL, headR, name, tone });
  a.set = (from, to) => setArrow(a, from, to.clone().sub(from));
  return a;
}

export function capsule(r = 0.2, len = 0.6, capSeg = 10, radSeg = 20) {
  return new THREE.CapsuleGeometry(r, len, capSeg, radSeg);
}

// Element palette mapping onto Atlas paper-and-ink palettes & tones
export const ELEMENT_STYLE = {
  H:  { pal: 'paper', tone: 'hi',  r: 0.16 },
  He: { pal: 'ochre', tone: 'lit', r: 0.18 },
  Li: { pal: 'red',   tone: 'mid', r: 0.26 },
  Be: { pal: 'green', tone: 'mid', r: 0.22 },
  B:  { pal: 'ochre', tone: 'mid', r: 0.21 },
  C:  { pal: 'dark',  tone: 'hi',  r: 0.24 },
  N:  { pal: 'blue',  tone: 'hi',  r: 0.23 },
  O:  { pal: 'red',   tone: 'hi',  r: 0.22 },
  F:  { pal: 'green', tone: 'lit', r: 0.20 },
  Ne: { pal: 'ochre', tone: 'hi',  r: 0.20 },
  Na: { pal: 'blue',  tone: 'mid', r: 0.30 },
  Mg: { pal: 'green', tone: 'hi',  r: 0.27 },
  Al: { pal: 'paper', tone: 'mid', r: 0.26 },
  Si: { pal: 'ochre', tone: 'mid', r: 0.26 },
  P:  { pal: 'ochre', tone: 'hi',  r: 0.25 },
  S:  { pal: 'ochre', tone: 'lit', r: 0.26 },
  Cl: { pal: 'green', tone: 'hi',  r: 0.28 },
  Ar: { pal: 'blue',  tone: 'lit', r: 0.24 },
  K:  { pal: 'blue',  tone: 'mid', r: 0.33 },
  Ca: { pal: 'green', tone: 'mid', r: 0.30 },
  Fe: { pal: 'red',   tone: 'mid', r: 0.27 },
  Cu: { pal: 'ochre', tone: 'hi',  r: 0.27 },
  Zn: { pal: 'blue',  tone: 'lit', r: 0.27 },
  Ag: { pal: 'paper', tone: 'hi',  r: 0.29 },
  Au: { pal: 'ochre', tone: 'lit', r: 0.30 },
};

// Real 3D molecular geometry specifications (centred near origin, in ~Å units)
export const CHEM_MOLECULES = {
  H2: {
    atoms: [
      { el: 'H', x: -0.37, y: 0, z: 0 },
      { el: 'H', x:  0.37, y: 0, z: 0 },
    ],
    bonds: [[0, 1, 1]],
  },
  O2: {
    atoms: [
      { el: 'O', x: -0.60, y: 0, z: 0 },
      { el: 'O', x:  0.60, y: 0, z: 0 },
    ],
    bonds: [[0, 1, 2]],
  },
  N2: {
    atoms: [
      { el: 'N', x: -0.55, y: 0, z: 0 },
      { el: 'N', x:  0.55, y: 0, z: 0 },
    ],
    bonds: [[0, 1, 3]],
  },
  HCl: {
    atoms: [
      { el: 'Cl', x: -0.35, y: 0, z: 0 },
      { el: 'H',  x:  0.92, y: 0, z: 0 },
    ],
    bonds: [[0, 1, 1]],
  },
  H2O: {
    atoms: [
      { el: 'O', x:  0.00, y:  0.22, z: 0 },
      { el: 'H', x: -0.76, y: -0.37, z: 0 },
      { el: 'H', x:  0.76, y: -0.37, z: 0 },
    ],
    bonds: [[0, 1, 1], [0, 2, 1]],
  },
  H3O_plus: {
    atoms: [
      { el: 'O', x:  0.00, y:  0.25, z:  0.00 },
      { el: 'H', x:  0.90, y: -0.18, z:  0.00 },
      { el: 'H', x: -0.45, y: -0.18, z:  0.78 },
      { el: 'H', x: -0.45, y: -0.18, z: -0.78 },
    ],
    bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1]],
  },
  OH_minus: {
    atoms: [
      { el: 'O', x: -0.30, y: 0, z: 0 },
      { el: 'H', x:  0.66, y: 0, z: 0 },
    ],
    bonds: [[0, 1, 1]],
  },
  CO2: {
    atoms: [
      { el: 'C', x:  0.00, y: 0, z: 0 },
      { el: 'O', x: -1.16, y: 0, z: 0 },
      { el: 'O', x:  1.16, y: 0, z: 0 },
    ],
    bonds: [[0, 1, 2], [0, 2, 2]],
  },
  NH3: {
    atoms: [
      { el: 'N', x:  0.00, y:  0.28, z:  0.00 },
      { el: 'H', x:  0.94, y: -0.14, z:  0.00 },
      { el: 'H', x: -0.47, y: -0.14, z:  0.81 },
      { el: 'H', x: -0.47, y: -0.14, z: -0.81 },
    ],
    bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1]],
  },
  CH4: {
    atoms: [
      { el: 'C', x:  0.00, y:  0.00, z:  0.00 },
      { el: 'H', x:  0.63, y:  0.63, z:  0.63 },
      { el: 'H', x: -0.63, y: -0.63, z:  0.63 },
      { el: 'H', x: -0.63, y:  0.63, z: -0.63 },
      { el: 'H', x:  0.63, y: -0.63, z: -0.63 },
    ],
    bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]],
  },
  C2H4: {
    atoms: [
      { el: 'C', x: -0.67, y:  0.00, z: 0 },
      { el: 'C', x:  0.67, y:  0.00, z: 0 },
      { el: 'H', x: -1.24, y:  0.92, z: 0 },
      { el: 'H', x: -1.24, y: -0.92, z: 0 },
      { el: 'H', x:  1.24, y:  0.92, z: 0 },
      { el: 'H', x:  1.24, y: -0.92, z: 0 },
    ],
    bonds: [[0, 1, 2], [0, 2, 1], [0, 3, 1], [1, 4, 1], [1, 5, 1]],
  },
  C2H2: {
    atoms: [
      { el: 'C', x: -0.60, y: 0, z: 0 },
      { el: 'C', x:  0.60, y: 0, z: 0 },
      { el: 'H', x: -1.66, y: 0, z: 0 },
      { el: 'H', x:  1.66, y: 0, z: 0 },
    ],
    bonds: [[0, 1, 3], [0, 2, 1], [1, 3, 1]],
  },
  nButane: {
    atoms: [
      { el: 'C', x: -1.85, y: -0.35, z:  0.00 },
      { el: 'C', x: -0.62, y:  0.35, z:  0.00 },
      { el: 'C', x:  0.62, y: -0.35, z:  0.00 },
      { el: 'C', x:  1.85, y:  0.35, z:  0.00 },
      { el: 'H', x: -2.65, y:  0.35, z:  0.00 },
      { el: 'H', x: -1.92, y: -0.98, z:  0.88 },
      { el: 'H', x: -1.92, y: -0.98, z: -0.88 },
      { el: 'H', x: -0.62, y:  0.99, z:  0.88 },
      { el: 'H', x: -0.62, y:  0.99, z: -0.88 },
      { el: 'H', x:  0.62, y: -0.99, z:  0.88 },
      { el: 'H', x:  0.62, y: -0.99, z: -0.88 },
      { el: 'H', x:  2.65, y: -0.35, z:  0.00 },
      { el: 'H', x:  1.92, y:  0.98, z:  0.88 },
      { el: 'H', x:  1.92, y:  0.98, z: -0.88 },
    ],
    bonds: [
      [0, 1, 1], [1, 2, 1], [2, 3, 1],
      [0, 4, 1], [0, 5, 1], [0, 6, 1],
      [1, 7, 1], [1, 8, 1],
      [2, 9, 1], [2, 10, 1],
      [3, 11, 1], [3, 12, 1], [3, 13, 1],
    ],
  },
  isobutane: {
    atoms: [
      { el: 'C', x:  0.00, y:  0.20, z:  0.00 },
      { el: 'C', x:  0.00, y: -0.35, z:  1.42 },
      { el: 'C', x:  1.23, y: -0.35, z: -0.71 },
      { el: 'C', x: -1.23, y: -0.35, z: -0.71 },
      { el: 'H', x:  0.00, y:  1.30, z:  0.00 },
      { el: 'H', x:  0.00, y: -1.44, z:  1.45 },
      { el: 'H', x:  0.88, y:  0.02, z:  1.95 },
      { el: 'H', x: -0.88, y:  0.02, z:  1.95 },
      { el: 'H', x:  1.25, y: -1.44, z: -0.72 },
      { el: 'H', x:  2.14, y:  0.02, z: -0.22 },
      { el: 'H', x:  1.21, y:  0.02, z: -1.74 },
      { el: 'H', x: -1.25, y: -1.44, z: -0.72 },
      { el: 'H', x: -2.14, y:  0.02, z: -0.22 },
      { el: 'H', x: -1.21, y:  0.02, z: -1.74 },
    ],
    bonds: [
      [0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1],
      [1, 5, 1], [1, 6, 1], [1, 7, 1],
      [2, 8, 1], [2, 9, 1], [2, 10, 1],
      [3, 11, 1], [3, 12, 1], [3, 13, 1],
    ],
  },
  ethanol: {
    atoms: [
      { el: 'C', x: -1.15, y: -0.22, z:  0.00 },
      { el: 'C', x:  0.15, y:  0.42, z:  0.00 },
      { el: 'O', x:  1.22, y: -0.45, z:  0.00 },
      { el: 'H', x:  2.05, y:  0.06, z:  0.00 },
      { el: 'H', x: -1.95, y:  0.52, z:  0.00 },
      { el: 'H', x: -1.26, y: -0.85, z:  0.88 },
      { el: 'H', x: -1.26, y: -0.85, z: -0.88 },
      { el: 'H', x:  0.24, y:  1.06, z:  0.88 },
      { el: 'H', x:  0.24, y:  1.06, z: -0.88 },
    ],
    bonds: [
      [0, 1, 1], [1, 2, 1], [2, 3, 1],
      [0, 4, 1], [0, 5, 1], [0, 6, 1],
      [1, 7, 1], [1, 8, 1],
    ],
  },
  dimethylEther: {
    atoms: [
      { el: 'O', x:  0.00, y:  0.38, z:  0.00 },
      { el: 'C', x: -1.18, y: -0.28, z:  0.00 },
      { el: 'C', x:  1.18, y: -0.28, z:  0.00 },
      { el: 'H', x: -2.02, y:  0.42, z:  0.00 },
      { el: 'H', x: -1.25, y: -0.92, z:  0.88 },
      { el: 'H', x: -1.25, y: -0.92, z: -0.88 },
      { el: 'H', x:  2.02, y:  0.42, z:  0.00 },
      { el: 'H', x:  1.25, y: -0.92, z:  0.88 },
      { el: 'H', x:  1.25, y: -0.92, z: -0.88 },
    ],
    bonds: [
      [0, 1, 1], [0, 2, 1],
      [1, 3, 1], [1, 4, 1], [1, 5, 1],
      [2, 6, 1], [2, 7, 1], [2, 8, 1],
    ],
  },
  ethanoicAcid: {
    atoms: [
      { el: 'C', x: -1.15, y: -0.15, z: 0 },
      { el: 'C', x:  0.25, y:  0.12, z: 0 },
      { el: 'O', x:  0.72, y:  1.24, z: 0 },
      { el: 'O', x:  1.05, y: -0.96, z: 0 },
      { el: 'H', x:  1.98, y: -0.72, z: 0 },
      { el: 'H', x: -1.72, y:  0.78, z: 0 },
      { el: 'H', x: -1.42, y: -0.74, z:  0.88 },
      { el: 'H', x: -1.42, y: -0.74, z: -0.88 },
    ],
    bonds: [
      [0, 1, 1], [1, 2, 2], [1, 3, 1], [3, 4, 1],
      [0, 5, 1], [0, 6, 1], [0, 7, 1],
    ],
  },
  CO3_2minus: {
    atoms: [
      { el: 'C', x:  0.00, y:  0.00, z:  0.00 },
      { el: 'O', x:  0.00, y:  1.28, z:  0.00 },
      { el: 'O', x: -1.11, y: -0.64, z:  0.00 },
      { el: 'O', x:  1.11, y: -0.64, z:  0.00 },
    ],
    bonds: [[0, 1, 2], [0, 2, 1], [0, 3, 1]],
  },
};

// Build a 3D ball-and-stick molecule inside parent group
export function buildMolecule3D(parent, specOrKey, { scale = 0.55, pos = [0, 0, 0], rot = [0, 0, 0], explode = 0.25 } = {}) {
  const spec = typeof specOrKey === 'string' ? CHEM_MOLECULES[specOrKey] : specOrKey;
  const g = new THREE.Group();
  g.position.set(...pos);
  g.rotation.set(...rot);
  parent.add(g);
  if (!spec) return { group: g, atoms: [], bonds: [] };

  const atomMeshes = [];
  const bondRods = [];

  for (let i = 0; i < spec.atoms.length; i++) {
    const a = spec.atoms[i];
    const st = ELEMENT_STYLE[a.el] || { pal: 'ochre', tone: 'hi', r: 0.22 };
    const r = (a.r || st.r) * (scale / 0.55);
    const ax = a.x * scale, ay = a.y * scale, az = a.z * scale;
    const m = part(g, sphere(r, 20), {
      pal: a.pal || st.pal,
      tone: a.tone || st.tone,
      pos: [ax, ay, az],
      ex: [ax * explode, ay * explode, az * explode],
      name: a.name || `${a.el} atom`,
    });
    atomMeshes.push(m);
  }

  for (const [i, j, order = 1] of spec.bonds || []) {
    const a = spec.atoms[i], b = spec.atoms[j];
    const p1 = V(a.x * scale, a.y * scale, a.z * scale);
    const p2 = V(b.x * scale, b.y * scale, b.z * scale);
    const dir = p2.clone().sub(p1);
    const perp = Math.abs(dir.y) < 0.9 ? V(0, 1, 0).cross(dir).normalize() : V(1, 0, 0).cross(dir).normalize();
    const offsets = order === 1 ? [0] : order === 2 ? [-0.045, 0.045] : [-0.07, 0, 0.07];
    for (const off of offsets) {
      const shift = perp.clone().multiplyScalar(off * (scale / 0.55));
      const r = rod(g, { r: (order === 1 ? 0.042 : 0.03) * (scale / 0.55), pal: 'dark', tone: 'mid', name: 'Covalent bond' });
      r.set(p1.clone().add(shift), p2.clone().add(shift));
      bondRods.push(r);
    }
  }

  return { group: g, atoms: atomMeshes, bonds: bondRods };
}

// Deterministic golden-spiral 3D nucleon cluster (protons + neutrons)
export function buildNucleusCluster(parent, maxNucleons = 24, { rNucleon = 0.14, pos = [0, 0, 0] } = {}) {
  const g = new THREE.Group();
  g.position.set(...pos);
  parent.add(g);
  const items = [];
  const phi = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < maxNucleons; i++) {
    const k = i + 0.5;
    const rad = i === 0 ? 0 : Math.cbrt(k) * rNucleon * 1.18;
    const y = 1 - (2 * (i % 13)) / 13;
    const rr = Math.sqrt(Math.max(0, 1 - y * y));
    const th = phi * i;
    const nx = Math.cos(th) * rr * rad;
    const ny = y * rad;
    const nz = Math.sin(th) * rr * rad;
    const isProton = i % 2 === 0;
    const m = part(g, sphere(rNucleon, 16), {
      pal: isProton ? 'red' : 'ochre',
      tone: isProton ? 'hi' : 'mid',
      pos: [nx, ny, nz],
      ex: [nx * 1.6, ny * 1.6, nz * 1.6],
      name: isProton ? 'Proton (+1e)' : 'Neutron (0)',
    });
    items.push({ mesh: m, basePos: V(nx, ny, nz) });
  }

  return {
    group: g,
    items,
    setCounts(Z, N) {
      const total = Math.max(1, Z + N);
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        it.mesh.visible = i < total;
      }
    },
  };
}

// Build a 3D crystal lattice (rock-salt NaCl, diamond, or layered graphite)
export function buildCrystalLattice(parent, { kind = 'nacl', nx = 3, ny = 3, nz = 3, spacing = 0.48, pos = [0, 0, 0] } = {}) {
  const g = new THREE.Group();
  g.position.set(...pos);
  parent.add(g);
  const nodes = [];
  const xOff = ((nx - 1) * spacing) / 2;
  const yOff = ((ny - 1) * spacing) / 2;
  const zOff = ((nz - 1) * spacing) / 2;

  for (let ix = 0; ix < nx; ix++) {
    for (let iy = 0; iy < ny; iy++) {
      for (let iz = 0; iz < nz; iz++) {
        const x = ix * spacing - xOff;
        const y = iy * spacing - yOff;
        const z = iz * spacing - zOff;
        const isA = (ix + iy + iz) % 2 === 0;
        const pal = kind === 'nacl' ? (isA ? 'blue' : 'green') : 'dark';
        const r = kind === 'nacl' ? (isA ? 0.13 : 0.17) : 0.13;
        const m = part(g, sphere(r, 16), {
          pal,
          tone: isA ? 'mid' : 'hi',
          pos: [x, y, z],
          ex: [x * 0.45, y * 0.45, z * 0.45],
          name: kind === 'nacl' ? (isA ? 'Na⁺ cation' : 'Cl⁻ anion') : 'C lattice atom',
        });
        nodes.push({ mesh: m, ix, iy, iz, pos: V(x, y, z), isA });
      }
    }
  }

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j];
      const manhattan = Math.abs(a.ix - b.ix) + Math.abs(a.iy - b.iy) + Math.abs(a.iz - b.iz);
      if (manhattan === 1) {
        const r = rod(g, { r: 0.022, pal: 'paper', tone: 'mid', name: 'Lattice coordination link' });
        r.set(a.pos, b.pos);
      }
    }
  }
  return { group: g, nodes };
}

// Translucent laboratory beaker/cylinder with adjustable liquid meniscus
export function buildBeaker(parent, { r = 0.85, h = 1.6, liquidRatio = 0.6, liquidPal = 'blue', pos = [0, 0, 0], name = 'Reaction vessel' } = {}) {
  const g = new THREE.Group();
  g.position.set(...pos);
  parent.add(g);

  const glass = part(g, cyl(r, h, 28, true), {
    pal: 'paper',
    tone: 'hi',
    pos: [0, h / 2, 0],
    mat: shadeMat('paper', { opacity: 0.28 }),
    ex: [0, 0.35, 0],
    name: `${name} glass wall`,
  });
  const base = part(g, cyl(r, 0.05, 28), {
    pal: 'paper',
    tone: 'mid',
    pos: [0, 0.025, 0],
    name: `${name} base`,
  });
  const liqH = Math.max(0.08, h * liquidRatio);
  const liquid = part(g, cyl(r * 0.94, liqH, 24), {
    pal: liquidPal,
    tone: 'mid',
    pos: [0, liqH / 2 + 0.04, 0],
    mat: shadeMat(liquidPal, { opacity: 0.45 }),
    name: `${name} solution`,
  });

  return {
    group: g,
    glass,
    base,
    liquid,
    setLevel(ratio) {
      const clamped = Math.max(0.05, Math.min(0.92, ratio));
      liquid.scale.y = clamped / Math.max(0.05, liquidRatio);
      liquid.position.y = (h * clamped) / 2 + 0.04;
    },
  };
}

// Studio ruled floor grid matching Atlas paper-and-ink aesthetic
export function studioGrid(root, { x0 = -5, x1 = 48, z0 = -4, z1 = 4, y = 0.001 } = {}) {
  const g = [];
  for (let x = x0; x <= x1; x += 2) g.push(x, y, z0, x, y, z1);
  for (let z = z0; z <= z1; z += 1) g.push(x0, y, z, x1, y, z);
  return lines(root, g, '#e6e6e2');
}

// Gentle Web Audio synthesis helper for opt-in sonification
export function playTone(ctx, { freq = 440, dur = 0.08, type = 'sine', gain = 0.04 } = {}) {
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(Math.max(40, Math.min(2400, freq)), now);
  g.gain.setValueAtTime(gain, now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  osc.connect(g).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + dur + 0.01);
}
