// Ch 6 pure model: Gauss arithmetic series staircase and quadratic 2nd differences.
export function arithmeticSeries(n = 6, a1 = 1, d = 1) {
  const N = Math.max(1, Math.round(n));
  const an = a1 + (N - 1) * d;
  const pairHeight = a1 + an;
  const rectArea = N * pairHeight;
  const sum = rectArea / 2;
  return { n: N, a1, d, an, pairHeight, rectArea, sum };
}

export function quadraticDifferences(a = 1, b = 0, c = 0) {
  const terms = [1, 2, 3, 4, 5].map(n => a * n * n + b * n + c);
  const diff1 = [0, 1, 2, 3].map(i => terms[i + 1] - terms[i]);
  const diff2 = [0, 1, 2].map(i => diff1[i + 1] - diff1[i]);
  return { terms, diff1, diff2, constantSecondDiff: diff2[0] };
}
