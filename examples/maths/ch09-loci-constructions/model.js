// Ch 9 pure model: Rhombus perpendicular bisector locus, 3-figure back-bearing, and Euler's V - E + F = 2.
export function bisectorRhombus(abLen = 2.0, radiusRatio = 0.8) {
  const halfAB = abLen / 2;
  const r = Math.max(halfAB + 0.05, abLen * radiusRatio);
  const halfPQ = Math.sqrt(r * r - halfAB * halfAB);
  return { abLen, r, halfAB, halfPQ, pqLen: 2 * halfPQ, angleDeg: 90 };
}

export function backBearing(forwardDeg = 65) {
  const fwd = ((forwardDeg % 360) + 360) % 360;
  const back = fwd < 180 ? fwd + 180 : fwd - 180;
  const coInterior = 180 - (fwd % 180);
  return { forwardDeg: fwd, backDeg: back, coInterior, fwdStr: String(Math.round(fwd)).padStart(3, '0'), backStr: String(Math.round(back)).padStart(3, '0') };
}

export function eulerPolyhedra() {
  return [
    { name: 'Tetrahedron', V: 4, E: 6, F: 4, chi: 4 - 6 + 4 },
    { name: 'Cube', V: 8, E: 12, F: 6, chi: 8 - 12 + 6 },
    { name: 'Octahedron', V: 6, E: 12, F: 8, chi: 6 - 12 + 8 },
  ];
}
