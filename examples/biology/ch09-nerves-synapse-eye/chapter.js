import { SUBJECT } from '../subject.js';
import {
  THREE, part, box, cyl, sphere, capsule, torus, rod,
  prims, buildBilayer, studioGrid, playTone, shadeMat, V
} from '@saxster/atlas/bio_kit.js';
import * as M from './model.js';

export const PAGES = [
  {
    tab: 'Axon & Na⁺/K⁺ gates',
    fig: 'Figure 9.1–9.3 & 9.9 · Axon gates, voltage wave and TTX block',
    title: 'Action Potential & Voltage-Gated Channels',
    alt: '3D axon lipid bilayer with voltage-gated Na+ and K+ channels, Hodgkin-Huxley V_m(t) trace, and tetrodotoxin pore block.',
    cam: { target: [0.4, 1.2, 0], az: 24, el: 20, dist: 11.8 },
    lit: 'nav_channel',
    parts: ['nav_channel', 'kv_channel', 'hh_trace'],
    look: { xray: 0.15, section: 0 },
  },
  {
    tab: 'Chemical synapse',
    fig: 'Figure 9.4–9.5 · Vesicle release and the chemical synapse',
    title: 'The Chemical Synapse Relay',
    alt: '3D presynaptic terminal releasing neurotransmitter vesicles across the 20 nm synaptic cleft to postsynaptic ligand-gated receptors.',
    cam: { target: [14, 1.35, 0], az: -22, el: 20, dist: 11.2 },
    lit: 'synaptic_vesicles',
    parts: ['synaptic_vesicles', 'postsynaptic_receptors'],
    look: { xray: 0.25, section: 0 },
  },
  {
    tab: '3D Eye optics',
    fig: 'Figure 9.6–9.7 · Iris aperture and lens accommodation',
    title: 'Eye Optics: Pupil Reflex & Accommodation',
    alt: '3D cutaway of the human eye showing cornea, iris pupil aperture, ciliary muscle ring, suspensory ligaments, elastic lens, and fovea.',
    cam: { target: [28, 1.35, 0], az: 20, el: 20, dist: 11.2 },
    lit: 'crystalline_lens',
    parts: ['iris_pupil', 'crystalline_lens', 'retina_fovea'],
    look: { xray: 0.28, section: 0 },
  },
  {
    tab: 'Auxin tropism',
    fig: 'Figure 9.8 · Auxin redistribution and shoot bending',
    title: 'Auxin Redistribution & Shoot Phototropism',
    alt: '3D plant coleoptile tip bending toward directional light as IAA auxin accumulates on the shaded flank and elongates shaded cells.',
    cam: { target: [42, 1.35, 0], az: 24, el: 20, dist: 11.2 },
    lit: 'coleoptile_shoot',
    parts: ['coleoptile_shoot', 'light_source'],
    look: { xray: 0, section: 0 },
  },
];

