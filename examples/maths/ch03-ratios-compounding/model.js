// Ch 3 pure model: Singapore unitary ratio partition, up-down percentage multiplier, and compound growth.
export function ratioBarPartition(partsA = 3, partsB = 5, unitVal = 40) {
  const totalParts = partsA + partsB;
  const shareA = partsA * unitVal;
  const shareB = partsB * unitVal;
  const diff = Math.abs(shareB - shareA);
  const total = shareA + shareB;
  return { partsA, partsB, unitVal, totalParts, shareA, shareB, diff, total };
}

export function upDownMultiplier(pct = 20) {
  const r = pct / 100;
  const up = 1 + r;
  const net = up * (1 - r);
  return { pct, up, net, lossPct: (1 - net) * 100 };
}

export function compoundVsSimple(principal = 1000, ratePct = 8, years = 20) {
  const r = ratePct / 100;
  const simpleTotal = principal * (1 + years * r);
  const compoundTotal = principal * Math.pow(1 + r, years);
  return { principal, ratePct, years, simpleTotal, compoundTotal, extraCompound: compoundTotal - simpleTotal };
}
