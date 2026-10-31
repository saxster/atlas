// Pure, stateless procedural motion, easing, closed-loop spring, and periodic noise helpers.
// Every function depends on time t (or phase u in [0, 1]) alone — no DOM, no Three.js, no frame-to-frame state —
// so model.js, world.js, checks.mjs, and out-of-order ?render seeks all compute identical values.

export const TAU = Math.PI * 2;
export const clamp01 = x => Math.min(Math.max(x, 0), 1);
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, u) => a + (b - a) * u;
export const fract = x => x - Math.floor(x);
export const mod = (x, m) => ((x % m) + m) % m;
export const smooth = (a, b, x) => { const u = clamp01((x - a) / (b - a)); return u * u * (3 - 2 * u); };
export const smoothstep = smooth;
export const ease = u => (u = clamp01(u), u < 0.5 ? 4 * u ** 3 : 1 - (-2 * u + 2) ** 3 / 2);

// Phase 0..1 of a cycle of `period` seconds. When `period` divides a tour or loop length, the cycle closes cleanly.
export const phase = (t, period = 1, offset = 0) => fract((t + offset) / period);

// Windowed progress 0..1 inside a [0, 1] phase: 0 before a, ramps 0 -> 1 over [a, b], holds 1 after b.
// Optional easing function `fn` (e.g. `ease` or `eases.outCubic`) shapes the 0..1 ramp.
export const win = (p, a, b, fn = null) => {
  const u = clamp01((p - a) / (b - a));
  return fn ? fn(u) : u;
};

// Periodic time warp: surges and slows inside `period` while keeping warpTime(t + period) = warpTime(t) + period.
// Clamps amplitude so |a * TAU / period| <= 0.9 and time never runs backwards.
export function warpTime(t, period = 12, amp = 0.15) {
  const maxAmp = (0.9 * period) / TAU;
  const a = clamp(amp, -maxAmp, maxAmp);
  return t + a * Math.sin((TAU * t) / period);
}

// Closed-loop underdamped spring from 0 to 1 (zeta: 0.2 bouncy to 1.0 critical), pinned to 0 at u <= 0
// and smoothly blended to 1 at u >= 1 so periodic cycles close with zero seam jump.
export function spring(u, zeta = 0.35, freq = 3.2) {
  if (u <= 0) return 0;
  if (u >= 1) return 1;
  const z = clamp(zeta, 0.01, 0.9999);
  const w = TAU * freq;
  const wd = w * Math.sqrt(Math.max(1e-6, 1 - z * z));
  const v = 1 - Math.exp(-z * w * u) * (Math.cos(wd * u) + ((z * w) / wd) * Math.sin(wd * u));
  return lerp(v, 1, smooth(0.85, 1, u));
}

// Decaying sinusoidal after-shake that reaches exactly 0 by tau = end.
export function settleShake(tau, freq = 6, decay = 0.25, end = 1) {
  if (tau <= 0 || tau >= end) return 0;
  return Math.exp(-tau / decay) * Math.sin(TAU * freq * tau) * (1 - smooth(end * 0.7, end, tau));
}

// Volume-preserving squash and stretch scale [sx, sy, sz] for a vertical scale sy.
export function squashStretch(sy, power = 0.75) {
  const s = Math.max(0.05, sy);
  const lat = 1 / Math.pow(s, power);
  return [lat, s, lat];
}

