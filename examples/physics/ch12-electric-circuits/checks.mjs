import * as M from './model.js';

let bad = 0;
function check(name, cond, detail = '') {
  if (cond) console.log(`PASS  ${name}`);
  else { bad++; console.log(`FAIL  ${name} ${detail}`); }
}

const iv1 = M.ivCharacteristics(2.0, 10);
const iv2 = M.ivCharacteristics(4.0, 10);
check('Ohmic current doubles when V doubles, while heating filament current grows sub-linearly',
  Math.abs(iv2.iOhmicA / iv1.iOhmicA - 2) < 1e-9 && iv2.iFilamentA / iv1.iFilamentA < 1.8);
check('Diode blocks current below threshold and conducts strongly above knee',
  M.ivCharacteristics(1.0, 10).iDiodeA === 0 && iv2.iDiodeA > 0.3);
const ef = M.earthFaultSafety(230, 2.0, 2000, 15);
check('Low-resistance Earth wire draws 115 A fault surge and immediately trips 15 A fuse',
  Math.abs(ef.faultCurrentEarthA - 115) < 1e-9 && ef.fuseTrips && Math.abs(ef.unEarthedBodyCurrentMa - 115) < 1e-9);

process.exit(bad ? 1 : 0);
