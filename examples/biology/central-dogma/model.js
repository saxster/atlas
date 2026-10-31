// Pure mathematical & combinatorial model for Figure B.5: The Central Dogma — Transcription & Translation.
// Triplet genetic code combinatorics (4³ = 64 ≥ 20), Watson–Crick base complementation,
// codon-to-amino-acid translation, frameshift perturbations, and continuous ribosome state along clock ∈ [0, 5].
// Zero DOM, zero Three.js imports.

export const ALPHABET_SIZE = 4;        // 4 nucleotide bases: A, U (or T), G, C
export const AMINO_ACIDS = 20;         // 20 canonical proteinogenic amino acids
export const CODON_LENGTH = 3;         // 3 nucleotides per codon (4³ = 64 words)

// 15-nt gene segment (5 codons)
export const DNA_CODING   = 'ATGTTTGGTGACTAA'; // 5' → 3' coding (sense) strand
export const DNA_TEMPLATE = 'TACAAACCACTGATT'; // 3' → 5' template (antisense) strand
export const MRNA_SEQ     = 'AUGUUUGGUGACUAA'; // 5' → 3' transcribed mRNA

export const DNA_TO_MRNA_MAP = { T: 'A', A: 'U', C: 'G', G: 'C' };
export const DNA_COMP_MAP    = { A: 'T', T: 'A', G: 'C', C: 'G' };
export const RNA_COMP_MAP    = { A: 'U', U: 'A', G: 'C', C: 'G' };

// Standard genetic code subset covering our gene + frameshift variants + stop codons
export const CODON_TABLE = {
  AUG: { aa: 'Met', full: 'Methionine', role: 'start' },
  UUU: { aa: 'Phe', full: 'Phenylalanine', role: 'elongation' },
  UUC: { aa: 'Phe', full: 'Phenylalanine', role: 'elongation' },
  UUG: { aa: 'Leu', full: 'Leucine', role: 'elongation' },
  GGU: { aa: 'Gly', full: 'Glycine', role: 'elongation' },
  GUG: { aa: 'Val', full: 'Valine', role: 'elongation' },
  GAC: { aa: 'Asp', full: 'Aspartate', role: 'elongation' },
  ACU: { aa: 'Thr', full: 'Threonine', role: 'elongation' },
  UAA: { aa: 'STOP', full: 'Stop (ochre)', role: 'stop' },
  UAG: { aa: 'STOP', full: 'Stop (amber)', role: 'stop' },
  UGA: { aa: 'STOP', full: 'Stop (opal)', role: 'stop' },
};

// Number of distinct k-letter words from an alphabet of size b (default 4)
export function wordsOfLength(k, b = ALPHABET_SIZE) {
  return b ** k;
}

// Minimum tuple length k such that b^k >= targetCount (plus at least 1 stop signal)
export function minCodonLength(b = ALPHABET_SIZE, targetCount = AMINO_ACIDS + 1) {
  let k = 1;
  while (wordsOfLength(k, b) < targetCount) k++;
  return k;
}

// Shannon information content in bits per codon: log₂(4³) = 6 bits
export function bitsPerCodon(k = CODON_LENGTH, b = ALPHABET_SIZE) {
  return k * Math.log2(b);
}

// Transcribe a 3'→5' DNA template strand into a 5'→3' mRNA strand
export function dnaToMrna(template3to5) {
  return [...template3to5].map(b => {
    const r = DNA_TO_MRNA_MAP[b];
    if (!r) throw new Error(`Invalid DNA base: ${b}`);
    return r;
  }).join('');
}

// Complement a DNA strand (5'→3' coding to 3'→5' template)
export function dnaComplement(strand) {
  return [...strand].map(b => DNA_COMP_MAP[b]).join('');
}

// Antiparallel 3'→5' tRNA anticodon matching a 5'→3' mRNA codon
export function mrnaToAnticodon(codon5to3) {
  return [...codon5to3].map(b => RNA_COMP_MAP[b]).join('');
}

// Split an mRNA sequence into 3-letter codons starting at reading-frame offset
export function splitCodons(mrna, frameOffset = 0) {
  const out = [];
  for (let i = frameOffset; i + 3 <= mrna.length; i += 3) {
    out.push(mrna.slice(i, i + 3));
  }
  return out;
}

