// Ch 2 · Fractions, Recurring Decimals & Reciprocal Scaling — 3D Interactive Mathematics Atlas chapter.
import { SUBJECT } from '../subject.js';
import * as EKit from '../../../engine/math_kit.js';
import * as M from './model.js';

export const PAGES = [
  {
    tab: '10ᵏx − x Tail Canceller',
    fig: 'Figure 2.1 · Why 0.abab… = ab / 99 by Infinite Tail Subtraction',
    title: 'Why 0.abab… = ab / 99 by Infinite Tail Subtraction',
    alt: 'Red shifted bar 10ᵏx aligned above blue x so the infinite repeating tails cancel to zero.',
    body: ['Red shifted bar 10ᵏx aligned above blue x so the infinite repeating tails cancel to zero.'],
    cam: { target: [0, 0.15, 0], az: 16, el: 20, dist: 5.8 },
    lit: 'shifted_bar',
    parts: ['shifted_bar', 'tail_bar', 'nine_denom'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Reciprocal Division',
    fig: 'Figure 2.2 · Why Dividing by a/b Multiplies by b/a',
    title: 'Why Dividing by a/b Multiplies by b/a',
    alt: '3D unit slabs sliced into b sub-parts and grouped in bundles of a.',
    body: ['3D unit slabs sliced into b sub-parts and grouped in bundles of a.'],
    cam: { target: [0, 0.15, 0], az: 2, el: 20, dist: 5.8 },
    lit: 'recip_grid',
    parts: ['unit_slabs', 'recip_grid'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Sig-Fig Zoom',
    fig: 'Figure 2.3 · Significant Figures & Relative Precision Bar',
    title: 'Significant Figures & Relative Precision Bar',
    alt: '3D measurement bar with coarse and fine significant-figure vernier markers.',
    body: ['3D measurement bar with coarse and fine significant-figure vernier markers.'],
    cam: { target: [0, 0.15, 0], az: -12, el: 20, dist: 5.8 },
    lit: 'sig_bar',
    parts: ['sig_bar'],
    look: { xray: 0, section: 0 },
  }
];

export const PLATES = {
  shifted_bar: {
    title: 'Shifted Bar 100x (Red)',
    text: 'Multiplying x = 0.abab… by 10² = 100 shifts one full 2-digit period ahead of the decimal point while leaving the exact same infinite tail.',
    facts: s => [['100x', `${s.rec.block}.${String(s.rec.block).padStart(2,'0')}…`]],
  },
  tail_bar: {
    title: 'Original Infinite Tail x (Blue)',
    text: 'Lining up x underneath 100x matches every decimal digit to infinity, so 100x − x = 99x cancels the entire infinite tail!',
    facts: s => [['100x − x', `99x = ${s.rec.block}`]],
  },
  nine_denom: {
    title: 'Simplified Fraction (Green)',
    text: 'Dividing by 99 and cancelling the HCF gives the exact rational fraction.',
    facts: s => [['Fraction', `${s.rec.simpNum}/${s.rec.simpDen}`]],
  },
  unit_slabs: {
    title: 'Whole Dividend Slabs',
    text: 'Each whole unit is sliced into b equal pieces so there are N × b pieces in total.',
    facts: s => [['Total 1/b pieces', `${s.div.totalPieces}`]],
  },
  recip_grid: {
    title: 'Reciprocal Quotient Groups',
    text: 'Grouping the N × b pieces into bundles of size a gives N × (b/a) — proving why dividing by a/b multiplies by b/a.',
    facts: s => [['Quotient', `${s.div.quotient.toFixed(2)}`]],
  },
  sig_bar: {
    title: 'Significant Figure Vernier',
    text: 'Leading zeros are only place-holders; significant figures begin at the first non-zero digit.',
    facts: s => [['Precision', '3 s.f.']],
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
    
    const pShift = g('shifted_bar');
    const b100 = E.algebraTile({ width: 2.6, height: 0.38, depth: 0.28, color: E.MATH_COL.setA });
    b100.position.set(0.15, 0.55, 0);
    pShift.add(b100);

    const pTail = g('tail_bar');
    const b1 = E.algebraTile({ width: 1.8, height: 0.38, depth: 0.28, color: E.MATH_COL.setB });
    b1.position.set(0.55, 0.05, 0);
    pTail.add(b1);

    const pNine = g('nine_denom');
    const b99 = E.algebraTile({ width: 1.4, height: 0.38, depth: 0.28, color: E.MATH_COL.proof });
    b99.position.set(-0.55, -0.5, 0);
    pNine.add(b99);

    const pUnits = g('unit_slabs');
    for (let i = 0; i < 6; i++) {
      const u = E.algebraTile({ width: 0.42, height: 0.75, depth: 0.18, color: E.MATH_COL.warn, opacity: 0.78 });
      u.position.set(-1.3 + i * 0.5, 0.1, -0.25);
      pUnits.add(u);
    }

    const pRecip = g('recip_grid');
    pRecip.add(E.wireBox({ width: 2.6, height: 0.9, depth: 0.26, color: E.MATH_COL.inter }));

    const pSig = g('sig_bar');
    pSig.add(E.numberLine3D({ min: -1.6, max: 1.6, step: 0.4, color: E.MATH_COL.axis }));
    pSig.position.y = -0.95;

    return {
      at(s, p) {
        b99.scale.x = 0.5 + (p.repDigits / 99);
        pUnits.children.forEach((c, idx) => { c.visible = idx < p.wholeUnits; });
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
  no: 2,
  title: 'Ch 2 · Fractions, Recurring Decimals & Reciprocal Scaling',
  PAGES,
  pages: PAGES,
  PLATES,
  clock0: 0,
  cuts: true,
  defaultParams: {'repDigits': 36, 'wholeUnits': 3, 'denomB': 4},
  controls: [
    { id: 'repDigits', label: '2-digit repeating block (0.dd…)', min: 9, max: 81, step: 9, value: 36, unit: '' },
    { id: 'wholeUnits', label: 'Dividend whole units N', min: 1, max: 6, step: 1, value: 3, unit: '' },
    { id: 'denomB', label: 'Divisor denominator b (in N ÷ 2/b)', min: 3, max: 8, step: 1, value: 4, unit: '' }
  ],
  lessons: {
    'atlas-ch02-1': { page: 0, params: {'repDigits': 36} },
    'atlas-ch02-2': { page: 1, params: {'wholeUnits': 3, 'denomB': 4} },
    'atlas-ch02-3': { page: 2, params: {} },
    'w_recurring_decimal_tail_canceller': { page: 0, params: {} },
    'w_fraction_area_division': { page: 1, params: {} }
  },
  state(clock = 0, reduced = false) {
    const p = CHAPTER.params || CHAPTER.defaultParams;
    const t = typeof clock === 'number' ? (reduced ? 1.0 : clock) : 0;
    const rec = M.recurringTwoDigit(p.repDigits); const div = M.divideByFraction(p.wholeUnits, 2, p.denomB); return { t, rec, div };
  },
  readout(s, pageObj, pageIdx = 0) {
    CHAPTER._pageIdx = pageIdx;
    if (pageIdx === 0) return `<b>Recurring Tail Canceller</b> · Let x = 0.${String(s.rec.block).padStart(2,'0')}… → 100x − x = 99x = ${s.rec.block} → <b>x = ${s.rec.rawNum}/99 = ${s.rec.simpNum}/${s.rec.simpDen}</b>.`;
    if (pageIdx === 1) return `<b>Reciprocal Scaling</b> · ${s.div.whole} ÷ (${s.div.numA}/${s.div.denB}) = ${s.div.whole} × (${s.div.denB}/${s.div.numA}) = ${s.div.totalPieces}/${s.div.numA} = <b>${s.div.quotient.toFixed(2)}</b>.`;
    return `<b>Significant Figures</b> · Value ${s.rec.decimal.toFixed(6)} rounded to 3 s.f. is <b>${s.rec.decimal.toPrecision(3)}</b>.`;
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
