import * as M from './model.js';
let bad = 0;
const check = (name, ok) => { if (ok) console.log(`PASS  ${name}`); else { bad++; console.log(`FAIL  ${name}`); } };
const ex = M.expandAreaTiles(4, 2, 3);
check('(4+2)(4+3) = 16 + 8 + 12 + 6 = 42', ex.x2 + ex.ax + ex.bx + ex.ab === ex.total && ex.total === 42);
const ds = M.diffOfSquares(5, 2);
check('5^2 - 2^2 = (5-2)(5+2) = 3 * 7 = 21', ds.lhs === 21 && ds.rhs === 21);
process.exit(bad ? 1 : 0);
