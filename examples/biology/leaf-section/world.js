// 3D world for 2D Leaf Histology Slide -> 3D Living Leaf Cutaway.
import * as THREE from 'three';
import { V, part, cyl, arrow, setArrow } from '@saxster/atlas/parts.js';
import { extrudeLayers } from '@saxster/atlas/bio_kit.js';
import * as M from './model.js';

export function buildWorld(E) {
  const { scene, asm } = E;
  const root = new THREE.Group();
  scene.add(root);

  const gLeaf = asm('leaf', root, {
    title: 'Stratified Leaf Tissue Block (220 µm)',
    sub: 'Upper cuticle/epidermis (20 µm), palisade columns (80 µm), spongy air labyrinth (90 µm), and lower stoma (30 µm)',
  });

  // Scene scale: 1.0 scene unit = 100 µm (so 2.20 scene units = 220 µm leaf thickness)
  const leaf = extrudeLayers(gLeaf, {
    width: 3.6,
    depth: 2.6,
    poche: true,
    layers: [
      {
        name: 'Lower epidermis & guard-cell stoma (30 µm)',
        y0: 0.0,
        y1: 0.30,
        pal: 'ochre',
        tone: 'mid',
        gapX: -0.6,
        gapWidth: 0.52,
      },
      {
        name: 'Spongy mesophyll & air labyrinth (90 µm)',
        y0: 0.30,
        y1: 1.20,
        pal: 'paper',
        tone: 'hi',
        gapX: -0.6,
        gapWidth: 0.72,
        cutouts: [
          [-1.55, -0.35, 0.15, 1.35],
          [0.35, -0.95, 1.45, 1.35],
        ],
      },
      {
        name: 'Palisade mesophyll back wall (80 µm)',
        y0: 1.20,
        y1: 2.00,
        z0: -1.30,
        z1: -0.92,
        pal: 'green',
        tone: 'mid',
      },
      {
        name: 'Upper epidermis & waxy cuticle (20 µm)',
        y0: 2.00,
        y1: 2.20,
        pal: 'ochre',
        tone: 'hi',
        cutouts: [[-1.55, -0.25, 1.55, 1.35]],
      },
    ],
    columns: [
      { name: 'Palisade chlorenchyma column', nx: 6, nz: 3, r: 0.21, y0: 1.20, y1: 1.99, pal: 'green', tone: 'hi' },
    ],
    tubes: [
      { name: 'Xylem vessel (water highway)', x: 0.88, y: 0.88, r: 0.22, pal: 'blue', tone: 'hi' },
      { name: 'Phloem sieve tube (sucrose export)', x: 0.88, y: 0.50, r: 0.16, pal: 'red', tone: 'hi' },
    ],
    dims: [
      { along: 'x', at: 1.85, ticks: [-1.8, 1.8], from: 1.4, side: 1, tickSize: 0.14, unit: 'µm', scale: 100, decimals: 0 },
      { along: 'z', at: -2.15, ticks: [-1.3, -0.1, 0.7, 0.9], from: -1.85, side: -1, tickSize: 0.12, minSpan: 0.18, unit: 'µm', scale: 100, decimals: 0 },
    ],
    circles: [
      { x: 0.85, z: 0.0, r: 0.32, color: '#1971c2' },
      { x: -0.6, z: 0.0, r: 0.24, color: '#2b8a3e' },
    ],
    border: [-2.55, -1.95, 2.35, 2.25],
  });

  // Paired 3D guard cells flanking the stomatal pore at x = -0.6 that part as s.apertureUm opens
  const guardLeft = part(gLeaf, cyl(0.085, 2.35, 16), {
    pal: 'green', tone: 'hi', pos: [-0.74, 0.15, 0], rot: [Math.PI / 2, 0, 0], poche: true, name: 'Left stomatal guard cell',
  });
  const guardRight = part(gLeaf, cyl(0.085, 2.35, 16), {
    pal: 'green', tone: 'hi', pos: [-0.46, 0.15, 0], rot: [Math.PI / 2, 0, 0], poche: true, name: 'Right stomatal guard cell',
  });

  // 3D Photon absorption arrow (top down into palisade) + CO2 stomatal diffusion arrow (bottom up through stoma)
  const gFlux = asm('flux', root, {
    title: 'PAR Photon Capture & Stomatal CO₂ Flux',
    sub: 'Beer–Lambert light absorption I(z) = I₀e⁻ᵘᶻ and Fickian gas diffusion J = g_s(C_a − C_i)',
  });
  const photonArrow = arrow(gFlux, 'ochre', { r: 0.032, head: 0.16, headR: 0.08, name: 'Incident PAR photon beam' });
  const co2Arrow = arrow(gFlux, 'blue', { r: 0.032, head: 0.16, headR: 0.08, name: 'Stomatal CO₂ diffusion flux' });
  setArrow(photonArrow, V(-0.6, 2.75, 0.0), V(0, -0.95, 0));
  setArrow(co2Arrow, V(-0.6, -0.45, 0.0), V(0, 1.35, 0));

  let curState = M.at(0);

  const labels = [
    {
      cls: 'tag',
      leader: true,
      text: () => `Palisade (80 µm · ${M.PALISADE_ABSORPTION_PCT.toFixed(1)}% PAR absorbed)`,
      anchor: () => V(-0.9, 1.65, -0.6),
      at: () => (curState.clock < 2.0 ? V(-1.15, 1.75, -0.95) : null),
    },
    {
      cls: 'tag',
      leader: true,
      text: () => `Xylem & phloem vein (90 µm spongy zone)`,
      anchor: () => V(0.85, 0.75, 0.5),
      at: () => (curState.clock < 2.0 ? V(1.15, 0.55, 0.85) : null),
    },
    {
      cls: 'tag',
      leader: true,
      text: () => `Stoma w = ${curState.apertureUm.toFixed(0)} µm · J_CO₂ = ${curState.flux.toFixed(1)} µmol/m²s`,
      anchor: () => V(-0.6, 0.15, 0.8),
      at: () => (curState.clock >= 2.0 ? V(-1.05, 0.35, 1.25) : null),
    },
  ];

  for (const m of leaf.sheet?.measurements || []) {
    labels.push({
      cls: 'axis',
      html: m.text,
      at: () => (curState.clock < 2.0 ? m.mid : null),
    });
  }

  function update(s) {
    curState = s;
    leaf.setDepth(1.0);
    const halfGap = 0.095 + (s.apertureUm / 12) * 0.085;
    guardLeft.position.x = -0.6 - halfGap;
    guardRight.position.x = -0.6 + halfGap;
    gFlux.visible = s.clock >= 2.0;
  }

  return { update, labels };
}
