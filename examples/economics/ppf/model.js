// Pure mathematical model for Figure E.3: Comparative Advantage & the Production Possibility Frontier (PPF).
// Covers Island A (100 grain or 50 cloth), Highland B (60 grain or 60 cloth), opportunity costs,
// joint kinked World PPF, autarky (80G, 55C) vs. specialization (100G, 60C), and trade at 1.5 grain per cloth.
// Zero DOM, zero Three.js imports.

export const G_A_MAX = 100; // Island A max grain (tons)
export const C_A_MAX = 50;  // Island A max cloth (bales)
export const G_B_MAX = 60;  // Highland B max grain (tons)
export const C_B_MAX = 60;  // Highland B max cloth (bales)

// Opportunity costs: how much grain is given up per 1 bale of cloth, and reciprocals
export const OPP_COST_CLOTH_A = G_A_MAX / C_A_MAX; // 2.0 grain per cloth
export const OPP_COST_GRAIN_A = C_A_MAX / G_A_MAX; // 0.5 cloth per grain
export const OPP_COST_CLOTH_B = G_B_MAX / C_B_MAX; // 1.0 grain per cloth
export const OPP_COST_GRAIN_B = C_B_MAX / G_B_MAX; // 1.0 cloth per grain

// Terms of trade: 1 bale of cloth = 1.5 tons of grain (strictly between B's cost 1.0 and A's cost 2.0)
export const TOT_GRAIN_PER_CLOTH = 1.5;
export const TRADE_CLOTH = 30;
export const TRADE_GRAIN = TRADE_CLOTH * TOT_GRAIN_PER_CLOTH; // 45

// Solo PPFs: maximum grain G as a function of cloth C
export function ppfGrainA(C) {
  return Math.max(0, G_A_MAX - OPP_COST_CLOTH_A * Math.max(0, Math.min(C_A_MAX, C)));
}

export function ppfGrainB(C) {
  return Math.max(0, G_B_MAX - OPP_COST_CLOTH_B * Math.max(0, Math.min(C_B_MAX, C)));
}

// Joint World PPF: maximum world grain G as a function of total world cloth C ∈ [0, 110].
// Low-opportunity-cost cloth producer (Highland B, cost = 1 G/C) makes the first 60 cloth while A makes 100 grain;
// beyond C = 60, Island A converts grain into cloth at cost 2 G/C.
export function worldPpfGrain(C) {
  const c = Math.max(0, Math.min(C_A_MAX + C_B_MAX, C));
  if (c <= C_B_MAX) {
    return G_A_MAX + (G_B_MAX - OPP_COST_CLOTH_B * c); // 160 − 1·C on [0, 60]
  }
  return G_A_MAX - OPP_COST_CLOTH_A * (c - C_B_MAX);   // 100 − 2·(C − 60) on [60, 110]
}

// Production and consumption bundles for a specialization share u ∈ [0, 1] and trade share v ∈ [0, 1].
// u = 0: Autarky 50/50 split → A makes (25C, 50G), B makes (30C, 30G), World = (55C, 80G).
// u = 1: Full comparative-advantage specialization → A makes (0C, 100G), B makes (60C, 0G), World = (60C, 100G).
// v = 1 (at u = 1): A exports 45G for 30C → A consumes (30C, 55G), B consumes (30C, 45G).
export function stateAt(u = 0, v = 0, price = TOT_GRAIN_PER_CLOTH) {
  const uu = Math.max(0, Math.min(1, u));
  const vv = Math.max(0, Math.min(1, v));

  // Production (cloth, grain)
  const prodA = { C: 25 * (1 - uu), G: 50 + 50 * uu };
  const prodB = { C: 30 + 30 * uu, G: 30 * (1 - uu) };
  const world = { C: prodA.C + prodB.C, G: prodA.G + prodB.G };

  // Trade transfer: B sends dC = 30·vv cloth to A; A sends dG = price·dC grain to B
  const dC = TRADE_CLOTH * vv;
  const dG = price * dC;
  const consA = { C: prodA.C + dC, G: prodA.G - dG };
  const consB = { C: prodB.C - dC, G: prodB.G + dG };

  return { u: uu, v: vv, prodA, prodB, world, consA, consB, dC, dG };
}
