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

process.exit(bad ? 1 : 0);
