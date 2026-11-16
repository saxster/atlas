import * as M from './model.js';
let bad = 0;
const check = (name, ok) => { if (ok) console.log(`PASS  ${name}`); else { bad++; console.log(`FAIL  ${name}`); } };
const lm = M.linearModel(1.5, 0.5);
check('Perpendicular slope product m1 * m2 = -1', Math.abs(lm.product + 1) < 1e-12);
const lp = M.lpVertices();
check('LP feasible corner (2, 3) maximizes 4x + 5y = 23', lp[2].profit === 23 && Math.max(...lp.map(v => v.profit)) === 23);
process.exit(bad ? 1 : 0);
