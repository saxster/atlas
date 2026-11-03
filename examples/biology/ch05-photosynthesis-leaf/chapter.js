import { SUBJECT } from '../subject.js';
import {
  THREE, part, box, cyl, sphere, capsule, torus,
  prims, MOLECULES, studioGrid, playTone, shadeMat, V
} from '@saxster/atlas/bio_kit.js';
import * as M from './model.js';

export const PAGES = [
  {
    tab: 'Mass & O₂ bubbles',
    fig: 'Figure 5.1–5.2 · Formal net-equation mass ledger & schematic aquatic-plant gas collection',
    title: 'Solar Mass Ledger & Oxygen Evidence',
    alt: '3D atomic mass balance of 6 CO2 + 6 H2O forming glucose and 6 O2 alongside a submerged Hydrilla sprig releasing oxygen bubbles in light.',
    cam: { target: [0, 1.35, 0], az: 24, el: 20, dist: 11.1 },
    lit: 'hydrilla_jar',
    parts: ['mass_columns', 'hydrilla_jar'],
    look: { xray: 0.2, section: 0 },
  },
  {
    tab: 'Chloroplast 3D',
    fig: 'Figure 5.3 · 3D Chloroplast teardown: thylakoid grana stacks, stroma & glucose product',
    title: 'Inside the Chloroplast Engine',
    alt: '3D cutaway of a chloroplast showing outer/inner membranes, stacked thylakoid grana, stroma, and synthesized alpha-D-glucose.',
    cam: { target: [14.4, 1.35, 0], az: -24, el: 22, dist: 20.0 },
    lit: 'grana_stacks',
    parts: ['chloro_envelope', 'grana_stacks', 'stroma_glucose'],
    look: { xray: 0.25, section: 0 },
  },
  {
    tab: 'Blackman 3D surface',
    fig: 'Figure 5.4 · Blackman’s 3D limiting-factor surface r(Light, [CO₂], Temperature)',
    title: 'Blackman’s Limiting-Factor Surface',
    alt: '3D photosynthetic rate surface over light intensity and CO2 capacity, warping downward when temperature departs from 25 C.',
    cam: { target: [28, 1.35, 0], az: 30, el: 24, dist: 11.1 },
    lit: 'blackman_surf',
    parts: ['blackman_surf'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Leaf & xylem/phloem',
    fig: 'Figure 5.5–5.7 · 3D Dicot leaf cross-section, guard-cell stoma & xylem/phloem sap highway',
    title: 'Leaf Architecture & Twin Vascular Tubes',
    alt: '3D dicot leaf cutaway showing cuticle, palisade chloroplasts, spongy air spaces, guard-cell stoma, lignin-ringed xylem, and sieve-plate phloem.',
    cam: { target: [42, 1.35, 0], az: 20, el: 22, dist: 11.4 },
    lit: 'palisade_layer',
    parts: ['palisade_layer', 'guard_stoma', 'xylem_phloem_bundle'],
    look: { xray: 0.15, section: 0 },
  },
];

export const PLATES = {
  mass_columns: {
    text: 'Stoichiometric conservation: 6 CO₂ (264 g) + 6 H₂O (108 g) = 372 g of net inputs rearrange into 1 C₆H₁₂O₆ (180 g) + 6 O₂ (192 g) = 372 g—a formal net balance. Plant organic material uses matter from CO₂ and water, with essential mineral inputs.',
    facts: s => [['Inputs', `${s.st.massInG} g`], ['Outputs', `${s.st.massOutG} g`]],
  },
  hydrilla_jar: {
    text: 'A schematic modern aquatic-plant observation, not a reconstruction of Ingenhousz’s apparatus. Bubble markers illustrate a chosen positive net output; actual bubbles are not an exact measure of oxygen production.',
  },
  chloro_envelope: {
    text: 'Smooth outer and inner phospholipid membranes enclosing the chloroplast stroma.',
  },
  grana_stacks: {
    text: 'Stacked thylakoid discs embedded with green chlorophyll a/b photosystems that absorb red and blue photons to split H₂O and charge ATP + NADPH.',
  },
  stroma_glucose: {
    text: 'Aqueous stroma housing RuBisCO and the carbon-fixation cycle, which uses ATP and NADPH to supply small three-carbon products. Later reactions can make glucose; the molecule shown is an overall summary product.',
  },
  blackman_surf: {
    text: 'Invented bottleneck model: gross rate is the minimum of chosen light, CO₂ and temperature capacities. The peak at25 °C and respiratory baseline10 are teaching assumptions, not measured universal plant properties.',
    facts: s => [['Gross', `${s.bm.gross.toFixed(0)}`], ['Net', `${s.bm.net.toFixed(0)}`], ['Limiter', s.bm.limiting]],
  },
  palisade_layer: {
    text: 'Waxy water-loss-reducing cuticle and transparent upper epidermis above tall, column-packed palisade mesophyll cells loaded with chloroplasts.',
  },
  guard_stoma: {
    text: 'Kidney-shaped guard cells with thick inner cellulose walls: K⁺ influx draws water in by osmosis, bowing the guard cells apart to open the stomatal pore for CO₂ entry.',
  },
  xylem_phloem_bundle: {
    text: 'Twin vascular bundle: hollow mature xylem vessel elements conduct water under transpiration tension; living phloem pathways carry sucrose from source to sink, with opposite flows in separate pathways. Displayed activities are invented relative values, not measured transport speeds.',
    facts: s => [['Chosen xylem activity', `${s.sap.xylemVelocityMmPerMin.toFixed(1)} rel.`], ['Phloem flux', `${s.sap.phloemSucroseFlux.toFixed(1)} rel.`]],
  },
};

export const CHAPTER = {
  subject: SUBJECT,
  no: 5,
  PAGES,
  PLATES,
  clock0: 0,
  cuts: true,
  xrayKeys: ['hydrilla_jar', 'chloro_envelope'],
  cutKeys: ['chloro_envelope', 'palisade_layer'],
  cutPlane: [0, 0, -1, 0.05],
  defaultParams: { lightCap: 65, co2Cap: 70, leafTempC: 25, humidityPct: 45 },
  controls: [
    { id: 'lightCap', label: 'Light capacity', min: 0, max: 100, step: 5, value: 65, unit: '%' },
    { id: 'co2Cap', label: 'CO₂ capacity', min: 0, max: 100, step: 5, value: 70, unit: '%' },
    { id: 'leafTempC', label: 'Leaf temperature', min: 5, max: 45, step: 2, value: 25, unit: '°C' },
  ],
  sensor: { type: 'light', label: 'Use camera light sensor', param: 'lightCap', min: 5, max: 100 },
  lessons: {
    'ch05-calvin-3d-willow': { page: 0 },
    'ch05-thylakoid-3d-gas': { page: 0 },
    'ch05-thylakoid-3d': { page: 1 },
    'ch05-calvin-3d': { page: 2 },
    'ch05-leaf-3d': { page: 3 },
    'ch05-stomata-3d': { page: 3 },
    'ch05-calvin-3d-phloem': { page: 3 },
    'ch05-mass-ledger-3d': { page: 0, params: { lightCap: 75 } },
    'ch05-gas-bubbles-3d': { page: 0, params: { lightCap: 90 } },
    'ch05-chloroplast-3d': { page: 1, params: { lightCap: 80, co2Cap: 80 } },
    'ch05-blackman-surface-3d': { page: 2, params: { lightCap: 40, co2Cap: 85, leafTempC: 25 } },
    'ch05-leaf-anatomy-3d': { page: 3, params: { lightCap: 75 } },
    'ch05-phloem-xylem-3d': { page: 3, params: { lightCap: 85 } },
  },
  sonify(ctx, s, page) {
    playTone(ctx, { freq: 200 + Math.max(0, s.bm.net) * 4.5, dur: 0.06, type: 'sine', gain: 0.03 });
  },
  state(clock, reduced) {
    const p = CHAPTER.params || CHAPTER.defaultParams;
    const t = reduced ? 1.5 : clock;
    const st = M.photosynthesisStoichiometry(1);
    const bm = M.blackmanSurface(p.lightCap, p.co2Cap, p.leafTempC);
    const sap = M.vascularSapAccount(p.humidityPct ?? 45, p.lightCap);
    return { t, st, bm, sap, lightCap: p.lightCap, co2Cap: p.co2Cap, leafTempC: p.leafTempC };
  },
  readout(s, page, pageIdx) {
    if (pageIdx === 0) {
      return `<b>Stoichiometric Mass Balance</b> · 6 CO₂ (${s.st.co2Moles * 44} g) + 6 H₂O (${s.st.h2oMoles * 18} g) = <b>${s.st.massInG} g</b> → C₆H₁₂O₆ (180 g) + 6 O₂ (192 g) = <b>${s.st.massOutG} g</b> · This net equation is formal accounting, not an atom-route map. Released O₂ comes from water; chosen net output = ${s.bm.net.toFixed(0)}.`;
    }
    if (pageIdx === 1) {
      return `<b>3D Chloroplast</b> · Light-supported machinery oxidises water, releasing O₂, and supplies ATP and NADPH. Carbon fixation supplies small organic products; later reactions can make glucose.`;
    }
    if (pageIdx === 2) {
      return `<b>Invented capacity model · Light = ${s.lightCap}% · Chosen CO₂ capacity = ${s.co2Cap}% · T = ${s.leafTempC} °C</b> · Gross rate = <b>${s.bm.gross.toFixed(0)}</b> · Net rate = <b>${s.bm.net.toFixed(0)}</b> · Limiting factor: <b>${s.bm.limiting}</b>.`;
    }
    return `<b>3D Dicot Leaf & Vascular Bundle</b> · Stomatal aperture = ${(s.sap.stomatalAperture * 100).toFixed(0)}% · Chosen xylem activity = <b>${s.sap.xylemVelocityMmPerMin.toFixed(1)} relative units</b> · Phloem sucrose translocation = <b>${s.sap.phloemSucroseFlux.toFixed(1)}</b>.`;
  },
  buildWorld(E) {
    const { scene, asm } = E;
    const root = new THREE.Group();
    scene.add(root);
    studioGrid(root, { x0: -4, x1: 48 });
    const labels = [];
    const label = (cls, html, at, opts = {}) => labels.push({ cls, html, at, ...opts });

    // Station 0 (x = 0): Mass Ledger Columns + Ingenhousz Hydrilla O2 Bubble Plume
    const colAsm = asm('mass_columns', root, { title: 'Stoichiometric mass ledger', sub: '264 g CO₂ + 108 g H₂O = 180 g glucose + 192 g O₂' });
    colAsm.position.set(-1.1, 0.1, 0);
    part(colAsm, box(0.45, 1.32, 0.45, 0.03), { pal: 'dark', tone: 'hi', pos: [-0.35, 0.66, 0], ex: [-0.3, 0.2, 0], name: '6 CO₂ input (264 g)' });
    part(colAsm, box(0.45, 0.54, 0.45, 0.03), { pal: 'blue', tone: 'hi', pos: [-0.35, 1.59, 0], ex: [-0.3, 0.5, 0], name: '6 H₂O input (108 g)' });
    part(colAsm, box(0.45, 0.90, 0.45, 0.03), { pal: 'green', tone: 'hi', pos: [0.35, 0.45, 0], ex: [0.3, 0.2, 0], name: 'Glucose summary product (180 g)' });
    part(colAsm, box(0.45, 0.96, 0.45, 0.03), { pal: 'red', tone: 'hi', pos: [0.35, 1.38, 0], ex: [0.3, 0.5, 0], name: '6 O₂ evolved (192 g)' });

    const jarAsm = asm('hydrilla_jar', root, { title: 'Schematic aquatic-plant jar', sub: 'Photolysis O₂ bubble stream' });
    jarAsm.position.set(1.1, 0.1, 0);
    part(jarAsm, cyl(0.68, 1.9, 24), { pal: 'paper', tone: 'mid', pos: [0, 0.95, 0], mat: shadeMat('paper', { opacity: 0.38 }), name: 'Inverted glass funnel & tube' });
    part(jarAsm, capsule(0.18, 0.65, 8, 14), { pal: 'green', tone: 'lit', pos: [0, 0.55, 0], ex: [0, -0.3, 0], name: 'Submerged Hydrilla shoot' });
    const o2Bubbles = prims.particles(jarAsm, 20, { radius: 0.048, color: 'blue' });
    label('board', '372 g In = 372 g Out', () => V(-1.1, 2.35, 0));
    label('board', 'O₂ bubble plume', () => V(1.1, 2.35, 0));

    // Station 1 (x = 14): 3D Chloroplast Cutaway + Glucose Molecule
    const envAsm = asm('chloro_envelope', root, { title: 'Chloroplast double envelope', sub: 'Outer & inner membranes' });
    envAsm.position.set(13.5, 1.3, 0);
    part(envAsm, capsule(0.75, 1.35, 14, 24), { pal: 'green', tone: 'mid', rot: [0, 0, Math.PI / 2], mat: shadeMat('green', { opacity: 0.36 }), ex: [0, -0.45, 0], name: 'Chloroplast envelope' });

    const granaAsm = asm('grana_stacks', root, { title: 'Thylakoid grana stacks', sub: 'Light-harvesting antennae' });
    granaAsm.position.set(13.5, 1.3, 0);
    for (const gx of [-0.55, 0.0, 0.55]) {
      for (let k = -2; k <= 2; k++) {
        part(granaAsm, cyl(0.22, 0.065, 18), { pal: 'green', tone: 'lit', pos: [gx, k * 0.1, 0], ex: [0, 0.4 + k * 0.12, 0], name: 'Thylakoid granum disc' });
      }
    }

    const gluAsm = asm('stroma_glucose', root, { title: 'Glucose summary product', sub: 'Made through later reactions' });
    gluAsm.position.set(15.5, 1.35, 0);
    prims.molecule(gluAsm, MOLECULES.glucose.atoms.map(a => a.join(' ')).join('\n'), { scale: 0.22, names: false });
    label('board', 'Thylakoid grana', () => V(13.5, 2.35, 0));
    label('board', 'Glucose product', () => V(15.5, 2.35, 0));

    // Station 2 (x = 28): Blackman 3D Limiting-Factor Surface
    const bmAsm = asm('blackman_surf', root, { title: 'Blackman 3D limiting surface', sub: 'r = min(Light, CO₂, Temp)' });
    bmAsm.position.set(27.0, 0.25, -0.6);
    const axB = prims.axes(bmAsm, { x: [0, 100], y: [0, 100], z: [0, 105], size: [2.2, 1.8, 1.65], names: { x: 'Light capacity', y: 'CO₂ capacity', z: 'Gross rate' } });
    const surfB = prims.surface(bmAsm, (L, C) => M.blackmanSurface(L, C, 25).gross, { axes: axB, n: 24, pal: 'green' });
    const bmPin = part(bmAsm, sphere(0.095, 16), { pal: 'red', tone: 'lit', name: 'Current operating state' });
    label('board', 'Blackman surface r(L, CO₂)', () => V(28.1, 2.25, -0.6));

    // Station 3 (x = 42): 3D Dicot Leaf Cross-Section + Guard Stoma + Xylem/Phloem
    const palAsm = asm('palisade_layer', root, { title: 'Cuticle, epidermis & palisade mesophyll', sub: 'Solar collector slab' });
    palAsm.position.set(41.2, 1.55, 0);
    part(palAsm, box(1.9, 0.12, 1.2, 0.02), { pal: 'ochre', tone: 'mid', pos: [0, 0.58, 0], ex: [0, 0.55, 0], name: 'Waxy water-loss-reducing cuticle' });
    for (let i = -2; i <= 2; i++) {
      part(palAsm, box(0.32, 0.65, 1.1, 0.05), { pal: 'green', tone: 'lit', pos: [i * 0.36, 0.12, 0], ex: [0, 0.25, 0], name: 'Palisade mesophyll cell' });
    }

    const stomaAsm = asm('guard_stoma', root, { title: 'Guard-cell stomatal pore', sub: 'Turgor-controlled CO₂/H₂O gate' });
    stomaAsm.position.set(41.2, 0.55, 0);
    const guardL = part(stomaAsm, torus(0.22, 0.075, 12, 20, Math.PI), { pal: 'green', tone: 'lit', pos: [-0.08, 0, 0], rot: [Math.PI / 2, 0, Math.PI / 2], ex: [-0.35, -0.35, 0], name: 'Left guard cell' });
    const guardR = part(stomaAsm, torus(0.22, 0.075, 12, 20, Math.PI), { pal: 'green', tone: 'lit', pos: [0.08, 0, 0], rot: [Math.PI / 2, 0, -Math.PI / 2], ex: [0.35, -0.35, 0], name: 'Right guard cell' });

    const vascAsm = asm('xylem_phloem_bundle', root, { title: 'Xylem & phloem vascular bundle', sub: 'Lignin water pipe & sieve sucrose pipe' });
    vascAsm.position.set(43.1, 1.25, 0);
    part(vascAsm, cyl(0.22, 1.9, 20), { pal: 'blue', tone: 'hi', pos: [-0.28, 0, 0], ex: [-0.35, 0, 0], name: 'Lignin-ringed xylem vessel' });
    for (let k = -2; k <= 2; k++) {
      part(vascAsm, torus(0.23, 0.028, 10, 20), { pal: 'ochre', tone: 'lit', pos: [-0.28, k * 0.34, 0], rot: [Math.PI / 2, 0, 0], ex: [-0.35, 0, 0.25], name: 'Lignin spiral ring' });
    }
    part(vascAsm, cyl(0.2, 1.9, 20), { pal: 'green', tone: 'hi', pos: [0.28, 0, 0], ex: [0.35, 0, 0], name: 'Phloem sieve-tube element' });
    label('board', 'Palisade & stoma', () => V(41.2, 2.45, 0));
    label('board', 'Xylem & Phloem', () => V(43.1, 2.45, 0));

    return {
      labels,
      update(s) {
        // O2 bubble stream speed scales with positive net photosynthesis
        const rate = Math.max(0, (s.bm.net / 100) * 1.4);
        const bPts = [];
        for (let i = 0; i < (rate > 0 ? 20 : 0); i++) {
          const u = ((i / 20) + s.t * rate * 0.35) % 1;
          const r = 0.08 * Math.sin(u * 10 + i);
          bPts.push([r * Math.cos(i), 0.75 + u * 1.05, r * Math.sin(i)]);
        }
        o2Bubbles.show(bPts.length);
        bPts.forEach((xyz, i) => o2Bubbles.set(i, xyz));

        // Update Blackman 3D surface for leafTempC & move operating pin
        surfB.update((L, C) => M.blackmanSurface(L, C, s.leafTempC).gross);
        bmPin.position.copy(axB.to(s.lightCap, s.co2Cap, s.bm.gross));

        // Guard cell stomatal aperture
        const gap = 0.04 + s.sap.stomatalAperture * 0.11;
        guardL.position.x = -gap;
        guardR.position.x = gap;
      },
    };
  },
};
