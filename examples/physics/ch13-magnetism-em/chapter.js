import { SUBJECT } from '../subject.js';
import {
  THREE, part, box, cyl, sphere, torus, lines, arrow, setArrow, rod,
  prims, shadeMat, studioGrid, playTone, V
} from '@saxster/atlas/phys_kit.js';
import * as M from './model.js';

export const PAGES = [
  {
    tab: 'Magnetic domains',
    fig: 'Figure 13.1 · Ferromagnetic domains aligning with an external B-field & randomizing when heated',
    title: 'Ferromagnetic Domains & Curie Alignment',
    alt: '3D iron bar cutaway showing an array of internal magnetic domain dipole arrows rotating into alignment as external magnetic field B rises.',
    cam: { target: [0, 1.25, 0], az: 20, el: 24, dist: 7.2 },
    lit: 'domain_arrows',
    parts: ['iron_bar', 'domain_arrows'],
    look: { xray: 0.25, section: 0 },
  },
  {
    tab: 'DC motor & commutator',
    fig: 'Figure 13.4 · DC motor armature coil (F = I L × B) & split-ring commutator reversal',
    title: 'DC Motor Lorentz Force & Split-Ring Commutator',
    alt: '3D rotating copper armature coil between North and South magnet poles with a brass split-ring commutator and carbon brushes that flip coil current every 180° so torque stays in one direction.',
    cam: { target: [14, 1.3, 0], az: 26, el: 22, dist: 7.4 },
    lit: 'armature_coil',
    parts: ['stator_magnets', 'armature_coil', 'split_commutator'],
    look: { xray: 0.15, section: 0 },
  },
  {
    tab: 'Maxwell EM wave',
    fig: 'Figure 13.6 · Maxwell’s transverse electromagnetic wave: E ⊥ B ⊥ direction of propagation c',
    title: 'Propagating Electromagnetic Wave (E ⊥ B)',
    alt: '3D mutually perpendicular electric field (vertical red arrows) and magnetic field (horizontal blue arrows) regenerating each other at speed c = 1/√(μ₀ε₀).',
    cam: { target: [28, 1.3, 0], az: 24, el: 22, dist: 7.6 },
    lit: 'em_vectors',
    parts: ['wave_axis', 'em_vectors'],
    look: { xray: 0, section: 0 },
  },
];

export const PLATES = {
  iron_bar: {
    text: 'Unmagnetized soft iron bar: already packed with microscopic magnetized regions (domains), but their axes point in random directions so their fields cancel out.',
    facts: s => [['B_ext', `${s.bExtT.toFixed(2)} T`], ['Net alignment', `${(s.align * 100).toFixed(0)}%`]],
  },
  domain_arrows: {
    text: 'Domain rotation & wall growth: applying an external magnetic field aligns the domains into a strong magnet; heating above the Curie point (770 °C) shakes them back into randomness.',
  },
  stator_magnets: {
    text: 'North (red) and South (blue) stator poles: establish a uniform horizontal magnetic field B across the rotor gap.',
  },
  armature_coil: {
    text: 'Current-carrying loop in B-field: left wire feels upward Lorentz force F = I L B while right wire feels downward force −I L B, creating torque τ = N I A B |sin θ|.',
    facts: s => [['Current I', `${s.motorCurrentA.toFixed(1)} A`], ['Peak torque τ_max', `${s.mot.maxTorqueNm.toFixed(2)} N·m`]],
  },
  split_commutator: {
    text: 'Why the split-ring commutator is essential: without it, the coil would flip past vertical and torque would reverse! The two brass half-rings swap brush contact every 180° so the left side ALWAYS pushes up.',
  },
  wave_axis: {
    text: 'Propagation axis k (speed c = 299,792 km/s): requires no material medium — changing E creates B (Ampère–Maxwell) and changing B creates E (Faraday).',
  },
  em_vectors: {
    text: 'Transverse orthogonality E ⊥ B ⊥ c: vertical electric field E (red) and horizontal magnetic field B (blue) oscillate in phase with E₀ = c B₀.',
  },
};

