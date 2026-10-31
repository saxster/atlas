// Figure B.5 world: DNA transcription bubble at the top, 15-nucleotide mRNA ribbon in the middle divided into
// 5 triplet codons (AUG, UUU, GGU, GAC, UAA), and a 3D two-subunit ribosome (with E, P, A sites and tRNA adaptors)
// stepping 3 bases at a time to assemble the polypeptide chain Met–Phe–Gly–Asp.
import * as THREE from 'three';
import { PALETTE, part, box, cyl, lines, rod, V } from '@saxster/atlas/parts.js';
import { blob, curve } from '@saxster/atlas/prims.js';
import * as M from './model.js';

PALETTE.baseA  = ['#6bc48d', '#2e8b57', '#1e5e3a']; // Adenine (green)
PALETTE.baseU  = ['#f07a7e', '#e5484d', '#b8343a']; // Uracil / Thymine (red)
PALETTE.baseG  = ['#f5c96b', '#d99b26', '#9e6d14']; // Guanine (amber)
PALETTE.baseC  = ['#8fb0f0', '#4f7ed4', '#2e5599']; // Cytosine (blue)
PALETTE.riboL  = ['#9ec5ea', '#5b88c0', '#385d8e']; // Large ribosomal subunit
PALETTE.riboS  = ['#b5d3ef', '#76a0d0', '#4a73a3']; // Small ribosomal subunit
PALETTE.trna   = ['#e8c67a', '#c8962e', '#8e681b']; // tRNA cloverleaf adaptor
PALETTE.pep    = ['#f07a7e', '#d9484d', '#9c2b30']; // Polypeptide amino acid beads

const BASE_PAL = { A: 'baseA', U: 'baseU', T: 'baseU', G: 'baseG', C: 'baseC' };

