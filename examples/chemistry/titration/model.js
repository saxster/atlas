// Figure C.2 model: Weak-acid / strong-base titration & buffers.
// Titrating V_a = 25.0 mL of C_a = 0.100 M acetic acid (CH₃COOH, K_a = 1.8 × 10⁻⁵, pK_a = 4.7447)
// with C_b = 0.100 M NaOH for V_b ∈ [0, 35] mL. Pure maths — no DOM, no Three.js.
import { rng } from '@saxster/atlas/rng.js';

export const V_A = 25.0;             // initial volume of weak acid (mL)
export const C_A = 0.100;            // concentration of weak acid CH₃COOH (M)
export const C_B = 0.100;            // concentration of strong base NaOH (M)
export const K_A = 1.8e-5;           // acid dissociation constant of acetic acid at 25 °C
export const PKA = -Math.log10(K_A); // 4.744727...
export const K_W = 1.0e-14;          // water autoionization constant at 25 °C
export const V_EQ = (C_A * V_A) / C_B; // 25.0 mL
export const V_HALF = 0.5 * V_EQ;      // 12.5 mL
export const V_MAX = 35.0;             // maximum titrant volume (mL)
export const N_MOLECULES = 60;         // total HA + A⁻ molecules shown in the flask

// Charge balance residual: [H⁺] + [Na⁺] − [OH⁻] − [A⁻] (in M) for a given V_b (mL) and pH
export function chargeResidual(Vb, pH) {
  const H = 10 ** -pH;
  const OH = K_W / H;
  const Vtot = V_A + Vb;
  const Na = (C_B * Vb) / Vtot;
  const Ctot = (C_A * V_A) / Vtot;
  const A = Ctot * (K_A / (H + K_A));
  return H + Na - OH - A;
}

// Exact pH at added base volume V_b (mL) by bisection on the monotonically decreasing charge balance
export function phAt(Vb) {
  const v = Math.max(0, Vb);
  let lo = 0.0, hi = 14.0;
  for (let i = 0; i < 80; i++) {
    const mid = 0.5 * (lo + hi);
    if (chargeResidual(v, mid) > 0) lo = mid;
    else hi = mid;
  }
  return 0.5 * (lo + hi);
}

// Strong-acid comparison: 25.0 mL of 0.100 M HCl titrated with 0.100 M NaOH
export function phStrongAt(Vb) {
  const v = Math.max(0, Vb);
  const Vtot = V_A + v;
  const netStrong = (C_B * v - C_A * V_A) / Vtot; // [Na⁺] − [Cl⁻]
  // [H⁺] − K_w/[H⁺] + netStrong = 0  =>  [H⁺] = ( -netStrong + sqrt(netStrong² + 4 K_w) ) / 2
  const H = 0.5 * (-netStrong + Math.sqrt(netStrong * netStrong + 4 * K_W));
  return -Math.log10(H);
}

// Henderson–Hasselbalch approximation in the buffer region (0 < V_b < V_eq)
export function phHenderson(Vb) {
  const v = Math.min(V_EQ - 1e-4, Math.max(1e-4, Vb));
  return PKA + Math.log10(v / (V_EQ - v));
}

// Fraction of conjugate base α_{A⁻} = [A⁻] / ([HA] + [A⁻]) and protonated acid α_{HA} = 1 − α_{A⁻}
export function alphaBase(pH) {
  const H = 10 ** -pH;
  return K_A / (H + K_A);
}
export function alphaAcid(pH) {
  return 1 - alphaBase(pH);
}

// Exact species concentrations (in M) at volume V_b
export function speciesAt(Vb) {
  const pH = phAt(Vb);
  const H = 10 ** -pH;
  const OH = K_W / H;
  const Vtot = V_A + Vb;
  const Ctot = (C_A * V_A) / Vtot;
  const Na = (C_B * Vb) / Vtot;
  const aBase = K_A / (H + K_A);
  const aAcid = 1 - aBase;
  return {
    Vb,
    pH,
    H,
    OH,
    Na,
    Ctot,
    HA: Ctot * aAcid,
    A: Ctot * aBase,
    alphaHA: aAcid,
    alphaA: aBase,
  };
}

// Phenolphthalein indicator pink fraction (transitions across pH 8.2 – 10.0, pK_In ≈ 9.1)
export function indicatorPink(pH) {
  return 1 / (1 + 10 ** (9.0 - pH));
}

// Deterministic positions of molecules inside the cylindrical solution volume
export function flaskCloud(count = N_MOLECULES, seed = 2026) {
  const R = rng(seed);
  const pts = [];
  for (let i = 0; i < count; i++) {
    const r = 0.88 * Math.sqrt(R.next());
    const a = 2 * Math.PI * R.next();
    const u = R.next(); // vertical fraction [0, 1] inside liquid column
    pts.push({
      x: r * Math.cos(a),
      z: r * Math.sin(a),
      u,
      phase: 2 * Math.PI * R.next(),
    });
  }
  return pts;
}
