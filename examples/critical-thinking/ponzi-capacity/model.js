// Pure mathematical model for Figure CT.8: Bernie Madoff Split-Strike Option Capacity Ceiling & Ponzi Clock.
// Zero DOM, zero Three.js imports.
export const DURATION = 7.5;

// Markopolos 2005 OEX Split-Strike Capacity Proof:
// Madoff claimed to hedge his entire equity basket using S&P 100 (OEX) put/call collars.
// Suppose OEX index level ≈ 570 ($57,000 notional per contract) and total global CBOE OEX open interest is ~240,000 contracts (~$13.7B notional ceiling).
export function optionCapacityCheck({
  claimedAUMBillions = 28,
  cboeOexOpenInterestContracts = 240000,
  contractNotionalUSD = 57000,
} = {}) {
  const claimedUSD = claimedAUMBillions * 1e9;
  const requiredContracts = claimedUSD / contractNotionalUSD;
  const exchangeCeilingBillions = (cboeOexOpenInterestContracts * contractNotionalUSD) / 1e9;
  const shareOfWorldMarket = requiredContracts / cboeOexOpenInterestContracts;
  const impossible = shareOfWorldMarket > 1.0;
  return {
    claimedAUMBillions,
    requiredContracts,
    cboeOexOpenInterestContracts,
    exchangeCeilingBillions,
    shareOfWorldMarket,
    impossible,
  };
}

// Self-funded Ponzi payout horizon (months until withdrawals overwhelm new deposits at promised annual return r).
export function ponziHorizon({ annualReturn = 0.12, newInflowRate = 0.08, withdrawalRate = 0.06 } = {}) {
  // Net cash drift = newInflowRate - (withdrawalRate + annualReturn_paid_out)
  // Illustrative reserve burn model for how fast net redemptions drain cash buffer
  const annualDrain = withdrawalRate - newInflowRate;
  const monthsToExhaust = annualDrain > 0 ? Math.max(1, Math.round((0.15 / annualDrain) * 12)) : 120;
  return { annualReturn, annualDrain, monthsToExhaust };
}

export function run({ claimedAUMBillions = 28, dtcVerifiedBillions = 0.018, buggyPaperTrust = 0 } = {}) {
  const cap = optionCapacityCheck({ claimedAUMBillions });
  const hz = ponziHorizon();
  return { claimedAUMBillions, dtcVerifiedBillions, buggyPaperTrust: buggyPaperTrust ? 1 : 0, cap, hz };
}

export function snapshot(e, t) {
  const frac = Math.max(0, Math.min(1, t / DURATION));
  const aumVis = 1 + (e.claimedAUMBillions - 1) * frac;
  const capVis = optionCapacityCheck({ claimedAUMBillions: aumVis });
  return { frac, aumVis, ...capVis };
}
