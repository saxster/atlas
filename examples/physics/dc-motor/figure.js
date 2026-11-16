// Flagship Quirky Sketchbook Explorer: "Why doesn't a DC motor get stuck halfway?"
// Demonstrates: medium 'pencil-wash' + live 5-medium switcher, flush-seam split-ring commutator (idOff ±0.05),
// 1D rail-draggable stator poles, equal-flux fieldLines + flowBeads, reactive prose (scrub, val, term, aside),
// zero-thrash live SVG torque wave chart, and opt-in procedural sound (motor hum + brush commutation clicks).
import { chart, samples, moveCursor, moveTangent } from '@saxster/atlas/chart.js';
import { scrub, val, term, aside } from '@saxster/atlas/prose.js';
import { createHum, playClick } from '@saxster/atlas/sound.js';
import { buildWorld } from './world.js';
import * as M from './model.js';

const TWO_PI = Math.PI * 2;
const RANGE = { x0: 0, x1: 360, y0: -2.6, y1: 2.6, w: 420, h: 168 };

let humState = { ctx: null, hum: null, lastHalf: null };

export const FIGURE = {
  no: 17,
  title: 'The split-ring trick',
  question: 'Why doesn’t a spinning DC motor get stuck halfway?',
  medium: 'pencil-wash',
  mediums: ['pencil-wash', 'paper-ink', 'ciechanow', 'moebius', 'risograph'],
  sonify: (ctx, state) => {
    if (humState.ctx !== ctx) {
      humState.hum?.stop?.();
      humState = { ctx, hum: createHum(ctx, { baseFreq: 58, maxBoost: 85, maxGain: 0.055 }), lastHalf: null };
    }
    humState.hum.update(Math.min(1, Math.abs(state.omega || 0) / 14));
    const half = Math.floor(((state.theta || 0) + Math.PI / 2) / Math.PI);
    if (humState.lastHalf !== null && half !== humState.lastHalf && Math.abs(state.omega || 0) > 0.4) {
      playClick(ctx, { dir: half > humState.lastHalf ? 1 : -1, gain: 0.07 });
    }
    humState.lastHalf = half;
  },
  prose: p => `Drive ${scrub('V', { value: p.V, min: 2, max: 10, step: 0.5, unit: ' V', label: 'Supply voltage', color: 'ochre', part: 'brushes' })} across the ${term('brushes', 'carbon brushes', { color: 'ink' })} while sliding the ${term('stator', 'stator poles', { color: 'red' })} to ${scrub('gap', { value: p.gap, min: 0.85, max: 1.85, step: 0.05, unit: '×', fmt: v => `${(+v).toFixed(2)}×`, label: 'Magnet air gap', color: 'blue', part: 'stator' })}: the ${term('commutator', 'split-ring commutator', { color: 'red', isolate: true })} flips coil current every 180° to keep torque ${val('torque', { initial: '+1.08 N·m', color: 'red', part: 'coil' })} pushing the same way — ${aside('what about the 90° dead gap?', 'Right at 90° and 270° the brushes bridge the insulated slit so current briefly drops to zero, preventing a battery short while rotational inertia carries the coil smoothly into the next half-turn.')}`,
  proseFormat: {
    torque: s => `${s.torque >= 0 ? '+' : '−'}${Math.abs(s.torque).toFixed(2)} N·m`,
    gap: v => `${(+v).toFixed(2)}×`,
  },
  bigIdea: 'a steady magnetic field pulls a current loop toward vertical (90°) and holds it there unless the current reverses right as the loop crosses vertical. Splitting one copper ring into two halves makes the spinning rotor flip its own current every half-turn.',
  PAGES: [
    {
      cam: { target: [0, -0.06, 0.12], az: 26, el: 22, dist: 8.6 },
      lit: null,
      fig: 'A brushed DC motor with sliding N/S magnets, equal-flux magnetic field lines, copper coil current beads, and a split-ring commutator',
    },
  ],
  narrowZoom: 1.18,
  params: { V: 6, gap: 1.15, commutator: 1 },
  controls: [
    { key: 'V', label: 'Battery voltage', min: 2, max: 10, step: 0.5, fmt: v => `${(+v).toFixed(1)} V` },
    { key: 'gap', label: 'Magnet air gap', min: 0.85, max: 1.85, step: 0.05, fmt: v => `${(+v).toFixed(2)}×` },
    { key: 'commutator', label: 'Ring type', min: 0, max: 1, step: 1, fmt: v => (+v === 1 ? 'Split ring' : 'Slip rings') },
  ],
  predict: {
    q: 'Suppose we replace the split-ring commutator with continuous slip rings (no polarity flip). What happens after the coil swings past vertical (90°)?',
    choices: [
      'It spins twice as fast because current never interrupts',
      'Torque reverses sign past 90°, pulling the coil back until it traps at vertical',
      'The magnetic field reverses direction to match the coil',
      'Current drops to zero everywhere',
    ],
    answer: () => 1,
    why: p => `Past 90°, the top and bottom wires have swapped places, but slip rings keep current flowing the same way in each wire—so Lorentz forces still push up on the top wire and down on the bottom wire, reversing torque to −${M.stallTorqueAt(0, { ...p, commutator: 0 }).toFixed(2)} N·m at 180°. Set <b>Ring type</b> to <i>Slip rings</i> and press <b>Spin motor</b> to watch it trap!`,
  },
  run: { label: 'Spin motor', duration: () => M.RUN_DURATION, real: () => M.RUN_DURATION },
  buildWorld: (E, p) => buildWorld(E, p),
  lookKeys: [],
  state: (clock, reduced, p) => M.stateAtTime(reduced ? 2.4 : clock, p),
  readout: s => `θ ${(((s.theta * 180 / Math.PI) % 360 + 360) % 360).toFixed(0)}°   ω ${s.rpm.toFixed(0)} rpm\nI ${s.current.toFixed(2)} A   τ ${s.torque >= 0 ? '+' : '−'}${Math.abs(s.torque).toFixed(2)} N·m`,
  chips: [
    { label: 'Speed', value: s => `${s.rpm.toFixed(0)} rpm` },
    { label: 'Torque τ', value: s => `${s.torque >= 0 ? '+' : '−'}${Math.abs(s.torque).toFixed(2)} N·m` },
    { label: 'Armature I', value: s => `${s.current.toFixed(2)} A` },
    { label: 'Air-gap B', value: s => `${s.B.toFixed(2)} T` },
  ],
  chart: (_state, params) => {
    const key = `dc:${(+params.V).toFixed(1)}:${(+params.gap).toFixed(2)}:${params.commutator}`;
    const pts = samples(0, 360, 120, deg => M.stallTorqueAt((deg * Math.PI) / 180, params));
    const unrectPts = samples(0, 360, 90, deg => M.stallTorqueAt((deg * Math.PI) / 180, { ...params, commutator: 0 }));
    const svg = chart({
      ...RANGE,
      id: 'dc-torque-wave',
      xlabel: 'rotor angle θ (°)',
      ylabel: 'stall τ (N·m)',
      label: 'Stall torque across one full revolution',
      desc: 'Split-ring commutator folds the negative half-wave above zero so torque stays positive across 360 degrees.',
      series: [
        ...(+params.commutator === 1 ? [{ cls: 'curve faint', pts: unrectPts }] : []),
        { cls: 'curve red', fill: true, pts, part: 'coil' },
      ],
      marks: [[90, 0, '90° flip'], [270, 0, '270° flip']],
      cursors: ['rotorPos'],
      tangents: ['rotorSlope'],
    });
    return {
      key,
      svg,
      update(el, s, p) {
        const deg = (((s.theta * 180) / Math.PI) % 360 + 360) % 360;
        const y = M.stallTorqueAt((deg * Math.PI) / 180, p);
        const slope = (M.stallTorqueAt(((deg + 1) * Math.PI) / 180, p) - M.stallTorqueAt(((deg - 1) * Math.PI) / 180, p)) / 2;
        moveCursor(el, 'rotorPos', RANGE, deg, y);
        moveTangent(el, 'rotorSlope', RANGE, deg, y, slope, 26);
      },
    };
  },
  PLATES: {
    stator: { text: 'Dragging the North magnet inward narrows the air gap and raises magnetic flux density B, boosting both starting torque (τ ∝ B) and back-EMF.' },
    coil: { text: 'Current I flowing across magnetic field B feels Lorentz force F = I L × B: one side of the loop is pushed up while the opposite side is pushed down, creating a pure couple.' },
    commutator: { text: 'Two insulated copper half-cylinders spin with the shaft. Right as the coil passes 90° and 270°, each half-ring slides onto the opposite stationary brush, reversing coil current in step with rotation.' },
    brushes: { text: 'Spring-pressed carbon blocks maintain sliding electrical contact with the spinning commutator without tangling the external battery leads.' },
  },
};
