import { SUBJECT } from '../subject.js';
import {
  THREE, part, box, cyl, sphere, capsule, torus, rod,
  prims, K, studioGrid, playTone, V
} from '@saxster/atlas/bio_kit.js';
import * as M from './model.js';

export const PAGES = [
  {
    tab: 'Thorax & alveolus',
    fig: 'Figure 8.1–8.3 · 3D Thoracic ribcage, doming diaphragm & capillary-wrapped alveolus',
    title: 'Boyle’s Law & Alveolar Exchange',
    alt: '3D ribcage and diaphragm dome expanding thoracic volume alongside a thin-walled alveolus wrapped in pulmonary capillaries.',
    cam: { target: [0, 1.35, 0], az: 24, el: 20, dist: 7.4 },
    lit: 'diaphragm_dome',
    parts: ['ribcage_bell', 'diaphragm_dome', 'alveolus_sac'],
    look: { xray: 0.25, section: 0 },
  },
  {
    tab: 'Harvey & double loop',
    fig: 'Figure 8.4–8.5 · Harvey’s one-way venous valves & figure-eight double circulation',
    title: 'Double Circulation & Venous Valves',
    alt: '3D figure-eight pulmonary (25 mmHg) and systemic (120 mmHg) circuits with one-way pocket valves inside a vein.',
    cam: { target: [14, 1.35, 0], az: -22, el: 22, dist: 7.4 },
    lit: 'double_figure8',
    parts: ['double_figure8', 'venous_valve'],
    look: { xray: 0.15, section: 0 },
  },
  {
    tab: '3D Heart cutaway',
    fig: 'Figure 8.6 & 8.9 · 3D Four-chambered heart cutaway: thick LV wall, septum & valves',
    title: 'The Four-Chambered Double Pump',
    alt: '3D cutaway of the human heart showing right and left atria, thick left ventricle wall, interventricular septum, and one-way valves.',
    cam: { target: [28, 1.35, 0], az: 18, el: 20, dist: 7.2 },
    lit: 'left_ventricle',
    parts: ['right_ventricle', 'left_ventricle', 'septum_valves'],
    look: { xray: 0.22, section: 0 },
  },
  {
    tab: 'Vessels & 3D lever',
    fig: 'Figure 8.7–8.8 · Artery vs vein vs capillary walls & antagonistic biceps/triceps lever',
    title: 'Blood Vessels & Antagonistic Biomechanics',
    alt: '3D cross-sections of thick-walled artery, valved vein, and single-cell capillary alongside an interactive 3D biceps/triceps forearm lever.',
    cam: { target: [42, 1.35, 0], az: 24, el: 20, dist: 7.6 },
    lit: 'arm_linkage',
    parts: ['vessel_trio', 'arm_linkage'],
    look: { xray: 0, section: 0 },
  },
];

