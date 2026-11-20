// node engine/selftest.mjs — the shared checks toolkit and seeded RNG against known values, and the building blocks'
// geometry (prims.js, built in node: no browser).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checks, near, deriv, integ, bisect, rk4, mean, variance, meanWithin, chiSquare, chiSquareCritical, normalQuantile, binomial, checkLinkLengths, checkTrajectory } from './checks.js';
import { rng } from './rng.js';
import { scale, samples, chart, textAdvanceEm, waterfallWalk, waterfallChart, sankeyLayout, sankeyChart, interpViewBox, focusViewBox, samplePolyline, beadSlots, pathBeads } from './chart.js';
import * as THREE from 'three';
import { axes, plot, area, surface, field, streamline, lattice, blob, particles, molecule, linkage, canvasPlate, billboard } from './prims.js';
import { part, box, gearGeo, gear, rack, spring, TONE, PALETTE, applyTheme } from './parts.js';
import { parseColor, compositeOver, srgbLuminance, wcagContrast, auditTheme } from './theme.js';
import { createAssemblyController, normalPassTone } from './render.js';
import { circleIntersect, sliderCrank, fourBar, gearRatio, rackPinion, differential, createSolver, twoLinkIK, fabrik, jacobianIK } from './kinematics.js';
import { draggable } from './stage.js';
import {
  TAU, clamp01, clamp, lerp, fract, mod, smooth, smoothstep, ease,
  phase, win, warpTime, spring as motionSpring, settleShake, squashStretch, eases,
  hash, rand as motionRand, rrange, loopNoise,
  planArea, planBounds, planPose, logFovLerp, glide,
  cubicBezier, bez, rubberband, projectMomentum, stagger, dwell, pingPong, anticipate, followThrough, pulseBeat, posterizeTime,
  camDolly, camZoom, camOrbit, camCrane, camDollyZoom, camHandheld,
} from './motion.js';
import { auditDeliverable } from './mesh-audit.js';
import {
  RectSolid,
  uvMetres, bevelBox, shell, lathe, drape, fronts, batchGeos, branchTree,
  swingArc, slideArrow, dimChain, buildSheet, extrudePlan,
  revolveSection, extrudeCrossSections, extrudeLayers, extrudeContours,
  procTex, tweakMat, createRevealController, inkAware, contactShadow,
} from './cad_kit.js';

const C = checks();
C.check('deriv of sin is cos', [0.3, 1.1, 2.5].every(x => near(deriv(Math.sin, x), Math.cos(x), 1e-8)));
C.check('Simpson: ∫₀^π sin = 2', near(integ(Math.sin, 0, Math.PI), 2, 1e-10));
C.check('bisect finds √2', near(bisect(x => x * x - 2, 0, 2), Math.SQRT2, 1e-11));
{ const y = rk4((t, y) => -y, 1, 0, 1, 100).at(-1); C.check('rk4: y′ = −y gives e⁻¹', near(y, Math.exp(-1), 1e-9), y.toFixed(10)); }
{ const y = rk4((t, [x, v]) => [v, -x], [1, 0], 0, Math.PI, 400).at(-1); C.check('rk4 on a system: SHM half period', near(y[0], -1, 1e-8) && Math.abs(y[1]) < 1e-8); }
C.check('normal quantiles', near(normalQuantile(0.975), 1.959963985, 1e-8) && near(normalQuantile(0.5), 0, 1e-12) && near(normalQuantile(0.001), -3.090232306, 1e-7));
C.check('chi-square critical values match tables', near(chiSquareCritical(10), 29.5883, 1e-4) && near(chiSquareCritical(1, 0.05), 3.8415, 1e-4) && near(chiSquareCritical(12, 0.01), 26.2170, 1e-4), chiSquareCritical(10).toFixed(4));
C.check('binomial(12, 6) = 924', binomial(12, 6) === 924);
{ const a = rng(42), b = rng(42), xs = Array.from({ length: 5 }, a.next), ys = Array.from({ length: 5 }, b.next);
  C.check('rng: same seed, same sequence', xs.every((x, i) => x === ys[i])); }
C.check('rng: different seeds differ', rng(1).next() !== rng(2).next());
{ const r = rng(7), u = Array.from({ length: 20000 }, r.next);
  C.check('rng: uniform mean ½, variance 1/12', meanWithin(u, 0.5, Math.sqrt(1 / 12)) && near(variance(u), 1 / 12, 0.03), `${mean(u).toFixed(4)}, ${variance(u).toFixed(4)}`);
  const bins = Array(10).fill(0); u.forEach(x => bins[Math.floor(x * 10)]++);
  C.check('rng: uniform passes chi-square over 10 bins', chiSquare(bins, Array(10).fill(2000)) < chiSquareCritical(9)); }
{ const r = rng(9), z = Array.from({ length: 20000 }, () => r.normal());
  C.check('rng: normal mean 0, variance 1', meanWithin(z, 0, 1) && near(variance(z), 1, 0.04), `${mean(z).toFixed(4)}, ${variance(z).toFixed(4)}`); }
{ const s = scale({ x0: 0, x1: 10, y0: 0, y1: 5 }); C.check('chart scale: corners land on the frame', s.sx(0) === 44 && s.sx(10) === 406 && s.sy(5) === 16 && s.sy(0) === 140); }
C.check('samples: n + 1 points, both ends', samples(0, 1, 4, x => x * x).length === 5 && samples(0, 1, 4, x => x).at(-1)[0] === 1);
// ---------- prims ----------
{ const corners = A => [[A.x[0], A.y[0], A.z?.[0] ?? 0], [A.x[1], A.y[1], A.z?.[1] ?? 0]].map(p => A.to(...p));
  const A = axes(new THREE.Group(), { x: [-2, 3], y: [-1, 1], size: [5, 4], at: [1, 2, 0] }), [lo, hi] = corners(A);
  C.check('axes.to: the data box\'s corners land on the world box\'s (upright plane)', lo.distanceTo(new THREE.Vector3(-1, -0, 0)) < 1e-12 && hi.distanceTo(new THREE.Vector3(4, 4, 0)) < 1e-12 && A.to(0, 0).distanceTo(new THREE.Vector3(1, 2, 0)) < 1e-12, `${lo.toArray()} ${hi.toArray()}`);
  const B = axes(new THREE.Group(), { x: [1, 5], y: [0, 2], z: [-1, 1], size: [4, 2, 3] }), [l3, h3] = corners(B);
  // z up: data x → world x, z → world y, y → world −z; the axes cross at data (1, 0, 0), the world origin
  C.check('axes.to: corners of a 3D box, z up', l3.distanceTo(new THREE.Vector3(0, -1.5, 0)) < 1e-12 && h3.distanceTo(new THREE.Vector3(4, 1.5, -2)) < 1e-12, `${l3.toArray()} ${h3.toArray()}`);
  // about 4 ticks: x steps by 1 (−2, −1, 1, 2), y by 5 (5, 10); 0 is where the axes cross, so it has no number
  C.check('axes: one tick label per round value, the crossing left bare', axes(new THREE.Group(), { x: [-2, 2], y: [0, 10], ticks: 4 }).labels.length === 4 + 2); }
{ const A = axes(new THREE.Group(), { x: [-2, 2], y: [-3, 3], size: [4, 3] }), f = x => x ** 3 / 3 - x, n = 64;
  const p = plot(new THREE.Group(), f, { axes: A, samples: n }), pos = p.object.geometry.attributes.position, ring = 9;   // 8 sides + the seam
  // each ring's centre is the curve's point (the first 8 vertices of a ring are evenly round it)
  const centre = i => { const c = new THREE.Vector3(); for (let j = 0; j < 8; j++) c.add(new THREE.Vector3().fromBufferAttribute(pos, i * ring + j)); return c.divideScalar(8); };
  const err = g => Math.max(...Array.from({ length: n + 1 }, (_, i) => { const x = -2 + 4 * i / n; return centre(i).distanceTo(A.to(x, g(x))); }));
  C.check('plot: the tube runs through (x, f(x)) mapped by to()', err(f) < 1e-5, err(f).toExponential(1));
  const before = pos.array; p.update(Math.sin);
  C.check('plot.update redraws in place: the same buffer, the new curve', p.object.geometry.attributes.position.array === before && err(Math.sin) < 1e-5);
  p.update(Math.sin, { x: [0, 1] });
  C.check('plot.update accepts { x: [a, b] } for partial-domain drawing', centre(0).distanceTo(A.to(0, 0)) < 1e-5 && centre(n).distanceTo(A.to(1, Math.sin(1))) < 1e-5); }
{ const A = axes(new THREE.Group(), { x: [-1, 1], y: [-1, 1], z: [-1, 1] });
  for (const n of [10, 40]) { const s = surface(new THREE.Group(), (x, y) => x * y, { axes: A, n });
    C.check(`surface: (n+1)² vertices for n = ${n}`, s.object.geometry.attributes.position.count === (n + 1) ** 2); }
  const s = surface(new THREE.Group(), (x, y) => 0.5 + 0 * x * y, { axes: A, n: 4 }), nz = s.object.geometry.attributes.normal;
  C.check('surface: a flat sheet faces up', Array.from({ length: nz.count }, (_, i) => nz.getY(i)).every(y => y > 0.999)); }
{ const methane = `5\nmethane\nC 0 0 0\nH 0.629 0.629 0.629\nH -0.629 -0.629 0.629\nH -0.629 0.629 -0.629\nH 0.629 -0.629 -0.629`;
  const water = `3\nwater\nO 0 0 0.1173\nH 0 0.7572 -0.4692\nH 0 -0.7572 -0.4692`;
  const pairs = m => m.bonds.map(([i, j]) => [m.atoms[i].elem, m.atoms[j].elem].sort().join('–'));
  const M1 = molecule(new THREE.Group(), methane), M2 = molecule(new THREE.Group(), water);
  C.check('molecule: methane has exactly 4 C–H bonds and no H–H', M1.bonds.length === 4 && pairs(M1).every(p => p === 'C–H'), pairs(M1).join(' '));
  C.check('molecule: water has exactly 2 bonds, both O–H', M2.bonds.length === 2 && pairs(M2).every(p => p === 'H–O'), pairs(M2).join(' '));
  C.check('molecule: one label per atom', M1.labels.length === 5); }
{ const P = particles(new THREE.Group(), 50);
  P.show(17); const a = P.object.count; P.show(0); const b = P.object.count; P.show(99);
  P.set(3, [1, 2, 3]); const m = new THREE.Matrix4(); P.object.getMatrixAt(3, m);
  C.check('particles.show(n) sets the instance count (clamped to the pool)', a === 17 && b === 0 && P.object.count === 50, `${a}, ${b}, ${P.object.count}`);
  C.check('particles.set places one instance', new THREE.Vector3().setFromMatrixPosition(m).distanceTo(new THREE.Vector3(1, 2, 3)) < 1e-12); }
{ const A = axes(new THREE.Group(), { x: [0, 4], y: [-4, 8], size: [4, 4] });
  const ar = area(new THREE.Group(), x => 2 * x, { axes: A, x: [0, 4], bars: 4, samples: 16 });
  const pos = ar.object.geometry.attributes.position, outline = ar.object.children[0];
  const top0 = pos.getY(1), top3 = pos.getY(12 + 1);
  C.check('area: Riemann bars sit at midpoint heights and show their outline', near(top0, A.to(0, 1).y, 1e-6) && near(top3, A.to(3, 7).y, 1e-6) && outline.visible);
  ar.update(x => x * x / 2, { x: [0, 2], bars: 0 });
  C.check('area.update: smooth mode hides the bar outline and redraws in place', !outline.visible && near(pos.getX(4 * 16 - 1), A.to(2, 2).x, 1e-6) && near(pos.getY(4 * 16 - 1), A.to(2, 2).y, 1e-6));
  ar.update(x => -2, { x: [0, 4], y0: 0, bars: 0 });
  const nz = ar.object.geometry.attributes.normal;
  C.check('area: negative regions (f(x) < y0) wind +z normals and use DoubleSide', nz.getZ(0) > 0.999 && ar.object.material.side === THREE.DoubleSide); }
{ const A = axes(new THREE.Group(), { x: [-2, 2], y: [-2, 2], size: [4, 4] });
  const F = field(new THREE.Group(), (x, y) => [-y, x], { axes: A, n: [4, 3], scale: 0.5 });
  C.check('field: nx × ny arrows placed inside the axes', F.arrows.length === 12 && F.arrows.every(a => a.visible));
  F.update(() => [0, 0]);
  C.check('field.update: zero vectors hide cleanly', F.arrows.every(a => !a.visible));
  const sl = streamline(new THREE.Group(), (x, y) => [1, 2 * x], { axes: A, from: [0, 0], dt: 0.02, steps: 50 });
  const slPos = sl.object.geometry.attributes.position, ring = 9;
  const endCentre = new THREE.Vector3(); for (let j = 0; j < 8; j++) endCentre.add(new THREE.Vector3().fromBufferAttribute(slPos, 50 * ring + j)); endCentre.divideScalar(8);
  C.check('streamline: RK4 trajectory of (1, 2x) from (0, 0) lands at (1, 1) and exposes points', endCentre.distanceTo(A.to(1, 1)) < 1e-4 && sl.points.length === 51);
  const lat = lattice(new THREE.Group(), (u, v) => [2 * u, 3 * v], { axes: A, x: [0, 1], y: [0, 1], n: [2, 2], samples: 4 });
  const latPos = lat.object.geometry.attributes.position;
  lat.update((u, v) => [u + v, v]);
  C.check('lattice: builds (nx+1 + ny+1) × samples segments with n alias and updates in place', latPos.count === 6 * 4 * 2 && near(latPos.getX(latPos.count - 1), A.to(2, 1).x, 1e-6));
  const bl1 = blob(new THREE.Group(), { radius: 0.92, lobes: 7, amp: 0.2, cleft: 0.25, seed: 5, pal: 'blue' });
  const bl2 = blob(new THREE.Group(), { r: 0.92, bumps: 7, amp: 0.2, cleft: 0.25, seed: 5, color: 'blue' });
  const yBefore = bl1.mesh.geometry.attributes.position.getY(0);
  bl1.update({ radius: 1.4 });
  C.check('blob: deterministic globular mesh with radius/lobes/pal aliases and update()', yBefore === bl2.object.geometry.attributes.position.getY(0) && yBefore > 0.5 && bl1.mesh.geometry.attributes.position.getY(0) > yBefore); }
{ const A2 = axes(new THREE.Group(), { x: [-2, 3], y: [-1, 4], size: [5, 4], at: [1, 2, 0] });
  const A3 = axes(new THREE.Group(), { x: [1, 5], y: [0, 2], z: [-1, 1], size: [4, 2, 3] });
  const rt2 = A2.from(A2.to(1.7, 2.3)), rt3 = A3.from(A3.to(3.4, 1.2, -0.4));
  C.check('axes.from: round-trips 2D and 3D data coordinates through to()', near(rt2[0], 1.7, 1e-12) && near(rt2[1], 2.3, 1e-12) && near(rt3[0], 3.4, 1e-12) && near(rt3[1], 1.2, 1e-12) && near(rt3[2], -0.4, 1e-12));
  const m = new THREE.Mesh();
  let dragged = null;
  const d = draggable(m, { axes: A2, constrain: ([x]) => [Math.max(0, Math.min(2, x)), 0.5 * x * x], onDrag: p => { dragged = p; } });
  d.set([1.5, 99]);
  C.check('draggable: get/set/project constrains data coordinates, moves mesh on axes, and invokes onDrag', near(d.get()[0], 1.5, 1e-12) && near(dragged[0], 1.5, 1e-12) && near(dragged[1], 1.125, 1e-12) && m.position.distanceTo(A2.to(1.5, 1.125)) < 1e-12);
  d.reset();
  C.check('draggable.reset: clears dragged value', d.get() === null && d.value === null); }
{ const { CHAPTER: CCalc } = await import('../examples/maths/calculus/chapter.js');
  const { PRACTICE: PCalc } = await import('../examples/maths/calculus/practice.js');
  const { CHAPTER: CLa } = await import('../examples/maths/linear-algebra/chapter.js');
  const { PRACTICE: PLa } = await import('../examples/maths/linear-algebra/practice.js');
  const { CHAPTER: CElec } = await import('../examples/physics/electrostatics/chapter.js');
  const { PRACTICE: PElec } = await import('../examples/physics/electrostatics/practice.js');
  CCalc._W = { stateAt: () => ({ h: 1.0, x1: 2.5, x2: 2.0, n: 6, x4: 2.0, x5: 1.0 }) };
  const sCalc = CCalc.state(0, false);
  CLa._W = { stateAt: () => ({ s: 1, mat0: { a: 1.5, b: 0.5, c: 0.5, d: 1.25 }, k: 1.2, mat2: { a: 1.5, b: 0.5, c: 0.5, d: 1.25 }, d: 0.4, theta: Math.PI / 4 }) };
  const sLa = CLa.state(0, false);
  CElec._W = { drag: { lineX: 0.30 } };
  const sElec = CElec.state(0, false);
  C.check('practice target.check: calculus, linear-algebra, and electrostatics 3D drag checks evaluate true at target states',
    PCalc[0][0].target.check(sCalc) && PCalc[1][0].target.check(sCalc) && PCalc[2][1].target.check(sCalc)
    && PLa[3][0].target.check(sLa) && PLa[4][0].target.check(sLa)
    && PElec[3][0].target.check(sElec)); }
