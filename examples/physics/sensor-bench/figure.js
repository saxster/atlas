// Flagship Sensor & Execution-Trace Explorer: "Why does hot air make an ultrasonic sensor under-read distance?"
// Exercises: diegetic 3D canvasPlate OLED, ink-outlined flame & ultrasonic ring billboards, opaque mode:'wash'
// spotlighting, parameterized codeBlock + paramChip + scrub execution trace, epistemic badge(), foilCard(),
// and stepped 2D SVG focusViewBox + pathBeads schematic.
import { focusViewBox, beadSlots, pathBeads } from '@saxster/atlas/chart.js';
import { scrub, paramChip, codeBlock, badge, foilCard, diffList, val, term } from '@saxster/atlas/prose.js';
import { playBoop, playClick } from '@saxster/atlas/sound.js';
import { buildWorld } from './world.js';
import * as M from './model.js';

const LOOP_PATH = [
  [54, 58], [136, 58], [344, 58], [344, 114], [136, 114], [54, 114],
];
const FULL_BOX = [0, 0, 420, 164];
const GATE_BOX = [18, 22, 210, 120];

let lastPingCycle = null;

function buildSchematicSvg(s, p) {
  const cAir = (+p.comp ? M.soundSpeed(p.tempC) : M.V_REF).toFixed(1);
  return `<svg class="chart" data-stage="echo-schem" viewBox="0 0 420 164" role="img" aria-label="Trigger, acoustic flight, and echo-pin timing schematic">
    <title>Ultrasonic pulse-echo timing schematic</title>
    <rect class="frame" x="12" y="10" width="396" height="144" rx="6"/>
    <rect class="mask" x="24" y="38" width="66" height="92" rx="4" stroke="currentColor" stroke-opacity="0.25"/>
    <text class="lab" x="57" y="78" text-anchor="middle">MCU</text>
    <text class="ax" x="57" y="96" text-anchor="middle">${cAir} m/s</text>
    <rect class="mask" x="108" y="38" width="58" height="92" rx="4" stroke="currentColor" stroke-opacity="0.25"/>
    <text class="lab" x="137" y="78" text-anchor="middle">TX/RX</text>
    <text class="ax" x="137" y="96" text-anchor="middle">40 kHz</text>
    <rect class="mask" x="322" y="38" width="64" height="92" rx="4" stroke="currentColor" stroke-opacity="0.25"/>
    <text class="lab" x="354" y="78" text-anchor="middle">Target</text>
    <text class="ax" x="354" y="96" text-anchor="middle">${Number(p.distCm).toFixed(0)} cm</text>
    <path class="curve" d="M90,58 L108,58 M166,58 L322,58"/>
    <path class="curve red" d="M322,114 L166,114 M108,114 L90,114"/>
    <text class="ax" x="244" y="49" text-anchor="middle">outbound pulse · v(T) = ${M.soundSpeed(p.tempC).toFixed(1)} m/s</text>
    <text class="ax" x="244" y="132" text-anchor="middle">echo return · Δt = ${Math.round(s.echoUs)} µs</text>
    ${beadSlots('echo-loop', 5, 3.4)}
  </svg>`;
}

