// Ch 7 pure model: Linear gradient y = mx + c, perpendicular gradient -1/m, and speed-time trapezium area.
export function linearSlopeState(m = 1.5, c = 0.5, dx = 1.5) {
  const dy = m * dx;
  const mPerp = Math.abs(m) < 1e-6 ? 0 : -1 / m;
  return { m, c, dx, dy, mPerp, product: Math.abs(m) < 1e-6 ? 0 : m * mPerp };
}

export function travelGraphArea(vMax = 12, tAccel = 4, tCruise = 6) {
  const distAccel = 0.5 * vMax * tAccel;
  const distCruise = vMax * tCruise;
  return { vMax, tAccel, tCruise, distAccel, distCruise, totalDist: distAccel + distCruise, accel: vMax / tAccel };
}
