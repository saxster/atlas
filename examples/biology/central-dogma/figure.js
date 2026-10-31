// Figure B.5 as a machine: five steps from DNA transcription to ribosomal translation of the 5-codon mRNA
// 5'-AUG-UUU-GGU-GAC-UAA-3' into the tetrapeptide Met–Phe–Gly–Asp.
import { buildWorld } from './world.js';
import * as M from './model.js';

const whole = { target: [0.0, 1.25, 0], az: -8, el: 9, dist: 16.2 };
const closeDna = { target: [-0.2, 1.45, 0], az: -10, el: 11, dist: 14.5 };
const closeRibo = { target: [0.1, 1.05, 0], az: -8, el: 8, dist: 14.8 };

export const FIGURE = {
  no: 'B.5',
  title: 'Three letters a codon',
  question: 'How does a four-letter alphabet of DNA bases spell out twenty kinds of amino acid?',
  bigIdea: `single bases (4¹ = 4) and pairs (4² = 16) fall short of the 20 amino acids, so life reads mRNA in non-overlapping triplets (4³ = 64 codons). RNA polymerase copies the DNA template into mRNA, and the ribosome steps along three bases at a time, matching each codon to a tRNA anticodon until a stop codon releases the finished protein chain.`,
  intro: { cam: closeDna, lit: 'dna', fig: 'Double-stranded DNA gene & template strand' },
  lookKeys: [],
  frameAspect: 1.5,
  narrowZoom: 1.18,
  STEPS: [
    {
      label: 'Transcription (DNA → 15-nt mRNA)',
      fig: '3′-TAC-AAA-CCA-CTG-ATT-5′ becomes 5′-AUG-UUU-GGU-GAC-UAA-3′',
      run: 1.0, play: 3.2, real: 0.5,
      hint: 'RNA polymerase reads the 3′→5′ DNA template strand by Watson–Crick base pairing (T→A, A→U, C→G, G→C) to build a 15-nucleotide mRNA transcript of 5 triplet codons.',
      cam: closeDna, lit: 'mrna',
    },
    {
      label: 'Initiation at start codon AUG (Met)',
      fig: 'Initiator tRNA (3′-UAC-5′) docks in the ribosomal P site',
      run: 1.0, play: 3.2, real: 0.2,
      hint: 'The ribosome clamps onto the first triplet 5′-AUG-3′. Initiator tRNA pairs its antiparallel anticodon 3′-UAC-5′ with AUG, placing Methionine (Met) as amino acid #1 and locking the reading frame.',
      cam: closeRibo, lit: 'ribosome',
    },
    {
      label: 'Elongation: codons 2 & 3 (Phe, Gly)',
      fig: 'UUU → Phe and GGU → Gly join the growing peptide',
      run: 1.0, play: 3.6, real: 0.2,
      hint: 'Stepping 3 nucleotides at a time, tRNAs with anticodons 3′-AAA-5′ and 3′-CCA-5′ decode UUU (Phenylalanine) and GGU (Glycine), while the large subunit links them into Met–Phe–Gly.',
      cam: whole, lit: 'trna',
    },
    {
      label: 'Elongation: codon 4 (GAC → Asp)',
      fig: 'Translocation adds Aspartate to form Met–Phe–Gly–Asp',
      run: 1.0, play: 3.2, real: 0.15,
      hint: 'The ribosome advances by one more triplet to 5′-GAC-3′. A tRNA carrying anticodon 3′-CUG-5′ delivers Aspartate (Asp), extending the polypeptide chain to four amino acids.',
      cam: whole, lit: 'trna',
    },
    {
      label: 'Termination at stop codon UAA',
      fig: 'Release factor frees the completed Met–Phe–Gly–Asp peptide',
      run: 1.0, play: 3.2, real: 0.2,
      hint: 'No tRNA recognizes 5′-UAA-3′ (one of three stop codons alongside UAG and UGA). A release factor binds the A site and cleaves the finished tetrapeptide Met–Phe–Gly–Asp from the ribosome.',
      cam: whole, lit: 'ribosome',
    },
  ],
  buildWorld(E) {
    const W = buildWorld(E);
    return { update: s => W.update(s), labels: W.labels };
  },
  state: clock => M.ribosomeState(clock),
  readout: s => `mRNA ${s.transcribedBases}/15 nt   codon ${s.currentCodon} → ${s.currentAA}\npeptide: ${s.peptide.length ? s.peptide.join('–') : '–'}${s.released > 0.5 ? ' (released)' : ''}`,
  chips: [
    { label: 'Code capacity (4³ triplets)', from: 1, value: () => `${M.wordsOfLength(3)} codons (${M.bitsPerCodon()} bits)` },
    { label: 'Transcribed mRNA', from: 1, value: s => `${s.transcribedBases} / 15 bases (5 codons)` },
    { label: 'Active mRNA codon (5′→3′)', from: 2, value: s => s.activeCodonIdx >= 0 ? `#${s.activeCodonIdx + 1}: ${s.currentCodon}` : 'AUG' },
    { label: 'tRNA anticodon (3′→5′)', from: 2, value: s => s.activeCodonIdx === 4 ? 'none (Release Factor)' : `3′-${s.currentAnticodon}-5′` },
    { label: 'Polypeptide chain', from: 2, value: s => s.peptide.length ? s.peptide.join('–') : '–' },
    { label: 'If 1st U after AUG deleted', from: 5, value: () => 'Met–Leu–Val–Thr (frameshift!)' },
  ],
  PLATES: {
    dna: {
      text: `RNA polymerase unwinds the DNA double helix and reads the 3′→5′ template strand (${M.DNA_TEMPLATE}) by Watson–Crick pairing to synthesize a 5′→3′ mRNA molecule (${M.MRNA_SEQ}) whose sequence matches the DNA coding strand (${M.DNA_CODING}) with Uracil (U) in place of Thymine (T).`,
      facts: s => [
        ['DNA coding (5′→3′)', 'ATG-TTT-GGT-GAC-TAA'],
        ['DNA template (3′→5′)', 'TAC-AAA-CCA-CTG-ATT'],
        ['mRNA transcript (5′→3′)', 'AUG-UUU-GGU-GAC-UAA'],
        ['transcribed bases', `${s.transcribedBases} of 15`],
      ],
    },
    mrna: {
      text: `Why 3 letters per codon? Four nucleotide bases taken 1 at a time give only 4¹ = 4 words; taken in pairs they give 4² = 16 words—still fewer than the 20 amino acids. Triplets provide 4³ = 64 codons (6 bits of information): 61 sense codons (with degeneracy that buffers point mutations) plus 3 stop codons.`,
      facts: () => [
        ['singlets (4¹)', '4 words (< 20 AAs)'],
        ['doublets (4²)', '16 words (< 20 AAs)'],
        ['triplets (4³)', '64 codons (61 sense + 3 stop)'],
      ],
    },
    ribosome: {
      text: `The ribosome has three tRNA binding slots: the A (aminoacyl) site where an incoming tRNA tests its anticodon against the next mRNA triplet, the P (peptidyl) site holding the growing polypeptide chain, and the E (exit) site where spent tRNAs leave after translocation.`,
      facts: s => [
        ['current codon', s.currentCodon],
        ['decoded amino acid', s.currentAA],
        ['chain length', `${s.chainCount} amino acids`],
      ],
    },
    trna: {
      text: `Because codons are read consecutively without commas, deleting or inserting a single nucleotide shifts the 3-letter grouping for every downstream codon (a frameshift mutation). Deleting the first U after AUG turns AUG-UUU-GGU-GAC-UAA into AUG-UUG-GUG-ACU-AA (Met–Leu–Val–Thr) and erases the stop signal.`,
    },
  },
};
