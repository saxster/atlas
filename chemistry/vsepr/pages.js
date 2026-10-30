// Chapter 1, page by page (A-level / IB / AP Chemistry: shapes of molecules, VSEPR). Text and charts on the left page;
// on the right, the camera, the lit scene and what is shown. Every number is read from model.js.
import * as M from './model.js';
import { STATIONS, SPACING } from './world.js';
import { chart, samples } from '../../engine/chart.js';

const f = (x, n = 2) => (x < -1e-9 ? '−' : '') + Math.abs(x).toFixed(n);
const fr = (x, n = 1) => f(+x.toFixed(n), n);       // rounded first, so −0.0003 shows as 0.0, not −0.0
const C = M.MOL.CH4, N = M.MOL.NH3, O = M.MOL.H2O, HS = M.MOL.H2S, P3 = M.MOL.PH3;
const at = (k, dx = 0, dy = -0.15) => [STATIONS[k] + dx, dy, 0];
const cam = (k, az, el, dist, dx = 0, dy = -0.15) => ({ target: at(k, dx, dy), az, el, dist });

// the charts' ranges, shared with chapter.js so the live cursors land on them
export const RANGE = {
  swell: { x0: 1, x1: 1.5, y0: 98, y1: 112, h: 150 },
  edge: { x0: 0, x1: 2, y0: 86, y1: 118, h: 150 },
};
const swellChart = chart({ ...RANGE.swell, xlabel: 'lone-pair strength q (a bond pair is 1)', ylabel: 'H–X–H angle (°)', cursors: ['q5'],
  label: 'Bond angle against lone-pair strength in the toy model, for ammonia and water, with the measured angles marked at the fitted strength',
  series: [
    { pts: samples(1, 1.5, 25, q => M.squeeze('AX3E', q).bond), tag: [1.5, M.squeeze('AX3E', 1.5).bond, 'NH₃', true] },
    { cls: 'trend', pts: samples(1, 1.5, 25, q => M.squeeze('AX2E2', q).bond), tag: [1.4, M.squeeze('AX2E2', 1.4).bond - 1.5, 'H₂O', true] },
  ],
  marks: [[M.Q_LONE, N.angle, ''], [M.Q_LONE, O.angle, '']] });
const edgeChart = chart({ ...RANGE.edge, xlabel: 'lone pairs on the central atom', ylabel: 'H–X–H angle (°)', cursors: [],
  label: 'Measured bond angle against number of lone pairs: period 2 hydrides fall slowly from 109.5 degrees, period 3 hydrides drop to about 92 degrees',
  series: [
    { pts: [[0, C.angle], [1, N.angle], [2, O.angle]], tag: [1.15, N.angle + 0.4, 'CH₄, NH₃, H₂O'] },
    { cls: 'trend', pts: [[0, M.MOL.SiH4.angle], [1, P3.angle], [2, HS.angle]], tag: [0.12, 94, 'SiH₄, PH₃, H₂S'] },
    { cls: 'grid', pts: [[2, HS.angle], [2, HS.angle]], tag: [2, HS.angle - 4.6, `${f(HS.angle, 1)}°`, true] },
  ],
  marks: [[1, P3.angle, `${f(P3.angle, 1)}°`], [2, HS.angle, '']] });