// ---------- kinematics & mechanical CAD primitives ----------
{ const r = 0.045, L = 0.145;
  const angles = [0.2, 0.9, 1.8, 2.7];
  const vOk = angles.every(th => near(sliderCrank(th, r, L).v, deriv(t => sliderCrank(t, r, L).s, th), 1e-7));
  const aOk = angles.every(th => near(sliderCrank(th, r, L).a, deriv(t => sliderCrank(t, r, L).v, th), 1e-7));
  const lenOk = angles.every(th => {
    const sc = sliderCrank(th, r, L);
    return near(Math.hypot(sc.piston[0] - sc.pin[0], sc.piston[1] - sc.pin[1]), L, 1e-12);
  });
  C.check('sliderCrank: analytical v = ds/dθ, a = dv/dθ, and rod length |piston − pin| = L', vOk && aOk && lenOk);
}
{ // Theo Jansen's 11-bar linkage holy numbers & fourBar
  const J = { a: 38, b: 41.5, c: 39.3, d: 40.1, e: 55.8, f: 39.4, g: 36.7, h: 65.7, i: 49.0, j: 50.0, k: 61.9, l: 7.8, m: 15.0 };
  const jansenLinks = [
    ['O', 'crank', J.m], ['A', 'B', J.b], ['B', 'crank', J.j],
    ['A', 'D', J.d], ['B', 'C', J.e], ['D', 'C', J.f],
    ['A', 'E', J.c], ['D', 'E', J.g], ['E', 'crank', J.k],
    ['E', 'F', J.h], ['C', 'F', J.i],
  ];
  const jansenOk = [0, 0.7, 1.9, 3.5, 5.1].every(th => {
    const O = [0, 0], A = [-J.a, -J.l], crank = [J.m * Math.cos(th), J.m * Math.sin(th)];
    const B = circleIntersect(A, J.b, crank, J.j, -1);
    const E = circleIntersect(A, J.c, crank, J.k, 1);
    const D = circleIntersect(A, J.d, E, J.g, -1);
    const Cpt = circleIntersect(B, J.e, D, J.f, -1);
    const F = circleIntersect(E, J.h, Cpt, J.i, 1);
    return checkLinkLengths({ O, A, crank, B, C: Cpt, D, E, F }, jansenLinks, 1e-5);
  });
  const fb = fourBar(1.2, 3.5, 2.2, 4.0, 0.8, 1);
  const fbOk = checkLinkLengths({ O: fb.O, A: fb.A, B: fb.B, C: fb.C }, [['O', 'A', 1.2], ['A', 'B', 3.5], ['C', 'B', 2.2], ['O', 'C', 4.0]]);
  C.check('fourBar & Theo Jansen 11-bar linkage: all bars preserve exact link lengths across full crank rotation', jansenOk && fbOk);
}
{ const gr = gearRatio(Math.PI, 16, 48);
  const grIdler = gearRatio(Math.PI, 16, 16, 1);
  const rpPos = rackPinion(0.5, 0.04, 20);
  const rp = rackPinion({ module: 0.04, teeth: 20, angle: Math.PI / 2 });
  const rpInv = rackPinion({ module: 0.04, teeth: 20, stroke: rp.stroke });
  const dfPos = differential(10, 7);
  const df = differential({ ring: 10, left: 7 });
  C.check('gearRatio, rackPinion & differential: positional and object forms give exact angle, travel, and carrier split',
    near(gr.angle, -Math.PI / 3, 1e-12) && near(gr.ratio, -1 / 3, 1e-12) && near(grIdler.ratio, 1, 1e-12)
    && near(rpPos.angle, 0.5 / 0.4, 1e-12) && near(rp.stroke, (Math.PI / 2) * 0.4, 1e-12) && near(rpInv.angle, Math.PI / 2, 1e-12)
    && near(dfPos.right, 13, 1e-12) && near(df.right, 13, 1e-12) && near(0.5 * (df.left + df.right), df.ring, 1e-12));
}
{ // Declarative constraint solver: sequential chain + closed-loop relaxation (with and without residual)
  const solver = createSolver([
    { type: 'revolute', id: 'crank', input: 'theta', output: 'crank.angle', scale: 1 },
    { type: 'gear', id: 'mesh1', drive: 'crank.angle', driven: 'driven.angle', teethDrive: 12, teethDriven: 24 },
    { type: 'slider-crank', id: 'piston', crank: 'crank.angle', r: 0.5, L: 1.6 },
  ]);
  const st = solver.solve({ theta: 0.6 });
  C.check('createSolver: topologically sorts declarative constraints in one exact pass',
     solver.loops.length === 0 && near(st['driven.angle'], -0.3, 1e-12) && near(st['piston.pos'], sliderCrank(0.6, 0.5, 1.6).s, 1e-12));
  // Closed loop distance relaxation (mutually dependent cycle)
  const loopSolver = createSolver([
    { type: 'distance', id: 'd1', a: 'P1', b: 'P2', length: 2.0, fixedA: true },
    { type: 'distance', id: 'd2', a: 'P3', b: 'P2', length: 2.0, fixedA: true },
  ], { iterations: 80 });
  const loopSt = loopSolver.solve({ P1: [0, 0], P2: [1.1, 0.9], P3: [3.0, 0] });
  const loopOk = checkLinkLengths(loopSt, [['P1', 'P2', 2.0], ['P2', 'P3', 2.0]], 1e-5);
  // Cyclic custom constraint without residual function must run all iterations
  let noResCalls = 0;
  const cyclicNoRes = createSolver([
    { id: 'c1', inputs: ['y'], outputs: ['x'], solve(s) { noResCalls++; s.x = 1 + 0.25 * (s.y ?? 0); } },
    { id: 'c2', inputs: ['x'], outputs: ['y'], solve(s) { s.y = s.x; } },
  ], { iterations: 20 });
  const cycSt = cyclicNoRes.solve({ x: 0, y: 0 });
  C.check('createSolver: iterative relaxation converges closed distance loop and runs full iterations when residual is omitted',
    loopOk && noResCalls === 20 && near(cycSt.x, 4 / 3, 1e-6));
}
{ // Inverse Kinematics: twoLinkIK, fabrik (fixed and free base), jacobianIK (both dls and transpose with limits)
  const ik2 = twoLinkIK([0, 0], [1.6, 0.9], 1.2, 1.1, 1);
  C.check('twoLinkIK: analytical 2-link arm places elbow and end-effector at exact link lengths and target',
    ik2.reachable && near(Math.hypot(ik2.elbowPt[0], ik2.elbowPt[1]), 1.2, 1e-12)
    && near(Math.hypot(ik2.endPt[0] - ik2.elbowPt[0], ik2.endPt[1] - ik2.elbowPt[1]), 1.1, 1e-12)
    && near(ik2.endPt[0], 1.6, 1e-12) && near(ik2.endPt[1], 0.9, 1e-12));

  const chain0 = [[0, 0, 0], [1, 0, 0], [2, 0, 0], [3, 0, 0]];
  const fab = fabrik(chain0, [1, 1, 1], [1.5, 1.5, 0.5], { tol: 1e-7, iterations: 30 });
  const fabFree = fabrik(chain0, [1, 1, 1], [5, 5, 0], { baseFixed: false });
  const fabLensOk = [0, 1, 2].every(i => near(Math.hypot(
    fab.joints[i + 1][0] - fab.joints[i][0],
    fab.joints[i + 1][1] - fab.joints[i][1],
    fab.joints[i + 1][2] - fab.joints[i][2],
  ), 1.0, 1e-5) && near(Math.hypot(
    fabFree.joints[i + 1][0] - fabFree.joints[i][0],
    fabFree.joints[i + 1][1] - fabFree.joints[i][1],
    fabFree.joints[i + 1][2] - fabFree.joints[i][2],
  ), 1.0, 1e-5));
  C.check('fabrik: 3D multi-joint chain converges to target (baseFixed true & false) while preserving all segment lengths',
    fabLensOk && fab.error < 1e-5 && fabFree.error < 1e-9 && fabFree.joints[0][0] > 1, `err=${fab.error.toExponential(2)}`);

  const fk3 = ([a, b, c]) => [
    Math.cos(a) + 0.8 * Math.cos(a + b) + 0.5 * Math.cos(a + b + c),
    Math.sin(a) + 0.8 * Math.sin(a + b) + 0.5 * Math.sin(a + b + c),
  ];
  const jDls = jacobianIK({ fk: fk3, angles: [0.2, 0.3, -0.2], target: [1.2, 1.1], method: 'dls', limits: [[-Math.PI, Math.PI], [-2, 2], [-2, 2]] });
  const jTr = jacobianIK({ fk: fk3, angles: [0.2, 0.3, -0.2], target: [1.2, 1.1], method: 'transpose', iterations: 120, step: 0.6, limits: [[-Math.PI, Math.PI], [-2, 2], [-2, 2]] });
  C.check('jacobianIK: both DLS and Jacobian Transpose converge and honour joint limits',
    jDls.error < 1e-5 && jTr.error < 1e-2 && jDls.angles.every((a, i) => a >= (i === 0 ? -Math.PI : -2) && a <= (i === 0 ? Math.PI : 2)),
    `dls=${jDls.error.toExponential(1)}, tr=${jTr.error.toExponential(1)}`);
}
{ // CAD primitives: gear (including pressureAngle), rack, spring, linkage
  const root = new THREE.Group();
  const g14 = gearGeo(18, { r: 0.9, width: 0.2, pressureAngle: 14.5 });
  const g25 = gearGeo(18, { r: 0.9, width: 0.2, pressureAngle: 25 });
  const gMesh = gear(root, { teeth: 18, r: 0.9, width: 0.2, bore: 0.2, pal: 'amber' });
  const rMesh = rack(root, { teeth: 10, pitch: 0.3, width: 0.2, height: 0.25, pal: 'ochre' });
  const sp = spring(root, { r: 0.18, wire: 0.025, turns: 8 });
  const spBuf = sp.geometry.attributes.position.array;
  sp.set([0, 0, 0], [0, 1.6, 0]);
  const yMax1 = Math.max(...Array.from({ length: sp.geometry.attributes.position.count }, (_, i) => sp.geometry.attributes.position.getY(i)));
  sp.set([0, 0, 0], [0, 2.8, 0]);
  const yMax2 = Math.max(...Array.from({ length: sp.geometry.attributes.position.count }, (_, i) => sp.geometry.attributes.position.getY(i)));
  const lk = linkage(root, {
    joints: { A: [0, 0], B: [1, 1], C: [2, 0] },
    links: [['A', 'B', 'AB'], ['B', 'C', 'BC']],
  });
  lk.update({ A: [0, 0], B: [1.2, 1.4], C: [2.4, 0] });
  const profileDiffers = Array.from({ length: g14.attributes.position.count }, (_, i) => Math.abs(g14.attributes.position.getX(i) - g25.attributes.position.getX(i))).some(d => d > 1e-4);
  C.check('gear, rack, spring & linkage: build valid meshes (with pressureAngle profile variation), stretch coils in place, and update linkage bars/pins',
    gMesh.geometry.attributes.position.count > 100 && rMesh.geometry.attributes.position.count > 50
    && profileDiffers
    && sp.geometry.attributes.position.array === spBuf && yMax2 > yMax1 + 1.0
    && lk.bars.length === 2 && Object.keys(lk.pins).length === 3 && lk.labels.length === 2);
}
{ // Teardown assembly controller: setCutaway, setXray, setIsolate, setExplode, stepExplode
  const scene = new THREE.Group();
  const ctrl = createAssemblyController();
  const gHousing = ctrl.asm('housing', scene, { title: 'Housing', xray: true });
  const gCore = ctrl.asm('core', scene, { title: 'Core' });
  const mHousing = part(gHousing, box(1, 1, 1), { pal: 'paper', tone: 'mid', ex: [0, 1, 0], name: 'Shell' });
  const mCore = part(gCore, box(0.5, 0.5, 0.5), { pal: 'red', tone: 'hi', ex: [1, 0, 0], name: 'Rotor' });

  ctrl.setCutaway([0, 0, -1, 0.1], ['housing']);
  const cutOk = mHousing.material.clipping === true && mHousing.material.clippingPlanes?.length === 1
    && mHousing.material.side === THREE.DoubleSide && !mCore.material.clippingPlanes;
  ctrl.setCutaway(null, ['housing']);
  const cutClearOk = mHousing.material.clipping === false && mHousing.material.clippingPlanes === null;

  ctrl.setXray(1, ['housing']);
  const xrayOk = mHousing.material.transparent === true && near(mHousing.material.uniforms.uOpacity.value, 0.22, 1e-6)
    && mHousing.userData.tone === TONE.faint && mCore.userData.tone === TONE.hi;
  ctrl.setXray(0, ['housing']);

  ctrl.setIsolate('core');
  const ghostSkip = normalPassTone(mHousing) === null && normalPassTone(mCore) !== null && normalPassTone(mCore) < 1.5;
  const isoOk = near(mHousing.material.uniforms.uOpacity.value, 0.14, 1e-6) && mHousing.userData.tone === TONE.faint
    && near(mCore.material.uniforms?.uOpacity?.value ?? 1, 1, 1e-6) && mCore.userData.tone === TONE.hi && ghostSkip;
  ctrl.setIsolate(null);

  // Paper-wash isolation ({ mode: 'wash' } or { keys, mode: 'wash' }): keeps depth opaque, skips cloning untouched materials, and encodes +2.0 wash band in normalPassTone
  const ctrlWash = createAssemblyController();
  const wScene = new THREE.Group();
  const gA = ctrlWash.asm('a', wScene, { title: 'A' }), gB = ctrlWash.asm('b', wScene, { title: 'B' });
  const mA = part(gA, box(1, 1, 1), { pal: 'blue', tone: 'mid', name: 'ItemA' });
  const mB = part(gB, box(1, 1, 1), { pal: 'red', tone: 'hi', name: 'ItemB' });
  const baseMatA = mA.material;
  ctrlWash.setIsolate({ keys: 'b', mode: 'wash' });
  const tA = normalPassTone(mA), tB = normalPassTone(mB);
  const washOk = mA.material === baseMatA && !mA.material.transparent && mA.material.depthWrite === true
    && mA.userData._isolatedWash === 1 && mA.userData.tone === TONE.faint
    && tA > 2.1 && tA < 2.3 && near(((tA - 2) * 5 - 0.5) % 1, ((TONE.faint + mA.userData.idOff) * 5 - 0.5) % 1, 1e-9)
    && mB.userData._isolatedWash === 0 && tB > 0.7 && tB < 0.9;
  ctrlWash.setIsolate(null);
  const washClearOk = mA.userData._isolatedWash === 0 && mA.userData.tone === TONE.mid && normalPassTone(mA) < 1.5;

  ctrl.setExplode(1);
  for (let i = 0; i < 60; i++) ctrl.stepExplode(1 / 60);
  const exOk = near(mHousing.position.y, 1, 1e-2) && near(mCore.position.x, 1, 1e-2);
  ctrl.setExplode(0, null, true);
  ctrl.stepExplode(1 / 60);
  const snapOk = mHousing.position.y === 0 && mCore.position.x === 0;
  C.check('setCutaway, setXray, setIsolate (ghost + paper-wash) & setExplode: synchronize clipping planes, DoubleSide, normal-pass ghost exclusion, opaque paper-wash band, and spring explode',
    cutOk && cutClearOk && xrayOk && isoOk && washOk && washClearOk && exOk && snapOk);
}
{ // Stateless procedural motion toolkit (engine/motion.js)
  const sp0 = motionSpring(0), sp1 = motionSpring(1), spPeak = Math.max(...Array.from({ length: 40 }, (_, i) => motionSpring(i / 40, 0.35, 3.2)));
  const easeKeys = Object.keys(eases);
  const eBoundaries = Object.entries(eases).every(([, fn]) => near(fn(0), 0, 1e-6) && near(fn(1), 1, 1e-6));
  const wtPeriod = 6.0;
  const wtCycleOk = [0.4, 1.7, 3.3, 5.2].every(t => near(warpTime(t + wtPeriod, wtPeriod, 0.25) - warpTime(t, wtPeriod, 0.25), wtPeriod, 1e-12));
  const wtMonoOk = Array.from({ length: 60 }, (_, i) => warpTime((i + 1) * 0.1, wtPeriod, 0.4) > warpTime(i * 0.1, wtPeriod, 0.4)).every(Boolean);
  const lnPeriod = 4.0;
  const lnPeriodic = [0, 0.37, 1.42, 2.89, 3.99].every(t => near(loopNoise(t, 11, lnPeriod, 3), loopNoise(t + lnPeriod, 11, lnPeriod, 3), 1e-12));
  const lnVaries = Math.abs(loopNoise(0.2, 11, lnPeriod) - loopNoise(1.7, 11, lnPeriod)) > 1e-3;
  const [sx, sy, sz] = squashStretch(1.5, 0.75);
  const shake0 = settleShake(0), shakeMid = Math.abs(settleShake(0.04, 6, 0.25, 1)), shakeEnd = settleShake(1);
  C.check('motion.js: spring & all 31 eases pin (0→0, 1→1) with physical overshoot, warpTime & loopNoise are exact-period seamless, and squashStretch/settleShake behave cleanly',
    easeKeys.length === 31 && sp0 === 0 && sp1 === 1 && spPeak > 1.02 && eBoundaries && wtCycleOk && wtMonoOk && lnPeriodic && lnVaries
    && sy > 1 && sx < 1 && sz === sx && shake0 === 0 && shakeMid > 0.05 && shakeEnd === 0
    && near(TAU, Math.PI * 2, 1e-12) && clamp01(-2) === 0 && clamp01(2) === 1 && clamp(5, 1, 3) === 3
    && near(lerp(2, 6, 0.25), 3, 1e-12) && near(fract(-0.25), 0.75, 1e-12) && near(mod(-1, 4), 3, 1e-12)
    && smooth(0, 1, 0.5) === 0.5 && smoothstep(2, 4, 3) === 0.5 && ease(0.5) === 0.5
    && near(phase(1.5, 6), 0.25, 1e-12) && win(0.5, 0, 1) === 0.5 && near(win(0.25, 0, 1, u => u * u), 0.0625, 1e-12)
    && hash(42) === hash(42) && motionRand(7) >= 0 && motionRand(7) < 1 && rrange(7, 10, 20) >= 10 && rrange(7, 10, 20) <= 20);

  const bz = cubicBezier(0.16, 1, 0.3, 1);
  const bzAlias = bez(0.34, 1.56, 0.64, 1);
  const bzOk = bz(0) === 0 && bz(1) === 1 && bz(0.5) > 0.8 && bzAlias(0) === 0 && bzAlias(1) === 1 && bzAlias(0.6) > 1.01;
  const stgOk = stagger(0, 0, 4, 0.5) === 0 && stagger(1, 3, 4, 0.5) === 1
    && stagger(0.3, 0, 4, 0.5) > stagger(0.3, 2, 4, 0.5) && stagger(0.5, 0, 1) === ease(0.5);
  const dwOk = dwell(0) === 0 && dwell(0.5) === 1 && dwell(1) === 0 && dwell(0.12) > 0 && dwell(0.12) < 1;
  const ppOk = pingPong(0) === 0 && near(pingPong(0.5, 0.2), 1, 1e-9) && pingPong(1) === 0;
  const antDip = Math.min(...Array.from({ length: 20 }, (_, i) => anticipate(i / 20)));
  const antPeak = Math.max(...Array.from({ length: 40 }, (_, i) => anticipate(i / 40, 0.14, 0.28, 1.1)));
  const antOk = anticipate(0) === 0 && near(anticipate(1), 1, 1e-6) && antDip < -0.05 && antPeak > 1.02;
  const ftPeak = Math.max(...Array.from({ length: 40 }, (_, i) => Math.abs(followThrough(i / 40))));
  const ftOk = followThrough(0) === 0 && followThrough(1) === 0 && ftPeak > 0.05;
  const pbOk = near(pulseBeat(0, 2, 4), 0, 1e-9) && near(pulseBeat(0.5, 1, 4), 1, 1e-9) && pulseBeat(0.25, 2, 4) > 0.7 && near(pulseBeat(1, 2, 4), 0, 1e-9);
  const ptOk = posterizeTime(0, 4) === 0 && posterizeTime(0.49, 4) === 0.25 && posterizeTime(1, 4) === 1;
  const basePose = { target: [0, 1, 0], dist: 10, az: 20, el: 15, fov: 28 };
  const dl0 = camDolly(basePose, 0, 0.6), dl1 = camDolly(basePose, 1, 0.6);
  const zm0 = camZoom(basePose, 0, 0.5), zm1 = camZoom(basePose, 1, 0.5);
  const tanHalf = fov => Math.tan((fov * Math.PI) / 360);
  const ob1 = camOrbit(basePose, 1, 45, 10);
  const cr1 = camCrane(basePose, 1, { dY: 2, dEl: 12, dDist: 1 });
  const dz0 = camDollyZoom(basePose, 0, 50), dzMid = camDollyZoom(basePose, 0.5, 50), dz1 = camDollyZoom(basePose, 1, 50);
  const halfHeight = p => p.dist * tanHalf(p.fov);
  const dzHeightOk = near(halfHeight(dz0), halfHeight(dzMid), 1e-9) && near(halfHeight(dz0), halfHeight(dz1), 1e-9) && near(dz1.fov, 50, 1e-9);
  const hhA = camHandheld(basePose, 1.37, { period: 8, seed: 3 }), hhB = camHandheld(basePose, 9.37, { period: 8, seed: 3 });
  const hhPeriodic = near(hhA.az, hhB.az, 1e-12) && near(hhA.el, hhB.el, 1e-12) && near(hhA.target[1], hhB.target[1], 1e-12);
  C.check('motion.js choreography & camera moves: cubicBezier, stagger, dwell, pingPong, anticipate, followThrough, pulseBeat, posterizeTime & cam* helpers are pure and exact',
    bzOk && stgOk && dwOk && ppOk && antOk && ftOk && pbOk && ptOk
    && near(dl0.dist, 10, 1e-9) && near(dl1.dist, 6, 1e-9)
    && near(zm0.fov, 28, 1e-9) && near(tanHalf(zm1.fov), 0.5 * tanHalf(zm0.fov), 1e-9)
    && near(ob1.az, 65, 1e-9) && near(ob1.el, 25, 1e-9)
    && near(cr1.target[1], 3, 1e-9) && near(cr1.el, 27, 1e-9) && near(cr1.dist, 11, 1e-9)
    && dzHeightOk && hhPeriodic);
}
{ // 3D Deliverable Mesh Audit (engine/mesh-audit.js)
  const cleanRoot = new THREE.Group();
  const cleanMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0xcc4422, metalness: 0 }));
  cleanRoot.add(cleanMesh);
  const repClean = auditDeliverable(cleanRoot, { maxTris: 100, requireUV: true });

  const badRoot = new THREE.Group();
  const flipped = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ map: new THREE.Texture(), metalness: 0.35 }));
  flipped.geometry.deleteAttribute('uv');
  flipped.scale.set(-1, 1, 1);
  badRoot.add(flipped);
  const repBad = auditDeliverable(badRoot, { maxTris: 4, clampNonMetal: true });

  C.check('auditDeliverable: passes clean meshes and catches triangle budget, negative-scale winding, missing UVs, and clamps partial metalness',
    repClean.pass && repClean.meshes === 1 && repClean.tris === 12
    && !repBad.pass && repBad.errors.some(s => s.includes('exceeds budget'))
    && repBad.errors.some(s => s.includes('negative scale'))
    && repBad.errors.some(s => s.includes('missing UV'))
    && flipped.material.metalness === 0.05);
}
{ // 2D-to-3D CAD & Blueprint Kit (engine/cad_kit.js): RectSolid watertight CSG, extrudePlan, detailing prims, logFovLerp, procTex, inkAware
  // 1. RectSolid: two touching 1x1x1 cubes along X ([0,1] and [1,2]) share no internal seam face and merge collinear edges into 12 outer edges
  const S1 = new RectSolid().add(0, 0, 0, 1, 1, 1).add(1, 0, 0, 2, 1, 1);
  const b1 = S1.build();
  // 2 cells: outer faces = 4*2 + 2 = 10 faces; merged outer edges = 12 segments
  const S2 = new RectSolid().add(0, 0, 0, 4, 3, 0.2).sub(1, 0, -0.1, 2, 2.1, 0.3);
  const b2 = S2.build();
  C.check('RectSolid: eliminates interior seam faces between touching boxes, merges collinear edges to 12, and carves doorway openings',
    b1.stats.cells === 2 && b1.stats.faces === 10 && b1.stats.segments === 12
    && b2.stats.faces > 6 && b2.geos.default.attributes.uv.count > 0);

  // 2. Pure plan geometry & log-FOV dolly-zoom framing math
  const spec = {
    rooms: [
      { key: 'lab', name: 'Optics Lab', box: [-3, -2, 1, 2] },
      { key: 'vestibule', name: 'Vestibule', poly: [[1, -2], [3, -2], [3, 2], [1, 2]] },
    ],
    walls: [
      [-3, -2, 3, -2, 0.2, 2.8],
      [-3, 2, 3, 2, 0.2, 2.8],
      [-3, -2, -3, 2, 0.2, 2.8],
      [3, -2, 3, 2, 0.2, 2.8],
      [1, -2, 1, 2, 0.16, 2.8],
    ],
    windows: [{ x0: -2.2, z0: -2, x1: -0.4, z1: -2, sill: 0.9, lintel: 2.3 }],
    doors: [{ x: 1, z: -0.4, width: 0.9, height: 2.1, axis: 'z', dir: 1, swing: 1 }],
    slides: [{ x0: -2.2, z0: 2, x1: -0.4, z1: 2, height: 2.2 }],
    dims: [{ along: 'x', at: 2.6, ticks: [-3, 1, 3], from: 2.1, side: 1 }],
    grids: [{ box: [-3, -2, 1, 2], step: 1.0 }],
    border: [-4.2, -3.0, 4.2, 3.2],
    cutY: 1.2,
  };
  const pb = planBounds(spec);
  const poseTop = planPose(pb, { fov: 3, aspect: 1.25 });
  const pose3D = { target: [0, 0.9, 0], az: 28, el: 24, fov: 36, dist: 9.5 };
  const midCam = logFovLerp(poseTop, pose3D, 0.5);
  const tanTop = Math.tan(poseTop.fov * Math.PI / 360), tan3D = Math.tan(pose3D.fov * Math.PI / 360);
  const expectedTanMid = Math.sqrt(tanTop * tan3D);
  const rigTrack = glide([
    { t: 0, x: 0, az: 350, fov: 3, dist: 150 },
    { t: 1, x: 1, az: 10, fov: 27, dist: 15 },
    { t: 2, x: 1, az: 10, fov: 27, dist: 15 },
  ]);
  // Fritsch-Carlson monotone spline must not overshoot the plateau x = 1 on [1, 2]
  const plateauOk = [1.1, 1.3, 1.5, 1.8].every(t => near(rigTrack(t).x, 1, 1e-12));
  const shortestAzOk = near(rigTrack(0.5).az, 360, 5);
  C.check('planArea, planBounds, planPose, logFovLerp & glide: exact room areas (16 + 8 = 24 m²), geometric-mean dolly-zoom, and overshoot-free monotone spline',
    near(pb.roomAreas.lab, 16, 1e-12) && near(pb.roomAreas.vestibule, 8, 1e-12) && near(pb.totalArea, 24, 1e-12)
    && poseTop.dist > 100 && near(Math.tan(midCam.fov * Math.PI / 360), expectedTanMid, 1e-12)
    && plateauOk && shortestAzOk);

  // 3. extrudePlan & parametric 3D detailing primitives
  const root = new THREE.Group();
  const plan = extrudePlan(root, spec);
  plan.setDoors(1.0);
  const doorOpenRot = Math.abs(plan.doors[0].pivot.rotation.y);
  const slideOpenX = plan.slides[0].movingPanel.position.x;
  plan.setDoors(0.0);
  plan.setSlides(0.5);
  const slideMidX = plan.slides[0].movingPanel.position.x;
  plan.setSlides(0.0);
  const doorClosedRot = Math.abs(plan.doors[0].pivot.rotation.y);
  const slideClosedX = plan.slides[0].movingPanel.position.x;
  const slArrowCoords = slideArrow(-1, 0, 1, 0);
  const pochActive = plan.wallsMesh.material.uniforms.uHasPoche.value === 1
    && plan.wallsMesh.material.clipping === true
    && plan.wallEdges.material.clipping === true
    && plan.windows[0].pane.material.uniforms.uHasPoche.value === 0
    && plan.windows[0].pane.material.side === THREE.FrontSide;
  plan.setCutY(5.0);
  const pochCleared = plan.wallsMesh.material.uniforms.uHasPoche.value === 0
    && plan.wallsMesh.material.clipping === false
    && plan.wallEdges.material.clipping === false;

  const gBasin = shell(0.9, 0.6, 0.45, { thickness: 0.05, radius: 0.08 });
  const gVase = lathe([[0, 0], [0.12, 0.05], [0.16, 0.22], [0.09, 0.38], [0.11, 0.44]], { segs: 28, samples: 20 });
  const gDrape = drape(1.6, 2.0, 0.45, { drop: 0.16, fold: 0.01 });
  const cab = fronts(root, { w: 1.2, h: 0.8, nx: 2, ny: 2, pull: 'bar' });
  const batched = batchGeos([
    { geo: bevelBox(0.2, 0.2, 0.2), pos: [-1, 0.1, 0], whole: true },
    { geo: bevelBox(0.2, 0.2, 0.2), pos: [1, 0.1, 0], whole: false },
  ]);
  const olive = branchTree(root, { height: 2.2, branches: 3, seed: 7 });
  const cShadow = contactShadow(root, 1.4, 0.8);
  const auditRep = auditDeliverable(root, { maxTris: 60000, requireUV: true });

  C.check('extrudePlan, shell, lathe, drape, fronts, batchGeos & branchTree: compile 2D plan to watertight 3D + clipped edges + non-pochè glass and pass mesh audit',
    plan.floors.length === 2 && plan.windows.length === 1 && plan.doors.length === 1 && plan.slides.length === 1
    && plan.sheet.measurements.length === 2
    && doorOpenRot > 0.8 && near(doorClosedRot, 0, 1e-12) && Math.abs(slideOpenX - slideClosedX) > 0.2
    && Math.abs(slideMidX - slideClosedX) > 0.1 && slArrowCoords.length === 24
    && pochActive && pochCleared
    && gBasin.attributes.uv.count > 40 && gVase.attributes.position.count === 21 * 29 && gDrape.attributes.uv.count > 40
    && cab.panels.length === 4 && cab.pulls.length === 4
    && batched.attributes.aCenter.count > 0 && olive.trunkMesh.isMesh && olive.crownMesh.isMesh && cShadow.isMesh
    && auditRep.pass, auditRep.errors.join('; '));

  // 4. Procedural textures, tweakMat & inkAware reveal controller
  const tWood = procTex('wood', { width: 64, height: 64, seed: 11 });
  const tWood2 = procTex('wood', { width: 64, height: 64, seed: 11 });
  const tMarble = procTex('marble', { width: 64, height: 64, seed: 11 });
  const sameSeedMatch = tWood.image.data.every((v, i) => v === tWood2.image.data[i]);
  const diffKindDiffer = tWood.image.data.some((v, i) => v !== tMarble.image.data[i]);
  const revCtrl = createRevealController([{ key: 'lab', box: [-3, -2, 1, 2], dir: [1, 0], ceil: 2.8 }]);
  const stdMat = inkAware(tweakMat(new THREE.MeshStandardMaterial({ map: tWood })), revCtrl, { backInk: true });
  revCtrl.setReveal('lab', 0.5);
  const shMock = {
    uniforms: {},
    vertexShader: '#include <common>\nvoid main(){\n#include <fog_vertex>\n}',
    fragmentShader: '#include <common>\nvoid main(){\n#include <map_fragment>\n#include <roughnessmap_fragment>\n#include <aomap_fragment>\n#include <dithering_fragment>\n}',
  };
  stdMat.onBeforeCompile(shMock);
  C.check('procTex, tweakMat, createRevealController & inkAware: deterministic DataTextures in Node and valid GLSL shader hooks in both composition orders',
    sameSeedMatch && diffKindDiffer && revCtrl.uniforms.uRoomState.value[0].x > -0.4
    && shMock.fragmentShader.includes('roomAO') && shMock.fragmentShader.includes('inkOf') && shMock.fragmentShader.includes('vnoise3'));

  // 5. Universal STEM & Economics 2D-to-3D compilers: revolveSection, extrudeCrossSections, extrudeLayers, extrudeContours
  const stemRoot = new THREE.Group();
  const rev = revolveSection(stemRoot, {
    axis: 'x',
    profile: [[-0.4, 0.2], [-0.25, 0.9], [0, 1.15], [0.25, 0.9], [0.4, 0.2]],
    rInner: 0.15,
    dims: [{ along: 'x', at: 1.5, ticks: [-1.5, 0, 1.5], unit: 'm' }],
    vectors: [{ from: [-1.5, 0.6], to: [0, 0.6] }],
    crosshairs: [{ x: 1.5, z: 0 }],
  });
  rev.setSweep(0.5);
  const cs = extrudeCrossSections(stemRoot, {
    xRange: [-1.5, 1.5],
    zLow: x => -Math.sqrt(Math.max(0, 2.25 - x * x)),
    zHigh: x => Math.sqrt(Math.max(0, 2.25 - x * x)),
    slices: 10,
    highlightIndex: 2,
    shape: 'semicircle',
  });
  cs.setLift(0.75);
  cs.setHighlight(3);
  const lay = extrudeLayers(stemRoot, {
    width: 3.0,
    depth: 2.0,
    layers: [
      { name: 'Epidermis', z0: 0, z1: 0.3, pal: 'ochre', gapX: 0, gapWidth: 0.4, cutOut: [-0.2, -0.2, 0.2, 0.2] },
      { name: 'Palisade', y0: 0.3, y1: 1.1, pal: 'green' },
    ],
    columns: [{ nx: 4, nz: 2, r: 0.15, y0: 0.35, y1: 1.05, pal: 'green' }],
    tubes: [{ x: 0.5, y: 0.6, r: 0.14, pal: 'blue' }],
    dims: [{ along: 'x', at: 1.4, ticks: [-1.5, 1.5], unit: 'µm', scale: 100, decimals: 0 }],
  });
  lay.setDepth(0.8);
  const cont = extrudeContours(stemRoot, {
    xRange: [-2, 2],
    zRange: [-2, 2],
    heightFn: (x, z) => Math.max(0.05, 1.8 - 0.25 * (x * x + z * z)),
    nx: 16,
    nz: 16,
    constraint: { x0: -1.5, z0: 1.5, x1: 1.5, z1: -1.5, height: 1.8 },
    circles: [{ x: 0, z: 0, r: 1.2 }],
  });
  cont.setElevation(0.9);
  const stemAudit = auditDeliverable(stemRoot, { maxTris: 60000, requireUV: true });
  C.check('STEM 2D-to-3D compilers (revolveSection, extrudeCrossSections, extrudeLayers, extrudeContours): build valid UV-mapped 3D solids and custom-unit 2D sheets',
    rev.mesh.isMesh && near(rev.mesh.scale.y, lerp(0.015, 1.0, 0.5), 1e-6)
    && cs.slices.length === 10 && near(cs.slicesGroup.scale.y, lerp(0.008, 1.0, 0.75), 1e-6)
    && lay.layerMeshes.length === 2 && lay.sheet.measurements[0].text === '300 µm'
    && cont.surfaceMesh.isMesh && cont.constraintMesh.isMesh
    && stemAudit.pass, stemAudit.errors.join('; '));
}
{ // Dynamic part.position mutation preserved across stepExplode / setExplode / resetExplode
  const ctl = createAssemblyController({});
  const root = new THREE.Group();
  const g = ctl.asm('dyn', root, { title: 'Dynamic assembly' });
  const m = part(g, box(0.2, 0.2, 0.2), { pos: [1, 0.5, 0], ex: [0.4, 0.3, 0], name: 'Moving part' });
  m.position.y = 1.25;
  ctl.stepExplode(0.016);
  const unexplodedOk = near(m.position.x, 1, 1e-6) && near(m.position.y, 1.25, 1e-6);
  ctl.setExplode(1, ['dyn'], true);
  const explodedOk = near(m.position.x, 1.4, 1e-6) && near(m.position.y, 1.55, 1e-6);
  ctl.resetExplode();
  m.position.y = 0.8;
  ctl.stepExplode(0.016);
  const updatedExplodedOk = near(m.position.x, 1.4, 1e-6) && near(m.position.y, 1.1, 1e-6);
  C.check('stepExplode & resetExplode preserve dynamic part.position updates alongside explode offsets',
    unexplodedOk && explodedOk && updatedExplodedOk);
}
{ // WCAG 2.x contrast auditor (engine/theme.js), CSS token audit, kym-live 2D fallbacks & applyTheme presets
  const dir = path.dirname(fileURLToPath(import.meta.url));
  const atlasCss = fs.readFileSync(path.join(dir, 'atlas.css'), 'utf8');
  const tok = name => {
    const m = new RegExp(`${name}:\\s*(#[0-9a-fA-F]{3,8})`).exec(atlasCss);
    return m ? m[1] : null;
  };
  const page = tok('--page'), card = tok('--card'), text = tok('--text'), strong = tok('--strong');
  const muted = tok('--muted'), hi = tok('--hi'), mid = tok('--mid'), red = tok('--red');
  const redInk = tok('--red-ink'), greenInk = tok('--green-ink');

  // Active semantic text and non-text pairs across atlas.css, book.css, figure.css, labels.css, shelf.css, concepts.css.
  // WCAG 1.4.3 inactive/disabled states (:disabled, .card.soon, .none, li.unshown, .chip:not(.on) .v) are exempt by spec.
  const cssAudit = auditTheme([
    { role: 'atlas/book/figure strong on card', fg: strong, bg: card, kind: 'text' },
    { role: 'atlas/shelf/concepts strong on page', fg: strong, bg: page, kind: 'text' },
    { role: 'atlas/book/figure hi on card', fg: hi, bg: card, kind: 'text' },
    { role: 'atlas/book/figure text on card', fg: text, bg: card, kind: 'text' },
    { role: 'atlas/shelf/concepts text on page', fg: text, bg: page, kind: 'text' },
    { role: 'atlas/book/figure/labels/concepts muted on card (.kicker, .chart text, .lbl.mark, .n .home)', fg: muted, bg: card, kind: 'text' },
    { role: 'atlas/shelf/concepts muted on page (.topbar, .scroll-cue, .search-trigger kbd)', fg: muted, bg: page, kind: 'text' },
    { role: 'atlas/book/figure mid stroke on card', fg: mid, bg: card, kind: 'mark' },
    { role: 'atlas/book/figure mid stroke on page', fg: mid, bg: page, kind: 'mark' },
    { role: 'atlas/parts red vector/ring mark on card', fg: red, bg: card, kind: 'mark' },
    { role: 'book/figure/labels red-ink text on card (.numstatus.wrong, .again.strong, .lbl.vec.red)', fg: redInk, bg: card, kind: 'text' },
    { role: 'book/figure red-ink text on wrong fill #fcefef', fg: redInk, bg: '#fcefef', kind: 'text' },
    { role: 'figure red-ink text on wrong fill #fdf0f0', fg: redInk, bg: '#fdf0f0', kind: 'text' },
    { role: 'figure .speed card text on red-ink badge', fg: card, bg: redInk, kind: 'text' },
    { role: 'book/figure green-ink text on card (.numstatus.right)', fg: greenInk, bg: card, kind: 'text' },
    { role: 'book/figure green-ink text on right fill #eef7f1', fg: greenInk, bg: '#eef7f1', kind: 'text' },
    { role: 'labels .lbl.vec.blue on card', fg: '#3d63a8', bg: card, kind: 'text' },
    // kym-live.js 2D fallback themes (light, sepia, dark)
    { role: 'kym-live fallback light ink', fg: '#1d2422', bg: '#f9f7f2', kind: 'text' },
    { role: 'kym-live fallback light muted', fg: '#586660', bg: '#f9f7f2', kind: 'text' },
    { role: 'kym-live fallback light accent', fg: '#2b6180', bg: '#f9f7f2', kind: 'text' },
    { role: 'kym-live fallback light warm', fg: '#a33b29', bg: '#f9f7f2', kind: 'text' },
    { role: 'kym-live fallback sepia ink', fg: '#1d2422', bg: '#f2e8d5', kind: 'text' },
    { role: 'kym-live fallback sepia muted', fg: '#586660', bg: '#f2e8d5', kind: 'text' },
    { role: 'kym-live fallback sepia accent', fg: '#2b6180', bg: '#f2e8d5', kind: 'text' },
    { role: 'kym-live fallback sepia warm', fg: '#a33b29', bg: '#f2e8d5', kind: 'text' },
    { role: 'kym-live fallback dark ink', fg: '#e8e4da', bg: '#171c1b', kind: 'text' },
    { role: 'kym-live fallback dark muted', fg: '#9aa5a1', bg: '#171c1b', kind: 'text' },
    { role: 'kym-live fallback dark accent', fg: '#68b0d8', bg: '#171c1b', kind: 'text' },
    { role: 'kym-live fallback dark warm', fg: '#e07a5f', bg: '#171c1b', kind: 'text' },
  ]);

  // applyTheme() Kym textbook presets (tools/kymhost/index.html: light, sepia, dark)
  const kymPresets = [
    { name: 'light', sheet: '#fbfaf5', ink: '#1d332d', red: '#a94730', ochre: '#936022', blue: '#356d83', green: '#2e604a' },
    { name: 'sepia', sheet: '#f8f0e0', ink: '#3a2e22', red: '#a3452c', ochre: '#87581b', blue: '#3c687a', green: '#456446' },
    { name: 'dark',  sheet: '#18211e', ink: '#e6e3d6', red: '#e0896f', ochre: '#d4a35f', blue: '#78b3cb', green: '#7cbf9c' },
  ];
  const kymEntries = [];
  for (const p of kymPresets) {
    const out = applyTheme(p);
    kymEntries.push({ role: `kym ${p.name} ink`, fg: out.ink, bg: out.sheet, kind: 'text' });
    kymEntries.push({ role: `kym ${p.name} inks[4]`, fg: out.inks[4], bg: out.sheet, kind: 'mark' });
    for (const hue of ['red', 'blue', 'green', 'ochre']) {
      kymEntries.push({ role: `kym ${p.name} PALETTE.${hue}[1]`, fg: PALETTE[hue][1], bg: out.sheet, kind: 'mark' });
      kymEntries.push({ role: `kym ${p.name} PALETTE.${hue}[2]`, fg: PALETTE[hue][2], bg: out.sheet, kind: 'mark' });
    }
  }
  applyTheme(null);
  const kymAudit = auditTheme(kymEntries);

  // Adversarial negative checks (low-contrast hex and translucent rgba must fail)
  const negAudit = auditTheme([
    { role: 'stale muted #8c8c90 on page', fg: '#8c8c90', bg: '#f2f2ef', kind: 'text' },
    { role: 'faint translucent rgba on white', fg: 'rgba(24,24,26,0.25)', bg: '#fbfbfa', kind: 'text' },
  ]);

  C.check('theme.js & CSS contrast gate: all active CSS tokens, kym-live 2D fallbacks, and applyTheme Kym presets clear WCAG AA (4.5:1 text / 3:1 marks) and reject low-contrast pairs',
    cssAudit.ok && kymAudit.ok && !negAudit.ok && negAudit.findings.length === 2
    && near(wcagContrast('#000000', '#ffffff'), 21, 1e-6)
    && near(srgbLuminance('#ffffff'), 1, 1e-6)
    && near(compositeOver('rgba(0,0,0,0.5)', '#ffffff').r, 127.5, 1e-6),
    [...cssAudit.findings, ...kymAudit.findings].map(f => `${f.role}: ${f.ratio}:1 < ${f.min}:1`).join('; '));
}
{ // Deepened 2D charts (engine/chart.js): paper-masked callouts, empty-mark guard, clamping, waterfallChart & sankeyChart
  const advMono = textAdvanceEm('A1', true), advCjk = textAdvanceEm('注文\u0301', false);
  const svgMarked = chart({
    x0: 0, x1: 10, y0: -2, y1: 10, w: 420, h: 170,
    xlabel: 't (s)', ylabel: 'v & <y>', label: 'Velocity <v>', desc: 'Test description & bounds', id: 'vel-test',
    series: [{ cls: 'curve', fill: true, pts: [[0, 0], [5, 8], [10, 9.9]], tag: [9.9, 9.9, 'peak > 9', true] }],
    marks: [[0.1, 9.9, 'top-left'], [5, 4, '']],
    cursors: ['c1'],
  });
  // Paint order: curve path before mask rect, mask rect before tag/callout text; empty mark produces circle without extra mask
  const idxCurve = svgMarked.indexOf('class="curve"'), idxMask = svgMarked.indexOf('class="mask"'), idxLab = svgMarked.indexOf('peak &gt; 9');
  const maskCount = (svgMarked.match(/class="mask"/g) || []).length;
  const markCircleCount = (svgMarked.match(/class="mark"/g) || []).length;
  const svgNoId = chart({ x0: 0, x1: 1, y0: 0, y1: 1, series: [{ pts: [[0, 0], [1, 1]] }], xlabel: 'x', ylabel: 'y', label: 'Plain' });

  // Waterfall conservation & geometry
  const wf = waterfallWalk([
    { name: 'Start', value: 100, role: 'start' },
    { name: 'Gain', value: 35, role: 'delta' },
    { name: 'Mid', value: 135, role: 'subtotal' },
    { name: 'Loss', value: -25, role: 'delta' },
    { name: 'End', value: 110, role: 'end' },
  ]);
  const wfSvg = waterfallChart({
    steps: [
      { name: 'Start', value: 100, role: 'start' },
      { name: 'Gain', value: 35, role: 'delta' },
      { name: 'Loss', value: -25, role: 'delta' },
      { name: 'End', value: 110, role: 'end' },
    ],
    ylabel: 'M$',
    label: 'Budget bridge',
  });
  let wfBadCaught = false;
  try {
    waterfallWalk([
      { name: 'Start', value: 100, role: 'start' },
      { name: 'Gain', value: 35, role: 'delta' },
      { name: 'End', value: 120, role: 'end' },
    ]);
  } catch (_) { wfBadCaught = true; }

  // Sankey conservation, shared scale & horizontal Bezier midline tangents
  const sk = sankeyLayout({
    stages: [
      [{ id: 'solar', name: 'Solar', value: 100, focal: true }],
      [{ id: 'grid', name: 'Grid', value: 70, focal: true }, { id: 'heat', name: 'Heat loss', value: 30 }],
      [{ id: 'work', name: 'Useful work', value: 70, focal: true }, { id: 'waste', name: 'Exhaust', value: 30 }],
    ],
    links: [
      { from: 'solar', to: 'grid', value: 70, focal: true },
      { from: 'solar', to: 'heat', value: 30 },
      { from: 'grid', to: 'work', value: 70, focal: true },
      { from: 'heat', to: 'waste', value: 30 },
    ],
  });
  const skSvg = sankeyChart({
    stages: [
      [{ id: 'solar', name: 'Solar', value: 100, focal: true }],
      [{ id: 'work', name: 'Work', value: 70, focal: true }, { id: 'loss', name: 'Loss', value: 30 }],
    ],
    links: [
      { from: 'solar', to: 'work', value: 70, focal: true },
      { from: 'solar', to: 'loss', value: 30 },
    ],
    unit: 'J',
  });
  // Verify every ribbon's cubic Bezier control points sit on the corridor midline (midX = (x0 + x1) / 2)
  const skTangentsHorizontal = sk.ribbons.every(r => near(r.midX, (r.x0 + r.x1) / 2, 1e-9) && r.d.includes(`C ${r.midX.toFixed(1)},${r.y0Top.toFixed(1)} ${r.midX.toFixed(1)},${r.y1Top.toFixed(1)}`));
  let skBadCaught = false;
  try {
    sankeyLayout({
      stages: [[{ id: 'a', name: 'A' }], [{ id: 'b', name: 'B' }]],
      links: [{ from: 'a', to: 'b', value: 50 }],
    });
    // Now break conservation across 3 stages:
    sankeyLayout({
      stages: [[{ id: 'a', name: 'A' }], [{ id: 'b', name: 'B' }], [{ id: 'c', name: 'C' }]],
      links: [{ from: 'a', to: 'b', value: 50 }, { from: 'b', to: 'c', value: 40 }],
    });
  } catch (_) { skBadCaught = true; }

  C.check('chart.js: paper-masked callouts, empty-mark guard, XML escaping, and conservation-verified waterfallChart & sankeyChart',
    near(advMono, 1.24, 1e-9) && near(advCjk, 2.0, 1e-9)
    && idxCurve > 0 && idxMask > idxCurve && idxLab > idxMask
    && maskCount === 2 && markCircleCount === 2
    && svgMarked.includes('aria-labelledby="vel-test-title vel-test-desc"')
    && !svgNoId.includes('id="') && svgNoId.includes('role="img" aria-label="Plain"')
    && wf.bars.length === 5 && wf.carries.length === 4 && wf.bars[1].text === '+35' && wf.bars[3].text === '−25'
    && wfSvg.includes('class="wf-up"') && wfSvg.includes('class="wf-down"') && wfBadCaught
    && sk.total === 100 && sk.ribbons.length === 4 && skTangentsHorizontal && skSvg.includes('class="sk-ribbon focal"') && skBadCaught);
}
{ // Root @saxster/atlas barrel export (engine/index.js) & 3-stage Graph-Spread Search (engine/search.js)
  const rootPkg = await import('./index.js');
  C.check('engine/index.js: root barrel imports cleanly with both 3D spring and scalar motionSpring',
    typeof rootPkg.spring === 'function' && typeof rootPkg.motionSpring === 'function' && rootPkg.spring !== rootPkg.motionSpring);

  const { tokenizeQuery, buildIdf, scoreItem, rankSearch } = await import('./search.js');
  const { SEARCH_INDEX } = await import('../examples/search-index.js');
  const idfMap = buildIdf(SEARCH_INDEX, ['inductance', 'physics']);
  const rareOutweighsCommon = idfMap.get('inductance').idf > idfMap.get('physics').idf * 2;

  const lcHits = rankSearch(SEARCH_INDEX, 'LC oscillations', { limit: 15, spread: true });
  const lcDirect = lcHits.find(h => h.id === 'physics/induction/9');
  const lcSpread = lcHits.find(h => h.id === 'physics/oscillations/8');

  const indHits = rankSearch(SEARCH_INDEX, 'inductance', { limit: 15, spread: true });
  const indDirect = indHits.find(h => h.id === 'physics/induction/7');
  const indSpread = indHits.find(h => h.id === 'physics/energy/3');

  const pegHits = rankSearch(SEARCH_INDEX, 'pegboard', { limit: 15, spread: true });
  const pegThread = pegHits.find(h => h.id === 'thread:bell');
  const pegDiffusion = pegHits.find(h => h.id === 'concept:diffusion');

  const cltHits = rankSearch(SEARCH_INDEX, 'central limit', { limit: 15, spread: true });
  const cltDirect = cltHits.find(h => h.id === 'concept:clt');
  const cltThread = cltHits.find(h => h.id === 'thread:bell');
  const cltSibling = cltHits.find(h => h.id === 'concept:diffusion' || h.id === 'concept:measurement-error');

  C.check('search.js: corpus-IDF weighting, 1-hop XREFS analogy spreading (LC ↔ SHM, inductance ↔ kinetic energy), and 1-hop THREADS spreading',
     tokenizeQuery('  LC, Oscillations! ').length === 2
    && scoreItem({ kind: 'chapter', title: 'Test' }, []) === 10
    && rareOutweighsCommon
    && Boolean(lcDirect) && Boolean(lcSpread) && lcSpread.matchWhy?.startsWith('Compare ·')
    && Boolean(indDirect) && Boolean(indSpread) && indSpread.matchWhy?.startsWith('Compare ·')
    && Boolean(pegThread) && Boolean(pegDiffusion) && pegDiffusion.matchWhy?.startsWith('Thread ·')
    && Boolean(cltDirect) && Boolean(cltThread) && Boolean(cltSibling) && cltSibling.matchWhy?.startsWith('Thread ·'));
}
{ // Programmatic boot package assembler & strict router (cli/boot.mjs)
  const { TARGETS, boot } = await import('../cli/boot.mjs');
  const allTargetsOk = TARGETS.length === 26 && TARGETS.every(t => {
    const res = boot(t.slug);
    const hasTemplates = t.kind !== 'grammar' || (res.templates?.['model.js'] && res.templates?.['checks.mjs'] && res.templates?.['world.js']);
    const hasVoiceDoc = t.kind !== 'voice' || (Boolean(res.voiceDoc) && res.markdown.includes('## Creator Voice Guide'));
    return res.matched && res.exitCode === 0 && res.slug === t.slug && hasTemplates && hasVoiceDoc;
  });
  const trigExplorer = boot('interactive experiment with what if sliders');
  const trigBlueprint = boot('2d to 3d architectural blueprint with section cut');
  const trigInk = boot('diegetic controls');
  const trigVoice = boot('thebuggeddev pencil wash');
  const trigWhacky = boot('wild and whacky mad atelier');
  const trigCombo = boot('what if sliders in ciechanow style');
  const abstainRes = boot('create a lesson tracker doc for the course');
  const noMatchRes = boot('underwater basketweaving');
  const listRes = boot('', { list: true });

  C.check('cli/boot.mjs: all 6 grammars, 10 kits & 10 creator voices assemble live boot packages, complete triggers route, partial overlaps abstain (exit 0), and non-matches exit 3',
    allTargetsOk
    && trigExplorer.matched && trigExplorer.slug === 'explorer'
    && trigBlueprint.matched && trigBlueprint.slug === 'blueprint'
    && trigInk.matched && trigInk.slug === 'ink-ui'
    && trigVoice.matched && trigVoice.slug === 'bugged-sketchbook' && trigVoice.register === 'quirky'
    && trigWhacky.matched && trigWhacky.slug === 'whacky-lab' && trigWhacky.register === 'wild'
    && trigCombo.matched && trigCombo.slug === 'explorer' && trigCombo.supportingKits.includes('ciechanowski-mechanism')
    && !abstainRes.matched && abstainRes.exitCode === 0 && abstainRes.candidates?.length > 0
    && !noMatchRes.matched && noMatchRes.exitCode === 3 && noMatchRes.candidates?.length === 0
    && !listRes.matched && listRes.exitCode === 0 && listRes.targets?.length === 26);
}
{ // Pure conservation solvers, equal-flux quantileSeeds & 3D axisymmetric ray tracing (engine/solvers.js)
  const { solveNetwork, quantileSeeds, traceAxisymmetricRays } = await import('./solvers.js');
  // 10V ideal source (node 1 -> 0) feeding R1 = 4Ω (1 -> 2), R2 = 6Ω (2 -> 0), plus 0.5A current source (0 -> 2)
  // KCL at node 2: (V2 - 10)/4 + V2/6 - 0.5 = 0 => (5/12) V2 = 3 => V2 = 7.2V
  const net = solveNetwork(2, [
    { type: 'V', from: 1, to: 0, V: 10 },
    { type: 'R', from: 1, to: 2, R: 4 },
    { type: 'R', from: 2, to: 0, R: 6 },
    { type: 'I', from: 0, to: 2, I: 0.5 },
  ], { gmin: 1e-12 });
  const powerSum = net.powers.reduce((a, b) => a + b, 0);
  // Backward-Euler RC step: 10V -> R=1Ω -> C=1F (dt=1s, prevDiff=0) => V_c = 5V
  const rcStep = solveNetwork(2, [
    { type: 'V', from: 1, to: 0, V: 10 },
    { type: 'R', from: 1, to: 2, R: 1 },
    { type: 'C', from: 2, to: 0, cap: 1, prevDiff: 0, dt: 1 },
  ], { gmin: 1e-12 });

  // quantileSeeds: uniform w(r)=1 on [0, 4] -> [0.5, 1.5, 2.5, 3.5]; radial w(r)=2r on [0, 1] -> sqrt((k+0.5)/4)
  const qUni = quantileSeeds(() => 1, [0, 4], 4);
  const qRad = quantileSeeds(r => 2 * r, [0, 1], 4, { samples: 512 });
  const qOk = qUni.every((v, k) => near(v, k + 0.5, 1e-3))
    && qRad.every((v, k) => near(v, Math.sqrt((k + 0.5) / 4), 2e-3));

  // Thin biconvex lens in air (n=1.5, R1=+4, R2=-4, thickness 0.002 -> paraxial 1/f = (1.5 - 1)*(1/4 + 1/4) = 0.25 => f = 4.0)
  const paraxial = traceAxisymmetricRays([
    { x0: 0, R: 4, aperture: 1.5, n1: 1.0, n2: 1.5 },
    { x0: 0.002, R: -4, aperture: 1.5, n1: 1.5, n2: 1.0 },
  ], [{ origin: [-1, 0.04, 0], dir: [1, 0, 0] }], { xEnd: 6 })[0];
  // Intercept where ray crosses y = 0: x_focus = exitOrigin.x - exitOrigin.y * (dir.x / dir.y)
  const xFocus = paraxial.exitOrigin[0] - paraxial.exitOrigin[1] * (paraxial.dir[0] / paraxial.dir[1]);

  // Total internal reflection inside glass (n1=1.5 -> n2=1.0 at >41.8° incidence on flat x0=0 interface)
  const tirRay = traceAxisymmetricRays([
    { x0: 0, R: Infinity, aperture: 5, n1: 1.5, n2: 1.0 },
  ], [{ origin: [-1, 0, 0], dir: [Math.cos(Math.PI / 3), Math.sin(Math.PI / 3), 0] }])[0];

  C.check('solvers.js: solveNetwork satisfies KCL & Tellegen power balance, quantileSeeds matches inverse-CDF, and traceAxisymmetricRays hits lens focus & TIR',
    near(net.potentials[1], 10, 1e-9) && near(net.potentials[2], 7.2, 1e-8)
    && net.maxKclResidual < 1e-9 && Math.abs(powerSum) < 1e-8
    && near(rcStep.potentials[2], 5.0, 1e-8)
    && qOk
    && !paraxial.tir && !paraxial.clipped && near(xFocus, 4.0, 0.01)
    && tirRay.tir && tirRay.dir[0] < -0.49);
}
{ // Reactive prose kit, Oliver Byrne theme contrast & procedural WebAudio kit (engine/prose.js, theme.js, sound.js)
  const { BYRNE_THEME } = await import('./theme.js');
  const { scrub, val, term, byrne, aside } = await import('./prose.js');
  const { playTone, playBoop, playClick, playKnock, createHum } = await import('./sound.js');

  const byrneAudit = auditTheme([
    { role: 'Byrne ink on rag sheet', fg: BYRNE_THEME.ink, bg: BYRNE_THEME.sheet, kind: 'text' },
    { role: 'Byrne cobalt on rag sheet', fg: BYRNE_THEME.blue, bg: BYRNE_THEME.sheet, kind: 'text' },
    { role: 'Byrne emerald on rag sheet', fg: BYRNE_THEME.green, bg: BYRNE_THEME.sheet, kind: 'text' },
    { role: 'Byrne ochre prose ink (#825b00) on rag sheet', fg: '#825b00', bg: BYRNE_THEME.sheet, kind: 'text' },
    { role: 'Byrne vermilion mark on rag sheet', fg: BYRNE_THEME.red, bg: BYRNE_THEME.sheet, kind: 'mark' },
  ]);

  const scHtml = scrub('omega', { value: 2.5, min: 0, max: 10, step: 0.5, unit: ' rad/s', part: 'rotor', color: 'ochre' });
  const valHtml = val('torque', { initial: '1.2 N·m', part: 'coil', color: 'red' });
  const termHtml = term(['brushA', 'brushB'], 'carbon brushes', { color: 'blue', isolate: true });
  const segHtml = byrne.seg('arm', { color: 'red', angle: 30 });
  const angHtml = byrne.angle('phi', { color: 'blue', sweep: 45 });
  const polyHtml = byrne.poly('face', { shape: 'tri', color: 'ochre' });
  const asideHtml = aside('why split the ring?', 'So current reverses every half-turn.', { id: 'why-split' });

  // Mock WebAudio context in headless Node
  let oscCount = 0, bufCount = 0;
  const mockParam = () => ({ setValueAtTime() {}, exponentialRampToValueAtTime() {}, setTargetAtTime() {} });
  const mockNode = () => ({ connect() {}, start() {}, stop() {}, frequency: mockParam(), gain: mockParam(), Q: mockParam(), pan: mockParam(), type: '' });
  const mockCtx = {
    state: 'running',
    currentTime: 0,
    sampleRate: 44100,
    destination: {},
    createOscillator() { oscCount++; return mockNode(); },
    createGain() { return mockNode(); },
    createBiquadFilter() { return mockNode(); },
    createStereoPanner() { return mockNode(); },
    createBuffer(_ch, len) { return { getChannelData: () => new Float32Array(len) }; },
    createBufferSource() { bufCount++; return mockNode(); },
  };
  playTone(mockCtx, { freq: 440, pan: -0.3 });
  playBoop(mockCtx, { streak: 3 });
  playClick(mockCtx, { dir: -1 });
  playKnock(mockCtx, { velocity: 2.0 });
  const hum = createHum(mockCtx);
  hum.update(0.75);
  hum.stop();

  C.check('prose.js, BYRNE_THEME & sound.js: Byrne palette passes WCAG AA, inline tokens emit accessible attributes, and WebAudio synthesis runs cleanly',
    byrneAudit.ok
    && scHtml.includes('role="spinbutton"') && scHtml.includes('data-param="omega"') && scHtml.includes('#825b00')
    && valHtml.includes('data-var="torque"')
    && termHtml.includes('data-part="brushA,brushB"') && termHtml.includes('data-isolate="1"')
    && segHtml.includes('<svg') && angHtml.includes('<path') && polyHtml.includes('<polygon')
    && asideHtml.includes('aria-controls="why-split"') && asideHtml.includes('hidden')
    && oscCount >= 7 && bufCount === 1);
}
{ // 1D skew-line rail drag, multi-target assembly isolation, flush idOff, MEDIUMS, QUIRKS, fieldLines, flowBeads, live chart & calmPBR
  const { rayAxisClosest, MEDIUMS, QUIRKS, DEFAULT_QUIRK, resolveQuirk } = await import('./stage.js');
  const { arrow, setArrow } = await import('./parts.js');
  const { fieldLines, flowBeads } = await import('./prims.js');
  const { moveTangent, setLivePath } = await import('./chart.js');

  // Skew-line closest point at oblique grazing view angle + behind-camera rejection
  const hitOblique = rayAxisClosest([0.4, 2.0, 3.0], [0.2, -2.0, -3.0], [-2, 0, 0], [4, 0, 0]);
  const hitBehind = rayAxisClosest([0, 0, 2], [0, 0, 1], [-1, 0, 0], [2, 0, 0]);
  const railMesh = new THREE.Mesh();
  const dRail = draggable(railMesh, { axis: { origin: [0, 0, 0], dir: [1, 0, 0], min: -1.5, max: 1.5 }, load: 0.4 });
  dRail.set(2.4); // clamps to 1.5

  // Multi-target assembly isolation + flush coplanar idOff preservation + gear notch + MathBox micro-vector ease
  const scene = new THREE.Group();
  const ctrl = createAssemblyController();
  const gA = ctrl.asm('a', scene), gB = ctrl.asm('b', scene), gC = ctrl.asm('c', scene);
  const pA1 = part(gA, box(0.5, 0.5, 0.5), { pal: 'driver', idOff: -0.05, name: 'HalfA' });
  const pA2 = part(gA, box(0.5, 0.5, 0.5), { pal: 'driven', idOff: 0.05, name: 'HalfB' });
  const pB = gear(gB, { teeth: 14, r: 0.6, width: 0.16, pal: 'idler', notch: true, name: 'Idler' });
  const pC = part(gC, box(0.5, 0.5, 0.5), { pal: 'housing', name: 'Shell' });
  ctrl.setIsolate(['a', 'b']);
  const multiIsoOk = near(pC.material.uniforms.uOpacity.value, 0.14, 1e-6)
    && (pA1.material.uniforms?.uOpacity?.value ?? 1) === 1
    && near(pA2.userData.idOff - pA1.userData.idOff, 0.10, 1e-6);
  ctrl.setIsolate(null);

  const arr = arrow(scene, 'red', { head: 0.18 });
  setArrow(arr, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.05, 0, 0), 1); // tiny < 3 * head -> cubic micro-ease
  const microHeadScaled = arr.userData.arrow.tip.scale.x < 0.7 && arr.userData.arrow.tip.scale.x > 0.01 && arr.visible;

  // fieldLines + flowBeads + new procTex presets + idempotent calmPBR audit + chart tangents/livePaths
  const fl = fieldLines(scene, (x, y) => [-y, x, 0], { seeds: [[1, 0, 0], [1.5, 0, 0]], steps: 24, dt: 0.05, conesEvery: 8 });
  const fb = flowBeads(scene, u => [Math.cos(u * TAU), Math.sin(u * TAU), 0], { count: 10, shape: 'cone' });
  fb.update(0.25);
  const texKindsOk = ['foil', 'fluted', 'striation', 'acuity'].every(k => procTex(k).image.data.length === 256 * 256 * 4);

  const mirrorGroup = new THREE.Group();
  const mirrorMat = new THREE.MeshStandardMaterial({ roughness: 0.05, metalness: 0.9, normalScale: new THREE.Vector2(1, 1) });
  const mirrorBox = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mirrorMat);
  mirrorGroup.add(mirrorBox);
  auditDeliverable(mirrorGroup, { calmPBR: true });
  auditDeliverable(mirrorGroup, { calmPBR: true }); // second pass must be idempotent (normalScale stays 0.65, not 0.65^2)

  const liveSvg = chart({
    x0: 0, x1: 4, y0: -2, y1: 2,
    series: [{ pts: [[0, 0], [4, 1]] }],
    tangents: ['tg1'],
    livePaths: ['lp1'],
    xlabel: 'θ', ylabel: 'τ', label: 'Torque',
  });

  // Regression checks: contactShadow options-object overload + setHeight, numeric draggable load + stepDraggableLoad
  const { stepDraggableLoad } = await import('./stage.js');
  const shadowGroup = new THREE.Group();
  const sh1 = contactShadow(shadowGroup, 2.0, 1.8, { pos: [0, -0.5, 0], strength: 0.3 });
  const sh2 = contactShadow(shadowGroup, { w: 2.1, d: 2.0, opacity: 0.18, y: -0.975 });
  sh2.setHeight?.(0.6);
  dRail.targetValue = 0.5;
  const steppedVal = stepDraggableLoad?.(dRail, 1 / 60);

  const checksMap = {
    med: MEDIUMS.length === 5 && MEDIUMS.includes('pencil-wash') && MEDIUMS.includes('ciechanow') && MEDIUMS.includes('moebius') && MEDIUMS.includes('risograph'),
    quirk: QUIRKS.length === 5 && DEFAULT_QUIRK === 'slightly-quirky' && resolveQuirk().id === 'slightly-quirky' && resolveQuirk().medium === 'pencil-wash' && resolveQuirk('bland').level === 0 && resolveQuirk('whacky').id === 'wild' && resolveQuirk('over-the-top').level === 1,
    ray: hitOblique !== null && near(hitOblique.s, 0.65, 1e-6) && hitBehind === null,
    rail: near(dRail.get(), 1.5, 1e-12) && near(railMesh.position.x, 1.5, 1e-12) && typeof steppedVal === 'number' && steppedVal < 1.5 && steppedVal > 0.5,
    shadow: shadowGroup.children.length === 2 && near(sh1.position.y, -0.5, 1e-6) && near(sh2.position.y, -0.975, 1e-6) && sh2.material.uniforms.uStrength.value < 0.18,
    iso: multiIsoOk && pB.children.length === 1 && pB.children[0].userData.idOff === 0,
    micro: microHeadScaled,
    fl: fl.tubes.length === 2 && fl.cones.count === 6 && fb.object.count === 10,
    tex: texKindsOk,
    pbr: near(mirrorMat.metalness, 0.05, 1e-6) && near(mirrorMat.roughness, 0.38, 1e-6) && near(mirrorMat.normalScale.x, 0.65, 1e-6),
    svg: liveSvg.includes('data-tangent="tg1"') && liveSvg.includes('data-live="lp1"') && typeof moveTangent === 'function' && typeof setLivePath === 'function',
  };
  C.check('MEDIUMS, rayAxisClosest, multi-target isolation, flush idOff, gear notch, fieldLines/flowBeads, procTex, calmPBR & live chart slots work cleanly',
    Object.values(checksMap).every(Boolean),
    Object.entries(checksMap).filter(([, v]) => !v).map(([k]) => k).join(','));
}
{ // Model-First structural audit (cli/check.mjs) & PreToolUse gate (cli/gate.mjs)
  const fs = await import('node:fs');
  const os = await import('node:os');
  const path = await import('node:path');
  const { auditFigureDir } = await import('../cli/check.mjs');
  const { evaluateGate } = await import('../cli/gate.mjs');

  const minBookOk = auditFigureDir('examples/minimal/book').ok;
  const minBlueprintOk = auditFigureDir('examples/minimal/blueprint').ok;

  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'atlas-gate-test-'));
  try {
    // 1. Missing model.js and checks.mjs -> blocks world.js write
    const denyMissing = evaluateGate(path.join(tmpRoot, 'world.js'));
    // Writing model.js itself is always allowed
    const allowModelWrite = evaluateGate(path.join(tmpRoot, 'model.js'));

    // 2. Impure model.js (imports three) -> blocks world.js write
    fs.writeFileSync(path.join(tmpRoot, 'model.js'), `import * as THREE from 'three';\nexport const f = x => x * 2;\n`);
    fs.writeFileSync(path.join(tmpRoot, 'checks.mjs'), `import { f } from './model.js';\nif (f(2) === 4) console.log('PASS f(2)=4'); else process.exit(1);\n`);
    const denyImpure = evaluateGate(path.join(tmpRoot, 'world.js'));

    // 3. Pure model.js, but checks.mjs prints 0 PASS rows -> blocks world.js write
    fs.writeFileSync(path.join(tmpRoot, 'model.js'), `export const f = x => x * 2;\n`);
    fs.writeFileSync(path.join(tmpRoot, 'checks.mjs'), `import { f } from './model.js';\n`);
    const denyZeroPass = evaluateGate(path.join(tmpRoot, 'world.js'));

    // 4. Pure model.js + passing checks.mjs, but unread protocol in transcript -> blocks brand-new world.js
    fs.writeFileSync(path.join(tmpRoot, 'checks.mjs'), `import { f } from './model.js';\nif (f(3) === 6) console.log('PASS f(3)=6'); else process.exit(1);\n`);
    const transcriptFile = path.join(tmpRoot, 'transcript.jsonl');
    fs.writeFileSync(transcriptFile, `{"type":"tool_use","name":"Read","input":{"file_path":"README.md"}}\n`);
    const denyUnread = evaluateGate(path.join(tmpRoot, 'world.js'), { transcriptPath: transcriptFile });

    // 5. Transcript includes atlas boot -> allows brand-new world.js
    fs.appendFileSync(transcriptFile, `{"type":"tool_use","name":"Bash","input":{"command":"npx atlas boot book"}}\n`);
    const allowAfterBoot = evaluateGate(path.join(tmpRoot, 'world.js'), { transcriptPath: transcriptFile });

    C.check('cli/check.mjs & cli/gate.mjs: enforce Model-First purity, non-empty checks.mjs PASS rows, and Read-Before-Write protocol gate',
      minBookOk && minBlueprintOk
      && allowModelWrite.allowed
      && !denyMissing.allowed && denyMissing.gate === 'model-first'
      && !denyImpure.allowed && denyImpure.reason.includes('pure')
      && !denyZeroPass.allowed && denyZeroPass.reason.includes('0 PASS')
      && !denyUnread.allowed && denyUnread.gate === 'read-before-write'
      && allowAfterBoot.allowed && allowAfterBoot.pass === 1);
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
}
{ // Figma MCP token audit & self-contained Code Layer bundler (tools/figma-bridge.mjs)
  const os = await import('node:os');
  const { exportTokens, auditFigmaVariables, bundleFigureForFigma, buildAtelierSvgSheet } = await import('../tools/figma-bridge.mjs');
  const tok = exportTokens();
  const svgSheet = buildAtelierSvgSheet();
  const auditOk = auditFigmaVariables(tok);
  const auditFlatOk = auditFigmaVariables({ 'paper-ink/sheet': '#fbfbfa', 'paper-ink/page': '#f2f2ef', 'paper-ink/text': '#57575a', 'paper-ink/ochre': '#8c6208' });
  const auditFlatBad = auditFigmaVariables({ 'paper-ink/sheet': '#ffffff', 'paper-ink/text': '#b5b5b5' });
  const auditEmpty = auditFigmaVariables({});
  const tmpBundle = fs.mkdtempSync(path.join(os.tmpdir(), 'atlas-figma-bundle-'));
  const tmpBook = fs.mkdtempSync(path.join(os.tmpdir(), 'atlas-figma-book-'));
  const tmpHeadless = fs.mkdtempSync(path.join(os.tmpdir(), 'atlas-figma-headless-'));
  try {
    const bRes = bundleFigureForFigma('physics/dc-motor', tmpBundle);
    const bundledHtml = fs.readFileSync(path.join(tmpBundle, 'index.html'), 'utf8');
    const hasEngine = fs.existsSync(path.join(tmpBundle, 'engine', 'explorer.js'));
    const noChecks = !fs.existsSync(path.join(tmpBundle, 'checks.mjs'));
    const noParentEscape = !bundledHtml.includes('../engine/') && bundledHtml.includes('./engine/');

    bundleFigureForFigma('physics/newton', tmpBook);
    const bookChapJs = fs.readFileSync(path.join(tmpBook, 'chapter.js'), 'utf8');
    const bookSubjJs = fs.readFileSync(path.join(tmpBook, 'subject.js'), 'utf8');
    const bookNoEscape = !bookChapJs.includes('../subject.js') && bookChapJs.includes('./subject.js') && !bookSubjJs.includes('../xrefs.js') && !bookSubjJs.includes('../equations/');

    bundleFigureForFigma('biology/ch02-cell-architecture', tmpHeadless);
    const headlessOk = fs.existsSync(path.join(tmpHeadless, 'index.html')) && fs.existsSync(path.join(tmpHeadless, 'main.js'));

    C.check('tools/figma-bridge.mjs: all 8 Figma Variable modes & flat get_variable_defs maps pass WCAG AA, empty/low-contrast maps fail, and Code Layer bundles standalone, book & headless chapters cleanly',
      Object.keys(tok.modes).length === 8 && tok.typography.serif === 'EB Garamond'
      && auditOk.ok && auditOk.checked >= 80 && auditFlatOk.ok && !auditFlatBad.ok && !auditEmpty.ok
      && bRes.files.includes('index.html') && hasEngine && noChecks && noParentEscape
      && bookNoEscape && headlessOk && svgSheet.includes('Ciechanowski-Involute-Gear') && svgSheet.includes('Byrne-Visual-Proof-Tokens'),
      auditOk.findings.map(f => `${f.role} (${f.ratio}:1 < ${f.min}:1)`).join('; '));
  } finally {
    fs.rmSync(tmpBundle, { recursive: true, force: true });
    fs.rmSync(tmpBook, { recursive: true, force: true });
    fs.rmSync(tmpHeadless, { recursive: true, force: true });
  }
}
{
  const { renderComicStripHTML, renderComicPanelSVG, renderByrneInlineHTML } = await import('./comic.js');
  const { buildComicBookendsSvgSheet } = await import('../tools/figma-bridge.mjs');
  const byrneHTML = renderByrneInlineHTML('Set {given:5 kg} on teak: {moves:49 N} balances so speed stays {stays:0 m/s}.');
  const openerHTML = renderComicStripHTML({
    id: 'ch2-opener',
    role: 'chapterOpener',
    title: 'The Silent Scale Inside Solid Teak',
    panels: [
      {
        id: 'p1',
        panelNumber: 1,
        span: 'wide',
        captionRich: 'Set a {given:5 kg} brass kettle on teak: Earth pulls with {moves:49 N}.',
        calloutLabel: '49 N downward',
        scenePreset: 'anomalySetup',
        balloon: {
          speaker: 'Observation',
          textRich: 'Speed stays {stays:0 m/s} without any switch.',
          tailDirection: 'bottomLeft',
          sourceBasis: 'documentedFact',
        },
      },
      {
        id: 'p2',
        panelNumber: 2,
        span: 'half',
        captionRich: 'Pour in {given:1 kg} of water: upward push climbs to {moves:58.8 N}.',
        scenePreset: 'intuitionBreak',
      },
    ],
  }, { nextLabel: 'Turn to Ch 3' });
  const comicSheet = buildComicBookendsSvgSheet();
  const comicCss = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'comic.css'), 'utf8');
  C.check('engine/comic.js & comic-bookends-sheet: renders Ligne-Claire Byrne inline tags, upright captions (zero skew(-15deg)), container queries, source-basis badges, and editable Figma SVG sheet',
    byrneHTML.includes('atlas-comic-byrne-given')
    && byrneHTML.includes('atlas-comic-byrne-moves')
    && byrneHTML.includes('atlas-comic-byrne-stays')
    && openerHTML.includes('data-role="chapterOpener"')
    && openerHTML.includes('Documented fact')
    && openerHTML.includes('49 N downward')
    && openerHTML.includes('Turn to Ch 3 →')
    && comicCss.includes('@container (min-width: 430px)')
    && !comicCss.includes('skew(-15deg)')
    && comicSheet.includes('Book-Introduction-Prologue-4Panel')
    && comicSheet.includes('Chapter-Opener-Diptych-2Panel')
    && comicSheet.includes('Chapter-Closer-Strip-3Panel')
    && !comicSheet.includes('skew(-15deg)'));
}
{
  const L1 = 2, L2 = 1.5;
  const smoothArm = u => {
    const ang = 2 * Math.PI * u;
    const tgt = [2.2 + 0.4 * Math.cos(ang), 0.5 + 0.4 * Math.sin(ang)];
    const ik = twoLinkIK([0, 0], tgt, L1, L2, 1);
    return { base: [0, 0], elbow: ik.elbowPt, hand: ik.endPt };
  };
  const cleanRes = checkTrajectory(smoothArm, {
    t0: 0, t1: 1, steps: 60, maxJump: 0.15, loop: true, loopTol: 1e-6,
    links: [['base', 'elbow', L1], ['elbow', 'hand', L2]],
    chains: [['base', 'elbow', 'hand', L1 + L2, 1]],
  });
  const faultyRes = checkTrajectory(u => {
    if (u > 0.48 && u < 0.52) return { base: [0, 0], elbow: [1, 1.5], hand: [5, 0] };
    const s = smoothArm(u * 0.7);
    return s;
  }, {
    t0: 0, t1: 1, steps: 60, maxJump: 0.15, loop: true, loopTol: 1e-3,
    links: [['base', 'elbow', L1], ['elbow', 'hand', L2]],
    chains: [['base', 'elbow', 'hand', L1 + L2, 1]],
  });
  const kinds = new Set(faultyRes.findings.map(f => f.kind));
  C.check('checks.js checkTrajectory: passes smooth cyclic 2-link IK and flags jump, link-stretch, reach-short, bent-back-elbow, and loop-pop',
    cleanRes.ok && cleanRes.findings.length === 0
    && !faultyRes.ok
    && kinds.has('jump') && kinds.has('link-stretch') && kinds.has('reach-short') && kinds.has('bent-back-elbow') && kinds.has('loop-pop'),
    [...kinds].join(', '));
}
{ // UI motion curves, Apple progressive rubber-banding & exponential momentum projection (engine/motion.js)
  const rb0 = rubberband(0, 100);
  const rbPos = rubberband(25, 100, 0.55);
  const rbNeg = rubberband(-25, 100, 0.55);
  const rbHuge = rubberband(1e6, 100, 0.55);
  const pm0 = projectMomentum(0);
  const pmNorm = projectMomentum(1000, 0.998);
  const pmSnap = projectMomentum(1000, 0.99);
  C.check('engine/motion.js: eases.uiOut/uiInOut/drawer (31 easings), odd-symmetric bounded rubberband(), and exponential projectMomentum()',
    Object.keys(eases).length === 31
    && eases.uiOut(0) === 0 && eases.uiOut(1) === 1 && eases.uiOut(0.2) > 0.45
    && eases.uiInOut(0) === 0 && eases.uiInOut(1) === 1 && eases.uiInOut(0.2) < 0.15 && eases.uiInOut(0.8) > 0.9
    && eases.drawer(0) === 0 && eases.drawer(1) === 1 && eases.drawer(0.2) > 0.4
    && rb0 === 0 && near(rbPos, -rbNeg, 1e-12) && rbPos > 0 && rbPos < 25 && rbHuge > 99 && rbHuge < 100
    && pm0 === 0 && near(pmNorm, 499, 1e-9) && near(pmSnap, 99, 1e-9) && pmSnap < pmNorm);
}
{ // Diegetic 2D-on-3D canvasPlate & ink-outlined procedural billboard (engine/prims.js)
  const root = new THREE.Group();
  const draws = [];
  const cp = canvasPlate(root, (ctx, { w, h, state, t }) => {
    draws.push({ w, h, v: state?.v ?? 0, t, hasFill: typeof ctx.fillRect === 'function' });
    ctx.fillRect(0, 0, w, h);
  }, { width: 1.4, height: 0.9, pxWidth: 128, pxHeight: 64, bezel: 0.05, pos: [1, 2, -0.5] });
  const v0 = cp.texture.version;
  cp.update({ v: 42 }, 1.25);
  const cpAudit = auditDeliverable(cp.object, { maxTris: 2000, requireUV: true });

  const flame = billboard(root, { kind: 'flame', width: 0.8, height: 1.2, color: 'red', pos: [0, 0.6, 0] });
  const ring = billboard(root, { kind: 'ring', width: 1.5, height: 1.5, color: 'blue', faceCamera: false });
  flame.update(2.75, { amp: 0.65 });
  const phaseSync1 = flame.mesh.material.uniforms.uPhase.value === 2.75
    && flame.mesh.userData.normalMat.uniforms.uPhase.value === 2.75
    && flame.mesh.material.uniforms.uAmp.value === 0.65
    && flame.mesh.userData.normalMat.uniforms.uAmp.value === 0.65;
  flame.update(0.4, { amp: 1.0 }); // order-independent backward seek check
  const phaseSync2 = flame.mesh.material.uniforms.uPhase.value === 0.4
    && flame.mesh.userData.normalMat.uniforms.uPhase.value === 0.4
    && normalPassTone(flame.mesh) !== null && normalPassTone(ring.mesh) !== null;

  C.check('prims.js canvasPlate & billboard: UV-clean diegetic CanvasTexture screen redraws statelessly and procedural flame/ring billboards sync normal-pass ink cutouts',
    cpAudit.pass && draws.length === 2 && draws[1].w === 128 && draws[1].h === 64 && draws[1].v === 42 && draws[1].t === 1.25 && draws[1].hasFill
    && cp.texture.version > v0 && near(cp.object.position.x, 1, 1e-9)
    && phaseSync1 && phaseSync2);
}
{ // Parameterized codeBlock, discrete paramChip, epistemic/diff badge & paper-wash term isolation (engine/prose.js)
  const { paramChip, codeBlock, badge, term, scrub } = await import('./prose.js');
  const chipHtml = paramChip('ohms', {
    value: 220,
    choices: [
      { value: 220, label: '220 Ω' },
      { value: 1000, label: '1 kΩ' },
      { value: 10000, label: '10 kΩ' },
    ],
    part: 'resistor',
    color: 'ochre',
    label: 'Series resistor',
  });
  const blockHtml = codeBlock([
    `const R = ${chipHtml};`,
    { html: `delay(${scrub('ms', { value: 500, min: 100, max: 1000, step: 50, unit: ' ms', part: 'led' })});`, part: 'led' },
  ], { title: 'loop()', lineVar: 'activeLine', startLine: 10 });
  const bEg = badge('eg');
  const bUnobs = badge('unobserved');
  const bVant = badge('vantage', 'Seen at laptop NIC');
  const bDiff = badge('added', 'Read replica');
  const washTerm = term('stator', 'Stator housing', { isolate: 'wash', color: 'blue' });

  C.check('prose.js paramChip, codeBlock, badge & isolate:"wash": emit accessible parameter pills, numbered execution-trace lines, epistemic/diff badges, and WCAG-safe inks',
    chipHtml.includes('class="tk-param"') && chipHtml.includes('data-param="ohms"') && chipHtml.includes('data-part="resistor"') && chipHtml.includes('220 Ω')
    && blockHtml.includes('class="tk-code"') && blockHtml.includes('data-line-var="activeLine"') && blockHtml.includes('data-line="10"') && blockHtml.includes('data-line="11"')
    && bEg.includes('E.G.') && bUnobs.includes('··') && bVant.includes('Seen at laptop NIC') && bDiff.includes('+ Read replica')
    && washTerm.includes('data-isolate="wash"')
    && wcagContrast('#825b00', '#ece5d5') >= 4.5 && wcagContrast('#236b43', '#ece5d5') >= 4.5 && wcagContrast('#b8343a', '#ece5d5') >= 4.5);
}
{ // Stepped 2D SVG viewBox cinematography, constant-speed arc-length pathBeads & Lookalike foilCard (chart.js, prose.js)
  const { foilCard } = await import('./prose.js');
  const vb0 = interpViewBox([0, 0, 800, 400], [150, 75, 200, 100], 0);
  const vbMid = interpViewBox([0, 0, 800, 400], [150, 75, 200, 100], 0.5);
  const vb1 = interpViewBox([0, 0, 800, 400], [150, 75, 200, 100], 1);

  // L-shaped path: length 30 along +X then length 10 along +Y (total 40). u = 0.5 -> d = 20 -> (20, 0, 0°); u = 0.875 -> d = 35 -> (30, 5, 90°)
  const lPath = [[0, 0], [30, 0], [30, 10]];
  const pHalf = samplePolyline(lPath, 0.5);
  const pTurn = samplePolyline(lPath, 0.875);
  const slotsSvg = beadSlots('pkt', 4, 3);

  const svgAttrs = {};
  const circles = Array.from({ length: 4 }, () => ({ attrs: {}, setAttribute(k, v) { this.attrs[k] = v; } }));
  const fakeSheet = {
    querySelectorAll(sel) {
      if (sel.includes('data-stage="net"')) return [{ setAttribute(k, v) { svgAttrs[k] = v; } }];
      if (sel.includes('data-beads="pkt"')) return [{ querySelectorAll: () => circles }];
      return [];
    },
  };
  focusViewBox(fakeSheet, 'net', [0, 0, 800, 400], [150, 75, 200, 100], 0.5);
  pathBeads(fakeSheet, 'pkt', lPath, 0.25);

  const fPage = foilCard({ label: 'Meiosis I', page: 3, note: 'homologous pairs separate, not sister chromatids.' });
  const fCross = foilCard({ label: 'Blueberry', to: 'biology/ch05-photosynthesis-leaf/2', note: 'clustered crown vs solitary nightshade berry.' }, { currentDir: 'biology/ch04-biomolecules-enzymes' });

  C.check('chart.js & prose.js: geometric-zoom interpViewBox/focusViewBox, constant-speed arc-length samplePolyline/pathBeads, and 1-tap foilCard work cleanly',
    vb0 === '0.0 0.0 800.0 400.0' && vbMid === '125.0 62.5 400.0 200.0' && vb1 === '150.0 75.0 200.0 100.0'
    && svgAttrs.viewBox === '125.0 62.5 400.0 200.0'
    && near(pHalf[0], 20, 1e-9) && near(pHalf[1], 0, 1e-9) && near(pHalf[2], 0, 1e-9)
    && near(pTurn[0], 30, 1e-9) && near(pTurn[1], 5, 1e-9) && near(pTurn[2], 90, 1e-9)
    && slotsSvg.includes('data-beads="pkt"') && circles[0].attrs.cx === '10.0' && circles[1].attrs.cx === '20.0'
    && fPage.includes('Don’t confuse with') && fPage.includes('data-turn="3"')
    && fCross.includes('../../biology/ch05-photosynthesis-leaf/#2'));
}
{ // Full Exemplar Toolkit: diffList & frameInspector (prose.js), sequenceLanes (chart.js), and 3D MCU/breadboard/rope kit (phys_kit.js)
  const { diffList, frameInspector } = await import('./prose.js');
  const { sequenceLanes } = await import('./chart.js');
  const pk = await import('./phys_kit.js');

  const dHtml = diffList([
    { kind: 'added', label: 'Read cache tier', detail: 'absorbs 85% of hot key lookups', part: 'cache' },
    { kind: 'changed', label: 'Primary DB load', detail: 'drops from 1,200 to 180 qps', part: 'db' },
  ], { title: 'What changed in Step 3' });

  const fHtml = frameInspector({
    vantage: 'Seen at client Wi-Fi interface',
    layers: [
      {
        label: 'IPv4',
        bytes: 20,
        color: 'blue',
        part: 'ip',
        fields: [
          { name: 'TTL', range: [8, 9], value: '64', tag: 'documented', hex: '40' },
          { name: 'Source IP', range: [12, 16], value: '192.168.1.42', tag: 'eg', hex: 'c0 a8 01 2a' },
        ],
      },
      {
        label: 'TLS Payload',
        bytes: 44,
        color: 'ochre',
        part: 'tls',
        fields: [
          { name: 'Ciphertext', range: [20, 64], value: '44 encrypted bytes', tag: 'unobserved', hex: '··' },
        ],
      },
    ],
  });

  const seq = sequenceLanes({
    actors: [
      { id: 'mcu', label: 'ESP32 Node' },
      { id: 'sonar', label: 'HC-SR04' },
      { id: 'oled', label: 'OLED Display' },
    ],
    messages: [
      { from: 'mcu', to: 'sonar', y0: 46, y1: 68, label: 'TRIG 10 μs', key: 'trig', beads: 3 },
      { from: 'sonar', to: 'mcu', y0: 78, y1: 112, label: 'ECHO pulse', key: 'echo', beads: 4 },
      { from: 'mcu', to: 'oled', y0: 124, y1: 144, label: 'I2C frame', key: 'i2c', beads: 3 },
    ],
    stage: 'seq-bench',
  });

  const root = new THREE.Group();
  const bb = pk.breadboard(root, { cols: 12, rows: 5, pos: [0, 0, 0] });
  const h0 = bb.holePos(0, 0), h5 = bb.holePos(5, 2);
  const mcu = pk.mcuBoard(root, { kind: 'uno', pos: [-1.5, 0, 0] });
  mcu.setStatus({ tx: 1, rx: 0, led: 1 });
  const wire = pk.jumperWire(root, { from: mcu.pinPos(2), to: h0, lift: 0.3, pal: 'red' });
  const led = pk.ledComponent(root, { pos: [0.4, 0.1, 0], pal: 'green' });
  led.setBrightness(0.85);
  const res220 = pk.resistorComponent(root, { pos: [0.1, 0.1, 0], ohms: 220 });
  const servo = pk.servoComponent(root, { pos: [1.1, 0.1, 0], angle: 0 });
  servo.setAngle(Math.PI / 3);
  const sonar = pk.ultrasonicComponent(root, { pos: [0, 0.25, -0.6] });
  const rope = pk.braidedRope(root, { points: [[-1, 0, 0], [0, 0.4, 0], [1, 0, 0]], segments: 32 });
  rope.morph([[-1, 0, 0], [0, 0.2, 0], [1, 0, 0]], [[-1, 0, 0], [0, 0.8, 0.4], [1, 0, 0]], 0.5);

  C.check('prose.js diffList & frameInspector, chart.js sequenceLanes, and phys_kit.js 3D MCU/breadboard/rope kit work cleanly',
    dHtml.includes('class="tk-diffs"') && dHtml.includes('+ Read cache tier') && dHtml.includes('data-part="cache"')
    && fHtml.includes('class="tk-frame-ins"') && fHtml.includes('flex:20') && fHtml.includes('flex:44') && fHtml.includes('[12..16]') && fHtml.includes('E.G.') && fHtml.includes('··')
    && seq.svg.includes('data-stage="seq-bench"') && seq.svg.includes('data-beads="echo"') && seq.paths.echo.length === 2
    && h5.distanceTo(h0) > 0.2 && mcu.pinPos(2).isVector3 && wire.curvePoints(8).length === 8
    && led.dome.userData.tone === TONE.lit && res220.bands.length === 4 && res220.bands[0] === 'red' && res220.bands[1] === 'red' && res220.bands[2] === 'brown'
    && near(servo.horn.rotation.y, Math.PI / 3, 1e-6) && sonar.emitOrigin.isVector3 && rope.mesh.geometry.attributes.position.count > 50);
}
{ // Phase 1: Perceptual Single-Swatch Accent Cascade (theme.js) & Live 3D Recoloring (parts.js)
  const { ACCENT_SWATCHES, deriveAccentTokens, applyAccentTokens, wcagContrast } = await import('./theme.js');
  const { shadeMat, setLiveAccent } = await import('./parts.js');

  const surfaces = [
    { page: '#f2efe7', card: '#fffdf6', ink: '#231e16' },
    { page: '#f4efe2', card: '#fdfbf7', ink: '#1b1917' },
    { page: '#25221e', card: '#2f2b26', ink: '#f6f1e4' },
  ];
  const hexes = [...Object.values(ACCENT_SWATCHES), '#fde047'];
  let allContrastOk = hexes.length >= 7;
  for (const s of surfaces) {
    for (const h of hexes) {
      const t = deriveAccentTokens(h, s);
      if (!t.accent || !t.accentMid || !t.accentDeep || !t.accentSoft || !t.accentInk || !t.accentOn) allContrastOk = false;
      if (wcagContrast(t.accentInk, s.page) < 4.5) allContrastOk = false;
      if (wcagContrast(t.accentInk, s.card) < 4.5) allContrastOk = false;
      if (wcagContrast(t.accentInk, t.accentSoft) < 4.5) allContrastOk = false;
      if (wcagContrast(t.accentOn, t.accent) < 4.5) allContrastOk = false;
    }
  }
  const amber = deriveAccentTokens(ACCENT_SWATCHES.amber);
  const fakeEl = { style: { props: {}, setProperty(k, v) { this.props[k] = v; } } };
  applyAccentTokens(fakeEl, amber);

  const mRed = shadeMat('red');
  const mAcc = shadeMat('accent');
  const oldHex = mRed.uniforms.uLight.value.getHexString();
  setLiveAccent('#3aa57a');
  const newHex = mRed.uniforms.uLight.value.getHexString();
  const accHex = mAcc.uniforms.uLight.value.getHexString();
  setLiveAccent('#e5484d'); // restore default red

  C.check('theme.js deriveAccentTokens & parts.js setLiveAccent: WCAG >= 4.5:1 across all swatches/surfaces (including amber #f4b829) and 0ms live 3D uniform updates',
    allContrastOk
    && amber.accent === '#f4b829'
    && amber.accentOn === '#231e16'
    && fakeEl.style.props['--accent'] === '#f4b829'
    && fakeEl.style.props['--accent-ink'] === amber.accentInk
    && oldHex !== newHex && newHex === accHex);
}
{ // Phase 2: Pure 2.5D Isometric Hand-Inked Vector Kit (iso_kit.js) & Model-First Import Guard
  const iso = await import('./iso_kit.js');

  const [px, py] = iso.isoPt(10, 10, 0, [80, 56], 1);
  const [px2, py2] = iso.isoPt(10, 0, 5, [80, 56], 1);
  const tfTop = iso.isoTextTransform('flatTop', 0, 0, 0, { origin: [80, 56] });
  const fBland = iso.inkFilterDefs('test0', { vbW: 160, quirk: 'bland' });
  const fSmall = iso.inkFilterDefs('test1', { vbW: 80, quirk: 'slightly-quirky' });
  const fLarge = iso.inkFilterDefs('test2', { vbW: 320, quirk: 'slightly-quirky' });

  const primitives = [
    iso.isoPlinth(),
    iso.isoClipShadow('sh1', [[-20, -20, 0], [20, -20, 0], [20, 20, 0], [-20, 20, 0]], [{ x: 0, y: 0, rx: 10, ry: 6 }]).svg,
    iso.isoBox({ x: -10, y: -10, z: 0, dx: 20, dy: 20, dz: 14, tone: 'accent' }),
    iso.isoPrism({ z: 0, dz: 10, tone: 'wood' }),
    iso.isoCyl({ x: 0, y: 0, z: 0, r: 10, h: 16, tone: 'glass', specular: true }),
    iso.isoDiscSlot({ x: 0, y: 0, z: 0, active: false, dashed: true, label: '1' }),
    iso.isoCup({ active: true, latteHeart: true }),
    iso.isoCoinStack({ count: 5 }),
    iso.isoJar({ lidLift: 0.8, active: true, label: 'Hot' }),
    iso.isoCarton({ tilt: -12, active: true, label: 'OAT' }),
    iso.isoPawnTable({ count: 3 }),
    iso.isoPunchCard({ stamped: 7, total: 10, press: 0.5 }),
    iso.isoTicket({ tornOffset: 1 }),
    iso.isoKettle({ progress: 0.7, ready: true }),
    iso.isoOven({ progress: 0.8 }),
    iso.isoEspressoMachine({ stage: 1 }),
    iso.isoToaster({ pop: 1 }),
    iso.isoSignRow({ activeIndex: 1 }),
    iso.isoNoticeBoard({ typing: true }),
    iso.isoWallet({ coinDrop: 0.5 }),
    iso.isoWaveformCup({ activeBar: 5 }),
    iso.isoTray({ slots: [true, false, true] }),
    iso.isoNotepad({ text: 'flat white', progress: 1 }),
    iso.isoFlipCalendar({ activeIndex: 2 }),
    iso.isoPourOver({ step: 1 }),
  ];

  const wrapped = iso.isoSvg({
    id: 'demo-fig',
    vb: [0, 0, 168, 112],
    quirk: 'slightly-quirky',
    staticBody: primitives.slice(0, 6).join(''),
    dynamicBody: primitives[7],
    label: 'Demo isometric composite',
  });

  C.check('iso_kit.js: 30-degree isometric projection, viewBox-calibrated inkFilterDefs, static/dynamic SVG split, and all 25 2.5D primitives render cleanly',
    px === 80 && py === 66 && px2 > 88 && py2 === 56
    && tfTop.startsWith('matrix(1.2247 0 0 0.9815')
    && fBland === ''
    && fSmall.includes('feTurbulence') && fSmall.includes('feDisplacementMap') && fLarge.includes('feBlend')
    && wrapped.includes('filter="url(#demo-fig-hand)"')
    && wrapped.includes('class="iso-dyn" data-anim="demo-fig"')
    && primitives.every(s => typeof s === 'string' && s.startsWith('<g') && s.endsWith('</g>')));
}
{ // Settled Flow, Tokenized Motion Governor & Shared Anchor Handoff (engine/motion.js, stage.js, index.js)
  const { settledFlowPhase, createMotionGovernor, sharedAnchorDelta } = await import('./index.js');
  const sfNeg = settledFlowPhase?.(-1, 4);
  const sfMid = settledFlowPhase?.(2, 4, { cycles: 1, settleAt: 1 });
  const sfDone = settledFlowPhase?.(4.5, 4, { cycles: 1, settleAt: 1 });
  const sfTwo = settledFlowPhase?.(6, 4, { cycles: 2, settleAt: 0.75 });
  const sfTwoDone = settledFlowPhase?.(9, 4, { cycles: 2, settleAt: 0.75 });

  const gov = createMotionGovernor?.();
  const lAmb = gov?.acquire('bg-flow', 'ambient');
  const lStep = gov?.acquire('chapter-beat', 'step');
  const staleRel = gov?.release(lAmb?.token);
  const lowPreempt = gov?.acquire('hover-wire', 'hover');
  const highPreempt = gov?.acquire('slider-drag', 'scrub');
  gov?.setStill(true);
  const afterStill = gov?.state();
  gov?.setStill(false);
  const afterResume = gov?.state();

  const delta1 = sharedAnchorDelta?.(['pump', 'valve', 'gauge'], ['valve', 'gauge', 'nozzle']);
  const deltaNone = sharedAnchorDelta?.(['pump'], ['turbine']);
  let dupThrew = false;
  try { if (sharedAnchorDelta) sharedAnchorDelta(['pump', 'pump'], ['valve']); } catch { dupThrew = true; }

  C.check('motion.js settledFlowPhase, createMotionGovernor & sharedAnchorDelta: finite settled phase, tokenized priority preemption, and stay/enter/leave continuity',
    sfNeg === 0 && near(sfMid ?? -1, 0.5, 1e-9) && sfDone === 1 && near(sfTwo ?? -1, 0.5, 1e-9) && sfTwoDone === 0.75
    && lAmb?.granted && lStep?.granted && lStep?.activeOwner === 'chapter-beat'
    && staleRel === false && lowPreempt?.granted === false && highPreempt?.granted === true
    && afterStill?.mode === 'still' && afterStill?.activeOwner === null
    && afterResume?.mode === 'live' && afterResume?.activeOwner === null
    && delta1?.status === 'anchored' && delta1?.anchor === 'valve'
    && JSON.stringify(delta1?.stay) === '["valve","gauge"]'
    && JSON.stringify(delta1?.enter) === '["nozzle"]'
    && JSON.stringify(delta1?.leave) === '["pump"]'
    && delta1?.summary === '=2 +1 −1'
    && deltaNone?.status === 'no-anchor' && deltaNone?.anchor === null
    && dupThrew);
}
{ // Phase 4: Diegetic Controls (8 kinds), Standard <-> Creative rendering, isoStackChart, and stateless Autoplay seek(t)
  const { computeBarDelta, isoStackChart } = await import('./chart.js');
  const { renderControl, createAutoplayDirector } = await import('./diegetic.js');

  const bars = [
    { label: 'Jul', value: 64.0, fmt: v => `$${v.toFixed(2)}` },
    { label: 'Aug', value: 72.5, fmt: v => `$${v.toFixed(2)}` },
    { label: 'Sep', value: 68.8, fmt: v => `$${v.toFixed(2)}` },
    { label: 'Oct', value: 90.1, fmt: v => `$${v.toFixed(2)}` },
    { label: 'Nov', value: 93.7, fmt: v => `$${v.toFixed(2)}` },
    { label: 'Dec', value: 86.2, fmt: v => `$${v.toFixed(2)}` },
  ];
  const dDec = computeBarDelta(bars, 5);
  const dOct = computeBarDelta(bars, 3);
  const chartSvg = isoStackChart({ bars, activeIndex: 5, id: 'spent-dec' });

  const specs = [
    { key: 'shots', label: 'Espresso shots', min: 1, max: 4, step: 1, ui: { kind: 'unit-stepper', unit: 'cup', maxSlots: 4 } },
    { key: 'size', label: 'Cup size', min: 1, max: 3, step: 1, ui: { kind: 'prop-picker', glyph: 'cup' } },
    { key: 'tip', label: 'Tip %', min: 0, max: 30, step: 3, ui: { kind: 'coin-slider', coins: 10 } },
    { key: 'rows', label: 'Rows of pegs', min: 4, max: 16, step: 1, ui: { kind: 'stack-slider', maxDiscs: 8 } },
    { key: 'tray', label: 'Checklist', ui: { kind: 'slot-tray', slots: [{ id: 'a', label: 'Flat white', addType: 'pos' }, { id: 'b', label: 'Bun' }] } },
    { key: 'togs', label: 'Switches', ui: { kind: 'object-toggles' } },
    { key: 'club', label: 'Coffee club', min: 0, max: 10, step: 1, ui: { kind: 'stamp-card', total: 10 } },
    { key: 'coupon', label: 'Coupon', ui: { kind: 'tear-stub', code: 'BUN20' } },
  ];
  const creativeHtml = specs.map(s => renderControl(s, 2, { mode: 'creative' }));
  const standardHtml = specs.slice(0, 4).map(s => renderControl(s, 2, { mode: 'standard' }));

  const dir = createAutoplayDirector({
    items: ['w1', 'w2', 'w3', 'w4'],
    intervalSec: 1.5,
    onTrigger: (it, idx, u) => `${it}:${idx}:${u.toFixed(2)}`,
  });
  const s1 = dir.seek(3.75);
  const s2 = dir.seek(11.1);
  const s3 = dir.seek(3.75);

  C.check('diegetic.js & chart.js: all 8 Creative control schemas preserve ARIA & input[data-key], computeBarDelta & isoStackChart verify deltas, and createAutoplayDirector.seek(t) is order-independent',
    dDec.deltaText === '−8% vs Nov' && dDec.valueText === '$86.20'
    && dOct.deltaText === '+31% vs Sep' && dOct.valueText === '$90.10'
    && chartSvg.includes('data-bar-idx="5"') && chartSvg.includes('−8% vs Nov · $86.20')
    && creativeHtml.every(h => h.includes('data-mode="creative"') && h.includes('<svg'))
    && creativeHtml[0].includes('role="radiogroup"') && creativeHtml[0].includes('data-key="shots"')
    && creativeHtml[2].includes('class="dg-range-overlay"') && creativeHtml[2].includes('data-key="tip"')
    && creativeHtml[4].includes('data-add="pos"')
    && creativeHtml[5].includes('role="switch"')
    && creativeHtml[6].includes('data-stamp-key="club"')
    && creativeHtml[7].includes('data-tear-key="coupon"')
    && standardHtml.every(h => h.includes('data-mode="standard"') && h.includes('type="range"'))
    && JSON.stringify(s1) === JSON.stringify(s3) && JSON.stringify(s1) !== JSON.stringify(s2));
}

