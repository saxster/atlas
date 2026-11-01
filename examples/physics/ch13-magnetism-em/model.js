// Chapter 13 pure model: ferromagnetic domain alignment vs temperature, DC split-ring motor torque, and Maxwell electromagnetic wave c = 1/sqrt(mu0*eps0).
export const MU_0 = 4 * Math.PI * 1e-7;
export const EPS_0 = 8.854187817e-12;

export function domainAlignmentFraction(bExtTesla = 0.4, tempC = 25, curieTempC = 770) {
  if (tempC >= curieTempC) return 0;
  const thermalFactor = 1 - tempC / curieTempC;
  return Math.tanh(bExtTesla * 3.2 * thermalFactor);
}

export function dcMotorTorque(currentA = 3.0, bFieldT = 0.5, coilAreaM2 = 0.02, turnsN = 20, angleDeg = 60) {
  const rad = (angleDeg * Math.PI) / 180;
  // Split-ring commutator flips current sign every 180 deg so sin(theta) stays >= 0 (unidirectional torque!)
  const rectifiedSin = Math.abs(Math.sin(rad));
  const maxTorqueNm = turnsN * currentA * coilAreaM2 * bFieldT;
  const instTorqueNm = maxTorqueNm * rectifiedSin;
  return { maxTorqueNm, instTorqueNm, rectifiedSin };
}

export function maxwellWaveSpeed() {
  return 1 / Math.sqrt(MU_0 * EPS_0);
}
