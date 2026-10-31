// node examples/statistics/error/checks.mjs — independent proofs of normal PDF normalization, 68-95-99.7 rule, √n standard-error shrinkage, and bias invariance.
import { checks, near, integ, mean, variance, meanWithin } from '@saxster/atlas/checks.js';
import * as M from './model.js';

const C = checks();

// 1. Gaussian density integrates to 1 over (−∞, ∞) and satisfies the 68.27% / 95.45% empirical rule via Simpson's rule
for (const sigma of [1.0, 2.0, 3.0]) {
  const totalProb = integ(x => M.normalPdf(x, M.TRUE_MU, sigma), M.TRUE_MU - 7 * sigma, M.TRUE_MU + 7 * sigma, 400);
  const p1 = integ(x => M.normalPdf(x, M.TRUE_MU, sigma), M.TRUE_MU - sigma, M.TRUE_MU + sigma, 200);
  const p2 = integ(x => M.normalPdf(x, M.TRUE_MU, sigma), M.TRUE_MU - 2 * sigma, M.TRUE_MU + 2 * sigma, 200);
  C.check(`normalPdf(σ = ${sigma}): ∫ f(x) dx = 1, P(|X − μ| ≤ σ) ≈ 0.6827, P(|X − μ| ≤ 2σ) ≈ 0.9545`,
    near(totalProb, 1.0, 1e-6) && near(p1, 0.68268949, 1e-5) && near(p2, 0.95449974, 1e-5));
}

// 2. Standard error σ / √n quarters when sample size n increases 16-fold (from n = 10 to n = 160)
C.check('standardError(σ, 160) is exactly ¼ of standardError(σ, 10)',
  near(M.standardError(2.0, 10) / M.standardError(2.0, 160), 4.0, 1e-12));

// 3. Unbiased readings (bias = 0): sample mean across 40 seeds matches TRUE_MU = 100.0 within 3 SE, and empirical SD of sample means matches σ / √n
{
  const n = 160, sigma = 2.0, se = M.standardError(sigma, n);
  const means = Array.from({ length: 40 }, (_, i) =>
    M.snapshot(M.run({ n, sigma, bias: 0.0, seed: i + 1 }), M.DURATION).mean
  );
  const empSE = Math.sqrt(variance(means));
  C.check('unbiased ensemble (bias = 0): mean of 40 sample means matches 100.0 mm within 3 SE and SD(x̄) ≈ σ/√n',
    meanWithin(means, M.TRUE_MU, se) && near(empSE, se, 0.08), `empSE = ${empSE.toFixed(3)} vs σ/√n = ${se.toFixed(3)}`);
}

// 4. Systematic calibration bias (bias = +1.5 mm): averaging n = 160 readings converges to TRUE_MU + bias = 101.5 mm, not 100.0 mm
{
  const n = 160, sigma = 2.0, bias = 1.5, se = M.standardError(sigma, n);
  const means = Array.from({ length: 30 }, (_, i) =>
    M.snapshot(M.run({ n, sigma, bias, seed: i + 1 }), M.DURATION).mean
  );
  C.check('systematic bias (+1.5 mm) shifts sample mean to 101.5 mm without averaging out',
    meanWithin(means, M.TRUE_MU + bias, se) && Math.abs(mean(means) - M.TRUE_MU) > 1.2);
}

C.report();
