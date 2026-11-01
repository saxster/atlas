import { SUBJECT } from '../subject.js';
import {
  THREE, part, box, cyl, sphere, capsule,
  prims, buildBilayer, buildAtpSynthase, studioGrid, playTone, V
} from '@saxster/atlas/bio_kit.js';
import * as M from './model.js';

export const PAGES = [
  {
    tab: 'Mitochondrion 3D',
    fig: 'Figure 6.1–6.2 · 3D Mitochondrion cutaway: outer membrane, cristae & matrix Krebs ring',
    title: 'Mitochondrial Cristae Architecture',
    alt: '3D cutaway of a mitochondrion showing outer membrane, intermembrane proton space, folded inner cristae, and matrix Krebs cycle.',
    cam: { target: [0, 1.35, 0], az: 24, el: 22, dist: 7.2 },
    lit: 'mito_cristae',
    parts: ['mito_outer', 'mito_cristae', 'krebs_ring'],
    look: { xray: 0.25, section: 0 },
  },
  {
    tab: 'ETC & F₀F₁ rotor',
    fig: 'Figure 6.3 · Inner crista membrane Electron Transport Chain & rotary F₀F₁ ATP synthase',
    title: 'Chemiosmosis & Rotary ATP Synthase',
    alt: '3D inner mitochondrial membrane with electron transport complexes I-IV pumping protons to drive the spinning F0F1 ATP synthase turbine.',
    cam: { target: [14, 1.35, 0], az: -22, el: 20, dist: 7.4 },
    lit: 'f0f1_turbine',
    parts: ['etc_complexes', 'f0f1_turbine'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Respirometer ledger',
    fig: 'Figure 6.4 · Respirometer manometer with KOH CO₂ absorber & ATP yield comparison',
    title: 'Oxidation Ledger & Respirometer',
    alt: '3D respirometer chamber with germinating seeds over soda-lime KOH absorber and U-tube manometer alongside 32 vs 2 ATP yield columns.',
    cam: { target: [28, 1.35, 0], az: 20, el: 20, dist: 7.4 },
    lit: 'respirometer_chamber',
    parts: ['respirometer_chamber', 'atp_yield_bars'],
    look: { xray: 0.2, section: 0 },
  },
  {
    tab: 'Fermentation & roots',
    fig: 'Figure 6.5–6.6 · Muscle lactate oxygen debt, yeast ethanol fermentation & root aerenchyma',
    title: 'Anaerobic Fermentation & Root Aerenchyma',
    alt: '3D comparison of muscle lactate fermentation, yeast ethanol/CO2 airlock bubbler, and rice root aerenchyma oxygen channels.',
    cam: { target: [42, 1.35, 0], az: 26, el: 20, dist: 7.4 },
    lit: 'aerenchyma_root',
    parts: ['yeast_fermenter', 'aerenchyma_root'],
    look: { xray: 0.15, section: 0 },
  },
];

export const PLATES = {
  mito_outer: {
    text: 'Porin-studded outer mitochondrial membrane enclosing the H⁺-rich intermembrane reservoir (pH ~6.8 vs matrix pH ~7.8).',
  },
  mito_cristae: {
    text: 'Deeply invaginated inner cristae membrane: impermeable to protons except through F₀F₁ ATP synthase channels.',
  },
  krebs_ring: {
    text: 'Matrix citric acid (Krebs) cycle: oxidises acetyl-CoA to CO₂ while loading NADH and FADH₂ electron carriers for the inner membrane.',
  },
  etc_complexes: {
    text: 'Electron Transport Chain (Complexes I–IV): high-energy electrons from NADH/FADH₂ step down redox potentials to ½ O₂ + 2 H⁺ → H₂O, pumping protons across the crista membrane.',
    facts: s => [['Δp (PMF)', `${s.rel.pmfMv.toFixed(0)} mV`], ['Rotor', `${s.rel.rotorHz.toFixed(0)} Hz`]],
  },
  f0f1_turbine: {
    text: 'Peter Mitchell’s chemiosmotic payoff & Paul Boyer’s rotary binding-change turbine: H⁺ return spins the F₀ ring and γ-stalk at up to 150 Hz, synthesizing ~28 ATP per glucose.',
    facts: s => [['ATP / glucose', `${s.rel.totalAtpPerGlucose.toFixed(1)}`], ['OxPhos', `${s.rel.oxPhosAtp.toFixed(1)} ATP`]],
  },
  respirometer_chamber: {
    text: 'Sealed respirometer with KOH / soda-lime pellets that absorb evolved CO₂, so inward movement of the manometer fluid directly measures O₂ volume consumed by the respiring seeds.',
  },
  atp_yield_bars: {
    text: '16-fold energetic gap: complete aerobic oxidation yields ~32 ATP per glucose (left), whereas anaerobic glycolysis alone yields only 2 ATP (right).',
  },
  yeast_fermenter: {
    text: 'Anaerobic regeneration of NAD⁺: yeast decarboxylates pyruvate to acetaldehyde + CO₂ and reduces it to ethanol; vertebrate muscle reduces pyruvate reversibly to lactate (repaid by post-exercise EPOC oxygen debt).',
  },
  aerenchyma_root: {
    text: 'Flooded paddy-field adaptation: rice roots form continuous longitudinal air-filled aerenchyma tubes that pipe atmospheric O₂ down to submerged root-tip ATPase pumps.',
  },
};

export const CHAPTER = {
  subject: SUBJECT,
  no: 6,
  PAGES,
  PLATES,
  clock0: 0,
  cuts: true,
  xrayKeys: ['mito_outer', 'respirometer_chamber'],
  cutKeys: ['mito_outer', 'mito_cristae', 'aerenchyma_root'],
  cutPlane: [0, 0, -1, 0.05],
  defaultParams: { o2Supply: 100, demandLevel: 60 },
  controls: [
    { id: 'o2Supply', label: 'Oxygen availability O₂', min: 0, max: 100, step: 5, value: 100, unit: '%' },
    { id: 'demandLevel', label: 'Metabolic ATP demand', min: 20, max: 100, step: 5, value: 60, unit: '%' },
  ],
  sensor: { type: 'mic', label: 'Use mic breath sensor', param: 'demandLevel', min: 20, max: 100 },
  lessons: {
    'ch06-routes-3d': { page: 0, params: { o2Supply: 100 } },
    'ch06-mitochondrion-3d': { page: 0, params: { o2Supply: 100, demandLevel: 75 } },
    'ch06-etc-synthase-3d': { page: 1, params: { o2Supply: 100, demandLevel: 80 } },
    'ch06-respirometer-3d': { page: 2, params: { o2Supply: 85 } },
    'ch06-fermentation-roots-3d': { page: 3, params: { o2Supply: 15, demandLevel: 85 } },
  },
  sonify(ctx, s, page) {
    playTone(ctx, { freq: 95 + s.rel.rotorHz * 1.8, dur: 0.07, type: 'sawtooth', gain: 0.028 });
  },
  state(clock, reduced) {
    const p = CHAPTER.params || CHAPTER.defaultParams;
    const t = reduced ? 1.5 : clock;
    const rel = M.aerobicRelayAccount(p.o2Supply, p.demandLevel);
    return { t, rel, o2Supply: p.o2Supply, demandLevel: p.demandLevel };
  },
  readout(s, page, pageIdx) {
    if (pageIdx === 0) {
      return `<b>3D Mitochondrion</b> · O₂ = ${s.o2Supply}% · Proton-motive force Δp = <b>${s.rel.pmfMv.toFixed(0)} mV</b> · Yield = <b>${s.rel.totalAtpPerGlucose.toFixed(1)} ATP / glucose</b>.`;
    }
    if (pageIdx === 1) {
      return `<b>ETC & Rotary F₀F₁ ATP Synthase</b> · Rotor speed = <b>${s.rel.rotorHz.toFixed(0)} Hz</b> · Glycolysis: 2 ATP · Krebs: ${s.rel.krebsAtp.toFixed(1)} ATP · OxPhos: <b>${s.rel.oxPhosAtp.toFixed(1)} ATP</b>.`;
    }
    if (pageIdx === 2) {
      return `<b>Respirometer & ATP Ledger</b> · KOH absorbs evolved CO₂ so manometer shift measures O₂ uptake · Aerobic (32 ATP) vs Anaerobic (2 ATP) = 16× ratio.`;
    }
    return `<b>O₂ = ${s.o2Supply}% · Demand = ${s.demandLevel}%</b> · Lactate accumulation = <b>${s.rel.lactateAccumMm.toFixed(1)} mM</b> · ${s.rel.lactateAccumMm > 1 ? 'Oxygen debt building (repaid in recovery)' : 'Aerobic supply matches demand'}.`;
  },
  buildWorld(E) {
    const { scene, asm } = E;
    const root = new THREE.Group();
    scene.add(root);
    studioGrid(root, { x0: -4, x1: 48 });
    const labels = [];
    const label = (cls, html, at, opts = {}) => labels.push({ cls, html, at, ...opts });

    // Station 0 (x = 0): 3D Mitochondrion Cutaway
    const outAsm = asm('mito_outer', root, { title: 'Outer mitochondrial membrane', sub: 'Intermembrane H⁺ reservoir' });
    outAsm.position.set(0, 1.35, 0);
    part(outAsm, capsule(0.78, 1.4, 14, 24), { pal: 'ochre', tone: 'mid', rot: [0, 0, Math.PI / 2], mat: shadeMat('ochre', { opacity: 0.36 }), ex: [0, -0.45, 0], name: 'Outer membrane' });

    const crisAsm = asm('mito_cristae', root, { title: 'Inner cristae folds', sub: 'High-area chemiosmotic surface' });
    crisAsm.position.set(0, 1.35, 0);
    for (let i = -2; i <= 2; i++) {
      part(crisAsm, box(0.11, 0.85, 0.8, 0.02), { pal: 'red', tone: 'hi', pos: [i * 0.32, 0, 0], ex: [0, 0.45, 0], name: 'Inner crista fold' });
    }

    const krebsAsm = asm('krebs_ring', root, { title: 'Matrix Krebs cycle', sub: 'Citric acid NADH/FADH₂ loader' });
    krebsAsm.position.set(0, 1.35, 0.45);
    const krebsWheel = part(krebsAsm, new THREE.TorusGeometry(0.32, 0.055, 12, 24), { pal: 'blue', tone: 'lit', ex: [0, 0, 0.55], name: 'Krebs cycle ring' });
    label('board', 'Cristae folds', () => V(0, 2.35, 0));
    label('board', 'Krebs cycle', () => V(0, 0.55, 0.75));

    // Station 1 (x = 14): ETC Complexes I-IV + Rotary F0F1 ATP Synthase
    const etcAsm = asm('etc_complexes', root, { title: 'Electron Transport Chain (I–IV)', sub: 'NADH → O₂ proton pumps' });
    etcAsm.position.set(12.9, 1.25, 0);
    buildBilayer(etcAsm, { cols: 6, rows: 3, x0: 0, y0: -0.2, z0: 0 });
    for (let i = 0; i < 4; i++) {
      part(etcAsm, capsule(0.15, 0.45 + i * 0.05, 8, 14), { pal: i % 2 === 0 ? 'blue' : 'green', tone: 'hi', pos: [-0.65 + i * 0.44, -0.15, 0], ex: [0, 0.4, 0], name: `Complex ${['I', 'II', 'III', 'IV'][i]}` });
    }
    const protonCloud = prims.particles(etcAsm, { count: 24, r: 0.045, pal: 'red' });

    const turbAsm = asm('f0f1_turbine', root, { title: 'Rotary F₀F₁ ATP Synthase', sub: 'Proton-motive molecular rotor' });
    const synth = buildAtpSynthase(turbAsm, { x0: 15.1, y0: 1.35, z0: 0, scale: 1.05 });
    label('board', 'Complexes I–IV & H⁺', () => V(12.9, 2.35, 0));
    label('board', 'F₀F₁ rotor', () => V(15.1, 2.5, 0));

    // Station 2 (x = 28): Respirometer + 32 vs 2 ATP Yield Bars
    const respAsm = asm('respirometer_chamber', root, { title: 'KOH Respirometer & manometer', sub: 'Measures O₂ uptake directly' });
    respAsm.position.set(27.0, 0.2, 0);
    part(respAsm, cyl(0.62, 1.5, 24), { pal: 'paper', tone: 'mid', pos: [0, 0.8, 0], mat: shadeMat('paper', { opacity: 0.4 }), name: 'Sealed glass chamber' });
    part(respAsm, cyl(0.52, 0.22, 20), { pal: 'blue', tone: 'hi', pos: [0, 0.2, 0], ex: [0, -0.25, 0], name: 'KOH CO₂-absorber base' });
    part(respAsm, box(0.75, 0.25, 0.45, 0.04), { pal: 'ochre', tone: 'hi', pos: [0, 0.65, 0], ex: [0, 0.35, 0], name: 'Respiring seeds on gauze' });

    const barAsm = asm('atp_yield_bars', root, { title: '32 vs 2 ATP yield columns', sub: '16× aerobic multiplier' });
    barAsm.position.set(29.0, 0.1, 0);
    const aeroBar = part(barAsm, box(0.55, 2.1, 0.55, 0.04), { pal: 'green', tone: 'lit', pos: [-0.42, 1.05, 0], ex: [-0.3, 0.3, 0], name: 'Aerobic yield (~32 ATP)' });
    part(barAsm, box(0.55, 0.18, 0.55, 0.03), { pal: 'red', tone: 'hi', pos: [0.42, 0.09, 0], ex: [0.3, 0.2, 0], name: 'Anaerobic yield (2 ATP)' });
    label('board', 'KOH Respirometer', () => V(27.0, 2.15, 0));
    label('board', '32 vs 2 ATP', () => V(29.0, 2.4, 0));

    // Station 3 (x = 42): Fermentation & Flooded Rice Root Aerenchyma
    const yeastAsm = asm('yeast_fermenter', root, { title: 'Yeast & muscle fermentation', sub: 'Anaerobic NAD⁺ regeneration' });
    yeastAsm.position.set(40.9, 0.2, 0);
    part(yeastAsm, cyl(0.58, 1.45, 22), { pal: 'ochre', tone: 'mid', pos: [0, 0.75, 0], ex: [-0.35, 0.25, 0], name: 'Anaerobic yeast vessel' });

    const aerAsm = asm('aerenchyma_root', root, { title: 'Rice root aerenchyma pipes', sub: 'Longitudinal O₂ channels in flooded mud' });
    aerAsm.position.set(42.9, 1.15, 0);
    part(aerAsm, cyl(0.75, 1.8, 24), { pal: 'green', tone: 'mid', mat: shadeMat('green', { opacity: 0.42 }), ex: [0, 0.35, 0], name: 'Root cortex cylinder' });
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      part(aerAsm, cyl(0.14, 1.85, 14), { pal: 'blue', tone: 'lit', pos: [0.42 * Math.cos(a), 0, 0.42 * Math.sin(a)], ex: [0.3 * Math.cos(a), 0.3, 0.3 * Math.sin(a)], name: 'Aerenchyma air channel' });
    }
    label('board', 'Anaerobic vessel', () => V(40.9, 2.05, 0));
    label('board', 'Root aerenchyma', () => V(42.9, 2.3, 0));

    return {
      labels,
      update(s) {
        const rate = s.o2Supply / 100;
        krebsWheel.rotation.z = s.t * 2.2 * rate;
        synth.rotor.rotation.y = s.t * (0.5 + rate * 6.0);

        // Proton cloud density in intermembrane space
        const pPts = [];
        for (let i = 0; i < 24; i++) {
          const u = ((i / 24) + s.t * 0.3 * rate) % 1;
          pPts.push([-0.7 + (i % 6) * 0.28, 0.25 + u * 0.75 * Math.max(0.2, rate), -0.25 + (i % 3) * 0.25]);
        }
        protonCloud.set(pPts);

        // Scale aerobic bar height with current ATP yield
        const h = Math.max(0.18, (s.rel.totalAtpPerGlucose / 32) * 2.1);
        aeroBar.scale.y = h / 2.1;
        aeroBar.position.y = h / 2;
      },
    };
  },
};
