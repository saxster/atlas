// Ch 16 pure model: Unit circle sin^2 + cos^2 = 1, Garfield/Bhaskara Pythagoras, and Law of Cosines.
export function unitCircleTrig(thetaDeg = 50) {
  const rad = (thetaDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const tan = Math.abs(cos) > 1e-6 ? sin / cos : Math.sign(sin) * 999;
  const pythagIdentity = cos * cos + sin * sin;
  return { thetaDeg, rad, cos, sin, tan, pythagIdentity };
}

export function cosineRule(a = 1.8, b = 1.4, angleCDeg = 60) {
  const rad = (angleCDeg * Math.PI) / 180;
  const cSq = a * a + b * b - 2 * a * b * Math.cos(rad);
  const c = Math.sqrt(Math.max(0, cSq));
  const area = 0.5 * a * b * Math.sin(rad);
  return { a, b, angleCDeg, cSq, c, area, corrTerm: 2 * a * b * Math.cos(rad) };
}
