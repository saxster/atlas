import { SUBJECT } from '../subject.js';
import {
  THREE, part, box, cyl, sphere, capsule, rod,
  prims, rbcGeo, buildHelix, studioGrid, playTone, V
} from '@saxster/atlas/bio_kit.js';
import * as M from './model.js';

export const PAGES = [
  {
    tab: '3D Cell nanocity',
    fig: 'Figure 2.1 · 3D Plant & Animal cell architecture with explodable organelles',
    title: 'The Nanocity Under the Microscope',
    alt: '3D cutaway of a eukaryotic plant cell with cellulose wall, central vacuole, nucleus, mitochondria, and chloroplasts.',
    cam: { target: [0, 1.35, 0], az: 28, el: 24, dist: 7.4 },
    lit: 'nucleus_asm',
    parts: ['cell_wall_vacuole', 'nucleus_asm', 'mito_organelle', 'chloro_organelle'],
    look: { xray: 0.22, section: 0 },
  },
  {
    tab: 'Endosymbiosis',
    fig: 'Figure 2.2 · Margulis’s endosymbiotic stowaways: mitochondrion & chloroplast DNA rings',
    title: 'Endosymbiotic Organelles',
    alt: '3D cutaway of a mitochondrion with folded cristae and a chloroplast with thylakoid grana stacks and circular DNA.',
    cam: { target: [14, 1.4, 0], az: -24, el: 20, dist: 7.0 },
    lit: 'cristae_folds',
    parts: ['cristae_folds', 'thylakoid_grana'],
    look: { xray: 0.15, section: 0 },
  },
  {
    tab: 'SA/V & core starvation',
    fig: 'Figure 2.3 · Surface-to-volume ratio (SA/V = 6/L) and diffusive core starvation',
    title: 'The Tyranny of Geometry (SA/V)',
    alt: '3D comparison of a small well-oxygenated cube cell and a large cube cell with a starved anoxic core alongside the SA/V curve.',
    cam: { target: [28, 1.4, 0], az: 22, el: 22, dist: 7.6 },
    lit: 'sav_cubes',
    parts: ['sav_cubes', 'sav_chart'],
    look: { xray: 0.25, section: 0 },
  },
  {
    tab: 'Specialist cells',
    fig: 'Figure 2.4 · Specialist cells built for geometry: biconcave RBC, root hair & motor neurone',
    title: 'Specialist Cell Geometries',
    alt: '3D biconcave red blood cell, elongated root hair cell, and myelinated motor neurone.',
    cam: { target: [42, 1.35, 0], az: 18, el: 20, dist: 7.5 },
    lit: 'rbc_specialist',
    parts: ['rbc_specialist', 'roothair_specialist', 'neurone_specialist'],
    look: { xray: 0, section: 0 },
  },
];

export const PLATES = {
  cell_wall_vacuole: {
    text: 'Rigid β-cellulose cell wall and tonoplast-bounded central sap vacuole: maintains turgor pressure Ψ_p while pushing chloroplasts to the illuminated cell periphery.',
  },
  nucleus_asm: {
    text: 'Double-membrane nuclear envelope perforated by nuclear pore complexes, housing chromosomal DNA and the ribosome-assembling nucleolus.',
  },
  mito_organelle: {
    text: 'Aerobic powerhouses present in both plant and animal cells: inner membrane folded into cristae studded with F₀F₁ ATP synthases.',
  },
  chloro_organelle: {
    text: 'Solar-capturing plastids of green plant cells: stacked thylakoid grana embedded with chlorophyll surround the RuBisCO-rich stroma.',
  },
  cristae_folds: {
    text: 'Lynn Margulis’s α-proteobacterial stowaway: double membrane, circular naked 70S DNA ring, and cristae folds that multiply inner surface area.',
    facts: s => [['Cristae folds', `${s.cr.folds}`], ['Area gain', `${s.cr.areaMultiplier.toFixed(2)}×`]],
  },
  thylakoid_grana: {
    text: 'Cyanobacterial stowaway: double envelope, circular plastid DNA, 70S ribosomes, and coin-like thylakoid grana stacks.',
  },
  sav_cubes: {
    text: 'As cell width L grows, surface area scales as 6L² while metabolic volume scales as L³; beyond ~50 µm, inward O₂ diffusion lags behind core demand.',
    facts: s => [['L', `${s.geo.sideUm} µm`], ['SA/V', `${s.geo.savPerUm.toFixed(2)} µm⁻¹`], ['τ_diff', `${(s.geo.diffusionTimeSec * 1000).toFixed(1)} ms`]],
  },
  sav_chart: {
    text: 'Hyperbolic decay curve SA/V = 6/L: explains why big organisms are built from trillions of microscopic cells rather than one giant cell.',
  },
  rbc_specialist: {
    text: 'Human red blood cell (7.8 µm): ejects its nucleus and mitochondria to form a flexible biconcave disc with 42% extra surface area and a ≤1.1 µm O₂ diffusion path.',
  },
  roothair_specialist: {
    text: 'Epidermal root hair cell: extends a thin 1000 µm tubular finger between soil particles, tripling SA/V for water and active mineral ion uptake.',
  },
  neurone_specialist: {
    text: 'Myelinated motor neurone: insulating Schwann-cell myelin sheaths separated by Nodes of Ranvier leapfrog action potentials at up to 100 m/s.',
  },
};

