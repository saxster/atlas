// The checks.mjs toolkit for new chapters: named checks, tolerances, numerical calculus to test closed forms a
// second way, and statistical bounds for seeded stochastic models. No DOM, no three: runs under plain node.
//   const C = checks(); C.check('a = F/m', C.near(a, 3)); … C.report();   // prints rows, exits 1 on any FAIL
export function checks() {
  const rows = [];
  return {
    rows,
    check: (name, ok, info = '') => { rows.push([ok ? 'PASS' : 'FAIL', name, info]); return ok; },
    near,
    report() {
      for (const r of rows) console.log(r.filter(Boolean).join('  '));
      const ok = rows.length > 0 && rows.every(r => r[0] === 'PASS');
      if (typeof process !== 'undefined') process.exitCode = ok ? 0 : 1;
      return ok;
    },
  };
}

// relative tolerance, absolute near zero
export const near = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));

// ---------- numerical calculus ----------
export const deriv = (f, x, h = 1e-6) => (f(x + h) - f(x - h)) / (2 * h);
export function integ(f, a, b, n = 2000) {                      // Simpson's rule, n even
  const h = (b - a) / n; let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2);
  return s * h / 3;
}
export function bisect(f, a, b, tol = 1e-12) {
  let fa = f(a);
  for (let i = 0; i < 200 && b - a > tol; i++) { const m = (a + b) / 2, fm = f(m); if (fa * fm <= 0) b = m; else { a = m; fa = fm; } }
  return (a + b) / 2;
}
// fourth-order Runge–Kutta for y' = f(t, y), y a number or an array; returns y at each step (including y0)
export function rk4(f, y0, t0, t1, n) {
  const add = (y, k, s) => Array.isArray(y) ? y.map((v, i) => v + k[i] * s) : y + k * s;
  const h = (t1 - t0) / n, out = [y0]; let y = y0, t = t0;
  for (let i = 0; i < n; i++) {
    const k1 = f(t, y), k2 = f(t + h / 2, add(y, k1, h / 2)), k3 = f(t + h / 2, add(y, k2, h / 2)), k4 = f(t + h, add(y, k3, h));
    y = Array.isArray(y) ? y.map((v, j) => v + h / 6 * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j])) : y + h / 6 * (k1 + 2 * k2 + 2 * k3 + k4);
    t += h; out.push(y);
  }
  return out;
}

// ---------- statistics for seeded models ----------
export const mean = xs => xs.reduce((s, x) => s + x, 0) / xs.length;
export const variance = xs => { const m = mean(xs); return xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1); };
// is a sample mean within k standard errors of the true mean?
export const meanWithin = (xs, mu, sigma, k = 4) => Math.abs(mean(xs) - mu) <= k * sigma / Math.sqrt(xs.length);
// Pearson's chi-square statistic for observed counts against expected counts
export const chiSquare = (obs, exp) => obs.reduce((s, o, i) => s + (o - exp[i]) ** 2 / exp[i], 0);
// regularised lower incomplete gamma P(a, x): series below a + 1, continued fraction above (Numerical Recipes 6.2)
function gammaP(a, x) {
  if (x <= 0) return 0;
  const lnPre = -x + a * Math.log(x) - lnGamma(a);
  if (x < a + 1) {
    let sum = 1 / a, term = sum;
    for (let n = 1; n < 500 && Math.abs(term) > Math.abs(sum) * 1e-15; n++) { term *= x / (a + n); sum += term; }
    return sum * Math.exp(lnPre);
  }
  let b = x + 1 - a, c = 1e300, d = 1 / b, h = d;
  for (let i = 1; i < 500; i++) {
    const an = -i * (i - a); b += 2;
    d = an * d + b; if (Math.abs(d) < 1e-300) d = 1e-300;
    c = b + an / c; if (Math.abs(c) < 1e-300) c = 1e-300;
    d = 1 / d; const del = d * c; h *= del;
    if (Math.abs(del - 1) < 1e-15) break;
  }
  return 1 - Math.exp(lnPre) * h;
}
// ln Γ(x), Lanczos (g = 7, n = 9)
function lnGamma(x) {
  const g = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059,
    12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lnGamma(1 - x);
  x -= 1; let a = g[0]; const t = x + 7.5;
  for (let i = 1; i < 9; i++) a += g[i] / (x + i);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}
export const chiSquareCDF = (x, df) => gammaP(df / 2, x / 2);
// upper critical value of chi-square with df degrees of freedom at significance alpha
export function chiSquareCritical(df, alpha = 0.001) {
  let hi = df + 10 * Math.sqrt(2 * df) + 10;
  while (chiSquareCDF(hi, df) < 1 - alpha) hi *= 2;
  return bisect(x => chiSquareCDF(x, df) - (1 - alpha), 0, hi);
}
// inverse standard normal CDF (Acklam's rational approximation, |error| < 1.2e-9)
export function normalQuantile(p) {
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  const lo = 0.02425, q = p < lo ? Math.sqrt(-2 * Math.log(p)) : p > 1 - lo ? Math.sqrt(-2 * Math.log(1 - p)) : 0;
  if (p < lo) return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  if (p > 1 - lo) return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  const r = (p - 0.5), s = r * r;
  return (((((a[0] * s + a[1]) * s + a[2]) * s + a[3]) * s + a[4]) * s + a[5]) * r / (((((b[0] * s + b[1]) * s + b[2]) * s + b[3]) * s + b[4]) * s + 1);
}
export const binomial = (n, k) => { let c = 1; for (let i = 1; i <= k; i++) c = c * (n - k + i) / i; return c; };
