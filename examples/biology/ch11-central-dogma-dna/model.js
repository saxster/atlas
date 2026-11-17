// Chapter 11 pure model: B-DNA Chargaff geometry & H-bonds, Khorana triplet codon translation, and beta-globin point mutations.
export const BP_RISE_NM = 0.34;
export const BP_PER_TURN = 10.5;

export function chargaffHelixAccount(gcFraction = 0.5, lengthBp = 30, buggyWorld = false) {
  const gc = Math.max(0, Math.min(1, gcFraction));
  const at = 1 - gc;
  const nGC = Math.round(lengthBp * gc);
  const nAT = lengthBp - nGC;
  const totalHBonds = buggyWorld ? 2 * lengthBp : 3 * nGC + 2 * nAT;
  const lengthNm = lengthBp * BP_RISE_NM;
  const turns = lengthBp / BP_PER_TURN;
  return { gcFraction: gc, atFraction: at, nGC, nAT, totalHBonds, lengthNm, turns };
}

export function betaGlobinMutationAccount(mode = 'wildtype', buggyWorld = false) {
  if (buggyWorld && mode === 'silent') {
    return {
      mode: 'silent_buggy',
      dnaCoding: 'GTG CAC CTT ACT CCT GAG GAG',
      mrna: 'GUG CAC CUU ACU CCU GAG GAG',
      codon6: 'Non-degenerate myth (every base swap alters protein)',
      amino6: 'Misfolded variant (no synonymous codon degeneracy)',
      polymerisesDeoxy: true,
      rbcShape: 'Sickled crescent (buggy non-degenerate code myth)',
    };
  }
  if (mode === 'sickle') {
    return {
      mode,
      dnaCoding: 'GTG CAC CTG ACT CCT GTG GAG',
      mrna: 'GUG CAC CUG ACU CCU GUG GAG',
      codon6: 'GUG',
      amino6: 'Val (hydrophobic)',
      polymerisesDeoxy: true,
      rbcShape: 'Sickled crescent (sticky HbS fibres)',
    };
  }
  if (mode === 'silent') {
    return {
      mode,
      dnaCoding: 'GTG CAC CTT ACT CCT GAG GAG',
      mrna: 'GUG CAC CUU ACU CCU GAG GAG',
      codon6: 'GAG (unchanged; codon 3 CUU still specifies Leu)',
      amino6: 'Glu (hydrophilic, synonymous codon 3 CUU=Leu unchanged)',
      polymerisesDeoxy: false,
      rbcShape: 'Normal biconcave disc (degenerate code)',
    };
  }
  return {
    mode: 'wildtype',
    dnaCoding: 'GTG CAC CTG ACT CCT GAG GAG',
    mrna: 'GUG CAC CUG ACU CCU GAG GAG',
    codon6: 'GAG',
    amino6: 'Glu (hydrophilic)',
    polymerisesDeoxy: false,
    rbcShape: 'Normal biconcave disc (soluble HbA)',
  };
}
