// Chapter 5 pure model: stoichiometric mass ledger (6 CO2 + 6 H2O -> C6H12O6 + 6 O2), Blackman 3D limiting surface, and xylem/phloem sap flux.
export function photosynthesisStoichiometry(molesGlucose = 1) {
  const k = Math.max(1, Math.min(6, Math.round(molesGlucose)));
  const co2Moles = 6 * k, h2oMoles = 6 * k, o2Moles = 6 * k;
  const massInG = co2Moles * 44 + h2oMoles * 18; // 264k + 108k = 372k
  const massOutG = k * 180 + o2Moles * 32;       // 180k + 192k = 372k
  return { k, co2Moles, h2oMoles, o2Moles, massInG, massOutG, atomsC: 6 * k, atomsH: 12 * k, atomsO: 18 * k };
}

export function blackmanSurface(light = 60, co2 = 60, tempC = 25) {
  const lCap = Math.max(0, Math.min(100, light));
  const cCap = Math.max(0, Math.min(100, co2));
  const tCap = Math.max(0, 100 - Math.pow(tempC - 25, 2) / 4);
  const gross = Math.min(lCap, cCap, tCap);
  const net = gross - 10; // basal leaf respiration = 10
  const limiting = [];
  if (Math.abs(gross - lCap) < 1e-6) limiting.push('Light');
  if (Math.abs(gross - cCap) < 1e-6) limiting.push('CO₂');
  if (Math.abs(gross - tCap) < 1e-6) limiting.push('Temperature');
  return { light: lCap, co2: cCap, tempC, tCap, gross, net, limiting: limiting.join(' & ') || 'None' };
}

export function vascularSapAccount(humidityPct = 50, light = 60) {
  const vpd = (100 - Math.max(5, Math.min(100, humidityPct))) / 100;
  const stomatalAperture = Math.min(1, 0.15 + 0.85 * (light / 100));
  const xylemVelocityMmPerMin = 12 * vpd * stomatalAperture;
  const phloemSucroseFlux = Math.max(0, (light - 15) * 0.45);
  return { vpd, stomatalAperture, xylemVelocityMmPerMin, phloemSucroseFlux };
}
