// Chapter 8 pure model: direct Zn/Cu electron-transfer ledger,
// Daniell galvanic vs electrolytic cell voltage, and Faraday electrolysis stoichiometry.
export const FARADAY = 96485.33; // C/mol e-

export function znCuTransferLedger(pairsTransferred = 2, initialZnStrip = 6, initialCuIons = 6) {
  const k = Math.max(0, Math.min(initialZnStrip, initialCuIons, Math.round(pairsTransferred)));
  const znStrip = initialZnStrip - k;
  const znIons = k;
  const cuIons = initialCuIons - k;
  const cuPlated = k;
  const electronsMoved = 2 * k;
  return { pairsTransferred: k, znStrip, znIons, cuIons, cuPlated, electronsMoved };
}

export function electrochemicalCellState(appliedVoltageV = 0.0, eAnodeV = -0.76, eCathodeV = 0.34) {
  const eCellStd = eCathodeV - eAnodeV; // +1.10 V for Zn/Cu
  const vExt = Math.max(0, Math.min(2.5, appliedVoltageV));
  const netDrivingV = eCellStd - vExt;
  const mode =
    vExt < 0.01 ? 'Spontaneous galvanic discharge (chemical → electrical work)' :
    netDrivingV > 0.02 ? 'Galvanic discharge opposed by external load' :
    Math.abs(netDrivingV) <= 0.02 ? 'Reversible zero-current balance (V_ext ≈ E_cell)' :
    'Driven electrolytic charging (electrical work drives non-spontaneous reverse reaction)';
  return { eCellStd, appliedVoltageV: vExt, netDrivingV, mode };
}

export function faradayElectrolysis(currentAmps = 2.0, timeMinutes = 15, electronsPerIon = 2, molarMassG = 63.55) {
  const I = Math.max(0, currentAmps);
  const tSec = Math.max(0, timeMinutes) * 60;
  const chargeCoulombs = I * tSec;
  const molesElectrons = chargeCoulombs / FARADAY;
  const molesMetal = molesElectrons / Math.max(1, electronsPerIon);
  const massGrams = molesMetal * molarMassG;
  return { currentAmps: I, timeMinutes, chargeCoulombs, molesElectrons, molesMetal, massGrams };
}
