// Chapter 1 pure model: reference frames, Galileo's odd-number inclined-plane law (1:3:5:7), vertical ball toss kinematics, and relative velocity.
export const G_EARTH = 9.8;

export function framePosition(xGroundM = 6.0, vFrameMps = 4.0, tSec = 1.5) {
  return xGroundM - vFrameMps * tSec;
}

export function galileoRampKinematics(angleDeg = 12, tSec = 2.0, g = G_EARTH) {
  const rad = (angleDeg * Math.PI) / 180;
  // Rolling solid sphere down incline: a = (5/7) g sin(theta)
  const aMps2 = (5 / 7) * g * Math.sin(rad);
  const vMps = aMps2 * tSec;
  const xM = 0.5 * aMps2 * tSec * tSec;
  // Odd-number intervals delta_x_n in unit time steps n = 1, 2, 3, 4:
  const d1 = 0.5 * aMps2;
  const oddSteps = [1 * d1, 3 * d1, 5 * d1, 7 * d1];
  return { aMps2, vMps, xM, oddSteps };
}

export function verticalTossState(v0Mps = 12.0, tSec = 1.0, g = G_EARTH) {
  const tApex = v0Mps / g;
  const yApex = (v0Mps * v0Mps) / (2 * g);
  const yM = Math.max(0, v0Mps * tSec - 0.5 * g * tSec * tSec);
  const vMps = v0Mps - g * tSec;
  const aMps2 = -g;
  return { yM, vMps, aMps2, tApex, yApex };
}

export function relativeTrainVelocity(vAMps = 15, vBMps = -12, lengthM = 108) {
  const vRelAB = vAMps - vBMps;
  const closingSpeed = Math.abs(vRelAB);
  const passTimeSec = closingSpeed > 1e-6 ? lengthM / closingSpeed : Infinity;
  return { vRelAB, closingSpeed, passTimeSec };
}
