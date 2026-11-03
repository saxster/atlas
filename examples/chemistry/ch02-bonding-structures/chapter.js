import { SUBJECT } from '../subject.js';
import {
  THREE, shadeMat, part, box, sphere, rod, arrow3,
  buildMolecule3D, buildCrystalLattice, buildCurveTube, studioGrid, playTone, V
} from '@saxster/atlas/chem_kit.js';
import * as M from './model.js';

export const PAGES = [
  {
    tab: 'Covalent bond well',
    fig: 'H₂ internuclear potential energy curve V(r) and shared electron density',
    title: 'Covalent Bond Potential Well',
    alt: '3D continuous Morse potential curve with a live state marker and two hydrogen atoms whose shared electron cloud settles at the 74 pm, -436 kJ/mol minimum.',
    cam: { target: [0, 1.25, 0], az: 20, el: 20, dist: 11.4 },
    lit: 'h2_pair',
    parts: ['h2_pair', 'morse_curve'],
    look: { xray: 0.2, section: 0 },
  },
  {
    tab: 'NaCl ionic lattice',
    fig: 'Extended 3D NaCl crystal lattice (6:6 coordination) and Born–Haber energy ledger',
    title: 'Ionic Lattice vs Formula Unit',
    alt: '3D cubic rock-salt lattice of alternating Na+ and Cl- ions alongside the 3-step Born-Haber energy ledger.',
    cam: { target: [14, 1.3, 0], az: 26, el: 22, dist: 11.6 },
    lit: 'nacl_lattice',
    parts: ['nacl_lattice', 'born_haber_bars'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Diamond vs graphite',
    fig: 'Carbon allotropes: 3D tetrahedral diamond network vs layered sp² graphite sheets',
    title: 'Structure Governs Properties',
    alt: '3D comparison of a rigid 17-carbon tetrahedral diamond network and sliding hexagonal graphite sheets with delocalized electrons.',
    cam: { target: [28, 1.3, 0], az: -22, el: 20, dist: 11.8 },
    lit: 'graphite_sheets',
    parts: ['diamond_cage', 'graphite_sheets'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'VSEPR & dipoles',
    fig: '3D molecular geometry and vector bond-dipole addition (H₂O vs CO₂ vs CH₄)',
    title: 'VSEPR Shapes & Molecular Dipoles',
    alt: '3D bent H2O with individual bond dipoles adding into a net dipole arrow, contrasted against linear symmetric CO2 where opposing C=O bond dipoles cancel.',
    cam: { target: [42, 1.3, 0], az: 20, el: 20, dist: 11.8 },
    lit: 'polar_h2o',
    parts: ['polar_h2o', 'nonpolar_co2', 'tetra_ch4'],
    look: { xray: 0.15, section: 0 },
  },
];

export const PLATES = {
  h2_pair: {
    text: 'Two hydrogen nuclei sharing an electron pair: at r₀ = 74 pm, nuclear–electron attractions balance nuclear–nuclear and electron–electron repulsions.',
    facts: s => [['Distance r', `${s.morse.rPm} pm`], ['Potential V(r)', `${s.morse.energyKj.toFixed(0)} kJ/mol`], ['Regime', s.morse.regime]],
  },
  morse_curve: {
    text: 'Morse potential energy well: breaking the bond from r₀ = 74 pm requires +436 kJ/mol of energy input; forming the bond releases 436 kJ/mol to the surroundings.',
  },
  nacl_lattice: {
    text: 'Continuous 3D NaCl ionic lattice: there are no discrete NaCl molecules—each interior Na⁺ is surrounded octahedrally by 6 Cl⁻ neighbours and vice versa.',
    facts: s => [['Coordination', '6 : 6 octahedral'], ['Formula unit', '1 Na⁺ : 1 Cl⁻ ratio']],
  },
  born_haber_bars: {
    text: 'Born–Haber thermodynamic ledger: removing an electron from Na costs +496 kJ/mol and Cl gains −349 kJ/mol (net +147 kJ/mol uphill); only 3D lattice assembly (−787 kJ/mol) makes salt formation exothermic (−640 kJ/mol).',
    facts: s => [['Step', `${s.bh.step} / 3`], ['System enthalpy', `${s.bh.levelKj} kJ/mol`]],
  },
  diamond_cage: {
    text: 'Diamond allotrope: every carbon atom is sp³-bonded to 4 carbon neighbours at 109.5° (154 pm) in a continuous 3D covalent network—extremely hard and an electrical insulator.',
  },
  graphite_sheets: {
    text: 'Graphite allotrope: planar sp² hexagonal carbon rings (120°, 142 pm) with delocalized π electrons that conduct electricity along sheets, while weak interlayer forces (335 pm) let layers slide.',
  },
  polar_h2o: {
    text: 'Bent H₂O molecule (104.5°): two lone pairs compress the H–O–H angle so the two polar O←H bond vectors add upward into a strong net molecular dipole (1.85 D).',
    facts: s => [['ΔEN', `${s.pol.deltaEn.toFixed(2)}`], ['Bond type', s.pol.bondClassification], ['Net μ (bent)', `${s.pol.netDipoleDebye} D`]],
  },
  nonpolar_co2: {
    text: 'Linear CO₂ molecule (180°): each C=O bond is polar (ΔEN = 0.89), but the two equal bond dipoles point in opposite directions and cancel to zero net dipole.',
  },
  tetra_ch4: {
    text: 'Tetrahedral CH₄ molecule (109.5°): four bonding pairs repel equally to the alternate corners of a cube, yielding a symmetric non-polar molecule.',
  },
};

export const CHAPTER = {
  subject: SUBJECT,
  no: 2,
  narrowZoom: 1.18,
  PAGES,
  PLATES,
  clock0: 0,
  cuts: true,
  xrayKeys: ['h2_pair', 'nacl_lattice'],
  cutKeys: ['h2_pair', 'nacl_lattice'],
  cutPlane: [0, 0, -1, 0.05],
  defaultParams: { bondPm: 74, bhStep: 3, deltaEn: 1.24 },
  controls: [
    { id: 'bondPm', label: 'Internuclear distance r', min: 45, max: 220, step: 5, value: 74, unit: 'pm' },
    { id: 'bhStep', label: 'Born–Haber energy step', min: 0, max: 3, step: 1, value: 3, unit: 'step' },
    { id: 'deltaEn', label: 'Electronegativity difference ΔEN', min: 0, max: 2.5, step: 0.1, value: 1.2, unit: 'Pauling' },
  ],
  lessons: {
    'classify-matter': { page: 1, params: { bhStep: 3 } },
    'electric-interactions': { page: 0, params: { bondPm: 95 } },
    'covalent-bonds': { page: 0, params: { bondPm: 74 } },
    'molecules': { page: 3, params: { deltaEn: 0.4 } },
    'ionic-structures': { page: 1, params: { bhStep: 3 } },
    'structure-properties': { page: 2, params: {} },
    'bond-polarity-dipoles': { page: 3, params: { deltaEn: 1.2 } },
    's2-1': { page: 1, params: { bhStep: 3 } },
    's2-2': { page: 0, params: { bondPm: 90 } },
    's2-3': { page: 0, params: { bondPm: 74 } },
    's2-4': { page: 3, params: { deltaEn: 0.4 } },
    's2-5': { page: 1, params: { bhStep: 3 } },
    's2-6': { page: 2, params: {} },
    's2-7': { page: 2, params: {} },
    's2-8': { page: 3, params: { deltaEn: 1.2 } },
    's2-9': { page: 3, params: { deltaEn: 1.2 } },
  },
  sonify(ctx, s, page) {
    if (page === 0) playTone(ctx, { freq: 320 + Math.max(-200, s.morse.energyKj) * 0.45, dur: 0.07, type: 'sine', gain: 0.03 });
    else if (page === 1) playTone(ctx, { freq: 260 + (s.bh.step + 1) * 70, dur: 0.07, type: 'triangle', gain: 0.03 });
    else playTone(ctx, { freq: 240 + s.pol.deltaEn * 120, dur: 0.06, type: 'sine', gain: 0.03 });
  },
  state(clock, reduced) {
    const p = CHAPTER.params || CHAPTER.defaultParams;
    const t = reduced ? 0 : clock;
    const morse = M.morseBondPotential(p.bondPm);
    const bh = M.naclBornHaber(p.bhStep);
    const pol = M.bondPolarityState(p.deltaEn, 'bent');
    return { t, morse, bh, pol };
  },
  readout(s, page, pageIdx) {
    if (pageIdx === 0) {
      return `<b>Covalent Bond Well (r = ${s.morse.rPm} pm)</b> · Potential energy V(r) = <b>${s.morse.energyKj.toFixed(0)} kJ/mol</b> · ${s.morse.regime} (minimum −436 kJ/mol at 74 pm).`;
    }
    if (pageIdx === 1) {
      return `<b>NaCl Ionic Lattice (6:6 Coordination)</b> · Born–Haber step ${s.bh.step}/3: <b>${s.bh.label}</b> (System enthalpy = <b>${s.bh.levelKj} kJ/mol</b>).`;
    }
    if (pageIdx === 2) {
      return `<b>Pure Carbon Allotropes</b> · Diamond: 3D tetrahedral sp³ carbon network (109.5°, insulator) · Graphite: planar sp² hexagonal sheets (120°, delocalized π conductor).`;
    }
    return `<b>VSEPR & Polarity (ΔEN = ${s.pol.deltaEn.toFixed(2)})</b> · Bond character: <b>${s.pol.bondClassification}</b> · Bent H₂O net dipole = <b>${s.pol.netDipoleDebye} D</b> vs symmetric CO₂ / CH₄ = <b>0 D</b>.`;
  },
  buildWorld(E) {
    const { scene, asm } = E;
    const root = new THREE.Group();
    scene.add(root);
    studioGrid(root, { x0: -4, x1: 48 });
    const labels = [];
    const label = (cls, html, at, opts = {}) => labels.push({ cls, html, at, ...opts });

    // Station 0 (x = 0): Covalent Bond Potential Well + Continuous Morse Curve + Live State Bead
    const h2Asm = asm('h2_pair', root, { title: 'Bonding H₂ pair', sub: 'Shared electron density' });
    h2Asm.position.set(0, 1.75, 0);
    const hLeft = part(h2Asm, sphere(0.22, 24), { pal: 'red', tone: 'hi', pos: [-0.35, 0, 0], ex: [-0.45, 0, 0], name: 'Left H nucleus' });
    const hRight = part(h2Asm, sphere(0.22, 24), { pal: 'red', tone: 'hi', pos: [0.35, 0, 0], ex: [0.45, 0, 0], name: 'Right H nucleus' });
    const bondCloud = part(h2Asm, sphere(0.46, 24), { pal: 'blue', tone: 'mid', mat: shadeMat('blue', { opacity: 0.32 }), ex: [0, 0.45, 0], name: 'Shared σ electron cloud' });

    const curveAsm = asm('morse_curve', root, { title: 'Morse potential curve V(r)', sub: 'Minimum −436 kJ/mol at r₀ = 74 pm' });
    curveAsm.position.set(0, 0.95, -0.2);
    const rToX = r => -1.35 + ((r - 45) / (220 - 45)) * 2.7;
    const vToY = v => Math.max(-0.72, Math.min(0.75, (v / 436) * 0.68));
    // Zero-energy asymptotic reference line (separated atoms V = 0)
    const zeroDatum = rod(curveAsm, { r: 0.014, pal: 'paper', tone: 'mid', name: 'Zero energy asymptote (separated atoms)' });
    zeroDatum.set(V(-1.35, 0, 0), V(1.35, 0, 0));
    // Continuous Morse curve tube
    const morsePts = [];
    for (let r = 46; r <= 220; r += 4) {
      const v = M.morseBondPotential(r).energyKj;
      morsePts.push(V(rToX(r), vToY(v), 0));
    }
    buildCurveTube(curveAsm, morsePts, { r: 0.032, pal: 'ochre', tone: 'hi', segs: 64, name: 'Morse curve V(r)' });
    // Equilibrium depth callout arrow at 74 pm
    const wellArrow = arrow3(curveAsm, { r: 0.022, headR: 0.065, headL: 0.12, pal: 'green', name: '436 kJ/mol bond well depth' });
    wellArrow.set(V(rToX(74), 0, 0), V(rToX(74), vToY(-436), 0));
    const stateBead = part(curveAsm, sphere(0.095, 18), { pal: 'red', tone: 'hi', pos: [rToX(74), vToY(-436), 0], name: 'Current (r, V) state' });
    label('board', 'H₂ shared electron pair', () => V(0, 2.35, 0));
    label('board', 'Well: 74 pm (−436 kJ/mol)', () => V(-0.45, 0.12, 0));

    // Station 1 (x = 14): NaCl 3D Lattice & Born-Haber Bars
    const naclAsm = asm('nacl_lattice', root, { title: '3D NaCl crystal lattice', sub: '6:6 octahedral coordination' });
    buildCrystalLattice(naclAsm, { kind: 'nacl', nx: 3, ny: 3, nz: 3, spacing: 0.46, pos: [13.1, 1.25, 0] });

    const bhAsm = asm('born_haber_bars', root, { title: 'Born–Haber enthalpy steps', sub: 'Ionization (+496) vs lattice (−787 kJ/mol)' });
    bhAsm.position.set(15.1, 0.85, 0);
    const bhHeights = [0.15, 0.95, 0.38, 1.15];
    const bhPals = ['paper', 'red', 'ochre', 'green'];
    const bhMeshes = bhHeights.map((h, i) =>
      part(bhAsm, box(0.28, h, 0.36, 0.02), { pal: bhPals[i], tone: 'hi', pos: [(i - 1.5) * 0.38, (i === 3 ? -h / 2 + 0.4 : h / 2), 0], ex: [0.35, 0.2 * i, 0], name: `Born–Haber step ${i}` })
    );
    label('board', '3D NaCl lattice (6:6)', () => V(13.1, 2.25, 0));
    label('board', 'Born–Haber ledger (−640 kJ)', () => V(15.1, 2.08, 0));

    // Station 2 (x = 28): True 3D Tetrahedral Diamond Network vs Layered Graphite Sheets
    const diaAsm = asm('diamond_cage', root, { title: 'Diamond sp³ 3D network', sub: '17-carbon tetrahedral covalent cage (109.5°)' });
    buildCrystalLattice(diaAsm, { kind: 'diamond', spacing: 0.56, pos: [26.8, 1.3, 0] });

    const graAsm = asm('graphite_sheets', root, { title: 'Graphite sp² layered sheets', sub: 'Planar rings + weak interlayer attraction' });
    graAsm.position.set(29.1, 1.3, 0);
    const topSheetGroup = new THREE.Group();
    graAsm.add(topSheetGroup);
    for (const yLayer of [-0.46, 0, 0.46]) {
      const targetGroup = yLayer > 0.2 ? topSheetGroup : graAsm;
      for (let k = 0; k < 6; k++) {
        const a = (k * Math.PI) / 3;
        const b = ((k + 1) * Math.PI) / 3;
        part(targetGroup, sphere(0.11, 14), { pal: 'dark', tone: 'hi', pos: [Math.cos(a) * 0.52, yLayer, Math.sin(a) * 0.52], ex: [0, yLayer * 0.8, 0], name: 'sp² Carbon atom' });
        const r = rod(targetGroup, { r: 0.026, pal: 'ochre', tone: 'hi', name: 'sp² C–C bond (142 pm)' });
        r.set(V(Math.cos(a) * 0.52, yLayer, Math.sin(a) * 0.52), V(Math.cos(b) * 0.52, yLayer, Math.sin(b) * 0.52));
        if (yLayer < 0.2) {
          const weak = rod(graAsm, { r: 0.01, pal: 'paper', tone: 'mid', name: 'Weak interlayer dispersion (335 pm)' });
          weak.set(V(Math.cos(a) * 0.52, yLayer, Math.sin(a) * 0.52), V(Math.cos(a) * 0.52, yLayer + 0.46, Math.sin(a) * 0.52));
        }
      }
    }
    label('board', 'Diamond 3D sp³ network', () => V(26.8, 2.35, 0));
    label('board', 'Graphite sliding sp² layers', () => V(29.1, 2.35, 0));

    // Station 3 (x = 42): VSEPR Shapes & Vector Bond Dipoles
    const h2oPolAsm = asm('polar_h2o', root, { title: 'Bent H₂O (104.5°, polar)', sub: 'Two bond dipoles add upward → μ = 1.85 D' });
    buildMolecule3D(h2oPolAsm, 'H2O', { scale: 0.58, pos: [40.7, 1.18, 0] });
    const h2oBond1 = arrow3(h2oPolAsm, { r: 0.02, headR: 0.055, headL: 0.11, pal: 'blue', name: 'O←H bond dipole 1' });
    const h2oBond2 = arrow3(h2oPolAsm, { r: 0.02, headR: 0.055, headL: 0.11, pal: 'blue', name: 'O←H bond dipole 2' });
    const dipArrow = arrow3(h2oPolAsm, { r: 0.032, headR: 0.085, headL: 0.16, pal: 'red', tone: 'hi', name: 'Net dipole vector μ_net' });

    const co2Asm = asm('nonpolar_co2', root, { title: 'Linear CO₂ (180°, non-polar)', sub: 'Equal & opposite C=O dipoles cancel (μ = 0)' });
    buildMolecule3D(co2Asm, 'CO2', { scale: 0.52, pos: [42.3, 1.65, 0] });
    const co2Left = arrow3(co2Asm, { r: 0.02, headR: 0.055, headL: 0.11, pal: 'blue', name: 'Left O←C dipole' });
    const co2Right = arrow3(co2Asm, { r: 0.02, headR: 0.055, headL: 0.11, pal: 'blue', name: 'Right C→O dipole' });

    const ch4Asm = asm('tetra_ch4', root, { title: 'Tetrahedral CH₄ (109.5°)', sub: 'Symmetric 4-domain geometry (μ = 0)' });
    buildMolecule3D(ch4Asm, 'CH4', { scale: 0.52, pos: [43.4, 0.98, 0] });
    label('board', 'H₂O: bond pulls add (μ ≠ 0)', () => V(40.7, 2.22, 0));
    label('board', 'CO₂ & CH₄: pulls cancel (μ = 0)', () => V(42.85, 2.28, 0));

    return {
      labels,
      update(s) {
        const halfSep = (s.morse.rPm / 74) * 0.35;
        hLeft.position.x = -halfSep;
        hRight.position.x = halfSep;
        bondCloud.scale.set(Math.max(0.55, halfSep * 2.5), 0.72, 0.72);
        stateBead.position.set(rToX(s.morse.rPm), vToY(s.morse.energyKj), 0.04);

        bhMeshes.forEach((m, idx) => {
          m.scale.y = idx <= s.bh.step ? 1.05 : 0.25;
        });

        // Gentle shear slide on top graphite sheet
        topSheetGroup.position.x = Math.sin(s.t * 1.4) * 0.14;

        // Scale bond dipole vectors with s.pol.deltaEn
        const dScale = Math.max(0.15, (s.pol.deltaEn / 1.24) * 0.55);
        h2oBond1.set(V(40.7 - 0.44, 0.95, 0.22), V(40.7 - 0.08, 0.95 + dScale * 0.65, 0.22));
        h2oBond2.set(V(40.7 + 0.44, 0.95, 0.22), V(40.7 + 0.08, 0.95 + dScale * 0.65, 0.22));
        dipArrow.set(V(40.7, 1.05, 0.35), V(40.7, 1.05 + dScale * 1.35, 0.35));
        co2Left.set(V(42.3 - 0.1, 1.92, 0.15), V(42.3 - 0.1 - dScale * 0.95, 1.92, 0.15));
        co2Right.set(V(42.3 + 0.1, 1.92, 0.15), V(42.3 + 0.1 + dScale * 0.95, 1.92, 0.15));
      },
    };
  },
};