// Translate a 5'→3' mRNA strand from the first AUG start codon until a STOP codon
export function translateMrna(mrna, frameOffset = 0) {
  const codons = splitCodons(mrna, frameOffset);
  const peptide = [];
  const steps = [];
  let started = false;
  let stopped = false;

  for (let i = 0; i < codons.length; i++) {
    const codon = codons[i];
    const entry = CODON_TABLE[codon];
    if (!started) {
      if (codon === 'AUG') {
        started = true;
        peptide.push(entry.aa);
        steps.push({ index: i, codon, anticodon: mrnaToAnticodon(codon), aa: entry.aa, full: entry.full, role: 'start' });
      }
      continue;
    }
    if (!entry || entry.aa === 'STOP') {
      stopped = true;
      steps.push({ index: i, codon, anticodon: null, aa: 'STOP', full: entry ? entry.full : 'Stop', role: 'stop' });
      break;
    }
    peptide.push(entry.aa);
    steps.push({ index: i, codon, anticodon: mrnaToAnticodon(codon), aa: entry.aa, full: entry.full, role: 'elongation' });
  }
  return { codons, peptide, steps, stopped };
}

// Frameshift mutation: deleting the first U after AUG shifts every downstream triplet
// 5'-AUG-UUU-GGU-GAC-UAA-3' → 5'-AUG-UUG-GUG-ACU-AA-3' → Met–Leu–Val–Thr (no stop!)
export function frameshiftDeleteAfterStart(mrna = MRNA_SEQ) {
  const mutated = mrna.slice(0, 3) + mrna.slice(4);
  return { mrna: mutated, ...translateMrna(mutated, 0) };
}

// Continuous machine state for clock ∈ [0, 5]:
// Step 1 (0 → 1): Transcription of 15-nt mRNA from DNA template
// Step 2 (1 → 2): Ribosome initiation at codon 1 (AUG → Met in P-site)
// Step 3 (2 → 3): Elongation across codons 2 & 3 (UUU → Phe, GGU → Gly)
// Step 4 (3 → 4): Elongation at codon 4 (GAC → Asp)
// Step 5 (4 → 5): Termination at codon 5 (UAA → release factor frees Met–Phe–Gly–Asp)
export function ribosomeState(clock) {
  const c = Math.max(0, Math.min(5, clock));
  const transcribedBases = Math.min(15, Math.round(Math.min(1, c) * 15));
  const txProgress = Math.min(1, c);

  // Ribosome position along the 5 codons (0 = AUG, 1 = UUU, 2 = GGU, 3 = GAC, 4 = UAA)
  let codonFloat = 0;
  if (c <= 1) codonFloat = 0;
  else if (c <= 2) codonFloat = 0; // docking at AUG (codon index 0)
  else if (c <= 3) codonFloat = (c - 2) * 2.0; // advances from codon 0 through codon 1 (UUU) to codon 2 (GGU)
  else if (c <= 4) codonFloat = 2.0 + (c - 3) * 1.0; // advances to codon 3 (GAC)
  else codonFloat = 3.0 + (c - 4) * 1.0; // advances to codon 4 (UAA) and releases

  const activeCodonIdx = c < 1.05 ? -1 : Math.min(4, Math.floor(codonFloat + 0.001));
  const chainCount = c < 1.15 ? 0 : c <= 2.05 ? 1 : c <= 2.55 ? 2 : c <= 3.05 ? 3 : 4;
  const released = c >= 4.35 ? Math.min(1, (c - 4.35) / 0.65) : 0;

  const fullTranslation = translateMrna(MRNA_SEQ);
  const currentStep = activeCodonIdx >= 0 ? fullTranslation.steps[activeCodonIdx] : null;

  return {
    clock: c,
    txProgress,
    transcribedBases,
    codonFloat,
    activeCodonIdx,
    currentCodon: currentStep ? currentStep.codon : 'AUG',
    currentAnticodon: currentStep ? (currentStep.anticodon || 'RF1') : 'UAC',
    currentAA: currentStep ? currentStep.aa : 'Met',
    chainCount,
    peptide: fullTranslation.peptide.slice(0, chainCount),
    released,
  };
}
