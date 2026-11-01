// Chapter 15 pure model: Einstein photoelectric effect K_max = hf - phi, p-p solar fusion mass defect, and Chandrasekhar white-dwarf mass-radius limit.
export const HC_EV_NM = 1239.84193;
export const C_MPS = 2.99792458e8;

export function photoelectricEmission(wavelengthNm = 350, workFunctionEv = 2.3) {
  const photonEv = HC_EV_NM / Math.max(150, wavelengthNm);
  const thresholdNm = HC_EV_NM / Math.max(0.5, workFunctionEv);
  const emitted = photonEv >= workFunctionEv;
  const kMaxEv = emitted ? photonEv - workFunctionEv : 0;
  return { photonEv, thresholdNm, emitted, kMaxEv };
}

export function ppFusionMassDefect() {
  // 4 protons (4 * 1.007276 u) -> He-4 nucleus (4.001506 u) + 2 positrons + 2 neutrinos
  const massInU = 4 * 1.007825; // 4 H-1 atoms
  const massOutU = 4.002603;    // He-4 atom
  const deltaMU = massInU - massOutU;
  const fractionConverted = deltaMU / massInU; // ~0.007 (0.7%)
  const energyMev = deltaMU * 931.494;
  return { massInU, massOutU, deltaMU, fractionConverted, energyMev };
}

export function whiteDwarfRadiusEarthRadii(massSolar = 0.8, chandraLimit = 1.44) {
  const m = Math.max(0.2, Math.min(1.43, massSolar));
  // Non-relativistic R prop M^(-1/3) with relativistic Chandrasekhar cutoff sqrt(1 - (M/M_Ch)^(4/3))
  const relFactor = Math.sqrt(Math.max(0.01, 1 - Math.pow(m / chandraLimit, 4 / 3)));
  const radiusRe = 1.15 * Math.pow(m, -1 / 3) * relFactor;
  return { massSolar: m, radiusRe, nearCollapse: m > 1.35 };
}
