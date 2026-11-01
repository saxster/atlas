// Chapter 14 pure model: logistic bacterial growth & antibiotic selection, Sewall Wright 3D fitness surface, and sickle-cell malaria balancing selection.
export function logisticColonyAccount(tHr = 6, rPerHr = 0.65, n0 = 10, kCap = 1000) {
  const nLog = kCap / (1 + ((kCap - n0) / n0) * Math.exp(-rPerHr * Math.max(0, tHr)));
  const dndt = rPerHr * nLog * (1 - nLog / kCap);
  return { tHr, nLog, dndt, inflectionN: kCap / 2 };
}

export function balancingSelectionAccount(sMalaria = 0.15, sSickle = 0.85, qFreq = 0.12) {
  const q = Math.max(0, Math.min(1, qFreq));
  const p = 1 - q;
  // W(AA) = 1 - sMalaria, W(AS) = 1.0, W(SS) = 1 - sSickle
  const wBar = p * p * (1 - sMalaria) + 2 * p * q * 1.0 + q * q * (1 - sSickle);
  const qEquilibrium = sMalaria / (sMalaria + sSickle);
  return { p, q, wBar, qEquilibrium };
}

export function fitnessLandscapeHeight(x = 0, y = 0, antibioticShift = 0) {
  const d1 = (x + 0.65) * (x + 0.65) + y * y;
  const d2 = (x - 0.65) * (x - 0.65) + y * y;
  const peakWild = (1 - antibioticShift * 0.75) * Math.exp(-d1 * 2.2);
  const peakMutant = (0.35 + antibioticShift * 0.85) * Math.exp(-d2 * 2.2);
  return 0.15 + 1.45 * Math.max(peakWild, peakMutant);
}