export const CHAPTER = {
  subject: SUBJECT,
  no: 13,
  PAGES,
  PLATES,
  clock0: 0,
  cuts: true,
  xrayKeys: ['iron_bar', 'stator_magnets'],
  cutKeys: ['iron_bar'],
  cutPlane: [0, 0, -1, 0.05],
  defaultParams: { bExtT: 0.45, motorCurrentA: 3.5, emFreqScale: 1.5 },
  controls: [
    { id: 'bExtT', label: 'External magnetizing field B_ext', min: 0.0, max: 1.0, step: 0.05, value: 0.45, unit: 'T' },
    { id: 'motorCurrentA', label: 'DC motor armature current I', min: 0.5, max: 6.0, step: 0.5, value: 3.5, unit: 'A' },
    { id: 'emFreqScale', label: 'EM wave frequency f', min: 0.5, max: 3.0, step: 0.25, value: 1.5, unit: '×f₀' },
  ],
  lessons: {
    'ch13-domains-3d': { page: 0, params: { bExtT: 0.65 } },
    'ch13-dc-motor-3d': { page: 1, params: { motorCurrentA: 4.0 } },
    'ch13-em-wave-3d': { page: 2, params: { emFreqScale: 1.5 } },
  },
  sonify(ctx, s, page) {
    if (page === 0) playTone(ctx, { freq: 200 + s.align * 240, dur: 0.06, type: 'sine', gain: 0.03 });
    else if (page === 1) playTone(ctx, { freq: 110 + s.motorCurrentA * 45, dur: 0.07, type: 'sawtooth', gain: 0.03 });
    else playTone(ctx, { freq: 260 * s.emFreqScale, dur: 0.06, type: 'sine', gain: 0.03 });
  },
  state(clock, reduced) {
    const p = CHAPTER.params || CHAPTER.defaultParams;
    const t = reduced ? 1.0 : clock;
    const align = M.domainAlignmentFraction(p.bExtT, 25, 770);
    const mot = M.dcMotorTorque(p.motorCurrentA, 0.5, 0.02, 20, (t * 90) % 360);
    return { t, bExtT: p.bExtT, align, motorCurrentA: p.motorCurrentA, mot, emFreqScale: p.emFreqScale };
  },
  readout(s, page, pageIdx) {
    if (pageIdx === 0) {
      return `<b>External field B_ext = ${s.bExtT.toFixed(2)} T</b> · Ferromagnetic domain alignment = <b>${(s.align * 100).toFixed(0)}%</b> (0% when unmagnetized or heated above Curie temperature).`;
    }
    if (pageIdx === 1) {
      return `<b>DC Motor (I = ${s.motorCurrentA.toFixed(1)} A, B = 0.50 T)</b> · Peak torque <b>τ_max = N I A B = ${s.mot.maxTorqueNm.toFixed(2)} N·m</b> · Split-ring commutator reverses coil current every 180° for continuous spin.`;
    }
    return `<b>Maxwell Electromagnetic Wave (f = ${s.emFreqScale.toFixed(2)}×f₀)</b> · <b>E ⊥ B ⊥ c</b> · Wave speed <b>c = 1/√(μ₀ε₀) = 2.998 × 10⁸ m/s</b>.`;
  },
  buildWorld(E) {
    const { scene, asm } = E;
    const root = new THREE.Group();
    scene.add(root);
    studioGrid(root, { x0: -4, x1: 35 });
    const labels = [];
    const label = (cls, html, at, opts = {}) => labels.push({ cls, html, at, ...opts });

    // Station 0 (x = 0): Ferromagnetic Domains
    const barAsm = asm('iron_bar', root, { title: 'Soft iron specimen bar', sub: 'Cutaway reveals internal domains' });
    barAsm.position.set(0, 1.05, 0);
    part(barAsm, box(3.0, 0.9, 0.9, 0.04), { pal: 'paper', tone: 'mid', pos: [0, 0, 0], mat: shadeMat('paper', { opacity: 0.36 }), name: 'Iron bar casing' });

    const domAsm = asm('domain_arrows', root, { title: 'Microscopic magnetic domain dipoles', sub: 'Rotate into alignment with B_ext' });
    domAsm.position.set(0, 1.05, 0);
    const domVecs = [];
    const baseAngles = [1.8, -2.3, 0.9, -1.2, 2.7, -0.7, 1.4, -2.8];
    for (let i = 0; i < 8; i++) {
      const x = -1.05 + (i % 4) * 0.7;
      const y = i < 4 ? 0.2 : -0.2;
      const v = arrow(domAsm, { pal: 'red', r: 0.026 });
      domVecs.push({ vec: v, x, y, a0: baseAngles[i] });
    }
    label('board', 'Domains align along B_ext →', () => V(0, 1.95, 0), { leader: [0, -20] });

    // Station 1 (x = 14): DC Motor & Split-Ring Commutator
    const statAsm = asm('stator_magnets', root, { title: 'North & South stator magnet poles', sub: 'Horizontal B-field across air gap' });
    statAsm.position.set(14, 1.15, 0);
    part(statAsm, box(0.45, 0.95, 1.1, 0.03), { pal: 'red', tone: 'hi', pos: [-1.25, 0, 0], ex: [-0.4, 0, 0], name: 'North pole (N)' });
    part(statAsm, box(0.45, 0.95, 1.1, 0.03), { pal: 'blue', tone: 'hi', pos: [1.25, 0, 0], ex: [0.4, 0, 0], name: 'South pole (S)' });

    const armAsm = asm('armature_coil', root, { title: 'Rotating copper armature loop', sub: 'F = I L × B Lorentz couple' });
    armAsm.position.set(14, 1.15, 0);
    const coilRotor = new THREE.Group();
    armAsm.add(coilRotor);
    part(coilRotor, box(1.3, 0.08, 1.1, 0.02), { pal: 'ochre', tone: 'hi', pos: [0, 0, 0], ex: [0, 0.35, 0], name: 'Armature winding' });
    const fLeft = arrow(armAsm, { pal: 'green', r: 0.028 });
    const fRight = arrow(armAsm, { pal: 'green', r: 0.028 });

    const commAsm = asm('split_commutator', root, { title: 'Split-ring commutator & carbon brushes', sub: 'Swaps polarity every 180°' });
    commAsm.position.set(14, 1.15, 0.85);
    const commRing = part(commAsm, torus(0.24, 0.055, 12, 24), { pal: 'ochre', tone: 'hi', pos: [0, 0, 0], ex: [0, 0, 0.45], name: 'Split brass commutator' });
    part(commAsm, box(0.16, 0.14, 0.16, 0.01), { pal: 'dark', tone: 'hi', pos: [-0.32, 0, 0], ex: [-0.3, 0, 0.45], name: 'Left carbon brush' });
    part(commAsm, box(0.16, 0.14, 0.16, 0.01), { pal: 'dark', tone: 'hi', pos: [0.32, 0, 0], ex: [0.3, 0, 0.45], name: 'Right carbon brush' });
    label('board', 'Split-ring flips I every 180°', () => V(14, 2.05, 0.85), { leader: [0, -20] });

    // Station 2 (x = 28): Maxwell EM Wave (E perp B perp c)
    const axAsm = asm('wave_axis', root, { title: 'Propagation ray axis (speed c)', sub: 'c = 1 / √(μ₀ε₀)' });
    axAsm.position.set(28, 1.1, 0);
    const cRay = arrow(axAsm, { pal: 'dark', r: 0.022 });
    setArrow(cRay, V(-1.8, 0, 0), V(1.9, 0, 0));

    const emAsm = asm('em_vectors', root, { title: 'Crossed E (vertical) & B (horizontal) fields', sub: 'E ⊥ B oscillate in phase' });
    emAsm.position.set(28, 1.1, 0);
    const eArrows = [], bArrows = [];
    for (let i = 0; i < 13; i++) {
      const x = -1.5 + i * 0.25;
      eArrows.push({ vec: arrow(emAsm, { pal: 'red', r: 0.022 }), x });
      bArrows.push({ vec: arrow(emAsm, { pal: 'blue', r: 0.022 }), x });
    }
    label('board', 'E (red, vertical) ⊥ B (blue, horizontal)', () => V(28, 2.15, 0), { leader: [0, -20] });

    return {
      labels,
      update(s) {
        // Station 0: Align domains with bExtT
        for (const d of domVecs) {
          const ang = d.a0 * (1 - s.align);
          const dx = 0.24 * Math.cos(ang), dy = 0.24 * Math.sin(ang);
          setArrow(d.vec, V(d.x - dx, d.y - dy, 0), V(d.x + dx, d.y + dy, 0));
        }

        // Station 1: Spin motor & show upward/downward Lorentz force
        const omega = s.motorCurrentA * 0.85;
        const th = s.t * omega;
        coilRotor.rotation.z = th;
        commRing.rotation.z = th;
        const lx = -0.6 * Math.cos(th), ly = -0.6 * Math.sin(th);
        const rx = 0.6 * Math.cos(th), ry = 0.6 * Math.sin(th);
        const fLen = 0.25 + (s.motorCurrentA / 6.0) * 0.55;
        // Commutator keeps whichever branch is on the left pushing UP (+y) and right pushing DOWN (-y)
        const upLeft = lx <= 0 ? 1 : -1;
        setArrow(fLeft, V(lx, ly, 0), V(lx, ly + upLeft * fLen, 0));
        setArrow(fRight, V(rx, ry, 0), V(rx, ry - upLeft * fLen, 0));

        // Station 2: Propagating EM wave E and B vectors
        const k = 2.2 * s.emFreqScale;
        const w = s.t * 3.2 * s.emFreqScale;
        for (let i = 0; i < 13; i++) {
          const x = eArrows[i].x;
          const amp = 0.75 * Math.sin(k * x - w);
          const sign = amp >= 0 ? 1 : -1;
          const mag = Math.max(0.08, Math.abs(amp));
          setArrow(eArrows[i].vec, V(x, 0, 0), V(x, sign * mag, 0));
          setArrow(bArrows[i].vec, V(x, 0, 0), V(x, 0, sign * mag));
        }
      },
    };
  },
};
