import { SUBJECT } from '../subject.js';
import {
  THREE, part, box, cyl, sphere, torus, lines, arrow, setArrow, rod,
  prims, shadeMat, studioGrid, playTone, V
} from '@saxster/atlas/phys_kit.js';
import * as M from './model.js';

export const PAGES = [
  {
    tab: 'Drop vs flick',
    fig: 'Figure 4.1 · Dual-coin spring launcher proving horizontal speed does not slow vertical fall',
    title: 'Independence of Perpendicular Motions',
    alt: '3D benchtop spring-blade launcher that simultaneously drops one brass coin straight down while flicking an identical coin horizontally; horizontal strobe rods show both coins at the exact same height every millisecond.',
    cam: { target: [0, 1.25, 0], az: 20, el: 20, dist: 7.2 },
    lit: 'launcher_rig',
    parts: ['launcher_rig', 'strobe_plane'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Inward Δv chord',
    fig: 'Figure 4.3 · Strobe orbit showing velocity change Δv = v₂ − v₁ pointing straight to the center',
    title: 'Centripetal Velocity-Change Vector Δv',
    alt: '3D circular orbit ring with strobe positions 1 and 2, tangent velocity vectors v₁ and v₂, and a vector subtraction triangle proving Δv points radially inward with magnitude v²/r.',
    cam: { target: [14, 1.3, 0], az: 24, el: 28, dist: 7.4 },
    lit: 'vector_fan',
    parts: ['orbit_ring', 'vector_fan'],
    look: { xray: 0.15, section: 0 },
  },
];

export const PLATES = {
  launcher_rig: {
    text: 'Simultaneous release blade: as the spring bar snaps, Coin A drops from rest (v_x = 0) while Coin B shoots out horizontally at v_x. Both hit the floor with a single click!',
    facts: s => [['t_fall', `${s.coin.fallTimeSec.toFixed(3)} s`], ['Range x', `${s.coin.rangeM.toFixed(2)} m`]],
  },
  strobe_plane: {
    text: 'Horizontal tie-bars joining each strobe pair: at every tick t, y_A(t) = y_B(t) = h − ½gt² because vertical gravity acts orthogonally to horizontal inertia.',
    facts: s => [['v_x', `${s.vHorizMps.toFixed(1)} m/s`], ['v_y,impact', `${s.coin.vImpactVertMps.toFixed(2)} m/s`]],
  },
  orbit_ring: {
    text: 'Uniform circular path of radius r: speed |v| stays constant, but the direction of velocity turns continuously inward.',
    facts: s => [['Speed v', `${s.orbitSpeedMps.toFixed(1)} m/s`], ['Radius r', `${s.orbitRadiusM.toFixed(1)} m`]],
  },
  vector_fan: {
    text: 'Tail-to-tail velocity subtraction Δv = v₂ − v₁: transporting v₁ to v₂ reveals that the change in velocity points directly toward the center of the circle with a_c = v² / r.',
    facts: s => [['a_c = v²/r', `${s.cen.aCentripetalMps2.toFixed(2)} m/s²`], ['|Δv| (20°)', `${s.cen.deltaVChord.toFixed(2)} m/s`]],
  },
};

export const CHAPTER = {
  subject: SUBJECT,
  no: 4,
  PAGES,
  PLATES,
  clock0: 0,
  cuts: true,
  xrayKeys: ['launcher_rig', 'orbit_ring'],
  cutKeys: ['launcher_rig'],
  cutPlane: [0, 0, -1, 0.05],
  defaultParams: { vHorizMps: 4.5, heightM: 1.25, orbitSpeedMps: 6.0, orbitRadiusM: 2.0 },
  controls: [
    { id: 'vHorizMps', label: 'Horizontal flick speed v_x', min: 1.0, max: 8.0, step: 0.5, value: 4.5, unit: 'm/s' },
    { id: 'heightM', label: 'Release table height h', min: 0.5, max: 2.0, step: 0.05, value: 1.25, unit: 'm' },
    { id: 'orbitSpeedMps', label: 'Orbital tangent speed v', min: 2.0, max: 10.0, step: 0.5, value: 6.0, unit: 'm/s' },
    { id: 'orbitRadiusM', label: 'Orbit radius r', min: 1.0, max: 4.0, step: 0.2, value: 2.0, unit: 'm' },
  ],
  lessons: {
    'ch04-dual-coin-3d': { page: 0, params: { vHorizMps: 4.5, heightM: 1.25 } },
    'ch04-centripetal-3d': { page: 1, params: { orbitSpeedMps: 6.0, orbitRadiusM: 2.0 } },
  },
  sonify(ctx, s, page) {
    if (page === 0) playTone(ctx, { freq: 520, dur: 0.04, type: 'triangle', gain: 0.04 });
    else playTone(ctx, { freq: 180 + s.cen.aCentripetalMps2 * 8, dur: 0.07, type: 'sine', gain: 0.03 });
  },
  state(clock, reduced) {
    const p = CHAPTER.params || CHAPTER.defaultParams;
    const t = reduced ? 0.65 : clock;
    const coin = M.dualCoinFlight(p.heightM, p.vHorizMps);
    const cen = M.centripetalChordKinematics(p.orbitSpeedMps, p.orbitRadiusM, 24);
    return {
      t,
      vHorizMps: p.vHorizMps,
      heightM: p.heightM,
      coin,
      orbitSpeedMps: p.orbitSpeedMps,
      orbitRadiusM: p.orbitRadiusM,
      cen,
    };
  },
  readout(s, page, pageIdx) {
    if (pageIdx === 0) {
      return `<b>Height h = ${s.heightM.toFixed(2)} m</b>, <b>v_x = ${s.vHorizMps.toFixed(1)} m/s</b> → Both coins land in <b>t = √(2h/g) = ${s.coin.fallTimeSec.toFixed(3)} s</b> (Single click! Horizontal range = <b>${s.coin.rangeM.toFixed(2)} m</b>).`;
    }
    return `<b>Circular Orbit (v = ${s.orbitSpeedMps.toFixed(1)} m/s, r = ${s.orbitRadiusM.toFixed(1)} m)</b> · Velocity change <b>Δv = v₂ − v₁</b> points radially inward → Centripetal acceleration <b>a_c = v²/r = ${s.cen.aCentripetalMps2.toFixed(2)} m/s²</b>.`;
  },
  buildWorld(E) {
    const { scene, asm } = E;
    const root = new THREE.Group();
    scene.add(root);
    studioGrid(root, { x0: -4, x1: 22 });
    const labels = [];
    const label = (cls, html, at, opts = {}) => labels.push({ cls, html, at, ...opts });

    // Station 0 (x = 0): Dual-Coin Drop vs Flick Apparatus
    const rigAsm = asm('launcher_rig', root, { title: 'Dual-coin release pillar', sub: 'Simultaneous drop & flick' });
    rigAsm.position.set(-1.3, 0, 0);
    const pillar = part(rigAsm, box(0.36, 1.9, 0.36, 0.03), { pal: 'dark', tone: 'mid', pos: [0, 0.95, 0], ex: [-0.35, 0, 0], name: 'Vertical support pillar' });
    const coinDrop = part(root, cyl(0.14, 0.05, 20), { pal: 'ochre', tone: 'hi', pos: [-1.3, 1.9, 0], name: 'Dropped Coin A' });
    const coinFlick = part(root, cyl(0.14, 0.05, 20), { pal: 'red', tone: 'hi', pos: [-1.3, 1.9, 0], name: 'Flicked Coin B' });

    const strobeAsm = asm('strobe_plane', root, { title: 'Stroboscopic elevation tie-bars', sub: 'y_A(t) = y_B(t) at every tick' });
    strobeAsm.position.set(-1.3, 0, 0);
    const tieRods = [];
    const ghostsDrop = [], ghostsFlick = [];
    for (let i = 1; i <= 4; i++) {
      tieRods.push(rod(strobeAsm, { r: 0.012, pal: 'blue', tone: 'mid', name: `Equal-height tie bar ${i}` }));
      ghostsDrop.push(part(strobeAsm, sphere(0.065, 12), { pal: 'ochre', tone: 'mid', ex: [0, 0.25, -0.25], name: 'Drop strobe ghost' }));
      ghostsFlick.push(part(strobeAsm, sphere(0.065, 12), { pal: 'red', tone: 'mid', ex: [0, 0.25, 0.25], name: 'Flick strobe ghost' }));
    }
    label('board', 'Same height y(t) at every strobe tick!', () => V(0.3, 1.65, 0), { leader: [-24, -18] });

    // Station 1 (x = 14): Centripetal Velocity-Change Chord Δv = v2 - v1
    const ringAsm = asm('orbit_ring', root, { title: 'Circular orbit track', sub: 'Constant speed |v|, turning direction' });
    ringAsm.position.set(14, 0.85, 0);
    const ringMesh = part(ringAsm, torus(1.45, 0.035, 12, 48), { pal: 'paper', tone: 'mid', rot: [Math.PI / 2, 0, 0], ex: [0, -0.35, 0], name: 'Orbit circle' });
    part(ringAsm, sphere(0.18, 20), { pal: 'blue', tone: 'hi', pos: [0, 0, 0], ex: [0, 0.35, 0], name: 'Central attracting body' });

    const fanAsm = asm('vector_fan', root, { title: 'Velocity chord triangle (Δv = v₂ − v₁)', sub: 'a_c = v² / r toward center' });
    fanAsm.position.set(14, 0.85, 0);
    const orbiter = part(fanAsm, sphere(0.12, 18), { pal: 'ochre', tone: 'hi', pos: [1.45, 0, 0], ex: [0, 0.45, 0], name: 'Orbiting body' });
    const vTangent = arrow(fanAsm, { pal: 'green', r: 0.028 });
    const dvInward = arrow(fanAsm, { pal: 'red', r: 0.03 });
    label('board', 'v (tangent)', () => V(15.5, 1.35, 0));
    label('board', 'Δv & a_c point to center', () => V(14.0, 1.65, 0), { leader: [24, -20] });

    return {
      labels,
      update(s) {
        // Station 0: Dual coin fall & horizontal tie-bars
        const hTop = 0.35 + (s.heightM / 2.0) * 1.75;
        pillar.scale.y = hTop / 1.9;
        pillar.position.y = hTop * 0.5;
        const xSpan = (s.vHorizMps / 8.0) * 2.85;
        for (let i = 0; i < 4; i++) {
          const u = (i + 1) / 4;
          const ySt = hTop * (1 - u * u) + 0.05;
          const xSt = u * xSpan;
          ghostsDrop[i].position.set(0, ySt, 0);
          ghostsFlick[i].position.set(xSt, ySt, 0);
          tieRods[i].set(V(0, ySt, 0), V(xSt, ySt, 0));
        }
        const uAnim = (s.t * 0.85) % 1;
        const yNow = hTop * (1 - uAnim * uAnim) + 0.05;
        coinDrop.position.set(-1.3, yNow, 0);
        coinFlick.position.set(-1.3 + uAnim * xSpan, yNow, 0);

        // Station 1: Orbiting body & inward Δv vector
        const rOrb = 0.75 + (s.orbitRadiusM / 4.0) * 1.05;
        ringMesh.scale.setScalar(rOrb / 1.45);
        const omega = (s.orbitSpeedMps / s.orbitRadiusM) * 0.55;
        const ang = s.t * omega;
        const ox = rOrb * Math.cos(ang);
        const oz = rOrb * Math.sin(ang);
        orbiter.position.set(ox, 0, oz);
        const vLen = (s.orbitSpeedMps / 10) * 1.1;
        setArrow(vTangent, V(ox, 0, oz), V(ox - Math.sin(ang) * vLen, 0, oz + Math.cos(ang) * vLen));
        const aLen = Math.min(rOrb * 0.85, (s.cen.aCentripetalMps2 / 40) * 1.2 + 0.25);
        setArrow(dvInward, V(ox, 0, oz), V(ox - Math.cos(ang) * aLen, 0, oz - Math.sin(ang) * aLen));
      },
    };
  },
};
