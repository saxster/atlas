import { SUBJECT } from '../subject.js';
import {
  THREE, part, box, cyl, sphere, torus, cone, lines, arrow, setArrow, rod,
  prims, shadeMat, studioGrid, playTone, V
} from '@saxster/atlas/phys_kit.js';
import * as M from './model.js';

export const PAGES = [
  {
    tab: 'Photoelectric leaf',
    fig: 'Figure 15.1 · Photoelectric gold-leaf electroscope: UV photons eject electrons (hf > φ) while bright red light cannot',
    title: 'Einstein’s Photoelectric Effect (K_max = hf − φ)',
    alt: '3D zinc-plate gold-leaf electroscope illuminated by tuneable light packets; below the threshold wavelength λ₀, individual photons kick out electrons and collapse the gold leaf.',
    cam: { target: [0, 1.35, 0], az: 22, el: 20, dist: 7.2 },
    lit: 'zinc_electroscope',
    parts: ['zinc_electroscope', 'photon_stream'],
    look: { xray: 0.25, section: 0 },
  },
  {
    tab: 'Single-photon fringes',
    fig: 'Figure 15.2 · Double-slit camera exposure: individual photon clicks building wave interference bands',
    title: 'Wave–Particle Duality: Single-Photon Accumulation',
    alt: '3D double-slit barrier and detector screen accumulating discrete single-photon arrival dots into bright and dark interference fringes.',
    cam: { target: [14, 1.3, 0], az: 24, el: 20, dist: 7.4 },
    lit: 'detector_screen',
    parts: ['double_slit', 'detector_screen'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Solar p–p fusion',
    fig: 'Figure 15.3 · Four protons fusing into Helium-4: the 0.7% mass defect (E = Δm c²)',
    title: 'Solar Core Fusion & Mass-Defect Balance',
    alt: '3D precision balance comparing four hydrogen protons (4.031 u) against one fused Helium-4 nucleus (4.003 u), with the missing 0.029 u released as 26.7 MeV gamma photons.',
    cam: { target: [28, 1.3, 0], az: 20, el: 22, dist: 7.4 },
    lit: 'helium_product',
    parts: ['four_protons', 'helium_product'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Stellar barcode',
    fig: 'Figure 15.4 · Atomic absorption barcode lines & cosmological redshift (1 + z)',
    title: 'Quantized Spectral Barcodes & Redshift',
    alt: '3D Bohr-rungs energy ladder alongside a starlight spectrum ribbon crossed by dark Fraunhofer absorption lines that shift toward the red as galaxy recession redshift z increases.',
    cam: { target: [42, 1.3, 0], az: 22, el: 20, dist: 7.4 },
    lit: 'spectral_barcode',
    parts: ['bohr_rungs', 'spectral_barcode'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Chandrasekhar limit',
    fig: 'Figure 15.6 · S. Chandrasekhar’s 1.4 M_☉ white-dwarf limit: adding mass shrinks the star!',
    title: 'Chandrasekhar’s White-Dwarf Limit (1.44 M_☉)',
    alt: '3D comparison of Earth against a hyper-dense electron-degenerate white dwarf sphere that shrinks as its mass climbs toward the 1.44 M_☉ Chandrasekhar collapse limit.',
    cam: { target: [56, 1.3, 0], az: 24, el: 22, dist: 7.4 },
    lit: 'white_dwarf_core',
    parts: ['earth_ref', 'white_dwarf_core'],
    look: { xray: 0.2, section: 0 },
  },
];

export const PLATES = {
  zinc_electroscope: {
    text: 'Negatively charged zinc plate & gold leaf (work function φ = 2.3 eV): a flood of dim red photons (1.9 eV each) never ejects a single electron, whereas even a feeble UV beam (4.0 eV each) discharges the leaf immediately.',
    facts: s => [['Photon E = hf', `${s.pe.photonEv.toFixed(2)} eV`], ['Work fn φ', `2.30 eV`], ['K_max', `${s.pe.kMaxEv.toFixed(2)} eV`]],
  },
  photon_stream: {
    text: 'One-photon-one-electron rule (Einstein, 1905): light energy arrives in discrete packets E = hf = hc/λ.',
  },
  double_slit: {
    text: 'Twin slits separated by d: each photon’s probability amplitude passes through both slits and interferes with itself.',
  },
  detector_screen: {
    text: 'Pixel-by-pixel detector screen: every photon lands as a localized particle click, yet thousands of clicks trace out the exact cos² wave interference fringes!',
    facts: s => [['Exposure clicks', `${s.exposureCount}`]],
  },
  four_protons: {
    text: 'Four hydrogen-1 nuclei (4 × 1.0078 u = 4.0313 u): overcome Coulomb repulsion in the Sun’s 15-million-K core via quantum tunneling.',
  },
  helium_product: {
    text: 'Fused Helium-4 nucleus (4.0026 u): weighs 0.7% LESS than the four protons that made it! The missing mass Δm = 0.0287 u becomes pure energy ΔE = Δmc² = 26.7 MeV.',
    facts: s => [['4 ¹H mass', `${s.fus.massInU.toFixed(4)} u`], ['⁴He mass', `${s.fus.massOutU.toFixed(4)} u`], ['ΔE = Δmc²', `${s.fus.energyMev.toFixed(2)} MeV`]],
  },
  bohr_rungs: {
    text: 'Quantized atomic energy rungs (E₁, E₂, E₃): electrons can jump ONLY between fixed rungs, absorbing or emitting photons with exact frequency hf = E_high − E_low.',
  },
  spectral_barcode: {
    text: 'Elemental absorption barcode & redshift z: every element prints its unique pattern of dark lines; in distant galaxies, cosmic expansion stretches wavelengths by (1 + z).',
  },
  earth_ref: {
    text: 'Earth size reference (1.0 R_Earth): a typical white dwarf packs the mass of the entire Sun into a ball the size of Earth (1 teaspoon weighs ~5 tonnes!).',
  },
  white_dwarf_core: {
    text: 'S. Chandrasekhar’s discovery (1930, age 19 on the ship from India): electron degeneracy pressure makes a heavier white dwarf SMALLER (R ∝ M⁻¹/³) until relativistic collapse at 1.44 M_☉!',
    facts: s => [['Star mass M', `${s.wd.massSolar.toFixed(2)} M_☉`], ['Radius R', `${s.wd.radiusRe.toFixed(2)} R_Earth`], ['Status', s.wd.nearCollapse ? 'NEAR 1.44 M_☉ COLLAPSE!' : 'Degenerate equilibrium']],
  },
};

export const CHAPTER = {
  subject: SUBJECT,
  no: 15,
  PAGES,
  PLATES,
  clock0: 0,
  cuts: true,
  xrayKeys: ['zinc_electroscope', 'white_dwarf_core'],
  cutKeys: ['zinc_electroscope', 'white_dwarf_core'],
  cutPlane: [0, 0, -1, 0.05],
  defaultParams: { wavelengthNm: 340, exposureCount: 160, wdMassSolar: 0.85 },
  controls: [
    { id: 'wavelengthNm', label: 'Incident light wavelength λ (threshold 539 nm)', min: 220, max: 700, step: 10, value: 340, unit: 'nm' },
    { id: 'exposureCount', label: 'Single-photon exposure count N', min: 15, max: 200, step: 5, value: 160, unit: 'photons' },
    { id: 'wdMassSolar', label: 'White dwarf mass M (Chandrasekhar limit 1.44)', min: 0.3, max: 1.42, step: 0.04, value: 0.85, unit: 'M_☉' },
  ],
  lessons: {
    'ch15-photoelectric-3d': { page: 0, params: { wavelengthNm: 320 } },
    'ch15-single-photon-3d': { page: 1, params: { exposureCount: 180 } },
    'ch15-fusion-defect-3d': { page: 2 },
    'ch15-spectra-3d': { page: 3 },
    'ch15-chandrasekhar-3d': { page: 4, params: { wdMassSolar: 1.25 } },
  },
  sonify(ctx, s, page) {
    if (page === 0) playTone(ctx, { freq: s.pe.emitted ? 480 + s.pe.kMaxEv * 120 : 140, dur: 0.06, type: s.pe.emitted ? 'sine' : 'triangle', gain: 0.035 });
    else if (page === 1) playTone(ctx, { freq: 620, dur: 0.03, type: 'triangle', gain: 0.035 });
    else if (page === 4) playTone(ctx, { freq: 180 + s.wd.massSolar * 220, dur: 0.07, type: 'sawtooth', gain: 0.03 });
    else playTone(ctx, { freq: 350, dur: 0.05, type: 'sine', gain: 0.025 });
  },
  state(clock, reduced) {
    const p = CHAPTER.params || CHAPTER.defaultParams;
    const t = reduced ? 1.0 : clock;
    const pe = M.photoelectricEmission(p.wavelengthNm, 2.3);
    const fus = M.ppFusionMassDefect();
    const wd = M.whiteDwarfRadiusEarthRadii(p.wdMassSolar, 1.44);
    return { t, wavelengthNm: p.wavelengthNm, pe, exposureCount: p.exposureCount, fus, wdMassSolar: p.wdMassSolar, wd };
  },
  readout(s, page, pageIdx) {
    if (pageIdx === 0) {
      const state = s.pe.emitted ? `<b>PHOTOELECTRONS EJECTED</b> (K_max = ${s.pe.kMaxEv.toFixed(2)} eV)` : `<b>BELOW THRESHOLD</b> (hf < φ = 2.30 eV; 0 electrons ejected regardless of brightness!)`;
      return `<b>λ = ${s.wavelengthNm} nm (Photon E = ${s.pe.photonEv.toFixed(2)} eV)</b> → ${state}.`;
    }
    if (pageIdx === 1) {
      return `<b>Single-Photon Exposure (${s.exposureCount} clicks)</b> · Each photon arrives at one point like a particle, yet their collective probability builds wave interference fringes.`;
    }
    if (pageIdx === 2) {
      return `<b>Solar p–p Fusion</b> · 4 ¹H (4.0313 u) → ⁴He (4.0026 u) · Missing mass <b>Δm = 0.0287 u (0.7%)</b> converts into <b>ΔE = Δmc² = ${s.fus.energyMev.toFixed(2)} MeV</b>.`;
    }
    if (pageIdx === 3) {
      return `<b>Atomic Spectral Barcode</b> · Dark absorption lines occur only at quantized rung gaps <b>hf = E_n − E_m</b>; cosmic expansion shifts the entire barcode toward the red.`;
    }
    return `<b>White Dwarf Mass M = ${s.wd.massSolar.toFixed(2)} M_☉</b> → Radius shrinks to <b>R = ${s.wd.radiusRe.toFixed(2)} R_Earth</b> (Chandrasekhar limit = <b>1.44 M_☉</b>).`;
  },
  buildWorld(E) {
    const { scene, asm } = E;
    const root = new THREE.Group();
    scene.add(root);
    studioGrid(root, { x0: -4, x1: 62 });
    const labels = [];
    const label = (cls, html, at, opts = {}) => labels.push({ cls, html, at, ...opts });

    // Station 0 (x = 0): Photoelectric Electroscope
    const elecAsm = asm('zinc_electroscope', root, { title: 'Zinc-plate gold-leaf electroscope', sub: 'Work function φ = 2.30 eV' });
    elecAsm.position.set(0, 0.95, 0);
    part(elecAsm, cyl(0.65, 1.35, 24), { pal: 'paper', tone: 'mid', pos: [0, 0, 0], mat: shadeMat('paper', { opacity: 0.4 }), name: 'Glass electroscope jar' });
    part(elecAsm, cyl(0.52, 0.08, 24), { pal: 'blue', tone: 'hi', pos: [0, 0.85, 0], ex: [0, 0.45, 0], name: 'Clean zinc top plate' });
    part(elecAsm, cyl(0.035, 1.1, 12), { pal: 'ochre', tone: 'hi', pos: [0, 0.25, 0], name: 'Central brass stem' });
    const goldLeaf = part(elecAsm, box(0.03, 0.55, 0.14, 0.01), { pal: 'ochre', tone: 'lit', pos: [0.12, -0.1, 0], rot: [0, 0, 0.5], ex: [0.3, 0, 0], name: 'Hinged gold leaf' });

    const photAsm = asm('photon_stream', root, { title: 'Incident photon quanta & photoelectrons', sub: 'K_max = hf − φ' });
    photAsm.position.set(0, 1.8, 0);
    const ejectedCloud = prims.particles(photAsm, { count: 14, r: 0.045, pal: 'green' });
    label('board', 'hf > φ ejects electrons!', () => V(0, 2.35, 0), { leader: [0, -20] });

    // Station 1 (x = 14): Single-Photon Double-Slit Screen
    const slitAsm = asm('double_slit', root, { title: 'Double-slit barrier', sub: 'Wave probability passes through both slits' });
    slitAsm.position.set(13.1, 1.0, 0);
    part(slitAsm, box(0.12, 1.6, 1.8, 0.02), { pal: 'dark', tone: 'mid', pos: [0, 0, 0], ex: [-0.4, 0, 0], name: 'Slit mask' });

    const scrAsm = asm('detector_screen', root, { title: 'Single-photon CMOS detector screen', sub: 'Clicks accumulate into interference fringes' });
    scrAsm.position.set(14.8, 1.0, 0);
    part(scrAsm, box(0.12, 1.75, 2.2, 0.02), { pal: 'paper', tone: 'lit', pos: [0, 0, 0], ex: [0.4, 0, 0], name: 'Phosphor detector plate' });
    const photonDots = prims.particles(scrAsm, { count: 200, r: 0.032, pal: 'blue' });
    label('board', 'Particles land one by one → Wave fringes!', () => V(14, 2.15, 0), { leader: [0, -20] });

    // Station 2 (x = 28): Solar p-p Fusion Mass Defect Scale
    const p4Asm = asm('four_protons', root, { title: 'Four hydrogen protons (4.0313 u)', sub: 'Heavier initial reactants' });
    p4Asm.position.set(27.0, 1.05, 0);
    part(p4Asm, box(2.4, 0.08, 0.35, 0.02), { pal: 'dark', tone: 'hi', pos: [1.0, -0.35, 0], rot: [0, 0, -0.14], name: 'Mass-defect balance beam' });
    for (let k = 0; k < 4; k++) {
      part(p4Asm, sphere(0.15, 16), { pal: 'red', tone: 'hi', pos: [(k % 2 - 0.5) * 0.28, (k >> 1) * 0.28, 0], ex: [-0.35, 0.3, 0], name: `Proton ${k + 1}` });
    }

    const heAsm = asm('helium_product', root, { title: 'Fused ⁴He nucleus (4.0026 u) + 26.7 MeV', sub: '0.7% mass converted via E = Δmc²' });
    heAsm.position.set(29.0, 1.25, 0);
    part(heAsm, sphere(0.16, 16), { pal: 'red', tone: 'hi', pos: [-0.12, 0, 0], ex: [0.3, 0.3, 0], name: 'Helium proton' });
    part(heAsm, sphere(0.16, 16), { pal: 'red', tone: 'hi', pos: [0.12, 0, 0], ex: [0.3, 0.3, 0], name: 'Helium proton' });
    part(heAsm, sphere(0.16, 16), { pal: 'blue', tone: 'hi', pos: [0, 0.14, 0.1], ex: [0.3, 0.4, 0], name: 'Helium neutron' });
    part(heAsm, sphere(0.16, 16), { pal: 'blue', tone: 'hi', pos: [0, -0.14, -0.1], ex: [0.3, 0.2, 0], name: 'Helium neutron' });
    const gammaVec = arrow(heAsm, { pal: 'ochre', r: 0.028 });
    setArrow(gammaVec, V(0.25, 0.2, 0), V(1.05, 0.65, 0));
    label('board', 'Δm = 0.7% → ΔE = Δmc² = 26.7 MeV', () => V(28, 2.15, 0), { leader: [0, -20] });

    // Station 3 (x = 42): Quantized Bohr Rungs & Absorption Barcode
    const rungAsm = asm('bohr_rungs', root, { title: 'Quantized atomic energy ladder', sub: 'Electrons stand only on discrete rungs' });
    rungAsm.position.set(41.0, 0.2, 0);
    for (const [idx, yR] of [0.25, 0.95, 1.45, 1.78].entries()) {
      part(rungAsm, box(0.95, 0.06, 0.35, 0.01), { pal: 'blue', tone: 'hi', pos: [0, yR, 0], ex: [-0.35, 0.2, 0], name: `Energy level E_${idx + 1}` });
    }
    const jumpArrow = arrow(rungAsm, { pal: 'red', r: 0.026 });
    setArrow(jumpArrow, V(0, 0.28, 0), V(0, 1.42, 0));

    const barAsm = asm('spectral_barcode', root, { title: 'Fraunhofer dark absorption barcode', sub: 'hf = E_n − E_m' });
    barAsm.position.set(42.8, 1.05, 0);
    part(barAsm, box(1.8, 0.75, 0.14, 0.02), { pal: 'ochre', tone: 'hi', pos: [0, 0, 0], ex: [0.35, 0, 0], name: 'Continuous starlight spectrum' });
    for (const xLine of [-0.62, -0.18, 0.28, 0.68]) {
      part(barAsm, box(0.06, 0.78, 0.18, 0.01), { pal: 'dark', tone: 'hi', pos: [xLine, 0, 0], ex: [0.35, 0.35, 0], name: 'Dark absorption line' });
    }
    label('board', 'Exact rung gaps → Dark barcode lines', () => V(42.0, 2.2, 0), { leader: [0, -20] });

    // Station 4 (x = 56): Chandrasekhar White Dwarf vs Earth
    const refEarth = asm('earth_ref', root, { title: 'Earth size reference (1.0 R_Earth)', sub: 'Standard planetary radius' });
    refEarth.position.set(54.9, 1.05, 0);
    part(refEarth, sphere(0.55, 24), { pal: 'blue', tone: 'hi', pos: [0, 0, 0], ex: [-0.35, 0, 0], name: 'Earth (1 R_E)' });

    const wdAsm = asm('white_dwarf_core', root, { title: 'Chandrasekhar white dwarf core', sub: 'Shrinks as mass M approaches 1.44 M_☉' });
    wdAsm.position.set(56.9, 1.05, 0);
    const wdSphere = part(wdAsm, sphere(0.55, 28), { pal: 'paper', tone: 'lit', pos: [0, 0, 0], mat: shadeMat('paper', { opacity: 0.85 }), ex: [0.35, 0, 0], name: 'Electron-degenerate white dwarf' });
    part(wdAsm, sphere(0.22, 18), { pal: 'red', tone: 'hi', pos: [0, 0, 0], name: 'Relativistic Fermi core' });
    label('board', 'More mass → Smaller radius (1.44 M_☉ limit)', () => V(56.0, 2.15, 0), { leader: [0, -20] });

    return {
      labels,
      update(s) {
        // Station 0: Photoelectric gold leaf & electron cloud
        goldLeaf.rotation.z = s.pe.emitted ? 0.12 : 0.62;
        const pts = [];
        for (let i = 0; i < 14; i++) {
          if (s.pe.emitted) {
            const u = ((s.t * (0.8 + s.pe.kMaxEv * 0.4) + i * 0.17) % 1);
            pts.push([(Math.sin(i * 2.1) * 0.45), u * 0.85, (Math.cos(i * 1.7) * 0.45)]);
          } else {
            pts.push([0, -5, 0]);
          }
        }
        ejectedCloud.set(pts);

        // Station 1: Single-photon interference fringes
        const fPts = [];
        for (let i = 0; i < 200; i++) {
          if (i < s.exposureCount) {
            // Deterministic fringe distribution cos^2(z)
            const band = (i % 5) - 2;
            const z = band * 0.38 + Math.sin(i * 12.9898) * 0.08;
            const y = (Math.cos(i * 78.233) * 0.68);
            fPts.push([-0.08, y, z]);
          } else {
            fPts.push([0, -5, 0]);
          }
        }
        photonDots.set(fPts);

        // Station 4: White dwarf shrinks as mass rises toward 1.44 M_sun
        const rScale = Math.max(0.24, Math.min(1.4, s.wd.radiusRe));
        wdSphere.scale.setScalar(rScale);
      },
    };
  },
};
