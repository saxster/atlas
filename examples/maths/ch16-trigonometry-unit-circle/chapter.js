// Ch 16 · Bhaskara's c² Proof, Unit Circle Wave Unrolling & Sine/Cosine Rules — 3D Interactive Mathematics Atlas chapter.
import { SUBJECT } from '../subject.js';
import * as EKit from '../../../engine/math_kit.js';
import * as M from './model.js';

export const PAGES = [
  {
    tab: 'Bhaskara / Garfield',
    fig: 'Figure 16.1 · Why a² + b² = c² by Packing 4 Right Triangles Around a Tilted Square',
    title: 'Why a² + b² = c² by Packing 4 Right Triangles Around a Tilted Square',
    alt: '4 right triangles of legs a, b arranged around tilted square c² vs rearranged into squares a² + b².',
    body: ['4 right triangles of legs a, b arranged around tilted square c² vs rearranged into squares a² + b².'],
    cam: { target: [0, 0.15, 0], az: 16, el: 20, dist: 5.8 },
    lit: 'pythag_pack',
    parts: ['pythag_pack'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Unit Circle Unroller',
    fig: 'Figure 16.2 · How Rotating Radius r = 1 Projects x = cos θ and y = sin θ',
    title: 'How Rotating Radius r = 1 Projects x = cos θ and y = sin θ',
    alt: '3D unit circle with blue cos θ shadow, red sin θ altitude, amber tan θ tangent pillar, and unrolling sine wave.',
    body: ['3D unit circle with blue cos θ shadow, red sin θ altitude, amber tan θ tangent pillar, and unrolling sine wave.'],
    cam: { target: [0, 0.15, 0], az: 2, el: 20, dist: 5.8 },
    lit: 'unit_wheel',
    parts: ['unit_wheel', 'wave_ribbon'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Law of Cosines 3D',
    fig: 'Figure 16.3 · Generalizing Pythagoras to Non-Right Triangles: c² = a² + b² − 2ab cos C',
    title: 'Generalizing Pythagoras to Non-Right Triangles: c² = a² + b² − 2ab cos C',
    alt: 'Oblique triangle with altitude h = b sin C and projection b cos C showing the −2ab cos C overlap correction.',
    body: ['Oblique triangle with altitude h = b sin C and projection b cos C showing the −2ab cos C overlap correction.'],
    cam: { target: [0, 0.15, 0], az: -12, el: 20, dist: 5.8 },
    lit: 'cosine_tri',
    parts: ['cosine_tri'],
    look: { xray: 0, section: 0 },
  }
];

export const PLATES = {
  pythag_pack: {
    title: 'Pythagorean Square Packing (a² + b² = c²)',
    text: 'Inside an (a + b)×(a + b) frame, removing 4 identical ½ab triangles leaves c² when tilted or a² + b² when aligned.',
    facts: s => [['a² + b²', `${(s.cr.a*s.cr.a + s.cr.b*s.cr.b).toFixed(2)}`], ['Hypotenuse c', `${Math.hypot(s.cr.a, s.cr.b).toFixed(2)}`]],
  },
  unit_wheel: {
    title: 'Unit Circle Projections (cos θ, sin θ, tan θ)',
    text: 'On a circle of radius 1, the point (x, y) IS (cos θ, sin θ), so x² + y² = 1 IS cos²θ + sin²θ = 1!',
    facts: s => [['cos θ (blue x)', `${s.uc.cos.toFixed(3)}`], ['sin θ (red y)', `${s.uc.sin.toFixed(3)}`], ['cos²θ + sin²θ', '1.000']],
  },
  wave_ribbon: {
    title: 'Unrolled Sine Wave y = sin θ',
    text: 'Tracking the red vertical leg sin θ as θ sweeps from 0° to 360° traces the periodic sine wave.',
    facts: s => [['θ', `${s.uc.thetaDeg}° (${s.uc.rad.toFixed(2)} rad)`], ['tan θ', `${Math.abs(s.uc.tan) > 50 ? '∞' : s.uc.tan.toFixed(3)}`]],
  },
  cosine_tri: {
    title: 'Law of Cosines Triangle (c² = a² + b² − 2ab cos C)',
    text: 'Dropping altitude h = b sin C splits base a into (a − b cos C); Pythagoras on the right triangle gives c² = (b sin C)² + (a − b cos C)² = a² + b² − 2ab cos C.',
    facts: s => [['a² + b²', `${(s.cr.a*s.cr.a + s.cr.b*s.cr.b).toFixed(2)}`], ['−2ab cos C', `${(-s.cr.corrTerm).toFixed(2)}`], ['c', `${s.cr.c.toFixed(2)}`], ['Area ½ab sin C', `${s.cr.area.toFixed(2)}`]],
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
    
    const pWheel = g('unit_wheel');
    pWheel.add(E.ringTorus({ radius: 1.15, tube: 0.028, color: E.MATH_COL.axis }));
    const cosBar = E.algebraTile({ width: 1.15, height: 0.07, depth: 0.07, color: E.MATH_COL.setB });
    const sinBar = E.algebraTile({ width: 0.07, height: 1.15, depth: 0.07, color: E.MATH_COL.setA });
    const hypDot = E.nodeSphere({ radius: 0.09, color: E.MATH_COL.warn });
    pWheel.add(cosBar, sinBar, hypDot);
    pWheel.position.set(-0.65, 0.1, 0);

    const pWave = g('wave_ribbon');
    pWave.add(E.curveTube({ fn: u => [0.65 + u * 1.6, 0.1 + 1.15 * Math.sin(u * 2 * Math.PI), 0], radius: 0.032, color: E.MATH_COL.setA }));

    const pPyth = g('pythag_pack');
    pPyth.add(E.algebraTile({ width: 0.95, height: 0.95, depth: 0.12, color: E.MATH_COL.proof, opacity: 0.72 }));
    pPyth.position.set(-0.65, 0.1, -0.2);
    pPyth.rotation.z = 0.64;

    const pCos = g('cosine_tri');
    pCos.add(E.rightTrianglePlate({ a: 1.4, b: 1.0, thickness: 0.1, color: E.MATH_COL.inter, opacity: 0.65 }));
    pCos.position.set(0.6, -0.95, 0.15);

    return {
      at(s, p, pageIdx) {
        const c = s.uc.cos * 1.15;
        const sn = s.uc.sin * 1.15;
        cosBar.scale.x = Math.max(0.05, Math.abs(s.uc.cos));
        cosBar.position.set(c / 2, 0, 0.05);
        sinBar.scale.y = Math.max(0.05, Math.abs(s.uc.sin));
        sinBar.position.set(c, sn / 2, 0.05);
        hypDot.position.set(c, sn, 0.08);
        pPyth.visible = pageIdx === 0;
        pCos.visible = pageIdx === 2;
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
  no: 16,
  title: "Ch 16 · Bhaskara's c² Proof, Unit Circle Wave Unrolling & Sine/Cosine Rules",
  PAGES,
  pages: PAGES,
  PLATES,
  clock0: 0,
  cuts: true,
  defaultParams: {'thetaDeg': 50, 'sideA': 1.8, 'sideB': 1.4},
  controls: [
    { id: 'thetaDeg', label: 'Angle θ (°)', min: 0, max: 360, step: 15, value: 50, unit: '°' },
    { id: 'sideA', label: 'Triangle side a', min: 1.2, max: 2.4, step: 0.2, value: 1.8, unit: 'm' },
    { id: 'sideB', label: 'Triangle side b', min: 1.0, max: 2.2, step: 0.2, value: 1.4, unit: 'm' }
  ],
  lessons: {
    'atlas-ch16-1': { page: 0, params: {'sideA': 1.8, 'sideB': 1.4} },
    'atlas-ch16-2': { page: 1, params: {'thetaDeg': 50} },
    'atlas-ch16-3': { page: 2, params: {'thetaDeg': 60, 'sideA': 1.8, 'sideB': 1.4} },
    'w_pythagoras_rearrangement': { page: 0, params: {} },
    'w_unit_circle_wave_unroller': { page: 1, params: {} },
    'w_cosine_sine_rule_bridge': { page: 2, params: {} }
  },
  state(clock = 0, reduced = false) {
    const p = CHAPTER.params || CHAPTER.defaultParams;
    const t = typeof clock === 'number' ? (reduced ? 1.0 : clock) : 0;
    const uc = M.unitCircleTrig(p.thetaDeg); const cr = M.cosineRule(p.sideA, p.sideB, Math.max(15, Math.min(150, p.thetaDeg || 60))); return { t, uc, cr };
  },
  readout(s, pageObj, pageIdx = 0) {
    CHAPTER._pageIdx = pageIdx;
    if (pageIdx === 0) return `<b>Pythagoras Proof</b> · Legs a = ${s.cr.a.toFixed(1)}, b = ${s.cr.b.toFixed(1)} → a² + b² = ${(s.cr.a*s.cr.a).toFixed(2)} + ${(s.cr.b*s.cr.b).toFixed(2)} = <b>c² = ${(s.cr.a*s.cr.a + s.cr.b*s.cr.b).toFixed(2)}</b> (c = ${Math.hypot(s.cr.a, s.cr.b).toFixed(2)}).`;
    if (pageIdx === 1) return `<b>Unit Circle (θ = ${s.uc.thetaDeg}°)</b> · <b>cos θ = ${s.uc.cos.toFixed(3)}</b> (blue x) · <b>sin θ = ${s.uc.sin.toFixed(3)}</b> (red y) · <b>cos²θ + sin²θ = 1.000</b>.`;
    return `<b>Law of Cosines</b> · Angle C = ${s.cr.angleCDeg}° → c² = a² + b² − 2ab cos C = <b>${s.cr.cSq.toFixed(2)}</b> (c = <b>${s.cr.c.toFixed(2)}</b>) · Area = ½ab sin C = <b>${s.cr.area.toFixed(2)}</b>.`;
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