export const PLATES = {
  ribcage_bell: {
    text: 'External intercostal muscles swing the ribs up and out while ciliated goblet epithelium sweeps trapped dust upward on the mucociliary escalator.',
  },
  diaphragm_dome: {
    text: 'Muscular diaphragm sheet: contracts downward to increase thoracic volume V, dropping alveolar pressure P below atmospheric (Boyle’s law P₁V₁ = P₂V₂) so air rushes in.',
    facts: s => [['V_lung', `${s.boyle.volL.toFixed(2)} L`], ['ΔP_alv', `${s.boyle.pAlveolarMmHg.toFixed(1)} mmHg`]],
  },
  alveolus_sac: {
    text: '300 million moist, one-cell-thick (0.5 µm) squamous alveoli wrapped in a dense capillary basket—maximising Fick’s diffusion area A and minimising barrier thickness Δx.',
  },
  double_figure8: {
    text: 'Mammalian figure-eight double circulation: right heart sends deoxygenated blood at gentle pressure (25/8 mmHg) to protect delicate alveolar capillaries; left heart re-boosts oxygenated blood to 120/80 mmHg for the whole body.',
  },
  venous_valve: {
    text: 'William Harvey’s 1628 proof: semilunar pocket valves inside veins open toward the heart and snap shut against backflow when pressed distally.',
  },
  right_ventricle: {
    text: 'Crescentic right atrium and right ventricle with a thinner muscular wall (~4–5 mm), pumping across the short, low-resistance pulmonary circuit.',
  },
  left_ventricle: {
    text: 'Thick-walled (~12–15 mm, 3× RV) muscular left ventricle that generates 120 mmHg systolic pressure to perfuse brain, kidneys, and skeletal muscle.',
    facts: s => [['CO', `${s.dp.coLPerMin.toFixed(2)} L/min`], ['Sys / Pulm', `${s.dp.sysPeakMmHg} / ${s.dp.pulmPeakMmHg.toFixed(0)} mmHg`]],
  },
  septum_valves: {
    text: 'Muscular interventricular septum separating oxygenated and deoxygenated blood, plus AV (tricuspid/mitral) and semilunar (pulmonary/aortic) valves preventing regurgitation.',
  },
  vessel_trio: {
    text: 'Artery (narrow lumen, thick elastic & smooth-muscle wall withstanding 120 mmHg surges), Vein (wide lumen, thin wall, one-way pocket valves), and Capillary (single endothelial cell wall for tissue exchange).',
  },
  arm_linkage: {
    text: 'Antagonistic muscles pull only—never push: biceps brachii contracts (while triceps relaxes) across a 4 cm insertion lever arm to lift a load at 32 cm (8× force amplification by triceps/biceps).',
    facts: s => [['Elbow θ', `${s.lev.elbowDeg}°`], ['Biceps pull', `${s.lev.bicepTensionN.toFixed(0)} N`]],
  },
};

