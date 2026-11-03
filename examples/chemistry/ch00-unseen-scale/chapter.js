import { SUBJECT } from '../subject.js';
import {
  THREE, shadeMat, part, box, cyl, sphere, torus, rod, arrow3,
  buildMolecule3D, buildBeaker, buildCurveTube, studioGrid, playTone, V
} from '@saxster/atlas/chem_kit.js';
import * as M from './model.js';

export const PAGES = [
  {
    tab: 'Bench vs model',
    fig: 'Macroscopic bench observation versus inferred particle model',
    title: 'Observation vs Particle Inference',
    alt: '3D laboratory beaker with dissolving copper sulfate crystal paired with a submicroscopic magnifying lens showing water molecules hydrating ions.',
    cam: { target: [0, 1.25, 0], az: 22, el: 20, dist: 11.4 },
    lit: 'inference_lens',
    parts: ['bench_vessel', 'inference_lens', 'notation_placa'],
    look: { xray: 0.15, section: 0 },
  },
  {
    tab: 'Brownian motion',
    fig: 'Micrometre resin grain bombarded by unseen water molecules',
    title: 'Brownian Bombardment',
    alt: '3D micrometre grain tracing a jagged random-walk trajectory while jostled by surrounding water molecules whose thermal speeds scale with temperature.',
    cam: { target: [14, 1.3, 0], az: -20, el: 22, dist: 11.4 },
    lit: 'pollen_grain',
    parts: ['pollen_grain', 'water_bath'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Filtration sieve',
    fig: 'Pore-size separation: suspended sand retained while hydrated ions pass',
    title: 'Physical Separation by Scale',
    alt: '3D filter funnel and porous membrane retaining coarse suspended grains while tiny hydrated ions pass into the filtrate.',
    cam: { target: [28, 1.35, 0], az: 24, el: 18, dist: 11.6 },
    lit: 'filter_membrane',
    parts: ['filter_membrane', 'retained_grains', 'filtrate_ions'],
    look: { xray: 0.2, section: 0 },
  },
  {
    tab: 'Powers of ten',
    fig: 'Ten orders of magnitude from laboratory flask (10⁻¹ m) to covalent bond (10⁻¹⁰ m)',
    title: 'Powers-of-Ten Scale Ladder',
    alt: '3D logarithmic scale pillars stepping from a 10 cm flask down to a 0.1 nm water molecule and 1 fm atomic nucleus.',
    cam: { target: [42, 1.35, 0], az: 20, el: 20, dist: 12.0 },
    lit: 'scale_pillars',
    parts: ['scale_pillars', 'water_probe'],
    look: { xray: 0, section: 0 },
  },
];

export const PLATES = {
  bench_vessel: {
    text: 'Macroscopic laboratory beaker: what we directly observe with our senses and instruments (colour spread, temperature, mass on a balance).',
  },
  inference_lens: {
    text: 'Submicroscopic particle model: an explanatory model of molecules and ions used to account for macroscopic evidence—never a direct photograph.',
  },
  notation_placa: {
    text: 'Symbolic representation: formulas, state symbols (s, l, g, aq), and conservation equations that bookkeep the particle model.',
  },
  pollen_grain: {
    text: 'Visible micrometre grain (~1 µm): exhibits a jagged random walk (Perrin trace) that can be seen through an optical microscope.',
    facts: s => [
      ['RMS step (2 s)', `${s.br.rmsUm.toFixed(2)} µm`],
      ['D', `${(s.br.D * 1e12).toFixed(2)} µm²/s`],
      ['Span', `~${s.br.moleculesAcrossGrain} H₂O wide`],
    ],
  },
  water_bath: {
    text: 'Unseen water molecules (~0.28 nm): unequal thermal collisions from all sides produce the net fluctuating impulse on the grain.',
    facts: s => [['Bath T', `${s.br.tempK} K`], ['Collisions', `~${s.br.hitsPerMicrosec.toExponential(1)} /µs`]],
  },
  filter_membrane: {
    text: 'Cellulose filter membrane with ~200 nm pores: separates mixtures mechanically by particle size without breaking chemical bonds.',
    facts: s => [['Pore width', `${s.filt.poreNm} nm`], ['Size ratio', `${s.filt.selectivityRatio.toFixed(0)}×`]],
  },
  retained_grains: {
    text: 'Suspended insoluble grains (>1000 nm): too large to traverse the filter pores, remaining behind as the residue.',
  },
  filtrate_ions: {
    text: 'Dissolved hydrated ions (~0.38 nm): hundreds of times smaller than the filter pores, passing straight into the filtrate.',
  },
  scale_pillars: {
    text: 'Logarithmic powers-of-ten ladder: each step of 10³ (m → mm → µm → nm → pm) compresses a thousandfold change in length.',
    facts: s => [['Scale', `10^${s.sc.exp} m`], ['In nm', `${s.sc.nanometers.toExponential(1)} nm`], ['Regime', s.sc.regime]],
  },
  water_probe: {
    text: 'Reference H₂O molecule (O–H bond length 96 pm = 0.096 nm): bridges the nanometre molecular scale and picometre atomic scale.',
  },
};

export const CHAPTER = {
  subject: SUBJECT,
  no: 0,
  narrowZoom: 1.18,
  PAGES,
  PLATES,
  clock0: 0,
  cuts: true,
  xrayKeys: ['bench_vessel', 'filter_membrane'],
  cutKeys: ['bench_vessel', 'filter_membrane'],
  cutPlane: [0, 0, -1, 0.05],
  defaultParams: { tempK: 298, poreNm: 200, logMeters: -9 },
  controls: [
    { id: 'tempK', label: 'Water bath temperature', min: 275, max: 360, step: 5, value: 298, unit: 'K' },
    { id: 'poreNm', label: 'Filter pore diameter', min: 50, max: 500, step: 25, value: 200, unit: 'nm' },
    { id: 'logMeters', label: 'Scale exponent log₁₀(m)', min: -12, max: -1, step: 1, value: -9, unit: 'decades' },
  ],
  lessons: {
    'observation-inference': { page: 0, params: { tempK: 298 } },
    'scale-powers-of-ten': { page: 3, params: { logMeters: -10 } },
    's0-1': { page: 0, params: { tempK: 298 } },
    's0-2': { page: 1, params: { tempK: 325 } },
    's0-3': { page: 2, params: { poreNm: 200 } },
    's0-4': { page: 3, params: { logMeters: -10 } },
  },
  sensor: { type: 'mic', label: 'Drive thermal agitation with mic', param: 'tempK', min: 275, max: 360 },
  sonify(ctx, s, page) {
    if (page === 1) playTone(ctx, { freq: 180 + (s.br.tempK - 270) * 3.5, dur: 0.06, type: 'triangle', gain: 0.03 });
    else if (page === 3) playTone(ctx, { freq: 660 * Math.pow(1.08, s.sc.exp + 10), dur: 0.07, type: 'sine', gain: 0.03 });
    else playTone(ctx, { freq: 320, dur: 0.06, type: 'sine', gain: 0.025 });
  },
  state(clock, reduced) {
    const p = CHAPTER.params || CHAPTER.defaultParams;
    const t = reduced ? 0 : clock;
    const br = M.brownianState(p.tempK, 500, 0.00089, 2);
    const filt = M.filtrationState(p.poreNm);
    const sc = M.scaleBridge(p.logMeters);
    return { t, br, filt, sc };
  },
  readout(s, page, pageIdx) {
    if (pageIdx === 0) {
      return `<b>Observation vs Inference</b> · Bench evidence: blue colour diffuses through liquid · Model inference: unseen H₂O molecules (~0.28 nm) collide with and hydrate Cu²⁺ and SO₄²⁻ ions.`;
    }
    if (pageIdx === 1) {
      return `<b>Brownian Motion (T = ${s.br.tempK} K)</b> · Stokes–Einstein D = <b>${(s.br.D * 1e12).toFixed(2)} µm²/s</b> · 2 s RMS step = <b>${s.br.rmsUm.toFixed(2)} µm</b> (~${s.br.moleculesAcrossGrain} H₂O diameters across grain).`;
    }
    if (pageIdx === 2) {
      return `<b>Filtration Scale Sieve (Pore = ${s.filt.poreNm} nm)</b> · Suspended sand (2500 nm): <b>Retained</b> · Hydrated ion (0.38 nm): <b>Passes into filtrate</b> (${s.filt.selectivityRatio.toFixed(0)}× smaller).`;
    }
    return `<b>Scale Ladder (10^${s.sc.exp} m)</b> · ${s.sc.nanometers.toExponential(2)} nm = ${s.sc.picometers.toExponential(2)} pm · Regime: <b>${s.sc.regime}</b>.`;
  },
  buildWorld(E) {
    const { scene, asm } = E;
    const root = new THREE.Group();
    scene.add(root);
    studioGrid(root, { x0: -4, x1: 48 });
    const labels = [];
    const label = (cls, html, at, opts = {}) => labels.push({ cls, html, at, ...opts });

    // Station 0 (x = 0): Macroscopic Beaker vs Submicroscopic Inference Lens
    const benchAsm = asm('bench_vessel', root, { title: 'Laboratory beaker (Observation)', sub: 'Macroscopic bench evidence' });
    buildBeaker(benchAsm, { r: 0.78, h: 1.55, liquidRatio: 0.62, liquidPal: 'blue', pos: [-1.15, 0.1, 0], name: 'Bench beaker' });
    part(benchAsm, box(0.32, 0.22, 0.32, 0.03), { pal: 'blue', tone: 'lit', pos: [-1.15, 0.25, 0], ex: [0, 0.4, 0], name: 'Dissolving crystal' });

    const lensAsm = asm('inference_lens', root, { title: 'Particle zoom lens (Inference)', sub: 'Explanatory molecular model' });
    lensAsm.position.set(0.95, 1.25, 0);
    part(lensAsm, cyl(0.92, 0.12, 28, true), { pal: 'ochre', tone: 'hi', rot: [Math.PI / 2, 0, 0], ex: [0, 0, 0.45], name: 'Magnifying callout ring' });
    // Zoom callout projection struts linking macroscopic solution to submicroscopic lens
    const zoomTop = rod(lensAsm, { r: 0.014, pal: 'ochre', tone: 'mid', name: 'Magnification callout ray' });
    zoomTop.set(V(-1.75, -0.45, 0), V(-0.65, 0.62, 0));
    const zoomBot = rod(lensAsm, { r: 0.014, pal: 'ochre', tone: 'mid', name: 'Magnification callout ray' });
    zoomBot.set(V(-1.75, -0.65, 0), V(-0.65, -0.62, 0));
    buildMolecule3D(lensAsm, 'H2O', { scale: 0.36, pos: [-0.36, 0.26, 0] });
    buildMolecule3D(lensAsm, 'H2O', { scale: 0.36, pos: [0.38, -0.22, 0], rot: [0, 0, 1.2] });
    buildMolecule3D(lensAsm, 'H2O', { scale: 0.34, pos: [-0.28, -0.32, 0.18], rot: [0.4, 0.8, -0.6] });
    part(lensAsm, sphere(0.18, 20), { pal: 'blue', tone: 'lit', pos: [0, 0.02, 0], ex: [0, 0.3, 0.3], name: 'Hydrated Cu²⁺ ion (model)' });

    const notAsm = asm('notation_placa', root, { title: 'Symbolic notation ledger', sub: 'CuSO₄(s) → Cu²⁺(aq) + SO₄²⁻(aq)' });
    notAsm.position.set(0, 0.18, 1.15);
    part(notAsm, box(1.9, 0.24, 0.12, 0.02), { pal: 'paper', tone: 'hi', ex: [0, -0.25, 0.4], name: 'Symbolic equation plate' });
    label('board', 'Observed: blue solution', () => V(-1.15, 2.05, 0));
    label('board', 'Inferred: H₂O + Cu²⁺(aq)', () => V(0.95, 2.32, 0));

    // Station 1 (x = 14): Brownian Motion + Perrin Random-Walk Trail + Collision Force Arrows
    const pollenAsm = asm('pollen_grain', root, { title: 'Resin grain (~1 µm)', sub: 'Visible under microscope' });
    pollenAsm.position.set(14, 1.25, 0);
    const pollenMesh = part(pollenAsm, sphere(0.52, 28), { pal: 'ochre', tone: 'lit', ex: [0, 0.55, 0], name: 'Resin grain' });
    // Perrin random-walk trajectory tube behind the grain
    const perrinPts = [
      V(-0.85, -0.42, -0.25), V(-0.55, 0.28, -0.18), V(-0.68, 0.52, 0.12),
      V(-0.22, 0.18, 0.28), V(-0.35, -0.32, 0.15), V(0.12, -0.45, -0.12),
      V(0.38, 0.15, -0.22), V(0.0, 0.0, 0.0),
    ];
    buildCurveTube(pollenAsm, perrinPts, { r: 0.02, pal: 'dark', tone: 'mid', segs: 40, name: 'Perrin 30-s step trace' });

    const bathAsm = asm('water_bath', root, { title: 'Thermal water molecules', sub: 'Unseen molecular collisions' });
    bathAsm.position.set(14, 1.25, 0);
    const waterHitters = [];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const y = ((i % 3) - 1) * 0.42;
      const r0 = 1.05 + (i % 2) * 0.25;
      const m = buildMolecule3D(bathAsm, 'H2O', { scale: 0.24, pos: [Math.cos(a) * r0, y, Math.sin(a) * r0], rot: [a, i, 0] });
      waterHitters.push({ group: m.group, a, y, r0, phase: i * 0.9 });
    }
    const netKickArrow = arrow3(bathAsm, { r: 0.032, headR: 0.085, headL: 0.15, pal: 'red', name: 'Net thermal impulse' });
    netKickArrow.set(V(0, 0, 0), V(0.78, 0.35, 0.15));
    label('board', 'Perrin trace (evidence)', () => V(13.3, 2.15, 0));
    label('board', 'Unequal H₂O hits (model)', () => V(15.2, 0.65, 0));

    // Station 2 (x = 28): Filtration Sieve
    const memAsm = asm('filter_membrane', root, { title: 'Porous filter membrane', sub: 'Mechanical size sieve' });
    memAsm.position.set(28, 1.25, 0);
    part(memAsm, box(2.1, 0.08, 1.6, 0.02), { pal: 'paper', tone: 'mid', mat: shadeMat('paper', { opacity: 0.55 }), ex: [0, 0.2, 0], name: 'Filter mesh plane' });
    const poreRing = part(memAsm, torus(0.32, 0.028, 12, 28), { pal: 'blue', tone: 'hi', pos: [0, 0.05, 0], rot: [Math.PI / 2, 0, 0], name: 'Adjustable pore aperture' });
    for (let ix = -2; ix <= 2; ix++) {
      const r = rod(memAsm, { r: 0.02, pal: 'ochre', tone: 'mid', name: 'Cellulose fibre' });
      r.set(V(ix * 0.38, 0, -0.75), V(ix * 0.38, 0, 0.75));
    }

    const sandAsm = asm('retained_grains', root, { title: 'Retained sand residue', sub: 'Coarse suspended particles' });
    sandAsm.position.set(28, 1.65, 0);
    for (let i = 0; i < 4; i++) {
      part(sandAsm, sphere(0.28, 14), { pal: 'ochre', tone: 'hi', pos: [(i - 1.5) * 0.45, (i % 2) * 0.14, (i % 2 - 0.5) * 0.3], ex: [0, 0.55, 0], name: 'Suspended grain (2500 nm)' });
    }

    const ionAsm = asm('filtrate_ions', root, { title: 'Hydrated filtrate ions', sub: 'Pass through membrane pores' });
    ionAsm.position.set(28, 0.65, 0);
    const passIons = [];
    for (let i = 0; i < 6; i++) {
      const m = part(ionAsm, sphere(0.09, 14), { pal: i % 2 === 0 ? 'blue' : 'green', tone: 'lit', pos: [(i - 2.5) * 0.28, -0.1 * (i % 3), 0], ex: [0, -0.45, 0], name: 'Hydrated ion (0.38 nm)' });
      passIons.push({ mesh: m, i });
    }
    label('board', 'Sand retained (>1000 nm)', () => V(28, 2.22, 0));
    label('board', 'Ions pass (0.38 nm)', () => V(28, 0.22, 0.7));

    // Station 3 (x = 42): Powers-of-Ten Scale Ladder
    const scaleAsm = asm('scale_pillars', root, { title: 'Powers-of-ten scale pillars', sub: '10⁻¹ m flask to 10⁻¹² m atom' });
    scaleAsm.position.set(42, 0.1, 0);
    const pillarBars = [];
    const exps = [-1, -3, -6, -9, -10, -12];
    exps.forEach((eVal, idx) => {
      const h = 2.1 - idx * 0.28;
      const m = part(scaleAsm, box(0.38, h, 0.48, 0.03), {
        pal: idx === 3 || idx === 4 ? 'blue' : 'ochre',
        tone: 'hi',
        pos: [-1.4 + idx * 0.56, h / 2, 0],
        ex: [0, 0.3 + idx * 0.08, 0],
        name: `Scale 10^${eVal} m`,
      });
      pillarBars.push({ mesh: m, exp: eVal, baseH: h, x: -1.4 + idx * 0.56 });
    });
    const activePointer = arrow3(scaleAsm, { r: 0.032, headR: 0.09, headL: 0.16, pal: 'red', name: 'Active scale pointer' });

    const probeAsm = asm('water_probe', root, { title: 'Nanoscale H₂O reference', sub: '0.28 nm diameter (96 pm bond)' });
    probeAsm.position.set(42.5, 1.85, 0.45);
    const probeMol = buildMolecule3D(probeAsm, 'H2O', { scale: 0.42 });
    label('board', '10⁻¹ m → 10⁻¹² m ladder', () => V(41.4, 2.45, 0));
    label('board', 'H₂O (~0.28 nm)', () => V(42.8, 2.38, 0.45));

    return {
      labels,
      update(s) {
        const speed = (s.br.tempK - 260) / 40;
        const gx = Math.sin(s.t * 2.3 * speed) * 0.09;
        const gy = Math.cos(s.t * 1.9 * speed) * 0.08;
        const gz = Math.sin(s.t * 2.7 * speed) * 0.08;
        pollenMesh.position.set(gx, gy, gz);
        netKickArrow.set(V(gx, gy, gz), V(gx + Math.cos(s.t * 2.3) * 0.55 * speed, gy + Math.sin(s.t * 1.9) * 0.45 * speed, gz));
        for (const w of waterHitters) {
          const pulse = w.r0 - 0.18 * Math.abs(Math.sin(s.t * 3.2 * speed + w.phase));
          w.group.position.set(Math.cos(w.a) * pulse, w.y + 0.08 * Math.sin(s.t * 2 + w.phase), Math.sin(w.a) * pulse);
        }
        // Scale pore ring with poreNm (50..500 nm)
        const poreScale = 0.5 + (s.filt.poreNm / 500) * 0.85;
        poreRing.scale.set(poreScale, poreScale, 1);
        for (const p of passIons) {
          p.mesh.position.y = -0.35 + ((s.t * 0.5 + p.i * 0.18) % 0.7) * -1;
        }
        // Highlight closest scale pillar to s.sc.exp
        let bestBar = pillarBars[3];
        let bestDist = Infinity;
        for (const b of pillarBars) {
          const d = Math.abs(b.exp - s.sc.exp);
          if (d < bestDist) {
            bestDist = d;
            bestBar = b;
          }
          b.mesh.scale.y = d <= 1 ? 1.15 : 0.92;
          b.mesh.position.y = (b.baseH * b.mesh.scale.y) / 2;
        }
        activePointer.set(V(bestBar.x, bestBar.baseH * 1.15 + 0.52, 0), V(bestBar.x, bestBar.baseH * 1.15 + 0.08, 0));
        const scaleHighlight = Math.max(0.65, Math.min(1.45, 1 + (s.sc.exp + 9) * 0.05));
        probeMol.group.scale.setScalar(scaleHighlight);
      },
    };
  },
};
