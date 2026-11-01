import * as M from './model.js';

let bad = 0;
function check(name, cond, detail = '') {
  if (cond) console.log(`PASS  ${name}`);
  else { bad++; console.log(`FAIL  ${name} ${detail}`); }
}

const dna50 = M.chargaffHelixAccount(0.5, 20);
const dna80 = M.chargaffHelixAccount(0.8, 20);
check('20 bp B-DNA has length 6.80 nm (2.0 turns) and 3 H-bonds per G-C + 2 per A-T', Math.abs(dna50.lengthNm - 6.8) < 1e-9 && dna50.turns === 2 && dna50.totalHBonds === 50 && dna80.totalHBonds === 56);
const wt = M.betaGlobinMutationAccount('wildtype');
const sk = M.betaGlobinMutationAccount('sickle');
const si = M.betaGlobinMutationAccount('silent');
check('Sickle mutation GAG -> GUG swaps Glu6 to hydrophobic Val6 and triggers HbS polymerisation', !wt.polymerisesDeoxy && sk.polymerisesDeoxy && sk.codon6 === 'GUG' && !si.polymerisesDeoxy);

process.exit(bad ? 1 : 0);
