// Ch 18 · Secant-to-Tangent Limit (h → 0), Power Rule dx² & Stationary Optimisation — 3D Interactive Mathematics Atlas chapter.
import { SUBJECT } from '../subject.js';
import * as EKit from '../../../engine/math_kit.js';
import * as M from './model.js';

export const PAGES = [
  {
    tab: 'Secant → Tangent',
    fig: 'Figure 18.1 · Sliding Δx = h → 0 Until the Secant Chord Locks into the Tangent Line',
    title: 'Sliding Δx = h → 0 Until the Secant Chord Locks into the Tangent Line',
    alt: '3D curve y = x³/3 − x² + 2 with red tangent line at x₀ and blue secant chord across [x₀, x₀ + h].',
    body: ['3D curve y = x³/3 − x² + 2 with red tangent line at x₀ and blue secant chord across [x₀, x₀ + h].'],
    cam: { target: [0, 0.15, 0], az: 16, el: 20, dist: 5.8 },
    lit: 'secant_tangent',
    parts: ['curve_arch', 'secant_tangent'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'd(x²) = 2x dx Tile',
    fig: 'Figure 18.2 · Why Expanding a Square by dx Adds Two x·dx Strips + a Vanishing (dx)² Corner',
    title: 'Why Expanding a Square by dx Adds Two x·dx Strips + a Vanishing (dx)² Corner',
    alt: 'Geometric x×x square with two red x·dx border strips and tiny amber (dx)² corner showing d(x²)/dx = 2x + dx → 2x.',
    body: ['Geometric x×x square with two red x·dx border strips and tiny amber (dx)² corner showing d(x²)/dx = 2x + dx → 2x.'],
    cam: { target: [0, 0.15, 0], az: 2, el: 20, dist: 5.8 },
    lit: 'dx_square',
    parts: ['dx_square'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Stationary Peak/Trough',
    fig: "Figure 18.3 · Where f'(x) = 0 Pins Maximums, Minimums & Inflection Points",
    title: "Where f'(x) = 0 Pins Maximums, Minimums & Inflection Points",
    alt: "3D curve coupled to its derivative curve f'(x) showing zero-crossings at stationary points x = 0 and x = 2.",
    body: ["3D curve coupled to its derivative curve f'(x) showing zero-crossings at stationary points x = 0 and x = 2."],
    cam: { target: [0, 0.15, 0], az: -12, el: 20, dist: 5.8 },
    lit: 'stationary_arch',
    parts: ['curve_arch', 'stationary_arch'],
    look: { xray: 0, section: 0 },
  }
];

export const PLATES = {
  curve_arch: {
    title: 'Cubic Curve f(x) = x³/3 − x² + 2',
    text: "Has a local maximum at (0, 2) where f'(0) = 0, f''(0) = −2 < 0 and a local minimum at (2, 2/3) where f'(2) = 0, f''(2) = +2 > 0.",
    facts: s => [['f(x₀)', `${s.cc.y0.toFixed(3)}`], ["f'(x₀)", `${s.cc.tangentSlope.toFixed(3)}`], ["f''(x₀)", `${s.cc.secondDeriv.toFixed(2)}`]],
  },
  secant_tangent: {
    title: 'Secant Chord vs Instantaneous Tangent',
    text: "As h → 0, the average rate [f(x₀+h) − f(x₀)] / h smoothly rotates into the instantaneous derivative f'(x₀).",
    facts: s => [['Secant Δy/Δx', `${s.cc.secantSlope.toFixed(3)}`], ["Tangent f'(x₀)", `${s.cc.tangentSlope.toFixed(3)}`], ['Gap', `${Math.abs(s.cc.secantSlope - s.cc.tangentSlope).toFixed(4)}`]],
  },
  dx_square: {
    title: 'Geometric Power Rule: Δ(x²) = 2x·h + h²',
    text: 'Growing a square of side x by h adds two red strips of area x·h plus a tiny amber corner h². Dividing by h gives 2x + h → 2x!',
    facts: s => [['Two strips 2x·h', `${(2*s.cc.x0*s.cc.h).toFixed(3)}`], ['Corner h²', `${(s.cc.h*s.cc.h).toFixed(4)}`], ['Δ(x²)/h = 2x+h', `${s.cc.squareExactRate.toFixed(3)} → ${s.cc.squareLimitRate.toFixed(2)}`]],
  },
  stationary_arch: {
    title: "Derivative Curve f'(x) = x² − 2x",
    text: 'Crosses zero at x = 0 (+ to −, maximum) and x = 2 (− to +, minimum).',
    facts: s => [['Max at x=0', 'y = 2.00'], ['Min at x=2', 'y = 0.67']],
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
    
    const f = x => (x * x * x) / 3 - x * x + 0.9;
    const pCurve = g('curve_arch');
    pCurve.add(E.curveTube({ fn: u => { const x = -1.1 + 3.8 * u; return [x - 0.8, f(x) - 0.3, 0]; }, radius: 0.04, color: E.MATH_COL.setB }));

    const pSec = g('secant_tangent');
    const tanLine = E.vectorArrow({ from: [-0.9, 0, 0.08], to: [0.9, 0, 0.08], color: E.MATH_COL.setA, radius: 0.032 });
    const secLine = E.vectorArrow({ from: [-0.9, 0, 0.14], to: [0.9, 0, 0.14], color: E.MATH_COL.warn, radius: 0.028 });
    const anchorDot = E.nodeSphere({ radius: 0.09, color: E.MATH_COL.setA });
    pSec.add(tanLine, secLine, anchorDot);

    const pSq = g('dx_square');
    const sqCore = E.algebraTile({ width: 0.9, height: 0.9, depth: 0.14, color: E.MATH_COL.setB, opacity: 0.72 });
    sqCore.position.set(1.2, -0.65, -0.25);
    pSq.add(sqCore);

    const pStat = g('stationary_arch');
    pStat.add(E.curveTube({ fn: u => { const x = -0.8 + 3.4 * u; return [x - 0.8, 0.35 * (x * x - 2 * x) - 0.3, -0.2]; }, radius: 0.028, color: E.MATH_COL.proof }));

    return {
      at(s, p, pageIdx) {
        const x0 = p.x0;
        const y0 = f(x0);
        pSec.position.set(x0 - 0.8, y0 - 0.3, 0);
        tanLine.rotation.z = Math.atan(s.cc.tangentSlope);
        secLine.rotation.z = Math.atan(s.cc.secantSlope);
        pSq.visible = pageIdx === 1;
        pStat.visible = pageIdx === 2;
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
  no: 18,
  title: 'Ch 18 · Secant-to-Tangent Limit (h → 0), Power Rule dx² & Stationary Optimisation',
  PAGES,
  pages: PAGES,
  PLATES,
  clock0: 0,
  cuts: true,
  defaultParams: {'x0': 1.0, 'stepH': 0.5},
  controls: [
    { id: 'x0', label: 'Anchor point x₀', min: -0.8, max: 2.6, step: 0.2, value: 1.0, unit: '' },
    { id: 'stepH', label: 'Secant step h = Δx', min: 0.05, max: 1.2, step: 0.05, value: 0.5, unit: '' }
  ],
  lessons: {
    'atlas-ch18-1': { page: 0, params: {'x0': 1.0, 'stepH': 0.5} },
    'atlas-ch18-2': { page: 1, params: {'x0': 1.6, 'stepH': 0.25} },
    'atlas-ch18-3': { page: 2, params: {'x0': 2.0, 'stepH': 0.1} },
    'w_secant_tangent_microscope': { page: 0, params: {} },
    'w_power_rule_square_growth': { page: 1, params: {} },
    'w_box_optimisation_station': { page: 2, params: {} }
  },
  state(clock = 0, reduced = false) {
    const p = CHAPTER.params || CHAPTER.defaultParams;
    const t = typeof clock === 'number' ? (reduced ? 1.0 : clock) : 0;
    const cc = M.cubicCalculus(p.x0, p.stepH); return { t, cc };
  },
  readout(s, pageObj, pageIdx = 0) {
    CHAPTER._pageIdx = pageIdx;
    if (pageIdx === 0) return `<b>Secant → Tangent Limit</b> · At x₀ = ${s.cc.x0.toFixed(1)}, step h = ${s.cc.h.toFixed(2)} → Secant slope = <b>${s.cc.secantSlope.toFixed(3)}</b> vs exact tangent <b>f'(x₀) = ${s.cc.tangentSlope.toFixed(3)}</b>.`;
    if (pageIdx === 1) return `<b>Geometric Power Rule</b> · Expanding side x = ${Math.abs(s.cc.x0).toFixed(1)} by h = ${s.cc.h.toFixed(2)} adds two <b>x·h</b> strips + one <b>h²</b> corner → Δ(x²)/h = <b>2x + h = ${s.cc.squareExactRate.toFixed(2)} → 2x = ${s.cc.squareLimitRate.toFixed(2)}</b>.`;
    return `<b>Stationary Points</b> · f'(x) = x² − 2x = 0 at <b>x = 0 (max, y = 2)</b> and <b>x = 2 (min, y = 2/3)</b> · Current f''(${s.cc.x0.toFixed(1)}) = <b>${s.cc.secondDeriv.toFixed(2)}</b>.`;
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
