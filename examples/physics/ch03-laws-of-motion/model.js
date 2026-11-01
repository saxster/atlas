// Chapter 3 pure model: Newton's second law a = F/m, multi-link chain tension drop, third-law scale symmetry, and variable-mass rocket propulsion.
export function cartAccelerationMps2(netForceN = 12, massKg = 3.0) {
  return netForceN / Math.max(0.1, massKg);
}

export function threeCarChainTensions(pullForceN = 36, m1 = 2, m2 = 2, m3 = 2) {
  const mTotal = m1 + m2 + m3;
  const accelMps2 = pullForceN / mTotal;
  const T1 = pullForceN;
  const T2 = (m2 + m3) * accelMps2;
  const T3 = m3 * accelMps2;
  return { accelMps2, T1, T2, T3 };
}

export function hookedScalesPair(pullLeftN = 28) {
  // By Newton's 3rd Law, F_AB = -F_BA at every instant regardless of motion
  return { scaleAN: pullLeftN, scaleBN: pullLeftN, diffN: 0 };
}

export function rocketImpulseState(exhaustSpeedMps = 2500, massFlowKgps = 4.0, dryMassKg = 400, fuelMassKg = 200) {
  const thrustN = exhaustSpeedMps * massFlowKgps;
  const initialAccelMps2 = thrustN / (dryMassKg + fuelMassKg);
  const deltaVMps = exhaustSpeedMps * Math.log((dryMassKg + fuelMassKg) / dryMassKg);
  return { thrustN, initialAccelMps2, deltaVMps };
}
