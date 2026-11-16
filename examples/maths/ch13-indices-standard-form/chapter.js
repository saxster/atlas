// Ch 13 · Exponent Staircase (a⁰ = 1), Log Scales & Pyramid Scaling (k, k², k³) — 3D Interactive Mathematics Atlas chapter.
import { SUBJECT } from '../subject.js';
import * as EKit from '../../../engine/math_kit.js';
import * as M from './model.js';

export const PAGES = [
  {
    tab: 'Exponent Staircase',
    fig: 'Figure 13.1 · Why Stepping Down by ÷a Forces a⁰ = 1 and a⁻ⁿ = 1/aⁿ',
    title: 'Why Stepping Down by ÷a Forces a⁰ = 1 and a⁻ⁿ = 1/aⁿ',
    alt: '3D exponential pillars for a³, a², a¹, a⁰, a⁻¹ where each step right divides height by base a.',
    body: ['3D exponential pillars for a³, a², a¹, a⁰, a⁻¹ where each step right divides height by base a.'],
    cam: { target: [0, 0.15, 0], az: 16, el: 20, dist: 5.8 },
    lit: 'exp_pillars',
    parts: ['exp_pillars'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'k, k², k³ Scaling',
    fig: 'Figure 13.2 · Why Doubling Length Multiplies Area by k² and Volume by k³',
    title: 'Why Doubling Length Multiplies Area by k² and Volume by k³',
    alt: 'Reference 1×1×1 cube beside a k-scaled cube split into k² face tiles and k³ unit sub-cubes.',
    body: ['Reference 1×1×1 cube beside a k-scaled cube split into k² face tiles and k³ unit sub-cubes.'],
    cam: { target: [0, 0.15, 0], az: 2, el: 20, dist: 5.8 },
    lit: 'scale_cubes',
    parts: ['scale_cubes'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Logarithmic Powers',
    fig: 'Figure 13.3 · Compressing 10⁻³ to 10⁶ onto an Equal-Ratio Log Axis',
    title: 'Compressing 10⁻³ to 10⁶ onto an Equal-Ratio Log Axis',
    alt: '3D powers-of-ten towers mapped onto a linear log₁₀ rail where equal steps multiply by ×10.',
    body: ['3D powers-of-ten towers mapped onto a linear log₁₀ rail where equal steps multiply by ×10.'],
    cam: { target: [0, 0.15, 0], az: -12, el: 20, dist: 5.8 },
    lit: 'log_rail',
    parts: ['log_rail'],
    look: { xray: 0, section: 0 },
  }
];

export const PLATES = {
  exp_pillars: {
    title: 'Divide-by-a Exponent Pillars (a³, a², a¹, a⁰, a⁻¹)',
    text: 'Every step down the exponent staircase divides by base a: a² ÷ a = a¹, so a¹ ÷ a = a⁰ = 1, and 1 ÷ a = a⁻¹ = 1/a.',
    facts: s => [['a³ → a² → a¹', `${Math.pow(s.baseA,3)} → ${Math.pow(s.baseA,2)} → ${s.baseA}`], ['a⁰ = a¹ ÷ a', '1 (always!)'], ['a⁻¹ = 1 ÷ a', `1/${s.baseA} = ${(1/s.baseA).toFixed(3)}`]],
  },
  scale_cubes: {
    title: 'k, k², k³ Enlargement Cube Lattice',
    text: 'Scaling every edge by k multiplies each 2D face into k × k = k² tiles and the 3D interior into k × k × k = k³ unit cubes!',
    facts: s => [['Length ratio k', `${s.sc.lengthRatio}×`], ['Area ratio k²', `${s.sc.areaRatio}×`], ['Volume ratio k³', `${s.sc.volumeRatio}×`]],
  },
  log_rail: {
    title: 'Log₁₀ Order-of-Magnitude Axis',
    text: 'On a logarithmic axis, equal physical distances represent equal multiplication factors (×10) rather than equal additions.',
    facts: s => [['10ⁿ value', `${Math.pow(10, s.sciExp).toLocaleString()}`], ['log₁₀(10ⁿ)', `${s.sciExp}`]],
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
    
    const pExp = g('exp_pillars');
    for (let i = 0; i < 5; i++) {
      const col = i === 3 ? E.MATH_COL.setA : E.MATH_COL.setB;
      const pil = E.barPillar({ x: -1.4 + i * 0.55, z: -0.35, width: 0.34, depth: 0.34, height: 1.0, color: col });
      pExp.add(pil);
    }
    const pCubes = g('scale_cubes');
    const cUnit = E.algebraTile({ width: 0.38, height: 0.38, depth: 0.38, color: E.MATH_COL.proof });
    cUnit.position.set(0.45, -0.5, 0.55);
    const cScaled = E.algebraTile({ width: 0.38, height: 0.38, depth: 0.38, color: E.MATH_COL.warn, opacity: 0.8 });
    cScaled.position.set(1.35, -0.2, 0.55);
    pCubes.add(cUnit, cScaled);

    const pLog = g('log_rail');
    pLog.add(E.numberLine3D({ min: -1.8, max: 1.8, step: 0.6, color: E.MATH_COL.axis }));
    pLog.position.y = -0.85;

    return {
      at(s, p) {
        const exps = [3, 2, 1, 0, -1];
        exps.forEach((e, idx) => {
          const h = Math.max(0.08, Math.pow(p.baseA, e) * 0.22);
          pExp.children[idx].scale.y = h;
          pExp.children[idx].position.y = -0.85;
        });
        const k = p.scaleK * 0.75;
        cScaled.scale.set(k, k, k);
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
  no: 13,
  title: 'Ch 13 · Exponent Staircase (a⁰ = 1), Log Scales & Pyramid Scaling (k, k², k³)',
  PAGES,
  pages: PAGES,
  PLATES,
  clock0: 0,
  cuts: true,
  defaultParams: {'baseA': 2, 'scaleK': 2, 'sciExp': 3},
  controls: [
    { id: 'baseA', label: 'Exponent base a', min: 2, max: 4, step: 1, value: 2, unit: '' },
    { id: 'scaleK', label: 'Linear scale factor k', min: 1, max: 4, step: 1, value: 2, unit: '×' },
    { id: 'sciExp', label: 'Standard form exponent n (10ⁿ)', min: -2, max: 5, step: 1, value: 3, unit: '' }
  ],
  lessons: {
    'atlas-ch13-1': { page: 0, params: {'baseA': 2} },
    'atlas-ch13-2': { page: 1, params: {'scaleK': 2} },
    'atlas-ch13-3': { page: 2, params: {'sciExp': 3} },
    'w_exponent_staircase_zero': { page: 0, params: {} },
    'w_scale_factor_k_k2_k3': { page: 1, params: {} }
  },
  state(clock = 0, reduced = false) {
    const p = CHAPTER.params || CHAPTER.defaultParams;
    const t = typeof clock === 'number' ? (reduced ? 1.0 : clock) : 0;
    const st = M.exponentStaircase(p.baseA); const sc = M.similarityScaling(p.scaleK); return { t, baseA: p.baseA, st, sc, sciExp: p.sciExp };
  },
  readout(s, pageObj, pageIdx = 0) {
    CHAPTER._pageIdx = pageIdx;
    if (pageIdx === 0) return `<b>Exponent Pattern</b> · Base a = ${s.baseA}: ${Math.pow(s.baseA,3)} →(÷${s.baseA})→ ${Math.pow(s.baseA,2)} →(÷${s.baseA})→ ${s.baseA} →(÷${s.baseA})→ <b>${s.baseA}⁰ = 1</b> →(÷${s.baseA})→ <b>${s.baseA}⁻¹ = 1/${s.baseA}</b>.`;
    if (pageIdx === 1) return `<b>Similarity Scaling (k, k², k³)</b> · Linear scale <b>k = ${s.sc.k}×</b> → Surface area scales by <b>k² = ${s.sc.areaRatio}×</b> · Volume/Mass scales by <b>k³ = ${s.sc.volumeRatio}×</b>.`;
    return `<b>Standard Form & Log Scale</b> · 10<sup>${s.sciExp}</sup> = <b>${Math.pow(10, s.sciExp)}</b> · log₁₀(10<sup>${s.sciExp}</sup>) = <b>${s.sciExp}</b> (each unit step = ×10).`;
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
