import { SUBJECT } from '../subject.js';
import {
  THREE, part, box, cyl, sphere, capsule, rod,
  prims, rbcGeo, studioGrid, playTone, V
} from '@saxster/atlas/bio_kit.js';
import * as M from './model.js';

export const PAGES = [
  {
    tab: 'Mendel 3:1 board',
    fig: 'Figure 13.1 & 13.3 · Mendel’s 3D Punnett/Galton segregation board & 1:2:1 genotype bars',
    title: 'Mendel’s Law of Segregation & Large Numbers',
    alt: '3D Punnett segregation board and 1:2:1 genotypic (TT, Tt, tt) columns converging as pea sample size N increases.',
    cam: { target: [0, 1.35, 0], az: 24, el: 22, dist: 7.4 },
    lit: 'genotype_bars',
    parts: ['genotype_bars', 'punnett_grid'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Loci & test cross',
    fig: 'Figure 13.2 & 13.4 · 3D Homologous chromosome loci, alleles & recessive test-cross detective',
    title: 'Homologous Loci & the Recessive Test Cross',
    alt: '3D maternal and paternal homologous chromosomes with aligned gene loci alongside a recessive tt test cross.',
    cam: { target: [14, 1.35, 0], az: -22, el: 20, dist: 7.2 },
    lit: 'homologous_pair',
    parts: ['homologous_pair', 'pedigree_tree'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'ABO codominance',
    fig: 'Figure 13.5–13.6 · 3D ABO red blood cell surface glycoproteins (I^A, I^B, I^A I^B, ii)',
    title: 'Multiple Alleles & ABO Codominance',
    alt: '3D red blood cells displaying A-antigen spheres, B-antigen cones, both (Group AB codominance), or neither (Group O).',
    cam: { target: [28, 1.35, 0], az: 20, el: 20, dist: 7.4 },
    lit: 'ab_rbc',
    parts: ['a_b_rbcs', 'ab_rbc'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'X/Y & sex-linked',
    fig: 'Figure 13.7–13.9 · 3D X (155 Mb) vs Y (57 Mb) chromosomes & X-linked recessive inheritance',
    title: 'Sex Determination & X-Linked Loci',
    alt: '3D size comparison of the large gene-rich X chromosome and small Y chromosome explaining male hemizygous X-linked traits.',
    cam: { target: [42, 1.35, 0], az: 24, el: 20, dist: 7.2 },
    lit: 'xy_chromosomes',
    parts: ['xy_chromosomes', 'xlinked_bars'],
    look: { xray: 0, section: 0 },
  },
];

export const PLATES = {
  genotype_bars: {
    text: 'Gregor Mendel’s 1866 particulate model: crossing two F₁ heterozygotes (Tt × Tt) produces ¼ TT : ½ Tt : ¼ tt genotypes, which fold into a 3 : 1 dominant-to-recessive phenotypic ratio.',
    facts: s => [['Ratio', s.mc.ratioLabel], ['Sampling SE', `±${(s.mc.stdError * 100).toFixed(1)}%`]],
  },
  punnett_grid: {
    text: 'Reginald Punnett’s 2×2 gamete probability square: maternal (T or t) and paternal (T or t) haploid gametes combine independently at fertilisation.',
  },
  homologous_pair: {
    text: 'Aligned gene loci along maternal and paternal homologous chromosomes: homozygous (TT or tt) carries identical alleles; heterozygous (Tt) carries two different alleles at the same locus.',
  },
  pedigree_tree: {
    text: 'Pedigree & test-cross detective rules: if two unaffected parents have an affected child, the trait is recessive and both parents are heterozygous carriers (Aa × Aa → ¼ aa).',
  },
  a_b_rbcs: {
    text: 'Group A (I^A I^A or I^A i), Group B (I^B I^B or I^B i), and Group O (ii): i is a recessive null frameshift allele that adds no terminal sugar to the H-antigen stalk.',
  },
  ab_rbc: {
    text: 'True codominance in Group AB (I^A I^B): both glycosyltransferase enzymes are active on the same red blood cell, decorating the membrane with both A and B carbohydrate antigens (not an intermediate blend).',
    facts: s => [['Genotype', s.abo.genotype], ['Group', s.abo.bloodGroup], ['Antigens', s.abo.antigens]],
  },
  xy_chromosomes: {
    text: 'Human sex chromosomes: the large X chromosome (~155 Mb, ~900 genes including Factor VIII and red/green opsins) versus the short Y chromosome (~57 Mb, SRY testis-determining gene) lacking homologous counterparts.',
  },
  xlinked_bars: {
    text: 'Hemizygous male vulnerability: a son inherits his Y chromosome from his father and his sole X from his mother, so a single recessive X^r allele from a carrier mother (X^R X^r) is expressed immediately.',
    facts: s => [['Sons affected', `${(s.xl.pSonAffected * 100).toFixed(0)}%`], ['Daughters carrier', `${(s.xl.pDaughterCarrier * 100).toFixed(0)}%`]],
  },
};

export const CHAPTER = {
  subject: SUBJECT,
  no: 13,
  PAGES,
  PLATES,
  clock0: 0,
  cuts: true,
  defaultParams: { crossMode: 0, sampleN: 400, aboChoice: 2 },
  controls: [
    { id: 'crossMode', label: 'Cross (0=Tt×Tt, 1=Tt×tt, 2=TT×tt)', min: 0, max: 2, step: 1, value: 0, unit: '' },
    { id: 'sampleN', label: 'Sample size N', min: 20, max: 2000, step: 20, value: 400, unit: 'peas' },
    { id: 'aboChoice', label: 'ABO genotype (0=A, 1=B, 2=AB, 3=O)', min: 0, max: 3, step: 1, value: 2, unit: '' },
  ],
  lessons: {
    'ch13-punnett-3d': { page: 0, params: { crossMode: 0, sampleN: 800 } },
    'ch13-locus-3d': { page: 1, params: { crossMode: 1 } },
    'ch13-abo-3d': { page: 2, params: { aboChoice: 2 } },
    'ch13-pedigree-3d': { page: 3 },
  },
  sonify(ctx, s, page) {
    playTone(ctx, { freq: 260 + s.mc.pDominant * 180, dur: 0.055, type: 'sine', gain: 0.03 });
  },
  state(clock, reduced) {
    const p = CHAPTER.params || CHAPTER.defaultParams;
    const t = reduced ? 1.5 : clock;
    const cKey = p.crossMode === 1 ? 'test_hetero' : p.crossMode === 2 ? 'test_homo' : 'f1_self';
    const mc = M.mendelCrossAccount(cKey, p.sampleN);
    const aboPairs = [['IA', 'i'], ['IB', 'i'], ['IA', 'IB'], ['i', 'i']];
    const [a1, a2] = aboPairs[p.aboChoice] || aboPairs[2];
    const abo = M.aboPhenotypeAccount(a1, a2);
    const xl = M.xLinkedCarrierAccount(true, false);
    return { t, mc, abo, xl, sampleN: p.sampleN, aboChoice: p.aboChoice };
  },
  readout(s, page, pageIdx) {
    if (pageIdx === 0) {
      return `<b>${s.mc.ratioLabel} (N = ${s.sampleN} peas)</b> · TT = ${(s.mc.genoTT * 100).toFixed(0)}% · Tt = ${(s.mc.genoTt * 100).toFixed(0)}% · tt = ${(s.mc.genott * 100).toFixed(0)}% · Sampling noise SE = ±${(s.mc.stdError * 100).toFixed(1)}%.`;
    }
    if (pageIdx === 1) {
      return `<b>Homologous Loci & Pedigree Detective</b> · Recessive test cross (T? × tt) reveals whether a tall plant is homozygous TT (100% tall) or heterozygous Tt (1:1 tall:dwarf).`;
    }
    if (pageIdx === 2) {
      return `<b>Genotype ${s.abo.genotype} → Blood Group ${s.abo.bloodGroup}</b> · Surface antigens: <b>${s.abo.antigens}</b> · Plasma antibodies: ${s.abo.antibodies}.`;
    }
    return `<b>X-Linked Recessive Cross (Carrier Mother X^R X^r × Father X^R Y)</b> · Sons affected: <b>50%</b> · Daughters carrier: <b>50%</b> · Daughters affected: <b>0%</b> (father never passes X to sons).`;
  },
  buildWorld(E) {
    const { scene, asm } = E;
    const root = new THREE.Group();
    scene.add(root);
    studioGrid(root, { x0: -4, x1: 48 });
    const labels = [];
    const label = (cls, html, at, opts = {}) => labels.push({ cls, html, at, ...opts });

    // Station 0 (x = 0): 3D Genotype Bars (TT, Tt, tt) + 2x2 Punnett Grid
    const barAsm = asm('genotype_bars', root, { title: '1 : 2 : 1 Genotypic columns (TT, Tt, tt)', sub: 'Folds into 3 : 1 phenotypic ratio' });
    barAsm.position.set(-0.9, 0.1, 0);
    const barTT = part(barAsm, box(0.45, 1.0, 0.45, 0.03), { pal: 'green', tone: 'lit', pos: [-0.6, 0.5, 0], ex: [-0.3, 0.3, 0], name: 'Homozygous dominant (TT)' });
    const barTt = part(barAsm, box(0.45, 1.8, 0.45, 0.03), { pal: 'blue', tone: 'lit', pos: [0, 0.9, 0], ex: [0, 0.4, 0], name: 'Heterozygous carrier (2 Tt)' });
    const bartt = part(barAsm, box(0.45, 1.0, 0.45, 0.03), { pal: 'ochre', tone: 'hi', pos: [0.6, 0.5, 0], ex: [0.3, 0.3, 0], name: 'Homozygous recessive (tt)' });

    const punAsm = asm('punnett_grid', root, { title: '3D Punnett gamete square', sub: '2×2 fertilisation matrix' });
    punAsm.position.set(1.15, 1.15, 0);
    const sqPals = ['green', 'blue', 'blue', 'ochre'];
    for (let i = 0; i < 4; i++) {
      const ix = (i % 2) - 0.5, iy = Math.floor(i / 2) - 0.5;
      part(punAsm, box(0.55, 0.55, 0.18, 0.03), { pal: sqPals[i], tone: 'hi', pos: [ix * 0.65, iy * 0.65, 0], ex: [ix * 0.35, iy * 0.35, 0.3], name: `Punnett cell ${i + 1}` });
    }
    label('board', 'TT : 2 Tt : tt', () => V(-0.9, 2.35, 0));
    label('board', '2×2 Punnett grid', () => V(1.15, 2.25, 0));

    // Station 1 (x = 14): 3D Homologous Chromosome Pair with Loci + Pedigree Tree
    const homAsm = asm('homologous_pair', root, { title: 'Homologous chromosome loci', sub: 'Aligned maternal & paternal alleles' });
    homAsm.position.set(13.1, 1.35, 0);
    part(homAsm, capsule(0.16, 1.35, 10, 18), { pal: 'blue', tone: 'hi', pos: [-0.32, 0, 0], ex: [-0.4, 0, 0], name: 'Paternal homologue' });
    part(homAsm, capsule(0.16, 1.35, 10, 18), { pal: 'red', tone: 'hi', pos: [0.32, 0, 0], ex: [0.4, 0, 0], name: 'Maternal homologue' });
    for (const [ly, pal] of [[-0.4, 'green'], [0.05, 'ochre'], [0.45, 'ink']]) {
      part(homAsm, cyl(0.18, 0.12, 16), { pal, tone: 'lit', pos: [-0.32, ly, 0], ex: [-0.4, 0, 0.25], name: 'Allele locus band' });
      part(homAsm, cyl(0.18, 0.12, 16), { pal, tone: 'lit', pos: [0.32, ly, 0], ex: [0.4, 0, 0.25], name: 'Allele locus band' });
    }

    const pedAsm = asm('pedigree_tree', root, { title: '3D Pedigree inheritance tree', sub: 'Aa × Aa carrier parents → ¼ aa child' });
    pedAsm.position.set(15.1, 1.35, 0);
    part(pedAsm, box(0.32, 0.32, 0.32, 0.03), { pal: 'blue', tone: 'hi', pos: [-0.45, 0.45, 0], ex: [-0.3, 0.3, 0], name: 'Carrier father (Aa)' });
    part(pedAsm, sphere(0.2, 18), { pal: 'blue', tone: 'hi', pos: [0.45, 0.45, 0], ex: [0.3, 0.3, 0], name: 'Carrier mother (Aa)' });
    part(pedAsm, sphere(0.22, 18), { pal: 'red', tone: 'lit', pos: [0, -0.45, 0], ex: [0, -0.35, 0], name: 'Affected child (aa)' });
    const l1 = rod(pedAsm, { r: 0.02, pal: 'dark', tone: 'mid', name: 'Marriage line' });
    l1.set(V(-0.45, 0.45, 0), V(0.45, 0.45, 0));
    const l2 = rod(pedAsm, { r: 0.02, pal: 'dark', tone: 'mid', name: 'Descent line' });
    l2.set(V(0, 0.45, 0), V(0, -0.45, 0));
    label('board', 'Homologous loci', () => V(13.1, 2.4, 0));
    label('board', 'Pedigree Aa × Aa', () => V(15.1, 2.25, 0));

    // Station 2 (x = 28): 3D ABO Red Blood Cell Surface Antigens
    const aboOtherAsm = asm('a_b_rbcs', root, { title: 'Group A, B & O red blood cells', sub: 'Single or null surface antigens' });
    aboOtherAsm.position.set(27.0, 1.35, 0);
    part(aboOtherAsm, rbcGeo(0.58, 0), { pal: 'red', tone: 'hi', pos: [-0.45, 0.35, 0], rot: [0.4, 0, 0], ex: [-0.35, 0.3, 0], name: 'Group A / B RBC' });
    part(aboOtherAsm, rbcGeo(0.58, 0), { pal: 'red', tone: 'mid', pos: [0.45, -0.35, 0], rot: [0.4, 0, 0], ex: [0.35, -0.3, 0], name: 'Group O RBC (ii)' });

    const abAsm = asm('ab_rbc', root, { title: 'Codominant Group AB red blood cell', sub: 'Expresses both A (spheres) & B (cones) antigens' });
    abAsm.position.set(29.0, 1.35, 0);
    part(abAsm, rbcGeo(0.76, 0), { pal: 'red', tone: 'lit', rot: [0.45, 0, 0], ex: [0, 0.3, 0], name: 'RBC membrane' });
    const agA = [], agB = [];
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      const mA = part(abAsm, sphere(0.09, 14), { pal: 'blue', tone: 'lit', pos: [0.82 * Math.cos(a), 0.15 * Math.sin(a * 2), 0.82 * Math.sin(a)], ex: [0.3 * Math.cos(a), 0.25, 0.3 * Math.sin(a)], name: 'Antigen A sugar' });
      const mB = part(abAsm, box(0.14, 0.14, 0.14, 0.02), { pal: 'ochre', tone: 'lit', pos: [0.82 * Math.cos(a + 0.38), -0.12 * Math.cos(a * 2), 0.82 * Math.sin(a + 0.38)], ex: [0.3 * Math.cos(a), -0.25, 0.3 * Math.sin(a)], name: 'Antigen B sugar' });
      agA.push(mA);
      agB.push(mB);
    }
    label('board', 'A · B · O cells', () => V(27.0, 2.35, 0));
    label('board', 'Selected ABO antigens', () => V(29.0, 2.35, 0));

    // Station 3 (x = 42): 3D X (155 Mb) vs Y (57 Mb) Sex Chromosomes
    const xyAsm = asm('xy_chromosomes', root, { title: 'X (155 Mb) vs Y (57 Mb) chromosomes', sub: 'Non-homologous X-linked loci on X' });
    xyAsm.position.set(41.1, 1.35, 0);
    part(xyAsm, capsule(0.18, 1.45, 10, 18), { pal: 'blue', tone: 'lit', pos: [-0.38, 0, 0], ex: [-0.45, 0.25, 0], name: 'Large X chromosome (155 Mb)' });
    part(xyAsm, sphere(0.21, 16), { pal: 'red', tone: 'lit', pos: [-0.38, 0.55, 0], ex: [-0.45, 0.55, 0.25], name: 'X-linked Factor VIII / Opsin locus' });
    part(xyAsm, capsule(0.14, 0.45, 10, 16), { pal: 'ochre', tone: 'hi', pos: [0.38, -0.35, 0], ex: [0.45, -0.25, 0], name: 'Short Y chromosome (57 Mb, SRY)' });

    const xlAsm = asm('xlinked_bars', root, { title: 'X-linked offspring outcome bars', sub: '50% sons affected vs 0% daughters affected' });
    xlAsm.position.set(42.9, 0.1, 0);
    part(xlAsm, box(0.45, 1.4, 0.45, 0.03), { pal: 'red', tone: 'lit', pos: [-0.35, 0.7, 0], ex: [-0.25, 0.3, 0], name: 'Hemizygous X^r Y sons (50% affected)' });
    part(xlAsm, box(0.45, 1.4, 0.45, 0.03), { pal: 'blue', tone: 'hi', pos: [0.35, 0.7, 0], ex: [0.25, 0.3, 0], name: 'Heterozygous X^R X^r daughters (50% carrier)' });
    label('board', 'X (155 Mb) vs Y (57 Mb)', () => V(41.1, 2.45, 0));
    label('board', 'X-linked outcomes', () => V(42.9, 2.25, 0));

    return {
      labels,
      update(s) {
        const hTT = Math.max(0.08, s.mc.genoTT * 2.8);
        const hTt = Math.max(0.08, s.mc.genoTt * 2.8);
        const htt = Math.max(0.08, s.mc.genott * 2.8);
        barTT.scale.y = hTT; barTT.position.y = hTT / 2;
        barTt.scale.y = hTt; barTt.position.y = hTt / 2;
        bartt.scale.y = htt; bartt.position.y = htt / 2;

        const showA = s.aboChoice === 0 || s.aboChoice === 2;
        const showB = s.aboChoice === 1 || s.aboChoice === 2;
        agA.forEach(m => { m.visible = showA; });
        agB.forEach(m => { m.visible = showB; });
      },
    };
  },
};
