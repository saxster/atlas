// Pure mathematical model for Figure B.6: Lotka–Volterra predator–prey cycles & natural selection.
// ODE system, coexistence equilibrium (Volterra's principle), conserved first integral V(R, F),
// RK4 trajectory solver, and Hardy–Weinberg / directional selection allele-frequency recursion.
// Zero DOM, zero Three.js imports.

export const DURATION = 10.0;          // screen seconds for explorer run
export const TIME_SCALE = 2.4;         // model time units per screen second (T_MAX = 24.0)
export const T_MAX = DURATION * TIME_SCALE;
export const DELTA_DEFAULT = 0.025;    // predator birth efficiency per prey consumed

export const DEFAULT_PARAMS = {
  alpha: 1.0,    // prey intrinsic birth rate α
  beta: 0.05,    // predation rate coefficient β
  gamma: 0.75,   // predator mortality rate γ
  R0: 45,        // initial prey population R(0) (in dozens, or individuals in meadow)
  F0: 15,        // initial predator population F(0)
  delta: DELTA_DEFAULT,
};

// Lotka–Volterra RHS: dR/dt = αR − βRF, dF/dt = δRF − γF
export function lvDeriv(R, F, { alpha = 1.0, beta = 0.05, gamma = 0.75, delta = DELTA_DEFAULT } = {}) {
  return [
    alpha * R - beta * R * F,
    delta * R * F - gamma * F,
  ];
}

// Coexistence equilibrium (R*, F*) = (γ/δ, α/β) — note R* depends ONLY on predator parameters (γ, δ)!
export function equilibrium({ alpha = 1.0, beta = 0.05, gamma = 0.75, delta = DELTA_DEFAULT } = {}) {
  return {
    Rstar: gamma / delta,
    Fstar: alpha / beta,
  };
}

// Exact conserved first integral (Lyapunov / Hamiltonian invariant) along closed orbits:
// V(R, F) = δR − γ ln(R) + βF − α ln(F)
export function conservedV(R, F, { alpha = 1.0, beta = 0.05, gamma = 0.75, delta = DELTA_DEFAULT } = {}) {
  return delta * R - gamma * Math.log(R) + beta * F - alpha * Math.log(F);
}

// Linearized oscillation period around (R*, F*): T₀ = 2π / √(α·γ)
export function smallAmplitudePeriod({ alpha = 1.0, gamma = 0.75 } = {}) {
  return (2 * Math.PI) / Math.sqrt(alpha * gamma);
}

// High-accuracy RK4 integration of (R(t), F(t)) over t ∈ [0, T_MAX]
export function simulate(params = DEFAULT_PARAMS, steps = 1200) {
  const p = { ...DEFAULT_PARAMS, ...params };
  const h = T_MAX / steps;
  let R = p.R0, F = p.F0;
  const traj = [{ t: 0, R, F, V: conservedV(R, F, p) }];

  for (let i = 1; i <= steps; i++) {
    const [k1R, k1F] = lvDeriv(R, F, p);
    const [k2R, k2F] = lvDeriv(R + 0.5 * h * k1R, F + 0.5 * h * k1F, p);
    const [k3R, k3F] = lvDeriv(R + 0.5 * h * k2R, F + 0.5 * h * k2F, p);
    const [k4R, k4F] = lvDeriv(R + h * k3R, F + h * k3F, p);
    R += (h / 6) * (k1R + 2 * k2R + 2 * k3R + k4R);
    F += (h / 6) * (k1F + 2 * k2F + 2 * k3F + k4F);
    const t = i * h;
    traj.push({ t, R, F, V: conservedV(R, F, p) });
  }
  return { params: p, steps, h, traj, eq: equilibrium(p) };
}

// Smooth interpolation of (R, F) at screen clock ∈ [0, DURATION]
export function stateAt(sim, clock) {
  const tModel = Math.max(0, Math.min(T_MAX, clock * TIME_SCALE));
  const u = tModel / sim.h;
  const idx = Math.min(sim.steps - 1, Math.floor(u));
  const frac = u - idx;
  const A = sim.traj[idx], B = sim.traj[idx + 1];
  const R = A.R + (B.R - A.R) * frac;
  const F = A.F + (B.F - A.F) * frac;
  const [dR, dF] = lvDeriv(R, F, sim.params);
  return { clock, tModel, R, F, dR, dF, V: conservedV(R, F, sim.params), idx };
}

// Closed phase-plane orbit parameterized by θ ∈ [0, 1] from the simulated trajectory over one full period
export function orbitPoint(sim, u) {
  const T = smallAmplitudePeriod(sim.params) * 1.04;
  const tModel = Math.max(0, Math.min(T_MAX, u * T));
  const s = tModel / sim.h;
  const idx = Math.min(sim.steps - 1, Math.floor(s));
  const frac = s - idx;
  const A = sim.traj[idx], B = sim.traj[idx + 1];
  return [A.R + (B.R - A.R) * frac, A.F + (B.F - A.F) * frac];
}

// Hardy–Weinberg & natural selection diploid allele-frequency step:
// p_{t+1} = (p² w_AA + p q w_Aa) / w_bar, where w_bar = p² w_AA + 2pq w_Aa + q² w_aa
export function nextAlleleFreq(p, wAA = 1.0, wAa = 1.0, waa = 1.0) {
  const q = 1 - p;
  const wBar = p * p * wAA + 2 * p * q * wAa + q * q * waa;
  return (p * p * wAA + p * q * wAa) / wBar;
}
