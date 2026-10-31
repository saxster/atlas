// Chapter 2 of the Atlas of Chemistry: Atomic orbitals (wavefunctions ψ, probability density |ψ|²,
// radial distribution P(r) = 4πr²|ψ|², and radial/angular nodes).
import * as M from './model.js';
import { STATIONS, CY } from './world.js';
import { chart, samples } from '@saxster/atlas/chart.js';

const fmt = (x, n = 2) => (x < -5 * 10 ** -(n + 1) ? '−' : '') + Math.abs(x).toFixed(n);
const at = (k, dx = 0, dy = 0) => [STATIONS[k] + dx, CY + dy, 0];

export const RANGES = {
  psi1s:  { x0: 0, x1: 4,  y0: 0, y1: 0.35, h: 125 },
  rad1s:  { x0: 0, x1: 4,  y0: 0, y1: 0.60, h: 125 },
  rad2s:  { x0: 0, x1: 10, y0: 0, y1: 0.22, h: 125 },
  rad2p:  { x0: 0, x1: 10, y0: 0, y1: 0.22, h: 125 },
  rad3d:  { x0: 0, x1: 18, y0: 0, y1: 0.14, h: 125 },
  shells: { x0: 0, x1: 16, y0: 0, y1: 0.58, h: 125 },
};

