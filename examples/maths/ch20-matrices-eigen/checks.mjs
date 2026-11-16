import * as M from './model.js';
let bad = 0;
const check = (name, ok) => { if (ok) console.log(`PASS  ${name}`); else { bad++; console.log(`FAIL  ${name}`); } };
const m = M.matrixEigenModel(2.0, 1.0);
check('Wolfram-verified [[2,1],[1,2]] has det = 3, lambda1 = 3, lambda2 = 1, lambda1*lambda2 = det', m.det === 3 && m.lambda1 === 3 && m.lambda2 === 1 && m.prodEigen === m.det && m.sumEigen === m.trace);
process.exit(bad ? 1 : 0);
