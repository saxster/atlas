// Pure mathematical model for Figure B.3: Enzyme catalysis & Michaelis–Menten saturation.
// Zero DOM, zero Three.js imports.
import { rng } from '@saxster/atlas/rng.js';

export const E_TOT = 20;          // μM total enzyme active sites
export const K_ON = 4.0;          // mM⁻¹ s⁻¹ binding rate constant
export const K_OFF = 2.0;         // s⁻¹ unbinding rate constant
export const K_CAT = 6.0;         // s⁻¹ catalytic turnover number
export const K_M = (K_OFF + K_CAT) / K_ON; // 2.0 mM Michaelis constant
export const V_MAX = K_CAT * E_TOT;        // 120 μM/s maximum velocity
export const S_MAX = 10.0;                 // mM maximum substrate concentration on chart
export const COMP_FACTOR = 3.0;            // 1 + [I]/K_i = 3 → K_m,app = 6.0 mM
export const NONCOMP_FACTOR = 0.5;         // V_max,app = 60 μM/s

// Fraction of enzyme active sites occupied at substrate [S] (mM)
export function boundFraction(S, km = K_M) {
  if (S <= 0) return 0;
  return S / (km + S);
}

// Occupied enzyme sites [ES] (out of E_TOT = 20)
export function boundSites(S, km = K_M) {
  return E_TOT * boundFraction(S, km);
}

// Michaelis–Menten reaction velocity v([S]) in μM/s
export function velocity(S, vmax = V_MAX, km = K_M) {
  if (S <= 0) return 0;
  return vmax * boundFraction(S, km);
}

// Competitive inhibition: apparent K_m increases to COMP_FACTOR * K_M = 6.0 mM, V_max unchanged
export function velocityComp(S) {
  return velocity(S, V_MAX, K_M * COMP_FACTOR);
}

// Non-competitive inhibition: apparent V_max drops to 0.5 * V_MAX = 60 μM/s, K_m unchanged
export function velocityNonComp(S) {
  return velocity(S, V_MAX * NONCOMP_FACTOR, K_M);
}

// Initial catalytic efficiency slope dv/d[S] at [S] = 0: V_max / K_m = 60 μM s⁻¹ mM⁻¹
export function initialSlope(vmax = V_MAX, km = K_M) {
  return vmax / km;
}

// Mass-action ODE rate d[ES]/dt for fixed reservoir [S]: k_on (E_tot − [ES])[S] − (k_off + k_cat)[ES]
export function dESdt(S, ES) {
  return K_ON * (E_TOT - ES) * S - (K_OFF + K_CAT) * ES;
}

// Deterministic cloud of substrate & product positions around the globular enzyme (radius ~1.05)
export function moleculeCloud(count = 60, seed = 2026) {
  const rand = rng(seed);
  const pts = [];
  for (let i = 0; i < count; i++) {
    const u = rand.next() * 2 - 1;
    const phi = rand.next() * Math.PI * 2;
    const r = 1.28 + rand.next() * 0.62;
    const s = Math.sqrt(Math.max(0, 1 - u * u));
    pts.push({
      x: r * s * Math.cos(phi),
      y: r * u * 0.85,
      z: r * s * Math.sin(phi) * 0.75,
      phase: rand.next() * Math.PI * 2,
    });
  }
  return pts;
}