export const PAGES = [
  {
    kicker: 'Chapter 2 · Atomic orbitals', title: 'An electron is a cloud, not a planet', sub: 'Born probability density |ψ|² replaces classical orbits',
    body: `
      <p class="lede">An electron in a hydrogen atom does not circle the proton on a fixed track. Quantum mechanics describes its state by a standing wave <b>ψ(<i>r</i>, θ, φ)</b> — an <b>atomic orbital</b> — whose squared magnitude |ψ|² gives the probability per unit volume of finding the electron at any point.</p>
      <div class="eq"><i>R</i><sub>1s</sub>(<i>r</i>) = 2<i>e</i><sup>−<i>r</i></sup>, &nbsp;&nbsp;|ψ<sub>1s</sub>(<i>r</i>)|² = (1/π)<i>e</i><sup>−2<i>r</i></sup> &nbsp;(in Bohr radii <i>a</i><sub>0</sub> = ${fmt(M.A0_ANGSTROM, 3)} Å)</div>
      <p>In the ground state (1s), ψ depends only on distance <i>r</i> from the nucleus and is positive everywhere. Surprisingly, the volume density |ψ<sub>1s</sub>(<i>r</i>)|² is greatest right at the proton (<i>r</i> = 0) and decays exponentially outward:</p>
      <table class="data">
        <tr><th>distance <i>r</i> (<i>a</i><sub>0</sub>)</th>${[0, 0.5, 1.0, 2.0, 3.0].map(r => `<td>${r}</td>`).join('')}</tr>
        <tr><th><i>R</i><sub>1s</sub>(<i>r</i>) = 2<i>e</i><sup>−<i>r</i></sup></th>${[0, 0.5, 1.0, 2.0, 3.0].map(r => `<td>${fmt(M.R1s(r), 3)}</td>`).join('')}</tr>
        <tr><th>density |ψ<sub>1s</sub>(<i>r</i>)|²</th>${[0, 0.5, 1.0, 2.0, 3.0].map(r => `<td>${fmt(M.psi1sSq(r), 3)}</td>`).join('')}</tr>
      </table>
      <div class="charts">${chart({ ...RANGES.psi1s, xlabel: 'radius r (Bohr radii a₀)', ylabel: 'density |ψ₁ₛ(r)|²', cursors: [],
        label: 'Volume probability density |ψ₁ₛ(r)|² = (1/π)e^(−2r) peaking at the nucleus r = 0',
        series: [{ pts: samples(0, 4, 90, M.psi1sSq), tag: [1.15, 0.14, '|ψ₁ₛ(r)|²'] }],
        marks: [[0, M.psi1sSq(0), 'max at r = 0']] })}</div>
      <p class="hintline">Click the figure to inspect the 1s probability cloud and volume density curve.</p>`,
    cam: { target: at('cloud1s', 0, 0), az: -10, el: 8, dist: 15.8 }, lit: 'cloud1s', scene: 'cloud1s', look: {},
    fig: '1s probability cloud and volume density |ψ₁ₛ(r)|²',
    alt: 'A spherical blue point cloud of 280 sampled electron positions around an amber proton on the left, paired on the right with the exponentially decaying curve |ψ₁ₛ(r)|² = (1/π)e^(−2r).',
  },
  {
    kicker: '2.1 · The radial distribution', title: 'Why the 1s shell peaks at one Bohr radius', sub: 'shell surface area 4πr² times density |ψ|²',
    body: `
      <p class="lede">If |ψ<sub>1s</sub>|² is highest at <i>r</i> = 0, why is the electron most likely to be found at <i>r</i> = 1 <i>a</i><sub>0</sub>? Because asking “how far from the nucleus?” sums probability over an entire thin spherical shell of radius <i>r</i> and thickness d<i>r</i>, whose volume is <b>4π<i>r</i>² d<i>r</i></b>:</p>
      <div class="eq"><i>P</i><sub>1s</sub>(<i>r</i>) = 4π<i>r</i>² |ψ<sub>1s</sub>(<i>r</i>)|² = <i>r</i>² [<i>R</i><sub>1s</sub>(<i>r</i>)]² = 4<i>r</i>²<i>e</i><sup>−2<i>r</i></sup></div>
      <p>At <i>r</i> = 0 the shell surface area 4π<i>r</i>² vanishes; at large <i>r</i> the exponential <i>e</i><sup>−2<i>r</i></sup> vanishes. Their product peaks where d<i>P</i><sub>1s</sub>/d<i>r</i> = 8<i>r</i>(1 − <i>r</i>)<i>e</i><sup>−2<i>r</i></sup> = 0 — at exactly <b><i>r</i> = 1.00 <i>a</i><sub>0</sub></b> (${fmt(M.A0_ANGSTROM, 3)} Å), Bohr’s classical orbit radius:</p>
      <table class="data">
        <tr><th>shell radius <i>r</i> (<i>a</i><sub>0</sub>)</th>${[0, 0.5, 1.0, 1.5, 2.5].map(r => `<td>${r}</td>`).join('')}</tr>
        <tr><th>shell factor <i>r</i>²</th>${[0, 0.5, 1.0, 1.5, 2.5].map(r => `<td>${fmt(r * r, 2)}</td>`).join('')}</tr>
        <tr><th><i>P</i><sub>1s</sub>(<i>r</i>) = 4<i>r</i>²<i>e</i><sup>−2<i>r</i></sup></th>${[0, 0.5, 1.0, 1.5, 2.5].map(r => `<td>${fmt(M.P1s(r), 3)}</td>`).join('')}</tr>
      </table>
      <div class="charts">${chart({ ...RANGES.rad1s, xlabel: 'radius r (a₀)', ylabel: 'P₁ₛ(r) = 4r²e^(−2r)', cursors: ['r1s'],
        label: 'Radial distribution function P₁ₛ(r) peaking at r = 1.00 a₀ with P₁ₛ(1) = 4e^(−2) ≈ 0.541',
        series: [{ pts: samples(0, 4, 100, M.P1s), tag: [1.55, 0.44, 'P₁ₛ(r) = 4r²e^(−2r)'] }],
        marks: [[1.0, M.P1s(1.0), 'peak r = 1 a₀']] })}</div>
      <p class="hintline">Drag the red dot on the 3D curve to resize the spherical shell around the 1s cloud.</p>`,
    cam: { target: at('radial1s', 0, 0), az: -8, el: 7, dist: 16.2 }, lit: 'radial1s', scene: 'radial1s', look: {},
    fig: 'Spherical shell 4πr²dr and radial distribution P₁ₛ(r)',
    alt: 'A translucent red spherical shell inside the 1s electron cloud on the left; on the right, a draggable point along P₁ₛ(r) = 4r²e^(−2r) peaking at r = 1 a₀.',
  },
  {
    kicker: '2.2 · Radial nodes', title: 'The 2s orbital has a hollow sphere inside', sub: 'wavefunction phase flips from + to − across r = 2 a₀',
    body: `
      <p class="lede">Move up to the second shell (<i>n</i> = 2, ℓ = 0). To stay orthogonal to 1s (∫ψ<sub>1s</sub>ψ<sub>2s</sub> d<i>V</i> = 0), the 2s wavefunction must change sign from positive (+ blue) near the nucleus to negative (− red) further out:</p>
      <div class="eq"><i>R</i><sub>2s</sub>(<i>r</i>) = (1/√2)(1 − ½<i>r</i>)<i>e</i><sup>−<i>r</i>/2</sup>, &nbsp;&nbsp;<i>P</i><sub>2s</sub>(<i>r</i>) = ½<i>r</i>²(1 − ½<i>r</i>)²<i>e</i><sup>−<i>r</i></sup></div>
      <p>Where 1 − ½<i>r</i> = 0, at <b><i>r</i> = 2.00 <i>a</i><sub>0</sub></b>, the wavefunction passes through zero on a spherical shell — a <b>radial node</b> where the electron is never found. That creates a small inner core peaking at 3 − √5 = ${fmt(M.ORBITALS['2s'].rInnerPeak, 2)} <i>a</i><sub>0</sub> and a tall outer shell peaking at 3 + √5 = ${fmt(M.ORBITALS['2s'].rPeak, 2)} <i>a</i><sub>0</sub>:</p>
      <table class="data">
        <tr><th>feature</th><th>inner peak</th><th>radial node</th><th>outer peak</th><th>mean ⟨<i>r</i>⟩</th></tr>
        <tr><td>radius <i>r</i> (<i>a</i><sub>0</sub>)</td><td>${fmt(M.ORBITALS['2s'].rInnerPeak, 2)}</td><td><b>2.00</b></td><td>${fmt(M.ORBITALS['2s'].rPeak, 2)}</td><td>6.00</td></tr>
        <tr><td><i>P</i><sub>2s</sub>(<i>r</i>)</td><td>${fmt(M.P2s(M.ORBITALS['2s'].rInnerPeak), 3)}</td><td><b>0.000</b></td><td>${fmt(M.P2s(M.ORBITALS['2s'].rPeak), 3)}</td><td>—</td></tr>
      </table>
      <div class="charts">${chart({ ...RANGES.rad2s, xlabel: 'radius r (a₀)', ylabel: 'P₂ₛ(r)', cursors: ['r2s'],
        label: '2s radial distribution P₂ₛ(r) with inner peak at 0.76 a₀, radial node at 2.00 a₀, and outer peak at 5.24 a₀',
        series: [{ pts: samples(0, 10, 120, M.P2s), tag: [5.8, 0.175, 'P₂ₛ(r)'] }],
        marks: [[2.0, 0, 'node r = 2 a₀'], [M.ORBITALS['2s'].rPeak, M.P2s(M.ORBITALS['2s'].rPeak), '5.24 a₀']] })}</div>
      <p class="hintline">The front of the 2s cloud is cut away to show the blue inner core, the grey nodal sphere at r = 2 a₀, and the red outer shell.</p>`,
    cam: { target: at('node2s', 0, 0), az: -10, el: 8, dist: 16.2 }, lit: 'node2s', scene: 'node2s', look: {},
    fig: 'Cutaway 2s orbital and radial node at r = 2 a₀',
    alt: 'A cutaway 2s cloud showing an inner blue positive core surrounded by a translucent spherical nodal shell at r = 2 a₀ and an outer red negative shell, paired with P₂ₛ(r).',
  },
  {
    kicker: '2.3 · The p orbitals', title: 'Two lobes and a nodal plane', sub: 'angular momentum ℓ = 1 carves a planar node through the nucleus',
    body: `
      <p class="lede">When angular momentum is ℓ = 1 (the <b>p subshell</b>), the wavefunction multiplies a nodeless radial part by a directional factor proportional to <i>x</i>/<i>r</i>, <i>y</i>/<i>r</i>, or <i>z</i>/<i>r</i> = cos θ:</p>
      <div class="eq"><i>R</i><sub>2p</sub>(<i>r</i>) = (1/2√6) <i>r e</i><sup>−<i>r</i>/2</sup>, &nbsp;&nbsp;ψ<sub>2p<sub>z</sub></sub> ∝ <i>r e</i><sup>−<i>r</i>/2</sup> cos θ</div>
      <p>Because cos θ is positive above the <i>xy</i> plane (+ blue lobe) and negative below it (− red lobe), ψ<sub>2p<sub>z</sub></sub> vanishes across the entire <b><i>xy</i> nodal plane</b> (<i>z</i> = 0), including the nucleus. Three mutually perpendicular orientations — <b>2p<sub>x</sub>, 2p<sub>y</sub>, 2p<sub>z</sub></b> — correspond to magnetic quantum numbers <i>m</i> = −1, 0, +1.</p>
      <table class="data">
        <tr><th>orbital</th><th>angular factor</th><th>nodal plane</th><th>radial peak</th></tr>
        <tr><td>2p<sub>z</sub></td><td>cos θ = <i>z</i>/<i>r</i></td><td><i>z</i> = 0 (<i>xy</i> plane)</td><td>4.00 <i>a</i><sub>0</sub></td></tr>
        <tr><td>2p<sub>x</sub></td><td>sin θ cos φ = <i>x</i>/<i>r</i></td><td><i>x</i> = 0 (<i>yz</i> plane)</td><td>4.00 <i>a</i><sub>0</sub></td></tr>
        <tr><td>2p<sub>y</sub></td><td>sin θ sin φ = <i>y</i>/<i>r</i></td><td><i>y</i> = 0 (<i>xz</i> plane)</td><td>4.00 <i>a</i><sub>0</sub></td></tr>
      </table>
      <div class="charts">${chart({ ...RANGES.rad2p, xlabel: 'radius r (a₀)', ylabel: 'P₂ₚ(r) vs P₂ₛ(r)', cursors: [],
        label: '2p radial distribution peaking at 4.00 a₀ with zero radial nodes, compared against 2s',
        series: [
          { pts: samples(0, 10, 100, M.P2p), tag: [4.2, 0.195, 'P₂ₚ(r) (peak 4 a₀)'] },
          { cls: 'trend', pts: samples(0, 10, 100, M.P2s), tag: [6.5, 0.145, 'P₂ₛ(r)'] },
        ],
        marks: [[4.0, M.P2p(4.0), '4.00 a₀']] })}</div>
      <p class="hintline">Click any 2p orbital to pull its positive (+ blue) and negative (− red) lobes apart from the nodal plane.</p>`,
    cam: { target: at('porbitals', 0, 0), az: -12, el: 12, dist: 16.5 }, lit: 'porbitals', scene: 'porbitals', look: {},
    fig: '2p_z, 2p_x and 2p_y orbitals with their nodal planes',
    alt: 'Three 2p dumbbell clouds (2p_z, 2p_x, 2p_y) side by side, each with a blue positive lobe and red negative lobe bisected by a translucent planar angular node.',
  },
  {
    kicker: '2.4 · The d orbitals', title: 'Four-leaf clovers and the doughnut', sub: 'ℓ = 2 introduces two angular nodal surfaces',
    body: `
      <p class="lede">In the third shell (<i>n</i> = 3), angular momentum can reach ℓ = 2 (the five <b>3d orbitals</b>, <i>m</i> = −2 … +2). Having ℓ = 2 means every 3d orbital possesses <b>two angular nodal surfaces</b> passing through the nucleus and zero radial nodes:</p>
      <div class="eq"><i>R</i><sub>3d</sub>(<i>r</i>) = (4 / 81√30) <i>r</i>²<i>e</i><sup>−<i>r</i>/3</sup>, &nbsp;&nbsp;<i>P</i><sub>3d</sub>(<i>r</i>) peaks at <i>r</i> = 9.00 <i>a</i><sub>0</sub></div>
      <p>Four of the 3d orbitals (such as <b>3d<sub>x²−y²</sub></b> ∝ <i>x</i>² − <i>y</i>²) form four-leaf clovers whose alternating + and − lobes are separated by two perpendicular nodal planes. The fifth, <b>3d<sub>z²</sub></b> ∝ 3 cos²θ − 1, has two positive polar lobes along ±<i>z</i> and a negative equatorial doughnut (torus) in the <i>xy</i> plane, separated by two <b>nodal cones</b> at the magic angle cos θ = ±1/√3 (54.74°):</p>
      <table class="data">
        <tr><th>orbital</th><th>angular dependence</th><th>2 angular nodes</th><th>lobe geometry</th></tr>
        <tr><td>3d<sub>x²−y²</sub></td><td>sin²θ cos 2φ ∝ <i>x</i>² − <i>y</i>²</td><td>2 planes (<i>x</i> = ±<i>y</i>)</td><td>4-lobe cloverleaf</td></tr>
        <tr><td>3d<sub>z²</sub></td><td>3 cos²θ − 1</td><td>2 cones (θ = 54.7°, 125.3°)</td><td>dumbbell + <i>xy</i> torus</td></tr>
      </table>
      <div class="charts">${chart({ ...RANGES.rad3d, xlabel: 'radius r (a₀)', ylabel: 'P₃d(r)', cursors: [],
        label: '3d radial distribution function P₃d(r) peaking at r = 9.00 a₀',
        series: [{ pts: samples(0, 18, 110, M.P3d), tag: [9.5, 0.11, 'P₃d(r) (peak 9 a₀)'] }],
        marks: [[9.0, M.P3d(9.0), 'peak r = 9 a₀']] })}</div>
      <p class="hintline">Compare 3d_{x²−y²} (two perpendicular nodal planes) on the left with 3d_{z²} (two nodal cones) on the right.</p>`,
    cam: { target: at('dorbitals', 0, 0), az: -14, el: 14, dist: 16.5 }, lit: 'dorbitals', scene: 'dorbitals', look: {},
    fig: '3d_{x²−y²} cloverleaf and 3d_{z²} dumbbell-and-torus',
    alt: 'On the left, a 3d_{x²−y²} four-lobed cloud crossed by two diagonal nodal planes; on the right, a 3d_{z²} orbital with blue polar lobes, a red equatorial ring, and two translucent nodal cones.',
  },
  {
    kicker: '2.5 · Quantum numbers', title: 'Counting nodes: n − 1 total', sub: 'how (n, ℓ) partition radial spheres and angular planes',
    body: `
      <p class="lede">Every hydrogen orbital ψ<sub><i>n</i>,ℓ,<i>m</i></sub> obeys a universal topological rule: the principal quantum number <i>n</i> fixes the <b>total number of nodes at <i>n</i> − 1</b>, while the angular momentum quantum number ℓ decides how many of those nodes are angular versus radial:</p>
      <div class="eq">angular nodes = ℓ, &nbsp;&nbsp;radial nodes = <i>n</i> − ℓ − 1, &nbsp;&nbsp;total nodes = <i>n</i> − 1</div>
      <p>When ℓ = <i>n</i> − 1 (1s, 2p, 3d), all <i>n</i> − 1 nodes are angular and the radial distribution <i>P</i><sub><i>n</i>ℓ</sub>(<i>r</i>) has a single peak at <b><i>r</i> = <i>n</i>² <i>a</i><sub>0</sub></b> (1, 4, 9 <i>a</i><sub>0</sub>):</p>
      <table class="data">
        <tr><th>orbital</th><th>(<i>n</i>, ℓ)</th><th>radial nodes</th><th>angular nodes</th><th>total</th><th>peak <i>r</i> (<i>a</i><sub>0</sub>)</th><th>⟨<i>r</i>⟩ (<i>a</i><sub>0</sub>)</th></tr>
        ${['1s', '2s', '2p', '3d'].map(k => {
          const o = M.ORBITALS[k];
          return `<tr><td><b>${o.label}</b></td><td>(${o.n}, ${o.l})</td><td>${M.radialNodes(o.n, o.l)}</td><td>${M.angularNodes(o.l)}</td><td><b>${M.totalNodes(o.n)}</b></td><td>${fmt(o.rPeak, 2)}</td><td>${fmt(o.rMean, 1)}</td></tr>`;
        }).join('')}
      </table>
      <div class="charts">${chart({ ...RANGES.shells, xlabel: 'radius r (a₀)', ylabel: 'P(r) for 1s, 2p, 3d', cursors: [],
        label: 'Radial distributions of 1s (peak 1 a₀), 2p (peak 4 a₀), and 3d (peak 9 a₀) moving outward as n² a₀',
        series: [
          { pts: samples(0, 16, 120, M.P1s), tag: [1.3, 0.50, '1s (1 a₀)'] },
          { cls: 'curve total', pts: samples(0, 16, 120, M.P2p), tag: [4.2, 0.21, '2p (4 a₀)'] },
          { cls: 'trend', pts: samples(0, 16, 120, M.P3d), tag: [9.2, 0.13, '3d (9 a₀)'] },
        ] })}</div>
      <p class="hintline">Click the staircase to compare the node counts and shell radii across n = 1, 2, 3.</p>`,
    cam: { target: at('staircase', 0, 0), az: -8, el: 8, dist: 16.8 }, lit: 'staircase', scene: 'staircase', look: {},
    fig: 'Orbital staircase by (n, ℓ) and n − 1 total nodes',
    alt: 'A three-level staircase displaying 1s (n=1, 0 nodes), 2s and 2p (n=2, 1 node), and 3d (n=3, 2 nodes) with their radial and angular node counts.',
  },
];

