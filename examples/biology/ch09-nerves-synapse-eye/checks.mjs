import * as M from './model.js';

let bad = 0;
function check(name, cond, detail = '') {
  if (cond) console.log(`PASS  ${name}`);
  else { bad++; console.log(`FAIL  ${name} ${detail}`); }
}

const apRest = M.actionPotentialWave(0, 15, 0);
const apPeak = M.actionPotentialWave(1.8, 15, 0);
const apTtx = M.actionPotentialWave(1.8, 15, 90);
check('Action potential rests at -70 mV and overshoots above +25 mV when stimulated above threshold', apRest.vMv === -70 && apPeak.fired && apPeak.vMv > 25);
check('90% TTX Na+ channel block abolishes spike firing (all-or-none failure)', !apTtx.fired && apTtx.vMv < -50);
const eyeNear = M.eyeOpticsAccount(0.25, 80);
const eyeFar = M.eyeOpticsAccount(6.0, 20);
check('Near focus requires shorter focal length (higher dioptre power & ciliary contraction) than distant focus', eyeNear.fRequiredMm < eyeFar.fRequiredMm && eyeNear.powerDioptres > eyeFar.powerDioptres && eyeNear.pupilDiamMm < eyeFar.pupilDiamMm);
const aux = M.auxinTropismAccount(35);
check('Unilateral light accumulates >65% IAA auxin on the shaded shoot flank, bending shoot toward light', aux.shadedFraction > 0.65 && aux.bendAngleDeg > 20);

process.exit(bad ? 1 : 0);
