import * as M from './model.js';
let bad = 0;
const check = (name, ok) => { if (ok) console.log(`PASS  ${name}`); else { bad++; console.log(`FAIL  ${name}`); } };
const cs = M.completeSquare(2, 6, 5);
check('x^2 + 6x + 5 = (x + 3)^2 - 4 has corner 9 and vertex (-3, -4)', cs.halfB === 3 && cs.cornerArea === 9 && cs.vertexX === -3 && cs.vertexY === -4);
process.exit(bad ? 1 : 0);
