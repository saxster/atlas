// Seeded randomness, so a stochastic figure draws the same pile for the same seed and its checks are exact.
// mulberry32: 32-bit state, fast, good enough for teaching figures (not for cryptography).
export function rng(seed = 1) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,                                              // uniform on [0, 1)
    int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)),    // uniform integer in [lo, hi]
    bernoulli: p => next() < p,
    // standard normal by Box–Muller (u1 kept away from 0)
    normal: (mu = 0, sigma = 1) => mu + sigma * Math.sqrt(-2 * Math.log(1 - next())) * Math.cos(2 * Math.PI * next()),
  };
}
