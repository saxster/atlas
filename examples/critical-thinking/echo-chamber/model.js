// Pure mathematical model for Figure CT.3: Sampling Bias, Astroturf Bots & Citation Provenance.
// Zero DOM, zero Three.js imports.
export const DURATION = 7.5;

// Provenance collapse: raw echoing outlets vs independent primary sources.
export function provenanceCollapse({
  totalOutlets = 12,
  independentPrimary = 1,
  botShare = 0.70,
  totalComments = 1000,
} = {}) {
  const uniqueSources = Math.max(1, Math.min(totalOutlets, independentPrimary));
  const copiedOutlets = totalOutlets - uniqueSources;
  const apparentEvidenceRatio = totalOutlets / uniqueSources;

  const botComments = Math.round(totalComments * botShare);
  const humanComments = totalComments - botComments;
  const rawSupportPct = Math.round(((botComments * 0.96 + humanComments * 0.35) / totalComments) * 1000) / 10;
  const humanSupportPct = humanComments > 0 ? 35.0 : 0;
  const samplingMarginErrorPct = humanComments > 0 ? Math.round((1.96 * Math.sqrt(0.35 * 0.65 / humanComments)) * 1000) / 10 : 50;

  return {
    totalOutlets,
    uniqueSources,
    copiedOutlets,
    apparentEvidenceRatio,
    botComments,
    humanComments,
    rawSupportPct,
    humanSupportPct,
    samplingMarginErrorPct,
  };
}

export function run({ botShare = 0.70, independentPrimary = 1, buggy = 0 } = {}) {
  const res = provenanceCollapse({ botShare, independentPrimary });
  return { botShare, independentPrimary, buggy: buggy ? 1 : 0, res };
}

export function snapshot(e, t) {
  const frac = Math.max(0, Math.min(1, t / DURATION));
  const outletsAudited = Math.max(1, Math.round(frac * e.res.totalOutlets));
  const uniqueDiscovered = Math.min(e.res.uniqueSources, Math.max(1, Math.round(frac * e.res.uniqueSources)));
  const botAudited = Math.round(frac * e.res.botComments);
  const humanAudited = Math.round(frac * e.res.humanComments);
  return { frac, outletsAudited, uniqueDiscovered, botAudited, humanAudited };
}
