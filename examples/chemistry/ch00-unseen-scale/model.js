// Chapter 0 pure model: observation vs inference ledger, Brownian root-mean-square displacement,
// filtration pore retention, and powers-of-ten scale / dimensional unit cancellation.
export const KB = 1.380649e-23; // J/K (exact SI)
export const H2O_DIAMETER_NM = 0.275; // nm

export function brownianState(tempK = 298, radiusNm = 500, viscosityPas = 0.00089, timeSec = 2) {
  const T = Math.max(250, Math.min(370, tempK));
  const rNm = Math.max(50, Math.min(2500, radiusNm));
  const r = rNm * 1e-9;
  const eta = Math.max(1e-4, viscosityPas);
  const t = Math.max(0.1, timeSec);
  // Stokes-Einstein diffusivity D = k_B T / (6 pi eta r)
  const D = (KB * T) / (6 * Math.PI * eta * r);
  // 2D mean-square displacement <r^2> = 4 D t
  const rmsUm = Math.sqrt(4 * D * t) * 1e6;
  const hitsPerMicrosec = Math.round((T / 298) * 1e8);
  const moleculesAcrossGrain = Math.round((2 * rNm) / H2O_DIAMETER_NM);
  return { tempK: T, radiusNm: rNm, D, rmsUm, hitsPerMicrosec, moleculesAcrossGrain };
}

export function filtrationState(poreNm = 200, sandRadiusNm = 2500, hydratedIonRadiusNm = 0.38) {
  const pore = Math.max(1, Math.min(1000, poreNm));
  const sandRetained = sandRadiusNm > pore;
  const ionPasses = hydratedIonRadiusNm < pore;
  const selectivityRatio = sandRadiusNm / hydratedIonRadiusNm;
  return { poreNm: pore, sandRadiusNm, hydratedIonRadiusNm, sandRetained, ionPasses, selectivityRatio };
}

export function scaleBridge(logMeters = -9) {
  const exp = Math.max(-15, Math.min(0, Math.round(logMeters)));
  const meters = Math.pow(10, exp);
  const nanometers = meters * 1e9;
  const picometers = meters * 1e12;
  const regime =
    exp >= -2 ? 'Laboratory apparatus (cm–m)' :
    exp >= -5 ? 'Optical microscopy / cells (µm)' :
    exp >= -8 ? 'Colloids & viruses (10–100 nm)' :
    exp >= -11 ? 'Molecules & covalent bonds (0.1–1 nm)' :
    'Atomic nucleus (fm–pm)';
  return { exp, meters, nanometers, picometers, regime };
}
