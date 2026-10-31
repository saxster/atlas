// node engine/selftest.mjs — the shared checks toolkit and seeded RNG against known values, and the building blocks'
// geometry (prims.js, built in node: no browser).
import { checks, near, deriv, integ, bisect, rk4, mean, variance, meanWithin, chiSquare, chiSquareCritical, normalQuantile, binomial } from './checks.js';
import { rng } from './rng.js';
import { scale, samples } from './chart.js';
import * as THREE from 'three';
import { axes, plot, area, surface, field, streamline, lattice, blob, particles, molecule } from './prims.js';

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
C.report();
