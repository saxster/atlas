import { SUBJECT } from '../subject.js';
import {
  THREE, part, box, cyl, sphere, cone, lines, arrow, setArrow, rod,
  prims, shadeMat, MOLECULES, studioGrid, playTone, V
} from '@saxster/atlas/phys_kit.js';
import * as M from './model.js';

export const PAGES = [
  {
    tab: 'Hull-down ship',
    fig: 'Figure 0.1 · Ship disappearing hull-first over the curved Arabian Sea horizon',
    title: 'Hull-Down Horizon & Earth Curvature',
    alt: '3D curved ocean arc with an observer tower on the shore, a tangent sightline grazing the horizon, and a tall-masted ship sinking hull-first beyond the tangent point.',
    cam: { target: [0, 1.3, 0], az: 24, el: 20, dist: 7.4 },
    lit: 'sailing_ship',
    parts: ['earth_arc', 'shore_observer', 'sailing_ship'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Rulers & parallax',
    fig: 'Figure 0.2 · Coarse vs fine rulers & eye-angle parallax shift across scale thickness',
    title: 'Resolution Uncertainty & Parallax Error',
    alt: '3D wooden desk with a pencil measured between a 1-cm ruler and a 1-mm ruler, plus an elevated glass scale showing an oblique sightline shifting the apparent reading.',
    cam: { target: [14, 1.3, 0], az: -22, el: 22, dist: 7.0 },
    lit: 'parallax_scale',
    parts: ['dual_rulers', 'parallax_scale'],
    look: { xray: 0.15, section: 0 },
  },
  {
    tab: 'Scale ladder',
    fig: 'Figure 0.3 · Powers-of-ten scale tower from atomic nucleus to observable universe',
    title: 'Powers-of-Ten Physical Scale Ladder',
    alt: '3D logarithmic scale monument from a water molecule cluster and raindrop up to Earth and planetary orbits.',
    cam: { target: [28, 1.4, 0], az: 28, el: 21, dist: 7.6 },
    lit: 'scale_columns',
    parts: ['atomic_cluster', 'scale_columns'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Rain cylinders',
    fig: 'Figure 0.4 · Narrow and wide cylindrical rain gauges filling to identical depth',
    title: 'Rain-Gauge Depth Invariance',
    alt: 'Two 3D transparent cylindrical rain gauges of narrow and wide radius under falling monsoon raindrops, both filling to the exact same water height h while holding volumes proportional to area A.',
    cam: { target: [42, 1.3, 0], az: 24, el: 20, dist: 7.2 },
    lit: 'wide_gauge',
    parts: ['narrow_gauge', 'wide_gauge'],
    look: { xray: 0.2, section: 0 },
  },
];

export const PLATES = {
  earth_arc: {
    text: 'Curved ocean bulge: over a distance d beyond the tangent horizon, the surface drops by h_drop ≈ d² / (2R_Earth), hiding the lower hull before the masthead.',
  },
  shore_observer: {
    text: 'Observer eye height h sets the horizon tangent distance d_hz = √(2 R_Earth h). Raising your eyes from the beach to a lighthouse pushes the horizon kilometers further out.',
    facts: s => [['d_hz', `${s.dHzKm.toFixed(2)} km`], ['Eye h', `${s.eyeHeightM.toFixed(1)} m`]],
  },
  sailing_ship: {
    text: 'Outbound vessel: on a flat sea the entire ship would merely shrink; on our curved Earth the hull drops below the tangent sightline while the upper sail remains lit.',
    facts: s => [['Ship d', `${s.shipDistKm.toFixed(1)} km`], ['Hidden hull', `${s.hiddenM.toFixed(2)} m`]],
  },
  dual_rulers: {
    text: 'Coarse (1 cm) vs fine (1 mm) graduations: smaller divisions narrow the honest reading interval (± half the smallest division) without eliminating uncertainty.',
  },
  parallax_scale: {
    text: 'Oblique viewing angle θ through a ruler of thickness t shifts the apparent mark by Δx = t tan θ. Looking straight down (θ = 0°) eliminates parallax.',
    facts: s => [['View θ', `${s.viewAngleDeg.toFixed(0)}°`], ['Parallax Δx', `${s.parallaxMm.toFixed(2)} mm`]],
  },
  atomic_cluster: {
    text: 'Sub-nanometre molecular reference (10⁻¹⁰ m): hydrogen-bonded H₂O molecules sit ten orders of magnitude below human height (10⁰ m).',
  },
  scale_columns: {
    text: 'Logarithmic powers-of-ten pillars: each equal step upward multiplies physical length by ×10, compressing 41 orders of magnitude into one view.',
  },
  narrow_gauge: {
    text: 'Narrow cylinder (radius r): catches fewer drops through its smaller mouth (πr²), but its smaller cross-section rises at the exact same rate h = V / A.',
    facts: s => [['Depth h', `${s.rainDepthMm.toFixed(0)} mm`], ['V_narrow', `${s.narrow.volumeMl.toFixed(0)} mL`]],
  },
  wide_gauge: {
    text: 'Wide cylinder (radius 2r): catches 4× as many raindrops through 4× the mouth area, so depth h = V / A matches the narrow cylinder millimetre for millimetre.',
    facts: s => [['Depth h', `${s.rainDepthMm.toFixed(0)} mm`], ['V_wide', `${s.wide.volumeMl.toFixed(0)} mL`]],
  },
};

export const CHAPTER = {
  subject: SUBJECT,
  no: 0,
  PAGES,
  PLATES,
  clock0: 0,
  cuts: true,
  xrayKeys: ['earth_arc', 'parallax_scale', 'narrow_gauge', 'wide_gauge'],
  cutKeys: ['earth_arc', 'narrow_gauge', 'wide_gauge'],
  cutPlane: [0, 0, -1, 0.05],
  defaultParams: { shipDistKm: 13, eyeHeightM: 2.0, viewAngleDeg: 18, rainDepthMm: 32 },
  controls: [
    { id: 'shipDistKm', label: 'Ship distance from shore', min: 2, max: 22, step: 0.5, value: 13, unit: 'km' },
    { id: 'eyeHeightM', label: 'Observer eye height', min: 0.5, max: 25, step: 0.5, value: 2.0, unit: 'm' },
    { id: 'viewAngleDeg', label: 'Ruler viewing angle θ', min: -35, max: 35, step: 1, value: 18, unit: '°' },
    { id: 'rainDepthMm', label: 'Monsoon rainfall depth', min: 5, max: 60, step: 1, value: 32, unit: 'mm' },
  ],
  lessons: {
    'ch00-hull-down-3d': { page: 0, params: { shipDistKm: 14, eyeHeightM: 2.0 } },
    'ch00-parallax-3d': { page: 1, params: { viewAngleDeg: 22 } },
    'ch00-scale-3d': { page: 2 },
    'ch00-rain-3d': { page: 3, params: { rainDepthMm: 36 } },
  },
  sensor: {
    type: 'tilt',
    label: 'Tilt to angle sightline',
    apply(v) {
      return { viewAngleDeg: Math.round((v - 0.5) * 60), eyeHeightM: +(1 + v * 20).toFixed(1) };
    },
  },
  sonify(ctx, s, page) {
    if (page === 0) playTone(ctx, { freq: Math.max(120, 440 - s.hiddenM * 25), dur: 0.07, type: 'sine', gain: 0.03 });
    else if (page === 1) playTone(ctx, { freq: 240 + Math.abs(s.parallaxMm) * 90, dur: 0.06, type: 'triangle', gain: 0.03 });
    else if (page === 3) playTone(ctx, { freq: 200 + s.rainDepthMm * 6, dur: 0.06, type: 'sine', gain: 0.03 });
    else playTone(ctx, { freq: 330, dur: 0.05, type: 'sine', gain: 0.025 });
  },
  state(clock, reduced) {
    const p = CHAPTER.params || CHAPTER.defaultParams;
    const t = reduced ? 1.0 : clock;
    const dHzKm = M.horizonDistanceKm(p.eyeHeightM);
    const hiddenM = M.hiddenHullHeightM(p.shipDistKm, p.eyeHeightM);
    const parallaxMm = M.parallaxErrorMm(3.5, p.viewAngleDeg);
    const narrow = M.rainGaugeCollection(p.rainDepthMm, 25);
    const wide = M.rainGaugeCollection(p.rainDepthMm, 50);
    return {
      t,
      shipDistKm: p.shipDistKm,
      eyeHeightM: p.eyeHeightM,
      dHzKm,
      hiddenM,
      viewAngleDeg: p.viewAngleDeg,
      parallaxMm,
      rainDepthMm: p.rainDepthMm,
      narrow,
      wide,
    };
  },
  readout(s, page, pageIdx) {
    if (pageIdx === 0) {
      const hullState = s.hiddenM <= 0.01 ? 'Full hull visible inside horizon' : `Lower <b>${s.hiddenM.toFixed(2)} m</b> of hull hidden behind sea bulge`;
      return `<b>Eye height h = ${s.eyeHeightM.toFixed(1)} m</b> → Horizon tangent at <b>d_hz = ${s.dHzKm.toFixed(2)} km</b> · Ship at ${s.shipDistKm.toFixed(1)} km: ${hullState}.`;
    }
    if (pageIdx === 1) {
      return `<b>Viewing angle θ = ${s.viewAngleDeg}°</b> across 3.5 mm thick ruler → Parallax shift <b>Δx = ${s.parallaxMm >= 0 ? '+' : ''}${s.parallaxMm.toFixed(2)} mm</b> (0.00 mm when θ = 0°).`;
    }
    if (pageIdx === 2) {
      return `<b>Powers-of-Ten Scale Ladder</b> · H₂O molecule (10⁻¹⁰ m) → Raindrop (10⁻³ m) → Child (10⁰ m) → Earth (10⁷ m) · Every equal step multiplies size by ×10.`;
    }
    return `<b>Monsoon rain depth h = ${s.rainDepthMm} mm</b> in both cylinders · Narrow gauge (r = 25 mm) holds <b>${s.narrow.volumeMl.toFixed(0)} mL</b> · Wide gauge (r = 50 mm, 4× area) holds <b>${s.wide.volumeMl.toFixed(0)} mL</b>.`;
  },
  buildWorld(E) {
    const { scene, asm } = E;
    const root = new THREE.Group();
    scene.add(root);
    studioGrid(root, { x0: -4, x1: 48 });
    const labels = [];
    const label = (cls, html, at, opts = {}) => labels.push({ cls, html, at, ...opts });

    // Station 0 (x = 0): Hull-down ship over curved ocean arc
    const earthAsm = asm('earth_arc', root, { title: 'Curved Arabian Sea arc', sub: 'R = 6,371 km sphere section' });
    earthAsm.position.set(0, -3.2, 0);
    part(earthAsm, sphere(4.2, 36), { pal: 'blue', tone: 'mid', pos: [0, 0, 0], mat: shadeMat('blue', { opacity: 0.55 }), name: 'Curved ocean surface' });

    const obsAsm = asm('shore_observer', root, { title: 'Shoreline observer tower', sub: 'Variable eye height h' });
    obsAsm.position.set(-1.55, 0.72, 0);
    const towerMesh = part(obsAsm, cyl(0.12, 0.65, 16), { pal: 'ochre', tone: 'hi', pos: [0, 0.32, 0], ex: [0, 0.35, 0], name: 'Lookout tower' });
    const eyeSphere = part(obsAsm, sphere(0.09, 14), { pal: 'dark', tone: 'hi', pos: [0, 0.7, 0], ex: [0, 0.55, 0], name: 'Observer eye' });
    const sightRay = rod(root, { r: 0.018, pal: 'red', tone: 'hi', name: 'Horizon tangent sightline' });

    const shipAsm = asm('sailing_ship', root, { title: 'Tall-masted vessel', sub: 'Sinks hull-first over curve' });
    shipAsm.position.set(1.1, 0.8, 0);
    part(shipAsm, box(0.58, 0.22, 0.26, 0.03), { pal: 'ochre', tone: 'hi', pos: [0, 0.11, 0], ex: [0, -0.25, 0], name: 'Wooden hull' });
    part(shipAsm, cyl(0.025, 0.85, 12), { pal: 'dark', tone: 'hi', pos: [0, 0.55, 0], ex: [0, 0.25, 0], name: 'Mainmast' });
    part(shipAsm, box(0.06, 0.55, 0.42, 0.01), { pal: 'paper', tone: 'lit', pos: [0.04, 0.62, 0], ex: [0.25, 0.35, 0], name: 'Topsail' });
    part(shipAsm, cone(0.08, 0.16, 12), { pal: 'red', tone: 'hi', pos: [0, 1.02, 0], ex: [0, 0.55, 0], name: 'Masthead pennant' });
    label('board', 'Observer eye (h)', () => V(-1.55, 1.9, 0));
    label('board', 'Tangent sightline', () => V(0.0, 1.38, 0), { leader: [0, -22] });

    // Station 1 (x = 14): Coarse/fine rulers & parallax sightline
    const rulersAsm = asm('dual_rulers', root, { title: 'Coarse (cm) & fine (mm) rulers', sub: 'Resolution & uncertainty interval' });
    rulersAsm.position.set(14, 0.55, 0);
    part(rulersAsm, box(3.2, 0.12, 0.45, 0.02), { pal: 'ochre', tone: 'mid', pos: [0, 0, -0.45], ex: [0, 0.3, -0.3], name: 'Centimetre ruler' });
    part(rulersAsm, box(3.2, 0.12, 0.45, 0.02), { pal: 'green', tone: 'mid', pos: [0, 0, 0.45], ex: [0, 0.3, 0.3], name: 'Millimetre ruler' });
    part(rulersAsm, cyl(0.07, 2.35, 16), { pal: 'red', tone: 'hi', pos: [-0.35, 0.14, 0], rot: [0, 0, Math.PI / 2], ex: [0, 0.5, 0], name: 'Measured pencil' });

    const paraAsm = asm('parallax_scale', root, { title: 'Thick ruler parallax stage', sub: 'Δx = t tan θ' });
    paraAsm.position.set(14, 1.25, 0);
    part(paraAsm, box(2.4, 0.36, 0.55, 0.02), { pal: 'blue', tone: 'mid', pos: [0, 0, 0], mat: shadeMat('blue', { opacity: 0.42 }), ex: [0, 0.35, 0], name: 'Thick glass scale' });
    const eyeNode = part(paraAsm, sphere(0.11, 16), { pal: 'dark', tone: 'hi', pos: [0, 0.95, 0], ex: [0, 0.6, 0], name: 'Viewing eye position' });
    const paraRay = rod(paraAsm, { r: 0.02, pal: 'red', tone: 'hi', name: 'Oblique line of sight' });
    const markDot = part(paraAsm, sphere(0.065, 12), { pal: 'red', tone: 'hi', pos: [0, -0.18, 0], name: 'Apparent reading on bottom face' });
    label('board', 'Parallax Δx = t tan θ', () => V(14, 2.45, 0), { leader: [24, -20] });

    // Station 2 (x = 28): Powers-of-Ten Scale Ladder
    const atomAsm = asm('atomic_cluster', root, { title: 'Molecular scale anchor', sub: '10⁻¹⁰ m water cluster' });
    atomAsm.position.set(26.6, 1.25, 0);
    prims.molecule(atomAsm, { atoms: MOLECULES.waterCluster.atoms, bonds: MOLECULES.waterCluster.bonds, scale: 0.28 });

    const colAsm = asm('scale_columns', root, { title: 'Log₁₀ physical scale pillars', sub: 'From 10⁻⁹ m to 10⁷ m' });
    colAsm.position.set(28.7, 0.1, 0);
    const cols = [
      { x: -0.9, h: 0.48, pal: 'blue', name: 'Atom / Molecule (10⁻¹⁰ m)' },
      { x: -0.3, h: 0.98, pal: 'green', name: 'Monsoon raindrop (10⁻³ m)' },
      { x: 0.3, h: 1.52, pal: 'ochre', name: 'Human observer (10⁰ m)' },
      { x: 0.9, h: 2.25, pal: 'red', name: 'Planet Earth (10⁷ m)' },
    ];
    for (const c of cols) {
      part(colAsm, box(0.42, c.h, 0.42, 0.04), { pal: c.pal, tone: 'hi', pos: [c.x, c.h / 2, 0], ex: [0, c.h * 0.25, 0], name: c.name });
    }
    label('board', '10⁻¹⁰ m H₂O', () => V(26.6, 2.2, 0));
    label('board', '×10 per step', () => V(28.7, 2.55, 0));

    // Station 3 (x = 42): Narrow vs Wide Rain Gauges
    const narrowAsm = asm('narrow_gauge', root, { title: 'Narrow rain cylinder (r)', sub: 'Area A = πr²' });
    narrowAsm.position.set(41.1, 0.1, 0);
    part(narrowAsm, cyl(0.38, 1.9, 24), { pal: 'paper', tone: 'mid', pos: [0, 0.95, 0], mat: shadeMat('paper', { opacity: 0.38 }), name: 'Narrow glass tube' });
    const waterNarrow = part(narrowAsm, cyl(0.34, 1.0, 24), { pal: 'blue', tone: 'hi', pos: [0, 0.5, 0], ex: [0, 0.4, 0], name: 'Collected rainwater (narrow)' });

    const wideAsm = asm('wide_gauge', root, { title: 'Wide rain cylinder (2r)', sub: 'Area 4A = 4πr², same depth h' });
    wideAsm.position.set(42.9, 0.1, 0);
    part(wideAsm, cyl(0.76, 1.9, 28), { pal: 'paper', tone: 'mid', pos: [0, 0.95, 0], mat: shadeMat('paper', { opacity: 0.38 }), name: 'Wide glass cylinder' });
    const waterWide = part(wideAsm, cyl(0.72, 1.0, 28), { pal: 'blue', tone: 'hi', pos: [0, 0.5, 0], ex: [0, 0.4, 0], name: 'Collected rainwater (wide)' });
    const rainDrops = prims.particles(root, { count: 22, r: 0.038, pal: 'blue' });
    const levelLine = rod(root, { r: 0.015, pal: 'red', tone: 'hi', name: 'Equal-depth reference line' });
    label('board', 'Same depth h in both!', () => V(42.0, 2.25, 0), { leader: [0, -22] });

    return {
      labels,
      update(s) {
        // Station 0: curve ship along ocean arc
        const R = 4.2;
        const obsAng = -0.36;
        const hScale = 0.25 + (s.eyeHeightM / 25) * 0.55;
        obsAsm.position.set(R * Math.sin(obsAng), -3.2 + R * Math.cos(obsAng), 0);
        obsAsm.rotation.z = -obsAng;
        towerMesh.scale.y = hScale / 0.65;
        towerMesh.position.y = hScale * 0.5;
        eyeSphere.position.y = hScale + 0.06;

        const shipAng = obsAng + (s.shipDistKm / 22) * 0.78;
        shipAsm.position.set(R * Math.sin(shipAng), -3.2 + R * Math.cos(shipAng), 0);
        shipAsm.rotation.z = -shipAng;

        const eyeWorld = V(
          (R + hScale + 0.06) * Math.sin(obsAng),
          -3.2 + (R + hScale + 0.06) * Math.cos(obsAng),
          0
        );
        const hzAng = obsAng + Math.acos(R / (R + hScale + 0.06));
        const dirX = Math.cos(hzAng), dirY = -Math.sin(hzAng);
        sightRay.set(eyeWorld, V(eyeWorld.x + dirX * 3.4, eyeWorld.y + dirY * 3.4, 0));

        // Station 1: parallax viewing angle
        const rad = (s.viewAngleDeg * Math.PI) / 180;
        const ex = Math.sin(rad) * 0.95;
        const ey = Math.cos(rad) * 0.95;
        eyeNode.position.set(ex, ey, 0);
        const dxScene = -Math.tan(rad) * 0.36;
        markDot.position.set(dxScene, -0.18, 0);
        paraRay.set(V(ex, ey, 0), V(dxScene, -0.18, 0));

        // Station 3: equal rain depth in narrow & wide cylinders
        const hWater = Math.max(0.12, (s.rainDepthMm / 60) * 1.65);
        waterNarrow.scale.y = hWater;
        waterNarrow.position.y = hWater * 0.5;
        waterWide.scale.y = hWater;
        waterWide.position.y = hWater * 0.5;
        levelLine.set(V(40.6, 0.1 + hWater, 0.8), V(43.8, 0.1 + hWater, 0.8));

        const pts = [];
        for (let i = 0; i < 22; i++) {
          const x = 40.7 + (i % 11) * 0.28;
          const y = 1.9 + ((2.2 - ((s.t * 1.4 + i * 0.23) % 1.4)));
          const z = ((i % 3) - 1) * 0.22;
          pts.push([x, y, z]);
        }
        rainDrops.set(pts);
      },
    };
  },
};
