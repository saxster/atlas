import * as M from './model.js';

let bad = 0;
function check(name, cond, detail = '') {
  if (cond) console.log(`PASS  ${name}`);
  else { bad++; console.log(`FAIL  ${name} ${detail}`); }
}

const gNorm = M.glucoseHomeostasisAccount(60, 100);
const gDiab = M.glucoseHomeostasisAccount(60, 10);
check('Normal insulin keeps blood glucose below 180 mg/dL renal threshold (0 urinary spill)', gNorm.peakBloodGlucoseMgDl < 180 && gNorm.renalSpilloverMgDl === 0);
check('Insulin deficiency pushes glucose above 180 mg/dL causing glycosuria spillover', gDiab.peakBloodGlucoseMgDl > 220 && gDiab.renalSpilloverMgDl > 40);
const nephDry = M.nephronLedgerAccount(125, 95, 95);
const nephWet = M.nephronLedgerAccount(125, 10, 95);
check('Nephron filters 180 L/day at GFR 125 mL/min, reabsorbs 100% glucose, and concentrates urine under high ADH', nephDry.filtrateLPerDay === 180 && nephDry.glucoseReabsorbedPct === 100 && nephDry.urineLPerDay < nephWet.urineLPerDay && nephDry.urineOsmolarityMosm > 1100);
const im1 = M.immuneMemoryAccount(5, 'primary');
const im2 = M.immuneMemoryAccount(5, 'secondary');
check('Secondary memory B/T response at day 5 produces >15x higher antibody titre than primary response', im2.antibodyTitre > im1.antibodyTitre * 15);

process.exit(bad ? 1 : 0);
