import { SUBJECT } from '../subject.js';
import {
  THREE, shadeMat, part, box, cyl, sphere, rod, arrow3,
  buildMolecule3D, buildBeaker, studioGrid, playTone, V
} from '@saxster/atlas/chem_kit.js';
import * as M from './model.js';

export const PAGES = [
  {
    tab: 'Proton transfer',
    fig: 'Figure 7.1 · Brønsted–Lowry proton transfer: HA + H₂O ⇌ A⁻ + H₃O⁺ conjugate acid–base pairs',
    title: 'Brønsted–Lowry Proton Transfer',
    alt: '3D acid molecule donating an H+ proton to a water molecule to form hydronium (H3O+) and a conjugate base anion (A-).',
    cam: { target: [0, 1.35, 0], az: 20, el: 20, dist: 6.8 },
    lit: 'hydronium_ion',
    parts: ['acid_donor', 'hydronium_ion'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Strong vs concentrated',
    fig: 'Figure 7.2 · Acid strength (degree of ionization α) versus total solute concentration (mol/L)',
    title: 'Strong vs Concentrated Acids',
    alt: '3D side-by-side beakers contrasting a fully dissociated strong acid with a mostly intact weak acid at equal molarity.',
    cam: { target: [14, 1.35, 0], az: -20, el: 20, dist: 7.0 },
    lit: 'weak_acid_vessel',
    parts: ['strong_acid_vessel', 'weak_acid_vessel'],
    look: { xray: 0.2, section: 0 },
  },
  {
    tab: 'Logarithmic pH scale',
    fig: 'Figure 7.3 · Logarithmic pH ladder: each 1-unit step changes [H₃O⁺] tenfold while [H₃O⁺][OH⁻] = Kw',
    title: 'The Tenfold Logarithmic pH Scale',
    alt: '3D opposing H3O+ and OH- logarithmic columns showing how pH + pOH = 14 across acidic, neutral, and basic solutions.',
    cam: { target: [28, 1.35, 0], az: 24, el: 20, dist: 6.8 },
    lit: 'ph_seesaw',
    parts: ['ph_seesaw', 'kw_fulcrum'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Titration & buffers',
    fig: 'Figure 7.4 · Burette titration curve, equivalence inflection, and conjugate HA/A⁻ buffer plateau',
    title: 'Titration Curve & Buffer Capacity',
    alt: '3D titration burette over a conical flask alongside the 3D sigmoid pH curve showing the buffer plateau and equivalence jump.',
    cam: { target: [42, 1.35, 0], az: 24, el: 20, dist: 7.2 },
    lit: 'titration_burette',
    parts: ['titration_burette', 'buffer_flask', 'sigmoid_curve'],
    look: { xray: 0.2, section: 0 },
  },
];

export const PLATES = {
  acid_donor: {
    text: 'Brønsted–Lowry acid donor (HA) and conjugate base (A⁻): donating a bare proton (H⁺ nucleus) leaves the shared electron pair behind on A⁻, conserving both atoms and net charge.',
  },
  hydronium_ion: {
    text: 'Hydronium ion (H₃O⁺): in water, a bare H⁺ proton never floats free—it immediately bonds to a lone pair on H₂O to form pyramidal H₃O⁺.',
  },
  strong_acid_vessel: {
    text: 'Strong acid (e.g. HCl, pKa < 0): nearly 100% of dissolved HA molecules transfer their proton to water, even when the solution is dilute.',
  },
  weak_acid_vessel: {
    text: 'Weak acid (e.g. CH₃COOH, pKa = 4.76): establishes a reversible equilibrium where ~98–99% of molecules remain undissociated HA at 0.10 M.',
    facts: s => [['Molarity c', `${s.acid.concentrationM.toFixed(2)} M`], ['Ionized α', `${s.acid.alphaPct.toFixed(1)}%`], ['Solution pH', `${s.acid.pH.toFixed(2)}`]],
  },
  ph_seesaw: {
    text: 'Logarithmic [H₃O⁺] vs [OH⁻] columns: because pH = −log₁₀[H₃O⁺], stepping from pH 3 to pH 1 means a 10² = 100× increase in hydronium concentration.',
    facts: s => [['pH', `${s.tit.pH.toFixed(2)}`], ['pOH', `${(14 - s.tit.pH).toFixed(2)}`], ['[H₃O⁺]', `${Math.pow(10, -s.tit.pH).toExponential(1)} M`]],
  },
  kw_fulcrum: {
    text: 'Water autoionization constant Kw = [H₃O⁺][OH⁻] = 1.0 × 10⁻¹⁴ at 25 °C: raising [H₃O⁺] automatically depresses [OH⁻] so pH + pOH = 14.',
  },
  titration_burette: {
    text: 'Volumetric burette delivering 0.100 M NaOH titrant: equivalence occurs when moles of added OH⁻ match initial moles of acid (25.0 mL), regardless of whether the acid is strong or weak.',
    facts: s => [['Added NaOH', `${s.tit.addedBaseMl.toFixed(1)} mL`], ['Equivalence V', `${s.tit.eqVolumeMl.toFixed(1)} mL`]],
  },
  buffer_flask: {
    text: 'Conjugate HA / A⁻ buffer reservoir: near half-equivalence (12.5 mL, [HA] ≈ [A⁻]), added OH⁻ is consumed by HA and added H⁺ is consumed by A⁻, resisting pH change.',
    facts: s => [['Flask pH', `${s.tit.pH.toFixed(2)}`], ['Regime', s.tit.regime]],
  },
  sigmoid_curve: {
    text: '3D titration pH curve: shows the flat Henderson–Hasselbalch buffer plateau around pH = pKa (4.76) followed by the steep vertical jump at 25.0 mL.',
  },
};

export const CHAPTER = {
  subject: SUBJECT,
  no: 7,
  PAGES,
  PLATES,
  clock0: 0,
  cuts: true,
  xrayKeys: ['strong_acid_vessel', 'weak_acid_vessel', 'buffer_flask'],
  cutKeys: ['strong_acid_vessel', 'weak_acid_vessel', 'buffer_flask'],
  cutPlane: [0, 0, -1, 0.05],
  defaultParams: { baseMl: 12.5, pKa: 4.76, acidM: 0.10 },
  controls: [
    { id: 'baseMl', label: 'Added 0.10 M NaOH volume', min: 0, max: 40, step: 2.5, value: 12.5, unit: 'mL' },
    { id: 'pKa', label: 'Acid pKa (−2 strong … 6 weak)', min: -2, max: 6, step: 0.5, value: 4.5, unit: 'pKa' },
    { id: 'acidM', label: 'Total acid concentration c', min: 0.02, max: 1.0, step: 0.02, value: 0.10, unit: 'mol/L' },
  ],
  lessons: {
    'proton-transfer': { page: 0, params: { pKa: -2 } },
    'strong-vs-concentrated': { page: 1, params: { pKa: 4.5, acidM: 0.10 } },
    'ph-scale': { page: 2, params: { baseMl: 12.5 } },
    'neutralization-titration': { page: 3, params: { baseMl: 25.0, pKa: 4.5 } },
    'titration-buffers': { page: 3, params: { baseMl: 12.5, pKa: 4.5 } },
    's7-1': { page: 0, params: {} },
    's7-2': { page: 1, params: { pKa: 4.5, acidM: 0.10 } },
    's7-3': { page: 2, params: { baseMl: 12.5 } },
    's7-4': { page: 3, params: { baseMl: 25.0 } },
    's7-5': { page: 3, params: { baseMl: 12.5 } },
  },
  sonify(ctx, s, page) {
    playTone(ctx, { freq: 180 + s.tit.pH * 42, dur: 0.07, type: 'sine', gain: 0.03 });
  },
  state(clock, reduced) {
    const p = CHAPTER.params || CHAPTER.defaultParams;
    const t = reduced ? 0 : clock;
    const acid = M.acidDissociationState(p.acidM, p.pKa);
    const tit = M.titrationCurveState(p.baseMl, 25.0, 0.10, 0.10, Math.max(2.0, p.pKa));
    return { t, acid, tit };
  },
  readout(s, page, pageIdx) {
    if (pageIdx === 0) {
      return `<b>Brønsted–Lowry Proton Transfer</b> · HA + H₂O ⇌ A⁻ + H₃O⁺ · An acid is a proton (H⁺) donor; a base is a proton acceptor; atom counts and total charge balance on both sides.`;
    }
    if (pageIdx === 1) {
      return `<b>Strength vs Concentration (c = ${s.acid.concentrationM.toFixed(2)} M, pKa = ${s.acid.pKa.toFixed(1)})</b> · Degree of ionization α = <b>${s.acid.alphaPct.toFixed(1)}%</b> · pH = <b>${s.acid.pH.toFixed(2)}</b>.`;
    }
    if (pageIdx === 2) {
      return `<b>Logarithmic pH Scale</b> · Current pH = <b>${s.tit.pH.toFixed(2)}</b>, pOH = <b>${(14 - s.tit.pH).toFixed(2)}</b> · Every 1-unit decrease in pH is a <b>10× increase</b> in [H₃O⁺].`;
    }
    return `<b>Titration & Buffer (V_NaOH = ${s.tit.addedBaseMl.toFixed(1)} mL)</b> · Solution pH = <b>${s.tit.pH.toFixed(2)}</b> · ${s.tit.regime}.`;
  },
  buildWorld(E) {
    const { scene, asm } = E;
    const root = new THREE.Group();
    scene.add(root);
    studioGrid(root, { x0: -4, x1: 48 });
    const labels = [];
    const label = (cls, html, at, opts = {}) => labels.push({ cls, html, at, ...opts });

    // Station 0 (x = 0): Bronsted-Lowry Proton Transfer
    const donAsm = asm('acid_donor', root, { title: 'Acid donor (HCl / HA)', sub: 'Transfers H⁺ nucleus to water' });
    buildMolecule3D(donAsm, 'HCl', { scale: 0.55, pos: [-0.85, 1.35, 0] });
    const pBead = part(donAsm, sphere(0.11, 16), { pal: 'red', tone: 'hi', pos: [0, 1.35, 0], ex: [0, 0.45, 0], name: 'Transferred H⁺ proton' });

    const hydAsm = asm('hydronium_ion', root, { title: 'Hydronium conjugate acid (H₃O⁺)', sub: 'Protonated water molecule' });
    buildMolecule3D(hydAsm, 'H3O_plus', { scale: 0.55, pos: [0.85, 1.35, 0] });
    label('board', 'Acid donor (HA)', () => V(-0.85, 2.15, 0));
    label('board', 'H₃O⁺ acceptor', () => V(0.85, 2.15, 0));

    // Station 1 (x = 14): Strong vs Weak Acid Beakers
    const strAsm = asm('strong_acid_vessel', root, { title: 'Strong acid (100% ionized)', sub: 'Separate H₃O⁺ and A⁻ ions' });
    buildBeaker(strAsm, { r: 0.72, h: 1.55, liquidRatio: 0.68, liquidPal: 'red', pos: [13.0, 0.1, 0], name: 'Strong acid vessel' });
    for (let i = 0; i < 6; i++) {
      part(strAsm, sphere(0.1, 14), { pal: i % 2 === 0 ? 'red' : 'green', tone: 'lit', pos: [13.0 + ((i % 3) - 1) * 0.32, 0.55 + Math.floor(i / 3) * 0.35, 0], ex: [0, 0.4, 0], name: i % 2 === 0 ? 'Free H₃O⁺ ion' : 'Free Cl⁻ ion' });
    }

    const wkAsm = asm('weak_acid_vessel', root, { title: 'Weak acid (mostly intact HA)', sub: 'Partial equilibrium dissociation' });
    buildBeaker(wkAsm, { r: 0.72, h: 1.55, liquidRatio: 0.68, liquidPal: 'ochre', pos: [15.0, 0.1, 0], name: 'Weak acid vessel' });
    for (let i = 0; i < 5; i++) {
      buildMolecule3D(wkAsm, 'HCl', { scale: 0.25, pos: [15.0 + ((i % 2) - 0.5) * 0.38, 0.48 + (i % 3) * 0.24, 0] });
    }
    label('board', 'Strong: ~100% ionized', () => V(13.0, 1.95, 0));
    label('board', 'Weak: mostly intact HA', () => V(15.0, 1.95, 0));

    // Station 2 (x = 28): Logarithmic pH See-Saw
    const seeAsm = asm('ph_seesaw', root, { title: 'Logarithmic [H₃O⁺] vs [OH⁻] bars', sub: '10× change per pH unit' });
    seeAsm.position.set(28, 0.1, 0);
    const h3oCol = part(seeAsm, box(0.62, 1.4, 0.62, 0.03), { pal: 'red', tone: 'hi', pos: [-0.65, 0.7, 0], ex: [-0.4, 0.3, 0], name: 'log [H₃O⁺] acidity bar' });
    const ohCol = part(seeAsm, box(0.62, 1.4, 0.62, 0.03), { pal: 'blue', tone: 'hi', pos: [0.65, 0.7, 0], ex: [0.4, 0.3, 0], name: 'log [OH⁻] basicity bar' });

    const kwAsm = asm('kw_fulcrum', root, { title: 'Water Kw = 10⁻¹⁴ fulcrum', sub: 'pH + pOH = 14 at 25 °C' });
    kwAsm.position.set(28, 0.18, 0.55);
    part(kwAsm, box(1.9, 0.14, 0.24, 0.02), { pal: 'paper', tone: 'hi', ex: [0, -0.25, 0.35], name: 'Kw conservation beam' });
    label('board', '[H₃O⁺] vs [OH⁻] (10× per pH)', () => V(28, 2.25, 0));

    // Station 3 (x = 42): Titration Burette, Buffer Flask & Sigmoid Curve
    const burAsm = asm('titration_burette', root, { title: 'Volumetric NaOH burette', sub: 'Delivers measured OH⁻ titrant' });
    burAsm.position.set(41.1, 1.95, 0);
    part(burAsm, cyl(0.14, 1.35, 20), { pal: 'paper', tone: 'hi', mat: shadeMat('paper', { opacity: 0.45 }), ex: [0, 0.45, 0], name: 'Graduated glass burette' });

    const flkAsm = asm('buffer_flask', root, { title: 'Titration & buffer vessel', sub: 'HA / A⁻ conjugate pair' });
    const titBeaker = buildBeaker(flkAsm, { r: 0.68, h: 1.15, liquidRatio: 0.55, liquidPal: 'green', pos: [41.1, 0.1, 0], name: 'Titration flask' });

    const sigAsm = asm('sigmoid_curve', root, { title: 'Sigmoid titration pH curve', sub: 'Buffer plateau + equivalence jump' });
    sigAsm.position.set(42.9, 0.25, 0);
    for (let i = 0; i <= 10; i++) {
      const vb = i * 4;
      const pH = M.titrationCurveState(vb, 25, 0.1, 0.1, 4.76).pH;
      part(sigAsm, sphere(0.075, 12), { pal: Math.abs(vb - 25) < 3 ? 'red' : 'green', tone: 'hi', pos: [(i - 5) * 0.22, (pH / 14) * 1.9, 0], ex: [0.35, 0, 0], name: `pH at ${vb} mL` });
    }
    const markerBead = part(sigAsm, sphere(0.14, 16), { pal: 'ochre', tone: 'lit', pos: [0, 0.65, 0.12], name: 'Current titration point' });
    label('board', 'Burette & buffer flask', () => V(41.1, 2.75, 0));
    label('board', 'Buffer plateau & equivalence jump', () => V(42.9, 2.35, 0));

    return {
      labels,
      update(s) {
        pBead.position.x = Math.sin(s.t * 2.4) * 0.48;
        const hRatio = Math.max(0.15, (14 - s.tit.pH) / 14);
        const ohRatio = Math.max(0.15, s.tit.pH / 14);
        h3oCol.scale.y = hRatio * 1.4;
        h3oCol.position.y = (hRatio * 1.4 * 1.4) / 2;
        ohCol.scale.y = ohRatio * 1.4;
        ohCol.position.y = (ohRatio * 1.4 * 1.4) / 2;

        titBeaker.setLevel(0.45 + (s.tit.addedBaseMl / 40) * 0.38);
        markerBead.position.set(((s.tit.addedBaseMl / 4) - 5) * 0.22, (s.tit.pH / 14) * 1.9, 0.12);
      },
    };
  },
};
