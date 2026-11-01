// Chapter 7 pure model: work-kinetic energy clay dent (d prop v^2), inelastic bounce restitution, household kWh billing, and Carnot city efficiency.
export function clayDentDepthCm(massKg = 1.0, speedMps = 4.0, clayResistN = 400) {
  const keJ = 0.5 * massKg * speedMps * speedMps;
  const depthM = keJ / Math.max(10, clayResistN);
  return { keJ, depthCm: depthM * 100 };
}

export function inelasticBounceSequence(dropHeightM = 1.6, restitutionE = 0.75) {
  const e = Math.max(0, Math.min(0.98, restitutionE));
  const h1 = dropHeightM * e * e;
  const h2 = h1 * e * e;
  const h3 = h2 * e * e;
  const thermalFractionFirstBounce = 1 - e * e;
  return { h0: dropHeightM, h1, h2, h3, thermalFractionFirstBounce };
}

export function householdBillCalc(powerWatts = 1500, hoursPerDay = 6, days = 30, rateInrPerKwh = 8.0) {
  const kwhPerDay = (powerWatts * hoursPerDay) / 1000;
  const totalKwh = kwhPerDay * days;
  const totalMegajoules = totalKwh * 3.6;
  const costInr = totalKwh * rateInrPerKwh;
  return { kwhPerDay, totalKwh, totalMegajoules, costInr };
}
