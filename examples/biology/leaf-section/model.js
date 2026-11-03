// Pure biophysical model for 2D Leaf Histology Cross-Section -> 3D Living Leaf Cutaway.
// No DOM, no Three.js: verified independently by node examples/biology/leaf-section/checks.mjs.
import { planPose, lerp, smoothstep } from '@saxster/atlas/motion.js';

// Histological layer thicknesses in micrometres (µm): total = 220 µm
export const THICK_LOWER_EPI_UM = 30;
export const THICK_SPONGY_UM = 90;
export const THICK_PALISADE_UM = 80;
export const THICK_UPPER_EPI_UM = 20;
export const TOTAL_THICK_UM = THICK_LOWER_EPI_UM + THICK_SPONGY_UM + THICK_PALISADE_UM + THICK_UPPER_EPI_UM; // 220 µm

// Beer-Lambert chlorophyll attenuation coefficient µ = 0.0225 µm⁻¹ across the 80 µm palisade layer
export const MU_PALISADE = 0.0225;
export const CA_PPM = 400; // Ambient CO2 (ppm = µmol/mol)
export const CI_PPM = 280; // Intercellular CO2 (ppm)

export const PLAN_BOUNDS = {
  border: [-2.6, -2.1, 2.5, 2.4],
};

export const POSE_PLAN = planPose(PLAN_BOUNDS, { fov: 3, el: 89.4, az: 0, aspect: 1.3, pad: 1.2 });

// Transmitted PAR light fraction I(z)/I_0 = exp(-µ z) at depth z (µm) into the palisade mesophyll
export function transmittedLight(zUm) {
  return Math.exp(-MU_PALISADE * Math.max(0, zUm));
}

// Fraction of PAR absorbed across depth z (µm): 1 - exp(-µ z)
export function absorbedLightPct(zUm = THICK_PALISADE_UM) {
  return (1 - transmittedLight(zUm)) * 100;
}

// Fick's First Law across stomatal pore: J_CO2 = g_s(w) * (C_a - C_i) in µmol m⁻² s⁻¹
// where stomatal conductance g_s (mol m⁻² s⁻¹) scales linearly with pore aperture w (µm)
export function co2FluxAt(apertureUm) {
  const gs = 0.013333333333333334 * Math.max(0, apertureUm); // g_s = 0.16 mol m⁻² s⁻¹ at w = 12 µm
  const flux = gs * (CA_PPM - CI_PPM); // 19.2 µmol m⁻² s⁻¹ at w = 12 µm
  return { apertureUm, gs, flux };
}

export const PALISADE_ABSORPTION_PCT = absorbedLightPct(THICK_PALISADE_UM); // 83.47%

// Timeline (0..3.0 model seconds across 3 steps):
//   Step 1 (0.0 -> 1.0): Read the 2D histological slide sliced at +1.10 m (220 µm total thickness chain)
//   Step 2 (1.0 -> 2.0): Log-FOV dolly-zoom into 3D while extruding palisade columns, spongy air spaces & vascular bundle
//   Step 3 (2.0 -> 3.0): Open guard-cell stoma (w: 2 µm -> 12 µm), boosting CO2 diffusion flux from 3.2 to 19.2 µmol m⁻² s⁻¹
export function at(clock) {
  const t = Math.max(0, clock);
  const depthU = smoothstep(1.0, 1.70, t);
  const stomaU = smoothstep(2.0, 2.55, t);
  const apertureUm = lerp(2.0, 12.0, stomaU);
  const gas = co2FluxAt(apertureUm);
  const cutY = lerp(1.55, 2.35, depthU);

  return {
    clock: t,
    totalThickUm: TOTAL_THICK_UM,
    palisadeUm: THICK_PALISADE_UM,
    spongyUm: THICK_SPONGY_UM,
    absorbedPct: PALISADE_ABSORPTION_PCT,
    ...gas,
    depthU,
    stomaU,
    cutY,
  };
}
