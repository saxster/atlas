import { SUBJECT } from '../subject.js';
import {
  THREE, shadeMat, part, box, cyl, sphere, rod, arrow3,
  buildMolecule3D, studioGrid, playTone, V
} from '@saxster/atlas/chem_kit.js';
import * as M from './model.js';

export const PAGES = [
  {
    tab: 'The mole & molar mass',
    fig: 'Figure 6.1 · Equal-mole samples (1.00 mol) of C (12.0 g), H₂O (18.0 g), and Cu (63.5 g)',
    title: 'Avogadro’s Counting Bridge',
    alt: '3D weighing pans holding 1.00 mol each of carbon, water, and copper—identical particle counts with different masses.',
    cam: { target: [0, 1.15, 0], az: 22, el: 20, dist: 11.6 },
    lit: 'mole_samples',
    parts: ['mole_samples', 'avogadro_bridge'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Empirical vs molecular',
    fig: 'Figure 6.2 · Empirical ratio unit (CH₂O) vs molecular formula (C₂H₄O₂)',
    title: 'Ratios & Empirical Formulas',
    alt: '3D comparison of a single CH2O empirical unit with a multi-unit molecular structure.',
    cam: { target: [14, 1.3, 0], az: -20, el: 20, dist: 11.4 },
    lit: 'molecular_bundle',
    parts: ['empirical_unit', 'molecular_bundle'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Limiting reactant',
    fig: 'Figure 6.3 · N₂ + 3 H₂ → 2 NH₃: reaction bundles, limiting reactant & leftover excess',
    title: 'Limiting Reactant & Excess Tray',
    alt: '3D reactant tray of N2 and H2 molecules pairing in a 1:3 ratio to form 2 NH3 plus leftover excess molecules.',
    cam: { target: [28, 1.35, 0], az: 24, el: 20, dist: 11.8 },
    lit: 'product_nh3_tray',
    parts: ['feed_tray', 'product_nh3_tray', 'excess_tray'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Mass chain & yield',
    fig: 'Figure 6.4 · Stoichiometric bridge (g A → mol A → mol B → g B) & percent yield',
    title: 'Stoichiometric Bridge & Percent Yield',
    alt: '3D four-step stoichiometric bridge connecting laboratory mass to molar ratio and comparing theoretical vs actual product columns.',
    cam: { target: [42, 1.15, 0], az: 24, el: 20, dist: 11.6 },
    lit: 'yield_columns',
    parts: ['stoich_bridge', 'yield_columns'],
    look: { xray: 0.15, section: 0 },
  },
];

export const PLATES = {
  mole_samples: {
    text: 'One mole (6.022 × 10²³ specified entities) of three substances: because each Cu atom is ~5.3× heavier than a ¹²C atom, 1 mol of Cu weighs 63.55 g while 1 mol of ¹²C weighs 12.00 g.',
    facts: s => [['Moles n', `${s.mol.moles.toFixed(1)} mol`], ['H₂O mass', `${s.mol.massGrams.toFixed(1)} g`], ['Entities N', `${s.mol.particles.toExponential(2)}`]],
  },
  avogadro_bridge: {
    text: 'Molar mass M (g/mol) is the conversion bridge between what we can weigh on a balance (grams) and what reacts in fixed whole-number ratios (moles of particles).',
  },
  empirical_unit: {
    text: 'Empirical formula (CH₂O, 30.0 g/mol): gives only the simplest whole-number 1 C : 2 H : 1 O atom ratio determined by elemental analysis.',
  },
  molecular_bundle: {
    text: 'Molecular formula ((CH₂O)n): combines n empirical units into the actual discrete molecule (e.g. n = 2 ethanoic acid C₂H₄O₂, n = 6 glucose C₆H₁₂O₆).',
  },
  feed_tray: {
    text: 'Initial reactant feed (N₂ + 3 H₂): every 1 mol of N₂ requires 3 mol of H₂—you must compare mole ratios (n/ν), never raw gram masses, to find what runs out first.',
    facts: s => [['Feed N₂', `${s.lim.nN2} mol`], ['Feed H₂', `${s.lim.nH2} mol`], ['Status', s.lim.limiting]],
  },
  product_nh3_tray: {
    text: 'Formed ammonia product (2 NH₃ per reaction event): maximum product amount is capped strictly by the limiting reactant.',
    facts: s => [['Reaction extent ξ', `${s.lim.xi.toFixed(2)} mol`], ['NH₃ formed', `${s.lim.nh3Formed.toFixed(2)} mol`]],
  },
  excess_tray: {
    text: 'Unreacted excess reagent: remains in the vessel alongside the product because its stoichiometric partner was exhausted.',
    facts: s => [['Excess N₂ left', `${s.lim.n2Left.toFixed(2)} mol`], ['Excess H₂ left', `${s.lim.h2Left.toFixed(2)} mol`]],
  },
  stoich_bridge: {
    text: 'Four-step dimensional chain: Mass A (g) ÷ M_A → Moles A (mol) × (ν_B/ν_A) → Moles B (mol) × M_B → Theoretical Mass B (g).',
  },
  yield_columns: {
    text: 'Theoretical vs actual yield: side reactions, incomplete equilibrium conversion, and mechanical recovery losses make actual yield ≤ theoretical yield.',
    facts: s => [['Theoretical', `${s.yld.theoreticalGrams.toFixed(1)} g`], ['Actual', `${s.yld.actualGrams.toFixed(1)} g`], ['% Yield', `${s.yld.percentYield}%`]],
  },
};

export const CHAPTER = {
  subject: SUBJECT,
  no: 6,
  narrowZoom: 1.18,
  PAGES,
  PLATES,
  clock0: 0,
  cuts: true,
  xrayKeys: ['mole_samples', 'yield_columns'],
  cutKeys: ['mole_samples', 'yield_columns'],
  cutPlane: [0, 0, -1, 0.05],
  defaultParams: { nN2: 2, nH2: 3, yieldPct: 85 },
  controls: [
    { id: 'nN2', label: 'Initial N₂ amount', min: 1, max: 4, step: 1, value: 2, unit: 'mol' },
    { id: 'nH2', label: 'Initial H₂ amount', min: 1, max: 9, step: 1, value: 3, unit: 'mol' },
    { id: 'yieldPct', label: 'Percent yield efficiency', min: 25, max: 100, step: 5, value: 85, unit: '%' },
  ],
  lessons: {
    'ratios-units': { page: 1, params: {} },
    'the-mole': { page: 0, params: {} },
    'molar-mass': { page: 0, params: {} },
    'limiting-reactant': { page: 2, params: { nN2: 2, nH2: 3 } },
    'bulk-limiting-amounts': { page: 2, params: { nN2: 3, nH2: 6 } },
    'concentration': { page: 3, params: { yieldPct: 90 } },
    'reaction-mass-stoichiometry': { page: 3, params: { nN2: 2, nH2: 6, yieldPct: 85 } },
    's6-1': { page: 1, params: {} },
    's6-2': { page: 0, params: {} },
    's6-3': { page: 0, params: {} },
    's6-4': { page: 1, params: {} },
    's6-5': { page: 2, params: { nN2: 2, nH2: 3 } },
    's6-6': { page: 2, params: { nN2: 3, nH2: 6 } },
    's6-7': { page: 3, params: { yieldPct: 90 } },
    's6-8': { page: 3, params: { yieldPct: 85 } },
  },
  sonify(ctx, s, page) {
    if (page === 2) playTone(ctx, { freq: 220 + s.lim.nh3Formed * 75, dur: 0.07, type: 'triangle', gain: 0.03 });
    else playTone(ctx, { freq: 260 + s.yld.percentYield * 2.5, dur: 0.06, type: 'sine', gain: 0.03 });
  },
  state(clock, reduced) {
    const p = CHAPTER.params || CHAPTER.defaultParams;
    const t = reduced ? 0 : clock;
    const mol = M.moleSampleBridge(p.nN2, 18.015);
    const lim = M.haberLimitingStoichiometry(p.nN2, p.nH2);
    const yld = M.reactionYieldAccount(lim.nh3Formed * 17.031, p.yieldPct);
    return { t, mol, lim, yld };
  },
  readout(s, page, pageIdx) {
    if (pageIdx === 0) {
      return `<b>Avogadro’s Bridge (${s.mol.moles.toFixed(1)} mol H₂O)</b> · Mass = <b>${s.mol.massGrams.toFixed(1)} g</b> · Entities = <b>${s.mol.particles.toExponential(2)} molecules</b> · Equal moles = equal particle counts.`;
    }
    if (pageIdx === 1) {
      return `<b>Empirical vs Molecular Formula</b> · Empirical formula <b>CH₂O</b> gives the 1:2:1 atom ratio; multiplying by n = 2 (C₂H₄O₂) or n = 6 (C₆H₁₂O₆) gives the true molecule.`;
    }
    if (pageIdx === 2) {
      return `<b>N₂ + 3 H₂ → 2 NH₃ (Feed: ${s.lim.nN2} N₂ + ${s.lim.nH2} H₂)</b> · <b>${s.lim.limiting}</b> · Product = <b>${s.lim.nh3Formed.toFixed(1)} mol NH₃</b> · Excess left: ${s.lim.n2Left.toFixed(1)} N₂, ${s.lim.h2Left.toFixed(1)} H₂.`;
    }
    return `<b>Mass Stoichiometry & Yield</b> · Theoretical NH₃ = <b>${s.yld.theoreticalGrams.toFixed(1)} g</b> · At ${s.yld.percentYield}% yield, actual recovered product = <b>${s.yld.actualGrams.toFixed(1)} g</b>.`;
  },
  buildWorld(E) {
    const { scene, asm } = E;
    const root = new THREE.Group();
    scene.add(root);
    studioGrid(root, { x0: -4, x1: 48 });
    const labels = [];
    const label = (cls, html, at, opts = {}) => labels.push({ cls, html, at, ...opts });

    // Station 0 (x = 0): Equal-Mole Samples
    const sampAsm = asm('mole_samples', root, { title: '1.00 mol samples (C, H₂O, Cu)', sub: 'Same count (6.02×10²³), different mass' });
    sampAsm.position.set(0, 0.1, 0);
    part(sampAsm, cyl(0.38, 0.45, 24), { pal: 'dark', tone: 'hi', pos: [-1.1, 0.225, 0], ex: [-0.4, 0.3, 0], name: '1 mol Carbon (12.0 g)' });
    part(sampAsm, cyl(0.42, 0.65, 24), { pal: 'blue', tone: 'mid', pos: [0, 0.325, 0], ex: [0, 0.4, 0], name: '1 mol Water (18.0 g)' });
    part(sampAsm, cyl(0.35, 0.95, 24), { pal: 'ochre', tone: 'hi', pos: [1.1, 0.475, 0], ex: [0.4, 0.3, 0], name: '1 mol Copper (63.5 g)' });

    const avAsm = asm('avogadro_bridge', root, { title: 'Avogadro bridge (N_A)', sub: 'Links grams on balance to particle count' });
    avAsm.position.set(0, 1.55, 0);
    part(avAsm, box(2.6, 0.12, 0.38, 0.02), { pal: 'paper', tone: 'hi', ex: [0, 0.35, 0], name: 'Equal-mole counting beam' });
    label('board', '1 mol C (12 g) · H₂O (18 g) · Cu (63.5 g)', () => V(0, 2.05, 0));

    // Station 1 (x = 14): Empirical vs Molecular Formula
    const empAsm = asm('empirical_unit', root, { title: 'Empirical unit (CH₂O)', sub: '1 C : 2 H : 1 O simplest ratio' });
    buildMolecule3D(empAsm, 'CH2O', { scale: 0.55, pos: [12.9, 1.3, 0] });

    const molBunAsm = asm('molecular_bundle', root, { title: 'Molecular formula (C₂H₄O₂)', sub: '2 × (CH₂O) empirical units' });
    buildMolecule3D(molBunAsm, 'ethanoicAcid', { scale: 0.52, pos: [14.9, 1.3, 0] });
    const empArrow = arrow3(molBunAsm, { r: 0.024, headR: 0.065, headL: 0.13, pal: 'ochre', tone: 'hi', name: '×2 empirical multiplier' });
    empArrow.set(V(13.55, 1.3, 0), V(14.15, 1.3, 0));
    label('board', 'Empirical CH₂O (30 g/mol)', () => V(12.9, 2.25, 0));
    label('board', 'Molecular C₂H₄O₂ (60 g/mol)', () => V(14.9, 2.25, 0));

    // Station 2 (x = 28): Limiting Reactant & Excess Tray (N2 + 3 H2 -> 2 NH3)
    const feedAsm = asm('feed_tray', root, { title: 'Reactant feed (N₂ + 3 H₂)', sub: 'Requires 1 N₂ per 3 H₂' });
    feedAsm.position.set(26.5, 1.35, 0);
    const n2Feed = [0, 1, 2, 3].map(i => buildMolecule3D(feedAsm, 'N2', { scale: 0.38, pos: [-0.35, (i - 1.5) * 0.42, 0] }));
    const h2Feed = [0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => buildMolecule3D(feedAsm, 'H2', { scale: 0.35, pos: [0.35, (i - 4) * 0.22, 0] }));

    const nh3Asm = asm('product_nh3_tray', root, { title: 'Formed NH₃ product', sub: 'Capped by limiting reactant' });
    nh3Asm.position.set(28.1, 1.35, 0);
    const nh3Mols = [0, 1, 2, 3, 4, 5].map(i => buildMolecule3D(nh3Asm, 'NH3', { scale: 0.38, pos: [(i % 2 - 0.5) * 0.48, (Math.floor(i / 2) - 1) * 0.48, 0] }));

    const exAsm = asm('excess_tray', root, { title: 'Leftover excess reactant', sub: 'Unreacted after limiting runs out' });
    exAsm.position.set(29.55, 1.35, 0);
    const exN2Mols = [0, 1, 2, 3].map(i => buildMolecule3D(exAsm, 'N2', { scale: 0.36, pos: [-0.24, (i - 1.5) * 0.4, 0] }));
    const exH2Mols = [0, 1, 2, 3, 4, 5].map(i => buildMolecule3D(exAsm, 'H2', { scale: 0.34, pos: [0.24, (i - 2.5) * 0.28, 0] }));
    label('board', 'Feed: N₂ + H₂', () => V(26.5, 2.4, 0));
    label('board', 'NH₃ + Leftover N₂ / H₂', () => V(28.85, 2.4, 0));

    // Station 3 (x = 42): Stoichiometric Bridge & Percent Yield
    const brAsm = asm('stoich_bridge', root, { title: 'Mass → Mole → Mole → Mass arch', sub: 'Stoichiometric conversion pathway' });
    brAsm.position.set(41.1, 0.85, 0);
    for (let i = 0; i < 4; i++) {
      part(brAsm, box(0.36, 0.55 + (i === 1 || i === 2 ? 0.45 : 0), 0.36, 0.02), { pal: i === 1 || i === 2 ? 'blue' : 'ochre', tone: 'hi', pos: [(i - 1.5) * 0.46, 0.35, 0], ex: [0, 0.25 * (i + 1), 0], name: `Stoichiometric step ${i + 1}` });
    }
    const bridgeArr = arrow3(brAsm, { r: 0.022, headR: 0.06, headL: 0.12, pal: 'blue', tone: 'hi', name: 'Molar ratio ν_B/ν_A' });
    bridgeArr.set(V(-0.23, 0.95, 0), V(0.23, 0.95, 0));

    const yldAsm = asm('yield_columns', root, { title: 'Theoretical vs actual yield', sub: '% Yield = (Actual / Theoretical) × 100' });
    yldAsm.position.set(43.1, 0.1, 0);
    const theoBar = part(yldAsm, box(0.45, 1.6, 0.45, 0.02), { pal: 'paper', tone: 'hi', pos: [-0.32, 0.8, 0], ex: [-0.3, 0.3, 0], name: 'Theoretical 100% yield' });
    const actBar = part(yldAsm, box(0.45, 1.6, 0.45, 0.02), { pal: 'green', tone: 'hi', pos: [0.32, 0.8, 0], ex: [0.3, 0.3, 0], name: 'Actual recovered yield' });
    label('board', 'g → mol → mol → g', () => V(41.1, 2.05, 0));
    label('board', 'Theoretical vs Actual', () => V(43.1, 2.05, 0));

    return {
      labels,
      update(s) {
        n2Feed.forEach((m, i) => { m.group.visible = i < s.lim.nN2; });
        h2Feed.forEach((m, i) => { m.group.visible = i < s.lim.nH2; });
        const nNh3 = Math.round(s.lim.nh3Formed);
        nh3Mols.forEach((m, i) => { m.group.visible = i < nNh3; });
        const n2Ex = Math.round(s.lim.n2Left);
        const h2Ex = Math.round(s.lim.h2Left);
        exN2Mols.forEach((m, i) => { m.group.visible = i < n2Ex; });
        exH2Mols.forEach((m, i) => { m.group.visible = i < h2Ex; });

        const yFrac = Math.max(0.15, s.yld.percentYield / 100);
        actBar.scale.y = yFrac;
        actBar.position.y = (1.6 * yFrac) / 2;
      },
    };
  },
};
