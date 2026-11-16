import * as M from './model.js';
let bad = 0;
const check = (name, ok) => { if (ok) console.log(`PASS  ${name}`); else { bad++; console.log(`FAIL  ${name}`); } };
const im = M.integralModel(24, 2.4);
check('Midpoint Riemann sum within 0.002 of exact antiderivative F(b) - F(a)', Math.abs(im.midpointSum - im.exactArea) < 0.002);
process.exit(bad ? 1 : 0);
