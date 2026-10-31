// node examples/biology/central-dogma/checks.mjs — independent proofs of triplet genetic code combinatorics,
// Watson–Crick complementation, translation of the 15-nt mRNA, and frameshift sensitivity.
import { checks, near } from '@saxster/atlas/checks.js';
import * as M from './model.js';

const C = checks();

// 1. Triplet code capacity: 4¹ = 4 < 20, 4² = 16 < 20, 4³ = 64 ≥ 21 (20 amino acids + stop), carrying 6 bits per codon
C.check('k = 3 is the minimal codon length with 4^k ≥ 21 (4¹ = 4, 4² = 16, 4³ = 64, 6 bits/codon)',
  M.wordsOfLength(1) === 4 &&
  M.wordsOfLength(2) === 16 &&
  M.wordsOfLength(3) === 64 &&
  M.minCodonLength(4, 21) === 3 &&
  near(M.bitsPerCodon(3, 4), 6.0, 1e-12));

// 2. DNA template strand is the exact Watson–Crick complement of the coding strand, and transcribes to MRNA_SEQ
C.check('DNA template (3′-TACAAACCACTGATT-5′) complements coding strand and transcribes to 5′-AUGUUUGGUGACUAA-3′',
  M.dnaComplement(M.DNA_CODING) === M.DNA_TEMPLATE &&
  M.dnaToMrna(M.DNA_TEMPLATE) === M.MRNA_SEQ &&
  M.MRNA_SEQ === M.DNA_CODING.replaceAll('T', 'U'));

// 3. Translating the 5-codon mRNA yields ['Met', 'Phe', 'Gly', 'Asp'] and terminates at UAA
{
  const res = M.translateMrna(M.MRNA_SEQ);
  C.check('translating 5′-AUG-UUU-GGU-GAC-UAA-3′ produces Met–Phe–Gly–Asp and stops at UAA',
    res.codons.length === 5 &&
    res.peptide.join('-') === 'Met-Phe-Gly-Asp' &&
    res.stopped === true &&
    res.steps.at(-1).codon === 'UAA' &&
    res.steps.at(-1).aa === 'STOP');
}

// 4. Every sense codon pairs with its exact antiparallel Watson–Crick tRNA anticodon
{
  const res = M.translateMrna(M.MRNA_SEQ);
  const expectedAnticodons = ['UAC', 'AAA', 'CCA', 'CUG'];
  const actualAnticodons = res.steps.slice(0, 4).map(s => s.anticodon);
  C.check('tRNA anticodons (3′→5′) are UAC, AAA, CCA, CUG and re-complement back to their mRNA codons',
    actualAnticodons.join(',') === expectedAnticodons.join(',') &&
    res.steps.slice(0, 4).every(s => M.mrnaToAnticodon(s.anticodon) === s.codon));
}

// 5. Single-nucleotide deletion after AUG causes a frameshift that scrambles downstream amino acids and erases the stop codon
{
  const shift = M.frameshiftDeleteAfterStart(M.MRNA_SEQ);
  C.check('1-nt deletion after AUG shifts reading frame to Met–Leu–Val–Thr and loses the UAA stop signal',
    shift.peptide.join('-') === 'Met-Leu-Val-Thr' && shift.stopped === false);
}

// 6. Ribosome state progresses monotonically from 0 to 4 amino acids and releases at clock = 5
{
  const s0 = M.ribosomeState(0), s2 = M.ribosomeState(2), s4 = M.ribosomeState(4), s5 = M.ribosomeState(5);
  C.check('ribosome state advances cleanly from transcription (t=0..1) through Met–Phe–Gly–Asp release (t=5)',
    s0.chainCount === 0 && s2.peptide.join('-') === 'Met' &&
    s4.peptide.join('-') === 'Met-Phe-Gly-Asp' && near(s5.released, 1.0, 1e-9));
}

C.report();
