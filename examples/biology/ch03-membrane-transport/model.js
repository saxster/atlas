// Chapter 3 pure model: Fick membrane diffusion relaxation, water potential (Psi = Psi_s + Psi_p), osmotic cell states, and active ATPase pumping.
export const R_GAS = 0.008314; // L MPa / (mol K)

export function fickRelaxation(tSec = 2, kPerSec = 0.35, nTotal = 200) {
  const fracLeft = 0.5 * (1 + Math.exp(-2 * Math.max(0, kPerSec) * Math.max(0, tSec)));
  const nLeft = Math.round(nTotal * fracLeft);
  return { tSec, fracLeft, fracRight: 1 - fracLeft, nLeft, nRight: nTotal - nLeft };
}

export function waterPotentialAccount(molarityExt = 0.15, turgorMPa = 0.35, tempK = 298) {
  const psiSoluteExt = -1 * Math.max(0, molarityExt) * R_GAS * tempK * 2.0; // dissociated NaCl i ~ 2
  const psiSoluteCell = -0.74; // ~0.15 M isotonic internal
  const psiCell = psiSoluteCell + Math.max(0, turgorMPa);
  const netPsiDrive = psiSoluteExt - psiCell; // > 0 water enters cell; < 0 water leaves cell
  const rbcState = molarityExt < 0.08 ? 'Lysed (burst)' : molarityExt > 0.24 ? 'Crenated (shrivelled)' : 'Biconcave (isotonic)';
  const plantState = molarityExt < 0.12 ? 'Turgid (firm wall pressure)' : molarityExt > 0.25 ? 'Plasmolysed (membrane peeled)' : 'Flaccid (incipient)';
  return { psiSoluteExt, psiSoluteCell, turgorMPa, psiCell, netPsiDrive, rbcState, plantState };
}

export function activePumpFlux(atpMm = 3.0, kmAtp = 0.5, gradientRatio = 10) {
  const a = Math.max(0, atpMm);
  const vPump = (100 * a) / (kmAtp + a);
  const deltaGKj = 5.7 * Math.log10(Math.max(1, gradientRatio));
  return { atpMm: a, vPump, deltaGKj, uphillPossible: a > 0.05 };
}
