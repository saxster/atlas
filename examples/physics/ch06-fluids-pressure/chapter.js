import { SUBJECT } from '../subject.js';
import {
  THREE, part, box, cyl, sphere, lines, arrow, setArrow, rod,
  prims, shadeMat, studioGrid, playTone, V
} from '@saxster/atlas/phys_kit.js';
import * as M from './model.js';

export const PAGES = [
  {
    tab: '3-hole bottle & barrel',
    fig: 'Figure 6.1 · Hydrostatic pressure P = ρgh: three-hole spouting bottle & Pascal’s barrel',
    title: 'Hydrostatic Depth Pressure & Spouting Jets',
    alt: '3D transparent water column with three side nozzles at depths h₁, h₂, and h₃ shooting parabolic water arcs of increasing horizontal speed v = √(2gh).',
    cam: { target: [0, 1.35, 0], az: 24, el: 20, dist: 7.4 },
    lit: 'jet_nozzles',
    parts: ['water_tower', 'jet_nozzles'],
    look: { xray: 0.2, section: 0 },
  },
  {
    tab: 'Torricelli barometer',
    fig: 'Figure 6.2 · Torricelli’s 760 mm mercury barometer column balanced by atmospheric pressure',
    title: 'Torricelli’s Mercury Barometer (760 mm Hg)',
    alt: '3D cutaway mercury reservoir dish with an inverted glass tube holding a 760 mm silver mercury column topped by a Torricellian vacuum chamber.',
    cam: { target: [14, 1.4, 0], az: 20, el: 20, dist: 7.2 },
    lit: 'mercury_column',
    parts: ['mercury_basin', 'mercury_column'],
    look: { xray: 0.25, section: 0 },
  },
  {
    tab: 'Inverted glass card',
    fig: 'Figure 6.3 · Inverted glass of water held up by upward atmospheric pressure on a card',
    title: 'Upward Atmospheric Pressure on an Inverted Card',
    alt: '3D inverted tumbler filled with water and sealed at the bottom by a flat postcard; a large upward atmospheric force arrow F_atm overwhelms the small downward water weight arrow mg.',
    cam: { target: [28, 1.35, 0], az: 22, el: 18, dist: 7.0 },
    lit: 'card_seal',
    parts: ['inverted_tumbler', 'card_seal'],
    look: { xray: 0.2, section: 0 },
  },
];

export const PLATES = {
  water_tower: {
    text: 'Vertical water column of head height H: gauge pressure P = ρgh depends ONLY on vertical depth below the free surface, not on container width.',
    facts: s => [['Head H', `${(s.waterHeadM * 100).toFixed(0)} cm`], ['Bottom ΔP', `${(s.jetBot.gaugePressurePa / 1000).toFixed(2)} kPa`]],
  },
  jet_nozzles: {
    text: 'Three side orifices at depths h₁, h₂, h₃: by Torricelli’s theorem, efflux speed v = √(2gh) increases with depth so deeper jets shoot out with flatter initial slopes.',
    facts: s => [['v_top', `${s.jetTop.jetSpeedMps.toFixed(2)} m/s`], ['v_mid', `${s.jetMid.jetSpeedMps.toFixed(2)} m/s`], ['v_bot', `${s.jetBot.jetSpeedMps.toFixed(2)} m/s`]],
  },
  mercury_basin: {
    text: 'Open mercury dish exposed to surrounding air: atmospheric molecules hammer the open surface with P_atm ≈ 101.3 kPa, pushing mercury up the evacuated tube.',
  },
  mercury_column: {
    text: '760 mm Hg column + Torricellian vacuum at top: because mercury is 13.6× denser than water, 1 atm supports 0.76 m of mercury instead of a 10.3 m (three-storey!) water column.',
    facts: s => [['P_atm', `${s.atmKPa.toFixed(1)} kPa`], ['h_Hg', `${s.bar.mercuryMm.toFixed(0)} mm`], ['h_H2O equiv', `${s.bar.waterM.toFixed(2)} m`]],
  },
  inverted_tumbler: {
    text: 'Inverted glass holding 12 cm of water: no air can bubble in past the wet rim, so the water column exerts only ρgh ≈ 1.2 kPa downward.',
  },
  card_seal: {
    text: 'Postcard across the rim: room air pushes UP on the card with ~390 N while the water inside pushes DOWN with only ~4.5 N — atmospheric pressure wins by 86×!',
    facts: s => [['F_atm ↑', `${s.card.upwardAtmForceN.toFixed(0)} N`], ['W_water ↓', `${s.card.waterWeightN.toFixed(1)} N`], ['Safety margin', `${s.card.safetyFactor.toFixed(0)}×`]],
  },
};

