// Ch 12 · Singapore Bar Models, Simultaneous Elimination & Balance Scales — 3D Interactive Mathematics Atlas chapter.
import { SUBJECT } from '../subject.js';
import * as EKit from '../../../engine/math_kit.js';
import * as M from './model.js';

export const PAGES = [
  {
    tab: 'Singapore Bar Difference',
    fig: 'Figure 12.1 · Why Equal-Length Aligned Bars Expose Unknown x Without Guessing',
    title: 'Why Equal-Length Aligned Bars Expose Unknown x Without Guessing',
    alt: '3D stacked bar blocks for 3x + 12 = 48 where slicing off the known 12-block leaves 3 equal x-blocks totaling 36.',
    body: ['3D stacked bar blocks for 3x + 12 = 48 where slicing off the known 12-block leaves 3 equal x-blocks totaling 36.'],
    cam: { target: [0, 0.15, 0], az: 16, el: 20, dist: 5.8 },
    lit: 'bar_stack',
    parts: ['bar_stack', 'diff_brace'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Simultaneous Bars',
    fig: 'Figure 12.2 · Eliminating y by Differencing Two Stacked Bar Equations',
    title: 'Eliminating y by Differencing Two Stacked Bar Equations',
    alt: 'Two multi-bar rows (2x + y = 19 and x + y = 12) aligned so subtracting the bottom row leaves x = 7 directly.',
    body: ['Two multi-bar rows (2x + y = 19 and x + y = 12) aligned so subtracting the bottom row leaves x = 7 directly.'],
    cam: { target: [0, 0.15, 0], az: 2, el: 20, dist: 5.8 },
    lit: 'simul_bars',
    parts: ['simul_bars'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Balance Pan Lever',
    fig: 'Figure 12.3 · Maintaining Equality by Identical Operations on Both Pans',
    title: 'Maintaining Equality by Identical Operations on Both Pans',
    alt: '3D twin-pan balance beam remaining level as identical weights and x-blocks are removed from both sides.',
    body: ['3D twin-pan balance beam remaining level as identical weights and x-blocks are removed from both sides.'],
    cam: { target: [0, 0.15, 0], az: -12, el: 20, dist: 5.8 },
    lit: 'balance_beam',
    parts: ['balance_beam'],
    look: { xray: 0, section: 0 },
  }
];

export const PLATES = {
  bar_stack: {
    title: '3 Equal x-Blocks + Constant Block c',
    text: 'Drawing 3 identical blue x-bars plus an amber c-bar aligned against the total bar makes 3x = Total − c visually self-evident.',
    facts: s => [['Equation', `3x + ${s.sb.c} = ${s.sb.total}`], ['3x remainder', `${s.sb.remainder}`], ['1 unit x', `${s.sb.solvedX}`]],
  },
  diff_brace: {
    title: 'Partition Bracket (Total − c)',
    text: 'Removing the overhanging constant c leaves 3 equal parts of size (Total − c) ÷ 3.',
    facts: s => [['x = (Total−c)/3', `${s.sb.solvedX}`]],
  },
  simul_bars: {
    title: 'Simultaneous Bar Alignment (2x + y vs x + y)',
    text: 'Because both rows contain the exact same green y-bar, the overhang between Row 1 and Row 2 IS one red x-bar!',
    facts: s => [['Row 1 (2x+y)', `${s.sim.row1}`], ['Row 2 (x+y)', `${s.sim.row2}`], ['Overhang x', `${s.sim.diffX}`], ['Remaining y', `${s.sim.solvedY}`]],
  },
  balance_beam: {
    title: 'Equilibrium Balance Beam',
    text: 'Subtracting the same weight from both pans leaves the torque zero and isolates x.',
    facts: s => [['Left pan', `3(${s.sb.x}) + ${s.sb.c} = ${s.sb.total}`], ['Right pan', `${s.sb.total}`]],
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
    
    const pStack = g('bar_stack');
    for (let i = 0; i < 3; i++) {
      const bx = E.algebraTile({ width: 0.78, height: 0.36, depth: 0.32, color: E.MATH_COL.setB });
      bx.position.set(-1.05 + i * 0.82, 0.45, 0);
      pStack.add(bx);
    }
    const bc = E.algebraTile({ width: 0.78, height: 0.36, depth: 0.32, color: E.MATH_COL.warn });
    bc.position.set(1.42, 0.45, 0);
    pStack.add(bc);

    const pBrace = g('diff_brace');
    const bTot = E.algebraTile({ width: 3.25, height: 0.36, depth: 0.32, color: E.MATH_COL.proof, opacity: 0.82 });
    bTot.position.set(0.18, -0.05, 0);
    pBrace.add(bTot);

    const pSim = g('simul_bars');
    const sRow = E.algebraTile({ width: 2.2, height: 0.32, depth: 0.28, color: E.MATH_COL.setA, opacity: 0.82 });
    sRow.position.set(-0.35, -0.65, 0);
    pSim.add(sRow);

    const pBeam = g('balance_beam');
    pBeam.add(E.vectorArrow({ from: [-1.5, -1.15, 0], to: [1.5, -1.15, 0], color: E.MATH_COL.axis, radius: 0.035 }));

    return {
      at(s, p) {
        const xScale = p.xVal / 12;
        for (let i = 0; i < 3; i++) pStack.children[i].scale.x = xScale;
        bc.scale.x = p.constC / 12;
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
  no: 12,
  title: 'Ch 12 · Singapore Bar Models, Simultaneous Elimination & Balance Scales',
  PAGES,
  pages: PAGES,
  PLATES,
  clock0: 0,
  cuts: true,
  defaultParams: {'xVal': 12, 'yVal': 5, 'constC': 12},
  controls: [
    { id: 'xVal', label: 'True unknown x', min: 4, max: 15, step: 1, value: 12, unit: 'units' },
    { id: 'yVal', label: 'Second unknown y', min: 3, max: 14, step: 1, value: 5, unit: 'units' },
    { id: 'constC', label: 'Added constant c', min: 4, max: 24, step: 2, value: 12, unit: 'units' }
  ],
  lessons: {
    'atlas-ch12-1': { page: 0, params: {'xVal': 12, 'constC': 12} },
    'atlas-ch12-2': { page: 1, params: {'xVal': 7, 'yVal': 5} },
    'atlas-ch12-3': { page: 2, params: {'xVal': 8, 'constC': 10} },
    'w_singapore_bar_architect': { page: 0, params: {} },
    'w_algebra_balance_beam': { page: 2, params: {} }
  },
  state(clock = 0, reduced = false) {
    const p = CHAPTER.params || CHAPTER.defaultParams;
    const t = typeof clock === 'number' ? (reduced ? 1.0 : clock) : 0;
    const sb = M.singaporeBar(p.xVal, p.constC); const sim = M.simultaneousBars(p.xVal, p.yVal); return { t, sb, sim };
  },
  readout(s, pageObj, pageIdx = 0) {
    CHAPTER._pageIdx = pageIdx;
    if (pageIdx === 0) return `<b>Singapore Bar Model</b> · Total = <b>${s.sb.total}</b>, Constant c = <b>${s.sb.c}</b> → 3 equal x-bars = ${s.sb.total} − ${s.sb.c} = <b>${s.sb.remainder}</b> → <b>x = ${s.sb.solvedX}</b>.`;
    if (pageIdx === 1) return `<b>Simultaneous Bar Elimination</b> · Row 1 (2x + y = <b>${s.sim.row1}</b>) − Row 2 (x + y = <b>${s.sim.row2}</b>) cancels the y-bar, exposing <b>x = ${s.sim.diffX}</b> and <b>y = ${s.sim.solvedY}</b>.`;
    return `<b>Balance Scale Invariant</b> · Removing ${s.sb.c} from both pans preserves equilibrium: 3x = ${s.sb.remainder} → dividing into 3 equal groups gives <b>x = ${s.sb.solvedX}</b>.`;
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
