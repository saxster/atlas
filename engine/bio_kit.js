// Shared 3D biological & anatomical kit built on Atlas's paper-and-ink parts, prims, kinematics, and motion.
import * as THREE from 'three';
import { part, box, cyl, lines, arrow, setArrow, rod, liveTube, gear, spring, shadeMat, V, xAxis, zAxis } from './parts.js';
import * as prims from './prims.js';
import * as K from './kinematics.js';
import * as motion from './motion.js';
export * from './cad_kit.js';

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
    // α-D-glucopyranose in realistic 4C1 chair conformation (alternating ±z ring pucker + axial α-O1 + equatorial O2,O3,O4,C6)
    atoms: [
      ['C', 1.42, 0.00, -0.24], ['C', 0.71, 1.26, 0.24], ['C', -0.71, 1.26, -0.24],
      ['C', -1.42, 0.00, 0.24], ['C', -0.71, -1.22, -0.24], ['O', 0.66, -1.18, 0.22],
      ['C', -1.42, -2.48, 0.18], ['O', 1.48, -0.04, -1.66], ['O', 1.38, 2.42, -0.22],
      ['O', -1.38, 2.42, 0.22], ['O', -2.78, 0.00, -0.18], ['O', -2.76, -2.48, -0.28],
    ],
    bonds: [
      [0, 1, 1], [1, 2, 1], [2, 3, 1], [3, 4, 1], [4, 5, 1], [5, 0, 1],
      [4, 6, 1], [0, 7, 1], [1, 8, 1], [2, 9, 1], [3, 10, 1], [6, 11, 1],
    ],
  },
  atpCore: {
    // Complete Adenosine 5'-Triphosphate (bicyclic adenine purine + β-D-ribofuranose ring + α,β,γ-triphosphate chain)
    atoms: [
      // Adenine bicyclic purine (0..9)
      ['N', -2.05, 0.42, 0.05],  // 0: N9
      ['C', -2.82, 1.54, 0.15],  // 1: C8
      ['N', -4.10, 1.24, 0.12],  // 2: N7
      ['C', -4.12, -0.12, 0.00], // 3: C5
      ['C', -2.82, -0.64, -0.04],// 4: C4
      ['C', -5.18, -1.04, -0.08],// 5: C6
      ['N', -6.46, -0.68, -0.06],// 6: N6 (exocyclic amino)
      ['N', -4.88, -2.35, -0.18],// 7: N1
      ['C', -3.58, -2.72, -0.20],// 8: C2
      ['N', -2.52, -1.92, -0.14],// 9: N3
      // β-D-ribofuranose ring + 2',3'-diol + C5' (10..17)
      ['C', -0.60, 0.48, 0.08],  // 10: C1'
      ['O', 0.02, -0.78, 0.25],  // 11: O4'
      ['C', -0.02, 1.42, 1.14],  // 12: C2'
      ['O', -0.58, 2.70, 1.02],  // 13: O2'
      ['C', 1.42, 1.24, 0.82],   // 14: C3'
      ['O', 2.22, 2.28, 1.34],   // 15: O3'
      ['C', 1.38, -0.22, 0.42],  // 16: C4'
      ['C', 2.18, -0.68, -0.78], // 17: C5'
      // α, β, γ-Triphosphate chain (18..27)
      ['O', 3.54, -0.32, -0.58], // 18: O5'
      ['P', 4.68, -0.58, 0.52],  // 19: Pα
      ['O', 4.22, -1.78, 1.38],  // 20: Oα1
      ['O', 4.92, 0.72, 1.28],   // 21: Oα2
      ['O', 5.98, -0.98, -0.32], // 22: Oαβ bridge
      ['P', 7.36, -0.62, 0.38],  // 23: Pβ
      ['O', 7.32, 0.82, 0.88],   // 24: Oβ1
      ['O', 7.62, -1.68, 1.44],  // 25: Oβ2
      ['O', 8.46, -0.78, -0.78], // 26: Oβγ bridge
      ['P', 9.88, -0.32, -0.32], // 27: Pγ
      ['O', 9.92, 1.16, -0.02],  // 28: Oγ1
      ['O', 10.32, -1.18, 0.86], // 29: Oγ2
      ['O', 10.76, -0.66, -1.52],// 30: Oγ3
    ],
    bonds: [
      [0, 1, 1], [1, 2, 2], [2, 3, 1], [3, 4, 2], [4, 0, 1],
      [3, 5, 1], [5, 6, 1], [5, 7, 2], [7, 8, 1], [8, 9, 2], [9, 4, 1],
      [0, 10, 1], [10, 11, 1], [10, 12, 1], [12, 13, 1], [12, 14, 1],
      [14, 15, 1], [14, 16, 1], [16, 11, 1], [16, 17, 1], [17, 18, 1],
      [18, 19, 1], [19, 20, 2], [19, 21, 1], [19, 22, 1], [22, 23, 1],
      [23, 24, 2], [23, 25, 1], [23, 26, 1], [26, 27, 1], [27, 28, 2],
      [27, 29, 1], [27, 30, 1],
    ],
  },
  peptide: {
    // Planar trans-dipeptide backbone (N-Cα-C(=O)-NH-Cα-C(=O)O) with L-sidechain Cβ carbons
    atoms: [
      ['N', -2.35, -0.18, 0.12], ['C', -1.08, 0.52, 0.04], ['C', 0.08, -0.44, -0.02],
      ['O', -0.12, -1.66, -0.08], ['N', 1.32, 0.08, 0.02], ['C', 2.52, -0.74, -0.04],
      ['C', -1.04, 1.52, -1.12], ['C', 2.64, -1.68, 1.16], ['C', 3.74, 0.16, -0.12],
      ['O', 4.86, -0.36, -0.18],
    ],
    bonds: [
      [0, 1, 1], [1, 2, 1], [2, 3, 2], [2, 4, 1], [4, 5, 1],
      [1, 6, 1], [5, 7, 1], [5, 8, 1], [8, 9, 2],
    ],
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

// 3D Double Helix segment with realistic B-DNA major/minor groove asymmetry (~123° glycosidic offset) and base-pair rungs
export function buildHelix(parent, { turns = -1.6, rungs = 14, radius = 0.55, height = 2.6, grooveAngle = 2.15, x0 = 0, y0 = 1.4, z0 = 0, palA = 'blue', palB = 'ochre', name = 'B-DNA double helix' } = {}) {
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
    ptsB.push(V(radius * Math.cos(ang + grooveAngle), y, radius * Math.sin(ang + grooveAngle)));
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
    const pA = V(radius * 0.92 * Math.cos(ang), y, radius * 0.92 * Math.sin(ang));
    const pB = V(radius * 0.92 * Math.cos(ang + grooveAngle), y, radius * 0.92 * Math.sin(ang + grooveAngle));
    const mid = pA.clone().lerp(pB, 0.54); // purine slightly longer than pyrimidine across Watson-Crick H-bond bridge
    const r1 = rod(g, { r: 0.032, pal: rungPals[k % 4], tone: 'mid', ex: [0, 0.2, 0], name: 'Purine base rung' });
    r1.set(pA, mid);
    const r2 = rod(g, { r: 0.032, pal: rungPals[(k + 1) % 4], tone: 'mid', ex: [0, -0.2, 0], name: 'Pyrimidine base rung' });
    r2.set(mid, pB);
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

// Gentle Web Audio helper for biological sonification (consolidated in engine/sound.js)
export { playTone, playBoop, playClick, playKnock, createHum } from './sound.js';
