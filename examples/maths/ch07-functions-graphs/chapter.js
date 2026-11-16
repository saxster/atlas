// Ch 7 · Linear Graphs y = mx + c & Speed-Time Area — 3D Interactive Mathematics Atlas chapter.
import { SUBJECT } from '../subject.js';
import * as EKit from '../../../engine/math_kit.js';
import * as M from './model.js';

export const PAGES = [
  {
    tab: 'Slope Invariant',
    fig: 'Figure 7.1 · y = mx + c & Why Δy / Δx Stays Constant',
    title: 'y = mx + c & Why Δy / Δx Stays Constant',
    alt: '3D line with draggable run Δx and rise Δy triangle anchored at y-intercept (0, c).',
    body: ['3D line with draggable run Δx and rise Δy triangle anchored at y-intercept (0, c).'],
    cam: { target: [0, 0.15, 0], az: 16, el: 20, dist: 5.8 },
    lit: 'slope_tri',
    parts: ['line_rod', 'slope_tri', 'y_intercept'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Perpendicular 90°',
    fig: 'Figure 7.2 · Why Perpendicular Gradients Multiply to m₁·m₂ = −1',
    title: 'Why Perpendicular Gradients Multiply to m₁·m₂ = −1',
    alt: 'Rotating the (Δx, Δy) slope triangle by 90° turns run into −Δy and rise into Δx.',
    body: ['Rotating the (Δx, Δy) slope triangle by 90° turns run into −Δy and rise into Δx.'],
    cam: { target: [0, 0.15, 0], az: 2, el: 20, dist: 5.8 },
    lit: 'perp_tri',
    parts: ['slope_tri', 'perp_tri'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Speed-Time Area',
    fig: 'Figure 7.3 · Kinematics Duality: Slope = Acceleration, Area = Distance',
    title: 'Kinematics Duality: Slope = Acceleration, Area = Distance',
    alt: '3D speed-time trapezium block where height is speed v and base area is distance travelled.',
    body: ['3D speed-time trapezium block where height is speed v and base area is distance travelled.'],
    cam: { target: [0, 0.15, 0], az: -12, el: 20, dist: 5.8 },
    lit: 'travel_area',
    parts: ['travel_area'],
    look: { xray: 0, section: 0 },
  }
];

export const PLATES = {
  line_rod: {
    title: 'Straight Line y = mx + c',
    text: 'Every point (x, y) satisfies y = mx + c; the slope m is identical between any two points on the line.',
    facts: s => [['Equation', `y = ${s.ls.m.toFixed(2)}x + ${s.ls.c.toFixed(1)}`]],
  },
  slope_tri: {
    title: 'Rise / Run Slope Triangle (Δy / Δx)',
    text: 'Blue horizontal run Δx and red vertical rise Δy = m·Δx. Scaling Δx scales Δy in lockstep so Δy/Δx = m never changes.',
    facts: s => [['Run Δx', `${s.ls.dx.toFixed(2)}`], ['Rise Δy', `${s.ls.dy.toFixed(2)}`], ['m = Δy/Δx', `${s.ls.m.toFixed(2)}`]],
  },
  y_intercept: {
    title: 'Vertical Intercept Anchor (0, c)',
    text: 'Where the line crosses the y-axis at x = 0.',
    facts: s => [['(0, c)', `(0, ${s.ls.c.toFixed(1)})`]],
  },
  perp_tri: {
    title: '90°-Rotated Perpendicular Triangle',
    text: 'Rotating (Δx, Δy) by 90° swaps the legs to (−Δy, Δx), giving gradient m₂ = Δx/(−Δy) = −1/m₁ so m₁·m₂ = −1.',
    facts: s => [['m_perp', `${s.ls.mPerp.toFixed(2)}`], ['m₁ · m₂', '-1.00']],
  },
  travel_area: {
    title: 'Speed-Time Distance Slab',
    text: 'On a speed-time graph, slope Δv/Δt is acceleration (3 m/s²) and the area under the graph is total distance (96 m).',
    facts: s => [['Accel', `${s.tr.accel.toFixed(1)} m/s²`], ['Distance Area', `${s.tr.totalDist.toFixed(0)} m`]],
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

    const pLine = g('line_rod');
    pLine.add(E.vectorArrow({ from: [-1.4, -1.1, 0.04], to: [1.4, 1.5, 0.04], color: E.MATH_COL.setB, radius: 0.038 }));

    const pTri = g('slope_tri');
    const tri1 = E.rightTrianglePlate({ a: 0.9, b: 1.35, thickness: 0.1, color: E.MATH_COL.setA, opacity: 0.82 });
    pTri.add(tri1);

    const pYInt = g('y_intercept');
    const yDot = E.nodeSphere({ radius: 0.11, color: E.MATH_COL.warn });
    pYInt.add(yDot);

    const pPerp = g('perp_tri');
    const tri2 = E.rightTrianglePlate({ a: 0.9, b: 1.35, thickness: 0.1, color: E.MATH_COL.proof, opacity: 0.82 });
    tri2.rotation.z = Math.PI / 2;
    pPerp.add(tri2);

    const pTravel = g('travel_area');
    pTravel.add(E.algebraTile({ width: 2.2, height: 0.85, depth: 0.14, color: E.MATH_COL.inter, opacity: 0.72 }));
    pTravel.position.set(0, -0.55, -0.2);

    return {
      at(s, p) {
        const cY = p.intC * 0.35;
        yDot.position.set(0, cY, 0.08);
        pLine.position.y = cY;
        pLine.rotation.z = Math.atan(p.gradM) - 0.75;
        tri1.scale.set(p.runDx / 1.5, Math.max(0.2, Math.abs(s.ls.dy) / 2.0), 1);
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
  no: 7,
  title: 'Ch 7 · Linear Graphs y = mx + c & Speed-Time Area',
  PAGES,
  pages: PAGES,
  PLATES,
  clock0: 0,
  cuts: true,
  defaultParams: {'gradM': 1.5, 'intC': 0.5, 'runDx': 1.5},
  controls: [
    { id: 'gradM', label: 'Gradient m', min: -2.0, max: 3.0, step: 0.25, value: 1.5, unit: '' },
    { id: 'intC', label: 'y-Intercept c', min: -2.0, max: 3.0, step: 0.5, value: 0.5, unit: '' },
    { id: 'runDx', label: 'Horizontal run Δx', min: 0.5, max: 2.5, step: 0.25, value: 1.5, unit: '' }
  ],
  lessons: {
    'atlas-ch07-1': { page: 0, params: {'gradM': 1.5, 'intC': 0.5, 'runDx': 1.5} },
    'atlas-ch07-2': { page: 1, params: {'gradM': 1.5} },
    'atlas-ch07-3': { page: 2, params: {} },
    'w_linear_graph_slope_explorer': { page: 0, params: {} },
    'w_kinematics_travel_graph': { page: 2, params: {} }
  },
  state(clock = 0, reduced = false) {
    const p = CHAPTER.params || CHAPTER.defaultParams;
    const t = typeof clock === 'number' ? (reduced ? 1.0 : clock) : 0;
    const ls = M.linearSlopeState(p.gradM, p.intC, p.runDx); const tr = M.travelGraphArea(12, 4, 6); return { t, ls, tr };
  },
  readout(s, pageObj, pageIdx = 0) {
    CHAPTER._pageIdx = pageIdx;
    if (pageIdx === 0) return `<b>Linear Slope Invariant</b> · y = ${s.ls.m.toFixed(2)}x + ${s.ls.c.toFixed(1)} · Over run Δx = ${s.ls.dx.toFixed(2)}, rise Δy = <b>${s.ls.dy.toFixed(2)}</b> → Ratio Δy/Δx = <b>${s.ls.m.toFixed(2)}</b>.`;
    if (pageIdx === 1) return `<b>Perpendicular Gradient</b> · Rotating (Δx, Δy) by 90° gives (−Δy, Δx) → m₂ = −1/m₁ = <b>${s.ls.mPerp.toFixed(2)}</b> (Check: m₁·m₂ = −1).`;
    return `<b>Speed-Time Graph</b> · Ramp (0–4 s to 12 m/s) area = ${s.tr.distAccel} m + Cruise (4–10 s) area = ${s.tr.distCruise} m → <b>Total distance = ${s.tr.totalDist} m</b>.`;
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
