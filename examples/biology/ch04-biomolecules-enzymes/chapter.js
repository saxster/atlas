import { SUBJECT } from '../subject.js';
import {
  THREE, part, box, cyl, sphere, capsule,
  prims, MOLECULES, studioGrid, playTone, V
} from '@saxster/atlas/bio_kit.js';
import * as M from './model.js';

export const PAGES = [
  {
    tab: 'Carbon monomers',
    fig: 'Figure 4.1–4.2 · 3D α-D-Glucose ring, peptide bond & tetrahedral water H-bonds',
    title: 'Carbon’s Monomer Lego Set',
    alt: '3D ball-and-stick models of alpha-D-glucose and a peptide dipeptide unit formed by condensation.',
    cam: { target: [0, 1.35, 0], az: 26, el: 20, dist: 7.2 },
    lit: 'glucose_mol',
    parts: ['glucose_mol', 'peptide_mol'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Ramachandran folding',
    fig: 'Figure 4.3 · Ramachandran (φ, ψ) conformational surface & 3D protein folding',
    title: 'Ramachandran’s Steric Folding Map',
    alt: '3D Ramachandran steric energy surface showing alpha-helix and beta-sheet basins alongside a folding polypeptide chain.',
    cam: { target: [14, 1.35, 0], az: -26, el: 24, dist: 7.4 },
    lit: 'rama_surface',
    parts: ['rama_surface', 'folded_chain'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Enzyme active cleft',
    fig: 'Figure 4.4 · Goodsell-style 3D globular enzyme with active-site cleft & Michaelis–Menten curve',
    title: 'Induced-Fit Enzyme Catalysis',
    alt: '3D globular enzyme with an active-site cleft docking a draggable substrate molecule, coupled to the Michaelis-Menten velocity curve.',
    cam: { target: [28, 1.35, 0], az: 22, el: 20, dist: 7.4 },
    lit: 'enzyme_blob',
    parts: ['enzyme_blob', 'substrate_ligand', 'mm_chart'],
    look: { xray: 0.15, section: 0 },
  },
  {
    tab: 'Denaturation & assays',
    fig: 'Figure 4.5–4.6 · Thermal denaturation unfolding & 4 biochemical assay cuvettes',
    title: 'Conditions & Biochemical Food Assays',
    alt: '3D rack of four reagent cuvettes (Iodine, Benedict, Biuret, Ethanol emulsion) with positive and negative control comparisons.',
    cam: { target: [42, 1.35, 0], az: 18, el: 20, dist: 7.4 },
    lit: 'assay_rack',
    parts: ['assay_rack', 'thermal_curve'],
    look: { xray: 0.2, section: 0 },
  },
];

export const PLATES = {
  glucose_mol: {
    text: 'Hexagonal pyranose ring of α-D-glucose (C₆H₁₂O₆): six carbons and five hydroxyl (−OH) groups that condense via glycosidic bonds into starch, glycogen, or cellulose.',
  },
  peptide_mol: {
    text: 'Planar peptide bond (−CO−NH−) linking amino acids by condensation (releasing H₂O), with variable R-groups projecting above and below the backbone.',
  },
  rama_surface: {
    text: 'G. N. Ramachandran’s hard-sphere steric map: most (φ, ψ) backbone angles cause atomic collisions (high peaks), leaving two deep allowed valleys—the α-helix and β-sheet.',
  },
  folded_chain: {
    text: 'Tertiary 3D fold stabilised by disulphide bridges, ionic salt bridges, hydrogen bonds, and hydrophobic core packing—forming the exact 3D active-site lock.',
  },
  enzyme_blob: {
    text: 'Goodsell-style globular enzyme surface with a complementary active-site cleft that lowers the transition-state activation barrier E_a without shifting ΔG.',
    facts: s => [['v', `${s.mm.v.toFixed(1)} µM/s`], ['K_m,app', `${s.mm.kmApp.toFixed(2)} mM`], ['Status', s.mm.denatured ? 'Denatured' : 'Active']],
  },
  substrate_ligand: {
    text: 'Substrate molecule docking into the catalytic cleft (drag it in 3D or adjust [S]!)—competitive inhibitors vie for this same cleft, raising apparent K_m.',
  },
  mm_chart: {
    text: 'Michaelis–Menten hyperbola v = V_max[S] / (K_m + [S]): linear at low [S] when clefts are empty, saturating at V_max when every active site is occupied.',
  },
  assay_rack: {
    text: 'Four diagnostic food tests with matched negative water controls: Iodine (amber → blue-black with starch), Benedict’s (blue → brick-red at 80 °C with reducing sugar), Biuret (blue → violet with peptide bonds), and Ethanol (milky lipid emulsion).',
  },
  thermal_curve: {
    text: 'Asymmetric thermal activity profile: rate rises with kinetic collisions up to T_opt (37 °C), then plummets as thermal agitation breaks hydrogen/ionic bonds and unfolds the active site.',
  },
};

export const CHAPTER = {
  subject: SUBJECT,
  no: 4,
  PAGES,
  PLATES,
  clock0: 0,
  cuts: true,
  xrayKeys: ['enzyme_blob', 'assay_rack'],
  cutKeys: ['enzyme_blob', 'assay_rack'],
  cutPlane: [0, 0, -1, 0.05],
  defaultParams: { substrateMm: 3.0, tempC: 37, inhibMm: 0.0 },
  controls: [
    { id: 'substrateMm', label: 'Substrate [S]', min: 0.0, max: 10.0, step: 0.5, value: 3.0, unit: 'mM' },
    { id: 'tempC', label: 'Assay temperature T', min: 10, max: 70, step: 2, value: 37, unit: '°C' },
    { id: 'inhibMm', label: 'Competitive inhibitor [I]', min: 0.0, max: 4.0, step: 0.5, value: 0.0, unit: 'mM' },
  ],
  lessons: {
    'ch04-monomers-3d': { page: 0 },
    'ch04-ramachandran-3d': { page: 1, params: { tempC: 37 } },
    'ch04-enzyme-cleft-3d': { page: 2, params: { substrateMm: 3.5, tempC: 37, inhibMm: 0 } },
    'ch04-denaturation-assays-3d': { page: 3, params: { tempC: 58 } },
  },
  sonify(ctx, s, page) {
    playTone(ctx, { freq: s.mm.denatured ? 110 : 180 + s.mm.v * 4.5, dur: 0.06, type: s.mm.denatured ? 'sawtooth' : 'sine', gain: 0.03 });
  },
  state(clock, reduced) {
    const p = CHAPTER.params || CHAPTER.defaultParams;
    const t = reduced ? 1.5 : clock;
    const mm = M.michaelisMenten(p.substrateMm, p.tempC, 7.0, p.inhibMm);
    return { t, mm, substrateMm: p.substrateMm, tempC: p.tempC, inhibMm: p.inhibMm };
  },
  readout(s, page, pageIdx) {
    if (pageIdx === 0) {
      return `<b>3D Biomolecule Monomers</b> · α-D-Glucose (C₆H₁₂O₆ hexose ring) & planar peptide linkage (−CO−NH−) built by condensation (−H₂O).`;
    }
    if (pageIdx === 1) {
      return `<b>Ramachandran Folding Landscape</b> · Allowed α-helix (−60°, −45°) & β-sheet (−120°, +125°) basins · At T = ${s.tempC} °C: ${s.mm.denatured ? '<b>Unfolded (denatured)</b>' : '<b>Native 3D fold intact</b>'}.`;
    }
    if (pageIdx === 2) {
      return `<b>[S] = ${s.substrateMm.toFixed(1)} mM · T = ${s.tempC} °C · [I] = ${s.inhibMm.toFixed(1)} mM</b> · Apparent K_m = ${s.mm.kmApp.toFixed(2)} mM · Reaction velocity <b>v = ${s.mm.v.toFixed(1)} µM/s</b> (${s.mm.vmaxEff.toFixed(0)}% active capacity).`;
    }
    return `<b>Thermal Profile & Food Assays</b> · T = ${s.tempC} °C (${(s.mm.tFrac * 100).toFixed(0)}% native fold) · Cuvette rack: Iodine (starch), Benedict’s (reducing sugar), Biuret (protein), Ethanol (lipid).`;
  },
  buildWorld(E) {
    const { scene, asm, draggable } = E;
    const root = new THREE.Group();
    scene.add(root);
    studioGrid(root, { x0: -4, x1: 48 });
    const labels = [];
    const label = (cls, html, at, opts = {}) => labels.push({ cls, html, at, ...opts });

    // Station 0 (x = 0): 3D Glucose & Peptide Molecules
    const glucAsm = asm('glucose_mol', root, { title: 'α-D-Glucose ring', sub: 'C₆H₁₂O₆ pyranose monomer' });
    glucAsm.position.set(-1.1, 1.35, 0);
    prims.molecule(glucAsm, { atoms: MOLECULES.glucose.atoms, bonds: MOLECULES.glucose.bonds, scale: 0.28 });

    const pepAsm = asm('peptide_mol', root, { title: 'Peptide condensation bond', sub: '−CO−NH− backbone link' });
    pepAsm.position.set(1.2, 1.35, 0);
    prims.molecule(pepAsm, { atoms: MOLECULES.peptide.atoms, bonds: MOLECULES.peptide.bonds, scale: 0.28 });
    label('board', 'α-D-Glucose', () => V(-1.1, 2.35, 0));
    label('board', 'Peptide bond', () => V(1.2, 2.35, 0));

    // Station 1 (x = 14): Ramachandran Steric Surface & Folding Chain
    const ramaAsm = asm('rama_surface', root, { title: 'Ramachandran (φ, ψ) surface', sub: 'Steric clash hills vs α/β basins' });
    ramaAsm.position.set(12.6, 0.25, -0.5);
    const axR = prims.axes(ramaAsm, { x: [-180, 180], y: [0, 14], z: [-180, 180], size: [1.9, 1.3, 1.6] });
    prims.surface(axR, (phi, psi) => M.ramachandranEnergy(phi, psi).energyKj, { segs: 26, pal: 'blue', opacity: 0.78 });

    const chainAsm = asm('folded_chain', root, { title: '3D Polypeptide fold', sub: 'Native vs heat-unfolded' });
    chainAsm.position.set(15.3, 1.35, 0);
    const foldGroup = new THREE.Group();
    chainAsm.add(foldGroup);
    for (let i = 0; i < 8; i++) {
      const a = i * 0.85;
      part(foldGroup, sphere(0.18, 16), { pal: i % 2 === 0 ? 'green' : 'ochre', tone: 'hi', pos: [0.35 * Math.cos(a), (i - 3.5) * 0.2, 0.35 * Math.sin(a)], ex: [0.3 * Math.cos(a), 0, 0.3 * Math.sin(a)], name: `Residue ${i + 1}` });
    }
    label('board', 'Ramachandran surface', () => V(13.5, 2.15, -0.5));
    label('board', '3D Folded chain', () => V(15.3, 2.35, 0));

    // Station 2 (x = 28): Goodsell Globular Enzyme with Active Cleft & Draggable Substrate + MM Chart
    const enzAsm = asm('enzyme_blob', root, { title: 'Globular enzyme & active cleft', sub: 'Goodsell surface model' });
    enzAsm.position.set(26.8, 1.35, 0);
    const enzBlob = prims.blob(enzAsm, {
      r: 0.92,
      subdiv: 3,
      seed: 11,
      pal: 'blue',
      cleft: { dir: [1, 0.2, 0], depth: 0.58, width: 0.52 },
      name: 'Catalytic enzyme domain',
    });

    const subAsm = asm('substrate_ligand', root, { title: 'Substrate & inhibitor ligands', sub: 'Drag substrate to adjust [S]' });
    subAsm.position.set(27.75, 1.5, 0);
    const subMesh = part(subAsm, capsule(0.16, 0.22, 8, 16), { pal: 'ochre', tone: 'lit', ex: [0.55, 0.3, 0], name: 'Substrate ligand' });
    if (draggable) {
      draggable(subMesh, {
        plane: 'xy',
        constrain: pt => [Math.max(-0.35, Math.min(0.65, pt[0])), Math.max(-0.4, Math.min(0.4, pt[1])), 0],
        onDrag: pt => {
          const mappedS = Math.round(((0.65 - pt[0]) / 1.0) * 10 * 2) / 2;
          CHAPTER.params.substrateMm = Math.max(0, Math.min(10, mappedS));
        },
      });
    }

    const mmAsm = asm('mm_chart', root, { title: 'Michaelis–Menten curve', sub: 'v([S]) saturation hyperbola' });
    mmAsm.position.set(28.5, 0.25, -0.4);
    const axM = prims.axes(mmAsm, { x: [0, 10], y: [0, 105], size: [2.0, 1.65, 0.5] });
    const mmPlot = prims.plot(axM, s => M.michaelisMenten(s, 37, 7.0, 0).v, { samples: 40, pal: 'green', r: 0.032 });
    const mmCursor = part(mmAsm, sphere(0.085, 16), { pal: 'red', tone: 'lit', name: 'Operating point' });
    label('board', 'Enzyme active cleft', () => V(26.8, 2.45, 0));
    label('board', 'v = V_max[S]/(K_m+[S])', () => V(29.5, 2.15, -0.4));

    // Station 3 (x = 42): 4 Biochemical Assay Cuvettes + Thermal Bell Curve
    const rackAsm = asm('assay_rack', root, { title: 'Biochemical assay cuvettes', sub: 'Iodine, Benedict, Biuret, Ethanol' });
    rackAsm.position.set(41.0, 0.2, 0);
    const cuvetteSpecs = [
      { x: -0.9, pal: 'ink', name: 'Iodine + Starch (blue-black)' },
      { x: -0.3, pal: 'red', name: 'Benedict + Glucose (brick-red)' },
      { x: 0.3, pal: 'blue', name: 'Biuret + Protein (violet)' },
      { x: 0.9, pal: 'paper', name: 'Ethanol + Lipid (milky emulsion)' },
    ];
    for (const c of cuvetteSpecs) {
      part(rackAsm, cyl(0.2, 1.45, 20), { pal: 'paper', tone: 'mid', pos: [c.x, 0.8, 0], mat: shadeMat('paper', { opacity: 0.4 }), name: 'Glass test tube' });
      part(rackAsm, cyl(0.17, 0.95, 18), { pal: c.pal, tone: 'hi', pos: [c.x, 0.58, 0], ex: [0, 0.55, 0], name: c.name });
    }

    const thAsm = asm('thermal_curve', root, { title: 'Thermal activity curve', sub: 'Q₁₀ rise vs denaturation cliff' });
    thAsm.position.set(42.5, 0.25, -0.4);
    const axT = prims.axes(thAsm, { x: [10, 70], y: [0, 1.05], size: [1.9, 1.65, 0.5] });
    prims.plot(axT, T => M.thermalActivity(T).frac, { samples: 44, pal: 'red', r: 0.032 });
    const tCursor = part(thAsm, sphere(0.085, 16), { pal: 'ochre', tone: 'lit', name: 'Assay temperature' });
    label('board', '4 Assay cuvettes', () => V(41.0, 2.05, 0));
    label('board', 'Thermal denaturation', () => V(43.4, 2.15, -0.4));

    return {
      labels,
      update(s) {
        // Unfold enzyme & chain when temperature exceeds optimum
        const den = s.mm.denatured ? 1.32 : 1.0;
        enzBlob.scale.set(den, 1 / Math.sqrt(den), den);
        foldGroup.scale.set(1 + (1 - s.mm.tFrac) * 0.65, 1, 1);

        // Update MM curve & operating cursor
        mmPlot.update(x => M.michaelisMenten(x, s.tempC, 7.0, s.inhibMm).v);
        mmCursor.position.copy(axM.to(s.substrateMm, s.mm.v, 0));
        tCursor.position.copy(axT.to(s.tempC, s.mm.tFrac, 0));
      },
    };
  },
};
