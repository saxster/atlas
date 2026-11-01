// Chapter 9 pure model: Hodgkin-Huxley action potential wave & TTX block, synaptic cleft delay, eye lens accommodation, and auxin phototropism.
export function actionPotentialWave(tMs = 2.0, stimUa = 12, ttxBlockPct = 0) {
  const gNaScale = Math.max(0, 1 - ttxBlockPct / 100);
  const thresholdReached = stimUa * gNaScale >= 8.0;
  if (!thresholdReached) {
    const subV = -70 + stimUa * gNaScale * 1.6 * Math.exp(-Math.max(0, tMs - 1) / 1.5);
    return { tMs, vMv: subV, gNa: 0.5, gK: 1.0, fired: false, phase: 'Subthreshold (resting −70 mV)' };
  }
  const u = Math.max(0, tMs - 1.0);
  const depol = 110 * Math.pow(u / 0.8, 2) * Math.exp(-u / 0.55) * gNaScale;
  const hyper = -18 * Math.pow(u / 2.2, 3) * Math.exp(-u / 1.1);
  const vMv = Math.max(-82, Math.min(40, -70 + depol + hyper));
  const gNa = 35 * Math.pow(u / 0.7, 2) * Math.exp(-u / 0.48) * gNaScale;
  const gK = 1 + 24 * Math.pow(u / 1.8, 3) * Math.exp(-u / 0.95);
  const phase = u < 0.9 ? 'Depolarisation (Na⁺ rush in)' : u < 2.2 ? 'Repolarisation (K⁺ rush out)' : u < 3.8 ? 'Refractory hyperpolarisation' : 'Resting (−70 mV)';
  return { tMs, vMv, gNa, gK, fired: true, phase };
}

export function eyeOpticsAccount(objectDistM = 0.35, luxLevel = 50, retinaDistMm = 17.0) {
  const doMm = Math.max(200, objectDistM * 1000);
  const fRequiredMm = 1 / (1 / doMm + 1 / retinaDistMm);
  const powerDioptres = 1000 / fRequiredMm;
  const ciliaryTension = Math.min(1, Math.max(0, (powerDioptres - 58.8) / 3.8));
  const pupilDiamMm = 7.2 - 5.0 * (Math.max(0, Math.min(100, luxLevel)) / 100);
  return { objectDistM, fRequiredMm, powerDioptres, ciliaryTension, pupilDiamMm };
}

export function auxinTropismAccount(lightAngleDeg = 30) {
  const shadedFraction = 0.5 + 0.32 * Math.sin((lightAngleDeg * Math.PI) / 180);
  const bendAngleDeg = lightAngleDeg * 0.78;
  return { lightAngleDeg, shadedFraction, illuminatedFraction: 1 - shadedFraction, bendAngleDeg };
}
