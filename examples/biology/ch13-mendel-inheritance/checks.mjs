import * as M from './model.js';

let bad = 0;
function check(name, cond, detail = '') {
  if (cond) console.log(`PASS  ${name}`);
  else { bad++; console.log(`FAIL  ${name} ${detail}`); }
}

const f2Small = M.mendelCrossAccount('f1_self', 16);
const f2Large = M.mendelCrossAccount('f1_self', 6400);
check('F1 self cross gives 1:2:1 genotypic and 3:1 phenotypic ratios; 400x larger sample cuts sampling error 20x', f2Large.pDominant === 0.75 && f2Large.genoTt === 0.5 && Math.abs(f2Small.stdError / f2Large.stdError - 20) < 1e-9);
const ab = M.aboPhenotypeAccount('IA', 'IB');
const o = M.aboPhenotypeAccount('i', 'i');
check('I^A I^B expresses both A and B antigens (codominance) while ii is Group O', ab.bloodGroup === 'AB' && ab.antigens.includes('Codominant') && o.bloodGroup === 'O');
const xl = M.xLinkedCarrierAccount(true, false);
check('Carrier mother (X^R X^r) x unaffected father (X^R Y) gives 50% affected sons and 0% affected daughters', xl.pSonAffected === 0.5 && xl.pDaughterAffected === 0);

process.exit(bad ? 1 : 0);