export const CHAPTER = {
  subject: SUBJECT,
  no: 8,
  PAGES,
  PLATES,
  clock0: 0,
  cuts: true,
  xrayKeys: ['ribcage_bell', 'right_ventricle'],
  cutKeys: ['ribcage_bell', 'right_ventricle', 'left_ventricle'],
  cutPlane: [0, 0, -1, 0.05],
  defaultParams: { heartRateBpm: 72, vsdShuntPct: 0, elbowDeg: 85 },
  controls: [
    { id: 'heartRateBpm', label: 'Heart rate', min: 45, max: 160, step: 5, value: 72, unit: 'bpm' },
    { id: 'vsdShuntPct', label: 'Septal defect shunt (VSD)', min: 0, max: 50, step: 5, value: 0, unit: '%' },
    { id: 'elbowDeg', label: 'Forearm elbow angle θ', min: 35, max: 145, step: 5, value: 85, unit: '°' },
  ],
  sensor: { type: 'mic', label: 'Use mic breath sensor', param: 'heartRateBpm', min: 55, max: 155 },
  lessons: {
    'ch08-airway-alveoli-3d': { page: 0 },
    'ch08-harvey-double-3d': { page: 1 },
    'ch08-heart-vsd-3d': { page: 2, params: { heartRateBpm: 80, vsdShuntPct: 25 } },
    'ch08-vessels-lever-3d': { page: 3, params: { elbowDeg: 75 } },
  },
  sonify(ctx, s, page) {
    // Lub-dub cardiac transient
    playTone(ctx, { freq: 75, dur: 0.055, type: 'triangle', gain: 0.045, slideTo: 48 });
    setTimeout(() => playTone(ctx, { freq: 105, dur: 0.045, type: 'triangle', gain: 0.035, slideTo: 65 }), 110);
  },
  state(clock, reduced) {
    const p = CHAPTER.params || CHAPTER.defaultParams;
    const t = reduced ? 1.2 : clock;
    const boyle = M.thoracicBoyleAccount(t * 2.1, 0.5, 2.5);
    const dp = M.doublePumpAccount(p.heartRateBpm, 70, p.vsdShuntPct);
    const lev = M.bicepLeverAccount(p.elbowDeg, 40);
    return { t, boyle, dp, lev, heartRateBpm: p.heartRateBpm, vsdShuntPct: p.vsdShuntPct, elbowDeg: p.elbowDeg };
  },
  readout(s, page, pageIdx) {
    if (pageIdx === 0) {
      return `<b>Thoracic Boyle’s Law</b> · Lung volume = <b>${s.boyle.volL.toFixed(2)} L</b> · Alveolar ΔP = <b>${s.boyle.pAlveolarMmHg >= 0 ? '+' : ''}${s.boyle.pAlveolarMmHg.toFixed(1)} mmHg</b> (${s.boyle.inspiring ? 'Inspiration' : 'Expiration'}).`;
    }
    if (pageIdx === 1) {
      return `<b>Double Circulation & Harvey’s Valves</b> · Pulmonary loop: 25/8 mmHg · Systemic loop: 120/80 mmHg · Venous pocket valves enforce one-way return.`;
    }
    if (pageIdx === 2) {
      return `<b>HR = ${s.heartRateBpm} bpm · Cardiac output = ${s.dp.coLPerMin.toFixed(2)} L/min</b> · LV/RV wall ratio = 3:1 · VSD shunt = ${s.vsdShuntPct}% (Pulm peak = ${s.dp.pulmPeakMmHg.toFixed(0)} mmHg, O₂ sat = ${s.dp.systemicO2SatPct.toFixed(1)}%).`;
    }
    return `<b>Vessel Mechanics & Antagonistic Lever</b> · Elbow θ = ${s.elbowDeg}° · Hand load = 40 N (at 32 cm) → Biceps tension = <b>${s.lev.bicepTensionN.toFixed(0)} N</b> (at 4 cm insertion).`;
  },
  buildWorld(E) {
    const { scene, asm } = E;
    const root = new THREE.Group();
    scene.add(root);
    studioGrid(root, { x0: -4, x1: 48 });
    const labels = [];
    const label = (cls, html, at, opts = {}) => labels.push({ cls, html, at, ...opts });

    // Station 0 (x = 0): Thoracic Bell, Diaphragm Dome & Alveolus Sac
    const ribAsm = asm('ribcage_bell', root, { title: 'Thoracic ribcage bell', sub: 'Intercostal expansion' });
    ribAsm.position.set(-0.9, 1.35, 0);
    part(ribAsm, cyl(0.75, 1.65, 24, 0.58), { pal: 'paper', tone: 'mid', mat: shadeMat('paper', { opacity: 0.38 }), ex: [0, 0.45, 0], name: 'Thoracic wall' });
    const lungL = part(ribAsm, capsule(0.24, 0.55, 10, 18), { pal: 'red', tone: 'hi', pos: [-0.26, 0.1, 0], ex: [-0.4, 0.2, 0], name: 'Left lung' });
    const lungR = part(ribAsm, capsule(0.24, 0.55, 10, 18), { pal: 'red', tone: 'hi', pos: [0.26, 0.1, 0], ex: [0.4, 0.2, 0], name: 'Right lung' });

    const diaAsm = asm('diaphragm_dome', root, { title: 'Muscular diaphragm dome', sub: 'Flattens on contraction' });
    diaAsm.position.set(-0.9, 0.65, 0);
    const diaMesh = part(diaAsm, sphere(0.72, 24), { pal: 'ochre', tone: 'lit', ex: [0, -0.45, 0], name: 'Diaphragm dome' });
    diaMesh.scale.set(1, 0.35, 1);

    const alvAsm = asm('alveolus_sac', root, { title: 'Alveolus & capillary basket', sub: '0.5 µm gas-exchange barrier' });
    alvAsm.position.set(1.15, 1.35, 0);
    part(alvAsm, sphere(0.58, 24), { pal: 'blue', tone: 'mid', mat: shadeMat('blue', { opacity: 0.45 }), ex: [0, 0.35, 0], name: 'Alveolar air sac' });
    for (let i = 0; i < 4; i++) {
      part(alvAsm, torus(0.61, 0.045, 10, 24), { pal: i < 2 ? 'red' : 'blue', tone: 'hi', rot: [i * 0.78, i * 0.5, 0], ex: [0.35, 0, 0], name: 'Pulmonary capillary loop' });
    }
    label('board', 'Thorax & diaphragm', () => V(-0.9, 2.4, 0));
    label('board', 'Alveolus + capillaries', () => V(1.15, 2.25, 0));

    // Station 1 (x = 14): Double Circulation Figure-8 & Venous Pocket Valve
    const fig8Asm = asm('double_figure8', root, { title: 'Figure-eight double circulation', sub: 'Pulmonary (top) & Systemic (bottom) loops' });
    fig8Asm.position.set(13.1, 1.35, 0);
    part(fig8Asm, torus(0.55, 0.08, 12, 28), { pal: 'blue', tone: 'hi', pos: [0, 0.52, 0], ex: [0, 0.35, 0], name: 'Pulmonary low-pressure loop' });
    part(fig8Asm, torus(0.72, 0.1, 12, 28), { pal: 'red', tone: 'lit', pos: [0, -0.35, 0], ex: [0, -0.35, 0], name: 'Systemic high-pressure loop' });

    const valveAsm = asm('venous_valve', root, { title: 'Harvey’s one-way venous valve', sub: 'Semilunar pocket cusps' });
    valveAsm.position.set(15.2, 1.35, 0);
    part(valveAsm, cyl(0.45, 1.5, 22), { pal: 'blue', tone: 'mid', mat: shadeMat('blue', { opacity: 0.4 }), name: 'Vein wall' });
    part(valveAsm, box(0.38, 0.42, 0.06, 0.02), { pal: 'ochre', tone: 'lit', pos: [-0.14, 0, 0], rot: [0, 0, -0.45], ex: [-0.35, 0.25, 0], name: 'Left valve cusp' });
    part(valveAsm, box(0.38, 0.42, 0.06, 0.02), { pal: 'ochre', tone: 'lit', pos: [0.14, 0, 0], rot: [0, 0, 0.45], ex: [0.35, 0.25, 0], name: 'Right valve cusp' });
    label('board', 'Figure-8 double loop', () => V(13.1, 2.35, 0));
    label('board', 'Venous valve cusps', () => V(15.2, 2.35, 0));

    // Station 2 (x = 28): 3D Four-Chambered Heart Cutaway
    const rvAsm = asm('right_ventricle', root, { title: 'Right atrium & right ventricle', sub: 'Deoxygenated pump to lungs (25 mmHg)' });
    rvAsm.position.set(27.55, 1.35, 0);
    const rvMesh = part(rvAsm, capsule(0.42, 0.65, 12, 20), { pal: 'blue', tone: 'hi', rot: [0, 0, 0.22], ex: [-0.55, 0, 0], name: 'Right heart chambers' });

    const lvAsm = asm('left_ventricle', root, { title: 'Thick-walled left ventricle & atrium', sub: 'Oxygenated systemic pump (120 mmHg)' });
    lvAsm.position.set(28.35, 1.35, 0);
    const lvMesh = part(lvAsm, capsule(0.54, 0.75, 12, 20), { pal: 'red', tone: 'lit', rot: [0, 0, -0.18], ex: [0.55, 0, 0], name: 'Thick-walled left ventricle' });

    const sepAsm = asm('septum_valves', root, { title: 'Interventricular septum & valves', sub: 'Separates O₂-rich and O₂-poor blood' });
    sepAsm.position.set(27.95, 1.35, 0);
    const sepWall = part(sepAsm, box(0.14, 1.25, 0.68, 0.03), { pal: 'ochre', tone: 'hi', ex: [0, 0.55, 0.35], name: 'Interventricular septum' });
    label('board', 'RV (25 mmHg)', () => V(27.3, 2.4, 0));
    label('board', 'Thick LV (120 mmHg)', () => V(28.6, 2.4, 0));

    // Station 3 (x = 42): Artery/Vein/Capillary Trio + Antagonistic Arm Lever
    const vesAsm = asm('vessel_trio', root, { title: 'Artery, Vein & Capillary walls', sub: 'Cross-sectional wall-to-lumen ratios' });
    vesAsm.position.set(40.7, 1.2, 0);
    part(vesAsm, torus(0.32, 0.14, 14, 24), { pal: 'red', tone: 'lit', pos: [-0.55, 0, 0], ex: [-0.35, 0.3, 0], name: 'Thick elastic artery' });
    part(vesAsm, torus(0.38, 0.055, 12, 24), { pal: 'blue', tone: 'hi', pos: [0.35, 0, 0], ex: [0.35, 0.3, 0], name: 'Wide thin-walled vein' });
    part(vesAsm, torus(0.14, 0.025, 10, 20), { pal: 'green', tone: 'hi', pos: [-0.1, 0.65, 0], ex: [0, 0.45, 0], name: 'One-cell capillary' });

    const armAsm = asm('arm_linkage', root, { title: 'Antagonistic biceps / triceps lever', sub: '3rd-class forearm linkage' });
    armAsm.position.set(42.8, 0.85, 0);
    const humerus = rod(armAsm, { r: 0.065, pal: 'paper', tone: 'hi', name: 'Humerus bone' });
    const radiusBone = rod(armAsm, { r: 0.055, pal: 'paper', tone: 'hi', name: 'Radius/ulna forearm' });
    const bicepBelly = rod(armAsm, { r: 0.085, pal: 'red', tone: 'lit', name: 'Biceps brachii flexor' });
    const tricepBelly = rod(armAsm, { r: 0.065, pal: 'ochre', tone: 'mid', name: 'Triceps brachii extensor' });
    const handWeight = part(armAsm, sphere(0.16, 16), { pal: 'ink', tone: 'lit', name: '40 N Hand load' });
    label('board', 'Artery · Vein · Capillary', () => V(40.7, 2.25, 0));
    label('board', 'Biceps / Triceps lever', () => V(43.2, 2.35, 0));

    return {
      labels,
      update(s) {
        // Breathing cycle
        const breath = (s.boyle.volL - 2.5) / 0.5;
        diaMesh.position.y = -breath * 0.22;
        const lScale = 0.92 + breath * 0.22;
        lungL.scale.setScalar(lScale);
        lungR.scale.setScalar(lScale);

        // Heartbeat systole/diastole pulse
        const beat = Math.pow(Math.max(0, Math.sin(s.t * (s.heartRateBpm / 60) * Math.PI * 2)), 4);
        const sysScale = 1 - beat * 0.14;
        rvMesh.scale.set(sysScale, 1 + beat * 0.06, sysScale);
        lvMesh.scale.set(sysScale, 1 + beat * 0.08, sysScale);
        sepWall.scale.y = 1 - (s.vsdShuntPct / 100) * 0.45;

        // Forearm lever kinematics
        const th = (s.elbowDeg * Math.PI) / 180;
        const elbow = V(0, 0, 0);
        const shoulder = V(0, 1.35, 0);
        const insertPt = V(0.24 * Math.sin(th), 0.24 * Math.cos(th), 0);
        const wrist = V(1.25 * Math.sin(th), 1.25 * Math.cos(th), 0);
        humerus.set(elbow, shoulder);
        radiusBone.set(elbow, wrist);
        bicepBelly.set(V(0.08, 1.2, 0), insertPt);
        tricepBelly.set(V(-0.14, 1.15, 0), V(-0.18 * Math.sin(th), -0.18 * Math.cos(th), 0));
        handWeight.position.copy(wrist);
      },
    };
  },
};
