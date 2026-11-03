// Chapter 9 pure model: Hodgkin-Huxley action potential wave & TTX block, synaptic cleft delay, eye lens accommodation, and auxin phototropism.
export function actionPotentialWave(tMs = 2.0, stimUa = 12, ttxBlockPct = 0) {
  const gNaScale = Math.max(0, 1 - ttxBlockPct / 100);
  const thresholdReached = stimUa * gNaScale >= 8.0;
  if (!thresholdReached) {
    const subV = -70 + stimUa * gNaScale * 1.6 * Math.exp(-Math.max(0, tMs - 1) / 1.5);
    return { tMs, vMv: subV, gNa: 0.5 * gNaScale, gK: 1.0, fired: false, phase: 'Subthreshold (resting −70 mV)' };
  }
  const u = Math.max(0, tMs - 1.0);
  // Chosen schematic waveform, not an integration of Hodgkin–Huxley equations.
  // A surviving action potential regenerates its amplitude; blockade changes whether it fires.
  const knots = [[0,-70],[0.5,-55],[1,30],[2,-70],[3,-75],[5,-70]];
  let vMv = -70;
  for (let i=1; i<knots.length; i++) {
    if (u >= knots[i-1][0] && u <= knots[i][0]) {
      const [a,va]=knots[i-1], [b,vb]=knots[i];
      vMv=va+(vb-va)*(u-a)/(b-a); break;
    }
  }
  const gNa = 35 * Math.pow(u / 0.7, 2) * Math.exp(-u / 0.48) * gNaScale;
  const gK = 1 + 24 * Math.pow(u / 1.8, 3) * Math.exp(-u / 0.95);
  const phase = u < 1 ? 'Depolarisation (Na⁺ rush in)' : u < 2 ? 'Repolarisation (K⁺ rush out)' : u < 3.8 ? 'Refractory hyperpolarisation' : 'Resting (−70 mV)';
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
  const shadedFraction = 0.5 + 0.32 * Math.abs(Math.sin((lightAngleDeg * Math.PI) / 180));
  const bendAngleDeg = lightAngleDeg * 0.78;
  return { lightAngleDeg, shadedFraction, illuminatedFraction: 1 - shadedFraction, bendAngleDeg };
}
