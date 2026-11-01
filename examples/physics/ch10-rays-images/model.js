// Chapter 10 pure model: pinhole camera magnification & geometric blur circle, diffuse vs specular reflection, and Romer's Jupiter-Io eclipse light delay.
export const C_LIGHT_KM_S = 299792.458;
export const AU_KM = 1.496e8;

export function pinholeOptics(objHeightMm = 120, objDistMm = 400, boxDepthMm = 160, pinholeDiameterMm = 1.5) {
  const mag = boxDepthMm / Math.max(10, objDistMm);
  const imageHeightMm = objHeightMm * mag;
  const blurCircleMm = pinholeDiameterMm * (1 + boxDepthMm / Math.max(10, objDistMm));
  const relativeBrightness = Math.pow(pinholeDiameterMm, 2);
  return { mag, imageHeightMm, blurCircleMm, relativeBrightness };
}

export function romerEclipseDelay(earthOrbitAngleDeg = 180) {
  // Angle 0 = opposition (closest to Jupiter, d = d0 - 1 AU), Angle 180 = conjunction (farthest, d = d0 + 1 AU)
  const rad = (earthOrbitAngleDeg * Math.PI) / 180;
  const extraDistanceAu = 1 - Math.cos(rad); // 0 to 2 AU
  const extraDistanceKm = extraDistanceAu * AU_KM;
  const delaySec = extraDistanceKm / C_LIGHT_KM_S;
  const delayMin = delaySec / 60;
  return { extraDistanceAu, delaySec, delayMin };
}
