import * as M from './model.js';

let bad = 0;
function check(name, cond, detail = '') {
  if (cond) console.log(`PASS  ${name}`);
  else { bad++; console.log(`FAIL  ${name} ${detail}`); }
}

check('Frame transformation x_prime = x - v*t', Math.abs(M.framePosition(10, 3, 2) - 4) < 1e-9);
const gal = M.galileoRampKinematics(14, 2.0);
check('Galileo ramp odd-number intervals follow 1:3:5:7 exactly',
  Math.abs(gal.oddSteps[1] / gal.oddSteps[0] - 3) < 1e-9 &&
  Math.abs(gal.oddSteps[2] / gal.oddSteps[0] - 5) < 1e-9 &&
  Math.abs(gal.oddSteps[3] / gal.oddSteps[0] - 7) < 1e-9);
const apex = M.verticalTossState(9.8, 1.0, 9.8);
check('At vertical toss apex (t = v0/g), velocity is 0 while acceleration remains -9.8 m/s^2',
  Math.abs(apex.vMps) < 1e-9 && Math.abs(apex.aMps2 + 9.8) < 1e-9 && Math.abs(apex.yM - 4.9) < 1e-9);
const tr = M.relativeTrainVelocity(15, -12, 108);
check('Opposite trains at +15 m/s and -12 m/s have relative speed 27 m/s and pass 108 m in 4 s',
  Math.abs(tr.vRelAB - 27) < 1e-9 && Math.abs(tr.passTimeSec - 4) < 1e-9);

process.exit(bad ? 1 : 0);