export const PAGES = [
  {
    kicker: 'Chapter 1', title: 'The shapes of molecules', sub: 'electron pairs keep their distance',
    body: `
      <p class="lede">A molecule has a shape because the electron pairs around its central atom repel one another. Each region of electron density, a bond or a lone pair, is an <b>electron domain</b>. The domains settle as far apart as they can.</p>
      <p>That is <b>VSEPR</b>: valence shell electron pair repulsion. Count the domains on the central atom, spread them round it, and the shape follows.</p>
      <table class="data">
        <tr><th>domains</th><th>arrangement</th><th>angle</th></tr>
        ${[2, 3, 4].map(n => `<tr><td>${n}</td><td>${M.SPREAD_NAME[n]}</td><td>${f(M.SPREAD[n], n === 4 ? 1 : 0)}°</td></tr>`).join('')}
      </table>
      <p>A double or triple bond counts as one domain: its electrons all lie between the same two atoms. This chapter follows four domains, the commonest case, through methane, ammonia and water.</p>
      <p class="hintline">The lobes are electron pairs. Click a set to pull its pairs apart.</p>`,
    cam: cam('domains', -8, 12, 22.5), lit: 'domains4', scene: 'domains', look: {}, parts: ['domains2', 'domains3', 'domains4'],
    fig: 'Two, three and four electron pairs',
    alt: 'Two, three and four lobes round a central atom: a line, a flat triangle and a tetrahedron.',
  },
  {
    kicker: '1.1', title: 'The tetrahedral angle', sub: 'four corners of a cube',
    body: `
      <p class="lede">Four domains as far apart as possible point to the corners of a regular <b>tetrahedron</b>. The angle between any two is the same, and it can be found exactly.</p>
      <p>Take alternate corners of a cube centred on the atom: (1, 1, 1), (−1, −1, 1), (1, −1, −1) and (−1, 1, −1). Every pair is related the same way. For the two at the top, (1, 1, 1) and (−1, 1, −1),</p>
      <div class="eq">cos θ = <b>a</b>·<b>b</b> / |<b>a</b>||<b>b</b>| = (−1 + 1 − 1)/(√3·√3) = −1/3</div>
      <div class="eq">θ = arccos(−1/3) = ${f(M.TET_DEG, 4)}°</div>
      <p>No other way of placing four points on a sphere keeps the closest two further apart. A flat square, the obvious guess on paper, puts neighbours only 90° apart; going into three dimensions buys ${f(M.TET_DEG - 90, 1)}° more.</p>
      <p class="hintline">Click the tetrahedron to pull its corners out along their vectors.</p>`,
    cam: cam('tetra', -18, 16, 9.2), lit: 'tetra', scene: 'tetra', look: {},
    fig: 'A tetrahedron inside a cube',
    alt: 'A wire cube; four alternate corners joined to its centre, with the angle between two of them marked.',
  },
  {
    kicker: '1.2', title: 'Methane', sub: 'CH<sub>4</sub>: four bonds, no lone pairs',
    body: `
      <p class="lede">Carbon has four valence electrons; each hydrogen brings one. That makes four shared pairs, four domains, and nothing else on the carbon.</p>
      <p>All four domains are alike, so nothing distorts the tetrahedron: every H–C–H angle is ${f(M.TET_DEG, 1)}°. The shape is <b>tetrahedral</b>.</p>
      <table class="data">
        <tr><td>bond pairs, lone pairs</td><td>${C.bonds}, ${C.lone}</td></tr>
        <tr><td>H–C–H angle</td><td>${f(C.angle, 2)}°</td></tr>
        <tr><td>C–H bond length (measured)</td><td>${f(C.r, 3)} Å</td></tr>
        <tr><td>H···H distance, 2<i>r</i> sin(θ/2)</td><td>${f(M.hh('CH4'), 3)} Å</td></tr>
      </table>
      <p>Carbon is dark grey and hydrogen white. Positions are to scale; the atoms are drawn small so the bonds can be seen.</p>
      <p class="hintline">Click the molecule to pull its bonds apart.</p>`,
    cam: cam('ch4', -30, 22, 10, 0, 0.1), lit: 'ch4', scene: 'ch4', look: {},
    fig: 'Methane: a tetrahedron',
    alt: 'A carbon atom with four hydrogen atoms at the corners of a tetrahedron, one H–C–H angle marked 109.5 degrees.',
  },
  {
    kicker: '1.3', title: 'Ammonia', sub: 'NH<sub>3</sub>: three bonds and a lone pair',
    body: `
      <p class="lede">Nitrogen has five valence electrons. Three pair up with hydrogen; the other two stay on the nitrogen as a <b>lone pair</b>. Still four domains, still roughly tetrahedral.</p>
      <p>But the lone pair repels more strongly than a bond pair, so it pushes the three N–H bonds closer together: <b>lone pair–bond pair &gt; bond pair–bond pair</b>. The angle closes from ${f(M.TET_DEG, 1)}° to about 107°; measured, ${f(N.angle, 2)}°.</p>
      <p>A shape is named by its <b>atoms</b> only. The electron domains are tetrahedral, but the atoms make a pyramid with N at the top: <b>trigonal pyramidal</b>.</p>
      <table class="data">
        <tr><td>bond pairs, lone pairs</td><td>${N.bonds}, ${N.lone}</td></tr>
        <tr><td>H–N–H angle</td><td>${f(N.angle, 2)}°</td></tr>
        <tr><td>N–H bond length</td><td>${f(N.r, 3)} Å</td></tr>
        <tr><td>N above the plane of the H atoms</td><td>${f(M.pyramidHeight('NH3'), 3)} Å</td></tr>
      </table>
      <p class="hintline">Nitrogen is blue. Click to pull the bonds and the lone pair apart.</p>`,
    cam: cam('nh3', -14, 16, 9.4, 0, 0.05), lit: 'nh3', scene: 'nh3', look: {},
    fig: 'Ammonia: a trigonal pyramid',
    alt: 'A nitrogen atom with three hydrogen atoms below it and a translucent lone-pair lobe above, one H–N–H angle marked 106.7 degrees.',
  },
  {
    kicker: '1.4', title: 'Water', sub: 'H<sub>2</sub>O: two bonds and two lone pairs',
    body: `
      <p class="lede">Oxygen has six valence electrons: two bond pairs and two lone pairs. Four domains again, and now two of them are lone.</p>
      <p>The repulsions rank <b>lone–lone &gt; lone–bond &gt; bond–bond</b>, so with two lone pairs the H–O–H angle closes further, to about 104.5°; measured, ${f(O.angle, 2)}°. The atoms make a <b>bent</b> (V-shaped) molecule, not a straight line.</p>
      <table class="data">
        <tr><th></th><th>lone pairs</th><th>angle</th><th>shape</th></tr>
        ${M.MAIN.map(k => `<tr><td>${M.MOL[k].formula}</td><td>${M.MOL[k].lone}</td><td>${f(M.MOL[k].angle, 2)}°</td><td>${M.MOL[k].shape}</td></tr>`).join('')}
      </table>
      <p>Each lone pair takes about ${f((C.angle - O.angle) / 2, 1)}° off the angle between the bonds. Water's bend is why it is polar, and so why it dissolves salt and clings to glass.</p>
      <p class="hintline">Oxygen is red. Click to pull the pairs apart.</p>`,
    cam: cam('h2o', -14, 16, 9.4, 0, 0.05), lit: 'h2o', scene: 'h2o', look: {},
    fig: 'Water: bent',
    alt: 'An oxygen atom with two hydrogen atoms below it and two translucent lone-pair lobes above, the H–O–H angle marked 104.5 degrees.',
  },
  {
    kicker: '1.5', title: 'Why lone pairs push harder', sub: 'one nucleus instead of two',
    body: `
      <p class="lede">A bond pair is held between two nuclei and drawn out along the bond. A lone pair is held by one nucleus only, so it sits closer to it and spreads over a wider angle. Near the centre, where the domains meet, it takes up more room.</p>
      <p>VSEPR is a rule of thumb, not a calculation: it says the angle shrinks, not by how much. To see how far the idea can go, let four points on a sphere repel as Σ<i>q</i><sub>i</sub><i>q</i><sub>j</sub>/<i>d</i><sub>ij</sub>, with <i>q</i> = 1 for a bond pair and <i>q</i> for a lone pair. Choose <i>q</i> = ${f(M.Q_LONE, 3)} to match ammonia; then water is a prediction.</p>
      <table class="data">
        <tr><th></th><th>toy model</th><th>measured</th></tr>
        <tr><td>NH₃ (fitted)</td><td>${f(M.PREDICT.NH3.bond, 2)}°</td><td>${f(N.angle, 2)}°</td></tr>
        <tr><td>H₂O (predicted)</td><td>${f(M.PREDICT.H2O.bond, 2)}°</td><td>${f(O.angle, 2)}°</td></tr>
      </table>
      <div class="charts">${swellChart}</div>
      <p class="hintline">Solid: NH₃. Dashed: H₂O. Dots: the measured angles, at the fitted q. The live dot follows the figure.</p>
      <p>One fitted number gets water within ${f(Math.abs(M.PREDICT.H2O.off), 2)}°. That supports the picture; it does not prove it. The real reason lies in quantum mechanics, and page 1.7 shows a case the toy gets badly wrong.</p>
      <p class="hintline">The lone pair grows from a bond pair's strength to ${f(M.Q_LONE, 2)} and back. Click it.</p>`,
    cam: cam('swell', -14, 16, 9.4, 0, 0.05), lit: 'swell', scene: 'swell', look: {},
    fig: 'A lone pair swells and the bonds close',
    alt: 'Ammonia with faint bond-pair lobes along its bonds; the lone-pair lobe widens and the H–N–H angle closes from 109.5 to 106.7 degrees.',
  },
  {
    kicker: '1.6', title: 'The real molecules', sub: 'measured, not predicted',
    body: `
      <p class="lede">These are the measured geometries, to scale. Rotational (microwave) and vibrational (infrared) spectra give a molecule's moments of inertia, and from them its bond lengths and angles.</p>
      <table class="data">
        <tr><th></th><th>X–H</th><th>H–X–H</th><th>H···H</th></tr>
        ${M.MAIN.map(k => `<tr><td>${M.MOL[k].formula}</td><td>${f(M.MOL[k].r, 3)} Å</td><td>${f(M.MOL[k].angle, 2)}°</td><td>${f(M.hh(k), 3)} Å</td></tr>`).join('')}
      </table>
      <p>The bonds shorten from C–H to O–H: across the period the nuclear charge grows and pulls the shared pair in. The angles fall in the order VSEPR predicts, CH₄ &gt; NH₃ &gt; H₂O.</p>
      <p>Lone pairs do not show up in a structure: only the nuclei are located. They are drawn on the other pages as a reminder of what pushes the atoms where they are.</p>
      <p class="hintline">Data: NIST CCCBDB, experimental geometries. Click a molecule.</p>`,
    cam: cam('real', -10, 12, 21, 0, -0.1), lit: 'real_NH3', scene: 'real', look: {}, parts: ['real_CH4', 'real_NH3', 'real_H2O'],
    fig: 'Methane, ammonia and water as measured',
    alt: 'Methane, ammonia and water side by side at their measured bond lengths and angles, without lone pairs.',
  },
  {
    kicker: '1.7', title: 'Where VSEPR stops working', sub: 'hydrogen sulfide and phosphine',
    body: `
      <p class="lede">Sulfur sits under oxygen and also has two bond pairs and two lone pairs. VSEPR says “a bit less than 109.5°”, as for water. The measured H–S–H angle is ${f(HS.angle, 1)}°, close to a right angle.</p>
      <div class="charts">${edgeChart}</div>
      <table class="data">
        <tr><th></th><th>measured</th><th>toy model</th><th>off by</th></tr>
        ${['H2O', 'H2S', 'NH3', 'PH3'].map(k => `<tr><td>${M.MOL[k].formula}</td><td>${f(M.MOL[k].angle, 1)}°</td><td>${f(M.PREDICT[k].bond, 1)}°</td><td>${fr(M.PREDICT[k].off, 1)}°</td></tr>`).join('')}
      </table>
      <p>VSEPR gets the direction right and the size wrong. Sulfur and phosphorus are larger, their bonds longer, so the bond pairs crowd each other far less, and the bonds are made mostly from the central atom's p orbitals, which lie at 90°. Explaining that takes the quantum theory of bonding, not a counting rule.</p>
      <p class="hintline">Grey outlines: where the toy model would put sulfur's hydrogens.</p>`,
    cam: cam('edge', -10, 12, 19, 0, -0.1), lit: 'h2s', scene: 'edge', look: {}, parts: ['edge_h2o', 'h2s'],
    fig: 'Water and hydrogen sulfide',
    alt: 'Water and hydrogen sulfide side by side with their measured angles, 104.5 and 92.1 degrees; ghost outlines show where VSEPR would put sulfur’s hydrogens.',
  },
];

