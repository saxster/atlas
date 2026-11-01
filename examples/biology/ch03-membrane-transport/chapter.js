import { SUBJECT } from '../subject.js';
import {
  THREE, part, box, cyl, sphere, capsule,
  prims, buildBilayer, rbcGeo, studioGrid, playTone, V
} from '@saxster/atlas/bio_kit.js';
import * as M from './model.js';

export const PAGES = [
  {
    tab: 'Fick diffusion',
    fig: 'Figure 3.1 · 3D Brownian particle walk across a permeable bilayer & Fick relaxation',
    title: 'Diffusion & Dynamic Equilibrium',
    alt: '3D phospholipid bilayer with diffusing solute particles and exponential relaxation curve to 50/50 dynamic equilibrium.',
    cam: { target: [0, 1.35, 0], az: 24, el: 20, dist: 7.4 },
    lit: 'bilayer_gate',
    parts: ['bilayer_gate', 'fick_curve'],
    look: { xray: 0, section: 0 },
  },
  {
    tab: 'Aquaporin & Ψ',
    fig: 'Figure 3.2 · Agre’s aquaporin-1 hourglass water channel & water potential Ψ = Ψ_s + Ψ_p',
    title: 'Aquaporin Water Gate',
    alt: '3D hourglass aquaporin channel embedded in a lipid bilayer passing a single-file chain of water molecules while excluding hydrated ions.',
    cam: { target: [14, 1.35, 0], az: -22, el: 20, dist: 6.8 },
    lit: 'aquaporin_pore',
    parts: ['aquaporin_pore', 'single_file_water'],
    look: { xray: 0.25, section: 0 },
  },
  {
    tab: 'Osmosis in cells',
    fig: 'Figure 3.3 · 3D RBC (lysed, biconcave, crenated) vs Plant Cell (turgid, flaccid, plasmolysed)',
    title: 'Osmosis in Animal & Plant Cells',
    alt: 'Side-by-side 3D comparison of a wall-less red blood cell and a cellulose-walled plant cell responding to external salt molarity.',
    cam: { target: [28, 1.35, 0], az: 20, el: 22, dist: 7.4 },
    lit: 'plant_osmosis',
    parts: ['rbc_osmosis', 'plant_osmosis'],
    look: { xray: 0.22, section: 0 },
  },
  {
    tab: 'Active ATPase pump',
    fig: 'Figure 3.4 · Skou’s ATP-driven conformational carrier pump in a root hair membrane',
    title: 'Active Transport Against the Gradient',
    alt: '3D conformational carrier protein hydrolyzed by ATP to pump mineral ions uphill from dilute soil into a root hair cell.',
    cam: { target: [42, 1.35, 0], az: 26, el: 20, dist: 7.2 },
    lit: 'atpase_carrier',
    parts: ['atpase_carrier', 'atp_site'],
    look: { xray: 0.15, section: 0 },
  },
];

export const PLATES = {
  bilayer_gate: {
    text: 'Selectively permeable phospholipid bilayer: random thermal motion drives net flux J = −D(ΔC/Δx) until left/right crossings balance at 50/50 dynamic equilibrium.',
    facts: s => [['Left', `${(s.fick.fracLeft * 100).toFixed(1)}%`], ['Right', `${(s.fick.fracRight * 100).toFixed(1)}%`]],
  },
  fick_curve: {
    text: 'Exponential relaxation curve N_L(t)/N = ½(1 + e^{−2kt}): steep initial net flux flattens to zero net change even while individual molecules keep crossing.',
  },
  aquaporin_pore: {
    text: 'Peter Agre’s aquaporin-1 tetramer: a 0.28 nm hourglass selectivity filter lined with NPA asparagine motifs that reorient water dipoles and block protons (H₃O⁺) and hydrated Na⁺.',
  },
  single_file_water: {
    text: 'Single-file stream of H₂O molecules marching down the water potential gradient Ψ = Ψ_s + Ψ_p at ~3 × 10⁹ molecules per second.',
  },
  rbc_osmosis: {
    text: 'Animal red blood cell lacks a cell wall: swells and lyses in hypotonic water, stays biconcave in 0.15 M isotonic saline, and shrivels (crenates) in hypertonic brine.',
  },
  plant_osmosis: {
    text: 'Walled plant cell: inelastic cellulose wall builds positive turgor pressure Ψ_p in pure water; in hypertonic brine the protoplast peels away from the wall (plasmolysis).',
    facts: s => [['RBC', s.wp.rbcState], ['Plant', s.wp.plantState]],
  },
  atpase_carrier: {
    text: 'Jens Christian Skou’s conformational ion pump: switches between E₁ (high affinity facing dilute soil) and phosphorylated E₂ (releasing ions inside the root hair against a 10× gradient).',
    facts: s => [['Pump rate', `${s.pump.vPump.toFixed(0)}% V_max`], ['Uphill ΔG', `+${s.pump.deltaGKj.toFixed(1)} kJ/mol`]],
  },
  atp_site: {
    text: 'Cytoplasmic ATP-binding domain: without O₂ and respiratory ATP (or in cyanide/waterlogged soil), active uptake halts and only passive diffusion remains.',
  },
};

