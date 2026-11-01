// Chapter 5 pure model: bond-enthalpy accounting, Arrhenius activation barrier & catalysis,
// and reversible dynamic equilibrium with Le Chatelier perturbations.
export const R_KJ = 0.00831446; // kJ/(mol·K)

export function bondEnthalpyLedger(brokenKj = 1370, formedKj = 1852) {
  const broken = Math.max(100, brokenKj);
  const formed = Math.max(100, formedKj);
  // Delta H = sum(bonds broken) - sum(bonds formed)
  const deltaHKj = broken - formed;
  const classification = deltaHKj < 0 ? 'Exothermic (releases heat to surroundings)' : deltaHKj > 0 ? 'Endothermic (absorbs heat from surroundings)' : 'Thermoneutral';
  return { brokenKj: broken, formedKj: formed, deltaHKj, classification };
}

export function arrheniusBarrier(eaKj = 75, tempK = 298, catalyzed = false) {
  const T = Math.max(250, Math.min(500, tempK));
  const rawEa = Math.max(20, Math.min(120, eaKj));
  const effectiveEa = catalyzed ? rawEa * 0.58 : rawEa;
  const boltzmannFrac = Math.exp(-effectiveEa / (R_KJ * T));
  const relativeRate = boltzmannFrac / Math.exp(-75 / (R_KJ * 298));
  return { rawEa, effectiveEa, tempK: T, catalyzed, boltzmannFrac, relativeRate };
}

export function dynamicEquilibriumState(kf = 1.2, kr = 0.6, initialA = 1.0, initialB = 0.0) {
  const f = Math.max(0.1, kf);
  const r = Math.max(0.1, kr);
  const Keq = f / r;
  const total = Math.max(0.1, initialA + initialB);
  // At equilibrium: kf * [A]_eq = kr * [B]_eq => [B]_eq / [A]_eq = Keq
  const aEq = total / (1 + Keq);
  const bEq = total - aEq;
  const forwardRateEq = f * aEq;
  const reverseRateEq = r * bEq;
  return { kf: f, kr: r, Keq, aEq, bEq, forwardRateEq, reverseRateEq };
}
