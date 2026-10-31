// Six 3D stations along x for Chapter 2: Atomic orbitals.
// Built with @saxster/atlas/parts.js, @saxster/atlas/prims.js, and @saxster/atlas/stage.js.
import * as THREE from 'three';
import { PALETTE, part, cyl, rod, shadeMat, lines, V } from '@saxster/atlas/parts.js';
import { axes, plot, area, surface, particles } from '@saxster/atlas/prims.js';
import { draggable } from '@saxster/atlas/stage.js';
import * as M from './model.js';

export const STATIONS = {
  cloud1s: 0,
  radial1s: 12,
  node2s: 24,
  porbitals: 36,
  dorbitals: 49,
  staircase: 62,
};
export const CY = 1.65;

const fmt = (x, n = 2) => (x < -5 * 10 ** -(n + 1) ? '−' : '') + Math.abs(x).toFixed(n);

export function buildWorld(E) {
  const { scene, asm } = E;
  PALETTE.amber = ['#f5c96b', '#d99b26', '#9e6d14'];
  PALETTE.green = ['#6bc48e', '#2e8b57', '#1e5e3a'];
  PALETTE.node  = ['#e6e2d8', '#b8b2a6', '#8a8478'];

  const root = new THREE.Group(); scene.add(root);
  const labels = [];
  const label = (cls, html, at) =>
    typeof html === 'function' ? labels.push({ cls, html: html(), at, text: html }) : labels.push({ cls, html, at });

  // Faint graph-paper floor
  const gnd = [];
  for (let x = -8; x <= 72; x += 2) gnd.push(x, -0.45, -8, x, -0.45, 8);
  for (let z = -8; z <= 8; z += 2) gnd.push(-8, -0.45, z, 72, -0.45, z);
  lines(root, gnd, '#e8e8e3');

  const setPos = (m, p) => { m.position.copy(p); m.userData.home.copy(p); };
  const dot = (g, r, pal, name, tone = 'hi', ex = [0, 0, 0]) =>
    part(g, new THREE.SphereGeometry(r, 24, 16), { pal, name, tone, ex });

  // Populate instanced particle clouds from M.sampleOrbital
  function buildCloud(parent, kind, count, seed, { scale = 1.0, radius = 0.042, halfCut = false, exScale = 0.25 } = {}) {
    const { pos, neg } = M.sampleOrbital(kind, count, seed, { scale, halfCut });
    const grp = new THREE.Group(); parent.add(grp);
    if (pos.length > 0) {
      const pMesh = particles(grp, pos.length, { radius, color: 'blue', name: `${kind} (+ phase)` });
      pos.forEach((pt, i) => pMesh.set(i, [pt.x, pt.y, pt.z]));
      pMesh.show(pos.length);
      pMesh.object.userData.ex.set(0, exScale, 0);
    }
    if (neg.length > 0) {
      const nMesh = particles(grp, neg.length, { radius, color: 'red', name: `${kind} (− phase)` });
      neg.forEach((pt, i) => nMesh.set(i, [pt.x, pt.y, pt.z]));
      nMesh.show(neg.length);
      nMesh.object.userData.ex.set(0, -exScale, 0);
    }
    return grp;
  }

  // Coordinate crosshairs through a nucleus
  function addCrosshair(parent, len = 1.5) {
    lines(parent, [-len, 0, 0, len, 0, 0, 0, -len, 0, 0, len, 0, 0, 0, -len, 0, 0, len], '#b8b8be');
  }

  let clockT = 1.6;
  const drag = { r1: null, r2: null };
  const r1Now = (t = clockT) => drag.r1 ?? M.rSweep1s(t);
  const r2Now = (t = clockT) => drag.r2 ?? M.rSweep2s(t);
  const spins = [];
  const updaters = [];

  // ==================== 0 · 1s PROBABILITY CLOUD vs |ψ₁ₛ|² ====================
  {
    const x0 = STATIONS.cloud1s;
    const g = asm('cloud1s', root, {
      title: '1s electron cloud & density |ψ₁ₛ(r)|²',
      sub: 'each dot is an independent position measurement; density |ψ|² is highest at the nucleus r = 0',
    });
    const spin = new THREE.Group(); spin.position.set(x0 - 1.75, CY, 0); g.add(spin); spins.push(spin);
    addCrosshair(spin, 1.55);
    dot(spin, 0.08, 'amber', 'Proton nucleus (r = 0)', 'lit');
    buildCloud(spin, '1s', 280, 101, { scale: 0.52, radius: 0.042 });

    const ax = axes(g, {
      x: [0, 4], y: [0, 0.35], size: [3.2, 2.3], at: [x0 + 0.35, CY - 1.15, 0],
      ticks: { x: 4, y: 3 }, names: { x: '<i>r</i> (<i>a</i><sub>0</sub>)', y: '|ψ<sub>1s</sub>|²' }, grid: true,
    });
    labels.push(...ax.labels);
    plot(g, M.psi1sSq, { axes: ax, x: [0, 4], samples: 90, color: 'blue', width: 0.04, name: '|ψ₁ₛ(r)|² = (1/π)e^(−2r)' });
    area(g, M.psi1sSq, { axes: ax, x: [0, 4], pal: 'blue', opacity: 0.22, name: 'Volume density profile' });

    const nucDot = dot(g, 0.075, 'amber', 'Maximum density at nucleus (r = 0)', 'lit', [0, 0.2, 0.3]);
    setPos(nucDot, ax.to(0, M.psi1sSq(0), 0.04));

    label('board', '1s cloud (ψ &gt; 0)', () => V(x0 - 2.35, CY + 1.55, 0));
    label('vec blue', '|ψ<sub>1s</sub>(0)|² = 1/π ≈ 0.318', () => ax.to(0.25, 0.31).add(V(0.15, 0.08, 0.05)));
  }

  // ==================== 1 · RADIAL DISTRIBUTION P₁ₛ(r) = 4r²e^(−2r) ====================
  {
    const x0 = STATIONS.radial1s;
    const g = asm('radial1s', root, {
      title: 'Spherical shell area 4πr² × density |ψ|²',
      sub: 'drag the point on P₁ₛ(r) to resize the spherical shell and see why probability peaks at r = 1 a₀',
    });
    const spin = new THREE.Group(); spin.position.set(x0 - 1.85, CY, 0); g.add(spin); spins.push(spin);
    addCrosshair(spin, 1.65);
    dot(spin, 0.075, 'amber', 'Nucleus', 'lit');
    buildCloud(spin, '1s', 240, 107, { scale: 0.48, radius: 0.038 });

    // Translucent spherical shell of radius r * 0.48
    const shellMat = shadeMat('red', { opacity: 0.28 });
    shellMat.side = THREE.DoubleSide;
    const shellMesh = part(spin, new THREE.SphereGeometry(1, 32, 24), {
      pal: 'red', tone: 'mid', name: 'Spherical shell of radius r and thickness dr', mat: shellMat,
    });
    shellMesh.userData.noEdge = true;
    shellMesh.renderOrder = 2;

    const ax = axes(g, {
      x: [0, 4], y: [0, 0.65], size: [3.3, 2.35], at: [x0 + 0.3, CY - 1.15, 0],
      ticks: { x: 4, y: 3 }, names: { x: '<i>r</i> (<i>a</i><sub>0</sub>)', y: '<i>P</i><sub>1s</sub>(<i>r</i>)' }, grid: true,
    });
    labels.push(...ax.labels);

    const shadeP = area(g, M.P1s, { axes: ax, x: [0, 1.0], pal: 'red', opacity: 0.26, name: 'Integrated probability ∫₀ʳ P₁ₛ dr' });
    plot(g, M.P1s, { axes: ax, x: [0, 4], samples: 100, color: 'red', width: 0.042, name: 'P₁ₛ(r) = 4r²e^(−2r)' });
    // Scaled density 0.15 * 4e^(-2r) and shell area 0.08 * r^2 as visual guides
    plot(g, r => 0.15 * M.density1sScaled(r), { axes: ax, x: [0, 4], samples: 80, color: 'blue', width: 0.024, name: ' Falling density ∝ e^(−2r)' });
    plot(g, r => Math.min(0.64, 0.08 * M.shellAreaScaled(r)), { axes: ax, x: [0, 2.8], samples: 60, color: 'grey', width: 0.022, name: 'Rising shell area ∝ 4πr²' });

    const rBar = rod(g, { r: 0.028, pal: 'red', name: 'Shell probability P₁ₛ(r)', ex: [0.2, 0, 0.3] });
    const rDot = dot(g, 0.082, 'red', 'Drag shell radius r', 'lit', [0, 0, 0.45]);

    draggable(rDot, {
      axes: ax,
      constrain: ([r]) => {
        const rc = Math.min(3.8, Math.max(0.1, r));
        return [rc, M.P1s(rc), 0.04];
      },
      onDrag: ([rc]) => { drag.r1 = rc; },
      onReset: () => { drag.r1 = null; },
    });

    label('vec red', () => `shell <i>r</i> = ${fmt(r1Now())} <i>a</i><sub>0</sub>`, () => V(x0 - 2.4, CY + 1.55, 0));
    label('vec red', 'peak <i>r</i> = 1.00 <i>a</i><sub>0</sub>', () => ax.to(1.0, M.P1s(1.0)).add(V(0.18, 0.18, 0.05)));

    updaters.push(t => {
      const r = r1Now(t), p = M.P1s(r);
      shellMesh.scale.setScalar(Math.max(0.06, r * 0.48));
      shadeP.update(M.P1s, { x: [0, r] });
      const pBot = ax.to(r, 0, 0.04), pTop = ax.to(r, p, 0.04);
      rBar.set(pBot, pTop);
      setPos(rDot, pTop);
    });
  }

  // ==================== 2 · 2s RADIAL NODE (CUTAWAY SPHERE) ====================
  {
    const x0 = STATIONS.node2s;
    const g = asm('node2s', root, {
      title: 'The 2s orbital & its radial node at r = 2 a₀',
      sub: 'inner positive core (+ blue) and outer negative shell (− red) separated by a spherical node where ψ₂ₛ = 0',
    });
    const spin = new THREE.Group(); spin.position.set(x0 - 1.85, CY, 0); g.add(spin); spins.push(spin);
    addCrosshair(spin, 1.75);
    dot(spin, 0.07, 'amber', 'Nucleus', 'lit');
    buildCloud(spin, '2s', 380, 202, { scale: 0.22, radius: 0.038, halfCut: true });

    // Translucent nodal sphere at r = 2.0 a₀ (world radius 2.0 * 0.22 = 0.44)
    const nodeMat = shadeMat('node', { opacity: 0.34 });
    nodeMat.side = THREE.DoubleSide;
    const nodeSph = part(spin, new THREE.SphereGeometry(2.0 * 0.22, 32, 24), {
      pal: 'node', tone: 'lo', name: 'Spherical radial node (r = 2 a₀, ψ = 0)', mat: nodeMat, ex: [0, 0.3, 0],
    });
    nodeSph.userData.noEdge = true;
    nodeSph.renderOrder = 2;

    const ax = axes(g, {
      x: [0, 10], y: [0, 0.22], size: [3.3, 2.35], at: [x0 + 0.3, CY - 1.15, 0],
      ticks: { x: 5, y: 3 }, names: { x: '<i>r</i> (<i>a</i><sub>0</sub>)', y: '<i>P</i><sub>2s</sub>(<i>r</i>)' }, grid: true,
    });
    labels.push(...ax.labels);

    area(g, M.P2s, { axes: ax, x: [0, 2], pal: 'blue', opacity: 0.28, name: 'Inner core (ψ > 0)' });
    area(g, M.P2s, { axes: ax, x: [2, 10], pal: 'red', opacity: 0.24, name: 'Outer shell (ψ < 0)' });
    plot(g, M.P2s, { axes: ax, x: [0, 10], samples: 120, color: 'hi', width: 0.04, name: 'P₂ₛ(r) = ½r²(1 − r/2)²e^(−r)' });

    const nodeDot = dot(g, 0.078, 'amber', 'Radial node at r = 2 a₀', 'lit', [0, 0.2, 0.35]);
    setPos(nodeDot, ax.to(2.0, 0, 0.05));

    const scanDot = dot(g, 0.075, 'red', 'Drag radius r along P₂ₛ(r)', 'lit', [0, 0, 0.45]);
    draggable(scanDot, {
      axes: ax,
      constrain: ([r]) => {
        const rc = Math.min(9.6, Math.max(0.15, r));
        return [rc, M.P2s(rc), 0.05];
      },
      onDrag: ([rc]) => { drag.r2 = rc; },
      onReset: () => { drag.r2 = null; },
    });

    label('board', '2s cutaway: + core / − shell', () => V(x0 - 0.85, CY - 1.58, 0.08));
    label('mark', 'node <i>r</i> = 2 <i>a</i><sub>0</sub>', () => ax.to(4.2, 0.03).add(V(0, 0.24, 0.05)));
    label('vec red', 'outer peak 5.24 <i>a</i><sub>0</sub>', () => ax.to(8.8, M.P2s(5.24)).add(V(0, 0.14, 0.05)));

    updaters.push(t => {
      const r = r2Now(t);
      setPos(scanDot, ax.to(r, M.P2s(r), 0.05));
    });
  }

  // ==================== 3 · THE 2p ORBITALS & NODAL PLANES ====================
  {
    const x0 = STATIONS.porbitals;
    const g = asm('porbitals', root, {
      title: 'The three 2p orbitals (2p_x, 2p_y, 2p_z)',
      sub: 'two lobes of opposite phase (+ blue, − red) separated by one planar angular node through the nucleus',
    });

    const pConfigs = [
      { kind: '2pz', dx: -2.25, label: '2p<sub>z</sub> (node: <i>xy</i> plane)', rot: [Math.PI / 2, 0, 0] },
      { kind: '2px', dx: 0.0,   label: '2p<sub>x</sub> (node: <i>yz</i> plane)', rot: [0, Math.PI / 2, 0] },
      { kind: '2py', dx: 2.25,  label: '2p<sub>y</sub> (node: <i>xz</i> plane)', rot: [0, 0, 0] },
    ];
    const planeGeo = new THREE.PlaneGeometry(1.75, 1.75);
    const planeMat = shadeMat('node', { opacity: 0.36 });
    planeMat.side = THREE.DoubleSide;

    for (const [idx, cfg] of pConfigs.entries()) {
      const spin = new THREE.Group(); spin.position.set(x0 + cfg.dx, CY, 0); g.add(spin); spins.push(spin);
      addCrosshair(spin, 1.15);
      dot(spin, 0.06, 'amber', 'Nucleus', 'lit');
      buildCloud(spin, cfg.kind, 220, 301 + idx * 17, { scale: 0.16, radius: 0.036, exScale: 0.32 });
      const pl = part(spin, planeGeo, {
        pal: 'node', tone: 'lo', rot: cfg.rot, name: 'Planar angular node (ψ = 0)', mat: planeMat,
      });
      pl.userData.noEdge = true;
      pl.renderOrder = 2;
      label('mark', cfg.label, () => V(x0 + cfg.dx - 0.65, CY - 1.55, 0));
    }
  }

  // ==================== 4 · THE 3d ORBITALS: CLOVERLEAF AND DOUGHNUT ====================
  {
    const x0 = STATIONS.dorbitals;
    const g = asm('dorbitals', root, {
      title: '3d orbitals: four-leaf clover & dumbbell-with-torus',
      sub: 'ℓ = 2 means two angular nodes — either two perpendicular planes (3d_{x²−y²}) or two magic-angle cones (3d_{z²})',
    });

    // Left: 3d_{x^2-y^2} cloverleaf with two nodal planes (x = y and x = -y)
    const spinClover = new THREE.Group(); spinClover.position.set(x0 - 1.75, CY, 0); g.add(spinClover); spins.push(spinClover);
    addCrosshair(spinClover, 1.45);
    dot(spinClover, 0.065, 'amber', 'Nucleus', 'lit');
    buildCloud(spinClover, '3dx2-y2', 320, 401, { scale: 0.105, radius: 0.038, exScale: 0.3 });

    const pMat = shadeMat('node', { opacity: 0.30 });
    pMat.side = THREE.DoubleSide;
    const pGeo = new THREE.PlaneGeometry(2.1, 1.9);
    const nPlane1 = part(spinClover, pGeo, { pal: 'node', tone: 'lo', rot: [0, Math.PI / 4, 0], name: 'Nodal plane x = y', mat: pMat });
    const nPlane2 = part(spinClover, pGeo, { pal: 'node', tone: 'lo', rot: [0, -Math.PI / 4, 0], name: 'Nodal plane x = −y', mat: pMat });
    nPlane1.userData.noEdge = true; nPlane1.renderOrder = 2;
    nPlane2.userData.noEdge = true; nPlane2.renderOrder = 2;

    // Right: 3d_{z^2} dumbbell + equatorial torus with two conical nodal surfaces (3 cos²θ - 1 = 0 => tan θ = √2)
    const spinDz2 = new THREE.Group(); spinDz2.position.set(x0 + 1.75, CY, 0); g.add(spinDz2); spins.push(spinDz2);
    addCrosshair(spinDz2, 1.45);
    dot(spinDz2, 0.065, 'amber', 'Nucleus', 'lit');
    buildCloud(spinDz2, '3dz2', 320, 409, { scale: 0.105, radius: 0.038, exScale: 0.3 });

    // Nodal cones via prims.surface or ConeGeometry at magic angle θ = arccos(1/√3) ≈ 54.74°
    const coneH = 0.95, coneR = coneH * Math.SQRT2;
    const coneGeo = new THREE.ConeGeometry(coneR, coneH, 36, 1, true);
    const coneTop = part(spinDz2, coneGeo, {
      pal: 'node', tone: 'lo', pos: [0, coneH / 2, 0], rot: [Math.PI, 0, 0], name: 'Upper nodal cone (θ = 54.7°)', mat: pMat,
    });
    const coneBot = part(spinDz2, coneGeo, {
      pal: 'node', tone: 'lo', pos: [0, -coneH / 2, 0], name: 'Lower nodal cone (θ = 125.3°)', mat: pMat,
    });
    coneTop.userData.noEdge = true; coneTop.renderOrder = 2;
    coneBot.userData.noEdge = true; coneBot.renderOrder = 2;

    label('board', '3d<sub>x²−y²</sub> (2 nodal planes)', () => V(x0 - 2.55, CY - 1.58, 0));
    label('board', '3d<sub>z²</sub> (2 nodal cones)', () => V(x0 + 0.95, CY - 1.58, 0));
  }

  // ==================== 5 · QUANTUM NUMBERS & NODE STAIRCASE ====================
  {
    const x0 = STATIONS.staircase;
    const g = asm('staircase', root, {
      title: 'Quantum numbers (n, ℓ) & the n − 1 node rule',
      sub: 'total nodes = n − 1, split between (n − ℓ − 1) spherical radial nodes and ℓ planar/conical angular nodes',
    });

    // 3D surface showing radial wave profile across n = 1, 2, 3 plus miniature orbital clouds at each (n, ℓ) slot
    const slots = [
      { kind: '1s',  label: '1s (0, 0)',  dx: -2.4, dy: -0.95, scale: 0.30 },
      { kind: '2s',  label: '2s (1, 0)',  dx: -0.8, dy: 0.05,  scale: 0.13 },
      { kind: '2pz', label: '2p (0, 1)',  dx:  0.8, dy: 0.05,  scale: 0.13 },
      { kind: '3dz2',label: '3d (0, 2)',  dx:  2.4, dy: 0.95,  scale: 0.075 },
    ];

    // Energy / shell level shelves
    lines(g, [
      x0 - 3.1, CY - 0.95, 0, x0 - 1.7, CY - 0.95, 0,
      x0 - 1.5, CY + 0.05, 0, x0 + 1.5, CY + 0.05, 0,
      x0 + 1.7, CY + 0.95, 0, x0 + 3.1, CY + 0.95, 0,
    ], '#8a8a90');

    // Subtle 3D nodal reference plane underneath the staircase using prims.surface
    const axSurf = axes(g, {
      x: [-3, 3], y: [-1, 1], z: [-1, 1], size: [5.6, 1.4, 0.4], at: [x0, CY - 1.55, 0],
      ticks: 0, grid: false,
    });
    const baseSurf = surface(g, (u, v) => 0.12 * Math.sin(u * 1.1) * Math.cos(v * 1.5), {
      axes: axSurf, x: [-3, 3], y: [-1, 1], n: 24, pal: 'paper', name: 'Standing wave reference surface',
    });
    baseSurf.object.userData.noEdge = true;

    for (const [idx, s] of slots.entries()) {
      const spin = new THREE.Group();
      spin.position.set(x0 + s.dx, CY + s.dy, 0);
      g.add(spin); spins.push(spin);
      dot(spin, 0.05, 'amber', `${s.kind} nucleus`, 'lit');
      buildCloud(spin, s.kind, 150, 501 + idx * 19, { scale: s.scale, radius: 0.032, exScale: 0.22 });
      label('mark', s.label, () => V(x0 + s.dx - 0.45, CY + s.dy - 0.82, 0));
    }
    label('board', '<i>n</i> = 1 (0 nodes)', () => V(x0 - 2.95, CY - 0.2, 0));
    label('board', '<i>n</i> = 2 (1 node)',  () => V(x0 - 0.55, CY + 0.92, 0));
    label('board', '<i>n</i> = 3 (2 nodes)', () => V(x0 + 1.85, CY + 1.65, 0));
  }

  function stateAt(t = clockT) {
    return {
      r1: r1Now(t),
      r2: r2Now(t),
      drag,
    };
  }

  function update(t) {
    clockT = t;
    const rotY = 0.22 * Math.sin(0.45 * t);
    for (const s of spins) s.rotation.y = rotY;
    for (const fn of updaters) fn(t);
  }
  update(clockT);

  return { update, labels, stateAt, drag };
}