export const PLATES = {
  nav_channel: {
    text: 'Obaid Siddiqi & Hodgkin–Huxley’s voltage-gated Na⁺ channel: opens as voltage reaches threshold, allowing Na⁺ influx, then inactivates (blocked externally by pufferfish TTX).',
    facts: s => [['V_m', `${s.ap.vMv.toFixed(0)} mV`], ['g_Na', `${s.ap.gNa.toFixed(1)} relative units`], ['State', s.ap.fired ? 'All-or-none spike' : 'Blocked/Subthreshold']],
  },
  kv_channel: {
    text: 'Delayed-rectifier voltage-gated K⁺ channel: opens as Na⁺ channels inactivate, letting K⁺ rush out to repolarise and briefly hyperpolarise (a brief undershoot) the membrane.',
  },
  hh_trace: {
    text: 'Schematic membrane and conductance trajectories V_m(t), g_Na(t), and g_K(t): refractory inactivation behind the wave favours forward propagation in the drawn circuit.',
  },
  synaptic_vesicles: {
    text: 'Presynaptic bouton: arriving depolarization opens voltage-gated Ca²⁺ channels, triggering synaptic vesicles to fuse with the membrane and exocytose neurotransmitter into the 20 nm cleft.',
  },
  postsynaptic_receptors: {
    text: 'This excitatory chemical relay receives transmitter through postsynaptic ligand-gated channels. Other receptors can regulate release presynaptically, and other synapses inhibit firing. Diffusion is only part of the total delay.',
  },
  iris_pupil: {
    text: 'Antagonistic iris muscles: circular muscles contract in bright light to constrict the pupil (protecting retinal photoreceptors), while radial muscles contract in dim light to dilate it.',
  },
  crystalline_lens: {
    text: 'Accommodation for near vs distant objects: for a near book (25 cm), the ciliary muscle ring contracts, slackening suspensory ligaments so the elastic lens springs into a more convex shape. The reported optical power belongs to the whole chosen reduced eye, not the lens alone.',
    facts: s => [['f', `${s.eye.fRequiredMm.toFixed(2)} mm`], ['Power', `${s.eye.powerDioptres.toFixed(1)} D`], ['Pupil', `${s.eye.pupilDiamMm.toFixed(1)} mm`]],
  },
  retina_fovea: {
    text: 'Retinal photoreceptor sheet: 120 million dim-light rods across the periphery and millions of colour-sensitive cones, most densely packed at the fovea, absent at the optic-nerve blind spot.',
  },
  coleoptile_shoot: {
    text: 'Jagadish Chandra Bose & Cholodny–Went tropism: unilateral light drives IAA auxin laterally to the shaded side of the shoot tip, where higher auxin stimulates proton pumps and cell-wall loosening so shaded cells elongate faster.',
    facts: s => [['Shaded IAA', `${(s.aux.shadedFraction * 100).toFixed(0)}%`], ['Bend', `${s.aux.bendAngleDeg.toFixed(1)}°`]],
  },
  light_source: {
    text: 'Directional blue-light stimulus (adjust angle slider or tilt your device!): in shoots IAA promotes elongation (positive phototropism); in roots high IAA inhibits elongation (positive gravitropism).',
  },
};

