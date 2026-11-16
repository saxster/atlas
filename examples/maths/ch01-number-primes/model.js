// Ch 1 pure model: Negative rotation, GCD/LCM invariant HCF * LCM = a * b, and index laws.
export function gcd(a, b) {
  let x = Math.abs(Math.round(a)), y = Math.abs(Math.round(b));
  while (y !== 0) { const t = y; y = x % y; x = t; }
  return Math.max(1, x);
}

export function hcfLcmInvariant(a = 24, b = 36) {
  const A = Math.max(1, Math.round(a)), B = Math.max(1, Math.round(b));
  const hcf = gcd(A, B);
  const lcm = (A * B) / hcf;
  return { a: A, b: B, hcf, lcm, productAB: A * B, productHcfLcm: hcf * lcm };
}

export function directedRotation(magnitude = 4, flips = 2) {
  const f = Math.round(flips);
  const angleDeg = f * 180;
  const sign = f % 2 === 0 ? 1 : -1;
  return { magnitude, flips: f, angleDeg, signedValue: sign * magnitude };
}
