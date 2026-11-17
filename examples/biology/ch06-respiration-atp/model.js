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
