import { SUBJECT } from '../subject.js';
import {
  THREE, shadeMat, part, box, cyl, sphere, rod, arrow3,
  buildMolecule3D, buildCrystalLattice, studioGrid, playTone, V
} from '@saxster/atlas/chem_kit.js';
import * as M from './model.js';

export const PAGES = [
  {
    tab: 'Covalent bond well',
    fig: 'Figure 2.1 · H₂ internuclear potential energy curve V(r) & shared electron density',
    title: 'Covalent Bond Potential Well',
    alt: '3D Morse potential curve with two hydrogen atoms whose shared electron cloud settles at the 74 pm, -436 kJ/mol minimum.',
    cam: { target: [0, 1.3, 0], az: 20, el: 20, dist: 6.8 },
    lit: 'h2_pair',
    parts: ['h2_pair', 'morse_curve'],
    look: { xray: 0.2, section: 0 },
  },
  {
    tab: 'NaCl ionic lattice',
    fig: 'Figure 2.2 · Extended 3D NaCl crystal lattice (6:6 coordination) & Born–Haber energy ledger',
    title: 'Ionic Lattice vs Formula Unit',
    alt: '3D cubic rock-salt lattice of alternating Na+ and Cl- ions alongside the 3-step Born-Haber energy ledger.',
    cam: { target: [14, 1.35, 0], az: 28, el: 22, dist: 7.0 },
    lit: 'nacl_lattice',
    parts: ['nacl_lattice', 'born_haber_bars'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Diamond vs graphite',
    fig: 'Figure 2.3 · Carbon allotropes: 3D tetrahedral diamond network vs layered sp² graphite sheets',
    title: 'Structure Governs Properties',
    alt: '3D comparison of a rigid tetrahedral diamond network and sliding hexagonal graphite sheets with delocalized electrons.',
    cam: { target: [28, 1.35, 0], az: -24, el: 20, dist: 7.2 },
    lit: 'graphite_sheets',
    parts: ['diamond_cage', 'graphite_sheets'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'VSEPR & dipoles',
    fig: 'Figure 2.4 · 3D molecular geometry & vector bond-dipole addition (H₂O vs CO₂ vs CH₄)',
    title: 'VSEPR Shapes & Molecular Dipoles',
    alt: '3D bent H2O with net dipole arrow contrasted against linear symmetric CO2 and tetrahedral CH4 where bond dipoles cancel.',
    cam: { target: [42, 1.35, 0], az: 22, el: 20, dist: 7.0 },
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
    text: 'Born–Haber thermodynamic ledger: removing an electron from Na costs +496 kJ/mol and Cl gains −349 kJ/mol (net +147 kJ/mol uphill); only 3D lattice assembly (−787 kJ/mol) makes salt formation exothermic.',
    facts: s => [['Step', `${s.bh.step} / 3`], ['System enthalpy', `${s.bh.levelKj} kJ/mol`]],
  },
  diamond_cage: {
    text: 'Diamond allotrope: every carbon atom is sp³-bonded to 4 neighbours at 109.5° in a continuous 3D covalent network—extremely hard and an electrical insulator.',
  },
  graphite_sheets: {
    text: 'Graphite allotrope: planar sp² hexagonal carbon rings (120°) with delocalized π electrons that conduct electricity along sheets, while weak interlayer forces let layers slide.',
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
      return `<b>Pure Carbon Allotropes</b> · Diamond: 3D tetrahedral sp³ covalent cage (109.5°, insulator) · Graphite: planar sp² hexagonal sheets (120°, delocalized π conductor).`;
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

    // Station 0 (x = 0): Covalent Bond Potential Well
    const h2Asm = asm('h2_pair', root, { title: 'Bonding H₂ pair', sub: 'Shared electron density' });
    h2Asm.position.set(0, 1.55, 0);
    const hLeft = part(h2Asm, sphere(0.24, 24), { pal: 'red', tone: 'hi', pos: [-0.35, 0, 0], ex: [-0.45, 0, 0], name: 'Left H nucleus' });
    const hRight = part(h2Asm, sphere(0.24, 24), { pal: 'red', tone: 'hi', pos: [0.35, 0, 0], ex: [0.45, 0, 0], name: 'Right H nucleus' });
    const bondCloud = part(h2Asm, sphere(0.48, 24), { pal: 'blue', tone: 'mid', mat: shadeMat('blue', { opacity: 0.32 }), ex: [0, 0.45, 0], name: 'Shared σ electron cloud' });

    const curveAsm = asm('morse_curve', root, { title: 'Morse potential curve V(r)', sub: 'Minimum at r₀ = 74 pm' });
    curveAsm.position.set(0, 0.85, -0.35);
    for (let i = 0; i < 14; i++) {
      const rTest = 50 + i * 12;
      const vTest = M.morseBondPotential(rTest).energyKj;
      const x = -1.2 + i * 0.19;
      const y = Math.max(-0.65, Math.min(0.85, (vTest / 436) * 0.65));
      part(curveAsm, sphere(0.055, 12), { pal: Math.abs(rTest - 74) < 8 ? 'green' : 'ochre', tone: 'hi', pos: [x, y, 0], ex: [0, -0.3, 0], name: `V(${rTest} pm)` });
    }
    label('board', 'Shared electron cloud', () => V(0, 2.25, 0));
    label('board', 'Minimum at 74 pm (−436 kJ/mol)', () => V(-0.6, 0.25, 0));

    // Station 1 (x = 14): NaCl 3D Lattice & Born-Haber Bars
    const naclAsm = asm('nacl_lattice', root, { title: '3D NaCl crystal lattice', sub: '6:6 octahedral coordination' });
    buildCrystalLattice(naclAsm, { kind: 'nacl', nx: 3, ny: 3, nz: 3, spacing: 0.46, pos: [13.2, 1.25, 0] });

    const bhAsm = asm('born_haber_bars', root, { title: 'Born–Haber enthalpy steps', sub: 'Ionization vs lattice payback' });
    bhAsm.position.set(15.1, 0.85, 0);
    const bhHeights = [0.15, 0.95, 0.38, 1.15];
    const bhPals = ['paper', 'red', 'ochre', 'green'];
    const bhMeshes = bhHeights.map((h, i) =>
      part(bhAsm, box(0.28, h, 0.36, 0.02), { pal: bhPals[i], tone: 'hi', pos: [(i - 1.5) * 0.36, (i === 3 ? -h / 2 + 0.4 : h / 2), 0], ex: [0.35, 0.2 * i, 0], name: `Born–Haber step ${i}` })
    );
    label('board', '3D NaCl lattice (no molecules)', () => V(13.2, 2.25, 0));
    label('board', 'Born–Haber energy ledger', () => V(15.1, 2.05, 0));

    // Station 2 (x = 28): Diamond vs Graphite Allotropes
    const diaAsm = asm('diamond_cage', root, { title: 'Diamond sp³ 3D network', sub: 'Tetrahedral 109.5° covalent cage' });
    buildMolecule3D(diaAsm, 'CH4', { scale: 0.72, pos: [26.9, 1.3, 0] });

    const graAsm = asm('graphite_sheets', root, { title: 'Graphite sp² layered sheets', sub: 'Planar rings + delocalized π electrons' });
    graAsm.position.set(29.1, 1.3, 0);
    for (const yLayer of [-0.42, 0, 0.42]) {
      for (let k = 0; k < 6; k++) {
        const a = (k * Math.PI) / 3;
        const b = ((k + 1) * Math.PI) / 3;
        part(graAsm, sphere(0.11, 14), { pal: 'dark', tone: 'hi', pos: [Math.cos(a) * 0.52, yLayer, Math.sin(a) * 0.52], ex: [0, yLayer * 0.8, 0], name: 'sp² Carbon atom' });
        const r = rod(graAsm, { r: 0.024, pal: 'ochre', tone: 'hi', name: 'Aromatic sp² C–C bond' });
        r.set(V(Math.cos(a) * 0.52, yLayer, Math.sin(a) * 0.52), V(Math.cos(b) * 0.52, yLayer, Math.sin(b) * 0.52));
      }
    }
    label('board', 'Diamond sp³ network', () => V(26.9, 2.25, 0));
    label('board', 'Graphite sp² layers', () => V(29.1, 2.25, 0));

    // Station 3 (x = 42): VSEPR Shapes & Dipoles
    const h2oPolAsm = asm('polar_h2o', root, { title: 'Bent H₂O (104.5°, polar)', sub: 'Net molecular dipole μ = 1.85 D' });
    buildMolecule3D(h2oPolAsm, 'H2O', { scale: 0.58, pos: [40.8, 1.25, 0] });
    const dipArrow = arrow3(h2oPolAsm, { r: 0.028, headR: 0.08, headL: 0.16, pal: 'red', tone: 'hi', name: 'Net dipole vector μ' });
    dipArrow.set(V(40.8, 0.85, 0.35), V(40.8, 1.75, 0.35));

    const co2Asm = asm('nonpolar_co2', root, { title: 'Linear CO₂ (180°, non-polar)', sub: 'Opposing bond dipoles cancel' });
    buildMolecule3D(co2Asm, 'CO2', { scale: 0.52, pos: [42.2, 1.65, 0] });

    const ch4Asm = asm('tetra_ch4', root, { title: 'Tetrahedral CH₄ (109.5°)', sub: 'Symmetric 4-domain geometry' });
    buildMolecule3D(ch4Asm, 'CH4', { scale: 0.52, pos: [43.3, 1.05, 0] });
    label('board', 'H₂O net dipole ≠ 0', () => V(40.8, 2.15, 0));
    label('board', 'CO₂ & CH₄ dipoles cancel', () => V(42.8, 2.25, 0));

    return {
      labels,
      update(s) {
        const halfSep = (s.morse.rPm / 74) * 0.35;
        hLeft.position.x = -halfSep;
        hRight.position.x = halfSep;
        bondCloud.scale.set(Math.max(0.6, halfSep * 2.6), 0.72, 0.72);
        bhMeshes.forEach((m, idx) => {
          m.scale.y = idx <= s.bh.step ? 1 : 0.25;
        });
      },
    };
  },
};
