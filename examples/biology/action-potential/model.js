// Pure mathematical model for Figure B.4: Hodgkin–Huxley membrane action potential.
// Nernst equilibrium potentials, chord conductance equation, gating variables (m, h, n), and time courses.
// Zero DOM, zero Three.js imports.

export const RT_OVER_F = 26.71;        // mV at 37 °C (310.15 K)
export const NA_OUT = 117.59;          // mM extracellular [Na⁺]
export const NA_IN = 15.0;             // mM intracellular [Na⁺]
export const K_OUT = 7.84;             // mM extracellular [K⁺]
export const K_IN = 140.0;             // mM intracellular [K⁺]

export const E_NA = 55.0;              // mV Na⁺ Nernst equilibrium potential
export const E_K = -77.0;              // mV K⁺ Nernst equilibrium potential
export const E_L = -54.4;              // mV leak equilibrium potential
export const V_REST = -70.0;           // mV resting membrane potential
export const V_TH = -55.0;             // mV action potential threshold
export const V_PEAK = 35.0;            // mV depolarization overshoot peak
export const V_UNDER = -75.0;          // mV hyperpolarization undershoot

export const G_L = 0.3;                // mS/cm² leak conductance
export const G_NA_REST = 0.05;         // mS/cm² resting Na⁺ conductance
// Chosen so chordPotential(G_NA_REST, G_K_REST, G_L) === V_REST = -70.0 mV
export const G_K_REST = (G_NA_REST * (E_NA - V_REST) + G_L * (E_L - V_REST)) / (V_REST - E_K);
export const DURATION = 5.0;           // ms total action potential window

// Nernst equilibrium potential E_X = (RT / zF) ln([X]_out / [X]_in) in mV
export function nernstPotential(cOut, cIn, z = 1) {
  return (RT_OVER_F / z) * Math.log(cOut / cIn);
}

// Chord conductance equation: V_m = (g_Na E_Na + g_K E_K + g_L E_L) / (g_Na + g_K + g_L)
export function chordPotential(gNa, gK, gL = G_L) {
  return (gNa * E_NA + gK * E_K + gL * E_L) / (gNa + gK + gL);
}

// Smooth C¹ hermite step between t0 and t1
function smoothstep(t0, t1, t) {
  const u = Math.max(0, Math.min(1, (t - t0) / (t1 - t0)));
  return u * u * (3 - 2 * u);
}

// Asymmetric physiological pulse peaking at tPeak with rise width wRise and fall width wFall
function asymPulse(t, tPeak, wRise, wFall) {
  const dt = t - tPeak;
  const w = dt < 0 ? wRise : wFall;
  const x = dt / w;
  return Math.exp(-x * x);
}

// Na⁺ activation gate m(t) ∈ [0.05, 0.99]: snaps open once threshold is crossed at t = 1.5 ms
export function gateM(t) {
  const up = smoothstep(1.1, 2.2, t);
  const down = 1 - smoothstep(2.4, 3.55, t);
  return 0.05 + 0.94 * up * down;
}

// Na⁺ inactivation ball-and-chain gate h(t) ∈ [0.04, 0.92]: open at rest, plugs pore after peak
export function gateH(t) {
  const plug = smoothstep(1.9, 2.9, t);
  const unplug = smoothstep(3.9, 4.95, t);
  return 0.92 - 0.88 * plug * (1 - unplug);
}

// Delayed rectifier K⁺ gate n(t) ∈ [0.18, 0.95]: opens with a delay and closes slowly during undershoot
export function gateN(t) {
  const open = smoothstep(1.75, 3.05, t);
  const close = 1 - smoothstep(3.4, 4.95, t);
  return 0.18 + 0.77 * open * close;
}

// Time-dependent Na⁺ conductance g_Na(t) in mS/cm² (peaks at t ≈ 2.20 ms during depolarization spike)
export function gNa(t) {
  if (t <= 0.8) return G_NA_REST;
  const sub = 0.24 * smoothstep(0.8, 1.5, t) * (1 - smoothstep(1.5, 2.0, t));
  const spike = 28.0 * asymPulse(t, 2.20, 0.35, 0.56) * smoothstep(1.5, 2.15, t) * (1 - smoothstep(3.1, 3.75, t));
  const refractory = 1 - 0.88 * smoothstep(3.55, 3.95, t) * (1 - smoothstep(4.45, 5.0, t));
  return G_NA_REST * refractory + sub + spike;
}

// Time-dependent K⁺ conductance g_K(t) in mS/cm² (peaks at t ≈ 3.15 ms during repolarization)
export function gK(t) {
  if (t <= 1.5) return G_K_REST;
  const delayedWave = 16.5 * asymPulse(t, 3.15, 0.72, 0.88) * smoothstep(1.6, 2.4, t) * (1 - smoothstep(4.55, 5.0, t));
  return G_K_REST + delayedWave;
}

// Subthreshold stimulus depolarization bump (brings V_m from -70 mV at t = 0.8 ms to exactly V_th = -55 mV at t = 1.5 ms)
const STIM_AMP_15 = V_TH - chordPotential(G_NA_REST + 0.24, G_K_REST, G_L);
export function stimulusOffset(t) {
  if (t <= 0.8 || t >= 2.15) return 0;
  const rise = smoothstep(0.8, 1.5, t);
  const fade = 1 - smoothstep(1.5, 2.15, t);
  return STIM_AMP_15 * rise * fade;
}

// Membrane potential V_m(t) in mV over t ∈ [0, 5] ms
export function membranePotential(t) {
  const clamped = Math.max(0, Math.min(DURATION, t));
  return chordPotential(gNa(clamped), gK(clamped), G_L) + stimulusOffset(clamped);
}

// Ionic currents (normalized visual magnitudes for inward Na⁺ rush and outward K⁺ reset)
export function inwardNaFlux(t) {
  const v = membranePotential(t);
  return Math.max(0, gNa(t) * (E_NA - v) / 600);
}

export function outwardKFlux(t) {
  const v = membranePotential(t);
  return Math.max(0, gK(t) * (v - E_K) / 600);
}
