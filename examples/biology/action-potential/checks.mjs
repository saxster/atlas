// node examples/biology/action-potential/checks.mjs — independent proofs of Nernst potentials, chord conductance limits, and Hodgkin–Huxley phase timing.
import { checks, near, deriv, bisect } from '@saxster/atlas/checks.js';
import * as M from './model.js';

const C = checks();

// 1. Nernst equation E_X = (RT/zF) ln([X]_out/[X]_in) reproduces E_Na ≈ +55 mV and E_K ≈ -77 mV at 37 °C
C.check('Nernst potentials match E_Na ≈ +55 mV and E_K ≈ -77 mV',
  near(M.nernstPotential(M.NA_OUT, M.NA_IN, 1), M.E_NA, 2e-3) &&
  near(M.nernstPotential(M.K_OUT, M.K_IN, 1), M.E_K, 2e-3));

// 2. Chord conductance limits: g_Na ≫ g_K drives V_m → E_Na (+55 mV); g_K ≫ g_Na drives V_m → E_K (-77 mV)
C.check('chord conductance approaches E_Na (+55 mV) when g_Na dominates and E_K (-77 mV) when g_K dominates',
  near(M.chordPotential(1e5, M.G_K_REST, M.G_L), M.E_NA, 1e-4) &&
  near(M.chordPotential(M.G_NA_REST, 1e5, M.G_L), M.E_K, 1e-4));

// 3. Resting membrane potential V_m(t) = -70 mV for t ∈ [0, 0.8] ms, and threshold V_m(1.5) ≈ -55 mV
C.check('resting potential is -70 mV on [0, 0.8] ms and reaches threshold -55 mV at t = 1.5 ms',
  near(M.membranePotential(0.0), M.V_REST, 1e-9) &&
  near(M.membranePotential(0.8), M.V_REST, 1e-9) &&
  near(M.membranePotential(1.5), M.V_TH, 0.02));

// 4. Depolarization overshoot exceeds +30 mV (around +35 mV) and hyperpolarization undershoot drops below -72 mV
{
  let vMax = -Infinity, tPeakV = 0, vMin = Infinity, tMinV = 0;
  for (let t = 0; t <= M.DURATION; t += 0.005) {
    const v = M.membranePotential(t);
    if (v > vMax) { vMax = v; tPeakV = t; }
    if (t > 3.0 && v < vMin) { vMin = v; tMinV = t; }
  }
  C.check('depolarization peak exceeds +30 mV and hyperpolarization undershoot drops below -72 mV',
    vMax > 30 && vMin < -72 && near(M.membranePotential(M.DURATION), M.V_REST, 1e-6),
    `peak = ${vMax.toFixed(1)} mV at ${tPeakV.toFixed(2)} ms, undershoot = ${vMin.toFixed(1)} mV at ${tMinV.toFixed(2)} ms`);
}

// 5. Na⁺ conductance g_Na(t) peaks before delayed rectifier K⁺ conductance g_K(t)
{
  let gNaMax = 0, tNaPeak = 0, gKMax = 0, tKPeak = 0;
  for (let t = 0; t <= M.DURATION; t += 0.005) {
    const na = M.gNa(t), k = M.gK(t);
    if (na > gNaMax) { gNaMax = na; tNaPeak = t; }
    if (k > gKMax) { gKMax = k; tKPeak = t; }
  }
  const upCross = bisect(t => M.membranePotential(t), 1.5, 2.25);
  const downCross = bisect(t => M.membranePotential(t), 2.3, 3.5);
  C.check('g_Na peaks during upstroke before g_K peaks during repolarization',
    tNaPeak < tKPeak && gNaMax > 25 && gKMax > 14 && upCross < tNaPeak && tNaPeak < downCross,
    `t_Na = ${tNaPeak.toFixed(2)} ms (${gNaMax.toFixed(1)} mS/cm²) < t_K = ${tKPeak.toFixed(2)} ms (${gKMax.toFixed(1)} mS/cm²)`);
}

// 6. Smooth derivative dV_m/dt is positive on the upstroke and negative on the downstroke
C.check('dV_m/dt > 0 on the rising phase (t = 1.9 ms) and dV_m/dt < 0 on repolarization (t = 2.8 ms)',
  deriv(t => M.membranePotential(t), 1.9) > 50 && deriv(t => M.membranePotential(t), 2.8) < -50);

C.report();
