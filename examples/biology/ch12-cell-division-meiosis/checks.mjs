import * as M from './model.js';

let bad = 0;
function check(name, cond, detail = '') {
  if (cond) console.log(`PASS  ${name}`);
  else { bad++; console.log(`FAIL  ${name} ${detail}`); }
}

const g0 = M.meselsonStahlAccount(0);
const g1 = M.meselsonStahlAccount(1);
const g2 = M.meselsonStahlAccount(2);
const g3 = M.meselsonStahlAccount(3);
check('Meselson-Stahl Gen 0 is 100% heavy, Gen 1 is 100% hybrid (refuting conservative), Gen 2 is 50/50 hybrid/light, Gen 3 is 25/75', g0.heavyFrac === 1 && g1.hybridFrac === 1 && g2.hybridFrac === 0.5 && g2.lightFrac === 0.5 && g3.hybridFrac === 0.25 && g3.lightFrac === 0.75);
const mit = M.divisionPloidyAccount('mitosis', 46);
const mei = M.divisionPloidyAccount('meiosis', 46);
check('Human mitosis yields 2 diploid (46) clones; meiosis yields 4 haploid (23) gametes with 2^23 = 8,388,608 combinations', mit.daughterCells === 2 && mit.chromosomesPerDaughter === 46 && mei.daughterCells === 4 && mei.chromosomesPerDaughter === 23 && mei.assortmentCombinations === 8388608);

process.exit(bad ? 1 : 0);
