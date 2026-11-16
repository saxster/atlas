// Ch 3 · Singapore Ratio Bar Models & Exponential Compounding — 3D Interactive Mathematics Atlas chapter.
import { SUBJECT } from '../subject.js';
import * as EKit from '../../../engine/math_kit.js';
import * as M from './model.js';

export const PAGES = [
  {
    tab: 'Unitary Ratio Bar',
    fig: 'Figure 3.1 · Singapore Equal-Unit Bar Model (Find 1 Unit First)',
    title: 'Singapore Equal-Unit Bar Model (Find 1 Unit First)',
    alt: 'Segmented red and blue 3D bar blocks showing how total or difference resolves 1 equal unit.',
    body: ['Segmented red and blue 3D bar blocks showing how total or difference resolves 1 equal unit.'],
    cam: { target: [0, 0.15, 0], az: 16, el: 20, dist: 5.8 },
    lit: 'unit_bar_a',
    parts: ['unit_bar_a', 'unit_bar_b'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: '+p% then −p% Trap',
    fig: 'Figure 3.2 · Why +20% Followed by −20% Lands at 0.96 (4% Loss!)',
    title: 'Why +20% Followed by −20% Lands at 0.96 (4% Loss!)',
    alt: '3D multiplier columns: 1.00 → 1.20 → 0.96 = 1 − p², proving percentage changes multiply.',
    body: ['3D multiplier columns: 1.00 → 1.20 → 0.96 = 1 − p², proving percentage changes multiply.'],
    cam: { target: [0, 0.15, 0], az: 2, el: 20, dist: 5.8 },
    lit: 'mult_col',
    parts: ['mult_col'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Compound vs Simple',
    fig: 'Figure 3.3 · 20-Year Compound Growth P(1 + r)ⁿ vs Linear Interest',
    title: '20-Year Compound Growth P(1 + r)ⁿ vs Linear Interest',
    alt: 'Side-by-side 3D bar towers of white principal, red simple interest, and amber compound interest.',
    body: ['Side-by-side 3D bar towers of white principal, red simple interest, and amber compound interest.'],
    cam: { target: [0, 0.15, 0], az: -12, el: 20, dist: 5.8 },
    lit: 'comp_tower',
    parts: ['simple_tower', 'comp_tower'],
    look: { xray: 0, section: 0 },
  }
];

export const PLATES = {
  unit_bar_a: {
    title: 'Singapore Share A Bar (Red)',
    text: 'Composed of partsA identical unit boxes. Finding 1 unit first unlocks every ratio question immediately.',
    facts: s => [['Units A', `${s.rp.partsA}`], ['Share A', `₹${s.rp.shareA}`]],
  },
  unit_bar_b: {
    title: 'Singapore Share B Bar (Blue)',
    text: 'Composed of partsB identical unit boxes. The difference bracket spans |B − A| units.',
    facts: s => [['Units B', `${s.rp.partsB}`], ['Share B', `₹${s.rp.shareB}`], ['Total', `₹${s.rp.total}`]],
  },
  mult_col: {
    title: 'Sequential Multiplier Pillars',
    text: '+20% scales 1.00 to 1.20; −20% takes 20% off the larger 1.20 (which is −0.24), landing at 0.96 = 1 − (0.20)².',
    facts: s => [['After +20%', '1.20'], ['After −20%', '0.96 (−4%)']],
  },
  simple_tower: {
    title: 'Linear Simple Interest Tower (Red)',
    text: 'Adds P·r each year without compounding: P(1 + n·r).',
    facts: s => [['20-yr Simple', `₹${s.cs.simpleTotal.toFixed(0)}`]],
  },
  comp_tower: {
    title: 'Exponential Compound Tower (Amber)',
    text: 'Multiplies by (1 + r) each year so interest itself earns interest: P(1 + r)ⁿ.',
    facts: s => [['20-yr Compound', `₹${s.cs.compoundTotal.toFixed(0)}`], ['Compound Bonus', `+₹${s.cs.extraCompound.toFixed(0)}`]],
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
    
    const pBarA = g('unit_bar_a');
    const pBarB = g('unit_bar_b');
    for (let i = 0; i < 8; i++) {
      const a = E.algebraTile({ width: 0.34, height: 0.36, depth: 0.28, color: E.MATH_COL.setA });
      a.position.set(-1.35 + i * 0.38, 0.45, 0);
      pBarA.add(a);
      const b = E.algebraTile({ width: 0.34, height: 0.36, depth: 0.28, color: E.MATH_COL.setB });
      b.position.set(-1.35 + i * 0.38, -0.05, 0);
      pBarB.add(b);
    }

    const pMult = g('mult_col');
    pMult.add(E.barPillar({ x: -0.7, z: 0, width: 0.38, depth: 0.38, height: 1.0, color: E.MATH_COL.setB }));
    pMult.add(E.barPillar({ x: 0, z: 0, width: 0.38, depth: 0.38, height: 1.2, color: E.MATH_COL.proof }));
    pMult.add(E.barPillar({ x: 0.7, z: 0, width: 0.38, depth: 0.38, height: 0.96, color: E.MATH_COL.setA }));

    const pSimp = g('simple_tower');
    const pComp = g('comp_tower');
    for (let i = 0; i < 8; i++) {
      const x = -1.4 + i * 0.4;
      pSimp.add(E.barPillar({ x: x - 0.06, z: -0.2, width: 0.14, depth: 0.22, height: 0.8, color: E.MATH_COL.setA }));
      pComp.add(E.barPillar({ x: x + 0.06, z: 0.2, width: 0.14, depth: 0.22, height: 0.8, color: E.MATH_COL.warn }));
    }

    return {
      at(s, p) {
        pBarA.children.forEach((c, idx) => { c.visible = idx < p.partsA; });
        pBarB.children.forEach((c, idx) => { c.visible = idx < p.partsB; });
        const r = p.ratePct / 100;
        for (let i = 0; i < 8; i++) {
          const yr = i * 2.5;
          pSimp.children[i].scale.y = (1 + yr * r) * 0.45;
          pComp.children[i].scale.y = Math.pow(1 + r, yr) * 0.45;
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
  no: 3,
  title: 'Ch 3 · Singapore Ratio Bar Models & Exponential Compounding',
  PAGES,
  pages: PAGES,
  PLATES,
  clock0: 0,
  cuts: true,
  defaultParams: {'partsA': 3, 'partsB': 5, 'unitVal': 40, 'ratePct': 8},
  controls: [
    { id: 'partsA', label: 'Ratio parts A', min: 2, max: 7, step: 1, value: 3, unit: 'units' },
    { id: 'partsB', label: 'Ratio parts B', min: 2, max: 8, step: 1, value: 5, unit: 'units' },
    { id: 'unitVal', label: 'Value of 1 unit (₹)', min: 10, max: 100, step: 10, value: 40, unit: '₹' },
    { id: 'ratePct', label: 'Annual interest rate r (%)', min: 4, max: 15, step: 1, value: 8, unit: '%' }
  ],
  lessons: {
    'atlas-ch03-1': { page: 0, params: {'partsA': 3, 'partsB': 5, 'unitVal': 40} },
    'atlas-ch03-2': { page: 1, params: {} },
    'atlas-ch03-3': { page: 2, params: {'ratePct': 8} },
    'w_singapore_ratio_bar_model': { page: 0, params: {} },
    'w_compound_multiplier_machine': { page: 2, params: {} }
  },
  state(clock = 0, reduced = false) {
    const p = CHAPTER.params || CHAPTER.defaultParams;
    const t = typeof clock === 'number' ? (reduced ? 1.0 : clock) : 0;
    const rp = M.ratioBarPartition(p.partsA, p.partsB, p.unitVal); const cs = M.compoundVsSimple(1000, p.ratePct, 20); return { t, rp, cs };
  },
  readout(s, pageObj, pageIdx = 0) {
    CHAPTER._pageIdx = pageIdx;
    if (pageIdx === 0) return `<b>Singapore Unitary Bar</b> · Ratio ${s.rp.partsA}:${s.rp.partsB} (${s.rp.totalParts} units) · 1 unit = ₹${s.rp.unitVal} → <b>Share A = ₹${s.rp.shareA}</b>, <b>Share B = ₹${s.rp.shareB}</b>, Total = ₹${s.rp.total}.`;
    if (pageIdx === 1) return `<b>Sequential Multiplier Trap</b> · +20% × −20% = 1.20 × 0.80 = <b>0.96</b> (a <b>4% loss</b> because 20% of 1.20 is 0.24!).`;
    return `<b>20-Year Growth at ${s.cs.ratePct}%</b> · Simple interest = ₹${s.cs.simpleTotal.toFixed(0)} vs Compound P(1+r)²⁰ = <b>₹${s.cs.compoundTotal.toFixed(0)}</b> (+₹${s.cs.extraCompound.toFixed(0)} extra from interest-on-interest!).`;
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
