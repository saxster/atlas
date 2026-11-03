import * as M from './model.js';

let bad = 0;
function check(name, cond, detail = '') {
  if (cond) console.log(`PASS  ${name}`);
  else { bad++; console.log(`FAIL  ${name} ${detail}`); }
}

const apRest = M.actionPotentialWave(0, 15, 0);
// the peak found by sampling the whole spike, not read at one assumed time
const spike = stim => Array.from({ length: 701 }, (_, i) => M.actionPotentialWave(i / 100, stim, 0));
const peakOf = stim => spike(stim).reduce((a, b) => (b.vMv > a.vMv ? b : a));
const apPeak = peakOf(15);
const apTtx = M.actionPotentialWave(1.8, 15, 90);
check('Action potential rests at -70 mV and overshoots above +25 mV when stimulated above threshold', apRest.vMv === -70 && apPeak.fired && apPeak.vMv > 25);
check('All-or-none: a stronger stimulus gives the same +30 mV peak, and the membrane undershoots, then settles back to -70 mV', Math.abs(peakOf(40).vMv - apPeak.vMv) < 1e-12 && Math.abs(apPeak.vMv - 30) < 1e-9 && Math.min(...spike(15).map(s => s.vMv)) < -72 && Math.abs(M.actionPotentialWave(7, 15, 0).vMv + 70) < 1e-12);
check('90% TTX Na+ channel block abolishes spike firing (all-or-none failure)', !apTtx.fired && apTtx.vMv < -50);
const eyeNear = M.eyeOpticsAccount(0.25, 80);
const eyeFar = M.eyeOpticsAccount(6.0, 20);
check('Near focus requires shorter focal length (higher dioptre power & ciliary contraction) than distant focus', eyeNear.fRequiredMm < eyeFar.fRequiredMm && eyeNear.powerDioptres > eyeFar.powerDioptres && eyeNear.pupilDiamMm < eyeFar.pupilDiamMm);
const aux = M.auxinTropismAccount(35);
check('Light from either side puts the same auxin share on the shaded flank', Math.abs(M.auxinTropismAccount(-35).shadedFraction - aux.shadedFraction) < 1e-12);
check('Unilateral light accumulates >65% IAA auxin on the shaded shoot flank, bending shoot toward light', aux.shadedFraction > 0.65 && aux.bendAngleDeg > 20);

process.exit(bad ? 1 : 0);
