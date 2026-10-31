// Pure mathematical and stochastic model for Figure S.2: Repeated readings & the bell of measurement error.
// Covers Gauss's law of errors N(μ + bias, σ²), histogram binning, and the √n shrinkage of standard error σ / √n.
// Zero DOM, zero Three.js imports.
import { rng } from '@saxster/atlas/rng.js';

export const TRUE_MU = 100.0;   // mm true length of the reference bar
export const X_MIN = 92.0;      // mm left edge of scale
export const X_MAX = 108.0;     // mm right edge of scale
export const BIN_W = 0.8;       // mm width of each histogram slot (20 bins across 16 mm)
export const BINS = Math.round((X_MAX - X_MIN) / BIN_W); // 20
export const DURATION = 8.0;    // seconds for the full run

// Gaussian probability density f(x) = exp(−(x − m)² / (2σ²)) / (σ √(2π))
export function normalPdf(x, mean = TRUE_MU, sigma = 2.0) {
  const z = (x - mean) / sigma;
  return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI));
}

// Expected count of readings per bin of width BIN_W after n total readings
export function expectedBinHeight(x, n, sigma = 2.0, bias = 0.0) {
  return n * BIN_W * normalPdf(x, TRUE_MU + bias, sigma);
}

// Standard error of the sample mean after k readings: σ / √k
export function standardError(sigma, k) {
  return k > 0 ? sigma / Math.sqrt(k) : sigma;
}

// Map a reading x to its bin index [0, BINS − 1] and bin centre
export function binIndex(x) {
  return Math.max(0, Math.min(BINS - 1, Math.floor((x - X_MIN) / BIN_W)));
}

export function binCenter(b) {
  return X_MIN + (b + 0.5) * BIN_W;
}

// Run n seeded measurements X_i ~ N(TRUE_MU + bias, σ²)
export function run({ n = 160, sigma = 2.0, bias = 0.0, seed = 1 } = {}) {
  const rand = rng(seed * 197 + n * 13 + Math.round(sigma * 100) * 7 + Math.round((bias + 5) * 100));
  const readings = [];
  const counts = new Int16Array(BINS);

  for (let i = 0; i < n; i++) {
    const raw = rand.normal(TRUE_MU + bias, sigma);
    const b = binIndex(raw);
    const rank = counts[b]++;
    readings.push({
      i,
      raw,
      bin: b,
      xBin: binCenter(b),
      rank,
      tLand: ((i + 1) / n) * DURATION,
    });
  }

  return { n, sigma, bias, seed, readings, finalCounts: counts };
}

export function snapshot(e, t) {
  const k = Math.max(1, Math.min(e.n, Math.floor((Math.max(0, t) / DURATION) * e.n) || 1));
  let sum = 0;
  let sumSq = 0;
  for (let i = 0; i < k; i++) {
    const x = e.readings[i].raw;
    sum += x;
    sumSq += x * x;
  }
  const mean = sum / k;
  const sd = k > 1 ? Math.sqrt(Math.max(0, (sumSq - k * mean * mean) / (k - 1))) : e.sigma;
  const se = standardError(e.sigma, k);
  return {
    k,
    mean,
    sd,
    se,
    errFromTrue: mean - TRUE_MU,
  };
}
