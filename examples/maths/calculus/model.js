// Chapter 2: Slope and area (Differential & Integral Calculus).
// Pure functions of x and clock t; every table cell, chart curve, readout and practice answer is computed from here.

export const CYCLE = 10;                            // seconds per full animation cycle
export const XMAX = 3;                              // domain [0, 3] on each board
export const A0 = 1.0;                              // anchor x = 1 for the secant-to-tangent page

// 1. The parabola f(x) = ½x², its derivative f'(x) = x, and its antiderivative F(x) = ⅙x³
export const f = x => 0.5 * x * x;
export const df = x => x;
export const F = x => (x * x * x) / 6;
export const secantSlope = (a, h) => (Math.abs(h) < 1e-9 ? df(a) : (f(a + h) - f(a)) / h);
export const secantY = (a, h, x) => f(a) + secantSlope(a, h) * (x - a);
export const tangentY = (a, x) => f(a) + df(a) * (x - a);

// 2. Stationary-points cubic g(x) = ⅓x³ − x² + 2, g'(x) = x² − 2x = x(x − 2), g''(x) = 2x − 2
export const g = x => (x * x * x) / 3 - x * x + 2;
export const dg = x => x * x - 2 * x;
export const ddg = x => 2 * x - 2;
export const G_MAX_X = 0, G_MIN_X = 2, G_INFLECT_X = 1;

// 3. Riemann sum of fn on [a, b] with n bars ('left' | 'mid' | 'right')
export function riemannSum(fn, a, b, n, rule = 'mid') {
  const dx = (b - a) / n;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const xSample = rule === 'left' ? a + i * dx : rule === 'right' ? a + (i + 1) * dx : a + (i + 0.5) * dx;
    sum += fn(xSample) * dx;
  }
  return sum;
}
export const exactArea = (a, b) => F(b) - F(a);

// 4. Signed-rate wave v(t) = cos(½π t) and its net accumulation s(x) = ∫₀ˣ cos(½π t) dt = (2/π) sin(½π x)
export const K_WAVE = Math.PI / 2;
export const rateWave = x => Math.cos(K_WAVE * x);
export const netWave = x => Math.sin(K_WAVE * x) / K_WAVE;

// ---------- clock-driven motion for the 6 stations ----------
const wave01 = t => 0.5 - 0.5 * Math.cos((2 * Math.PI * t) / CYCLE);
// h shrinks from 1.6 down to 0.04 and back
export const hAt = t => 0.04 + 1.56 * (1 - wave01(t));
// x sweeps smoothly across [0.35, 2.75]
export const xSweep = t => 0.35 + 2.4 * wave01(t);
// x sweeps across [0, 2.8] for the cubic turning-points station
export const xCubic = t => 2.8 * wave01(t);
// Riemann bar count steps through 3 → 6 → 12 → 24 across the cycle
export const BARS_STEPS = [3, 6, 12, 24];
export const barsAt = t => BARS_STEPS[Math.floor((((t % CYCLE) + CYCLE) % CYCLE) / (CYCLE / BARS_STEPS.length))];
