// Chapter 4 pure model: Lavoisier sealed-retort mass conservation,
// stoichiometry of 2 H2 + O2 -> 2 H2O, and coefficient vs subscript atom inventory.

export function lavoisierRetort(progressPct = 100, tinGrams = 118.7, oxygenGasGrams = 32.0) {
  const frac = Math.max(0, Math.min(100, progressPct)) / 100;
  // Sn + O2 -> SnO2: 118.7 g Sn reacts with up to 32.0 g O2
  const reactedO2 = 32.0 * frac;
  const remainingO2 = Math.max(0, oxygenGasGrams - reactedO2);
  const solidMass = tinGrams + reactedO2;
  const totalSealedMass = solidMass + remainingO2;
  return { progressPct: frac * 100, solidMass, remainingO2, totalSealedMass };
}

export function waterSynthesisAtomLedger(cH2 = 2, cO2 = 1, cH2O = 2) {
  const h2 = Math.max(1, Math.min(4, Math.round(cH2)));
  const o2 = Math.max(1, Math.min(4, Math.round(cO2)));
  const h2o = Math.max(1, Math.min(4, Math.round(cH2O)));
  const hBefore = 2 * h2;
  const oBefore = 2 * o2;
  const hAfter = 2 * h2o;
  const oAfter = 1 * h2o;
  const balanced = hBefore === hAfter && oBefore === oAfter;
  return { cH2: h2, cO2: o2, cH2O: h2o, hBefore, oBefore, hAfter, oAfter, balanced };
}

export function coeffVsSubscript(coeff = 2, oSubscript = 1) {
  const c = Math.max(1, Math.min(3, Math.round(coeff)));
  const sub = oSubscript >= 2 ? 2 : 1;
  const formula = sub === 1 ? 'H₂O (Water)' : 'H₂O₂ (Hydrogen peroxide)';
  const totalH = c * 2;
  const totalO = c * sub;
  return { coeff: c, oSubscript: sub, formula, totalH, totalO };
}
