import * as M from './model.js';

let bad = 0;
function check(name, cond, detail = '') {
  if (cond) console.log(`PASS  ${name}`);
  else { bad++; console.log(`FAIL  ${name} ${detail}`); }
}

check('Ferromagnetic domains randomize to 0 net magnetization above Curie temperature (770 C)',
  M.domainAlignmentFraction(0.8, 25, 770) > 0.85 && M.domainAlignmentFraction(0.8, 800, 770) === 0);
const m1 = M.dcMotorTorque(3.0, 0.5, 0.02, 20, 90);
const m2 = M.dcMotorTorque(3.0, 0.5, 0.02, 20, 270);
check('Split-ring commutator keeps motor torque positive in both half-cycles (90 deg and 270 deg)',
  m1.instTorqueNm > 0.5 && Math.abs(m1.instTorqueNm - m2.instTorqueNm) < 1e-9);
const cMax = M.maxwellWaveSpeed();
check('Maxwell wave speed 1/sqrt(mu0*eps0) matches speed of light ~2.998e8 m/s',
  Math.abs(cMax - 2.99792458e8) / 2.99792458e8 < 1e-6);

process.exit(bad ? 1 : 0);
