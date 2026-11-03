import * as M from './model.js';

let bad = 0;
function check(name, cond, detail = '') {
  if (cond) console.log(`PASS  ${name}`);
  else { bad++; console.log(`FAIL  ${name} ${detail}`); }
}

const dna50 = M.chargaffHelixAccount(0.5, 20);
const dna80 = M.chargaffHelixAccount(0.8, 20);
check('20 bp B-DNA has length 6.80 nm (20 / 10.5 = 1.90 relaxed turns) and 3 H-bonds per G-C + 2 per A-T', Math.abs(dna50.lengthNm - 6.8) < 1e-9 && Math.abs(dna50.turns - 20 / 10.5) < 1e-12 && dna50.totalHBonds === 50 && dna80.totalHBonds === 56);
const wt = M.betaGlobinMutationAccount('wildtype');
const sk = M.betaGlobinMutationAccount('sickle');
const si = M.betaGlobinMutationAccount('silent');
// each mRNA is its coding strand with T read as U; codons 3 and 6 read through a small part of the genetic code
const CODE = { CUG: 'Leu', CUU: 'Leu', GAG: 'Glu', GUG: 'Val' }, codon = (m, i) => m.mrna.split(' ')[i - 1];
check('Every mRNA is its coding DNA strand with T -> U', [wt, sk, si].every(m => m.dnaCoding.replace(/T/g, 'U') === m.mrna));
check('Sickle changes codon 6 Glu -> Val; the synonymous change alters codon 3 (CUG -> CUU) and keeps Leu', CODE[codon(wt, 6)] === 'Glu' && CODE[codon(sk, 6)] === 'Val' && codon(si, 3) !== codon(wt, 3) && CODE[codon(si, 3)] === CODE[codon(wt, 3)] && codon(si, 6) === codon(wt, 6));
check('Sickle mutation GAG -> GUG swaps Glu6 to hydrophobic Val6 and triggers HbS polymerisation', !wt.polymerisesDeoxy && sk.polymerisesDeoxy && sk.codon6 === 'GUG' && !si.polymerisesDeoxy);

process.exit(bad ? 1 : 0);
