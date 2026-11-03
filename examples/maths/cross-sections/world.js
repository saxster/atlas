// 3D world for Solids of Known Cross-Section: unifies the 2D textbook base-circle diagram and the 3D semicircular dome.
import * as THREE from 'three';
import { V, part, rod, liveTube } from '@saxster/atlas/parts.js';
import { extrudeCrossSections } from '@saxster/atlas/cad_kit.js';
import * as M from './model.js';

export function buildWorld(E) {
  const { scene, asm } = E;
  const root = new THREE.Group();
  scene.add(root);

  const gDome = asm('dome', root, {
    title: 'Semicircular Cross-Section Dome',
    sub: '20 Cavalieri arches of area A(x) = ½π(R² − x²) over the 2D base circle x² + z² ≤ R²',
  });

  const rStar = M.chordRadius(M.SLICE_X0);
  const dome = extrudeCrossSections(gDome, {
    xRange: [-M.R, M.R],
    zLo: x => -M.chordRadius(x),
    zHi: x => M.chordRadius(x),
    count: M.SLICE_COUNT,
    shape: 'semicircle',
    highlightIdx: 13, // slice at x* ≈ +0.60 m
    pal: 'blue',
    highlightPal: 'red',
    poche: true,
    dims: [
      { along: 'x', at: 2.55, ticks: [-2.0, 0.0, 2.0], from: 2.05, side: 1, tickSize: 0.14 },
      { along: 'z', at: -2.65, ticks: [-2.0, 2.0], from: -2.05, side: -1, tickSize: 0.14 },
    ],
    curves: [
      // Highlighted 2D chord strip at x* = 0.60 m on the datum sheet
      { points: [[M.SLICE_X0, -rStar], [M.SLICE_X0, rStar]], color: '#c43b2b' },
      // Coordinate axes on the sheet
      { points: [[-2.35, 0], [2.35, 0]], color: '#9c9ca2' },
      { points: [[0, -2.35], [0, 2.35]], color: '#9c9ca2' },
    ],
    crosshairs: [{ x: 0, z: 0, size: 0.12 }, { x: M.SLICE_X0, z: 0, size: 0.12 }],
    border: [-3.15, -2.55, 2.55, 2.95],
  });

  const gChord = asm('chord', root, {
    title: 'Representative Base Chord 2r(x*)',
    sub: `At x* = ${M.SLICE_X0.toFixed(2)} m, chord radius r(x*) = √(R² − x*²) = ${rStar.toFixed(2)} m`,
  });
  const chordRod = rod(gChord, { r: 0.032, pal: 'red', tone: 'lit', name: '2D base chord 2r(x*)' });
  chordRod.set(V(M.SLICE_X0, 0.02, -rStar), V(M.SLICE_X0, 0.02, rStar));
  const pinGeo = new THREE.SphereGeometry(0.048, 16, 12);
  part(gChord, pinGeo, {
    pal: 'ochre', tone: 'lit', pos: [M.SLICE_X0, 0.02, -rStar], poche: false, name: 'Chord south endpoint (−r)',
  });
  part(gChord, pinGeo, {
    pal: 'ochre', tone: 'lit', pos: [M.SLICE_X0, 0.02, rStar], poche: false, name: 'Chord north endpoint (+r)',
  });
  const apexPin = part(gChord, pinGeo, {
    pal: 'ochre', tone: 'lit', pos: [M.SLICE_X0, 0.04, 0], poche: false, name: 'Arch crest y = r(x*)',
  });

  // 3D hemisphere meridian crest envelope y(x) = lift · √(R² − x²)
  const crestGeo = liveTube(40, 0.015, 8);
  part(gDome, crestGeo, { pal: 'ink', tone: 'hi', poche: false, name: 'Hemisphere meridian crest y = √(R² − x²)' });

  let curState = M.at(0);

  const labels = [
    {
      cls: 'tag',
      leader: true,
      text: () => `Base circle x² + z² = R² (${M.BASE_AREA.toFixed(1)} m²)`,
      anchor: () => V(-1.1, 0.05, -1.1),
      at: () => (curState.clock < 2.0 ? V(-1.25, 0.25 + 0.85 * curState.lift, -1.25) : null),
    },
    {
      cls: 'tag',
      leader: true,
      text: () => `Slice at x = ${curState.sliceX.toFixed(2)} m · A(x) = ${curState.sliceArea.toFixed(2)} m²`,
      anchor: () => V(M.SLICE_X0, 0.15 + 0.85 * curState.lift, 0.45),
      at: () => V(1.15, 0.15 + 0.55 * curState.lift, 1.05),
    },
    {
      cls: 'tag',
      leader: true,
      text: () => `Pochè cut y = +${curState.cutY.toFixed(2)} m · V = ${curState.totalVolume.toFixed(2)} m³`,
      anchor: () => V(-0.6, curState.cutY, -0.4),
      at: () => (curState.clock >= 2.0 ? V(-1.25, 1.35, -1.05) : null),
    },
  ];

  for (const m of dome.sheet?.measurements || []) {
    labels.push({
      cls: 'axis',
      html: m.text,
      at: () => (curState.clock < 2.0 ? m.mid : null),
    });
  }

  function update(s) {
    curState = s;
    dome.setLift(s.lift);
    apexPin.position.y = Math.max(0.04, rStar * s.lift + 0.02);
    const pts = [];
    for (let i = 0; i <= 40; i++) {
      const x = -M.R + (2 * M.R * i) / 40;
      const y = Math.max(0.015, M.chordRadius(x) * s.lift + 0.015);
      pts.push(V(x, y, 0));
    }
    crestGeo.update(pts);
  }

  return { update, labels };
}
