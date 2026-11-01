import { SUBJECT } from '../subject.js';
import {
  THREE, part, box, cyl, sphere, capsule, rod,
  prims, buildHelix, rbcGeo, studioGrid, playTone, V
} from '@saxster/atlas/bio_kit.js';
import * as M from './model.js';

export const PAGES = [
  {
    tab: 'Photo 51 & B-DNA',
    fig: 'Figure 11.1–11.2 · Franklin’s Photo 51 X-ray cross & 3D antiparallel B-DNA double helix',
    title: 'The Twisted Ladder (B-DNA)',
    alt: '3D antiparallel B-DNA double helix with A-T (2 H-bonds) and G-C (3 H-bonds) base-pair rungs alongside Franklin Photo 51 X-ray cross.',
    cam: { target: [0, 1.35, 0], az: 24, el: 20, dist: 7.2 },
    lit: 'bdna_helix',
    parts: ['bdna_helix', 'photo51_cross'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Transcription & codons',
    fig: 'Figure 11.3 & 11.6 · Khorana’s triplet codons & RNA polymerase transcription bubble',
    title: 'Transcription & the 64-Codon Cipher',
    alt: '3D RNA polymerase unwinding a DNA transcription bubble to synthesize single-stranded mRNA with U pairing with A.',
    cam: { target: [14, 1.35, 0], az: -22, el: 20, dist: 7.2 },
    lit: 'rnapol_bubble',
    parts: ['rnapol_bubble', 'mrna_ribbon'],
    look: { xray: 0.18, section: 0 },
  },
  {
    tab: '3D Ribosome E/P/A',
    fig: 'Figure 11.4–11.5 · 3D Two-subunit ribosome (E, P, A sites), tRNA adaptors & folding chain',
    title: 'The Ribosome Protein Printer',
    alt: '3D small and large ribosomal subunits stepping 3 bases per codon along mRNA as tRNAs deliver amino acids to the growing polypeptide chain.',
    cam: { target: [28, 1.35, 0], az: 20, el: 22, dist: 7.2 },
    lit: 'ribosome_large',
    parts: ['ribosome_large', 'ribosome_small', 'trna_adaptors'],
    look: { xray: 0.25, section: 0 },
  },
  {
    tab: 'HbS vs silent mutation',
    fig: 'Figure 11.7–11.9 · β-Globin GAG→GTG sickle-cell fibre polymerisation vs silent codon change',
    title: 'Point Mutations: Sickle-Cell vs Silent',
    alt: '3D comparison of normal biconcave RBC with soluble HbA versus sickled RBC deformed by hydrophobic HbS Val6 polymer fibres.',
    cam: { target: [42, 1.35, 0], az: 24, el: 20, dist: 7.4 },
    lit: 'hbs_sickle_rbc',
    parts: ['hba_normal_rbc', 'hbs_sickle_rbc'],
    look: { xray: 0.2, section: 0 },
  },
];

export const PLATES = {
  bdna_helix: {
    text: 'Watson, Crick, Wilkins & Franklin’s B-DNA double helix: two antiparallel deoxyribose-phosphate backbones outside, purine–pyrimidine rungs inside (A=T with 2 H-bonds, G≡C with 3 H-bonds, 10 bp per 3.4 nm turn).',
    facts: s => [['G≡C share', `${(s.dna.gcFraction * 100).toFixed(0)}%`], ['H-bonds (30 bp)', `${s.dna.totalHBonds}`]],
  },
  photo51_cross: {
    text: 'Rosalind Franklin & Raymond Gosling’s May 1952 Photo 51: the X-shaped diffraction cross proves a helix; the missing 4th layer line reveals the major/minor groove offset; the 10th layer line fixes the 0.34 nm base-pair rise.',
  },
  rnapol_bubble: {
    text: 'RNA polymerase holoenzyme: unwinds a local 14-bp transcription bubble and reads the 3′→5′ DNA template strand to synthesize complementary 5′→3′ mRNA using ribose and uracil (U) in place of thymine (T).',
  },
  mrna_ribbon: {
    text: 'Har Gobind Khorana’s synthetic polyribonucleotide proof: non-overlapping 3-letter codons (4³ = 64 triplets for 20 amino acids + 3 stop signals) make the genetic code degenerate yet unambiguous.',
  },
  ribosome_large: {
    text: '60S (eukaryotic) / 50S (prokaryotic) large ribosomal subunit: houses the E (Exit), P (Peptidyl), and A (Aminoacyl) tRNA pockets and the rRNA peptidyl-transferase ribozyme that forms peptide bonds.',
  },
  ribosome_small: {
    text: '40S / 30S small ribosomal subunit: clamps the mRNA tape and checks codon–anticodon base pairing one triplet (3 bases) at a time.',
  },
  trna_adaptors: {
    text: 'Cloverleaf / L-shaped transfer RNA (tRNA) adaptors: carry a 3-base anticodon at one end and the matching specific amino acid covalently attached at the 3′ CCA stem.',
  },
  hba_normal_rbc: {
    text: 'Wild-type β-globin (codon 6 GAG → hydrophilic Glutamate) or silent mutation (CTT→CTC → still Leucine): haemoglobin tetramers stay soluble and red blood cells remain flexible biconcave discs.',
  },
  hbs_sickle_rbc: {
    text: 'Vernon Ingram’s sickle-cell proof: a single A→T transversion (GAG→GUG) replaces charged Glu6 with hydrophobic Val6, creating a sticky patch on deoxy-HbS that polymerises into rigid 14-strand rods.',
    facts: s => [['Codon 6', s.mut.codon6], ['Residue 6', s.mut.amino6], ['Cell shape', s.mut.rbcShape]],
  },
};

export const CHAPTER = {
  subject: SUBJECT,
  no: 11,
  PAGES,
  PLATES,
  clock0: 0,
  cuts: true,
  xrayKeys: ['rnapol_bubble', 'ribosome_large', 'hbs_sickle_rbc'],
  cutKeys: ['ribosome_large', 'hbs_sickle_rbc'],
  cutPlane: [0, 0, -1, 0.05],
  defaultParams: { gcPct: 50, codonStep: 2, mutationMode: 1 },
  controls: [
    { id: 'gcPct', label: 'DNA G≡C base-pair content', min: 20, max: 80, step: 5, value: 50, unit: '%' },
    { id: 'codonStep', label: 'Ribosome codon step', min: 1, max: 5, step: 1, value: 2, unit: 'codon' },
    { id: 'mutationMode', label: 'β-globin allele (0=WT, 1=HbS, 2=Silent)', min: 0, max: 2, step: 1, value: 1, unit: '' },
  ],
  lessons: {
    'ch11-avery-photo51-3d': { page: 0, params: { gcPct: 55 } },
    'ch11-khorana-transcription-3d': { page: 1, params: { codonStep: 3 } },
    'ch11-ribosome-3d': { page: 2, params: { codonStep: 4 } },
    'ch11-sickle-silent-3d': { page: 3, params: { mutationMode: 1 } },
  },
  sonify(ctx, s, page) {
    playTone(ctx, { freq: 220 + s.codonStep * 65, dur: 0.055, type: 'triangle', gain: 0.03 });
  },
  state(clock, reduced) {
    const p = CHAPTER.params || CHAPTER.defaultParams;
    const t = reduced ? 1.5 : clock;
    const dna = M.chargaffHelixAccount(p.gcPct / 100, 30);
    const modeKey = p.mutationMode === 0 ? 'wildtype' : p.mutationMode === 2 ? 'silent' : 'sickle';
    const mut = M.betaGlobinMutationAccount(modeKey);
    return { t, dna, mut, gcPct: p.gcPct, codonStep: p.codonStep, mutationMode: p.mutationMode };
  },
  readout(s, page, pageIdx) {
    if (pageIdx === 0) {
      return `<b>B-DNA (30 bp = ${s.dna.lengthNm.toFixed(1)} nm, ${s.dna.turns.toFixed(1)} turns)</b> · G≡C = ${s.gcPct}% (${s.dna.nGC} bp × 3 H-bonds) · A=T = ${100 - s.gcPct}% (${s.dna.nAT} bp × 2 H-bonds) · Total = <b>${s.dna.totalHBonds} H-bonds</b>.`;
    }
    if (pageIdx === 1) {
      return `<b>Transcription & Khorana’s 64 Codons</b> · RNA polymerase reads template DNA 3′→5′ to synthesize 5′→3′ mRNA: <b>${s.mut.mrna}</b>.`;
    }
    if (pageIdx === 2) {
      return `<b>Ribosome Translocation Step ${s.codonStep} / 5</b> · Small 40S subunit decodes mRNA triplets · Large 60S subunit catalyses peptide bond across P → A sites.`;
    }
    return `<b>β-Globin Codon 6 = ${s.mut.codon6} (${s.mut.amino6})</b> · Outcome: <b>${s.mut.rbcShape}</b>.`;
  },
  buildWorld(E) {
    const { scene, asm } = E;
    const root = new THREE.Group();
    scene.add(root);
    studioGrid(root, { x0: -4, x1: 48 });
    const labels = [];
    const label = (cls, html, at, opts = {}) => labels.push({ cls, html, at, ...opts });

    // Station 0 (x = 0): 3D B-DNA Double Helix & Photo 51 Cross
    const dnaAsm = asm('bdna_helix', root, { title: '3D Antiparallel B-DNA Double Helix', sub: '0.34 nm rise, 10 bp per 3.4 nm turn' });
    const helixGroup = buildHelix(dnaAsm, { turns: 1.8, rungs: 16, radius: 0.58, height: 2.5, x0: -0.7, y0: 1.35, z0: 0 });

    const p51Asm = asm('photo51_cross', root, { title: 'Franklin’s Photo 51 X-ray cross', sub: 'Helical Bessel diffraction pattern' });
    p51Asm.position.set(1.25, 1.35, 0);
    part(p51Asm, cyl(0.85, 0.08, 28), { pal: 'paper', tone: 'mid', rot: [Math.PI / 2, 0, 0], ex: [0.35, 0, 0], name: 'X-ray film plate' });
    const arm1 = rod(p51Asm, { r: 0.038, pal: 'ink', tone: 'lit', name: 'Helical X-cross arm' });
    arm1.set(V(-0.52, -0.58, 0.06), V(0.52, 0.58, 0.06));
    const arm2 = rod(p51Asm, { r: 0.038, pal: 'ink', tone: 'lit', name: 'Helical X-cross arm' });
    arm2.set(V(-0.52, 0.58, 0.06), V(0.52, -0.58, 0.06));
    label('board', 'B-DNA double helix', () => V(-0.7, 2.75, 0));
    label('board', 'Photo 51 X-cross', () => V(1.25, 2.4, 0));

    // Station 1 (x = 14): RNA Polymerase Transcription Bubble & mRNA Ribbon
    const polAsm = asm('rnapol_bubble', root, { title: 'RNA Polymerase transcription bubble', sub: 'Unwinds DNA locally at 37 °C' });
    polAsm.position.set(14.0, 1.35, 0);
    prims.blob(polAsm, { r: 0.85, subdiv: 3, seed: 17, pal: 'blue', cleft: { dir: [0, 0, 1], depth: 0.55, width: 0.55 }, name: 'RNA Polymerase core' });

    const mrnaAsm = asm('mrna_ribbon', root, { title: 'Synthesized single-stranded mRNA', sub: 'Ribose backbone with A, U, G, C triplets' });
    mrnaAsm.position.set(14.0, 1.35, 0.25);
    const mPts = [V(-1.3, 0, 0), V(-0.4, 0.15, 0.2), V(0.4, -0.25, 0.35), V(1.35, -0.65, 0.45)];
    part(mrnaAsm, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(mPts), 32, 0.055, 10, false), { pal: 'red', tone: 'lit', ex: [0, -0.45, 0.45], name: '5′→3′ mRNA transcript' });
    label('board', 'RNA Polymerase', () => V(14.0, 2.4, 0));
    label('board', 'mRNA transcript', () => V(15.1, 0.85, 0.45));

    // Station 2 (x = 28): 3D Two-Subunit Ribosome (60S + 40S) & E/P/A tRNA Adaptors
    const lgAsm = asm('ribosome_large', root, { title: 'Large 60S ribosomal subunit', sub: 'Peptidyl-transferase catalytic dome' });
    lgAsm.position.set(28.0, 1.65, 0);
    prims.blob(lgAsm, { r: 0.88, subdiv: 3, seed: 31, pal: 'ochre', cleft: { dir: [0, -1, 0.3], depth: 0.48, width: 0.6 }, name: 'Large ribosomal subunit' });

    const smAsm = asm('ribosome_small', root, { title: 'Small 40S ribosomal subunit', sub: 'mRNA decoding channel' });
    smAsm.position.set(28.0, 0.82, 0);
    prims.blob(smAsm, { r: 0.62, subdiv: 3, seed: 42, pal: 'blue', name: 'Small ribosomal subunit' });

    const trnaAsm = asm('trna_adaptors', root, { title: 'E, P & A site tRNAs + nascent peptide', sub: 'Steps 3 bases per translocation cycle' });
    trnaAsm.position.set(28.0, 1.25, 0.38);
    const trnaGroup = new THREE.Group();
    trnaAsm.add(trnaGroup);
    for (const [idx, pal, nm] of [[-1, 'dark', 'E-site tRNA'], [0, 'green', 'P-site peptidyl-tRNA'], [1, 'red', 'A-site aminoacyl-tRNA']]) {
      part(trnaGroup, capsule(0.11, 0.32, 8, 14), { pal, tone: 'lit', pos: [idx * 0.36, 0, 0], ex: [idx * 0.25, 0, 0.45], name: nm });
    }
    const pepChain = [];
    for (let k = 0; k < 6; k++) {
      pepChain.push(part(trnaGroup, sphere(0.11, 14), { pal: k % 2 === 0 ? 'green' : 'blue', tone: 'lit', pos: [0, 0.38 + k * 0.19, 0.1], ex: [0, 0.55, 0.35], name: `Amino acid ${k + 1}` }));
    }
    label('board', '60S + 40S Ribosome', () => V(28.0, 2.65, 0));
    label('board', 'E · P · A tRNAs', () => V(28.0, 1.25, 0.95));

    // Station 3 (x = 42): Normal HbA RBC vs Sickled HbS RBC & Fibres
    const hbaAsm = asm('hba_normal_rbc', root, { title: 'Wild-type HbA (Glu6) or Silent RBC', sub: 'Flexible biconcave disc' });
    hbaAsm.position.set(40.8, 1.35, 0);
    part(hbaAsm, rbcGeo(0.76, 0), { pal: 'red', tone: 'lit', rot: [0.45, 0.2, 0], ex: [-0.45, 0.3, 0], name: 'Biconcave HbA red blood cell' });

    const hbsAsm = asm('hbs_sickle_rbc', root, { title: 'Mutant HbS (Val6) RBC & polymer rods', sub: 'GAG→GTG sticky hydrophobic patch' });
    hbsAsm.position.set(43.0, 1.35, 0);
    const mutRbc = part(hbsAsm, rbcGeo(0.78, 1.0), { pal: 'ochre', tone: 'lit', rot: [0.45, -0.2, 0], ex: [0.45, 0.3, 0], name: 'Mutant RBC' });
    const fibreRod = part(hbsAsm, cyl(0.08, 1.65, 14), { pal: 'ink', tone: 'lit', rot: [0, 0, 1.15], ex: [0.45, -0.35, 0.35], name: 'Polymerised HbS rod fibre' });
    label('board', 'Soluble HbA disc', () => V(40.8, 2.35, 0));
    label('board', 'HbS sickle / Silent', () => V(43.0, 2.35, 0));

    return {
      labels,
      update(s) {
        helixGroup.rotation.y = s.t * 0.45;
        pepChain.forEach((m, idx) => {
          m.visible = idx <= s.codonStep;
        });
        const isSickle = s.mut.polymerisesDeoxy;
        mutRbc.scale.set(isSickle ? 1.25 : 1.0, 1.0, isSickle ? 0.68 : 1.0);
        fibreRod.visible = isSickle;
      },
    };
  },
};
