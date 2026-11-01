// Chapter 0 pure model: Earth curvature hull-down horizon, parallax error, powers-of-ten scale ratio, and rain-gauge volume/depth invariance.
export const R_EARTH_M = 6.371e6;

export function horizonDistanceKm(eyeHeightM = 2.0, radiusM = R_EARTH_M) {
  const h = Math.max(0, eyeHeightM);
  return Math.sqrt(2 * radiusM * h + h * h) / 1000;
}

export function hiddenHullHeightM(shipDistKm = 12, eyeHeightM = 2.0, radiusM = R_EARTH_M) {
  const dHzKm = horizonDistanceKm(eyeHeightM, radiusM);
  if (shipDistKm <= dHzKm) return 0;
  const dBeyondM = (shipDistKm - dHzKm) * 1000;
  return (dBeyondM * dBeyondM) / (2 * radiusM);
}

export function parallaxErrorMm(scaleThicknessMm = 3.0, viewAngleDeg = 15) {
  const rad = (viewAngleDeg * Math.PI) / 180;
  return scaleThicknessMm * Math.tan(rad);
}

export function scaleOrderDifference(expA = 3, expB = -6) {
  return Math.pow(10, expA - expB);
}

export function rainGaugeCollection(rainDepthMm = 25, radiusMm = 50) {
  const areaCm2 = (Math.PI * radiusMm * radiusMm) / 100;
  const volumeMl = areaCm2 * (rainDepthMm / 10);
  return { depthMm: rainDepthMm, areaCm2, volumeMl };
}
