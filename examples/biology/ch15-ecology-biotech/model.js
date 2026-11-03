// Chapter 15 pure model: Illustrative trophic production pyramid, Lotka-Volterra conserved invariant surface, eutrophication O2 crash, and industrial fermenter / recombinant plasmid.
export function trophicPyramidAccount(producerKj = 10000, transferPct = 10) {
  const eta = Math.max(1, Math.min(25, transferPct)) / 100;
  const herbivoreKj = producerKj * eta;
  const primaryCarnKj = herbivoreKj * eta;
  const apexCarnKj = primaryCarnKj * eta;
  const energyNotTransferredKj = producerKj - herbivoreKj;
  return { producerKj, transferPct, eta, herbivoreKj, primaryCarnKj, apexCarnKj, energyNotTransferredKj };
}

export function lotkaVolterraInvariant(preyR = 1.2, predF = 0.8, alpha = 1.0, beta = 1.0, gamma = 1.0, delta = 1.0) {
  const r = Math.max(0.15, preyR);
  const f = Math.max(0.15, predF);
  // Conserved first integral V(R, F) = delta*R - gamma*ln(R) + beta*F - alpha*ln(F)
  return delta * r - gamma * Math.log(r) + beta * f - alpha * Math.log(f);
}

export function fermenterBiotechAccount(tempC = 37, aerationPct = 85) {
  const tFactor = Math.exp(-Math.pow((tempC - 37) / 9.5, 2));
  const o2Factor = Math.max(0.1, Math.min(1, aerationPct / 80));
  const insulinYieldMgL = 420 * tFactor * o2Factor;
  return { tempC, aerationPct, tFactor, o2Factor, insulinYieldMgL };
}
