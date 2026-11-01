import * as M from './model.js';

let bad = 0;
function check(name, cond, detail = '') {
  if (cond) console.log(`PASS  ${name}`);
  else { bad++; console.log(`FAIL  ${name} ${detail}`); }
}

const j1 = M.hydrostaticJet(0.10, 0.20);
const j4 = M.hydrostaticJet(0.40, 0.20);
check('4x water depth quadruples gauge pressure and doubles Torricelli jet speed',
  Math.abs(j4.gaugePressurePa / j1.gaugePressurePa - 4) < 1e-9 && Math.abs(j4.jetSpeedMps / j1.jetSpeedMps - 2) < 1e-9);
const bar = M.barometerColumnHeight(101.3, 9.8);
check('Standard 101.3 kPa supports ~760 mm Hg or ~10.34 m water',
  bar.mercuryMm > 755 && bar.mercuryMm < 765 && bar.waterM > 10.2 && bar.waterM < 10.4);
const card = M.invertedCardSupport(101.3, 3.5, 12);
check('Atmospheric upward force on inverted glass card exceeds 12 cm water weight by >80x',
  card.holds && card.safetyFactor > 80);

process.exit(bad ? 1 : 0);
