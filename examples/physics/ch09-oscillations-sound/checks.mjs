import * as M from './model.js';

let bad = 0;
function check(name, cond, detail = '') {
  if (cond) console.log(`PASS  ${name}`);
  else { bad++; console.log(`FAIL  ${name} ${detail}`); }
}

const rOn = M.drivenResonanceAmplitude(1.5, 1.5, 0.2);
const rOff = M.drivenResonanceAmplitude(2.4, 1.5, 0.2);
check('Resonance amplitude peaks when f_drive == f_0 with 90 deg phase lag',
  rOn.amp > rOff.amp * 3 && Math.abs(rOn.phaseLagDeg - 90) < 1e-6);
const fl = M.flutterGainRate(19, 15);
check('Aeroelastic flutter becomes unstable above critical wind speed', fl.unstable && fl.netGrowthPerSec > 0);
const snd = M.soundWaveRelation(343, 343);
check('343 Hz sound in 343 m/s air has 1.00 m wavelength', Math.abs(snd.wavelengthM - 1.0) < 1e-9);

process.exit(bad ? 1 : 0);
