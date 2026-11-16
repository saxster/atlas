import * as M from './model.js';
let bad = 0;
const check = (name, ok) => { if (ok) console.log(`PASS  ${name}`); else { bad++; console.log(`FAIL  ${name}`); } };
const v = M.vennPartition(18, 14, 6, 30);
check('Inclusion-Exclusion: 18 + 14 - 6 = 26 union and 4 outside', v.union === 26 && v.onlyA === 12 && v.onlyB === 8 && v.outside === 4);
const tt = M.deMorganTruthTable();
check('De Morgan laws hold across all 4 truth-table states', tt.length === 4 && tt.every(r => r.eq1 && r.eq2));
check('Power set of 3 elements has 2^3 = 8 subsets', M.powerSetCount(3) === 8 && M.powerSetCount(4) === 16);
process.exit(bad ? 1 : 0);
