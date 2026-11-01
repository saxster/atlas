import { SUBJECT } from '../subject.js';
import {
  THREE, part, box, cyl, sphere, capsule, rod,
  prims, buildHelix, studioGrid, playTone, V
} from '@saxster/atlas/bio_kit.js';
import * as M from './model.js';

export const PAGES = [
  {
    tab: 'Meselson–Stahl',
    fig: 'Figure 12.1–12.2 · Meselson–Stahl ¹⁵N/¹⁴N CsCl density tubes & semi-conservative fork',
    title: 'Semi-Conservative DNA Replication',
    alt: '3D CsCl centrifuge tubes showing heavy, hybrid, and light DNA bands across Generations 0 to 3 alongside a semi-conservative replication fork.',
    cam: { target: [0, 1.35, 0], az: 24, el: 20, dist: 7.4 },
    lit: 'cscl_tubes',
    parts: ['cscl_tubes', 'replication_fork'],
    look: { xray: 0.2, section: 0 },
  },
  {
    tab: '3D Mitosis spindle',
    fig: 'Figure 12.3–12.4 · 3D Mitotic spindle, kinetochore fibres & sister chromatid separation',
    title: 'Mitosis: Identical Diploid Clones (2n → 2n)',
    alt: '3D centrosome poles and spindle fibres pulling sister chromatids apart at anaphase to form two identical diploid nuclei.',
    cam: { target: [14, 1.35, 0], az: -22, el: 20, dist: 7.2 },
    lit: 'sister_chromatids',
    parts: ['spindle_poles', 'sister_chromatids'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Stem-cell landscape',
    fig: 'Figure 12.5–12.6 · Waddington’s 3D epigenetic stem-cell landscape & Gurdon/Yamanaka reprogramming',
    title: 'Stem Cells & Selective Gene Expression',
    alt: '3D branching epigenetic valley landscape where a pluripotent stem cell differentiates into specialized cell lineages while keeping the same genome.',
    cam: { target: [28, 1.35, 0], az: 28, el: 24, dist: 7.4 },
    lit: 'waddington_surface',
    parts: ['waddington_surface', 'reprogram_vector'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Meiosis & chiasmata',
    fig: 'Figure 12.7–12.9 · 3D Meiotic homologous bivalent, chiasma crossing-over & Janaki Ammal polyploidy',
    title: 'Meiosis: Halving Ploidy & Shuffling Alleles (2n → n)',
    alt: '3D maternal and paternal homologous chromosomes pairing as a bivalent and exchanging chromatid segments at a chiasma.',
    cam: { target: [42, 1.35, 0], az: 20, el: 20, dist: 7.2 },
    lit: 'bivalent_chiasma',
    parts: ['bivalent_chiasma', 'haploid_gametes'],
    look: { xray: 0, section: 0 },
  },
];

export const PLATES = {
  cscl_tubes: {
    text: 'Matthew Meselson & Franklin Stahl (1958): Gen 0 is 100% heavy ¹⁵N/¹⁵N (1.724 g/cm³); Gen 1 is a single 100% hybrid ¹⁵N/¹⁴N band (1.717 g/cm³, ruling out conservative replication); Gen 2 splits 50% hybrid + 50% light ¹⁴N/¹⁴N (1.710 g/cm³, ruling out dispersive).',
    facts: s => [['Gen', `${s.ms.generation}`], ['Hybrid', `${(s.ms.hybridFrac * 100).toFixed(0)}%`], ['Light', `${(s.ms.lightFrac * 100).toFixed(0)}%`]],
  },
  replication_fork: {
    text: 'Helicase unzips hydrogen bonds while DNA polymerase III synthesizes two new complementary strands—each daughter double helix conserves one parental strand and one newly synthesized strand.',
  },
  spindle_poles: {
    text: 'Walther Flemming’s mitotic apparatus: centrosome microtubule-organising centres extend kinetochore spindle fibres that align replicated chromosomes at the metaphase plate.',
  },
  sister_chromatids: {
    text: 'Anaphase cohesin cleavage: sister chromatids separate to opposite poles so each daughter cell inherits a complete, identical 2n = 46 diploid genome (used in growth, tissue repair, and asexual crop cloning).',
  },
  waddington_surface: {
    text: 'Differential gene expression: every somatic cell in your body carries the same 46 chromosomes, but transcription factors switch on β-globin in erythroblasts, insulin in β-cells, and voltage-gated channels in neurones.',
  },
  reprogram_vector: {
    text: 'John Gurdon’s nuclear transfer & Shinya Yamanaka’s 4 transcription factors (Oct4, Sox2, Klf4, c-Myc): prove differentiation is reversible without losing any genes, pushing adult cells back uphill to iPSCs.',
  },
  bivalent_chiasma: {
    text: 'Prophase I synapsis & crossing-over: maternal and paternal homologous chromosomes pair up and swap non-sister chromatid segments at chiasmata, creating recombinant chromosomes.',
  },
  haploid_gametes: {
    text: 'Two divisions (Meiosis I separates homologues; Meiosis II separates sister chromatids) produce 4 genetically distinct haploid (n = 23) gametes; in uneven triploids (3n = 33 Cavendish banana), homologous pairing fails, causing seedless sterility.',
  },
};

export const CHAPTER = {
  subject: SUBJECT,
  no: 12,
  PAGES,
  PLATES,
  clock0: 0,
  cuts: true,
  xrayKeys: ['cscl_tubes'],
  cutKeys: ['cscl_tubes'],
  cutPlane: [0, 0, -1, 0.05],
  defaultParams: { meselsonGen: 2, anaphasePull: 55 },
  controls: [
    { id: 'meselsonGen', label: 'Meselson–Stahl generation in ¹⁴N', min: 0, max: 3, step: 1, value: 2, unit: 'gen' },
    { id: 'anaphasePull', label: 'Spindle anaphase separation', min: 0, max: 100, step: 5, value: 55, unit: '%' },
  ],
  lessons: {
    'ch12-meselson-chromatid-3d': { page: 0, params: { meselsonGen: 2 } },
    'ch12-mitosis-spindle-3d': { page: 1, params: { anaphasePull: 65 } },
    'ch12-stem-waddington-3d': { page: 2 },
    'ch12-meiosis-polyploid-3d': { page: 3, params: { anaphasePull: 45 } },
  },
  sonify(ctx, s, page) {
    playTone(ctx, { freq: 240 + s.ms.generation * 90, dur: 0.06, type: 'sine', gain: 0.03 });
  },
  state(clock, reduced) {
    const p = CHAPTER.params || CHAPTER.defaultParams;
    const t = reduced ? 1.5 : clock;
    const ms = M.meselsonStahlAccount(p.meselsonGen);
    return { t, ms, meselsonGen: p.meselsonGen, anaphasePull: (p.anaphasePull || 0) / 100 };
  },
  readout(s, page, pageIdx) {
    if (pageIdx === 0) {
      return `<b>Generation G_${s.ms.generation} (${s.ms.totalDuplexes} DNA duplexes)</b> · Heavy ¹⁵N/¹⁵N: <b>${(s.ms.heavyFrac * 100).toFixed(0)}%</b> · Hybrid ¹⁵N/¹⁴N: <b>${(s.ms.hybridFrac * 100).toFixed(0)}%</b> · Light ¹⁴N/¹⁴N: <b>${(s.ms.lightFrac * 100).toFixed(0)}%</b>.`;
    }
    if (pageIdx === 1) {
      return `<b>3D Mitotic Spindle</b> · Anaphase separation = ${(s.anaphasePull * 100).toFixed(0)}% · 1 DNA replication + 1 nuclear division → <b>2 genetically identical 2n diploid cells</b>.`;
    }
    if (pageIdx === 2) {
      return `<b>Waddington Stem-Cell Landscape</b> · Genome is identical across all somatic cells; differential mRNA transcription carves neurone, muscle, and β-cell valleys.`;
    }
    return `<b>3D Meiosis & Chiasmata</b> · Homologous bivalents exchange alleles in Prophase I · 1 replication + 2 divisions → <b>4 unique haploid (n) gametes</b> (2²³ = 8.4 million assortments).`;
  },
  buildWorld(E) {
    const { scene, asm } = E;
    const root = new THREE.Group();
    scene.add(root);
    studioGrid(root, { x0: -4, x1: 48 });
    const labels = [];
    const label = (cls, html, at, opts = {}) => labels.push({ cls, html, at, ...opts });

    // Station 0 (x = 0): Meselson-Stahl CsCl Centrifuge Tube + Semi-Conservative Fork
    const tubeAsm = asm('cscl_tubes', root, { title: 'CsCl buoyant-density centrifuge tube', sub: 'Heavy (bottom), Hybrid (middle), Light (top)' });
    tubeAsm.position.set(-0.9, 0.2, 0);
    part(tubeAsm, cyl(0.55, 1.85, 24), { pal: 'paper', tone: 'mid', pos: [0, 0.95, 0], mat: shadeMat('paper', { opacity: 0.4 }), name: 'Quartz ultracentrifuge tube' });
    const bandHeavy = part(tubeAsm, cyl(0.51, 0.14, 22), { pal: 'ink', tone: 'lit', pos: [0, 0.45, 0], ex: [-0.35, -0.25, 0], name: 'Heavy ¹⁵N/¹⁵N band (1.724 g/cm³)' });
    const bandHybrid = part(tubeAsm, cyl(0.51, 0.14, 22), { pal: 'ochre', tone: 'lit', pos: [0, 0.95, 0], ex: [-0.35, 0.0, 0], name: 'Hybrid ¹⁵N/¹⁴N band (1.717 g/cm³)' });
    const bandLight = part(tubeAsm, cyl(0.51, 0.14, 22), { pal: 'blue', tone: 'lit', pos: [0, 1.45, 0], ex: [-0.35, 0.25, 0], name: 'Light ¹⁴N/¹⁴N band (1.710 g/cm³)' });

    const forkAsm = asm('replication_fork', root, { title: 'Semi-conservative replication fork', sub: '1 old strand + 1 new strand per daughter' });
    buildHelix(forkAsm, { turns: 1.4, rungs: 12, radius: 0.5, height: 2.1, x0: 1.15, y0: 1.35, z0: 0, palA: 'ink', palB: 'ochre' });
    label('board', 'CsCl density bands', () => V(-0.9, 2.35, 0));
    label('board', '¹⁵N/¹⁴N hybrid duplex', () => V(1.15, 2.55, 0));

    // Station 1 (x = 14): 3D Mitotic Spindle & Sister Chromatid Separation
    const poleAsm = asm('spindle_poles', root, { title: 'Centrosome poles & kinetochore spindle', sub: 'Microtubule traction apparatus' });
    poleAsm.position.set(14.0, 1.35, 0);
    part(poleAsm, sphere(0.2, 16), { pal: 'ochre', tone: 'lit', pos: [-1.45, 0, 0], ex: [-0.45, 0, 0], name: 'Left centrosome pole' });
    part(poleAsm, sphere(0.2, 16), { pal: 'ochre', tone: 'lit', pos: [1.45, 0, 0], ex: [0.45, 0, 0], name: 'Right centrosome pole' });
    for (const sy of [-0.45, 0, 0.45]) {
      const f = rod(poleAsm, { r: 0.018, pal: 'dark', tone: 'mid', name: 'Spindle microtubule' });
      f.set(V(-1.45, 0, 0), V(1.45, sy * 1.4, 0));
    }

    const sisAsm = asm('sister_chromatids', root, { title: 'Separating sister chromatids', sub: 'Identical copies pulled to opposite poles' });
    sisAsm.position.set(14.0, 1.35, 0);
    const sisLeft = new THREE.Group();
    const sisRight = new THREE.Group();
    sisAsm.add(sisLeft, sisRight);
    for (const [idx, sy, pal] of [[0, -0.42, 'blue'], [1, 0, 'red'], [2, 0.42, 'green']]) {
      part(sisLeft, capsule(0.09, 0.32, 8, 14), { pal, tone: 'lit', pos: [0, sy, 0], rot: [0, 0, 0.3], ex: [-0.35, sy * 0.5, 0], name: `Left daughter chromosome ${idx + 1}` });
      part(sisRight, capsule(0.09, 0.32, 8, 14), { pal, tone: 'lit', pos: [0, sy, 0], rot: [0, 0, -0.3], ex: [0.35, sy * 0.5, 0], name: `Right daughter chromosome ${idx + 1}` });
    }
    label('board', 'Mitotic spindle (2n → 2n)', () => V(14.0, 2.35, 0));

    // Station 2 (x = 28): Waddington 3D Stem-Cell Landscape & Yamanaka Reprogramming Vector
    const wadAsm = asm('waddington_surface', root, { title: 'Waddington epigenetic landscape', sub: 'Pluripotent peak → specialized valleys' });
    wadAsm.position.set(27.0, 0.25, -0.6);
    const axW = prims.axes(wadAsm, { x: [-1.2, 1.2], y: [0, 2.2], z: [-1.2, 1.2], size: [2.2, 1.6, 1.8] });
    prims.surface(axW, (x, z) => M.waddingtonLandscapeHeight(x, z), { segs: 24, pal: 'green', opacity: 0.82 });

    const repAsm = asm('reprogram_vector', root, { title: 'Yamanaka iPSC reprogramming vector', sub: 'Pushes adult somatic cell back to pluripotency' });
    repAsm.position.set(27.0, 0.25, -0.6);
    prims.vector(axW, [0.75, M.waddingtonLandscapeHeight(0.75, 0.9) + 0.1, 0.9], [-0.75, 0.65, -1.7], { pal: 'red' });
    label('board', 'Waddington stem-cell valleys', () => V(28.1, 2.25, -0.6));

    // Station 3 (x = 42): Meiotic Homologous Bivalent with Chiasma Crossing-Over
    const bivAsm = asm('bivalent_chiasma', root, { title: 'Homologous bivalent & chiasma crossover', sub: 'Maternal & paternal non-sister chromatid swap' });
    bivAsm.position.set(41.2, 1.35, 0);
    part(bivAsm, capsule(0.13, 0.95, 10, 16), { pal: 'blue', tone: 'lit', pos: [-0.24, 0, 0], rot: [0, 0, -0.22], ex: [-0.4, 0.3, 0], name: 'Paternal homologue' });
    part(bivAsm, capsule(0.13, 0.95, 10, 16), { pal: 'red', tone: 'lit', pos: [0.24, 0, 0], rot: [0, 0, 0.22], ex: [0.4, 0.3, 0], name: 'Maternal homologue' });
    part(bivAsm, sphere(0.16, 16), { pal: 'ochre', tone: 'lit', pos: [0, 0.08, 0.12], ex: [0, 0, 0.45], name: 'Chiasma crossover point' });

    const gamAsm = asm('haploid_gametes', root, { title: 'Four unique haploid (n) gametes', sub: 'Independent assortment + recombination' });
    gamAsm.position.set(43.0, 1.35, 0);
    const gamPals = ['blue', 'red', 'green', 'ochre'];
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2 + 0.4;
      part(gamAsm, sphere(0.28, 18), { pal: gamPals[i], tone: 'hi', pos: [0.48 * Math.cos(a), 0.48 * Math.sin(a), 0], ex: [0.35 * Math.cos(a), 0.35 * Math.sin(a), 0], name: `Haploid gamete ${i + 1}` });
    }
    label('board', 'Chiasma bivalent', () => V(41.2, 2.35, 0));
    label('board', '4 Haploid (n) cells', () => V(43.0, 2.35, 0));

    return {
      labels,
      update(s) {
        bandHeavy.visible = s.ms.heavyFrac > 0;
        bandHybrid.visible = s.ms.hybridFrac > 0;
        bandHybrid.scale.y = 0.5 + s.ms.hybridFrac * 1.1;
        bandLight.visible = s.ms.lightFrac > 0;
        bandLight.scale.y = 0.5 + s.ms.lightFrac * 1.1;

        const sep = 0.12 + s.anaphasePull * 0.85;
        sisLeft.position.x = -sep;
        sisRight.position.x = sep;
      },
    };
  },
};
