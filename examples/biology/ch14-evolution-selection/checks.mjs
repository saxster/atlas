import * as M from './model.js';

let bad = 0;
function check(name, cond, detail = '') {
  if (cond) console.log(`PASS  ${name}`);
  else { bad++; console.log(`FAIL  ${name} ${detail}`); }
}

const col0 = M.logisticColonyAccount(0, 0.65, 10, 1000);
const colInf = M.logisticColonyAccount(40, 0.65, 10, 1000);
check('Logistic growth starts at N0 = 10 and saturates at carrying capacity K = 1000 with inflection at K/2 = 500', Math.abs(col0.nLog - 10) < 1e-9 && Math.abs(colInf.nLog - 1000) < 1e-3 && col0.inflectionN === 500);
const bal = M.balancingSelectionAccount(0.15, 0.85, 0.15);
check('Heterozygote advantage equilibrium frequency q* = s1 / (s1 + s2) = 0.15 exactly', Math.abs(bal.qEquilibrium - 0.15) < 1e-12);
const w0 = M.fitnessLandscapeHeight(-0.65, 0, 0);
const w1 = M.fitnessLandscapeHeight(0.65, 0, 1);
check('Antibiotic shift moves the global fitness peak from the wild-type (-0.65) to the resistant mutant (+0.65)', w0 > M.fitnessLandscapeHeight(0.65, 0, 0) && w1 > M.fitnessLandscapeHeight(-0.65, 0, 1));

process.exit(bad ? 1 : 0);
