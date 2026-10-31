// Six stations in one 3D world for Chapter 4: Differential Equations & Phase Portraits.
// Uses field(), streamline(), curve(), vector(), and draggable() initial conditions.
import * as THREE from 'three';
import { PALETTE, part, box, rod, lines, V } from '@saxster/atlas/parts.js';
import { axes, curve, vector, field, streamline } from '@saxster/atlas/prims.js';
import { draggable } from '@saxster/atlas/stage.js';
import * as M from './model.js';

export const STATIONS = [
  [ 0, 0, 0], // 0 · Slope field dy/dt = y − t
  [12, 0, 0], // 1 · Exponential relaxation dy/dt = −k(y − y_eq)
  [24, 0, 0], // 2 · Logistic equilibria & stability
  [36, 0, 0], // 3 · Undamped harmonic phase plane
  [48, 0, 0], // 4 · Underdamped spiral sink
  [60, 0, 0], // 5 · Saddle point & eigenvectors
];
export const at = (i, dx = 0, dy = 0, dz = 0) => [STATIONS[i][0] + dx, STATIONS[i][1] + dy, STATIONS[i][2] + dz];

const setPos = (m, p) => { m.position.copy(p); m.userData.home.copy(p); };
const dot = (g, r, pal, name, tone = 'hi', ex = [0, 0, 0]) =>
  part(g, new THREE.SphereGeometry(r, 24, 16), { pal, name, tone, ex });

