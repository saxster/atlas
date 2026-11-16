// Ch 0 pure model: Inclusion-Exclusion, De Morgan complement, and Power-Set 2^n cardinality.
export function vennPartition(nA = 18, nB = 14, nInter = 6, universe = 30) {
  const inter = Math.max(0, Math.min(nA, nB, nInter));
  const onlyA = Math.max(0, nA - inter);
  const onlyB = Math.max(0, nB - inter);
  const union = onlyA + onlyB + inter;
  const outside = Math.max(0, universe - union);
  return { nA: onlyA + inter, nB: onlyB + inter, inter, onlyA, onlyB, union, outside, universe: Math.max(union, universe) };
}

export function deMorganTruthTable() {
  const rows = [];
  for (const p of [false, true]) {
    for (const q of [false, true]) {
      const lhs1 = !(p || q), rhs1 = (!p) && (!q);
      const lhs2 = !(p && q), rhs2 = (!p) || (!q);
      rows.push({ p, q, lhs1, rhs1, eq1: lhs1 === rhs1, lhs2, rhs2, eq2: lhs2 === rhs2 });
    }
  }
  return rows;
}

export function powerSetCount(n = 3) {
  return Math.pow(2, Math.max(0, Math.round(n)));
}
