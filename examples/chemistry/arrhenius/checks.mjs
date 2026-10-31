// node examples/chemistry/arrhenius/checks.mjs — Maxwell–Boltzmann normalization, Arrhenius slope −E_a/R,
// the 10 °C doubling rule at E_a = 54 kJ/mol, and catalytic invariance of ΔH and K_eq verified.
import { checks, near, deriv, integ } from '@saxster/atlas/checks.js';
import * as M from './model.js';

const C = checks();

// 1. Maxwell–Boltzmann 3D distribution integrates to 1 and ⟨E⟩ = (3/2)RT for T = 280, 310, 360 K
for (const T of [280, 310, 360]) {
  const norm = integ(E => M.mbDensity(E, T), 0, 80, 4000);
  const normSmooth = integ(u => 2 * u * M.mbDensity(u * u, T), 0, 10, 2000);
  const meanE = integ(u => 2 * u * (u * u) * M.mbDensity(u * u, T), 0, 10, 2000);
  C.check(`Maxwell–Boltzmann ∫₀^80 f(E, ${T} K) dE = 1 and ⟨E⟩ = (3/2)RT`,
    near(norm, 1.0, 2e-4) && near(normSmooth, 1.0, 1e-9) && near(meanE, M.meanThermalEnergy(T), 1e-8),
    `∫f = ${normSmooth.toFixed(7)}, ⟨E⟩ = ${meanE.toFixed(4)} kJ/mol`);
}

// 2. 2D collision energy tail ∫_{Ea}^∞ (1/RT)e^(−E/RT) dE equals Boltzmann factor e^(−Ea/RT)
for (const [T, Ea] of [[300, 45], [310, 54], [340, 65]]) {
  const tail = integ(E => M.mbCollision2D(E, T), Ea, 160, 4000);
  const boltz = M.boltzmannFraction(T, Ea, 0);
  C.check(`collision tail ∫_${Ea}^∞ f_2D(E, ${T} K) dE matches Boltzmann factor e^(−E_a/RT)`,
    near(tail, boltz, 1e-4), `tail = ${tail.toExponential(4)} vs ${boltz.toExponential(4)}`);
}

// 3. Arrhenius plot: d(ln k)/d(1/T) has exact slope −E_a / R
for (const Ea of [40, 54, 70]) {
  const invT0 = 1 / 310;
  const slope = deriv(invT => Math.log(M.rateConstant(1 / invT, Ea, 0)), invT0, 1e-6);
  const exactSlope = -Ea / M.R_GAS;
  C.check(`Arrhenius slope d(ln k)/d(1/T) at E_a = ${Ea} kJ/mol equals −E_a/R`,
    near(slope, exactSlope, 1e-6), `slope = ${slope.toFixed(1)} K vs −E_a/R = ${exactSlope.toFixed(1)} K`);
}

// 4. The 10 °C rule of thumb: raising T from 300 K to 310 K at E_a = 54 kJ/mol doubles k (×2.01),
// while mean thermal kinetic energy (3/2)RT increases by only 3.33%
{
  const ratioK = M.tenDegreeRatio(300, 54, 0);
  const ratioE = M.meanThermalEnergy(310) / M.meanThermalEnergy(300);
  C.check('raising T from 300 K to 310 K at E_a = 54 kJ/mol doubles k (×2.01) while ⟨E⟩ rises only 3.3%',
    Math.abs(ratioK - 2.01) < 0.02 && near(ratioE, 310 / 300, 1e-12),
    `k(310)/k(300) = ${ratioK.toFixed(3)}, ⟨E⟩(310)/⟨E⟩(300) = ${ratioE.toFixed(4)}`);
}

// 5. Reaction coordinate barrier U(x): U(0) = 0, U(0.5) = E_eff, U(1) = ΔH = −15 kJ/mol, and dU/dx = 0 at 0, 0.5, 1
for (const dEcat of [0, 12, 20]) {
  const Ea = 54, Eeff = M.effectiveEa(Ea, dEcat);
  const u0 = M.barrierU(0, Ea, dEcat), uPeak = M.barrierU(0.5, Ea, dEcat), u1 = M.barrierU(1, Ea, dEcat);
  const dPeak = deriv(x => M.barrierU(x, Ea, dEcat), 0.5, 1e-7);
  C.check(`barrier U(x) with ΔE_cat = ${dEcat}: U(0)=0, U(0.5)=${Eeff}, U(1)=${M.DELTA_H}, and U'(0.5)=0`,
    near(u0, 0, 1e-12) && near(uPeak, Eeff, 1e-12) && near(u1, M.DELTA_H, 1e-12) && near(dPeak, 0, 1e-4));
}

// 6. Catalyst lowers both forward and reverse barriers by ΔE_cat, leaving ΔH and K_eq = k_f/k_r unchanged
{
  const T = 310, Ea = 54;
  const K0 = M.equilibriumK(T, Ea, 0);
  const Kcat = M.equilibriumK(T, Ea, 15);
  const dH0 = M.effectiveEa(Ea, 0) - M.reverseEa(Ea, 0);
  const dHcat = M.effectiveEa(Ea, 15) - M.reverseEa(Ea, 15);
  const kRatio = M.rateConstant(T, Ea, 15) / M.rateConstant(T, Ea, 0);
  C.check('catalyst (ΔE_cat = 15 kJ/mol) speeds up k_f and k_r equally so ΔH = −15 kJ/mol and K_eq are unchanged',
    near(K0, Kcat, 1e-9) && near(dH0, M.DELTA_H, 1e-12) && near(dHcat, M.DELTA_H, 1e-12) && near(kRatio, M.catalystFactor(T, 15), 1e-9),
    `K_eq = ${K0.toFixed(2)}, speedup = ×${kRatio.toFixed(1)}`);
}

C.report();
