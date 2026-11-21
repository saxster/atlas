// Pure mathematical model for Figure CT.2: Wald's Survivorship Bias & VW Emissions Test Rigging.
// Zero DOM, zero Three.js imports.
export const DURATION = 7.5;

// Abraham Wald 1943 bomber survivorship model:
// Observed bullet density per sq ft on returning planes (fuselage 1.73, fuel 1.55, rest 1.80, engine 1.11).
// Lower density on engines among survivors indicates higher fatality rate when engines are struck.
export const WALD_ZONES = [
  { id: 'engine', label: 'Engine / Cockpit', returningHitsPerSqFt: 1.11, trueStrikeRate: 1.70 },
  { id: 'fuel', label: 'Fuel System', returningHitsPerSqFt: 1.55, trueStrikeRate: 1.70 },
  { id: 'fuselage', label: 'Fuselage', returningHitsPerSqFt: 1.73, trueStrikeRate: 1.70 },
  { id: 'tail', label: 'Wings / Tail', returningHitsPerSqFt: 1.80, trueStrikeRate: 1.70 },
];

export function waldSurvivorship({ uniformHitRate = 1.80 } = {}) {
  const zones = WALD_ZONES.map(z => {
    const survivalGivenHit = Math.min(1, z.returningHitsPerSqFt / uniformHitRate);
    const lossGivenHit = 1 - survivalGivenHit;
    return {
      ...z,
      survivalGivenHit,
      lossGivenHit,
    };
  });
  const deadliest = zones.reduce((a, b) => (a.lossGivenHit > b.lossGivenHit ? a : b));
  const mostBulletHolesVisible = zones.reduce((a, b) => (a.returningHitsPerSqFt > b.returningHitsPerSqFt ? a : b));
  return { zones, deadliest, mostBulletHolesVisible };
}

// VW EA189 Lab-vs-Road NOx emissions model (ICCT / WVU 2014):
// In regulated dynamometer cycle: <= 0.043 g/km (US Tier 2 Bin 5 / ~0.07 g/mi).
// On real highway driving with defeat device active: 15x to 35x limit.
export function emissionsScope({ onRoad = 1, defeatMultiplier = 28 } = {}) {
  const labLimit = 0.043; // g/km equivalent baseline
  const labEmission = 0.038;
  const roadEmission = labEmission * defeatMultiplier;
  const activeEmission = onRoad ? roadEmission : labEmission;
  const ratioToLimit = activeEmission / labLimit;
  return {
    labLimit,
    labEmission,
    roadEmission,
    activeEmission,
    ratioToLimit,
    passesLab: labEmission <= labLimit,
    passesRoad: roadEmission <= labLimit,
  };
}

export function run({ defeatMultiplier = 28, onRoad = 1, buggy = 0 } = {}) {
  const wald = waldSurvivorship();
  const em = emissionsScope({ onRoad, defeatMultiplier });
  return { defeatMultiplier, onRoad: onRoad ? 1 : 0, buggy: buggy ? 1 : 0, wald, em };
}

export function snapshot(e, t) {
  const frac = Math.max(0, Math.min(1, t / DURATION));
  const nox = (e.buggy || !e.onRoad) ? e.em.labEmission : e.em.labEmission + (e.em.roadEmission - e.em.labEmission) * frac;
  const ratio = nox / e.em.labLimit;
  return { frac, nox, ratio };
}
