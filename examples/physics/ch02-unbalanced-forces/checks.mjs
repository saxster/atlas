import * as M from './model.js';

let bad = 0;
function check(name, cond, detail = '') {
  if (cond) console.log(`PASS  ${name}`);
  else { bad++; console.log(`FAIL  ${name} ${detail}`); }
}

const d30 = M.doubleRampRunDistanceM(0.5, 30);
check('Galileo double ramp at 30 deg climbs 2x drop height along second slope', Math.abs(d30 - 1.0) < 1e-9);
check('Galileo double ramp at 0 deg runs to infinity (Newton 1st law limit)', M.doubleRampRunDistanceM(0.5, 0) === Infinity);
const ang = M.brakingPendulumAngleDeg(9.8, 9.8);
check('1g braking tilts suspended pendulum forward by 45 deg', Math.abs(ang - 45) < 1e-9);
const st = M.frictionResponse(15, 5.0, 0.5, 0.35, 9.8);
check('Sub-threshold push (15 N < 24.5 N) is matched exactly by static friction (a = 0)', !st.sliding && Math.abs(st.frictionN - 15) < 1e-9 && st.accelMps2 === 0);
const sl = M.frictionResponse(30, 5.0, 0.5, 0.35, 9.8);
check('Above-threshold push (30 N > 24.5 N) drops friction to kinetic (17.15 N) and accelerates', sl.sliding && Math.abs(sl.frictionN - 17.15) < 1e-9 && sl.accelMps2 > 2.5);

process.exit(bad ? 1 : 0);
