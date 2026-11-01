import { SUBJECT } from '../subject.js';
import {
  THREE, part, box, cyl, sphere, torus, lines, arrow, setArrow, rod,
  prims, shadeMat, studioGrid, playTone, V
} from '@saxster/atlas/phys_kit.js';
import * as M from './model.js';

export const PAGES = [
  {
    tab: 'Barton resonance',
    fig: 'Figure 9.2 · Barton’s coupled pendulums & frequency-selective resonance peak',
    title: 'Barton’s Pendulums & Driven Resonance',
    alt: '3D horizontal cord supporting a heavy driver pendulum and four responder pendulums of different lengths; only the responder matching the driver’s length swings with huge resonant amplitude.',
    cam: { target: [0, 1.4, 0], az: 22, el: 20, dist: 7.4 },
    lit: 'responder_array',
    parts: ['driver_pendulum', 'responder_array'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Aeroelastic flutter',
    fig: 'Figure 9.3 · Self-excited torsional flutter of a suspension bridge deck in crosswind',
    title: 'Tacoma Narrows Torsional Flutter',
    alt: '3D suspension bridge deck twisting in an antisymmetric torsional wave as crosswind vortices feed energy into each half-cycle.',
    cam: { target: [14, 1.3, 0], az: 26, el: 22, dist: 7.4 },
    lit: 'bridge_deck',
    parts: ['suspension_cables', 'bridge_deck'],
    look: { xray: 0.15, section: 0 },
  },
  {
    tab: 'Sound compressions',
    fig: 'Figure 9.5 · Longitudinal sound wave: local molecular oscillation vs travelling compression fronts',
    title: 'Longitudinal Compressions & Rarefactions',
    alt: '3D transparent acoustic Kundt tube with an oscillating speaker piston at the left and 3D molecular rings bunching into high-density compressions and spreading into low-density rarefactions.',
    cam: { target: [28, 1.3, 0], az: 18, el: 20, dist: 7.4 },
    lit: 'compression_rings',
    parts: ['speaker_tube', 'compression_rings'],
    look: { xray: 0.25, section: 0 },
  },
];

export const PLATES = {
  driver_pendulum: {
    text: 'Heavy driver pendulum: sends periodic tension tugs at frequency f_drive along the shared horizontal suspension cord.',
    facts: s => [['f_drive', `${s.driveFreqHz.toFixed(2)} Hz`], ['Resonant A', `${s.resMatch.amp.toFixed(2)}×`]],
  },
  responder_array: {
    text: 'Four light responder pendulums (f₀ = 1.0, 1.5, 2.0, 2.5 Hz): only the pendulum whose natural frequency matches f_drive receives pushes in step with its velocity (90° phase lag) and builds a towering swing.',
    facts: s => [['Phase lag φ', `${s.resMatch.phaseLagDeg.toFixed(0)}°`]],
  },
  suspension_cables: {
    text: 'Main suspension cables & towers: support the vertical weight while allowing torsional twist around the deck centerline.',
  },
  bridge_deck: {
    text: 'Aeroelastic flutter vs simple forced resonance: the twisting bridge deck sheds its own alternating Kármán vortices, locking wind pushes to its own twist frequency when v_wind > v_crit.',
    facts: s => [['v_wind', `${s.windSpeedMps} m/s`], ['Regime', s.fl.unstable ? 'SELF-EXCITED FLUTTER' : 'DAMPED']],
  },
  speaker_tube: {
    text: 'Oscillating speaker diaphragm: pushes air molecules back and forth parallel to wave propagation (longitudinal wave).',
    facts: s => [['f_sound', `${s.soundFreqHz} Hz`], ['λ = v / f', `${s.snd.wavelengthM.toFixed(2)} m`]],
  },
  compression_rings: {
    text: 'Compressions (high pressure) and rarefactions (low pressure): individual air molecules merely slosh back and forth around their home position while the density pattern races forward at 343 m/s.',
  },
};

export const CHAPTER = {
  subject: SUBJECT,
  no: 9,
  PAGES,
  PLATES,
  clock0: 0,
  cuts: true,
  xrayKeys: ['bridge_deck', 'speaker_tube'],
  cutKeys: ['speaker_tube'],
  cutPlane: [0, 0, -1, 0.05],
  defaultParams: { driveFreqHz: 1.5, windSpeedMps: 19, soundFreqHz: 343 },
  controls: [
    { id: 'driveFreqHz', label: 'Barton driver frequency f_drive', min: 0.8, max: 2.6, step: 0.1, value: 1.5, unit: 'Hz' },
    { id: 'windSpeedMps', label: 'Bridge crosswind speed v_wind', min: 5, max: 25, step: 1, value: 19, unit: 'm/s' },
    { id: 'soundFreqHz', label: 'Acoustic frequency f', min: 170, max: 686, step: 10, value: 343, unit: 'Hz' },
  ],
  lessons: {
    'ch09-barton-3d': { page: 0, params: { driveFreqHz: 1.5 } },
    'ch09-flutter-3d': { page: 1, params: { windSpeedMps: 19 } },
    'ch09-sound-tube-3d': { page: 2, params: { soundFreqHz: 343 } },
  },
  sensor: {
    type: 'mic',
    label: 'Hum into mic to drive tube',
    apply(v) {
      return { soundFreqHz: Math.round(170 + v * 516), driveFreqHz: +(0.8 + v * 1.8).toFixed(1) };
    },
  },
  sonify(ctx, s, page) {
    if (page === 0) playTone(ctx, { freq: 160 + s.driveFreqHz * 110, dur: 0.07, type: 'sine', gain: 0.03 });
    else if (page === 1) playTone(ctx, { freq: 110 + s.windSpeedMps * 6, dur: 0.08, type: 'triangle', gain: 0.03 });
    else playTone(ctx, { freq: s.soundFreqHz, dur: 0.08, type: 'sine', gain: 0.035 });
  },
  state(clock, reduced) {
    const p = CHAPTER.params || CHAPTER.defaultParams;
    const t = reduced ? 1.1 : clock;
    const natFreqs = [1.0, 1.5, 2.0, 2.5];
    const responders = natFreqs.map(f0 => M.drivenResonanceAmplitude(p.driveFreqHz, f0, 0.18));
    const resMatch = M.drivenResonanceAmplitude(p.driveFreqHz, 1.5, 0.18);
    const fl = M.flutterGainRate(p.windSpeedMps, 15);
    const snd = M.soundWaveRelation(p.soundFreqHz, 343);
    return { t, driveFreqHz: p.driveFreqHz, responders, resMatch, windSpeedMps: p.windSpeedMps, fl, soundFreqHz: p.soundFreqHz, snd };
  },
  readout(s, page, pageIdx) {
    if (pageIdx === 0) {
      return `<b>Driver f = ${s.driveFreqHz.toFixed(2)} Hz</b> · Responder amplitudes (f₀ = 1.0, 1.5, 2.0, 2.5 Hz): <b>${s.responders.map(r => r.amp.toFixed(1)).join('×, ')}×</b> · Peak occurs when <b>f_drive = f₀</b>.`;
    }
    if (pageIdx === 1) {
      const status = s.fl.unstable ? '<b>SELF-EXCITED TORSIONAL FLUTTER</b> (positive vortex feedback)' : '<b>Damped deck oscillation</b> (below critical speed 15 m/s)';
      return `<b>Crosswind v = ${s.windSpeedMps} m/s</b> · ${status}.`;
    }
    return `<b>Longitudinal Sound Wave (f = ${s.soundFreqHz} Hz, v = 343 m/s)</b> · Wavelength <b>λ = ${s.snd.wavelengthM.toFixed(2)} m</b> · Individual molecules oscillate locally while compressions travel at v.`;
  },
  buildWorld(E) {
    const { scene, asm } = E;
    const root = new THREE.Group();
    scene.add(root);
    studioGrid(root, { x0: -4, x1: 35 });
    const labels = [];
    const label = (cls, html, at, opts = {}) => labels.push({ cls, html, at, ...opts });

    // Station 0 (x = 0): Barton's Coupled Pendulums
    const drvAsm = asm('driver_pendulum', root, { title: 'Heavy driver pendulum', sub: 'Sets driving frequency f_drive' });
    drvAsm.position.set(-1.35, 2.1, 0);
    part(drvAsm, box(3.4, 0.06, 0.08, 0.01), { pal: 'dark', tone: 'hi', pos: [1.35, 0, 0], name: 'Shared suspension bar' });
    const drvPivot = new THREE.Group();
    drvAsm.add(drvPivot);
    part(drvPivot, cyl(0.02, 1.15, 10), { pal: 'ochre', tone: 'hi', pos: [0, -0.58, 0], name: 'Driver rod' });
    part(drvPivot, sphere(0.19, 18), { pal: 'red', tone: 'hi', pos: [0, -1.15, 0], ex: [-0.35, 0, 0], name: 'Heavy driver bob' });

    const respAsm = asm('responder_array', root, { title: 'Responder pendulums (1.0..2.5 Hz)', sub: 'Resonant peak at matching length' });
    respAsm.position.set(0, 2.1, 0);
    const respPivots = [];
    const lengths = [1.45, 1.15, 0.85, 0.62];
    const pals = ['blue', 'green', 'ochre', 'blue'];
    for (let i = 0; i < 4; i++) {
      const piv = new THREE.Group();
      piv.position.set(-0.45 + i * 0.65, 0, 0);
      respAsm.add(piv);
      const L = lengths[i];
      part(piv, cyl(0.016, L, 10), { pal: 'dark', tone: 'mid', pos: [0, -L / 2, 0], name: `Responder cord ${i + 1}` });
      part(piv, sphere(0.12, 16), { pal: pals[i], tone: 'hi', pos: [0, -L, 0], ex: [0, -0.3, 0.25], name: `Responder bob ${i + 1}` });
      respPivots.push(piv);
    }
    label('board', 'Matched length → resonance!', () => V(0.2, 2.4, 0), { leader: [0, -18] });

    // Station 1 (x = 14): Tacoma Narrows Torsional Bridge Deck
    const cabAsm = asm('suspension_cables', root, { title: 'Suspension towers & main cables', sub: 'Support bridge span' });
    cabAsm.position.set(14, 0.1, 0);
    part(cabAsm, box(0.18, 2.1, 0.9, 0.02), { pal: 'dark', tone: 'mid', pos: [-1.5, 1.05, 0], name: 'West tower' });
    part(cabAsm, box(0.18, 2.1, 0.9, 0.02), { pal: 'dark', tone: 'mid', pos: [1.5, 1.05, 0], name: 'East tower' });

    const deckAsm = asm('bridge_deck', root, { title: 'Twisting roadway ribs', sub: 'Antisymmetric torsional flutter' });
    deckAsm.position.set(14, 1.05, 0);
    const deckPlanks = [];
    for (let i = 0; i < 11; i++) {
      const u = (i / 10) * 2 - 1;
      const p = part(deckAsm, box(0.24, 0.06, 0.85, 0.01), { pal: i === 5 ? 'ochre' : 'blue', tone: 'hi', pos: [u * 1.35, 0, 0], ex: [0, 0.35, 0], name: `Roadway rib ${i + 1}` });
      deckPlanks.push({ mesh: p, u });
    }
    label('board', 'Torsional node at center', () => V(14, 1.85, 0), { leader: [0, -20] });

    // Station 2 (x = 28): Longitudinal Sound Compression Tube
    const tubeAsm = asm('speaker_tube', root, { title: 'Acoustic resonance tube & piston', sub: 'Speaker oscillates along x' });
    tubeAsm.position.set(28, 1.1, 0);
    part(tubeAsm, cyl(0.58, 3.6, 24), { pal: 'paper', tone: 'mid', pos: [0, 0, 0], rot: [0, 0, Math.PI / 2], mat: shadeMat('paper', { opacity: 0.36 }), name: 'Acrylic wave tube' });
    const pistonMesh = part(tubeAsm, cyl(0.54, 0.14, 24), { pal: 'red', tone: 'hi', pos: [-1.65, 0, 0], rot: [0, 0, Math.PI / 2], ex: [-0.45, 0, 0], name: 'Speaker diaphragm' });

    const ringAsm = asm('compression_rings', root, { title: 'Longitudinal air-layer rings', sub: 'Bunch into compressions, spread in rarefactions' });
    ringAsm.position.set(28, 1.1, 0);
    const airRings = [];
    for (let i = 0; i < 15; i++) {
      const xEq = -1.35 + i * 0.20;
      const rMesh = part(ringAsm, torus(0.46, 0.028, 10, 24), { pal: i === 7 ? 'red' : 'blue', tone: 'hi', pos: [xEq, 0, 0], rot: [0, Math.PI / 2, 0], ex: [0, 0.35, 0], name: i === 7 ? 'Tracked home molecule layer' : 'Air layer' });
      airRings.push({ mesh: rMesh, xEq });
    }
    label('board', 'Red ring oscillates locally while compressions travel →', () => V(28, 2.0, 0), { leader: [0, -20] });

    return {
      labels,
      update(s) {
        // Station 0: Barton pendulums
        const w = s.driveFreqHz * 2.5;
        drvPivot.rotation.x = 0.25 * Math.sin(s.t * w);
        for (let i = 0; i < 4; i++) {
          const ampRad = Math.min(0.75, s.responders[i].amp * 0.14);
          const lag = (s.responders[i].phaseLagDeg * Math.PI) / 180;
          respPivots[i].rotation.x = ampRad * Math.sin(s.t * w - lag);
        }

        // Station 1: Torsional bridge flutter
        const twistAmp = s.fl.unstable ? Math.min(0.65, 0.15 + (s.windSpeedMps - 14) * 0.05) : 0.06;
        for (const dp of deckPlanks) {
          dp.mesh.rotation.x = twistAmp * Math.sin(dp.u * Math.PI) * Math.sin(s.t * 3.2);
        }

        // Station 2: Longitudinal sound wave
        const kWave = (2 * Math.PI) / Math.max(0.45, s.snd.wavelengthM * 1.1);
        const wSnd = s.t * 3.5;
        pistonMesh.position.x = -1.65 + 0.11 * Math.sin(wSnd);
        for (const ar of airRings) {
          ar.mesh.position.x = ar.xEq + 0.12 * Math.sin(kWave * (ar.xEq + 1.5) - wSnd);
        }
      },
    };
  },
};
