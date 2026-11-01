import * as M from './model.js';

let bad = 0;
function check(name, cond, detail = '') {
  if (cond) console.log(`PASS  ${name}`);
  else { bad++; console.log(`FAIL  ${name} ${detail}`); }
}

const c0 = M.dualCoinFlight(1.225, 0, 9.8);
const c5 = M.dualCoinFlight(1.225, 5.0, 9.8);
check('Dropped coin and horizontally flicked coin have identical 0.50 s fall time',
  Math.abs(c0.fallTimeSec - 0.5) < 1e-9 && Math.abs(c5.fallTimeSec - 0.5) < 1e-9 && Math.abs(c5.rangeM - 2.5) < 1e-9);
const cen = M.centripetalChordKinematics(6.0, 2.0, 2.0);
check('Chord average acceleration approaches v^2 / r = 18 m/s^2 for small step angle',
  Math.abs(cen.aCentripetalMps2 - 18) < 1e-9 && Math.abs(cen.aChordAvg - 18) < 0.01);

process.exit(bad ? 1 : 0);
