// Ch 9 · Compass Loci, 3-Figure Bearings & 3D Polyhedra — 3D Interactive Mathematics Atlas chapter.
import { SUBJECT } from '../subject.js';
import * as EKit from '../../../engine/math_kit.js';
import * as M from './model.js';

export const PAGES = [
  {
    tab: 'Rhombus Bisector',
    fig: 'Figure 9.1 · Why Two Equal-Radius Compass Arcs Bisect AB at 90°',
    title: 'Why Two Equal-Radius Compass Arcs Bisect AB at 90°',
    alt: 'Equal compass circles from A and B intersecting at P and Q to form a rhombus APBQ whose diagonals meet at 90°.',
    body: ['Equal compass circles from A and B intersecting at P and Q to form a rhombus APBQ whose diagonals meet at 90°.'],
    cam: { target: [0, 0.15, 0], az: 16, el: 20, dist: 5.8 },
    lit: 'bisector_line',
    parts: ['compass_arcs', 'bisector_line'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: '3-Figure Bearings',
    fig: 'Figure 9.2 · Clockwise North Bearings & Why Back-Bearings Differ by 180°',
    title: 'Clockwise North Bearings & Why Back-Bearings Differ by 180°',
    alt: 'Twin North compass towers at A and B with forward bearing θ and reflex back-bearing θ + 180°.',
    body: ['Twin North compass towers at A and B with forward bearing θ and reflex back-bearing θ + 180°.'],
    cam: { target: [0, 0.15, 0], az: 2, el: 20, dist: 5.8 },
    lit: 'bearing_ray',
    parts: ['north_posts', 'bearing_ray'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Euler V − E + F = 2',
    fig: "Figure 9.3 · Folding 2D Nets into 3D Polyhedra & Euler's Characteristic",
    title: "Folding 2D Nets into 3D Polyhedra & Euler's Characteristic",
    alt: '3D polyhedron wireframe and folding faces verifying V − E + F = 2.',
    body: ['3D polyhedron wireframe and folding faces verifying V − E + F = 2.'],
    cam: { target: [0, 0.15, 0], az: -12, el: 20, dist: 5.8 },
    lit: 'poly_net',
    parts: ['poly_net'],
    look: { xray: 0, section: 0 },
  }
];

export const PLATES = {
  compass_arcs: {
    title: 'Equal-Radius Rhombus Sides (|PA| = |PB| = |QA| = |QB| = r)',
    text: 'Sweeping the same compass opening r from A and B guarantees all 4 sides of APBQ are equal — a rhombus!',
    facts: s => [['Radius r', `${s.br.r.toFixed(2)} m`], ['Chord PQ', `${s.br.pqLen.toFixed(2)} m`]],
  },
  bisector_line: {
    title: 'Perpendicular Bisector Locus PQ (90°)',
    text: 'Because the diagonals of a rhombus bisect each other at right angles, every point on PQ is equidistant from A and B.',
    facts: s => [['Midpoint angle', '90.0°']],
  },
  north_posts: {
    title: 'Parallel North Reference Lines (000°)',
    text: 'North arrows at A and B are parallel, so the interior angles sum to 180° (co-interior C-angles).',
    facts: s => [['Co-interior', `${s.bb.coInterior}°`]],
  },
  bearing_ray: {
    title: 'Forward & Back-Bearing Arc',
    text: 'Measured clockwise from North in 3 digits: forward = 065°, back-bearing = 065° + 180° = 245°.',
    facts: s => [['Forward', `${s.bb.fwdStr}°`], ['Back-bearing', `${s.bb.backStr}°`]],
  },
  poly_net: {
    title: '3D Cube Net & Euler Invariant (V − E + F = 2)',
    text: 'Folding 6 square faces creates 8 vertices and 12 edges: 8 − 12 + 6 = 2 for every convex polyhedron.',
    facts: s => [['Cube (V,E,F)', '8 − 12 + 6 = 2']],
  }
};

function buildWorld(rawE) {
  const E = { ...EKit, ...rawE };
  const { THREE, scene, asm } = E;
  const root = new THREE.Group();
  scene.add(root);
  EKit.studioGrid(root, { x0: -3, x1: 3 });
  const groups = {};
  for (const k of Object.keys(PLATES)) {
    const grp = asm ? asm(k, root, { title: PLATES[k].title, sub: '' }) : new THREE.Group();
    if (!asm) root.add(grp);
    groups[k] = grp;
  }
  const g = k => groups[k];
  const built = (function() {
    
    const pArcs = g('compass_arcs');
    const ringA = E.ringTorus({ radius: 1.25, tube: 0.025, color: E.MATH_COL.setB });
    ringA.position.set(-0.8, 0, 0);
    const ringB = E.ringTorus({ radius: 1.25, tube: 0.025, color: E.MATH_COL.setB });
    ringB.position.set(0.8, 0, 0);
    pArcs.add(ringA, ringB);

    const pBis = g('bisector_line');
    pBis.add(E.vectorArrow({ from: [0, -1.35, 0.05], to: [0, 1.35, 0.05], color: E.MATH_COL.setA, radius: 0.035 }));

    const pNorth = g('north_posts');
    pNorth.add(E.vectorArrow({ from: [-0.8, 0, 0], to: [-0.8, 1.2, 0], color: E.MATH_COL.proof, radius: 0.03 }));
    pNorth.add(E.vectorArrow({ from: [0.8, 0, 0], to: [0.8, 1.2, 0], color: E.MATH_COL.proof, radius: 0.03 }));

    const pBear = g('bearing_ray');
    pBear.add(E.vectorArrow({ from: [-0.8, 0, 0.06], to: [0.8, 0.55, 0.06], color: E.MATH_COL.warn, radius: 0.035 }));

    const pNet = g('poly_net');
    pNet.add(E.wireBox({ width: 1.1, height: 1.1, depth: 1.1, color: E.MATH_COL.inter }));

    return {
      at(s, p, pageIdx) {
        const sc = p.radiusRatio / 0.8;
        ringA.scale.set(sc, sc, 1);
        ringB.scale.set(sc, sc, 1);
        pNet.scale.set(0.5 + 0.5 * p.foldNet, 0.5 + 0.5 * p.foldNet, 0.2 + 0.8 * p.foldNet);
        pNet.visible = pageIdx === 2;
      }
    };

  })();
  Object.entries(groups).forEach(([k, grp], gIdx) => {
    let mIdx = 0;
    grp.traverse(o => {
      if (o.isMesh && o.userData.part === undefined) {
        o.userData.part = PLATES[k]?.title || k;
        o.userData.home = o.position.clone();
        o.userData.ex = new THREE.Vector3((gIdx % 2 === 0 ? -0.28 : 0.28), 0.18 + mIdx * 0.08, 0.22);
        mIdx++;
      }
    });
  });
  return {
    labels: [],
    update(s, look) {
      const p = CHAPTER.params || CHAPTER.defaultParams;
      const pageIdx = CHAPTER._pageIdx || 0;
      const visibleSet = new Set(PAGES[pageIdx]?.parts || Object.keys(groups));
      for (const [k, grp] of Object.entries(groups)) {
        grp.visible = visibleSet.has(k);
      }
      if (built && built.at) built.at(s, p, pageIdx, look?.section ? 'cut' : look?.xray ? 'xray' : 'solid');
    },
  };
}

export const CHAPTER = {
  subject: SUBJECT,
  no: 9,
  title: 'Ch 9 · Compass Loci, 3-Figure Bearings & 3D Polyhedra',
  PAGES,
  pages: PAGES,
  PLATES,
  clock0: 0,
  cuts: true,
  defaultParams: {'radiusRatio': 0.8, 'bearingDeg': 65, 'foldNet': 0.85},
  controls: [
    { id: 'radiusRatio', label: 'Compass radius r / AB', min: 0.6, max: 1.1, step: 0.05, value: 0.8, unit: '×AB' },
    { id: 'bearingDeg', label: 'Forward bearing from A (°)', min: 25, max: 160, step: 5, value: 65, unit: '°' },
    { id: 'foldNet', label: '3D Net fold (0 flat → 1 closed)', min: 0, max: 1, step: 0.05, value: 0.85, unit: '' }
  ],
  lessons: {
    'atlas-ch09-1': { page: 0, params: {'radiusRatio': 0.8} },
    'atlas-ch09-2': { page: 1, params: {'bearingDeg': 65} },
    'atlas-ch09-3': { page: 2, params: {'foldNet': 0.85} },
    'w_euclid_compass_locus': { page: 0, params: {} },
    'w_bearings_back_bearing_radar': { page: 1, params: {} },
    'w_polyhedron_net_folder': { page: 2, params: {} }
  },
  state(clock = 0, reduced = false) {
    const p = CHAPTER.params || CHAPTER.defaultParams;
    const t = typeof clock === 'number' ? (reduced ? 1.0 : clock) : 0;
    const br = M.bisectorRhombus(2.0, p.radiusRatio); const bb = M.backBearing(p.bearingDeg); return { t, br, bb, foldNet: p.foldNet };
  },
  readout(s, pageObj, pageIdx = 0) {
    CHAPTER._pageIdx = pageIdx;
    if (pageIdx === 0) return `<b>Compass Perpendicular Bisector</b> · Equal radii r = ${s.br.r.toFixed(2)} from A and B form rhombus APBQ → Diagonals meet at <b>90°</b> with |PA| = |PB|.`;
    if (pageIdx === 1) return `<b>3-Figure Bearings</b> · Bearing of B from A = <b>${s.bb.fwdStr}°</b> · Co-interior angle at B = ${s.bb.coInterior}° → Back-bearing of A from B = <b>${s.bb.backStr}°</b> (${s.bb.fwdStr}° + 180°).`;
    return `<b>Euler's Polyhedron Theorem</b> · Cube net fold = ${(s.foldNet * 100).toFixed(0)}% · Vertices V = 8, Edges E = 12, Faces F = 6 → <b>V − E + F = 8 − 12 + 6 = 2</b>.`;
  },
  sonify(ctx, s, pageIdx = 0, p = CHAPTER.defaultParams) {
    const firstKey = Object.keys(p || CHAPTER.defaultParams)[0];
    const v = Number((p || CHAPTER.defaultParams)[firstKey]) || 1;
    EKit.playTone(ctx, { freq: 220 + (Math.abs(v) % 20) * 18, dur: 0.06, type: 'sine', gain: 0.03 });
  },
  buildWorld,
  build: buildWorld,
};

export const chapter = CHAPTER;
