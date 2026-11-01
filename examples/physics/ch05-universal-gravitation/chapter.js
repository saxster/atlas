import { SUBJECT } from '../subject.js';
import {
  THREE, part, box, cyl, sphere, torus, cone, lines, arrow, setArrow, rod,
  prims, shadeMat, studioGrid, playTone, V
} from '@saxster/atlas/phys_kit.js';
import * as M from './model.js';

export const PAGES = [
  {
    tab: 'Moon 1.4 mm drop',
    fig: 'Figure 5.1 · Newton’s Moon test: falling 1.4 mm every second beneath its straight-line tangent',
    title: 'Newton’s Apple & the 1.4 mm Moon Fall',
    alt: '3D Earth-Moon orbital chord showing the straight inertial tangent path and the 1.4 mm per-second gravitational drop toward Earth (1/3600 of an apple’s 4.9 m drop).',
    cam: { target: [0, 1.3, 0], az: 20, el: 24, dist: 7.4 },
    lit: 'moon_tangent',
    parts: ['earth_well', 'moon_tangent'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Two-pin ellipse',
    fig: 'Figure 5.4 · Drawing an ellipse with two focal pins and a taut loop of string (r₁ + r₂ = 2a)',
    title: 'Two-Focus String Ellipse Constructor',
    alt: '3D drawing board with two brass focal pins F₁ and F₂, a taut red string triangle to a moving stylus, and the traced elliptical orbit.',
    cam: { target: [14, 1.2, 0], az: 18, el: 28, dist: 7.2 },
    lit: 'string_triangle',
    parts: ['focal_board', 'string_triangle'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Cavendish balance',
    fig: 'Figure 5.5 · Cavendish’s 1798 torsion fibre balance & optical mirror beam weighing the Earth',
    title: 'Cavendish Torsion Balance (Measuring G)',
    alt: '3D cutaway draft-shielded case containing two massive stationary lead spheres attracting two small dumb-bell spheres on a quartz torsion fibre with an optical lever mirror beam.',
    cam: { target: [28, 1.35, 0], az: 24, el: 20, dist: 7.4 },
    lit: 'torsion_dumbell',
    parts: ['lead_masses', 'torsion_dumbell'],
    look: { xray: 0.2, section: 0 },
  },
  {
    tab: 'Kepler equal areas',
    fig: 'Figure 5.6 · Comet sweeping equal areas in equal times (fast at perihelion, slow at aphelion)',
    title: 'Kepler’s Second Law: Equal Areas in Equal Times',
    alt: '3D elliptical comet orbit around the Sun at focus F₁ with a short wide perihelion sector and a long narrow aphelion sector of identical area.',
    cam: { target: [42, 1.25, 0], az: 20, el: 28, dist: 7.4 },
    lit: 'comet_orbiter',
    parts: ['area_wedges', 'comet_orbiter'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Chandrayaan-3',
    fig: 'Figure 5.7 · Chandrayaan-3 apogee-raising perigee burns & lunar orbit capture',
    title: 'Chandrayaan-3 Earth-to-Moon Transfer',
    alt: '3D nested elliptical Earth transfer orbits climbing via perigee prograde burns to intersect the Moon’s orbit for retro-burn lunar capture.',
    cam: { target: [56, 1.3, 0], az: 24, el: 26, dist: 7.8 },
    lit: 'transfer_loops',
    parts: ['transfer_loops', 'lunar_capture'],
    look: { xray: 0.15, section: 0 },
  },
];

export const PLATES = {
  earth_well: {
    text: 'Earth at 60 R_Earth distance from the Moon: inverse-square gravity dilutes surface g = 9.80 m/s² by 60² = 3,600× down to 0.00272 m/s².',
  },
  moon_tangent: {
    text: 'Without gravity the Moon would coast along the straight green tangent line; instead it falls 1.36 mm toward Earth every second, bending continuously into a circle.',
    facts: s => [['Apple 1s drop', `${s.mn.appleFall1sM.toFixed(2)} m`], ['Moon 1s drop', `${s.mn.moonFall1sMm.toFixed(2)} mm`], ['Dilution', `${s.mn.dilutionFactor.toFixed(0)}×`]],
  },
  focal_board: {
    text: 'Two focal pins F₁ and F₂ separated by 2c = 2ae: when eccentricity e = 0, both pins merge at the center and the ellipse becomes a circle.',
  },
  string_triangle: {
    text: 'Taut string of length r₁ + r₂ = 2a: Kepler discovered that planets orbit with the Sun at one focus (F₁) while the second focus (F₂) sits empty in space.',
    facts: s => [['Eccentricity e', `${s.eccentricity.toFixed(2)}`], ['r_peri / r_apo', `${s.el.rPeri.toFixed(2)} / ${s.el.rApo.toFixed(2)}`]],
  },
  lead_masses: {
    text: 'Stationary 158 kg lead spheres: swivelled next to the small spheres to exert a tiny gravitational pull F ≈ 1.5 × 10⁻⁷ N (the weight of a grain of sand!).',
  },
  torsion_dumbell: {
    text: 'Suspended dumb-bell & mirror on a fine torsion wire: twists by angle θ until wire torque κθ balances 2FL, deflecting a reflected light beam across a distant scale.',
    facts: s => [['F_grav', `${(s.cav.forceN * 1e7).toFixed(2)} × 10⁻⁷ N`], ['Spot shift', `${s.cav.lightSpotShiftMm.toFixed(1)} mm`]],
  },
  area_wedges: {
    text: 'Equal-area orbital sectors: a short fat wedge near perihelion has the exact same area as a long skinny wedge near aphelion (dA/dt = L / 2m = constant).',
  },
  comet_orbiter: {
    text: 'Comet on an eccentric orbit: speeds up as it falls toward the Sun and slows down as it climbs toward aphelion, with v_peri / v_apo = (1 + e) / (1 − e).',
    facts: s => [['v_peri / v_apo', `${s.el.speedRatioPeriToApo.toFixed(2)}×`]],
  },
  transfer_loops: {
    text: 'Oberth perigee burns: firing thrusters briefly at the lowest point (perigee) of each Earth loop pumps kinetic energy efficiently to raise apogee step by step.',
  },
  lunar_capture: {
    text: 'Lunar Orbit Insertion (LOI): at the Moon’s sphere of influence, Chandrayaan-3 turns and fires backward (retro-burn) to drop into lunar capture.',
  },
};

export const CHAPTER = {
  subject: SUBJECT,
  no: 5,
  PAGES,
  PLATES,
  clock0: 0,
  cuts: true,
  xrayKeys: ['lead_masses', 'transfer_loops'],
  cutKeys: ['lead_masses'],
  cutPlane: [0, 0, -1, 0.05],
  defaultParams: { moonRadii: 60, eccentricity: 0.55, cavLeadKg: 158 },
  controls: [
    { id: 'moonRadii', label: 'Orbit distance (in Earth radii R_E)', min: 10, max: 70, step: 2, value: 60, unit: 'R_E' },
    { id: 'eccentricity', label: 'Orbital eccentricity e', min: 0.0, max: 0.85, step: 0.05, value: 0.55, unit: '' },
    { id: 'cavLeadKg', label: 'Cavendish big lead sphere mass M', min: 50, max: 250, step: 10, value: 158, unit: 'kg' },
  ],
  lessons: {
    'ch05-moon-drop-3d': { page: 0, params: { moonRadii: 60 } },
    'ch05-ellipse-3d': { page: 1, params: { eccentricity: 0.55 } },
    'ch05-cavendish-3d': { page: 2, params: { cavLeadKg: 158 } },
    'ch05-kepler-area-3d': { page: 3, params: { eccentricity: 0.65 } },
    'ch05-chandrayaan-3d': { page: 4 },
  },
  sonify(ctx, s, page) {
    if (page === 2) playTone(ctx, { freq: 200 + s.cav.lightSpotShiftMm * 14, dur: 0.07, type: 'sine', gain: 0.03 });
    else if (page === 3) playTone(ctx, { freq: 180 + s.el.speedRatioPeriToApo * 55, dur: 0.07, type: 'triangle', gain: 0.03 });
    else playTone(ctx, { freq: 280, dur: 0.05, type: 'sine', gain: 0.025 });
  },
  state(clock, reduced) {
    const p = CHAPTER.params || CHAPTER.defaultParams;
    const t = reduced ? 1.1 : clock;
    const mn = M.moonDropComparison(p.moonRadii);
    const el = M.ellipseGeometry(1.6, p.eccentricity);
    const cav = M.cavendishTorque(0.73, p.cavLeadKg, 0.23, 0.9, 1.4e-7);
    return { t, moonRadii: p.moonRadii, mn, eccentricity: p.eccentricity, el, cavLeadKg: p.cavLeadKg, cav };
  },
  readout(s, page, pageIdx) {
    if (pageIdx === 0) {
      return `<b>Distance r = ${s.moonRadii} R_Earth</b> → Gravity diluted by <b>${s.mn.dilutionFactor.toFixed(0)}×</b> · Apple falls 4.90 m in 1 s; Moon falls <b>${s.mn.moonFall1sMm.toFixed(2)} mm</b> in 1 s beneath its straight tangent.`;
    }
    if (pageIdx === 1) {
      return `<b>Ellipse eccentricity e = ${s.eccentricity.toFixed(2)}</b> · Foci offset c = ae = ${s.el.cFocus.toFixed(2)} · String sum <b>r₁ + r₂ = 2a = ${(2 * s.el.semiMajorA).toFixed(2)}</b> is invariant around the loop.`;
    }
    if (pageIdx === 2) {
      return `<b>Cavendish Torsion Balance (M = ${s.cavLeadKg} kg)</b> · Gravitational pull <b>F = ${(s.cav.forceN * 1e7).toFixed(2)} × 10⁻⁷ N</b> · Reflected mirror beam shifts <b>${s.cav.lightSpotShiftMm.toFixed(1)} mm</b>.`;
    }
    if (pageIdx === 3) {
      return `<b>Kepler’s 2nd Law (e = ${s.eccentricity.toFixed(2)})</b> · Equal areas swept in equal times · Perihelion speed is <b>${s.el.speedRatioPeriToApo.toFixed(2)}×</b> faster than aphelion speed.`;
    }
    return `<b>Chandrayaan-3 Transfer Trajectory</b> · 5 Earth-bound perigee burns raise apogee to lunar distance, followed by retro-burn capture at the Moon.`;
  },
  buildWorld(E) {
    const { scene, asm } = E;
    const root = new THREE.Group();
    scene.add(root);
    studioGrid(root, { x0: -4, x1: 62 });
    const labels = [];
    const label = (cls, html, at, opts = {}) => labels.push({ cls, html, at, ...opts });

    // Station 0 (x = 0): Newton's Moon 1.4 mm Drop vs Tangent
    const earthAsm = asm('earth_well', root, { title: 'Central Earth sphere', sub: 'Inverse-square gravity g / (r/R_E)²' });
    earthAsm.position.set(0, 0.9, 0);
    part(earthAsm, sphere(0.42, 24), { pal: 'blue', tone: 'hi', pos: [0, 0, 0], ex: [0, -0.35, 0], name: 'Earth' });
    part(earthAsm, torus(1.65, 0.022, 10, 48), { pal: 'paper', tone: 'mid', rot: [Math.PI / 2, 0, 0], name: 'Lunar orbit circle' });

    const moonAsm = asm('moon_tangent', root, { title: 'Moon tangent & 1.4 mm drop', sub: 'Falls toward Earth every second' });
    moonAsm.position.set(0, 0.9, 0);
    const moonSphere = part(moonAsm, sphere(0.15, 18), { pal: 'ochre', tone: 'hi', pos: [1.65, 0, 0], ex: [0, 0.4, 0], name: 'Orbiting Moon' });
    const tangVec = arrow(moonAsm, { pal: 'green', r: 0.026 });
    const dropVec = arrow(moonAsm, { pal: 'red', r: 0.028 });
    label('board', 'Straight inertial tangent', () => V(1.65, 1.5, -0.8));
    label('board', '1.4 mm/s drop to Earth', () => V(1.1, 1.35, 0), { leader: [0, -20] });

    // Station 1 (x = 14): Two-Pin String Ellipse Constructor
    const boardAsm = asm('focal_board', root, { title: 'Two-focus drawing board', sub: 'Foci F₁ and F₂ at ±ae' });
    boardAsm.position.set(14, 0.25, 0);
    part(boardAsm, box(3.8, 0.12, 2.8, 0.03), { pal: 'paper', tone: 'mid', pos: [0, 0, 0], name: 'Drawing board' });
    const pin1 = part(boardAsm, cyl(0.055, 0.45, 14), { pal: 'ochre', tone: 'hi', pos: [-0.7, 0.25, 0], ex: [0, 0.4, 0], name: 'Focus pin F₁ (Sun)' });
    const pin2 = part(boardAsm, cyl(0.055, 0.45, 14), { pal: 'dark', tone: 'hi', pos: [0.7, 0.25, 0], ex: [0, 0.4, 0], name: 'Focus pin F₂ (empty)' });

    const strAsm = asm('string_triangle', root, { title: 'Taut string loop & stylus', sub: 'r₁ + r₂ = 2a = constant' });
    strAsm.position.set(14, 0.45, 0);
    const stylus = part(strAsm, cone(0.09, 0.38, 16), { pal: 'red', tone: 'hi', pos: [0, 0.2, 1.1], rot: [Math.PI, 0, 0], ex: [0, 0.5, 0], name: 'Moving pencil stylus' });
    const rope1 = rod(strAsm, { r: 0.018, pal: 'red', tone: 'hi', name: 'String segment r₁' });
    const rope2 = rod(strAsm, { r: 0.018, pal: 'red', tone: 'hi', name: 'String segment r₂' });
    const ellRing = part(strAsm, torus(1.6, 0.025, 10, 48), { pal: 'blue', tone: 'hi', rot: [Math.PI / 2, 0, 0], name: 'Traced ellipse' });
    label('board', 'r₁ + r₂ = 2a', () => V(14, 1.45, 0), { leader: [0, -20] });

    // Station 2 (x = 28): Cavendish Torsion Balance
    const leadAsm = asm('lead_masses', root, { title: 'Stationary 158 kg lead spheres', sub: 'Attract small dumb-bell masses' });
    leadAsm.position.set(28, 0.9, 0);
    const bigL = part(leadAsm, sphere(0.38, 24), { pal: 'dark', tone: 'hi', pos: [-1.05, 0, 0.42], mat: shadeMat('dark', { opacity: 0.75 }), ex: [-0.35, 0, 0.35], name: 'Large lead sphere L₁' });
    const bigR = part(leadAsm, sphere(0.38, 24), { pal: 'dark', tone: 'hi', pos: [1.05, 0, -0.42], mat: shadeMat('dark', { opacity: 0.75 }), ex: [0.35, 0, -0.35], name: 'Large lead sphere L₂' });

    const dumbAsm = asm('torsion_dumbell', root, { title: 'Quartz torsion fibre & mirror rod', sub: 'Twists under ~10⁻⁷ N attraction' });
    dumbAsm.position.set(28, 0.9, 0);
    part(dumbAsm, cyl(0.015, 1.35, 10), { pal: 'ochre', tone: 'hi', pos: [0, 0.68, 0], ex: [0, 0.5, 0], name: 'Torsion suspension wire' });
    part(dumbAsm, cyl(0.028, 2.1, 14), { pal: 'ochre', tone: 'hi', pos: [0, 0, 0], rot: [0, 0, Math.PI / 2], ex: [0, 0.25, 0], name: 'Suspended balance beam' });
    part(dumbAsm, sphere(0.14, 18), { pal: 'red', tone: 'hi', pos: [-1.05, 0, 0], ex: [-0.3, 0.3, 0], name: 'Small gold/lead ball m₁' });
    part(dumbAsm, sphere(0.14, 18), { pal: 'red', tone: 'hi', pos: [1.05, 0, 0], ex: [0.3, 0.3, 0], name: 'Small gold/lead ball m₂' });
    const laserRay = rod(root, { r: 0.016, pal: 'green', tone: 'hi', name: 'Optical lever mirror beam' });
    label('board', 'Optical lever mirror beam', () => V(28, 2.35, 0), { leader: [0, -20] });

    // Station 3 (x = 42): Kepler's Second Law Equal Areas
    const wedgeAsm = asm('area_wedges', root, { title: 'Equal-area perihelion & aphelion sectors', sub: 'dA/dt = L / (2m) = constant' });
    wedgeAsm.position.set(42, 0.85, 0);
    const kepRing = part(wedgeAsm, torus(1.6, 0.024, 10, 48), { pal: 'paper', tone: 'mid', rot: [Math.PI / 2, 0, 0], name: 'Comet ellipse' });
    const sunKep = part(wedgeAsm, sphere(0.24, 20), { pal: 'ochre', tone: 'hi', pos: [-0.8, 0, 0], ex: [0, 0.35, 0], name: 'Sun at focus F₁' });
    part(wedgeAsm, box(0.65, 0.04, 0.9, 0.01), { pal: 'red', tone: 'mid', pos: [-1.15, -0.02, 0], ex: [-0.3, 0.25, 0], name: 'Wide perihelion sector ΔA₁' });
    part(wedgeAsm, box(1.45, 0.04, 0.4, 0.01), { pal: 'blue', tone: 'mid', pos: [0.7, -0.02, 0], ex: [0.3, 0.25, 0], name: 'Long aphelion sector ΔA₂' });

    const cometAsm = asm('comet_orbiter', root, { title: 'Orbiting comet & velocity vector', sub: 'Fast near Sun, slow far out' });
    cometAsm.position.set(42, 0.85, 0);
    const cometBall = part(cometAsm, sphere(0.11, 16), { pal: 'green', tone: 'hi', pos: [1.0, 0, 0], ex: [0, 0.45, 0], name: 'Comet nucleus' });
    const vComet = arrow(cometAsm, { pal: 'green', r: 0.028 });
    label('board', 'Equal areas ΔA₁ = ΔA₂', () => V(42, 1.75, 0), { leader: [0, -20] });

    // Station 4 (x = 56): Chandrayaan-3 Transfer Loops
    const transAsm = asm('transfer_loops', root, { title: 'Earth-bound apogee-raising ellipses', sub: 'Perigee prograde burns' });
    transAsm.position.set(55.4, 0.9, 0);
    part(transAsm, sphere(0.28, 20), { pal: 'blue', tone: 'hi', pos: [-0.5, 0, 0], name: 'Earth' });
    for (let k = 1; k <= 3; k++) {
      const rx = 0.55 + k * 0.42;
      const gLoop = part(transAsm, torus(rx, 0.02, 10, 44), { pal: 'ochre', tone: 'hi', pos: [-0.5 + (rx - 0.45), 0, 0], rot: [Math.PI / 2, 0, 0], ex: [0, k * 0.18, 0], name: `Earth transfer orbit ${k}` });
      gLoop.scale.y = 0.68;
    }

    const lunarAsm = asm('lunar_capture', root, { title: 'Lunar capture orbit & Vikram lander', sub: 'Retro-burn at perilune' });
    lunarAsm.position.set(57.5, 0.9, 0);
    part(lunarAsm, sphere(0.18, 18), { pal: 'paper', tone: 'lit', pos: [0, 0, 0], ex: [0, 0.3, 0], name: 'Moon' });
    part(lunarAsm, torus(0.45, 0.022, 10, 36), { pal: 'green', tone: 'hi', rot: [Math.PI / 2, 0, 0], ex: [0, 0.45, 0], name: 'Lunar capture orbit' });
    const craft = part(lunarAsm, box(0.14, 0.14, 0.14, 0.02), { pal: 'red', tone: 'hi', pos: [0.45, 0, 0], ex: [0, 0.6, 0], name: 'Chandrayaan-3 spacecraft' });
    label('board', 'Perigee burns → Lunar capture', () => V(56.2, 1.8, 0), { leader: [0, -20] });

    return {
      labels,
      update(s) {
        // Station 0: Moon orbit & tangent/drop vectors
        const angM = s.t * 0.6;
        const mx = 1.65 * Math.cos(angM), mz = 1.65 * Math.sin(angM);
        moonSphere.position.set(mx, 0, mz);
        setArrow(tangVec, V(mx, 0, mz), V(mx - Math.sin(angM) * 0.95, 0, mz + Math.cos(angM) * 0.95));
        setArrow(dropVec, V(mx - Math.sin(angM) * 0.95, 0, mz + Math.cos(angM) * 0.95), V(mx * 0.72, 0, mz * 0.72));

        // Station 1 & 3: Ellipse scaling with eccentricity
        const a = 1.6;
        const b = s.el.semiMinorB;
        const c = s.el.cFocus;
        pin1.position.x = -c;
        pin2.position.x = c;
        ellRing.scale.set(1, b / a, 1);
        const th = s.t * 0.9;
        const sx = a * Math.cos(th), sz = b * Math.sin(th);
        stylus.position.set(sx, 0.2, sz);
        rope1.set(V(-c, 0, 0), V(sx, 0, sz));
        rope2.set(V(c, 0, 0), V(sx, 0, sz));

        // Station 2: Cavendish twist & mirror laser ray
        const scLead = Math.cbrt(s.cavLeadKg / 158);
        bigL.scale.setScalar(scLead);
        bigR.scale.setScalar(scLead);
        const twist = Math.min(0.28, s.cav.twistRad * 18) * (0.65 + 0.35 * Math.sin(s.t * 1.5));
        dumbAsm.rotation.y = twist;
        laserRay.set(V(28, 1.15, 0), V(28 + Math.sin(2 * twist) * 1.8, 1.15, 1.5));

        // Station 3: Comet vis-viva speed modulation
        kepRing.scale.set(1, b / a, 1);
        sunKep.position.x = -c;
        const thK = s.t * 0.8 + s.eccentricity * Math.sin(s.t * 0.8);
        const cx = a * Math.cos(thK), cz = b * Math.sin(thK);
        cometBall.position.set(cx, 0, cz);
        const rDist = Math.hypot(cx + c, cz);
        const vScale = Math.min(1.2, 0.55 / Math.max(0.25, rDist));
        setArrow(vComet, V(cx, 0, cz), V(cx - Math.sin(thK) * vScale, 0, cz + Math.cos(thK) * vScale));

        // Station 4: Chandrayaan-3 orbiter
        craft.position.set(0.45 * Math.cos(s.t * 1.8), 0, 0.45 * Math.sin(s.t * 1.8));
      },
    };
  },
};
