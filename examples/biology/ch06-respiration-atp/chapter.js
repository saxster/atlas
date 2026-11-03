import { SUBJECT } from '../subject.js';
import {
  THREE, part, box, cyl, sphere, capsule, shadeMat,
  prims, buildBilayer, buildAtpSynthase, studioGrid, playTone, V
} from '@saxster/atlas/bio_kit.js';
import * as M from './model.js';

export const PAGES = [
  {
    tab: 'Mitochondrion 3D',
    fig: 'Figure 6.1–6.2 · 3D Mitochondrion cutaway: outer membrane, cristae & matrix Krebs ring',
    title: 'Mitochondrial Cristae Architecture',
    alt: '3D cutaway of a mitochondrion showing outer membrane, intermembrane proton space, folded inner cristae, and matrix Krebs cycle.',
    cam: { target: [0, 1.35, 0], az: 24, el: 22, dist: 10.8 },
    lit: 'mito_cristae',
    parts: ['mito_outer', 'mito_cristae', 'krebs_ring'],
    look: { xray: 0.25, section: 0 },
  },
  {
    tab: 'ETC & F₀F₁ rotor',
    fig: 'Figure 6.3 · Inner crista membrane Electron Transport Chain & rotary F₀F₁ ATP synthase',
    title: 'Chemiosmosis & Rotary ATP Synthase',
    alt: '3D inner mitochondrial membrane with electron transport complexes I-IV pumping protons to drive the spinning F0F1 ATP synthase turbine.',
    cam: { target: [14, 1.35, 0], az: -22, el: 20, dist: 11.1 },
    lit: 'f0f1_turbine',
    parts: ['etc_complexes', 'f0f1_turbine'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Respirometer ledger',
    fig: 'Figure 6.4 · Respirometer chamber, CO₂ absorber and gas-exchange inference',
    title: 'Oxidation Ledger & Respirometer',
    alt: '3D respirometer chamber with germinating seeds over soda-lime KOH absorber and chamber alongside glycolysis and membrane-relay pathway markers (heights do not encode yields).',
    cam: { target: [28, 1.35, 0], az: 20, el: 20, dist: 11.1 },
    lit: 'respirometer_chamber',
    parts: ['respirometer_chamber', 'atp_yield_bars'],
    look: { xray: 0.2, section: 0 },
  },
  {
    tab: 'Fermentation & roots',
    fig: 'Figure 6.5–6.6 · Lactate carrier recycling, yeast ethanol fermentation & root aerenchyma',
    title: 'Anaerobic Fermentation & Root Aerenchyma',
    alt: '3D comparison of muscle lactate fermentation, yeast ethanol/CO2 airlock bubbler, and rice root aerenchyma oxygen channels.',
    cam: { target: [42, 1.35, 0], az: 26, el: 20, dist: 11.1 },
    lit: 'aerenchyma_root',
    parts: ['yeast_fermenter', 'aerenchyma_root'],
    look: { xray: 0.15, section: 0 },
  },
];

export const PLATES = {
  mito_outer: {
    text: 'Outer mitochondrial membrane surrounds the intermembrane space. Proton pumping across the inner membrane establishes both concentration and electrical differences; no fixed pH difference is assigned here.',
  },
  mito_cristae: {
    text: 'Deeply invaginated inner cristae membrane: restricts free proton passage; controlled return through ATP synthase couples the gradient to ATP synthesis.',
  },
  krebs_ring: {
    text: 'Matrix citric acid (Krebs) cycle: oxidises acetyl-CoA to CO₂ while loading NADH and FADH₂ electron carriers for the inner membrane.',
  },
  etc_complexes: {
    text: 'Electron Transport Chain (Complexes I–IV): favourable electron transfers eventually reach oxygen (½ O₂ + 2 H⁺ + 2 e⁻ → H₂O). Some complexes couple transfers to outward proton pumping; not every complex pumps protons.',
    facts: s => [['Oxygen route',s.rel.chainActive?'Available':'Unavailable'],['Speed','Schematic, not measured']],
  },
  f0f1_turbine: {
    text: 'Peter Mitchell’s chemiosmotic payoff & Paul Boyer’s rotary binding-change turbine: H⁺ return spins the F₀ ring and γ-stalk at a schematic animation rate, with no fixed ATP yield or measured rotation speed assigned.',
    facts: s => [['Relay',s.rel.chainActive?'Available':'Stalled'],['ATP yield','Not calculated']],
  },
  respirometer_chamber: {
    text: 'Sealed respirometer with a laboratory CO₂ absorber that absorb evolved CO₂, so a controlled change in gas volume can support an oxygen-uptake measurement after accounting for temperature, pressure, leaks and apparatus calibration; historical laboratory apparatus, not a home activity.',
  },
  atp_yield_bars: {
    text: 'Two pathway markers: glycolysis supplies two net ATP per glucose in the taught route; the membrane relay can supply additional ATP. Marker height is not an ATP count and no universal ratio is assigned.',
  },
  yeast_fermenter: {
    text: 'Anaerobic regeneration of NAD⁺: yeast decarboxylates pyruvate to acetaldehyde + CO₂ and reduces it to ethanol; muscle reduces pyruvate to lactate, restoring NAD⁺. Lactate can form with oxygen present and can be reused as fuel; it does not explain all recovery oxygen use.',
  },
  aerenchyma_root: {
    text: 'Flooded paddy-field adaptation: rice roots form continuous longitudinal air-filled aerenchyma tubes that improve oxygen delivery to submerged tissues. Cellular respiration then supports ATP-dependent transport; the channels do not deliver finished ATP.',
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
    { id: 'o2Supply', label: 'Illustrated oxygen route (0 absent, 100 available)', min: 0, max: 100, step: 100, value: 100, unit: '%' },
    { id: 'demandLevel', label: 'Animation activity (not measured metabolism)', min: 20, max: 100, step: 5, value: 60, unit: '%' },
  ],
  lessons: {
    'ch06-glycolysis-3d': { page: 0, params: { o2Supply: 100 } },
    'ch06-synthase-3d': { page: 1, params: { o2Supply: 100 } },
    'ch06-mitochondrion-3d-mass': { page: 2, params: { o2Supply: 100 } },
    'ch06-fermentation-3d': { page: 3, params: { o2Supply: 0 } },
    'ch06-routes-3d': { page: 0, params: { o2Supply: 100 } },
    'ch06-mitochondrion-3d': { page: 0, params: { o2Supply: 100, demandLevel: 75 } },
    'ch06-etc-synthase-3d': { page: 1, params: { o2Supply: 100, demandLevel: 80 } },
    'ch06-respirometer-3d': { page: 2, params: { o2Supply: 100 } },
    'ch06-fermentation-roots-3d': { page: 3, params: { o2Supply: 0, demandLevel: 85 } },
  },
  sonify(ctx, s, page) {
    playTone(ctx, { freq: 95 + s.rel.animationRate * 180, dur: 0.07, type: 'sawtooth', gain: 0.028 });
  },
  state(clock, reduced) {
    const p = CHAPTER.params || CHAPTER.defaultParams;
    const t = reduced ? 1.5 : clock;
    const rel = M.aerobicRelayAccount(p.o2Supply, p.demandLevel);
    return { t, rel, o2Supply: p.o2Supply, demandLevel: p.demandLevel };
  },
  readout(s, page, pageIdx) {
    const scope='Manual schematic: no measured rotation speed, oxygen-dose curve or total ATP yield. Activity changes animation only.';
    if(pageIdx===0)return `<b>Mitochondrial compartments</b> · ${s.rel.status}. Carbon processing in the matrix and electron transfer at the inner membrane follow separate routes. ${scope}`;
    if(pageIdx===1)return `<b>Membrane energy relay</b> · ${s.rel.status}. Electron transfer supports H⁺ export; controlled return drives rotor/shaft motion and catalytic shape changes. ${scope}`;
    if(pageIdx===2)return `<b>Gas measurements and cellular pathways</b> · A controlled respirometer can infer O₂ uptake when CO₂ is absorbed. Glycolysis supplies 2 net ATP in the taught route; additional membrane-linked ATP has no fixed yield here. ${scope}`;
    return `<b>Carrier recycling and root gas routes</b> · ${s.rel.status}. Yeast can form ethanol and CO₂; muscle lactate formation restores NAD⁺ without releasing CO₂ in that route. Lactate can form with oxygen present and be reused. Rice gas spaces improve delivery; no survival time is predicted. ${scope}`;
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
    const protonCloud = prims.particles(etcAsm, 24, { radius: 0.045, color: 'red' });

    const turbAsm = asm('f0f1_turbine', root, { title: 'Rotary F₀F₁ ATP Synthase', sub: 'Proton-motive molecular rotor' });
    const synth = buildAtpSynthase(turbAsm, { x0: 15.1, y0: 1.35, z0: 0, scale: 1.05 });
    label('board', 'Complexes I–IV & H⁺', () => V(12.9, 2.35, 0));
    label('board', 'F₀F₁ rotor', () => V(15.1, 2.5, 0));

    // Station 2 (x = 28): Respirometer and qualitative ATP-pathway markers
    const respAsm = asm('respirometer_chamber', root, { title: 'Respirometer chamber', sub: 'Controlled gas-volume inference' });
    respAsm.position.set(27.0, 0.2, 0);
    part(respAsm, cyl(0.62, 1.5, 24), { pal: 'paper', tone: 'mid', pos: [0, 0.8, 0], mat: shadeMat('paper', { opacity: 0.4 }), name: 'Sealed glass chamber' });
    part(respAsm, cyl(0.52, 0.22, 20), { pal: 'blue', tone: 'hi', pos: [0, 0.2, 0], ex: [0, -0.25, 0], name: 'KOH CO₂-absorber base' });
    part(respAsm, box(0.75, 0.25, 0.45, 0.04), { pal: 'ochre', tone: 'hi', pos: [0, 0.65, 0], ex: [0, 0.35, 0], name: 'Respiring seeds on gauze' });

    const barAsm = asm('atp_yield_bars', root, { title: 'Two ATP-supporting pathways', sub: 'Marker height does not encode ATP yield' });
    barAsm.position.set(29.0, 0.1, 0);
    const aeroBar = part(barAsm, box(0.55, 0.8, 0.55, 0.04), { pal: 'green', tone: 'lit', pos: [-0.42, 0.4, 0], ex: [-0.3, 0.3, 0], name: 'Membrane-linked ATP pathway' });
    part(barAsm, box(0.55, 0.8, 0.55, 0.03), { pal: 'red', tone: 'hi', pos: [0.42, 0.4, 0], ex: [0.3, 0.2, 0], name: 'Glycolysis: two net ATP' });
    label('board', 'KOH Respirometer', () => V(27.0, 2.15, 0));
    label('board', 'Two ATP pathways', () => V(29.0, 2.4, 0));

    // Station 3 (x = 42): Fermentation & Flooded Rice Root Aerenchyma
    const yeastAsm = asm('yeast_fermenter', root, { title: 'Yeast & muscle fermentation', sub: 'Carrier recycling; distinct products' });
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
        const rate = s.rel.animationRate;
        krebsWheel.rotation.z = s.t * 2.2 * rate;
        synth.rotor.rotation.y = s.t * (rate * 6.0);

        // Proton cloud density in intermembrane space
        const pPts = [];
        for (let i = 0; i < 24; i++) {
          const u = ((i / 24) + s.t * 0.3 * rate) % 1;
          pPts.push([-0.7 + (i % 6) * 0.28, 0.25 + u * 0.75 * Math.max(0.2, rate), -0.25 + (i % 3) * 0.25]);
        }
        pPts.forEach((xyz, i) => protonCloud.set(i, xyz));

        // Availability marker, not a quantitative ATP-yield bar.
        aeroBar.visible = s.rel.chainActive;
      },
    };
  },
};
