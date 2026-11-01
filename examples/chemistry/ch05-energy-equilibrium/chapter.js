import { SUBJECT } from '../subject.js';
import {
  THREE, shadeMat, part, box, cyl, sphere, rod, arrow3,
  buildMolecule3D, studioGrid, playTone, V
} from '@saxster/atlas/chem_kit.js';
import * as M from './model.js';

export const PAGES = [
  {
    tab: 'Bond energy ledger',
    fig: 'Figure 5.1 · Enthalpy ledger: endothermic bond-breaking cost (+1370 kJ) vs exothermic bond-making payback (−1852 kJ)',
    title: 'Bond-Breaking vs Bond-Making',
    alt: '3D enthalpy columns comparing the energy required to break reactant bonds with the energy released forming product bonds.',
    cam: { target: [0, 1.35, 0], az: 22, el: 20, dist: 6.8 },
    lit: 'bond_payback_col',
    parts: ['bond_cost_col', 'bond_payback_col'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Activation barrier & catalyst',
    fig: 'Figure 5.2 · Reaction coordinate profile: uncatalyzed Ea barrier vs lower-energy catalytic pathway',
    title: 'Activation Barrier & Catalysis',
    alt: '3D reaction coordinate arch showing the high uncatalyzed transition-state barrier versus the lower catalytic pathway.',
    cam: { target: [14, 1.35, 0], az: -20, el: 20, dist: 7.0 },
    lit: 'catalyst_arch',
    parts: ['uncat_arch', 'catalyst_arch', 'transition_complex'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Collision & orientation',
    fig: 'Figure 5.3 · Molecular collisions: why reactive collisions require both E ≥ Ea and proper 3D orientation',
    title: 'Collision Energy & Orientation',
    alt: '3D colliding reactant molecules showing productive aligned collision versus unproductive glancing bounce.',
    cam: { target: [28, 1.35, 0], az: 24, el: 20, dist: 6.8 },
    lit: 'aligned_pair',
    parts: ['aligned_pair', 'misaligned_pair'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Dynamic equilibrium',
    fig: 'Figure 5.4 · Reversible dynamic equilibrium (A ⇌ B): matched opposing rates & Le Châtelier shifts',
    title: 'Dynamic Equilibrium & Le Châtelier',
    alt: '3D two-chamber equilibrium vessel with equal forward and reverse flux arrows and equilibrium concentration pillars.',
    cam: { target: [42, 1.35, 0], az: 24, el: 20, dist: 7.0 },
    lit: 'eq_pillars',
    parts: ['eq_pillars', 'rate_arrows'],
    look: { xray: 0.15, section: 0 },
  },
];

export const PLATES = {
  bond_cost_col: {
    text: 'Bond-breaking column (always endothermic, +ΔH): energy must be supplied to pull bonded atoms apart to separated atoms at the top of the potential well.',
    facts: s => [['Bonds broken', `+${s.led.brokenKj} kJ/mol`]],
  },
  bond_payback_col: {
    text: 'Bond-making column (always exothermic, −ΔH): energy is released when separated atoms fall into new covalent potential wells; net ΔH = broken − formed.',
    facts: s => [['Bonds formed', `−${s.led.formedKj} kJ/mol`], ['Net ΔH', `${s.led.deltaHKj} kJ/mol`]],
  },
  uncat_arch: {
    text: 'Uncatalyzed reaction pathway: reactants must climb the full activation barrier Ea to reach the distorted transition state before forming products.',
    facts: s => [['Uncatalyzed Ea', `${s.arr.rawEa} kJ/mol`]],
  },
  catalyst_arch: {
    text: 'Catalyzed pathway: provides an alternative mechanism with a lower activation barrier Ea,cat, increasing both forward and reverse rates without changing net ΔH.',
    facts: s => [['Effective Ea', `${s.arr.effectiveEa.toFixed(1)} kJ/mol`], ['Relative rate', `${s.arr.relativeRate.toFixed(1)}×`]],
  },
  transition_complex: {
    text: 'Activated transition-state complex (‡): partial bonds are simultaneously stretching and forming at the saddle point of the potential energy surface.',
  },
  aligned_pair: {
    text: 'Productive collision geometry: reacting atoms strike with both sufficient kinetic energy (E ≥ Ea) and the sterically required 3D bond axis alignment.',
  },
  misaligned_pair: {
    text: 'Ineffective collision geometry: even fast molecules bounce apart unchanged if the reactive lobes do not meet in the required orientation.',
  },
  eq_pillars: {
    text: 'Macroscopic equilibrium concentrations [A]eq and [B]eq: remain constant once the system reaches dynamic balance, with ratio [B]eq/[A]eq = Keq = kf/kr.',
    facts: s => [['Keq = kf/kr', `${s.eq.Keq.toFixed(2)}`], ['[A]eq : [B]eq', `${(s.eq.aEq * 100).toFixed(0)}% : ${(s.eq.bEq * 100).toFixed(0)}%`]],
  },
  rate_arrows: {
    text: 'Opposing microscopic fluxes: at dynamic equilibrium, forward and reverse reactions continue ceaselessly at equal rates (rf = rr > 0).',
    facts: s => [['Forward rate rf', `${s.eq.forwardRateEq.toFixed(2)} s⁻¹`], ['Reverse rate rr', `${s.eq.reverseRateEq.toFixed(2)} s⁻¹`]],
  },
};

export const CHAPTER = {
  subject: SUBJECT,
  no: 5,
  PAGES,
  PLATES,
  clock0: 0,
  cuts: true,
  xrayKeys: ['uncat_arch', 'eq_pillars'],
  cutKeys: ['uncat_arch', 'eq_pillars'],
  cutPlane: [0, 0, -1, 0.05],
  defaultParams: { eaKj: 75, tempK: 298, kfRatio: 2.0 },
  controls: [
    { id: 'eaKj', label: 'Activation energy barrier Ea', min: 35, max: 110, step: 5, value: 75, unit: 'kJ/mol' },
    { id: 'tempK', label: 'Reaction temperature T', min: 270, max: 450, step: 15, value: 298, unit: 'K' },
    { id: 'kfRatio', label: 'Equilibrium constant Keq = kf/kr', min: 0.25, max: 4.0, step: 0.25, value: 2.0, unit: 'ratio' },
  ],
  lessons: {
    'energy-transfer': { page: 0, params: {} },
    'bond-energy-ledger': { page: 0, params: {} },
    'energy-barriers': { page: 1, params: { eaKj: 85, tempK: 298 } },
    'rate-from-data': { page: 2, params: { tempK: 330 } },
    'reaction-rates': { page: 2, params: { tempK: 360 } },
    'catalysts': { page: 1, params: { eaKj: 45, tempK: 298 } },
    'dynamic-equilibrium': { page: 3, params: { kfRatio: 1.5 } },
    'le-chatelier-perturbations': { page: 3, params: { kfRatio: 3.0 } },
    's5-1': { page: 0, params: {} },
    's5-2': { page: 1, params: { eaKj: 80 } },
    's5-3': { page: 2, params: { tempK: 330 } },
    's5-4': { page: 2, params: { tempK: 360 } },
    's5-5': { page: 1, params: { eaKj: 45 } },
    's5-6': { page: 3, params: { kfRatio: 1.5 } },
    's5-7': { page: 3, params: { kfRatio: 3.0 } },
  },
  sonify(ctx, s, page) {
    if (page === 1) playTone(ctx, { freq: 520 - s.arr.effectiveEa * 2.5, dur: 0.07, type: 'triangle', gain: 0.03 });
    else if (page === 3) playTone(ctx, { freq: 240 + s.eq.Keq * 85, dur: 0.07, type: 'sine', gain: 0.03 });
    else playTone(ctx, { freq: 310, dur: 0.06, type: 'sine', gain: 0.03 });
  },
  state(clock, reduced) {
    const p = CHAPTER.params || CHAPTER.defaultParams;
    const t = reduced ? 0 : clock;
    const led = M.bondEnthalpyLedger(1370, 1852);
    const arr = M.arrheniusBarrier(p.eaKj, p.tempK, p.eaKj <= 55);
    const eq = M.dynamicEquilibriumState(p.kfRatio, 1.0, 1.0, 0.0);
    return { t, led, arr, eq };
  },
  readout(s, page, pageIdx) {
    if (pageIdx === 0) {
      return `<b>Bond-Enthalpy Ledger (2 H₂ + O₂ → 2 H₂O)</b> · Break cost = <b>+${s.led.brokenKj} kJ/mol</b> · Form payback = <b>−${s.led.formedKj} kJ/mol</b> → Net ΔH = <b>${s.led.deltaHKj} kJ/mol</b> (${s.led.classification}).`;
    }
    if (pageIdx === 1) {
      return `<b>Activation Barrier (Ea = ${s.arr.rawEa} kJ/mol, T = ${s.arr.tempK} K)</b> · Relative rate = <b>${s.arr.relativeRate.toFixed(1)}×</b> · Lowering Ea via a catalyst accelerates both directions without altering ΔH.`;
    }
    if (pageIdx === 2) {
      return `<b>Collision Theory (T = ${s.arr.tempK} K)</b> · Only collisions with kinetic energy E ≥ Ea AND proper 3D molecular alignment cross the transition state.`;
    }
    return `<b>Dynamic Equilibrium (Keq = ${s.eq.Keq.toFixed(2)})</b> · [A]eq = <b>${(s.eq.aEq * 100).toFixed(0)}%</b>, [B]eq = <b>${(s.eq.bEq * 100).toFixed(0)}%</b> · Forward rate rf = Reverse rate rr = <b>${s.eq.forwardRateEq.toFixed(2)} s⁻¹</b>.`;
  },
  buildWorld(E) {
    const { scene, asm } = E;
    const root = new THREE.Group();
    scene.add(root);
    studioGrid(root, { x0: -4, x1: 48 });
    const labels = [];
    const label = (cls, html, at, opts = {}) => labels.push({ cls, html, at, ...opts });

    // Station 0 (x = 0): Bond-Breaking vs Bond-Making Ledger
    const costAsm = asm('bond_cost_col', root, { title: 'Endothermic bond-breaking (+1370 kJ)', sub: 'Input required to separate atoms' });
    costAsm.position.set(-0.65, 0.1, 0);
    part(costAsm, box(0.65, 1.45, 0.65, 0.03), { pal: 'red', tone: 'hi', pos: [0, 0.725, 0], ex: [-0.45, 0.3, 0], name: 'Bond-breaking cost (+1370 kJ/mol)' });

    const payAsm = asm('bond_payback_col', root, { title: 'Exothermic bond-making (−1852 kJ)', sub: 'Released forming 4 O–H bonds' });
    payAsm.position.set(0.65, 0.1, 0);
    part(payAsm, box(0.65, 1.95, 0.65, 0.03), { pal: 'green', tone: 'hi', pos: [0, 0.975, 0], ex: [0.45, 0.3, 0], name: 'Bond-making payback (−1852 kJ/mol)' });
    label('board', 'Break bonds (+1370 kJ)', () => V(-0.65, 1.85, 0));
    label('board', 'Make bonds (−1852 kJ)', () => V(0.65, 2.35, 0));

    // Station 1 (x = 14): Activation Energy Arch & Catalyst Pathway
    const uncatAsm = asm('uncat_arch', root, { title: 'Uncatalyzed energy barrier (Ea)', sub: 'High transition-state saddle' });
    uncatAsm.position.set(14, 0.2, 0);
    const uncatArch = [];
    for (let i = 0; i < 9; i++) {
      const u = i / 8;
      const y = 0.6 + Math.sin(u * Math.PI) * 1.45 - u * 0.35;
      const m = part(uncatAsm, sphere(0.11, 14), { pal: 'red', tone: 'hi', pos: [(u - 0.5) * 2.4, y, -0.25], ex: [0, 0.45, -0.3], name: 'Uncatalyzed profile point' });
      uncatArch.push({ mesh: m, u });
    }

    const catAsm = asm('catalyst_arch', root, { title: 'Catalyzed pathway (Ea,cat)', sub: 'Lower barrier, identical ΔH' });
    catAsm.position.set(14, 0.2, 0);
    for (let i = 0; i < 9; i++) {
      const u = i / 8;
      const y = 0.6 + Math.sin(u * Math.PI) * 0.72 - u * 0.35;
      part(catAsm, sphere(0.11, 14), { pal: 'green', tone: 'lit', pos: [(u - 0.5) * 2.4, y, 0.25], ex: [0, -0.25, 0.35], name: 'Catalyzed profile point' });
    }

    const tsAsm = asm('transition_complex', root, { title: 'Activated transition state (‡)', sub: 'Partial bonds breaking & forming' });
    tsAsm.position.set(14, 2.15, -0.25);
    const tsMesh = part(tsAsm, sphere(0.24, 18), { pal: 'ochre', tone: 'lit', ex: [0, 0.5, 0], name: 'Transition state complex ‡' });
    label('board', 'Uncatalyzed Ea peak (‡)', () => V(14, 2.55, -0.25));
    label('board', 'Catalyzed low-barrier path', () => V(14, 1.35, 0.45));

    // Station 2 (x = 28): Collision Energy & Orientation
    const alAsm = asm('aligned_pair', root, { title: 'Aligned reactive collision', sub: 'Correct steric orientation + E ≥ Ea' });
    alAsm.position.set(28, 1.65, 0);
    const colA = buildMolecule3D(alAsm, 'HCl', { scale: 0.45, pos: [-0.55, 0, 0] });
    const colB = buildMolecule3D(alAsm, 'OH_minus', { scale: 0.45, pos: [0.55, 0, 0] });

    const misAsm = asm('misaligned_pair', root, { title: 'Misaligned glancing collision', sub: 'Bounces off without reacting' });
    misAsm.position.set(28, 0.75, 0);
    buildMolecule3D(misAsm, 'HCl', { scale: 0.45, pos: [-0.55, 0, 0], rot: [0, 0, 1.57] });
    buildMolecule3D(misAsm, 'OH_minus', { scale: 0.45, pos: [0.55, 0, 0], rot: [0, 0, -1.2] });
    label('board', 'Aligned collision → reacts', () => V(28, 2.2, 0));
    label('board', 'Misaligned → bounces', () => V(28, 0.35, 0.6));

    // Station 3 (x = 42): Reversible Dynamic Equilibrium
    const eqAsm = asm('eq_pillars', root, { title: 'Equilibrium concentrations [A]eq & [B]eq', sub: 'Ratio [B]/[A] = Keq' });
    eqAsm.position.set(42, 0.1, 0);
    const barA = part(eqAsm, box(0.65, 1.2, 0.65, 0.03), { pal: 'blue', tone: 'hi', pos: [-0.85, 0.6, 0], ex: [-0.45, 0.3, 0], name: 'Reactant [A]eq reservoir' });
    const barB = part(eqAsm, box(0.65, 1.2, 0.65, 0.03), { pal: 'green', tone: 'hi', pos: [0.85, 0.6, 0], ex: [0.45, 0.3, 0], name: 'Product [B]eq reservoir' });

    const arrAsm = asm('rate_arrows', root, { title: 'Equal opposing rates (rf = rr)', sub: 'Dynamic microscopic exchange' });
    arrAsm.position.set(42, 1.25, 0);
    const fwdArr = arrow3(arrAsm, { r: 0.032, headR: 0.08, headL: 0.16, pal: 'ochre', tone: 'lit', name: 'Forward rate rf = kf[A]' });
    fwdArr.set(V(-0.4, 0.18, 0), V(0.4, 0.18, 0));
    const revArr = arrow3(arrAsm, { r: 0.032, headR: 0.08, headL: 0.16, pal: 'ochre', tone: 'mid', name: 'Reverse rate rr = kr[B]' });
    revArr.set(V(0.4, -0.18, 0), V(-0.4, -0.18, 0));
    label('board', 'rf = rr (dynamic balance)', () => V(42, 1.85, 0));
    label('board', '[A]eq vs [B]eq', () => V(42, 2.35, 0));

    return {
      labels,
      update(s) {
        const peakH = (s.arr.rawEa / 75) * 1.45;
        for (const pt of uncatArch) {
          pt.mesh.position.y = 0.6 + Math.sin(pt.u * Math.PI) * peakH - pt.u * 0.35;
        }
        tsMesh.position.y = 0.8 + peakH;
        const osc = Math.abs(Math.sin(s.t * 2.2)) * 0.38;
        colA.group.position.x = -0.65 + osc;
        colB.group.position.x = 0.65 - osc;
        const hA = Math.max(0.25, s.eq.aEq * 2.0);
        const hB = Math.max(0.25, s.eq.bEq * 2.0);
        barA.scale.y = hA / 1.2;
        barA.position.y = hA / 2;
        barB.scale.y = hB / 1.2;
        barB.position.y = hB / 2;
      },
    };
  },
};