export const FIGURE = {
  no: 18,
  title: 'The hot-air echo illusion',
  question: 'Hold the target still at 60 cm and heat the air to 45 °C — what distance does a fixed-343 m/s sensor report?',
  medium: 'pencil-wash',
  mediums: ['pencil-wash', 'paper-ink', 'ciechanow', 'moebius', 'risograph'],
  sonify: (ctx, state) => {
    const cyc = Math.floor((state.t || 0) / M.CYCLE_PERIOD);
    if (lastPingCycle !== null && cyc !== lastPingCycle) {
      playClick(ctx, { dir: 1, gain: 0.05 });
      if (state.zone === 'STOP') playBoop(ctx, { streak: 3 });
    }
    lastPingCycle = cyc;
  },
  prose: p => `
    <p>${badge('vantage', 'Measured at ECHO pin')} Heat the ${term('heater', 'air column', { color: 'ochre', isolate: 'wash' })} to ${scrub('tempC', { value: p.tempC, min: -10, max: 50, step: 5, unit: ' °C', label: 'Air temperature', color: 'ochre', part: 'heater' })} while the ${term('target', 'reflector paddle', { color: 'blue', isolate: 'wash' })} sits at ${val('trueDist', { initial: '60 cm', color: 'blue', part: 'target' })}: echo flight takes ${val('echoTxt', { initial: '3496 µs', color: 'ink', part: 'oled' })} ${badge('eg')} and the ${term('oled', 'OLED timer', { color: 'green', isolate: 'wash' })} reports ${val('shownTxt', { initial: '60.0 cm', color: 'red', part: 'oled' })}.</p>
    ${codeBlock([
      { html: `digitalWrite(TRIG, HIGH); // launch 40 kHz burst`, part: 'transducer' },
      { html: `// sound crosses air at v(T) = ${val('vAirTxt', { initial: '343.2 m/s', color: 'ochre' })}`, part: 'heater' },
      { html: `long us = pulseIn(ECHO, HIGH); // ${val('echoTxt', { initial: '3496 µs' })}`, part: 'oled' },
      { html: `float cm = us * cUsed / 2.0;   // ${val('shownTxt', { initial: '60.0 cm', color: 'red' })}`, part: 'oled' },
      { html: `bool stop = cm <= ${paramChip('stopCm', { value: p.stopCm, choices: [{ value: 25, label: '25 cm' }, { value: 35, label: '35 cm' }, { value: 50, label: '50 cm' }], part: 'target', color: 'ochre', label: 'Stop threshold' })};`, part: 'target' },
    ], { title: 'loop() · pulse-echo ranger', lineVar: 'activeLine', startLine: 1 })}
    ${diffList([
      { kind: 'added', label: 'Thermal air column', detail: 'raises molecular speed v(T) ∝ √T', part: 'heater' },
      { kind: 'changed', label: 'Echo flight Δt', detail: 'returns early across hot air', part: 'transducer' },
      { kind: 'removed', label: 'Fixed 343.2 m/s assumption', detail: 'under-reads true distance unless compensated', part: 'oled' },
    ], { title: 'What changes when heating the bench' })}
    ${foilCard({
      label: 'Optical bench & laser rangefinding',
      to: 'physics/optics-bench',
      note: 'warming air speeds sound up (v ∝ √T), whereas electromagnetic waves travel near c ≈ 3×10⁸ m/s with negligible air-temperature shift.',
    }, { currentDir: 'physics/sensor-bench' })}
  `,
  proseFormat: {
    trueDist: s => `${s.distCm.toFixed(0)} cm`,
    echoTxt: s => `${Math.round(s.echoUs)} µs`,
    shownTxt: s => `${s.shownCm.toFixed(1)} cm`,
    vAirTxt: s => `${s.vActual.toFixed(1)} m/s`,
  },
  bigIdea: 'an ultrasonic rangefinder never measures centimetres directly — it only clocks round-trip echo microseconds Δt and multiplies by an assumed speed of sound. Warmer air speeds molecules and sound waves up (v ∝ √T), returning the echo early and making fixed-constant code under-read the true distance.',
  PAGES: [
    {
      cam: { target: [0.15, 0.05, -0.15], az: 22, el: 22, dist: 10.6 },
      lit: null,
      fig: 'An ultrasonic transducer, draggable reflector paddle, air-column burner flame, and live OLED echo-timing display',
    },
  ],
  narrowZoom: 1.2,
  params: { ...M.DEFAULTS },
  controls: [
    { key: 'distCm', label: 'True target distance', min: 20, max: 100, step: 2, fmt: v => `${(+v).toFixed(0)} cm` },
    { key: 'tempC', label: 'Air temperature', min: -10, max: 50, step: 5, fmt: v => `${(+v).toFixed(0)} °C` },
    { key: 'comp', label: 'Speed formula', min: 0, max: 1, step: 1, fmt: v => (+v === 1 ? 'Compensated v(T)' : 'Fixed 343.2 m/s') },
  ],
  predict: {
    q: 'Hold the reflector paddle fixed at 60 cm and heat the air between sensor and target from 20 °C to 45 °C. If the code keeps its fixed 343.2 m/s constant, what does the OLED screen report?',
    choices: [
      'About 60.0 cm — air temperature changes echo loudness, not flight time',
      'About 62.5 cm — hot air expands the path so the echo arrives later',
      'About 57.6 cm — sound travels faster in hot air, so the echo returns ~140 µs early',
      'Zero — 40 kHz ultrasound cannot propagate through 45 °C air',
    ],
    answer: () => 2,
    why: p => {
      const hot = M.stateAtTime(1.4, { ...p, distCm: 60, tempC: 45, comp: 0 });
      return `At 45 °C, dry-air sound speed climbs to <b>${hot.vActual.toFixed(1)} m/s</b>, so the round-trip echo returns in <b>${Math.round(hot.echoUs)} µs</b> instead of 3496 µs. Multiplying that shorter time by a fixed 343.2 m/s makes the controller report <b>${hot.shownCm.toFixed(1)} cm</b> (${Math.abs(hot.biasCm).toFixed(1)} cm too close). Switch <b>Speed formula</b> to <i>Compensated v(T)</i> to correct it.`;
    },
  },
  run: { label: 'Send pulses', duration: () => M.RUN_DURATION, real: () => M.RUN_DURATION },
  buildWorld: (E, p) => buildWorld(E, p),
  lookKeys: [],
  state: (clock, reduced, p) => M.stateAtTime(reduced ? 0.55 : clock, p),
  readout: s => `True ${s.distCm.toFixed(0)} cm · OLED ${s.shownCm.toFixed(1)} cm (${s.biasCm >= -0.05 ? '+' : '−'}${Math.abs(s.biasCm).toFixed(1)} cm)\nΔt ${Math.round(s.echoUs)} µs · v(T) ${s.vActual.toFixed(1)} m/s`,
  chips: [
    { label: 'Echo Δt', value: s => `${Math.round(s.echoUs)} µs` },
    { label: 'OLED readout', value: s => `${s.shownCm.toFixed(1)} cm` },
    { label: 'Actual v(T)', value: s => `${s.vActual.toFixed(1)} m/s` },
    { label: 'Readout error', value: s => `${s.biasCm >= -0.05 ? '+' : '−'}${Math.abs(s.biasCm).toFixed(1)} cm` },
  ],
  chart: (state, params) => {
    const key = `sb:${params.distCm}:${params.tempC}:${params.comp}`;
    return {
      key,
      svg: buildSchematicSvg(state, params),
      update(el, s) {
        const zoomAmt = s.stage === 'compute' || s.stage === 'alert' ? 0.55 : 0;
        focusViewBox(el, 'echo-schem', FULL_BOX, GATE_BOX, zoomAmt);
        pathBeads(el, 'echo-loop', LOOP_PATH, s.cyclePhase);
      },
    };
  },
  PLATES: {
    transducer: { text: 'One piezo diaphragm pings an 8-cycle 40 kHz burst when TRIG goes HIGH; the companion microphone holds ECHO HIGH until the reflected pressure wave arrives.' },
    target: { text: 'Drag the reflector paddle along the bench rail: doubling physical distance doubles both outbound and return travel, stretching Δt linearly.' },
    oled: { text: 'A diegetic 2D-canvas-on-3D OLED screen driven directly from model.js state(t): it plots the ECHO gate width in microseconds alongside the computed centimetre readout.' },
    heater: { text: 'Gas molecules move faster as temperature rises (v = 331.3 √(1 + T/273.15) m/s), carrying compressions across the bench in fewer microseconds.' },
  },
};
