import * as M from './model.js';

let bad = 0;
function check(name, cond, detail = '') {
  if (cond) console.log(`PASS  ${name}`);
  else { bad++; console.log(`FAIL  ${name} ${detail}`); }
}

const bInsp = M.thoracicBoyleAccount(Math.PI / 2, 0.5, 2.5);
const bExp = M.thoracicBoyleAccount((3 * Math.PI) / 2, 0.5, 2.5);
check('Boyle law: thoracic expansion lowers alveolar pressure below atmospheric during inspiration', bInsp.inspiring && !bExp.inspiring && bInsp.volL < M.thoracicBoyleAccount(Math.PI, 0.5, 2.5).volL);
const dp = M.doublePumpAccount(72, 70, 0);
check('Cardiac output CO = HR * SV = 5.04 L/min at rest and systemic peak (120 mmHg) >> pulmonary (25 mmHg)', Math.abs(dp.coLPerMin - 5.04) < 1e-9 && dp.sysPeakMmHg > dp.pulmPeakMmHg * 4);
const lev = M.bicepLeverAccount(90, 40, 4.0, 32.0);
check('Biceps third-class lever requires 8x hand load (320 N tension for 40 N load at 90 deg)', Math.abs(lev.bicepTensionN - 320) < 1e-9);

process.exit(bad ? 1 : 0);
