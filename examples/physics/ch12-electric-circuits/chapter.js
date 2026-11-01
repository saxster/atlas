import { SUBJECT } from '../subject.js';
import {
  THREE, part, box, cyl, sphere, torus, lines, arrow, setArrow, rod,
  prims, shadeMat, studioGrid, playTone, V
} from '@saxster/atlas/phys_kit.js';
import * as M from './model.js';

export const PAGES = [
  {
    tab: 'Charged comb',
    fig: 'Figure 12.1 · Rubbing transfers electrons: how a negatively charged comb lifts neutral paper',
    title: 'Triboelectric Charge & Induced Paper Dipoles',
    alt: '3D negatively charged plastic comb hovering above neutral paper scraps whose internal positive charges shift upward toward the comb while negative charges shift downward, creating a net upward attraction.',
    cam: { target: [0, 1.3, 0], az: 22, el: 20, dist: 7.2 },
    lit: 'paper_dipoles',
    parts: ['charged_comb', 'paper_dipoles'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Closed circuit loop',
    fig: 'Figure 12.2 · Why a circuit needs a complete closed loop: battery pump & circulating electrons',
    title: 'Closed Conducting Loop vs Water-Pump Analogy',
    alt: '3D closed copper wire torus containing mobile conduction electrons driven continuously around the loop by a 1.5 V cell potential step.',
    cam: { target: [14, 1.3, 0], az: 20, el: 24, dist: 7.4 },
    lit: 'conducting_loop',
    parts: ['battery_cell', 'conducting_loop'],
    look: { xray: 0.25, section: 0 },
  },
  {
    tab: 'I–V curves',
    fig: 'Figure 12.4 · Current–voltage (I–V) curves for an Ohmic resistor, hot filament bulb, and LED diode',
    title: 'Ohmic Resistor vs Filament Bulb vs Semiconductor Diode',
    alt: 'Three 3D I-V characteristic tubes: a straight line for an Ohmic resistor (I = V/R), a flattening S-curve for a self-heating tungsten filament, and a threshold knee curve for an LED.',
    cam: { target: [28, 1.3, 0], az: 24, el: 20, dist: 7.4 },
    lit: 'iv_tubes',
    parts: ['iv_tubes', 'operating_markers'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Earth pin & fuse',
    fig: 'Figure 12.6 · Why the top Earth pin on an Indian 3-pin plug is longer and thicker',
    title: 'Three-Pin Plug Earth Wire & Fuse Fault Protection',
    alt: '3D cutaway metal-cased kettle and 3-pin Indian plug showing the longer, thicker top brass Earth pin diverting a live-wire casing fault safely into the ground to blow the fuse.',
    cam: { target: [42, 1.3, 0], az: 24, el: 20, dist: 7.4 },
    lit: 'three_pin_plug',
    parts: ['three_pin_plug', 'kettle_casing'],
    look: { xray: 0.25, section: 0 },
  },
];

export const PLATES = {
  charged_comb: {
    text: 'Plastic comb rubbed on dry hair: steals outer electrons (−e) from hair while heavy protons stay locked inside atomic nuclei.',
  },
  paper_dipoles: {
    text: 'Why a charged comb attracts NEUTRAL paper: the comb’s negative field pulls positive nuclei slightly closer and pushes electron clouds slightly further away; since Coulomb force falls as 1/r², closer attraction wins!',
  },
  battery_cell: {
    text: 'Chemical cell (potential difference V): does NOT manufacture electrons! It acts like a pump that maintains an electric field pushing the wire’s own sea of free electrons.',
    facts: s => [['Voltage V', `${s.voltageV.toFixed(1)} V`], ['I_ohmic', `${s.iv.iOhmicA.toFixed(2)} A`]],
  },
  conducting_loop: {
    text: 'Complete closed loop: if a switch opens anywhere, charges pile up at the gap in nanoseconds and cancel the internal field, stopping drift everywhere at once.',
  },
  iv_tubes: {
    text: 'Three conduction laws: Ohmic resistor (blue straight line, R = const), tungsten bulb (ochre curve bending over as hotter lattice ions scatter electrons), and LED diode (green knee at 1.8 V).',
    facts: s => [['I_ohmic', `${s.iv.iOhmicA.toFixed(2)} A`], ['I_bulb', `${s.iv.iFilamentA.toFixed(2)} A (R=${s.iv.rFilament.toFixed(1)}Ω)`], ['I_LED', `${s.iv.iDiodeA.toFixed(2)} A`]],
  },
  operating_markers: {
    text: 'Live operating markers at voltage V: compare how current responds across linear, thermal, and quantum-barrier components.',
  },
  three_pin_plug: {
    text: 'Indian 3-pin plug: the top Earth pin is LONGER (connects safety ground before Live touches, disconnects last) and THICKER (low resistance R_E ≈ 2 Ω to carry huge fault currents without melting).',
    facts: s => [['R_earth', `${s.earthOhm.toFixed(1)} Ω`], ['Fault surge', `${s.ef.faultCurrentEarthA.toFixed(0)} A`], ['15 A Fuse', s.ef.fuseTrips ? 'BLOWN (Safe!)' : 'INTACT']],
  },
  kettle_casing: {
    text: 'Metal appliance casing: if a frayed 230 V Live wire touches the metal shell, the Earth wire provides a 2 Ω superhighway (115 A surge) that melts the fuse in milliseconds before a human hand (2,000 Ω → lethal 115 mA) can be shocked.',
  },
};

export const CHAPTER = {
  subject: SUBJECT,
  no: 12,
  PAGES,
  PLATES,
  clock0: 0,
  cuts: true,
  xrayKeys: ['conducting_loop', 'kettle_casing'],
  cutKeys: ['conducting_loop', 'kettle_casing'],
  cutPlane: [0, 0, -1, 0.05],
  defaultParams: { combGapCm: 2.0, voltageV: 3.5, earthOhm: 2.0 },
  controls: [
    { id: 'combGapCm', label: 'Charged comb height above paper', min: 0.8, max: 5.0, step: 0.2, value: 2.0, unit: 'cm' },
    { id: 'voltageV', label: 'Applied circuit voltage V', min: 0.5, max: 5.0, step: 0.5, value: 3.5, unit: 'V' },
    { id: 'earthOhm', label: 'Earth fault loop resistance R_E', min: 1.0, max: 10.0, step: 0.5, value: 2.0, unit: 'Ω' },
  ],
  lessons: {
    'ch12-comb-dipole-3d': { page: 0, params: { combGapCm: 1.8 } },
    'ch12-closed-loop-3d': { page: 1, params: { voltageV: 3.5 } },
    'ch12-iv-curves-3d': { page: 2, params: { voltageV: 3.5 } },
    'ch12-earth-plug-3d': { page: 3, params: { earthOhm: 2.0 } },
  },
  sonify(ctx, s, page) {
    if (page === 1 || page === 2) playTone(ctx, { freq: 140 + s.voltageV * 65, dur: 0.06, type: 'sine', gain: 0.03 });
    else if (page === 3) playTone(ctx, { freq: 100, slideTo: 420, dur: 0.08, type: 'sawtooth', gain: 0.035 });
    else playTone(ctx, { freq: 340, dur: 0.05, type: 'triangle', gain: 0.025 });
  },
  state(clock, reduced) {
    const p = CHAPTER.params || CHAPTER.defaultParams;
    const t = reduced ? 1.0 : clock;
    const iv = M.ivCharacteristics(p.voltageV, 10);
    const ef = M.earthFaultSafety(230, p.earthOhm, 2000, 15);
    return { t, combGapCm: p.combGapCm, voltageV: p.voltageV, iv, earthOhm: p.earthOhm, ef };
  },
  readout(s, page, pageIdx) {
    if (pageIdx === 0) {
      return `<b>Comb gap = ${s.combGapCm.toFixed(1)} cm</b> · Negative comb repels paper electrons downward and attracts closer positive nuclei upward → Net upward Coulomb lift!`;
    }
    if (pageIdx === 1) {
      return `<b>Closed Circuit Loop (V = ${s.voltageV.toFixed(1)} V)</b> · Battery maintains electric field E around the continuous loop; all free electrons drift together at speed v_d.`;
    }
    if (pageIdx === 2) {
      return `<b>At V = ${s.voltageV.toFixed(1)} V</b> · Ohmic (10 Ω): <b>${s.iv.iOhmicA.toFixed(2)} A</b> · Hot filament bulb (R = ${s.iv.rFilament.toFixed(1)} Ω): <b>${s.iv.iFilamentA.toFixed(2)} A</b> · LED diode: <b>${s.iv.iDiodeA.toFixed(2)} A</b>.`;
    }
    return `<b>230 V Live-to-Casing Fault (R_Earth = ${s.earthOhm.toFixed(1)} Ω)</b> · Fault surge <b>I_fault = ${s.ef.faultCurrentEarthA.toFixed(0)} A</b> instantly blows the 15 A fuse (Unearthed human touch would pass lethal <b>${s.ef.unEarthedBodyCurrentMa.toFixed(0)} mA</b>!).`;
  },
  buildWorld(E) {
    const { scene, asm } = E;
    const root = new THREE.Group();
    scene.add(root);
    studioGrid(root, { x0: -4, x1: 48 });
    const labels = [];
    const label = (cls, html, at, opts = {}) => labels.push({ cls, html, at, ...opts });

    // Station 0 (x = 0): Charged Comb & Induced Paper Dipoles
    const combAsm = asm('charged_comb', root, { title: 'Negatively charged plastic comb', sub: 'Excess electrons (−e) from rubbing hair' });
    combAsm.position.set(0, 1.55, 0);
    part(combAsm, box(2.2, 0.22, 0.14, 0.02), { pal: 'blue', tone: 'hi', pos: [0, 0, 0], ex: [0, 0.4, 0], name: 'Comb spine' });
    for (let i = -4; i <= 4; i++) {
      part(combAsm, box(0.08, 0.32, 0.1, 0.01), { pal: 'blue', tone: 'hi', pos: [i * 0.22, -0.22, 0], name: 'Comb tooth' });
    }

    const papAsm = asm('paper_dipoles', root, { title: 'Polarized neutral paper scraps', sub: '+q pulled closer, −q pushed further' });
    papAsm.position.set(0, 0.35, 0);
    const paperBits = [];
    for (let k = -1; k <= 1; k++) {
      const bit = new THREE.Group();
      bit.position.set(k * 0.75, 0, 0);
      papAsm.add(bit);
      part(bit, box(0.45, 0.24, 0.35, 0.02), { pal: 'paper', tone: 'lit', pos: [0, 0, 0], ex: [0, -0.25, 0], name: 'Paper scrap' });
      part(bit, sphere(0.07, 12), { pal: 'red', tone: 'hi', pos: [0, 0.11, 0.16], name: 'Induced +q top layer' });
      part(bit, sphere(0.07, 12), { pal: 'blue', tone: 'hi', pos: [0, -0.11, 0.16], name: 'Repelled −q bottom layer' });
      paperBits.push(bit);
    }
    label('board', 'Closer +q attraction > farther −q repulsion', () => V(0, 2.15, 0), { leader: [0, -20] });

    // Station 1 (x = 14): Closed Loop & Electron Drift
    const batAsm = asm('battery_cell', root, { title: 'Chemical battery cell (V)', sub: 'Pumps existing wire electrons' });
    batAsm.position.set(14, 1.05, 1.15);
    part(batAsm, cyl(0.26, 0.95, 20), { pal: 'ochre', tone: 'hi', pos: [0, 0, 0], rot: [0, 0, Math.PI / 2], ex: [0, 0.35, 0.4], name: '1.5 V cell body' });
    part(batAsm, cyl(0.11, 0.15, 14), { pal: 'red', tone: 'hi', pos: [0.52, 0, 0], rot: [0, 0, Math.PI / 2], name: 'Positive terminal (+)' });

    const loopAsm = asm('conducting_loop', root, { title: 'Closed copper wire torus', sub: 'Continuous drift around full loop' });
    loopAsm.position.set(14, 1.05, 0);
    part(loopAsm, torus(1.15, 0.14, 14, 44), { pal: 'ochre', tone: 'mid', rot: [Math.PI / 2, 0, 0], mat: shadeMat('ochre', { opacity: 0.4 }), name: 'Copper wire loop' });
    const eCarriers = prims.particles(loopAsm, { count: 20, r: 0.055, pal: 'blue' });
    label('board', 'Electrons drift simultaneously everywhere in loop', () => V(14, 1.95, 0), { leader: [0, -20] });

    // Station 2 (x = 28): 3D I-V Curves (Ohmic, Filament, Diode)
    const ivAsm = asm('iv_tubes', root, { title: 'Ohmic, Filament & LED I–V curves', sub: 'Linear vs thermal vs threshold' });
    ivAsm.position.set(28, 0.2, 0);
    const ptsOhmic = [], ptsBulb = [], ptsDiode = [];
    for (let i = 0; i <= 10; i++) {
      const v = (i / 10) * 5.0;
      const x = -1.5 + (i / 10) * 3.0;
      const c = M.ivCharacteristics(v, 10);
      ptsOhmic.push(V(x, c.iOhmicA * 3.2, -0.45));
      ptsBulb.push(V(x, c.iFilamentA * 3.2, 0));
      ptsDiode.push(V(x, Math.min(1.8, c.iDiodeA * 1.1), 0.45));
    }
    part(ivAsm, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ptsOhmic), 32, 0.04, 8, false), { pal: 'blue', tone: 'hi', ex: [0, 0.3, -0.3], name: 'Ohmic resistor (I = V/R)' });
    part(ivAsm, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ptsBulb), 32, 0.04, 8, false), { pal: 'ochre', tone: 'hi', ex: [0, 0.3, 0], name: 'Tungsten filament (R rises with T)' });
    part(ivAsm, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ptsDiode), 32, 0.04, 8, false), { pal: 'green', tone: 'hi', ex: [0, 0.3, 0.3], name: 'Semiconductor LED diode' });

    const markAsm = asm('operating_markers', root, { title: 'Live operating point spheres', sub: 'Current I at chosen voltage V' });
    markAsm.position.set(28, 0.2, 0);
    const mOhm = part(markAsm, sphere(0.09, 14), { pal: 'blue', tone: 'hi', name: 'Ohmic point' });
    const mBulb = part(markAsm, sphere(0.09, 14), { pal: 'ochre', tone: 'hi', name: 'Filament point' });
    const mLed = part(markAsm, sphere(0.09, 14), { pal: 'green', tone: 'hi', name: 'Diode point' });
    label('board', 'Blue: Ohmic · Ochre: Hot bulb · Green: LED', () => V(28, 2.15, 0), { leader: [0, -20] });

    // Station 3 (x = 42): 3-Pin Plug Longer/Thicker Earth Pin & Kettle Fault
    const plugAsm = asm('three_pin_plug', root, { title: 'Indian 3-pin plug', sub: 'Longer, thicker top Earth pin' });
    plugAsm.position.set(41.0, 1.1, 0);
    part(plugAsm, box(0.95, 1.05, 0.55, 0.05), { pal: 'paper', tone: 'lit', pos: [-0.25, 0, 0], ex: [-0.45, 0, 0], name: 'Moulded plug body' });
    // Top Earth pin: longer and thicker!
    part(plugAsm, cyl(0.11, 0.72, 16), { pal: 'green', tone: 'hi', pos: [0.38, 0.26, 0], rot: [0, 0, Math.PI / 2], ex: [0.35, 0.25, 0], name: 'Long thick Earth pin (first in, last out)' });
    part(plugAsm, cyl(0.075, 0.48, 16), { pal: 'red', tone: 'hi', pos: [0.26, -0.22, 0.22], rot: [0, 0, Math.PI / 2], ex: [0.25, -0.2, 0.2], name: 'Live pin' });
    part(plugAsm, cyl(0.075, 0.48, 16), { pal: 'blue', tone: 'hi', pos: [0.26, -0.22, -0.22], rot: [0, 0, Math.PI / 2], ex: [0.25, -0.2, -0.2], name: 'Neutral pin' });

    const ketAsm = asm('kettle_casing', root, { title: 'Earthed metal kettle & fuse', sub: '115 A surge blows fuse safely' });
    ketAsm.position.set(42.9, 1.0, 0);
    part(ketAsm, cyl(0.68, 1.25, 24), { pal: 'ochre', tone: 'mid', pos: [0, 0, 0], mat: shadeMat('ochre', { opacity: 0.45 }), ex: [0.35, 0.3, 0], name: 'Metal kettle shell' });
    const earthWireRod = rod(root, { r: 0.028, pal: 'green', tone: 'hi', name: 'Low-resistance green Earth wire' });
    earthWireRod.set(V(41.65, 1.36, 0), V(42.9, 1.36, 0));
    label('board', 'Longer, thicker Earth pin → 115 A trips fuse!', () => V(42.0, 2.15, 0), { leader: [0, -20] });

    return {
      labels,
      update(s) {
        // Station 0: Comb height & paper lift
        const hComb = 0.85 + (s.combGapCm / 5.0) * 1.1;
        combAsm.position.y = hComb;
        const lift = Math.max(0, (5.2 - s.combGapCm) * 0.12);
        for (let i = 0; i < 3; i++) {
          paperBits[i].position.y = lift + 0.04 * Math.sin(s.t * 3 + i);
        }

        // Station 1: Circulating electrons around loop
        const pts = [];
        for (let i = 0; i < 20; i++) {
          const ang = (i / 20) * Math.PI * 2 + s.t * (0.4 + s.voltageV * 0.35);
          pts.push([1.15 * Math.cos(ang), 0, 1.15 * Math.sin(ang)]);
        }
        eCarriers.set(pts);

        // Station 2: I-V operating point markers
        const xV = -1.5 + (s.voltageV / 5.0) * 3.0;
        mOhm.position.set(xV, s.iv.iOhmicA * 3.2, -0.45);
        mBulb.position.set(xV, s.iv.iFilamentA * 3.2, 0);
        mLed.position.set(xV, Math.min(1.8, s.iv.iDiodeA * 1.1), 0.45);
      },
    };
  },
};