// Complete easing family on [0, 1] -> [0, 1] (with overshoot for Back/Elastic/Spring).
export const eases = {
  linear: u => clamp01(u),
  inSine: u => 1 - Math.cos((clamp01(u) * Math.PI) / 2),
  outSine: u => Math.sin((clamp01(u) * Math.PI) / 2),
  inOutSine: u => -(Math.cos(Math.PI * clamp01(u)) - 1) / 2,
  inQuad: u => { const k = clamp01(u); return k * k; },
  outQuad: u => { const k = clamp01(u); return 1 - (1 - k) * (1 - k); },
  inOutQuad: u => { const k = clamp01(u); return k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; },
  inCubic: u => { const k = clamp01(u); return k * k * k; },
  outCubic: u => { const k = clamp01(u); return 1 - Math.pow(1 - k, 3); },
  inOutCubic: ease,
  inQuart: u => { const k = clamp01(u); return k * k * k * k; },
  outQuart: u => { const k = clamp01(u); return 1 - Math.pow(1 - k, 4); },
  inOutQuart: u => { const k = clamp01(u); return k < 0.5 ? 8 * k * k * k * k : 1 - Math.pow(-2 * k + 2, 4) / 2; },
  inQuint: u => { const k = clamp01(u); return k * k * k * k * k; },
  outQuint: u => { const k = clamp01(u); return 1 - Math.pow(1 - k, 5); },
  inOutQuint: u => { const k = clamp01(u); return k < 0.5 ? 16 * k * k * k * k * k : 1 - Math.pow(-2 * k + 2, 5) / 2; },
  inExpo: u => { const k = clamp01(u); return k === 0 ? 0 : Math.pow(2, 10 * k - 10); },
  outExpo: u => { const k = clamp01(u); return k === 1 ? 1 : 1 - Math.pow(2, -10 * k); },
  inOutExpo: u => {
    const k = clamp01(u);
    return k === 0 ? 0 : k === 1 ? 1 : k < 0.5 ? Math.pow(2, 20 * k - 10) / 2 : (2 - Math.pow(2, -20 * k + 10)) / 2;
  },
  inCirc: u => { const k = clamp01(u); return 1 - Math.sqrt(1 - k * k); },
  outCirc: u => { const k = clamp01(u); return Math.sqrt(1 - Math.pow(k - 1, 2)); },
  inOutCirc: u => {
    const k = clamp01(u);
    return k < 0.5 ? (1 - Math.sqrt(1 - Math.pow(2 * k, 2))) / 2 : (Math.sqrt(1 - Math.pow(-2 * k + 2, 2)) + 1) / 2;
  },
  inBack: (u, s = 1.70158) => { const k = clamp01(u); return (s + 1) * k * k * k - s * k * k; },
  outBack: (u, s = 1.70158) => { const k = clamp01(u); return 1 + (s + 1) * Math.pow(k - 1, 3) + s * Math.pow(k - 1, 2); },
  inOutBack: (u, s = 1.70158 * 1.525) => {
    const k = clamp01(u);
    return k < 0.5
      ? (Math.pow(2 * k, 2) * ((s + 1) * 2 * k - s)) / 2
      : (Math.pow(2 * k - 2, 2) * ((s + 1) * (k * 2 - 2) + s) + 2) / 2;
  },
  outElastic: u => {
    const k = clamp01(u);
    return k === 0 ? 0 : k === 1 ? 1 : Math.pow(2, -10 * k) * Math.sin((k * 10 - 0.75) * (TAU / 3)) + 1;
  },
  outBounce: u => {
    let k = clamp01(u);
    const n1 = 7.5625, d1 = 2.75;
    if (k < 1 / d1) return n1 * k * k;
    if (k < 2 / d1) return n1 * (k -= 1.5 / d1) * k + 0.75;
    if (k < 2.5 / d1) return n1 * (k -= 2.25 / d1) * k + 0.9375;
    return n1 * (k -= 2.625 / d1) * k + 0.984375;
  },
  spring,
};

// Stateless deterministic hash and element randoms (never use Math.random or Date in a figure).
export const hash = n => fract(Math.sin(n * 127.1 + 311.7) * 43758.5453123);
export const rand = (i, salt = 0) => hash(i * 12.9898 + salt * 78.233 + 0.5);
export const rrange = (i, a, b, salt = 0) => lerp(a, b, rand(i, salt));

// Smooth multi-octave noise on a circle that repeats seamlessly every `period` seconds in [-1, 1].
export function loopNoise(t, seed = 0, period = 12, octaves = 2) {
  let v = 0, amp = 1, norm = 0;
  for (let o = 0; o < octaves; o++) {
    v += amp * Math.sin(TAU * (o + 1) * (t / period) + rand(seed + o, 1) * TAU);
    norm += amp;
    amp *= 0.5;
  }
  return norm > 0 ? v / norm : 0;
}
