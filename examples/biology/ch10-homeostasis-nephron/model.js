// Chapter 10 pure model: insulin/glucagon glucose feedback, skin thermoregulation, kidney nephron filtration/reabsorption, and vaccine memory.
export function glucoseHomeostasisAccount(mealCarbG = 60, insulinCapacityPct = 100) {
  const ins = Math.max(5, Math.min(100, insulinCapacityPct)) / 100;
  const peakBloodGlucoseMgDl = 90 + (mealCarbG * 1.45) / (0.25 + 0.75 * ins);
  const glycogenStoredG = mealCarbG * 0.65 * ins;
  const renalGlucoseExcretionMgMin = Math.max(0, peakBloodGlucoseMgDl / 100 * 125 - 330); // Chosen recovery rate, GFR125.
  return { mealCarbG, insulinCapacityPct, peakBloodGlucoseMgDl, glycogenStoredG, renalGlucoseExcretionMgMin };
}

export function nephronLedgerAccount(gfrMlMin = 125, adhLevelPct = 60, bloodGlucoseMgDl = 95) {
  const filtrateLPerDay = (gfrMlMin * 1440) / 1000; // 180 L/day
  const glucoseReabsorbedPct = 100 * Math.min(330, bloodGlucoseMgDl / 100 * gfrMlMin) / (bloodGlucoseMgDl / 100 * gfrMlMin);
  const adh = Math.max(0, Math.min(100, adhLevelPct)) / 100;
  const waterReabsorbedPct = 98.0 + 1.4 * adh; // 98.0% to 99.4%
  const urineLPerDay = filtrateLPerDay * (1 - waterReabsorbedPct / 100);
  const urineOsmolarityMosm = 120 + 1080 * adh;
  return { gfrMlMin, filtrateLPerDay, glucoseReabsorbedPct, waterReabsorbedPct, urineLPerDay, urineOsmolarityMosm };
}

// The paired 2D lab's antibody curves (kym_bio homeostasis_model.js, immunityVaccineAccount mode 0), restated here so the
// chapter needs nothing outside the atlas: a primary response has no memory; a secondary one has 90% memory.
const round1 = v => Math.round(v * 10) / 10;
function antibodyAU(day, memoryPct) {
  if (memoryPct >= 40) {
    if (day < 1) return 0;
    const t = day - 0.5, scale = 0.25 + 0.75 * (memoryPct / 100);
    return round1(220 * scale * (t / 6.5) * Math.exp(1 - t / 6.5) + 18 * scale);
  }
  if (day <= 4) return 0;
  const t = day - 4;
  return round1(28 * (t / 10) * Math.exp(1 - t / 10));
}

export function immuneMemoryAccount(day = 6, responseType = 'secondary') {
  const n = Number(day), d = Number.isFinite(n) ? Math.max(0, Math.min(42, n)) : 0;
  return { day: d, responseType, antibodyTitre: antibodyAU(d, responseType === 'primary' ? 0 : 90),
    peakDay: responseType === 'primary' ? 14 : 7 };
}
