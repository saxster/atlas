import * as M from './model.js';

let bad = 0;
function check(name, cond, detail = '') {
  if (cond) console.log(`PASS  ${name}`);
  else { bad++; console.log(`FAIL  ${name} ${detail}`); }
}

const gNorm = M.glucoseHomeostasisAccount(60, 100);
const gDiab = M.glucoseHomeostasisAccount(60, 10);
// filtered load (mg/min) = plasma glucose (mg/dL) / 100 (mg/mL) x GFR 125 mL/min; tubules recover at most 330 mg/min
const load = g => g / 100 * 125, TM = 330;
check('Normal insulin keeps the filtered glucose load under the 330 mg/min recovery limit (no glucose in urine)', load(gNorm.peakBloodGlucoseMgDl) < TM && gNorm.renalGlucoseExcretionMgMin === 0);
check('Insulin deficiency pushes the load past the limit; the excess (load - 330) is excreted', load(gDiab.peakBloodGlucoseMgDl) > TM && Math.abs(gDiab.renalGlucoseExcretionMgMin - (load(gDiab.peakBloodGlucoseMgDl) - TM)) < 1e-9 && gDiab.renalGlucoseExcretionMgMin > 40);
const nephHigh = M.nephronLedgerAccount(125, 60, gDiab.peakBloodGlucoseMgDl);
check('The nephron ledger agrees: what it reabsorbs plus what the glucose account excretes is the whole filtered load', Math.abs(load(gDiab.peakBloodGlucoseMgDl) * nephHigh.glucoseReabsorbedPct / 100 + gDiab.renalGlucoseExcretionMgMin - load(gDiab.peakBloodGlucoseMgDl)) < 1e-9);
const nephDry = M.nephronLedgerAccount(125, 95, 95);
const nephWet = M.nephronLedgerAccount(125, 10, 95);
check('Nephron filters 180 L/day at GFR 125 mL/min, reabsorbs 100% glucose, and concentrates urine under high ADH', nephDry.filtrateLPerDay === 180 && nephDry.glucoseReabsorbedPct === 100 && nephDry.urineLPerDay < nephWet.urineLPerDay && nephDry.urineOsmolarityMosm > 1100);
const im1 = M.immuneMemoryAccount(5, 'primary');
const im2 = M.immuneMemoryAccount(5, 'secondary');
// titres are rounded to 0.1 AU, so the sampled peak is a plateau: its middle is the peak day
const peakDay = type => {
  const days = Array.from({ length: 421 }, (_, i) => i / 10), v = days.map(d => M.immuneMemoryAccount(d, type).antibodyTitre);
  const top = days.filter((d, i) => v[i] === Math.max(...v));
  return (top[0] + top[top.length - 1]) / 2;
};
check('Sampled antibody curves peak on the days the model states (primary day 14, secondary day 7)', Math.abs(peakDay('primary') - M.immuneMemoryAccount(0, 'primary').peakDay) < 0.1 && Math.abs(peakDay('secondary') - M.immuneMemoryAccount(0, 'secondary').peakDay) < 0.1);
check('A primary response lags: no antibody until after day 4', M.immuneMemoryAccount(4, 'primary').antibodyTitre === 0 && M.immuneMemoryAccount(4.5, 'primary').antibodyTitre > 0);
check('Secondary memory B/T response at day 5 produces >15x higher antibody titre than primary response', im2.antibodyTitre > im1.antibodyTitre * 15);

process.exit(bad ? 1 : 0);
