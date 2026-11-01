// Chapter 4 pure model: independence of vertical & horizontal projectile motion, and centripetal velocity-change vector delta-v.
export const G_EARTH = 9.8;

export function dualCoinFlight(heightM = 1.25, vHorizMps = 4.0, g = G_EARTH) {
  const fallTimeSec = Math.sqrt((2 * Math.max(0.05, heightM)) / g);
  const rangeM = vHorizMps * fallTimeSec;
  const vImpactVertMps = g * fallTimeSec;
  const vImpactTotalMps = Math.hypot(vHorizMps, vImpactVertMps);
  return { fallTimeSec, rangeM, vImpactVertMps, vImpactTotalMps };
}

export function centripetalChordKinematics(speedMps = 6.0, radiusM = 2.0, stepAngleDeg = 20) {
  const aCentripetalMps2 = (speedMps * speedMps) / Math.max(0.1, radiusM);
  const dThetaRad = (stepAngleDeg * Math.PI) / 180;
  const dtSec = (radiusM * dThetaRad) / Math.max(0.1, speedMps);
  const deltaVChord = 2 * speedMps * Math.sin(dThetaRad / 2);
  const aChordAvg = deltaVChord / dtSec;
  return { aCentripetalMps2, deltaVChord, dtSec, aChordAvg };
}
