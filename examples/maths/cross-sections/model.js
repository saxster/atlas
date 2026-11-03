// Pure mathematical model for Solids of Known Cross-Section (2D base circle -> 3D semicircular dome).
// No DOM, no Three.js: verified independently by node examples/maths/cross-sections/checks.mjs.
import { planPose, lerp, smoothstep } from '@saxster/atlas/motion.js';

export const R = 2.0; // Base circle radius R = 2.00 m (diameter = 4.00 m)
export const SLICE_COUNT = 20;
export const SLICE_X0 = 0.60; // Highlighted slice coordinate x* = 0.60 m

export const PLAN_BOUNDS = {
  minX: -2.9, maxX: 2.5,
  minZ: -2.4, maxZ: 2.8,
  cx: -0.2, cz: 0.2,
  width: 5.4, depth: 5.2,
};

export const POSE_PLAN = planPose(PLAN_BOUNDS, { fov: 3, el: 89.4, az: 0, aspect: 1.28, pad: 1.22 });

// Half-chord radius r(x) = sqrt(R² - x²) of the base circle at x
export function chordRadius(x) {
  return Math.sqrt(Math.max(0, R * R - x * x));
}

// Semicircular cross-section area A(x) = (π/2) r(x)² = (π/2)(R² - x²) perpendicular to the x-axis
export function sliceArea(x) {
  return 0.5 * Math.PI * Math.max(0, R * R - x * x);
}

// Cumulative volume V(x) = ∫_{-R}^{x} A(u) du = (π/2)[R²(x + R) - (x³ + R³)/3]
export function cumulativeVolume(x) {
  const xc = Math.max(-R, Math.min(R, x));
  return 0.5 * Math.PI * (R * R * (xc + R) - (xc ** 3 + R ** 3) / 3);
}

export const BASE_AREA = Math.PI * R * R; // 4π ≈ 12.566 m²
export const TOTAL_VOLUME = cumulativeVolume(R); // (2/3)π R³ = (16/3)π ≈ 16.755 m³

// Timeline (0..3.0 model seconds across 3 steps):
//   Step 1 (0.0 -> 1.0): Read the 2D textbook base circle x² + z² ≤ R² and chord strip 2r(x*) at 3° telephoto
//   Step 2 (1.0 -> 2.0): Log-FOV dolly-zoom into 3D perspective while extruding 20 semicircular arches (lift 0 -> 1)
//   Step 3 (2.0 -> 3.0): Horizontal section cut at y = 1.00 m with black pochè & sweep x* across the dome
export function at(clock) {
  const t = Math.max(0, clock);
  const lift = smoothstep(1.0, 1.75, t);
  const cutU = smoothstep(2.0, 2.55, t);
  const cutY = t < 1.0 ? 2.20 : lerp(2.20, 1.00, cutU);
  const rSlice = chordRadius(SLICE_X0);
  const aSlice = sliceArea(SLICE_X0);
  const cutChordR = cutY < R ? Math.sqrt(Math.max(0, R * R - cutY * cutY)) : 0;

  return {
    clock: t,
    R,
    baseArea: BASE_AREA,
    sliceX: SLICE_X0,
    sliceRadius: rSlice,
    chordLen: 2 * rSlice,
    sliceArea: aSlice,
    totalVolume: TOTAL_VOLUME,
    lift,
    cutY,
    cutChordR,
  };
}
