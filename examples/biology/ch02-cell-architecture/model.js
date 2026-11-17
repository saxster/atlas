// Chapter 2 pure model: eukaryotic/prokaryotic cell inventory, endosymbiotic membrane amplification, SA/V geometry, and specialist cell factors.
export function cubeGeometry(sideUm = 20, dO2Um2PerSec = 2000, buggyWorld = false) {
  const L = Math.max(1, sideUm);
  const surfaceUm2 = 6 * L * L;
  const volumeUm3 = L * L * L;
  const savPerUm = buggyWorld ? 0.6 : surfaceUm2 / volumeUm3; // 6 / L vs buggy flat SA/V
  const rCoreUm = L / 2;
  const diffusionTimeSec = buggyWorld ? 0.001 : (rCoreUm * rCoreUm) / (6 * dO2Um2PerSec);
  const innerCoreSide = buggyWorld ? 0 : Math.max(0, L - 10);
  const wellFedFraction = 1 - Math.pow(innerCoreSide / L, 3);
  return { sideUm: L, surfaceUm2, volumeUm3, savPerUm, diffusionTimeSec, wellFedFraction };
}

export function cristaeFoldingGain(folds = 6, buggyWorld = false) {
  const f = Math.max(0, folds);
  const areaMultiplier = buggyWorld ? 1.0 : 1 + 0.55 * f;
  const atpFluxRelative = areaMultiplier * 32;
  return { folds: f, areaMultiplier, atpFluxRelative };
}

export function specialistShapeFactor(kind = 'rbc') {
  if (kind === 'rbc') return { name: 'Biconcave red blood cell', savBoost: 1.42, maxPathUm: 1.1 };
  if (kind === 'roothair') return { name: 'Root hair cell', savBoost: 3.15, maxPathUm: 6.5 };
  return { name: 'Myelinated motor neurone', savBoost: 2.2, maxPathUm: 8.0 };
}

// Reference J (Sender, Fuchs & Milo 2016 / BioNumbers BNID 109716 reference human cell census):
export function humanCellCensus(bodyMassKg = 70) {
  const scale = Math.max(0.2, bodyMassKg / 70);
  const totalHumanCells = 3.0e13 * scale;
  const rbcCount = 2.5e13 * scale;
  const rbcFraction = rbcCount / totalHumanCells;
  return { bodyMassKg, totalHumanCells, rbcCount, rbcFraction };
}
