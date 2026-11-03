// Pure physical model for Thin-Lens Ray Diagram -> 3D Cutaway Optical Bench.
// No DOM, no Three.js: verified independently by node examples/physics/optics-bench/checks.mjs.
import { planPose, lerp, smoothstep } from '@saxster/atlas/motion.js';

export const F = 1.30; // Focal length f = 1.30 m
export const H_OBJ = 0.75; // Object height h_o = 0.75 m
export const DO_START = 2.60; // Initial object distance d_o = 2f = 2.60 m (symmetric 1:1 image at d_i = 2.60 m)
export const DO_END = 1.95;   // Final object distance d_o = 1.5f = 1.95 m (magnified 2:1 image at d_i = 3.90 m)

export const PLAN_BOUNDS = {
  border: [-3.4, -1.9, 4.3, 2.2],
};

export const POSE_PLAN = planPose(PLAN_BOUNDS, { fov: 3, el: 89.4, az: 0, aspect: 1.32, pad: 1.18 });

// Thin-lens law: 1/f = 1/d_o + 1/d_i => d_i = (f * d_o) / (d_o - f), M = -d_i / d_o
export function opticsAt(doDist) {
  const diDist = (F * doDist) / (doDist - F);
  const mag = -diDist / doDist;
  const hImg = mag * H_OBJ;
  return { doDist, diDist, mag, absMag: Math.abs(mag), hImg };
}

// Timeline (0..3.0 model seconds across 3 steps):
//   Step 1 (0.0 -> 1.0): Read the 2D textbook principal-ray blueprint at d_o = 2f = 2.60 m (d_i = 2.60 m, |M| = 1.00×)
//   Step 2 (1.0 -> 2.0): Log-FOV dolly-zoom into 3D while revolving the 2D lens cross-section into a 270° 3D cutaway lens
//   Step 3 (2.0 -> 3.0): Move object closer to F (d_o: 2.60 m -> 1.95 m), pushing d_i to 3.90 m and |M| to 2.00×
export function at(clock) {
  const t = Math.max(0, clock);
  const sweep = smoothstep(1.0, 1.75, t);
  const moveU = smoothstep(2.0, 2.55, t);
  const doDist = lerp(DO_START, DO_END, moveU);
  const op = opticsAt(doDist);
  const cutY = t < 1.0 ? 1.10 : 2.50;

  return {
    clock: t,
    f: F,
    powerDiopters: 1 / F,
    hObj: H_OBJ,
    ...op,
    sweep,
    cutY,
  };
}
