import { SUBJECT } from '../subject.js';
import {
  THREE, part, box, cyl, sphere, cone, capsule, rod,
  prims, MOLECULES, buildAtpSynthase, studioGrid, playTone, V
} from '@saxster/atlas/bio_kit.js';
import * as M from './model.js';

export const PAGES = [
  {
    tab: 'Seed imbibition',
    fig: 'Figure 1.1 · Monsoon chickpea seed imbibition, micropyle influx & radicle emergence',
    title: 'Monsoon Seed Imbibition',
    alt: '3D chickpea seed cutaway showing testa coat, cotyledon starch stores, and emerging radicle root tip as water enters the micropyle.',
    cam: { target: [0, 1.3, 0], az: 24, el: 20, dist: 6.8 },
    lit: 'radicle_embryo',
    parts: ['seed_testa', 'cotyledons', 'radicle_embryo'],
    look: { xray: 0.2, section: 0 },
  },
  {
    tab: 'Flame vs staircase',
    fig: 'Figure 1.2 · Uncontrolled single-drop combustion vs enzyme-coupled metabolic staircase',
    title: 'Flame vs Stepped Oxidation',
    alt: '3D free-energy cliff of burning sugar versus the 32-step enzymatic staircase that captures free energy as ATP.',
    cam: { target: [14, 1.4, 0], az: -22, el: 22, dist: 7.4 },
    lit: 'stepped_staircase',
    parts: ['flame_drop', 'stepped_staircase'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'ATP battery & rotor',
    fig: 'Figure 1.3 · Subbarow’s ATP triphosphate molecule & rotary F₀F₁ ATP synthase turbine',
    title: 'The Universal ATP Battery',
    alt: '3D ball-and-stick structure of ATP alongside the spinning F0F1 ATP synthase molecular turbine.',
    cam: { target: [28, 1.4, 0], az: 28, el: 18, dist: 7.2 },
    lit: 'atp_synthase',
    parts: ['atp_molecule', 'atp_synthase'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Viral borderland',
    fig: 'Figure 1.4–1.5 · MRS GREN living bacterium vs crystalline icosahedral bacteriophage',
    title: 'The Viral Borderland',
    alt: '3D icosahedral bacteriophage with contractile tail sheath landing on a metabolising bacterial host cell.',
    cam: { target: [42, 1.4, 0], az: 20, el: 22, dist: 7.4 },
    lit: 'phage_capsid',
    parts: ['phage_capsid', 'phage_tail', 'host_bacterium'],
    look: { xray: 0.15, section: 0 },
  },
];

export const PLATES = {
  seed_testa: {
    text: 'Protective outer seed coat (testa) pierced by the microscopic micropyle pore; ruptures once matric water uptake swells the seed past ~62%.',
  },
  cotyledons: {
    text: 'Twin embryonic seed leaves packed with starch and storage globulins that hydrate and mobilise into maltose and amino acids.',
  },
  radicle_embryo: {
    text: 'Embryonic root (radicle) and shoot (plumule) axis: resumes respiration and turgor-driven elongation within hours of monsoon wetting.',
    facts: s => [['Ψ_m', `${s.imb.psiMatricMPa.toFixed(1)} MPa`], ['H₂O uptake', `${s.imb.waterUptakePct.toFixed(0)}%`]],
  },
  flame_drop: {
    text: 'Uncontrolled combustion drops 2870 kJ/mol in a single step over a high activation barrier, releasing 100% as intense heat and light that would denature living proteins.',
  },
  stepped_staircase: {
    text: 'Coupled metabolic staircase lowers activation barriers with enzymes, banking ~32 ATP molecules (~976 kJ/mol, 34% efficiency) at 37 °C.',
    facts: s => [['Captured', `${s.ox.capturedKj.toFixed(0)} kJ/mol`], ['Heat', `${s.ox.heatKj.toFixed(0)} kJ/mol`], ['Eff.', `${(s.ox.efficiency * 100).toFixed(1)}%`]],
  },
  atp_molecule: {
    text: 'Yellapragada Subbarow’s adenosine triphosphate (ATP): three negatively charged phosphate groups whose terminal γ-phosphate bond releases 30.5 kJ/mol on hydrolysis to ADP + Pi.',
  },
  atp_synthase: {
    text: 'Rotary F₀F₁ ATP synthase nanomachine: proton flow spins the F₀ c-ring and central γ-shaft, mechanically forcing the F₁ catalytic crown to press ADP + Pi into ATP.',
  },
  phage_capsid: {
    text: 'Crystalline icosahedral protein head (T = 7 triangulation) housing tightly spooled viral DNA—inert and zero-ATP outside a host cell.',
  },
  phage_tail: {
    text: 'Contractile tail sheath, baseplate, and six tail fibres that latch onto bacterial surface receptors and inject the viral genome like a spring-loaded syringe.',
  },
  host_bacterium: {
    text: 'Living prokaryotic cell performing all seven MRS GREN processes—whose ribosomes and ATP pool the virus hijacks upon injection.',
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
    { id: 'imbibeHours', label: 'Monsoon soaking time', min: 0, max: 16, step: 1, value: 8, unit: 'h' },
    { id: 'atpYield', label: 'Coupled ATP banked per glucose', min: 2, max: 36, step: 2, value: 32, unit: 'ATP' },
    { id: 'phageInject', label: 'Phage tail contraction', min: 0, max: 100, step: 5, value: 0, unit: '%' },
  ],
  lessons: {
    'ch01-imbibition-3d': { page: 0, params: { imbibeHours: 9 } },
    'ch01-staircase-3d': { page: 1, params: { atpYield: 32 } },
    'ch01-atp-cycle-3d': { page: 2, params: { atpYield: 32 } },
    'ch01-mrs-gren-3d': { page: 3, params: { phageInject: 15 } },
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
      return `<b>Soaking time = ${s.imb.hours} h</b> · Matric potential Ψ_m = ${s.imb.psiMatricMPa.toFixed(1)} MPa · Water uptake = <b>${s.imb.waterUptakePct.toFixed(0)}%</b> · Testa: ${s.imb.testaRuptured ? '<b>Ruptured (radicle emerging)</b>' : 'Intact'}.`;
    }
    if (pageIdx === 1) {
      return `<b>Glucose oxidation (ΔG = −2870 kJ/mol)</b> · Banked: <b>${s.ox.nAtp} ATP (${s.ox.capturedKj.toFixed(0)} kJ/mol, ${(s.ox.efficiency * 100).toFixed(1)}%)</b> · Gentle metabolic heat: ${s.ox.heatKj.toFixed(0)} kJ/mol.`;
    }
    if (pageIdx === 2) {
      return `<b>ATP/ADP Cycle & Rotary F₀F₁ Turbine</b> · Terminal γ-phosphate bond stores 30.5 kJ/mol · 3 ATP synthesized per 360° γ-shaft revolution.`;
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
    const flameAsm = asm('flame_drop', root, { title: 'Single-step flame cliff', sub: '2870 kJ/mol lost as heat' });
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
    label('board', 'Single flame cliff', () => V(12.8, 2.65, 0));
    label('board', 'Coupled ATP steps', () => V(15.2, 2.45, 0));

    // Station 2 (x = 28): Real ATP Molecule + Rotary F0F1 ATP Synthase
    const molAsm = asm('atp_molecule', root, { title: 'ATP triphosphate molecule', sub: 'Subbarow’s energy currency' });
    molAsm.position.set(26.5, 1.45, 0);
    prims.molecule(molAsm, { atoms: MOLECULES.atpCore.atoms, bonds: MOLECULES.atpCore.bonds, scale: 0.22 });

    const synthAsm = asm('atp_synthase', root, { title: 'F₀F₁ ATP Synthase turbine', sub: 'Rotary molecular generator' });
    const synth = buildAtpSynthase(synthAsm, { x0: 29.2, y0: 1.35, z0: 0, scale: 1.05 });
    label('board', 'ATP γ-phosphate tail', () => V(26.8, 2.35, 0));
    label('board', 'F₀F₁ rotary synthase', () => V(29.2, 2.55, 0));

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
