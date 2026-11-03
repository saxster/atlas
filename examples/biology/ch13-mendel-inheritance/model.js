// Chapter 13 pure model: Mendelian segregation & binomial sampling convergence, ABO codominance, and X-linked inheritance.
export function mendelCrossAccount(crossType = 'f1_self', sampleN = 400) {
  const n = Math.max(4, sampleN);
  if (crossType === 'test_hetero') {
    // Tt x tt -> 50% Tt (tall), 50% tt (dwarf)
    const se = Math.sqrt((0.5 * 0.5) / n);
    return { crossType, pDominant: 0.5, pRecessive: 0.5, genoTT: 0, genoTt: 0.5, genott: 0.5, stdError: se, ratioLabel: '1 : 1 test cross' };
  }
  if (crossType === 'test_homo') {
    return { crossType, pDominant: 1.0, pRecessive: 0.0, genoTT: 0, genoTt: 1.0, genott: 0, stdError: 0, ratioLabel: '100% dominant (known TT parent)' };
  }
  // Default F1 self: Tt x Tt -> 0.25 TT, 0.50 Tt, 0.25 tt (75% dominant : 25% recessive)
  const se = Math.sqrt((0.75 * 0.25) / n);
  return { crossType: 'f1_self', pDominant: 0.75, pRecessive: 0.25, genoTT: 0.25, genoTt: 0.50, genott: 0.25, stdError: se, ratioLabel: '3 : 1 phenotype (1:2:1 genotype)' };
}

export function aboPhenotypeAccount(allele1 = 'IA', allele2 = 'IB') {
  const set = new Set([allele1, allele2]);
  const hasA = set.has('IA'), hasB = set.has('IB');
  if (hasA && hasB) return { genotype: 'I^A I^B', bloodGroup: 'AB', antigens: 'Both A & B (Codominant)', antibodies: 'No anti-A or anti-B' };
  if (hasA) return { genotype: allele1 === allele2 ? 'I^A I^A' : 'I^A I^O', bloodGroup: 'A', antigens: 'Antigen A only', antibodies: 'Anti-B' };
  if (hasB) return { genotype: allele1 === allele2 ? 'I^B I^B' : 'I^B I^O', bloodGroup: 'B', antigens: 'Antigen B only', antibodies: 'Anti-A' };
  return { genotype: 'I^O I^O', bloodGroup: 'O', antigens: 'Neither A nor B (H-antigen)', antibodies: 'Anti-A & Anti-B' };
}

export function xLinkedCarrierAccount(motherCarrier = true, fatherAffected = false) {
  // Mother X^R X^r (if carrier) or X^R X^R; Father X^r Y (if affected) or X^R Y
  const mR = 1, mr = motherCarrier ? 1 : 0;
  const pSonAffected = motherCarrier ? 0.5 : 0.0;
  const pDaughterCarrier = motherCarrier ? (fatherAffected ? 0.5 : 0.5) : (fatherAffected ? 1.0 : 0.0);
  const pDaughterAffected = motherCarrier && fatherAffected ? 0.5 : 0.0;
  return { motherCarrier, fatherAffected, pSonAffected, pDaughterCarrier, pDaughterAffected };
}
