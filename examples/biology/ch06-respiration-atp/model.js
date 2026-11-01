// Chapter 6 pure model: aerobic respiration ATP relay, Lavoisier mass/RQ ledger, and anaerobic lactate/yeast fermentation.
export function aerobicRelayAccount(o2Pct = 100, demandLevel = 50) {
  const o2 = Math.max(0, Math.min(100, o2Pct)) / 100;
  const glycolysisAtp = 2;
  const krebsAtp = 2 * o2;
  const oxPhosAtp = 28 * o2;
  const totalAtpPerGlucose = glycolysisAtp + krebsAtp + oxPhosAtp;
  const pmfMv = 180 * o2;
  const rotorHz = 150 * o2 * (0.5 + 0.5 * (demandLevel / 100));
  const lactateAccumMm = Math.max(0, (demandLevel - 100 * o2) * 0.18);
  return { o2Pct, demandLevel, glycolysisAtp, krebsAtp, oxPhosAtp, totalAtpPerGlucose, pmfMv, rotorHz, lactateAccumMm };
}

export function respiratoryQuotientLedger(substrate = 'glucose', moles = 1) {
  if (substrate === 'palmitate') {
    // C16H32O2 + 23 O2 -> 16 CO2 + 16 H2O => RQ = 16 / 23 = 0.70
    return { substrate, o2In: 23 * moles, co2Out: 16 * moles, rq: 16 / 23 };
  }
  if (substrate === 'anaerobic_yeast') {
    // C6H12O6 -> 2 C2H5OH + 2 CO2 => O2 = 0, CO2 = 2
    return { substrate, o2In: 0, co2Out: 2 * moles, rq: Infinity };
  }
  return { substrate: 'glucose', o2In: 6 * moles, co2Out: 6 * moles, rq: 1.0 };
}
