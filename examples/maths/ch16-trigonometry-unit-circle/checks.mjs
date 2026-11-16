import * as M from './model.js';
let bad = 0;
const check = (name, ok) => { if (ok) console.log(`PASS  ${name}`); else { bad++; console.log(`FAIL  ${name}`); } };
const uc = M.unitCircleTrig(50);
check('cos^2(50°) + sin^2(50°) === 1', Math.abs(uc.pythagIdentity - 1) < 1e-12);
const cr = M.cosineRule(3, 4, 90);
check('Law of Cosines reduces to 3-4-5 Pythagoras at C = 90°', Math.abs(cr.c - 5) < 1e-12 && Math.abs(cr.corrTerm) < 1e-12);
process.exit(bad ? 1 : 0);
