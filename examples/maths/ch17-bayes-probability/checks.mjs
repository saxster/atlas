import * as M from './model.js';
let bad = 0;
const check = (name, ok) => { if (ok) console.log(`PASS  ${name}`); else { bad++; console.log(`FAIL  ${name}`); } };
const b95 = M.bayesEikosogram(2, 95, 95);
const b90 = M.bayesEikosogram(2, 95, 90);
check('Wolfram-verified Bayes 2% prevalence, 95% sens, 95% spec -> P(D|+) = 19/68 ≈ 27.94%', Math.abs(b95.posterior - 19 / 68) < 1e-9 && Math.abs(b90.posterior - 19 / 117) < 1e-9);
process.exit(bad ? 1 : 0);
