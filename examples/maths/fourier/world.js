// Six stations in one 3D world for Chapter 5: Fourier Series & Rotating Epicycles.
import * as THREE from 'three';
import { PALETTE, part, box, rod, lines, V } from '@saxster/atlas/parts.js';
import { axes, curve, vector } from '@saxster/atlas/prims.js';
import * as M from './model.js';

export const STATIONS = [
  [ 0, 0, 0], // 0 · Two epicycles (n = 1, 3)
  [12, 0, 0], // 1 · Five odd epicycles drawing the square wave
  [24, 0, 0], // 2 · Sawtooth wave from all harmonics
  [36, 0, 0], // 3 · Orthogonality sifting
  [48, 0, 0], // 4 · Spectrum & Parseval energy bars
  [60, 0, 0], // 5 · Gibbs overshoot at the jump
];
export const at = (i, dx = 0, dy = 0, dz = 0) => [STATIONS[i][0] + dx, STATIONS[i][1] + dy, STATIONS[i][2] + dz];

const setPos = (m, p) => { m.position.copy(p); m.userData.home.copy(p); };
const dot = (g, r, pal, name, tone = 'hi', ex = [0, 0, 0]) =>
  part(g, new THREE.SphereGeometry(r, 24, 16), { pal, name, tone, ex });

function stationGroup(scene, i, w = 7.4, h = 4.6) {
  const g = new THREE.Group();
  g.position.set(...STATIONS[i]);
  scene.add(g);
  const brd = part(g, box(w, h, 0.006), { tone: 'lo', pal: 'board', pos: [0, h * 0.44, -0.14], name: 'Board' });
  brd.userData.noEdge = true;
  return g;
}

