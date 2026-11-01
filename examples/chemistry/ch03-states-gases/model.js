// Chapter 3 pure model: phase transition enthalpy & state classification,
// ideal gas law PV = nRT & root-mean-square speed, and aqueous molarity / hydration.
export const R_GAS = 0.082057; // L·atm/(mol·K)

export function waterStateAtHeat(addedHeatJg = 1200) {
  const q = Math.max(0, Math.min(3200, addedHeatJg));
  // Starting from ice at -20 °C:
  // 0..42 J/g: warming ice to 0 °C
  // 42..376 J/g: melting plateau at 0 °C (Lf = 334 J/g)
  // 376..794 J/g: warming liquid water 0 °C -> 100 °C (418 J/g)
  // 794..3054 J/g: boiling plateau at 100 °C (Lv = 2260 J/g)
  let tempC = -20;
  let phase = 'Solid ice (hexagonal H-bond lattice)';
  if (q < 42) {
    tempC = -20 + (q / 42) * 20;
  } else if (q < 376) {
    tempC = 0;
    phase = 'Melting plateau (0 °C: ice + liquid water)';
  } else if (q < 794) {
    tempC = ((q - 376) / 418) * 100;
    phase = 'Liquid water (tumbling H-bond network)';
  } else if (q < 3054) {
    tempC = 100;
    phase = 'Boiling plateau (100 °C: liquid + water vapour)';
  } else {
    tempC = 100 + ((q - 3054) / 2.0);
    phase = 'Water vapour (widely separated gas molecules)';
  }
  return { addedHeatJg: q, tempC, phase };
}

export function idealGasPiston(volumeL = 2.0, tempK = 300, moles = 0.10) {
  const V = Math.max(0.5, Math.min(5.0, volumeL));
  const T = Math.max(150, Math.min(600, tempK));
  const n = Math.max(0.01, moles);
  const pressureAtm = (n * R_GAS * T) / V;
  // v_rms for N2 (M = 0.028013 kg/mol): sqrt(3 R T / M)
  const vRmsMs = Math.sqrt((3 * 8.31446 * T) / 0.028013);
  return { volumeL: V, tempK: T, moles: n, pressureAtm, vRmsMs };
}

export function solutionMolarity(soluteMol = 0.50, volumeL = 1.0) {
  const n = Math.max(0.05, Math.min(3.0, soluteMol));
  const V = Math.max(0.2, Math.min(4.0, volumeL));
  const molarity = n / V;
  return { soluteMol: n, volumeL: V, molarity };
}