function stationGroup(scene, i, w = 6.8, h = 4.6) {
  const g = new THREE.Group();
  g.position.set(...STATIONS[i]);
  scene.add(g);
  const brd = part(g, box(w, h, 0.006), { tone: 'lo', pal: 'board', pos: [0, h * 0.44, -0.14], name: 'Board' });
  brd.userData.noEdge = true;
  return g;
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

  // ==================== 0 · SLOPE FIELD dy/dt = y − t ====================
  {
    const st = stationGroup(scene, 0);
    const wPt = p => p.clone().add(st.position);
    const A = axes(st, { x: [0, 3], y: [-1, 3], size: [5.4, 3.6], at: [-2.7, 1.15, 0], ticks: { x: 3, y: 4 }, grid: true,
      names: { x: '<i>t</i>', y: '<i>y</i>' } });
    labels.push(...A.labels);

    const gField = asm('slopeField', st, { title: 'The slope field', sub: 'an arrow (1, f(t, y)) at every point in the plane' });
    field(gField, (t, y) => {
      const m = M.slopeFieldRhs(t, y), l = Math.hypot(1, m);
      return [1 / l, m / l];
    }, { axes: A, n: [7, 6], scale: 0.28, color: 'grey', name: 'Direction field' });
    curve(gField, t => [t, t + 1], { t: [0.08, 2], axes: A, radius: 0.014, color: 'green', name: 'Separating line y = t + 1' });

    const gSol = asm('integralCurve', st, { title: 'Integral curve y(t)', sub: 'threads the slope arrows from (t₀, y₀)' });
    const solCurve = curve(gSol, u => [u, 1], { t: [0, 1], axes: A, radius: 0.022, color: 'red', name: 'Solution curve' });
    const initDot = dot(gSol, 0.085, 'red', 'Initial value (t₀, y₀)');
    const tanVec = vector(gSol, [0, 1], [0.5, 1.5], { axes: A, color: 'amber', side: 1, gap: 0.44, label: '(1, <i>y</i> − <i>t</i>)', name: 'Slope vector' });
    labels.push(...tanVec.labels);

    let drag0 = null;
    draggable(initDot, {
      axes: A,
      constrain: ([t, y]) => [Math.max(0, Math.min(1.6, t)), Math.max(-0.6, Math.min(2.4, y)), 0.04],
      onDrag: ([t, y]) => { drag0 = [t, y]; },
      onReset: () => { drag0 = null; },
    });

    let cur0 = A.to(0.2, 1.25, 0.04);
    label('vec red', '(<i>t</i>₀, <i>y</i>₀)', () => wPt(cur0).add(V(0.45, -0.58, 0.08)));

    updaters.push(s => {
      const t0 = drag0 ? drag0[0] : s.slope.t0;
      const y0 = drag0 ? drag0[1] : s.slope.y0;
      s.slope.t0 = t0; s.slope.y0 = y0; s.slope.m0 = M.slopeFieldRhs(t0, y0);
      cur0 = A.to(t0, y0, 0.04);
      setPos(initDot, cur0);
      solCurve.update(u => {
        const t = t0 + u * (2.8 - t0);
        const y = Math.max(-1, Math.min(3, M.slopeFieldExact(t, t0, y0)));
        return [t, y];
      });
      const m = s.slope.m0, len = 0.5 / Math.hypot(1, m);
      tanVec.set([t0, y0], [t0 + len, y0 + m * len]);
    });
  }

  // ==================== 1 · EXPONENTIAL RELAXATION dy/dt = −k(y − y_eq) ====================
  {
    const st = stationGroup(scene, 1);
    const wPt = p => p.clone().add(st.position);
    const A = axes(st, { x: [0, 4], y: [-1, 3], size: [5.4, 3.6], at: [-2.7, 1.15, 0], ticks: { x: 4, y: 4 }, grid: true,
      names: { x: '<i>t</i>', y: '<i>y</i>(<i>t</i>)' } });
    labels.push(...A.labels);

    const gEq = asm('eqLine', st, { title: 'The equilibrium line y_eq = 1', sub: 'where dy/dt = 0 so change stops' });
    field(gEq, (t, y) => {
      const m = M.coolingRhs(y), l = Math.hypot(1, m);
      return [1 / l, m / l];
    }, { axes: A, n: [7, 6], scale: 0.30, color: 'grey', name: 'Cooling field' });
    curve(gEq, t => [t, M.Y_EQ], { t: [0.08, 4], axes: A, radius: 0.018, color: 'green', name: 'Equilibrium y = 1' });

    const gTraj = asm('relaxCurves', st, { title: 'Exponential relaxation', sub: 'gap shrinks by 1/e every τ = 1/k = 1.25 s' });
    curve(gTraj, t => [t, M.coolingExact(t, 2.6)], { t: [0.08, 4], axes: A, radius: 0.022, color: 'red', name: 'Upper trajectory' });
    curve(gTraj, t => [t, M.coolingExact(t, -0.6)], { t: [0.08, 4], axes: A, radius: 0.020, color: 'blue', name: 'Lower trajectory' });
    const dotUp = dot(gTraj, 0.08, 'red', 'Cooling state');
    const gapRod = rod(gTraj, { r: 0.02, pal: 'amber', name: 'Remaining gap y − y_eq' });

    let dragT1 = null;
    draggable(dotUp, {
      axes: A,
      constrain: ([t]) => { const tc = Math.max(0, Math.min(3.8, t)); return [tc, M.coolingExact(tc, 2.6), 0.04]; },
      onDrag: ([t]) => { dragT1 = t; },
      onReset: () => { dragT1 = null; },
    });

    label('board', '<i>y</i><sub>eq</sub> = 1.0', () => wPt(A.to(3.2, M.Y_EQ + 0.28, 0.08)));

    updaters.push(s => {
      const t = dragT1 !== null ? dragT1 : s.exp.t;
      const y = M.coolingExact(t, 2.6);
      s.exp.t = t; s.exp.y = y; s.exp.rate = M.coolingRhs(y);
      const p = A.to(t, y, 0.04), pEq = A.to(t, M.Y_EQ, 0.04);
      setPos(dotUp, p);
      gapRod.set(pEq, p);
    });
  }

  // ==================== 2 · LOGISTIC EQUILIBRIA & STABILITY ====================
  {
    const st = stationGroup(scene, 2);
    const wPt = p => p.clone().add(st.position);
    const A = axes(st, { x: [0, 4], y: [0, 3], size: [5.4, 3.6], at: [-2.7, 0.25, 0], ticks: { x: 4, y: 3 }, grid: true,
      names: { x: '<i>t</i>', y: '<i>y</i>(<i>t</i>)' } });
    labels.push(...A.labels);

    const gLog = asm('logisticCurve', st, { title: 'S-curve & carrying capacity K = 2.4', sub: 'fastest growth at inflection y = K/2 = 1.2' });
    field(gLog, (t, y) => {
      const m = M.logisticRhs(y), l = Math.hypot(1, m);
      return [1 / l, m / l];
    }, { axes: A, n: [7, 6], scale: 0.30, color: 'grey', name: 'Logistic field' });
    curve(gLog, t => [t, M.K_LOG], { t: [0.08, 4], axes: A, radius: 0.016, color: 'green', name: 'Stable equilibrium y = K' });
    curve(gLog, t => [t, M.logisticExact(t, 0.2)], { t: [0.08, 4], axes: A, radius: 0.022, color: 'red', name: 'S-shaped logistic trajectory' });
    curve(gLog, t => [t, M.logisticExact(t, 2.95)], { t: [0.08, 4], axes: A, radius: 0.018, color: 'blue', name: 'Trajectory above K' });
    const logDot = dot(gLog, 0.08, 'red', 'Population state');

    label('board', 'stable <i>y</i> = <i>K</i> = 2.4', () => wPt(A.to(2.8, M.K_LOG + 0.24, 0.08)));
    label('vec red', 'inflection <i>y</i> = ½<i>K</i> = 1.2', () => wPt(A.to(2.35, 1.15, 0.08)));

    updaters.push(s => {
      setPos(logDot, A.to(s.logistic.t, s.logistic.y, 0.04));
    });
  }

  // ==================== 3 · UNDAMPED HARMONIC PHASE PLANE ====================
  {
    const st = stationGroup(scene, 3);
    const A = axes(st, { x: [-2.5, 2.5], y: [-2.5, 2.5], size: [4.0, 4.0], at: [0, 2.0, 0], ticks: 5, grid: true,
      names: { x: '<i>x</i>', y: '<i>v</i> = d<i>x</i>/d<i>t</i>' } });
    labels.push(...A.labels);

    const gHarm = asm('phaseCircle', st, { title: 'Conserved phase orbit', sub: 'dx/dt = v, dv/dt = −x traces a circle of constant energy E = ½(x² + v²)' });
    field(gHarm, (x, v) => M.harmonicVec(x, v), { axes: A, n: [6, 6], scale: 0.22, color: 'grey', name: 'Phase velocity field' });
    const orbit = curve(gHarm, u => { const a = u * Math.PI * 2; return [1.8 * Math.cos(a), 1.8 * Math.sin(a)]; },
      { t: [0, 1], axes: A, samples: 128, radius: 0.022, color: 'blue', name: 'Constant-energy orbit' });
    const stateDot = dot(gHarm, 0.085, 'red', 'Phase state (x, v)');
    const velVec = vector(gHarm, [1.8, 0], [1.8, -1.0], { axes: A, color: 'red', label: '(<i>v</i>, −<i>x</i>)', name: 'Phase velocity' });
    labels.push(...velVec.labels);

    let customR = null;
    draggable(stateDot, {
      axes: A,
      constrain: ([x, v]) => {
        const r = Math.max(0.5, Math.min(2.2, Math.hypot(x, v)));
        const th = Math.atan2(v, x);
        return [r * Math.cos(th), r * Math.sin(th), 0.04];
      },
      onDrag: ([x, v]) => { customR = Math.hypot(x, v); },
      onReset: () => { customR = null; },
    });

    updaters.push(s => {
      const r = customR ?? 1.8;
      const [x, v] = M.harmonicExact(s.harmonic.t, r, 0);
      s.harmonic.x = x; s.harmonic.v = v; s.harmonic.E = M.harmonicEnergy(x, v);
      orbit.update(u => { const a = u * Math.PI * 2; return [r * Math.cos(a), r * Math.sin(a)]; });
      setPos(stateDot, A.to(x, v, 0.04));
      velVec.set([x, v], [x + v * 0.4, v - x * 0.4]);
    });
  }

  // ==================== 4 · UNDERDAMPED SPIRAL SINK ====================
  {
    const st = stationGroup(scene, 4);
    const A = axes(st, { x: [-2.5, 2.5], y: [-2.5, 2.5], size: [4.0, 4.0], at: [0, 2.0, 0], ticks: 5, grid: true,
      names: { x: '<i>x</i>', y: '<i>v</i>' } });
    labels.push(...A.labels);

    const gSp = asm('spiralSink', st, { title: 'Spiral sink (trace < 0, det > 0)', sub: 'damping −2γv drains energy so the orbit spirals into (0, 0)' });
    field(gSp, (x, v) => M.spiralVec(x, v), { axes: A, n: [6, 6], scale: 0.22, color: 'grey', name: 'Damped phase field' });
    streamline(gSp, (x, v) => M.spiralVec(x, v), { axes: A, from: [2.2, 0], dt: 0.04, steps: 220, radius: 0.020, color: 'red', name: 'Inward spiral trajectory' });
    streamline(gSp, (x, v) => M.spiralVec(x, v), { axes: A, from: [-2.0, 0], dt: 0.04, steps: 200, radius: 0.016, color: 'blue', name: 'Second spiral trajectory' });
    const spDot = dot(gSp, 0.085, 'red', 'Spiralling state');

    updaters.push(s => {
      setPos(spDot, A.to(s.spiral.x, s.spiral.v, 0.04));
    });
  }

  // ==================== 5 · SADDLE POINT & EIGENVECTORS ====================
  {
    const st = stationGroup(scene, 5);
    const wPt = p => p.clone().add(st.position);
    const A = axes(st, { x: [-2.5, 2.5], y: [-2.5, 2.5], size: [4.0, 4.0], at: [0, 2.0, 0], ticks: 5, grid: true,
      names: { x: '<i>x</i>', y: '<i>y</i>' } });
    labels.push(...A.labels);

    const { vUnstable, vStable } = M.saddleEigenvectors();
    const gSad = asm('saddle', st, { title: 'Hyperbolic saddle (det A < 0)', sub: 'inward along the λ₂ < 0 axis, outward along the λ₁ > 0 axis' });
    field(gSad, (x, y) => M.linearVec(M.SADDLE_MAT, x, y), { axes: A, n: [6, 6], scale: 0.22, color: 'grey', name: 'Saddle field' });
    curve(gSad, s => [s * 2.3 * vUnstable[0], s * 2.3 * vUnstable[1]], { t: [-1, 1], axes: A, radius: 0.018, color: 'red', name: 'Unstable eigenspace (λ₁ > 0)' });
    curve(gSad, s => [s * 2.3 * vStable[0], s * 2.3 * vStable[1]], { t: [-1, 1], axes: A, radius: 0.018, color: 'green', name: 'Stable eigenspace (λ₂ < 0)' });
    for (const seed of [[0.4, 1.8], [-0.4, -1.8], [-1.6, 1.2], [1.6, -1.2]]) {
      streamline(gSad, (x, y) => M.linearVec(M.SADDLE_MAT, x, y), { axes: A, from: seed, dt: 0.03, steps: 65, radius: 0.016, color: 'blue', name: 'Hyperbolic trajectory' });
    }

    const sadDot = dot(gSad, 0.085, 'amber', 'Trajectory rider');
    label('vec red', 'unstable λ₁ = +0.89', () => wPt(A.to(2.35, -1.55, 0.08)));
    label('board', 'stable λ₂ = −0.89', () => wPt(A.to(1.85, -2.95, 0.08)));

    updaters.push(s => {
      setPos(sadDot, A.to(s.saddle.x, s.saddle.y, 0.04));
    });
  }

  function update(state, look) {
    for (const fn of updaters) fn(state, look);
  }
  return { update, labels };
}
