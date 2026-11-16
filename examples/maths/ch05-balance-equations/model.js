// Ch 5 pure model: Linear balance equation ax + b = cx + d and negative inequality reflection.
export function solveLinearBalance(a = 4, b = 3, c = 1, d = 15) {
  const netA = a === c ? 1 : a - c;
  const netD = d - b;
  const x = netD / netA;
  const sideVal = a * x + b;
  return { a, b, c, d, netA, netD, x, sideVal };
}

export function reflectInequality(low = 2, high = 5) {
  return { low, high, negLow: -high, negHigh: -low };
}
