// Ch 14 pure model: Completing the square x^2 + bx + (b/2)^2 = (x + b/2)^2 and vertex/discriminant.
export function completeSquare(x = 1.8, b = 4, c = 1) {
  const halfB = b / 2;
  const cornerArea = halfB * halfB;
  const completedSide = x + halfB;
  const vertexX = -halfB;
  const vertexY = c - cornerArea;
  const discriminant = b * b - 4 * c;
  return { x, b, c, halfB, cornerArea, completedSide, vertexX, vertexY, discriminant };
}