// Helper: builds an epicycle + waveform drawing rig on a station
function buildEpicycleStation(st, asm, harms, waveFn, targetFn, asmKey, asmTitle, asmSub) {
  const A = axes(st, { x: [0, 2 * Math.PI], y: [-1.5, 1.5], size: [3.6, 3.0], at: [-0.3, 2.0, 0], ticks: { x: 2, y: 3 }, grid: true,
    names: { x: '<i>t</i>', y: '<i>y</i>' } });
  const center = V(-2.15, 2.0, 0);
  const scale = 1.0;

  const gEpi = asm(asmKey, st, { title: asmTitle, sub: asmSub });
  const rings = harms.map(([n, r], i) => {
    const m = part(gEpi, new THREE.TorusGeometry(Math.abs(r) * scale, 0.012, 12, 64), {
      tone: i === 0 ? 'mid' : 'lo', pal: 'paper', pos: center.toArray(), name: `Harmonic ${n} circle`,
    });
    m.userData.noEdge = true;
    return m;
  });
  const vecs = harms.map(([n], i) =>
    vector(gEpi, [0, 0, 0], [0.3, 0, 0], { color: i === 0 ? 'blue' : i === 1 ? 'amber' : 'red', name: `Harmonic ${n} phasor` })
  );
  if (targetFn) {
    curve(gEpi, t => [t, targetFn(t)], { t: [0.02, 2 * Math.PI - 0.02], axes: A, samples: 180, radius: 0.011, color: 'ink', name: 'Target wave' });
  }
  curve(gEpi, t => [t, waveFn(t)], { t: [0, 2 * Math.PI], axes: A, samples: 220, radius: 0.022, color: 'red', name: 'Fourier sum' });

  const tipDot = dot(gEpi, 0.065, 'red', 'Epicycle tip');
  const waveDot = dot(gEpi, 0.065, 'red', 'Waveform pen');
  const traceRod = rod(gEpi, { r: 0.012, pal: 'amber', name: 'Horizontal projection trace' });

  function updateAt(t) {
    const chain = M.epicycleChain(harms, t);
    for (let i = 0; i < harms.length; i++) {
      const [x0, y0] = chain[i], [x1, y1] = chain[i + 1];
      const p0 = V(center.x + x0 * scale, center.y + y0 * scale, 0.02 * i);
      const p1 = V(center.x + x1 * scale, center.y + y1 * scale, 0.02 * i);
      setPos(rings[i], p0);
      vecs[i].set(p0.toArray(), p1.toArray());
    }
    const [tx, ty] = chain.at(-1);
    const pTip = V(center.x + tx * scale, center.y + ty * scale, 0.05);
    const tMod = ((t % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const pWave = A.to(tMod, ty, 0.05);
    setPos(tipDot, pTip);
    setPos(waveDot, pWave);
    traceRod.set(pTip, pWave);
  }
  return { A, updateAt };
}

export function buildWorld(E) {
  const { scene, asm } = E;
  PALETTE.green = ['#6bc48e', '#2e8b57', '#1e5e3a'];
  PALETTE.amber = ['#f5c96b', '#d99b26', '#9e6d14'];
  const labels = [], updaters = [];
  const label = (cls, html, atFn) => labels.push({ cls, html, at: atFn });

  // faint graph-paper ground
  const gnd = [];
  for (let x = -8; x <= 68; x += 2) gnd.push(x, 0.001, -8, x, 0.001, 8);
  for (let z = -8; z <= 8; z += 2) gnd.push(-8, 0.001, z, 68, 0.001, z);
  lines(scene, gnd, '#e6e6e2');

  // ==================== 0 · TWO EPICYCLES (n = 1, 3) ====================
  {
    const st = stationGroup(scene, 0);
    const harms = M.squareHarmonics(2);
    const { A, updateAt } = buildEpicycleStation(st, asm, harms, t => M.squarePartial(t, 2), M.squareTarget,
      'twoEpicycles', 'Two spinning circles (n = 1, 3)', '4/π sin t + 4/(3π) sin 3t flattens the peak and steepens the sides');
    labels.push(...A.labels);
    label('vec blue', '<i>b</i>₁ = 4/π, <i>b</i>₃ = 4/3π', () => V(-2.15, 3.68, 0.08).add(st.position));
    updaters.push(s => updateAt(s.t));
  }

  // ==================== 1 · FIVE ODD EPICYCLES (SQUARE WAVE) ====================
  {
    const st = stationGroup(scene, 1);
    const wPt = p => p.clone().add(st.position);
    const harms = M.squareHarmonics(5);
    const { A, updateAt } = buildEpicycleStation(st, asm, harms, t => M.squarePartial(t, 5), M.squareTarget,
      'squareChain', 'Five odd harmonics (n = 1, 3, 5, 7, 9)', 'each odd harmonic spins faster and trims the ripple closer to ±1');
    labels.push(...A.labels);
    label('vec red', '<i>S</i>₅(<i>t</i>) = Σ 4/(<i>n</i>π) sin <i>nt</i>', () => wPt(A.to(3.8, 1.38, 0.08)));
    updaters.push(s => updateAt(s.t));
  }

  // ==================== 2 · SAWTOOTH WAVE (ALL HARMONICS) ====================
  {
    const st = stationGroup(scene, 2);
    const wPt = p => p.clone().add(st.position);
    const harms = M.sawtoothHarmonics(6);
    const { A, updateAt } = buildEpicycleStation(st, asm, harms, t => M.sawtoothPartial(t, 6), M.sawtoothTarget,
      'sawtooth', 'Sawtooth ramp (n = 1…6)', 'alternating signs (−1)^(n+1) 2/(nπ) build a steady linear ramp');
    labels.push(...A.labels);
    label('vec red', '<i>W</i>₆(<i>t</i>) ≈ <i>t</i>/π', () => wPt(A.to(3.8, 1.38, 0.08)));
    updaters.push(s => updateAt(s.t));
  }

  // ==================== 3 · ORTHOGONALITY SIFTING ====================
  {
    const st = stationGroup(scene, 3);
    const wPt = p => p.clone().add(st.position);
    const A1 = axes(st, { x: [0, 2 * Math.PI], y: [-1, 1], size: [5.4, 1.25], at: [-2.7, 3.15, 0], ticks: { x: 2, y: 1 }, grid: true,
      names: { x: '', y: 'sin²(2<i>t</i>)' } });
    const A2 = axes(st, { x: [0, 2 * Math.PI], y: [-1, 1], size: [5.4, 1.25], at: [-2.7, 0.95, 0], ticks: { x: 2, y: 1 }, grid: true,
      names: { x: '<i>t</i>', y: 'sin 2<i>t</i> sin 3<i>t</i>' } });
    labels.push(...A1.labels, ...A2.labels);

    const gMatch = asm('orthoMatch', st, { title: 'Matching frequency: sin²(2t)', sub: 'always ≥ 0, with average height ½ and integral π' });
    curve(gMatch, t => [t, Math.sin(2 * t) ** 2], { t: [0.06, 2 * Math.PI], axes: A1, samples: 180, radius: 0.020, color: 'green', name: 'sin²(2t)' });
    curve(gMatch, t => [t, 0.5], { t: [0.06, 2 * Math.PI], axes: A1, radius: 0.012, color: 'amber', name: 'Mean ½' });

    const gMix = asm('orthoCancel', st, { title: 'Mismatched frequencies: sin(2t) sin(3t)', sub: 'positive and negative lobes cancel to 0 over a period' });
    curve(gMix, t => [t, Math.sin(2 * t) * Math.sin(3 * t)], { t: [0.06, 2 * Math.PI], axes: A2, samples: 200, radius: 0.020, color: 'blue', name: 'sin(2t)sin(3t)' });

    label('board', 'mean = ½  (∫ = π)', () => wPt(A1.to(4.6, 0.78, 0.08)));
    label('vec blue', 'mean = 0  (∫ = 0)', () => wPt(A2.to(4.6, 0.78, 0.08)));
  }

  // ==================== 4 · SPECTRUM & PARSEVAL ENERGY ====================
  {
    const st = stationGroup(scene, 4);
    const wPt = p => p.clone().add(st.position);
    const A = axes(st, { x: [0, 10], y: [0, 1.4], size: [5.4, 3.4], at: [-2.7, 0.35, 0], ticks: { x: 5, y: 3 }, grid: true,
      names: { x: 'harmonic <i>n</i>', y: 'amplitude <i>b<sub>n</sub></i>' } });
    labels.push(...A.labels);

    const gSpec = asm('spectrum', st, { title: 'Harmonic spectrum b_n = 4/(nπ)', sub: 'odd harmonics decay as 1/n while ½ Σ b_n² sums to total power 1' });
    for (const n of [1, 3, 5, 7, 9]) {
      const b = M.squareCoeff(n);
      const p0 = A.to(n - 0.32, 0), p1 = A.to(n + 0.32, b);
      const bw = p1.x - p0.x, bh = p1.y - p0.y;
      part(gSpec, box(bw, bh, 0.14), { pal: n === 1 ? 'red' : 'blue', pos: [0.5 * (p0.x + p1.x), 0.5 * (p0.y + p1.y), 0.04], name: `Harmonic ${n}` });
    }
    curve(gSpec, x => [x, 4 / (x * Math.PI)], { t: [0.85, 9.8], axes: A, radius: 0.014, color: 'amber', name: '1/n envelope' });
    label('vec red', '<i>b</i>₁ = 1.273 (81.1 % power)', () => wPt(A.to(4.3, 1.28, 0.08)));
  }

  // ==================== 5 · GIBBS OVERSHOOT ====================
  {
    const st = stationGroup(scene, 5);
    const wPt = p => p.clone().add(st.position);
    const A = axes(st, { x: [-0.6, 1.8], y: [-1.3, 1.4], size: [5.4, 3.4], at: [-1.35, 1.9, 0], ticks: { x: 4, y: 3 }, grid: true,
      names: { x: '<i>t</i> near jump', y: '<i>S<sub>N</sub></i>(<i>t</i>)' } });
    labels.push(...A.labels);

    const gGibbs = asm('gibbs', st, { title: 'The Gibbs overshoot (≈ 1.179)', sub: 'near a jump, the first horn stays ~9 % of the jump above the flat top for every N' });
    gGibbs.position.z = -0.04;
    curve(gGibbs, t => [t, M.squareTarget(t)], { t: [-0.55, 1.75], axes: A, samples: 160, radius: 0.012, color: 'ink', name: 'Exact step' });
    curve(gGibbs, t => [t, M.squarePartial(t, 5)], { t: [-0.55, 1.75], axes: A, samples: 220, radius: 0.016, color: 'blue', name: 'S_5(t)' });
    curve(gGibbs, t => [t, M.squarePartial(t, 15)], { t: [-0.55, 1.75], axes: A, samples: 280, radius: 0.022, color: 'red', name: 'S_15(t)' });
    curve(gGibbs, t => [t, M.GIBBS_PEAK], { t: [0, 1.75], axes: A, radius: 0.012, color: 'amber', name: 'Gibbs ceiling 1.179' });

    const tPk = M.gibbsPeakAngle(15);
    const pkDot = dot(gGibbs, 0.075, 'red', 'Gibbs peak');
    setPos(pkDot, A.to(tPk, M.squarePartial(tPk, 15), 0.08));
    label('vec red', 'Gibbs limit 1.179 (+8.95 % of jump)', () => wPt(A.to(1.08, 1.32, 0.08)));
  }

  function update(state, look) {
    for (const fn of updaters) fn(state, look);
  }
  return { update, labels };
}
