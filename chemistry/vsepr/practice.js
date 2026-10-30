// vsepr/practice.js — A-level / IB / AP-style practice, one or two questions per page (keys are page indices, as in
// PAGES). Every number comes from the model; checks.mjs recomputes each numeric answer another way.
import * as M from './model.js';

const f = (x, n = 2) => (x < -1e-12 ? '−' : '') + Math.abs(x).toFixed(n);
const C = M.MOL.CH4, N = M.MOL.NH3, O = M.MOL.H2O, HS = M.MOL.H2S;
const sin = d => Math.sin(d * M.DEG);

export const PRACTICE = {
  0: [
    { q: 'How many electron domains are there on the oxygen atom in a water molecule?',
      choices: ['2', '3', '4', '6'], answer: 2,
      why: '<p>Oxygen has six valence electrons. Two of them pair with the two hydrogens’ electrons as bonds; the other four make two lone pairs. Two bond pairs and two lone pairs: four domains. Counting only the bonds gives 2.</p>' },
    { q: 'Three electron domains spread as far apart as possible round an atom. What angle separates them?',
      choices: ['90°', `${f(M.TET_DEG, 1)}°`, `${f(M.SPREAD[3], 0)}°`, '180°'], answer: 2,
      why: `<p>Three points as far apart as possible lie in a plane at the corners of an equilateral triangle: 360°/3 = ${f(M.SPREAD[3], 0)}°, <b>trigonal planar</b> (BF₃). ${f(M.TET_DEG, 1)}° is for four domains, 180° for two.</p>` },
  ],
  1: [
    { q: 'Two of the vectors from the centre of a cube to alternate corners are (1, 1, 1) and (1, −1, −1). What is the cosine of the angle between them?',
      choices: ['−0.500', '0.333', `${f(-1 / 3, 3)}`, '−0.707'], answer: 2,
      why: '<div class="eq">cos θ = (1 − 1 − 1)/(√3 · √3) = −1/3</div><p>The dot product is −1 and each vector has length √3. +1/3 drops the sign of the dot product; −0.5 is the 120° of three domains.</p>' },
    { q: 'What, then, is the tetrahedral angle, to one decimal place?',
      choices: ['90.0°', `${f(M.TET_DEG, 1)}°`, `${f(O.angle, 1)}°`, '120.0°'], answer: 1,
      why: `<div class="eq">θ = arccos(−1/3) = ${f(M.TET_DEG, 4)}°</div><p>${f(O.angle, 1)}° is water’s angle, already squeezed by two lone pairs.</p>` },
  ],
  2: [
    { q: `In methane the C–H bonds are ${f(C.r, 3)} Å long and every H–C–H angle is ${f(C.angle, 2)}°. How far apart are two hydrogen nuclei?`,
      choices: [`${f(2 * C.r, 3)} Å`, `${f(M.hh('CH4'), 3)} Å`, `${f(C.r * Math.SQRT2, 3)} Å`, `${f(2 * C.r * Math.cos(C.angle * M.DEG / 2), 3)} Å`], answer: 1,
      why: `<p>The two bonds and the H···H line make an isosceles triangle with apex angle θ:</p><div class="eq"><i>d</i> = 2<i>r</i> sin(θ/2) = 2 × ${f(C.r, 3)} × sin ${f(C.angle / 2, 2)}° = ${f(M.hh('CH4'), 3)} Å</div><p>${f(C.r * Math.SQRT2, 3)} Å would need a right angle; cos in place of sin gives the height of the triangle, not its base.</p>` },
  ],
  3: [
    { q: 'Ammonia has four electron domains round the nitrogen. Which pair of names is right?',
      choices: ['domains tetrahedral; shape tetrahedral', 'domains tetrahedral; shape trigonal pyramidal', 'domains trigonal planar; shape trigonal planar', 'domains trigonal pyramidal; shape bent'], answer: 1,
      why: '<p>Four domains point roughly to the corners of a tetrahedron. The shape is named from the atoms alone, and four atoms with N above three H make a <b>trigonal pyramid</b>. The lone pair shapes the molecule but is not part of its name.</p>' },
    { q: `With N–H = ${f(N.r, 3)} Å and H–N–H = ${f(N.angle, 2)}°, how far is the nitrogen nucleus above the plane of the three hydrogens?`,
      choices: [`${f(N.r * Math.cos(N.angle * M.DEG / 2), 3)} Å`, `${f(M.pyramidHeight('NH3'), 3)} Å`, `${f(N.r / 3, 3)} Å`, `${f(N.r, 3)} Å`], answer: 1,
      why: `<p>The three H lie on a circle round the axis. Their spacing is 2<i>r</i> sin(θ/2) = ${f(M.hh('NH3'), 3)} Å, an equilateral triangle, so each is ${f(M.hh('NH3') / Math.sqrt(3), 3)} Å from the axis. Then</p><div class="eq"><i>h</i> = √(${f(N.r, 3)}² − ${f(M.hh('NH3') / Math.sqrt(3), 3)}²) = ${f(M.pyramidHeight('NH3'), 3)} Å</div><p>A low pyramid: the lone pair holds the hydrogens well below the nitrogen, but not far.</p>` },
  ],
  4: [
    { q: 'Which ranks the bond angles correctly, largest first?',
      choices: ['H₂O &gt; NH₃ &gt; CH₄', 'CH₄ = NH₃ = H₂O', 'CH₄ &gt; NH₃ &gt; H₂O', 'NH₃ &gt; CH₄ &gt; H₂O'], answer: 2,
      why: `<p>All three have four domains. Each lone pair repels more than a bond pair and squeezes the bonds: ${f(C.angle, 1)}° (no lone pairs) &gt; ${f(N.angle, 1)}° (one) &gt; ${f(O.angle, 1)}° (two).</p>` },
    { q: `Water’s O–H bonds are ${f(O.r, 3)} Å long at ${f(O.angle, 2)}°. How far apart are its hydrogen nuclei?`,
      choices: [`${f(2 * O.r, 3)} Å`, `${f(M.hh('H2O'), 3)} Å`, `${f(2 * O.r * sin(M.TET_DEG / 2), 3)} Å`, `${f(O.r * Math.SQRT2, 3)} Å`], answer: 1,
      why: `<div class="eq"><i>d</i> = 2 × ${f(O.r, 3)} × sin ${f(O.angle / 2, 2)}° = ${f(M.hh('H2O'), 3)} Å</div><p>${f(2 * O.r, 3)} Å is a straight H–O–H; ${f(2 * O.r * sin(M.TET_DEG / 2), 3)} Å uses the tetrahedral angle, forgetting the lone pairs’ squeeze.</p>` },
  ],
  5: [
    { q: 'Why does a lone pair repel neighbouring electron pairs more strongly than a bond pair does?',
      choices: ['It carries more charge than a bond pair', 'It is held by one nucleus only, so it sits closer to that nucleus and spreads more widely around it', 'It is further from the nucleus than a bond pair', 'Lone pairs and bond pairs repel equally; the angle closes for another reason'], answer: 1,
      why: '<p>Both are two electrons, the same charge. A bond pair is drawn out between two nuclei; a lone pair, held by one, crowds the space near the central atom where the domains meet.</p>' },
    { q: `In the chapter’s toy model, one lone-pair strength (<i>q</i> = ${f(M.Q_LONE, 3)}) is fitted so that ammonia comes out at ${f(N.angle, 2)}°. What does it then predict for water?`,
      choices: [`${f(M.TET_DEG, 1)}°`, `${f(M.PREDICT.H2O.bond, 1)}°`, `${f(N.angle, 1)}°`, '90.0°'], answer: 1,
      why: `<p>With two lone pairs of the same strength the minimum-energy arrangement has H–O–H = ${f(M.PREDICT.H2O.bond, 2)}°, against ${f(O.angle, 2)}° measured: ${f(Math.abs(M.PREDICT.H2O.off), 2)}° off. ${f(N.angle, 1)}° would ignore the second lone pair.</p>` },
  ],
  6: [
    { q: `By what percentage is water’s O–H bond (${f(O.r, 3)} Å) shorter than methane’s C–H bond (${f(C.r, 3)} Å)?`,
      choices: [`${f(100 * (C.r - O.r) / O.r, 1)}%`, `${f(100 * (C.r - O.r) / C.r, 1)}%`, `${f(100 * (C.r - N.r) / C.r, 1)}%`, `${f(100 * O.r / C.r, 1)}%`], answer: 1,
      why: `<div class="eq">(${f(C.r, 3)} − ${f(O.r, 3)}) / ${f(C.r, 3)} = ${f(100 * (C.r - O.r) / C.r, 1)}%</div><p>Divide by the length you start from. Across the period the growing nuclear charge pulls the shared pair closer. ${f(100 * (C.r - N.r) / C.r, 1)}% is the step from C–H to N–H only.</p>` },
  ],
  7: [
    { q: `VSEPR's toy model predicts ${f(M.PREDICT.H2S.bond, 1)}° for H₂S. The measured angle is ${f(HS.angle, 2)}°. By how much does it overestimate?`,
      choices: [`${f(M.PREDICT.H2S.off, 1)}°`, `${f(M.TET_DEG - HS.angle, 1)}°`, `${f(HS.angle - 90, 1)}°`, `${f(M.PREDICT.H2S.off / 2, 1)}°`], answer: 0,
      why: `<div class="eq">${f(M.PREDICT.H2S.bond, 2)}° − ${f(HS.angle, 2)}° = ${f(M.PREDICT.H2S.off, 1)}°</div><p>For water the same model is ${f(Math.abs(M.PREDICT.H2O.off), 2)}° off. Same count of pairs, very different result.</p>` },
    { q: 'Which statement about VSEPR is honest?',
      choices: ['It calculates bond angles exactly from the number of electron pairs', 'It predicts the order of angles in CH₄, NH₃ and H₂O, but not their exact sizes, and it fails badly for H₂S', 'It works only for molecules without lone pairs', 'It shows that lone pairs are part of the molecule’s shape'], answer: 1,
      why: '<p>VSEPR is a counting rule: it gets shapes and trends right for many molecules of the second period, gives no numbers of its own, and misses the near-90° angles of the heavier hydrides such as H₂S and PH₃.</p>' },
  ],
};
