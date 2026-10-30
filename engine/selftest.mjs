// node engine/selftest.mjs — the shared checks toolkit and seeded RNG, against known values.
import { checks, near, deriv, integ, bisect, rk4, mean, variance, meanWithin, chiSquare, chiSquareCritical, normalQuantile, binomial } from './checks.js';
import { rng } from './rng.js';
import { scale, samples } from './chart.js';

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
C.report();
