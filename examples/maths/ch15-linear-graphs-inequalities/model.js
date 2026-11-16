// Ch 15 pure model: Linear y = mx + c, perpendicular slope m1*m2 = -1, and LP corner vertices.
export function linearModel(m = 1.5, c = 0.5) {
  const safeM = Math.abs(m) < 0.1 ? 0.5 : m;
  const perpM = -1 / safeM;
  const product = safeM * perpM;
  const xIntercept = -c / safeM;
  return { m: safeM, c, perpM, product, xIntercept };
}

export function lpVertices() {
  // Constraints: x >= 0, y >= 0, x + 2y <= 8, 3x + y <= 9 -> corners (0,0), (3,0), (2,3), (0,4)
  const corners = [
    { x: 0, y: 0 },
    { x: 3, y: 0 },
    { x: 2, y: 3 },
    { x: 0, y: 4 },
  ].map(v => ({ ...v, profit: 4 * v.x + 5 * v.y }));
  return corners;
}