export const CHAPTER = {
  subject: SUBJECT,
  no: 6,
  PAGES,
  PLATES,
  clock0: 0,
  cuts: true,
  xrayKeys: ['water_tower', 'mercury_column', 'inverted_tumbler'],
  cutKeys: ['water_tower', 'mercury_column', 'inverted_tumbler'],
  cutPlane: [0, 0, -1, 0.05],
  defaultParams: { waterHeadM: 0.45, atmKPa: 101.3 },
  controls: [
    { id: 'waterHeadM', label: 'Bottle water column height H', min: 0.15, max: 0.60, step: 0.05, value: 0.45, unit: 'm' },
    { id: 'atmKPa', label: 'External atmospheric pressure P_atm', min: 40, max: 110, step: 1, value: 101.3, unit: 'kPa' },
  ],
  lessons: {
    'ch06-spouting-bottle-3d': { page: 0, params: { waterHeadM: 0.45 } },
    'ch06-barometer-3d': { page: 1, params: { atmKPa: 101.3 } },
    'ch06-card-glass-3d': { page: 2, params: { atmKPa: 101.3 } },
  },
  sensor: {
    type: 'mic',
    label: 'Blow into mic to raise pressure',
    apply(v) {
      return { atmKPa: +(50 + v * 60).toFixed(1), waterHeadM: +(0.2 + v * 0.4).toFixed(2) };
    },
  },
  sonify(ctx, s, page) {
    if (page === 0) playTone(ctx, { freq: 200 + s.jetBot.jetSpeedMps * 90, dur: 0.06, type: 'sine', gain: 0.03 });
    else if (page === 1) playTone(ctx, { freq: 140 + s.bar.mercuryMm * 0.4, dur: 0.07, type: 'triangle', gain: 0.03 });
    else playTone(ctx, { freq: 340, dur: 0.05, type: 'sine', gain: 0.025 });
  },
  state(clock, reduced) {
    const p = CHAPTER.params || CHAPTER.defaultParams;
    const t = reduced ? 1.0 : clock;
    const H = p.waterHeadM;
    const jetTop = M.hydrostaticJet(H * 0.25, H * 0.75);
    const jetMid = M.hydrostaticJet(H * 0.55, H * 0.45);
    const jetBot = M.hydrostaticJet(H * 0.85, H * 0.15);
    const bar = M.barometerColumnHeight(p.atmKPa);
    const card = M.invertedCardSupport(p.atmKPa, 3.5, 12);
    return { t, waterHeadM: H, atmKPa: p.atmKPa, jetTop, jetMid, jetBot, bar, card };
  },
  readout(s, page, pageIdx) {
    if (pageIdx === 0) {
      return `<b>Water column H = ${(s.waterHeadM * 100).toFixed(0)} cm</b> · Bottom ΔP = <b>${(s.jetBot.gaugePressurePa / 1000).toFixed(2)} kPa</b> · Jet speeds: Top <b>${s.jetTop.jetSpeedMps.toFixed(2)} m/s</b>, Mid <b>${s.jetMid.jetSpeedMps.toFixed(2)} m/s</b>, Bottom <b>${s.jetBot.jetSpeedMps.toFixed(2)} m/s</b>.`;
    }
    if (pageIdx === 1) {
      return `<b>Atmospheric Pressure P_atm = ${s.atmKPa.toFixed(1)} kPa</b> · Supports <b>${s.bar.mercuryMm.toFixed(0)} mm Hg</b> (or an equivalent <b>${s.bar.waterM.toFixed(2)} m</b> column of water!).`;
    }
    return `<b>Inverted Glass Card (P_atm = ${s.atmKPa.toFixed(1)} kPa)</b> · Upward air force <b>F_atm = ${s.card.upwardAtmForceN.toFixed(0)} N ↑</b> vs downward water weight <b>W = ${s.card.waterWeightN.toFixed(1)} N ↓</b> (${s.card.safetyFactor.toFixed(0)}× margin).`;
  },
  buildWorld(E) {
    const { scene, asm } = E;
    const root = new THREE.Group();
    scene.add(root);
    studioGrid(root, { x0: -4, x1: 34 });
    const labels = [];
    const label = (cls, html, at, opts = {}) => labels.push({ cls, html, at, ...opts });

    // Station 0 (x = 0): 3-Hole Spouting Bottle
    const towerAsm = asm('water_tower', root, { title: 'Cylindrical water vessel', sub: 'P = P₀ + ρgh' });
    towerAsm.position.set(-0.8, 0.1, 0);
    part(towerAsm, cyl(0.58, 2.2, 24), { pal: 'paper', tone: 'mid', pos: [0, 1.1, 0], mat: shadeMat('paper', { opacity: 0.38 }), name: 'Bottle wall' });
    const colWater = part(towerAsm, cyl(0.54, 1.9, 24), { pal: 'blue', tone: 'hi', pos: [0, 0.95, 0], ex: [0, 0.4, 0], name: 'Water column' });

    const nozAsm = asm('jet_nozzles', root, { title: 'Three spouting orifices', sub: 'v = √(2gh) parabolic arcs' });
    nozAsm.position.set(-0.8, 0.1, 0);
    const jetTubes = [];
    for (let k = 0; k < 3; k++) {
      const yHole = 1.45 - k * 0.52;
      part(nozAsm, cyl(0.05, 0.18, 12), { pal: 'ochre', tone: 'hi', pos: [0.58, yHole, 0], rot: [0, 0, Math.PI / 2], ex: [0.35, 0, 0], name: `Orifice ${k + 1}` });
      const pts = [];
      for (let i = 0; i <= 12; i++) pts.push(V(0.65 + i * 0.12, yHole * (1 - (i / 12) ** 2), 0));
      const tGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.028, 8, false);
      jetTubes.push(part(nozAsm, tGeo, { pal: 'blue', tone: 'lit', ex: [0.5, 0, 0], name: `Parabolic water jet ${k + 1}` }));
    }
    label('board', 'P = ρgh → v = √(2gh)', () => V(0.5, 2.2, 0), { leader: [-20, -20] });

    // Station 1 (x = 14): Torricelli Mercury Barometer
    const basinAsm = asm('mercury_basin', root, { title: 'Open mercury reservoir', sub: 'P_atm pushes down on free surface' });
    basinAsm.position.set(14, 0.22, 0);
    part(basinAsm, cyl(0.95, 0.36, 28), { pal: 'dark', tone: 'mid', pos: [0, 0, 0], name: 'Glass dish' });
    part(basinAsm, cyl(0.88, 0.24, 28), { pal: 'ochre', tone: 'hi', pos: [0, 0.04, 0], ex: [0, -0.25, 0], name: 'Mercury pool' });
    const fAtmL = arrow(basinAsm, { pal: 'blue', r: 0.025 });
    const fAtmR = arrow(basinAsm, { pal: 'blue', r: 0.025 });
    setArrow(fAtmL, V(-0.55, 0.75, 0), V(-0.55, 0.2, 0));
    setArrow(fAtmR, V(0.55, 0.75, 0), V(0.55, 0.2, 0));

    const colAsm = asm('mercury_column', root, { title: '760 mm Hg column & vacuum', sub: 'ρ_Hg g h = P_atm' });
    colAsm.position.set(14, 0.25, 0);
    part(colAsm, cyl(0.18, 2.2, 20), { pal: 'paper', tone: 'mid', pos: [0, 1.1, 0], mat: shadeMat('paper', { opacity: 0.38 }), name: 'Inverted barometer tube' });
    const hgRod = part(colAsm, cyl(0.14, 1.65, 20), { pal: 'red', tone: 'hi', pos: [0, 0.82, 0], ex: [0, 0.45, 0], name: 'Supported mercury column' });
    label('board', 'Torricellian vacuum (P ≈ 0)', () => V(14, 2.55, 0), { leader: [0, -18] });
    label('board', '760 mm Hg', () => V(14.6, 1.35, 0));

    // Station 2 (x = 28): Inverted Glass & Card Support
    const tumbAsm = asm('inverted_tumbler', root, { title: 'Inverted water tumbler', sub: 'Trapped 12 cm water column' });
    tumbAsm.position.set(28, 1.45, 0);
    part(tumbAsm, cyl(0.58, 1.35, 24), { pal: 'paper', tone: 'mid', pos: [0, 0, 0], mat: shadeMat('paper', { opacity: 0.4 }), name: 'Inverted glass' });
    part(tumbAsm, cyl(0.53, 1.25, 24), { pal: 'blue', tone: 'hi', pos: [0, -0.02, 0], ex: [0, 0.4, 0], name: 'Trapped water' });
    const wWaterVec = arrow(tumbAsm, { pal: 'red', r: 0.026 });
    setArrow(wWaterVec, V(0, 0.2, 0), V(0, -0.35, 0));

    const cardAsm = asm('card_seal', root, { title: 'Postcard & upward air pressure', sub: 'F_atm ↑ >> W_water ↓' });
    cardAsm.position.set(28, 0.76, 0);
    part(cardAsm, box(1.45, 0.04, 1.45, 0.01), { pal: 'ochre', tone: 'lit', pos: [0, 0, 0], ex: [0, -0.35, 0], name: 'Sealing postcard' });
    const fUpCard = arrow(cardAsm, { pal: 'green', r: 0.034 });
    label('board', 'F_atm ↑ (390 N) >> mg ↓ (4.5 N)', () => V(28, 2.35, 0), { leader: [0, -20] });

    return {
      labels,
      update(s) {
        // Station 0: scale water height & jet reach
        const hRatio = s.waterHeadM / 0.60;
        colWater.scale.y = Math.max(0.25, hRatio);
        colWater.position.y = colWater.scale.y * 0.95;
        for (let k = 0; k < 3; k++) {
          jetTubes[k].scale.x = 0.55 + hRatio * (0.45 + k * 0.22);
        }

        // Station 1: scale mercury column height with P_atm
        const hgScale = s.atmKPa / 110;
        hgRod.scale.y = Math.max(0.2, hgScale);
        hgRod.position.y = hgRod.scale.y * 0.82;

        // Station 2: scale upward atmospheric force arrow on card
        setArrow(fUpCard, V(0, -0.68 * hgScale, 0), V(0, -0.04, 0));
      },
    };
  },
};