// 17. DRAFT_STANDARD + draft_kit.js pure 2D drafting relationships & WCAG contrast on light/dark sheets
{
  const {
    DRAFT_STANDARD, draftArrow, draftDimension, draftHatch, draftSupportTicks,
    draftInverseClip, draftClearanceMask, draftSvg, draftCompactSvg, draftIsolationWrap,
  } = await import('./draft_kit.js');
  const { wcagContrast } = await import('./theme.js');

  const roleCount = Object.keys(DRAFT_STANDARD.roles).length;
  const labelAlpha = DRAFT_STANDARD.tokens['--atlas-opacity-label'];
  const noteAlpha = DRAFT_STANDARD.tokens['--atlas-opacity-note'];
  const lightOk = wcagContrast(`rgba(24,24,26,${labelAlpha})`, '#fbfbfa') >= 4.5
    && wcagContrast(`rgba(24,24,26,${noteAlpha})`, '#f2f2ef') >= 4.5;
  const darkOk = wcagContrast(`rgba(238,243,240,${labelAlpha})`, '#121917') >= 4.5
    && wcagContrast(`rgba(238,243,240,${noteAlpha})`, '#18211e') >= 4.5;

  const arr = draftArrow({ from: [10, 20], to: [110, 20], legLength: 6, angle: 45 });
  const tipFirst = arr.shaftD.startsWith('M110 20L10 20');
  const legMatches = arr.headD.includes('L110 20L');

  const dim = draftDimension({
    axis: 'x',
    witnesses: [[80, 100], [380, 140]],
    position: 60,
    label: { text: '300 mm', anchor: [230, 60], clearance: { x: 200, y: 50, width: 60, height: 20 } },
  });
  let consumedThrew = false;
  try {
    draftDimension({
      axis: 'x',
      witnesses: [[100, 100], [150, 100]],
      position: 60,
      label: { text: '50', anchor: [125, 60], clearance: { x: 90, y: 50, width: 70, height: 20 } },
    });
  } catch { consumedThrew = true; }

  const h1 = draftHatch({ region: { kind: 'rect', x: 50, y: 40, width: 100, height: 80 }, pattern: 'H1', phase: 0 });
  const h2 = draftHatch({ region: { kind: 'rect', x: 50, y: 40, width: 100, height: 80 }, pattern: 'H2', phase: 3 });
  const hatchInBounds = [...h1.segments, ...h2.segments].every(([a, b]) =>
    a[0] >= 50 - 1e-6 && a[0] <= 150 + 1e-6 && a[1] >= 40 - 1e-6 && a[1] <= 120 + 1e-6 &&
    b[0] >= 50 - 1e-6 && b[0] <= 150 + 1e-6 && b[1] >= 40 - 1e-6 && b[1] <= 120 + 1e-6);

  const ticksPlus = draftSupportTicks({ from: [40, 20], to: [40, 100], extent: 16, pitch: 16, side: 1 });
  const ticksMinus = draftSupportTicks({ from: [40, 20], to: [40, 100], extent: 16, pitch: 16, side: -1 });
  const inv = draftInverseClip('fg', 'M10 10H90V90H10Z', { vb: [0, 0, 560, 440] });
  const mask = draftClearanceMask('bg-clr', '<rect x="10" y="10" width="80" height="80" fill="black"/>', { vb: [0, 0, 560, 440] });

  let badModeThrew = false;
  try { draftSvg({ mode: 'made-up-mode', body: '' }); } catch { badModeThrew = true; }

  const full = draftSvg({
    id: 'test-plate',
    vb: [0, 0, 560, 440],
    title: 'Beam test',
    desc: 'Orthographic beam fixture',
    mode: 'geometric-construction',
    defs: inv.defs + mask.defs,
    body: `<g data-draft-role="grid" ${mask.maskAttr}><path d="M0 100H500"/></g>`
      + `<path data-draft-role="hidden" d="M20 80H220"/>`
      + `<path data-draft-role="hatch" d="${h1.d}"/>`
      + `<path data-draft-role="transfer" d="${arr.shaftD}"/>`
      + `<g data-draft-role="dimension"><path d="${dim.witnessD}"/><path d="${dim.lineD}"/></g>`
      + `<text data-draft-text="label" x="230" y="64" font-size="11">${dim.label.text}</text>`,
  });
  const compact = draftCompactSvg(full, { cropBox: [40, 30, 220, 140] });
  const isoHtml = draftIsolationWrap({ id: 'iso-box', title: 'Beam', caption: 'Cap', svg: full });

  C.check('draft_standard & draft_kit.js: frozen 13 roles, WCAG AA contrast on light/dark, tip-first arrows, split dimensions, clipped hatch, inverse clip/mask & compact crop',
    Object.isFrozen(DRAFT_STANDARD) && roleCount === 13 && lightOk && darkOk
    && tipFirst && legMatches && dim.lineD.includes(' M') && consumedThrew
    && h1.segments.length > 0 && h2.segments.length > 0 && hatchInBounds
    && ticksPlus.count === 6 && ticksMinus.count === 6 && ticksPlus.d !== ticksMinus.d
    && inv.defs.includes('clip-rule="evenodd"') && mask.defs.includes('mask-type:luminance')
    && badModeThrew && full.includes('role="img"') && full.includes('aria-labelledby="test-plate-title test-plate-desc"')
    && compact.includes('viewBox="24 14 252 172"') && compact.includes('--atlas-compact-dash:2 2')
    && compact.includes('vector-effect="non-scaling-stroke"') && !compact.includes('<text')
    && isoHtml.includes('data-draft-iso-btn') && isoHtml.includes('aria-pressed="false"'));
}

