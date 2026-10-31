// orbitals/practice.js — 12 practice questions (2 per page across pages 0..5).
// Every numeric answer is derived from model.js and independently verified in checks.mjs.
import * as M from './model.js';

const fmt = (x, n = 2) => (x < -1e-12 ? '−' : '') + Math.abs(x).toFixed(n);

export const PRACTICE = {
  0: [
    {
      q: 'Where is the volume probability density |ψ₁ₛ(r)|² = (1/π)e^(−2r) of a ground-state hydrogen electron highest?',
      choices: ['At the nucleus (r = 0)', 'At one Bohr radius (r = 1 a₀)', 'At two Bohr radii (r = 2 a₀)', 'Uniformly everywhere inside r = 1 a₀'],
      answer: 0,
      why: '<p>Because <i>R</i><sub>1s</sub>(<i>r</i>) = 2<i>e</i><sup>−<i>r</i></sup> decreases monotonically with <i>r</i>, the probability per unit volume |ψ<sub>1s</sub>|² = (1/π)<i>e</i><sup>−2<i>r</i></sup> is greatest right at the nucleus (<i>r</i> = 0). One Bohr radius is where the spherical shell probability 4π<i>r</i>²|ψ|² peaks.</p>',
    },
    {
      q: 'By what factor does the probability density |ψ₁ₛ(r)|² drop when moving from the nucleus (r = 0) out to r = 1 a₀?',
      choices: [`${fmt(Math.exp(-1), 3)}`, `${fmt(Math.exp(-2), 3)}`, `${fmt(4 * Math.exp(-2), 3)}`, '0.500'],
      answer: 1,
      why: `<div class="eq">|ψ<sub>1s</sub>(1)|² / |ψ<sub>1s</sub>(0)|² = <i>e</i><sup>−2(1)</sup> / <i>e</i><sup>0</sup> = <i>e</i><sup>−2</sup> = ${fmt(Math.exp(-2), 3)}</div><p>The amplitude ψ falls as <i>e</i><sup>−<i>r</i></sup> (${fmt(Math.exp(-1), 3)}), so squaring the wavefunction makes the density fall as <i>e</i><sup>−2<i>r</i></sup> (${fmt(Math.exp(-2), 3)}).</p>`,
    },
  ],
  1: [
    {
      q: 'Even though |ψ₁ₛ(r)|² is largest at r = 0, why does the radial distribution P₁ₛ(r) = 4r²e^(−2r) peak at r = 1.00 a₀?',
      choices: [
        'Thin spherical shells have surface area 4πr², which vanishes at r = 0 and grows as r² before e^(−2r) takes over',
        'Centrifugal repulsion pushes the 1s electron away from the proton',
        'The proton repels the electron at distances below 1 a₀',
        'The wavefunction ψ₁ₛ(r) has a node at r = 0',
      ],
      answer: 0,
      why: '<p>A spherical shell of thickness d<i>r</i> at radius <i>r</i> has volume 4π<i>r</i>² d<i>r</i>. At <i>r</i> = 0 that shell volume is zero; multiplying the rising shell area 4π<i>r</i>² by the falling density |ψ|² produces a peak where d/d<i>r</i>(<i>r</i>²<i>e</i><sup>−2<i>r</i></sup>) = 0, at <i>r</i> = 1.00 <i>a</i><sub>0</sub>.</p>',
    },
    {
      q: 'What is the value of the radial probability density P₁ₛ(r) = 4r²e^(−2r) at its peak r = 1 a₀ (in a₀⁻¹)?',
      choices: [`${fmt(M.P1s(1), 3)}`, `${fmt(Math.exp(-2), 3)}`, `${fmt(2 * Math.exp(-1), 3)}`, '1.000'],
      answer: 0,
      why: `<div class="eq"><i>P</i><sub>1s</sub>(1) = 4(1)²<i>e</i><sup>−2</sup> = 4<i>e</i><sup>−2</sup> = ${fmt(M.P1s(1), 3)} <i>a</i><sub>0</sub><sup>−1</sup></div><p>Integrating <i>P</i><sub>1s</sub>(<i>r</i>) from 0 to ∞ gives a total probability of exactly 1.</p>`,
    },
  ],
  2: [
    {
      q: 'At what radius r (in Bohr radii a₀) does the 2s radial wavefunction R₂ₛ(r) = (1/√2)(1 − r/2)e^(−r/2) have its spherical radial node?',
      choices: ['1.00', '2.00', `${fmt(3 + Math.sqrt(5), 2)}`, '4.00'],
      answer: 1,
      why: '<div class="eq">1 − <i>r</i>/2 = 0  ⇒  <i>r</i> = 2.00 <i>a</i><sub>0</sub></div><p>Inside <i>r</i> = 2 <i>a</i><sub>0</sub> the 2s wavefunction is positive; outside <i>r</i> = 2 <i>a</i><sub>0</sub> it flips negative. The outer probability peak sits further out at <i>r</i> = 3 + √5 ≈ 5.24 <i>a</i><sub>0</sub>.</p>',
    },
    {
      q: 'Where does the outer (main) peak of the 2s radial probability distribution P₂ₛ(r) occur (in a₀)?',
      choices: [`${fmt(3 - Math.sqrt(5), 2)}`, '2.00', '4.00', `${fmt(3 + Math.sqrt(5), 2)}`],
      answer: 3,
      why: `<p>Setting d<i>P</i><sub>2s</sub>/d<i>r</i> = 0 where 1 − <i>r</i>/2 ≠ 0 gives <i>r</i>² − 6<i>r</i> + 4 = 0, whose roots are <i>r</i> = 3 ± √5. The inner core peaks at 3 − √5 = ${fmt(3 - Math.sqrt(5), 2)} <i>a</i><sub>0</sub> and the tall outer shell peaks at 3 + √5 = ${fmt(3 + Math.sqrt(5), 2)} <i>a</i><sub>0</sub>.</p>`,
    },
  ],
  3: [
    {
      q: 'At what radius r (in a₀) does the 2p radial probability distribution P₂ₚ(r) = (1/24)r⁴e^(−r) reach its maximum?',
      choices: ['1.00', '2.00', '4.00', `${fmt(3 + Math.sqrt(5), 2)}`],
      answer: 2,
      why: '<div class="eq">d/d<i>r</i> (<i>r</i>⁴<i>e</i><sup>−<i>r</i></sup>) = (4<i>r</i>³ − <i>r</i>⁴)<i>e</i><sup>−<i>r</i></sup> = 0  ⇒  <i>r</i> = 4.00 <i>a</i><sub>0</sub></div><p>Notice that 2p peaks at 4.00 <i>a</i><sub>0</sub> with no radial node, whereas 2s has an inner penetration lobe at 0.76 <i>a</i><sub>0</sub> and an outer peak at 5.24 <i>a</i><sub>0</sub>.</p>',
    },
    {
      q: 'What do the blue (+) and red (−) colours on the two lobes of a 2p_z orbital represent?',
      choices: [
        'Opposite algebraic signs (phases) of the wavefunction ψ above and below the nodal plane z = 0',
        'Positive proton charge in one lobe and negative electron charge in the other',
        'Two different electrons with opposite spin quantum numbers',
        'Regions where the probability density |ψ|² is positive versus negative',
      ],
      answer: 0,
      why: '<p>Probability density |ψ|² is never negative. The + and − signs are the <b>wave phase</b> of ψ itself (cos θ &gt; 0 for <i>z</i> &gt; 0, cos θ &lt; 0 for <i>z</i> &lt; 0). Because ψ is continuous, changing sign from + to − forces ψ = 0 everywhere on the <i>xy</i> nodal plane.</p>',
    },
  ],
  4: [
    {
      q: 'At what radius r (in a₀) does the 3d radial probability distribution P₃d(r) ∝ r⁶e^(−2r/3) reach its maximum?',
      choices: ['3.00', '6.00', '9.00', '10.50'],
      answer: 2,
      why: '<div class="eq">d/d<i>r</i> (<i>r</i>⁶<i>e</i><sup>−2<i>r</i>/3</sup>) = <i>r</i>⁵(6 − ⅔<i>r</i>)<i>e</i><sup>−2<i>r</i>/3</sup> = 0  ⇒  <i>r</i> = 9.00 <i>a</i><sub>0</sub></div><p>For the circular orbits with ℓ = <i>n</i> − 1 (1s, 2p, 3d), the most probable radius is exactly <i>n</i>² <i>a</i><sub>0</sub> = 1, 4, 9 <i>a</i><sub>0</sub>.</p>',
    },
    {
      q: 'In the 3d_{z²} orbital, whose angular factor is proportional to 3 cos²θ − 1, what shapes are its two angular nodal surfaces?',
      choices: [
        'Two cones extending from the nucleus where cos²θ = 1/3 (θ ≈ 54.7° and 125.3°)',
        'Two perpendicular flat planes intersecting along the z-axis',
        'Two concentric spherical shells at r = 3 a₀ and r = 6 a₀',
        'A single flat plane at z = 0 plus one spherical shell',
      ],
      answer: 0,
      why: '<p>Setting 3 cos²θ − 1 = 0 gives cos θ = ±1/√3 (the magic angle 54.74°). Those two cones separate the positive polar lobes along ±<i>z</i> from the negative equatorial doughnut (torus) in the <i>xy</i> plane.</p>',
    },
  ],
  5: [
    {
      q: 'How many radial nodes and angular nodes does a 3p orbital (n = 3, ℓ = 1) have?',
      choices: [
        '1 radial node and 1 angular node (2 total)',
        '2 radial nodes and 0 angular nodes (2 total)',
        '0 radial nodes and 2 angular nodes (2 total)',
        '2 radial nodes and 1 angular node (3 total)',
      ],
      answer: 0,
      why: '<div class="eq">angular nodes = ℓ = 1, &nbsp;&nbsp;radial nodes = <i>n</i> − ℓ − 1 = 3 − 1 − 1 = 1</div><p>Every orbital in shell <i>n</i> = 3 has <i>n</i> − 1 = 2 nodes in total: 3s has (2 radial, 0 angular), 3p has (1 radial, 1 angular), and 3d has (0 radial, 2 angular).</p>',
    },
    {
      q: 'How many total nodes (radial + angular) does any 4d orbital (n = 4, ℓ = 2) have?',
      choices: ['1', '2', '3', '4'],
      answer: 2,
      why: '<div class="eq">total nodes = <i>n</i> − 1 = 4 − 1 = 3 &nbsp;(1 radial + 2 angular)</div><p>Total nodes depend only on the principal quantum number <i>n</i>: <i>n</i> − 1 = 3.</p>',
    },
  ],
};
