import { SUBJECT } from '../subject.js';
import {
  THREE, shadeMat, part, box, cyl, sphere, rod, arrow3,
  buildMolecule3D, buildBeaker, studioGrid, playTone, V
} from '@saxster/atlas/chem_kit.js';
import * as M from './model.js';

export const PAGES = [
  {
    tab: 'Alloys & polymers',
    fig: 'Figure 11.1 · Metallic iron lattice with interstitial carbon atoms (steel alloy) locking slip planes',
    title: 'Alloys, Lattices & Materials',
    alt: '3D body-centred metallic iron lattice reinforced with smaller interstitial carbon atoms that prevent layer slip.',
    cam: { target: [0, 1.35, 0], az: 24, el: 20, dist: 6.8 },
    lit: 'interstitial_carbon',
    parts: ['iron_lattice', 'interstitial_carbon'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Li-ion battery',
    fig: 'Figure 11.2 · Rechargeable lithium-ion intercalation cell: Li⁺ shuttles between graphite and metal oxide while e⁻ take the wire',
    title: 'Rechargeable Lithium-Ion Cell',
    alt: '3D layered graphite anode and CoO2 oxide cathode with Li+ ions shuttling through electrolyte while total Li count stays 8.',
    cam: { target: [14, 1.35, 0], az: -20, el: 20, dist: 7.2 },
    lit: 'graphite_anode',
    parts: ['graphite_anode', 'oxide_cathode', 'li_ions'],
    look: { xray: 0.15, section: 0 },
  },
  {
    tab: 'IR greenhouse vibrations',
    fig: 'Figure 11.3 · Infrared vibrational absorption: dipole-changing CO₂ bending/stretching vs IR-inactive N₂ and O₂',
    title: 'Greenhouse Gases & IR Vibrations',
    alt: '3D CO2 and H2O molecules undergoing dipole-changing infrared vibrations contrasted with symmetric homonuclear N2.',
    cam: { target: [28, 1.35, 0], az: 22, el: 20, dist: 6.8 },
    lit: 'co2_vibrator',
    parts: ['co2_vibrator', 'n2_transparent'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Ocean carbonate buffer',
    fig: 'Figure 11.4 · Ocean acidification & carbonate buffering: CO₂(aq) + H₂O + CO₃²⁻ ⇌ 2 HCO₃⁻',
    title: 'Ocean Acidification & Carbonate Buffer',
    alt: '3D seawater column showing dissolved CO2 reacting with carbonate ions (CO3^2-) to form bicarbonate (HCO3-) above a CaCO3 shell.',
    cam: { target: [42, 1.35, 0], az: 24, el: 20, dist: 7.0 },
    lit: 'carbonate_ions',
    parts: ['seawater_column', 'carbonate_ions', 'caco3_shell'],
    look: { xray: 0.25, section: 0 },
  },
];

export const PLATES = {
  iron_lattice: {
    text: 'Metallic iron host lattice (Fe cations in a delocalized valence electron sea): in pure iron, identical atom layers can slide past one another under stress (malleability).',
  },
  interstitial_carbon: {
    text: 'Interstitial carbon atoms (steel alloy): much smaller carbon atoms occupy interstitial voids between Fe atoms, distorting the lattice and pinning slip planes to increase hardness and tensile strength.',
  },
  graphite_anode: {
    text: 'Layered sp² graphite electrode (LiₓC₆): during charging, external electrical work drives Li⁺ ions between the graphene sheets while electrons enter via the external circuit.',
    facts: s => [['State of charge', `${s.li.chargePct}%`], ['Li at graphite', `${s.li.atGraphite} / ${s.li.totalLithium}`]],
  },
  oxide_cathode: {
    text: 'Layered transition-metal oxide electrode (Li₁₋ₓCoO₂): during spontaneous discharge, Li⁺ ions de-intercalate from graphite and intercalate into the lower-energy oxide lattice.',
    facts: s => [['Li at oxide', `${s.li.atOxide} / ${s.li.totalLithium}`], ['Cell voltage', `${s.li.cellVoltageV} V`]],
  },
  li_ions: {
    text: 'Conserved lithium inventory (8 representatives): charging and discharging only change where the lithium resides—total lithium atoms and total electrons remain strictly constant.',
  },
  co2_vibrator: {
    text: 'Triatomic greenhouse gases (CO₂, H₂O, CH₄): asymmetric stretching and bending modes change the molecular dipole moment μ, allowing the molecule to absorb and re-emit outgoing terrestrial infrared radiation.',
  },
  n2_transparent: {
    text: 'Diatomic N₂ and O₂ (99% of dry air): stretching a symmetric homonuclear bond keeps the dipole moment at zero (μ = 0), making N₂ and O₂ transparent to infrared thermal radiation.',
  },
  seawater_column: {
    text: 'Surface ocean carbon reservoir: absorbs ~25–30% of anthropogenic CO₂ emissions via Henry’s law (CO₂(g) ⇌ CO₂(aq)) followed by carbonic acid formation (H₂CO₃).',
    facts: s => [['Atm. CO₂', `${s.oc.atmCo2Ppm} ppm`], ['Surface pH', `${s.oc.pH.toFixed(2)}`]],
  },
  carbonate_ions: {
    text: 'Carbonate buffer shift (H₂CO₃ + CO₃²⁻ ⇌ 2 HCO₃⁻): excess H⁺ from carbonic acid is buffered by carbonate ions, converting CO₃²⁻ into bicarbonate (HCO₃⁻) and lowering [CO₃²⁻].',
    facts: s => [['Available [CO₃²⁻]', `${s.oc.carbonatePct}% of pre-ind.`]],
  },
  caco3_shell: {
    text: 'Biogenic calcium carbonate (CaCO₃(s) ⇌ Ca²⁺ + CO₃²⁻): when carbonate ion concentration drops, marine calcifiers (corals, pteropods, shellfish) face a higher energetic cost to build shells.',
  },
};

export const CHAPTER = {
  subject: SUBJECT,
  no: 11,
  PAGES,
  PLATES,
  clock0: 0,
  cuts: true,
  xrayKeys: ['seawater_column', 'graphite_anode'],
  cutKeys: ['seawater_column'],
  cutPlane: [0, 0, -1, 0.05],
  defaultParams: { chargePct: 75, atmCo2Ppm: 420 },
  controls: [
    { id: 'chargePct', label: 'Li-ion battery state of charge', min: 0, max: 100, step: 12.5, value: 75, unit: '%' },
    { id: 'atmCo2Ppm', label: 'Atmospheric CO₂ concentration', min: 280, max: 800, step: 20, value: 420, unit: 'ppm' },
  ],
  lessons: {
    'ocean-carbonate-buffering': { page: 3, params: { atmCo2Ppm: 420 } },
    'rechargeable-lithium-cells': { page: 1, params: { chargePct: 75 } },
    's11-1': { page: 0, params: {} },
    's11-2': { page: 1, params: { chargePct: 75 } },
    's11-3': { page: 2, params: { atmCo2Ppm: 420 } },
    's11-4': { page: 3, params: { atmCo2Ppm: 420 } },
    's12-1': { page: 1, params: { chargePct: 75 } },
    'sA-1': { page: 0, params: {} },
    'sA-2': { page: 3, params: { atmCo2Ppm: 420 } },
  },
  sonify(ctx, s, page) {
    if (page === 1) playTone(ctx, { freq: 220 + s.li.chargePct * 2.8, dur: 0.07, type: 'triangle', gain: 0.03 });
    else playTone(ctx, { freq: 440 - (s.oc.atmCo2Ppm - 280) * 0.35, dur: 0.07, type: 'sine', gain: 0.03 });
  },
  state(clock, reduced) {
    const p = CHAPTER.params || CHAPTER.defaultParams;
    const t = reduced ? 0 : clock;
    const li = M.lithiumIonCellState(p.chargePct, 8);
    const oc = M.oceanCarbonateBuffer(p.atmCo2Ppm);
    return { t, li, oc };
  },
  readout(s, page, pageIdx) {
    if (pageIdx === 0) {
      return `<b>Materials & Interstitial Alloys</b> · Pure Fe layers slide easily; small interstitial C atoms in steel lock slip planes and increase yield strength.`;
    }
    if (pageIdx === 1) {
      return `<b>Li-Ion Cell (SoC = ${s.li.chargePct}%, V = ${s.li.cellVoltageV} V)</b> · Li at graphite = <b>${s.li.atGraphite}</b>, Li at oxide = <b>${s.li.atOxide}</b> · Total Li inventory = <b>${s.li.totalLithium} (conserved)</b>.`;
    }
    if (pageIdx === 2) {
      return `<b>Greenhouse Vibrations</b> · Bending/asymmetric stretching of <b>CO₂, H₂O, and CH₄</b> alters molecular dipole moment μ (IR-active); homonuclear <b>N₂ and O₂</b> remain μ = 0 (IR-transparent).`;
    }
    return `<b>Ocean Carbonate Buffer (pCO₂ = ${s.oc.atmCo2Ppm} ppm)</b> · Surface ocean pH = <b>${s.oc.pH.toFixed(2)}</b> · Available [CO₃²⁻] = <b>${s.oc.carbonatePct}%</b> of pre-industrial level.`;
  },
  buildWorld(E) {
    const { scene, asm } = E;
    const root = new THREE.Group();
    scene.add(root);
    studioGrid(root, { x0: -4, x1: 48 });
    const labels = [];
    const label = (cls, html, at, opts = {}) => labels.push({ cls, html, at, ...opts });

    // Station 0 (x = 0): Steel Interstitial Alloy
    const feAsm = asm('iron_lattice', root, { title: 'Host Fe metallic lattice', sub: 'Malleable metal cation layers' });
    feAsm.position.set(0, 1.25, 0);
    for (let ix = -1; ix <= 1; ix++) {
      for (let iy = -1; iy <= 1; iy++) {
        for (let iz = -1; iz <= 1; iz++) {
          part(feAsm, sphere(0.22, 16), { pal: 'paper', tone: 'mid', pos: [ix * 0.52, iy * 0.52, iz * 0.52], ex: [ix * 0.35, iy * 0.35, iz * 0.35], name: 'Fe host atom' });
        }
      }
    }

    const cIntAsm = asm('interstitial_carbon', root, { title: 'Interstitial C atoms (Steel)', sub: 'Pins lattice slip planes' });
    cIntAsm.position.set(0, 1.25, 0);
    for (const [cx, cy, cz] of [[0.26, 0.26, 0], [-0.26, -0.26, 0.26], [0.26, -0.26, -0.26]]) {
      part(cIntAsm, sphere(0.11, 14), { pal: 'dark', tone: 'hi', pos: [cx, cy, cz], ex: [0, 0.55, 0.55], name: 'Interstitial Carbon atom' });
    }
    label('board', 'Fe host lattice + interstitial C', () => V(0, 2.35, 0));

    // Station 1 (x = 14): Rechargeable Lithium-Ion Cell
    const grAsm = asm('graphite_anode', root, { title: 'Graphite negative electrode (LiₓC₆)', sub: 'Stores Li between sp² sheets when charged' });
    grAsm.position.set(12.9, 1.25, 0);
    for (const yL of [-0.45, 0, 0.45]) {
      part(grAsm, box(0.95, 0.08, 0.95, 0.01), { pal: 'dark', tone: 'hi', pos: [0, yL, 0], ex: [-0.45, yL * 0.5, 0], name: 'Graphite sheet' });
    }

    const oxAsm = asm('oxide_cathode', root, { title: 'Metal oxide positive electrode (Li₁₋ₓCoO₂)', sub: 'Hosts Li⁺ after discharge' });
    oxAsm.position.set(15.1, 1.25, 0);
    for (const yL of [-0.45, 0, 0.45]) {
      part(oxAsm, box(0.95, 0.1, 0.95, 0.01), { pal: 'blue', tone: 'mid', pos: [0, yL, 0], ex: [0.45, yL * 0.5, 0], name: 'CoO₂ oxide layer' });
    }

    const liAsm = asm('li_ions', root, { title: '8 conserved Li⁺ ions', sub: 'Shuttle between electrodes' });
    liAsm.position.set(14.0, 1.25, 0);
    const liBeads = [];
    for (let i = 0; i < 8; i++) {
      const m = part(liAsm, sphere(0.12, 16), { pal: 'ochre', tone: 'lit', pos: [0, ((i % 4) - 1.5) * 0.28, (Math.floor(i / 4) - 0.5) * 0.38], ex: [0, 0.55, 0], name: `Li⁺ ion ${i + 1}` });
      liBeads.push({ mesh: m, i });
    }
    label('board', 'Graphite (LiₓC₆)', () => V(12.9, 2.15, 0));
    label('board', 'Oxide (Li₁₋ₓCoO₂)', () => V(15.1, 2.15, 0));

    // Station 2 (x = 28): IR Greenhouse Vibrations
    const co2VAsm = asm('co2_vibrator', root, { title: 'IR-active CO₂ bending & stretching', sub: 'Oscillating dipole absorbs IR' });
    const co2Vib = buildMolecule3D(co2VAsm, 'CO2', { scale: 0.62, pos: [27.2, 1.4, 0] });

    const n2TAsm = asm('n2_transparent', root, { title: 'IR-transparent N₂ (μ = 0)', sub: 'Symmetric homonuclear bond' });
    buildMolecule3D(n2TAsm, 'N2', { scale: 0.62, pos: [28.9, 1.4, 0] });
    label('board', 'CO₂ bending (Δμ ≠ 0, IR-active)', () => V(27.2, 2.25, 0));
    label('board', 'N₂ (μ = 0, IR-inactive)', () => V(28.9, 2.25, 0));

    // Station 3 (x = 42): Ocean Carbonate Buffering
    const seaAsm = asm('seawater_column', root, { title: 'Surface ocean water column', sub: 'Absorbs atmospheric CO₂' });
    buildBeaker(seaAsm, { r: 1.0, h: 1.85, liquidRatio: 0.78, liquidPal: 'blue', pos: [42, 0.1, 0], name: 'Seawater column' });

    const carbAsm = asm('carbonate_ions', root, { title: 'Carbonate (CO₃²⁻) & Bicarbonate (HCO₃⁻)', sub: 'CO₂ + H₂O + CO₃²⁻ ⇌ 2 HCO₃⁻' });
    const carbMol = buildMolecule3D(carbAsm, 'CO3_2minus', { scale: 0.42, pos: [42, 1.25, 0] });

    const shAsm = asm('caco3_shell', root, { title: 'Marine CaCO₃ shell lattice', sub: 'Requires CO₃²⁻ supersaturation' });
    shAsm.position.set(42, 0.35, 0);
    const shellMesh = part(shAsm, cyl(0.55, 0.22, 24), { pal: 'paper', tone: 'hi', ex: [0, -0.35, 0.35], name: 'Biogenic CaCO₃ reef/shell' });
    label('board', 'CO₃²⁻ + H₂CO₃ ⇌ 2 HCO₃⁻', () => V(42, 2.25, 0));
    label('board', 'CaCO₃ shell reserve', () => V(42, 0.35, 1.1));

    return {
      labels,
      update(s) {
        // Position the 8 conserved Li+ ions between graphite (x = -1.1) and oxide (x = +1.1)
        for (const b of liBeads) {
          const inGraphite = b.i < s.li.atGraphite;
          b.mesh.position.x = inGraphite ? -1.1 + (b.i % 2) * 0.22 : 1.1 - (b.i % 2) * 0.22;
        }
        // CO2 bending vibration
        if (co2Vib.atoms.length === 3) {
          const bend = Math.sin(s.t * 4.2) * 0.18;
          co2Vib.atoms[0].position.y = bend;
          co2Vib.atoms[1].position.y = -bend * 0.5;
          co2Vib.atoms[2].position.y = -bend * 0.5;
        }
        const cScale = Math.max(0.55, s.oc.carbonatePct / 100);
        carbMol.group.scale.setScalar(cScale);
        shellMesh.scale.setScalar(cScale);
      },
    };
  },
};
