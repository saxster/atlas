// node examples/minimal/machine/checks.mjs — the halving rule exactly, and the seeded run against it. Exit 1 on any failure.
import { checks, mean } from '@saxster/atlas/checks.js';
import * as M from './model.js';

const C = checks(), STEPS = [1, 2, 3, 5];
// halve N, k times, one half-life at a time
const halved = k => { let n = M.N; for (let i = 0; i < k; i++) n /= 2; return n; };
C.check('expected count is N/2ᵏ exactly: 100, 50, 25, 6.25', STEPS.every(k => M.expected(k) === halved(k)) && M.expected(5) === 6.25);
// the seeded run, within 4σ of N/2ᵏ at each step (σ² = N p (1 − p), p = 2^−k)
const run = M.lifetimes();
for (const k of STEPS) {
  const n = M.left(run, k), sd = Math.sqrt(M.N * 0.5 ** k * (1 - 0.5 ** k));
  C.check(`after ${k} half-li${k === 1 ? 'fe' : 'ves'}: ${n} left, within 4σ of ${M.expected(k)}`, Math.abs(n - M.expected(k)) <= 4 * sd, `σ ${sd.toFixed(2)}`);
}
C.check('the same seed gives the same run', M.lifetimes(M.SEED).every((l, i) => l === run[i]) && M.lifetimes(M.SEED + 1).some((l, i) => l !== run[i]));
C.check('the count never goes up', Array.from({ length: 500 }, (_, i) => M.left(run, i / 100)).every((n, i, a) => !i || n <= a[i - 1]));
C.check('at(clock) counts this run', STEPS.every(k => M.at(k).left === M.left(run, k)));
// over many seeds the survivors average N/2ᵏ: no half-life is special, the chance per half-life is always ½
for (const k of [1, 3]) {
  const counts = Array.from({ length: 400 }, (_, s) => M.left(M.lifetimes(s + 100), k)), se = Math.sqrt(M.N * 0.5 ** k * (1 - 0.5 ** k) / counts.length);
  C.check(`400 seeds: mean left after ${k} is N/2ᵏ within 4 standard errors`, Math.abs(mean(counts) - M.expected(k)) < 4 * se, mean(counts).toFixed(2));
}
{ const survivors = run.filter(l => l > 2), back = survivors.filter(l => l > 3).length / survivors.length;
  C.check('memoryless: of those alive at 2, about half last to 3', Math.abs(back - 0.5) < 4 * Math.sqrt(0.25 / survivors.length), back.toFixed(3)); }
C.report();
