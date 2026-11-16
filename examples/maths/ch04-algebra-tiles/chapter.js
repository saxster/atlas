// Ch 4 · Area-Array Expansion (x + a)(x + b) & a² − b² — 3D Interactive Mathematics Atlas chapter.
import { SUBJECT } from '../subject.js';
import * as EKit from '../../../engine/math_kit.js';
import * as M from './model.js';

export const PAGES = [
  {
    tab: 'Area Expansion',
    fig: 'Figure 4.1 · Why (x + a)(x + b) = x² + (a + b)x + ab',
    title: 'Why (x + a)(x + b) = x² + (a + b)x + ab',
    alt: '4-tile 3D rectangle partitioned into red x², two blue linear strips ax and bx, and amber corner ab.',
    body: ['4-tile 3D rectangle partitioned into red x², two blue linear strips ax and bx, and amber corner ab.'],
    cam: { target: [0, 0.15, 0], az: 16, el: 20, dist: 5.8 },
    lit: 'tile_x2',
    parts: ['tile_x2', 'tiles_linear', 'tile_ab'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Diff of Squares',
    fig: 'Figure 4.2 · Why a² − b² = (a − b)(a + b) by L-Strip Rotation',
    title: 'Why a² − b² = (a − b)(a + b) by L-Strip Rotation',
    alt: 'Cutting corner b² from square a² and rotating the side strip forms a single (a+b) by (a−b) rectangle.',
    body: ['Cutting corner b² from square a² and rotating the side strip forms a single (a+b) by (a−b) rectangle.'],
    cam: { target: [0, 0.15, 0], az: 2, el: 20, dist: 5.8 },
    lit: 'strip_rot',
    parts: ['main_a2', 'strip_rot'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'HCF Factor Slicer',
    fig: 'Figure 4.3 · Factorising ab + ac = a(b + c) as Shared Height',
    title: 'Factorising ab + ac = a(b + c) as Shared Height',
    alt: 'Splitting a composite area into common height factor a times combined width (b + c).',
    body: ['Splitting a composite area into common height factor a times combined width (b + c).'],
    cam: { target: [0, 0.15, 0], az: -12, el: 20, dist: 5.8 },
    lit: 'hcf_rect',
    parts: ['hcf_rect'],
    look: { xray: 0, section: 0 },
  }
];

export const PLATES = {
  tile_x2: {
    title: 'Core Square Tile x² (Red)',
    text: 'The x by x quadratic square in the top-left of the area array.',
    facts: s => [['x²', `${s.ex.x2.toFixed(1)}`]],
  },
  tiles_linear: {
    title: 'Flanking Linear Strips ax + bx (Blue)',
    text: 'The two side rectangles of area ax and bx. This is why (x + a)² = x² + 2ax + a² and NEVER x² + a²!',
    facts: s => [['ax + bx', `${s.ex.ax.toFixed(1)} + ${s.ex.bx.toFixed(1)} = ${s.ex.linearSum.toFixed(1)}`]],
  },
  tile_ab: {
    title: 'Corner Product Tile ab (Amber)',
    text: 'The a by b constant rectangle completing the bottom-right corner.',
    facts: s => [['ab', `${s.ex.ab.toFixed(1)}`], ['Total', `${s.ex.total.toFixed(1)}`]],
  },
  main_a2: {
    title: 'Main Remainder Strip a(a − b)',
    text: 'After cutting b² from a², the top rectangle has width a and height (a − b).',
    facts: s => [['a² − b²', `${s.ds.lhs.toFixed(1)}`]],
  },
  strip_rot: {
    title: 'Rotated Side Strip b(a − b)',
    text: 'Hinging the right strip of width b and height (a − b) onto the end extends the width to (a + b) at uniform height (a − b)!',
    facts: s => [['(a+b)(a−b)', `${s.ds.width.toFixed(1)} × ${s.ds.height.toFixed(1)} = ${s.ds.rhs.toFixed(1)}`]],
  },
  hcf_rect: {
    title: 'Factored Common-Height Rectangle',
    text: 'Extracting the highest common factor a turns a sum of areas ab + ac into one rectangle of height a and width (b + c).',
    facts: s => [['a(b+c)', `${(s.ex.a * (s.ex.x + s.ex.b)).toFixed(1)}`]],
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
    
    const pX2 = g('tile_x2');
    const tX2 = E.algebraTile({ width: 1.4, height: 1.4, depth: 0.2, color: E.MATH_COL.setA });
    pX2.add(tX2);

    const pLin = g('tiles_linear');
    const tAX = E.algebraTile({ width: 0.7, height: 1.4, depth: 0.2, color: E.MATH_COL.setB });
    const tBX = E.algebraTile({ width: 1.4, height: 0.85, depth: 0.2, color: E.MATH_COL.setB });
    pLin.add(tAX, tBX);

    const pAB = g('tile_ab');
    const tAB = E.algebraTile({ width: 0.7, height: 0.85, depth: 0.22, color: E.MATH_COL.warn });
    pAB.add(tAB);

    const pMainA2 = g('main_a2');
    pMainA2.add(E.algebraTile({ width: 1.6, height: 1.0, depth: 0.18, color: E.MATH_COL.setB, opacity: 0.85 }));
    pMainA2.position.set(-0.4, 0.2, -0.2);

    const pStripRot = g('strip_rot');
    pStripRot.add(E.algebraTile({ width: 0.7, height: 1.0, depth: 0.18, color: E.MATH_COL.proof, opacity: 0.88 }));
    pStripRot.position.set(0.85, 0.2, -0.2);

    const pHcf = g('hcf_rect');
    pHcf.add(E.wireBox({ width: 2.4, height: 1.2, depth: 0.28, color: E.MATH_COL.inter }));

    return {
      at(s, p) {
        const x = p.valX * 0.32;
        const a = p.valA * 0.32;
        const b = p.valB * 0.32;
        tX2.scale.set(x / 1.4, x / 1.4, 1);
        tX2.position.set(-a / 2, b / 2, 0);
        tAX.scale.set(a / 0.7, x / 1.4, 1);
        tAX.position.set(x / 2 + 0.04, b / 2, 0);
        tBX.scale.set(x / 1.4, b / 0.85, 1);
        tBX.position.set(-a / 2, -x / 2 - 0.04, 0);
        tAB.scale.set(a / 0.7, b / 0.85, 1);
        tAB.position.set(x / 2 + 0.04, -x / 2 - 0.04, 0);
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
  no: 4,
  title: 'Ch 4 · Area-Array Expansion (x + a)(x + b) & a² − b²',
  PAGES,
  pages: PAGES,
  PLATES,
  clock0: 0,
  cuts: true,
  defaultParams: {'valX': 4, 'valA': 2, 'valB': 3},
  controls: [
    { id: 'valX', label: 'Variable side x', min: 2, max: 6, step: 0.5, value: 4, unit: '' },
    { id: 'valA', label: 'Constant strip a', min: 1, max: 4, step: 0.5, value: 2, unit: '' },
    { id: 'valB', label: 'Constant strip b', min: 1, max: 4, step: 0.5, value: 3, unit: '' }
  ],
  lessons: {
    'atlas-ch04-1': { page: 0, params: {'valX': 4, 'valA': 2, 'valB': 3} },
    'atlas-ch04-2': { page: 1, params: {'valX': 5, 'valA': 2} },
    'atlas-ch04-3': { page: 2, params: {} },
    'w_algebra_area_tiles': { page: 0, params: {} },
    'w_difference_of_squares_slicer': { page: 1, params: {} }
  },
  state(clock = 0, reduced = false) {
    const p = CHAPTER.params || CHAPTER.defaultParams;
    const t = typeof clock === 'number' ? (reduced ? 1.0 : clock) : 0;
    const ex = M.expandAreaTiles(p.valX, p.valA, p.valB); const ds = M.diffOfSquares(Math.max(p.valX, p.valB + 1), p.valB); return { t, ex, ds };
  },
  readout(s, pageObj, pageIdx = 0) {
    CHAPTER._pageIdx = pageIdx;
    if (pageIdx === 0) return `<b>Area-Array Expansion</b> · (${s.ex.x} + ${s.ex.a})(${s.ex.x} + ${s.ex.b}) = <span style="color:var(--proton)">x² (${s.ex.x2.toFixed(1)})</span> + <span style="color:var(--electron)">(a+b)x (${s.ex.linearSum.toFixed(1)})</span> + <span style="color:var(--neutron)">ab (${s.ex.ab.toFixed(1)})</span> = <b>${s.ex.total.toFixed(1)}</b>.`;
    if (pageIdx === 1) return `<b>Difference of Two Squares</b> · ${s.ds.a}² − ${s.ds.b}² = (${s.ds.a} − ${s.ds.b})(${s.ds.a} + ${s.ds.b}) = ${s.ds.height.toFixed(1)} × ${s.ds.width.toFixed(1)} = <b>${s.ds.rhs.toFixed(1)}</b>.`;
    return `<b>HCF Factorisation</b> · Common height a = ${s.ex.a} across widths ${s.ex.x} and ${s.ex.b} factors as <b>${s.ex.a}(${s.ex.x} + ${s.ex.b}) = ${(s.ex.a * (s.ex.x + s.ex.b)).toFixed(1)}</b>.`;
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