export function buildWorld(E) {
  const { scene, asm } = E;
  const root = new THREE.Group(); scene.add(root);
  const labels = [], label = (cls, html, at, text) =>
    typeof html === 'function' ? labels.push({ cls, html: html(), at, text: html }) : labels.push({ cls, html, at, text });

  // Layout geometry across the 15 nucleotides (5 codons × 3 bases)
  const X0 = -2.45, DX = 0.35; // 15 bases span x ∈ [-2.45, +2.45], each codon spans 1.05 world units
  const baseX = i => X0 + i * DX;
  const codonCenterX = cIdx => baseX(cIdx * 3 + 1);

  // ---------- 1. Top: DNA double helix & transcription template ----------
  const gDna = asm('dna', root, {
    title: 'DNA double helix & template strand (3′ → 5′)',
    sub: 'RNA polymerase reads 3′-TAC-AAA-CCA-CTG-ATT-5′ to synthesize the complementary 5′→3′ mRNA transcript',
  });
  const dnaY = 2.25;
  curve(gDna, u => {
    const x = X0 - 0.15 + u * (14 * DX + 0.3);
    const a = u * Math.PI * 3.0;
    return [x, dnaY + 0.20 * Math.cos(a), 0.18 * Math.sin(a)];
  }, { samples: 90, radius: 0.032, color: 'ink', name: 'DNA 3′→5′ template backbone' });

  curve(gDna, u => {
    const x = X0 - 0.15 + u * (14 * DX + 0.3);
    const a = u * Math.PI * 3.0 + Math.PI;
    return [x, dnaY + 0.20 * Math.cos(a), 0.18 * Math.sin(a)];
  }, { samples: 90, radius: 0.028, color: 'grey', name: 'DNA 5′→3′ coding backbone' });

  for (let i = 0; i < 15; i++) {
    const u = i / 14, a = u * Math.PI * 3.0, x = baseX(i);
    const bTemp = M.DNA_TEMPLATE[i];
    part(gDna, cyl(0.032, 0.34, 12), {
      pal: BASE_PAL[bTemp], tone: 'mid', pos: [x, dnaY, 0],
      rot: [a, 0, 0], name: `DNA base pair ${i + 1} (${M.DNA_CODING[i]}·${bTemp})`,
    });
  }

  // ---------- 2. Middle: 15-nt mRNA ribbon grouped into 5 triplet codons ----------
  const gMrna = asm('mrna', root, {
    title: 'Messenger RNA (mRNA) reading frame: 5 codons × 3 bases',
    sub: '5′-AUG-UUU-GGU-GAC-UAA-3′ — because 4² = 16 < 20 and 4³ = 64 ≥ 20, three letters are the minimum to encode 20 amino acids',
  });
  const mrnaY = 0.68;
  const mrnaBackbone = part(gMrna, box(14 * DX + 0.52, 0.065, 0.12, 0.02), {
    pal: 'ink', tone: 'hi', pos: [0, mrnaY, 0], name: 'mRNA sugar-phosphate backbone (5′ → 3′)',
  });

  const mrnaPegs = [];
  for (let i = 0; i < 15; i++) {
    const base = M.MRNA_SEQ[i];
    const peg = part(gMrna, cyl(0.052, 0.24, 16), {
      pal: BASE_PAL[base], tone: 'lit', pos: [baseX(i), mrnaY + 0.13, 0],
      name: `mRNA nucleotide ${i + 1}: ${base}`,
    });
    mrnaPegs.push(peg);
  }

  // Codon bracket ticks under each 3-base triplet
  const bracketSegs = [];
  for (let c = 0; c < 5; c++) {
    const xL = baseX(c * 3) - 0.11, xR = baseX(c * 3 + 2) + 0.11, yB = mrnaY - 0.13;
    bracketSegs.push(xL, yB + 0.06, 0, xL, yB, 0, xL, yB, 0, xR, yB, 0, xR, yB, 0, xR, yB + 0.06, 0);
  }
  lines(gMrna, bracketSegs, '#8a8275', 0.8);

  // ---------- 3. Ribosome (Small + Large subunits with E, P, A sites) ----------
  const gRibo = asm('ribosome', root, {
    title: 'Ribosome (large & small subunits with E, P, A sites)',
    sub: 'steps along mRNA three nucleotides at a time, matching each codon in the A/P sites to its complementary tRNA anticodon',
  });
  const riboGroup = new THREE.Group();
  riboGroup.position.set(codonCenterX(0), mrnaY, 0);
  gRibo.add(riboGroup);

  // Small subunit below mRNA (reads the codon)
  blob(riboGroup, {
    radius: 0.56, lobes: 8, amp: 0.10, seed: 11, pal: 'riboS', tone: 'mid',
    pos: [0, -0.34, -0.14], name: 'Small ribosomal subunit (40S/30S decoding center)',
  });
  // Large subunit above mRNA (catalyzes peptide bond formation)
  blob(riboGroup, {
    radius: 0.78, lobes: 10, amp: 0.12, seed: 29, pal: 'riboL', tone: 'mid',
    pos: [0, 0.54, -0.24], name: 'Large ribosomal subunit (60S/50S peptidyl transferase)',
  });

  // E, P, A site frames on the front of the ribosome
  for (const [dx, siteName] of [[-0.48, 'E site (exit)'], [0, 'P site (peptidyl)'], [0.48, 'A site (aminoacyl)']]) {
    part(riboGroup, box(0.38, 0.44, 0.06, 0.015), {
      pal: 'board', tone: 'lo', pos: [dx, 0.36, 0.12], name: `Ribosome ${siteName}`,
    });
  }

  // ---------- 4. Active tRNA adaptor + growing polypeptide chain ----------
  const gTrna = asm('trna', root, {
    title: 'tRNA adaptor & growing polypeptide chain (Met–Phe–Gly–Asp)',
    sub: 'each tRNA displays a 3′→5′ anticodon on one end and carries its cognate amino acid on the other',
  });
  const trnaGroup = new THREE.Group();
  riboGroup.add(trnaGroup);
  part(trnaGroup, box(0.28, 0.42, 0.14, 0.03), {
    pal: 'trna', tone: 'lit', pos: [0, 0.42, 0.22], name: 'tRNA adaptor body (anticodon stem-loop)',
  });
  // 3 anticodon prongs pointing down to meet the mRNA codon
  const antiProngs = [0, 1, 2].map(j => part(trnaGroup, cyl(0.036, 0.16, 12), {
    pal: 'ink', tone: 'lit', pos: [(j - 1) * 0.10, 0.16, 0.22], name: `tRNA anticodon base ${j + 1}`,
  }));

  // Polypeptide chain emerging from the top of the large subunit (4 amino acid spheres: Met, Phe, Gly, Asp)
  const aaNames = ['Met (start)', 'Phe', 'Gly', 'Asp'];
  const aaPals  = ['baseA', 'baseG', 'baseC', 'pep'];
  const aaBeads = [0, 1, 2, 3].map(k => part(gTrna, new THREE.SphereGeometry(0.135, 22, 16), {
    pal: aaPals[k], tone: 'lit', name: `Amino acid ${k + 1}: ${aaNames[k]}`,
  }));
  const aaBonds = [0, 1, 2].map(k => rod(gTrna, { r: 0.028, pal: 'ink', tone: 'hi', name: `Peptide bond ${k + 1}` }));

  let cur = M.ribosomeState(0);

  // Labels for DNA, codons, active anticodon, and growing peptide chain
  label('board', 'DNA template 3′-TAC-AAA-CCA-CTG-ATT-5′', () => V(1.6, dnaY + 0.48, 0.08));
  const codonStrings = ['AUG', 'UUU', 'GGU', 'GAC', 'UAA'];
  const aaLabels = ['Met', 'Phe', 'Gly', 'Asp', 'STOP'];
  for (let c = 0; c < 5; c++) {
    const yOff = c % 2 === 0 ? -0.32 : -0.64;
    label('mark', `${codonStrings[c]} (${aaLabels[c]})`, () => V(codonCenterX(c) + 0.35, mrnaY + yOff, 0.08));
  }
  label('vec red', () => cur.activeCodonIdx >= 0
    ? (cur.activeCodonIdx < 4 ? `tRNA 3′-${cur.currentAnticodon}-5′ → ${cur.currentAA}` : 'Release factor (STOP)')
    : 'mRNA transcript (15 nt)',
    () => V(codonCenterX(Math.max(0, cur.codonFloat)) + 0.45, mrnaY + 1.32, 0.25));

  function update(s) {
    cur = s;

    // Show transcribed mRNA nucleotides progressively during Step 1
    const nVis = Math.max(1, s.transcribedBases);
    for (let i = 0; i < 15; i++) {
      mrnaPegs[i].visible = i < nVis;
    }
    mrnaBackbone.scale.x = Math.max(0.08, nVis / 15);
    mrnaBackbone.position.x = X0 + ((nVis - 1) * DX) * 0.5;

    // Ribosome glides along the 5 codons (x = codonCenterX(s.codonFloat))
    const rx = codonCenterX(s.codonFloat);
    riboGroup.visible = s.clock >= 0.95;
    riboGroup.position.set(rx, mrnaY, 0);

    // Update tRNA visibility and anticodon colour prongs
    const onStop = s.activeCodonIdx === 4 && s.released > 0.2;
    trnaGroup.visible = s.clock >= 1.05 && !onStop;
    const anti = s.currentAnticodon;
    if (anti && anti.length === 3 && BASE_PAL[anti[0]]) {
      for (let j = 0; j < 3; j++) {
        antiProngs[j].position.y = 0.16;
      }
    }

    // Position the growing polypeptide chain (Met–Phe–Gly–Asp) above the ribosome exit tunnel
    const lift = s.released * 0.48;
    const pts = [];
    for (let k = 0; k < 4; k++) {
      const vis = k < s.chainCount && s.clock >= 1.1;
      aaBeads[k].visible = vis;
      const age = s.chainCount - 1 - k;
      const px = rx - age * 0.22 + s.released * 0.18;
      const py = mrnaY + 0.88 + age * 0.28 + lift;
      const pz = 0.22;
      aaBeads[k].position.set(px, py, pz);
      pts.push(V(px, py, pz));
    }
    for (let k = 0; k < 3; k++) {
      if (k + 1 < s.chainCount && s.clock >= 1.1) {
        aaBonds[k].set(pts[k], pts[k + 1]);
      } else {
        aaBonds[k].visible = false;
      }
    }
  }

  return { update, labels };
}
