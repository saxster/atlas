// Pure crystallographic model for 2D (001) Unit-Cell Plan -> 3D Rock-Salt (NaCl) Crystal & Bragg Diffraction.
// No DOM, no Three.js: verified independently by node examples/chemistry/crystal-projection/checks.mjs.
import { planPose, lerp, smoothstep } from '@saxster/atlas/motion.js';

export const A0_ANGSTROM = 5.64; // NaCl cubic lattice parameter a_0 = 5.64 Å
export const MOLAR_MASS_NACL = 58.44; // g/mol
export const AVOGADRO = 6.02214076e23; // mol⁻¹
export const Z_FORMULA_UNITS = 4; // 4 Na+ and 4 Cl- per FCC unit cell
export const LAMBDA_CU_KA = 1.542; // Cu Kα X-ray wavelength λ = 1.542 Å

export const PLAN_BOUNDS = {
  border: [-2.4, -2.0, 2.2, 2.4],
};

export const POSE_PLAN = planPose(PLAN_BOUNDS, { fov: 3, el: 89.4, az: 0, aspect: 1.3, pad: 1.2 });

// Interplanar spacing d_{hkl} = a_0 / sqrt(h² + k² + l²) in Ångströms
export function dSpacing(h, k, l, a0 = A0_ANGSTROM) {
  return a0 / Math.sqrt(h * h + k * k + l * l);
}

// First-order Bragg diffraction angle θ(d) = arcsin(λ / (2 d)) in degrees
export function braggAngleDeg(d, lambda = LAMBDA_CU_KA) {
  const s = Math.max(-1, Math.min(1, lambda / (2 * d)));
  return (Math.asin(s) * 180) / Math.PI;
}

// Theoretical crystal density ρ = (Z · M) / (N_A · a_0³) in g/cm³ (1 Å = 1e-8 cm)
export function crystalDensity(a0 = A0_ANGSTROM) {
  const volCm3 = (a0 * 1e-8) ** 3;
  return (Z_FORMULA_UNITS * MOLAR_MASS_NACL) / (AVOGADRO * volCm3);
}

export const VOL_A3 = A0_ANGSTROM ** 3; // 179.41 Å³
export const D_200 = dSpacing(2, 0, 0); // 2.82 Å
export const THETA_200 = braggAngleDeg(D_200); // 15.87°
export const DENSITY_NACL = crystalDensity(A0_ANGSTROM); // 2.165 g/cm³

// Timeline (0..3.0 model seconds across 3 steps):
//   Step 1 (0.0 -> 1.0): Read the 2D (001) basal crystal plan sliced at y = 0.45 (z = 0 layer)
//   Step 2 (1.0 -> 2.0): Log-FOV dolly-zoom into 3D while raising cutY to reveal z = 0, ½, 1 FCC layers (Z = 4)
//   Step 3 (2.0 -> 3.0): Reveal (200) Bragg planes (d_200 = 2.82 Å) and Cu Kα X-ray reflection at θ = 15.87°
export function at(clock) {
  const t = Math.max(0, clock);
  const lift = smoothstep(1.0, 1.65, t);
  const braggU = smoothstep(2.0, 2.55, t);
  const cutY = lerp(0.45, 2.85, lift);

  return {
    clock: t,
    a0: A0_ANGSTROM,
    volA3: VOL_A3,
    zUnits: Z_FORMULA_UNITS,
    d200: D_200,
    thetaDeg: THETA_200,
    density: DENSITY_NACL,
    lift,
    braggU,
    cutY,
  };
}