export const CHAPTER = {
  subject: SUBJECT,
  no: 3,
  PAGES,
  PLATES,
  clock0: 0,
  cuts: true,
  xrayKeys: ['aquaporin_pore', 'plant_osmosis'],
  cutKeys: ['aquaporin_pore', 'plant_osmosis', 'atpase_carrier'],
  cutPlane: [0, 0, -1, 0.05],
  defaultParams: { extMolarity: 0.15, permRate: 0.4, atpLevel: 3.0 },
  controls: [
    { id: 'extMolarity', label: 'External salt concentration', min: 0.0, max: 0.45, step: 0.05, value: 0.15, unit: 'M' },
    { id: 'permRate', label: 'Membrane permeability k', min: 0.1, max: 0.9, step: 0.1, value: 0.4, unit: 's⁻¹' },
    { id: 'atpLevel', label: 'Cellular ATP supply', min: 0.0, max: 5.0, step: 0.5, value: 3.0, unit: 'mM' },
  ],
  lessons: {
    'ch03-diffusion-3d': { page: 0, params: { permRate: 0.5 } },
    'ch03-aquaporin-3d': { page: 1, params: { extMolarity: 0.05 } },
    'ch03-osmosis-cells-3d': { page: 2, params: { extMolarity: 0.35 } },
    'ch03-active-root-3d': { page: 3, params: { atpLevel: 3.5 } },
  },
  sonify(ctx, s, page) {
    if (page === 3) playTone(ctx, { freq: 140 + s.pump.vPump * 3.2, dur: 0.06, type: 'square', gain: 0.025 });
    else playTone(ctx, { freq: 280 + s.fick.fracLeft * 200, dur: 0.05, type: 'sine', gain: 0.03 });
  },
  state(clock, reduced) {
    const p = CHAPTER.params || CHAPTER.defaultParams;
    const t = reduced ? 2.0 : clock;
    const fick = M.fickRelaxation(t % 10, p.permRate, 80);
    const turgor = Math.max(0, 0.55 - p.extMolarity * 1.6);
    const wp = M.waterPotentialAccount(p.extMolarity, turgor);
    const pump = M.activePumpFlux(p.atpLevel, 0.5, 10);
    return { t, fick, wp, pump, extMolarity: p.extMolarity, permRate: p.permRate, atpLevel: p.atpLevel };
  },
  readout(s, page, pageIdx) {
    if (pageIdx === 0) {
      return `<b>Permeability k = ${s.permRate.toFixed(1)} s⁻¹</b> · Left chamber: <b>${(s.fick.fracLeft * 100).toFixed(1)}%</b> · Right chamber: <b>${(s.fick.fracRight * 100).toFixed(1)}%</b> · Relaxing exponentially to 50/50 equilibrium.`;
    }
    if (pageIdx === 1) {
      return `<b>Aquaporin-1 Channel</b> · External Ψ_s = ${s.wp.psiSoluteExt.toFixed(2)} MPa · Cell Ψ = ${s.wp.psiCell.toFixed(2)} MPa · Net water drive ΔΨ = <b>${s.wp.netPsiDrive >= 0 ? '+' : ''}${s.wp.netPsiDrive.toFixed(2)} MPa</b>.`;
    }
    if (pageIdx === 2) {
      return `<b>External salt = ${s.extMolarity.toFixed(2)} M</b> · Animal RBC: <b>${s.wp.rbcState}</b> · Walled plant cell: <b>${s.wp.plantState}</b> (Ψ_p = ${s.wp.turgorMPa.toFixed(2)} MPa).`;
    }
    return `<b>ATP = ${s.atpLevel.toFixed(1)} mM</b> · Active carrier turnover = <b>${s.pump.vPump.toFixed(0)}% V_max</b> · ${s.pump.uphillPossible ? 'Pumping nitrate/K⁺ uphill against 10× gradient' : 'No ATP → active pump stalled'}.`;
  },
  buildWorld(E) {
    const { scene, asm } = E;
    const root = new THREE.Group();
    scene.add(root);
    studioGrid(root, { x0: -4, x1: 48 });
    const labels = [];
    const label = (cls, html, at, opts = {}) => labels.push({ cls, html, at, ...opts });

    // Station 0 (x = 0): Bilayer Diffusion + 3D Fick Relaxation Curve
    const gateAsm = asm('bilayer_gate', root, { title: 'Permeable lipid bilayer', sub: 'Brownian solute crossing' });
    gateAsm.position.set(-0.9, 0, 0);
    buildBilayer(gateAsm, { cols: 2, rows: 5, x0: 0, y0: 1.3, z0: 0 });
    const soluteCloud = prims.particles(gateAsm, { count: 48, r: 0.055, pal: 'blue' });

    const curveAsm = asm('fick_curve', root, { title: 'Fick relaxation curve', sub: 'N_L(t)/N → 0.5' });
    curveAsm.position.set(0.6, 0.25, -0.3);
    const ax0 = prims.axes(curveAsm, { x: [0, 10], y: [0, 1], size: [2.0, 1.7, 0.6] });
    const plot0 = prims.plot(ax0, x => M.fickRelaxation(x, 0.4).fracLeft, { samples: 40, pal: 'red', r: 0.03 });
    label('board', 'Lipid bilayer', () => V(-0.9, 2.35, 0));
    label('board', 'N_L(t)/N → 0.5', () => V(1.6, 2.15, -0.3));

    // Station 1 (x = 14): Aquaporin Hourglass Channel
    const aqpAsm = asm('aquaporin_pore', root, { title: 'Aquaporin-1 hourglass pore', sub: '0.28 nm NPA selectivity filter' });
    aqpAsm.position.set(14, 1.35, 0);
    buildBilayer(aqpAsm, { cols: 7, rows: 3, x0: 0, y0: 0, z0: 0, skipCenter: true });
    part(aqpAsm, cyl(0.45, 0.55, 24, 0.24), { pal: 'blue', tone: 'hi', pos: [0, 0.3, 0], mat: shadeMat('blue', { opacity: 0.68 }), ex: [0, 0.45, 0], name: 'Upper vestibule' });
    part(aqpAsm, cyl(0.24, 0.55, 24, 0.45), { pal: 'blue', tone: 'hi', pos: [0, -0.3, 0], mat: shadeMat('blue', { opacity: 0.68 }), ex: [0, -0.45, 0], name: 'Lower vestibule' });

    const h2oAsm = asm('single_file_water', root, { title: 'Single-file H₂O stream', sub: '3 × 10⁹ molecules/s' });
    h2oAsm.position.set(14, 1.35, 0);
    const h2oSpheres = [];
    for (let i = 0; i < 7; i++) {
      h2oSpheres.push(part(h2oAsm, sphere(0.085, 16), { pal: 'red', tone: 'lit', pos: [0, (i - 3) * 0.24, 0], ex: [0.35, 0, 0], name: 'Water molecule' }));
    }
    label('board', 'Aquaporin-1 pore', () => V(14, 2.35, 0));

    // Station 2 (x = 28): RBC vs Walled Plant Cell Osmosis
    const rbcAsm = asm('rbc_osmosis', root, { title: 'Animal red blood cell', sub: 'No cell wall (lyses or crenates)' });
    rbcAsm.position.set(26.9, 1.35, 0);
    const rbcMesh = part(rbcAsm, rbcGeo(0.75, 0), { pal: 'red', tone: 'lit', rot: [0.4, 0, 0], ex: [-0.45, 0.3, 0], name: 'RBC membrane' });

    const plantAsm = asm('plant_osmosis', root, { title: 'Walled plant cell', sub: 'Cellulose wall & protoplast' });
    plantAsm.position.set(29.0, 1.35, 0);
    part(plantAsm, box(1.5, 1.5, 1.3, 0.08), { pal: 'green', tone: 'mid', mat: shadeMat('green', { opacity: 0.35 }), ex: [0, 0.45, 0], name: 'Rigid cellulose cell wall' });
    const vacuoleMesh = part(plantAsm, sphere(0.58, 24), { pal: 'blue', tone: 'hi', ex: [0.45, 0, 0], name: 'Protoplast & vacuole' });
    label('board', 'Animal RBC', () => V(26.9, 2.35, 0));
    label('board', 'Walled plant cell', () => V(29.0, 2.35, 0));

    // Station 3 (x = 42): Active Transport Carrier Pump
    const pumpAsm = asm('atpase_carrier', root, { title: 'Conformational ATPase carrier', sub: 'E₁ / E₂ alternating access' });
    pumpAsm.position.set(42, 1.35, 0);
    buildBilayer(pumpAsm, { cols: 7, rows: 3, x0: 0, y0: 0, z0: 0, skipCenter: true });
    const jawL = part(pumpAsm, capsule(0.18, 0.65, 8, 16), { pal: 'ochre', tone: 'lit', pos: [-0.2, 0, 0], ex: [-0.45, 0.3, 0], name: 'Carrier lobe A' });
    const jawR = part(pumpAsm, capsule(0.18, 0.65, 8, 16), { pal: 'ochre', tone: 'lit', pos: [0.2, 0, 0], ex: [0.45, 0.3, 0], name: 'Carrier lobe B' });
    const ionBall = part(pumpAsm, sphere(0.11, 16), { pal: 'green', tone: 'lit', pos: [0, 0, 0], name: 'Mineral ion (NO₃⁻ / K⁺)' });

    const atpSiteAsm = asm('atp_site', root, { title: 'ATP phosphorylation domain', sub: 'Couples 30.5 kJ/mol to conformational flip' });
    atpSiteAsm.position.set(42, 0.72, 0.25);
    const atpOrb = part(atpSiteAsm, sphere(0.14, 16), { pal: 'red', tone: 'lit', ex: [0, -0.4, 0.35], name: 'Bound ATP/Pi' });
    label('board', 'E₁/E₂ carrier pump', () => V(42, 2.35, 0));

    return {
      labels,
      update(s) {
        // Update solute cloud & Fick curve
        plot0.update(x => M.fickRelaxation(x, s.permRate).fracLeft);
        const pts = [];
        for (let i = 0; i < 48; i++) {
          const isLeft = i < Math.round(48 * s.fick.fracLeft);
          const side = isLeft ? -1 : 1;
          const x = side * (0.18 + 0.95 * ((i * 0.618 + s.t * 0.15) % 1));
          const y = 0.4 + 1.7 * (((i * 0.382) + 0.08 * Math.sin(s.t + i)) % 1);
          const z = -0.6 + 1.2 * ((i * 0.27) % 1);
          pts.push([x, y, z]);
        }
        soluteCloud.set(pts);

        // Single-file water motion in Aquaporin
        const dir = s.wp.netPsiDrive >= 0 ? 1 : -1;
        h2oSpheres.forEach((m, idx) => {
          const u = ((idx / 7) + dir * s.t * 0.25 + 10) % 1;
          m.position.y = (u - 0.5) * 1.65;
        });

        // Osmotic swelling / shrinkage of RBC and plant vacuole
        const swell = Math.max(0.48, Math.min(1.38, 1.25 - s.extMolarity * 1.65));
        rbcMesh.scale.set(swell, swell * (s.extMolarity < 0.08 ? 1.45 : 1), swell);
        vacuoleMesh.scale.setScalar(swell);

        // Active transport carrier rocking
        const rock = s.pump.uphillPossible ? Math.sin(s.t * (1.2 + s.pump.vPump * 0.03)) * 0.32 : -0.25;
        jawL.rotation.z = rock;
        jawR.rotation.z = -rock;
        ionBall.position.y = Math.sin(s.t * (1.2 + s.pump.vPump * 0.03)) * 0.48;
        atpOrb.visible = s.pump.uphillPossible;
      },
    };
  },
};
