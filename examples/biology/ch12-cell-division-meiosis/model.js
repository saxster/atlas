// Chapter 12 pure model: Meselson-Stahl 15N/14N CsCl density fractions, mitotic vs meiotic C-value/ploidy ledger, and independent assortment.
export function meselsonStahlAccount(generation = 1) {
  const g = Math.max(0, Math.min(4, Math.round(generation)));
  const totalDuplexes = Math.pow(2, g);
  if (g === 0) return { generation: 0, totalDuplexes: 1, heavyFrac: 1, hybridFrac: 0, lightFrac: 0 };
  const hybridDuplexes = 2;
  const lightDuplexes = totalDuplexes - 2;
  return {
    generation: g,
    totalDuplexes,
    heavyFrac: 0,
    hybridFrac: hybridDuplexes / totalDuplexes,
    lightFrac: lightDuplexes / totalDuplexes,
  };
}

export function divisionPloidyAccount(mode = 'mitosis', diploid2n = 46) {
  if (mode === 'meiosis') {
    return {
      mode,
      divisions: 2,
      daughterCells: 4,
      chromosomesPerDaughter: diploid2n / 2,
       geneticallyIdentical: false,
      assortmentCombinations: Math.pow(2, diploid2n / 2),
    };
  }
  return {
    mode: 'mitosis',
    divisions: 1,
    daughterCells: 2,
    chromosomesPerDaughter: diploid2n,
    geneticallyIdentical: true,
    assortmentCombinations: 1,
  };
}

export function waddingtonLandscapeHeight(x = 0, y = 0) {
  // Branching valley potential: single high stem-cell trough at y=-1 bifurcating into 3 lineage valleys at y=+1
  const u = (y + 1.2) / 2.4;
  const branch = 0.85 * u;
  const v1 = Math.pow(x + branch, 2);
  const v2 = Math.pow(x - branch, 2);
  const well = Math.min(v1, v2) + 0.15 * x * x;
  return 1.35 * (1 - 0.55 * u) + 0.65 * well;
}
