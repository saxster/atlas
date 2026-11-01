import * as M from './model.js';

let bad = 0;
function check(name, cond, detail = '') {
  if (cond) console.log(`PASS  ${name}`);
  else { bad++; console.log(`FAIL  ${name} ${detail}`); }
}

const fullO2 = M.aerobicRelayAccount(100, 60);
const zeroO2 = M.aerobicRelayAccount(0, 60);
check('Full aerobic respiration yields 32 ATP/glucose (2 glycolysis + 2 Krebs + 28 oxPhos)', Math.abs(fullO2.totalAtpPerGlucose - 32) < 1e-9);
check('Anoxic conditions collapse oxPhos and Krebs to 0, leaving 2 ATP from glycolysis and accumulating lactate', zeroO2.totalAtpPerGlucose === 2 && zeroO2.lactateAccumMm > 5);
const rqGluc = M.respiratoryQuotientLedger('glucose', 1);
const rqFat = M.respiratoryQuotientLedger('palmitate', 1);
check('Respiratory quotient RQ = CO2/O2 is 1.00 for glucose and ~0.70 for fatty acid', rqGluc.rq === 1.0 && Math.abs(rqFat.rq - 16 / 23) < 1e-9);

process.exit(bad ? 1 : 0);
