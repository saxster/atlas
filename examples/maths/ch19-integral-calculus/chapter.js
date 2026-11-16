// Ch 19 · Riemann Slabs, Fundamental Theorem dA/dx = f(x) & Solids of Revolution — 3D Interactive Mathematics Atlas chapter.
import { SUBJECT } from '../subject.js';
import * as EKit from '../../../engine/math_kit.js';
import * as M from './model.js';

export const PAGES = [
  {
    tab: 'Riemann Slabs',
    fig: 'Figure 19.1 · Approximating Curved Area by Summing N Thin Rectangular Pillars',
    title: 'Approximating Curved Area by Summing N Thin Rectangular Pillars',
    alt: '3D Riemann pillars under f(x) = 0.25x² + 0.5 converging to the exact definite integral as N increases.',
    body: ['3D Riemann pillars under f(x) = 0.25x² + 0.5 converging to the exact definite integral as N increases.'],
    cam: { target: [0, 0.15, 0], az: 16, el: 20, dist: 5.8 },
    lit: 'riemann_bars',
    parts: ['riemann_bars', 'exact_curve'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'FTC Sliver dA = f(x)dx',
    fig: 'Figure 19.2 · Why the Rate of Change of Accumulated Area Is the Curve Height Itself',
    title: 'Why the Rate of Change of Accumulated Area Is the Curve Height Itself',
    alt: "Accumulated area slab A(x) plus the newly swept red boundary sliver of width dx and height f(x), proving A'(x) = f(x).",
    body: ["Accumulated area slab A(x) plus the newly swept red boundary sliver of width dx and height f(x), proving A'(x) = f(x)."],
    cam: { target: [0, 0.15, 0], az: 2, el: 20, dist: 5.8 },
    lit: 'ftc_sliver',
    parts: ['riemann_bars', 'ftc_sliver'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Solid of Revolution',
    fig: 'Figure 19.3 · Spinning f(x) Around the x-Axis into π[f(x)]² Discs',
    title: 'Spinning f(x) Around the x-Axis into π[f(x)]² Discs',
    alt: '3D cylindrical discs of radius R = f(x) and volume dV = π[f(x)]² dx stacked along the x-axis.',
    body: ['3D cylindrical discs of radius R = f(x) and volume dV = π[f(x)]² dx stacked along the x-axis.'],
    cam: { target: [0, 0.15, 0], az: -12, el: 20, dist: 5.8 },
    lit: 'rev_discs',
    parts: ['rev_discs'],
    look: { xray: 0, section: 0 },
  }
];

export const PLATES = {
  riemann_bars: {
    title: 'Riemann Sum Pillars (Σ f(xᵢ*) Δx)',
    text: 'Slicing [0, x] into N rectangles of width Δx turns a curved area problem into a finite sum whose limit is ∫₀ˣ f(t) dt.',
    facts: s => [['Slabs N', `${s.im.n}`], ['Riemann sum', `${s.im.midpointSum.toFixed(4)}`], ['Exact ∫ f(t)dt', `${s.im.exactArea.toFixed(4)}`]],
  },
  exact_curve: {
    title: 'Antiderivative Profile F(x) = x³/12 + x/2',
    text: "Because F'(x) = 0.25x² + 0.5 = f(x), evaluating F(x) − F(0) gives the exact area in one step.",
    facts: s => [['Upper x', `${s.im.upperX.toFixed(1)}`], ['f(x)', `${s.im.boundaryHeight.toFixed(3)}`]],
  },
  ftc_sliver: {
    title: 'FTC Boundary Sliver (dA = f(x) dx)',
    text: 'Pushing the right wall out by dx adds a thin ribbon of height f(x) and area dA ≈ f(x) dx. Dividing by dx proves dA/dx = f(x)!',
    facts: s => [['dA / dx', `f(${s.im.upperX.toFixed(1)}) = ${s.im.boundaryHeight.toFixed(3)}`]],
  },
  rev_discs: {
    title: 'Solid of Revolution Discs (V = ∫ π[f(x)]² dx)',
    text: 'Spinning each vertical strip of radius R = f(x) around the x-axis sweeps a coin of area πR² and volume π[f(x)]² dx.',
    facts: s => [['Disc volume V', `${s.im.discVolSum.toFixed(3)} m³`]],
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
    
    const f = x => 0.25 * x * x + 0.5;
    const pBars = g('riemann_bars');
    for (let i = 0; i < 24; i++) {
      const b = E.algebraTile({ width: 0.14, height: 1.0, depth: 0.36, color: E.MATH_COL.setB, opacity: 0.82 });
      pBars.add(b);
    }
    const pCurve = g('exact_curve');
    pCurve.add(E.curveTube({ fn: u => { const x = u * 3.0; return [x - 1.5, f(x) - 0.8, 0.22]; }, radius: 0.038, color: E.MATH_COL.proof }));

    const pSliver = g('ftc_sliver');
    const sliv = E.algebraTile({ width: 0.12, height: 1.0, depth: 0.44, color: E.MATH_COL.setA, opacity: 0.95 });
    pSliver.add(sliv);

    const pDiscs = g('rev_discs');
    for (let k = 0; k < 8; k++) {
      const xm = (k + 0.5) * 0.32;
      const r = f(xm) * 0.55;
      const d = E.lensDisc({ radius: r, thickness: 0.12, color: E.MATH_COL.warn, opacity: 0.65 });
      d.rotation.y = Math.PI / 2;
      d.position.set(xm - 1.5, -0.8, -0.35);
      pDiscs.add(d);
    }

    return {
      at(s, p, pageIdx) {
        const N = s.im.n;
        const dx = p.upperX / N;
        for (let i = 0; i < 24; i++) {
          const active = i < N;
          pBars.children[i].visible = active;
          if (active) {
            const xm = (i + 0.5) * dx;
            const h = f(xm);
            pBars.children[i].scale.set((dx * 0.92) / 0.14, h, 1);
            pBars.children[i].position.set(xm - 1.5, -0.8 + h / 2, 0);
          }
        }
        const hEdge = f(p.upperX);
        sliv.scale.y = hEdge;
        sliv.position.set(p.upperX - 1.5, -0.8 + hEdge / 2, 0.05);
        pDiscs.visible = pageIdx === 2;
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
  no: 19,
  title: 'Ch 19 · Riemann Slabs, Fundamental Theorem dA/dx = f(x) & Solids of Revolution',
  PAGES,
  pages: PAGES,
  PLATES,
  clock0: 0,
  cuts: true,
  defaultParams: {'numBins': 10, 'upperX': 2.4, 'spinFrac': 0.85},
  controls: [
    { id: 'numBins', label: 'Riemann slabs N', min: 4, max: 24, step: 2, value: 10, unit: 'slabs' },
    { id: 'upperX', label: 'Upper boundary x', min: 1.0, max: 3.0, step: 0.2, value: 2.4, unit: '' },
    { id: 'spinFrac', label: 'Revolution sweep (0 flat → 1 full 360°)', min: 0.1, max: 1.0, step: 0.1, value: 0.85, unit: '' }
  ],
  lessons: {
    'atlas-ch19-1': { page: 0, params: {'numBins': 10, 'upperX': 2.4} },
    'atlas-ch19-2': { page: 1, params: {'upperX': 2.2} },
    'atlas-ch19-3': { page: 2, params: {'numBins': 12, 'spinFrac': 0.9} },
    'w_riemann_ftc_accumulator': { page: 0, params: {} },
    'w_solid_of_revolution_lathe': { page: 2, params: {} }
  },
  state(clock = 0, reduced = false) {
    const p = CHAPTER.params || CHAPTER.defaultParams;
    const t = typeof clock === 'number' ? (reduced ? 1.0 : clock) : 0;
    const im = M.integralModel(p.numBins, p.upperX); return { t, im, spinFrac: p.spinFrac };
  },
  readout(s, pageObj, pageIdx = 0) {
    CHAPTER._pageIdx = pageIdx;
    if (pageIdx === 0) return `<b>Riemann Sum → Definite Integral</b> · N = ${s.im.n} slabs on [0, ${s.im.upperX.toFixed(1)}] → Midpoint sum = <b>${s.im.midpointSum.toFixed(4)}</b> vs Exact F(${s.im.upperX.toFixed(1)}) − F(0) = <b>${s.im.exactArea.toFixed(4)}</b>.`;
    if (pageIdx === 1) return `<b>Fundamental Theorem of Calculus</b> · Moving boundary x = ${s.im.upperX.toFixed(1)} by dx sweeps sliver <b>dA = f(x) dx</b> → <b>dA/dx = f(x) = ${s.im.boundaryHeight.toFixed(3)}</b> (differentiation & integration are inverses!).`;
    return `<b>Solid of Revolution</b> · Revolving f(x) around the x-axis stacks ${s.im.n} coins of radius R = f(x) → <b>V = ∫ π[f(x)]² dx ≈ ${s.im.discVolSum.toFixed(2)}</b>.`;
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
