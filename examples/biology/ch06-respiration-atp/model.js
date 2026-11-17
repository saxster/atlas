// Chapter 6 pure model: aerobic respiration ATP relay, Lavoisier mass/RQ ledger, and anaerobic lactate/yeast fermentation.
export function aerobicRelayAccount(o2Pct = 100, demandLevel = 50, buggyWorld = false) {
  const bounded = (v, fallback) => Number.isFinite(+v) ? Math.max(0, Math.min(100, +v)) : fallback;
  const oxygenControl = bounded(o2Pct, 100), activityControl = bounded(demandLevel, 50);
  const chainActive = buggyWorld ? true : oxygenControl > 0;
  return {
    o2Pct: oxygenControl,
    demandLevel: activityControl,
    glycolysisAtp: 2,
    chainActive,
    animationRate: chainActive ? 0.5 + activityControl / 200 : 0,
    status: buggyWorld
      ? 'Buggy World: ETC & rotor spin without O₂ terminal electron acceptor'
      : chainActive
        ? 'Oxygen-linked relay available'
        : 'Sustained absence: relay stalls after residual gradients dissipate',
  };
}

export function respiratoryQuotientLedger(substrate = 'glucose', moles = 1) {
  if (substrate === 'palmitate') {
    // C16H32O2 + 23 O2 -> 16 CO2 + 16 H2O => RQ = 16 / 23 = 0.70
    return { substrate, o2In: 23 * moles, co2Out: 16 * moles, rq: 16 / 23 };
  }
  if (substrate === 'anaerobic_yeast') {
    // C6H12O6 -> 2 C2H5OH + 2 CO2 => O2 = 0, CO2 = 2
    return { substrate, o2In: 0, co2Out: 2 * moles, rq: null };
  }
  return { substrate: 'glucose', o2In: 6 * moles, co2Out: 6 * moles, rq: 1.0 };
}

// Reference J (Meerman & Brown 2014 BMJ fat oxidation stoichiometry C55H104O6 + 78 O2 -> 55 CO2 + 52 H2O):
export function fatOxidationMassLedger(fatKg = 10.0) {
  const mFat = 860, mO2 = 78 * 32, mCO2 = 55 * 44, mH2O = 52 * 18;
  const o2InKg = fatKg * (mO2 / mFat);
  const co2OutKg = fatKg * (mCO2 / mFat);
  const h2oOutKg = fatKg * (mH2O / mFat);
  const fatMassToCo2Frac = (55 * 12 + 4 * 16) / mFat; // 724 / 860 ~ 0.8419
  return { fatKg, o2InKg, co2OutKg, h2oOutKg, fatMassToCo2Frac, fatMassToH2oFrac: 1 - fatMassToCo2Frac };
}
