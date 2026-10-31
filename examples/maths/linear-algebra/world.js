// Six drawing boards along a table for Chapter 3: Linear transformations.
// Built with engine/prims.js (axes, lattice, vector, plot) and engine/parts.js.
import * as THREE from 'three';
import { PALETTE, part, box, rod, lines, shadeMat, V } from '@saxster/atlas/parts.js';
import { axes, lattice, vector, plot } from '@saxster/atlas/prims.js';
import { draggable } from '@saxster/atlas/stage.js';
import * as M from './model.js';

export const STATIONS = { basis: 0, shear: 8.5, det: 17, collapse: 25.5, eigen: 34, compose: 42.5 };
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

  const dot = (g, r, pal, name, tone = 'hi', ex = [0, 0, 0]) =>
    part(g, new THREE.SphereGeometry(r, 24, 16), { pal, name, tone, ex });

  // Helper for a live parallelogram quad filled between 4 data points
  function makeQuad(parent, ax, pal = 'blue', opacity = 0.15, name = 'Parallelogram') {
    const pos = new Float32Array(12);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setIndex([0, 1, 2, 0, 2, 3]);
    const mat = shadeMat(pal, { opacity: Math.min(opacity, 0.15) });
    mat.side = THREE.DoubleSide;
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData = { name, noEdge: true };
    parent.add(mesh);
    return {
      mesh,
      set(corners) {
        for (let i = 0; i < 4; i++) {
          const p = ax.to(corners[i][0], corners[i][1], 0.008);
          pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z;
        }
        geo.attributes.position.needsUpdate = true;
        geo.computeVertexNormals();
      },
    };
  }

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
  const drag = { mat0: null, k: null, mat2: null, d: null, theta: null };
  const mat0Now = (t = clockT) => drag.mat0 ?? M.lerpMat(M.MAT_I, M.MAT_A, M.sSweep(t));
  const kNow = (t = clockT) => drag.k ?? M.kAt(t);
  const mat2Now = (t = clockT) => drag.mat2 ?? M.lerpMat(M.MAT_I, M.MAT_A, M.sSweep(t));
  const dNow = (t = clockT) => drag.d ?? M.dCollapseAt(t);
  const thetaNow = (t = clockT) => drag.theta ?? M.thetaAt(t);
  const updaters = [];

  // ==================== 0 · BASIS COLUMNS & LATTICE ====================
  {
    const { S, g, worldPt } = makeBoard('basis', 'Columns are landing spots', 'gridlines stay parallel and evenly spaced; A(x, y) = x Aî + y Aĵ');
    const ax = axes(S, {
      x: [-0.5, 2.5], y: [-0.5, 2.5], size: [5.0, 3.5], at: [-1.65, CY - 1.15, 0],
      ticks: { x: 3, y: 3 }, names: { x: '<i>x</i>', y: '<i>y</i>' }, grid: true,
    });
    labels.push(...ax.labels);

    const lat = lattice(S, (x, y) => [x, y], {
      axes: ax, x: [0, 2], y: [0, 2], n: 4, samples: 8, color: '#9a7b38', opacity: 0.55, name: 'Transformed coordinate grid',
    });
    const vI = vector(g, [0, 0], [1, 0], { axes: ax, color: 'red', name: 'First column Aî' });
    const vJ = vector(g, [0, 0], [0, 1], { axes: ax, color: 'blue', name: 'Second column Aĵ' });
    const pDot = dot(g, 0.08, 'ink', 'Image of P(1, 1) = Aî + Aĵ');

    draggable(vI, {
      axes: ax,
      constrain: ([x, y]) => [Math.min(2.2, Math.max(-0.4, x)), Math.min(2.2, Math.max(-0.4, y)), 0],
      onDrag: ([a, c]) => { const cur = mat0Now(); drag.mat0 = { a, b: cur.b, c, d: cur.d }; },
      onReset: () => { drag.mat0 = null; },
    });
    draggable(vJ, {
      axes: ax,
      constrain: ([x, y]) => [Math.min(2.2, Math.max(-0.4, x)), Math.min(2.2, Math.max(-0.4, y)), 0],
      onDrag: ([b, d]) => { const cur = mat0Now(); drag.mat0 = { a: cur.a, b, c: cur.c, d }; },
      onReset: () => { drag.mat0 = null; },
    });

    label('vec red', () => {
      const Ms = mat0Now();
      return `<i>A</i><b>î</b> (${fmt(Ms.a, 1)}, ${fmt(Ms.c, 1)})`;
    }, () => {
      const Ms = mat0Now();
      const p = ax.to(Ms.a, Ms.c);
      return worldPt(p.x + 0.52, p.y - 0.18);
    });
    label('vec blue', () => {
      const Ms = mat0Now();
      return `<i>A</i><b>ĵ</b> (${fmt(Ms.b, 1)}, ${fmt(Ms.d, 1)})`;
    }, () => {
      const Ms = mat0Now();
      const p = ax.to(Ms.b, Ms.d);
      return worldPt(p.x - 0.58, p.y + 0.25);
    });

    updaters.push(t => {
      const Ms = mat0Now(t);
      lat.update((x, y) => M.applyMat(Ms, [x, y]));
      vI.set([0, 0], [Ms.a, Ms.c]);
      vJ.set([0, 0], [Ms.b, Ms.d]);
      const p11 = M.applyMat(Ms, M.P0);
      pDot.position.copy(ax.to(p11[0], p11[1], 0.05));
    });
  }

  // ==================== 1 · SHEAR AND ROTATION ====================
  {
    const { S, g, worldPt } = makeBoard('shear', 'Shear and rotation', 'a horizontal shear slides layers along x while keeping height and area = 1 fixed');
    const ax = axes(S, {
      x: [-0.4, 2.6], y: [-0.3, 2.2], size: [5.0, 3.5], at: [-1.85, CY - 1.35, 0],
      ticks: { x: 3, y: 2 }, names: { x: '<i>x</i>', y: '<i>y</i>' }, grid: true,
    });
    labels.push(...ax.labels);

    const quad = makeQuad(S, ax, 'blue', 0.22, 'Sheared unit parallelogram (area = 1)');
    const lat = lattice(S, (x, y) => [x, y], {
      axes: ax, x: [0, 1.5], y: [0, 1.8], n: 3, samples: 6, color: '#8a8275', opacity: 0.5, name: 'Sheared grid',
    });
    const vI = vector(g, [0, 0], [1, 0], { axes: ax, color: 'red', name: 'Fixed horizontal basis î = (1, 0)' });
    const vJ = vector(g, [0, 0], [0, 1], { axes: ax, color: 'blue', name: 'Sheared vertical basis Sĵ = (k, 1)' });

    draggable(vJ, {
      axes: ax,
      constrain: ([x]) => [Math.min(1.5, Math.max(-0.3, x)), 1, 0],
      onDrag: ([k]) => { drag.k = k; },
      onReset: () => { drag.k = null; },
    });

    label('vec blue', () => {
      const k = kNow();
      return `<i>S</i><b>ĵ</b> = (${fmt(k)}, 1)`;
    }, () => {
      const k = kNow(), p = ax.to(k, 1);
      return worldPt(p.x + 0.48, p.y + 0.26);
    });
    label('board', 'area = 1.00', () => {
      const k = kNow(), p = ax.to(0.5 + 0.5 * k, 0.45);
      return worldPt(p.x, p.y);
    });

    updaters.push(t => {
      const k = kNow(t), Sk = M.shearMat(k);
      lat.update((x, y) => M.applyMat(Sk, [x, y]));
      quad.set(M.unitSquareCorners(Sk));
      vI.set([0, 0], [1, 0]);
      vJ.set([0, 0], [k, 1]);
    });
  }

  // ==================== 2 · DETERMINANT IS AREA ====================
  {
    const { S, g, worldPt } = makeBoard('det', 'The determinant is area', 'the unit square becomes a parallelogram of signed area det(A) = ad − bc');
    const ax = axes(S, {
      x: [-0.3, 2.4], y: [-0.3, 2.2], size: [5.0, 3.5], at: [-1.95, CY - 1.35, 0],
      ticks: { x: 2, y: 2 }, names: { x: '<i>x</i>', y: '<i>y</i>' }, grid: true,
    });
    labels.push(...ax.labels);

    const quad = makeQuad(S, ax, 'red', 0.24, 'Transformed unit square (area = ad − bc)');
    const lat = lattice(S, (x, y) => [x, y], {
      axes: ax, x: [0, 1], y: [0, 1], n: 4, samples: 6, color: '#a84b3a', opacity: 0.45, name: 'Sub-squares inside unit square',
    });
    const vI = vector(g, [0, 0], [1, 0], { axes: ax, color: 'red', name: 'Column 1: (a, c)' });
    const vJ = vector(g, [0, 0], [0, 1], { axes: ax, color: 'blue', name: 'Column 2: (b, d)' });
    const topRod = rod(g, { r: 0.022, pal: 'blue', name: 'Parallel side Aĵ from Aî' });
    const rightRod = rod(g, { r: 0.022, pal: 'red', name: 'Parallel side Aî from Aĵ' });

    draggable(vI, {
      axes: ax,
      constrain: ([x, y]) => [Math.min(2.0, Math.max(-0.2, x)), Math.min(1.8, Math.max(-0.2, y)), 0],
      onDrag: ([a, c]) => { const cur = mat2Now(); drag.mat2 = { a, b: cur.b, c, d: cur.d }; },
      onReset: () => { drag.mat2 = null; },
    });
    draggable(vJ, {
      axes: ax,
      constrain: ([x, y]) => [Math.min(2.0, Math.max(-0.2, x)), Math.min(1.8, Math.max(-0.2, y)), 0],
      onDrag: ([b, d]) => { const cur = mat2Now(); drag.mat2 = { a: cur.a, b, c: cur.c, d }; },
      onReset: () => { drag.mat2 = null; },
    });

    label('vec red', () => {
      const Ms = mat2Now();
      return `det = ${fmt(M.det(Ms), 3)}`;
    }, () => {
      const Ms = mat2Now();
      const c = M.applyMat(Ms, [1, 1]), p = ax.to(c[0], c[1]);
      return worldPt(p.x + 0.42, p.y + 0.22);
    });

    updaters.push(t => {
      const Ms = mat2Now(t);
      const corners = M.unitSquareCorners(Ms);
      quad.set(corners);
      lat.update((x, y) => M.applyMat(Ms, [x, y]));
      vI.set([0, 0], corners[1]);
      vJ.set([0, 0], corners[3]);
      topRod.set(ax.to(corners[1][0], corners[1][1], 0.03), ax.to(corners[2][0], corners[2][1], 0.03));
      rightRod.set(ax.to(corners[3][0], corners[3][1], 0.03), ax.to(corners[2][0], corners[2][1], 0.03));
    });
  }

  // ==================== 3 · SINGULAR COLLAPSE (det = 0) ====================
  {
    const { S, g, worldPt } = makeBoard('collapse', 'Zero determinant and collapse', 'when column 2 is a multiple of column 1, det = 0 and all of 2D squashes onto a line');
    const ax = axes(S, {
      x: [-0.4, 2.2], y: [-0.4, 1.8], size: [5.0, 3.5], at: [-1.75, CY - 1.15, 0],
      ticks: { x: 2, y: 2 }, names: { x: '<i>x</i>', y: '<i>y</i>' }, grid: true,
    });
    labels.push(...ax.labels);

    // Target rank-1 span line y = (2/3) x
    plot(S, x => (2 / 3) * x, {
      axes: ax, x: [-0.35, 2.15], samples: 24, color: 'grey', width: 0.02, name: 'Column-space line y = ⅔x',
    });
    const quad = makeQuad(S, ax, 'red', 0.2, 'Collapsing parallelogram');
    const lat = lattice(S, (x, y) => [x, y], {
      axes: ax, x: [0, 1.2], y: [0, 1.2], n: 3, samples: 6, color: '#8a8275', opacity: 0.5, name: 'Flattening grid',
    });
    const vI = vector(g, [0, 0], [1.2, 0.8], { axes: ax, color: 'red', name: 'Column 1: (1.2, 0.8)' });
    const vJ = vector(g, [0, 0], [0.6, 1.0], { axes: ax, color: 'blue', name: 'Column 2: (0.6, d)' });

    draggable(vJ, {
      axes: ax,
      constrain: ([, y]) => [0.6, Math.min(1.4, Math.max(-0.2, y)), 0],
      onDrag: ([, d]) => { drag.d = d; },
      onReset: () => { drag.d = null; },
    });

    label('vec blue', () => {
      const d = dNow(), C = M.collapseMat(d);
      return `<i>d</i> = ${fmt(d)} · det = ${fmt(M.det(C))}`;
    }, () => {
      const p = ax.to(0.85, 1.52);
      return worldPt(p.x, p.y);
    });
    label('board', 'span <i>y</i> = ⅔<i>x</i>', () => {
      const p = ax.to(1.75, 1.16);
      return worldPt(p.x + 0.35, p.y - 0.25);
    });

    updaters.push(t => {
      const d = dNow(t), C = M.collapseMat(d);
      lat.update((x, y) => M.applyMat(C, [x, y]));
      quad.set(M.unitSquareCorners(C));
      vI.set([0, 0], [C.a, C.c]);
      vJ.set([0, 0], [C.b, C.d]);
    });
  }

  // ==================== 4 · EIGENVECTORS (Av = λv) ====================
  {
    const { S, g, worldPt } = makeBoard('eigen', 'Eigenvectors stay on their span', 'along v₁ = (1, 1) and v₂ = (−1, 1), E stretches the vector without turning it');
    const ax = axes(S, {
      x: [-2.2, 2.2], y: [-2.2, 2.2], size: [4.6, 3.5], at: [0, CY, 0],
      ticks: { x: 2, y: 2 }, names: { x: '<i>x</i>', y: '<i>y</i>' }, grid: true,
    });
    labels.push(...ax.labels);

    // Two invariant eigen-lines y = x (λ₁ = 2) and y = −x (λ₂ = 1)
    plot(S, x => x, { axes: ax, x: [-2.0, 2.0], samples: 16, color: 'red', width: 0.022, name: 'Eigen-axis v₁ (λ₁ = 2)' });
    plot(S, x => -x, { axes: ax, x: [-2.0, 2.0], samples: 16, color: 'blue', width: 0.022, name: 'Eigen-axis v₂ (λ₂ = 1)' });

    const vIn = vector(g, [0, 0], [1, 0], { axes: ax, color: 'ink', name: 'Revolving unit vector u(θ)' });
    const vOut = vector(g, [0, 0], [1.5, 0.5], { axes: ax, color: 'red', name: 'Transformed vector E u(θ)' });

    draggable(vIn, {
      axes: ax,
      constrain: ([x, y]) => {
        const th = Math.atan2(y, x);
        return [Math.cos(th), Math.sin(th), 0, th];
      },
      onDrag: ([, , , th]) => { drag.theta = (th + 2 * Math.PI) % (2 * Math.PI); },
      onReset: () => { drag.theta = null; },
    });

    label('vec red', '<b>v</b>₁: <i>E</i><b>v</b>₁ = 2<b>v</b>₁', () => {
      const p = ax.to(1.45, 1.65); return worldPt(p.x + 0.35, p.y + 0.18);
    });
    label('vec blue', '<b>v</b>₂: <i>E</i><b>v</b>₂ = 1<b>v</b>₂', () => {
      const p = ax.to(-1.45, 1.65); return worldPt(p.x - 0.35, p.y + 0.18);
    });

    updaters.push(t => {
      const th = thetaNow(t);
      const u = [Math.cos(th), Math.sin(th)];
      const eu = M.applyMat(M.MAT_E, u);
      vIn.set([0, 0], u);
      vOut.set([0, 0], eu);
    });
  }

  // ==================== 5 · MATRIX COMPOSITION (RS ≠ SR) ====================
  {
    const { S, g, worldPt } = makeBoard('compose', 'Order matters: RS ≠ SR', 'shear then rotate (left) lands at (−1, 2); rotate then shear (right) lands at (0, 1)');
    const axRS = axes(S, {
      x: [-1.5, 1.5], y: [-0.4, 2.2], size: [2.25, 3.2], at: [-1.75, CY - 1.15, 0],
      ticks: { x: 1, y: 2 }, names: { x: '<i>x</i>', y: '' }, grid: true,
    });
    const axSR = axes(S, {
      x: [-1.5, 1.5], y: [-0.4, 2.2], size: [2.25, 3.2], at: [1.75, CY - 1.15, 0],
      ticks: { x: 1, y: 2 }, names: { x: '<i>x</i>', y: '' }, grid: true,
    });
    labels.push(...axRS.labels, ...axSR.labels);

    const quadRS = makeQuad(S, axRS, 'red', 0.24, 'Unit square under RS');
    const quadSR = makeQuad(S, axSR, 'blue', 0.24, 'Unit square under SR');
    const vRS = vector(g, [0, 0], [-1, 2], { axes: axRS, color: 'red', name: 'Image RS(1, 1)' });
    const vSR = vector(g, [0, 0], [0, 1], { axes: axSR, color: 'blue', name: 'Image SR(1, 1)' });

    label('vec red', '<i>RS</i>(1, 1) → (−1, 2)', () => {
      const p = axRS.to(0, 2.05); return worldPt(p.x, p.y + 0.22);
    });
    label('vec blue', '<i>SR</i>(1, 1) → (0, 1)', () => {
      const p = axSR.to(0, 2.05); return worldPt(p.x, p.y + 0.22);
    });

    updaters.push(t => {
      const s = M.sSweep(t);
      const Mrs = M.lerpMat(M.MAT_I, M.MAT_RS, s);
      const Msr = M.lerpMat(M.MAT_I, M.MAT_SR, s);
      quadRS.set(M.unitSquareCorners(Mrs));
      quadSR.set(M.unitSquareCorners(Msr));
      vRS.set([0, 0], M.applyMat(Mrs, [1, 1]));
      vSR.set([0, 0], M.applyMat(Msr, [1, 1]));
    });
  }

  function stateAt(t = clockT) {
    return {
      s: M.sSweep(t),
      mat0: mat0Now(t),
      k: kNow(t),
      mat2: mat2Now(t),
      d: dNow(t),
      theta: thetaNow(t),
      drag,
    };
  }
  function update(t) {
    clockT = t;
    for (const fn of updaters) fn(t);
  }
  update(clockT);
  return { update, labels, stateAt, drag };
}
