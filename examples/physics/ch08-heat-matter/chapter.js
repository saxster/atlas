import { SUBJECT } from '../subject.js';
import {
  THREE, part, box, cyl, sphere, torus, lines, arrow, setArrow, rod,
  prims, shadeMat, MOLECULES, studioGrid, playTone, V
} from '@saxster/atlas/phys_kit.js';
import * as M from './model.js';

export const PAGES = [
  {
    tab: 'Joule paddle',
    fig: 'Figure 8.1 · Joule’s falling-weight paddle-wheel calorimeter (4.184 J per calorie)',
    title: 'Joule’s Mechanical Equivalent of Heat',
    alt: '3D cutaway copper calorimeter churned by brass paddles tied over pulleys to two falling lead weights, converting mechanical potential energy 2mgh into thermal agitation ΔT.',
    cam: { target: [0, 1.35, 0], az: 22, el: 20, dist: 7.4 },
    lit: 'paddle_churn',
    parts: ['lead_weights', 'paddle_churn'],
    look: { xray: 0.25, section: 0 },
  },
  {
    tab: 'Spoon vs bucket',
    fig: 'Figure 8.2 · Boiling spoon (high T, low Q) vs warm bucket (moderate T, huge Q)',
    title: 'Temperature (Intensive) vs Thermal Energy (Extensive)',
    alt: '3D comparison of a small 100 °C spoon with fast-jiggling molecules against a large 40 °C bucket containing 500× more water molecules and far greater total thermal energy.',
    cam: { target: [14, 1.3, 0], az: 20, el: 22, dist: 7.2 },
    lit: 'warm_bucket',
    parts: ['hot_spoon', 'warm_bucket'],
    look: { xray: 0.2, section: 0 },
  },
  {
    tab: 'Sweater & ice',
    fig: 'Figure 8.4 · Why wrapping an ice block in a wool sweater keeps it frozen longer',
    title: 'Thermal Insulation: The Sweater-Wrapped Ice Block',
    alt: 'Two 3D ice blocks on a table: a bare ice block rapidly absorbing room heat vs an identical ice block wrapped in a porous wool sweater that traps still air and blocks inward heat conduction.',
    cam: { target: [28, 1.25, 0], az: 24, el: 20, dist: 7.2 },
    lit: 'wool_wrap',
    parts: ['bare_ice', 'wool_wrap'],
    look: { xray: 0.25, section: 0 },
  },
  {
    tab: 'Phase plateaus',
    fig: 'Figure 8.5 · Heating curve of water showing flat 0 °C melting and 100 °C boiling plateaus',
    title: 'Latent Heat & Phase-Change Plateaus',
    alt: '3D temperature-vs-heat staircase tube with flat horizontal plateaus at 0 °C (L_f = 334 kJ/kg) and 100 °C (L_v = 2260 kJ/kg) alongside a live H₂O molecular cluster.',
    cam: { target: [42, 1.35, 0], az: 20, el: 20, dist: 7.4 },
    lit: 'phase_stair',
    parts: ['phase_stair', 'h2o_lattice'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Matka cooler',
    fig: 'Figure 8.6 · Porous terracotta matka cooling water by selective escape of fast molecules',
    title: 'Evaporative Cooling in an Earthen Matka',
    alt: '3D cutaway terracotta matka water pot with microscopic clay pores allowing high-speed red water molecules to escape as vapour while slower blue molecules remain behind at a cooler temperature.',
    cam: { target: [56, 1.35, 0], az: 24, el: 20, dist: 7.2 },
    lit: 'matka_vessel',
    parts: ['matka_vessel', 'escaping_vapour'],
    look: { xray: 0.25, section: 0 },
  },
  {
    tab: 'Sea breeze loop',
    fig: 'Figure 8.7 · Coastal Mumbai sea-breeze and land-breeze thermal convection cell',
    title: 'Coastal Sea-Breeze Convection Loop',
    alt: '3D coastal slice of Mumbai beach and Arabian Sea with a rotating 3D convection ring driven by the 5× specific-heat contrast between water and sand.',
    cam: { target: [70, 1.3, 0], az: 22, el: 22, dist: 7.6 },
    lit: 'convection_loop',
    parts: ['coast_slab', 'convection_loop'],
    look: { xray: 0, section: 0 },
  },
];

export const PLATES = {
  lead_weights: {
    text: 'Twin falling lead weights (2 × m): each drop of height h delivers mechanical work W = 2mgh via the pulley strings.',
    facts: s => [['Work W', `${(s.joule.workJoules / 1000).toFixed(2)} kJ`], ['Water ΔT', `+${s.joule.deltaTK.toFixed(2)} °C`]],
  },
  paddle_churn: {
    text: 'Rotating brass paddles + fixed baffles: viscous churning turns ordered mechanical work into random kinetic energy of water molecules (4,184 J raises 1 kg by 1 °C).',
  },
  hot_spoon: {
    text: 'Teaspoon of 100 °C water: high average kinetic energy per molecule (high temperature T), but tiny total molecule count N.',
  },
  warm_bucket: {
    text: 'Bucket of 40 °C water: lower energy per molecule, but 1,000× more molecules → vastly greater total thermal energy Q = mcΔT (melts far more ice than the boiling spoon!).',
  },
  bare_ice: {
    text: 'Unwrapped ice block: warm 32 °C room air conducts heat directly into the ice surface, melting it rapidly.',
  },
  wool_wrap: {
    text: 'Wool sweater around ice: wool contains no heat source! Its trapped air pockets have tiny thermal conductivity (k ≈ 0.026 W/m·K), slowing heat entry so the ice stays frozen.',
  },
  phase_stair: {
    text: 'Why temperature stops rising during melting (0 °C) and boiling (100 °C): all incoming heat goes into breaking hydrogen bonds (latent heat L) rather than speeding molecules up.',
    facts: s => [['Heat Q', `${s.addedHeatKj} kJ/kg`], ['State', s.phase.phase], ['T', `${s.phase.tempC.toFixed(1)} °C`]],
  },
  h2o_lattice: {
    text: 'Hydrogen-bonded H₂O cluster: vibrations intensify with temperature until bonds snap at phase transitions.',
  },
  matka_vessel: {
    text: 'Unglazed terracotta clay pot: capillary micropores seep a tiny film of water to the outer wall.',
    facts: s => [['Evaporated', `${(s.evapPct).toFixed(1)}%`], ['Cooling ΔT', `−${s.matka.deltaTC.toFixed(1)} °C`], ['Pot water T', `${s.matka.finalTempC.toFixed(1)} °C`]],
  },
  escaping_vapour: {
    text: 'Selective molecular escape: only the fastest-moving molecules overcome surface attraction to evaporate, lowering the average kinetic energy (temperature) of the water left behind.',
  },
  coast_slab: {
    text: 'Sand (c ≈ 830 J/kg·K) vs Sea (c ≈ 4,184 J/kg·K): under the same noon sun, sand heats up 5× faster than sea water.',
  },
  convection_loop: {
    text: 'Convection cell: hot air over the beach expands and rises, drawing cool dense sea air inland (daytime sea breeze); at night the land cools faster and the loop reverses.',
  },
};

export const CHAPTER = {
  subject: SUBJECT,
  no: 8,
  PAGES,
  PLATES,
  clock0: 0,
  cuts: true,
  xrayKeys: ['paddle_churn', 'warm_bucket', 'wool_wrap', 'matka_vessel'],
  cutKeys: ['paddle_churn', 'wool_wrap', 'matka_vessel'],
  cutPlane: [0, 0, -1, 0.05],
  defaultParams: { dropsCount: 20, addedHeatKj: 550, evapPct: 1.5 },
  controls: [
    { id: 'dropsCount', label: 'Joule weight drops N', min: 5, max: 50, step: 5, value: 20, unit: 'drops' },
    { id: 'addedHeatKj', label: 'Added heat per kg (phase curve)', min: 0, max: 3200, step: 50, value: 550, unit: 'kJ/kg' },
    { id: 'evapPct', label: 'Matka water evaporated', min: 0.2, max: 3.0, step: 0.2, value: 1.5, unit: '%' },
  ],
  lessons: {
    'ch08-joule-3d': { page: 0, params: { dropsCount: 25 } },
    'ch08-spoon-bucket-3d': { page: 1 },
    'ch08-sweater-ice-3d': { page: 2 },
    'ch08-heating-curve-3d': { page: 3, params: { addedHeatKj: 200 } },
    'ch08-matka-3d': { page: 4, params: { evapPct: 1.6 } },
    'ch08-sea-breeze-3d': { page: 5 },
  },
  sonify(ctx, s, page) {
    if (page === 0) playTone(ctx, { freq: 180 + s.joule.deltaTK * 60, dur: 0.06, type: 'triangle', gain: 0.03 });
    else if (page === 3) playTone(ctx, { freq: 200 + (s.phase.tempC + 20) * 3.5, dur: 0.06, type: 'sine', gain: 0.03 });
    else if (page === 4) playTone(ctx, { freq: 380 - s.matka.deltaTC * 18, dur: 0.07, type: 'sine', gain: 0.03 });
    else playTone(ctx, { freq: 280, dur: 0.05, type: 'sine', gain: 0.025 });
  },
  state(clock, reduced) {
    const p = CHAPTER.params || CHAPTER.defaultParams;
    const t = reduced ? 1.0 : clock;
    const joule = M.jouleCalorimeterRise(12, 2.0, p.dropsCount, 1.5, 9.8);
    const phase = M.waterPhaseState(p.addedHeatKj);
    const matka = M.matkaEvaporativeCooling(32, p.evapPct / 100);
    return { t, dropsCount: p.dropsCount, joule, addedHeatKj: p.addedHeatKj, phase, evapPct: p.evapPct, matka };
  },
  readout(s, page, pageIdx) {
    if (pageIdx === 0) {
      return `<b>Joule Calorimeter (${s.dropsCount} drops of 2×12 kg)</b> · Mechanical work <b>W = ${(s.joule.workJoules / 1000).toFixed(2)} kJ</b> churns 1.5 kg water → Temperature rises <b>+${s.joule.deltaTK.toFixed(2)} °C</b>.`;
    }
    if (pageIdx === 1) {
      return `<b>Intensive T vs Extensive Q</b> · 100 °C spoon (10 g) has high energy per molecule; 40 °C bucket (10 kg) holds <b>280× more thermal energy</b> above 20 °C.`;
    }
    if (pageIdx === 2) {
      return `<b>Sweater-Wrapped Ice</b> · Wool has no internal heater: its trapped air pockets (k = 0.026 W/m·K) slow room heat from entering, keeping the wrapped ice frozen!`;
    }
    if (pageIdx === 3) {
      return `<b>Heat Added Q = ${s.addedHeatKj} kJ/kg</b> · Current regime: <b>${s.phase.phase}</b> at <b>T = ${s.phase.tempC.toFixed(1)} °C</b> (L_f = 334 kJ/kg, L_v = 2,260 kJ/kg).`;
    }
    if (pageIdx === 4) {
      return `<b>Matka Evaporative Cooler (32.0 °C room)</b> · Evaporating just <b>${s.evapPct.toFixed(1)}%</b> of the water removes latent heat L_v, cooling the pot to <b>${s.matka.finalTempC.toFixed(1)} °C</b> (−${s.matka.deltaTC.toFixed(1)} °C).`;
    }
    return `<b>Mumbai Coastal Convection</b> · Water’s specific heat (4,184 J/kg·K) is 5× sand’s → Daytime warm land air rises, pulling cool Arabian Sea breeze inland.`;
  },
  buildWorld(E) {
    const { scene, asm } = E;
    const root = new THREE.Group();
    scene.add(root);
    studioGrid(root, { x0: -4, x1: 76 });
    const labels = [];
    const label = (cls, html, at, opts = {}) => labels.push({ cls, html, at, ...opts });

    // Station 0 (x = 0): Joule's Paddle Calorimeter
    const wtAsm = asm('lead_weights', root, { title: 'Twin falling lead weights', sub: 'W = 2 m g h N' });
    wtAsm.position.set(0, 1.3, 0);
    const weightL = part(wtAsm, cyl(0.2, 0.45, 18), { pal: 'dark', tone: 'hi', pos: [-1.35, 0, 0], ex: [-0.4, 0, 0], name: 'Left lead weight' });
    const weightR = part(wtAsm, cyl(0.2, 0.45, 18), { pal: 'dark', tone: 'hi', pos: [1.35, 0, 0], ex: [0.4, 0, 0], name: 'Right lead weight' });

    const padAsm = asm('paddle_churn', root, { title: 'Insulated copper calorimeter & paddles', sub: '4,184 J warms 1 kg water by 1 °C' });
    padAsm.position.set(0, 0.85, 0);
    part(padAsm, cyl(0.68, 1.35, 24), { pal: 'ochre', tone: 'mid', pos: [0, 0, 0], mat: shadeMat('ochre', { opacity: 0.45 }), name: 'Copper calorimeter drum' });
    const paddleShaft = part(padAsm, cyl(0.06, 1.55, 14), { pal: 'red', tone: 'hi', pos: [0, 0.1, 0], ex: [0, 0.45, 0], name: 'Paddle rotor shaft' });
    part(padAsm, box(0.95, 0.45, 0.08, 0.01), { pal: 'red', tone: 'hi', pos: [0, -0.1, 0], ex: [0, 0.35, 0], name: 'Churning vane' });
    label('board', 'W = 2mgh → Q = mcΔT', () => V(0, 2.15, 0), { leader: [0, -20] });

    // Station 1 (x = 14): Boiling Spoon vs Warm Bucket
    const spoonAsm = asm('hot_spoon', root, { title: 'Boiling spoon (100 °C)', sub: 'High T, tiny mass m' });
    spoonAsm.position.set(13.0, 1.15, 0);
    part(spoonAsm, sphere(0.24, 18), { pal: 'red', tone: 'hi', pos: [0, 0, 0], ex: [-0.35, 0.3, 0], name: '100 °C spoon bowl' });
    part(spoonAsm, box(0.65, 0.06, 0.1, 0.01), { pal: 'dark', tone: 'mid', pos: [-0.4, 0.05, 0], name: 'Spoon handle' });

    const buckAsm = asm('warm_bucket', root, { title: 'Warm bathtub bucket (40 °C)', sub: 'Moderate T, 1000× mass → huge Q' });
    buckAsm.position.set(14.8, 0.85, 0);
    part(buckAsm, cyl(0.78, 1.4, 24), { pal: 'blue', tone: 'hi', pos: [0, 0, 0], mat: shadeMat('blue', { opacity: 0.55 }), ex: [0.35, 0.3, 0], name: '40 °C water bucket' });
    label('board', '100 °C (Low Q)', () => V(13.0, 1.75, 0));
    label('board', '40 °C (Huge Q = mcΔT)', () => V(14.8, 1.85, 0));

    // Station 2 (x = 28): Sweater-Wrapped Ice Block
    const bareAsm = asm('bare_ice', root, { title: 'Unwrapped ice block', sub: 'Fast inward heat flow Q/t' });
    bareAsm.position.set(27.0, 0.55, 0);
    part(bareAsm, box(0.62, 0.62, 0.62, 0.04), { pal: 'blue', tone: 'lit', pos: [0, 0, 0], ex: [-0.3, 0.3, 0], name: 'Melting bare ice' });
    const qFast = arrow(bareAsm, { pal: 'red', r: 0.028 });
    setArrow(qFast, V(-0.95, 0.2, 0), V(-0.35, 0.2, 0));

    const woolAsm = asm('wool_wrap', root, { title: 'Wool-wrapped ice block', sub: 'Trapped air slows conduction' });
    woolAsm.position.set(29.0, 0.65, 0);
    part(woolAsm, box(0.95, 0.95, 0.95, 0.08), { pal: 'ochre', tone: 'mid', pos: [0, 0, 0], mat: shadeMat('ochre', { opacity: 0.45 }), ex: [0, 0.5, 0], name: 'Insulating wool sweater' });
    part(woolAsm, box(0.68, 0.68, 0.68, 0.04), { pal: 'blue', tone: 'lit', pos: [0, 0, 0], ex: [0, 0.2, 0], name: 'Preserved ice core' });
    label('board', 'Trapped air blocks room heat!', () => V(29.0, 1.65, 0), { leader: [0, -20] });

    // Station 3 (x = 42): Phase-Change Heating Curve & H2O Cluster
    const stairAsm = asm('phase_stair', root, { title: 'Phase-change temperature staircase', sub: 'Flat plateaus at 0 °C and 100 °C' });
    stairAsm.position.set(41.6, 0.3, 0);
    const stairPts = [
      V(-1.5, 0.1, 0), V(-1.0, 0.5, 0), V(-0.3, 0.5, 0),
      V(0.3, 1.35, 0), V(1.25, 1.35, 0), V(1.6, 1.75, 0),
    ];
    const stairGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(stairPts), 48, 0.045, 10, false);
    part(stairAsm, stairGeo, { pal: 'red', tone: 'hi', ex: [0, 0.3, 0], name: 'T(Q) heating curve' });
    const phaseMarker = part(stairAsm, sphere(0.11, 16), { pal: 'ochre', tone: 'hi', pos: [0, 0.8, 0], name: 'Current phase state' });

    const h2oAsm = asm('h2o_lattice', root, { title: 'H₂O hydrogen-bond cluster', sub: 'Bonds break during plateaus' });
    h2oAsm.position.set(43.2, 1.15, 0.5);
    prims.molecule(h2oAsm, { atoms: MOLECULES.waterCluster.atoms, bonds: MOLECULES.waterCluster.bonds, scale: 0.24 });
    label('board', '0 °C & 100 °C Latent Plateaus', () => V(41.6, 2.25, 0), { leader: [0, -20] });

    // Station 4 (x = 56): Earthen Matka Evaporative Cooler
    const matkaAsm = asm('matka_vessel', root, { title: 'Porous terracotta matka', sub: 'Remaining water cools by ΔT' });
    matkaAsm.position.set(56, 0.95, 0);
    part(matkaAsm, sphere(0.88, 28), { pal: 'ochre', tone: 'hi', pos: [0, 0, 0], mat: shadeMat('ochre', { opacity: 0.52 }), name: 'Porous clay belly' });
    part(matkaAsm, cyl(0.36, 0.35, 20), { pal: 'ochre', tone: 'hi', pos: [0, 0.85, 0], ex: [0, 0.45, 0], name: 'Matka neck' });
    part(matkaAsm, sphere(0.75, 24), { pal: 'blue', tone: 'hi', pos: [0, -0.06, 0], ex: [0, 0.25, 0], name: 'Chilled drinking water' });

    const vapAsm = asm('escaping_vapour', root, { title: 'Escaping high-KE vapour molecules', sub: 'Carry away L_v = 2,260 kJ/kg' });
    vapAsm.position.set(56, 0.95, 0);
    const vapCloud = prims.particles(vapAsm, { count: 20, r: 0.045, pal: 'red' });
    label('board', 'Fast molecules escape → pot cools', () => V(56, 2.25, 0), { leader: [0, -20] });

    // Station 5 (x = 70): Coastal Sea-Breeze Convection Loop
    const coastAsm = asm('coast_slab', root, { title: 'Beach sand vs Arabian Sea', sub: 'c_water ≈ 5 × c_sand' });
    coastAsm.position.set(70, 0.2, 0);
    part(coastAsm, box(1.8, 0.22, 1.4, 0.03), { pal: 'blue', tone: 'hi', pos: [-0.9, 0, 0], ex: [-0.3, -0.2, 0], name: 'Cool sea water' });
    part(coastAsm, box(1.8, 0.22, 1.4, 0.03), { pal: 'ochre', tone: 'hi', pos: [0.9, 0, 0], ex: [0.3, -0.2, 0], name: 'Warm beach sand' });

    const loopAsm = asm('convection_loop', root, { title: 'Thermal convection ring', sub: 'Cool sea breeze flows inland' });
    loopAsm.position.set(70, 1.25, 0);
    const breezeRing = part(loopAsm, torus(1.05, 0.055, 12, 36), { pal: 'green', tone: 'hi', ex: [0, 0.35, 0], name: 'Convection circulation loop' });
    label('board', 'Daytime sea breeze →', () => V(70, 2.55, 0), { leader: [0, -20] });

    return {
      labels,
      update(s) {
        // Station 0: Joule weights & paddle spin
        const cyc = (s.t * 0.65) % 1;
        weightL.position.y = 0.45 - cyc * 0.85;
        weightR.position.y = 0.45 - cyc * 0.85;
        paddleShaft.rotation.y = s.t * 3.2;

        // Station 3: Phase marker along staircase
        const uQ = Math.min(1, s.addedHeatKj / 3200);
        const xM = -1.5 + uQ * 3.1;
        const yM = 0.1 + ((s.phase.tempC + 20) / 140) * 1.65;
        phaseMarker.position.set(xM, yM, 0);
        h2oAsm.rotation.y = s.t * (0.5 + (s.phase.tempC + 20) * 0.02);

        // Station 4: Matka escaping fast molecules
        const pts = [];
        for (let i = 0; i < 20; i++) {
          const ang = (i / 20) * Math.PI * 2 + s.t * 0.6;
          const r = 0.92 + ((s.t * 0.55 + i * 0.19) % 0.65);
          pts.push([r * Math.cos(ang), (Math.sin(i * 1.7) * 0.55), r * Math.sin(ang)]);
        }
        vapCloud.set(pts);

        // Station 5: Rotate sea breeze convection loop
        breezeRing.rotation.z = s.t * 1.2;
      },
    };
  },
};
