import * as M from './model.js';

let bad = 0;
function check(name, cond, detail = '') {
  if (cond) console.log(`PASS  ${name}`);
  else { bad++; console.log(`FAIL  ${name} ${detail}`); }
}

const f075 = M.focalLengthBallMm(0.75, 1.52);
check('Leeuwenhoek 0.75 mm soda-lime bead focal length ~1.46 mm', Math.abs(f075 - (1.52 * 0.75) / (2 * 0.52)) < 1e-9);
const mag = M.ballLensMagnification(0.75, 1.52);
check('Magnification M = 250 / f ~ 171x for r = 0.75 mm', Math.abs(mag - 250 / f075) < 1e-9 && mag > 150 && mag < 200);
check('Smaller bead lens gives higher magnification', M.ballLensMagnification(0.5, 1.52) > M.ballLensMagnification(1.0, 1.52));
const dLim = M.rayleighLimitNm(550, 0.65);
check('Rayleigh diffraction limit at 550 nm, NA 0.65 is ~516 nm', Math.abs(dLim - (0.61 * 550) / 0.65) < 1e-9);
const cap = M.swanNeckSporeCapture(22, 1.5, 1.5);
check('Deep swan-neck dip traps >85% of airborne dust/spores at low airflow', cap.fractionTrapped > 0.85 && cap.fractionTrapped <= 1);

process.exit(bad ? 1 : 0);
