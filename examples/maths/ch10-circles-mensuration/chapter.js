// Ch 10 · Archimedes' πr² Sector Comb, Trapezium Shear & 3D Volumes — 3D Interactive Mathematics Atlas chapter.
import { SUBJECT } from '../subject.js';
import * as EKit from '../../../engine/math_kit.js';
import * as M from './model.js';

export const PAGES = [
  {
    tab: 'Circle πr² Comb',
    fig: 'Figure 10.1 · Why A = πr² by Comb-Interlocking 24 Sectors into a πr × r Box',
    title: 'Why A = πr² by Comb-Interlocking 24 Sectors into a πr × r Box',
    alt: '12 red top sectors and 12 blue bottom sectors unfolding and interlocking into a rectangle of base πr and height r.',
    body: ['12 red top sectors and 12 blue bottom sectors unfolding and interlocking into a rectangle of base πr and height r.'],
    cam: { target: [0, 0.15, 0], az: 16, el: 20, dist: 5.8 },
    lit: 'sectors_comb',
    parts: ['sectors_comb', 'dim_frame'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Trapezium Pair',
    fig: 'Figure 10.2 · Why A_trap = ½(a + b)h by Doubling into a Parallelogram',
    title: 'Why A_trap = ½(a + b)h by Doubling into a Parallelogram',
    alt: 'Green trapezium and flipped amber copy locking into a parallelogram of base (a + b) and perpendicular height h.',
    body: ['Green trapezium and flipped amber copy locking into a parallelogram of base (a + b) and perpendicular height h.'],
    cam: { target: [0, 0.15, 0], az: 2, el: 20, dist: 5.8 },
    lit: 'trap_pair',
    parts: ['trap_pair'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Cavalieri Dome',
    fig: 'Figure 10.3 · From 2D Base Circle to 3D Cross-Section Volume V = A_cross × L',
    title: 'From 2D Base Circle to 3D Cross-Section Volume V = A_cross × L',
    alt: 'Semicircular Cavalieri cross-sections rising over a base circle with prism volume comparison.',
    body: ['Semicircular Cavalieri cross-sections rising over a base circle with prism volume comparison.'],
    cam: { target: [0, 0.15, 0], az: -12, el: 20, dist: 5.8 },
    lit: 'cavalieri_slices',
    parts: ['cavalieri_slices'],
    look: { xray: 0, section: 0 },
  }
];

export const PLATES = {
  sectors_comb: {
    title: '24 Comb-Interlocked Pizza Sectors',
    text: '12 red wedges point down and 12 blue wedges point up. Interlocking them forms a near-rectangle of width πr and height r!',
    facts: s => [['Base πr', `${s.cc.halfCirc.toFixed(2)} m`], ['Height r', `${s.cc.r.toFixed(2)} m`], ['Area πr²', `${s.cc.exactArea.toFixed(2)} m²`]],
  },
  dim_frame: {
    title: 'Bounding Rectangle (πr × r)',
    text: 'Half the circumference (½ × 2πr = πr) runs along the bottom, and the radius r stands upright as the altitude.',
    facts: s => [['C = 2πr', `${s.cc.circumference.toFixed(2)} m`]],
  },
  trap_pair: {
    title: 'Doubled Trapezium Parallelogram',
    text: 'Flipping an identical copy upside-down beside the original creates a parallelogram of base (a + b) and height h, so one trapezium is ½(a + b)h.',
    facts: s => [['Base a + b', `${s.td.paraBase.toFixed(1)} m`], ['Area ½(a+b)h', `${s.td.trapArea.toFixed(2)} m²`]],
  },
  cavalieri_slices: {
    title: 'Cavalieri Cross-Section Arch Slices',
    text: 'Summing semicircular cross-sections A(x) = ½π(r² − x²) across [−r, r] integrates to V = ⅔πr³.',
    facts: s => [['Hemisphere V', `${s.hemiV.toFixed(2)} m³`]],
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
    
    const pComb = g('sectors_comb');
    const N = 16;
    const dTheta = (2 * Math.PI) / N;
    for (let i = 0; i < N; i++) {
      const isTop = i < N / 2;
      const col = isTop ? E.MATH_COL.setA : E.MATH_COL.setB;
      const w = E.arcSector({ radius: 1.1, angle: dTheta * 0.94, thickness: 0.14, color: col, opacity: 0.88 });
      pComb.add(w);
    }
    const pFrame = g('dim_frame');
    pFrame.add(E.wireBox({ width: Math.PI * 1.1, height: 1.1, depth: 0.18, color: E.MATH_COL.warn }));

    const pTrap = g('trap_pair');
    pTrap.add(E.algebraTile({ width: 2.4, height: 0.85, depth: 0.14, color: E.MATH_COL.proof, opacity: 0.78 }));
    pTrap.position.set(0, -1.05, 0);

    const pCav = g('cavalieri_slices');
    for (let k = -4; k <= 4; k++) {
      const rSlice = Math.sqrt(Math.max(0.05, 1.2 * 1.2 - (k * 0.24) * (k * 0.24)));
      const arch = E.arcSector({ radius: rSlice, angle: Math.PI, thickness: 0.08, color: E.MATH_COL.inter, opacity: 0.7 });
      arch.position.set(k * 0.24, -0.4, 0.35);
      pCav.add(arch);
    }

    return {
      at(s, p, pageIdx) {
        const u = p.unfoldT;
        const r = p.radiusR;
        const halfN = N / 2;
        const stepX = (Math.PI * r) / halfN;
        pComb.children.forEach((w, i) => {
          const isTop = i < halfN;
          const idx = isTop ? i : i - halfN;
          const circleAng = i * dTheta;
          const combAng = isTop ? -Math.PI / 2 - dTheta / 2 : Math.PI / 2 - dTheta / 2;
          const combX = (idx - (halfN - 1) / 2) * stepX + (isTop ? stepX * 0.25 : -stepX * 0.25);
          const combY = isTop ? r * 0.48 : -r * 0.48;
          w.scale.set(r / 1.1, r / 1.1, 1);
          w.position.set(u * combX, u * combY, 0);
          w.rotation.z = (1 - u) * circleAng + u * combAng;
        });
        pFrame.scale.set(r / 1.1, r / 1.1, 1);
        pFrame.visible = u > 0.5;
        pTrap.visible = pageIdx === 1;
        pCav.visible = pageIdx === 2;
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
  no: 10,
  title: "Ch 10 · Archimedes' πr² Sector Comb, Trapezium Shear & 3D Volumes",
  PAGES,
  pages: PAGES,
  PLATES,
  clock0: 0,
  cuts: true,
  defaultParams: {'radiusR': 1.2, 'unfoldT': 1.0, 'trapA': 1.2, 'trapB': 2.2},
  controls: [
    { id: 'radiusR', label: 'Circle / Dome radius r', min: 0.8, max: 1.6, step: 0.1, value: 1.2, unit: 'm' },
    { id: 'unfoldT', label: 'Unfold & comb sectors (0 circle → 1 box)', min: 0, max: 1, step: 0.05, value: 1.0, unit: '' },
    { id: 'trapA', label: 'Trapezium top side a', min: 0.8, max: 2.0, step: 0.2, value: 1.2, unit: 'm' },
    { id: 'trapB', label: 'Trapezium bottom side b', min: 1.4, max: 2.8, step: 0.2, value: 2.2, unit: 'm' }
  ],
  lessons: {
    'atlas-ch10-1': { page: 0, params: {'radiusR': 1.2, 'unfoldT': 1.0} },
    'atlas-ch10-2': { page: 1, params: {'trapA': 1.2, 'trapB': 2.2} },
    'atlas-ch10-3': { page: 2, params: {'radiusR': 1.2} },
    'w_circle_sector_rearranger': { page: 0, params: {} },
    'w_trapezium_prism_slicer': { page: 1, params: {} }
  },
  state(clock = 0, reduced = false) {
    const p = CHAPTER.params || CHAPTER.defaultParams;
    const t = typeof clock === 'number' ? (reduced ? 1.0 : clock) : 0;
    const cc = M.circleSectorComb(p.radiusR, 24); const td = M.trapeziumDouble(p.trapA, p.trapB, 1.0); const hemiV = M.hemisphereVolume(p.radiusR); return { t, cc, td, hemiV, unfoldT: p.unfoldT };
  },
  readout(s, pageObj, pageIdx = 0) {
    CHAPTER._pageIdx = pageIdx;
    if (pageIdx === 0) return `<b>Sector Rearrangement</b> · r = ${s.cc.r.toFixed(1)} m → Half-circumference base <b>πr = ${s.cc.halfCirc.toFixed(2)} m</b> × upright height <b>r = ${s.cc.r.toFixed(1)} m</b> = <b>πr² = ${s.cc.exactArea.toFixed(2)} m²</b>.`;
    if (pageIdx === 1) return `<b>Doubled Trapezium</b> · Top a = ${s.td.a.toFixed(1)} m + Bottom b = ${s.td.b.toFixed(1)} m = Parallelogram base <b>${s.td.paraBase.toFixed(1)} m</b> → Single trapezium = <b>½(${s.td.paraBase.toFixed(1)})(1.0) = ${s.td.trapArea.toFixed(2)} m²</b>.`;
    return `<b>Cavalieri Cross-Sections</b> · Base radius r = ${s.cc.r.toFixed(1)} m → Semicircular slices integrate to <b>V = ⅔πr³ = ${s.hemiV.toFixed(2)} m³</b>.`;
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
