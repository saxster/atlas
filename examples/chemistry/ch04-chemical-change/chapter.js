import { SUBJECT } from '../subject.js';
import {
  THREE, shadeMat, part, box, cyl, sphere, rod,
  buildMolecule3D, buildBeaker, studioGrid, playTone, V
} from '@saxster/atlas/chem_kit.js';
import * as M from './model.js';

export const PAGES = [
  {
    tab: 'Lavoisier retort',
    fig: 'Figure 4.1 · Lavoisier’s sealed calcination retort: solid gains mass while total system mass is invariant',
    title: 'Sealed-Vessel Mass Conservation',
    alt: '3D sealed glass retort on a precision balance showing solid metal gaining oxygen mass while total sealed mass stays constant.',
    cam: { target: [0, 1.35, 0], az: 22, el: 20, dist: 6.8 },
    lit: 'sealed_retort',
    parts: ['sealed_retort', 'balance_beam'],
    look: { xray: 0.25, section: 0 },
  },
  {
    tab: 'Bond rearrangement',
    fig: 'Figure 4.2 · 2 H₂ + O₂ → 2 H₂O: breaking reactant bonds and forming product bonds with 4 H and 2 O conserved',
    title: 'Atom Conservation in Reactions',
    alt: '3D reactant molecules (2 H2 and 1 O2) rearranging into 2 H2O product molecules without creating or destroying any atoms.',
    cam: { target: [14, 1.35, 0], az: -18, el: 20, dist: 7.0 },
    lit: 'product_h2o',
    parts: ['reactant_gases', 'product_h2o'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Coeff vs subscript',
    fig: 'Figure 4.3 · Why you balance with coefficients (2 H₂O) and never by altering subscripts (H₂O₂)',
    title: 'Coefficients vs Subscripts',
    alt: '3D side-by-side comparison of two water molecules (2 H2O) versus one hydrogen peroxide molecule (H2O2) with an O-O bond.',
    cam: { target: [28, 1.35, 0], az: 24, el: 20, dist: 6.8 },
    lit: 'peroxide_molecule',
    parts: ['two_waters', 'peroxide_molecule'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Precipitation & ions',
    fig: 'Figure 4.4 · Ag⁺(aq) + Cl⁻(aq) → AgCl(s): insoluble lattice precipitates while Na⁺ and NO₃⁻ spectators stay dissolved',
    title: 'Net Ionic Precipitation',
    alt: '3D reaction beaker with white AgCl crystal lattice precipitating at the bottom while Na+ and NO3- spectator ions remain in solution.',
    cam: { target: [42, 1.35, 0], az: 26, el: 22, dist: 6.8 },
    lit: 'agcl_precipitate',
    parts: ['agcl_precipitate', 'spectator_ions'],
    look: { xray: 0.2, section: 0 },
  },
];

export const PLATES = {
  sealed_retort: {
    text: 'Lavoisier’s hermetically sealed glass retort: oxygen molecules from the trapped air bond with the heated metal to form solid oxide calx.',
    facts: s => [['Reaction progress', `${s.lav.progressPct.toFixed(0)}%`], ['Solid mass', `${s.lav.solidMass.toFixed(1)} g`], ['Remaining O₂', `${s.lav.remainingO2.toFixed(1)} g`]],
  },
  balance_beam: {
    text: 'Equal-arm balance beam: remains level throughout calcination because every oxygen atom added to the solid was already weighed inside the sealed gas.',
    facts: s => [['Total sealed mass', `${s.lav.totalSealedMass.toFixed(1)} g (invariant)`]],
  },
  reactant_gases: {
    text: 'Reactant inventory (2 H₂ + 1 O₂): contains 4 hydrogen atoms bonded in H–H pairs and 2 oxygen atoms bonded in an O=O double bond.',
    facts: s => [['H before / after', `${s.led.hBefore} / ${s.led.hAfter}`], ['O before / after', `${s.led.oBefore} / ${s.led.oAfter}`]],
  },
  product_h2o: {
    text: 'Product inventory (2 H₂O): the exact same 4 H and 2 O atoms re-bonded as four polar O–H covalent bonds. Note: a balanced equation does not by itself prove the reaction is fast or complete.',
    facts: s => [['Equation status', s.led.balanced ? 'Balanced (atoms conserved)' : 'Unbalanced']],
  },
  two_waters: {
    text: 'Coefficient 2 in 2 H₂O: multiplies the number of separate water molecules without altering the O–H connectivity inside each molecule.',
  },
  peroxide_molecule: {
    text: 'Subscript 2 in H₂O₂ (hydrogen peroxide): changes the internal atomic connectivity (H–O–O–H), representing a reactive bleaching agent rather than water.',
  },
  agcl_precipitate: {
    text: 'Precipitated AgCl(s) ionic solid: colliding Ag⁺ and Cl⁻ ions lock into a low-solubility crystal lattice at the bottom of the vessel.',
  },
  spectator_ions: {
    text: 'Hydrated Na⁺(aq) and NO₃⁻(aq) spectator ions: present before and after mixing to maintain bulk electrical neutrality, but unchanged by the net reaction.',
  },
};

export const CHAPTER = {
  subject: SUBJECT,
  no: 4,
  PAGES,
  PLATES,
  clock0: 0,
  cuts: true,
  xrayKeys: ['sealed_retort', 'spectator_ions'],
  cutKeys: ['sealed_retort', 'spectator_ions'],
  cutPlane: [0, 0, -1, 0.05],
  defaultParams: { calcinationPct: 80, cH2: 2, cO2: 1, cH2O: 2 },
  controls: [
    { id: 'calcinationPct', label: 'Calcination progress', min: 0, max: 100, step: 10, value: 80, unit: '%' },
    { id: 'cH2', label: 'Coefficient on H₂', min: 1, max: 4, step: 1, value: 2, unit: 'mol' },
    { id: 'cO2', label: 'Coefficient on O₂', min: 1, max: 4, step: 1, value: 1, unit: 'mol' },
    { id: 'cH2O', label: 'Coefficient on H₂O', min: 1, max: 4, step: 1, value: 2, unit: 'mol' },
  ],
  lessons: {
    'physical-chemical': { page: 0, params: { calcinationPct: 100 } },
    'read-formulae': { page: 2, params: { cH2O: 2 } },
    'conserve-atoms': { page: 1, params: { cH2: 2, cO2: 1, cH2O: 2 } },
    'balanced-equations': { page: 3, params: { cH2: 2, cO2: 1, cH2O: 2 } },
    's4-1': { page: 0, params: { calcinationPct: 100 } },
    's4-2': { page: 1, params: { cH2: 2, cO2: 1, cH2O: 2 } },
    's4-3': { page: 2, params: { cH2O: 2 } },
    's4-4': { page: 1, params: { cH2: 2, cO2: 1, cH2O: 2 } },
    's4-5': { page: 3, params: {} },
  },
  sonify(ctx, s, page) {
    if (page === 1) playTone(ctx, { freq: s.led.balanced ? 523.25 : 233.08, dur: 0.08, type: s.led.balanced ? 'sine' : 'sawtooth', gain: 0.035 });
    else playTone(ctx, { freq: 340 + s.lav.progressPct * 1.2, dur: 0.06, type: 'triangle', gain: 0.03 });
  },
  state(clock, reduced) {
    const p = CHAPTER.params || CHAPTER.defaultParams;
    const t = reduced ? 0 : clock;
    const lav = M.lavoisierRetort(p.calcinationPct);
    const led = M.waterSynthesisAtomLedger(p.cH2, p.cO2, p.cH2O);
    const sub = M.coeffVsSubscript(p.cH2O, 2);
    return { t, lav, led, sub };
  },
  readout(s, page, pageIdx) {
    if (pageIdx === 0) {
      return `<b>Lavoisier Sealed Retort (${s.lav.progressPct.toFixed(0)}%)</b> · Solid calx = <b>${s.lav.solidMass.toFixed(1)} g</b> · Gas O₂ left = <b>${s.lav.remainingO2.toFixed(1)} g</b> · Total sealed mass = <b>${s.lav.totalSealedMass.toFixed(1)} g (conserved)</b>.`;
    }
    if (pageIdx === 1) {
      return `<b>${s.led.cH2} H₂ + ${s.led.cO2} O₂ → ${s.led.cH2O} H₂O</b> · H atoms: ${s.led.hBefore} → ${s.led.hAfter} · O atoms: ${s.led.oBefore} → ${s.led.oAfter} · Status: <b>${s.led.balanced ? 'Balanced' : 'Unbalanced (adjust coefficients)'}</b>.`;
    }
    if (pageIdx === 2) {
      return `<b>Coefficients vs Subscripts</b> · <b>2 H₂O</b> = two separate water molecules (4 H, 2 O) · <b>H₂O₂</b> = one hydrogen peroxide molecule with a reactive O–O bond.`;
    }
    return `<b>Precipitation Reaction</b> · Ag⁺(aq) + Cl⁻(aq) → AgCl(s)↓ · White AgCl lattice settles while Na⁺(aq) and NO₃⁻(aq) remain dissolved as spectator ions.`;
  },
  buildWorld(E) {
    const { scene, asm } = E;
    const root = new THREE.Group();
    scene.add(root);
    studioGrid(root, { x0: -4, x1: 48 });
    const labels = [];
    const label = (cls, html, at, opts = {}) => labels.push({ cls, html, at, ...opts });

    // Station 0 (x = 0): Lavoisier Sealed Retort on Balance
    const balAsm = asm('balance_beam', root, { title: 'Equal-arm analytical balance', sub: 'Total mass stays 150.7 g' });
    balAsm.position.set(0, 0.1, 0);
    part(balAsm, cyl(0.12, 1.4, 16), { pal: 'dark', tone: 'mid', pos: [0, 0.7, 0], name: 'Balance pillar' });
    part(balAsm, box(2.4, 0.08, 0.14, 0.02), { pal: 'ochre', tone: 'hi', pos: [0, 1.4, 0], ex: [0, 0.35, 0], name: 'Level balance beam' });
    part(balAsm, cyl(0.52, 0.06, 24), { pal: 'ochre', tone: 'mid', pos: [1.0, 0.75, 0], name: 'Reference counterweight pan' });

    const retAsm = asm('sealed_retort', root, { title: 'Hermetically sealed retort', sub: 'Sn(s) + O₂(g) → SnO₂(s)' });
    retAsm.position.set(-1.0, 1.15, 0);
    part(retAsm, sphere(0.62, 24), { pal: 'paper', tone: 'hi', mat: shadeMat('paper', { opacity: 0.32 }), ex: [0, 0.45, 0], name: 'Sealed glass bulb' });
    const calxMesh = part(retAsm, sphere(0.28, 18), { pal: 'ochre', tone: 'hi', pos: [0, -0.32, 0], ex: [0, -0.25, 0.3], name: 'Solid metal / oxide calx' });
    label('board', 'Sealed retort (no gas escapes)', () => V(-1.0, 2.0, 0));
    label('board', 'Balance beam stays level', () => V(0.8, 1.75, 0));

    // Station 1 (x = 14): 2 H2 + O2 -> 2 H2O Rearrangement
    const reactAsm = asm('reactant_gases', root, { title: 'Reactant molecules (H₂ & O₂)', sub: 'Bonds broken before rearrangement' });
    reactAsm.position.set(13.0, 1.35, 0);
    const h2Mols = [0, 1, 2, 3].map(i => buildMolecule3D(reactAsm, 'H2', { scale: 0.45, pos: [-0.45, (i - 1.5) * 0.42, 0] }));
    const o2Mols = [0, 1, 2, 3].map(i => buildMolecule3D(reactAsm, 'O2', { scale: 0.45, pos: [0.35, (i - 1.5) * 0.45, 0] }));

    const prodAsm = asm('product_h2o', root, { title: 'Product molecules (H₂O)', sub: 'New O–H covalent bonds' });
    prodAsm.position.set(15.0, 1.35, 0);
    const h2oMols = [0, 1, 2, 3].map(i => buildMolecule3D(prodAsm, 'H2O', { scale: 0.45, pos: [0, (i - 1.5) * 0.46, 0] }));
    label('board', 'Reactants: H₂ + O₂', () => V(13.0, 2.45, 0));
    label('board', 'Products: H₂O', () => V(15.0, 2.45, 0));

    // Station 2 (x = 28): Coefficient (2 H2O) vs Subscript (H2O2)
    const twoWAsm = asm('two_waters', root, { title: '2 H₂O (Coefficient = 2)', sub: 'Two separate water molecules' });
    twoWAsm.position.set(27.1, 1.35, 0);
    buildMolecule3D(twoWAsm, 'H2O', { scale: 0.52, pos: [0, 0.42, 0] });
    buildMolecule3D(twoWAsm, 'H2O', { scale: 0.52, pos: [0, -0.42, 0] });

    const perAsm = asm('peroxide_molecule', root, { title: 'H₂O₂ (Altered subscript)', sub: 'Different substance: hydrogen peroxide' });
    perAsm.position.set(28.9, 1.35, 0);
    buildMolecule3D(perAsm, {
      atoms: [
        { el: 'O', x: -0.55, y:  0.10, z:  0.00 },
        { el: 'O', x:  0.55, y: -0.10, z:  0.00 },
        { el: 'H', x: -0.95, y: -0.65, z:  0.45 },
        { el: 'H', x:  0.95, y:  0.65, z: -0.45 },
      ],
      bonds: [[0, 1, 1], [0, 2, 1], [1, 3, 1]],
    }, { scale: 0.52 });
    label('board', '2 H₂O (two waters)', () => V(27.1, 2.25, 0));
    label('board', 'H₂O₂ (peroxide: O–O bond)', () => V(28.9, 2.25, 0));

    // Station 3 (x = 42): AgCl Precipitation & Spectator Ions
    const specAsm = asm('spectator_ions', root, { title: 'Dissolved Na⁺ & NO₃⁻ spectators', sub: 'Remain hydrated in solution' });
    buildBeaker(specAsm, { r: 1.0, h: 1.75, liquidRatio: 0.72, liquidPal: 'blue', pos: [42, 0.1, 0], name: 'Precipitation vessel' });
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      part(specAsm, sphere(0.11, 14), { pal: i % 2 === 0 ? 'blue' : 'ochre', tone: 'lit', pos: [42 + Math.cos(a) * 0.52, 1.05 + (i % 2) * 0.25, Math.sin(a) * 0.52], ex: [0, 0.45, 0], name: i % 2 === 0 ? 'Na⁺ spectator ion' : 'NO₃⁻ spectator ion' });
    }

    const pptAsm = asm('agcl_precipitate', root, { title: 'Precipitated AgCl(s) lattice', sub: 'Insoluble crystal at vessel base' });
    pptAsm.position.set(42, 0.32, 0);
    for (let ix = -1; ix <= 1; ix++) {
      for (let iz = -1; iz <= 1; iz++) {
        const isAg = (ix + iz) % 2 === 0;
        part(pptAsm, sphere(0.13, 14), { pal: isAg ? 'paper' : 'green', tone: 'hi', pos: [ix * 0.26, 0, iz * 0.26], ex: [ix * 0.2, 0.45, iz * 0.2], name: isAg ? 'Ag⁺ lattice ion' : 'Cl⁻ lattice ion' });
      }
    }
    label('board', 'Spectator ions stay in solution', () => V(42, 2.1, 0));
    label('board', 'AgCl(s) precipitate lattice', () => V(42, 0.35, 1.05));

    return {
      labels,
      update(s) {
        const swell = 1 + (s.lav.progressPct / 100) * 0.32;
        calxMesh.scale.setScalar(swell);
        h2Mols.forEach((m, i) => { m.group.visible = i < s.led.cH2; });
        o2Mols.forEach((m, i) => { m.group.visible = i < s.led.cO2; });
        h2oMols.forEach((m, i) => { m.group.visible = i < s.led.cH2O; });
      },
    };
  },
};
