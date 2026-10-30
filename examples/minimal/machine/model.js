// Half-lives: N nuclei, each with its own random lifetime. In one half-life each one still there decays with chance ½,
// so after k half-lives about N/2ᵏ are left. Pure functions; the clock counts half-lives. A seeded run, so the same
// seed always decays the same nuclei at the same moments.
import { rng } from '@saxster/atlas/rng.js';

export const N = 200, COLS = 20, ROWS = 10, SEED = 13;
export const HALF_LIFE_S = 5730 * 365.25 * 86400;   // carbon-14's half-life, for the speed badge
export const expected = k => N / 2 ** k;
export const sigma = k => Math.sqrt(N * 2 ** -k * (1 - 2 ** -k));   // the binomial spread of the count

// each nucleus's lifetime in half-lives: P(life > k) = 2^−k, so life = −log₂ U for U uniform on (0, 1]
export const lifetimes = (seed = SEED) => { const g = rng(seed); return Array.from({ length: N }, () => -Math.log2(1 - g.next())); };
export const left = (lives, k) => lives.filter(l => l > k).length;

const LIVES = lifetimes();
export const at = clock => ({ k: Math.max(clock, 0), lives: LIVES, left: left(LIVES, clock), expected: expected(clock) });
