// Ch 6 · Sequences, Differences & Gauss's 180° Staircase — 3D Interactive Mathematics Atlas chapter.
import { SUBJECT } from '../subject.js';
import * as EKit from '../../../engine/math_kit.js';
import * as M from './model.js';

export const PAGES = [
  {
    tab: 'Gauss Staircase',
    fig: 'Figure 6.1 · Why 1 + 2 + … + n = ½n(n + 1) by 180° Interlocking',
    title: 'Why 1 + 2 + … + n = ½n(n + 1) by 180° Interlocking',
    alt: 'Red staircase 1..n and blue 180°-rotated copy snapping into a solid n by (n+1) rectangle.',
    body: ['Red staircase 1..n and blue 180°-rotated copy snapping into a solid n by (n+1) rectangle.'],
    cam: { target: [0, 0.15, 0], az: 16, el: 20, dist: 5.8 },
    lit: 'stair_red',
    parts: ['stair_red', 'stair_blue'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Difference Engine',
    fig: 'Figure 6.2 · Linear 1st Difference d vs Quadratic 2nd Difference 2a',
    title: 'Linear 1st Difference d vs Quadratic 2nd Difference 2a',
    alt: '3D sequence pillars with red 1st-difference risers and amber 2nd-difference bridges.',
    body: ['3D sequence pillars with red 1st-difference risers and amber 2nd-difference bridges.'],
    cam: { target: [0, 0.15, 0], az: 2, el: 20, dist: 5.8 },
    lit: 'seq_pillars',
    parts: ['seq_pillars'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Golden Spiral',
    fig: 'Figure 6.3 · Fibonacci Rectangles & Golden Ratio φ → 1.618',
    title: 'Fibonacci Rectangles & Golden Ratio φ → 1.618',
    alt: 'Tiled squares of side 1, 1, 2, 3, 5, 8 spiralling toward Fₙ₊₁/Fₙ → φ.',
    body: ['Tiled squares of side 1, 1, 2, 3, 5, 8 spiralling toward Fₙ₊₁/Fₙ → φ.'],
    cam: { target: [0, 0.15, 0], az: -12, el: 20, dist: 5.8 },
    lit: 'fib_tiles',
    parts: ['fib_tiles'],
    look: { xray: 0, section: 0 },
  }
];

export const PLATES = {
  stair_red: {
    title: 'Original Staircase Sₙ (Red)',
    text: 'Columns of height a₁, a₂, …, aₙ rising by d at each step.',
    facts: s => [['Terms n', `${s.gs.n}`], ['Sum Sₙ', `${s.gs.sum}`]],
  },
  stair_blue: {
    title: '180°-Rotated Clone Staircase (Blue)',
    text: 'Flipped upside-down so its tallest column aₙ sits on top of a₁. Every single column now has uniform height (a₁ + aₙ)!',
    facts: s => [['Column height', `${s.gs.a1} + ${s.gs.an} = ${s.gs.pairHeight}`], ['2·Sₙ rectangle', `${s.gs.n} × ${s.gs.pairHeight} = ${s.gs.rectArea}`]],
  },
  seq_pillars: {
    title: '1st & 2nd Difference Riser Pillars',
    text: 'A linear sequence dn + c has constant 1st difference d; a quadratic sequence an² + bn + c has constant 2nd difference 2a.',
    facts: s => [['1st diff', `d = ${s.gs.d}`], ['2nd diff (an²)', '2a']],
  },
  fib_tiles: {
    title: 'Fibonacci Square Tiling (1, 1, 2, 3, 5, 8)',
    text: 'Adjoining squares of Fibonacci side lengths form rectangles whose aspect ratio converges to φ = (1 + √5)/2 ≈ 1.618.',
    facts: s => [['Golden ratio φ', '1.61803']],
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
    
    const pRed = g('stair_red');
    const pBlue = g('stair_blue');
    for (let i = 0; i < 10; i++) {
      pRed.add(E.algebraTile({ width: 0.26, height: 1.0, depth: 0.36, color: E.MATH_COL.setA }));
      pBlue.add(E.algebraTile({ width: 0.26, height: 1.0, depth: 0.36, color: E.MATH_COL.setB, opacity: 0.88 }));
    }

    const pSeq = g('seq_pillars');
    pSeq.add(E.curveTube({ fn: u => [-1.4 + 2.8 * u, -0.7 + 1.4 * u * u, -0.25], radius: 0.038, color: E.MATH_COL.warn }));

    const pFib = g('fib_tiles');
    pFib.add(E.wireBox({ width: 2.1, height: 1.3, depth: 0.2, color: E.MATH_COL.proof }));

    return {
      at(s, p) {
        const n = s.gs.n;
        const totH = s.gs.pairHeight * 0.14;
        for (let i = 0; i < 10; i++) {
          const active = i < n;
          pRed.children[i].visible = active;
          pBlue.children[i].visible = active;
          if (active) {
            const x = (i - (n - 1) / 2) * 0.3;
            const h1 = (p.firstA1 + i * p.diffD) * 0.14;
            const h2 = totH - h1;
            pRed.children[i].scale.y = h1;
            pRed.children[i].position.set(x, -0.75 + h1 / 2, 0);
            const gap = (1 - p.foldT) * 0.85;
            pBlue.children[i].scale.y = h2;
            pBlue.children[i].position.set(x, -0.75 + h1 + h2 / 2 + gap, 0);
          }
        }
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
  no: 6,
  title: "Ch 6 · Sequences, Differences & Gauss's 180° Staircase",
  PAGES,
  pages: PAGES,
  PLATES,
  clock0: 0,
  cuts: true,
  defaultParams: {'stepsN': 6, 'firstA1': 1, 'diffD': 1, 'foldT': 1},
  controls: [
    { id: 'stepsN', label: 'Staircase steps n', min: 3, max: 10, step: 1, value: 6, unit: 'steps' },
    { id: 'firstA1', label: 'First term a₁', min: 1, max: 5, step: 1, value: 1, unit: '' },
    { id: 'diffD', label: 'Step difference d', min: 1, max: 4, step: 1, value: 1, unit: '' },
    { id: 'foldT', label: 'Interlock clone (0 apart → 1 locked)', min: 0, max: 1, step: 0.05, value: 1, unit: '' }
  ],
  lessons: {
    'atlas-ch06-1': { page: 0, params: {'stepsN': 6, 'firstA1': 1, 'diffD': 1, 'foldT': 1} },
    'atlas-ch06-2': { page: 1, params: {'diffD': 2} },
    'atlas-ch06-3': { page: 2, params: {} },
    'w_gauss_staircase_sum': { page: 0, params: {} },
    'w_sequence_difference_engine': { page: 1, params: {} }
  },
  state(clock = 0, reduced = false) {
    const p = CHAPTER.params || CHAPTER.defaultParams;
    const t = typeof clock === 'number' ? (reduced ? 1.0 : clock) : 0;
    const gs = M.arithmeticSeries(p.stepsN, p.firstA1, p.diffD); return { t, gs, foldT: p.foldT };
  },
  readout(s, pageObj, pageIdx = 0) {
    CHAPTER._pageIdx = pageIdx;
    if (pageIdx === 0) return `<b>Gauss's Interlocked Staircase</b> · n = ${s.gs.n}, a₁ = ${s.gs.a1}, aₙ = ${s.gs.an} → Each column sums to <b>${s.gs.pairHeight}</b> → Rectangle = ${s.gs.n} × ${s.gs.pairHeight} = ${s.gs.rectArea} → <b>Sₙ = ½(${s.gs.rectArea}) = ${s.gs.sum}</b>.`;
    if (pageIdx === 1) return `<b>Sequence Differences</b> · Linear Tₙ = ${s.gs.a1} + (n−1)·${s.gs.d} has constant 1st difference <b>d = ${s.gs.d}</b> · Quadratic an² has constant 2nd difference <b>Δ² = 2a</b>.`;
    return `<b>Fibonacci & Golden Spiral</b> · Square tiles 1², 1², 2², 3², 5², 8² spiral with ratio Fₙ₊₁/Fₙ → <b>φ = (1+√5)/2 ≈ 1.618</b>.`;
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
