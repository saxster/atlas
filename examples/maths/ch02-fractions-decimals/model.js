// Ch 2 pure model: Recurring decimal 10^k x - x exact rational conversion and reciprocal fraction division.
export function gcd(a, b) {
  let x = Math.abs(Math.round(a)), y = Math.abs(Math.round(b));
  while (y !== 0) { const t = y; y = x % y; x = t; }
  return Math.max(1, x);
}

export function recurringTwoDigit(block = 36) {
  const num = Math.max(1, Math.min(98, Math.round(block)));
  const den = 99;
  const g = gcd(num, den);
  return { block: num, rawNum: num, rawDen: den, simpNum: num / g, simpDen: den / g, decimal: num / 99 };
}

export function divideByFraction(whole = 3, numA = 2, denB = 4) {
  const totalPieces = whole * denB;
  const quotient = totalPieces / numA;
  return { whole, numA, denB, totalPieces, quotient };
}