// 18. motion.js mechanical helpers (sCurveIndex, snapLogStop, eventKeyframes) & 31 eases invariant
{
  const { eases, sCurveIndex, snapLogStop, eventKeyframes } = await import('./motion.js');
  const easeCount = Object.keys(eases).length;

  const sc0 = sCurveIndex(1.0, { start: 1, travel: 2, accel: 0.4, brake: 0.4, distance: 10, origin: 5 });
  const scEnd = sCurveIndex(3.0, { start: 1, travel: 2, accel: 0.4, brake: 0.4, distance: 10, origin: 5 });
  const scUnder = sCurveIndex(0.2, { start: 1, travel: 2, accel: 0.4, brake: 0.4, distance: 10, origin: 5 });
  const scOver = sCurveIndex(5.0, { start: 1, travel: 2, accel: 0.4, brake: 0.4, distance: 10, origin: 5 });
  const samples = Array.from({ length: 41 }, (_, i) =>
    sCurveIndex(1 + (i / 40) * 2, { start: 1, travel: 2, accel: 0.4, brake: 0.4, distance: 10, origin: 5 }));
  let monoOk = true;
  for (let i = 1; i < samples.length; i++) if (samples[i] + 1e-12 < samples[i - 1]) monoOk = false;
  // C1 velocity continuity across ramp-to-cruise (t = 1.4) and cruise-to-brake (t = 2.6)
  const eps = 1e-4;
  const scCfg = { start: 1, travel: 2, accel: 0.4, brake: 0.4, distance: 10, origin: 5 };
  const vLeft = (sCurveIndex(1.4, scCfg) - sCurveIndex(1.4 - eps, scCfg)) / eps;
  const vRight = (sCurveIndex(1.4 + eps, scCfg) - sCurveIndex(1.4, scCfg)) / eps;
  const vZeroStart = (sCurveIndex(1 + eps, scCfg) - sc0) / eps;
  const scScaled = sCurveIndex(0.5, { start: 0, travel: 1, accel: 0.8, brake: 0.8, distance: 4, origin: 0 });

  const stops = [1.4, 2, 2.8, 4, 5.6, 8];
  const gmBoundary = Math.sqrt(2 * 2.8);
  const kfs = eventKeyframes(0, 1, { fps: 10, events: [0.333, 0.5, 0.333, -0.5, 2.0, 0.9999999999] });
  let strictAsc = true;
  for (let i = 1; i < kfs.length; i++) if (!(kfs[i] > kfs[i - 1])) strictAsc = false;

  C.check('motion.js: eases keeps 31 keys; sCurveIndex C1-continuous & pinned; snapLogStop geometric-mean nearest; eventKeyframes sorted/deduped',
    easeCount === 31 && sc0 === 5 && scUnder === 5 && scEnd === 15 && scOver === 15
    && monoOk && Math.abs(vLeft - vRight) < 1e-2 && Math.abs(vZeroStart) < 1e-4 && scScaled === 2
    && snapLogStop(2.8, stops) === 2.8 && snapLogStop(gmBoundary - 0.01, stops) === 2 && snapLogStop(gmBoundary + 0.01, stops) === 2.8
    && strictAsc && kfs[0] === 0 && kfs[kfs.length - 1] === 1 && kfs.some(v => Math.abs(v - 0.333) < 1e-9));
}

