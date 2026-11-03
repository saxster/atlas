import { SUBJECT } from '../subject.js';
import {
  THREE, shadeMat, part, cyl, sphere, rod, arrow3,
  buildMolecule3D, buildBeaker, studioGrid, playTone, V
} from '@saxster/atlas/chem_kit.js';
import * as M from './model.js';

export const PAGES = [
  {
    tab: 'States & plateaus',
    fig: 'Solid, liquid, and gas particle arrangements and latent-heat phase plateaus',
    title: 'Three States & Heating Plateaus',
    alt: '3D comparison of vibrating solid lattice, tumbling liquid, and gas molecules alongside the 5-stage heating curve with live state marker.',
    cam: { target: [0, 1.25, 0], az: 22, el: 20, dist: 11.6 },
    lit: 'phase_chambers',
    parts: ['phase_chambers', 'heating_curve'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Gas piston (PV=nRT)',
    fig: '3D kinetic gas cylinder: piston volume, thermal speed v_rms, and wall pressure',
    title: 'Kinetic Gas Piston & Pressure',
    alt: '3D glass gas cylinder with movable piston compressing colliding gas molecules whose pressure scales as nRT/V.',
    cam: { target: [14, 1.3, 0], az: -20, el: 20, dist: 11.6 },
    lit: 'piston_head',
    parts: ['gas_cylinder', 'piston_head', 'gas_particles'],
    look: { xray: 0.2, section: 0 },
  },
  {
    tab: 'Aqueous hydration',
    fig: 'Ion–dipole hydration shells around dissolved Na⁺ and Cl⁻ ions',
    title: 'Dissolution & Hydration Shells',
    alt: '3D water molecules orienting oxygen (delta-) toward Na+ and hydrogens (delta+) toward Cl- in aqueous solution.',
    cam: { target: [28, 1.3, 0], az: 24, el: 20, dist: 11.6 },
    lit: 'hydration_shells',
    parts: ['solution_beaker', 'hydration_shells'],
    look: { xray: 0.25, section: 0 },
  },
  {
    tab: 'Ice H-bond cage',
    fig: 'Open tetrahedral hydrogen-bond network in hexagonal ice vs liquid water',
    title: 'Intermolecular Forces & Ice Density',
    alt: '3D tetrahedral hydrogen-bonded water cage showing why solid ice has open hexagonal channels and floats on liquid water.',
    cam: { target: [42, 1.3, 0], az: 26, el: 22, dist: 11.6 },
    lit: 'ice_cage',
    parts: ['ice_cage', 'hbond_bridges'],
    look: { xray: 0, section: 0 },
  },
];

export const PLATES = {
  phase_chambers: {
    text: 'Changing state rearranges spacing and motion between intact H₂O molecules without breaking covalent O–H bonds.',
    facts: s => [['Heat added', `${s.water.addedHeatJg} J/g`], ['Temperature', `${s.water.tempC.toFixed(1)} °C`], ['State', s.water.phase]],
  },
  heating_curve: {
    text: 'During the 0 °C melting (334 J/g) and 100 °C boiling (2260 J/g) plateaus, added energy overcomes intermolecular attractions rather than raising average kinetic energy.',
  },
  gas_cylinder: {
    text: 'Rigid-walled cylinder containing n = 0.10 mol of gas: macroscopic pressure arises from the momentum transferred by billions of elastic wall collisions.',
  },
  piston_head: {
    text: 'Movable piston head: pushing the piston down decreases volume V, crowding particles so wall collisions occur more frequently (P ∝ 1/V at constant T).',
    facts: s => [['Volume V', `${s.gas.volumeL.toFixed(1)} L`], ['Pressure P', `${s.gas.pressureAtm.toFixed(2)} atm`]],
  },
  gas_particles: {
    text: 'Gas molecules in rapid random motion: root-mean-square speed v_rms depends only on absolute temperature T and molar mass M.',
    facts: s => [['Temperature T', `${s.gas.tempK} K`], ['v_rms (N₂)', `${s.gas.vRmsMs.toFixed(0)} m/s`]],
  },
  solution_beaker: {
    text: 'Homogeneous aqueous solution: solute particles are dispersed uniformly without settling; diluting increases volume V while keeping solute amount n constant.',
    facts: s => [['Solute n', `${s.sol.soluteMol.toFixed(2)} mol`], ['Volume V', `${s.sol.volumeL.toFixed(1)} L`], ['Molarity M', `${s.sol.molarity.toFixed(2)} mol/L`]],
  },
  hydration_shells: {
    text: 'Ion–dipole hydration shells: polar water molecules orient their δ⁻ oxygen toward Na⁺ cations and their δ⁺ hydrogens toward Cl⁻ anions.',
  },
  ice_cage: {
    text: 'Hexagonal ice crystal: each H₂O molecule forms 4 directional hydrogen bonds in an open tetrahedral cage (~9% less dense than liquid water at 0 °C).',
  },
  hbond_bridges: {
    text: 'Intermolecular O–H···:O hydrogen bonds (~20 kJ/mol): ~20× weaker than covalent O–H bonds (463 kJ/mol), yet strong enough to give water its high boiling point.',
  },
};

export const CHAPTER = {
  subject: SUBJECT,
  no: 3,
  narrowZoom: 1.18,
  PAGES,
  PLATES,
  clock0: 0,
  cuts: true,
  xrayKeys: ['gas_cylinder', 'solution_beaker'],
  cutKeys: ['gas_cylinder', 'solution_beaker'],
  cutPlane: [0, 0, -1, 0.05],
  defaultParams: { heatJg: 600, volumeL: 2.0, gasTempK: 300 },
  controls: [
    { id: 'heatJg', label: 'Heat added to water', min: 0, max: 3100, step: 100, value: 600, unit: 'J/g' },
    { id: 'volumeL', label: 'Vessel volume V', min: 0.8, max: 4.0, step: 0.2, value: 2.0, unit: 'L' },
    { id: 'gasTempK', label: 'Gas temperature T', min: 200, max: 550, step: 25, value: 300, unit: 'K' },
  ],
  lessons: {
    'particle-states': { page: 0, params: { heatJg: 20 } },
    'temperature-motion': { page: 1, params: { volumeL: 2.4, gasTempK: 425 } },
    'phase-changes': { page: 0, params: { heatJg: 1400 } },
    'gas-pressure': { page: 1, params: { volumeL: 1.2, gasTempK: 300 } },
    'solutions-separation': { page: 2, params: { volumeL: 2.0 } },
    'intermolecular-forces-boiling': { page: 3, params: { heatJg: 1500 } },
    's3-1': { page: 0, params: { heatJg: 20 } },
    's3-2': { page: 1, params: { volumeL: 2.2, gasTempK: 400 } },
    's3-3': { page: 0, params: { heatJg: 1400 } },
    's3-4': { page: 1, params: { volumeL: 1.2, gasTempK: 300 } },
    's3-5': { page: 2, params: { volumeL: 2.0 } },
    's3-6': { page: 3, params: {} },
  },
  sonify(ctx, s, page) {
    if (page === 1) playTone(ctx, { freq: 180 + s.gas.pressureAtm * 110, dur: 0.06, type: 'sawtooth', gain: 0.03 });
    else playTone(ctx, { freq: 240 + Math.max(0, s.water.tempC) * 2.5, dur: 0.06, type: 'sine', gain: 0.03 });
  },
  state(clock, reduced) {
    const p = CHAPTER.params || CHAPTER.defaultParams;
    const t = reduced ? 0 : clock;
    const water = M.waterStateAtHeat(p.heatJg);
    const gas = M.idealGasPiston(p.volumeL, p.gasTempK, 0.10);
    const sol = M.solutionMolarity(0.50, p.volumeL);
    return { t, water, gas, sol };
  },
  readout(s, page, pageIdx) {
    if (pageIdx === 0) {
      return `<b>Heating Water (Q = ${s.water.addedHeatJg} J/g)</b> · Temperature = <b>${s.water.tempC.toFixed(1)} °C</b> · ${s.water.phase}.`;
    }
    if (pageIdx === 1) {
      return `<b>Ideal Gas Piston (n = 0.10 mol, V = ${s.gas.volumeL.toFixed(1)} L, T = ${s.gas.tempK} K)</b> · Pressure P = <b>${s.gas.pressureAtm.toFixed(2)} atm</b> · v_rms = <b>${s.gas.vRmsMs.toFixed(0)} m/s</b>.`;
    }
    if (pageIdx === 2) {
      return `<b>Aqueous Solution & Hydration</b> · Water dipoles orient around Na⁺ and Cl⁻ ions · Concentration for 0.50 mol in ${s.sol.volumeL.toFixed(1)} L = <b>${s.sol.molarity.toFixed(2)} mol/L</b>.`;
    }
    return `<b>Hydrogen Bonding in Ice & Water</b> · Each H₂O forms up to 4 tetrahedral O–H···O hydrogen bonds (~20 kJ/mol), holding solid ice in an open cage that floats.`;
  },
  buildWorld(E) {
    const { scene, asm } = E;
    const root = new THREE.Group();
    scene.add(root);
    studioGrid(root, { x0: -4, x1: 48 });
    const labels = [];
    const label = (cls, html, at, opts = {}) => labels.push({ cls, html, at, ...opts });

    // Station 0 (x = 0): Solid, Liquid, Gas & 5-Segment Heating Curve
    const chAsm = asm('phase_chambers', root, { title: 'Solid, liquid & gas states', sub: 'Same H₂O molecules, different spacing' });
    chAsm.position.set(-0.75, 1.2, 0);
    const phaseBeads = [];
    for (let i = 0; i < 9; i++) {
      const m = buildMolecule3D(chAsm, 'H2O', { scale: 0.28, pos: [((i % 3) - 1) * 0.45, (Math.floor(i / 3) - 1) * 0.45, 0] });
      phaseBeads.push({ group: m.group, ix: (i % 3) - 1, iy: Math.floor(i / 3) - 1, i });
    }

    const heatAsm = asm('heating_curve', root, { title: '5-stage heating curve T(Q)', sub: '0 °C melt (334 J/g) & 100 °C boil (2260 J/g)' });
    heatAsm.position.set(1.15, 0.35, 0);
    const qToX = q => {
      if (q <= 42) return -1.0 + (q / 42) * 0.18;
      if (q <= 376) return -0.82 + ((q - 42) / 334) * 0.42;
      if (q <= 794) return -0.40 + ((q - 376) / 418) * 0.48;
      if (q <= 3054) return 0.08 + ((q - 794) / 2260) * 0.82;
      return 0.90 + ((q - 3054) / 146) * 0.18;
    };
    const tToY = tc => ((tc + 20) / 150) * 1.65;
    const knots = [
      [0, -20],
      [42, 0],
      [376, 0],
      [794, 100],
      [3054, 100],
      [3200, 130],
    ];
    for (let i = 0; i < knots.length - 1; i++) {
      const isPlateau = knots[i][1] === knots[i + 1][1];
      const seg = rod(heatAsm, { r: 0.032, pal: isPlateau ? 'ochre' : 'blue', tone: 'hi', name: isPlateau ? 'Latent-heat plateau' : 'Sensible warming slope' });
      seg.set(V(qToX(knots[i][0]), tToY(knots[i][1]), 0), V(qToX(knots[i + 1][0]), tToY(knots[i + 1][1]), 0));
    }
    const heatBead = part(heatAsm, sphere(0.095, 18), { pal: 'red', tone: 'hi', pos: [qToX(600), tToY(53.6), 0.04], name: 'Current (Q, T) state' });
    label('board', 'H₂O particle spacing', () => V(-0.75, 2.22, 0));
    label('board', '0 °C & 100 °C plateaus', () => V(1.15, 2.25, 0));

    // Station 1 (x = 14): Kinetic Gas Piston + Live Pressure Vector
    const cylAsm = asm('gas_cylinder', root, { title: 'Gas cylinder vessel', sub: 'Confines n = 0.10 mol gas' });
    cylAsm.position.set(14, 0.1, 0);
    part(cylAsm, cyl(0.95, 2.3, 28, true), { pal: 'paper', tone: 'hi', pos: [0, 1.15, 0], mat: shadeMat('paper', { opacity: 0.28 }), ex: [0, 0, 0.45], name: 'Cylinder wall' });

    const pisAsm = asm('piston_head', root, { title: 'Movable piston head', sub: 'Compresses gas volume V' });
    pisAsm.position.set(14, 1.6, 0);
    const pistonHead = part(pisAsm, cyl(0.91, 0.18, 28), { pal: 'ochre', tone: 'hi', ex: [0, 0.55, 0], name: 'Piston disc' });
    const pistonRod = part(pisAsm, cyl(0.12, 0.9, 16), { pal: 'dark', tone: 'mid', pos: [0, 0.5, 0], ex: [0, 0.65, 0], name: 'Piston shaft' });
    const pArrow = arrow3(pisAsm, { r: 0.032, headR: 0.085, headL: 0.16, pal: 'red', name: 'Upward gas pressure vector P' });

    const gasAsm = asm('gas_particles', root, { title: 'Colliding gas molecules', sub: 'Elastic momentum transfer' });
    gasAsm.position.set(14, 0.15, 0);
    const gasMols = [];
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const m = part(gasAsm, sphere(0.1, 14), { pal: 'red', tone: 'hi', pos: [Math.cos(a) * 0.5, 0.2 + (i / 10) * 1.1, Math.sin(a) * 0.5], ex: [Math.cos(a) * 0.4, 0, Math.sin(a) * 0.4], name: `Gas molecule ${i + 1}` });
      gasMols.push({ mesh: m, a, i });
    }
    label('board', 'Movable piston (V)', () => V(14, 2.58, 0));
    label('board', 'Wall collisions → P', () => V(15.2, 0.95, 0));

    // Station 2 (x = 28): Aqueous Hydration Shells + Dilution Meniscus
    const solAsm = asm('solution_beaker', root, { title: 'Aqueous solution vessel', sub: 'Dissolved electrolyte (M = n / V)' });
    const solBeaker = buildBeaker(solAsm, { r: 1.05, h: 1.85, liquidRatio: 0.72, liquidPal: 'blue', pos: [28, 0.1, 0], name: 'Solution beaker' });

    const hydAsm = asm('hydration_shells', root, { title: 'Ion–dipole hydration shells', sub: 'δ⁻ O toward Na⁺, δ⁺ H toward Cl⁻' });
    hydAsm.position.set(28, 1.0, 0);
    part(hydAsm, sphere(0.18, 18), { pal: 'blue', tone: 'lit', pos: [-0.44, 0, 0], ex: [-0.4, 0.3, 0], name: 'Hydrated Na⁺ ion' });
    part(hydAsm, sphere(0.22, 18), { pal: 'green', tone: 'hi', pos: [0.44, 0, 0], ex: [0.4, 0.3, 0], name: 'Hydrated Cl⁻ ion' });
    for (let k = 0; k < 4; k++) {
      const a = (k * Math.PI) / 2;
      buildMolecule3D(hydAsm, 'H2O', { scale: 0.24, pos: [-0.44 + Math.cos(a) * 0.38, Math.sin(a) * 0.38, 0], rot: [0, 0, a] });
      buildMolecule3D(hydAsm, 'H2O', { scale: 0.24, pos: [0.44 + Math.cos(a) * 0.42, Math.sin(a) * 0.42, 0], rot: [0, 0, a + Math.PI] });
    }
    label('board', 'Na⁺ hydration shell', () => V(27.25, 2.02, 0));
    label('board', 'Cl⁻ hydration shell', () => V(28.75, 2.02, 0));

    // Station 3 (x = 42): Open Tetrahedral Ice Cage
    const iceAsm = asm('ice_cage', root, { title: 'Tetrahedral ice H₂O network', sub: 'Open hexagonal channels' });
    iceAsm.position.set(42, 1.3, 0);
    const icePts = [
      [0, 0, 0],
      [0, 0.75, 0],
      [0.68, -0.25, 0],
      [-0.34, -0.25, 0.59],
      [-0.34, -0.25, -0.59],
    ];
    for (const pt of icePts) {
      buildMolecule3D(iceAsm, 'H2O', { scale: 0.34, pos: pt });
    }
    const hbAsm = asm('hbond_bridges', root, { title: 'Directional H-bond bridges', sub: 'O–H···:O intermolecular links' });
    hbAsm.position.set(42, 1.3, 0);
    for (let i = 1; i < icePts.length; i++) {
      const r = rod(hbAsm, { r: 0.02, pal: 'ochre', tone: 'lit', name: 'Hydrogen bond (~20 kJ/mol)' });
      r.set(V(...icePts[0]), V(...icePts[i]));
    }
    label('board', 'Central tetrahedral H₂O', () => V(42, 2.35, 0));
    label('board', '4 H-bond bridges (~20 kJ/mol)', () => V(42.9, 0.85, 0));

    return {
      labels,
      update(s) {
        // Phase spacing & motion + live marker along 5-segment heating curve
        const spread = s.water.addedHeatJg < 300 ? 0.38 : s.water.addedHeatJg < 1200 ? 0.52 : 0.85;
        const jiggle = s.water.addedHeatJg < 300 ? 0.02 : s.water.addedHeatJg < 1200 ? 0.08 : 0.22;
        for (const b of phaseBeads) {
          b.group.position.set(
            b.ix * spread + Math.sin(s.t * 3 + b.i) * jiggle,
            b.iy * spread + Math.cos(s.t * 2.5 + b.i) * jiggle,
            Math.sin(s.t * 2 + b.i) * jiggle
          );
        }
        heatBead.position.set(qToX(s.water.addedHeatJg), tToY(s.water.tempC), 0.04);

        // Gas piston height, upward pressure vector & molecular speed
        const hPiston = 0.55 + (s.gas.volumeL / 4.0) * 1.45;
        pistonHead.position.y = hPiston - 1.45;
        pistonRod.position.y = hPiston - 0.95;
        const pLen = Math.min(0.95, 0.18 + s.gas.pressureAtm * 0.15);
        pArrow.set(V(0.48, hPiston - 1.45, 0), V(0.48, hPiston - 1.45 + pLen, 0));
        const vFactor = s.gas.tempK / 300;
        for (const g of gasMols) {
          const yFrac = 0.15 + 0.78 * Math.abs(Math.sin(s.t * 1.8 * vFactor + g.i * 0.7));
          const rFrac = 0.55 * Math.cos(s.t * 1.4 * vFactor + g.a);
          g.mesh.position.set(Math.cos(g.a) * rFrac, yFrac * hPiston, Math.sin(g.a) * rFrac);
        }

        // Solution beaker meniscus level tracks volumeL
        solBeaker.setLevel(0.28 + (s.sol.volumeL / 4.0) * 0.62);
      },
    };
  },
};
