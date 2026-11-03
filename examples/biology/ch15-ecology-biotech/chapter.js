import { SUBJECT } from '../subject.js';
import {
  THREE, part, box, cyl, sphere, capsule, torus, gear, shadeMat,
  prims, studioGrid, playTone, V
} from '@saxster/atlas/bio_kit.js';
import * as M from './model.js';

const energyText = kJ => kJ.toLocaleString('en-GB', { maximumFractionDigits: 2 });

export const PAGES = [
  {
    tab: 'Energy Pyramid & LV',
    fig: 'Figure 15.1–15.2 · Lindeman’s 3D production-energy pyramid with chosen transfer efficiency & Lotka–Volterra invariant surface',
    title: 'Energy Transfer & a Predator–Prey Surface',
    alt: 'A 3D energy pyramid whose horizontal block areas follow the selected energy proportions, alongside a Lotka–Volterra function surface sampled by a chosen path.',
    cam: { target: [0, 1.35, 0], az: 26, el: 22, dist: 7.6 },
    lit: 'trophic_pyramid',
    parts: ['trophic_pyramid', 'lv_bowl'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Nitrogen & eutrophication',
    fig: 'Figure 15.3–15.6 · 3D Legume Rhizobium root nodule & lake eutrophication O₂ crash',
    title: 'Nutrient Cycles, Root Nodules & Eutrophication',
    alt: '3D legume root nodule containing nitrogen-fixing Rhizobium bacteroids alongside a lake column experiencing algal bloom and bottom hypoxia.',
    cam: { target: [14, 1.35, 0], az: -22, el: 20, dist: 7.4 },
    lit: 'root_nodule',
    parts: ['root_nodule', 'lake_column'],
    look: { xray: 0.25, section: 0 },
  },
  {
    tab: '3D Industrial fermenter',
    fig: 'Figure 15.7 · 3D Jacketed stainless-steel bioreactor: Rushton impellers, sparger & cooling jacket',
    title: 'Industrial Fermenter Engineering',
    alt: '3D cutaway of an industrial stirred-tank bioreactor showing cooling water jacket, sterile air sparger ring, spinning impeller paddles, and pH/T probes.',
    cam: { target: [28, 1.35, 0], az: 20, el: 20, dist: 7.2 },
    lit: 'impeller_shaft',
    parts: ['cooling_jacket', 'impeller_shaft', 'air_sparger'],
    look: { xray: 0.28, section: 0 },
  },
  {
    tab: 'Plasmid & CRISPR-Cas9',
    fig: 'Figure 15.8–15.9 · Boyer’s recombinant human insulin plasmid ring & Doudna’s CRISPR-Cas9',
    title: 'Recombinant Plasmids & CRISPR-Cas9 Scissors',
    alt: '3D bacterial plasmid vector spliced with the human insulin gene via sticky ends alongside a 3D Cas9 endonuclease guided by sgRNA.',
    cam: { target: [42, 1.35, 0], az: 24, el: 20, dist: 7.4 },
    lit: 'recombinant_plasmid',
    parts: ['recombinant_plasmid', 'crispr_cas9'],
    look: { xray: 0, section: 0 },
  },
];

export const PLATES = {
  trophic_pyramid: {
    text: 'Illustrative production budget: the chosen transfer fraction is an assumption, not a universal law. All levels use the same chosen area and time interval. Horizontal block areas show relative energy; block heights are fixed for display. Energy outside the next consumer level includes respiratory heat and chemical energy in waste and detritus; chain length also depends on area and consumer requirements.',
    facts: s => [['Transfer', `${s.trophicEtaPct}%`], ['Producers', `${energyText(s.pyr.producerKj)} kJ`], ['Herbivores', `${energyText(s.pyr.herbivoreKj)} kJ`], ['Primary carnivores', `${energyText(s.pyr.primaryCarnKj)} kJ`], ['Apex', `${energyText(s.pyr.apexCarnKj)} kJ`]],
  },
  lv_bowl: {
    text: 'Lotka–Volterra conserved phase surface V(R, F) = δR − γ ln R + βF − α ln F: V stays constant along solutions of the idealised two-population equations. Here the moving point scans chosen example states to reveal the surface; it is not a solved population trajectory.',
  },
  root_nodule: {
    text: 'Beijerinck’s symbiotic *Rhizobium* bacteroids inside legume root nodules: pink leghaemoglobin buffers free O₂ so nitrogenase can reduce atmospheric N≡N into NH₃ for plant amino acids.',
  },
  lake_column: {
    text: 'Eutrophication cascade: nitrate/phosphate fertiliser runoff triggers a surface algal bloom that blocks sunlight to submerged plants; aerobic bacteria decomposing dead algae strip dissolved O₂, suffocating fish.',
  },
  cooling_jacket: {
    text: 'Thermostatted water-cooling jacket & pH/O₂ sensors: removes metabolic heat released by billions of respiring bacteria/fungi so the model E. coli culture stays near its assumed 37 °C optimum; other organisms and processes need different conditions, including waste control.',
    facts: s => [['T_ferm', `${s.ferm.tempC} °C`], ['Insulin yield', `${s.ferm.insulinYieldMgL.toFixed(0)} mg/L`]],
  },
  impeller_shaft: {
    text: 'Motor-driven Rushton turbine paddles: keep microorganisms, dissolved O₂, and glucose/mineral nutrients mixed; stirring must be managed because excessive shear can damage some cultures.',
  },
  air_sparger: {
    text: 'Microporous sterile ring sparger: bubbles filtered air (O₂) through the culture broth to sustain high-yield aerobic ATP production.',
  },
  recombinant_plasmid: {
    text: 'Building on Boyer and Cohen’s plasmid methods: prepare intron-free insulin coding DNA with bacterial controls, obtain compatible ends and seal with DNA ligase. Recover, process, fold and purify the expressed product; mature insulin has two chains.',
  },
  crispr_cas9: {
    text: 'Jennifer Doudna & Emmanuelle Charpentier’s programmable CRISPR-Cas9: the 20-nt target-matching region of a longer guide RNA directs the Cas9 endonuclease to a matching DNA target next to a 5′-NGG-3′ PAM motif.',
  },
};

export const CHAPTER = {
  subject: SUBJECT,
  no: 15,
  PAGES,
  PLATES,
  clock0: 0,
  cuts: true,
  xrayKeys: ['lake_column', 'cooling_jacket'],
  cutKeys: ['cooling_jacket'],
  cutPlane: [0, 0, -1, 0.05],
  defaultParams: { trophicEtaPct: 10, fermTempC: 37, runoffLoad: 30 },
  controls: [
    { id: 'trophicEtaPct', label: 'Trophic transfer efficiency η', min: 5, max: 20, step: 1, value: 10, unit: '%' },
    { id: 'fermTempC', label: 'Fermenter jacket temperature', min: 20, max: 60, step: 2, value: 37, unit: '°C' },
    { id: 'runoffLoad', label: 'Nitrate fertiliser runoff load', min: 0, max: 100, step: 10, value: 30, unit: '%' },
  ],
  lessons: {
    'ch15-trophic-3d': { page: 0 },
    'ch15-trophic-3d-budget': { page: 0 },
    'ch15-carbon-3d': { page: 1 },
    'ch15-carbon-3d-nitrogen': { page: 1 },
    'ch15-eutrophication-3d': { page: 1 },
    'ch15-carbon-3d-forest': { page: 1 },
    'ch15-plasmid-crispr-3d-fermenter': { page: 2 },
    'ch15-eutrophication-3d-creek': { page: 1 },
    'ch15-pyramid-lv-3d': { page: 0, params: { trophicEtaPct: 10 } },
    'ch15-nodule-eutrophication-3d': { page: 1, params: { runoffLoad: 85 } },
    'ch15-fermenter-3d': { page: 2, params: { fermTempC: 37 } },
    'ch15-plasmid-crispr-3d': { page: 3 },
  },
  sonify(ctx, s, page) {
    playTone(ctx, { freq: 140 + s.ferm.insulinYieldMgL * 0.65, dur: 0.06, type: 'sawtooth', gain: 0.028 });
  },
  state(clock, reduced) {
    const p = CHAPTER.params || CHAPTER.defaultParams;
    const t = reduced ? 1.5 : clock;
    const pyr = M.trophicPyramidAccount(10000, p.trophicEtaPct);
    const ferm = M.fermenterBiotechAccount(p.fermTempC, 90);
    return { t, pyr, ferm, trophicEtaPct: p.trophicEtaPct, fermTempC: p.fermTempC, runoffLoad: p.runoffLoad };
  },
  readout(s, page, pageIdx) {
    if (pageIdx === 0) {
      return `<b>Trophic transfer η = ${s.trophicEtaPct}%</b> · Producers: 10,000 kJ → Herbivores: <b>${energyText(s.pyr.herbivoreKj)} kJ</b> → Primary carnivores: <b>${energyText(s.pyr.primaryCarnKj)} kJ</b> → Apex: <b>${energyText(s.pyr.apexCarnKj)} kJ</b>. Horizontal block areas show the energy ratios; heights are fixed for display.`;
    }
    if (pageIdx === 1) {
      const eutro = s.runoffLoad > 60 ? 'Illustrative high-runoff state: bloom and low-oxygen risk' : 'Illustrative lower-runoff state; oxygen also depends on mixing and respiration';
      return `<b>Rhizobium N₂ Fixation & Lake Column (Runoff = ${s.runoffLoad}%)</b> · ${eutro}.`;
    }
    if (pageIdx === 2) {
      return `<b>Jacketed Fermenter T = ${s.fermTempC} °C</b> · Active enzyme fraction = ${(s.ferm.tFactor * 100).toFixed(0)}% · Illustrative processed insulin yield = <b>${s.ferm.insulinYieldMgL.toFixed(0)} mg/L</b>.`;
    }
    return `<b>Recombinant Insulin Plasmid & CRISPR-Cas9</b> · Restriction enzyme cuts sticky ends · DNA ligase seals human insulin insert · guide RNA directs Cas9 near a suitable PAM; cell repair makes the edit.`;
  },
  buildWorld(E) {
    const { scene, asm } = E;
    const root = new THREE.Group();
    scene.add(root);
    studioGrid(root, { x0: -4, x1: 48 });
    const labels = [];
    const label = (cls, html, at, opts = {}) => labels.push({ cls, html, at, ...opts });

    // Station 0 (x = 0): 3D Stepped Trophic Energy Pyramid + Lotka-Volterra Conserved Surface
    const pyrAsm = asm('trophic_pyramid', root, { title: 'Lindeman 3D Trophic Energy Pyramid', sub: 'Chosen transfer fraction; energy outside the next level includes heat and detritus' });
    pyrAsm.position.set(-1.1, 0.1, 0);
    const tier1 = part(pyrAsm, box(1.55, 0.42, 1.55, 0.04), { pal: 'green', tone: 'lit', pos: [0, 0.21, 0], ex: [0, -0.2, 0], name: 'T1 Producers (10,000 kJ)' });
    const tier2 = part(pyrAsm, box(1.55, 0.42, 1.55, 0.04), { pal: 'ochre', tone: 'hi', pos: [0, 0.65, 0], ex: [0, 0.15, 0], name: 'T2 Herbivores (1,000 kJ)' });
    const tier3 = part(pyrAsm, box(1.55, 0.42, 1.55, 0.04), { pal: 'blue', tone: 'hi', pos: [0, 1.09, 0], ex: [0, 0.45, 0], name: 'T3 Carnivores (100 kJ)' });
    const tier4 = part(pyrAsm, box(1.55, 0.42, 1.55, 0.04), { pal: 'red', tone: 'lit', pos: [0, 1.53, 0], ex: [0, 0.75, 0], name: 'T4 Apex predator (10 kJ)' });

    const lvAsm = asm('lv_bowl', root, { title: 'Lotka–Volterra phase bowl V(R, F)', sub: 'Chosen scan of example population states' });
    lvAsm.position.set(0.5, 0.25, -0.5);
    const axL = prims.axes(lvAsm, { x: [0.25, 2.4], y: [0.25, 2.4], z: [1.8, 3.4], size: [1.9, 1.6, 1.5] });
    prims.surface(lvAsm, (R, F) => Math.min(3.3, M.lotkaVolterraInvariant(R, F)), { axes: axL, n: 22, pal: 'blue' });
    const lvDot = part(lvAsm, sphere(0.085, 16), { pal: 'red', tone: 'lit', name: '(Prey R, Predator F) state' });
    let energyCaption = 'Energy tiers · η = 10%';
    label('board', 'Energy tiers', () => V(-1.1, 2.15, 0), { text: () => energyCaption });
    label('board', 'V(R, F) example states', () => V(1.45, 2.05, -0.5));

    // Station 1 (x = 14): 3D Root Nodule + Eutrophication Lake Column
    const nodAsm = asm('root_nodule', root, { title: 'Legume Rhizobium root nodule', sub: 'Leghaemoglobin O₂ buffer & nitrogenase' });
    nodAsm.position.set(13.0, 1.25, 0);
    part(nodAsm, cyl(0.18, 1.75, 16), { pal: 'ochre', tone: 'mid', ex: [-0.35, 0, 0], name: 'Legume taproot' });
    part(nodAsm, sphere(0.45, 22), { pal: 'red', tone: 'lit', pos: [0.28, 0, 0], ex: [0.45, 0.25, 0], name: 'Pink leghaemoglobin root nodule' });

    const lakeAsm = asm('lake_column', root, { title: 'Lake column & algal bloom scum', sub: 'Fertiliser runoff → hypoxia crash' });
    lakeAsm.position.set(15.0, 0.2, 0);
    part(lakeAsm, cyl(0.68, 1.75, 24), { pal: 'blue', tone: 'mid', pos: [0, 0.88, 0], mat: shadeMat('blue', { opacity: 0.38 }), name: 'Water column' });
    const bloomMat = part(lakeAsm, cyl(0.67, 0.18, 24), { pal: 'green', tone: 'lit', pos: [0, 1.68, 0], ex: [0, 0.45, 0], name: 'Eutrophic algal bloom layer' });
    label('board', 'Rhizobium nodule', () => V(13.0, 2.35, 0));
    label('board', 'Eutrophication column', () => V(15.0, 2.25, 0));

    // Station 2 (x = 28): 3D Jacketed Industrial Fermenter Cutaway
    const jackAsm = asm('cooling_jacket', root, { title: 'Stainless vessel & water cooling jacket', sub: 'Maintains 37 °C enzyme optimum' });
    jackAsm.position.set(28.0, 1.25, 0);
    part(jackAsm, cyl(0.88, 1.85, 28), { pal: 'blue', tone: 'mid', mat: shadeMat('blue', { opacity: 0.36 }), ex: [0, -0.45, 0], name: 'Outer cooling water jacket' });
    part(jackAsm, cyl(0.74, 1.7, 26), { pal: 'paper', tone: 'mid', mat: shadeMat('paper', { opacity: 0.42 }), ex: [0, 0.35, 0], name: 'Sterile steel culture vessel' });

    const impAsm = asm('impeller_shaft', root, { title: 'Central shaft & Rushton impellers', sub: 'Uniform O₂ & nutrient mixing' });
    impAsm.position.set(28.0, 1.25, 0);
    const impGroup = new THREE.Group();
    impAsm.add(impGroup);
    part(impGroup, cyl(0.06, 1.85, 14), { pal: 'ink', tone: 'hi', ex: [0, 0.55, 0], name: 'Drive shaft' });
    gear(impGroup, { teeth: 8, r: 0.46, width: 0.12, pal: 'ochre', tone: 'lit', pos: [0, -0.25, 0], rot: [Math.PI / 2, 0, 0], ex: [0, -0.25, 0], name: 'Lower Rushton impeller' });
    gear(impGroup, { teeth: 8, r: 0.46, width: 0.12, pal: 'ochre', tone: 'lit', pos: [0, 0.32, 0], rot: [Math.PI / 2, 0, 0], ex: [0, 0.32, 0], name: 'Upper Rushton impeller' });

    const spargAsm = asm('air_sparger', root, { title: 'Sterile O₂ ring sparger', sub: 'Aerobic bubble diffuser' });
    spargAsm.position.set(28.0, 0.55, 0);
    part(spargAsm, torus(0.42, 0.055, 10, 24), { pal: 'green', tone: 'lit', rot: [Math.PI / 2, 0, 0], ex: [0, -0.45, 0], name: 'Sterile air sparger ring' });
    label('board', 'Jacketed fermenter', () => V(28.0, 2.45, 0));

    // Station 3 (x = 42): 3D Recombinant Plasmid Ring + CRISPR-Cas9
    const plasAsm = asm('recombinant_plasmid', root, { title: 'Recombinant plasmid vector + insulin cDNA', sub: 'EcoRI sticky ends sealed by DNA ligase' });
    plasAsm.position.set(41.0, 1.35, 0);
    part(plasAsm, torus(0.68, 0.085, 14, 32, Math.PI * 1.55), { pal: 'blue', tone: 'hi', rot: [0, 0, 0.4], ex: [-0.35, 0, 0], name: 'Bacterial plasmid vector' });
    part(plasAsm, torus(0.68, 0.105, 14, 20, Math.PI * 0.45), { pal: 'red', tone: 'lit', rot: [0, 0, 0.4 + Math.PI * 1.55], ex: [0.45, 0.35, 0], name: 'Spliced human insulin gene insert' });

    const casAsm = asm('crispr_cas9', root, { title: 'CRISPR-Cas9 & guide RNA (sgRNA)', sub: 'Programmable PAM-targeted DNA cleavage' });
    casAsm.position.set(43.0, 1.35, 0);
    prims.blob(casAsm, { r: 0.72, rings: 24, segs: 36, seed: 53, pal: 'green', cleft: 0.52, name: 'Cas9 endonuclease protein' });
    part(casAsm, cyl(0.06, 1.35, 14), { pal: 'ochre', tone: 'lit', rot: [0, 0, 0.45], ex: [0.4, 0.3, 0], name: 'Target DNA + 20-nt sgRNA' });
    label('board', 'Recombinant plasmid', () => V(41.0, 2.35, 0));
    label('board', 'CRISPR-Cas9 + sgRNA', () => V(43.0, 2.35, 0));

    return {
      labels,
      update(s) {
        // Equal base geometries and square-root side scaling make horizontal
        // block area proportional to the model energy at every chosen efficiency.
        const energies = [s.pyr.producerKj, s.pyr.herbivoreKj, s.pyr.primaryCarnKj, s.pyr.apexCarnKj];
        [tier1, tier2, tier3, tier4].forEach((tier, i) => {
          const sideScale = Math.sqrt(energies[i] / energies[0]);
          tier.scale.set(sideScale, 1, sideScale);
          tier.userData.part = ['T1 Producers', 'T2 Herbivores', 'T3 Primary carnivores', 'T4 Apex consumers'][i] + ` (${energyText(energies[i])} kJ)`;
        });
        energyCaption = `Energy tiers · η = ${s.trophicEtaPct}%`;
        pyrAsm.userData.sub = `Chosen transfer η = ${s.trophicEtaPct}%; equal display heights`;

        // A chosen scan of example states on the Lotka–Volterra surface.
        const ang = s.t * 1.2;
        const r = 1.0 + 0.42 * Math.cos(ang);
        const f = 1.0 + 0.42 * Math.sin(ang);
        lvDot.position.copy(axL.to(r, f, M.lotkaVolterraInvariant(r, f) + 0.06));

        // Algal bloom thickness scales with runoffLoad
        bloomMat.scale.y = 0.25 + (s.runoffLoad / 100) * 2.2;

        // Spin fermenter impellers
        impGroup.rotation.y = s.t * 3.8;
      },
    };
  },
};
