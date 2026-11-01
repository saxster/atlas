import { SUBJECT } from '../subject.js';
import {
  THREE, shadeMat, part, box, cyl, sphere, rod, arrow3,
  buildBeaker, studioGrid, playTone, V
} from '@saxster/atlas/chem_kit.js';
import * as M from './model.js';

export const PAGES = [
  {
    tab: 'Direct Zn/Cu redox',
    fig: 'Figure 8.1 · Direct electron transfer: Zn(s) + Cu²⁺(aq) → Zn²⁺(aq) + Cu(s) on a zinc strip',
    title: 'Direct Metal–Ion Electron Transfer',
    alt: '3D zinc metal strip immersed in blue CuSO4 solution with Cu2+ ions capturing 2e- to plate as copper while Zn2+ dissolves.',
    cam: { target: [0, 1.35, 0], az: 22, el: 20, dist: 6.8 },
    lit: 'zinc_strip',
    parts: ['zinc_strip', 'copper_solution'],
    look: { xray: 0.2, section: 0 },
  },
  {
    tab: 'Electron & atom balance',
    fig: 'Figure 8.2 · Balancing oxidation and reduction half-reactions so electrons lost equal electrons gained',
    title: 'Balancing Half-Reactions',
    alt: '3D paired oxidation and reduction electron-transfer columns demonstrating matched electron conservation.',
    cam: { target: [14, 1.35, 0], az: -20, el: 20, dist: 6.8 },
    lit: 'electron_bridge',
    parts: ['oxidation_half', 'reduction_half', 'electron_bridge'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Daniell galvanic cell',
    fig: 'Figure 8.3 · Two-beaker Daniell galvanic cell (E° = +1.10 V) with external wire and KNO₃ salt bridge',
    title: 'Daniell Galvanic Cell & Salt Bridge',
    alt: '3D Zn/Zn2+ anode beaker and Cu/Cu2+ cathode beaker linked by a U-tube salt bridge and external wire.',
    cam: { target: [28, 1.35, 0], az: 24, el: 20, dist: 7.4 },
    lit: 'salt_bridge',
    parts: ['anode_halfcell', 'cathode_halfcell', 'salt_bridge'],
    look: { xray: 0.2, section: 0 },
  },
  {
    tab: 'Driven electrolysis',
    fig: 'Figure 8.4 · Galvanic discharge vs driven electrolytic charging (V_ext > 1.10 V) & Faraday stoichiometry',
    title: 'Electrolysis & Faraday’s Law',
    alt: '3D electrolytic cell with external DC power supply reversing electron flow and plating metal proportional to I * t / F.',
    cam: { target: [42, 1.35, 0], az: 24, el: 20, dist: 7.0 },
    lit: 'dc_power_supply',
    parts: ['dc_power_supply', 'plated_cathode'],
    look: { xray: 0.15, section: 0 },
  },
];

export const PLATES = {
  zinc_strip: {
    text: 'Metallic zinc strip (Zn⁰): each oxidized Zn atom gives up 2 valence electrons and enters solution as a colourless hydrated Zn²⁺ ion.',
    facts: s => [['Zn⁰ on strip', `${s.led.znStrip} atoms`], ['Zn²⁺ in solution', `${s.led.znIons} ions`]],
  },
  copper_solution: {
    text: 'Aqueous Cu²⁺ ions: capture 2 electrons at the strip surface and deposit as reddish-brown metallic Cu⁰; as [Cu²⁺] falls, the blue solution fades.',
    facts: s => [['Cu²⁺ in solution', `${s.led.cuIons} ions`], ['Cu⁰ plated', `${s.led.cuPlated} atoms`], ['e⁻ transferred', `${s.led.electronsMoved} e⁻`]],
  },
  oxidation_half: {
    text: 'Oxidation half-reaction (electron loss): e.g. Zn(s) → Zn²⁺(aq) + 2e⁻. Free electrons never accumulate in bulk solution.',
  },
  reduction_half: {
    text: 'Reduction half-reaction (electron gain): e.g. Cu²⁺(aq) + 2e⁻ → Cu(s). Every electron lost by the reductant must be captured by the oxidant.',
  },
  electron_bridge: {
    text: 'Matched electron ledger: when half-reactions involve unequal electron counts (such as Al → Al³⁺ + 3e⁻ and Cu²⁺ + 2e⁻ → Cu), multiply by 2 and 3 so 6e⁻ lost = 6e⁻ gained.',
  },
  anode_halfcell: {
    text: 'Zn / ZnSO₄(aq) half-cell (E° = −0.76 V): during spontaneous galvanic discharge, Zn is oxidized at the anode and electrons leave into the external wire.',
  },
  cathode_halfcell: {
    text: 'Cu / CuSO₄(aq) half-cell (E° = +0.34 V): electrons arrive from the external circuit and reduce Cu²⁺(aq) to Cu(s) at the cathode.',
    facts: s => [['E°_cell', `+${s.cell.eCellStd.toFixed(2)} V`], ['Applied V_ext', `${s.cell.appliedVoltageV.toFixed(2)} V`], ['Net ΔV', `${s.cell.netDrivingV.toFixed(2)} V`]],
  },
  salt_bridge: {
    text: 'Inverted U-tube salt bridge (KNO₃): migrates NO₃⁻ anions toward the anode and K⁺ cations toward the cathode so charge build-up does not halt electron flow.',
  },
  dc_power_supply: {
    text: 'External DC power source: when V_ext > 1.10 V, external electrical work forces electrons backward into the zinc electrode, recharging the cell.',
    facts: s => [['Mode', s.cell.mode]],
  },
  plated_cathode: {
    text: 'Faraday’s law of electrolysis: moles of electrons n_e = (I × t) / F (F = 96,485 C/mol), fixing the exact mass of metal deposited or gas evolved.',
    facts: s => [['Charge Q = I·t', `${s.far.chargeCoulombs.toFixed(0)} C`], ['Moles e⁻', `${s.far.molesElectrons.toFixed(3)} mol`], ['Cu mass', `${s.far.massGrams.toFixed(2)} g`]],
  },
};

export const CHAPTER = {
  subject: SUBJECT,
  no: 8,
  PAGES,
  PLATES,
  clock0: 0,
  cuts: true,
  xrayKeys: ['copper_solution', 'anode_halfcell', 'cathode_halfcell'],
  cutKeys: ['copper_solution', 'anode_halfcell', 'cathode_halfcell'],
  cutPlane: [0, 0, -1, 0.05],
  defaultParams: { pairsMoved: 3, appliedV: 0.0, currentAmps: 2.0 },
  controls: [
    { id: 'pairsMoved', label: 'Completed 2e⁻ redox events', min: 0, max: 6, step: 1, value: 3, unit: 'pairs' },
    { id: 'appliedV', label: 'External opposing voltage V_ext', min: 0, max: 2.0, step: 0.1, value: 0.0, unit: 'V' },
    { id: 'currentAmps', label: 'Electrolysis current I (15 min)', min: 0.5, max: 5.0, step: 0.5, value: 2.0, unit: 'A' },
  ],
  lessons: {
    'electron-transfer': { page: 0, params: { pairsMoved: 3 } },
    'charge-and-atoms-redox': { page: 1, params: { pairsMoved: 3 } },
    'electrochemical-direction': { page: 0, params: { pairsMoved: 4 } },
    'galvanic-electrolytic-cells': { page: 2, params: { appliedV: 0.0 } },
    'driven-electrolysis': { page: 3, params: { appliedV: 1.6, currentAmps: 3.0 } },
    's8-1': { page: 0, params: { pairsMoved: 3 } },
    's8-2': { page: 1, params: { pairsMoved: 3 } },
    's8-3': { page: 0, params: { pairsMoved: 4 } },
    's8-4': { page: 2, params: { appliedV: 0.0 } },
    's8-5': { page: 2, params: { appliedV: 1.6 } },
    's8-6': { page: 3, params: { appliedV: 1.6, currentAmps: 3.0 } },
  },
  sonify(ctx, s, page) {
    if (page >= 2) playTone(ctx, { freq: 260 + Math.abs(s.cell.netDrivingV) * 180, dur: 0.07, type: s.cell.netDrivingV >= 0 ? 'sine' : 'sawtooth', gain: 0.03 });
    else playTone(ctx, { freq: 200 + s.led.electronsMoved * 35, dur: 0.06, type: 'triangle', gain: 0.03 });
  },
  state(clock, reduced) {
    const p = CHAPTER.params || CHAPTER.defaultParams;
    const t = reduced ? 0 : clock;
    const led = M.znCuTransferLedger(p.pairsMoved, 6, 6);
    const cell = M.electrochemicalCellState(p.appliedV);
    const far = M.faradayElectrolysis(p.currentAmps, 15, 2, 63.55);
    return { t, led, cell, far };
  },
  readout(s, page, pageIdx) {
    if (pageIdx === 0) {
      return `<b>Direct Zn/Cu Redox (${s.led.electronsMoved} e⁻ transferred)</b> · Zn⁰ on strip = <b>${s.led.znStrip}</b>, Zn²⁺(aq) = <b>${s.led.znIons}</b> · Cu²⁺(aq) = <b>${s.led.cuIons}</b>, Cu⁰ plated = <b>${s.led.cuPlated}</b>.`;
    }
    if (pageIdx === 1) {
      return `<b>Redox Conservation</b> · Both atom inventory and net electrical charge must balance: <b>${s.led.electronsMoved} e⁻ lost by Zn = ${s.led.electronsMoved} e⁻ gained by Cu²⁺</b>.`;
    }
    if (pageIdx === 2) {
      return `<b>Daniell Cell (E° = +1.10 V, V_ext = ${s.cell.appliedVoltageV.toFixed(2)} V)</b> · Net driving potential = <b>${s.cell.netDrivingV.toFixed(2)} V</b> · ${s.cell.mode}.`;
    }
    return `<b>Faraday’s Law (I = ${s.far.currentAmps.toFixed(1)} A for 15 min)</b> · Charge Q = <b>${s.far.chargeCoulombs.toFixed(0)} C</b> → <b>${s.far.molesElectrons.toFixed(3)} mol e⁻</b> → <b>${s.far.massGrams.toFixed(2)} g Cu</b> deposited.`;
  },
  buildWorld(E) {
    const { scene, asm } = E;
    const root = new THREE.Group();
    scene.add(root);
    studioGrid(root, { x0: -4, x1: 48 });
    const labels = [];
    const label = (cls, html, at, opts = {}) => labels.push({ cls, html, at, ...opts });

    // Station 0 (x = 0): Direct Zn Strip in CuSO4 Beaker
    const cuSolAsm = asm('copper_solution', root, { title: 'CuSO₄(aq) solution vessel', sub: 'Cu²⁺ ions reduced at strip' });
    buildBeaker(cuSolAsm, { r: 0.95, h: 1.75, liquidRatio: 0.72, liquidPal: 'blue', pos: [0, 0.1, 0], name: 'CuSO₄ beaker' });

    const znAsm = asm('zinc_strip', root, { title: 'Immersed Zn(s) electrode strip', sub: 'Oxidized to Zn²⁺ + 2e⁻' });
    znAsm.position.set(0, 1.15, 0);
    part(znAsm, box(0.28, 1.65, 0.12, 0.02), { pal: 'paper', tone: 'mid', ex: [0, 0.55, 0], name: 'Metallic zinc strip' });
    const cuCoat = part(znAsm, box(0.32, 0.85, 0.15, 0.02), { pal: 'ochre', tone: 'hi', pos: [0, -0.32, 0], ex: [0, -0.25, 0.35], name: 'Plated Cu(s) deposit' });
    label('board', 'Zn strip → Zn²⁺ + 2e⁻', () => V(0, 2.25, 0));
    label('board', 'Cu(s) plates on strip', () => V(0.85, 0.65, 0));

    // Station 1 (x = 14): Half-Reaction Electron Balance
    const oxAsm = asm('oxidation_half', root, { title: 'Oxidation half-reaction (Anode)', sub: 'Zn(s) → Zn²⁺(aq) + 2e⁻' });
    oxAsm.position.set(13.0, 0.1, 0);
    const oxCol = part(oxAsm, box(0.62, 1.4, 0.62, 0.03), { pal: 'blue', tone: 'hi', pos: [0, 0.7, 0], ex: [-0.4, 0.3, 0], name: 'Electrons released' });

    const redAsm = asm('reduction_half', root, { title: 'Reduction half-reaction (Cathode)', sub: 'Cu²⁺(aq) + 2e⁻ → Cu(s)' });
    redAsm.position.set(15.0, 0.1, 0);
    const redCol = part(redAsm, box(0.62, 1.4, 0.62, 0.03), { pal: 'ochre', tone: 'hi', pos: [0, 0.7, 0], ex: [0.4, 0.3, 0], name: 'Electrons captured' });

    const eBrAsm = asm('electron_bridge', root, { title: 'Matched electron transfer', sub: 'e⁻ lost = e⁻ gained' });
    eBrAsm.position.set(14.0, 1.55, 0);
    const eArr = arrow3(eBrAsm, { r: 0.035, headR: 0.09, headL: 0.18, pal: 'red', tone: 'hi', name: '2e⁻ transfer vector' });
    eArr.set(V(-0.65, 0, 0), V(0.65, 0, 0));
    label('board', 'e⁻ lost = e⁻ gained', () => V(14.0, 2.15, 0));

    // Station 2 (x = 28): Daniell Galvanic Cell + Salt Bridge
    const anAsm = asm('anode_halfcell', root, { title: 'Zn / Zn²⁺ half-cell', sub: 'E° = −0.76 V' });
    buildBeaker(anAsm, { r: 0.68, h: 1.45, liquidRatio: 0.68, liquidPal: 'paper', pos: [26.9, 0.1, 0], name: 'ZnSO₄ half-cell' });
    part(anAsm, box(0.2, 1.45, 0.08, 0.01), { pal: 'dark', tone: 'mid', pos: [26.9, 1.05, 0], ex: [-0.35, 0.45, 0], name: 'Zn electrode' });

    const catAsm = asm('cathode_halfcell', root, { title: 'Cu / Cu²⁺ half-cell', sub: 'E° = +0.34 V' });
    buildBeaker(catAsm, { r: 0.68, h: 1.45, liquidRatio: 0.68, liquidPal: 'blue', pos: [29.1, 0.1, 0], name: 'CuSO₄ half-cell' });
    part(catAsm, box(0.2, 1.45, 0.08, 0.01), { pal: 'ochre', tone: 'hi', pos: [29.1, 1.05, 0], ex: [0.35, 0.45, 0], name: 'Cu electrode' });

    const sbAsm = asm('salt_bridge', root, { title: 'KNO₃ salt bridge & external wire', sub: 'Completes electrical circuit' });
    sbAsm.position.set(28.0, 1.45, 0);
    part(sbAsm, box(1.6, 0.14, 0.14, 0.02), { pal: 'green', tone: 'lit', pos: [0, 0.1, 0], ex: [0, 0.45, 0], name: 'U-tube salt bridge' });
    const wireBead = part(sbAsm, sphere(0.09, 14), { pal: 'red', tone: 'hi', pos: [0, 0.55, 0], name: 'Moving electron' });
    label('board', 'Salt bridge (ion balance)', () => V(28.0, 1.8, 0));
    label('board', 'External wire (e⁻ flow)', () => V(28.0, 2.35, 0));

    // Station 3 (x = 42): Driven Electrolysis & Faraday Law
    const dcAsm = asm('dc_power_supply', root, { title: 'DC power source (V_ext)', sub: 'Drives non-spontaneous redox' });
    dcAsm.position.set(42, 2.05, 0);
    part(dcAsm, box(0.95, 0.42, 0.45, 0.03), { pal: 'red', tone: 'hi', ex: [0, 0.45, 0], name: 'External DC supply' });

    const plAsm = asm('plated_cathode', root, { title: 'Electrolytic cell & plated cathode', sub: 'Mass ∝ I · t / F' });
    buildBeaker(plAsm, { r: 0.88, h: 1.55, liquidRatio: 0.72, liquidPal: 'blue', pos: [42, 0.1, 0], name: 'Electrolytic bath' });
    const farDeposit = part(plAsm, cyl(0.24, 0.9, 20), { pal: 'ochre', tone: 'lit', pos: [42.3, 0.85, 0], ex: [0.4, 0.3, 0], name: 'Deposited Cu(s) cathode' });
    label('board', 'DC source (I × t)', () => V(42, 2.55, 0));
    label('board', 'Plated cathode (Faraday)', () => V(42.8, 0.85, 0));

    return {
      labels,
      update(s) {
        const frac = Math.max(0.15, s.led.cuPlated / 6);
        cuCoat.scale.set(1 + frac * 0.3, frac, 1 + frac * 0.3);
        oxCol.scale.y = Math.max(0.2, frac * 1.3);
        redCol.scale.y = Math.max(0.2, frac * 1.3);
        const dir = s.cell.netDrivingV >= 0 ? 1 : -1;
        wireBead.position.x = (((s.t * 0.8 * dir) % 1 + 1) % 1 - 0.5) * 2.0;
        const mScale = 0.6 + (s.far.currentAmps / 5.0) * 0.7;
        farDeposit.scale.set(mScale, 1, mScale);
      },
    };
  },
};
