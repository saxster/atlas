// Six stations in one 3D world for Chapter 6: Multivariable Calculus.
// Uses surface(), axes(), curve(), vector(), field(), and draggable().
import * as THREE from 'three';
import { PALETTE, part, box, rod, lines, V } from '@saxster/atlas/parts.js';
import { axes, curve, vector, surface, field } from '@saxster/atlas/prims.js';
import { draggable } from '@saxster/atlas/stage.js';
import * as M from './model.js';

export const STATIONS = [
  [ 0, 0, 0], // 0 · Partial derivative slice y = y₀ on dome
  [12, 0, 0], // 1 · Tangent plane & normal vector
  [24, 0, 0], // 2 · Gradient ∇f & level contours
  [36, 0, 0], // 3 · Saddle surface h(x, y) = ½(x² − y²)
  [48, 0, 0], // 4 · Divergence ∇·F & outward flux
  [60, 0, 0], // 5 · Curl ∇×G & circulation
];
export const at = (i, dx = 0, dy = 0, dz = 0) => [STATIONS[i][0] + dx, STATIONS[i][1] + dy, STATIONS[i][2] + dz];

const setPos = (m, p) => { m.position.copy(p); m.userData.home.copy(p); };
const dot = (g, r, pal, name, tone = 'hi', ex = [0, 0, 0]) =>
  part(g, new THREE.SphereGeometry(r, 24, 16), { pal, name, tone, ex });

