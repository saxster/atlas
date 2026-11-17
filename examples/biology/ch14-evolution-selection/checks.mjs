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
check('With no selection on either homozygote there is no defined equilibrium (null)', M.balancingSelectionAccount(0, 0, 0.2).qEquilibrium === null && Math.abs(M.balancingSelectionAccount().qEquilibrium - 0.15 / 0.95) < 1e-12);
const w0 = M.fitnessLandscapeHeight(-0.65, 0, 0);
const w1 = M.fitnessLandscapeHeight(0.65, 0, 1);
check('Antibiotic shift moves the global fitness peak from the wild-type (-0.65) to the resistant mutant (+0.65)', w0 > M.fitnessLandscapeHeight(0.65, 0, 0) && w1 > M.fitnessLandscapeHeight(-0.65, 0, 1));
const finch = M.grantFinchSelectionResponse(9.42, 9.96, 0.74);
check('HHMI Grant Daphne Major 1977 drought: R = h^2 * S shifts Geospiza fortis beak depth by +0.40 mm', Math.abs(finch.selectionDifferentialMm - 0.54) < 1e-9 && Math.abs(finch.predictedResponseMm - 0.74 * 0.54) < 1e-9);
const realBal = M.balancingSelectionAccount(0.20, 0.80, 0.20, false);
const buggyBal = M.balancingSelectionAccount(0.20, 0.80, 0.20, true);
check('Buggy-world counterfactual eliminates heterozygote advantage so equilibrium HbS allele frequency collapses to 0', Math.abs(realBal.qEquilibrium - 0.20) < 1e-6 && buggyBal.qEquilibrium === 0);

process.exit(bad ? 1 : 0);
