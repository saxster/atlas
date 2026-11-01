import * as M from './model.js';

let bad = 0;
function check(name, cond, detail = '') {
  if (cond) console.log(`PASS  ${name}`);
  else { bad++; console.log(`FAIL  ${name} ${detail}`); }
}

const pyr10 = M.trophicPyramidAccount(10000, 10);
check('Lindeman 10% law: 10,000 kJ producers -> 1,000 kJ herbivores -> 100 kJ carnivores -> 10 kJ apex', pyr10.herbivoreKj === 1000 && pyr10.primaryCarnKj === 100 && pyr10.apexCarnKj === 10 && pyr10.heatLostToHerbKj === 9000);
const vEq = M.lotkaVolterraInvariant(1.0, 1.0, 1, 1, 1, 1);
const vOff = M.lotkaVolterraInvariant(2.0, 1.8, 1, 1, 1, 1);
check('Lotka-Volterra invariant V(R,F) has unique global minimum V=2 at equilibrium (R*=1, F*=1)', Math.abs(vEq - 2.0) < 1e-12 && vOff > vEq);
const fermOpt = M.fermenterBiotechAccount(37, 90);
const fermHot = M.fermenterBiotechAccount(58, 90);
check('Jacketed fermenter peaks at 37 C with high aeration and crashes when overheated to 58 C', fermOpt.insulinYieldMgL === 420 && fermHot.insulinYieldMgL < 40);

process.exit(bad ? 1 : 0);
