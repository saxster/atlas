// Ch 8 pure model: Parallel transversal Z/F/C angles, triangle exterior angle theorem, and polygon triangulation.
export function triangleExterior(alphaDeg = 50, betaDeg = 60) {
  const extDeg = alphaDeg + betaDeg;
  const gammaDeg = 180 - extDeg;
  const coInteriorDeg = 180 - alphaDeg;
  return { alphaDeg, betaDeg, gammaDeg, extDeg, coInteriorDeg };
}

export function polygonAngles(n = 6) {
  const sides = Math.max(3, Math.round(n));
  const triangles = sides - 2;
  const interiorSum = triangles * 180;
  const regularInterior = interiorSum / sides;
  const regularExterior = 360 / sides;
  return { sides, triangles, interiorSum, regularInterior, regularExterior };
}
