// Pure mathematical model for Figure E.4: The Keynesian Multiplier & Circular Flow of Income.
// Covers injection ΔG = ₹100 Cr, Marginal Propensity to Consume c = 0.75, Marginal Propensity to Save s = 1 − c = 0.25,
// geometric series Y_n = ΔG·(1 − c^n)/(1 − c), cumulative savings leakage S_n = (1 − c)Y_n, and Keynesian Cross AE(Y) = Y.
// Zero DOM, zero Three.js imports.

export const DELTA_G = 100;           // Initial spending injection (₹ Cr)
export const MPC = 0.75;              // Marginal Propensity to Consume c
export const MPS = 1 - MPC;           // Marginal Propensity to Save s = 0.25
export const MULTIPLIER = 1 / MPS;    // k = 1 / (1 − c) = 4.0
export const Y_INF = DELTA_G * MULTIPLIER; // ₹400 Cr total cumulative income
export const S_INF = DELTA_G;         // ₹100 Cr total cumulative savings leakage
export const N_ROUNDS = 12;           // Number of discrete rounds displayed as bars

// roundSpending(k): spending ΔY_k = ΔG · c^k in round k = 0, 1, 2, ...
export function roundSpending(k, dG = DELTA_G, c = MPC) {
  return dG * Math.pow(c, k);
}

// roundSaving(k): savings leakage ΔS_k = (1 − c) · ΔY_k in round k = 0, 1, 2, ...
export function roundSaving(k, dG = DELTA_G, c = MPC) {
  return (1 - c) * roundSpending(k, dG, c);
}

// Closed-form cumulative income after n rounds (k = 0 .. n − 1), also continuous for fractional n ≥ 0
export function cumulativeIncome(n, dG = DELTA_G, c = MPC) {
  if (n <= 0) return 0;
  return dG * (1 - Math.pow(c, n)) / (1 - c);
}

// Explicit partial sum ∑_{k=0}^{n-1} ΔG · c^k for integer n
export function sumIncomeRounds(n, dG = DELTA_G, c = MPC) {
  let s = 0;
  for (let k = 0; k < n; k++) s += roundSpending(k, dG, c);
  return s;
}

// Cumulative savings leakage after n rounds: S_n = (1 − c) · Y_n
export function cumulativeSaving(n, dG = DELTA_G, c = MPC) {
  return (1 - c) * cumulativeIncome(n, dG, c);
}

// Keynesian Cross: Aggregate Expenditure change ΔAE(ΔY) = ΔG + c · ΔY
export function aggregateExpenditure(dY, dG = DELTA_G, c = MPC) {
  return dG + c * dY;
}
