// Pure mathematical model for Chapter 5: Fourier Series & Rotating Epicycles.
// Zero DOM or Three.js imports; verified independently in checks.mjs.

// Target periodic functions on (−π, π)
export const squareTarget = t => {
  const s = Math.sin(t);
  return Math.abs(s) < 1e-12 ? 0 : (s > 0 ? 1 : -1);
};
export const sawtoothTarget = t => {
  const u = ((t + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
  return u / Math.PI;
};

// Fourier coefficients b_n = (1/π) ∫_{-π}^{π} f(t) sin(n t) dt
export const squareCoeff = n => (n > 0 && n % 2 === 1) ? 4 / (n * Math.PI) : 0;
export const sawtoothCoeff = n => n > 0 ? (2 / (n * Math.PI)) * (n % 2 === 1 ? 1 : -1) : 0;

// Epicycle chain tip positions for a given list of [n, amp] harmonics at angle t:
// returns array of [x, y] cumulative centers starting with [0, 0]
export function epicycleChain(harmonics, t) {
  const pts = [[0, 0]];
  let x = 0, y = 0;
  for (const [n, r] of harmonics) {
    x += r * Math.cos(n * t);
    y += r * Math.sin(n * t);
    pts.push([x, y]);
  }
  return pts;
}

export const squareHarmonics = count =>
  Array.from({ length: count }, (_, m) => {
    const n = 2 * m + 1;
    return [n, squareCoeff(n)];
  });

export const sawtoothHarmonics = count =>
  Array.from({ length: count }, (_, i) => {
    const n = i + 1;
    return [n, sawtoothCoeff(n)];
  });

// Partial sums S_N(t) (sum of first count terms)
export function squarePartial(t, count = 5) {
  let s = 0;
  for (let m = 0; m < count; m++) {
    const n = 2 * m + 1;
    s += (4 / (n * Math.PI)) * Math.sin(n * t);
  }
  return s;
}

export function sawtoothPartial(t, count = 6) {
  let s = 0;
  for (let n = 1; n <= count; n++) {
    s += sawtoothCoeff(n) * Math.sin(n * t);
  }
  return s;
}

// Parseval energy of square wave: mean square (1/2π) ∫_{-π}^{π} f(t)² dt = 1 = ½ Σ b_n²
export function squareParsevalSum(count) {
  let e = 0;
  for (let m = 0; m < count; m++) {
    const b = squareCoeff(2 * m + 1);
    e += 0.5 * b * b;
  }
  return e;
}

// Gibbs overshoot constant: (2/π) Si(π) = (2/π) ∫_0^π (sin u / u) du ≈ 1.178979744
// That is +0.17898 above +1, which is 8.949 % of the total jump height Δ = 2 (from −1 to +1).
export const GIBBS_PEAK = 1.1789797444721673;
export const GIBBS_JUMP_PCT = (GIBBS_PEAK - 1) / 2 * 100; // ≈ 8.949 % of the jump of 2
export const gibbsPeakAngle = count => Math.PI / (2 * count); // for count odd terms (highest freq 2*count - 1, first extremum at π/(2*count))
