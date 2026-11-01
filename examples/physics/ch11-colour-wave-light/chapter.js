import { SUBJECT } from '../subject.js';
import {
  THREE, part, box, cyl, sphere, torus, cone, lines, arrow, setArrow, rod,
  prims, shadeMat, MOLECULES, studioGrid, playTone, V
} from '@saxster/atlas/phys_kit.js';
import * as M from './model.js';

export const PAGES = [
  {
    tab: 'Newton’s two prisms',
    fig: 'Figure 11.1 · Newton’s experimentum crucis: dispersing white light and recombining with a second prism',
    title: 'Newton’s Dual-Prism Dispersion & Recombination',
    alt: 'Two 3D triangular glass prisms: the first splits a white sunbeam into a rainbow fan (violet bent most, red least), and an inverted second prism recombines the fan back into white light.',
    cam: { target: [0, 1.3, 0], az: 20, el: 22, dist: 7.4 },
    lit: 'prism_recombine',
    parts: ['prism_split', 'prism_recombine'],
    look: { xray: 0.2, section: 0 },
  },
  {
    tab: 'Brewster glare',
    fig: 'Figure 11.4 · Brewster’s glare polarization angle (53.1° on water) & Polaroid sunglass filter',
    title: 'Brewster’s Angle & Polarized Glare Blocking',
    alt: '3D water surface reflecting horizontally polarized glare at θ_B = 53.1° through a rotatable Polaroid analyser disc.',
    cam: { target: [14, 1.3, 0], az: 24, el: 20, dist: 7.2 },
    lit: 'polaroid_disc',
    parts: ['water_glare', 'polaroid_disc'],
    look: { xray: 0.2, section: 0 },
  },
  {
    tab: 'Raman scattering',
    fig: 'Figure 11.6 · C. V. Raman’s 1928 molecular scattering apparatus & vibrational Stokes shift',
    title: 'C. V. Raman’s Molecular Light-Scattering Fingerprint',
    alt: '3D CCl₄ tetrahedral molecule illuminated by a violet light beam, scattering strong elastic Rayleigh light plus frequency-shifted Stokes and anti-Stokes spectral lines at 90°.',
    cam: { target: [28, 1.3, 0], az: 26, el: 22, dist: 7.4 },
    lit: 'raman_molecule',
    parts: ['raman_molecule', 'spectral_lines'],
    look: { xray: 0, section: 0 },
  },
];

export const PLATES = {
  prism_split: {
    text: 'First glass prism: proves white light is already a mixture of wavelengths. Because n_violet > n_red in glass, violet slows down more and bends through a steeper angle.',
    facts: s => [['n(red)', `${s.red.n.toFixed(3)}`], ['n(violet)', `${s.vio.n.toFixed(3)}`], ['Spread Δδ', `${(s.vio.devDeg - s.red.devDeg).toFixed(2)}°`]],
  },
  prism_recombine: {
    text: 'Inverted second prism (Newton’s crucial test): intercepts the spectral fan and bends it back into a single white spot — proving the glass was not "staining" the light!',
  },
  water_glare: {
    text: 'Pond surface at Brewster’s angle θ_B = arctan(n₂/n₁) = 53.1°: the reflected glare is 100% horizontally polarized parallel to the water surface.',
    facts: s => [['θ_B (water)', `${s.br.brewsterDeg.toFixed(1)}°`], ['Glare passed', `${(s.br.transmittedGlareFraction * 100).toFixed(0)}%`]],
  },
  polaroid_disc: {
    text: 'Rotating Polaroid sunglass lens (Malus’s law I = I₀ cos² φ): when oriented vertically (90° to horizontal glare), cos²(90°) = 0 and surface glare vanishes!',
  },
  raman_molecule: {
    text: 'Tetrahedral CCl₄ molecule (C. V. Raman, Calcutta, 28 Feb 1928): most photons bounce elastically (Rayleigh), but 1 in 10⁷ trades a vibrational quantum hΔν with the chemical bonds.',
    facts: s => [['Laser λ₀', `${s.ram.laserNm.toFixed(1)} nm`], ['Stokes λ', `${s.ram.stokesNm.toFixed(1)} nm`], ['Shift Δλ', `+${s.ram.shiftNm.toFixed(1)} nm`]],
  },
  spectral_lines: {
    text: 'Raman fingerprint barcode: the Stokes shift Δν depends ONLY on the molecule’s own bond stiffness and atomic masses, turning scattered light into a chemical fingerprint.',
  },
};

