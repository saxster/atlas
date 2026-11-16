// Ch 13 pure model: Exponent divide-by-a staircase (a^0 = 1) and k, k^2, k^3 similarity scaling.
export function exponentStaircase(a = 2) {
  const exps = [3, 2, 1, 0, -1, -2];
  return exps.map(e => ({ exp: e, val: Math.pow(a, e), ratioToNext: a }));
}

export function similarityScaling(k = 2) {
  return { k, lengthRatio: k, areaRatio: k * k, volumeRatio: k * k * k };
}
