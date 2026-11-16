// Ch 20 · 2×2 Matrix Basis Grid, Determinant Area Scaling & Eigenvector Axes — 3D Interactive Mathematics Atlas chapter.
import { SUBJECT } from '../subject.js';
import * as EKit from '../../../engine/math_kit.js';
import * as M from './model.js';

export const PAGES = [
  {
    tab: 'Columns = Basis Images',
    fig: 'Figure 20.1 · Why A = [î_new | ĵ_new] Moves Every Grid Point to x·î_new + y·ĵ_new',
    title: 'Why A = [î_new | ĵ_new] Moves Every Grid Point to x·î_new + y·ĵ_new',
    alt: 'Unit square and grid warping as red column 1 (a, c) and blue column 2 (b, d) transform the plane.',
    body: ['Unit square and grid warping as red column 1 (a, c) and blue column 2 (b, d) transform the plane.'],
    cam: { target: [0, 0.15, 0], az: 16, el: 20, dist: 5.8 },
    lit: 'basis_arrows',
    parts: ['basis_arrows', 'det_para'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Determinant = Area Scale',
    fig: 'Figure 20.2 · Why det(A) = ad − bc Is the Signed Area of the Transformed Unit Square',
    title: 'Why det(A) = ad − bc Is the Signed Area of the Transformed Unit Square',
    alt: 'Transformed parallelogram of area |ad − bc| collapsing to a flat line of area 0 when columns become collinear.',
    body: ['Transformed parallelogram of area |ad − bc| collapsing to a flat line of area 0 when columns become collinear.'],
    cam: { target: [0, 0.15, 0], az: 2, el: 20, dist: 5.8 },
    lit: 'det_para',
    parts: ['det_para', 'basis_arrows'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Eigenvectors Av = λv',
    fig: 'Figure 20.3 · Invariant Directions That Only Stretch by λ Without Rotating',
    title: 'Invariant Directions That Only Stretch by λ Without Rotating',
    alt: 'Symmetric shear matrix [[a, b], [b, a]] with amber eigenvector axes v₁ = (1, 1) and v₂ = (1, −1) that stay on their own span.',
    body: ['Symmetric shear matrix [[a, b], [b, a]] with amber eigenvector axes v₁ = (1, 1) and v₂ = (1, −1) that stay on their own span.'],
    cam: { target: [0, 0.15, 0], az: -12, el: 20, dist: 5.8 },
    lit: 'eigen_axes',
    parts: ['eigen_axes', 'det_para'],
    look: { xray: 0, section: 0 },
  }
];

export const PLATES = {
  basis_arrows: {
    title: "Transformed Basis Columns î' = (a, b) & ĵ' = (b, a)",
    text: "Column 1 of A is literally where (1, 0) lands; Column 2 is where (0, 1) lands. Every vector (x, y) lands at x·î' + y·ĵ'!",
    facts: s => [['Column 1 (î\')', `(${s.me.a.toFixed(2)}, ${s.me.b.toFixed(2)})`], ['Column 2 (ĵ\')', `(${s.me.b.toFixed(2)}, ${s.me.a.toFixed(2)})`]],
  },
  det_para: {
    title: 'Determinant Parallelogram Area (det A = ad − bc)',
    text: 'The 1×1 unit square stretches into a parallelogram of signed area det(A) = a² − b² = λ₁ × λ₂.',
    facts: s => [['det(A) = ad − bc', `${s.me.det.toFixed(2)}`], ['trace(A) = a + d', `${s.me.trace.toFixed(2)}`]],
  },
  eigen_axes: {
    title: 'Invariant Eigenvector Axes (Av = λv)',
    text: 'While almost all vectors get knocked off their line, v₁ = (1, 1) scales purely by λ₁ = a + b and v₂ = (1, −1) scales purely by λ₂ = a − b!',
    facts: s => [['λ₁ along (1, 1)', `${s.me.lambda1.toFixed(2)}×`], ['λ₂ along (1, −1)', `${s.me.lambda2.toFixed(2)}×`], ['λ₁ × λ₂ = det(A)', `${s.me.prodEigen.toFixed(2)}`]],
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

    const pBasis = g('basis_arrows');
    const col1 = E.vectorArrow({ from: [0, 0, 0.08], to: [1.5, 0.75, 0.08], color: E.MATH_COL.setA, radius: 0.042 });
    const col2 = E.vectorArrow({ from: [0, 0, 0.08], to: [0.75, 1.5, 0.08], color: E.MATH_COL.setB, radius: 0.042 });
    pBasis.add(col1, col2);

    const pPara = g('det_para');
    const quad = E.algebraTile({ width: 1.4, height: 1.4, depth: 0.12, color: E.MATH_COL.inter, opacity: 0.65 });
    quad.position.set(0.85, 0.85, 0);
    pPara.add(quad);

    const pEigen = g('eigen_axes');
    pEigen.add(E.vectorArrow({ from: [-1.6, -1.6, 0.04], to: [1.6, 1.6, 0.04], color: E.MATH_COL.warn, radius: 0.03 }));
    pEigen.add(E.vectorArrow({ from: [-1.4, 1.4, 0.04], to: [1.4, -1.4, 0.04], color: E.MATH_COL.proof, radius: 0.03 }));

    return {
      at(s, p) {
        const u = p.blendT;
        const a = 1 + u * (p.matA - 1);
        const b = u * p.matB;
        col1.rotation.z = Math.atan2(b, a) - Math.atan2(0.75, 1.5);
        col2.rotation.z = Math.atan2(a, b) - Math.atan2(1.5, 0.75);
        const areaScale = Math.max(0.15, Math.abs(a * a - b * b) / 2.2);
        quad.scale.set(areaScale, areaScale, 1);
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
  no: 20,
  title: 'Ch 20 · 2×2 Matrix Basis Grid, Determinant Area Scaling & Eigenvector Axes',
  PAGES,
  pages: PAGES,
  PLATES,
  clock0: 0,
  cuts: true,
  defaultParams: {'matA': 2.0, 'matB': 1.0, 'blendT': 1.0},
  controls: [
    { id: 'matA', label: 'Diagonal entry a (and d)', min: 1.0, max: 2.5, step: 0.25, value: 2.0, unit: '' },
    { id: 'matB', label: 'Off-diagonal shear b (and c)', min: -1.5, max: 1.5, step: 0.25, value: 1.0, unit: '' },
    { id: 'blendT', label: 'Transform morph (0 identity → 1 matrix A)', min: 0, max: 1, step: 0.05, value: 1.0, unit: '' }
  ],
  lessons: {
    'atlas-ch20-1': { page: 0, params: {'matA': 2.0, 'matB': 1.0, 'blendT': 1.0} },
    'atlas-ch20-2': { page: 1, params: {'matA': 2.0, 'matB': 1.0, 'blendT': 1.0} },
    'atlas-ch20-3': { page: 2, params: {'matA': 2.0, 'matB': 1.0, 'blendT': 1.0} },
    'w_matrix_basis_grid_warper': { page: 0, params: {} },
    'w_eigenvector_compass_rose': { page: 2, params: {} }
  },
  state(clock = 0, reduced = false) {
    const p = CHAPTER.params || CHAPTER.defaultParams;
    const t = typeof clock === 'number' ? (reduced ? 1.0 : clock) : 0;
    const me = M.matrixEigenModel(p.matA, p.matB); return { t, me, blendT: p.blendT };
  },
  readout(s, pageObj, pageIdx = 0) {
    CHAPTER._pageIdx = pageIdx;
    if (pageIdx === 0) return `<b>Columns as Basis Images</b> · î = (1,0) → <b>(${s.me.a.toFixed(2)}, ${s.me.b.toFixed(2)})</b> (red) · ĵ = (0,1) → <b>(${s.me.b.toFixed(2)}, ${s.me.a.toFixed(2)})</b> (blue).`;
    if (pageIdx === 1) return `<b>Determinant as Area Scale</b> · Unit square area 1.00 warps into parallelogram of area <b>det(A) = ad − bc = ${s.me.det.toFixed(2)}</b>.`;
    return `<b>Eigenvectors (Av = λv)</b> · Axis v₁ = (1, 1) stretches by <b>λ₁ = ${s.me.lambda1.toFixed(2)}×</b> · Axis v₂ = (1, −1) stretches by <b>λ₂ = ${s.me.lambda2.toFixed(2)}×</b> · Notice <b>λ₁·λ₂ = ${s.me.prodEigen.toFixed(2)} = det(A)</b>!`;
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
