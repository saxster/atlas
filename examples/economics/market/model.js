// Pure mathematical model for Figure E.2: Marginal cost, supply, demand & market equilibrium.
// Zero DOM, zero Three.js imports.

export const C0 = 40;         // fixed cost (₹)
export const C1 = 10;         // base marginal cost at Q = 0 (₹/unit)
export const C2 = 1.0;        // marginal cost slope d(MC)/dQ (₹/unit²)
export const P_MAX = 90;      // choke price where demand Q_d = 0 (₹)
export const D_SLOPE = 1.0;   // demand slope −dP_d/dQ (₹/unit)
export const Q_MAX = 60;      // chart horizontal axis ceiling

// Total cost C(Q) = C0 + C1·Q + ½ C2·Q²
export function totalCost(Q) {
  return C0 + C1 * Q + 0.5 * C2 * Q * Q;
}

// Marginal cost MC(Q) = dC/dQ = C1 + C2·Q (the competitive supply price P_s(Q))
export function marginalCost(Q) {
  return C1 + C2 * Q;
}

// Inverse supply P_s(Q) = MC(Q) and direct supply Q_s(P)
export function supplyPrice(Q) {
  return marginalCost(Q);
}

export function quantitySupplied(P) {
  return Math.max(0, (P - C1) / C2);
}

// Inverse demand P_d(Q) = P_MAX − D_SLOPE·Q and direct demand Q_d(P)
export function demandPrice(Q, pMax = P_MAX) {
  return Math.max(0, pMax - D_SLOPE * Q);
}

export function quantityDemanded(P, pMax = P_MAX) {
  return Math.max(0, (pMax - P) / D_SLOPE);
}

// Market equilibrium where P_s(Q*) = P_d(Q*): Q* = 40 units, P* = ₹50
export const Q_STAR = (P_MAX - C1) / (C2 + D_SLOPE); // 40
export const P_STAR = supplyPrice(Q_STAR);           // 50

// Shifted demand (higher willingness to pay P_MAX_SHIFT = 110 → Q* = 50, P* = ₹60)
export const P_MAX_SHIFT = 110;
export const Q_STAR_SHIFT = (P_MAX_SHIFT - C1) / (C2 + D_SLOPE); // 50
export const P_STAR_SHIFT = supplyPrice(Q_STAR_SHIFT);           // 60

// Price ceiling P_CEIL = ₹30 → Q_s = 20, Q_d = 60, shortage = 40, deadweight loss = ₹400
export const P_CEIL = 30;
export const Q_CEIL = quantitySupplied(P_CEIL); // 20

// Consumer surplus ∫₀^Q (P_d(q) − P) dq for trade volume Q ≤ Q* at price P
export function consumerSurplus(Q, P = P_STAR) {
  const q = Math.max(0, Q);
  return (P_MAX - P) * q - 0.5 * D_SLOPE * q * q;
}

// Producer surplus ∫₀^Q (P − MC(q)) dq = P·Q − (C(Q) − C(0))
export function producerSurplus(Q, P = P_STAR) {
  const q = Math.max(0, Q);
  return (P - C1) * q - 0.5 * C2 * q * q;
}

// Total social surplus ∫₀^Q (P_d(q) − MC(q)) dq
export function totalSurplus(Q) {
  return consumerSurplus(Q, P_STAR) + producerSurplus(Q, P_STAR);
}

// Deadweight loss when trade is capped at Q < Q*
export function deadweightLoss(Q) {
  const dq = Math.max(0, Q_STAR - Q);
  return 0.5 * (C2 + D_SLOPE) * dq * dq;
}