// 19. theme.js buildThemeCssSnippet, site.mjs RETIRED_ROUTES/resolveRoute & cli/svg-{xml,lint,export} hygiene
{
  const { buildThemeCssSnippet } = await import('./theme.js');
  const { draftSvg, draftHatch } = await import('./draft_kit.js');
  const { RETIRED_ROUTES, resolveRoute } = await import('../tools/site.mjs');
  const { lintSvg } = await import('../cli/svg-lint.mjs');
  const { exportSvg } = await import('../cli/export-svg.mjs');

  const css = buildThemeCssSnippet({ accent: '#f4b829', ink: '#18181a', surface: '#fbfbfa', page: '#f2f2ef' });
  const rr = resolveRoute('/physics/kinematics/');

  const { DRAFT_STANDARD } = await import('./draft_kit.js');
  const rubricPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'verification-rubric.md');
  const rubricTxt = fs.readFileSync(rubricPath, 'utf8');
  const rubricSynced = DRAFT_STANDARD.epistemicModes.every(m => rubricTxt.includes(`\`${m}\``));

  const h = draftHatch({ region: { kind: 'rect', x: 20, y: 20, width: 80, height: 60 }, pattern: 'H2' });
  const goodSvg = draftSvg({
    id: 'exp-check',
    vb: [0, 0, 200, 120],
    title: 'Export test',
    mode: 'functional-schematic',
    body: `<g id="grp"><path data-draft-role="hatch" d="${h.d}"/><path data-draft-role="primary" d="M20 80H180"/></g><text data-draft-text="label" x="100" y="100" font-size="11">Axis</text>`,
  });
  const goodLint = lintSvg(goodSvg, { strictDraft: true });
  const exported = exportSvg(goodSvg, { theme: 'dark', idPrefix: 'p1-' });

  let blockedScript = false;
  try { exportSvg('<svg viewBox="0 0 10 10"><script>alert(1)</script></svg>'); } catch { blockedScript = true; }
  let blockedUrl = false;
  try { exportSvg('<svg viewBox="0 0 10 10"><rect width="5" height="5" fill="url(https://evil.test/x)"/></svg>'); } catch { blockedUrl = true; }
  let blockedStyle = false;
  try { exportSvg('<svg viewBox="0 0 10 10"><style>path{stroke:red}</style></svg>'); } catch { blockedStyle = true; }

  C.check('theme.js buildThemeCssSnippet, site.mjs resolveRoute & cli/svg-{lint,export}: WCAG snippet, clean group export, rubric/JSON sync & strict security rejection',
    rubricSynced && css.includes('--atlas-ink: #18181a;') && css.includes('--accent-ink:') && css.includes('--atlas-opacity-label: 0.82;')
    && Object.isFrozen(RETIRED_ROUTES) && rr.retired === false && rr.target === 'physics/kinematics'
    && goodLint.ok && exported.svg.includes('stroke="#eef3f0"') && exported.svg.includes('id="p1-grp"')
    && !exported.svg.includes('<style data-atlas-draft-styles')
    && blockedScript && blockedUrl && blockedStyle);
}

