// Ch 0 · Sets, Venn Regions & De Morgan's Laws — 3D Interactive Mathematics Atlas chapter.
import { SUBJECT } from '../subject.js';
import * as EKit from '../../../engine/math_kit.js';
import * as M from './model.js';

export const PAGES = [
  {
    tab: 'Inclusion–Exclusion',
    fig: 'Figure 0.1 · 3D Venn Cylinders & Centre Overlap Lens',
    title: '3D Venn Cylinders & Centre Overlap Lens',
    alt: 'Two intersecting 3D cylinders A (red) and B (blue) with raised amber intersection lens A ∩ B.',
    body: ['Two intersecting 3D cylinders A (red) and B (blue) with raised amber intersection lens A ∩ B.'],
    cam: { target: [0, 0.15, 0], az: 16, el: 20, dist: 5.8 },
    lit: 'lens_ab',
    parts: ['circle_a', 'lens_ab', 'circle_b'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'De Morgan Courtyard',
    fig: 'Figure 0.2 · Exterior Complement (A ∪ B)′ = A′ ∩ B′',
    title: 'Exterior Complement (A ∪ B)′ = A′ ∩ B′',
    alt: "Green universal courtyard ξ surrounding the union A ∪ B to prove De Morgan's complement law.",
    body: ["Green universal courtyard ξ surrounding the union A ∪ B to prove De Morgan's complement law."],
    cam: { target: [0, 0.15, 0], az: 2, el: 20, dist: 5.8 },
    lit: 'courtyard',
    parts: ['courtyard', 'circle_a', 'circle_b'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Logic Gate & 2ⁿ Cube',
    fig: 'Figure 0.3 · Truth Table Relay & Power-Set 2ⁿ Hypercube',
    title: 'Truth Table Relay & Power-Set 2ⁿ Hypercube',
    alt: '3D logic pillars for P ∧ Q, P ∨ Q, ¬(P ∧ Q) and a 2³ = 8 subset cube lattice.',
    body: ['3D logic pillars for P ∧ Q, P ∨ Q, ¬(P ∧ Q) and a 2³ = 8 subset cube lattice.'],
    cam: { target: [0, 0.15, 0], az: -12, el: 20, dist: 5.8 },
    lit: 'subset_cube',
    parts: ['logic_pillars', 'subset_cube'],
    look: { xray: 0, section: 0 },
  }
];

export const PLATES = {
  circle_a: {
    title: 'Set A Cylinder (Red)',
    text: 'All elements belonging to set A; includes both Only-A crescent and the shared overlap A ∩ B.',
    facts: s => [['|A|', `${s.v.nA}`], ['Only A', `${s.v.onlyA}`]],
  },
  lens_ab: {
    title: 'Intersection Lens A ∩ B (Amber)',
    text: 'Counted once in |A| and a second time in |B|. Subtracting |A ∩ B| once removes the duplicate count so |A ∪ B| = |A| + |B| − |A ∩ B|.',
    facts: s => [['|A ∩ B|', `${s.v.inter}`], ['|A ∪ B|', `${s.v.union}`]],
  },
  circle_b: {
    title: 'Set B Cylinder (Blue)',
    text: 'All elements belonging to set B; combines with A minus the overlap to give the exact union.',
    facts: s => [['|B|', `${s.v.nB}`], ['Only B', `${s.v.onlyB}`]],
  },
  courtyard: {
    title: 'Universal Complement Courtyard (A ∪ B)′',
    text: 'Green region outside both circles: stepping outside the union means being outside A AND outside B, proving (A ∪ B)′ = A′ ∩ B′.',
    facts: s => [['|(A ∪ B)′|', `${s.v.outside}`], ['|ξ|', `${s.v.universe}`]],
  },
  logic_pillars: {
    title: 'De Morgan Truth-Table Pillars',
    text: 'Four 3D logic columns for (P, Q) ∈ {(0,0), (0,1), (1,0), (1,1)} showing ¬(P ∨ Q) ≡ ¬P ∧ ¬Q.',
    facts: s => [['Tautology', '4/4 rows match']],
  },
  subset_cube: {
    title: 'Power-Set 2³ Boolean Cube',
    text: 'Each element has 2 binary choices (in or out), so a 3-element set forms the 8 vertices of a 3D unit cube (2³ = 8 subsets).',
    facts: s => [['|P(A)|', `${s.pCount} subsets`]],
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
    
    const pA = g('circle_a');
    pA.add(E.lensDisc({ radius: 1.0, thickness: 0.14, color: E.MATH_COL.setA, opacity: 0.68 }));
    pA.position.set(-0.55, 0.35, 0);

    const pB = g('circle_b');
    pB.add(E.lensDisc({ radius: 1.0, thickness: 0.14, color: E.MATH_COL.setB, opacity: 0.68 }));
    pB.position.set(0.55, 0.35, 0);

    const pInter = g('lens_ab');
    pInter.add(E.algebraTile({ width: 0.52, height: 1.15, depth: 0.24, color: E.MATH_COL.inter, opacity: 0.92 }));
    pInter.position.set(0, 0.35, 0.05);

    const pCourt = g('courtyard');
    pCourt.add(E.wireBox({ width: 3.8, height: 2.3, depth: 0.3, color: E.MATH_COL.proof }));
    pCourt.position.set(0, 0.35, 0);

    const pLogic = g('logic_pillars');
    for (let i = 0; i < 4; i++) {
      pLogic.add(E.barPillar({ x: -1.2 + i * 0.8, z: -0.45, width: 0.26, depth: 0.26, height: i === 0 ? 1.1 : 0.3, color: i === 0 ? E.MATH_COL.proof : E.MATH_COL.setA }));
    }

    const pCube = g('subset_cube');
    pCube.add(E.wireBox({ width: 0.95, height: 0.95, depth: 0.95, color: E.MATH_COL.warn }));
    pCube.position.set(0, -0.85, 0.2);

    return {
      at(s, p, pageIdx) {
        const sep = Math.max(0.2, 1.1 - (p.nInter / Math.max(1, Math.min(p.nA, p.nB))) * 0.7);
        pA.position.x = -sep * 0.55;
        pB.position.x = sep * 0.55;
        pInter.scale.set(0.4 + (p.nInter / 12) * 0.8, 1 + 0.05 * Math.sin(s.t * 3), 1);
        pCube.rotation.y = s.t * 0.45;
        pCube.visible = pageIdx === 2;
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
  no: 0,
  title: "Ch 0 · Sets, Venn Regions & De Morgan's Laws",
  PAGES,
  pages: PAGES,
  PLATES,
  clock0: 0,
  cuts: true,
  defaultParams: {'nA': 18, 'nB': 14, 'nInter': 6, 'universe': 30},
  controls: [
    { id: 'nA', label: '|A| (Set A count)', min: 8, max: 24, step: 1, value: 18, unit: '' },
    { id: 'nB', label: '|B| (Set B count)', min: 6, max: 22, step: 1, value: 14, unit: '' },
    { id: 'nInter', label: '|A ∩ B| (Overlap)', min: 1, max: 12, step: 1, value: 6, unit: '' },
    { id: 'universe', label: '|ξ| (Universal set)', min: 24, max: 40, step: 1, value: 30, unit: '' }
  ],
  lessons: {
    'atlas-ch00-1': { page: 0, params: {'nA': 18, 'nB': 14, 'nInter': 6} },
    'atlas-ch00-2': { page: 1, params: {'universe': 30} },
    'atlas-ch00-3': { page: 2, params: {} },
    'w_venn_inclusion_exclusion': { page: 0, params: {} },
    'w_truth_table_logic_gates': { page: 2, params: {} },
    'w_quantifier_counterexample': { page: 1, params: {} }
  },
  state(clock = 0, reduced = false) {
    const p = CHAPTER.params || CHAPTER.defaultParams;
    const t = typeof clock === 'number' ? (reduced ? 1.0 : clock) : 0;
    const v = M.vennPartition(p.nA, p.nB, p.nInter, p.universe); const pCount = M.powerSetCount(3); return { t, v, pCount };
  },
  readout(s, pageObj, pageIdx = 0) {
    CHAPTER._pageIdx = pageIdx;
    if (pageIdx === 0) return `<b>Inclusion–Exclusion</b> · |A| = ${s.v.nA} (Only A = ${s.v.onlyA}) · |B| = ${s.v.nB} (Only B = ${s.v.onlyB}) · Overlap |A ∩ B| = ${s.v.inter} → <b>|A ∪ B| = ${s.v.nA} + ${s.v.nB} − ${s.v.inter} = ${s.v.union}</b>.`;
    if (pageIdx === 1) return `<b>De Morgan's Complement</b> · Universal set |ξ| = ${s.v.universe} · Union |A ∪ B| = ${s.v.union} → Exterior <b>|(A ∪ B)′| = |A′ ∩ B′| = ${s.v.outside}</b>.`;
    return `<b>Truth Table & Power Set</b> · ¬(P ∨ Q) ⇔ ¬P ∧ ¬Q verified across all 4 states · For n = 3 elements, binary choices build a 3D cube of <b>2³ = ${s.pCount} subsets</b>.`;
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