export const PLATES = {
  cloud1s: {
    text: 'In the 1s ground state (n = 1, ℓ = 0, m = 0), ψ₁ₛ(r) = (1/√π)e^(−r) has no nodes anywhere. Volume density |ψ|² is highest at the proton (r = 0), even though the thin shell of radius r has zero area there.',
    facts: () => [
      ['quantum numbers (n, ℓ, m)', '(1, 0, 0)'],
      ['density at nucleus |ψ₁ₛ(0)|²', `${fmt(M.psi1sSq(0), 4)} a₀⁻³`],
      ['density at 1 a₀ |ψ₁ₛ(1)|²', `${fmt(M.psi1sSq(1), 4)} a₀⁻³`],
      ['ground-state energy E₁', `${fmt(M.energyEv(1), 2)} eV`],
    ],
  },
  radial1s: {
    text: 'The radial distribution function P₁ₛ(r) = 4πr²|ψ₁ₛ(r)|² = 4r²e^(−2r) multiplies the growing surface area 4πr² of a spherical shell by the decaying density |ψ|². Their product peaks at r = 1.00 a₀.',
    facts: s => [
      ['selected shell radius r', `${fmt(s.r1, 2)} a₀`],
      ['shell probability P₁ₛ(r)', `${fmt(M.P1s(s.r1), 3)} a₀⁻¹`],
      ['most probable radius r_peak', '1.00 a₀ (0.529 Å)'],
      ['mean radius ⟨r⟩₁ₛ', '1.50 a₀'],
    ],
  },
  node2s: {
    text: 'Because R₂ₛ(r) = (1/√2)(1 − r/2)e^(−r/2) changes sign at r = 2 a₀, the 2s orbital has an inner positive core (+ blue) and an outer negative shell (− red) separated by a spherical radial node.',
    facts: s => [
      ['selected radius r', `${fmt(s.r2, 2)} a₀`],
      ['radial probability P₂ₛ(r)', `${fmt(M.P2s(s.r2), 3)} a₀⁻¹`],
      ['inner peak / node / outer peak', '0.76 / 2.00 / 5.24 a₀'],
      ['mean radius ⟨r⟩₂ₛ', '6.00 a₀'],
    ],
  },
  porbitals: {
    text: 'Each 2p orbital (n = 2, ℓ = 1) has ℓ = 1 planar angular node and n − ℓ − 1 = 0 radial nodes. The blue (+) and red (−) lobes show opposite wavefunction phases across the nodal plane.',
    facts: () => [
      ['quantum numbers (n, ℓ)', '(2, 1), m = −1, 0, +1'],
      ['radial / angular nodes', '0 radial, 1 planar angular'],
      ['most probable radius r_peak', '4.00 a₀'],
      ['mean radius ⟨r⟩₂ₚ', '5.00 a₀'],
    ],
  },
  dorbitals: {
    text: 'Every 3d orbital (n = 3, ℓ = 2) has 2 angular nodes and 0 radial nodes. In 3d_{x²−y²} those nodes are the two diagonal planes x = ±y; in 3d_{z²} they are two cones at θ = arccos(±1/√3) = 54.7° and 125.3°.',
    facts: () => [
      ['quantum numbers (n, ℓ)', '(3, 2), five m states'],
      ['radial / angular nodes', '0 radial, 2 angular'],
      ['most probable radius r_peak', '9.00 a₀'],
      ['mean radius ⟨r⟩₃d', '10.50 a₀'],
    ],
  },
  staircase: {
    text: 'Across any principal shell n, the total number of nodal surfaces is fixed at n − 1: raising ℓ trades spherical radial nodes (n − ℓ − 1) for planar or conical angular nodes (ℓ).',
    facts: () => [
      ['1s (n=1, ℓ=0)', '0 radial + 0 angular = 0 nodes'],
      ['2s (n=2, ℓ=0)', '1 radial + 0 angular = 1 node'],
      ['2p (n=2, ℓ=1)', '0 radial + 1 angular = 1 node'],
      ['3d (n=3, ℓ=2)', '0 radial + 2 angular = 2 nodes'],
    ],
  },
};