// ---------- click a scene: what it breaks into ----------
const rows = k => { const m = M.MOL[k]; return [['bond pairs, lone pairs', `${m.bonds}, ${m.lone}`], [`H–${m.centre}–H`, `${f(m.angle, 2)}°`], [`${m.centre}–H`, `${f(m.r, 3)} Å`], ['shape', m.shape]]; };
const tilt = s => [['turned', `${f(M.rock(s.t), 0)}° about the axis`]];
export const PLATES = {
  domains2: { text: 'Two domains get furthest apart on opposite sides of the atom: a straight line, 180°. Pulled apart, each lobe moves out along its own direction.', facts: s => [['domains', '2'], ['angle', '180°'], ['example', 'CO₂ (each C=O is one domain)'], ...tilt(s)] },
  domains3: { text: 'Three domains spread into a flat triangle, 120° apart, all in one plane.', facts: s => [['domains', '3'], ['angle', '120°'], ['example', 'BF₃'], ...tilt(s)] },
  domains4: { text: 'Four domains cannot all fit in a plane at more than 90°. In three dimensions they reach the corners of a tetrahedron, each pair 109.5° apart.', facts: s => [['domains', '4'], ['angle', `${f(M.TET_DEG, 2)}°`], ['example', 'CH₄, NH₃, H₂O'], ...tilt(s)] },
  tetra: { text: 'Each vector runs from the cube’s centre to a corner, so each has length √3 (in units of half the cube’s edge). The dot product of any two is −1, so cos θ = −1/3 for every pair. Pulled apart, the corners move out along the vectors and the angles stay the same.', facts: () => [['a·b', '−1'], ['|a|², |b|²', '3, 3'], ['cos θ', '−1/3'], ['θ', `${f(M.TET_DEG, 4)}°`]] },
  ch4: { text: 'Four bond pairs, pulled out along their own directions. They are all alike, so they share the space equally: a regular tetrahedron.', facts: s => [...rows('CH4'), ...tilt(s)] },
  nh3: { text: 'Three bond pairs and one lone pair. The lone pair (the translucent lobe) is wider near the nitrogen, so it pushes the bonds down and together.', facts: s => [...rows('NH3'), ['N above the H₃ plane', `${f(M.pyramidHeight('NH3'), 3)} Å`], ...tilt(s)] },
  h2o: { text: 'Two bond pairs and two lone pairs. The lone pairs push each other apart most, and both push on the bonds: the angle closes to 104.5°.', facts: s => [...rows('H2O'), ['lone–lone (toy model)', `${f(M.PREDICT.H2O.lone, 1)}°`], ...tilt(s)] },
  swell: { text: 'The faint lobes along the bonds are the bond pairs; the larger one is the lone pair. As its strength q grows from 1 (a bond pair’s) to its fitted value, it widens and the three bonds close up.', facts: s => { const p = M.squeeze('AX3E', s.q); return [['lone-pair strength q', f(s.q, 3)], ['H–N–H (toy model)', `${f(p.bond, 2)}°`], ['lone pair to a bond', `${f(p.lb, 2)}°`], ['measured H–N–H', `${f(N.angle, 2)}°`]]; } },
  real_CH4: { text: 'Methane as measured: the angle is fixed by its symmetry, and the C–H length is from its infrared spectrum.', facts: () => [...rows('CH4'), ['H···H', `${f(M.hh('CH4'), 3)} Å`]] },
  real_NH3: { text: 'Ammonia as measured. The lone pair is not located by experiment; only the four nuclei are.', facts: () => [...rows('NH3'), ['H···H', `${f(M.hh('NH3'), 3)} Å`]] },
  real_H2O: { text: 'Water as measured, at its equilibrium geometry (the bottom of its energy well, with the vibration taken out).', facts: () => [...rows('H2O'), ['H···H', `${f(M.hh('H2O'), 3)} Å`]] },
  edge_h2o: { text: 'Water: the toy model, fitted to ammonia, lands within a tenth of a degree.', facts: () => [['measured', `${f(O.angle, 2)}°`], ['toy model', `${f(M.PREDICT.H2O.bond, 2)}°`], ['O–H', `${f(O.r, 3)} Å`]] },
  h2s: { text: 'Hydrogen sulfide has the same count of pairs as water, but its hydrogens sit near a right angle. The grey outlines show where VSEPR’s toy model would put them.', facts: () => [['measured', `${f(HS.angle, 2)}°`], ['toy model', `${f(M.PREDICT.H2S.bond, 2)}°`], ['off by', `${f(M.PREDICT.H2S.off, 1)}°`], ['S–H', `${f(HS.r, 3)} Å`]] },
};
