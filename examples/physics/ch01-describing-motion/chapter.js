import { SUBJECT } from '../subject.js';
import {
  THREE, part, box, cyl, sphere, lines, arrow, setArrow, rod,
  prims, shadeMat, studioGrid, vectorTriad, playTone, V
} from '@saxster/atlas/phys_kit.js';
import * as M from './model.js';

export const PAGES = [
  {
    tab: 'Two frames',
    fig: 'Figure 1.1 · Platform observer vs moving-train carriage reference frame',
    title: 'Two Observers, Two Reference Frames',
    alt: '3D railway platform with a stationary origin triad and a moving Mumbai local carriage carrying its own origin triad and a walking passenger.',
    cam: { target: [0, 1.3, 0], az: 22, el: 20, dist: 7.4 },
    lit: 'train_frame',
    parts: ['platform_frame', 'train_frame'],
    look: { xray: 0.15, section: 0 },
  },
  {
    tab: 'Four-car strobe',
    fig: 'Figure 1.3 · Equal-time strobe snapshots comparing steady, fast, accelerating, and braking cars',
    title: 'Stroboscopic Motion Tracks',
    alt: 'Four parallel 3D lanes with strobe ghost spheres showing slow constant speed, fast constant speed, uniform acceleration, and uniform deceleration.',
    cam: { target: [14, 1.2, 0], az: 16, el: 28, dist: 7.6 },
    lit: 'accel_lane',
    parts: ['steady_lanes', 'accel_lane'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Galileo ramp',
    fig: 'Figure 1.4 · Galileo’s grooved brass incline with 1 : 3 : 5 : 7 odd-number bell gates',
    title: 'Galileo’s Inclined Plane & Odd-Number Law',
    alt: '3D tilted wooden and brass ramp with a rolling bronze sphere and musical bell gates spaced at 1, 4, 9, and 16 units so they ring at equal time beats.',
    cam: { target: [28, 1.3, 0], az: -20, el: 22, dist: 7.2 },
    lit: 'galileo_groove',
    parts: ['galileo_groove', 'bell_gates'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Vertical toss',
    fig: 'Figure 1.6 · Vertical ball toss showing v = 0 and a = −g at the highest point',
    title: 'Vertical Toss: Position, Velocity & Acceleration',
    alt: '3D vertical launch tower with a rising and falling ball carrying live velocity (green) and downward gravity acceleration (red) vectors alongside x-t, v-t, and a-t columns.',
    cam: { target: [42, 1.5, 0], az: 24, el: 18, dist: 7.4 },
    lit: 'toss_column',
    parts: ['toss_column', 'kinematic_bars'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Passing trains',
    fig: 'Figure 1.7 · Relative velocity of two Mumbai local trains on parallel tracks',
    title: 'Relative Velocity of Passing Trains',
    alt: 'Two 3D railway carriages moving along parallel tracks with ground velocity vectors v_A and v_B and relative velocity vector v_AB = v_A − v_B.',
    cam: { target: [56, 1.3, 0], az: 22, el: 22, dist: 7.6 },
    lit: 'train_b',
    parts: ['train_a', 'train_b'],
    look: { xray: 0.1, section: 0 },
  },
];

export const PLATES = {
  platform_frame: {
    text: 'Platform reference frame S: origin fixed to the station tiles. A passenger walking inside a moving carriage has ground velocity v_ground = v_train + v_walk.',
  },
  train_frame: {
    text: 'Carriage reference frame S′: origin moves with the train at v_train. Inside S′, a seated suitcase is at rest (v′ = 0) while platform pillars stream backward at −v_train.',
    facts: s => [['v_train', `${s.vTrain.toFixed(1)} m/s`], ['x_ground', `${(s.vTrain * 1.5).toFixed(1)} m`]],
  },
  steady_lanes: {
    text: 'Constant-velocity lanes: equal time ticks produce equal spatial gaps Δx = v Δt. Faster speed simply stretches the uniform spacing.',
  },
  accel_lane: {
    text: 'Uniform-acceleration lane: equal time ticks produce steadily widening gaps (Δx ∝ 1, 3, 5, 7) because average speed rises by a Δt every interval.',
    facts: s => [['a_ramp', `${s.gal.aMps2.toFixed(2)} m/s²`]],
  },
  galileo_groove: {
    text: 'Inclined groove: dilutes gravity by sin θ so a rolling sphere accelerates gently at a = (5/7) g sin θ, slow enough to time with a water clock or pendulum.',
    facts: s => [['Angle θ', `${s.rampDeg}°`], ['a', `${s.gal.aMps2.toFixed(2)} m/s²`]],
  },
  bell_gates: {
    text: 'Bell gates placed at total distances 1, 4, 9, 16 (intervals 1 : 3 : 5 : 7): the rolling ball rings every bell on a steady musical beat!',
    facts: s => [['Intervals', s.gal.oddSteps.map(d => d.toFixed(2)).join(' : ') + ' m']],
  },
  toss_column: {
    text: 'At the exact top of a vertical toss, instantaneous velocity v passes through zero, yet acceleration a remains −9.8 m/s² downward — if a were zero at the peak, the ball would hover in mid-air Forever!',
    facts: s => [['v_0', `${s.v0Toss.toFixed(1)} m/s`], ['y_apex', `${s.toss.yApex.toFixed(2)} m`], ['a_top', `-9.80 m/s²`]],
  },
  kinematic_bars: {
    text: '3D kinematic bars: y(t) is a symmetric parabola, v(t) is a straight line crossing zero at t_apex, and a(t) is a constant negative step.',
  },
  train_a: {
    text: 'Train A on Track 1: velocity v_A measured relative to the railway sleepers.',
    facts: s => [['v_A', `${s.vAMps >= 0 ? '+' : ''}${s.vAMps.toFixed(0)} m/s`]],
  },
  train_b: {
    text: 'Train B on Track 2: relative velocity seen from Train A is v_BA = v_B − v_A. Opposite directions add speeds; matching speeds make the neighbour train appear motionless.',
    facts: s => [['v_B', `${s.vBMps >= 0 ? '+' : ''}${s.vBMps.toFixed(0)} m/s`], ['|v_AB|', `${s.rel.closingSpeed.toFixed(0)} m/s`]],
  },
};

export const CHAPTER = {
  subject: SUBJECT,
  no: 1,
  PAGES,
  PLATES,
  clock0: 0,
  cuts: true,
  xrayKeys: ['train_frame', 'train_a', 'train_b'],
  cutKeys: ['train_frame', 'train_a', 'train_b'],
  cutPlane: [0, 0, -1, 0.05],
  defaultParams: { rampDeg: 12, v0Toss: 11, vAMps: 15, vBMps: -12 },
  controls: [
    { id: 'rampDeg', label: 'Galileo ramp angle θ', min: 4, max: 25, step: 1, value: 12, unit: '°' },
    { id: 'v0Toss', label: 'Vertical toss launch v₀', min: 5, max: 16, step: 0.5, value: 11, unit: 'm/s' },
    { id: 'vAMps', label: 'Train A ground velocity v_A', min: -20, max: 20, step: 1, value: 15, unit: 'm/s' },
    { id: 'vBMps', label: 'Train B ground velocity v_B', min: -20, max: 20, step: 1, value: -12, unit: 'm/s' },
  ],
  lessons: {
    'ch01-frames-3d': { page: 0 },
    'ch01-strobe-3d': { page: 1 },
    'ch01-galileo-ramp-3d': { page: 2, params: { rampDeg: 14 } },
    'ch01-toss-3d': { page: 3, params: { v0Toss: 12 } },
    'ch01-trains-3d': { page: 4, params: { vAMps: 15, vBMps: -12 } },
  },
  sensor: {
    type: 'tilt',
    label: 'Tilt to incline Galileo ramp',
    apply(v) {
      return { rampDeg: Math.max(4, Math.min(25, Math.round(4 + v * 21))) };
    },
  },
  sonify(ctx, s, page) {
    if (page === 2) playTone(ctx, { freq: 300 + s.gal.aMps2 * 80, dur: 0.06, type: 'triangle', gain: 0.035 });
    else if (page === 3) playTone(ctx, { freq: 220 + s.toss.yApex * 25, dur: 0.07, type: 'sine', gain: 0.03 });
    else if (page === 4) playTone(ctx, { freq: 260 + s.rel.closingSpeed * 7, slideTo: Math.max(120, 260 - s.rel.closingSpeed * 4), dur: 0.09, type: 'sawtooth', gain: 0.025 });
    else playTone(ctx, { freq: 310, dur: 0.05, type: 'sine', gain: 0.025 });
  },
  state(clock, reduced) {
    const p = CHAPTER.params || CHAPTER.defaultParams;
    const t = reduced ? 1.1 : clock;
    const gal = M.galileoRampKinematics(p.rampDeg, 1.0);
    const cycleT = (t % (2 * (p.v0Toss / M.G_EARTH)));
    const toss = M.verticalTossState(p.v0Toss, cycleT);
    const rel = M.relativeTrainVelocity(p.vAMps, p.vBMps, 108);
    return {
      t,
      vTrain: Math.max(2, Math.abs(p.vAMps)),
      rampDeg: p.rampDeg,
      gal,
      v0Toss: p.v0Toss,
      toss,
      vAMps: p.vAMps,
      vBMps: p.vBMps,
      rel,
    };
  },
  readout(s, page, pageIdx) {
    if (pageIdx === 0) {
      return `<b>Reference Frames S (Platform) vs S′ (Carriage)</b> · Position transforms as <b>x′ = x − v_frame t</b> · Motion is always measured relative to a chosen origin and axes.`;
    }
    if (pageIdx === 1) {
      return `<b>Equal-Time Strobe Tracks</b> · Constant velocity → equal spatial gaps · Uniform acceleration → gaps grow as consecutive odd numbers <b>1 : 3 : 5 : 7</b>.`;
    }
    if (pageIdx === 2) {
      return `<b>Galileo incline θ = ${s.rampDeg}°</b> · Sphere acceleration <b>a = ${s.gal.aMps2.toFixed(2)} m/s²</b> · Equal-time step distances: <b>${s.gal.oddSteps.map(x => x.toFixed(2)).join(' m, ')} m</b> (ratio 1 : 3 : 5 : 7).`;
    }
    if (pageIdx === 3) {
      return `<b>Vertical Toss (v₀ = ${s.v0Toss.toFixed(1)} m/s)</b> · Apex height <b>y_max = ${s.toss.yApex.toFixed(2)} m</b> at t = ${s.toss.tApex.toFixed(2)} s · At apex: <b>v = 0 m/s</b>, <b>a = −9.80 m/s²</b>.`;
    }
    const passStr = Number.isFinite(s.rel.passTimeSec) ? `${s.rel.passTimeSec.toFixed(1)} s to clear 108 m` : 'trains stay side-by-side (∞ s)';
    return `<b>v_A = ${s.vAMps >= 0 ? '+' : ''}${s.vAMps} m/s</b>, <b>v_B = ${s.vBMps >= 0 ? '+' : ''}${s.vBMps} m/s</b> → Relative velocity <b>v_AB = ${s.rel.vRelAB >= 0 ? '+' : ''}${s.rel.vRelAB} m/s</b> (${passStr}).`;
  },
  buildWorld(E) {
    const { scene, asm } = E;
    const root = new THREE.Group();
    scene.add(root);
    studioGrid(root, { x0: -4, x1: 62 });
    const labels = [];
    const label = (cls, html, at, opts = {}) => labels.push({ cls, html, at, ...opts });

    // Station 0 (x = 0): Platform vs Moving Carriage Frame
    const platAsm = asm('platform_frame', root, { title: 'Platform frame S', sub: 'Fixed to station ground' });
    platAsm.position.set(0, 0.15, 0.85);
    part(platAsm, box(3.6, 0.25, 0.8, 0.03), { pal: 'paper', tone: 'mid', pos: [0, 0, 0], name: 'Station platform' });
    vectorTriad(platAsm, { pos: [-1.4, 0.2, 0.2], len: 0.65 });

    const carAsm = asm('train_frame', root, { title: 'Carriage frame S′', sub: 'Origin moves at v_train' });
    carAsm.position.set(0, 0.65, -0.45);
    part(carAsm, box(2.1, 0.85, 0.85, 0.04), { pal: 'blue', tone: 'mid', pos: [0, 0.3, 0], mat: shadeMat('blue', { opacity: 0.45 }), ex: [0, 0.5, 0], name: 'Train carriage shell' });
    vectorTriad(carAsm, { pos: [-0.7, 0.05, 0], len: 0.55 });
    const walker = part(carAsm, sphere(0.14, 16), { pal: 'red', tone: 'hi', pos: [0, 0.22, 0], ex: [0, 0.35, 0.3], name: 'Passenger in carriage' });
    label('board', 'Frame S (Platform)', () => V(-1.4, 1.2, 1.0));
    label('board', 'Frame S′ (Train)', () => V(carAsm.position.x, 2.0, -0.45), { leader: [0, -20] });

    // Station 1 (x = 14): 4-Car Strobe Tracks
    const steadyAsm = asm('steady_lanes', root, { title: 'Constant-speed strobe lanes', sub: 'Equal gaps Δx = v Δt' });
    steadyAsm.position.set(14, 0.15, -0.8);
    part(steadyAsm, box(3.8, 0.08, 1.2, 0.02), { pal: 'paper', tone: 'mid', pos: [0, 0, 0], name: 'Constant-speed track' });
    for (let i = 0; i < 6; i++) {
      part(steadyAsm, sphere(0.08, 12), { pal: 'blue', tone: 'hi', pos: [-1.5 + i * 0.45, 0.14, -0.32], ex: [0, 0.25, 0], name: 'Slow steady strobe' });
      part(steadyAsm, sphere(0.08, 12), { pal: 'green', tone: 'hi', pos: [-1.5 + i * 0.62, 0.14, 0.32], ex: [0, 0.35, 0], name: 'Fast steady strobe' });
    }

    const accelAsm = asm('accel_lane', root, { title: 'Accelerating & braking lanes', sub: '1 : 3 : 5 : 7 strobe gaps' });
    accelAsm.position.set(14, 0.15, 0.8);
    part(accelAsm, box(3.8, 0.08, 1.2, 0.02), { pal: 'paper', tone: 'mid', pos: [0, 0, 0], name: 'Accelerated track' });
    for (let i = 0; i < 5; i++) {
      const u = (i * i) / 16;
      const uBrake = 1 - Math.pow(4 - i, 2) / 16;
      part(accelAsm, sphere(0.095, 14), { pal: 'red', tone: 'hi', pos: [-1.6 + u * 3.2, 0.15, -0.32], ex: [0, 0.4, 0], name: 'Accelerating strobe' });
      part(accelAsm, sphere(0.095, 14), { pal: 'ochre', tone: 'hi', pos: [-1.6 + uBrake * 3.2, 0.15, 0.32], ex: [0, 0.3, 0], name: 'Braking strobe' });
    }
    label('board', '1 : 3 : 5 : 7 strobe gaps', () => V(14, 1.15, 0.8), { leader: [0, -22] });

    // Station 2 (x = 28): Galileo's Inclined Plane & Odd-Number Bell Gates
    const rampAsm = asm('galileo_groove', root, { title: 'Grooved brass incline', sub: 'a = (5/7) g sin θ' });
    rampAsm.position.set(28, 0.9, 0);
    part(rampAsm, box(3.6, 0.14, 0.55, 0.02), { pal: 'ochre', tone: 'hi', pos: [0, 0, 0], ex: [0, -0.3, 0], name: 'Inclined wooden beam' });
    const bronzeBall = part(rampAsm, sphere(0.13, 18), { pal: 'red', tone: 'hi', pos: [-1.6, 0.2, 0], ex: [0, 0.4, 0], name: 'Rolling bronze sphere' });

    const bellsAsm = asm('bell_gates', root, { title: 'Odd-number bell gates (1, 4, 9, 16)', sub: 'Equal-time acoustic beats' });
    bellsAsm.position.set(28, 0.9, 0);
    for (const k of [1, 4, 9, 16]) {
      const bx = -1.6 + (k / 16) * 3.2;
      part(bellsAsm, cyl(0.04, 0.38, 12), { pal: 'green', tone: 'hi', pos: [bx, 0.26, 0.22], ex: [0, 0.45, 0.2], name: `Bell gate at d = ${k}` });
    }
    label('board', 'Bells at 1, 4, 9, 16', () => V(28, 2.05, 0), { leader: [20, -22] });

    // Station 3 (x = 42): Vertical Ball Toss + v & a Vectors
    const tossAsm = asm('toss_column', root, { title: 'Vertical toss launch tower', sub: 'v = 0, a = −g at peak' });
    tossAsm.position.set(41.2, 0.1, 0);
    part(tossAsm, cyl(0.05, 2.4, 12), { pal: 'dark', tone: 'mid', pos: [-0.35, 1.2, 0], name: 'Height guide mast' });
    const tossBall = part(tossAsm, sphere(0.16, 20), { pal: 'ochre', tone: 'hi', pos: [0, 1.0, 0], ex: [0, 0.35, 0], name: 'Tossed ball' });
    const vVec = arrow(tossAsm, { pal: 'green', r: 0.028 });
    const aVec = arrow(tossAsm, { pal: 'red', r: 0.028 });

    const barsAsm = asm('kinematic_bars', root, { title: 'y(t), v(t), a(t) columns', sub: 'Live state meters' });
    barsAsm.position.set(42.8, 0.1, 0);
    const yBar = part(barsAsm, box(0.32, 1.0, 0.32, 0.03), { pal: 'blue', tone: 'hi', pos: [-0.5, 0.5, 0], ex: [0, 0.3, 0], name: 'Height y(t)' });
    const vBar = part(barsAsm, box(0.32, 1.0, 0.32, 0.03), { pal: 'green', tone: 'hi', pos: [0.0, 0.5, 0], ex: [0, 0.3, 0], name: 'Speed |v(t)|' });
    part(barsAsm, box(0.32, 0.98, 0.32, 0.03), { pal: 'red', tone: 'hi', pos: [0.5, 0.49, 0], ex: [0, 0.3, 0], name: 'Constant |a| = g' });
    label('board', 'a = −g even at apex!', () => V(41.2, 2.55, 0), { leader: [0, -20] });

    // Station 4 (x = 56): Passing Trains Relative Velocity
    const trainAAsm = asm('train_a', root, { title: 'Train A (Track 1)', sub: 'Ground velocity v_A' });
    trainAAsm.position.set(56, 0.45, -0.55);
    part(trainAAsm, box(1.8, 0.62, 0.65, 0.04), { pal: 'blue', tone: 'hi', pos: [0, 0, 0], mat: shadeMat('blue', { opacity: 0.55 }), ex: [0, 0.4, -0.3], name: 'Train A carriage' });
    const vecA = arrow(trainAAsm, { pal: 'blue', r: 0.026 });

    const trainBAsm = asm('train_b', root, { title: 'Train B (Track 2)', sub: 'Relative velocity v_AB = v_A − v_B' });
    trainBAsm.position.set(56, 0.45, 0.55);
    part(trainBAsm, box(1.8, 0.62, 0.65, 0.04), { pal: 'ochre', tone: 'hi', pos: [0, 0, 0], mat: shadeMat('ochre', { opacity: 0.55 }), ex: [0, 0.4, 0.3], name: 'Train B carriage' });
    const vecB = arrow(trainBAsm, { pal: 'ochre', r: 0.026 });
    const vecRel = arrow(root, { pal: 'red', r: 0.03 });
    label('board', 'v_AB = v_A − v_B', () => V(56, 1.65, 0), { leader: [0, -20] });

    return {
      labels,
      update(s) {
        // Station 0: carriage motion + passenger walk
        const cyc = (s.t % 2.4) / 2.4 - 0.5;
        carAsm.position.x = cyc * 1.6;
        walker.position.x = cyc * 0.7;

        // Station 2: tilt Galileo ramp & roll ball
        const rad = -(s.rampDeg * Math.PI) / 180;
        rampAsm.rotation.z = rad;
        bellsAsm.rotation.z = rad;
        const uRoll = (s.t * 0.55) % 1;
        bronzeBall.position.x = -1.6 + uRoll * uRoll * 3.2;

        // Station 3: vertical toss ball & vectors
        const yNorm = Math.min(2.1, (s.toss.yM / Math.max(1, s.toss.yApex)) * 1.85 + 0.25);
        tossBall.position.y = yNorm;
        const vLen = (s.toss.vMps / 16) * 0.75;
        setArrow(vVec, V(0.22, yNorm, 0), V(0.22, yNorm + vLen, 0));
        setArrow(aVec, V(-0.22, yNorm, 0), V(-0.22, yNorm - 0.55, 0));
        yBar.scale.y = Math.max(0.08, yNorm * 0.8);
        yBar.position.y = yBar.scale.y * 0.5;
        vBar.scale.y = Math.max(0.08, Math.abs(vLen) * 1.6);
        vBar.position.y = vBar.scale.y * 0.5;

        // Station 4: passing trains
        const pCycle = ((s.t * 0.45) % 1) - 0.5;
        trainAAsm.position.x = 56 + pCycle * (s.vAMps / 12);
        trainBAsm.position.x = 56 + pCycle * (s.vBMps / 12);
        setArrow(vecA, V(0, 0.5, 0), V((s.vAMps / 20) * 1.1, 0.5, 0));
        setArrow(vecB, V(0, 0.5, 0), V((s.vBMps / 20) * 1.1, 0.5, 0));
        setArrow(vecRel, V(56, 1.25, 0), V(56 + (s.rel.vRelAB / 30) * 1.35, 1.25, 0));
      },
    };
  },
};
