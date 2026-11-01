import * as M from './model.js';

let bad = 0;
function check(name, cond, detail = '') {
  if (cond) console.log(`PASS  ${name}`);
  else { bad++; console.log(`FAIL  ${name} ${detail}`); }
}

check('Doubling mass halves acceleration for same net force', Math.abs(M.cartAccelerationMps2(20, 2) - 2 * M.cartAccelerationMps2(20, 4)) < 1e-9);
const ch = M.threeCarChainTensions(36, 2, 2, 2);
check('Equal 3-car chain has tensions in exact 3 : 2 : 1 ratio (36 N, 24 N, 12 N)',
  Math.abs(ch.T1 - 36) < 1e-9 && Math.abs(ch.T2 - 24) < 1e-9 && Math.abs(ch.T3 - 12) < 1e-9);
const sc = M.hookedScalesPair(32.5);
check('Hooked spring scales read identical tension F_AB = F_BA', sc.scaleAN === sc.scaleBN && sc.diffN === 0);
const rk = M.rocketImpulseState(2500, 4.0, 400, 400);
check('Rocket thrust F = v_ex * dm/dt = 10,000 N and Tsiolkovsky delta-v = v_ex * ln(2)',
  Math.abs(rk.thrustN - 10000) < 1e-9 && Math.abs(rk.deltaVMps - 2500 * Math.log(2)) < 1e-6);

process.exit(bad ? 1 : 0);
