// Pure microeconomic model for 2D Isoquant-Isocost Chart -> 3D Cobb-Douglas Production Mountain.
// No DOM, no Three.js: verified independently by node examples/economics/isoquant/checks.mjs.
import { planPose, lerp, smoothstep } from '@saxster/atlas/motion.js';

export const A_TFP = 10.0;
export const ALPHA = 0.5;
export const BETA = 0.5;
export const W_WAGE = 10.0;   // ₹10 per unit of labour L
export const R_RENTAL = 10.0; // ₹10 per unit of capital K
export const BUDGET_C = 120.0; // Total budget C = ₹120

export const PLAN_BOUNDS = {
  border: [-2.6, -2.1, 2.5, 2.5],
};

export const POSE_PLAN = planPose(PLAN_BOUNDS, { fov: 3, el: 89.4, az: 0, aspect: 1.3, pad: 1.2 });

// Cobb-Douglas production Q(L, K) = A * L^alpha * K^beta
export function outputQ(L, K) {
  return A_TFP * (Math.max(0, L) ** ALPHA) * (Math.max(0, K) ** BETA);
}

// Marginal products MP_L = ∂Q/∂L = α Q / L and MP_K = ∂Q/∂K = β Q / K
export function marginalProducts(L, K) {
  const q = outputQ(L, K);
  const mpL = L > 0 ? (ALPHA * q) / L : 0;
  const mpK = K > 0 ? (BETA * q) / K : 0;
  const mrts = mpK > 0 ? mpL / mpK : 0;
  return { q, mpL, mpK, mrts };
}

// Cost-minimising / output-maximising bundle on budget wL + rK = C:
// L* = (α / (α + β)) * (C / w) = 6.0, K* = (β / (α + β)) * (C / r) = 6.0, Q* = 60.0
export const L_STAR = (ALPHA / (ALPHA + BETA)) * (BUDGET_C / W_WAGE); // 6.0
export const K_STAR = (BETA / (ALPHA + BETA)) * (BUDGET_C / R_RENTAL); // 6.0
export const Q_STAR = outputQ(L_STAR, K_STAR); // 60.0
export const MRTS_STAR = marginalProducts(L_STAR, K_STAR).mrts; // 1.00 = w / r

// Timeline (0..3.0 model seconds across 3 steps):
//   Step 1 (0.0 -> 1.0): Read the 2D isoquant & isocost tangency chart at 3° telephoto
//   Step 2 (1.0 -> 2.0): Log-FOV dolly-zoom into 3D while extruding the Cobb-Douglas mountain & vertical budget wall
//   Step 3 (2.0 -> 3.0): Horizontal section cut at Q* = 60 (y = 1.20 m) with black pochè proving tangency MRTS = w/r
export function at(clock) {
  const t = Math.max(0, clock);
  const elev = smoothstep(1.0, 1.70, t);
  const cutU = smoothstep(2.0, 2.55, t);
  const cutY = t < 2.0 ? 2.40 : lerp(2.40, 1.20, cutU);
  const qCut = (cutY / 2.40) * 120;

  return {
    clock: t,
    lStar: L_STAR,
    kStar: K_STAR,
    qStar: Q_STAR,
    mrtsStar: MRTS_STAR,
    budgetC: BUDGET_C,
    elev,
    cutY,
    qCut,
  };
}
