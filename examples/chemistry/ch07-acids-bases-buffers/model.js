// Chapter 7 pure model: Bronsted-Lowry acid dissociation (strong vs weak),
// logarithmic pH/pOH scale, and strong-base titration / Henderson-Hasselbalch buffer.

export function acidDissociationState(concentrationM = 0.10, pKa = 4.76) {
  const c = Math.max(0.001, Math.min(2.0, concentrationM));
  const isStrong = pKa < 0;
  let h3o = c;
  if (!isStrong) {
    const Ka = Math.pow(10, -pKa);
    // [H+] = (-Ka + sqrt(Ka^2 + 4 Ka c)) / 2
    h3o = (-Ka + Math.sqrt(Ka * Ka + 4 * Ka * c)) / 2;
  }
  const alphaPct = Math.min(100, (h3o / c) * 100);
  const pH = -Math.log10(Math.max(1e-14, h3o));
  const pOH = 14 - pH;
  return { concentrationM: c, pKa, isStrong, h3o, alphaPct, pH, pOH };
}

export function titrationCurveState(addedBaseMl = 12.5, acidMl = 25.0, acidM = 0.10, baseM = 0.10, pKa = 4.76) {
  const vb = Math.max(0, Math.min(50, addedBaseMl));
  const nAcid0 = (acidMl * acidM) / 1000; // 0.0025 mol
  const nBase = (vb * baseM) / 1000;
  const vTotL = (acidMl + vb) / 1000;
  let pH = 2.88;
  let regime = 'Buffer region (HA & A⁻ coexist)';
  if (vb === 0) {
    const Ka = Math.pow(10, -pKa);
    pH = -Math.log10(Math.sqrt(Ka * acidM));
    regime = 'Initial weak acid (HA before base addition)';
  } else if (nBase < nAcid0 - 1e-5) {
    const ratio = nBase / (nAcid0 - nBase);
    pH = pKa + Math.log10(ratio);
    if (Math.abs(vb - acidMl / 2) <= 2.5) regime = 'Half-equivalence maximum buffer capacity (pH ≈ pKa)';
  } else if (Math.abs(nBase - nAcid0) <= 1e-5) {
    // Equivalence point of weak acid + strong base: conjugate base A- hydrolyzes
    const kb = Math.pow(10, -(14 - pKa));
    const cSalt = nAcid0 / vTotL;
    const oh = Math.sqrt(kb * cSalt);
    pH = 14 + Math.log10(oh);
    regime = 'Equivalence point (n_base = n_acid; basic conjugate A⁻)';
  } else {
    const excessOh = (nBase - nAcid0) / vTotL;
    pH = 14 + Math.log10(excessOh);
    regime = 'Excess strong base regime';
  }
  return { addedBaseMl: vb, eqVolumeMl: acidMl, pH, regime };
}
