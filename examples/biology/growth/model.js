// Bacterial division and carrying capacity in a Petri dish. Pure functions — no DOM, no Three.js.
//
// With plenty of sugar and space, each bacterium divides on a regular schedule: dN/dt = rN, which integrates to
// N_exp(t) = N₀ · e^(rt) = N₀ · 2^(t / T_d) with doubling time T_d = ln 2 / r = 1 hour.
// In a real dish of finite sugar K, each existing cell consumes a share 1/K of the remaining capacity, slowing division
// by the crowding factor (1 − N/K). That gives Verhulst's logistic equation:
//   dN/dt = r · N · (1 − N / K),     N(t) = K / (1 + ((K − N₀)/N₀) · e^(−rt)).
// Growth is fastest not at the beginning (too few cells) and not at the end (no sugar left), but halfway up at N = K/2.
import { rng } from '@saxster/atlas/rng.js';

export const N0 = 4;                                // founding cells placed on the agar at t = 0
export const R = Math.LN2;                          // intrinsic growth rate (hr⁻¹): 1 doubling every hour when unconstrained
export const K = 240;                               // carrying capacity of the full-sugar dish (cells)
export const K_HALF = 120;                          // carrying capacity with half the nutrient broth
export const HOURS = 10;                            // total hours on the timeline
export const DISH_R = 1.48;                         // Petri dish inner radius (world units)

export const doublingTime = (r = R) => Math.LN2 / r;
export const expPop = (t, n0 = N0, r = R) => n0 * Math.exp(r * t);
export const expRate = (t, n0 = N0, r = R) => r * expPop(t, n0, r);

export const logisticPop = (t, k = K, n0 = N0, r = R) =>
  k / (1 + ((k - n0) / n0) * Math.exp(-r * t));

export const logisticRate = (t, k = K, n0 = N0, r = R) => {
  const n = logisticPop(t, k, n0, r);
  return r * n * (1 - n / k);
};

// remaining fraction of open nutrient capacity (1 − N/K)
export const openShare = (t, k = K, n0 = N0, r = R) => 1 - logisticPop(t, k, n0, r) / k;

// inflection point t* where N(t*) = K/2 and dN/dt reaches its maximum rK/4
export const inflectionTime = (k = K, n0 = N0, r = R) => Math.log((k - n0) / n0) / r;
export const peakRate = (k = K, r = R) => (r * k) / 4;

// deterministic positions of up to maxN cells on the circular agar plate, spreading outward from the founding 4 cells
export function colonySpots(maxN = K, radius = DISH_R, seed = 11) {
  const g = rng(seed), golden = Math.PI * (3 - Math.sqrt(5));
  return Array.from({ length: maxN }, (_, i) => {
    const frac = (i + 0.5) / maxN;
    const r = radius * 0.92 * Math.sqrt(frac) * (0.92 + 0.08 * g.next());
    const ang = i * golden + (g.next() - 0.5) * 0.28;
    return { x: r * Math.cos(ang), z: r * Math.sin(ang) };
  });
}
