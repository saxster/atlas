// node engine/selftest.mjs — the shared checks toolkit and seeded RNG against known values, and the building blocks'
// geometry (prims.js, built in node: no browser).
import { checks, near, deriv, integ, bisect, rk4, mean, variance, meanWithin, chiSquare, chiSquareCritical, normalQuantile, binomial, checkLinkLengths } from './checks.js';
import { rng } from './rng.js';
import { scale, samples } from './chart.js';
import * as THREE from 'three';
import { axes, plot, area, surface, field, streamline, lattice, blob, particles, molecule, linkage } from './prims.js';
import { part, box, gearGeo, gear, rack, spring, TONE } from './parts.js';
import { createAssemblyController } from './render.js';
import { circleIntersect, sliderCrank, fourBar, gearRatio, rackPinion, differential, createSolver, twoLinkIK, fabrik, jacobianIK } from './kinematics.js';
import { draggable } from './stage.js';

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
  const isoOk = near(mHousing.material.uniforms.uOpacity.value, 0.14, 1e-6) && mHousing.userData.tone === TONE.faint
    && near(mCore.material.uniforms?.uOpacity?.value ?? 1, 1, 1e-6) && mCore.userData.tone === TONE.hi;
  ctrl.setIsolate(null);

  ctrl.setExplode(1);
  for (let i = 0; i < 60; i++) ctrl.stepExplode(1 / 60);
  const exOk = near(mHousing.position.y, 1, 1e-2) && near(mCore.position.x, 1, 1e-2);
  ctrl.setExplode(0, null, true);
  ctrl.stepExplode(1 / 60);
  const snapOk = mHousing.position.y === 0 && mCore.position.x === 0;
  C.check('setCutaway, setXray, setIsolate & setExplode: synchronize clipping planes, DoubleSide, translucent ghosting, isolation dimming, and spring explode',
    cutOk && cutClearOk && xrayOk && isoOk && exOk && snapOk);
}
C.report();
