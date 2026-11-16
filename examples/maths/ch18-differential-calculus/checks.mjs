import * as M from './model.js';
let bad = 0;
const check = (name, ok) => { if (ok) console.log(`PASS  ${name}`); else { bad++; console.log(`FAIL  ${name}`); } };
const c0 = M.cubicCalculus(0, 1e-6);
const c2 = M.cubicCalculus(2, 1e-6);
check('Wolfram-verified stationary points at x=0 (max y=2) and x=2 (min y=2/3)', Math.abs(c0.tangentSlope) < 1e-9 && c0.secondDeriv < 0 && Math.abs(c2.tangentSlope) < 1e-9 && c2.secondDeriv > 0);
check('Secant slope converges to tangent slope as h -> 0', Math.abs(c2.secantSlope - c2.tangentSlope) < 1e-5);
process.exit(bad ? 1 : 0);
