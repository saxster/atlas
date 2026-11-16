// Ch 17 · Bayes Unit-Square Eikosogram, Probability Trees & Expected Value Fulcrum — 3D Interactive Mathematics Atlas chapter.
import { SUBJECT } from '../subject.js';
import * as EKit from '../../../engine/math_kit.js';
import * as M from './model.js';

export const PAGES = [
  {
    tab: 'Bayes Eikosogram',
    fig: 'Figure 17.1 · Why Low Base Rate Makes False Positives Dominate Positive Tests',
    title: 'Why Low Base Rate Makes False Positives Dominate Positive Tests',
    alt: '3D unit square partitioned vertically by Prevalence P(D) and horizontally by Sensitivity/False-Positive rate.',
    body: ['3D unit square partitioned vertically by Prevalence P(D) and horizontally by Sensitivity/False-Positive rate.'],
    cam: { target: [0, 0.15, 0], az: 16, el: 20, dist: 5.8 },
    lit: 'bayes_slabs',
    parts: ['bayes_slabs'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Probability Tree',
    fig: 'Figure 17.2 · Multiplying Along Branches & Summing Across Disjoint Paths',
    title: 'Multiplying Along Branches & Summing Across Disjoint Paths',
    alt: '3D branching conduits whose cross-sectional widths split proportionally to conditional probabilities.',
    body: ['3D branching conduits whose cross-sectional widths split proportionally to conditional probabilities.'],
    cam: { target: [0, 0.15, 0], az: 2, el: 20, dist: 5.8 },
    lit: 'prob_tree',
    parts: ['prob_tree'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Expectation Fulcrum',
    fig: 'Figure 17.3 · Why E[X] = Σ xᵢ pᵢ Is the Center of Mass on a Balance Beam',
    title: 'Why E[X] = Σ xᵢ pᵢ Is the Center of Mass on a Balance Beam',
    alt: 'Probability masses pᵢ placed at positions xᵢ balancing perfectly on a fulcrum at μ = E[X].',
    body: ['Probability masses pᵢ placed at positions xᵢ balancing perfectly on a fulcrum at μ = E[X].'],
    cam: { target: [0, 0.15, 0], az: -12, el: 20, dist: 5.8 },
    lit: 'ev_beam',
    parts: ['ev_beam'],
    look: { xray: 0, section: 0 },
  }
];

export const PLATES = {
  bayes_slabs: {
    title: 'Bayes Unit-Square Area Partition (TP vs FP)',
    text: 'Red slab = True Positives P(D)P(+|D); Amber slab = False Positives P(¬D)P(+|¬D). Posterior P(D|+) is simply Red Area ÷ (Red + Amber Area)!',
    facts: s => [['True Positive (Red)', `${(s.by.tp*100).toFixed(2)}%`], ['False Positive (Amber)', `${(s.by.fp*100).toFixed(2)}%`], ['Posterior P(D|+)', `${(s.by.posterior*100).toFixed(1)}%`]],
  },
  prob_tree: {
    title: 'Conditional Probability Branching Tree',
    text: "Multiplying along a path gives the joint probability P(A ∩ B) = P(A)P(B|A); adding the two '+' leaves gives total P(+).",
    facts: s => [['Path D → +', `${(s.by.tp*100).toFixed(2)}%`], ['Path ¬D → +', `${(s.by.fp*100).toFixed(2)}%`], ['Total P(+)', `${(s.by.totalPos*100).toFixed(2)}%`]],
  },
  ev_beam: {
    title: 'Expected Value Balance Fulcrum (E[X] = Σ xᵢ pᵢ)',
    text: 'Probability distribution acts like physical weights on a rod: the balance point where net torque Σ(xᵢ − μ)pᵢ = 0 is E[X].',
    facts: s => [['Center of mass μ', 'E[X] = Σ xᵢ pᵢ'], ['Spread σ²', 'E[(X − μ)²]']],
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
    
    const pSlabs = g('bayes_slabs');
    const tpTile = E.algebraTile({ width: 0.35, height: 1.8, depth: 0.24, color: E.MATH_COL.setA, opacity: 0.92 });
    const fpTile = E.algebraTile({ width: 1.85, height: 0.35, depth: 0.22, color: E.MATH_COL.warn, opacity: 0.88 });
    const tnTile = E.algebraTile({ width: 1.85, height: 1.45, depth: 0.14, color: E.MATH_COL.setB, opacity: 0.45 });
    pSlabs.add(tpTile, fpTile, tnTile);

    const pTree = g('prob_tree');
    pTree.add(E.vectorArrow({ from: [-1.5, -1.15, 0.25], to: [0, -0.9, 0.25], color: E.MATH_COL.setA, radius: 0.035 }));
    pTree.add(E.vectorArrow({ from: [-1.5, -1.15, 0.25], to: [0, -1.35, 0.25], color: E.MATH_COL.warn, radius: 0.035 }));

    const pEv = g('ev_beam');
    pEv.add(E.vectorArrow({ from: [-1.4, 1.25, 0], to: [1.4, 1.25, 0], color: E.MATH_COL.proof, radius: 0.03 }));

    return {
      at(s) {
        const wD = Math.max(0.12, s.by.pD * 2.2);
        const wNot = 2.2 - wD;
        const hSens = Math.max(0.15, s.by.sens * 2.0);
        const hFpr = Math.max(0.12, s.by.fpr * 2.0);
        tpTile.scale.set(wD / 0.35, hSens / 1.8, 1);
        tpTile.position.set(-1.1 + wD / 2, -0.9 + hSens / 2, 0.05);
        fpTile.scale.set(wNot / 1.85, hFpr / 0.35, 1);
        fpTile.position.set(-1.1 + wD + wNot / 2, -0.9 + hFpr / 2, 0.03);
        tnTile.scale.set(wNot / 1.85, (2.0 - hFpr) / 1.45, 1);
        tnTile.position.set(-1.1 + wD + wNot / 2, -0.9 + hFpr + (2.0 - hFpr) / 2, 0);
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
  no: 17,
  title: 'Ch 17 · Bayes Unit-Square Eikosogram, Probability Trees & Expected Value Fulcrum',
  PAGES,
  pages: PAGES,
  PLATES,
  clock0: 0,
  cuts: true,
  defaultParams: {'prevPct': 2, 'sensPct': 95, 'specPct': 90},
  controls: [
    { id: 'prevPct', label: 'Base rate P(D) (%)', min: 1, max: 30, step: 1, value: 2, unit: '%' },
    { id: 'sensPct', label: 'Sensitivity P(+|D) (%)', min: 70, max: 99, step: 1, value: 95, unit: '%' },
    { id: 'specPct', label: 'Specificity P(−|¬D) (%)', min: 70, max: 99, step: 1, value: 90, unit: '%' }
  ],
  lessons: {
    'atlas-ch17-1': { page: 0, params: {'prevPct': 2, 'sensPct': 95, 'specPct': 90} },
    'atlas-ch17-2': { page: 1, params: {'prevPct': 10, 'sensPct': 90, 'specPct': 90} },
    'atlas-ch17-3': { page: 2, params: {} },
    'w_bayes_eikosogram_square': { page: 0, params: {} },
    'w_probability_tree_plumber': { page: 1, params: {} }
  },
  state(clock = 0, reduced = false) {
    const p = CHAPTER.params || CHAPTER.defaultParams;
    const t = typeof clock === 'number' ? (reduced ? 1.0 : clock) : 0;
    const by = M.bayesEikosogram(p.prevPct, p.sensPct, p.specPct); return { t, by };
  },
  readout(s, pageObj, pageIdx = 0) {
    CHAPTER._pageIdx = pageIdx;
    if (pageIdx === 0) return `<b>Bayes Eikosogram</b> · Base rate = ${s.by.prevPct}%, Sens = ${s.by.sensPct}%, Spec = ${s.by.specPct}% → True Pos = <b>${(s.by.tp*100).toFixed(2)}%</b> vs False Pos = <b>${(s.by.fp*100).toFixed(2)}%</b> → <b>P(D | +) = ${(s.by.posterior*100).toFixed(1)}%</b>!`;
    if (pageIdx === 1) return `<b>Law of Total Probability</b> · P(+) = P(D)P(+|D) + P(¬D)P(+|¬D) = ${(s.by.tp*100).toFixed(2)}% + ${(s.by.fp*100).toFixed(2)}% = <b>${(s.by.totalPos*100).toFixed(2)}%</b>.`;
    return `<b>Expected Value Fulcrum</b> · Placing probability weights pᵢ at positions xᵢ balances at <b>μ = E[X] = Σ xᵢ pᵢ</b> where net torque is zero.`;
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
