// node examples/biology/diffusion/checks.mjs — Fick's law, Einstein's 2Dt random-walk spread, and seeded membrane runs.
import { checks, near, deriv, rk4, mean, variance, meanWithin, chiSquare, chiSquareCritical } from '@saxster/atlas/checks.js';
import * as M from './model.js';

const C = checks(), P = { n: 240, channels: 4, D: 1.0, seed: 1 };

// 1. Closed-form relaxation N_in(t) = ½n(1 − e^(−2kt)) against numerical ODE dN_in/dt = k(N_out − N_in) via rk4
{ const k = M.rate(P.channels, P.D);
  const ode = rk4((t, y) => k * ((P.n - y) - y), 0, 0, M.DURATION, 400);
  const endODE = ode.at(-1), endClosed = M.expectedIn(P.n, P.channels, P.D, M.DURATION);
  C.check('ODE dN_in/dt = k(N_out − N_in) matches ½n(1 − e^(−2kt)) via rk4', near(endODE, endClosed, 1e-8), `${endODE.toFixed(6)} vs ${endClosed.toFixed(6)}`); }

// 2. Derivative of expectedIn is Fick's net flux n·k·e^(−2kt)
C.check('d(expectedIn)/dt equals Fick’s net flux at t = 0.5, 2, 5 s',
  [0.5, 2, 5].every(t => near(deriv(u => M.expectedIn(P.n, P.channels, P.D, u), t), M.netFlux(P.n, P.channels, P.D, t), 1e-7)));

// 3. Conservation of molecules: expectedIn + expectedOut = n at every time, and at halfTime the gap has halved
{ const th = M.halfTime(P.channels, P.D);
  const gap = M.expectedOut(P.n, P.channels, P.D, th) - M.expectedIn(P.n, P.channels, P.D, th);
  C.check('at halfTime ln 2 / (2k), the concentration gap N_out − N_in is exactly ½n', near(gap, P.n / 2, 1e-12) && near(M.pIn(P.channels, P.D, th), 0.25, 1e-12)); }

// 4. Einstein 1D diffusion relation: ⟨Δx²⟩ = 2Dt and mean 0 in a seeded random walk
{ const xs = M.freeWalk({ n: 8000, D: 1.2, t: 3.5, steps: 70, seed: 7 }), msd = M.theoryMSD(1.2, 3.5);
  C.check('1D thermal random walk: mean displacement within 4 SE of 0', meanWithin(xs, 0, Math.sqrt(msd)));
  C.check('1D thermal random walk: ⟨Δx²⟩ matches 2Dt = 8.4', near(variance(xs), msd, 0.04), `${variance(xs).toFixed(3)} vs ${msd.toFixed(3)}`); }

// 5. Seeded chamber runs: determinism, binomial/chi-square fit to pIn(t), and dynamic equilibrium traffic
const a = M.run(P), b = M.run(P), c = M.run({ ...P, seed: 2 });
C.check('same seed gives identical trajectories', a.series.map(s => s.inside).join() === b.series.map(s => s.inside).join());
C.check('different seed gives a different run', a.series.map(s => s.inside).join() !== c.series.map(s => s.inside).join());

{ const pEnd = M.pIn(P.channels, P.D, M.DURATION), exp = [P.n * pEnd, P.n * (1 - pEnd)];
  const fits = Array.from({ length: 20 }, (_, i) => {
    const r = M.run({ ...P, seed: i + 1 }), ins = r.series.at(-1).inside;
    return chiSquare([ins, P.n - ins], exp);
  });
  const crit = chiSquareCritical(1, 0.001);
  C.check('20 seeded runs at t = 8 s fit Binomial(n, pIn(8)) under χ²(1) 0.1 % critical value',
    fits.every(x => x < crit), `worst ${Math.max(...fits).toFixed(2)} vs ${crit.toFixed(2)}`); }

// 6. Dynamic equilibrium: in the second half of a high-permeability run, molecules keep crossing both ways
{ const eq = M.run({ n: 240, channels: 8, D: 1.5, seed: 3 });
  const lateIn = eq.series.slice(16).reduce((s, r) => s + r.outToIn, 0);
  const lateOut = eq.series.slice(16).reduce((s, r) => s + r.inToOut, 0);
  C.check('at equilibrium molecules still cross both ways in nearly equal numbers',
    lateIn > 80 && lateOut > 80 && Math.abs(lateIn - lateOut) / (lateIn + lateOut) < 0.15, `in ${lateIn}, out ${lateOut}`); }

// 7. Continuous motion: moleculeAt has no sudden jumps between 1 ms frames
{ const worst = Math.max(...[0, 12, 45].map(i => {
    let prev = null, w = 0;
    for (let t = 0; t <= M.DURATION; t += 0.001) {
      const q = M.moleculeAt(a, i, t);
      if (prev) w = Math.max(w, Math.hypot(q.x - prev.x, q.y - prev.y, q.z - prev.z));
      prev = q;
    }
    return w;
  }));
  C.check('molecule trajectories are continuous across pore crossings (1 ms step < 0.03)', worst < 0.03, worst.toFixed(4)); }

C.report();
