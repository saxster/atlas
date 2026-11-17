import * as M from './model.js';

let bad = 0;
function check(name, cond, detail = '') {
  if (cond) console.log(`PASS  ${name}`);
  else { bad++; console.log(`FAIL  ${name} ${detail}`); }
}

const imb0 = M.imbibitionState(0, -95, 0.28);
const imb12 = M.imbibitionState(12, -95, 0.28);
check('Dry seed matric potential starts at -95 MPa and relaxes toward 0', imb0.psiMatricMPa === -95 && imb12.psiMatricMPa > -5);
check('Seed coat ruptures once water uptake crosses 62%', !imb0.testaRuptured && imb12.testaRuptured);

const mb = M.hydrationMassBalance(50, 0.10, 0.65, 55);
check('Hydration mass balance: 45 g dry solids at 65% water = 128.57 g; +55 g water = 105 g (57.1% water)',
  Math.abs(mb.fixedDrySolidsG - 45) < 1e-9 &&
  Math.abs(mb.targetTotalG - 45 / 0.35) < 1e-9 &&
  Math.abs(mb.soakedTotalG - 105) < 1e-9 &&
  Math.abs(mb.soakedWaterPct - (60 / 105) * 100) < 1e-9
);

const ox = M.coupledOxidationBudget(32, null, false);
check('Energy conservation: captured ATP + heat === 2870 kJ/mol', Math.abs(ox.capturedKj + ox.heatKj - M.GLUCOSE_DELTA_G_KJ) < 1e-9);
check('32 ATP captures ~34% of glucose free energy', ox.efficiency > 0.33 && ox.efficiency < 0.35);

const oxBuggy = M.coupledOxidationBudget(32, null, true);
const imbBuggy = M.imbibitionState(12, -95, 0.28, true);
check('Buggy-world counterfactual zeroes coupled ATP capture and locks dormant seed state',
  oxBuggy.nAtp === 0 && oxBuggy.capturedKj === 0 && oxBuggy.heatKj === M.GLUCOSE_DELTA_G_KJ && imbBuggy.waterUptakePct === 0
);

const turn = M.atpTurnoverSchedule(50, 40000);
check('ATP turnover: 50 g pool and 40,000 g/day = 800 cycles/day (1.8 min/cycle)',
  Math.abs(turn.poolEquivalentsPerDay - 800) < 1e-9 && Math.abs(turn.minutesPerCycle - 1.8) < 1e-9
);

const cap = M.capsidTriangulation(2, 1);
check('Caspar-Klug triangulation T = h^2 + hk + k^2 = 7 for (2,1) with 420 subunits', cap.T === 7 && cap.subunits === 420 && cap.capsomeres === 72);

process.exit(bad ? 1 : 0);
