// Pure mathematical model for Figure CT.7: Challenger STS-51-L O-Ring Thermal Censorship & Viton Resiliency.
// Zero DOM, zero Three.js imports.
export const DURATION = 7.5;

// Historical Rogers Commission / Dalal-Fowlkes-Hoadley 23 prior Space Shuttle launches before STS-51-L:
// (tempF, damaged = 1 if primary O-ring thermal distress > 0 else 0)
export const PRIOR_LAUNCHES = [
  { flight: 'STS-2', tempF: 70, damaged: 1 },
  { flight: 'STS-3', tempF: 69, damaged: 0 },
  { flight: 'STS-4', tempF: 80, damaged: 0 },
  { flight: 'STS-5', tempF: 68, damaged: 0 },
  { flight: 'STS-6', tempF: 67, damaged: 0 },
  { flight: 'STS-7', tempF: 72, damaged: 0 },
  { flight: 'STS-8', tempF: 73, damaged: 0 },
  { flight: 'STS-9', tempF: 70, damaged: 0 },
  { flight: 'STS-41B', tempF: 57, damaged: 1 },
  { flight: 'STS-41C', tempF: 63, damaged: 1 },
  { flight: 'STS-41D', tempF: 70, damaged: 1 },
  { flight: 'STS-41G', tempF: 78, damaged: 0 },
  { flight: 'STS-51A', tempF: 67, damaged: 0 },
  { flight: 'STS-51C', tempF: 53, damaged: 1 },
  { flight: 'STS-51D', tempF: 67, damaged: 0 },
  { flight: 'STS-51B', tempF: 75, damaged: 0 },
  { flight: 'STS-51G', tempF: 70, damaged: 0 },
  { flight: 'STS-51F', tempF: 81, damaged: 0 },
  { flight: 'STS-51I', tempF: 76, damaged: 0 },
  { flight: 'STS-51J', tempF: 79, damaged: 0 },
  { flight: 'STS-61A', tempF: 75, damaged: 1 },
  { flight: 'STS-61B', tempF: 76, damaged: 0 },
  { flight: 'STS-61C', tempF: 58, damaged: 1 },
];

// Logistic O-ring thermal distress model calibrated to all 23 pre-Challenger flights (Dalal et al., JASA 1989):
// logit(P(distress)) ≈ 15.04 - 0.232 * T_F  (or 5.085 - 0.1156 * T_F for incident count; steeper risk below 53°F).
export function distressProbability(tempF = 31) {
  const z = 15.04 - 0.232 * tempF;
  return 1 / (1 + Math.exp(-z));
}

// Viton rubber spring-back resiliency factor (0 = stiff glass-like at 31°F, 1 = flexible at 75°F)
export function vitonResiliency(tempF = 31) {
  return Math.max(0.06, Math.min(1.0, (tempF - 25) / 50));
}

export function launchSummary() {
  const damagedFlights = PRIOR_LAUNCHES.filter(f => f.damaged === 1);
  const cleanFlights = PRIOR_LAUNCHES.filter(f => f.damaged === 0);
  const avgTempDamaged = damagedFlights.reduce((s, f) => s + f.tempF, 0) / damagedFlights.length;
  const avgTempClean = cleanFlights.reduce((s, f) => s + f.tempF, 0) / cleanFlights.length;
  return {
    totalPrior: PRIOR_LAUNCHES.length,
    damagedCount: damagedFlights.length,
    cleanCount: cleanFlights.length,
    avgTempDamaged,
    avgTempClean,
  };
}

export function run({ tempF = 31, buggyCensored = 0 } = {}) {
  const summary = launchSummary();
  const pDistress = distressProbability(tempF);
  const resiliency = vitonResiliency(tempF);
  return { tempF, buggyCensored: buggyCensored ? 1 : 0, summary, pDistress, resiliency };
}

export function snapshot(e, t) {
  const frac = Math.max(0, Math.min(1, t / DURATION));
  // Sweep temperature down from 75°F warm pad to selected launch tempF over run
  const curTempF = 75 + (e.tempF - 75) * frac;
  const curDistress = distressProbability(curTempF);
  const curResil = vitonResiliency(curTempF);
  return { frac, curTempF, curDistress, curResil };
}
