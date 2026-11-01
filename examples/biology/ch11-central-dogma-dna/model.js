// Chapter 11 pure model: B-DNA Chargaff geometry & H-bonds, Khorana triplet codon translation, and beta-globin point mutations.
export const BP_RISE_NM = 0.34;
export const BP_PER_TURN = 10.0;

export function chargaffHelixAccount(gcFraction = 0.5, lengthBp = 30) {
  const gc = Math.max(0, Math.min(1, gcFraction));
  const at = 1 - gc;
  const nGC = Math.round(lengthBp * gc);
  const nAT = lengthBp - nGC;
  const totalHBonds = 3 * nGC + 2 * nAT;
  const lengthNm = lengthBp * BP_RISE_NM;
  const turns = lengthBp / BP_PER_TURN;
  return { gcFraction: gc, atFraction: at, nGC, nAT, totalHBonds, lengthNm, turns };
}

export function betaGlobinMutationAccount(mode = 'wildtype') {
  if (mode === 'sickle') {
    return {
      mode,
      dnaCoding: 'CAC GTG GAC TGA GGA CTC CTC',
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
      dnaCoding: 'CAC GTG GAC TGA GGA GAA CTC',
      mrna: 'GUG CAC CUG ACU CCU GAG GAG',
      codon6: 'GAG (Leu CUC silent)',
      amino6: 'Glu (hydrophilic, silent CUC=Leu unchanged)',
      polymerisesDeoxy: false,
      rbcShape: 'Normal biconcave disc (degenerate code)',
    };
  }
  return {
    mode: 'wildtype',
    dnaCoding: 'CAC GTG GAC TGA GGA CTC CTC',
    mrna: 'GUG CAC CUG ACU CCU GAG GAG',
    codon6: 'GAG',
    amino6: 'Glu (hydrophilic)',
    polymerisesDeoxy: false,
    rbcShape: 'Normal biconcave disc (soluble HbA)',
  };
}
