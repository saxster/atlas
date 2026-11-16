import * as M from './model.js';
let bad = 0;
const check = (name, ok) => { if (ok) console.log(`PASS  ${name}`); else { bad++; console.log(`FAIL  ${name}`); } };
const inv = M.hcfLcmInvariant(24, 36);
check('HCF(24,36)=12, LCM(24,36)=72, and HCF*LCM = 24*36 = 864', inv.hcf === 12 && inv.lcm === 72 && inv.productHcfLcm === inv.productAB);
const r1 = M.directedRotation(5, 1), r2 = M.directedRotation(5, 2);
check('One 180° flip gives -5; two 180° flips (360°) restore +5', r1.signedValue === -5 && r2.signedValue === 5 && r2.angleDeg === 360);
process.exit(bad ? 1 : 0);
