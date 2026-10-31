// Figure C.3 model: Activation energy, Maxwell–Boltzmann distribution, and catalysis.
// Energies in kJ/mol, temperature T in K, universal gas constant R = 8.3144626e-3 kJ/(mol·K).
// Pure maths — no DOM, no Three.js.
import { rng } from '@saxster/atlas/rng.js';

export const R_GAS = 8.3144626e-3;   // kJ / (mol · K)
export const DELTA_H = -15.0;        // reaction enthalpy ΔH = U(products) − U(reactants) (kJ/mol)
export const A_PRE = 1.0e9;          // Arrhenius pre-exponential frequency factor A (s⁻¹)
export const DURATION = 10.0;        // explorer run duration (s)
export const N_PARTICLES = 48;       // colliding molecules on the 3D reaction-coordinate hill

// Effective forward and reverse activation barriers (kJ/mol)
export const effectiveEa = (Ea, dEcat = 0) => Math.max(8, Ea - dEcat);
export const reverseEa = (Ea, dEcat = 0) => effectiveEa(Ea, dEcat) - DELTA_H;

// Smooth potential energy profile U(x) along reaction coordinate x ∈ [0, 1]
// Reactants at x = 0 (U = 0), transition-state peak at x = 0.5 (U = E_eff), products at x = 1 (U = ΔH = −15 kJ/mol).
export function barrierU(x, Ea, dEcat = 0) {
  const Eeff = effectiveEa(Ea, dEcat);
  const xc = Math.min(1, Math.max(0, x));
  if (xc <= 0.5) {
    const s = Math.sin(Math.PI * xc);
    return Eeff * s * s;
  }
  const c = Math.cos(Math.PI * (xc - 0.5));
  return DELTA_H + (Eeff - DELTA_H) * c * c;
}

// 3D Maxwell–Boltzmann kinetic energy distribution f(E, T) (in (kJ/mol)⁻¹), normalized so ∫₀^∞ f(E, T) dE = 1
export function mbDensity(E, T) {
  if (E <= 0) return 0;
  const rt = R_GAS * T;
  return (2 / Math.sqrt(Math.PI)) * Math.sqrt(E) * Math.pow(rt, -1.5) * Math.exp(-E / rt);
}

// 2D collision energy distribution f_2D(E, T) = (1/RT) e^(−E/RT), whose tail ∫_{Ea}^∞ f_2D dE is e^(−Ea/RT)
export function mbCollision2D(E, T) {
  if (E < 0) return 0;
  const rt = R_GAS * T;
  return (1 / rt) * Math.exp(-E / rt);
}

// Mean thermal kinetic energy (3/2) R T (kJ/mol) and peak energy (1/2) R T of 3D MB distribution
export const meanThermalEnergy = T => 1.5 * R_GAS * T;
export const peakThermalEnergy = T => 0.5 * R_GAS * T;

// Boltzmann reactive fraction exp(−E_eff / RT)
export function boltzmannFraction(T, Ea, dEcat = 0) {
  const Eeff = effectiveEa(Ea, dEcat);
  return Math.exp(-Eeff / (R_GAS * T));
}

// Forward and reverse Arrhenius rate constants k(T, Ea, dEcat) = A exp(−E_eff / RT)
export function rateConstant(T, Ea, dEcat = 0) {
  return A_PRE * boltzmannFraction(T, Ea, dEcat);
}
export function reverseRateConstant(T, Ea, dEcat = 0) {
  const Erev = reverseEa(Ea, dEcat);
  return A_PRE * Math.exp(-Erev / (R_GAS * T));
}
export function equilibriumK(T, Ea, dEcat = 0) {
  return rateConstant(T, Ea, dEcat) / reverseRateConstant(T, Ea, dEcat);
}

// Ratio of rate at T + 10 K to rate at T
export function tenDegreeRatio(T, Ea, dEcat = 0) {
  return rateConstant(T + 10, Ea, dEcat) / rateConstant(T, Ea, dEcat);
}

// Catalyst speedup factor k_cat / k_uncat = exp(+ΔE_cat / RT)
export function catalystFactor(T, dEcat = 0) {
  return Math.exp(dEcat / (R_GAS * T));
}

// Deterministic ensemble of colliding molecules for the 3D potential energy hill.
// Each particle has a quantile u ∈ (0, 1) that maps to collision energy E_i(T) on the visual energy scale,
// so raising T or lowering E_eff immediately lets more molecules summit the barrier x = 0.5!
export function buildColliders(count = N_PARTICLES, seed = 303) {
  const R = rng(seed);
  const out = [];
  for (let i = 0; i < count; i++) {
    const u = (i + 0.5) / count; // stratified quantile in (0, 1)
    out.push({
      u,
      phase: R.next() * DURATION,
      speed: 0.28 + 0.14 * R.next(),
      zOff: (R.next() - 0.5) * 0.55,
    });
  }
  return out;
}

// Visual collision energy E_vis(u, T) (in kJ/mol) scaled so the visible tail matches the MB chart on [0, 80] kJ/mol
// At T = 300 K, visual temperature scale RT_vis = 14 kJ/mol gives a clear tail above E_a = 35–75 kJ/mol
export function visualCollisionEnergy(u, T) {
  const rtVis = 14.0 * (T / 300);
  return -rtVis * Math.log(Math.max(1e-4, 1 - u));
}

// Find the turning point x_turn ∈ [0, 0.5) on the reactant side where barrierU(x_turn) = E_particle
export function turningPointX(Epart, Eeff) {
  if (Epart >= Eeff) return 0.5;
  if (Epart <= 0) return 0.02;
  // Eeff * sin²(π x) = Epart  =>  x = arcsin(√(Epart / Eeff)) / π
  return Math.asin(Math.sqrt(Epart / Eeff)) / Math.PI;
}
