// Chapter 0 pure model: microscopy optics, Rayleigh diffraction limit, Stokes spore settling, and logarithmic scale ladder.
export const NEAR_POINT_MM = 250;
export const G_ACCEL = 9.81;

export function focalLengthBallMm(radiusMm = 0.75, refIndex = 1.52) {
  const r = Math.max(0.1, radiusMm);
  const n = Math.max(1.1, refIndex);
  return (n * r) / (2 * (n - 1));
}

export function ballLensMagnification(radiusMm = 0.75, refIndex = 1.52) {
  return NEAR_POINT_MM / focalLengthBallMm(radiusMm, refIndex);
}

export function rayleighLimitNm(wavelengthNm = 550, na = 0.65) {
  return (0.61 * Math.max(100, wavelengthNm)) / Math.max(0.05, na);
}

export function stokesSettlingUmPerSec(radiusUm = 1.2, rhoP = 1150, rhoF = 1.2, eta = 1.81e-5) {
  const rM = Math.max(0.05, radiusUm) * 1e-6;
  const vMps = (2 * (rhoP - rhoF) * G_ACCEL * rM * rM) / (9 * eta);
  return vMps * 1e6;
}

export function swanNeckSporeCapture(neckDipMm = 18, airflowMmPerSec = 2.0, radiusUm = 1.2) {
  const vs = stokesSettlingUmPerSec(radiusUm) * 1e-3; // mm/s
  const transitSec = Math.max(1, (neckDipMm * 2.4) / Math.max(0.2, airflowMmPerSec));
  const dropMm = vs * transitSec;
  const fractionTrapped = Math.min(1, Math.max(0, 1 - Math.exp(-(dropMm / Math.max(1, neckDipMm * 0.35)) * 2.2)));
  return { vsMmPerSec: vs, transitSec, dropMm, fractionTrapped };
}
