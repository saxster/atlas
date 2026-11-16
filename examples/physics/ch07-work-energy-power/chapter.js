import { SUBJECT } from '../subject.js';
import {
  THREE, part, box, cyl, sphere, torus, lines, arrow, setArrow, rod,
  prims, shadeMat, studioGrid, playTone, V
} from '@saxster/atlas/phys_kit.js';
import * as M from './model.js';

export const PAGES = [
  {
    tab: 'Clay dent (v²)',
    fig: 'Figure 7.2 · Dropping steel spheres into clay: doubling speed v quadruples dent depth 4d',
    title: 'Kinetic Energy & the v² Clay Dent Test',
    alt: '3D clay trough struck by steel spheres at speed v₀ and v, carving craters whose depth scales as v² because work W = F_clay · d = ½mv².',
    cam: { target: [0, 1.2, 0], az: 22, el: 22, dist: 10.4 },
    lit: 'clay_bed',
    parts: ['drop_spheres', 'clay_bed'],
    look: { xray: 0.15, section: 0 },
  },
  {
    tab: 'Inelastic bounce',
    fig: 'Figure 7.4 · Bouncing ball converting mechanical height into thermal agitation',
    title: 'Inelastic Bounce & Thermal Energy Bloom',
    alt: '3D succession of decaying bounce arcs (h₀, e²h₀, e⁴h₀) with a glowing infrared thermal bloom ring warming the floor at each impact.',
    cam: { target: [14, 1.2, 0], az: 20, el: 20, dist: 10.6 },
    lit: 'bounce_arcs',
    parts: ['bounce_arcs', 'thermal_floor'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'kWh meter',
    fig: 'Figure 7.5 · Household kilowatt-hour (kWh) rotating-disc meter & appliance load',
    title: 'Power vs Energy: The Household kWh Meter',
    alt: '3D cutaway electricity meter with a spinning aluminum eddy-current disc whose rotation speed is proportional to power P (watts) while total turns count energy E = P·t (kWh).',
    cam: { target: [28, 1.3, 0], az: 24, el: 20, dist: 10.4 },
    lit: 'meter_disc',
    parts: ['meter_casing', 'meter_disc'],
    look: { xray: 0.25, section: 0 },
  },
  {
    tab: 'City Sankey flow',
    fig: 'Figure 7.6 · City energy Sankey manifold: primary fuel input vs useful work & waste heat',
    title: 'City-Scale Sankey Energy Manifold',
    alt: '3D branching Sankey conduit splitting primary power input into useful mechanical/lighting work and a wide red exhaust plume of low-grade ambient heat.',
    cam: { target: [42, 1.25, 0], az: 26, el: 22, dist: 10.8 },
    lit: 'sankey_branches',
    parts: ['primary_inlet', 'sankey_branches'],
    look: { xray: 0, section: 0 },
  },
];

export const PLATES = {
  drop_spheres: {
    text: 'Steel impact spheres: doubling impact speed from v to 2v multiplies kinetic energy E_k = ½mv² by 4×, not 2×.',
    facts: s => [['v_impact', `${s.impactSpeedMps.toFixed(1)} m/s`], ['E_k', `${s.dent.keJ.toFixed(1)} J`]],
  },
  clay_bed: {
    text: 'Soft potter’s clay bed: resists penetration with nearly constant force F_clay, so stopping distance d = E_k / F_clay is a direct physical ruler for ½mv².',
    facts: s => [['Dent depth d', `${s.dent.depthCm.toFixed(2)} cm`], ['At 2v', `${(s.dent.depthCm * 4).toFixed(2)} cm (4×)`]],
  },
  bounce_arcs: {
    text: 'Restitution sequence h_n = e^(2n) h₀: at each impact the ball deforms, converting fraction (1 − e²) of its mechanical energy into random jiggling of floor and rubber molecules.',
    facts: s => [['h₀ → h₁', `1.60 m → ${s.bounce.h1.toFixed(2)} m`], ['Heat/bounce', `${(s.bounce.thermalFractionFirstBounce * 100).toFixed(0)}%`]],
  },
  thermal_floor: {
    text: 'Infrared thermal bloom on the tiles: total energy is strictly conserved, but ordered macroscopic motion scatters irreversibly into disordered microscopic heat.',
  },
  meter_casing: {
    text: 'Electricity board meter casing: measures energy in kilowatt-hours (1 kWh = 1,000 W × 3,600 s = 3.6 megajoules).',
  },
  meter_disc: {
    text: 'Spinning induction disc: angular speed ω measures instantaneous power P (W); the mechanical counter integrates total revolutions to bill total energy E = P × t (kWh).',
    facts: s => [['Power P', `${s.powerWatts} W`], ['30-day E', `${s.bill.totalKwh.toFixed(0)} kWh (${s.bill.totalMegajoules.toFixed(0)} MJ)`], ['Monthly bill', `₹${s.bill.costInr.toFixed(0)}`]],
  },
  primary_inlet: {
    text: 'Primary city energy trunk (100% input): coal, solar, hydro, and gas feeding Mumbai’s grid and transport.',
  },
  sankey_branches: {
    text: 'Conservation of energy in 3D: the cross-sectional area of the useful work pipe (green) plus the waste-heat exhaust pipe (red) equals 100% of the inlet trunk.',
  },
};

export const CHAPTER = {
  subject: SUBJECT,
  no: 7,
  PAGES,
  PLATES,
  clock0: 0,
  cuts: true,
  xrayKeys: ['clay_bed', 'meter_casing'],
  cutKeys: ['clay_bed', 'meter_casing'],
  cutPlane: [0, 0, -1, 0.05],
  defaultParams: { impactSpeedMps: 4.0, restitutionE: 0.75, powerWatts: 1500 },
  controls: [
    { id: 'impactSpeedMps', label: 'Clay test impact speed v', min: 1.0, max: 6.0, step: 0.5, value: 4.0, unit: 'm/s' },
    { id: 'restitutionE', label: 'Bounce restitution coefficient e', min: 0.3, max: 0.95, step: 0.05, value: 0.75, unit: '' },
    { id: 'powerWatts', label: 'Household appliance load P', min: 200, max: 3500, step: 100, value: 1500, unit: 'W' },
  ],
  lessons: {
    'ch07-clay-dent-3d': { page: 0, params: { impactSpeedMps: 4.0 } },
    'ch07-bounce-heat-3d': { page: 1, params: { restitutionE: 0.75 } },
    'ch07-kwh-meter-3d': { page: 2, params: { powerWatts: 1800 } },
    'ch07-city-sankey-3d': { page: 3 },
  },
  sonify(ctx, s, page) {
    if (page === 0) playTone(ctx, { freq: Math.max(80, 260 - s.dent.depthCm * 20), dur: 0.08, type: 'triangle', gain: 0.04 });
    else if (page === 1) playTone(ctx, { freq: 220 + s.restitutionE * 240, dur: 0.06, type: 'sine', gain: 0.03 });
    else if (page === 2) playTone(ctx, { freq: 120 + s.powerWatts * 0.1, dur: 0.06, type: 'sawtooth', gain: 0.025 });
    else playTone(ctx, { freq: 260, dur: 0.05, type: 'sine', gain: 0.025 });
  },
  state(clock, reduced) {
    const p = CHAPTER.params || CHAPTER.defaultParams;
    const t = reduced ? 1.0 : clock;
    const dent = M.clayDentDepthCm(1.0, p.impactSpeedMps, 200);
    const bounce = M.inelasticBounceSequence(1.6, p.restitutionE);
    const bill = M.householdBillCalc(p.powerWatts, 6, 30, 8.0);
    return { t, impactSpeedMps: p.impactSpeedMps, dent, restitutionE: p.restitutionE, bounce, powerWatts: p.powerWatts, bill };
  },
  readout(s, page, pageIdx) {
    if (pageIdx === 0) {
      return `<b>Impact speed v = ${s.impactSpeedMps.toFixed(1)} m/s</b> (m = 1 kg) → <b>E_k = ½mv² = ${s.dent.keJ.toFixed(1)} J</b> → Clay crater depth <b>d = ${s.dent.depthCm.toFixed(2)} cm</b> (Doubling v gives 4d!).`;
    }
    if (pageIdx === 1) {
      return `<b>Restitution e = ${s.restitutionE.toFixed(2)}</b> · Bounce heights: <b>1.60 m → ${s.bounce.h1.toFixed(2)} m → ${s.bounce.h2.toFixed(2)} m → ${s.bounce.h3.toFixed(2)} m</b> · <b>${(s.bounce.thermalFractionFirstBounce * 100).toFixed(0)}%</b> converted to heat per bounce.`;
    }
    if (pageIdx === 2) {
      return `<b>Appliance Load P = ${s.powerWatts} W</b> (6 h/day × 30 d) → <b>${s.bill.totalKwh.toFixed(0)} kWh</b> (<b>${s.bill.totalMegajoules.toFixed(0)} MJ</b>) → Monthly bill <b>₹${s.bill.costInr.toFixed(0)}</b> at ₹8/kWh.`;
    }
    return `<b>City Sankey Energy Balance</b> · 100% Primary Fuel Input = Useful Mechanical/Electrical Work (38%) + Low-Grade Ambient Waste Heat (62%).`;
  },
  buildWorld(E) {
    const { scene, asm } = E;
    const root = new THREE.Group();
    scene.add(root);
    studioGrid(root, { x0: -4, x1: 48 });
    const labels = [];
    const label = (cls, html, at, opts = {}) => labels.push({ cls, html, at, ...opts });

    // Station 0 (x = 0): Clay-Dent v^2 Tester
    const clayAsm = asm('clay_bed', root, { title: 'Soft potter’s clay block', sub: 'Work W = F_clay · d = ½mv²' });
    clayAsm.position.set(0, 0.45, 0);
    part(clayAsm, box(2.8, 0.85, 1.1, 0.04), { pal: 'ochre', tone: 'mid', pos: [0, 0, 0], mat: shadeMat('ochre', { opacity: 0.5 }), name: 'Clay block' });
    const dentPlug1 = part(clayAsm, cyl(0.22, 0.16, 18), { pal: 'red', tone: 'hi', pos: [-0.65, 0.425 - 0.08, 0], ex: [-0.35, 0, 0], name: 'Reference crater (v₀ = 2 m/s, d₀ = 1 cm)' });
    const dentPlug2 = part(clayAsm, cyl(0.22, 1.0, 18), { pal: 'red', tone: 'hi', pos: [0.65, 0.15, 0], ex: [0.35, 0, 0], name: 'Test crater (v, d ∝ v²)' });

    const sphAsm = asm('drop_spheres', root, { title: 'Steel impact spheres', sub: 'Doubling v quadruples crater depth' });
    sphAsm.position.set(0, 0.45, 0);
    part(sphAsm, sphere(0.18, 20), { pal: 'dark', tone: 'hi', pos: [-0.65, 0.425 - 0.16 + 0.18, 0], ex: [0, 0.4, 0], name: 'Reference sphere (v₀ = 2 m/s)' });
    const testSphere = part(sphAsm, sphere(0.18, 20), { pal: 'blue', tone: 'hi', pos: [0.65, 0.2, 0], ex: [0, 0.5, 0], name: 'Variable-speed sphere (v)' });
    label('board', 'd ∝ v² (2× speed → 4× dent)', () => V(0, 2.05, 0), { leader: [0, -20] });

    // Station 1 (x = 14): Inelastic Bounce & Thermal Bloom
    const floorAsm = asm('thermal_floor', root, { title: 'Impact tiles & thermal bloom', sub: 'Mechanical ΔE turns into heat Q' });
    floorAsm.position.set(14, 0.06, 0);
    part(floorAsm, box(3.8, 0.12, 1.2, 0.02), { pal: 'paper', tone: 'mid', pos: [0, 0, 0], name: 'Floor slab' });
    const heatRings = [];
    for (let k = 0; k < 3; k++) {
      heatRings.push(part(floorAsm, torus(0.28, 0.03, 10, 28), { pal: 'red', tone: 'hi', pos: [-0.925 + k * 0.95, 0.08, 0], rot: [Math.PI / 2, 0, 0], ex: [0, 0.25, 0], name: `Thermal bloom ${k + 1}` }));
    }

    const bAsm = asm('bounce_arcs', root, { title: 'Decaying bounce peaks (h_n = e²ⁿ h₀)', sub: 'Peak height drops by e² per bounce' });
    bAsm.position.set(14, 0.12, 0);
    const peakColumns = [];
    for (let k = 0; k < 4; k++) {
      peakColumns.push(part(bAsm, cyl(0.08, 1.0, 14), { pal: 'green', tone: 'hi', pos: [-1.4 + k * 0.95, 0.5, 0], ex: [0, 0, 0.35], name: `Bounce peak h_${k}` }));
    }
    const bounceBall = part(bAsm, sphere(0.13, 18), { pal: 'ochre', tone: 'hi', pos: [-1.4, 1.2, 0], name: 'Bouncing ball' });
    label('board', 'h_{n+1} = e² h_n + Heat Q', () => V(14, 2.15, 0), { leader: [0, -20] });

    // Station 2 (x = 28): Household kWh Meter
    const caseAsm = asm('meter_casing', root, { title: 'kWh induction meter housing', sub: '1 kWh = 3.6 MJ' });
    caseAsm.position.set(28, 1.15, 0);
    part(caseAsm, box(1.5, 1.85, 0.85, 0.05), { pal: 'paper', tone: 'mid', pos: [0, 0, 0], mat: shadeMat('paper', { opacity: 0.42 }), name: 'Meter glass enclosure' });
    part(caseAsm, box(0.95, 0.28, 0.18, 0.02), { pal: 'dark', tone: 'hi', pos: [0, 0.55, 0.35], ex: [0, 0.3, 0.35], name: 'kWh register drum' });

    const discAsm = asm('meter_disc', root, { title: 'Eddy-current aluminum rotor disc', sub: 'Spin speed ∝ Watts; turns ∝ kWh' });
    discAsm.position.set(28, 1.0, 0);
    const rotorGroup = new THREE.Group();
    discAsm.add(rotorGroup);
    part(rotorGroup, cyl(0.55, 0.06, 28), { pal: 'ochre', tone: 'hi', pos: [0, 0, 0], ex: [0, 0, 0.5], name: 'Aluminum rotor disc' });
    part(rotorGroup, box(0.18, 0.08, 0.14, 0.01), { pal: 'red', tone: 'hi', pos: [0.42, 0.02, 0], ex: [0, 0, 0.6], name: 'Index mark on disc rim' });
    label('board', 'Speed ∝ Power (W); Turns ∝ Energy (kWh)', () => V(28, 2.35, 0), { leader: [0, -20] });

    // Station 3 (x = 42): City Sankey Power Flow
    const inAsm = asm('primary_inlet', root, { title: 'Primary power trunk (100%)', sub: 'Fuel & grid energy supply' });
    inAsm.position.set(40.9, 1.1, 0);
    part(inAsm, cyl(0.46, 1.3, 24), { pal: 'blue', tone: 'hi', pos: [0, 0, 0], rot: [0, 0, Math.PI / 2], ex: [-0.4, 0, 0], name: 'Primary energy inlet' });

    const brAsm = asm('sankey_branches', root, { title: 'Useful work vs rejected heat', sub: 'E_in = W_useful + Q_waste' });
    brAsm.position.set(42.5, 1.1, 0);
    part(brAsm, cyl(0.28, 1.5, 20), { pal: 'green', tone: 'hi', pos: [0, 0.42, 0], rot: [0, 0, Math.PI / 2 - 0.25], ex: [0.4, 0.3, 0], name: 'Useful mechanical & electrical work (38%)' });
    part(brAsm, cyl(0.36, 1.5, 20), { pal: 'red', tone: 'hi', pos: [0, -0.38, 0], rot: [0, 0, Math.PI / 2 + 0.28], ex: [0.4, -0.3, 0], name: 'Ambient waste heat (62%)' });
    label('board', 'Useful work (38%)', () => V(43.2, 1.85, 0));
    label('board', 'Rejected heat (62%)', () => V(43.2, 0.35, 0));

    return {
      labels,
      update(s) {
        // Station 0: Clay dent depth scales as v^2 relative to v0 = 2 m/s (d0 = 1.0 cm)
        const hDent2 = Math.min(0.80, Math.max(0.04, 0.16 * (s.dent.depthCm / 1.0)));
        dentPlug2.scale.y = hDent2;
        dentPlug2.position.y = 0.425 - hDent2 * 0.5;
        testSphere.position.y = 0.425 - hDent2 + 0.18;

        // Station 1: Bounce peak columns, bouncing ball & thermal rings
        const heights = [s.bounce.h0, s.bounce.h1, s.bounce.h2, s.bounce.h3];
        for (let k = 0; k < 4; k++) {
          const hCol = Math.max(0.08, heights[k] * 1.1);
          peakColumns[k].scale.y = hCol;
          peakColumns[k].position.y = hCol * 0.5;
        }
        const uBounce = (s.t * 0.45) % 3;
        const seg = Math.min(2, Math.floor(uBounce));
        const fSeg = uBounce - seg;
        const xStart = -1.4 + seg * 0.95;
        const xImpact = xStart + 0.475;
        const xEnd = xStart + 0.95;
        const hStart = heights[seg] * 1.1;
        const hEnd = heights[seg + 1] * 1.1;
        let bx, by;
        if (fSeg < 0.5) {
          const uFall = fSeg * 2;
          bx = xStart + uFall * (xImpact - xStart);
          by = hStart * (1 - uFall * uFall) + 0.13;
        } else {
          const uRise = (fSeg - 0.5) * 2;
          bx = xImpact + uRise * (xEnd - xImpact);
          by = hEnd * (1 - (1 - uRise) * (1 - uRise)) + 0.13;
        }
        bounceBall.position.set(bx, by, 0.22);
        const heatScale = 0.6 + s.bounce.thermalFractionFirstBounce * 0.9;
        for (const hr of heatRings) hr.scale.setScalar(heatScale);

        // Station 2: Spin kWh disc + index mark at angular velocity proportional to powerWatts
        rotorGroup.rotation.y = s.t * (s.powerWatts / 400);
      },
    };
  },
};
