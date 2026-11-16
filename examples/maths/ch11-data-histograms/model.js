// Ch 11 pure model: Frequency density (FD = f / w), Tukey IQR fences, and Simpson's Paradox.
export function histogramBins(wideWidth = 25, wideFreq = 30) {
  const bins = [
    { label: '0–10', width: 10, freq: 18 },
    { label: '10–20', width: 10, freq: 24 },
    { label: `20–${20 + wideWidth}`, width: wideWidth, freq: wideFreq },
  ];
  return bins.map(b => ({ ...b, density: b.freq / b.width, naiveRatio: b.freq / (b.freq / b.width) }));
}

export function tukeySummary(outlierVal = 98) {
  const q1 = 42, median = 54, q3 = 64;
  const iqr = q3 - q1;
  const upperFence = q3 + 1.5 * iqr;
  const lowerFence = q1 - 1.5 * iqr;
  const isOutlier = outlierVal > upperFence;
  const mean = (35 + 42 + 50 + 54 + 58 + 64 + outlierVal) / 7;
  return { q1, median, q3, iqr, lowerFence, upperFence, outlierVal, isOutlier, mean };
}

export function simpsonsParadox() {
  // Hospital A vs B split by Mild vs Severe cases
  const aMild = { s: 81, n: 87, rate: 81 / 87 };
  const bMild = { s: 234, n: 270, rate: 234 / 270 };
  const aSev = { s: 192, n: 263, rate: 192 / 263 };
  const bSev = { s: 55, n: 80, rate: 55 / 80 };
  const aPool = (aMild.s + aSev.s) / (aMild.n + aSev.n);
  const bPool = (bMild.s + bSev.s) / (bMild.n + bSev.n);
  return { aMild, bMild, aSev, bSev, aPool, bPool, reversed: aMild.rate > bMild.rate && aSev.rate > bSev.rate && aPool < bPool };
}
