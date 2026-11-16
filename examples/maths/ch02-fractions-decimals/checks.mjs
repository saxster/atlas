import * as M from './model.js';
let bad = 0;
const check = (name, ok) => { if (ok) console.log(`PASS  ${name}`); else { bad++; console.log(`FAIL  ${name}`); } };
const rec = M.recurringTwoDigit(36);
check('0.363636... simplifies from 36/99 to 4/11', rec.simpNum === 4 && rec.simpDen === 11 && Math.abs(rec.decimal - 4 / 11) < 1e-12);
const div = M.divideByFraction(3, 2, 4);
check('3 ÷ (2/4) = 3 * 4 / 2 = 6', div.totalPieces === 12 && div.quotient === 6);
process.exit(bad ? 1 : 0);
