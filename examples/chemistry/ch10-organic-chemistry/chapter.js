import { SUBJECT } from '../subject.js';
import {
  THREE, shadeMat, part, box, cyl, sphere, rod, arrow3,
  buildMolecule3D, studioGrid, playTone, V
} from '@saxster/atlas/chem_kit.js';
import * as M from './model.js';

export const PAGES = [
  {
    tab: 'Carbon geometries',
    fig: 'Figure 10.1 · Carbon geometries: tetrahedral CH₄ (109.5°), planar C₂H₄ (120°), linear C₂H₂ (180°)',
    title: 'Carbon Catenation & Bond Order',
    alt: '3D comparison of tetrahedral sp3 methane, trigonal planar sp2 ethene with a double bond, and linear sp ethyne with a triple bond.',
    cam: { target: [0, 1.35, 0], az: 22, el: 20, dist: 11.6 },
    lit: 'ethene_sp2',
    parts: ['methane_sp3', 'ethene_sp2', 'ethyne_sp'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Alkane chains & bp',
    fig: 'Figure 10.2 · Homologous alkanes (CₙH₂ₙ₊₂): chain length, branching & boiling point',
    title: 'Alkane Homologues & Dispersion',
    alt: '3D linear n-butane and branched isobutane alongside boiling-point pillars for C1 to C8 alkanes.',
    cam: { target: [14, 1.25, 0], az: -20, el: 20, dist: 11.8 },
    lit: 'alkane_bp_bars',
    parts: ['butane_chain', 'alkane_bp_bars'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Constitutional isomers',
    fig: 'Figure 10.3 · C₂H₆O constitutional isomers: ethanol (+78.4 °C) vs dimethyl ether (−24.8 °C)',
    title: 'Same Formula, Different Connectivity',
    alt: '3D ball-and-stick comparison of ethanol (CH3CH2OH, capable of O-H hydrogen bonding) and dimethyl ether (CH3OCH3).',
    cam: { target: [28, 1.35, 0], az: 24, el: 20, dist: 11.6 },
    lit: 'ethanol_isomer',
    parts: ['ethanol_isomer', 'ether_isomer'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Functional groups & esters',
    fig: 'Figure 10.4 · Ester condensation: CH₃COOH + CH₃OH ⇌ CH₃COOCH₃ + H₂O',
    title: 'Functional Groups & Ester Condensation',
    alt: '3D ethanoic acid condensing with methanol to form methyl ethanoate ester plus eliminated water.',
    cam: { target: [42, 1.35, 0], az: 24, el: 20, dist: 11.8 },
    lit: 'carboxyl_acid',
    parts: ['carboxyl_acid', 'eliminated_water'],
    look: { xray: 0, section: 0 },
  },
];

export const PLATES = {
  methane_sp3: {
    text: 'Tetrahedral carbon (4 single σ bonds, 109.5°): single C–C bonds allow free rotation of attached groups at room temperature.',
  },
  ethene_sp2: {
    text: 'Trigonal planar alkene carbon (C=C double bond, 120°, IHD = 1): the side-by-side π overlap locks all 6 atoms of ethene into a rigid plane, enabling cis/trans stereoisomers.',
  },
  ethyne_sp: {
    text: 'Linear alkyne carbon (C≡C triple bond, 180°, IHD = 2): six shared electrons pull the two carbon nuclei closer (120 pm vs 154 pm for C–C).',
  },
  butane_chain: {
    text: 'Saturated hydrocarbon chain (CₙH₂ₙ₊₂): each additional –CH₂– methylene unit adds 14.03 g/mol and increases the molecular surface area available for London dispersion attractions.',
    facts: s => [['Alkane', `${s.alk.name} (${s.alk.formula})`], ['Molar mass', `${s.alk.molarMassG} g/mol`], ['Boiling pt', `${s.alk.bpC} °C (${s.alk.state25C})`]],
  },
  alkane_bp_bars: {
    text: 'Boiling-point staircase from C₁ to C₈: C₁–C₄ are gases at 25 °C, whereas C₅ (n-pentane, 36.1 °C) through C₈ (n-octane, 125.7 °C) are liquids.',
  },
  ethanol_isomer: {
    text: 'Ethanol (CH₃CH₂–OH, C₂H₆O): contains a polar hydroxyl (–OH) group that both donates and accepts intermolecular hydrogen bonds, raising its boiling point to +78.4 °C.',
    facts: s => [['Formula', s.iso.formula], ['Ethanol bp', `+${s.iso.ethanol.bpC} °C`]],
  },
  ether_isomer: {
    text: 'Dimethyl ether (CH₃–O–CH₃, C₂H₆O): exact same atom inventory (2 C, 6 H, 1 O), but all H atoms are bonded to C—no O–H bond, so it cannot hydrogen-bond with itself (bp −24.8 °C).',
    facts: s => [['Ether bp', `${s.iso.dimethylEther.bpC} °C`], ['ΔT_b', `${s.iso.deltaBpC} °C difference`]],
  },
  carboxyl_acid: {
    text: 'Carboxylic acid (–COOH, e.g. ethanoic acid): combines a polar C=O carbonyl and an acidic –OH group; reacts reversibly with an alcohol (–OH) under acid catalysis to form an ester (–COO–).',
  },
  eliminated_water: {
    text: 'Condensation water molecule (H₂O): esterification joins two organic fragments while splitting out one H₂O molecule (18.02 g/mol); removing water shifts equilibrium toward the ester.',
  },
};

export const CHAPTER = {
  subject: SUBJECT,
  no: 10,
  narrowZoom: 1.18,
  PAGES,
  PLATES,
  clock0: 0,
  cuts: true,
  xrayKeys: ['alkane_bp_bars'],
  cutKeys: ['alkane_bp_bars'],
  cutPlane: [0, 0, -1, 0.05],
  defaultParams: { carbonCount: 4, doubleBonds: 1 },
  controls: [
    { id: 'carbonCount', label: 'Alkane chain length n (CₙH₂ₙ₊₂)', min: 1, max: 8, step: 1, value: 4, unit: 'C atoms' },
    { id: 'doubleBonds', label: 'Degrees of unsaturation (IHD)', min: 0, max: 2, step: 1, value: 1, unit: 'π bonds' },
  ],
  lessons: {
    'carbon-catenation-geometries': { page: 0, params: { doubleBonds: 0 } },
    'functional-groups-polarity': { page: 2, params: {} },
    'alkane-chains-dispersion': { page: 1, params: { carbonCount: 5 } },
    'structural-isomers-connectivity': { page: 2, params: {} },
    'unsaturated-bonds-geometry': { page: 0, params: { doubleBonds: 1 } },
    'organic-acids-amines-esters': { page: 3, params: {} },
    'condensation-conditions': { page: 3, params: {} },
    's10-1': { page: 0, params: { doubleBonds: 0 } },
    's10-2': { page: 1, params: { carbonCount: 5 } },
    's10-3': { page: 2, params: {} },
    's10-4': { page: 0, params: { doubleBonds: 1 } },
    's10-5': { page: 2, params: {} },
    's10-6': { page: 3, params: {} },
    's10-7': { page: 3, params: {} },
  },
  sonify(ctx, s, page) {
    playTone(ctx, { freq: 200 + s.alk.n * 45, dur: 0.07, type: 'triangle', gain: 0.03 });
  },
  state(clock, reduced) {
    const p = CHAPTER.params || CHAPTER.defaultParams;
    const t = reduced ? 0 : clock;
    const alk = M.alkaneHomologueState(p.carbonCount);
    const ihd = M.degreeOfUnsaturation(2, 6 - 2 * (p.doubleBonds || 0));
    const iso = M.isomerComparisonC2H6O();
    return { t, alk, ihd, iso };
  },
  readout(s, page, pageIdx) {
    if (pageIdx === 0) {
      return `<b>Carbon Bonding Geometries</b> · Single bonds (CH₄): <b>109.5° tetrahedral</b> · Double bond (C₂H₄): <b>120° planar (locked)</b> · Triple bond (C₂H₂): <b>180° linear</b> (IHD = ${s.ihd.ihd}).`;
    }
    if (pageIdx === 1) {
      return `<b>Homologous Alkane: ${s.alk.name} (${s.alk.formula}, M = ${s.alk.molarMassG} g/mol)</b> · Boiling point = <b>${s.alk.bpC} °C</b> (${s.alk.state25C} at 25 °C).`;
    }
    if (pageIdx === 2) {
      return `<b>Constitutional Isomers (${s.iso.formula})</b> · Ethanol (CH₃CH₂OH, H-bonding): <b>+${s.iso.ethanol.bpC} °C</b> vs Dimethyl ether (CH₃OCH₃, no O–H bond): <b>${s.iso.dimethylEther.bpC} °C</b> (ΔT_b = ${s.iso.deltaBpC} °C).`;
    }
    return `<b>Carboxylic Acid & Ester Condensation</b> · CH₃COOH + HOR ⇌ CH₃COOR + H₂O · Functional groups govern acidity, hydrogen bonding, and condensation reactivity.`;
  },
  buildWorld(E) {
    const { scene, asm } = E;
    const root = new THREE.Group();
    scene.add(root);
    studioGrid(root, { x0: -4, x1: 48 });
    const labels = [];
    const label = (cls, html, at, opts = {}) => labels.push({ cls, html, at, ...opts });

    // Station 0 (x = 0): CH4 (sp3), C2H4 (sp2), C2H2 (sp)
    const sp3Asm = asm('methane_sp3', root, { title: 'Tetrahedral CH₄ (109.5°)', sub: '4 single σ bonds (sp³)' });
    buildMolecule3D(sp3Asm, 'CH4', { scale: 0.48, pos: [-1.3, 1.35, 0] });

    const sp2Asm = asm('ethene_sp2', root, { title: 'Planar Ethene C₂H₄ (120°)', sub: 'Rigid C=C double bond (sp²)' });
    buildMolecule3D(sp2Asm, 'C2H4', { scale: 0.48, pos: [0, 1.35, 0] });

    const spAsm = asm('ethyne_sp', root, { title: 'Linear Ethyne C₂H₂ (180°)', sub: 'C≡C triple bond (sp)' });
    buildMolecule3D(spAsm, 'C2H2', { scale: 0.48, pos: [1.35, 1.35, 0] });
    label('board', 'CH₄ (109.5°) · C₂H₄ (120°) · C₂H₂ (180°)', () => V(0, 2.35, 0));

    // Station 1 (x = 14): n-Butane vs Isobutane & Alkane Boiling Point Bars
    const butAsm = asm('butane_chain', root, { title: 'Linear n-Butane (−0.5 °C) vs branched Isobutane (−11.7 °C)', sub: 'Branching reduces contact area & dispersion' });
    buildMolecule3D(butAsm, 'nButane', { scale: 0.38, pos: [12.85, 1.65, 0] });
    buildMolecule3D(butAsm, 'isobutane', { scale: 0.38, pos: [12.85, 0.78, 0] });

    const bpAsm = asm('alkane_bp_bars', root, { title: 'C₁–C₈ alkane boiling points', sub: 'Rises with dispersion surface area' });
    bpAsm.position.set(15.0, 0.1, 0);
    const bpBars = [];
    for (let n = 1; n <= 8; n++) {
      const st = M.alkaneHomologueState(n);
      const h = ((st.bpC + 180) / 310) * 1.85;
      const m = part(bpAsm, box(0.18, h, 0.28, 0.02), { pal: st.bpC < 25 ? 'blue' : 'green', tone: 'hi', pos: [(n - 4.5) * 0.24, h / 2, 0], ex: [0.3, 0.2, 0], name: `${st.name} (${st.bpC} °C)` });
      bpBars.push({ mesh: m, n });
    }
    label('board', 'n-Butane vs Isobutane (C₄H₁₀)', () => V(12.85, 2.35, 0));
    label('board', 'Boiling point rises C₁ → C₈', () => V(15.0, 2.15, 0));

    // Station 2 (x = 28): Constitutional Isomers (Ethanol vs Dimethyl Ether)
    const ethAsm = asm('ethanol_isomer', root, { title: 'Ethanol (CH₃CH₂OH, +78.4 °C)', sub: 'Polar –OH forms hydrogen bonds' });
    buildMolecule3D(ethAsm, 'ethanol', { scale: 0.44, pos: [26.85, 1.58, 0] });
    buildMolecule3D(ethAsm, 'ethanol', { scale: 0.44, pos: [26.85, 0.85, 0.25] });
    const hbRod = rod(ethAsm, { r: 0.016, pal: 'blue', tone: 'hi', name: 'Intermolecular O–H···O hydrogen bond' });
    hbRod.set(V(27.2, 1.5, 0), V(27.2, 0.92, 0.2));

    const dmeAsm = asm('ether_isomer', root, { title: 'Dimethyl ether (CH₃OCH₃, −24.8 °C)', sub: 'Same C₂H₆O formula, no O–H bond' });
    buildMolecule3D(dmeAsm, 'dimethylEther', { scale: 0.48, pos: [29.1, 1.35, 0] });
    label('board', 'Ethanol (O–H H-bonded, +78.4 °C)', () => V(26.85, 2.28, 0));
    label('board', 'Dimethyl ether (no O–H, −24.8 °C)', () => V(29.1, 2.28, 0));

    // Station 3 (x = 42): Carboxylic Acid + Alcohol -> Ester + H2O
    const acdAsm = asm('carboxyl_acid', root, { title: 'Reactants: CH₃COOH + CH₃OH', sub: 'Carboxylic acid + alcohol' });
    buildMolecule3D(acdAsm, 'ethanoicAcid', { scale: 0.44, pos: [40.75, 1.62, 0] });
    buildMolecule3D(acdAsm, 'CH3OH', { scale: 0.44, pos: [40.75, 0.85, 0] });
    const condArr = arrow3(acdAsm, { r: 0.024, headR: 0.065, headL: 0.13, pal: 'ochre', tone: 'hi', name: 'Condensation equilibrium' });
    condArr.set(V(41.55, 1.25, 0), V(42.15, 1.25, 0));

    const watAsm = asm('eliminated_water', root, { title: 'Products: Methyl ethanoate + H₂O', sub: 'Ester linkage (–COO–) + eliminated water' });
    buildMolecule3D(watAsm, 'methylEthanoate', { scale: 0.44, pos: [43.05, 1.62, 0] });
    const condWater = buildMolecule3D(watAsm, 'H2O', { scale: 0.44, pos: [43.05, 0.85, 0] });
    label('board', 'CH₃COOH + CH₃OH', () => V(40.75, 2.32, 0));
    label('board', 'Ester (CH₃COOCH₃) + H₂O', () => V(43.05, 2.32, 0));

    return {
      labels,
      update(s) {
        for (const b of bpBars) {
          b.mesh.position.z = b.n === s.alk.n ? 0.25 : 0;
        }
        condWater.group.position.y = 0.85 + Math.sin(s.t * 2) * 0.08;
      },
    };
  },
};