export const CHAPTER = {
  subject: SUBJECT,
  no: 2,
  PAGES,
  PLATES,
  clock0: 0,
  cuts: true,
  xrayKeys: ['cell_wall_vacuole', 'sav_cubes'],
  cutKeys: ['cell_wall_vacuole', 'nucleus_asm', 'cristae_folds', 'thylakoid_grana'],
  cutPlane: [0, 0, -1, 0.05],
  defaultParams: { cellSideUm: 40, cristaeFolds: 6 },
  controls: [
    { id: 'cellSideUm', label: 'Cell cube width L', min: 10, max: 100, step: 5, value: 40, unit: 'µm' },
    { id: 'cristaeFolds', label: 'Mitochondrial cristae folds', min: 1, max: 10, step: 1, value: 6, unit: 'folds' },
  ],
  lessons: {
    'ch02-cell-nanocity-3d': { page: 0 },
    'ch02-endosymbiosis-3d': { page: 1, params: { cristaeFolds: 8 } },
    'ch02-sav-geometry-3d': { page: 2, params: { cellSideUm: 60 } },
    'ch02-specialist-cells-3d': { page: 3 },
  },
  sonify(ctx, s, page) {
    playTone(ctx, { freq: 200 + s.geo.savPerUm * 450, dur: 0.06, type: 'sine', gain: 0.03 });
  },
  state(clock, reduced) {
    const p = CHAPTER.params || CHAPTER.defaultParams;
    const t = reduced ? 1.0 : clock;
    const geo = M.cubeGeometry(p.cellSideUm);
    const cr = M.cristaeFoldingGain(p.cristaeFolds);
    return { t, geo, cr };
  },
  readout(s, page, pageIdx) {
    if (pageIdx === 0) {
      return `<b>3D Eukaryotic Cell Nanocity</b> · Cellulose wall + central vacuole (turgor) + nucleus (DNA blueprint) + mitochondria (ATP) + chloroplasts (solar sugar).`;
    }
    if (pageIdx === 1) {
      return `<b>Endosymbiosis</b> · Cristae folds = ${s.cr.folds} → Inner membrane area <b>${s.cr.areaMultiplier.toFixed(2)}×</b> · Both organelles retain circular 70S DNA & bacterial-type ribosomes.`;
    }
    if (pageIdx === 2) {
      return `<b>Cell width L = ${s.geo.sideUm} µm</b> · SA = ${s.geo.surfaceUm2.toLocaleString()} µm² · Vol = ${s.geo.volumeUm3.toLocaleString()} µm³ · <b>SA/V = ${s.geo.savPerUm.toFixed(2)} µm⁻¹</b> · Core O₂ delay τ = ${(s.geo.diffusionTimeSec * 1000).toFixed(1)} ms.`;
    }
    return `<b>Specialist Cell Shapes</b> · Biconcave RBC (+42% SA/V, no nucleus) · Root hair (+215% SA/V finger) · Myelinated axon (saltatory conduction).`;
  },
  buildWorld(E) {
    const { scene, asm } = E;
    const root = new THREE.Group();
    scene.add(root);
    studioGrid(root, { x0: -4, x1: 48 });
    const labels = [];
    const label = (cls, html, at, opts = {}) => labels.push({ cls, html, at, ...opts });

    // Station 0 (x = 0): 3D Plant/Eukaryotic Cell Teardown
    const wallAsm = asm('cell_wall_vacuole', root, { title: 'Cellulose wall & central vacuole', sub: 'Turgor & structural box' });
    wallAsm.position.set(0, 1.35, 0);
    part(wallAsm, box(2.5, 2.1, 2.1, 0.14), { pal: 'green', tone: 'mid', mat: shadeMat('green', { opacity: 0.35 }), ex: [0, -0.45, -0.45], name: 'Cellulose cell wall' });
    part(wallAsm, box(1.15, 1.25, 1.15, 0.18), { pal: 'blue', tone: 'mid', pos: [-0.38, -0.1, 0], mat: shadeMat('blue', { opacity: 0.55 }), ex: [-0.55, 0.35, 0], name: 'Central sap vacuole' });

    const nucAsm = asm('nucleus_asm', root, { title: 'Nucleus & nucleolus', sub: 'Double-envelope genome vault' });
    nucAsm.position.set(0.55, 1.55, 0.15);
    part(nucAsm, sphere(0.46, 24), { pal: 'red', tone: 'hi', ex: [0.55, 0.45, 0.3], name: 'Nuclear envelope' });
    part(nucAsm, sphere(0.2, 16), { pal: 'ink', tone: 'lit', pos: [0.08, 0.05, 0.12], ex: [0.75, 0.65, 0.45], name: 'Nucleolus' });

    const mitoAsm = asm('mito_organelle', root, { title: 'Mitochondria', sub: 'Aerobic ATP powerhouses' });
    mitoAsm.position.set(0.55, 0.85, -0.35);
    part(mitoAsm, capsule(0.18, 0.38, 8, 16), { pal: 'ochre', tone: 'hi', rot: [0.3, 0.4, 1.1], ex: [0.65, -0.35, -0.4], name: 'Mitochondrion' });

    const chloroAsm = asm('chloro_organelle', root, { title: 'Chloroplasts', sub: 'Solar sugar factories' });
    chloroAsm.position.set(-0.45, 2.0, 0.45);
    part(chloroAsm, capsule(0.2, 0.42, 8, 16), { pal: 'green', tone: 'lit', rot: [0, 0.2, 1.4], ex: [-0.55, 0.55, 0.45], name: 'Chloroplast' });
    label('board', 'Nucleus', () => V(0.55, 2.25, 0.15), { leader: [30, -20] });
    label('board', 'Sap vacuole', () => V(-0.55, 1.35, 0.75), { leader: [-34, 18] });

    // Station 1 (x = 14): Endosymbiosis (Mitochondrion Cristae & Chloroplast Grana)
    const crisAsm = asm('cristae_folds', root, { title: 'Mitochondrial cristae & 70S DNA', sub: 'Folded inner membrane' });
    crisAsm.position.set(13.0, 1.35, 0);
    part(crisAsm, capsule(0.55, 1.1, 12, 24), { pal: 'ochre', tone: 'mid', rot: [0, 0, Math.PI / 2], mat: shadeMat('ochre', { opacity: 0.42 }), ex: [-0.4, 0, 0], name: 'Outer mitochondrial membrane' });
    const cristaSlabs = [];
    for (let i = 0; i < 6; i++) {
      const m = part(crisAsm, box(0.08, 0.68, 0.65, 0.02), { pal: 'red', tone: 'hi', pos: [-0.55 + i * 0.22, 0, 0], ex: [0, 0.45, 0], name: 'Crista fold' });
      cristaSlabs.push(m);
    }

    const granAsm = asm('thylakoid_grana', root, { title: 'Chloroplast grana stacks', sub: 'Thylakoid solar discs' });
    granAsm.position.set(15.2, 1.35, 0);
    part(granAsm, capsule(0.6, 1.15, 12, 24), { pal: 'green', tone: 'mid', rot: [0, 0, Math.PI / 2], mat: shadeMat('green', { opacity: 0.38 }), ex: [0.4, 0, 0], name: 'Double chloroplast envelope' });
    for (const sx of [-0.38, 0.0, 0.38]) {
      for (let k = -2; k <= 2; k++) {
        part(granAsm, cyl(0.18, 0.06, 18), { pal: 'green', tone: 'lit', pos: [sx, k * 0.09, 0], ex: [0, k * 0.14 + 0.3, 0], name: 'Thylakoid disc' });
      }
    }
    label('board', 'Cristae folds', () => V(13.0, 2.2, 0));
    label('board', 'Thylakoid grana', () => V(15.2, 2.2, 0));

    // Station 2 (x = 28): SA/V Cubes + Starved Core + 3D Hyperbola Plot
    const cubesAsm = asm('sav_cubes', root, { title: 'Well-fed shell vs starved core', sub: 'Diffusive O₂ limit' });
    cubesAsm.position.set(27.0, 1.25, 0);
    const outerCube = part(cubesAsm, box(1.5, 1.5, 1.5, 0.06), { pal: 'blue', tone: 'mid', mat: shadeMat('blue', { opacity: 0.38 }), ex: [0, 0.45, 0], name: 'Oxygenated outer shell' });
    const starvedCore = part(cubesAsm, box(0.75, 0.75, 0.75, 0.04), { pal: 'red', tone: 'lit', ex: [0, -0.35, 0.45], name: 'Anoxic starved core' });

    const chartAsm = asm('sav_chart', root, { title: 'SA/V = 6/L hyperbola', sub: 'Geometric scaling curve' });
    chartAsm.position.set(28.6, 0.25, -0.4);
    const ax = prims.axes(chartAsm, { x: [10, 100], y: [0, 0.65], size: [2.0, 1.7, 0.8] });
    prims.plot(ax, L => 6 / L, { samples: 48, pal: 'green', r: 0.032 });
    const cursorDot = part(chartAsm, sphere(0.085, 16), { pal: 'red', tone: 'lit', name: 'Current cell size' });
    label('board', 'Starved core', () => V(27.0, 2.3, 0));
    label('board', 'SA/V = 6/L', () => V(29.6, 2.15, -0.4));

    // Station 3 (x = 42): Specialist Cells (RBC, Root Hair, Myelinated Neurone)
    const rbcAsm = asm('rbc_specialist', root, { title: 'Biconcave red blood cell', sub: 'No nucleus, high SA/V' });
    rbcAsm.position.set(40.5, 1.35, 0);
    part(rbcAsm, rbcGeo(0.68, 0), { pal: 'red', tone: 'lit', rot: [0.45, 0.2, 0], ex: [-0.35, 0.3, 0], name: 'Biconcave RBC disc' });

    const rhAsm = asm('roothair_specialist', root, { title: 'Root hair cell', sub: 'Tubular soil extension' });
    rhAsm.position.set(42.0, 1.2, 0);
    part(rhAsm, box(0.62, 0.9, 0.55, 0.05), { pal: 'green', tone: 'mid', pos: [0, 0, 0], ex: [0, 0.3, 0], name: 'Epidermal soma' });
    part(rhAsm, cyl(0.11, 1.35, 16), { pal: 'ochre', tone: 'hi', pos: [0.75, -0.1, 0], rot: [0, 0, Math.PI / 2], ex: [0.45, 0, 0], name: 'Root hair projection' });

    const neuAsm = asm('neurone_specialist', root, { title: 'Myelinated motor axon', sub: 'Saltatory conduction' });
    neuAsm.position.set(43.6, 1.35, 0);
    part(neuAsm, cyl(0.05, 1.8, 12), { pal: 'ink', tone: 'hi', pos: [0, 0, 0], ex: [0, 0.25, 0], name: 'Axon core' });
    for (const sy of [-0.55, 0, 0.55]) {
      part(neuAsm, capsule(0.13, 0.26, 8, 14), { pal: 'blue', tone: 'hi', pos: [0, sy, 0], ex: [0.35, 0, 0], name: 'Myelin internode sheath' });
    }
    label('board', 'Biconcave RBC', () => V(40.5, 2.25, 0));
    label('board', 'Root hair', () => V(42.2, 2.25, 0));
    label('board', 'Myelin nodes', () => V(43.6, 2.4, 0));

    return {
      labels,
      update(s) {
        // Scale SA/V cube & starved core
        const sc = 0.45 + (s.geo.sideUm / 100) * 0.85;
        outerCube.scale.setScalar(sc);
        const coreRatio = Math.max(0.01, (s.geo.sideUm - 22) / 100);
        starvedCore.visible = s.geo.sideUm > 25;
        starvedCore.scale.setScalar(coreRatio * 1.35);
        cursorDot.position.copy(ax.to(s.geo.sideUm, s.geo.savPerUm, 0));

        // Cristae fold density
        cristaSlabs.forEach((m, idx) => {
          m.visible = idx < s.cr.folds;
        });
      },
    };
  },
};
