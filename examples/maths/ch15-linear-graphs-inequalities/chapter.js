// Ch 15 · Gradient Staircase (m = Δy/Δx), Perpendicular m₁m₂ = −1 & LP Feasible Region — 3D Interactive Mathematics Atlas chapter.
import { SUBJECT } from '../subject.js';
import * as EKit from '../../../engine/math_kit.js';
import * as M from './model.js';

export const PAGES = [
  {
    tab: 'Rise / Run Staircase',
    fig: 'Figure 15.1 · Why Every Unit Step Right Climbs by m Along y = mx + c',
    title: 'Why Every Unit Step Right Climbs by m Along y = mx + c',
    alt: '3D Cartesian plane with y-intercept pillar (0, c) and unit rise/run steps of height m along the line.',
    body: ['3D Cartesian plane with y-intercept pillar (0, c) and unit rise/run steps of height m along the line.'],
    cam: { target: [0, 0.15, 0], az: 16, el: 20, dist: 5.8 },
    lit: 'line_beam',
    parts: ['line_beam', 'slope_steps'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: '90° Rotation m₁m₂ = −1',
    fig: 'Figure 15.2 · Why Rotating a (Δx, Δy) Slope Triangle by 90° Gives (−Δy, Δx)',
    title: 'Why Rotating a (Δx, Δy) Slope Triangle by 90° Gives (−Δy, Δx)',
    alt: 'Blue slope triangle (1, m) rotated 90° into red triangle (−m, 1) so m₁ × m₂ = m × (−1/m) = −1.',
    body: ['Blue slope triangle (1, m) rotated 90° into red triangle (−m, 1) so m₁ × m₂ = m × (−1/m) = −1.'],
    cam: { target: [0, 0.15, 0], az: 2, el: 20, dist: 5.8 },
    lit: 'perp_triangles',
    parts: ['perp_triangles'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Feasible Polygon',
    fig: 'Figure 15.3 · Intersecting Half-Plane Inequalities & Corner-Point Optimum',
    title: 'Intersecting Half-Plane Inequalities & Corner-Point Optimum',
    alt: '3D extruded feasible region polygon bounded by constraint walls with objective height plane peaking at a vertex.',
    body: ['3D extruded feasible region polygon bounded by constraint walls with objective height plane peaking at a vertex.'],
    cam: { target: [0, 0.15, 0], az: -12, el: 20, dist: 5.8 },
    lit: 'feasible_poly',
    parts: ['feasible_poly'],
    look: { xray: 0, section: 0 },
  }
];

export const PLATES = {
  line_beam: {
    title: 'Straight Line y = mx + c',
    text: 'Crosses the y-axis at (0, c) and climbs by m units vertically for every 1 unit horizontally.',
    facts: s => [['Equation', `y = ${s.lm.m.toFixed(1)}x + ${s.lm.c.toFixed(1)}`], ['y-intercept', `(0, ${s.lm.c.toFixed(1)})`], ['x-intercept', `(${s.lm.xIntercept.toFixed(2)}, 0)`]],
  },
  slope_steps: {
    title: 'Constant Gradient Staircase (Δy / Δx = m)',
    text: 'Every unit run Δx = 1 produces the exact same rise Δy = m anywhere along a straight line.',
    facts: s => [['Run Δx', '1.0'], ['Rise Δy', `${s.lm.m.toFixed(2)}`]],
  },
  perp_triangles: {
    title: '90°-Rotated Slope Triangles (m₁ × m₂ = −1)',
    text: 'Rotating (Δx, Δy) = (1, m) by 90° swaps and negates the legs to (−m, 1), making the new gradient 1/(−m) = −1/m.',
    facts: s => [['m₁', `${s.lm.m.toFixed(2)}`], ['m₂ = −1/m₁', `${s.lm.perpM.toFixed(2)}`], ['m₁ × m₂', '-1.00']],
  },
  feasible_poly: {
    title: 'Linear Programming Feasible Region',
    text: 'Intersecting linear inequalities carves a convex polygon; the linear objective P = 4x + 5y reaches its maximum 23 at vertex (2, 3).',
    facts: s => [['Optimal vertex', '(2, 3)'], ['Max P = 4x + 5y', '23']],
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
    
    const pAxes = E.axes3D({ length: 1.9, showZ: false });
    scene.add(pAxes);

    const pLine = g('line_beam');
    const rod = E.vectorArrow({ from: [-1.4, -1.1, 0.05], to: [1.4, 1.5, 0.05], color: E.MATH_COL.setB, radius: 0.04 });
    pLine.add(rod);

    const pSteps = g('slope_steps');
    const tri1 = E.rightTrianglePlate({ a: 0.8, b: 1.2, thickness: 0.1, color: E.MATH_COL.warn, opacity: 0.8 });
    tri1.position.set(0, 0.25, 0);
    pSteps.add(tri1);

    const pPerp = g('perp_triangles');
    const tri2 = E.rightTrianglePlate({ a: 0.8, b: 1.2, thickness: 0.1, color: E.MATH_COL.setA, opacity: 0.85 });
    tri2.position.set(0, 0.25, 0.08);
    tri2.rotation.z = Math.PI / 2;
    pPerp.add(tri2);

    const pFeas = g('feasible_poly');
    pFeas.add(E.algebraTile({ width: 1.3, height: 1.1, depth: 0.18, color: E.MATH_COL.proof, opacity: 0.65 }));
    pFeas.position.set(0.75, 0.65, -0.15);

    return {
      at(s, p, pageIdx) {
        pLine.position.y = p.interceptC * 0.45;
        pLine.rotation.z = Math.atan(s.lm.m) - 0.75;
        tri1.scale.y = Math.max(0.25, Math.abs(s.lm.m) / 1.5);
        pPerp.visible = pageIdx >= 1;
        pFeas.visible = pageIdx === 2;
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
  no: 15,
  title: 'Ch 15 · Gradient Staircase (m = Δy/Δx), Perpendicular m₁m₂ = −1 & LP Feasible Region',
  PAGES,
  pages: PAGES,
  PLATES,
  clock0: 0,
  cuts: true,
  defaultParams: {'slopeM': 1.5, 'interceptC': 0.5, 'objAngle': 0.5},
  controls: [
    { id: 'slopeM', label: 'Gradient m = Δy / Δx', min: -2.0, max: 2.5, step: 0.5, value: 1.5, unit: '' },
    { id: 'interceptC', label: 'y-intercept c', min: -1.5, max: 2.0, step: 0.5, value: 0.5, unit: '' },
    { id: 'objAngle', label: 'Objective profit tilt', min: 0, max: 1, step: 0.1, value: 0.5, unit: '' }
  ],
  lessons: {
    'atlas-ch15-1': { page: 0, params: {'slopeM': 1.5, 'interceptC': 0.5} },
    'atlas-ch15-2': { page: 1, params: {'slopeM': 1.5} },
    'atlas-ch15-3': { page: 2, params: {'objAngle': 0.5} },
    'w_gradient_staircase_perp': { page: 0, params: {} },
    'w_inequality_halfplane_lp': { page: 2, params: {} }
  },
  state(clock = 0, reduced = false) {
    const p = CHAPTER.params || CHAPTER.defaultParams;
    const t = typeof clock === 'number' ? (reduced ? 1.0 : clock) : 0;
    const lm = M.linearModel(p.slopeM, p.interceptC); const lp = M.lpVertices(); return { t, lm, lp, objAngle: p.objAngle };
  },
  readout(s, pageObj, pageIdx = 0) {
    CHAPTER._pageIdx = pageIdx;
    if (pageIdx === 0) return `<b>Gradient & Intercept</b> · <b>y = ${s.lm.m.toFixed(1)}x + ${s.lm.c.toFixed(1)}</b> · Crosses y-axis at <b>(0, ${s.lm.c.toFixed(1)})</b> · Every unit step Δx = 1 changes y by <b>Δy = ${s.lm.m.toFixed(1)}</b>.`;
    if (pageIdx === 1) return `<b>Perpendicular Gradients</b> · Rotating slope triangle (1, ${s.lm.m.toFixed(1)}) by 90° yields (−${s.lm.m.toFixed(1)}, 1) → <b>m₂ = −1/m₁ = ${s.lm.perpM.toFixed(2)}</b>, so <b>m₁ × m₂ = −1</b>.`;
    return `<b>Feasible Region & Vertex Theorem</b> · Constraints x + 2y ≤ 8, 3x + y ≤ 9, x,y ≥ 0 → Optimal profit P = 4x + 5y peaks at corner <b>(2, 3) with P = 23</b>.`;
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
