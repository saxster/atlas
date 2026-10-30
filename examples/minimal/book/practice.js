// Practice, two questions per page (keys are page indices). Every number comes from the model; checks.mjs
// recomputes each answer another way.
import * as M from './model.js';

const f = (x, n = 2) => (x < -5 * 10 ** -(n + 1) ? '−' : '') + Math.abs(x).toFixed(n);
const x0 = 3, x1 = 2, x2 = 0, x3 = -2, x4 = 3;

export const PRACTICE = {
  0: [
    { q: `What is <i>f</i>(${x0})?`, choices: [f(M.f(x0)), f(x0 ** 3 - x0), f(x0 ** 2 / 3), f(-M.f(x0))], answer: 0,
      why: `<p><i>f</i>(${x0}) = ${x0}³/3 − ${x0} = ${x0 ** 3 / 3} − ${x0} = ${f(M.f(x0))}.</p>` },
    { q: 'Where does the curve cross the <i>x</i> axis, other than at 0?',
      choices: ['<i>x</i> = ±1', '<i>x</i> = ±√3', '<i>x</i> = ±3', 'nowhere else'], answer: 1,
      why: `<p><i>x</i>³/3 − <i>x</i> = <i>x</i>(<i>x</i>² − 3)/3 = 0 when <i>x</i>² = 3: <i>x</i> = ±√3 = ±${f(Math.sqrt(3))}.</p>` },
  ],
  1: [
    { q: `What is the slope of the tangent at <i>x</i> = ${x1}?`, choices: [f(M.f(x1)), f(M.df(x1)), f(2 * x1), '0'], answer: 1,
      why: `<p><i>f</i>&#8202;′(${x1}) = ${x1}² − 1 = ${f(M.df(x1))}: one across, the tangent rises ${f(M.df(x1))}.</p>` },
    { q: `What is the tangent’s slope at <i>x</i> = ${x2}?`, choices: ['1', '0', '−1', 'undefined'], answer: 2,
      why: `<p><i>f</i>&#8202;′(0) = 0² − 1 = ${f(M.df(x2), 0)}: the curve falls through the origin, one down for each one across.</p>` },
  ],
  2: [
    { q: 'At which <i>x</i> values is the tangent level?', choices: ['0', '±1', '±√3', '±2'], answer: 1,
      why: `<p>Level means slope 0: <i>x</i>² − 1 = 0 at <i>x</i> = ±1, the top and bottom of the curve.</p>` },
    { q: `Is <i>f</i> rising or falling at <i>x</i> = ${x3}?`, choices: ['rising', 'falling', 'level'], answer: M.df(x3) > 0 ? 0 : 1,
      why: `<p><i>f</i>&#8202;′(${x3}) = ${f(M.df(x3))}, above 0, so the curve rises there.</p>` },
    { q: `The tangent at <i>x</i> = ${x4} is <i>y</i> = <i>mx</i> + <i>c</i>. What is <i>c</i>?`,
      choices: [f(M.tangent(x4)(0)), f(M.f(x4)), f(M.df(x4)), f(-M.tangent(x4)(0))], answer: 0,
      why: `<p><i>m</i> = <i>f</i>&#8202;′(${x4}) = ${f(M.df(x4))} and the line passes (${x4}, ${f(M.f(x4))}), so <i>c</i> = ${f(M.f(x4))} − ${f(M.df(x4))} × ${x4} = ${f(M.tangent(x4)(0))}.</p>` },
  ],
};
