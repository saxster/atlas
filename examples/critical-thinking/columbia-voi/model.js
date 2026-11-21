// Pure mathematical model for Figure CT.9: Columbia STS-107 Crater Extrapolation (640x), Value of Information (VOI), and Normalization of Deviance.
// Zero DOM, zero Three.js imports.
export const DURATION = 7.5;

// CAIB Report Vol 1: Boeing Crater model was calibrated against 1/2 to 3 cubic-inch debris tests (~0.0026 lb / ~1.2 g),
// whereas the STS-107 External Tank bipod foam piece was ~1.67 lb (~757 g), ~640x the calibrated volume/mass!
export const CALIBRATED_FOAM_IN3 = 3.0;
export const STS107_FOAM_IN3 = 1920.0; // ~19 x 11 x 5.5 in -> ~1150-1920 in^3 (~640x max test volume)

export function craterExtrapolation({ foamVolumeIn3 = 1920 } = {}) {
  const factor = foamVolumeIn3 / CALIBRATED_FOAM_IN3;
  const outOfEnvelope = foamVolumeIn3 > CALIBRATED_FOAM_IN3;
  return { foamVolumeIn3, calibratedMaxIn3: CALIBRATED_FOAM_IN3, extrapolationFactor: factor, outOfEnvelope };
}

// Value of Information (VOI): requesting orbital satellite/telescope wing imagery.
// Even if probability of fatal breach p_breach is small (e.g. 2%) and mitigation succeeds with probability q_mitigate (e.g. 50% rescue/repair),
// looking is rational whenever p_breach * q_mitigate * Loss > CostOfLooking (so threshold p* = Cost / (q * Loss)).
export function valueOfInformation({
  pBreach = 0.05,
  costLook = 10,
  lossFailure = 10000,
  mitigationShare = 0.40,
} = {}) {
  const expectedSaved = pBreach * mitigationShare * lossFailure;
  const netVOI = expectedSaved - costLook;
  const pThreshold = (mitigationShare * lossFailure) > 0 ? costLook / (mitigationShare * lossFailure) : 1;
  return { expectedSaved, costLook, netVOI, pThreshold, shouldLook: netVOI > 0 };
}

// Normalization of Deviance: probability of escaping damage across N launches if per-flight hazard p_f stays fixed.
export function survivalAcrossFlights(pHazard = 0.12, nFlights = 18) {
  return Math.pow(1 - pHazard, nFlights);
}

export function run({ foamVolumeIn3 = 1920, pBreach = 0.05, buggyPriorPass = 0 } = {}) {
  const crater = craterExtrapolation({ foamVolumeIn3 });
  const voi = valueOfInformation({ pBreach });
  const surv18 = survivalAcrossFlights(0.12, 18);
  return { foamVolumeIn3, pBreach, buggyPriorPass: buggyPriorPass ? 1 : 0, crater, voi, surv18 };
}

export function snapshot(e, t) {
  const frac = Math.max(0, Math.min(1, t / DURATION));
  const curVol = 3.0 + (e.foamVolumeIn3 - 3.0) * frac;
  const curExt = craterExtrapolation({ foamVolumeIn3: curVol });
  return { frac, curVol, ...curExt };
}
