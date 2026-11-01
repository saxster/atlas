// Chapter 4 pure model: Michaelis-Menten catalysis, thermal/pH bell curves, Ramachandran steric energy, and food assays.
export const VMAX_DEFAULT = 100;
export const KM_DEFAULT = 1.5;

export function thermalActivity(tempC = 37, tOpt = 37, tCrit = 52) {
  const q10Grow = Math.pow(2, (tempC - 20) / 10);
  const denature = 1 / (1 + Math.exp((tempC - (tOpt + 6)) / 2.2));
  const raw = q10Grow * denature;
  const optRaw = Math.pow(2, (tOpt - 20) / 10) / (1 + Math.exp(-6 / 2.2));
  const frac = Math.min(1, Math.max(0, raw / optRaw));
  return { tempC, frac, denatured: tempC > tCrit };
}

export function phActivity(ph = 7.0, phOpt = 7.0, width = 1.8) {
  const d = (ph - phOpt) / width;
  return Math.exp(-d * d);
}

export function michaelisMenten(subMm = 3.0, tempC = 37, ph = 7.0, compInhibMm = 0, ki = 1.0) {
  const s = Math.max(0, subMm);
  const kmApp = KM_DEFAULT * (1 + Math.max(0, compInhibMm) / Math.max(0.1, ki));
  const tAct = thermalActivity(tempC);
  const pAct = phActivity(ph);
  const vmaxEff = VMAX_DEFAULT * tAct.frac * pAct;
  const v = s === 0 ? 0 : (vmaxEff * s) / (kmApp + s);
  return { subMm: s, kmApp, vmaxEff, v, denatured: tAct.denatured, tFrac: tAct.frac, pFrac: pAct };
}

export function ramachandranEnergy(phiDeg = -60, psiDeg = -45) {
  // Allowed basins around right-handed alpha helix (-60, -45) and beta sheet (-120, +125)
  const dAlpha = Math.hypot(phiDeg - (-60), psiDeg - (-45)) / 45;
  const dBeta = Math.hypot(phiDeg - (-120), psiDeg - 125) / 55;
  const e = 12 * (1 - 0.78 * Math.exp(-dAlpha * dAlpha) - 0.72 * Math.exp(-dBeta * dBeta));
  return { phiDeg, psiDeg, energyKj: e, allowed: e < 5.5 };
}
