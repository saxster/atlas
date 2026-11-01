// Chapter 5 pure model: Newton's Moon-apple inverse-square test, ellipse geometry, Cavendish torsion balance, and Kepler orbital mechanics.
export const G_CONST = 6.674e-11;
export const G_SURFACE = 9.80;

export function moonDropComparison(distanceEarthRadii = 60.27) {
  const ratio = Math.max(1, distanceEarthRadii);
  const appleFall1sM = 0.5 * G_SURFACE;
  const gMoonOrbitMps2 = G_SURFACE / (ratio * ratio);
  const moonFall1sMm = 0.5 * gMoonOrbitMps2 * 1000;
  return { appleFall1sM, gMoonOrbitMps2, moonFall1sMm, dilutionFactor: ratio * ratio };
}

export function ellipseGeometry(semiMajorA = 2.0, eccentricity = 0.6) {
  const e = Math.max(0, Math.min(0.92, eccentricity));
  const cFocus = semiMajorA * e;
  const semiMinorB = semiMajorA * Math.sqrt(1 - e * e);
  const rPeri = semiMajorA * (1 - e);
  const rApo = semiMajorA * (1 + e);
  // By angular momentum conservation r_p * v_p = r_a * v_a
  const speedRatioPeriToApo = (1 + e) / (1 - e);
  return { semiMajorA, semiMinorB, cFocus, rPeri, rApo, speedRatioPeriToApo };
}

export function cavendishTorque(mSmallKg = 0.73, mLargeKg = 158, sepM = 0.23, armLenM = 0.9, kappa = 1.4e-7) {
  const forceN = (G_CONST * mSmallKg * mLargeKg) / (sepM * sepM);
  const torqueNm = 2 * forceN * (armLenM / 2);
  const twistRad = torqueNm / kappa;
  const lightSpotShiftMm = 2 * twistRad * 3000; // 3 m optical lever mirror-to-scale
  return { forceN, torqueNm, twistRad, lightSpotShiftMm };
}
