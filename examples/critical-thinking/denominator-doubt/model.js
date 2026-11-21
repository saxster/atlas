// Pure mathematical model for Figure CT.1: Missing Denominators, Base Rates & Asymmetric Waiting Risk.
// Zero DOM, zero Three.js imports.
export const DURATION = 7.5;

// Computes per-1,000 incident rates for exposed (beacon/treatment) vs unexposed groups.
export function computeRates({
  totalFleet = 1000,
  exposedShare = 0.95,
  exposedRate = 0.0084,
  unexposedRate = 0.04,
} = {}) {
  const nExposed = Math.round(totalFleet * exposedShare);
  const nUnexposed = Math.max(1, totalFleet - nExposed);
  const eventsExposed = Math.max(0, Math.round(nExposed * exposedRate));
  const eventsUnexposed = Math.max(0, Math.round(nUnexposed * unexposedRate));
  const totalEvents = eventsExposed + eventsUnexposed;
  const rawNumeratorShare = totalEvents > 0 ? eventsExposed / totalEvents : 0;
  const rateExposed = nExposed > 0 ? eventsExposed / nExposed : 0;
  const rateUnexposed = nUnexposed > 0 ? eventsUnexposed / nUnexposed : 0;
  const relativeRisk = rateUnexposed > 0 ? rateExposed / rateUnexposed : 0;
  const unexposedMultiplier = rateExposed > 0 ? rateUnexposed / rateExposed : 0;
  return {
    totalFleet,
    nExposed,
    nUnexposed,
    eventsExposed,
    eventsUnexposed,
    totalEvents,
    rawNumeratorShare,
    rateExposed,
    rateUnexposed,
    relativeRisk,
    unexposedMultiplier,
  };
}

// Asymmetric decision cost when waiting for perfect certainty while continuing an exposed practice.
export function waitingCost({
  hazardProb = 0.35,
  harmIfHazard = 100,
  costOfPrecaution = 12,
} = {}) {
  const expectedHarmWaiting = hazardProb * harmIfHazard;
  const netBenefitPrecaution = expectedHarmWaiting - costOfPrecaution;
  const thresholdProb = harmIfHazard > 0 ? costOfPrecaution / harmIfHazard : 1;
  return {
    expectedHarmWaiting,
    costOfPrecaution,
    netBenefitPrecaution,
    thresholdProb,
    shouldActNow: expectedHarmWaiting > costOfPrecaution,
  };
}

export function run({ exposedShare = 0.95, hazardProb = 0.35, buggy = 0 } = {}) {
  const rates = computeRates({ exposedShare });
  const dec = waitingCost({ hazardProb });
  return { exposedShare, hazardProb, buggy: buggy ? 1 : 0, rates, dec };
}

export function snapshot(e, t) {
  const frac = Math.max(0, Math.min(1, t / DURATION));
  const k = Math.max(1, Math.round(frac * e.rates.totalFleet));
  const evExp = Math.round(e.rates.eventsExposed * frac * 10) / 10;
  const evUnexp = Math.round(e.rates.eventsUnexposed * frac * 10) / 10;
  return { frac, k, evExp, evUnexp };
}