export const CHAPTER = {
  subject: SUBJECT,
  no: 11,
  PAGES,
  PLATES,
  clock0: 0,
  cuts: true,
  xrayKeys: ['prism_split', 'prism_recombine', 'polaroid_disc'],
  cutKeys: ['prism_split', 'prism_recombine'],
  cutPlane: [0, 0, -1, 0.05],
  defaultParams: { prismApexDeg: 60, polaroidDeg: 90, vibCmInv: 459 },
  controls: [
    { id: 'prismApexDeg', label: 'Prism apex angle A', min: 30, max: 70, step: 5, value: 60, unit: '°' },
    { id: 'polaroidDeg', label: 'Polaroid sunglass axis φ (90° = vertical)', min: 0, max: 90, step: 5, value: 90, unit: '°' },
    { id: 'vibCmInv', label: 'Molecular bond vibration Δν̃', min: 200, max: 1600, step: 50, value: 459, unit: 'cm⁻¹' },
  ],
  lessons: {
    'ch11-newton-prisms-3d': { page: 0, params: { prismApexDeg: 60 } },
    'ch11-brewster-3d': { page: 1, params: { polaroidDeg: 90 } },
    'ch11-raman-3d': { page: 2, params: { vibCmInv: 459 } },
  },
  sonify(ctx, s, page) {
    if (page === 0) playTone(ctx, { freq: 280, slideTo: 420, dur: 0.08, type: 'sine', gain: 0.03 });
    else if (page === 1) playTone(ctx, { freq: 180 + s.br.transmittedGlareFraction * 320, dur: 0.06, type: 'triangle', gain: 0.03 });
    else playTone(ctx, { freq: 440 - s.ram.shiftNm * 8, dur: 0.07, type: 'sine', gain: 0.035 });
  },
  state(clock, reduced) {
    const p = CHAPTER.params || CHAPTER.defaultParams;
    const t = reduced ? 1.0 : clock;
    const red = M.prismDispersion(p.prismApexDeg, 680);
    const vio = M.prismDispersion(p.prismApexDeg, 410);
    const br = M.brewsterAndMalus(1.333, p.polaroidDeg);
    const ram = M.ramanShiftSpectrum(435.8, p.vibCmInv);
    return { t, prismApexDeg: p.prismApexDeg, red, vio, polaroidDeg: p.polaroidDeg, br, vibCmInv: p.vibCmInv, ram };
  },
  readout(s, page, pageIdx) {
    if (pageIdx === 0) {
      return `<b>Prism apex A = ${s.prismApexDeg}°</b> · Red (680 nm, n = ${s.red.n.toFixed(3)}) deviates <b>${s.red.devDeg.toFixed(1)}°</b>; Violet (410 nm, n = ${s.vio.n.toFixed(3)}) deviates <b>${s.vio.devDeg.toFixed(1)}°</b> · Inverted 2nd prism recombines white light.`;
    }
    if (pageIdx === 1) {
      return `<b>Water Brewster Angle θ_B = ${s.br.brewsterDeg.toFixed(1)}°</b> · Analyser at <b>φ = ${s.polaroidDeg}°</b> transmits <b>${(s.br.transmittedGlareFraction * 100).toFixed(0)}%</b> of surface glare (0% at 90° vertical axis).`;
    }
    return `<b>Raman Effect (Δν̃ = ${s.vibCmInv} cm⁻¹)</b> · Incident 435.8 nm violet beam → Elastic Rayleigh (435.8 nm) + Inelastic <b>Stokes line at ${s.ram.stokesNm.toFixed(1)} nm</b> (+${s.ram.shiftNm.toFixed(1)} nm).`;
  },
  buildWorld(E) {
    const { scene, asm } = E;
    const root = new THREE.Group();
    scene.add(root);
    studioGrid(root, { x0: -4, x1: 35 });
    const labels = [];
    const label = (cls, html, at, opts = {}) => labels.push({ cls, html, at, ...opts });

    // Station 0 (x = 0): Newton's Dual Prisms
    const p1Asm = asm('prism_split', root, { title: 'Dispersing prism 1 (upright)', sub: 'n_violet > n_red splits spectrum' });
    p1Asm.position.set(-0.95, 1.05, 0);
    part(p1Asm, cyl(0.58, 0.75, 3), { pal: 'blue', tone: 'mid', pos: [0, 0, 0], rot: [Math.PI / 2, 0, 0], mat: shadeMat('blue', { opacity: 0.45 }), ex: [-0.35, 0.3, 0], name: 'Upright glass prism' });
    const whiteIn = rod(p1Asm, { r: 0.022, pal: 'paper', tone: 'lit', name: 'Incident white sunbeam' });
    whiteIn.set(V(-1.3, -0.35, 0), V(-0.2, 0.05, 0));

    const p2Asm = asm('prism_recombine', root, { title: 'Recombining prism 2 (inverted)', sub: 'Reconstructs white beam' });
    p2Asm.position.set(0.95, 0.9, 0);
    part(p2Asm, cyl(0.58, 0.75, 3), { pal: 'blue', tone: 'mid', pos: [0, 0, 0], rot: [Math.PI / 2, 0, Math.PI], mat: shadeMat('blue', { opacity: 0.45 }), ex: [0.35, 0.3, 0], name: 'Inverted glass prism' });
    const spectralRods = [];
    const specPals = ['red', 'ochre', 'green', 'blue'];
    for (let k = 0; k < 4; k++) {
      spectralRods.push(rod(root, { r: 0.016, pal: specPals[k], tone: 'hi', name: `Spectral band ${k + 1}` }));
    }
    const whiteOut = rod(p2Asm, { r: 0.024, pal: 'paper', tone: 'lit', name: 'Recombined white beam' });
    whiteOut.set(V(0.2, -0.05, 0), V(1.35, -0.05, 0));
    label('board', 'Split → Recombined white!', () => V(0, 1.95, 0), { leader: [0, -20] });

    // Station 1 (x = 14): Brewster's Glare Angle & Polaroid Disc
    const watAsm = asm('water_glare', root, { title: 'Pond surface at θ_B = 53.1°', sub: 'Reflected glare is horizontally polarized' });
    watAsm.position.set(14, 0.15, 0);
    part(watAsm, box(3.2, 0.12, 1.6, 0.02), { pal: 'blue', tone: 'mid', pos: [0, 0, 0], name: 'Water pond surface' });
    const incSun = rod(watAsm, { r: 0.022, pal: 'ochre', tone: 'hi', name: 'Unpolarized incident sunlight' });
    incSun.set(V(-1.45, 1.35, 0), V(0, 0.08, 0));
    const reflGlare = rod(watAsm, { r: 0.022, pal: 'red', tone: 'hi', name: 'Horizontally polarized glare' });
    reflGlare.set(V(0, 0.08, 0), V(0.85, 0.85, 0));

    const polAsm = asm('polaroid_disc', root, { title: 'Rotatable Polaroid sunglass analyser', sub: 'I = I₀ cos² φ' });
    polAsm.position.set(14.85, 1.0, 0);
    const polWheel = part(polAsm, cyl(0.45, 0.06, 28), { pal: 'dark', tone: 'mid', pos: [0, 0, 0], rot: [0, 0, Math.PI / 2 - 0.65], mat: shadeMat('dark', { opacity: 0.55 }), ex: [0.35, 0.35, 0], name: 'Polaroid lens' });
    const passedBeam = rod(polAsm, { r: 0.022, pal: 'green', tone: 'hi', name: 'Transmitted beam after filter' });
    label('board', 'θ_B = 53.1° · Vertical filter blocks glare', () => V(14, 2.0, 0), { leader: [0, -20] });

    // Station 2 (x = 28): C. V. Raman Molecular Scattering
    const molAsm = asm('raman_molecule', root, { title: 'Vibrating CCl₄ molecule (1928)', sub: 'Inelastic photon-phonon exchange' });
    molAsm.position.set(28, 1.15, 0);
    prims.molecule(molAsm, { atoms: MOLECULES.ccl4.atoms, bonds: MOLECULES.ccl4.bonds, scale: 0.28 });
    const vioBeam = rod(root, { r: 0.024, pal: 'blue', tone: 'hi', name: 'Incident filtered violet beam' });
    vioBeam.set(V(26.3, 1.15, 0), V(27.8, 1.15, 0));

    const specAsm = asm('spectral_lines', root, { title: 'Rayleigh, Stokes & anti-Stokes lines', sub: 'Chemical bond fingerprint Δν' });
    specAsm.position.set(28, 0.15, 1.25);
    part(specAsm, box(0.14, 1.45, 0.14, 0.02), { pal: 'blue', tone: 'hi', pos: [0, 0.72, 0], ex: [0, 0.3, 0.3], name: 'Elastic Rayleigh line (ν₀)' });
    const stokesBar = part(specAsm, box(0.14, 0.85, 0.14, 0.02), { pal: 'green', tone: 'hi', pos: [0.55, 0.42, 0], ex: [0.3, 0.3, 0.3], name: 'Inelastic Stokes line (ν₀ − Δν)' });
    const antiBar = part(specAsm, box(0.14, 0.42, 0.14, 0.02), { pal: 'red', tone: 'hi', pos: [-0.55, 0.21, 0], ex: [-0.3, 0.3, 0.3], name: 'Anti-Stokes line (ν₀ + Δν)' });
    label('board', 'Stokes shift Δν = bond fingerprint', () => V(28, 2.15, 0), { leader: [0, -20] });

    return {
      labels,
      update(s) {
        // Station 0: Spectral spread between prisms
        const spread = (s.prismApexDeg / 60) * 0.24;
        for (let k = 0; k < 4; k++) {
          const dy = (k - 1.5) * spread;
          spectralRods[k].set(V(-0.75, 1.1, 0), V(0.75, 0.9 + dy, 0));
        }

        // Station 1: Polaroid rotation & transmitted beam intensity
        polWheel.rotation.x = (s.polaroidDeg * Math.PI) / 180;
        const reach = 0.08 + s.br.transmittedGlareFraction * 0.95;
        passedBeam.set(V(0, 0, 0), V(reach, reach * 0.8, 0));

        // Station 2: Vibrate CCl4 molecule & shift Stokes/Anti-Stokes bars
        const vibScale = 1 + 0.08 * Math.sin(s.t * 6);
        molAsm.scale.setScalar(vibScale);
        const shiftX = 0.3 + (s.vibCmInv / 1600) * 0.75;
        stokesBar.position.x = shiftX;
        antiBar.position.x = -shiftX;
      },
    };
  },
};
