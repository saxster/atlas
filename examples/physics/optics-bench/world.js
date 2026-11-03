// 3D world for Thin-Lens Ray Diagram -> 3D Cutaway Optical Bench.
// Unifies the 2D textbook principal-ray schematic and the 3D revolved biconvex lens + brass mount.
import * as THREE from 'three';
import { V, part, cyl, arrow, setArrow, liveTube, shadeMat } from '@saxster/atlas/parts.js';
import { revolveSection, bevelBox } from '@saxster/atlas/cad_kit.js';
import * as M from './model.js';

export function buildWorld(E) {
  const { scene, asm } = E;
  const root = new THREE.Group();
  scene.add(root);

  const yAxis = 1.05; // Optical centerline height in 3D

  const gBench = asm('bench', root, {
    title: 'Revolved Biconvex Lens & Brass Mount',
    sub: '2D meridional lens cross-section revolved 270° around the optical axis (f = 1.30 m)',
  });

  // 1. Revolve the 2D biconvex lens profile into a 270° cutaway 3D glass lens + outer brass mount ring
  const lensProfile = [
    [-0.04, 0.0],
    [-0.18, 0.35],
    [-0.14, 0.72],
    [-0.06, 0.98],
    [0.06, 0.98],
    [0.14, 0.72],
    [0.18, 0.35],
    [0.04, 0.0],
  ];
  const lens = revolveSection(gBench, {
    axis: 'x',
    yCenter: yAxis,
    maxAngle: Math.PI * 1.5,
    profile: lensProfile,
    pal: 'blue',
    tone: 'hi',
    opacity: 0.42,
    poche: false,
    name: 'Biconvex glass lens (f = 1.30 m)',
    dims: [
      { along: 'x', at: 1.75, ticks: [-M.DO_START, -M.F, 0, M.F, M.DO_START], from: 1.25, side: 1, tickSize: 0.14 },
    ],
    curves: [
      // Principal optical axis on the 2D datum sheet
      { points: [[-3.2, 0], [4.1, 0]], color: '#86868c' },
      // Principal lens plane x = 0 on the 2D datum sheet
      { points: [[0, -1.15], [0, 1.15]], color: '#18181a' },
    ],
    crosshairs: [
      { x: -M.DO_START, z: 0, size: 0.12 },
      { x: -M.F, z: 0, size: 0.14 },
      { x: M.F, z: 0, size: 0.14 },
      { x: M.DO_START, z: 0, size: 0.12 },
    ],
    border: [-3.4, -1.75, 4.3, 2.15],
  });

  // Outer brass lens barrel rim (270° cutaway hollow ring with pochè)
  const rim = revolveSection(gBench, {
    axis: 'x',
    yCenter: yAxis,
    maxAngle: Math.PI * 1.5,
    outer: [[-0.12, 1.08], [0.12, 1.08]],
    inner: [[-0.12, 0.98], [0.12, 0.98]],
    pal: 'ochre',
    tone: 'hi',
    poche: true,
    sheet: false,
    name: 'Brass lens barrel mount',
  });

  // Machined 3D optical bench rail, focal index pins, and sliding carriers
  part(gBench, bevelBox(7.5, 0.07, 0.22, 0.012, 2), {
    pal: 'ink', tone: 'mid', pos: [0.45, -0.045, 0], poche: false, name: 'Precision optical bench rail',
  });
  part(gBench, cyl(0.035, 0.06, 16), {
    pal: 'ochre', tone: 'hi', pos: [-M.F, 0.03, 0], poche: false, name: 'Front focal pin (−F)',
  });
  part(gBench, cyl(0.035, 0.06, 16), {
    pal: 'ochre', tone: 'hi', pos: [M.F, 0.03, 0], poche: false, name: 'Rear focal pin (+F)',
  });
  const objCarrier = part(gBench, bevelBox(0.22, 0.06, 0.32, 0.01, 2), {
    pal: 'ochre', tone: 'mid', pos: [-M.DO_START, -0.02, 0], poche: false, name: 'Sliding object carrier',
  });
  const imgCarrier = part(gBench, bevelBox(0.22, 0.06, 0.32, 0.01, 2), {
    pal: 'ochre', tone: 'mid', pos: [M.DO_START, -0.02, 0], poche: false, name: 'Sliding image screen carrier',
  });
  const screenGlass = part(gBench, bevelBox(0.025, 1.35, 0.85, 0.006, 1), {
    mat: shadeMat('paper', { opacity: 0.26 }),
    pos: [M.DO_START + 0.09, yAxis, 0],
    poche: false,
    name: 'Ground-glass image screen',
  });

  // 2. 3D Object and Inverted Real Image arrows + Principal Rays
  const gRays = asm('rays', root, {
    title: 'Principal Construction Rays & Real Image',
    sub: 'Parallel, central, and focal rays converging at d_i = f d_o / (d_o − f)',
  });
  const objArrow = arrow(gRays, 'green', { r: 0.032, head: 0.15, headR: 0.08, name: 'Object h_o' });
  const imgArrow = arrow(gRays, 'red', { r: 0.032, head: 0.15, headR: 0.08, name: 'Real image h_i' });

  const ray1Geo = liveTube(2, 0.018, 8);
  const ray2Geo = liveTube(2, 0.018, 8);
  const ray3Geo = liveTube(2, 0.018, 8);
  part(gRays, ray1Geo, { pal: 'ochre', tone: 'lit', poche: false, name: 'Parallel ray -> F' });
  part(gRays, ray2Geo, { pal: 'red', tone: 'lit', poche: false, name: 'Central ray through optical centre' });
  part(gRays, ray3Geo, { pal: 'blue', tone: 'lit', poche: false, name: 'Focal ray through −F -> parallel' });

  let curState = M.at(0);

  const labels = [
    {
      cls: 'tag',
      leader: true,
      text: () => `Object d_o = ${curState.doDist.toFixed(2)} m`,
      anchor: () => V(-curState.doDist, yAxis * curState.sweep, -M.H_OBJ * (1 - curState.sweep)),
      at: () => V(-curState.doDist + 0.2, 0.25 + 1.25 * curState.sweep, -1.05),
    },
    {
      cls: 'tag',
      leader: true,
      text: () => `Lens f = ${M.F.toFixed(2)} m`,
      anchor: () => V(0, yAxis * curState.sweep, 0.98),
      at: () => (curState.clock >= 1.0 && curState.clock < 2.0 ? V(0.0, 2.05, -0.35) : null),
    },
    {
      cls: 'tag',
      leader: true,
      text: () => `Real image d_i = ${curState.diDist.toFixed(2)} m (|M| = ${curState.absMag.toFixed(2)}×)`,
      anchor: () => V(curState.diDist, yAxis * curState.sweep, 0.0),
      at: () => V(Math.min(2.6, curState.diDist - 0.35), 0.15 + 0.15 * curState.sweep, 0.85),
    },
  ];

  for (const m of lens.sheet?.measurements || []) {
    labels.push({
      cls: 'axis',
      html: m.text,
      at: () => (curState.clock < 2.0 ? m.mid : null),
    });
  }

  function update(s) {
    curState = s;
    lens.setSweep(s.sweep);
    rim.setSweep(s.sweep);

    // Blend ray plane from horizontal XZ blueprint plane (s.sweep = 0) to vertical XY optical bench (s.sweep = 1)
    const y0 = yAxis * s.sweep;
    const tipPt = (x, h) => V(x, y0 + h * s.sweep, -h * (1 - s.sweep));
    const baseObj = V(-s.doDist, y0, 0);
    const tipObj = tipPt(-s.doDist, s.hObj);
    const baseImg = V(s.diDist, y0, 0);
    const tipImg = tipPt(s.diDist, s.hImg);

    setArrow(objArrow, baseObj, tipObj.clone().sub(baseObj));
    setArrow(imgArrow, baseImg, tipImg.clone().sub(baseImg));

    ray1Geo.update([tipObj, tipPt(0, s.hObj), tipImg]);
    ray2Geo.update([tipObj, V(0, y0, 0), tipImg]);
    ray3Geo.update([tipObj, tipPt(0, s.hImg), tipImg]);

    objCarrier.position.x = -s.doDist;
    imgCarrier.position.x = s.diDist;
    screenGlass.position.set(s.diDist + 0.09, y0, 0);
    screenGlass.scale.y = Math.max(0.02, s.sweep);
    screenGlass.visible = s.sweep > 0.05;
  }

  return { update, labels };
}
