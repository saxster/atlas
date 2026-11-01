// Chapter 2 pure model: Galileo's double inclined plane, braking-train inertia pendulum, and static-to-kinetic friction threshold.
export const G_ACCEL = 9.8;

export function doubleRampRunDistanceM(dropHeightM = 0.4, secondSlopeDeg = 10) {
  if (secondSlopeDeg <= 0.1) return Infinity;
  const rad = (secondSlopeDeg * Math.PI) / 180;
  return dropHeightM / Math.sin(rad);
}

export function brakingPendulumAngleDeg(decelMps2 = 2.5, g = G_ACCEL) {
  return (Math.atan2(decelMps2, g) * 180) / Math.PI;
}

export function frictionResponse(pushN = 18, massKg = 5.0, muS = 0.5, muK = 0.35, g = G_ACCEL) {
  const normalN = massKg * g;
  const fStaticMaxN = muS * normalN;
  const fKineticN = muK * normalN;
  const sliding = pushN > fStaticMaxN;
  const frictionN = sliding ? fKineticN : Math.max(0, pushN);
  const netForceN = sliding ? pushN - fKineticN : 0;
  const accelMps2 = netForceN / massKg;
  return { normalN, fStaticMaxN, fKineticN, sliding, frictionN, netForceN, accelMps2 };
}
