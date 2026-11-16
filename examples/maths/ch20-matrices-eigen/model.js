// Ch 20 pure model: Symmetric 2x2 matrix [[a, b], [b, a]] determinant ad - bc and eigenvalues a+b, a-b.
export function matrixEigenModel(a = 2.0, b = 1.0) {
  const det = a * a - b * b;
  const trace = 2 * a;
  const lambda1 = a + b; // along v1 = (1, 1)
  const lambda2 = a - b; // along v2 = (1, -1)
  return { a, b, det, trace, lambda1, lambda2, prodEigen: lambda1 * lambda2, sumEigen: lambda1 + lambda2 };
}
