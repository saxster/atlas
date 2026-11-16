// Ch 14 · Completing the Square, Parabola Vertex Form & Kinematic Area — 3D Interactive Mathematics Atlas chapter.
import { SUBJECT } from '../subject.js';
import * as EKit from '../../../engine/math_kit.js';
import * as M from './model.js';

export const PAGES = [
  {
    tab: 'Al-Khwarizmi Square',
    fig: 'Figure 14.1 · Splitting bx into Two (b/2)x Wings to Expose the Missing (b/2)² Corner',
    title: 'Splitting bx into Two (b/2)x Wings to Expose the Missing (b/2)² Corner',
    alt: '3D geometric tiles for x² + bx arranged as an L-frame whose missing corner is exactly (b/2) × (b/2) = (b/2)².',
    body: ['3D geometric tiles for x² + bx arranged as an L-frame whose missing corner is exactly (b/2) × (b/2) = (b/2)².'],
    cam: { target: [0, 0.15, 0], az: 16, el: 20, dist: 5.8 },
    lit: 'square_tiles',
    parts: ['square_tiles', 'missing_corner'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Parabola Vertex & Roots',
    fig: 'Figure 14.2 · Why y = (x + b/2)² − ((b/2)² − c) Pins the Turning Point',
    title: 'Why y = (x + b/2)² − ((b/2)² − c) Pins the Turning Point',
    alt: '3D parabola arch with red symmetry axis x = −b/2, amber vertex minimum, and blue roots where y = 0.',
    body: ['3D parabola arch with red symmetry axis x = −b/2, amber vertex minimum, and blue roots where y = 0.'],
    cam: { target: [0, 0.15, 0], az: 2, el: 20, dist: 5.8 },
    lit: 'parabola_arch',
    parts: ['parabola_arch'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'v–t Area = Distance',
    fig: 'Figure 14.3 · Why Area Under a Velocity–Time Graph Equals Displacement',
    title: 'Why Area Under a Velocity–Time Graph Equals Displacement',
    alt: '3D velocity curve and trapezoidal area strips showing slope = acceleration and area = distance travelled.',
    body: ['3D velocity curve and trapezoidal area strips showing slope = acceleration and area = distance travelled.'],
    cam: { target: [0, 0.15, 0], az: -12, el: 20, dist: 5.8 },
    lit: 'vt_slab',
    parts: ['vt_slab'],
    look: { xray: 0, section: 0 },
  }
];

export const PLATES = {
  square_tiles: {
    title: 'x² Core + Two (b/2)x Wing Tiles',
    text: 'Cutting the bx rectangle in half and placing one (b/2)x strip on the right and one on the top forms an almost-complete square of side (x + b/2).',
    facts: s => [['x² core', `${(s.cs.x*s.cs.x).toFixed(2)}`], ['Two (b/2)x wings', `2 × (${s.cs.halfB} × ${s.cs.x.toFixed(1)})`]],
  },
  missing_corner: {
    title: 'Missing (b/2)² Corner Tile',
    text: 'The empty top-right notch has width b/2 and height b/2, so adding (b/2)² completes the geometric square (x + b/2)²!',
    facts: s => [['Half-coeff b/2', `${s.cs.halfB}`], ['Corner (b/2)²', `${s.cs.cornerArea}`]],
  },
  parabola_arch: {
    title: 'Parabola y = (x + b/2)² + (c − (b/2)²)',
    text: 'Because a square (x + b/2)² is never negative, its minimum value 0 occurs at x = −b/2, pinning the vertex at (−b/2, c − (b/2)²).',
    facts: s => [['Vertex', `(${s.cs.vertexX}, ${s.cs.vertexY})`], ['Discriminant Δ', `${s.cs.discriminant}`]],
  },
  vt_slab: {
    title: 'Velocity–Time Area Slab (Distance = ∫ v dt)',
    text: 'Height is velocity (m/s) and width is time (s), so area (m/s × s = m) is displacement.',
    facts: s => [['Gradient dv/dt', 'Acceleration (m/s²)'], ['Area ∫v dt', 'Displacement (m)']],
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
    
    const pTiles = g('square_tiles');
    const core = E.algebraTile({ width: 1.3, height: 1.3, depth: 0.18, color: E.MATH_COL.setB });
    core.position.set(-0.85, 0.15, 0);
    const w1 = E.algebraTile({ width: 0.55, height: 1.3, depth: 0.18, color: E.MATH_COL.warn });
    w1.position.set(0.12, 0.15, 0);
    const w2 = E.algebraTile({ width: 1.3, height: 0.55, depth: 0.18, color: E.MATH_COL.warn });
    w2.position.set(-0.85, 1.12, 0);
    pTiles.add(core, w1, w2);

    const pCorner = g('missing_corner');
    const cTile = E.algebraTile({ width: 0.55, height: 0.55, depth: 0.24, color: E.MATH_COL.setA });
    cTile.position.set(0.12, 1.12, 0.04);
    pCorner.add(cTile);

    const pArch = g('parabola_arch');
    pArch.add(E.curveTube({ fn: u => { const x = -1.6 + 3.2 * u; return [x, 0.45 * x * x - 0.85, 0.35]; }, radius: 0.04, color: E.MATH_COL.proof }));

    const pVt = g('vt_slab');
    pVt.add(E.algebraTile({ width: 2.2, height: 0.65, depth: 0.1, color: E.MATH_COL.inter, opacity: 0.55 }));
    pVt.position.set(0.4, -0.85, -0.25);

    return {
      at(s, p) {
        const bScale = (p.coeffB / 4);
        w1.scale.x = bScale;
        w2.scale.y = bScale;
        cTile.scale.set(bScale, bScale, 1);
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
  no: 14,
  title: 'Ch 14 · Completing the Square, Parabola Vertex Form & Kinematic Area',
  PAGES,
  pages: PAGES,
  PLATES,
  clock0: 0,
  cuts: true,
  defaultParams: {'sideX': 1.8, 'coeffB': 4, 'constC': 1},
  controls: [
    { id: 'sideX', label: 'Square side x', min: 1.2, max: 2.4, step: 0.2, value: 1.8, unit: 'm' },
    { id: 'coeffB', label: 'Linear coefficient b', min: 2, max: 6, step: 1, value: 4, unit: '' },
    { id: 'constC', label: 'Constant term c', min: -2, max: 5, step: 1, value: 1, unit: '' }
  ],
  lessons: {
    'atlas-ch14-1': { page: 0, params: {'sideX': 1.8, 'coeffB': 4} },
    'atlas-ch14-2': { page: 1, params: {'coeffB': 4, 'constC': 1} },
    'atlas-ch14-3': { page: 2, params: {} },
    'w_completing_square_tiles': { page: 0, params: {} },
    'w_parabola_vertex_explorer': { page: 1, params: {} },
    'w_kinematic_vt_area': { page: 2, params: {} }
  },
  state(clock = 0, reduced = false) {
    const p = CHAPTER.params || CHAPTER.defaultParams;
    const t = typeof clock === 'number' ? (reduced ? 1.0 : clock) : 0;
    const cs = M.completeSquare(p.sideX, p.coeffB, p.constC); return { t, cs };
  },
  readout(s, pageObj, pageIdx = 0) {
    CHAPTER._pageIdx = pageIdx;
    if (pageIdx === 0) return `<b>Completing the Square</b> · x² + ${s.cs.b}x splits into x² + two <b>(${s.cs.halfB})x</b> wings · Missing corner = <b>(${s.cs.halfB})² = ${s.cs.cornerArea}</b> → <b>(x + ${s.cs.halfB})² − ${s.cs.cornerArea}</b>.`;
    if (pageIdx === 1) return `<b>Vertex Form</b> · y = x² + ${s.cs.b}x + ${s.cs.c} = <b>(x + ${s.cs.halfB})² + (${s.cs.vertexY})</b> → Turning point at <b>(${s.cs.vertexX}, ${s.cs.vertexY})</b>, Δ = b² − 4ac = <b>${s.cs.discriminant}</b>.`;
    return `<b>Kinematic Graph Duality</b> · Slope of v(t) = <b>acceleration a = dv/dt</b> · Area under v(t) = <b>displacement s = ∫ v dt</b>.`;
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
