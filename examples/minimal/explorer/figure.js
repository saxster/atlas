// How far does it fly? as an explorer: predict the best angle, throw, then change the angle and the speed.
import { buildWorld } from './world.js';
import * as M from './model.js';

const m = x => `${x.toFixed(1)} m`;

export const FIGURE = {
  no: 3, title: 'How far does it fly?', question: 'Which launch angle throws a ball farthest?',
  bigIdea: 'the level speed carries the ball across while gravity brings it down. A steeper throw stays up longer but crosses more slowly; on flat ground the two balance best at 45°, and 45° ± any angle land together.',
  PAGES: [{ cam: { target: [0, 1.15, 0], az: -10, el: 8, dist: 14 }, lit: 'flight', fig: 'A ball thrown over flat ground' }],
  narrowZoom: 1.12,   // phones: room on the left for the height numbers
  params: { angle: 30, v: 20 },
  controls: [
    { key: 'angle', label: 'Launch angle', min: 10, max: 80, step: 5, fmt: v => `${v}°` },
    { key: 'v', label: 'Launch speed', min: 10, max: 25, step: 1, fmt: v => `${v} m/s` },
  ],
  predict: {
    q: 'Same speed every time. On flat ground, which launch angle throws the ball farthest?',
    choices: ['30°', '45°', '60°', 'The steeper, the farther'], answer: () => 1,
    why: p => `The range is v² sin 2θ / g, and sin 2θ is largest, 1, when 2θ = 90°: θ = ${M.BEST}°. At ${p.v} m/s that is ${m(M.range(p.v, 45))}. ` +
      `30° and 60° both land at ${m(M.range(p.v, 30))}, because sin 60° = sin 120°.`,
  },
  run: { label: 'Throw it', duration: p => M.SLOW * M.flightTime(p.v, p.angle), real: p => M.flightTime(p.v, p.angle) },
  buildWorld: (E, p) => { const W = buildWorld(E, p); return { update: s => W.update(s), labels: W.labels }; },
  lookKeys: [],
  state: (clock, reduced, p) => {
    const T = M.flightTime(p.v, p.angle), t = reduced ? T : Math.min(clock / M.SLOW, T);
    return { ...p, t, T, landed: t >= T - 1e-9, ...M.at(p.v, p.angle, t), ...(t >= T - 1e-9 ? { x: M.range(p.v, p.angle), y: 0 } : {}) };
  },
  readout: s => `t ${s.t.toFixed(2)} s\nx ${m(s.x)}   y ${m(Math.max(s.y, 0))}`,
  chips: [
    { label: 'Distance', value: s => m(s.x) },
    { label: 'Range v² sin 2θ / g', value: s => m(M.range(s.v, s.angle)) },
    { label: 'Highest point', value: s => m(M.peak(s.v, s.angle)) },
    { label: 'Flight time', value: s => `${s.T.toFixed(2)} s` },
  ],
  PLATES: {
    flight: { text: 'Nothing pushes the ball sideways once it is thrown, so it crosses at a steady v cos θ. Gravity takes 9.81 m/s off its upward speed every second, so it rises, stops rising at the top, and falls back in the same time it took to rise.' },
  },
};
