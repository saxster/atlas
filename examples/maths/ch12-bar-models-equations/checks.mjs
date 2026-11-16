import * as M from './model.js';
let bad = 0;
const check = (name, ok) => { if (ok) console.log(`PASS  ${name}`); else { bad++; console.log(`FAIL  ${name}`); } };
const sb = M.singaporeBar(12, 12);
check('3x + 12 = 48 -> remainder 36 -> x = 12', sb.total === 48 && sb.remainder === 36 && sb.solvedX === 12);
const sim = M.simultaneousBars(7, 5);
check('2x + y = 19 and x + y = 12 -> difference gives x = 7, y = 5', sim.row1 === 19 && sim.row2 === 12 && sim.diffX === 7 && sim.solvedY === 5);
process.exit(bad ? 1 : 0);
