// Ch 18 pure model: Cubic f(x) = x^3/3 - x^2 + 2, secant vs tangent slope, and d(x^2)/dx = 2x + h.
export function cubicCalculus(x0 = 1.0, h = 0.5) {
  const f = x => (x * x * x) / 3 - x * x + 2;
  const df = x => x * x - 2 * x;
  const d2f = x => 2 * x - 2;
  const y0 = f(x0);
  const y1 = f(x0 + h);
  const secantSlope = (y1 - y0) / h;
  const tangentSlope = df(x0);
  const secondDeriv = d2f(x0);
  const squareExactRate = 2 * x0 + h;
  const squareLimitRate = 2 * x0;
  return { x0, h, y0, y1, secantSlope, tangentSlope, secondDeriv, squareExactRate, squareLimitRate };
}
