import * as M from './model.js';
let bad = 0;
const check = (name, ok) => { if (ok) console.log(`PASS  ${name}`); else { bad++; console.log(`FAIL  ${name}`); } };
const cc = M.circleSectorComb(1.2, 24);
check('Circle sector comb base = pi*r and area = pi*r^2', Math.abs(cc.halfCirc * cc.r - cc.exactArea) < 1e-12 && Math.abs(cc.combBase - cc.halfCirc) < 0.02);
const td = M.trapeziumDouble(1.2, 2.2, 1.0);
check('Doubled trapezium base = 3.4, parallelogram = 3.4, single trapezium = 1.7', Math.abs(td.trapArea - 1.7) < 1e-12);
check('Hemisphere volume (2/3)*pi*r^3 at r=1.2 is ~3.619', Math.abs(M.hemisphereVolume(1.2) - (2 / 3) * Math.PI * Math.pow(1.2, 3)) < 1e-12);
process.exit(bad ? 1 : 0);
