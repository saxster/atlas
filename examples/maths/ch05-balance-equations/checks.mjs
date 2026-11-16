import * as M from './model.js';
let bad = 0;
const check = (name, ok) => { if (ok) console.log(`PASS  ${name}`); else { bad++; console.log(`FAIL  ${name}`); } };
const eq = M.solveLinearBalance(4, 3, 1, 15);
check('4x + 3 = x + 15 => 3x = 12 => x = 4 (both pans = 19)', eq.x === 4 && eq.sideVal === 19);
const iq = M.reflectInequality(2, 5);
check('2 < 5 reflects across 0 to -5 < -2 (-2 > -5)', iq.negLow === -5 && iq.negHigh === -2);
process.exit(bad ? 1 : 0);
