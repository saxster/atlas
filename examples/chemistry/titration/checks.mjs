// node examples/chemistry/titration/checks.mjs — weak-acid/strong-base charge balance,
// initial pH, Henderson–Hasselbalch half-equivalence buffer, and basic equivalence point verified.
import { checks, near, deriv, bisect } from '@saxster/atlas/checks.js';
import * as M from './model.js';

const C = checks();

// 1. Charge-balance residual |[H⁺] + [Na⁺] − [OH⁻] − [A⁻]| < 10⁻¹² across V_b ∈ [0, 35] mL
{
  let maxRes = 0;
  for (let v = 0; v <= 35; v += 0.5) {
    const pH = M.phAt(v);
    maxRes = Math.max(maxRes, Math.abs(M.chargeResidual(v, pH)));
  }
  C.check('charge-balance residual < 10⁻¹² M across all volumes V_b ∈ [0, 35] mL',
    maxRes < 1e-12, `max |residual| = ${maxRes.toExponential(2)} M`);
}

// 2. Initial weak acid pH(0) ≈ 2.87 matches quadratic weak-acid root [H⁺]² + K_a[H⁺] − K_a C_a = 0
{
  const pH0 = M.phAt(0);
  const Hquad = 0.5 * (-M.K_A + Math.sqrt(M.K_A * M.K_A + 4 * M.K_A * M.C_A));
  const pHquad = -Math.log10(Hquad);
  C.check('initial pH(0) ≈ 2.87 matches weak-acid quadratic root',
    near(pH0, pHquad, 1e-6) && Math.abs(pH0 - 2.872) < 0.005, `pH(0) = ${pH0.toFixed(4)}`);
}

// 3. Half-equivalence V_b = 12.5 mL: [HA] ≈ [A⁻], α_{HA} ≈ 0.5, and pH ≈ pK_a = 4.745
{
  const sp = M.speciesAt(M.V_HALF);
  C.check('at half-equivalence V_b = 12.5 mL, pH matches pK_a = 4.745 and [HA] ≈ [A⁻]',
    Math.abs(sp.pH - M.PKA) < 0.002 && Math.abs(sp.alphaHA - 0.5) < 0.002 && Math.abs(sp.alphaA - 0.5) < 0.002,
    `pH(12.5) = ${sp.pH.toFixed(4)}, pK_a = ${M.PKA.toFixed(4)}, α_A = ${sp.alphaA.toFixed(4)}`);
}

// 4. Buffer region: Henderson–Hasselbalch matches exact charge-balance pH within 0.01 across V_b ∈ [4, 21] mL
{
  let maxDiff = 0;
  for (const v of [4, 8, 12.5, 17, 21]) {
    maxDiff = Math.max(maxDiff, Math.abs(M.phAt(v) - M.phHenderson(v)));
  }
  C.check('Henderson–Hasselbalch matches exact pH within 0.01 across the buffer zone [4, 21] mL',
    maxDiff < 0.01, `max |pH − pH_HH| = ${maxDiff.toFixed(5)}`);
}

// 5. Equivalence point V_b = 25.0 mL is basic (pH ≈ 8.72 > 7) due to acetate hydrolysis A⁻ + H₂O ⇌ HA + OH⁻
{
  const pHeq = M.phAt(M.V_EQ);
  const Ceq = (M.C_A * M.V_A) / (M.V_A + M.V_EQ); // 0.050 M sodium acetate
  const Kb = M.K_W / M.K_A;
  const OHhyd = Math.sqrt(Kb * Ceq);
  const pHhyd = 14 + Math.log10(OHhyd);
  C.check('equivalence point V_b = 25.0 mL is basic (pH ≈ 8.72 > 7) and matches acetate hydrolysis √(K_b C_eq)',
    pHeq > 8.5 && near(pHeq, pHhyd, 1e-4), `pH(25) = ${pHeq.toFixed(4)} vs hydrolysis ${pHhyd.toFixed(4)}`);
}

// 6. Buffer slope d(pH)/dV_b is minimum near half-equivalence and spikes > 100× steeper at equivalence
{
  const slopeHalf = deriv(M.phAt, M.V_HALF, 1e-3);
  const slopeEq = deriv(M.phAt, M.V_EQ, 1e-4);
  const vMinSlope = bisect(v => deriv(u => deriv(M.phAt, u, 1e-3), v, 1e-3), 8.0, 17.0);
  C.check('buffer slope d(pH)/dV_b is flattest at half-equivalence (12.5 mL) and spikes at equivalence (25.0 mL)',
    Math.abs(vMinSlope - M.V_HALF) < 0.05 && slopeEq > 100 * slopeHalf,
    `slope(12.5) = ${slopeHalf.toFixed(4)}/mL, slope(25.0) = ${slopeEq.toFixed(1)}/mL`);
}

// 7. Excess strong base V_b = 32.0 mL: pH ≈ 12.04 matches dilution of excess OH⁻
{
  const pH32 = M.phAt(32.0);
  const OHexc = (M.C_B * (32.0 - M.V_EQ)) / (M.V_A + 32.0);
  const pHexc = 14 + Math.log10(OHexc);
  C.check('excess base at V_b = 32.0 mL matches excess [OH⁻] = 0.01228 M (pH ≈ 12.09)',
    near(pH32, pHexc, 1e-4), `pH(32) = ${pH32.toFixed(4)}`);
}

C.report();