function stationGroup(scene, i, flat3D = false) {
  const g = new THREE.Group();
  g.position.set(...STATIONS[i]);
  scene.add(g);
  if (flat3D) {
    const fl = part(g, box(6.2, 0.006, 6.2), { tone: 'lo', pal: 'board', pos: [0, -0.05, 0], name: 'Floor' });
    fl.userData.noEdge = true;
  } else {
    const brd = part(g, box(6.8, 4.6, 0.006), { tone: 'lo', pal: 'board', pos: [0, 2.0, -0.14], name: 'Board' });
    brd.userData.noEdge = true;
  }
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

  // ==================== 0 · PARTIAL DERIVATIVES (SLICE y = y₀) ====================
  {
    const st = stationGroup(scene, 0, true);
    const A = axes(st, { x: [-1.8, 1.8], y: [-1.8, 1.8], z: [0, 2.4], size: [4.2, 4.2, 2.4], at: [0, 0, 0], ticks: 3, grid: true,
      names: { x: '<i>x</i>', y: '<i>y</i>', z: '<i>z</i>' } });
    labels.push(...A.labels);

    const gSurf = asm('domeSlice', st, { title: 'Partial derivative ∂f/∂x', sub: 'slicing z = 2 − ½(x² + y²) with y = y₀ leaves a 1D parabola of slope −x₀' });
    const dome0 = surface(gSurf, (x, y) => Math.max(0, M.dome(x, y)), { x: [-1.6, 1.6], y: [-1.6, 1.6], axes: A, n: 36, pal: 'paper', name: 'Paraboloid dome' });
    dome0.object.material.transparent = true; dome0.object.material.opacity = 0.82;
    const sliceCurve = curve(gSurf, x => [x, 0.6, Math.max(0, M.dome(x, 0.6))], { t: [-1.6, 1.6], axes: A, samples: 80, radius: 0.024, color: 'red', name: 'Slice curve y = y₀' });
    const ptDot = dot(gSurf, 0.09, 'red', 'Point on surface');
    const tanX = vector(gSurf, [0, 0, 0], [1, 0, 0], { axes: A, color: 'amber', label: '∂<i>f</i>/∂<i>x</i> = −<i>x</i>₀', name: 'x-tangent vector' });
    labels.push(...tanX.labels);

    let drag0 = null;
    draggable(ptDot, {
      axes: A,
      constrain: ([x, y]) => {
        const xc = Math.max(-1.3, Math.min(1.3, x));
        const yc = Math.max(-1.3, Math.min(1.3, y));
        return [xc, yc, M.dome(xc, yc)];
      },
      onDrag: ([x, y]) => { drag0 = [x, y]; },
      onReset: () => { drag0 = null; },
    });

    updaters.push(s => {
      const x0 = drag0 ? drag0[0] : s.slice.x0;
      const y0 = drag0 ? drag0[1] : s.slice.y0;
      const z0 = M.dome(x0, y0), fx = M.domeFx(x0, y0), fy = M.domeFy(x0, y0);
      s.slice = { x0, y0, z0, fx, fy };
      setPos(ptDot, A.to(x0, y0, z0));
      sliceCurve.update(x => [x, y0, Math.max(0, M.dome(x, y0))]);
      tanX.set([x0, y0, z0], [x0 + 0.6, y0, z0 + fx * 0.6]);
    });
  }

  // ==================== 1 · TANGENT PLANE & NORMAL ====================
  {
    const st = stationGroup(scene, 1, true);
    const wPt = p => p.clone().add(st.position);
    const A = axes(st, { x: [-1.8, 1.8], y: [-1.8, 1.8], z: [0, 2.6], size: [4.2, 4.2, 2.4], at: [0, 0, 0], ticks: 3, grid: true,
      names: { x: '<i>x</i>', y: '<i>y</i>', z: '<i>z</i>' } });
    labels.push(...A.labels);

    const gTan = asm('tangentPlane', st, { title: 'The tangent plane', sub: 'spanned by (1, 0, f_x) and (0, 1, f_y), perpendicular to (−f_x, −f_y, 1)' });
    const dome1 = surface(gTan, (x, y) => Math.max(0, M.dome(x, y)), { x: [-1.5, 1.5], y: [-1.5, 1.5], axes: A, n: 36, pal: 'paper', name: 'Surface z = f(x, y)' });
    dome1.object.material.transparent = true; dome1.object.material.opacity = 0.82;
    const x0 = 0.8, y0 = 0.6, z0 = M.dome(x0, y0), fx = M.domeFx(x0, y0), fy = M.domeFy(x0, y0);
    const patch1 = surface(gTan, (x, y) => M.domeTangentPlane(x0, y0, x, y), { x: [x0 - 0.65, x0 + 0.65], y: [y0 - 0.65, y0 + 0.65], axes: A, n: 12, pal: 'amber', name: 'Tangent plane patch' });
    patch1.object.material.transparent = true; patch1.object.material.opacity = 0.85;
    const tanDot = dot(gTan, 0.085, 'red', 'Point of tangency');
    setPos(tanDot, A.to(x0, y0, z0));
    vector(gTan, [x0, y0, z0], [x0 + 0.7, y0, z0 + fx * 0.7], { axes: A, color: 'red', name: 'x-tangent' });
    vector(gTan, [x0, y0, z0], [x0, y0 + 0.7, z0 + fy * 0.7], { axes: A, color: 'green', name: 'y-tangent' });
    vector(gTan, [x0, y0, z0], [x0 - fx * 0.75, y0 - fy * 0.75, z0 + 0.75], { axes: A, color: 'blue', name: 'Surface normal' });
    label('vec red', '<b>t</b><sub><i>x</i></sub>', () => wPt(A.to(1.75, -0.35, 0.65)));
    label('board', '<b>t</b><sub><i>y</i></sub>', () => wPt(A.to(-0.25, 1.65, 1.15)));
    label('vec blue', '<b>n</b> = (−<i>f<sub>x</sub></i>, −<i>f<sub>y</sub></i>, 1)', () => wPt(A.to(1.65, 1.25, 2.48)));
  }

  // ==================== 2 · GRADIENT ∇f & LEVEL CONTOURS ====================
  {
    const st = stationGroup(scene, 2);
    const wPt = p => p.clone().add(st.position);
    const A = axes(st, { x: [-2, 2], y: [-2, 2], size: [4.0, 4.0], at: [0, 2.0, 0], ticks: 4, grid: true,
      names: { x: '<i>x</i>', y: '<i>y</i>' } });
    labels.push(...A.labels);

    const gGrad = asm('gradContours', st, { title: 'Gradient ∇f = (f_x, f_y)', sub: 'points straight uphill, perpendicular to every level contour f(x, y) = c' });
    field(gGrad, (x, y) => M.domeGrad(x, y), { axes: A, n: [6, 6], scale: 0.22, color: 'grey', name: 'Gradient field' });
    for (const r of [0.6, 1.1, 1.6]) {
      curve(gGrad, u => [r * Math.cos(u * 2 * Math.PI), r * Math.sin(u * 2 * Math.PI)], { t: [0, 1], axes: A, samples: 96, radius: 0.014, color: 'blue', name: `Contour r = ${r}` });
    }
    const probeDot = dot(gGrad, 0.085, 'red', 'Contour walker');
    const gVec = vector(gGrad, [1.1, 0], [0.4, 0], { axes: A, color: 'red', name: 'Gradient vector' });
    const tVec = vector(gGrad, [1.1, 0], [1.1, 0.7], { axes: A, color: 'green', name: 'Contour tangent' });
    label('vec red', '∇<i>f</i> (steepest ascent)', () => wPt(A.to(1.95, 1.55, 0.08)));
    label('board', '<b>u</b><sub>tan</sub> (<i>D</i><sub><b>u</b></sub><i>f</i> = 0)', () => wPt(A.to(1.95, -1.55, 0.08)));

    updaters.push(s => {
      const th = s.grad.th, r = 1.1;
      const x = r * Math.cos(th), y = r * Math.sin(th);
      const [gx, gy] = M.domeGrad(x, y);
      setPos(probeDot, A.to(x, y, 0.04));
      gVec.set([x, y], [x + gx * 0.65, y + gy * 0.65]);
      tVec.set([x, y], [x - Math.sin(th) * 0.65, y + Math.cos(th) * 0.65]);
    });
  }

  // ==================== 3 · SADDLE SURFACE & HESSIAN ====================
  {
    const st = stationGroup(scene, 3, true);
    const wPt = p => p.clone().add(st.position);
    const A = axes(st, { x: [-1.8, 1.8], y: [-1.8, 1.8], z: [-1.4, 1.4], size: [4.2, 4.2, 2.2], at: [0, 1.1, 0], ticks: 3, grid: true,
      names: { x: '<i>x</i>', y: '<i>y</i>', z: '<i>h</i>(<i>x</i>, <i>y</i>)' } });
    labels.push(...A.labels);

    const gSad = asm('saddleSurf', st, { title: 'Hyperbolic paraboloid h = ½(x² − y²)', sub: 'curves up along x (h_xx = +1) and down along y (h_yy = −1), so D = −1 < 0' });
    const sadMesh = surface(gSad, (x, y) => M.saddleSurf(x, y), { x: [-1.5, 1.5], y: [-1.5, 1.5], axes: A, n: 36, pal: 'paper', name: 'Saddle surface' });
    sadMesh.object.material.transparent = true; sadMesh.object.material.opacity = 0.82;
    curve(gSad, x => [x, 0, M.saddleSurf(x, 0)], { t: [-1.5, 1.5], axes: A, samples: 64, radius: 0.024, color: 'red', name: 'Upward parabola y = 0' });
    curve(gSad, y => [0, y, M.saddleSurf(0, y)], { t: [-1.5, 1.5], axes: A, samples: 64, radius: 0.024, color: 'green', name: 'Downward parabola x = 0' });
    const sadDot = dot(gSad, 0.09, 'amber', 'Saddle point (0, 0, 0)');
    setPos(sadDot, A.to(0, 0, 0));

    label('vec red', '<i>h<sub>xx</sub></i> = +1 (up)', () => wPt(A.to(-1.25, -0.35, 1.05)));
    label('board', '<i>h<sub>yy</sub></i> = −1 (down)', () => wPt(A.to(0.45, -1.35, -1.05)));
  }

  // ==================== 4 · DIVERGENCE ∇·F & OUTWARD FLUX ====================
  {
    const st = stationGroup(scene, 4);
    const wPt = p => p.clone().add(st.position);
    const A = axes(st, { x: [-2, 2], y: [-2, 2], size: [4.0, 4.0], at: [0, 2.0, 0], ticks: 4, grid: true,
      names: { x: '<i>x</i>', y: '<i>y</i>' } });
    labels.push(...A.labels);

    const gDiv = asm('divField', st, { title: 'Divergence ∇·F = ∂F_x/∂x + ∂F_y/∂y = 2', sub: 'outward flux through any closed loop equals ∬ (∇·F) dA' });
    field(gDiv, (x, y) => M.sourceField(x, y), { axes: A, n: [6, 6], scale: 0.22, color: 'grey', name: 'Source field F = (x, y)' });
    const R = 1.25;
    curve(gDiv, u => [R * Math.cos(u * 2 * Math.PI), R * Math.sin(u * 2 * Math.PI)], { t: [0, 1], axes: A, samples: 96, radius: 0.020, color: 'red', name: 'Flux boundary loop' });
    for (let k = 0; k < 8; k++) {
      const th = (k / 8) * 2 * Math.PI, c = Math.cos(th), sn = Math.sin(th);
      vector(gDiv, [R * c, R * sn], [(R + 0.42) * c, (R + 0.42) * sn], { axes: A, color: 'amber', name: 'Outward normal flux' });
    }
    label('vec red', '∇ · <b>F</b> = +2 (source)', () => wPt(A.to(0.85, 1.65, 0.08)));
  }

  // ==================== 5 · CURL ∇×G & CIRCULATION ====================
  {
    const st = stationGroup(scene, 5);
    const wPt = p => p.clone().add(st.position);
    const A = axes(st, { x: [-2, 2], y: [-2, 2], size: [4.0, 4.0], at: [0, 2.0, 0], ticks: 4, grid: true,
      names: { x: '<i>x</i>', y: '<i>y</i>' } });
    labels.push(...A.labels);

    const gCurl = asm('curlField', st, { title: 'Curl (∇×G)_z = ∂G_y/∂x − ∂G_x/∂y = 2', sub: 'circulation around a loop equals ∬ (∇×G)_z dA (Green’s theorem)' });
    field(gCurl, (x, y) => M.vortexField(x, y), { axes: A, n: [6, 6], scale: 0.22, color: 'grey', name: 'Vortex field G = (−y, x)' });
    const R = 1.25;
    curve(gCurl, u => [R * Math.cos(u * 2 * Math.PI), R * Math.sin(u * 2 * Math.PI)], { t: [0, 1], axes: A, samples: 96, radius: 0.020, color: 'blue', name: 'Circulation loop' });

    const wheel = new THREE.Group();
    wheel.position.copy(A.to(0, 0, 0.04));
    gCurl.add(wheel);
    const p1 = rod(wheel, { r: 0.022, pal: 'red', name: 'Paddle 1' });
    p1.set(V(-0.45, 0, 0), V(0.45, 0, 0));
    const p2 = rod(wheel, { r: 0.022, pal: 'red', name: 'Paddle 2' });
    p2.set(V(0, -0.45, 0), V(0, 0.45, 0));
    dot(wheel, 0.075, 'amber', 'Paddle hub');

    label('vec blue', '(∇ × <b>G</b>)<sub><i>z</i></sub> = +2', () => wPt(A.to(0.85, 1.65, 0.08)));
    updaters.push(s => {
      wheel.rotation.z = s.curl.angle;
    });
  }

  function update(state, look) {
    for (const fn of updaters) fn(state, look);
  }
  return { update, labels };
}
