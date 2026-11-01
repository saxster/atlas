import { SUBJECT } from '../subject.js';
import {
  THREE, part, box, cyl, sphere, torus, lines, arrow, setArrow, rod,
  prims, shadeMat, studioGrid, playTone, V
} from '@saxster/atlas/phys_kit.js';
import * as M from './model.js';

export const PAGES = [
  {
    tab: 'Spinning Earth boat',
    fig: 'Figure 14.1 · Why the sky appears to wheel East-to-West: the turning-boat horizon model',
    title: 'Spinning Earth & the Local Horizon Plane',
    alt: '3D rotating Earth globe carrying a tangent horizon platform and observer at 19° N (Mumbai), showing how West-to-East Earth rotation makes the stationary Sun appear to rise in the East and set in the West.',
    cam: { target: [0, 1.3, 0], az: 22, el: 22, dist: 7.4 },
    lit: 'horizon_deck',
    parts: ['spinning_globe', 'horizon_deck'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: '23.4° axial parallelism',
    fig: 'Figure 14.2 · Earth’s 23.4° spin axis stays parallel in space all year around the Sun',
    title: '23.4° Axial Parallelism & Seasonal Sun Angle',
    alt: '3D heliocentric orbit with four tilted Earth globes (June, September, December, March) whose North Pole axes all point parallel toward Polaris.',
    cam: { target: [14, 1.25, 0], az: 24, el: 26, dist: 7.8 },
    lit: 'tilted_earths',
    parts: ['central_sun', 'tilted_earths'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: '5.14° eclipse tilt',
    fig: 'Figure 14.5 · Why eclipses don’t happen every month: the 5.14° tilted lunar orbit & line of nodes',
    title: '5.14° Lunar Orbit Tilt & the Line of Nodes',
    alt: '3D ecliptic plane and a 5.14°-tilted lunar orbit hoop around Earth showing how the Moon usually passes above or below Earth’s shadow cone except at the two nodal crossings.',
    cam: { target: [28, 1.3, 0], az: 22, el: 22, dist: 7.4 },
    lit: 'lunar_hoop',
    parts: ['ecliptic_shadow', 'lunar_hoop'],
    look: { xray: 0.2, section: 0 },
  },
];

export const PLATES = {
  spinning_globe: {
    text: 'Earth spinning West-to-East at ω = 15° per hour: the Sun and distant stars are not racing around us every 24 hours — our planet is a giant turning deck.',
  },
  horizon_deck: {
    text: 'Local tangent horizon plane: as your horizon rotates eastward into the sunlight, the Sun appears to cross your eastern rim ("sunrise") and later dip below your western rim ("sunset").',
  },
  central_sun: {
    text: 'Sun near orbital center: Earth’s orbit is nearly circular (actually slightly closer to the Sun in January than July!), so distance does NOT cause seasons.',
  },
  tilted_earths: {
    text: 'Gyroscopic axial parallelism (23.4°): Earth’s spin axis points to the same stars all year. In June the Northern Hemisphere leans toward the Sun (steep rays, long days); in December it leans away.',
    facts: s => [['Declination δ', `${s.sol.decDeg >= 0 ? '+' : ''}${s.sol.decDeg.toFixed(1)}°`], ['Mumbai noon alt', `${s.sol.noonAltDeg.toFixed(1)}°`], ['Beam intensity', `${(s.sol.insolationFactor * 100).toFixed(0)}%`]],
  },
  ecliptic_shadow: {
    text: 'Ecliptic plane & Earth’s umbra shadow cone: stretches away from the Sun exactly in the Earth–Sun plane.',
  },
  lunar_hoop: {
    text: '5.14° tilted lunar orbit: at r = 60 R_Earth, a 5.14° tilt lifts the full Moon up to 5.4 Earth radii above or below the shadow cone! Eclipses happen ONLY when full/new Moon coincides with the Line of Nodes.',
    facts: s => [['Node offset', `${s.nodeOffsetDeg}°`], ['Vertical miss', `${s.ec.verticalMissEarthRadii.toFixed(2)} R_Earth`], ['Alignment', s.ec.eclipseOccurs ? 'ECLIPSE! (at node)' : 'No eclipse (misses shadow)']],
  },
};

export const CHAPTER = {
  subject: SUBJECT,
  no: 14,
  PAGES,
  PLATES,
  clock0: 0,
  cuts: true,
  xrayKeys: ['ecliptic_shadow'],
  cutKeys: ['ecliptic_shadow'],
  cutPlane: [0, 0, -1, 0.05],
  defaultParams: { axialTiltDeg: 23.4, orbitSeasonDeg: 90, nodeOffsetDeg: 0 },
  controls: [
    { id: 'axialTiltDeg', label: 'Earth axial tilt ε', min: 0, max: 35, step: 0.5, value: 23.4, unit: '°' },
    { id: 'orbitSeasonDeg', label: 'Orbital longitude (90° Jun → 270° Dec)', min: 0, max: 360, step: 15, value: 90, unit: '°' },
    { id: 'nodeOffsetDeg', label: 'Full Moon angle from Line of Nodes', min: 0, max: 90, step: 5, value: 0, unit: '°' },
  ],
  lessons: {
    'ch14-horizon-boat-3d': { page: 0 },
    'ch14-axial-tilt-3d': { page: 1, params: { axialTiltDeg: 23.4, orbitSeasonDeg: 90 } },
    'ch14-eclipse-nodes-3d': { page: 2, params: { nodeOffsetDeg: 0 } },
  },
  sensor: {
    type: 'tilt',
    label: 'Tilt device to vary axial obliquity',
    apply(v) {
      return { axialTiltDeg: +(v * 35).toFixed(1) };
    },
  },
  sonify(ctx, s, page) {
    if (page === 1) playTone(ctx, { freq: 200 + s.sol.noonAltDeg * 3.5, dur: 0.06, type: 'sine', gain: 0.03 });
    else if (page === 2) playTone(ctx, { freq: s.ec.eclipseOccurs ? 520 : 210, dur: 0.08, type: s.ec.eclipseOccurs ? 'triangle' : 'sine', gain: 0.035 });
    else playTone(ctx, { freq: 310, dur: 0.05, type: 'sine', gain: 0.025 });
  },
  state(clock, reduced) {
    const p = CHAPTER.params || CHAPTER.defaultParams;
    const t = reduced ? 1.0 : clock;
    const sol = M.solarNoonAltitude(19.07, p.axialTiltDeg, p.orbitSeasonDeg);
    const ec = M.lunarEclipseAlignment(p.nodeOffsetDeg, 5.14, 60);
    return { t, axialTiltDeg: p.axialTiltDeg, orbitSeasonDeg: p.orbitSeasonDeg, sol, nodeOffsetDeg: p.nodeOffsetDeg, ec };
  },
  readout(s, page, pageIdx) {
    if (pageIdx === 0) {
      return `<b>Diurnal Rotation (ω = 15°/hour West-to-East)</b> · As your tangent horizon deck turns eastward into the Sun’s rays, the Sun appears to rise in the East and set in the West.`;
    }
    if (pageIdx === 1) {
      return `<b>Axial Tilt ε = ${s.axialTiltDeg.toFixed(1)}° at orbital longitude ${s.orbitSeasonDeg}°</b> · Solar declination δ = <b>${s.sol.decDeg >= 0 ? '+' : ''}${s.sol.decDeg.toFixed(1)}°</b> · Mumbai (19.1° N) noon Sun altitude = <b>${s.sol.noonAltDeg.toFixed(1)}°</b> (${(s.sol.insolationFactor * 100).toFixed(0)}% flux).`;
    }
    const ecTxt = s.ec.eclipseOccurs ? '<b>ECLIPSE OCCURS!</b> (Moon passes through shadow cone)' : `<b>NO ECLIPSE</b> (Moon passes ${Math.abs(s.ec.verticalMissEarthRadii).toFixed(2)} R_Earth above/below shadow)`;
    return `<b>Full Moon ${s.nodeOffsetDeg}° from Line of Nodes (5.14° orbit tilt)</b> → ${ecTxt}.`;
  },
  buildWorld(E) {
    const { scene, asm } = E;
    const root = new THREE.Group();
    scene.add(root);
    studioGrid(root, { x0: -4, x1: 35 });
    const labels = [];
    const label = (cls, html, at, opts = {}) => labels.push({ cls, html, at, ...opts });

    // Station 0 (x = 0): Spinning Earth & Horizon Boat Deck
    const globeAsm = asm('spinning_globe', root, { title: 'Rotating Earth sphere', sub: 'Spins West-to-East (15°/h)' });
    globeAsm.position.set(0, 1.05, 0);
    const spinGroup = new THREE.Group();
    globeAsm.add(spinGroup);
    part(spinGroup, sphere(0.88, 28), { pal: 'blue', tone: 'hi', pos: [0, 0, 0], name: 'Earth globe' });
    part(spinGroup, cyl(0.03, 2.2, 12), { pal: 'dark', tone: 'hi', pos: [0, 0, 0], name: 'North–South spin axis' });

    const deckAsm = asm('horizon_deck', root, { title: 'Local tangent horizon boat', sub: 'Observer sees Sun sweep E → W' });
    deckAsm.position.set(0, 1.05, 0);
    const deckRot = new THREE.Group();
    deckAsm.add(deckRot);
    part(deckRot, box(0.65, 0.05, 0.65, 0.01), { pal: 'ochre', tone: 'hi', pos: [0.92, 0, 0], rot: [0, 0, Math.PI / 2], ex: [0.45, 0, 0], name: 'Local horizon plane' });
    part(deckRot, sphere(0.11, 16), { pal: 'red', tone: 'hi', pos: [1.05, 0, 0], ex: [0.6, 0, 0], name: 'Observer on horizon' });
    const sunBeam = arrow(root, { pal: 'ochre', r: 0.028 });
    setArrow(sunBeam, V(2.2, 1.05, 0), V(1.15, 1.05, 0));
    label('board', 'Earth spins E ← W; Sun appears E → W', () => V(0, 2.35, 0), { leader: [0, -20] });

    // Station 1 (x = 14): 23.4 deg Axial Parallelism Orbit
    const sunAsm = asm('central_sun', root, { title: 'Central Sun', sub: 'Illuminates tilted Earth all year' });
    sunAsm.position.set(14, 0.95, 0);
    part(sunAsm, sphere(0.36, 24), { pal: 'ochre', tone: 'hi', pos: [0, 0, 0], ex: [0, 0.35, 0], name: 'Sun' });
    part(sunAsm, torus(1.65, 0.022, 10, 48), { pal: 'paper', tone: 'mid', rot: [Math.PI / 2, 0, 0], name: 'Ecliptic orbit ring' });

    const earthsAsm = asm('tilted_earths', root, { title: 'Parallel-axis seasonal Earths', sub: 'Axis always points toward Polaris' });
    earthsAsm.position.set(14, 0.95, 0);
    const seasonGlobes = [];
    for (let k = 0; k < 4; k++) {
      const ang = (k * Math.PI) / 2;
      const g = new THREE.Group();
      g.position.set(1.65 * Math.cos(ang), 0, 1.65 * Math.sin(ang));
      earthsAsm.add(g);
      part(g, sphere(0.22, 20), { pal: 'blue', tone: 'hi', pos: [0, 0, 0], ex: [0, 0.35, 0], name: `Seasonal Earth ${k + 1}` });
      part(g, cyl(0.022, 0.72, 10), { pal: 'red', tone: 'hi', pos: [0, 0, 0], ex: [0, 0.55, 0], name: '23.4° spin axis' });
      seasonGlobes.push(g);
    }
    const activeEarth = part(earthsAsm, sphere(0.12, 16), { pal: 'green', tone: 'hi', pos: [1.65, 0.35, 0], name: 'Selected orbital date marker' });
    label('board', 'All 4 axes stay parallel in space!', () => V(14, 2.05, 0), { leader: [0, -20] });

    // Station 2 (x = 28): 5.14 deg Tilted Lunar Orbit & Line of Nodes
    const shAsm = asm('ecliptic_shadow', root, { title: 'Earth & ecliptic umbra shadow cone', sub: 'Shadow lies in Earth–Sun plane' });
    shAsm.position.set(28, 1.0, 0);
    part(shAsm, sphere(0.32, 22), { pal: 'blue', tone: 'hi', pos: [0, 0, 0], name: 'Earth' });
    part(shAsm, torus(1.55, 0.018, 10, 48), { pal: 'paper', tone: 'mid', rot: [Math.PI / 2, 0, 0], name: 'Ecliptic reference plane' });
    part(shAsm, cyl(0.24, 1.65, 20), { pal: 'dark', tone: 'mid', pos: [0.85, 0, 0], rot: [0, 0, Math.PI / 2], mat: shadeMat('dark', { opacity: 0.42 }), ex: [0.4, 0, 0], name: 'Earth umbra shadow cylinder' });

    const hoopAsm = asm('lunar_hoop', root, { title: '5.14°-tilted lunar orbit & nodes', sub: 'Eclipses only at nodal crossings' });
    hoopAsm.position.set(28, 1.0, 0);
    const hoopPivot = new THREE.Group();
    hoopAsm.add(hoopPivot);
    part(hoopPivot, torus(1.55, 0.028, 12, 48), { pal: 'ochre', tone: 'hi', rot: [Math.PI / 2 + 0.22, 0, 0], ex: [0, 0.35, 0], name: 'Tilted lunar orbit hoop (exaggerated 5.14°)' });
    const fullMoonBall = part(hoopPivot, sphere(0.14, 18), { pal: 'red', tone: 'hi', pos: [1.55, 0, 0], ex: [0, 0.5, 0], name: 'Full Moon' });
    const nodeLine = rod(hoopPivot, { r: 0.02, pal: 'green', tone: 'hi', name: 'Line of Nodes intersection' });
    nodeLine.set(V(-1.6, 0, 0), V(1.6, 0, 0));
    label('board', 'Line of Nodes (green) · 5.14° tilt', () => V(28, 2.05, 0), { leader: [0, -20] });

    return {
      labels,
      update(s) {
        // Station 0: Spin globe & horizon deck
        spinGroup.rotation.y = s.t * 1.1;
        deckRot.rotation.y = s.t * 1.1;

        // Station 1: Parallel tilt on all 4 seasonal globes
        const tiltRad = (s.axialTiltDeg * Math.PI) / 180;
        for (const g of seasonGlobes) g.rotation.z = tiltRad;
        const sRad = (s.orbitSeasonDeg * Math.PI) / 180;
        activeEarth.position.set(1.65 * Math.cos(sRad), 0.35, 1.65 * Math.sin(sRad));

        // Station 2: Rotate lunar line of nodes relative to shadow axis
        const nRad = (s.nodeOffsetDeg * Math.PI) / 180;
        hoopPivot.rotation.y = nRad;
        const yMiss = Math.sin(nRad) * 0.34;
        fullMoonBall.position.set(1.55 * Math.cos(nRad), yMiss, -1.55 * Math.sin(nRad));
      },
    };
  },
};
