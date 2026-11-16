// Ch 4 pure model: 4-tile binomial expansion (x+a)(x+b) and Difference of Two Squares a^2 - b^2.
export function expandAreaTiles(x = 4, a = 2, b = 3) {
  const x2 = x * x, ax = a * x, bx = b * x, ab = a * b;
  const total = (x + a) * (x + b);
  return { x, a, b, x2, ax, bx, linearSum: ax + bx, ab, total };
}

export function diffOfSquares(a = 5, b = 2) {
  const A = Math.max(b + 0.5, a);
  const lhs = A * A - b * b;
  const rhs = (A - b) * (A + b);
  return { a: A, b, lhs, rhs, width: A + b, height: A - b };
}