// 20. moments.js declarative show/do/ask contract, outcome stamping & manipulative-symbol bridge
{
  const {
    defineLessonMoments,
    stampEvidence,
    computeOutcome,
    validateManipulativeSymbolBridge,
  } = await import('./moments.js');

  let antiQuizRejected = false;
  try {
    defineLessonMoments({
      describeScreen: () => 'Screen',
      ask: [{ id: 'q1', question: 'Q?', grade: () => true }],
    });
  } catch {
    antiQuizRejected = true;
  }

  const lesson = defineLessonMoments({
    initialState: { angle: 30, sunAboveHorizon: false, raysVisible: false },
    facts: s => ({ canSeeMoon: s.angle > 10, raysVisible: s.raysVisible }),
    describeScreen: s => `Space view shows Sun, Moon, Earth at angle ${s.angle}°`,
    describeObserver: s => (s.sunAboveHorizon ? 'Daytime sky for explorer' : 'Nighttime sky for explorer'),
    show: [
      { id: 'intro', speech: 'Look at the Moon and Sun.', continueAfterSpeech: true, apply: s => ({ ...s, raysVisible: true }) },
      { id: 'closeup', aside: true, speech: 'Close-up on reflection.', apply: s => ({ ...s, raysVisible: true }) },
    ],
    do: [{ id: 'orbit_earth', counts: true }],
    ask: [{
      id: 'moon_vis',
      question: 'Can the explorer see the Moon?',
      choices: ['Yes', 'No'],
      hide: ['raysVisible'],
      reveal: ['raysVisible'],
      grade: (v, f) => (v === 'Yes') === f.canSeeMoon,
    }],
  });

  const s0 = lesson.snapshot();
  const revBeforePassive = s0.revision;
  const passiveRes = lesson.emitGesture('camera_orbit');
  const chk1 = lesson.startCheck('moon_vis', { situation: 'fresh', supportsVisible: false });
  const destructiveRefused = lesson.showMoment('intro');
  const asideOk = lesson.showMoment('closeup');
  const resumed = lesson.resumeActivity();
  const staleRejected = lesson.answerCheck('moon_vis#999', { value: 'Yes', modality: 'voice', words: 'Yes' });
  const gradedVoice = lesson.answerCheck(chk1.sceneId, { value: 'Yes', modality: 'voice', words: 'Yes because it reflects' });

  const unbackedStamped = stampEvidence({ focus: 'f1', interpretation: 'understood', evidence: 'said yes' });
  const verbalOverHelped = stampEvidence(
    { focus: 'f1', interpretation: 'understood', evidence: 'own words' },
    { origin: 'dialogue', latestWork: gradedVoice.attempt ? { name: 'response_committed', sceneId: chk1.sceneId, assisted: true } : null, activeSceneId: chk1.sceneId },
  );
  const outcome = computeOutcome({
    lessonId: 'moon',
    skills: [
      { id: 's1', title: 'Moonlight', focuses: ['f1'] },
      { id: 's2', title: 'Horizon', focuses: ['f2'] },
    ],
    focuses: [{ id: 'f1', goals: ['g1'] }, { id: 'f2', goals: ['g2'] }],
    learning: [verbalOverHelped],
    notes: { s1: 'You said it reflects', s2: 'Should not appear when none' },
  });

  const bridgeBad = validateManipulativeSymbolBridge({ params: { x: 1 }, PAGES: [{}, {}] });
  const bridgeGood = validateManipulativeSymbolBridge({ params: { x: 1 }, PAGES: [{}, {}], readout: () => 'x=1' });

  C.check('moments.js: anti-quiz rejection, screen/observer split, passive gestures, aside-only during check, stale check rejection, evidence stamping & manipulative-symbol bridge',
    antiQuizRejected
    && s0.screenDescription !== s0.observerDescription
    && passiveRes.passive === true && passiveRes.snapshot.revision === revBeforePassive
    && !destructiveRefused.accepted && destructiveRefused.error === 'active_check_unanswered'
    && asideOk.accepted && resumed.accepted && resumed.snapshot.activeCheck.assisted === true
    && !staleRejected.accepted && staleRejected.error === 'stale_scene_id'
    && gradedVoice.accepted && gradedVoice.attempt.modality === 'voice' && gradedVoice.attempt.assisted === true
    && unbackedStamped.assisted === true && verbalOverHelped.assisted === true
    && outcome.skills[0].state === 'help' && outcome.skills[1].state === 'none'
    && outcome.skills[1].proof === 'We have not tried this one yet.'
    && !bridgeBad.ok && bridgeGood.ok);
}
C.report();
