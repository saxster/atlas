// Chapter 12 pure model: triboelectric dipole attraction, Ohmic vs filament vs diode I-V curves, and Earth-wire fault current vs human shock current.
export function ivCharacteristics(voltageV = 3.0, ohmicR = 10) {
  const iOhmicA = voltageV / Math.max(0.5, ohmicR);
  // Tungsten filament resistance rises with temperature: R(V) = R0 * (1 + 0.18 * |V|)
  const rFilament = ohmicR * (1 + 0.18 * Math.abs(voltageV));
  const iFilamentA = voltageV / rFilament;
  // Silicon/LED diode: forward knee ~1.8 V
  const iDiodeA = voltageV > 1.8 ? 0.12 * (Math.exp((voltageV - 1.8) * 1.6) - 1) : 0;
  return { iOhmicA, iFilamentA, iDiodeA, rFilament };
}

export function earthFaultSafety(mainsV = 230, earthLoopOhm = 2.0, bodyOhm = 2000, fuseRatingA = 15) {
  const faultCurrentEarthA = mainsV / Math.max(0.1, earthLoopOhm);
  const fuseTrips = faultCurrentEarthA > fuseRatingA;
  const unEarthedBodyCurrentMa = (mainsV / Math.max(100, bodyOhm)) * 1000;
  return { faultCurrentEarthA, fuseTrips, unEarthedBodyCurrentMa };
}
