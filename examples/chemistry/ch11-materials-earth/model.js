// Chapter 11 pure model: rechargeable Li-ion intercalation inventory,
// atmospheric CO2 infrared vibrational absorption, and ocean carbonate buffering.

export function lithiumIonCellState(chargePct = 75, totalLithium = 8) {
  const soc = Math.max(0, Math.min(100, chargePct));
  const atGraphite = Math.round((soc / 100) * totalLithium);
  const atOxide = totalLithium - atGraphite;
  const cellVoltageV = +(3.20 + (soc / 100) * 0.95).toFixed(2);
  return { chargePct: soc, totalLithium, atGraphite, atOxide, cellVoltageV };
}

export function oceanCarbonateBuffer(atmCo2Ppm = 420) {
  const ppm = Math.max(280, Math.min(900, atmCo2Ppm));
  // Pre-industrial 280 ppm -> pH ~8.18; 420 ppm -> pH ~8.06; doubling -> ~7.91
  const pH = +(8.18 - 0.82 * Math.log10(ppm / 280)).toFixed(2);
  // Relative carbonate ion [CO3^2-] availability for CaCO3 calcifiers (% of pre-industrial)
  const carbonatePct = Math.round(100 * Math.pow(280 / ppm, 0.58));
  return { atmCo2Ppm: ppm, pH, carbonatePct };
}
