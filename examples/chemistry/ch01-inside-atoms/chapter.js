import { SUBJECT } from '../subject.js';
import {
  THREE, shadeMat, part, box, cyl, sphere, rod,
  buildNucleusCluster, buildCurveTube, studioGrid, playTone, V
} from '@saxster/atlas/chem_kit.js';
import * as M from './model.js';

export const PAGES = [
  {
    tab: 'Gold-foil scattering',
    fig: 'Geiger–Marsden–Rutherford α-scattering apparatus and Coulomb deflection',
    title: 'Rutherford Gold-Foil Scattering',
    alt: '3D alpha source, thin gold foil, circular ZnS scintillation ring, and magnified gold nucleus deflecting near-axis alpha particles.',
    cam: { target: [0, 1.25, 0], az: 24, el: 22, dist: 11.4 },
    lit: 'gold_nucleus',
    parts: ['alpha_gun', 'gold_nucleus', 'zns_screen'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Nucleons & charge',
    fig: 'Atomic identity (Z protons), mass number (A = Z + N), and net charge (q = Z − e⁻)',
    title: 'Protons, Neutrons & Electrons',
    alt: '3D clustered atomic nucleus of protons and neutrons surrounded by a translucent 3D electron cloud.',
    cam: { target: [14, 1.3, 0], az: -20, el: 20, dist: 11.2 },
    lit: 'nucleus_core',
    parts: ['nucleus_core', 'electron_cloud'],
    look: { xray: 0.25, section: 0 },
  },
  {
    tab: 'Isotopes & mass spec',
    fig: 'Mass spectrometer magnetic deflection of ³⁵Cl⁺ and ³⁷Cl⁺ isotopes',
    title: 'Isotopes & Mass Spectrometry',
    alt: '3D magnetic sector mass spectrometer separating lighter 35Cl+ and heavier 37Cl+ ion beams onto a detector with live weighted-average fulcrum.',
    cam: { target: [28, 1.3, 0], az: 24, el: 20, dist: 11.8 },
    lit: 'isotope_beams',
    parts: ['magnet_sector', 'isotope_beams', 'mass_detector'],
    look: { xray: 0.15, section: 0 },
  },
  {
    tab: 'Quantum clouds',
    fig: '3D 1s, 2s, and 2p probability density clouds and shell occupancy',
    title: 'Probability Clouds & Shells',
    alt: '3D cutaway of spherical 1s and 2s probability clouds alongside bilobed 2p orbitals separated by a nodal plane.',
    cam: { target: [42, 1.3, 0], az: 26, el: 20, dist: 11.4 },
    lit: 'orbital_2p',
    parts: ['orbital_s', 'orbital_2p'],
    look: { xray: 0.3, section: 0 },
  },
];

export const PLATES = {
  alpha_gun: {
    text: 'Lead-collimated α-particle source (⁴He²⁺ nuclei): fires a narrow beam of positively charged particles toward the thin gold leaf.',
  },
  gold_nucleus: {
    text: 'Concentrated positive nucleus (Z = 79 for Au): occupies a tiny fraction of atomic volume yet carries nearly all the mass, causing rare >90° rebounds.',
    facts: s => [
      ['Impact b', `${s.ruth.impactParamFm} fm`],
      ['Deflection θ', `${s.ruth.thetaDeg.toFixed(1)}°`],
      ['Closest r_min', `${s.ruth.closestApproachFm.toFixed(1)} fm`],
      ['Outcome', s.ruth.regime],
    ],
  },
  zns_screen: {
    text: 'Circular zinc sulfide (ZnS) scintillation ring: produces microscopic flashes when struck by transmitted or deflected α-particles.',
  },
  nucleus_core: {
    text: 'Dense central nucleon cluster: proton count Z alone defines the chemical element; neutrons N add nuclear mass without changing net charge.',
    facts: s => [['Element', `${s.atom.symbol} (Z = ${s.atom.Z})`], ['Mass no. A', `${s.atom.A} (${s.atom.Z}p + ${s.atom.N}n)`]],
  },
  electron_cloud: {
    text: 'Surrounding negatively charged electrons: net ionic charge in elementary units is strictly protons minus electrons (q = Z − e⁻).',
    facts: s => [['Electrons', `${s.atom.e} e⁻`], ['Net charge', `${s.atom.chargeStr}`], ['Shells', s.atom.shells.join(' · ')]],
  },
  magnet_sector: {
    text: 'Magnetic analyzer sector: exerts a perpendicular Lorentz force that bends lighter ions onto a tighter radius of curvature than heavier isotopes.',
  },
  isotope_beams: {
    text: '³⁵Cl⁺ (17p, 18n) and ³⁷Cl⁺ (17p, 20n) ion streams: identical chemical identity (Z = 17) but distinct nuclear masses.',
    facts: s => [['³⁵Cl abundance', `${s.iso.frac35Pct.toFixed(1)}%`], ['³⁷Cl abundance', `${s.iso.frac37Pct.toFixed(1)}%`], ['Weighted Ar', `${s.iso.avgMass.toFixed(2)} u`]],
  },
  mass_detector: {
    text: 'Faraday cup collector array: measures relative peak heights to determine natural isotopic abundances and weighted average atomic mass.',
  },
  orbital_s: {
    text: 'Spherical 1s and 2s probability distributions: regions where an electron is most likely to be detected—not literal planetary tracks.',
  },
  orbital_2p: {
    text: 'Three orthogonal 2pₓ, 2pᵧ, 2p₂ bilobed probability clouds separated by nodal planes passing through the nucleus.',
  },
};

export const CHAPTER = {
  subject: SUBJECT,
  no: 1,
  narrowZoom: 1.18,
  PAGES,
  PLATES,
  clock0: 0,
  cuts: true,
  xrayKeys: ['electron_cloud', 'orbital_s', 'magnet_sector'],
  cutKeys: ['electron_cloud', 'orbital_s'],
  cutPlane: [0, 0, -1, 0.05],
  defaultParams: { impactFm: 12, protons: 6, neutrons: 6, electrons: 6, cl35Pct: 76 },
  controls: [
    { id: 'impactFm', label: 'α impact parameter b', min: 2, max: 120, step: 2, value: 12, unit: 'fm' },
    { id: 'protons', label: 'Protons (Z, element)', min: 1, max: 12, step: 1, value: 6, unit: 'p⁺' },
    { id: 'neutrons', label: 'Neutrons (N)', min: 0, max: 14, step: 1, value: 6, unit: 'n⁰' },
    { id: 'electrons', label: 'Electrons (e⁻)', min: 1, max: 12, step: 1, value: 6, unit: 'e⁻' },
    { id: 'cl35Pct', label: '³⁵Cl isotope abundance', min: 10, max: 90, step: 2, value: 76, unit: '%' },
  ],
  lessons: {
    'inside-atoms': { page: 0, params: { impactFm: 8 } },
    'element-identity': { page: 1, params: { protons: 6, neutrons: 6, electrons: 6 } },
    'isotope-mixtures': { page: 2, params: { protons: 17, neutrons: 18, electrons: 17, cl35Pct: 76 } },
    'ions': { page: 1, params: { protons: 8, neutrons: 8, electrons: 10 } },
    'notation': { page: 1, params: { protons: 11, neutrons: 12, electrons: 10 } },
    'electron-patterns': { page: 3, params: { protons: 10, neutrons: 10, electrons: 10 } },
    's1-1': { page: 0, params: { impactFm: 8 } },
    's1-2': { page: 1, params: { protons: 6, neutrons: 6, electrons: 6 } },
    's1-3': { page: 2, params: { cl35Pct: 76 } },
    's1-4': { page: 1, params: { protons: 11, neutrons: 12, electrons: 10 } },
    's1-5': { page: 3, params: { protons: 10, neutrons: 10, electrons: 10 } },
  },
  sonify(ctx, s, page) {
    if (page === 0) playTone(ctx, { freq: 200 + s.ruth.thetaDeg * 3.2, dur: 0.07, type: 'sawtooth', gain: 0.03 });
    else if (page === 1) playTone(ctx, { freq: 180 + s.atom.Z * 35, dur: 0.07, type: 'triangle', gain: 0.03 });
    else playTone(ctx, { freq: 360 + s.atom.e * 24, dur: 0.06, type: 'sine', gain: 0.03 });
  },
  state(clock, reduced) {
    const p = CHAPTER.params || CHAPTER.defaultParams;
    const t = reduced ? 0 : clock;
    const ruth = M.rutherfordScattering(p.impactFm, 5.0, 79);
    const atom = M.atomIdentity(p.protons, p.neutrons, p.electrons);
    const iso = M.chlorineIsotopeMix(p.cl35Pct ?? 75.76);
    return { t, ruth, atom, iso };
  },
  readout(s, page, pageIdx) {
    if (pageIdx === 0) {
      return `<b>Rutherford Scattering (b = ${s.ruth.impactParamFm} fm)</b> · Coulomb deflection θ = <b>${s.ruth.thetaDeg.toFixed(1)}°</b> (${s.ruth.regime}) · Closest approach r_min = <b>${s.ruth.closestApproachFm.toFixed(1)} fm</b>.`;
    }
    if (pageIdx === 1) {
      return `<b>${s.atom.name} (${s.atom.symbol}, Z = ${s.atom.Z})</b> · Mass number A = ${s.atom.Z} + ${s.atom.N} = <b>${s.atom.A}</b> · Electrons = ${s.atom.e} · Net charge q = ${s.atom.Z} − ${s.atom.e} = <b>${s.atom.chargeStr}</b>.`;
    }
    if (pageIdx === 2) {
      return `<b>Chlorine Isotopes (Z = 17)</b> · ³⁵Cl (${s.iso.frac35Pct.toFixed(1)}%) + ³⁷Cl (${s.iso.frac37Pct.toFixed(1)}%) → Weighted average atomic mass = <b>${s.iso.avgMass.toFixed(2)} u</b> (no single atom weighs 35.45 u).`;
    }
    return `<b>Quantum Probability Clouds</b> · Shell occupancy for ${s.atom.e} e⁻: <b>[${s.atom.shells.join(', ')}]</b> · Clouds represent 3D probability distributions |ψ|², not literal electron tracks.`;
  },
  buildWorld(E) {
    const { scene, asm } = E;
    const root = new THREE.Group();
    scene.add(root);
    studioGrid(root, { x0: -4, x1: 48 });
    const labels = [];
    const label = (cls, html, at, opts = {}) => labels.push({ cls, html, at, ...opts });

    // Station 0 (x = 0): Rutherford Gold-Foil Scattering + Hyperbolic Trajectory Tube
    const gunAsm = asm('alpha_gun', root, { title: 'Lead α-particle source', sub: 'Collimated ⁴He²⁺ beam' });
    gunAsm.position.set(-1.35, 1.2, 0);
    part(gunAsm, box(0.55, 0.42, 0.42, 0.03), { pal: 'dark', tone: 'hi', ex: [-0.5, 0, 0], name: 'Lead collimator block' });

    const screenAsm = asm('zns_screen', root, { title: 'ZnS scintillation ring', sub: 'Detects scattered α flashes' });
    screenAsm.position.set(0.15, 1.2, 0);
    part(screenAsm, cyl(1.35, 0.45, 32, true), { pal: 'green', tone: 'mid', mat: shadeMat('green', { opacity: 0.35 }), ex: [0, 0.45, 0], name: 'Circular ZnS screen' });
    const flashSpot = part(screenAsm, sphere(0.085, 14), { pal: 'ochre', tone: 'lit', pos: [1.32, 0, 0], name: 'ZnS scintillation flash' });

    const foilAsm = asm('gold_nucleus', root, { title: 'Gold foil & Au nucleus', sub: 'Concentrated +79e nuclear charge' });
    foilAsm.position.set(0.15, 1.2, 0);
    part(foilAsm, box(0.04, 0.9, 0.9, 0.01), { pal: 'ochre', tone: 'lit', mat: shadeMat('ochre', { opacity: 0.45 }), ex: [0, 0.35, 0], name: 'Thin gold leaf' });
    part(foilAsm, sphere(0.18, 20), { pal: 'red', tone: 'hi', ex: [0, 0, 0.4], name: 'Gold nucleus (+79e)' });
    const trajPts0 = [V(-1.35, 0.08, 0), V(-0.6, 0.08, 0), V(-0.15, 0.12, 0), V(0.5, 0.45, 0), V(1.25, 0.85, 0)];
    const trajTube = buildCurveTube(foilAsm, trajPts0, { r: 0.022, pal: 'ochre', tone: 'hi', segs: 36, name: 'Coulomb hyperbolic path' });
    const alphaBead = part(foilAsm, sphere(0.09, 16), { pal: 'ochre', tone: 'lit', pos: [-0.9, 0.1, 0], name: 'α particle' });
    label('board', 'α source', () => V(-1.35, 1.75, 0));
    label('board', 'Au foil & ZnS ring', () => V(0.15, 2.02, 0));

    // Station 1 (x = 14): Nucleons & Electron Cloud
    const nucAsm = asm('nucleus_core', root, { title: 'Clustered atomic nucleus', sub: 'Z protons + N neutrons' });
    const nuc = buildNucleusCluster(nucAsm, 26, { rNucleon: 0.13, pos: [14, 1.3, 0] });

    const cloudAsm = asm('electron_cloud', root, { title: 'Electron probability cloud', sub: 'Concentric shell density' });
    cloudAsm.position.set(14, 1.3, 0);
    part(cloudAsm, sphere(0.72, 24), { pal: 'blue', tone: 'mid', mat: shadeMat('blue', { opacity: 0.22 }), ex: [0, 0.4, 0], name: 'n = 1 inner shell cloud' });
    const shell2 = part(cloudAsm, sphere(1.22, 28), { pal: 'blue', tone: 'lit', mat: shadeMat('blue', { opacity: 0.18 }), ex: [0, -0.4, 0], name: 'n = 2 valence shell cloud' });
    const eBeads = [];
    for (let i = 0; i < 12; i++) {
      const r = i < 2 ? 0.72 : 1.22;
      const a = (i * Math.PI * 2) / (i < 2 ? 2 : 10);
      const m = part(cloudAsm, sphere(0.075, 14), { pal: 'blue', tone: 'lit', pos: [Math.cos(a) * r, Math.sin(a) * r * 0.6, Math.sin(a) * r * 0.8], ex: [0, 0, 0.45], name: `Electron sample ${i + 1}` });
      eBeads.push(m);
    }
    label('board', 'Nucleus (Z protons + N neutrons)', () => V(14, 2.75, 0));
    label('board', '3D electron cloud', () => V(15.2, 0.45, 0));

    // Station 2 (x = 28): Mass Spectrometer & Chlorine Isotopes
    const magAsm = asm('magnet_sector', root, { title: 'Magnetic analyzer sector', sub: 'Deflects ions by m/z' });
    magAsm.position.set(28, 1.25, 0);
    part(magAsm, box(1.1, 0.25, 1.1, 0.03), { pal: 'dark', tone: 'mid', pos: [0, 0.55, 0], ex: [0, 0.45, 0], name: 'North magnet pole' });
    part(magAsm, box(1.1, 0.25, 1.1, 0.03), { pal: 'dark', tone: 'mid', pos: [0, -0.55, 0], ex: [0, -0.45, 0], name: 'South magnet pole' });

    const beamAsm = asm('isotope_beams', root, { title: '³⁵Cl⁺ and ³⁷Cl⁺ ion beams', sub: 'Lighter isotope bends tighter' });
    beamAsm.position.set(28, 1.25, 0);
    const r35 = rod(beamAsm, { r: 0.045, pal: 'green', tone: 'lit', name: '³⁵Cl⁺ beam (34.97 u)' });
    r35.set(V(-1.4, 0, 0.35), V(1.25, 0, -0.42));
    const r37 = rod(beamAsm, { r: 0.035, pal: 'ochre', tone: 'hi', name: '³⁷Cl⁺ beam (36.97 u)' });
    r37.set(V(-1.4, 0, 0.35), V(1.25, 0, 0.12));

    const detAsm = asm('mass_detector', root, { title: 'Isotope collector peaks', sub: 'Live abundance & weighted average' });
    detAsm.position.set(29.45, 0.85, 0);
    const peak35 = part(detAsm, box(0.28, 1.0, 0.28, 0.02), { pal: 'green', tone: 'lit', pos: [0, 0.5, -0.42], ex: [0.4, 0.2, 0], name: '³⁵Cl peak (34.97 u)' });
    const peak37 = part(detAsm, box(0.28, 1.0, 0.28, 0.02), { pal: 'ochre', tone: 'hi', pos: [0, 0.5, 0.12], ex: [0.4, -0.2, 0], name: '³⁷Cl peak (36.97 u)' });
    const avgMarker = part(detAsm, sphere(0.095, 16), { pal: 'red', tone: 'hi', pos: [0.18, 0.05, -0.28], name: 'Weighted average Ar fulcrum' });
    label('board', 'Magnet sector', () => V(28, 2.1, 0));
    label('board', '³⁵Cl & ³⁷Cl peaks + Ar', () => V(29.45, 2.15, -0.15));

    // Station 3 (x = 42): Quantum s & 2p Probability Clouds + Nodal Plane
    const sOrbAsm = asm('orbital_s', root, { title: 'Spherical 1s / 2s clouds', sub: 'Radial probability density' });
    sOrbAsm.position.set(41.1, 1.3, 0);
    part(sOrbAsm, sphere(0.38, 24), { pal: 'red', tone: 'hi', mat: shadeMat('red', { opacity: 0.45 }), ex: [-0.4, 0, 0], name: '1s core cloud' });
    part(sOrbAsm, sphere(0.82, 28), { pal: 'ochre', tone: 'mid', mat: shadeMat('ochre', { opacity: 0.26 }), ex: [-0.4, 0.35, 0], name: '2s outer cloud' });

    const pOrbAsm = asm('orbital_2p', root, { title: 'Orthogonal 2pₓ, 2pᵧ, 2p₂ clouds', sub: 'Bilobed probability density + nodal plane' });
    pOrbAsm.position.set(42.9, 1.3, 0);
    part(pOrbAsm, box(0.02, 1.15, 1.15, 0.005), { pal: 'paper', tone: 'mid', mat: shadeMat('paper', { opacity: 0.32 }), name: 'Angular nodal plane (ψ = 0)' });
    for (const [dx, dy, dz, pal] of [[0.42, 0, 0, 'blue'], [-0.42, 0, 0, 'blue'], [0, 0.42, 0, 'green'], [0, -0.42, 0, 'green'], [0, 0, 0.42, 'ochre'], [0, 0, -0.42, 'ochre']]) {
      part(pOrbAsm, sphere(0.32, 20), { pal, tone: 'lit', pos: [dx, dy, dz], mat: shadeMat(pal, { opacity: 0.52 }), ex: [dx * 0.9, dy * 0.9, dz * 0.9], name: '2p orbital lobe' });
    }
    label('board', '1s & 2s spherical clouds', () => V(41.1, 2.35, 0));
    label('board', '2p lobes & nodal plane', () => V(42.9, 2.35, 0));

    let lastImpact = -1;
    return {
      labels,
      update(s) {
        const bY = (s.ruth.impactParamFm / 120) * 0.38;
        const rad = (s.ruth.thetaDeg * Math.PI) / 180;
        if (Math.abs(s.ruth.impactParamFm - lastImpact) > 0.1) {
          lastImpact = s.ruth.impactParamFm;
          const pts = [
            V(-1.35, bY, 0),
            V(-0.55, bY, 0),
            V(-0.12, bY + 0.04, 0),
            V(Math.cos(rad) * 0.65, bY + Math.sin(rad) * 0.38, Math.sin(rad) * 0.55),
            V(Math.cos(rad) * 1.32, bY + Math.sin(rad) * 0.52, Math.sin(rad) * 1.15),
          ];
          trajTube.setPoints(pts);
          flashSpot.position.set(Math.cos(rad) * 1.32, bY * 0.4, Math.sin(rad) * 1.32);
        }
        // Alpha particle trajectory along scattering angle
        const u = ((s.t * 0.65) % 1);
        if (u < 0.5) {
          alphaBead.position.set(-1.35 + u * 2.45, bY, 0);
        } else {
          const d = (u - 0.5) * 2.6;
          alphaBead.position.set(Math.cos(rad) * d, bY + Math.sin(rad) * d * 0.4, Math.sin(rad) * d * 0.88);
        }
        // Update nucleon & electron counts
        nuc.setCounts(s.atom.Z, s.atom.N);
        for (let i = 0; i < eBeads.length; i++) {
          eBeads[i].visible = i < s.atom.e;
        }
        shell2.visible = s.atom.e > 2;
        // Scale mass-spec collector peaks with 35Cl / 37Cl abundances
        const h35 = Math.max(0.08, (s.iso.frac35Pct / 100) * 1.25);
        const h37 = Math.max(0.08, (s.iso.frac37Pct / 100) * 1.25);
        peak35.scale.y = h35;
        peak35.position.y = h35 / 2;
        peak37.scale.y = h37;
        peak37.position.y = h37 / 2;
        // Position weighted-average fulcrum between z = -0.42 (35 u) and z = +0.12 (37 u)
        const frac37 = s.iso.frac37Pct / 100;
        avgMarker.position.z = -0.42 + frac37 * (0.12 - -0.42);
      },
    };
  },
};
