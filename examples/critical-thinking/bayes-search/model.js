// Pure mathematical model for Figure CT.5: AF447 Bayesian Ocean Search Updating & Regression to the Mean.
// Zero DOM, zero Three.js imports.
export const DURATION = 7.5;

// Bayesian search grid: 4 ocean sectors (40nm circle divided into Zones A..D).
// Sweeping Zone A with imperfect detection probability pd reduces P(in A | miss) while increasing P(in other sectors | miss).
export function searchUpdate({
  priorA = 0.55,
  pd = 0.70,
  sweepsOnA = 2,
} = {}) {
  const restEach = (1 - priorA) / 3;
  // Likelihood of k consecutive misses in Sector A if wreck IS in A: (1 - pd)^k; if NOT in A: 1^k = 1
  const likMissInA = Math.pow(1 - pd, sweepsOnA);
  const unnormA = priorA * likMissInA;
  const unnormRest = restEach * 1;
  const totalZ = unnormA + 3 * unnormRest;
  const postA = totalZ > 0 ? unnormA / totalZ : 0;
  const postEachOther = totalZ > 0 ? unnormRest / totalZ : 0;
  const pFoundAfterK = 1 - totalZ;
  return {
    priorA,
    restEach,
    pd,
    sweepsOnA,
    postA,
    postEachOther,
    pFoundAfterK,
    buggyPostA: sweepsOnA > 0 ? 0 : priorA,
  };
}

// Regression to the mean: speed camera installed after extreme spike year (e.g. 24 accidents vs mean 10).
export function regressionStep({ baselineMean = 10, extremeSpike = 24, correlation = 0.40 } = {}) {
  const expectedNextNatural = baselineMean + correlation * (extremeSpike - baselineMean);
  const naturalDrop = extremeSpike - expectedNextNatural;
  const naturalDropPct = extremeSpike > 0 ? (naturalDrop / extremeSpike) * 100 : 0;
  return { baselineMean, extremeSpike, correlation, expectedNextNatural, naturalDrop, naturalDropPct };
}

export function run({ priorA = 0.55, pd = 0.70, sweepsOnA = 2, buggy = 0 } = {}) {
  const search = searchUpdate({ priorA, pd, sweepsOnA });
  const reg = regressionStep();
  return { priorA, pd, sweepsOnA, buggy: buggy ? 1 : 0, search, reg };
}

export function snapshot(e, t) {
  const frac = Math.max(0, Math.min(1, t / DURATION));
  const stepSweeps = e.sweepsOnA * frac;
  const s = searchUpdate({ priorA: e.priorA, pd: e.pd, sweepsOnA: stepSweeps });
  return { frac, stepSweeps, ...s };
}
