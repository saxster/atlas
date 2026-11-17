// Chosen illustrative parameters, not fitted seed measurements or a cellular efficiency prediction.
// Chapter 1 pure model: monsoon seed imbibition, hydration mass accounting, coupled enzymatic staircase vs uncoupled flame/buggy-world myth, ATP turnover, and viral capsid geometry.
export const GLUCOSE_DELTA_G_KJ = 2870;
export const ATP_HYDROLYSIS_KJ = 30.5;
export const MINUTES_PER_DAY = 1440;

export function imbibitionState(hours = 6, dryMatricMPa = -95, ratePerHr = 0.28, buggyWorld = false) {
  const h = Math.max(0, hours);
  if (buggyWorld) {
    // Buggy-world myth: dry seed is "dead" (zero water uptake or permanently inert vitrified brick)
    return { hours: h, psiMatricMPa: dryMatricMPa, waterUptakePct: 0, testaRuptured: false, buggyWorld: true };
  }
  const psiMatricMPa = dryMatricMPa * Math.exp(-ratePerHr * h);
  const waterUptakePct = 115 * (1 - Math.exp(-ratePerHr * h));
  const testaRuptured = waterUptakePct >= 62; // Chosen drawing transition only, not a biological threshold.
  return { hours: h, psiMatricMPa, waterUptakePct, testaRuptured, buggyWorld: false };
}

export function hydrationMassBalance(dryTotalG = 50, initialWaterFraction = 0.10, targetWaterFraction = 0.65, addedWaterG = 55) {
  const initialWaterG = dryTotalG * initialWaterFraction;
  const fixedDrySolidsG = dryTotalG - initialWaterG;
  const targetTotalG = fixedDrySolidsG / (1 - targetWaterFraction);
  const soakedTotalG = dryTotalG + addedWaterG;
  const soakedWaterG = initialWaterG + addedWaterG;
  const soakedWaterPct = (soakedWaterG / soakedTotalG) * 100;
  return {
    initialWaterG,
    fixedDrySolidsG,
    targetTotalG,
    soakedTotalG,
    soakedWaterG,
    soakedWaterPct,
  };
}

export function coupledOxidationBudget(atpPerGlucose = 32, efficiencyOverride = null, buggyWorld = false) {
  const nAtp = buggyWorld ? 0 : Math.max(0, Math.min(38, atpPerGlucose));
  const capturedKj = nAtp * ATP_HYDROLYSIS_KJ;
  const efficiency = buggyWorld ? 0 : (efficiencyOverride ?? (capturedKj / GLUCOSE_DELTA_G_KJ));
  // Historical field name retained for callers; this is unassigned free energy, not calorimetric heat.
  const heatKj = Math.max(0, GLUCOSE_DELTA_G_KJ - capturedKj);
  return { nAtp, capturedKj, heatKj, efficiency, buggyWorld: Boolean(buggyWorld) };
}

export function atpTurnoverSchedule(poolG = 50, dailyTurnoverG = 40000) {
  const poolEquivalentsPerDay = dailyTurnoverG / Math.max(1e-6, poolG);
  const minutesPerCycle = MINUTES_PER_DAY / poolEquivalentsPerDay;
  return { poolG, dailyTurnoverG, poolEquivalentsPerDay, minutesPerCycle };
}

export function capsidTriangulation(h = 2, k = 1) {
  const hi = Math.max(0, h | 0), ki = Math.max(0, k | 0);
  const T = hi * hi + hi * ki + ki * ki;
  const capsomeres = 10 * (T - 1) + 12;
  const subunits = 60 * T;
  return { h: hi, k: ki, T, capsomeres, subunits };
}
