// Ch 1 · Directed Numbers, Primes & HCF × LCM = ab — 3D Interactive Mathematics Atlas chapter.
import { SUBJECT } from '../subject.js';
import * as EKit from '../../../engine/math_kit.js';
import * as M from './model.js';

export const PAGES = [
  {
    tab: '180° Rotation',
    fig: 'Figure 1.1 · Why (−a) × (−b) = +ab on the Number Line',
    title: 'Why (−a) × (−b) = +ab on the Number Line',
    alt: 'A 3D directed vector rotating by 180° for each negative factor so two half-turns complete +360°.',
    body: ['A 3D directed vector rotating by 180° for each negative factor so two half-turns complete +360°.'],
    cam: { target: [0, 0.15, 0], az: 16, el: 20, dist: 5.8 },
    lit: 'rot_arrow',
    parts: ['num_line', 'rot_arrow'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'HCF × LCM Pillars',
    fig: 'Figure 1.2 · Prime-Factor Venn & HCF(a,b) × LCM(a,b) = a × b',
    title: 'Prime-Factor Venn & HCF(a,b) × LCM(a,b) = a × b',
    alt: '3D prime-exponent towers showing min(exponents) = HCF and max(exponents) = LCM.',
    body: ['3D prime-exponent towers showing min(exponents) = HCF and max(exponents) = LCM.'],
    cam: { target: [0, 0.15, 0], az: 2, el: 20, dist: 5.8 },
    lit: 'hcf_pillar',
    parts: ['hcf_pillar', 'lcm_pillar'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Index & √2 Square',
    fig: 'Figure 1.3 · Index Staircase aᵐ·aⁿ = aᵐ⁺ⁿ & Irrational √2 Diagonal',
    title: 'Index Staircase aᵐ·aⁿ = aᵐ⁺ⁿ & Irrational √2 Diagonal',
    alt: 'Unit square with diagonal √2 alongside geometric powers staircase.',
    body: ['Unit square with diagonal √2 alongside geometric powers staircase.'],
    cam: { target: [0, 0.15, 0], az: -12, el: 20, dist: 5.8 },
    lit: 'root2_diag',
    parts: ['index_tower', 'root2_diag'],
    look: { xray: 0, section: 0 },
  }
];

export const PLATES = {
  num_line: {
    title: 'Directed Number Line Axis',
    text: 'Zero sits at the fulcrum; positive numbers extend right (+x) and negative numbers sit at 180° across the origin.',
    facts: s => [['Origin', '0'], ['Angle', `${s.rot.angleDeg}°`]],
  },
  rot_arrow: {
    title: '180° Half-Turn Vector',
    text: 'Multiplying by −1 rotates a vector by 180°. Two negative signs apply two 180° half-turns = 360°, landing back on the positive axis!',
    facts: s => [['Flips', `${s.rot.flips} × 180°`], ['Result', `${s.rot.signedValue > 0 ? '+' : ''}${s.rot.signedValue}`]],
  },
  hcf_pillar: {
    title: 'HCF Shared Prime Overlap (Blue)',
    text: 'Takes min(exp_A, exp_B) for every prime factor — the greatest common divisor shared inside both numbers.',
    facts: s => [['HCF(a,b)', `${s.inv.hcf}`]],
  },
  lcm_pillar: {
    title: 'LCM Union Prime Pillar (Amber)',
    text: 'Takes max(exp_A, exp_B) for every prime factor. Because min + max = total exponents, HCF × LCM = a × b always!',
    facts: s => [['LCM(a,b)', `${s.inv.lcm}`], ['HCF×LCM', `${s.inv.productHcfLcm}`]],
  },
  index_tower: {
    title: 'Index Law Power Tower (2ᵐ · 2² = 2ᵐ⁺²)',
    text: 'Multiplying powers with the same base concatenates their factor chains, adding exponents.',
    facts: s => [['2ᵐ', `${1 << s.expM}`], ['2ᵐ·2²', `${1 << (s.expM + 2)}`]],
  },
  root2_diag: {
    title: 'Irrational √2 Unit-Square Diagonal',
    text: 'By Pythagoras on a 1×1 square, d² = 1² + 1² = 2, so d = √2 ≈ 1.4142 — no integer fraction p/q can ever square to 2.',
    facts: s => [['Diagonal', '√2 ≈ 1.4142']],
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
    
    const pLine = g('num_line');
    pLine.add(E.numberLine3D({ min: -2.2, max: 2.2, step: 0.5, color: E.MATH_COL.axis }));

    const pRot = g('rot_arrow');
    pRot.add(E.vectorArrow({ from: [0, 0.12, 0], to: [1.45, 0.12, 0], color: E.MATH_COL.setA, radius: 0.042 }));
    pRot.add(E.arcSector({ radius: 0.85, angle: Math.PI, thickness: 0.06, color: E.MATH_COL.warn, opacity: 0.6 }));

    const pHcf = g('hcf_pillar');
    const hBar = E.barPillar({ x: -0.55, z: -0.35, width: 0.45, depth: 0.45, height: 0.9, color: E.MATH_COL.setB });
    pHcf.add(hBar);

    const pLcm = g('lcm_pillar');
    const lBar = E.barPillar({ x: 0.55, z: -0.35, width: 0.45, depth: 0.45, height: 1.5, color: E.MATH_COL.warn });
    pLcm.add(lBar);

    const pIdx = g('index_tower');
    pIdx.add(E.barPillar({ x: -0.9, z: 0.35, width: 0.35, depth: 0.35, height: 1.1, color: E.MATH_COL.proof }));

    const pRoot2 = g('root2_diag');
    pRoot2.add(E.rightTrianglePlate({ a: 1.1, b: 1.1, thickness: 0.12, color: E.MATH_COL.inter, opacity: 0.8 }));
    pRoot2.position.set(0.25, -0.45, 0.25);

    return {
      at(s, p) {
        pRot.rotation.z = (s.rot.angleDeg * Math.PI) / 180;
        hBar.scale.y = Math.max(0.25, s.inv.hcf / 18);
        lBar.scale.y = Math.max(0.35, Math.min(2.2, s.inv.lcm / 48));
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
  no: 1,
  title: 'Ch 1 · Directed Numbers, Primes & HCF × LCM = ab',
  PAGES,
  pages: PAGES,
  PLATES,
  clock0: 0,
  cuts: true,
  defaultParams: {'numA': 24, 'numB': 36, 'negFlips': 2, 'expM': 3},
  controls: [
    { id: 'numA', label: 'Integer a', min: 6, max: 60, step: 2, value: 24, unit: '' },
    { id: 'numB', label: 'Integer b', min: 6, max: 60, step: 2, value: 36, unit: '' },
    { id: 'negFlips', label: 'Negative factor flips (0, 1, 2)', min: 0, max: 2, step: 1, value: 2, unit: '×180°' },
    { id: 'expM', label: 'Exponent m (2ᵐ)', min: 1, max: 5, step: 1, value: 3, unit: '' }
  ],
  lessons: {
    'atlas-ch01-1': { page: 0, params: {'negFlips': 2} },
    'atlas-ch01-2': { page: 1, params: {'numA': 24, 'numB': 36} },
    'atlas-ch01-3': { page: 2, params: {'expM': 3} },
    'w_negative_rotation_line': { page: 0, params: {} },
    'w_prime_venn_hcf_lcm': { page: 1, params: {} },
    'w_index_staircase_surds': { page: 2, params: {} }
  },
  state(clock = 0, reduced = false) {
    const p = CHAPTER.params || CHAPTER.defaultParams;
    const t = typeof clock === 'number' ? (reduced ? 1.0 : clock) : 0;
    const inv = M.hcfLcmInvariant(p.numA, p.numB); const rot = M.directedRotation(4, p.negFlips); return { t, inv, rot, expM: p.expM };
  },
  readout(s, pageObj, pageIdx = 0) {
    CHAPTER._pageIdx = pageIdx;
    if (pageIdx === 0) return `<b>Directed Rotation</b> · ${s.rot.flips} × 180° = ${s.rot.angleDeg}° → Signed result = <b>${s.rot.signedValue > 0 ? '+' : ''}${s.rot.signedValue}</b> (two half-turns restore positive!).`;
    if (pageIdx === 1) return `<b>Prime Invariant</b> · a = ${s.inv.a}, b = ${s.inv.b} → <b>HCF = ${s.inv.hcf}</b>, <b>LCM = ${s.inv.lcm}</b> · Check: ${s.inv.hcf} × ${s.inv.lcm} = <b>${s.inv.productHcfLcm}</b> = ${s.inv.a} × ${s.inv.b}.`;
    return `<b>Index Laws & Surds</b> · 2^${s.expM} × 2² = 2^${s.expM + 2} = <b>${1 << (s.expM + 2)}</b> · Unit square diagonal d = <b>√2 ≈ 1.41421356</b>.`;
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
