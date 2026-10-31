// Four-stroke mechanical teardown as a machine: four 180° strokes (Intake, Compression, Power, Exhaust & explode),
// with Solid / X-ray / Section cutaway pills, technical leader callouts, and a draggable 2-link IK inspection arm.
import { buildWorld } from './world.js';
import * as M from './model.js';

const viewFront = { target: [0.12, 0.78, 0], az: 16, el: 14, dist: 6.4 };
const viewAngle = { target: [0.12, 0.78, 0], az: -24, el: 18, dist: 6.6 };
const viewClose = { target: [0.18, 0.82, 0], az: 28, el: 16, dist: 6.0 };
const viewExplode = { target: [0.12, 0.85, 0], az: -32, el: 22, dist: 7.4 };

export const FIGURE = {
  no: 5,
  title: 'Four-stroke teardown',
  question: 'How does one spinning crank drive a piston and time a four-stroke valve?',
  bigIdea: 'a slider-crank turns circular motion into reciprocating stroke s(θ) = R cos θ + √(L² − R² sin² θ), while a 14:28 spur gear pair halves the speed so the camshaft opens the intake valve once every two crank turns (720°).',
  cuts: ['solid', 'xray', 'section'],
  xrayKeys: ['block'],
  cutKeys: ['block'],
  cutPlane: [0, 0, -1, 0.02],
  intro: { cam: viewFront, lit: 'crank', look: { xray: 0.85 }, fig: 'Top dead centre (0°)' },
  lookKeys: ['ex'],
  STEPS: [
    {
      label: 'Intake (0° → 180°)',
      fig: 'Intake stroke · valve open',
      run: 1,
      play: 2.8,
      real: M.CYCLE_REAL_S / 4,
      cam: viewFront,
      lit: 'valve',
      look: { section: 1, ex: 0 },
      hint: 'The cam lobe pushes the intake valve down against its coil spring while the piston descends to BDC.',
    },
    {
      label: 'Compression (180° → 360°)',
      fig: `Compression stroke · ${M.COMP_RATIO}:1 squeeze`,
      run: 1,
      play: 2.8,
      real: M.CYCLE_REAL_S / 4,
      cam: viewAngle,
      lit: 'crank',
      look: { xray: 1, ex: 0 },
      hint: `The spring seats the valve shut; the rising piston squeezes the trapped charge ${M.COMP_RATIO}-fold to ${M.COMP_BAR} bar.`,
    },
    {
      label: 'Power (360° → 540°)',
      fig: 'Power stroke · ignition drives the crank',
      run: 1,
      play: 2.8,
      real: M.CYCLE_REAL_S / 4,
      cam: viewClose,
      lit: 'gears',
      look: { xray: 1, ex: 0 },
      hint: `Combustion spikes pressure past ${M.PEAK_BAR} bar just after TDC, driving the piston down and spinning the 2:1 cam gear.`,
    },
    {
      label: 'Exhaust & explode (540° → 720°)',
      fig: 'Exhaust stroke · exploded teardown',
      run: 1,
      play: 3.2,
      real: M.CYCLE_REAL_S / 4,
      cam: viewExplode,
      lit: 'gears',
      look: { xray: 0, ex: 1 },
      hint: 'At 720° the crank finishes its second turn as the camshaft completes one full −360° revolution.',
    },
  ],
  buildWorld,
  state: clock => M.at(clock),
  readout: s => `${s.strokeName} · ${s.deg.toFixed(0)}° crank\npiston s = ${s.s.toFixed(2)} m · p = ${s.pressure.toFixed(1)} bar`,
  chips: [
    { label: 'Crank / Cam', from: 1, value: s => `${s.deg.toFixed(0)}° / ${(s.camAngle * 180 / Math.PI).toFixed(0)}°` },
    { label: 'Piston height s', from: 1, value: s => `${s.s.toFixed(2)} m` },
    { label: 'Valve lift', from: 1, value: s => `${(s.valveLift * 1000).toFixed(0)} mm` },
    { label: 'Cylinder pressure', from: 2, value: s => `${s.pressure.toFixed(1)} bar` },
  ],
  PLATES: {
    block: {
      text: 'The cylinder jacket guides the piston along a straight line while holding the combustion pressure. Use the Solid / X-ray / Section pills on the left to ghost or slice open the casting.',
      facts: s => [['Compression ratio', `${M.COMP_RATIO}:1`], ['Volume ratio V/V₀', s.volRatio.toFixed(2)]],
    },
    crank: {
      text: 'A slider-crank converts between rotary torque and linear piston force. Because the connecting rod has finite length L = 3R, piston acceleration is higher at TDC than at BDC.',
      facts: s => [['Piston position s', `${s.s.toFixed(3)} m`], ['Rod angle φ', `${(s.phi * 180 / Math.PI).toFixed(1)}°`]],
    },
    gears: {
      text: 'A four-stroke cylinder fires once every two crankshaft turns (720°). The 14-tooth crank pinion meshes with a 28-tooth camshaft gear so the cam turns at exactly −½ the crank speed.',
      facts: s => [['Gear teeth', `${M.TEETH_CRANK} : ${M.TEETH_CAM}`], ['Cam angle', `${(s.camAngle * 180 / Math.PI).toFixed(1)}°`]],
    },
    valve: {
      text: 'The overhead valve is pushed open by the cam lobe during Intake and pulled shut against its seat by the helical coil spring for Compression, Power, and Exhaust.',
      facts: s => [['Valve lift', `${(s.valveLift * 1000).toFixed(1)} mm`], ['Stroke phase', s.strokeName]],
    },
    arm: {
      text: 'A two-link planar inspection arm solved analytically via twoLinkIK (circle–circle intersection of the shoulder and elbow reach spheres). Drag its red tip in 3D to pose it.',
      facts: s => [['Shoulder θ₁', `${(s.arm.th1 * 180 / Math.PI).toFixed(1)}°`], ['Elbow θ₂', `${(s.arm.th2 * 180 / Math.PI).toFixed(1)}°`]],
    },
  },
};
