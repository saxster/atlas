// node economics/compound/checks.mjs — the saving model against a month-by-month simulation, and its stated numbers.
import { checks } from '../../engine/checks.js';
import * as M from './model.js';

const C = checks(), near = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
// the bank's rule, one month at a time: interest on what is in, then the deposit
let B = 0, Bs = 0, worst = 0, worstS = 0;
for (let m = 1; m <= M.MONTHS; m++) {
  Bs += M.P * M.r * (m - 1) + M.P;              // simple: every earlier deposit earns P·r this month, nothing compounds
  B = B * (1 + M.r) + M.P;
  worst = Math.max(worst, Math.abs(B - M.pot(m)) / B); worstS = Math.max(worstS, Math.abs(Bs - M.simplePot(m)) / Bs);
}
C.check('pot(m) = P((1+r)^m − 1)/r matches month-by-month for all 240 months', worst < 1e-12, `max relative error ${worst.toExponential(1)}`);
C.check('simple-interest pot matches month-by-month', worstS < 1e-12);
C.check('after 20 years: ₹2,40,000 paid in', M.deposited(240) === 240000);
C.check('after 20 years the pot is ₹5,89,020', M.rupees(M.pot(240)) === '₹5,89,020', M.pot(240).toFixed(2));
C.check('more than half the pot is interest', M.interest(240) > M.pot(240) / 2, `${(100 * M.interest(240) / M.pot(240)).toFixed(1)} %`);
C.check('without interest on interest: ₹4,31,200', M.rupees(M.simplePot(240)) === '₹4,31,200');
C.check('interest on interest adds ₹1,57,820', M.rupees(M.pot(240) - M.simplePot(240)) === '₹1,57,820');
C.check('starting 10 years later leaves less than a third of the pot', M.latePot(240) < M.pot(240) / 3, `${M.rupees(M.latePot(240))}, ${(M.latePot(240) / M.pot(240)).toFixed(3)} of it`);
C.check('the late starter pays in half as much', M.deposited(240 - M.LATE) === M.deposited(240) / 2);
C.check('8 % a year compounding monthly is 8.30 % effective', near(M.EFFECTIVE, 0.0829995, 1e-6), `${(100 * M.EFFECTIVE).toFixed(2)} %`);
C.check('a lump sum doubles in 8.69 years; the rule of 72 says 9', near(M.DOUBLE_MONTHS / 12, 8.693, 1e-3) && Math.abs(72 / 8 - M.DOUBLE_MONTHS / 12) < 0.4, `${(M.DOUBLE_MONTHS / 12).toFixed(2)} y`);
C.check('doubling: (1 + r)^months = 2', near((1 + M.r) ** M.DOUBLE_MONTHS, 2, 1e-12));
C.check('each year the pot grows by more than the year before', Array.from({ length: 19 }, (_, i) => M.pot(12 * (i + 2)) - M.pot(12 * (i + 1))).every((g, i, a) => i === 0 || g > a[i - 1]));
C.check('at(clock): the pot holds steady within a month, jumps at month ends', near(M.at(5.2).pot, M.pot(5)) && near(M.at(5.999).pot, M.pot(5)) && near(M.at(6).pot, M.pot(6)));
C.check('yearEnd(y) is the pot at month 12y', [1, 7, 20].every(y => near(M.yearEnd(y).pot, M.pot(12 * y))));
C.check('rupees in lakhs: 5,89,020 and 1,00,000 and 999', M.rupees(589020.41) === '₹5,89,020' && M.rupees(100000) === '₹1,00,000' && M.rupees(999) === '₹999' && M.rupees(12345678) === '₹1,23,45,678');
C.report();
