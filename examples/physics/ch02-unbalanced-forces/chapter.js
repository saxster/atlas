import { SUBJECT } from '../subject.js';
import {
  THREE, part, box, cyl, sphere, cone, lines, arrow, setArrow, rod,
  prims, shadeMat, studioGrid, playTone, V
} from '@saxster/atlas/phys_kit.js';
import * as M from './model.js';

export const PAGES = [
  {
    tab: 'Double ramp',
    fig: 'Figure 2.1 · Galileo’s double inclined plane & the frictionless coasting limit',
    title: 'Galileo’s Double Inclined Plane',
    alt: '3D curved release ramp meeting an adjustable recovery slope where a bronze ball seeks its starting height h, running further as the second slope flattens toward zero.',
    cam: { target: [0, 1.3, 0], az: 20, el: 22, dist: 7.4 },
    lit: 'recovery_slope',
    parts: ['release_slope', 'recovery_slope'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Force arrows',
    fig: 'Figure 2.2 · Free-body force vectors acting on a pushed tabletop block',
    title: '3D Free-Body Force Diagram',
    alt: '3D wooden crate on a table showing upward normal force N, downward weight mg, horizontal push F_push, and opposing friction f emerging from the crate.',
    cam: { target: [14, 1.25, 0], az: 26, el: 22, dist: 6.8 },
    lit: 'force_crate',
    parts: ['table_slab', 'force_crate'],
    look: { xray: 0.15, section: 0 },
  },
  {
    tab: 'Braking train',
    fig: 'Figure 2.4 · Braking train carriage with forward-tilting strap & sliding teacup',
    title: 'Inertia in a Braking Train Cabin',
    alt: '3D cutaway railway carriage during braking: a hanging hand-strap swings forward at angle tan θ = a/g while a teacup slides forward on the tray table.',
    cam: { target: [28, 1.35, 0], az: 18, el: 20, dist: 7.2 },
    lit: 'inertia_strap',
    parts: ['cabin_shell', 'inertia_strap'],
    look: { xray: 0.25, section: 0 },
  },
  {
    tab: 'Asperity peaks',
    fig: 'Figure 2.5 · Microscopic interlocking surface asperities & normal-load contact area',
    title: 'Microscopic Asperity Cold Welds',
    alt: '3D magnified cutaway of two seemingly smooth blocks revealing jagged microscopic mountain peaks that squash together under heavier normal load N.',
    cam: { target: [42, 1.3, 0], az: 22, el: 20, dist: 6.8 },
    lit: 'upper_asperities',
    parts: ['lower_asperities', 'upper_asperities'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Static → kinetic',
    fig: 'Figure 2.6 · Static friction ramp-up to peak f_s,max followed by drop to kinetic f_k',
    title: 'Static Peak & Kinetic Friction Drop',
    alt: '3D friction test sled pulled by a spring scale alongside a 3D force profile showing the 45° static ramp, breakaway peak μ_s N, and lower kinetic plateau μ_k N.',
    cam: { target: [56, 1.3, 0], az: 24, el: 22, dist: 7.4 },
    lit: 'friction_curve',
    parts: ['test_sled', 'friction_curve'],
    look: { xray: 0, section: 0 },
  },
];

export const PLATES = {
  release_slope: {
    text: 'Steep left incline: a ball released from height h = 0.45 m converts gravitational potential into kinetic energy at the valley floor.',
  },
  recovery_slope: {
    text: 'Adjustable right incline (angle θ₂): to regain height h, the ball must travel distance L = h / sin θ₂. As θ₂ → 0°, L → ∞: the ball coasts forever at constant velocity!',
    facts: s => [['θ₂', `${s.secondSlopeDeg}°`], ['Run L', Number.isFinite(s.runDistM) ? `${s.runDistM.toFixed(2)} m` : '∞ (coasts forever)']],
  },
  table_slab: {
    text: 'Rigid tabletop: compresses microscopically like a stiff spring until upward normal force N balances downward weight mg.',
  },
  force_crate: {
    text: 'Free-body isolation: only forces acting ON the crate decide its acceleration a = (F_push − f) / m.',
    facts: s => [['N = mg', `${s.fric.normalN.toFixed(1)} N`], ['F_net', `${s.fric.netForceN.toFixed(1)} N`]],
  },
  cabin_shell: {
    text: 'Braking carriage: the wheels and floor decelerate backward at a_brake, leaving unattached objects coasting forward at the train’s prior speed.',
  },
  inertia_strap: {
    text: 'Hanging grab-strap accelerometer: tilts forward by θ = arctan(a_brake / g) so the horizontal component of tension T sin θ decelerates the handle with the train.',
    facts: s => [['a_brake', `${s.decelMps2.toFixed(1)} m/s²`], ['Strap tilt θ', `${s.strapDeg.toFixed(1)}°`]],
  },
  lower_asperities: {
    text: 'Base metal surface magnified 1,000×: even polished steel is a mountain range of micron-scale peaks (asperities) touching only at tiny tips.',
  },
  upper_asperities: {
    text: 'Upper slider peaks: doubling normal load N squashes the contact tips to twice the real microscopic contact area, doubling maximum friction.',
    facts: s => [['Mass m', `${s.massKg.toFixed(1)} kg`], ['f_s,max', `${s.fric.fStaticMaxN.toFixed(1)} N`]],
  },
  test_sled: {
    text: 'Loaded friction sled: remains locked while F_push ≤ μ_s N, then breaks free and accelerates once microscopic cold welds shear.',
    facts: s => [['F_push', `${s.pushN.toFixed(1)} N`], ['f', `${s.fric.frictionN.toFixed(1)} N`], ['State', s.fric.sliding ? 'SLIDING (kinetic)' : 'LOCKED (static)']],
  },
  friction_curve: {
    text: '3D Static-to-Kinetic profile: friction climbs 1-to-1 with push up to the sharp static peak μ_s N, then drops onto the flatter kinetic shelf μ_k N.',
  },
};

export const CHAPTER = {
  subject: SUBJECT,
  no: 2,
  PAGES,
  PLATES,
  clock0: 0,
  cuts: true,
  xrayKeys: ['force_crate', 'cabin_shell', 'upper_asperities'],
  cutKeys: ['cabin_shell', 'upper_asperities'],
  cutPlane: [0, 0, -1, 0.05],
  defaultParams: { secondSlopeDeg: 14, pushN: 22, massKg: 5.0, decelMps2: 2.8 },
  controls: [
    { id: 'secondSlopeDeg', label: 'Galileo recovery slope θ₂', min: 0, max: 35, step: 1, value: 14, unit: '°' },
    { id: 'pushN', label: 'Horizontal push F_push', min: 0, max: 45, step: 1, value: 22, unit: 'N' },
    { id: 'massKg', label: 'Block mass m (sets normal load)', min: 2, max: 10, step: 0.5, value: 5.0, unit: 'kg' },
    { id: 'decelMps2', label: 'Train braking deceleration a', min: 0, max: 6, step: 0.2, value: 2.8, unit: 'm/s²' },
  ],
  lessons: {
    'ch02-galileo-double-3d': { page: 0, params: { secondSlopeDeg: 12 } },
    'ch02-free-body-3d': { page: 1, params: { pushN: 28, massKg: 5.0 } },
    'ch02-braking-train-3d': { page: 2, params: { decelMps2: 3.2 } },
    'ch02-asperities-3d': { page: 3, params: { massKg: 7.5 } },
    'ch02-static-kinetic-3d': { page: 4, params: { pushN: 26, massKg: 5.0 } },
  },
  sensor: {
    type: 'tilt',
    label: 'Tilt to flatten Galileo slope',
    apply(v) {
      return { secondSlopeDeg: Math.round(v * 35) };
    },
  },
  sonify(ctx, s, page) {
    if (page === 0) playTone(ctx, { freq: 240 + (35 - s.secondSlopeDeg) * 10, dur: 0.07, type: 'sine', gain: 0.03 });
    else if (page === 2) playTone(ctx, { freq: 180 + s.strapDeg * 12, dur: 0.06, type: 'triangle', gain: 0.03 });
    else playTone(ctx, { freq: s.fric.sliding ? 390 : 190 + s.pushN * 3, dur: 0.07, type: s.fric.sliding ? 'sawtooth' : 'sine', gain: 0.03 });
  },
  state(clock, reduced) {
    const p = CHAPTER.params || CHAPTER.defaultParams;
    const t = reduced ? 1.0 : clock;
    const runDistM = M.doubleRampRunDistanceM(0.45, p.secondSlopeDeg);
    const strapDeg = M.brakingPendulumAngleDeg(p.decelMps2);
    const fric = M.frictionResponse(p.pushN, p.massKg, 0.5, 0.35);
    return {
      t,
      secondSlopeDeg: p.secondSlopeDeg,
      runDistM,
      pushN: p.pushN,
      massKg: p.massKg,
      decelMps2: p.decelMps2,
      strapDeg,
      fric,
    };
  },
  readout(s, page, pageIdx) {
    if (pageIdx === 0) {
      const runTxt = Number.isFinite(s.runDistM) ? `climbs <b>L = ${s.runDistM.toFixed(2)} m</b> to regain h = 0.45 m` : '<b>coasts forever (L = ∞)</b> at constant speed (Newton’s 1st Law)';
      return `<b>Recovery slope θ₂ = ${s.secondSlopeDeg}°</b> · Released from h = 0.45 m, the ball ${runTxt}.`;
    }
    if (pageIdx === 1 || pageIdx === 4) {
      const mode = s.fric.sliding ? `<b>SLIDING</b> (f_k = ${s.fric.fKineticN.toFixed(1)} N, a = ${s.fric.accelMps2.toFixed(2)} m/s²)` : `<b>LOCKED</b> (static f_s = ${s.fric.frictionN.toFixed(1)} N ≤ f_s,max = ${s.fric.fStaticMaxN.toFixed(1)} N)`;
      return `<b>F_push = ${s.pushN.toFixed(0)} N</b> on m = ${s.massKg.toFixed(1)} kg (N = ${s.fric.normalN.toFixed(1)} N) → ${mode}.`;
    }
    if (pageIdx === 2) {
      return `<b>Train braking a = ${s.decelMps2.toFixed(1)} m/s²</b> · Overhead strap hangs forward at <b>θ = arctan(a/g) = ${s.strapDeg.toFixed(1)}°</b> while unsecured teacup slides ahead.`;
    }
    return `<b>Microscopic Asperity Contact (m = ${s.massKg.toFixed(1)} kg)</b> · Normal force <b>N = ${s.fric.normalN.toFixed(1)} N</b> compresses interlocking peaks → Static breakaway threshold <b>f_s,max = ${s.fric.fStaticMaxN.toFixed(1)} N</b>.`;
  },
  buildWorld(E) {
    const { scene, asm } = E;
    const root = new THREE.Group();
    scene.add(root);
    studioGrid(root, { x0: -4, x1: 62 });
    const labels = [];
    const label = (cls, html, at, opts = {}) => labels.push({ cls, html, at, ...opts });

    // Station 0 (x = 0): Galileo's Double Inclined Plane
    const relAsm = asm('release_slope', root, { title: 'Steep release incline', sub: 'Fixed drop height h = 0.45 m' });
    relAsm.position.set(-1.1, 0.75, 0);
    part(relAsm, box(1.8, 0.12, 0.5, 0.02), { pal: 'ochre', tone: 'hi', pos: [0, 0, 0], rot: [0, 0, -0.52], ex: [-0.3, 0.3, 0], name: 'Left release ramp' });
    part(relAsm, box(3.6, 0.04, 0.5, 0.01), { pal: 'green', tone: 'lit', pos: [1.1, 0.42, 0], name: 'Target height line h' });

    const recAsm = asm('recovery_slope', root, { title: 'Adjustable recovery slope', sub: 'L = h / sin θ₂' });
    recAsm.position.set(-0.3, 0.3, 0);
    const recPlank = part(recAsm, box(2.8, 0.12, 0.5, 0.02), { pal: 'blue', tone: 'hi', pos: [1.4, 0, 0], ex: [0.4, 0.3, 0], name: 'Adjustable right slope' });
    const galBall = part(root, sphere(0.13, 18), { pal: 'red', tone: 'hi', pos: [0, 0.45, 0], name: 'Rolling bronze ball' });
    label('board', 'Starting height h', () => V(-1.6, 1.35, 0));
    label('board', 'Recovery slope θ₂', () => V(1.2, 1.35, 0), { leader: [0, -20] });

    // Station 1 (x = 14): 3D Free-Body Force Arrows
    const tabAsm = asm('table_slab', root, { title: 'Benchtop surface', sub: 'Provides normal force N' });
    tabAsm.position.set(14, 0.45, 0);
    part(tabAsm, box(3.4, 0.16, 1.4, 0.03), { pal: 'paper', tone: 'mid', pos: [0, 0, 0], name: 'Laboratory bench' });

    const crateAsm = asm('force_crate', root, { title: 'Pushed wooden block', sub: '4 forces acting on block' });
    crateAsm.position.set(14, 0.9, 0);
    part(crateAsm, box(0.85, 0.65, 0.65, 0.04), { pal: 'ochre', tone: 'hi', pos: [0, 0, 0], mat: shadeMat('ochre', { opacity: 0.65 }), ex: [0, 0.4, 0], name: 'Wooden block' });
    const fNorm = arrow(crateAsm, { pal: 'blue', r: 0.028 });
    const fGrav = arrow(crateAsm, { pal: 'dark', r: 0.028 });
    const fPush = arrow(crateAsm, { pal: 'green', r: 0.03 });
    const fFric = arrow(crateAsm, { pal: 'red', r: 0.03 });
    label('board', 'N (Normal) & mg (Weight)', () => V(14, 2.15, 0));
    label('board', 'F_push vs friction f', () => V(14.9, 1.2, 0), { leader: [24, -18] });

    // Station 2 (x = 28): Braking Train Cabin & Inertia Strap
    const cabAsm = asm('cabin_shell', root, { title: 'Braking carriage interior', sub: 'Floor decelerates at a' });
    cabAsm.position.set(28, 1.1, 0);
    part(cabAsm, box(2.8, 1.7, 1.2, 0.04), { pal: 'paper', tone: 'mid', pos: [0, 0, 0], mat: shadeMat('paper', { opacity: 0.35 }), name: 'Carriage frame' });
    part(cabAsm, box(0.9, 0.08, 0.6, 0.02), { pal: 'ochre', tone: 'mid', pos: [0.3, -0.35, 0], ex: [0, -0.25, 0], name: 'Passenger tray table' });
    const teaCup = part(cabAsm, cyl(0.11, 0.22, 16), { pal: 'red', tone: 'hi', pos: [0.3, -0.2, 0], ex: [0.3, 0.2, 0], name: 'Sliding teacup' });

    const strapAsm = asm('inertia_strap', root, { title: 'Hanging grab-strap pendulum', sub: 'tan θ = a / g' });
    strapAsm.position.set(27.6, 1.85, 0);
    part(strapAsm, cyl(0.025, 0.85, 12), { pal: 'dark', tone: 'hi', pos: [0, -0.42, 0], ex: [0, 0.3, 0], name: 'Strap cord' });
    part(strapAsm, sphere(0.13, 16), { pal: 'blue', tone: 'hi', pos: [0, -0.85, 0], ex: [0, 0.45, 0], name: 'Strap handle' });
    label('board', 'Tilt θ = arctan(a/g)', () => V(27.6, 2.2, 0), { leader: [20, 22] });

    // Station 3 (x = 42): Microscopic Asperity Peaks
    const lowAsp = asm('lower_asperities', root, { title: 'Lower surface asperities', sub: '1000× magnified steel peaks' });
    lowAsp.position.set(42, 0.55, 0);
    part(lowAsp, box(2.8, 0.32, 0.9, 0.03), { pal: 'dark', tone: 'mid', pos: [0, 0, 0], name: 'Lower substrate' });
    for (let i = -3; i <= 3; i++) {
      part(lowAsp, cone(0.22, 0.38, 8), { pal: 'dark', tone: 'hi', pos: [i * 0.36, 0.32, 0], ex: [0, -0.25, 0], name: 'Lower microscopic peak' });
    }

    const upAsp = asm('upper_asperities', root, { title: 'Upper slider asperities', sub: 'Cold-weld tips under load N' });
    upAsp.position.set(42, 1.35, 0);
    part(upAsp, box(2.8, 0.32, 0.9, 0.03), { pal: 'ochre', tone: 'hi', pos: [0, 0, 0], mat: shadeMat('ochre', { opacity: 0.7 }), ex: [0, 0.45, 0], name: 'Upper slider block' });
    for (let i = -3; i <= 3; i++) {
      part(upAsp, cone(0.22, 0.38, 8), { pal: 'red', tone: 'hi', pos: [i * 0.36 + 0.12, -0.32, 0], rot: [0, 0, Math.PI], ex: [0, 0.3, 0], name: 'Interlocking upper peak' });
    }
    label('board', 'Cold-weld contact tips', () => V(42, 1.95, 0), { leader: [0, -22] });

    // Station 4 (x = 56): Static-to-Kinetic Friction Graph & Sled
    const sledAsm = asm('test_sled', root, { title: 'Spring-pulled friction sled', sub: 'Breaks free above μ_s N' });
    sledAsm.position.set(56, 0.35, 0.65);
    const sledBox = part(sledAsm, box(0.78, 0.42, 0.52, 0.03), { pal: 'green', tone: 'hi', pos: [0, 0, 0], ex: [0, 0.35, 0.3], name: 'Test sled' });

    const curveAsm = asm('friction_curve', root, { title: 'Static peak & kinetic plateau', sub: 'f(F_push) 3D profile' });
    curveAsm.position.set(56, 0.15, -0.45);
    const curvePts = [
      V(-1.4, 0.1, 0), V(-0.2, 1.35, 0), V(-0.08, 0.92, 0), V(1.4, 0.92, 0),
    ];
    const curveGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(curvePts), 40, 0.045, 10, false);
    part(curveAsm, curveGeo, { pal: 'blue', tone: 'hi', ex: [0, 0.3, -0.3], name: 'Static-to-kinetic friction curve' });
    const stateBall = part(curveAsm, sphere(0.11, 16), { pal: 'red', tone: 'hi', pos: [-0.5, 0.8, 0], name: 'Current operating point' });
    label('board', 'Peak f_s,max = μ_s N', () => V(55.8, 1.75, -0.45), { leader: [0, -18] });

    return {
      labels,
      update(s) {
        // Station 0: tilt recovery ramp & animate ball
        const rad = (s.secondSlopeDeg * Math.PI) / 180;
        recAsm.rotation.z = rad;
        const u = 0.5 + 0.5 * Math.sin(s.t * 1.6);
        const xBall = -1.5 + u * 2.9;
        if (xBall < -0.3) {
          galBall.position.set(xBall, 0.35 + (-0.3 - xBall) * 0.55, 0);
        } else {
          const d = xBall + 0.3;
          galBall.position.set(-0.3 + d * Math.cos(rad), 0.35 + d * Math.sin(rad), 0);
        }

        // Station 1: scale 3D force arrows
        const nLen = (s.fric.normalN / 100) * 1.1;
        const pLen = (s.pushN / 45) * 1.15;
        const fLen = (s.fric.frictionN / 45) * 1.15;
        setArrow(fNorm, V(0, 0.32, 0), V(0, 0.32 + nLen, 0));
        setArrow(fGrav, V(0, -0.32, 0), V(0, -0.32 - nLen, 0));
        setArrow(fPush, V(0.42, 0, 0), V(0.42 + pLen, 0, 0));
        setArrow(fFric, V(-0.42, -0.2, 0), V(-0.42 - fLen, -0.2, 0));

        // Station 2: braking strap angle & sliding teacup
        strapAsm.rotation.z = (s.strapDeg * Math.PI) / 180;
        teaCup.position.x = 0.2 + (s.decelMps2 / 6) * 0.32 * (0.5 + 0.5 * Math.sin(s.t * 2));

        // Station 3: normal load squashes upper asperities closer
        upAsp.position.y = 1.38 - (s.massKg / 10) * 0.14;

        // Station 4: operating dot on static/kinetic curve & sled slide
        const ratio = s.pushN / Math.max(1, s.fric.fStaticMaxN);
        if (!s.fric.sliding) {
          const uSt = Math.min(1, ratio);
          stateBall.position.set(-1.4 + uSt * 1.2, 0.1 + uSt * 1.25, 0);
          sledBox.position.x = 0;
        } else {
          const uSl = Math.min(1, (ratio - 1) / 1.0);
          stateBall.position.set(-0.08 + uSl * 1.45, 0.92, 0);
          sledBox.position.x = ((s.t * s.fric.accelMps2 * 0.25) % 1.2) - 0.6;
        }
      },
    };
  },
};
