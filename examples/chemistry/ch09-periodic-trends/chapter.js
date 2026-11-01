import { SUBJECT } from '../subject.js';
import {
  THREE, shadeMat, part, box, cyl, sphere, rod, arrow3,
  studioGrid, playTone, V
} from '@saxster/atlas/chem_kit.js';
import * as M from './model.js';

export const PAGES = [
  {
    tab: 'Shielding & Z_eff',
    fig: 'Figure 9.1 · Core electron shielding (σ) and effective nuclear charge (Z_eff = Z − σ) across Period 2',
    title: 'Core Shielding & Effective Nuclear Charge',
    alt: '3D nucleus surrounded by an inner 1s core shielding shell and n=2 valence electrons pulled inward as Zeff increases.',
    cam: { target: [0, 1.35, 0], az: 22, el: 20, dist: 6.8 },
    lit: 'valence_shell',
    parts: ['core_shield', 'valence_shell'],
    look: { xray: 0.25, section: 0 },
  },
  {
    tab: 'Atomic radii skyline',
    fig: 'Figure 9.2 · 3D periodic skyline of atomic radii across Period 2 (Li → Ne) as Z_eff increases',
    title: 'Periodic Contraction of Atomic Radius',
    alt: '3D row of Period 2 atoms from Li (152 pm) down to Ne (58 pm) contracting as effective nuclear charge rises.',
    cam: { target: [14, 1.35, 0], az: -18, el: 22, dist: 7.2 },
    lit: 'radii_row',
    parts: ['radii_row', 'zeff_ramp'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Ionization energy jump',
    fig: 'Figure 9.3 · First ionization energy (IE₁) trend & the giant core-shell jump in IE₂ for Li',
    title: 'First & Core-Shell Ionization Energies',
    alt: '3D ionization energy pillars across Period 2 alongside the huge energy cliff when removing a 1s core electron.',
    cam: { target: [28, 1.35, 0], az: 24, el: 20, dist: 7.2 },
    lit: 'ie_pillars',
    parts: ['ie_pillars', 'core_cliff'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Emission spectra',
    fig: 'Figure 9.4 · Quantized electronic energy levels (n = 1 … 5) & discrete photon emission (ΔE = hc/λ)',
    title: 'Quantized Levels & Emission Spectra',
    alt: '3D electronic energy ladder with downward transition arrow emitting a quantized photon wave of wavelength hc/Delta E.',
    cam: { target: [42, 1.35, 0], az: 22, el: 20, dist: 6.8 },
    lit: 'energy_rungs',
    parts: ['energy_rungs', 'emitted_photon'],
    look: { xray: 0, section: 0 },
  },
];

export const PLATES = {
  core_shield: {
    text: 'Inner 1s² core electron cloud (2 electrons): sits close to the +Ze nucleus and partially screens outer n = 2 valence electrons from the full nuclear attraction.',
    facts: s => [['Element', `${s.tr.sym} (Z = ${s.tr.z})`], ['Core shielding σ', `${s.tr.sigma.toFixed(2)}`], ['Z_eff = Z − σ', `+${s.tr.zEff.toFixed(2)}`]],
  },
  valence_shell: {
    text: 'Outer n = 2 valence shell: adding protons and electrons within the same shell increases Z faster than σ, raising Z_eff and pulling the shell closer.',
    facts: s => [['Valence e⁻', `${s.tr.valenceElectrons}`], ['Atomic radius', `${s.tr.radiusPm} pm`]],
  },
  radii_row: {
    text: 'Period 2 atomic radii (Li 152 pm → Ne 58 pm): atoms shrink from left to right across a period because higher Z_eff draws the same principal shell n inward.',
  },
  zeff_ramp: {
    text: 'Rising Z_eff foundation (+1.30 for Li up to +5.85 for Ne): electrostatic Coulomb attraction F ∝ Z_eff / r² governs periodic size and ionization trends.',
  },
  ie_pillars: {
    text: 'First ionization energy IE₁ (energy required to remove the most loosely held electron): rises across Period 2 with small subshell/pairing dips at B (2p¹) and O (2p⁴).',
    facts: s => [['IE₁ (${s.tr.sym})', `${s.tr.ie1Kj} kJ/mol`], ['IE₂ (${s.tr.sym}⁺)', `${s.tr.ie2Kj} kJ/mol`]],
  },
  core_cliff: {
    text: 'Successive ionization jump: for Li (1s² 2s¹), IE₁ = 520 kJ/mol removes the shielded 2s¹ electron, whereas IE₂ = 7298 kJ/mol must pull an electron out of the close, unshielded n = 1 core shell.',
  },
  energy_rungs: {
    text: 'Quantized electronic energy levels (E_n = −13.6 eV / n²): electrons occupy only discrete energy states; transitions between rungs absorb or emit exact energy differences ΔE.',
  },
  emitted_photon: {
    text: 'Emitted photon (ΔE = hν = hc/λ): discrete spectral lines provide direct experimental evidence for quantized atomic energy levels.',
    facts: s => [['Transition', `n = ${s.sp.nUpper} → ${s.sp.nLower}`], ['ΔE', `${s.sp.deltaEeV.toFixed(2)} eV`], ['Wavelength λ', `${s.sp.wavelengthNm.toFixed(1)} nm (${s.sp.band})`]],
  },
};

export const CHAPTER = {
  subject: SUBJECT,
  no: 9,
  PAGES,
  PLATES,
  clock0: 0,
  cuts: true,
  xrayKeys: ['valence_shell', 'core_shield'],
  cutKeys: ['valence_shell'],
  cutPlane: [0, 0, -1, 0.05],
  defaultParams: { atomicZ: 6, nUpper: 3 },
  controls: [
    { id: 'atomicZ', label: 'Period 2 atomic number Z (Li=3 … Ne=10)', min: 3, max: 10, step: 1, value: 6, unit: 'Z' },
    { id: 'nUpper', label: 'Upper quantum level n_high (→ n=2 Balmer)', min: 3, max: 6, step: 1, value: 3, unit: 'n' },
  ],
  lessons: {
    'effective-nuclear-charge': { page: 0, params: { atomicZ: 6 } },
    'ionization-energy-trend': { page: 2, params: { atomicZ: 8 } },
    's9-1': { page: 0, params: { atomicZ: 6 } },
    's9-2': { page: 1, params: { atomicZ: 7 } },
    's9-3': { page: 2, params: { atomicZ: 8 } },
    's9-4': { page: 3, params: { nUpper: 3 } },
  },
  sensor: { type: 'light', label: 'Drive quantum transition with ambient light', param: 'nUpper', min: 3, max: 6 },
  sonify(ctx, s, page) {
    if (page === 3) playTone(ctx, { freq: 220 + s.sp.deltaEeV * 140, dur: 0.08, type: 'sine', gain: 0.035 });
    else playTone(ctx, { freq: 180 + s.tr.zEff * 70, dur: 0.07, type: 'triangle', gain: 0.03 });
  },
  state(clock, reduced) {
    const p = CHAPTER.params || CHAPTER.defaultParams;
    const t = reduced ? 0 : clock;
    const tr = M.period2TrendState(p.atomicZ);
    const sp = M.hydrogenLineSpectrum(p.nUpper, 2);
    return { t, tr, sp };
  },
  readout(s, page, pageIdx) {
    if (pageIdx === 0) {
      return `<b>${s.tr.sym} (Z = ${s.tr.z})</b> · Core 1s² shielding σ = <b>${s.tr.sigma.toFixed(2)}</b> → Effective nuclear charge Z_eff = <b>+${s.tr.zEff.toFixed(2)}</b> · Radius = <b>${s.tr.radiusPm} pm</b>.`;
    }
    if (pageIdx === 1) {
      return `<b>Period 2 Atomic Radius Skyline</b> · Selected: <b>${s.tr.sym} (${s.tr.radiusPm} pm, Z_eff = +${s.tr.zEff.toFixed(2)})</b> · Higher Z_eff pulls the n = 2 shell closer across the period.`;
    }
    if (pageIdx === 2) {
      return `<b>Ionization Energies (${s.tr.sym})</b> · First IE₁ = <b>${s.tr.ie1Kj} kJ/mol</b> · Second IE₂ = <b>${s.tr.ie2Kj} kJ/mol</b> (removing an inner 1s core electron from Li⁺ costs 7298 kJ/mol!).`;
    }
    return `<b>Balmer Emission (n = ${s.sp.nUpper} → 2)</b> · Photon energy ΔE = <b>${s.sp.deltaEeV.toFixed(2)} eV</b> · Wavelength λ = <b>${s.sp.wavelengthNm.toFixed(1)} nm</b> (${s.sp.band}).`;
  },
  buildWorld(E) {
    const { scene, asm } = E;
    const root = new THREE.Group();
    scene.add(root);
    studioGrid(root, { x0: -4, x1: 48 });
    const labels = [];
    const label = (cls, html, at, opts = {}) => labels.push({ cls, html, at, ...opts });

    // Station 0 (x = 0): Core Shielding & Zeff
    const coreAsm = asm('core_shield', root, { title: 'Nucleus (+Ze) & 1s² core shield', sub: 'Screens outer valence shell' });
    coreAsm.position.set(0, 1.35, 0);
    part(coreAsm, sphere(0.22, 20), { pal: 'red', tone: 'hi', ex: [0, 0.35, 0], name: 'Atomic nucleus (+Ze)' });
    part(coreAsm, sphere(0.52, 24), { pal: 'ochre', tone: 'mid', mat: shadeMat('ochre', { opacity: 0.38 }), ex: [0, -0.35, 0], name: 'Inner 1s² shielding shell' });

    const valAsm = asm('valence_shell', root, { title: 'n = 2 valence shell', sub: 'Pulled inward by Z_eff = Z − σ' });
    valAsm.position.set(0, 1.35, 0);
    const valSphere = part(valAsm, sphere(1.05, 28), { pal: 'blue', tone: 'lit', mat: shadeMat('blue', { opacity: 0.22 }), ex: [0, 0.45, 0], name: 'n = 2 valence cloud' });
    label('board', '1s² core shield (σ)', () => V(0, 2.55, 0));
    label('board', 'Valence shell (r ∝ 1/Z_eff)', () => V(1.15, 0.55, 0));

    // Station 1 (x = 14): Period 2 Atomic Radii Skyline
    const rowAsm = asm('radii_row', root, { title: 'Period 2 atomic radii (Li → Ne)', sub: '152 pm contracting to 58 pm' });
    rowAsm.position.set(14, 1.25, 0);
    const radSpheres = [];
    for (let z = 3; z <= 10; z++) {
      const st = M.period2TrendState(z);
      const r = (st.radiusPm / 152) * 0.34;
      const m = part(rowAsm, sphere(r, 18), { pal: 'blue', tone: 'hi', pos: [(z - 6.5) * 0.52, 0, 0], ex: [0, 0.45, 0], name: `${st.sym} (${st.radiusPm} pm)` });
      radSpheres.push({ mesh: m, z });
    }

    const rampAsm = asm('zeff_ramp', root, { title: 'Rising Z_eff base', sub: '+1.30 (Li) to +5.85 (Ne)' });
    rampAsm.position.set(14, 0.25, 0);
    part(rampAsm, box(3.9, 0.18, 0.65, 0.02), { pal: 'ochre', tone: 'hi', ex: [0, -0.25, 0], name: 'Z_eff trend ramp' });
    label('board', 'Li (152 pm) → Ne (58 pm)', () => V(14, 2.05, 0));

    // Station 2 (x = 28): First Ionization Energy & Core Cliff
    const ieAsm = asm('ie_pillars', root, { title: 'Period 2 IE₁ skyline', sub: '520 kJ/mol (Li) to 2081 kJ/mol (Ne)' });
    ieAsm.position.set(27.5, 0.1, 0);
    for (let z = 3; z <= 10; z++) {
      const st = M.period2TrendState(z);
      const h = (st.ie1Kj / 2081) * 1.65;
      part(ieAsm, box(0.24, h, 0.34, 0.02), { pal: z === 5 || z === 8 ? 'ochre' : 'green', tone: 'hi', pos: [(z - 6.5) * 0.34, h / 2, 0], ex: [0, 0.35, 0], name: `IE₁ ${st.sym} (${st.ie1Kj} kJ/mol)` });
    }

    const cliffAsm = asm('core_cliff', root, { title: 'Core-shell IE₂ jump (Li⁺)', sub: '7298 kJ/mol to remove 1s core e⁻' });
    cliffAsm.position.set(29.4, 0.1, 0);
    part(cliffAsm, box(0.42, 2.35, 0.42, 0.02), { pal: 'red', tone: 'hi', pos: [0, 1.175, 0], ex: [0.4, 0.4, 0], name: 'Core 1s ionization cliff' });
    label('board', 'IE₁ trend across Period 2', () => V(27.5, 2.0, 0));
    label('board', 'Core-shell jump (IE₂)', () => V(29.4, 2.65, 0));

    // Station 3 (x = 42): Quantized Energy Rungs & Emitted Photon
    const rungAsm = asm('energy_rungs', root, { title: 'Quantized energy rungs (n = 1 … 5)', sub: 'E_n = −13.6 eV / n²' });
    rungAsm.position.set(41.4, 0.2, 0);
    const rungY = [0.1, 0.95, 1.45, 1.75, 1.95];
    rungY.forEach((y, idx) => {
      part(rungAsm, box(1.25, 0.06, 0.36, 0.01), { pal: 'dark', tone: 'hi', pos: [0, y, 0], ex: [-0.35, 0, 0], name: `Quantum level n = ${idx + 1}` });
    });
    const transArr = arrow3(rungAsm, { r: 0.032, headR: 0.08, headL: 0.16, pal: 'red', tone: 'hi', name: 'Electronic transition ΔE' });
    transArr.set(V(0, 1.45, 0), V(0, 0.95, 0));

    const photAsm = asm('emitted_photon', root, { title: 'Emitted photon (hc/λ)', sub: 'Discrete spectral line' });
    photAsm.position.set(42.8, 1.25, 0);
    const photonSpheres = [];
    for (let i = 0; i < 8; i++) {
      const m = part(photAsm, sphere(0.075, 12), { pal: 'ochre', tone: 'lit', pos: [(i - 3.5) * 0.18, Math.sin(i) * 0.18, 0], ex: [0.4, 0, 0], name: 'Photon wave packet' });
      photonSpheres.push({ mesh: m, i });
    }
    label('board', 'Quantized levels (n)', () => V(41.4, 2.35, 0));
    label('board', 'Emitted photon (ΔE = hc/λ)', () => V(42.8, 1.85, 0));

    return {
      labels,
      update(s) {
        const rScale = (s.tr.radiusPm / 110);
        valSphere.scale.setScalar(rScale);
        for (const it of radSpheres) {
          it.mesh.position.y = it.z === s.tr.z ? 0.25 : 0;
        }
        const yTop = rungY[Math.min(4, s.sp.nUpper - 1)];
        transArr.set(V(0, yTop, 0), V(0, rungY[1], 0));
        for (const p of photonSpheres) {
          p.mesh.position.y = Math.sin(s.t * 4 + p.i * (s.sp.nUpper * 0.35)) * 0.22;
        }
      },
    };
  },
};
