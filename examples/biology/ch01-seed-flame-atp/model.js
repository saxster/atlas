// Chapter 1 pure model: monsoon seed imbibition, coupled enzymatic staircase vs uncontrolled flame, ATP turnover, and viral capsid geometry.
export const GLUCOSE_DELTA_G_KJ = 2870;
export const ATP_HYDROLYSIS_KJ = 30.5;

export function imbibitionState(hours = 6, dryMatricMPa = -95, ratePerHr = 0.28) {
  const h = Math.max(0, hours);
  const psiMatricMPa = dryMatricMPa * Math.exp(-ratePerHr * h);
  const waterUptakePct = 115 * (1 - Math.exp(-ratePerHr * h));
  const testaRuptured = waterUptakePct >= 62;
  return { hours: h, psiMatricMPa, waterUptakePct, testaRuptured };
}

export function coupledOxidationBudget(atpPerGlucose = 32, efficiencyOverride = null) {
  const nAtp = Math.max(0, Math.min(38, atpPerGlucose));
  const capturedKj = nAtp * ATP_HYDROLYSIS_KJ;
  const efficiency = efficiencyOverride ?? (capturedKj / GLUCOSE_DELTA_G_KJ);
  const heatKj = Math.max(0, GLUCOSE_DELTA_G_KJ - capturedKj);
  return { nAtp, capturedKj, heatKj, efficiency };
}

export function capsidTriangulation(h = 2, k = 1) {
  const hi = Math.max(0, h | 0), ki = Math.max(0, k | 0);
  const T = hi * hi + hi * ki + ki * ki;
  const capsomeres = 10 * (T - 1) + 12;
  const subunits = 60 * T;
  return { h: hi, k: ki, T, capsomeres, subunits };
}
