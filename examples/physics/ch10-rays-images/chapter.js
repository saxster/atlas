import { SUBJECT } from '../subject.js';
import {
  THREE, part, box, cyl, sphere, torus, cone, lines, arrow, setArrow, rod,
  prims, shadeMat, studioGrid, playTone, V
} from '@saxster/atlas/phys_kit.js';
import * as M from './model.js';

export const PAGES = [
  {
    tab: 'How we see',
    fig: 'Figure 10.1 · Luminous source scattering off a non-luminous page into the observer’s eye',
    title: 'How We See Non-Luminous Objects',
    alt: '3D overhead lamp emitting incident rays onto a rough textbook page that scatters diffuse rays in all directions, with a bundle entering the observer’s pupil.',
    cam: { target: [0, 1.35, 0], az: 22, el: 20, dist: 7.2 },
    lit: 'book_surface',
    parts: ['lamp_source', 'book_surface'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Pinhole camera',
    fig: 'Figure 10.2 · Pinhole camera ray-crossing geometry: sharpness vs brightness trade-off',
    title: 'Pinhole Camera: Inverted Rays & Blur Circles',
    alt: '3D cutaway pinhole camera box with a glowing candle flame in front; straight light rays cross through the pinhole to paint an inverted image on the translucent back screen.',
    cam: { target: [14, 1.3, 0], az: 24, el: 20, dist: 7.4 },
    lit: 'camera_box',
    parts: ['candle_object', 'camera_box'],
    look: { xray: 0.25, section: 0 },
  },
  {
    tab: 'Rømer’s Io clock',
    fig: 'Figure 10.6 · Rømer’s 1676 measurement of light speed using Jupiter’s moon Io',
    title: 'Rømer’s Jupiter–Io Eclipse Light Clock',
    alt: '3D heliocentric model showing Earth orbiting between near opposition and far conjunction while Jupiter’s moon Io ducks in and out of Jupiter’s shadow cone.',
    cam: { target: [28, 1.25, 0], az: 20, el: 28, dist: 7.6 },
    lit: 'jupiter_io',
    parts: ['earth_orbit_clock', 'jupiter_io'],
    look: { xray: 0, section: 0 },
  },
];

export const PLATES = {
  lamp_source: {
    text: 'Luminous source: emits its own electromagnetic waves. Eyes never send out "viewing rays" — vision happens only when light enters the pupil.',
  },
  book_surface: {
    text: 'Diffuse reflection from paper fibres: microscopic bumps tilt the local normal in every direction, obeying θ_i = θ_r locally while scattering rays to every seat in the room.',
  },
  candle_object: {
    text: 'Candle flame at object distance d_o: rays from the flame tip travel in straight lines downward through the pinhole; rays from the base travel upward.',
    facts: s => [['Magnification M', `${s.pin.mag.toFixed(2)}×`], ['Image h_i', `${s.pin.imageHeightMm.toFixed(1)} mm (inverted)`]],
  },
  camera_box: {
    text: 'Aperture size trade-off: a tiny pinhole passes one thin ray cone per point (sharp but dim); widening the hole lets in more light (∝ d²) but overlaps cones into blur circles.',
    facts: s => [['Pinhole d', `${s.pinholeMm.toFixed(1)} mm`], ['Blur circle', `${s.pin.blurCircleMm.toFixed(2)} mm`], ['Brightness', `${s.pin.relativeBrightness.toFixed(1)}×`]],
  },
  earth_orbit_clock: {
    text: 'Earth’s 2 AU orbital diameter (3.0 × 10⁸ km): as Earth moves from closest approach (opposition) to farthest point (conjunction), light from Io must cross the extra diameter.',
    facts: s => [['Extra path', `${s.rom.extraDistanceAu.toFixed(2)} AU`], ['Light delay Δt', `${s.rom.delayMin.toFixed(1)} min (${s.rom.delaySec.toFixed(0)} s)`]],
  },
  jupiter_io: {
    text: 'Io’s 42.5-hour orbital clock around Jupiter: eclipses never actually slow down — the 16.6-minute lag is the finite travel time of light across Earth’s orbit (c ≈ 300,000 km/s)!',
  },
};

export const CHAPTER = {
  subject: SUBJECT,
  no: 10,
  PAGES,
  PLATES,
  clock0: 0,
  cuts: true,
  xrayKeys: ['camera_box'],
  cutKeys: ['camera_box'],
  cutPlane: [0, 0, -1, 0.05],
  defaultParams: { pinholeMm: 1.5, boxDepthMm: 180, earthAngleDeg: 180 },
  controls: [
    { id: 'pinholeMm', label: 'Pinhole aperture diameter d', min: 0.5, max: 5.0, step: 0.5, value: 1.5, unit: 'mm' },
    { id: 'boxDepthMm', label: 'Camera box depth d_i', min: 80, max: 280, step: 10, value: 180, unit: 'mm' },
    { id: 'earthAngleDeg', label: 'Earth orbital angle (0° near → 180° far)', min: 0, max: 180, step: 10, value: 180, unit: '°' },
  ],
  lessons: {
    'ch10-seeing-3d': { page: 0 },
    'ch10-pinhole-3d': { page: 1, params: { pinholeMm: 1.5, boxDepthMm: 180 } },
    'ch10-romer-3d': { page: 2, params: { earthAngleDeg: 180 } },
  },
  sensor: {
    type: 'light',
    label: 'Use camera light to size aperture',
    apply(v) {
      return { pinholeMm: +(0.5 + (1 - v) * 4.5).toFixed(1) };
    },
  },
  sonify(ctx, s, page) {
    if (page === 1) playTone(ctx, { freq: 480 - s.pin.blurCircleMm * 35, dur: 0.06, type: 'sine', gain: 0.03 });
    else if (page === 2) playTone(ctx, { freq: 520 - s.rom.delayMin * 14, dur: 0.07, type: 'triangle', gain: 0.03 });
    else playTone(ctx, { freq: 360, dur: 0.05, type: 'sine', gain: 0.025 });
  },
  state(clock, reduced) {
    const p = CHAPTER.params || CHAPTER.defaultParams;
    const t = reduced ? 1.0 : clock;
    const pin = M.pinholeOptics(120, 360, p.boxDepthMm, p.pinholeMm);
    const rom = M.romerEclipseDelay(p.earthAngleDeg);
    return { t, pinholeMm: p.pinholeMm, boxDepthMm: p.boxDepthMm, pin, earthAngleDeg: p.earthAngleDeg, rom };
  },
  readout(s, page, pageIdx) {
    if (pageIdx === 0) {
      return `<b>Vision by Scattered Light</b> · Luminous lamp rays strike rough paper fibres and scatter diffusely in all directions; a cone of scattered rays enters the eye.`;
    }
    if (pageIdx === 1) {
      return `<b>Pinhole d = ${s.pinholeMm.toFixed(1)} mm, Box depth d_i = ${s.boxDepthMm} mm</b> · Magnification <b>M = ${s.pin.mag.toFixed(2)}×</b> · Blur circle = <b>${s.pin.blurCircleMm.toFixed(2)} mm</b> · Brightness = <b>${s.pin.relativeBrightness.toFixed(1)}×</b>.`;
    }
    return `<b>Rømer’s Io Clock (Earth angle = ${s.earthAngleDeg}°)</b> · Extra light path = <b>${s.rom.extraDistanceAu.toFixed(2)} AU</b> → Eclipse arrives <b>${s.rom.delayMin.toFixed(1)} minutes late</b> (c ≈ 3.0 × 10⁸ m/s).`;
  },
  buildWorld(E) {
    const { scene, asm } = E;
    const root = new THREE.Group();
    scene.add(root);
    studioGrid(root, { x0: -4, x1: 35 });
    const labels = [];
    const label = (cls, html, at, opts = {}) => labels.push({ cls, html, at, ...opts });

    // Station 0 (x = 0): Lamp -> Book -> Eye
    const lampAsm = asm('lamp_source', root, { title: 'Luminous desk lamp', sub: 'Emits incident light rays' });
    lampAsm.position.set(-1.1, 1.95, 0);
    part(lampAsm, cone(0.28, 0.35, 18), { pal: 'ochre', tone: 'hi', pos: [0, 0, 0], ex: [0, 0.35, 0], name: 'Lamp shade' });
    part(lampAsm, sphere(0.14, 16), { pal: 'red', tone: 'lit', pos: [0, -0.15, 0], name: 'Glowing bulb' });
    const incRay = rod(root, { r: 0.018, pal: 'ochre', tone: 'hi', name: 'Incident light ray' });
    incRay.set(V(-1.1, 1.8, 0), V(0, 0.55, 0));

    const bookAsm = asm('book_surface', root, { title: 'Diffuse paper page & observer eye', sub: 'Scatters rays in all directions' });
    bookAsm.position.set(0, 0.5, 0);
    part(bookAsm, box(1.1, 0.08, 0.85, 0.02), { pal: 'paper', tone: 'lit', pos: [0, 0, 0], ex: [0, -0.25, 0], name: 'Open textbook page' });
    part(bookAsm, sphere(0.22, 20), { pal: 'blue', tone: 'hi', pos: [1.25, 1.25, 0], ex: [0.35, 0.35, 0], name: 'Observer eye' });
    for (let k = -2; k <= 2; k++) {
      const sRay = rod(bookAsm, { r: 0.014, pal: k === 1 ? 'green' : 'blue', tone: 'hi', name: 'Scattered ray' });
      sRay.set(V(0, 0.05, 0), k === 1 ? V(1.2, 1.2, 0) : V(0.75 * Math.sin(k * 0.5), 0.95, 0.4 * k));
    }
    label('board', 'Diffuse scattering into eye', () => V(0.8, 1.95, 0), { leader: [0, -20] });

    // Station 1 (x = 14): Pinhole Camera Box
    const candAsm = asm('candle_object', root, { title: 'Luminous candle object', sub: 'Top & bottom rays cross at pinhole' });
    candAsm.position.set(12.3, 0.65, 0);
    part(candAsm, cyl(0.12, 0.75, 16), { pal: 'paper', tone: 'lit', pos: [0, 0, 0], ex: [-0.35, 0, 0], name: 'Wax candle' });
    part(candAsm, cone(0.13, 0.36, 16), { pal: 'ochre', tone: 'hi', pos: [0, 0.55, 0], ex: [-0.35, 0.3, 0], name: 'Candle flame tip' });

    const boxAsm = asm('camera_box', root, { title: 'Pinhole camera enclosure & screen', sub: 'M = d_i / d_o (inverted image)' });
    boxAsm.position.set(14.5, 1.0, 0);
    const camHousing = part(boxAsm, box(1.8, 1.35, 1.2, 0.04), { pal: 'dark', tone: 'mid', pos: [0, 0, 0], mat: shadeMat('dark', { opacity: 0.4 }), name: 'Light-tight box' });
    const holeRing = part(boxAsm, torus(0.12, 0.03, 10, 24), { pal: 'ochre', tone: 'hi', pos: [-0.9, 0, 0], rot: [0, Math.PI / 2, 0], ex: [-0.45, 0, 0], name: 'Pinhole aperture' });
    const invFlame = part(boxAsm, cone(0.12, 0.32, 16), { pal: 'red', tone: 'hi', pos: [0.85, -0.22, 0], rot: [0, 0, Math.PI], ex: [0.45, 0, 0], name: 'Inverted flame image' });
    const rayTop = rod(root, { r: 0.016, pal: 'ochre', tone: 'hi', name: 'Top-to-bottom crossing ray' });
    const rayBot = rod(root, { r: 0.016, pal: 'red', tone: 'hi', name: 'Bottom-to-top crossing ray' });
    label('board', 'Rays cross → Inverted image', () => V(14.5, 1.95, 0), { leader: [0, -20] });

    // Station 2 (x = 28): Romer's Jupiter-Io Light Clock
    const earthOrb = asm('earth_orbit_clock', root, { title: 'Sun & Earth 1 AU orbit', sub: '2 AU diameter adds 16.6 min light time' });
    earthOrb.position.set(27.0, 0.85, 0);
    part(earthOrb, sphere(0.26, 20), { pal: 'ochre', tone: 'hi', pos: [0, 0, 0], name: 'Sun' });
    part(earthOrb, torus(0.85, 0.02, 10, 40), { pal: 'paper', tone: 'mid', rot: [Math.PI / 2, 0, 0], name: 'Earth 1 AU orbit' });
    const earthBall = part(earthOrb, sphere(0.13, 18), { pal: 'blue', tone: 'hi', pos: [0.85, 0, 0], ex: [0, 0.4, 0], name: 'Earth observer' });

    const jupAsm = asm('jupiter_io', root, { title: 'Jupiter & eclipsing moon Io', sub: '42.5 h regular orbital clock' });
    jupAsm.position.set(29.5, 0.85, 0);
    part(jupAsm, sphere(0.32, 22), { pal: 'ochre', tone: 'mid', pos: [0, 0, 0], ex: [0, 0.35, 0], name: 'Jupiter' });
    part(jupAsm, torus(0.58, 0.018, 10, 32), { pal: 'paper', tone: 'mid', rot: [Math.PI / 2, 0, 0], name: 'Io orbit' });
    const ioBall = part(jupAsm, sphere(0.08, 14), { pal: 'red', tone: 'hi', pos: [0.58, 0, 0], ex: [0, 0.5, 0], name: 'Moon Io' });
    const lightPulseRay = rod(root, { r: 0.018, pal: 'green', tone: 'hi', name: 'Light path from Io to Earth' });
    label('board', '16.6 min extra light travel across 2 AU', () => V(28.2, 1.75, 0), { leader: [0, -20] });

    return {
      labels,
      update(s) {
        // Station 1: Pinhole box depth & aperture size
        const dScale = s.boxDepthMm / 180;
        camHousing.scale.x = dScale;
        holeRing.position.x = -0.9 * dScale;
        holeRing.scale.setScalar(0.6 + (s.pinholeMm / 5.0) * 1.4);
        invFlame.position.x = 0.85 * dScale;
        invFlame.scale.setScalar(0.6 + dScale * 0.6);
        const holeWorldX = 14.5 - 0.9 * dScale;
        const screenWorldX = 14.5 + 0.85 * dScale;
        rayTop.set(V(12.3, 1.35, 0), V(screenWorldX, 1.0 - 0.32 * dScale, 0));
        rayBot.set(V(12.3, 0.65, 0), V(screenWorldX, 1.0 + 0.32 * dScale, 0));
        void holeWorldX;

        // Station 2: Earth orbital position & Io eclipse light line
        const eRad = (s.earthAngleDeg * Math.PI) / 180;
        const ex = 0.85 * Math.cos(eRad), ez = 0.85 * Math.sin(eRad);
        earthBall.position.set(ex, 0, ez);
        const ioAng = s.t * 2.4;
        const ix = 0.58 * Math.cos(ioAng), iz = 0.58 * Math.sin(ioAng);
        ioBall.position.set(ix, 0, iz);
        lightPulseRay.set(V(27.0 + ex, 0.85, ez), V(29.5 + ix, 0.85, iz));
      },
    };
  },
};
