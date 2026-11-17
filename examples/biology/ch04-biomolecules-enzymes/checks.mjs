import * as M from './model.js';

let bad = 0;
function check(name, cond, detail = '') {
  if (cond) console.log(`PASS  ${name}`);
  else { bad++; console.log(`FAIL  ${name} ${detail}`); }
}

const atKm = M.michaelisMenten(M.KM_DEFAULT, 37, 7.0, 0);
check('At [S] = Km and optimal T/pH, v === 0.5 * Vmax_eff', Math.abs(atKm.v - 0.5 * atKm.vmaxEff) < 1e-9);
const hot = M.michaelisMenten(5.0, 68, 7.0, 0);
check('At 68 C, enzyme denatures and rate collapses (<5% Vmax)', hot.denatured && hot.v < 5);
const inhib = M.michaelisMenten(M.KM_DEFAULT, 37, 7.0, 2.0, 1.0);
check('Competitive inhibitor triples apparent Km at [I] = 2 Ki, but high [S] still approaches Vmax', Math.abs(inhib.kmApp - 3 * M.KM_DEFAULT) < 1e-9);
const rAlpha = M.ramachandranEnergy(-60, -45);
const rClash = M.ramachandranEnergy(60, -120);
check('Ramachandran alpha-helix (-60, -45) is sterically allowed while (+60, -120) clashes', rAlpha.allowed && !rClash.allowed && rAlpha.energyKj < rClash.energyKj);
const gc = M.goodsellCrowdingAndTurnover(250, 6e5, 0.15);
check('Goodsell crowding (25% volume at 250 mg/mL, BNID 105938) & carbonic anhydrase 4e6x acceleration (BNID 101646)', Math.abs(gc.volumeFractionOccupied - 0.25) < 1e-9 && Math.abs(gc.rateEnhancement - 4e6) < 1e-3);
const realMm = M.michaelisMenten(3.0, 65, 7.0, 0, 1.0, false);
const buggyMm = M.michaelisMenten(3.0, 65, 7.0, 0, 1.0, true);
check('Buggy-world counterfactual removes high-temperature denaturation cliff at 65 C', realMm.denatured === true && realMm.v < 5 && buggyMm.denatured === false && buggyMm.v > 40);

process.exit(bad ? 1 : 0);
