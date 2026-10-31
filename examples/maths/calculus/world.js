// Six drawing boards along a table for Chapter 2: Slope and area.
// Built with engine/prims.js (axes, plot, area) and engine/parts.js.
import * as THREE from 'three';
import { PALETTE, part, box, rod, lines, V } from '@saxster/atlas/parts.js';
import { axes, plot, area } from '@saxster/atlas/prims.js';
import * as M from './model.js';

export const STATIONS = { secant: 0, deriv: 8.5, turning: 17, riemann: 25.5, ftc: 34, accum: 42.5 };
export const CY = 2.4;

const fmt = (x, n = 2) => (x < -5 * 10 ** -(n + 1) ? '−' : '') + Math.abs(x).toFixed(n);

export function buildWorld(E) {
  const { scene, asm } = E;
  PALETTE.green = ['#6bc48e', '#2e8b57', '#1e5e3a'];
  PALETTE.amber = ['#f5c96b', '#d99b26', '#9e6d14'];

  const root = new THREE.Group(); scene.add(root);
  const labels = [];
  const label = (cls, html, at) =>
    typeof html === 'function' ? labels.push({ cls, html: html(), at, text: html }) : labels.push({ cls, html, at });

  // faint graph-paper ground
  const gnd = [];
  for (let x = -10; x <= 56; x += 2) gnd.push(x, 0.001, -12, x, 0.001, 8);
  for (let z = -12; z <= 8; z += 2) gnd.push(-10, 0.001, z, 56, 0.001, z);
  lines(root, gnd, '#e6e6e2');

  const setPos = (m, p) => { m.position.copy(p); m.userData.home.copy(p); };
  const dot = (g, r, pal, name, tone = 'hi', ex = [0, 0, 0]) =>
    part(g, new THREE.SphereGeometry(r, 24, 16), { pal, name, tone, ex });

  function makeBoard(key, title, sub, w = 7.4, h = 4.9) {
    const x0 = STATIONS[key];
    const S = new THREE.Group(); S.position.set(x0, 0, 0); root.add(S);
    const brd = part(S, box(w, h, 0.006), {
      tone: 'lo', pal: 'board', pos: [0, CY, -0.14], name: 'Board',
    });
    brd.userData.noEdge = true;
    const g = asm(key, S, { title, sub });
    g.userData.focus = () => ({ target: [x0, CY, 0], radius: 2.75 });
    const worldPt = (lx, ly, lz = 0.08) => V(x0 + lx, ly, lz);
    return { S, g, worldPt };
  }

  let clockT = 2.2;
  const updaters = [];

  // ==================== 0 · SECANT TO TANGENT ====================
  {
    const { S, g, worldPt } = makeBoard('secant', 'Secant to tangent', 'as step h → 0, the secant line through P and Q becomes the tangent at P');
    const ax = axes(S, {
      x: [0, 3], y: [0, 4.6], size: [5.2, 3.5], at: [-2.6, CY - 1.75, 0],
      ticks: { x: 3, y: 4 }, names: { x: '<i>x</i>', y: '<i>y</i>' }, grid: true,
    });
    labels.push(...ax.labels);
    plot(S, M.f, { axes: ax, x: [0, 3], samples: 80, color: 'hi', width: 0.04, name: 'Parabola ½x²' });
    plot(S, x => M.tangentY(M.A0, x), {
      axes: ax, x: [0.15, 2.85], samples: 24, color: 'blue', width: 0.026, name: 'Tangent at P (slope 1)',
    });

    const secRod = rod(g, { r: 0.026, pal: 'red', name: 'Secant line PQ', ex: [0, 0.25, 0.4] });
    const runRod = rod(g, { r: 0.024, pal: 'blue', name: 'Run h', ex: [0, -0.25, 0.3] });
    const riseRod = rod(g, { r: 0.024, pal: 'red', name: 'Rise Δy', ex: [0.25, 0, 0.3] });
    const pDot = dot(g, 0.08, 'blue', 'Point P(1, 0.5)', 'hi', [0, 0, 0.5]);
    const qDot = dot(g, 0.08, 'red', 'Point Q(1 + h, f(1 + h))', 'hi', [0, 0, 0.5]);

    label('vec blue', '<i>P</i> (1, ½)', () => {
      const p = ax.to(M.A0, M.f(M.A0));
      return worldPt(p.x - 0.35, p.y + 0.14);
    });
    label('vec red', () => `<i>Q</i> · slope ${fmt(M.secantSlope(M.A0, M.hAt(clockT)))}`, () => {
      const xQ = M.A0 + M.hAt(clockT), p = ax.to(xQ, M.f(xQ));
      return worldPt(p.x + 1.65, p.y - 0.15);
    });

    updaters.push(t => {
      const h = M.hAt(t), xP = M.A0, yP = M.f(xP), xQ = xP + h, yQ = M.f(xQ);
      const pP = ax.to(xP, yP, 0.04), pQ = ax.to(xQ, yQ, 0.04), pC = ax.to(xQ, yP, 0.04);
      setPos(pDot, pP);
      setPos(qDot, pQ);
      runRod.set(pP, pC);
      riseRod.set(pC, pQ);
      secRod.set(ax.to(0.15, M.secantY(xP, h, 0.15), 0.03), ax.to(2.85, M.secantY(xP, h, 2.85), 0.03));
    });
  }

  // ==================== 1 · DERIVATIVE FUNCTION ====================
  {
    const { S, g, worldPt } = makeBoard('deriv', 'The derivative function', 'the slope of ½x² at every x traces the straight line f′(x) = x');
    const ax = axes(S, {
      x: [0, 3], y: [0, 4.6], size: [5.2, 3.5], at: [-2.6, CY - 1.75, 0],
      ticks: { x: 3, y: 4 }, names: { x: '<i>x</i>', y: '<i>y</i>' }, grid: true,
    });
    labels.push(...ax.labels);
    plot(S, M.f, { axes: ax, x: [0, 3], samples: 80, color: 'hi', width: 0.04, name: 'f(x) = ½x²' });
    plot(S, M.df, { axes: ax, x: [0, 3], samples: 40, color: 'blue', width: 0.036, name: 'Derivative f′(x) = x' });

    const tanSeg = rod(g, { r: 0.028, pal: 'red', name: 'Sliding tangent', ex: [0, 0.25, 0.4] });
    const pDot = dot(g, 0.08, 'red', 'Point (x, f(x))', 'hi', [0, 0, 0.5]);
    const dDot = dot(g, 0.075, 'blue', 'Slope point (x, f′(x))', 'hi', [0, 0, 0.5]);

    label('board', '<i>f</i>(<i>x</i>) = ½<i>x</i>²', () => {
      const p = ax.to(2.65, M.f(2.65)); return worldPt(p.x - 0.55, p.y + 0.28);
    });
    label('vec blue', '<i>f</i>′(<i>x</i>) = <i>x</i>', () => {
      const p = ax.to(2.65, M.df(2.65)); return worldPt(p.x - 0.35, p.y - 0.32);
    });
    label('vec red', () => {
      const x = M.xSweep(clockT); return `slope = ${fmt(M.df(x))}`;
    }, () => {
      const x = M.xSweep(clockT), p = ax.to(x, M.f(x));
      return worldPt(p.x - 0.55, p.y + 0.38);
    });

    updaters.push(t => {
      const x = M.xSweep(t), y = M.f(x), m = M.df(x);
      setPos(pDot, ax.to(x, y, 0.04));
      setPos(dDot, ax.to(x, m, 0.04));
      const dx = 0.5;
      tanSeg.set(ax.to(x - dx, y - m * dx, 0.03), ax.to(x + dx, y + m * dx, 0.03));
    });
  }

  // ==================== 2 · STATIONARY POINTS ====================
  {
    const { S, g, worldPt } = makeBoard('turning', 'Stationary points', 'at a peak or trough the tangent is level: g′(x) = 0');
    const ax = axes(S, {
      x: [-0.4, 3.0], y: [-1.4, 2.6], size: [5.2, 3.5], at: [-1.95, CY - 0.5, 0],
      ticks: { x: 3, y: 4 }, names: { x: '<i>x</i>', y: '<i>y</i>' }, grid: true,
    });
    labels.push(...ax.labels);
    plot(S, M.g, { axes: ax, x: [-0.35, 2.95], samples: 90, color: 'hi', width: 0.04, name: 'Cubic g(x) = ⅓x³ − x² + 2' });
    plot(S, M.dg, { axes: ax, x: [-0.3, 2.75], samples: 70, color: 'blue', width: 0.032, name: 'Derivative g′(x) = x² − 2x' });

    const maxDot = dot(g, 0.08, 'red', 'Local maximum (0, 2)', 'hi', [0, 0.25, 0.4]);
    setPos(maxDot, ax.to(0, M.g(0), 0.04));
    const minDot = dot(g, 0.08, 'green', 'Local minimum (2, ⅔)', 'hi', [0, -0.25, 0.4]);
    setPos(minDot, ax.to(2, M.g(2), 0.04));
    const infDot = dot(g, 0.07, 'amber', 'Inflection (1, 4/3)', 'hi', [0, 0, 0.4]);
    setPos(infDot, ax.to(1, M.g(1), 0.04));

    const moveDot = dot(g, 0.075, 'ink', 'Gliding point', 'hi', [0, 0, 0.5]);
    const moveTan = rod(g, { r: 0.026, pal: 'red', name: 'Tangent line', ex: [0, 0.2, 0.4] });

    label('vec red', 'max (0, 2)', () => { const p = ax.to(0, M.g(0)); return worldPt(p.x + 0.55, p.y + 0.26); });
    label('board', 'min (2, ⅔)', () => { const p = ax.to(2, M.g(2)); return worldPt(p.x + 0.65, p.y + 0.26); });
    label('vec blue', '<i>g</i>′(<i>x</i>) = <i>x</i>² − 2<i>x</i>', () => { const p = ax.to(1.0, -1.0); return worldPt(p.x + 0.45, p.y - 0.28); });

    updaters.push(t => {
      const x = M.xCubic(t), y = M.g(x), m = M.dg(x);
      setPos(moveDot, ax.to(x, y, 0.05));
      const dx = 0.45;
      moveTan.set(ax.to(x - dx, y - m * dx, 0.04), ax.to(x + dx, y + m * dx, 0.04));
    });
  }

  // ==================== 3 · RIEMANN RECTANGLES (via prims.area) ====================
  {
    const { S, g, worldPt } = makeBoard('riemann', 'Area by rectangles', 'midpoint Riemann bars fill the curved region under ½x²');
    const ax = axes(S, {
      x: [0, 3], y: [0, 4.6], size: [5.2, 3.5], at: [-2.6, CY - 1.75, 0],
      ticks: { x: 3, y: 4 }, names: { x: '<i>x</i>', y: '<i>y</i>' }, grid: true,
    });
    labels.push(...ax.labels);
    const riemArea = area(S, M.f, {
      axes: ax, x: [0, 3], bars: 6, rule: 'mid', pal: 'base', opacity: 0.22, name: 'Midpoint Riemann rectangles',
    });
    plot(S, M.f, { axes: ax, x: [0, 3], samples: 80, color: 'red', width: 0.04, name: 'Curve f(x) = ½x²' });

    // smooth gliding midpoint gauge showing the sample height f(x_mid) of the bar currently swept
    const sampleRod = rod(g, { r: 0.03, pal: 'red', name: 'Midpoint sample height', ex: [0, 0.25, 0.45] });
    const sampleDot = dot(g, 0.08, 'red', 'Midpoint sample', 'hi', [0, 0, 0.5]);

    label('vec red', '<i>f</i>(<i>x</i>) = ½<i>x</i>²', () => {
      const p = ax.to(2.75, M.f(2.75)); return worldPt(p.x - 0.35, p.y + 0.32);
    });
    label('vec blue', () => {
      const n = M.barsAt(clockT);
      return `${n} midpoint bars · sum ${fmt(M.riemannSum(M.f, 0, 3, n, 'mid'), 3)}`;
    }, () => {
      const p = ax.to(1.25, 2.35); return worldPt(p.x, p.y);
    });

    updaters.push(t => {
      const n = M.barsAt(t);
      riemArea.update(M.f, { bars: n });
      const x = M.xSweep(t), y = M.f(x);
      sampleRod.set(ax.to(x, 0, 0.04), ax.to(x, y, 0.04));
      setPos(sampleDot, ax.to(x, y, 0.05));
    });
  }

  // ==================== 4 · FUNDAMENTAL THEOREM OF CALCULUS ====================
  {
    const { S, g, worldPt } = makeBoard('ftc', 'The Fundamental Theorem', 'area under the slope curve ∫₀ˣ f′(t) dt equals the height f(x) − f(0)');
    const axSlope = axes(S, {
      x: [0, 3], y: [0, 3.2], size: [2.3, 3.3], at: [-3.15, CY - 1.65, 0],
      ticks: { x: 3, y: 3 }, names: { x: '<i>t</i>', y: '<i>f</i>′' }, grid: true,
    });
    const axHeight = axes(S, {
      x: [0, 3], y: [0, 4.6], size: [2.3, 3.3], at: [0.55, CY - 1.65, 0],
      ticks: { x: 3, y: 4 }, names: { x: '<i>x</i>', y: '<i>f</i>' }, grid: true,
    });
    labels.push(...axSlope.labels, ...axHeight.labels);

    const shadeSlope = area(S, M.df, {
      axes: axSlope, x: [0, 2], pal: 'blue', opacity: 0.34, name: 'Area ∫₀ˣ t dt',
    });
    plot(S, M.df, { axes: axSlope, x: [0, 3], samples: 40, color: 'blue', width: 0.036, name: 'Slope curve f′(t) = t' });
    plot(S, M.f, { axes: axHeight, x: [0, 3], samples: 64, color: 'hi', width: 0.038, name: 'Height curve f(x) = ½x²' });

    const heightBar = rod(g, { r: 0.042, pal: 'red', name: 'Accumulated height f(x)', ex: [0.25, 0, 0.4] });
    const heightDot = dot(g, 0.08, 'red', 'Point (x, f(x))', 'hi', [0, 0, 0.5]);

    label('vec blue', () => `area ∫₀ˣ <i>t</i> d<i>t</i> = ${fmt(M.f(M.xSweep(clockT)))}`, () => {
      const p = axSlope.to(1.4, 2.85); return worldPt(p.x, p.y + 0.25);
    });
    label('vec red', () => `height ½<i>x</i>² = ${fmt(M.f(M.xSweep(clockT)))}`, () => {
      const p = axHeight.to(1.5, 4.1); return worldPt(p.x, p.y + 0.25);
    });

    updaters.push(t => {
      const x = M.xSweep(t), y = M.f(x);
      shadeSlope.update(M.df, { x: [0, x] });
      const pBot = axHeight.to(x, 0, 0.04), pTop = axHeight.to(x, y, 0.04);
      heightBar.set(pBot, pTop);
      setPos(heightDot, pTop);
    });
  }

  // ==================== 5 · SIGNED AREA AND NET CHANGE ====================
  {
    const { S, g, worldPt } = makeBoard('accum', 'Signed area', 'area above the axis adds; area below subtracts');
    const ax = axes(S, {
      x: [0, 3], y: [-1.15, 1.15], size: [5.2, 3.4], at: [-2.6, CY, 0],
      ticks: { x: 3, y: 2 }, names: { x: '<i>t</i>', y: '' }, grid: true,
    });
    labels.push(...ax.labels);

    const signedShade = area(S, M.rateWave, {
      axes: ax, x: [0, 2], pal: 'red', opacity: 0.32, name: 'Signed area ∫₀ˣ cos(½π t) dt',
    });
    plot(S, M.rateWave, { axes: ax, x: [0, 3], samples: 96, color: 'red', width: 0.038, name: 'Rate v(t) = cos(½π t)' });
    plot(S, M.netWave, { axes: ax, x: [0, 3], samples: 96, color: 'blue', width: 0.038, name: 'Net change s(x) = (2/π) sin(½π x)' });

    const netDot = dot(g, 0.08, 'blue', 'Net change s(x)', 'hi', [0, 0, 0.5]);

    label('vec red', 'rate cos(½π<i>t</i>)', () => {
      const p = ax.to(0.45, 0.95); return worldPt(p.x + 0.35, p.y + 0.24);
    });
    label('vec blue', () => `net ∫₀ˣ = ${fmt(M.netWave(M.xSweep(clockT)))}`, () => {
      const x = M.xSweep(clockT), p = ax.to(x, M.netWave(x));
      return worldPt(p.x + 0.45, p.y + (M.netWave(x) >= 0 ? 0.32 : -0.32));
    });

    updaters.push(t => {
      const x = M.xSweep(t);
      signedShade.update(M.rateWave, { x: [0, x] });
      setPos(netDot, ax.to(x, M.netWave(x), 0.04));
    });
  }

  function update(t) {
    clockT = t;
    for (const fn of updaters) fn(t);
  }
  update(clockT);
  return { update, labels };
}
