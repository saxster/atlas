// Chapter 10 pure model: insulin/glucagon glucose feedback, skin thermoregulation, kidney nephron filtration/reabsorption, and vaccine memory.
export function glucoseHomeostasisAccount(mealCarbG = 60, insulinCapacityPct = 100) {
  const ins = Math.max(5, Math.min(100, insulinCapacityPct)) / 100;
  const peakBloodGlucoseMgDl = 90 + (mealCarbG * 1.45) / (0.25 + 0.75 * ins);
  const glycogenStoredG = mealCarbG * 0.65 * ins;
  const renalSpilloverMgDl = Math.max(0, peakBloodGlucoseMgDl - 180); // renal threshold = 180 mg/dL
  return { mealCarbG, insulinCapacityPct, peakBloodGlucoseMgDl, glycogenStoredG, renalSpilloverMgDl };
}

export function nephronLedgerAccount(gfrMlMin = 125, adhLevelPct = 60, bloodGlucoseMgDl = 95) {
  const filtrateLPerDay = (gfrMlMin * 1440) / 1000; // 180 L/day
  const glucoseReabsorbedPct = bloodGlucoseMgDl <= 180 ? 100 : (180 / bloodGlucoseMgDl) * 100;
  const adh = Math.max(0, Math.min(100, adhLevelPct)) / 100;
  const waterReabsorbedPct = 98.0 + 1.4 * adh; // 98.0% to 99.4%
  const urineLPerDay = filtrateLPerDay * (1 - waterReabsorbedPct / 100);
  const urineOsmolarityMosm = 120 + 1080 * adh;
  return { gfrMlMin, filtrateLPerDay, glucoseReabsorbedPct, waterReabsorbedPct, urineLPerDay, urineOsmolarityMosm };
}

export function immuneMemoryAccount(day = 6, responseType = 'secondary') {
  const d = Math.max(0, day);
  if (responseType === 'primary') {
    const ab = d < 4 ? 1 : 1 + 28 * Math.pow((d - 4) / 6, 2) * Math.exp(-(d - 4) / 4.5);
    return { day: d, responseType, antibodyTitre: ab, peakDay: 13 };
  }
  const ab = d < 1 ? 2 : 2 + 240 * Math.pow((d - 1) / 3.5, 2) * Math.exp(-(d - 1) / 3.8);
  return { day: d, responseType, antibodyTitre: ab, peakDay: 4.5 };
}
