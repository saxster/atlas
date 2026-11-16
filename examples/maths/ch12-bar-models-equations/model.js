// Ch 12 pure model: Singapore bar model 3x + c = total and simultaneous bar elimination.
export function singaporeBar(x = 12, c = 12) {
  const total = 3 * x + c;
  const remainder = total - c;
  const solvedX = remainder / 3;
  return { x, c, total, remainder, solvedX };
}

export function simultaneousBars(x = 7, y = 5) {
  const row1 = 2 * x + y;
  const row2 = x + y;
  const diffX = row1 - row2;
  const solvedY = row2 - diffX;
  return { x, y, row1, row2, diffX, solvedY };
}
