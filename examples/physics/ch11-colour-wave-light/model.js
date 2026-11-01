// Chapter 11 pure model: Cauchy prism dispersion n(lambda), Brewster glare polarization angle + Malus's law, and Raman inelastic frequency shift.
export function prismDispersion(apexDeg = 60, wavelengthNm = 450) {
  // Crown/flint glass Cauchy approximation: n(lambda) = 1.504 + 4800 / lambda^2
  const lam = Math.max(380, Math.min(720, wavelengthNm));
  const n = 1.504 + 4800 / (lam * lam);
  const devDeg = (n - 1) * apexDeg;
  return { n, devDeg };
}

export function brewsterAndMalus(nMedium = 1.333, analyserAngleDeg = 90) {
  const brewsterDeg = (Math.atan2(nMedium, 1.0) * 180) / Math.PI;
  // Reflected glare at Brewster angle is horizontally polarized (0 deg); vertical Polaroid (90 deg) blocks it:
  const rad = (analyserAngleDeg * Math.PI) / 180;
  const transmittedGlareFraction = Math.pow(Math.cos(rad), 2);
  return { brewsterDeg, transmittedGlareFraction };
}

export function ramanShiftSpectrum(laserNm = 435.8, vibCmInv = 459) {
  // CCl4 symmetric stretch = 459 cm^-1 (Raman's classic 1928 liquid!)
  const nu0CmInv = 1e7 / laserNm;
  const stokesCmInv = nu0CmInv - vibCmInv;
  const antiStokesCmInv = nu0CmInv + vibCmInv;
  const stokesNm = 1e7 / stokesCmInv;
  const antiStokesNm = 1e7 / antiStokesCmInv;
  return { laserNm, stokesNm, antiStokesNm, shiftNm: stokesNm - laserNm };
}
