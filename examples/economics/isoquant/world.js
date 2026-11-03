// 3D world for 2D Isoquant-Isocost Chart -> 3D Cobb-Douglas Production Mountain.
import * as THREE from 'three';
import { V, part, sphere } from '@saxster/atlas/bio_kit.js';
import { liveTube } from '@saxster/atlas/parts.js';
import { extrudeContours } from '@saxster/atlas/cad_kit.js';
import * as M from './model.js';

export function buildWorld(E) {
  const { scene, asm } = E;
  const root = new THREE.Group();
  scene.add(root);

  const gMountain = asm('mountain', root, {
    title: 'Cobb–Douglas Production Mountain & Budget Wall',
    sub: '3D output surface Q(L, K) = 10 L⁰·⁵ K⁰·⁵ intersected by the vertical budget plane 10L + 10K = ₹120',
  });

  // Map economic inputs L, K ∈ [0, 12] to world coordinates x, z ∈ [-1.8, 1.8] (scale: 0.3 m per unit of L or K)
  // Output Q ∈ [0, 120] maps to height y ∈ [0, 2.4] (scale: 0.02 m per unit of Q, so Q* = 60 -> y = 1.20 m)
  const toWorld = u => -1.8 + u * 0.3;
  const fromWorld = x => Math.max(0, (x + 1.8) / 0.3);

  // Build 2D isoquant hyperbolas K = (Q / 10)² / L on the datum sheet for Q ∈ {35, 60, 85}
  const isoCurves = [35, 60, 85].map(qLevel => {
    const pts = [];
    const prodLK = (qLevel / M.A_TFP) ** 2;
    for (let i = 0; i <= 40; i++) {
      const L = 1.2 + (10.5 * i) / 40;
      const K = prodLK / L;
      if (K >= 0.8 && K <= 11.8) pts.push([toWorld(L), toWorld(K)]);
    }
    return { points: pts, color: qLevel === 60 ? '#18181a' : '#86868c' };
  });

  // Isocost line L + K = 12 (from (0, 12) to (12, 0)) -> in world coordinates (-1.8, 1.8) to (1.8, -1.8)
  const prod = extrudeContours(gMountain, {
    xRange: [-1.8, 1.8],
    zRange: [-1.8, 1.8],
    res: 36,
    fn: (x, z) => 0.02 * M.outputQ(fromWorld(x), fromWorld(z)),
    pal: 'blue',
    constraintPal: 'red',
    poche: true,
    constraint: {
      x0: toWorld(0.5), z0: toWorld(11.5),
      x1: toWorld(11.5), z1: toWorld(0.5),
      height: 1.65,
      name: 'Isocost wall (wL + rK = ₹120)',
    },
    dims: [
      { along: 'x', at: 2.05, ticks: [-1.8, 0.0, 1.8], from: 1.8, side: 1, tickSize: 0.13, fmt: sp => `ΔL = ${(sp / 0.3).toFixed(0)}` },
      { along: 'z', at: -2.05, ticks: [-1.8, 1.8], from: -1.8, side: -1, tickSize: 0.13, fmt: sp => `ΔK = ${(sp / 0.3).toFixed(0)}` },
    ],
    curves: [
      ...isoCurves,
      { points: [[toWorld(0.5), toWorld(11.5)], [toWorld(11.5), toWorld(0.5)]], color: '#c43b2b' },
    ],
    crosshairs: [{ x: toWorld(M.L_STAR), z: toWorld(M.K_STAR), size: 0.16 }],
    border: [-2.55, -2.0, 2.35, 2.35],
  });

  // 3D tangency marker sphere at (L*, K*, Q*) = (6, 6, 60) -> (0, 1.20 * elev, 0)
  const gOptimum = asm('optimum', root, {
    title: 'Cost-Minimising / Output-Maximising Tangency Point',
    sub: 'At (L* = 6, K* = 6), MRTS = MP_L / MP_K = w / r = 1.00 and Q* = 60 units',
  });
  const optMarker = part(gOptimum, sphere(0.11, 20), {
    pal: 'ochre', tone: 'lit', pos: [0, 0.06, 0], poche: false, name: 'Optimal bundle (L* = 6, K* = 6, Q* = 60)',
  });

  // 3D elevated isoquant contour tubes on the production mountain + 3D budget ridge curve
  const isoTubes = [35, 60, 85].map((qLevel, idx) => {
    const geo = liveTube(isoCurves[idx].points.length - 1, qLevel === 60 ? 0.016 : 0.011, 8);
    part(gMountain, geo, {
      pal: qLevel === 60 ? 'ochre' : 'ink',
      tone: qLevel === 60 ? 'lit' : 'mid',
      poche: false,
      name: `3D Isoquant contour Q = ${qLevel}`,
    });
    return { qLevel, pts2d: isoCurves[idx].points, geo };
  });
  const ridgeGeo = liveTube(40, 0.016, 8);
  part(gOptimum, ridgeGeo, {
    pal: 'red', tone: 'lit', poche: false, name: 'Budget constraint ridge Q(L, 12 − L)',
  });

  let curState = M.at(0);

  const labels = [
    {
      cls: 'tag',
      leader: true,
      text: () => `Tangency (L* = 6, K* = 6) · MRTS = w/r = 1.00`,
      anchor: () => V(0, 0.06 + 1.14 * curState.elev, 0),
      at: () => V(-1.15, 0.25 + 1.05 * curState.elev, 1.25),
    },
    {
      cls: 'tag',
      leader: true,
      text: () => `Isocost wall wL + rK = ₹${M.BUDGET_C.toFixed(0)}`,
      anchor: () => V(0.9, 0.2 + 0.65 * curState.elev, -0.9),
      at: () => (curState.clock < 2.0 ? V(1.15, 0.25 + 0.75 * curState.elev, -1.15) : null),
    },
    {
      cls: 'tag',
      leader: true,
      text: () => `Pochè isoquant cut Q* = ${M.Q_STAR.toFixed(0)} units`,
      anchor: () => V(0.55, 1.20, 0.55),
      at: () => (curState.clock >= 2.0 ? V(1.15, 1.15, 1.25) : null),
    },
  ];

  for (const m of prod.sheet?.measurements || []) {
    labels.push({
      cls: 'axis',
      html: m.text,
      at: () => (curState.clock < 2.0 ? m.mid : null),
    });
  }

  function update(s) {
    curState = s;
    prod.setElevation(s.elev);
    optMarker.position.y = 0.04 + 1.16 * s.elev;
    for (const { qLevel, pts2d, geo } of isoTubes) {
      const y = 0.02 * qLevel * s.elev + 0.014;
      geo.update(pts2d.map(([x, z]) => V(x, y, z)));
    }
    const ridgePts = [];
    for (let i = 0; i <= 40; i++) {
      const L = 0.5 + (11.0 * i) / 40;
      const K = 12.0 - L;
      const y = 0.02 * M.outputQ(L, K) * s.elev + 0.018;
      ridgePts.push(V(toWorld(L), y, toWorld(K)));
    }
    ridgeGeo.update(ridgePts);
  }

  return { update, labels };
}
