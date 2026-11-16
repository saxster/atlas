import * as M from './model.js';
let bad = 0;
const check = (name, ok) => { if (ok) console.log(`PASS  ${name}`); else { bad++; console.log(`FAIL  ${name}`); } };
const st = M.exponentStaircase(3);
check('Base 3 staircase has 3^0 = 1 and 3^-1 = 1/3', st[3].val === 1 && Math.abs(st[4].val - 1 / 3) < 1e-12);
const sc = M.similarityScaling(3);
check('Scale factor k=3 gives k=3, k^2=9, k^3=27', sc.lengthRatio === 3 && sc.areaRatio === 9 && sc.volumeRatio === 27);
process.exit(bad ? 1 : 0);
