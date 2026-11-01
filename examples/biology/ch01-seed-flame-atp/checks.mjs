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
const ox = M.coupledOxidationBudget(32);
check('Energy conservation: captured ATP + heat === 2870 kJ/mol', Math.abs(ox.capturedKj + ox.heatKj - M.GLUCOSE_DELTA_G_KJ) < 1e-9);
check('32 ATP captures ~34% of glucose free energy', ox.efficiency > 0.33 && ox.efficiency < 0.35);
const cap = M.capsidTriangulation(2, 1);
check('Caspar-Klug triangulation T = h^2 + hk + k^2 = 7 for (2,1) with 420 subunits', cap.T === 7 && cap.subunits === 420 && cap.capsomeres === 72);

process.exit(bad ? 1 : 0);
