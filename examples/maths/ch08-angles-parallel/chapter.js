// Ch 8 · Parallel Transversals, Exterior Angles & Polygons — 3D Interactive Mathematics Atlas chapter.
import { SUBJECT } from '../subject.js';
import * as EKit from '../../../engine/math_kit.js';
import * as M from './model.js';

export const PAGES = [
  {
    tab: 'Parallel Z/F/C',
    fig: 'Figure 8.1 · Sliding Intersection Along a Transversal (Z, F, C Angles)',
    title: 'Sliding Intersection Along a Transversal (Z, F, C Angles)',
    alt: 'Two parallel 3D rails sliced by a transversal rod with colour-matched alternate (Z) and corresponding (F) angle wedges.',
    body: ['Two parallel 3D rails sliced by a transversal rod with colour-matched alternate (Z) and corresponding (F) angle wedges.'],
    cam: { target: [0, 0.15, 0], az: 16, el: 20, dist: 5.8 },
    lit: 'transversal_rod',
    parts: ['parallel_rails', 'transversal_rod'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Exterior Angle',
    fig: 'Figure 8.2 · Why θ_ext = α + β by Parallel Translation',
    title: 'Why θ_ext = α + β by Parallel Translation',
    alt: 'Triangle with red α and blue β interior angles translated into the exterior angle beside γ.',
    body: ['Triangle with red α and blue β interior angles translated into the exterior angle beside γ.'],
    cam: { target: [0, 0.15, 0], az: 2, el: 20, dist: 5.8 },
    lit: 'ext_wedge',
    parts: ['tri_frame', 'ext_wedge'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Polygon (n−2)×180°',
    fig: 'Figure 8.3 · Triangulating an n-gon from One Vertex into (n − 2) Triangles',
    title: 'Triangulating an n-gon from One Vertex into (n − 2) Triangles',
    alt: '3D polygon plate sliced by diagonals from vertex 0 into (n − 2) non-overlapping triangles.',
    body: ['3D polygon plate sliced by diagonals from vertex 0 into (n − 2) non-overlapping triangles.'],
    cam: { target: [0, 0.15, 0], az: -12, el: 20, dist: 5.8 },
    lit: 'poly_fan',
    parts: ['poly_fan'],
    look: { xray: 0, section: 0 },
  }
];

export const PLATES = {
  parallel_rails: {
    title: 'Parallel Lines (Arrows >>)',
    text: 'Two lines in the same plane with identical direction; sliding one intersection along the transversal lands flush on the other.',
    facts: s => [['Alternate Z', `${s.te.alphaDeg}°`], ['Co-interior C', `${s.te.coInteriorDeg}° (sums to 180°)`]],
  },
  transversal_rod: {
    title: 'Transversal Slicing Line',
    text: 'Carries the 4-angle intersection unchanged from the bottom rail to the top rail.',
    facts: s => [['Corresponding F', `${s.te.alphaDeg}°`]],
  },
  tri_frame: {
    title: 'Triangle Interior Angles (α + β + γ = 180°)',
    text: 'Because α and β pack into the exterior angle beside γ on a straight line, α + β + γ = 180° automatically.',
    facts: s => [['α, β, γ', `${s.te.alphaDeg}°, ${s.te.betaDeg}°, ${s.te.gammaDeg}°`]],
  },
  ext_wedge: {
    title: 'Exterior Angle Wedge (θ_ext = α + β)',
    text: 'An auxiliary parallel line at the vertex splits the exterior angle into alternate angle α and corresponding angle β!',
    facts: s => [['θ_ext = α + β', `${s.te.extDeg}°`]],
  },
  poly_fan: {
    title: 'Polygon (n − 2) Triangle Fan',
    text: 'Drawing diagonals from one vertex partitions any n-gon into (n − 2) triangles without adding any interior vertex.',
    facts: s => [['Triangles', `${s.pg.triangles}`], ['Sum', `${s.pg.interiorSum}°`], ['Each (regular)', `${s.pg.regularInterior.toFixed(1)}°`]],
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
    
    const pRails = g('parallel_rails');
    pRails.add(E.vectorArrow({ from: [-1.8, 0.65, 0], to: [1.8, 0.65, 0], color: E.MATH_COL.axis, radius: 0.035 }));
    pRails.add(E.vectorArrow({ from: [-1.8, -0.65, 0], to: [1.8, -0.65, 0], color: E.MATH_COL.axis, radius: 0.035 }));

    const pTrans = g('transversal_rod');
    const rod = E.vectorArrow({ from: [-1.1, -1.2, 0.05], to: [1.1, 1.2, 0.05], color: E.MATH_COL.setB, radius: 0.035 });
    pTrans.add(rod);

    const pTri = g('tri_frame');
    pTri.add(E.rightTrianglePlate({ a: 1.8, b: 1.1, thickness: 0.12, color: E.MATH_COL.proof, opacity: 0.72 }));
    pTri.position.set(-0.7, -0.65, -0.1);

    const pExt = g('ext_wedge');
    const w1 = E.arcSector({ radius: 0.55, angle: 0.9, thickness: 0.14, color: E.MATH_COL.setA, opacity: 0.9 });
    w1.position.set(1.1, -0.65, 0.08);
    pExt.add(w1);

    const pPoly = g('poly_fan');
    pPoly.add(E.lensDisc({ radius: 0.85, thickness: 0.1, color: E.MATH_COL.warn, opacity: 0.65, radialSegments: 6 }));
    pPoly.position.set(0, 0, -0.35);

    return {
      at(s, p, pageIdx) {
        const rad = (p.alphaDeg * Math.PI) / 180;
        pTrans.rotation.z = rad - 0.85;
        w1.rotation.z = 0.2;
        pPoly.visible = pageIdx === 2;
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
  no: 8,
  title: 'Ch 8 · Parallel Transversals, Exterior Angles & Polygons',
  PAGES,
  pages: PAGES,
  PLATES,
  clock0: 0,
  cuts: true,
  defaultParams: {'alphaDeg': 50, 'betaDeg': 60, 'polySides': 6},
  controls: [
    { id: 'alphaDeg', label: 'Angle α (°)', min: 30, max: 80, step: 5, value: 50, unit: '°' },
    { id: 'betaDeg', label: 'Angle β (°)', min: 30, max: 75, step: 5, value: 60, unit: '°' },
    { id: 'polySides', label: 'Polygon sides n', min: 4, max: 10, step: 1, value: 6, unit: 'sides' }
  ],
  lessons: {
    'atlas-ch08-1': { page: 0, params: {'alphaDeg': 55} },
    'atlas-ch08-2': { page: 1, params: {'alphaDeg': 50, 'betaDeg': 60} },
    'atlas-ch08-3': { page: 2, params: {'polySides': 6} },
    'w_parallel_transversal_proof': { page: 0, params: {} },
    'w_exterior_angle_tear_proof': { page: 1, params: {} }
  },
  state(clock = 0, reduced = false) {
    const p = CHAPTER.params || CHAPTER.defaultParams;
    const t = typeof clock === 'number' ? (reduced ? 1.0 : clock) : 0;
    const te = M.triangleExterior(p.alphaDeg, p.betaDeg); const pg = M.polygonAngles(p.polySides); return { t, te, pg };
  },
  readout(s, pageObj, pageIdx = 0) {
    CHAPTER._pageIdx = pageIdx;
    if (pageIdx === 0) return `<b>Parallel Transversal</b> · Alternate (Z) = <b>${s.te.alphaDeg}°</b> · Corresponding (F) = <b>${s.te.alphaDeg}°</b> · Co-interior (C) = 180° − ${s.te.alphaDeg}° = <b>${s.te.coInteriorDeg}°</b>.`;
    if (pageIdx === 1) return `<b>Exterior Angle Theorem</b> · α = ${s.te.alphaDeg}°, β = ${s.te.betaDeg}° → <b>θ_ext = α + β = ${s.te.extDeg}°</b> (and γ = 180° − ${s.te.extDeg}° = ${s.te.gammaDeg}°).`;
    return `<b>Polygon Triangulation (n = ${s.pg.sides})</b> · Splits into (n − 2) = <b>${s.pg.triangles} triangles</b> → Sum = ${s.pg.triangles} × 180° = <b>${s.pg.interiorSum}°</b> (Regular interior = ${s.pg.regularInterior.toFixed(1)}°).`;
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
