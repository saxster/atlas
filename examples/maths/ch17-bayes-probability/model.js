// Ch 17 pure model: Bayes unit square eikosogram and expected value center-of-mass.
export function bayesEikosogram(prevPct = 2, sensPct = 95, specPct = 90) {
  const pD = prevPct / 100;
  const pNotD = 1 - pD;
  const sens = sensPct / 100;
  const spec = specPct / 100;
  const fpr = 1 - spec;
  const tp = pD * sens;
  const fn = pD * (1 - sens);
  const fp = pNotD * fpr;
  const tn = pNotD * spec;
  const totalPos = tp + fp;
  const posterior = totalPos > 0 ? tp / totalPos : 0;
  return { prevPct, sensPct, specPct, pD, pNotD, sens, spec, fpr, tp, fn, fp, tn, totalPos, posterior };
}
