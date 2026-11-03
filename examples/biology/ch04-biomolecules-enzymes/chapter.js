import { SUBJECT } from '../subject.js';
import {
  THREE, part, box, cyl, sphere, capsule,
  prims, MOLECULES, studioGrid, playTone, shadeMat, V
} from '@saxster/atlas/bio_kit.js';
import * as M from './model.js';

export const PAGES = [
  {
    tab: 'Carbon monomers',
    fig: 'Figure 4.1–4.2 · Schematic glucose ring and peptide linkage',
    title: 'Carbon’s Monomer Lego Set',
    alt: 'Schematic ball-and-stick glucose and peptide models; connections and positions are teaching approximations.',
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
    fig: 'Figure 4.5–4.6 · Chosen temperature-response model and five food-test examples',
    title: 'Conditions & Biochemical Food Assays',
    alt: 'Schematic five-test rack: iodine, Benedict, biuret, ethanol emulsion and DCPIP. These colours illustrate possible positive results, not actual assays or control measurements.',
    cam: { target: [42, 1.35, 0], az: 18, el: 20, dist: 7.4 },
    lit: 'assay_rack',
    parts: ['assay_rack', 'thermal_curve'],
    look: { xray: 0.2, section: 0 },
  },
];

export const PLATES = {
  glucose_mol: {
    text: 'Glucose has six carbons overall; its usual six-membered ring contains five carbons and one oxygen. Glucose-derived units form starch, glycogen or cellulose with different link orientations. This schematic does not establish every atom position or stereochemical detail.',
  },
  peptide_mol: {
    text: 'Planar peptide bond (−CO−NH−) linking amino acids by condensation (releasing H₂O), with variable R-groups projecting above and below the backbone.',
  },
  rama_surface: {
    text: 'A chosen two-basin landscape illustrates local backbone-angle restrictions. It is not Ramachandran’s measured map, a universal energy surface or a complete folding prediction. Real maps depend on amino-acid type and structural evidence.',
  },
  folded_chain: {
    text: 'Protein arrangements depend on charge interactions, hydrogen bonding, nonpolar packing and sometimes disulphide links. This schematic chain is not a solved protein or an exact active-site structure; proteins remain flexible.',
  },
  enzyme_blob: {
    text: 'An invented enzyme surface represents a chemically selective active site. Catalysis lowers an activation barrier without changing the endpoint free-energy difference. Rate values and parameters here are chosen examples, not lactase measurements.',
    facts: s => [['v', `${s.mm.v.toFixed(1)} µM/s`], ['K_m,app', `${s.mm.kmApp.toFixed(2)} mM`], ['Model shape', s.mm.denatured ? 'Distorted' : 'Compact']],
  },
  substrate_ligand: {
    text: 'An abstract ligand represents binding. Dragging it changes a chosen substrate concentration control; this does not reproduce molecular docking dynamics. The competitive-inhibition model raises apparent K_m.',
  },
  mm_chart: {
    text: 'Chosen Michaelis–Menten curve v = V_max[S] / (K_m + [S]): approximately linear at low substrate concentration and approaching V_max as active sites become increasingly occupied. This simple steady-state model does not describe every enzyme.',
  },
  assay_rack: {
    text: 'Five schematic positive examples: iodine blue-black with starch; Benedict’s coloured precipitate with reducing sugar after supervised heating; biuret purple with peptide bonds; ethanol emulsion cloudy with lipid; DCPIP loses colour with vitamin C. Real tests require known positives, blanks and untreated-sample comparisons; the rack is not experimental evidence. School laboratory only.',
  },
  thermal_curve: {
    text: 'Invented temperature-response curve combining faster reactions with loss of activity. The chosen parameters are not a universal optimum or a fever threshold. Relative rate does not measure the fraction of folded protein, and an instant slider cannot establish irreversible heat damage.',
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
    'ch04-water-3d': { page: 0 },
    'ch04-glucose-3d': { page: 0 },
    'ch04-protein-3d': { page: 1 },
    'ch04-enzyme-3d': { page: 2 },
    'ch04-enzyme-3d-denature': { page: 3 },
    'ch04-glucose-3d-bench': { page: 3 },
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
      return `<b>Schematic biomolecules</b> · α-D-Glucose (C₆H₁₂O₆ hexose ring) & planar peptide linkage (−CO−NH−) built by condensation (−H₂O).`;
    }
    if (pageIdx === 1) {
      return `<b>Ramachandran Folding Landscape</b> · Chosen α-helix (−60°, −45°) & β-sheet (−120°, +125°) basins · At T = ${s.tempC} °C: ${s.mm.denatured ? '<b>chosen distorted shape</b>' : '<b>chosen compact shape</b>'}; illustration, not measured protein stability.`;
    }
    if (pageIdx === 2) {
      return `<b>[S] = ${s.substrateMm.toFixed(1)} mM · T = ${s.tempC} °C · [I] = ${s.inhibMm.toFixed(1)} mM</b> · Apparent K_m = ${s.mm.kmApp.toFixed(2)} mM · Reaction velocity <b>v = ${s.mm.v.toFixed(1)} µM/s</b> (${s.mm.vmaxEff.toFixed(0)}% chosen relative capacity). Model units and parameters are illustrative.`;
    }
    return `<b>Thermal Profile & Food Assays</b> · T = ${s.tempC} °C (${(s.mm.tFrac * 100).toFixed(0)}% relative model activity; not folded fraction) · Schematic rack: iodine (starch), Benedict’s (reducing sugar), biuret (peptide bonds), ethanol (lipid), DCPIP (vitamin C).`;
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
    prims.molecule(glucAsm, MOLECULES.glucose.atoms.map(a => a.join(' ')).join('\n'), { scale: 0.28, names: false });

    const pepAsm = asm('peptide_mol', root, { title: 'Peptide condensation bond', sub: '−CO−NH− backbone link' });
    pepAsm.position.set(1.2, 1.35, 0);
    prims.molecule(pepAsm, MOLECULES.peptide.atoms.map(a => a.join(' ')).join('\n'), { scale: 0.28, names: false });
    label('board', 'α-D-Glucose', () => V(-1.1, 2.35, 0));
    label('board', 'Peptide bond', () => V(1.2, 2.35, 0));

    // Station 1 (x = 14): Ramachandran Steric Surface & Folding Chain
    const ramaAsm = asm('rama_surface', root, { title: 'Ramachandran (φ, ψ) surface', sub: 'Steric clash hills vs α/β basins' });
    ramaAsm.position.set(12.6, 0.25, -0.5);
    const axR = prims.axes(ramaAsm, { x: [-180, 180], y: [-180, 180], z: [0, 14], size: [1.9, 1.3, 1.6] });
    prims.surface(ramaAsm, (phi, psi) => M.ramachandranEnergy(phi, psi).energyKj, { axes: axR, n: 26, pal: 'blue' });

    const chainAsm = asm('folded_chain', root, { title: '3D Polypeptide fold', sub: 'Chosen compact vs distorted shape' });
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
      cleft: 0.58,
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
    const mmPlot = prims.plot(mmAsm, s => M.michaelisMenten(s, 37, 7.0, 0).v, { axes: axM, samples: 40, color: 'green', width: 0.064 });
    const mmCursor = part(mmAsm, sphere(0.085, 16), { pal: 'red', tone: 'lit', name: 'Operating point' });
    label('board', 'Enzyme active cleft', () => V(26.8, 2.45, 0));
    label('board', 'v = V_max[S]/(K_m+[S])', () => V(29.5, 2.15, -0.4));

    // Station 3 (x = 42): 4 Biochemical Assay Cuvettes + Thermal Bell Curve
    const rackAsm = asm('assay_rack', root, { title: 'Biochemical assay cuvettes', sub: 'Iodine, Benedict, Biuret, Ethanol, DCPIP' });
    rackAsm.position.set(41.0, 0.2, 0);
    const cuvetteSpecs = [
      { x: -0.9, pal: 'ink', name: 'Iodine + Starch (blue-black)' },
      { x: -0.3, pal: 'red', name: 'Benedict + Glucose (brick-red)' },
      { x: 0.3, pal: 'blue', name: 'Biuret + Protein (violet)' },
      { x: 0.9, pal: 'paper', name: 'Ethanol + Lipid (milky emulsion)' },
      { x: 1.5, pal: 'paper', name: 'DCPIP + Vitamin C (decolourised)' },
    ];
    for (const c of cuvetteSpecs) {
      part(rackAsm, cyl(0.2, 1.45, 20), { pal: 'paper', tone: 'mid', pos: [c.x, 0.8, 0], mat: shadeMat('paper', { opacity: 0.4 }), name: 'Glass test tube' });
      part(rackAsm, cyl(0.17, 0.95, 18), { pal: c.pal, tone: 'hi', pos: [c.x, 0.58, 0], ex: [0, 0.55, 0], name: c.name });
    }

    const thAsm = asm('thermal_curve', root, { title: 'Thermal activity curve', sub: 'Invented relative activity curve' });
    thAsm.position.set(42.5, 0.25, -0.4);
    const axT = prims.axes(thAsm, { x: [10, 70], y: [0, 1.05], size: [1.9, 1.65, 0.5] });
    prims.plot(thAsm, T => M.thermalActivity(T).frac, { axes: axT, samples: 44, color: 'red', width: 0.064 });
    const tCursor = part(thAsm, sphere(0.085, 16), { pal: 'ochre', tone: 'lit', name: 'Assay temperature' });
    label('board', '5 schematic test results', () => V(41.0, 2.05, 0));
    label('board', 'Thermal denaturation', () => V(43.4, 2.15, -0.4));

    return {
      labels,
      update(s) {
        // Unfold enzyme & chain when temperature exceeds optimum
        const den = s.mm.denatured ? 1.32 : 1.0;
        enzBlob.object.scale.set(den, 1 / Math.sqrt(den), den);
        foldGroup.scale.set(1 + (1 - s.mm.tFrac) * 0.65, 1, 1);

        // Update MM curve & operating cursor
        mmPlot.update(x => M.michaelisMenten(x, s.tempC, 7.0, s.inhibMm).v);
        mmCursor.position.copy(axM.to(s.substrateMm, s.mm.v, 0));
        tCursor.position.copy(axT.to(s.tempC, s.mm.tFrac, 0));
      },
    };
  },
};
