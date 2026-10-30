// node statistics/galton/checks.mjs — the board's theory exactly, and its seeded runs against the theory.
import { checks, near, mean, variance, chiSquare, chiSquareCritical, normalQuantile } from '../../engine/checks.js';
import * as M from './model.js';

const C = checks(), D = { rows: 12, p: 0.5, n: 500, seed: 1 };
for (const [rows, p] of [[12, 0.5], [12, 0.7], [5, 0.2], [16, 0.5]]) {
  const ps = Array.from({ length: rows + 1 }, (_, k) => M.pmf(rows, p, k));
  const mu = ps.reduce((a, q, k) => a + q * k, 0), v = ps.reduce((a, q, k) => a + q * (k - mu) ** 2, 0);
  C.check(`Binomial(${rows}, ${p}): probabilities add to 1, mean np, variance np(1−p)`, near(ps.reduce((a, b) => a + b), 1, 1e-12) && near(mu, M.theoryMean(rows, p), 1e-12) && near(v, M.theoryVar(rows, p), 1e-12));
}
C.check('12 rows, p = ½: the middle slot is C(12,6)/4096 = 22.56 %', near(M.pmf(12, 0.5, 6), 924 / 4096, 1e-15), `${(100 * M.pmf(12, 0.5, 6)).toFixed(2)} %`);
C.check('the most likely slot is ⌊(n+1)p⌋', [[12, 0.5, 6], [12, 0.7, 9], [10, 0.3, 3]].every(([r, p, k]) => M.mode(r, p) === k && M.pmf(r, p, k) >= Math.max(...Array.from({ length: r + 1 }, (_, j) => M.pmf(r, p, j))) - 1e-15));

// seeded runs: the same seed, the same pile; different seeds, different piles
const a = M.run(D), b = M.run(D), c = M.run({ ...D, seed: 2 });
C.check('same seed, same pile', a.counts.join() === b.counts.join() && a.slot.join() === b.slot.join());
C.check('different seed, different pile', a.counts.join() !== c.counts.join());
C.check('each ball\'s slot is its number of rights', a.paths.every((path, i) => path.reduce((x, y) => x + y, 0) === a.slot[i]));
// the pile against the binomial, for many seeds: chi-square below the 0.1 % critical value (merging slots expected < 5)
const fit = e => {
  const exp = M.expected(e.rows, e.p, e.n), o = [], x = [];
  let co = 0, cx = 0;
  for (let k = 0; k <= e.rows; k++) { co += e.counts[k]; cx += exp[k]; if (cx >= 5) { o.push(co); x.push(cx); co = cx = 0; } }
  if (cx) { o[o.length - 1] += co; x[x.length - 1] += cx; }
  return { chi: chiSquare(o, x), crit: chiSquareCritical(o.length - 1, 0.001) };
};
const seeds = Array.from({ length: 20 }, (_, i) => i + 1), fits = seeds.map(s => fit(M.run({ ...D, seed: s })));
C.check('20 seeds: every pile fits Binomial(12, ½) (chi-square under its 0.1 % critical value)', fits.every(f => f.chi < f.crit), `worst ${Math.max(...fits.map(f => f.chi)).toFixed(1)} vs ${fits[0].crit.toFixed(1)}`);
C.check('a lopsided board (p = 0.7) fits Binomial(12, 0.7)', [1, 2, 3].every(s => { const f = fit(M.run({ ...D, p: 0.7, seed: s })); return f.chi < f.crit; }));
C.check('…and does not fit p = ½ (the test can tell)', (() => { const e = M.run({ ...D, p: 0.7 }); const f = fit({ ...e, p: 0.5 }); return f.chi > f.crit; })());
{ const s = a.slot, sd = Math.sqrt(M.theoryVar(12, 0.5));
  C.check('sample mean within 4 standard errors of np = 6', Math.abs(mean(s) - 6) <= 4 * sd / Math.sqrt(s.length), mean(s).toFixed(3));
  C.check('sample variance near np(1−p) = 3', Math.abs(variance(s) - 3) < 0.6, variance(s).toFixed(3)); }
// the central limit theorem: with more rows, the standardised binomial approaches the normal curve
const ksDist = rows => { let cdf = 0, worst = 0; const mu = rows / 2, sd = Math.sqrt(rows / 4);
  for (let k = 0; k <= rows; k++) { cdf += M.pmf(rows, 0.5, k); const z = (k + 0.5 - mu) / sd; const ncdf = 0.5 * (1 + erf(z / Math.SQRT2)); worst = Math.max(worst, Math.abs(cdf - ncdf)); } return worst; };
function erf(x) { const t = 1 / (1 + 0.3275911 * Math.abs(x)), y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return Math.sign(x) * y; }
C.check('more rows, closer to the bell: the normal curve fits 16 rows better than 4', ksDist(16) < ksDist(4) && ksDist(16) < 0.01, `max CDF gap ${ksDist(4).toFixed(4)} → ${ksDist(16).toFixed(4)}`);
C.check('normal quantile sanity (the toolkit): z₀.₉₇₅ = 1.96', near(normalQuantile(0.975), 1.959964, 1e-6));
// the animation agrees with the counts
{ const e = M.run({ ...D, n: 120 }), T = M.duration(e), pile = M.pileAt(e, T + 0.01);
  C.check('after the run every ball has landed, and the pile is the counts', pile.landed === e.n && pile.counts.join() === e.counts.join());
  C.check('a landed ball rests in its own slot', [0, 17, 63, 119].every(i => { const b = M.ballAt(e, i, T + 1); return b.landed && Math.abs(b.x - M.slotX(e.rows, e.slot[i])) < M.DX / 2; }));
  C.check('a ball is continuous through its fall (no jumps between 1 ms steps)', [0, 50].every(i => { let prev = null, worst = 0;
    for (let t = M.releaseAt(e, i); t < M.releaseAt(e, i) + M.flight(e.rows); t += 0.001) { const q = M.ballAt(e, i, t); if (prev) worst = Math.max(worst, Math.hypot(q.x - prev.x, q.y - prev.y)); prev = q; }
    return worst < 0.03; }));
  C.check('no ball is drawn before its release', M.ballAt(e, 60, M.releaseAt(e, 60) - 0.01) === null); }
C.report();