export const CHAPTER = {
  subject: SUBJECT,
  no: 9,
  PAGES,
  PLATES,
  clock0: 0,
  cuts: true,
  xrayKeys: ['synaptic_vesicles', 'retina_fovea'],
  cutKeys: ['retina_fovea'],
  cutPlane: [0, 0, -1, 0.05],
  defaultParams: { ttxBlockPct: 0, objectDistM: 0.35, lightAngleDeg: 30, lightPct: 55 },
  controls: [
    { id: 'ttxBlockPct', label: 'TTX Na⁺ channel block', min: 0, max: 100, step: 10, value: 0, unit: '%' },
    { id: 'objectDistM', label: 'Eye viewing distance d_o', min: 0.25, max: 5.0, step: 0.25, value: 0.35, unit: 'm' },
    { id: 'lightPct', label: 'Eye illumination', min: 0, max: 100, step: 5, value: 55, unit: '%' },
    { id: 'lightAngleDeg', label: 'Tropism light angle', min: -45, max: 45, step: 5, value: 30, unit: '°' },
  ],
  sensor: { type: 'tilt', label: 'Use device tilt for tropism', param: 'lightAngleDeg', min: -45, max: 45 },
  lessons: {
    'ch09-nerves-hormones-3d': { page: 0, params: { ttxBlockPct: 0 } },
    'ch09-action-potential-3d': { page: 0, params: { ttxBlockPct: 0 } },
    'ch09-ttx-case-3d': { page: 0, params: { ttxBlockPct: 90 } },
    'ch09-synapse-latency-3d': { page: 1 },
    'ch09-eye-optics-3d': { page: 2, params: { objectDistM: 0.3 } },
    'ch09-tropism-auxin-3d': { page: 3, params: { lightAngleDeg: 35 } },
  },
  sonify(ctx, s, page) {
    // Action potential spike click/pitch
    const f = s.ap.fired ? 220 + (s.ap.vMv + 70) * 6 : 110;
    playTone(ctx, { freq: f, dur: 0.045, type: s.ap.fired ? 'sawtooth' : 'sine', gain: 0.03 });
  },
  state(clock, reduced) {
    const p = CHAPTER.params || CHAPTER.defaultParams;
    const t = reduced ? 1.8 : clock;
    const tMs = (t * 1.6) % 5.0;
    const ap = M.actionPotentialWave(tMs, 15, p.ttxBlockPct);
    const eye = M.eyeOpticsAccount(p.objectDistM, p.lightPct);
    const aux = M.auxinTropismAccount(p.lightAngleDeg);
    return { t, tMs, ap, eye, aux, ttxBlockPct: p.ttxBlockPct, objectDistM: p.objectDistM, lightAngleDeg: p.lightAngleDeg };
  },
  readout(s, page, pageIdx) {
    if (pageIdx === 0) {
      return `<b>t = ${s.tMs.toFixed(1)} ms · TTX block = ${s.ttxBlockPct}%</b> · Membrane V_m = <b>${s.ap.vMv.toFixed(0)} mV</b> · g_Na = ${s.ap.gNa.toFixed(1)} · g_K = ${s.ap.gK.toFixed(1)} relative units · <b>${s.ap.phase}</b>.`;
    }
    if (pageIdx === 1) {
      return `<b>Chemical Synapse (20 nm cleft)</b> · Ca²⁺ influx → vesicle fusion → neurotransmitter diffusion → postsynaptic receptor opening (total synaptic delay is roughly milliseconds) (forward excitatory example; regulatory receptors also exist).`;
    }
    if (pageIdx === 2) {
      return `<b>Object distance d_o = ${s.objectDistM.toFixed(2)} m</b> · Reduced-eye focal length f = <b>${s.eye.fRequiredMm.toFixed(2)} mm (${s.eye.powerDioptres.toFixed(1)} D)</b> · Chosen ciliary contraction = ${(s.eye.ciliaryTension * 100).toFixed(0)}%.`;
    }
    return `<b>Light angle = ${s.lightAngleDeg}°</b> · Shaded-side IAA auxin = <b>${(s.aux.shadedFraction * 100).toFixed(0)}%</b> · Chosen shoot bend <b>${s.aux.bendAngleDeg.toFixed(1)}°</b> toward light. Auxin fractions and curvature are illustrative.`;
  },
  buildWorld(E) {
    const { scene, asm } = E;
    const root = new THREE.Group();
    scene.add(root);
    studioGrid(root, { x0: -4, x1: 48 });
    const labels = [];
    const label = (cls, html, at, opts = {}) => labels.push({ cls, html, at, ...opts });

    // Station 0 (x = 0): Axon Membrane Na_V & K_V Channels + HH Trace
    const navAsm = asm('nav_channel', root, { title: 'Voltage-gated Na⁺ channel (Na_V)', sub: 'Voltage gating and inactivation' });
    navAsm.position.set(-1.1, 1.35, 0);
    buildBilayer(navAsm, { cols: 5, rows: 3, x0: 0.4, y0: 0, z0: 0, skipCenter: true });
    part(navAsm, cyl(0.28, 0.95, 20), { pal: 'red', tone: 'lit', pos: [0, 0, 0], ex: [-0.35, 0.35, 0], name: 'Na_V pore barrel' });
    const hBall = part(navAsm, sphere(0.14, 16), { pal: 'ochre', tone: 'lit', pos: [0, -0.62, 0], ex: [0, -0.45, 0], name: 'Inactivation h-ball' });
    const ttxPlug = part(navAsm, sphere(0.18, 16), { pal: 'ink', tone: 'lit', pos: [0, 0.62, 0], ex: [0, 0.55, 0], name: 'Tetrodotoxin (TTX) pore plug' });

    const kvAsm = asm('kv_channel', root, { title: 'Delayed-rectifier K⁺ channel (K_V)', sub: 'Repolarises membrane to −70 mV' });
    kvAsm.position.set(-0.2, 1.35, 0);
    part(kvAsm, cyl(0.25, 0.92, 20), { pal: 'blue', tone: 'hi', pos: [0, 0, 0], ex: [0.35, 0.35, 0], name: 'K_V pore barrel' });

    const hhAsm = asm('hh_trace', root, { title: 'Schematic V_m(t) trace', sub: 'Depolarisation, repolarisation & refractory dip' });
    hhAsm.position.set(0.6, 0.25, -0.3);
    const axH = prims.axes(hhAsm, { x: [0, 5], y: [-85, 45], size: [2.0, 1.65, 0.5], at: [0, 1.08, 0], ticks: 3, names: {x:'Time (ms)', y:'V (mV)'} });
    const plotV = prims.plot(hhAsm, t => M.actionPotentialWave(t, 15, 0).vMv, { axes: axH, samples: 48, color: 'red', width: 0.032 });
    labels.push(...axH.labels, ...plotV.labels);
    const vDot = part(hhAsm, sphere(0.085, 16), { pal: 'ochre', tone: 'lit', name: 'Spike wavefront' });
    label('board', 'Na_V & K_V channels', () => V(-0.7, 2.35, 0));
    label('board', 'V_m(t) spike wave', () => V(1.6, 2.15, -0.3));

    // Station 1 (x = 14): 3D Chemical Synapse & 20 nm Cleft
    const synAsm = asm('synaptic_vesicles', root, { title: 'Presynaptic bouton & vesicles', sub: 'Ca²⁺-triggered exocytosis' });
    synAsm.position.set(13.3, 1.35, 0);
    part(synAsm, sphere(0.75, 24), { pal: 'ochre', tone: 'mid', mat: shadeMat('ochre', { opacity: 0.42 }), ex: [-0.45, 0, 0], name: 'Presynaptic terminal bulb' });
    for (let i = 0; i < 4; i++) {
      part(synAsm, sphere(0.16, 16), { pal: 'green', tone: 'lit', pos: [0.22, (i - 1.5) * 0.28, (i % 2 ? 0.15 : -0.15)], ex: [0.35, 0.2, 0], name: 'Synaptic vesicle' });
    }
    const ntCloud = prims.particles(synAsm, 22, { radius: 0.04, color: 'red' });

    const postAsm = asm('postsynaptic_receptors', root, { title: 'Postsynaptic receptor channels', sub: 'Ligand-gated Na⁺ entry' });
    postAsm.position.set(14.8, 1.35, 0);
    part(postAsm, box(0.22, 1.55, 1.2, 0.04), { pal: 'blue', tone: 'hi', ex: [0.45, 0, 0], name: 'Postsynaptic membrane' });
    for (const sy of [-0.42, 0, 0.42]) {
      part(postAsm, cyl(0.14, 0.32, 16), { pal: 'red', tone: 'lit', pos: [-0.12, sy, 0], rot: [0, 0, Math.PI / 2], ex: [-0.25, 0, 0], name: 'Neurotransmitter receptor' });
    }
    label('board', 'Presynaptic vesicles', () => V(13.3, 2.35, 0));
    label('board', '20 nm Cleft & receptors', () => V(14.8, 2.35, 0));

    // Station 2 (x = 28): 3D Human Eye Cutaway (Iris, Ciliary Ring, Elastic Lens, Retina)
    const retAsm = asm('retina_fovea', root, { title: 'Sclera, retina & fovea', sub: 'Rods, cones & optic nerve' });
    retAsm.position.set(28.0, 1.35, 0);
    part(retAsm, sphere(1.05, 28), { pal: 'paper', tone: 'mid', mat: shadeMat('paper', { opacity: 0.36 }), ex: [0.45, 0, 0], name: 'Eyeball sclera & retina' });
    part(retAsm, cyl(0.18, 0.55, 16), { pal: 'ochre', tone: 'hi', pos: [1.1, -0.1, 0], rot: [0, 0, Math.PI / 2], ex: [0.65, 0, 0], name: 'Optic nerve head (blind spot)' });

    const irisAsm = asm('iris_pupil', root, { title: 'Iris & pupil reflex aperture', sub: 'Circular & radial muscles' });
    irisAsm.position.set(27.1, 1.35, 0);
    const irisRing = part(irisAsm, torus(0.46, 0.12, 12, 24), { pal: 'blue', tone: 'hi', rot: [0, Math.PI / 2, 0], ex: [-0.55, 0, 0], name: 'Iris diaphragm' });

    const lensAsm = asm('crystalline_lens', root, { title: 'Elastic crystalline lens & ciliary ring', sub: 'Fattens for near focus' });
    lensAsm.position.set(27.35, 1.35, 0);
    const eyeLens = part(lensAsm, sphere(0.42, 24), { pal: 'green', tone: 'lit', ex: [-0.25, 0.45, 0], name: 'Crystalline lens' });
    const ciliaryRing = part(lensAsm, torus(0.68, 0.06, 12, 24), { pal: 'red', tone: 'hi', rot: [0, Math.PI / 2, 0], ex: [0, 0.55, 0], name: 'Ciliary muscle ring' });
    const zonules = [];
    for (let i=0; i<12; i++) {
      const angle=i*Math.PI/6;
      const z=part(lensAsm, cyl(0.012, 0.22, 8), {pal:'ochre', tone:'hi', pos:[0, Math.cos(angle)*0.54, Math.sin(angle)*0.54], rot:[angle,0,0], name:'Suspensory zonule'});
      zonules.push({mesh:z, angle});
    }
    const cornea = part(retAsm, sphere(0.62, 20), {pal:'blue', mat:shadeMat('blue',{opacity:0.18}), pos:[-1,0,0], name:'Transparent cornea'});
    cornea.scale.set(0.27,1,1);
    part(retAsm, sphere(0.10, 16), {pal:'red',pos:[0.9,0,0],name:'Fovea marker (enlarged)'});
    label('board', 'Iris & elastic lens', () => V(27.2, 2.55, 0));
    label('board', 'Retina & fovea', () => V(28.8, 2.55, 0));

    // Station 3 (x = 42): Auxin Phototropism Coleoptile Shoot
    const shootAsm = asm('coleoptile_shoot', root, { title: 'Coleoptile shoot & IAA auxin gradient', sub: 'Shaded flank elongates faster' });
    shootAsm.position.set(42.0, 0.2, 0);
    const shootSegs = [];
    for (let i = 0; i < 6; i++) {
      const m = part(shootAsm, cyl(0.24 - i * 0.015, 0.36, 18), { pal: 'green', tone: 'lit', pos: [0, i * 0.34 + 0.18, 0], ex: [0, i * 0.12, 0], name: `Coleoptile segment ${i + 1}` });
      shootSegs.push(m);
    }
    const sunAsm = asm('light_source', root, { title: 'Directional blue-light stimulus', sub: 'Drives lateral IAA migration' });
    sunAsm.position.set(42.0, 2.35, 0);
    const sunOrb = part(sunAsm, sphere(0.24, 18), { pal: 'ochre', tone: 'lit', ex: [0, 0.4, 0], name: 'Directional light source' });
    label('board', 'Auxin-bending shoot', () => V(42.0, 2.65, 0));

    return {
      labels,
      update(s) {
        // Update HH V_m plot & cursor
        plotV.update(t => M.actionPotentialWave(t, 15, s.ttxBlockPct).vMv);
        vDot.position.copy(axH.to(s.tMs, s.ap.vMv, 0));
        ttxPlug.visible = s.ttxBlockPct > 5;
        hBall.position.y = s.ap.gK > 8 ? -0.38 : -0.68;

        // Neurotransmitter diffusion across synaptic cleft
        const nPts = [];
        for (let i = 0; i < 22; i++) {
          const u = ((i / 22) + s.t * 0.45) % 1;
          nPts.push([0.55 + u * 0.75, (i % 5 - 2) * 0.22, ((i % 3) - 1) * 0.18]);
        }
        ntCloud.show(s.ap.fired ? nPts.length : 0);
        nPts.forEach((xyz, i) => ntCloud.set(i, xyz));

        // Eye lens accommodation thickness (fat for near, thin for far)
        const fatness = 0.38 + s.eye.ciliaryTension * 0.42;
        eyeLens.scale.set(fatness, 1, 1);
        const ringRadius=0.76-0.10*s.eye.ciliaryTension;
        ciliaryRing.scale.setScalar(ringRadius/0.68);
        zonules.forEach(({mesh,angle})=>{
          const span=ringRadius-0.42;
          mesh.position.set(0,Math.cos(angle)*(ringRadius+0.42)/2,Math.sin(angle)*(ringRadius+0.42)/2);
          mesh.scale.y=span/0.22;
        });
        irisRing.scale.set(1,s.eye.pupilDiamMm/4.45,s.eye.pupilDiamMm/4.45);

        // Shoot phototropism bending toward lightAngleDeg
        const angRad = (s.aux.bendAngleDeg * Math.PI) / 180;
        let cx = 0, cy = 0.18;
        shootSegs.forEach((m, i) => {
          const a = (angRad * (i + 1)) / 6;
          m.position.set(cx, cy, 0);
          m.rotation.z = -a;
          cx += Math.sin(a) * 0.34;
          cy += Math.cos(a) * 0.34;
        });
        sunOrb.position.set(Math.sin((s.lightAngleDeg * Math.PI) / 180) * 1.45, 0.1, 0);
      },
    };
  },
};
