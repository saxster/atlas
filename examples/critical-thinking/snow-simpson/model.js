// Pure mathematical model for Figure CT.4: John Snow's 1854 Grand Experiment, Confounding & Simpson's Paradox.
// Zero DOM, zero Three.js imports.
export const DURATION = 7.5;

// Snow's 1854 South London water company comparison (deaths in 4 weeks per 10,000 houses):
export const SNOW_DATA = {
  svHouses: 40046,
  svDeaths: 286,
  lambethHouses: 26107,
  lambethDeaths: 14,
};

export function snowComparison() {
  const svRatePer10k = (SNOW_DATA.svDeaths / SNOW_DATA.svHouses) * 10000;
  const lambethRatePer10k = (SNOW_DATA.lambethDeaths / SNOW_DATA.lambethHouses) * 10000;
  const ratio = svRatePer10k / lambethRatePer10k;
  return { ...SNOW_DATA, svRatePer10k, lambethRatePer10k, ratio };
}

// Simpson's Paradox Hospital Mortality Example (A beats B in BOTH mild and severe, loses when pooled due to case mix):
// Center A receives heavy share of critical cases (`severeShareA`), Clinic B receives mostly mild cases (`severeShareB`).
export function simpsonHospitals({ severeShareA = 0.80, severeShareB = 0.20 } = {}) {
  const nTotal = 1000;
  const nASev = Math.round(nTotal * severeShareA);
  const nAMild = nTotal - nASev;
  const nBSev = Math.round(nTotal * severeShareB);
  const nBMild = nTotal - nBSev;

  // True survival rates within each severity stratum (A strictly better in BOTH strata!)
  const survMildA = 0.96, survMildB = 0.90;
  const survSevA = 0.78, survSevB = 0.65;

  const aliveA = nAMild * survMildA + nASev * survSevA;
  const aliveB = nBMild * survMildB + nBSev * survSevB;
  const pooledA = aliveA / nTotal;
  const pooledB = aliveB / nTotal;

  return {
    survMildA, survMildB, survSevA, survSevB,
    pooledA, pooledB,
    aBetterWithinEachStratum: survMildA > survMildB && survSevA > survSevB,
    pooledReversal: pooledB > pooledA,
  };
}

export function run({ severeShareA = 0.80, severeShareB = 0.20, stratified = 1 } = {}) {
  const snow = snowComparison();
  const simpson = simpsonHospitals({ severeShareA, severeShareB });
  return { severeShareA, severeShareB, stratified: stratified ? 1 : 0, snow, simpson };
}

export function snapshot(e, t) {
  const frac = Math.max(0, Math.min(1, t / DURATION));
  return {
    frac,
    svRateVis: e.snow.svRatePer10k * frac,
    lamRateVis: e.snow.lambethRatePer10k * frac,
  };
}
