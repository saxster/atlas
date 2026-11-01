// Chapter 6 pure model: Avogadro mole-mass-particle bridge,
// Haber limiting-reactant stoichiometry (N2 + 3 H2 -> 2 NH3), and percent yield.
export const AVOGADRO = 6.02214076e23;

export function moleSampleBridge(moles = 1.0, molarMassG = 18.015) {
  const n = Math.max(0.1, Math.min(5.0, moles));
  const M = Math.max(1.0, molarMassG);
  const massGrams = n * M;
  const particles = n * AVOGADRO;
  return { moles: n, molarMassG: M, massGrams, particles };
}

export function haberLimitingStoichiometry(nN2 = 2.0, nH2 = 3.0) {
  const n2 = Math.max(0, Math.min(6, nN2));
  const h2 = Math.max(0, Math.min(9, nH2));
  // N2 + 3 H2 -> 2 NH3
  const extentFromN2 = n2 / 1;
  const extentFromH2 = h2 / 3;
  const xi = Math.min(extentFromN2, extentFromH2);
  const nh3Formed = 2 * xi;
  const n2Left = Math.max(0, n2 - xi);
  const h2Left = Math.max(0, h2 - 3 * xi);
  const limiting =
    Math.abs(extentFromN2 - extentFromH2) < 1e-6 ? 'Stoichiometric mixture (neither in excess)' :
    extentFromH2 < extentFromN2 ? 'H₂ is limiting reactant (N₂ in excess)' :
    'N₂ is limiting reactant (H₂ in excess)';
  return { nN2: n2, nH2: h2, xi, nh3Formed, n2Left, h2Left, limiting };
}

export function reactionYieldAccount(theoreticalGrams = 34.0, actualEfficiencyPct = 85) {
  const theo = Math.max(1, theoreticalGrams);
  const pct = Math.max(0, Math.min(100, actualEfficiencyPct));
  const actualGrams = (theo * pct) / 100;
  return { theoreticalGrams: theo, percentYield: pct, actualGrams };
}
