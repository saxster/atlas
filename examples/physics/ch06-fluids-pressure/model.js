// Chapter 6 pure model: hydrostatic pressure P = P0 + rho*g*h, Torricelli efflux jet speed, mercury/water barometer column height, and atmospheric card support.
export const G_EARTH = 9.8;
export const RHO_WATER = 1000;
export const RHO_MERCURY = 13595;

export function hydrostaticJet(depthM = 0.30, floorDropM = 0.15, rho = RHO_WATER, g = G_EARTH) {
  const d = Math.max(0.01, depthM);
  const gaugePressurePa = rho * g * d;
  const jetSpeedMps = Math.sqrt(2 * g * d);
  const fallTimeSec = Math.sqrt((2 * Math.max(0.01, floorDropM)) / g);
  const rangeM = jetSpeedMps * fallTimeSec;
  return { gaugePressurePa, jetSpeedMps, rangeM };
}

export function barometerColumnHeight(atmPressureKPa = 101.3, g = G_EARTH) {
  const pPa = Math.max(20, atmPressureKPa) * 1000;
  const mercuryMm = (pPa / (RHO_MERCURY * g)) * 1000;
  const waterM = pPa / (RHO_WATER * g);
  return { mercuryMm, waterM };
}

export function invertedCardSupport(atmPressureKPa = 101.3, glassRadiusCm = 3.5, waterHeightCm = 12, g = G_EARTH) {
  const areaM2 = Math.PI * Math.pow(glassRadiusCm / 100, 2);
  const upwardAtmForceN = atmPressureKPa * 1000 * areaM2;
  const waterWeightN = RHO_WATER * g * (waterHeightCm / 100) * areaM2;
  const safetyFactor = upwardAtmForceN / Math.max(0.001, waterWeightN);
  return { areaM2, upwardAtmForceN, waterWeightN, safetyFactor, holds: upwardAtmForceN > waterWeightN };
}
