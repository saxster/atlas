import { SUBJECT } from '../subject.js';
import {
  THREE, part, box, cyl, sphere, cone, capsule, rod,
  prims, MOLECULES, buildAtpSynthase, studioGrid, playTone, shadeMat, V
} from '@saxster/atlas/bio_kit.js';
import * as M from './model.js';

export const PAGES = [
  {
    tab: 'Seed imbibition',
    fig: 'Figure 1.1 · Seed hydration model',
    title: 'Monsoon Seed Imbibition',
    alt: 'Schematic chickpea seed cutaway showing the coat, stored materials and a root symbol; hydration and development are chosen illustrations.',
    cam: { target: [0, 1.3, 0], az: 24, el: 20, dist: 18 },
    lit: 'radicle_embryo',
    parts: ['seed_testa', 'cotyledons', 'radicle_embryo'],
    look: { xray: 0.2, section: 0 },
  },
  {
    tab: 'Flame vs staircase',
    fig: 'Figure 1.2 · Coupled reactions',
    title: 'Flame vs Stepped Oxidation',
    alt: 'Conceptual energy diagrams for combustion and coupled metabolism; displayed steps do not count actual reactions.',
    cam: { target: [14, 1.4, 0], az: -22, el: 22, dist: 18 },
    lit: 'stepped_staircase',
    parts: ['flame_drop', 'stepped_staircase'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'ATP battery & rotor',
    fig: 'Figure 1.3 · ATP and rotary synthase',
    title: 'ATP as an Energy Carrier',
    alt: 'Incomplete ball-and-stick schematic of an ATP core alongside a rotary ATP synthase model; neither uses experimentally fitted atomic coordinates.',
    cam: { target: [28, 1.4, 0], az: 28, el: 18, dist: 18 },
    lit: 'atp_synthase',
    parts: ['atp_molecule', 'atp_synthase'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Viral borderland',
    fig: 'Figure 1.5 · A phage and its host',
    title: 'The Viral Borderland',
    alt: '3D icosahedral bacteriophage with contractile tail sheath landing on a metabolising bacterial host cell.',
    cam: { target: [42, 1.4, 0], az: 20, el: 22, dist: 18 },
    lit: 'phage_capsid',
    parts: ['phage_capsid', 'phage_tail', 'host_bacterium'],
    look: { xray: 0.15, section: 0 },
  },
];

export const PLATES = {
  seed_testa: {
    text: 'Protective seed coat (testa). Water enters permeable regions; the model uses a chosen opening threshold to reveal the root symbol, not a measured germination rule.',
  },
  cotyledons: {
    text: 'Twin embryonic seed leaves packed with starch and storage globulins that hydrate and mobilise into maltose and amino acids.',
  },
  radicle_embryo: {
    text: 'Embryonic root (radicle) and shoot (plumule). Viable seeds can resume development after hydration under suitable conditions; this model supplies no observed timetable.',
    facts: s => [['Ψ_m', `${s.imb.psiMatricMPa.toFixed(1)} MPa`], ['Added water / initial mass', `${s.imb.waterUptakePct.toFixed(0)}%`]],
  },
  flame_drop: {
    text: 'Combustion proceeds through many reactions and releases heat and light. The cliff is a conceptual comparison, not a one-step reaction mechanism.',
  },
  stepped_staircase: {
    text: 'Enzymes catalyse reactions; coupling connects fuel breakdown to ATP regeneration. The chosen standard-state free-energy budget illustrates accounting, not measured cellular efficiency or heat.',
    facts: s => [['Captured', `${s.ox.capturedKj.toFixed(0)} kJ/mol`], ['Unassigned ΔG', `${s.ox.heatKj.toFixed(0)} kJ/mol`], ['Chosen share', `${(s.ox.efficiency * 100).toFixed(1)}%`]],
  },
  atp_molecule: {
    text: 'ATP has three phosphate groups. The whole hydrolysis reaction, including water and product interactions, has a standard transformed free-energy change near −30.5 kJ/mol. Breaking a bond alone requires energy; actual cellular conditions change the reaction free energy.',
  },
  atp_synthase: {
    text: 'Rotary F₀F₁ ATP synthase nanomachine: proton flow spins the F₀ c-ring and central γ-shaft, coupling rotation to ATP synthesis from ADP and phosphate.',
  },
  phage_capsid: {
    text: 'Schematic protein capsid enclosing viral DNA. The chosen T = 7 geometry is illustrative, not a structural measurement of a named phage; outside a host the particle has no independent cellular metabolism.',
  },
  phage_tail: {
    text: 'Contractile tail sheath, baseplate, and six tail fibres that latch onto bacterial surface receptors and inject the viral genome like a spring-loaded syringe.',
  },
  host_bacterium: {
    text: 'Living bacterial host with its own ribosomes and ATP supply. Viral replication uses host resources; host ribosomes make proteins, while enzymes copy genomes. The seven life processes need not all be visible at once.',
  },
};

export const CHAPTER = {
  subject: SUBJECT,
  no: 1,
  PAGES,
  PLATES,
  clock0: 0,
  cuts: true,
  xrayKeys: ['seed_testa', 'host_bacterium'],
  cutKeys: ['seed_testa', 'cotyledons', 'host_bacterium'],
  cutPlane: [0, 0, -1, 0.05],
  defaultParams: { imbibeHours: 8, atpYield: 32, phageInject: 0 },
  controls: [
    { id: 'imbibeHours', label: 'Chosen model interval', min: 0, max: 16, step: 1, value: 8, unit: 'h' },
    { id: 'atpYield', label: 'Coupled ATP banked per glucose', min: 2, max: 36, step: 2, value: 32, unit: 'ATP' },
    { id: 'phageInject', label: 'Phage tail contraction', min: 0, max: 100, step: 5, value: 0, unit: '%' },
  ],
  lessons: {
    'ch01-seed-flame-3d': { page: 1 },
    'ch01-atp-coin-3d': { page: 2 },
    'ch01-coupled-gears-3d': { page: 2 },
    'ch01-seed-flame-3d-virus': { page: 3 },
    'ch01-imbibition-3d': { page: 0, params: { imbibeHours: 9 } },
    'ch01-staircase-3d': { page: 1, params: { atpYield: 32 } },
    'ch01-atp-cycle-3d': { page: 2, params: { atpYield: 32 } },
    'ch01-mrs-gren-3d': { page: 2, params: { phageInject: 15 } },
    'ch01-virus-border-3d': { page: 3, params: { phageInject: 85 } },
  },
  sonify(ctx, s, page) {
    if (page === 2) playTone(ctx, { freq: 110 + s.ox.nAtp * 8, dur: 0.07, type: 'sawtooth', gain: 0.025 });
    else if (page === 1) playTone(ctx, { freq: 520 - (s.t % 4) * 80, dur: 0.05, type: 'triangle', gain: 0.03 });
    else playTone(ctx, { freq: 240 + s.imb.waterUptakePct * 2, dur: 0.05, type: 'sine', gain: 0.03 });
  },
  state(clock, reduced) {
    const p = CHAPTER.params || CHAPTER.defaultParams;
    const t = reduced ? 1.5 : clock;
    const imb = M.imbibitionState(p.imbibeHours);
    const ox = M.coupledOxidationBudget(p.atpYield);
    const cap = M.capsidTriangulation(2, 1);
    return { t, imb, ox, cap, phageInject: (p.phageInject || 0) / 100 };
  },
  readout(s, page, pageIdx) {
    if (pageIdx === 0) {
      return `<b>Illustrative interval = ${s.imb.hours} model h</b> · Matric potential Ψ_m = ${s.imb.psiMatricMPa.toFixed(1)} MPa · Added water = <b>${s.imb.waterUptakePct.toFixed(0)}% of starting seed mass</b> · Testa: ${s.imb.testaRuptured ? '<b>Open in chosen scenario</b>' : 'Intact'}.`;
    }
    if (pageIdx === 1) {
      return `<b>Chosen standard-state account (2870 kJ/mol available)</b> · Banked: <b>${s.ox.nAtp} ATP (${s.ox.capturedKj.toFixed(0)} kJ/mol, ${(s.ox.efficiency * 100).toFixed(1)}%)</b> · Unassigned free-energy difference: ${s.ox.heatKj.toFixed(0)} kJ/mol. These are not measured heat or cellular-efficiency values.`;
    }
    if (pageIdx === 2) {
      return `<b>ATP/ADP Cycle & Rotary F₀F₁ Turbine</b> · Whole hydrolysis reaction: standard transformed ΔG ≈ −30.5 kJ/mol; conditions matter · 3 ATP synthesized per 360° γ-shaft revolution.`;
    }
    return `<b>Viral Borderland</b> · Icosahedral capsid T = ${s.cap.T} (${s.cap.capsomeres} capsomeres) · Tail contraction = ${(s.phageInject * 100).toFixed(0)}% · ${s.phageInject > 0.5 ? 'Viral DNA injected into host cytoplasm' : 'Adsorbed to bacterial cell wall'}.`;
  },
  buildWorld(E) {
    const { scene, asm } = E;
    const root = new THREE.Group();
    scene.add(root);
    studioGrid(root, { x0: -4, x1: 48 });
    const labels = [];
    const label = (cls, html, at, opts = {}) => labels.push({ cls, html, at, ...opts });

    // Station 0 (x = 0): Monsoon Chickpea Seed Imbibition
    const testaAsm = asm('seed_testa', root, { title: 'Seed coat (testa)', sub: 'Protective outer hull' });
    testaAsm.position.set(0, 1.25, 0);
    const testaMesh = part(testaAsm, sphere(1.05, 28), { pal: 'ochre', tone: 'mid', mat: shadeMat('ochre', { opacity: 0.42 }), ex: [0, 0.45, 0.45], name: 'Testa coat' });

    const cotAsm = asm('cotyledons', root, { title: 'Twin cotyledons', sub: 'Starch & protein reserves' });
    cotAsm.position.set(0, 1.25, 0);
    const cotL = part(cotAsm, sphere(0.78, 24), { pal: 'paper', tone: 'hi', pos: [-0.22, 0, 0], ex: [-0.55, 0, 0], name: 'Left cotyledon' });
    const cotR = part(cotAsm, sphere(0.78, 24), { pal: 'paper', tone: 'hi', pos: [0.22, 0, 0], ex: [0.55, 0, 0], name: 'Right cotyledon' });

    const radAsm = asm('radicle_embryo', root, { title: 'Emerging radicle & plumule', sub: 'Embryonic root axis' });
    radAsm.position.set(0, 0.9, 0.65);
    const radMesh = part(radAsm, cone(0.22, 0.95, 20), { pal: 'green', tone: 'lit', pos: [0, -0.35, 0.2], rot: [Math.PI * 0.78, 0, 0], ex: [0, -0.5, 0.5], name: 'Radicle root tip' });
    label('board', 'Testa & micropyle', () => V(-0.9, 2.25, 0), { leader: [-24, -18] });
    label('board', 'Emerging radicle', () => V(0.55, 0.5, 0.85), { leader: [34, 18] });

    // Station 1 (x = 14): Flame Cliff vs Stepped Enzymatic Staircase
    const flameAsm = asm('flame_drop', root, { title: 'Conceptual flame account', sub: 'Fuel reactions release heat and light' });
    flameAsm.position.set(12.8, 0.2, 0);
    part(flameAsm, box(0.7, 2.2, 0.7, 0.04), { pal: 'red', tone: 'hi', pos: [0, 1.1, 0], ex: [-0.4, 0.3, 0], name: 'Combustion free-energy cliff' });

    const stairAsm = asm('stepped_staircase', root, { title: 'Enzymatic staircase', sub: 'Coupled ATP capture' });
    stairAsm.position.set(14.3, 0.2, 0);
    const stairBars = [];
    for (let i = 0; i < 6; i++) {
      const h = 2.2 - i * 0.32;
      const m = part(stairAsm, box(0.36, h, 0.65, 0.03), { pal: i % 2 === 0 ? 'green' : 'blue', tone: 'hi', pos: [i * 0.42, h / 2, 0], ex: [0, 0.25 * (6 - i), 0], name: `Coupled enzyme step ${i + 1}` });
      stairBars.push(m);
    }
    label('board', 'Conceptual flame account', () => V(12.8, 2.65, 0));
    label('board', 'Coupled ATP steps', () => V(15.2, 2.45, 0));

    // Station 2 (x = 28): Real ATP Molecule + Rotary F0F1 ATP Synthase
    const molAsm = asm('atp_molecule', root, { title: 'ATP triphosphate molecule', sub: 'Subbarow’s energy currency' });
    molAsm.position.set(26.5, 1.45, 0);
    prims.molecule(molAsm, MOLECULES.atpCore.atoms.map(a => a.join(' ')).join('\n'), { scale: 0.22, names: false, name: 'ATP core schematic' });

    const synthAsm = asm('atp_synthase', root, { title: 'F₀F₁ ATP Synthase turbine', sub: 'Rotary molecular generator' });
    const synth = buildAtpSynthase(synthAsm, { x0: 29.2, y0: 1.35, z0: 0, scale: 1.05 });
    label('board', 'ATP core', () => V(26.8, 2.35, 0));
    label('board', 'ATP synthase', () => V(29.2, 2.55, 0));

    // Station 3 (x = 42): Bacteriophage on Host Bacterium
    const hostAsm = asm('host_bacterium', root, { title: 'Metabolising host bacterium', sub: 'Living MRS GREN cell' });
    hostAsm.position.set(42, 0.55, 0);
    part(hostAsm, capsule(0.65, 1.4, 12, 24), { pal: 'green', tone: 'mid', rot: [0, 0, Math.PI / 2], mat: shadeMat('green', { opacity: 0.48 }), ex: [0, -0.45, 0], name: 'Bacterial cell envelope' });

    const capAsm = asm('phage_capsid', root, { title: 'Icosahedral phage capsid', sub: 'Crystalline protein shell' });
    capAsm.position.set(42, 2.35, 0);
    part(capAsm, new THREE.IcosahedronGeometry(0.48, 0), { pal: 'blue', tone: 'lit', ex: [0, 0.6, 0], name: 'Icosahedral head' });

    const tailAsm = asm('phage_tail', root, { title: 'Contractile tail & fibres', sub: 'DNA injection syringe' });
    tailAsm.position.set(42, 1.55, 0);
    const sheath = part(tailAsm, cyl(0.14, 0.65, 16), { pal: 'ochre', tone: 'hi', pos: [0, 0.1, 0], ex: [0, 0.25, 0.3], name: 'Contractile tail sheath' });
    const dnaNeedle = part(tailAsm, cyl(0.04, 0.95, 12), { pal: 'red', tone: 'hi', pos: [0, -0.1, 0], ex: [0, -0.2, 0], name: 'Injected viral DNA core' });
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      const r = rod(tailAsm, { r: 0.02, pal: 'dark', tone: 'hi', name: 'Tail fibre' });
      r.set(V(0.12 * Math.cos(a), -0.2, 0.12 * Math.sin(a)), V(0.55 * Math.cos(a), -0.45, 0.55 * Math.sin(a)));
    }
    label('board', 'Icosahedral capsid', () => V(42, 3.05, 0));
    label('board', 'Host bacterium', () => V(42, 0.25, 0.85));

    return {
      labels,
      update(s) {
        // Seed swelling & radicle elongation
        const swell = 1 + (s.imb.waterUptakePct / 100) * 0.28;
        testaMesh.scale.setScalar(swell);
        cotL.scale.setScalar(swell * 0.96);
        cotR.scale.setScalar(swell * 0.96);
        const radScale = 0.4 + (s.imb.waterUptakePct / 100) * 1.1;
        radMesh.scale.set(1, radScale, 1);

        // Spin ATP synthase rotor
        synth.rotor.rotation.y = s.t * (1.5 + s.ox.nAtp * 0.12);

        // Phage injection kinematics
        const inj = s.phageInject;
        capAsm.position.y = 2.35 - inj * 0.32;
        sheath.scale.y = 1 - inj * 0.45;
        dnaNeedle.position.y = -0.1 - inj * 0.42;
      },
    };
  },
};
