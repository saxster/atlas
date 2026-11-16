// Ch 19 pure model: Midpoint Riemann sum, Fundamental Theorem dA/dx = f(x), and disc volume.
export function integralModel(N = 10, upperX = 2.4) {
  const f = x => 0.25 * x * x + 0.5;
  const F = x => (0.25 * x * x * x) / 3 + 0.5 * x;
  const n = Math.max(2, Math.round(N));
  const dx = upperX / n;
  let midpointSum = 0;
  let discVolSum = 0;
  for (let i = 0; i < n; i++) {
    const xm = (i + 0.5) * dx;
    const y = f(xm);
    midpointSum += y * dx;
    discVolSum += Math.PI * y * y * dx;
  }
  const exactArea = F(upperX) - F(0);
  const boundaryHeight = f(upperX);
  return { n, upperX, dx, midpointSum, exactArea, boundaryHeight, discVolSum };
}
