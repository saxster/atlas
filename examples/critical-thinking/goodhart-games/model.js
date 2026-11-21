// Pure mathematical model for Figure CT.6: Goodhart's Law (Wells Fargo Cross-Sell Quota), Strategic Games & Hudson 35s Recognition Delay.
// Zero DOM, zero Three.js imports.
export const DURATION = 7.5;

// Goodhart metric divergence: as target pressure increases without audit, reported accounts (proxy) climb while genuine active client trust drops.
export function goodhartDivergence({ quotaPressure = 0.75, auditStrength = 0.25 } = {}) {
  const effectivePressure = quotaPressure * (1 - 0.7 * auditStrength);
  const proxyAccountsPerCustomer = 2.0 + 4.5 * effectivePressure;
  const unauthorizedShare = Math.min(0.65, Math.max(0, (effectivePressure - 0.20) * 0.75));
  const genuineCustomerTrust = Math.max(0.15, 1.0 - unauthorizedShare * 1.15);
  return {
    effectivePressure,
    proxyAccountsPerCustomer,
    unauthorizedShare,
    genuineCustomerTrust,
    goodhartBroken: quotaPressure > 0.45 && auditStrength < 0.50,
  };
}

// Strategic 2x2 game solver: Prisoner's Dilemma (0), Assurance / Stag Hunt (1), Shared Bill Split (2).
export function gameMatrix(kind = 0) {
  if (kind === 1) {
    // Assurance (Stag Hunt): (Coop,Coop)=(5,5), (Coop,Defect)=(1,3), (Defect,Coop)=(3,1), (Defect,Defect)=(3,3)
    return {
      name: 'Assurance Game (Trust & Verify)',
      payoffs: [[[5, 5], [1, 3]], [[3, 1], [3, 3]]],
      equilibria: ['(Cooperate, Cooperate) = (5, 5)', '(Defect, Defect) = (3, 3)'],
      dominantStrategy: 'None — best response depends on assurance about the partner',
    };
  }
  if (kind === 2) {
    // Shared dinner bill with 6 diners: dish costs £30, personal share £5, joy £12 -> personal net +£7, group loss -£18
    return {
      name: 'Shared Restaurant Bill Spillover',
      payoffs: [[[8, 8], [12, 2]], [[2, 12], [5, 5]]],
      equilibria: ['(Order Expensive, Order Expensive) = (5, 5) < (8, 8)'],
      dominantStrategy: 'Over-order individually when cost splits across 6 diners',
    };
  }
  // Prisoner's Dilemma (Fisheries / Tragedy of Commons)
  return {
    name: 'Prisoner’s Dilemma (Unregulated Fishery)',
    payoffs: [[[4, 4], [1, 6]], [[6, 1], [2, 2]]],
    equilibria: ['(Defect, Defect) = (2, 2) < (4, 4)'],
    dominantStrategy: 'Defect dominates for each individual without binding rules',
  };
}

export function run({ quotaPressure = 0.75, auditStrength = 0.25, gameKind = 0 } = {}) {
  const goodhart = goodhartDivergence({ quotaPressure, auditStrength });
  const game = gameMatrix(gameKind);
  return { quotaPressure, auditStrength, gameKind, goodhart, game };
}

export function snapshot(e, t) {
  const frac = Math.max(0, Math.min(1, t / DURATION));
  const accountsVis = 2.0 + (e.goodhart.proxyAccountsPerCustomer - 2.0) * frac;
  const trustVis = 1.0 - (1.0 - e.goodhart.genuineCustomerTrust) * frac;
  return { frac, accountsVis, trustVis };
}
