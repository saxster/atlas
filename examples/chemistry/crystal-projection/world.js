// 3D world for 2D (001) Unit-Cell Plan -> 3D Rock-Salt (NaCl) Crystal & Bragg Diffraction.
import * as THREE from 'three';
import { V, part, box, rod, lines, shadeMat, arrow, setArrow, PALETTE } from '@saxster/atlas/parts.js';
import { buildCrystalLattice, buildSheet } from '@saxster/atlas/chem_kit.js';
import * as M from './model.js';

export function buildWorld(E) {
  const { scene, asm } = E;
  const root = new THREE.Group();
  scene.add(root);

  const gCrystal = asm('crystal', root, {
    title: 'Rock-Salt (NaCl) FCC Unit Cell',
    sub: '4 Na⁺ + 4 Cl⁻ ions per unit cell (a₀ = 5.64 Å, ρ = 2.165 g/cm³)',
  });

  // 1. 2D Crystallographic (001) Plan Sheet on the XZ datum plane (unit cell spans [-1.2, 1.2] in scene units = 5.64 Å)
  const S = 1.2; // half-cell width (2.4 scene units = 5.64 Å)
  const scaleAngstrom = M.A0_ANGSTROM / (2 * S);
  const sheet = buildSheet(gCrystal, {
    dims: [
      { along: 'x', at: 1.85, ticks: [-S, 0, S], from: S + 0.15, side: 1, tickSize: 0.14, unit: 'Å', scale: scaleAngstrom, decimals: 2 },
      { along: 'z', at: -1.85, ticks: [-S, S], from: -S - 0.15, side: -1, tickSize: 0.14, unit: 'Å', scale: scaleAngstrom, decimals: 2 },
    ],
    curves: [
      { points: [[-S, -S], [S, -S], [S, S], [-S, S]], closed: true, color: '#18181a' },
      { points: [[-S, 0], [S, 0]], color: '#9c9ca2' },
      { points: [[0, -S], [0, S]], color: '#9c9ca2' },
    ],
    circles: [
      { x: 0, z: 0, r: 0.28, color: '#2b8a3e' },
      { x: -S, z: -S, r: 0.28, color: '#2b8a3e' },
      { x: S, z: -S, r: 0.28, color: '#2b8a3e' },
      { x: S, z: S, r: 0.28, color: '#2b8a3e' },
      { x: -S, z: S, r: 0.28, color: '#2b8a3e' },
    ],
    border: [-2.35, -1.85, 2.05, 2.25],
  });

  // 2. 3D 3×3×3 NaCl Rock-Salt Crystal Lattice sitting on the datum sheet (y = 0.18 .. 2.58)
  buildCrystalLattice(gCrystal, {
    kind: 'nacl',
    nx: 3, ny: 3, nz: 3,
    spacing: S,
    pos: [0, S + 0.18, 0],
  });
  // Enable section-cut pochè on all ion spheres & coordination rods
  gCrystal.traverse(o => {
    if (o.isMesh) o.userData.poche = true;
  });

  // 12 wireframe edges of the primary a₀ × a₀ × a₀ cubic unit cell
  const yBot = 0.18, yTop = 0.18 + 2 * S;
  lines(gCrystal, [
    -S, yBot, -S, S, yBot, -S,  S, yBot, -S, S, yBot, S,  S, yBot, S, -S, yBot, S,  -S, yBot, S, -S, yBot, -S,
    -S, yTop, -S, S, yTop, -S,  S, yTop, -S, S, yTop, S,  S, yTop, S, -S, yTop, S,  -S, yTop, S, -S, yTop, -S,
    -S, yBot, -S, -S, yTop, -S, S, yBot, -S, S, yTop, -S, S, yBot, S, S, yTop, S,   -S, yBot, S, -S, yTop, S,
  ], PALETTE.ink[0], 0.72);

  // 3. (200) Bragg diffraction planes (y = 0.18, y = 1.38) + incident & reflected X-ray beams
  const gBragg = asm('bragg', root, {
    title: '(200) Bragg Diffraction Planes',
    sub: 'Half-cell spacing d₂₀₀ = a₀/2 = 2.82 Å reflecting Cu Kα X-rays at θ = 15.87°',
  });
  const planeMat = shadeMat('ochre', { opacity: 0.28 });
  part(gBragg, box(2.5, 0.02, 2.5, 0.002), {
    pal: 'ochre', tone: 'mid', mat: planeMat, pos: [0, 1.38, 0], poche: false, name: '(200) Bragg plane (z = ½)',
  });
  part(gBragg, box(2.5, 0.02, 2.5, 0.002), {
    pal: 'ochre', tone: 'mid', mat: planeMat, pos: [0, 0.18, 0], poche: false, name: '(100) Basal plane (z = 0)',
  });
  const dSpacingRod = rod(gBragg, { r: 0.018, pal: 'ochre', tone: 'lit', name: 'Interplanar spacing d₂₀₀ = 2.82 Å' });
  dSpacingRod.set(V(-1.15, 0.18, 1.15), V(-1.15, 1.38, 1.15));
  const xrayIn = arrow(gBragg, 'red', { r: 0.028, head: 0.15, headR: 0.075, name: 'Incident X-ray beam (λ = 1.54 Å)' });
  const xrayOut = arrow(gBragg, 'red', { r: 0.028, head: 0.15, headR: 0.075, name: 'Diffracted X-ray beam (θ = 15.9°)' });
  setArrow(xrayIn, V(-1.85, 2.05, 0.85), V(1.65, -0.67, 0));
  setArrow(xrayOut, V(-0.2, 1.38, 0.85), V(1.65, 0.67, 0));

  let curState = M.at(0);

  const labels = [
    {
      cls: 'tag',
      leader: true,
      text: () => `Basal (001) layer · a₀ = ${M.A0_ANGSTROM.toFixed(2)} Å`,
      anchor: () => V(-S, 0.18, -S),
      at: () => (curState.clock < 1.0 ? V(-1.15, 0.25, -1.15) : null),
    },
    {
      cls: 'tag',
      leader: true,
      text: () => `FCC NaCl unit cell (Z = 4 · ρ = ${M.DENSITY_NACL.toFixed(2)} g/cm³)`,
      anchor: () => V(S, 1.38, S),
      at: () => (curState.clock >= 1.0 && curState.clock < 2.0 ? V(1.25, 1.65, 1.35) : null),
    },
    {
      cls: 'tag',
      leader: true,
      text: () => `(200) Bragg plane · d₂₀₀ = ${M.D_200.toFixed(2)} Å (θ = ${M.THETA_200.toFixed(1)}°)`,
      anchor: () => V(-0.2, 1.38, 0.85),
      at: () => (curState.clock >= 2.0 ? V(-0.95, 0.85, 1.55) : null),
    },
  ];

  for (const m of sheet.measurements || []) {
    labels.push({
      cls: 'axis',
      html: m.text,
      at: () => (curState.clock < 2.0 ? m.mid : null),
    });
  }

  function update(s) {
    curState = s;
    gBragg.visible = s.clock >= 2.0;
  }

  return { update, labels };
}
