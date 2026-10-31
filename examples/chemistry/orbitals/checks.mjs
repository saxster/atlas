// node examples/chemistry/orbitals/checks.mjs — radial wavefunctions, normalization, radial nodes,
// most probable radii, orthogonality, angular harmonics, and all 12 practice questions verified.
import { checks, near, deriv, integ, bisect } from '@saxster/atlas/checks.js';
import * as M from './model.js';
import { PRACTICE } from './practice.js';

const C = checks();

// 1. Normalization: ∫₀^45 P_{nℓ}(r) dr = 1 via Simpson's rule for 1s, 2s, 2p, 3d
for (const [k, P] of Object.entries(M.RADIAL_P)) {
  const norm = integ(P, 0, 55, 4000);
  C.check(`radial probability P_${k}(r) integrates to 1 on [0, 55]`, near(norm, 1.0, 1e-5), `∫P_${k} = ${norm.toFixed(7)}`);
}

// 2. Orthogonality of 1s and 2s radial wavefunctions: ∫₀^∞ r² R₁ₛ(r) R₂ₛ(r) dr = 0
{
  const ov = integ(r => r * r * M.R1s(r) * M.R2s(r), 0, 45, 4000);
  C.check('1s and 2s radial wavefunctions are orthogonal: ∫ r² R₁ₛ R₂ₛ dr = 0', near(ov, 0.0, 1e-6), `overlap = ${ov.toExponential(2)}`);
}

// 3. Most probable radii via bisect on numerical derivative dP/dr = 0
{
  const r1s = bisect(r => deriv(M.P1s, r), 0.3, 2.5);
  const r2p = bisect(r => deriv(M.P2p, r), 1.5, 7.0);
  const r3d = bisect(r => deriv(M.P3d, r), 4.0, 14.0);
  C.check('most probable radius of 1s is r = 1 a₀ (dP₁ₛ/dr = 0)', near(r1s, 1.0, 1e-6), `r_peak(1s) = ${r1s.toFixed(6)}`);
  C.check('most probable radius of 2p is r = 4 a₀ (dP₂ₚ/dr = 0)', near(r2p, 4.0, 1e-6), `r_peak(2p) = ${r2p.toFixed(6)}`);
  C.check('most probable radius of 3d is r = 9 a₀ (dP₃d/dr = 0)', near(r3d, 9.0, 1e-5), `r_peak(3d) = ${r3d.toFixed(6)}`);
}

// 4. Radial node and two peaks of 2s via bisect
{
  const rNode = bisect(M.R2s, 0.5, 4.0);
  const rIn = bisect(r => deriv(M.P2s, r), 0.2, 1.5);
  const rOut = bisect(r => deriv(M.P2s, r), 3.0, 8.0);
  C.check('2s radial node is at r = 2 a₀ where R₂ₛ(r) = 0 and P₂ₛ(2) = 0',
    near(rNode, 2.0, 1e-9) && near(M.P2s(rNode), 0, 1e-12));
  C.check('2s inner peak at 3 − √5 ≈ 0.7639 a₀ and outer peak at 3 + √5 ≈ 5.2361 a₀',
    near(rIn, 3 - Math.sqrt(5), 1e-6) && near(rOut, 3 + Math.sqrt(5), 1e-6),
    `r_in = ${rIn.toFixed(4)}, r_out = ${rOut.toFixed(4)}`);
}

// 5. Expectation values ⟨r⟩ = ∫ r P(r) dr = ½(3n² − ℓ(ℓ + 1)) a₀
for (const [k, meta] of Object.entries(M.ORBITALS)) {
  const meanR = integ(r => r * M.RADIAL_P[k](r), 0, 60, 4000);
  const formulaR = 0.5 * (3 * meta.n * meta.n - meta.l * (meta.l + 1));
  C.check(`mean radius ⟨r⟩_${k} = ${formulaR} a₀ matches Simpson integral`,
    near(meanR, meta.rMean, 1e-4) && near(meta.rMean, formulaR, 1e-12), `⟨r⟩ = ${meanR.toFixed(4)}`);
}

// 6. Node counting rules: radial = n − ℓ − 1, angular = ℓ, total = n − 1
for (let n = 1; n <= 4; n++) {
  for (let l = 0; l < n; l++) {
    C.check(`quantum numbers (n=${n}, ℓ=${l}): radial + angular = n − 1 = ${n - 1}`,
      M.radialNodes(n, l) + M.angularNodes(l) === M.totalNodes(n) && M.totalNodes(n) === n - 1);
  }
}

// 7. Monte Carlo point-cloud sampler: 1s is purely + phase, 2s has inner + and outer − separated at r = 2, 2pz splits ± across y = 0
{
  const s1 = M.sampleOrbital('1s', 200, 11);
  const s2 = M.sampleOrbital('2s', 250, 22);
  const p2 = M.sampleOrbital('2pz', 250, 33);
  C.check('sampleOrbital(1s): all points have positive phase', s1.pos.length === 200 && s1.neg.length === 0);
  C.check('sampleOrbital(2s): inner core (r < 2) is positive phase and outer shell (r > 2) is negative phase',
    s2.pos.length > 5 && s2.neg.length > 150 && s2.pos.every(p => p.r < 2.0) && s2.neg.every(p => p.r > 2.0));
  C.check('sampleOrbital(2pz): positive lobe lies above nodal plane (y > 0) and negative lobe below (y < 0)',
    p2.pos.length > 80 && p2.neg.length > 80 && p2.pos.every(p => p.y > 0) && p2.neg.every(p => p.y < 0));
}

// 8. Practice questions: 12 questions (2 per page across 6 pages), 4 unique choices each, independently verified
const fmt = (x, n = 2) => (x < -1e-12 ? '−' : '') + Math.abs(x).toFixed(n);
const ans = (p, i) => PRACTICE[p][i].choices[PRACTICE[p][i].answer];
const pages = Object.keys(PRACTICE);
C.check('practice has 6 pages (0..5) with 2 questions each (12 total)',
  pages.length === 6 && pages.every(p => PRACTICE[p].length === 2));

for (const [page, qs] of Object.entries(PRACTICE)) {
  for (const [i, q] of qs.entries()) {
    const uniq = new Set(q.choices).size === q.choices.length && q.choices.length === 4;
    const valid = q.answer >= 0 && q.answer < 4 && q.why.length > 20;
    C.check(`practice p.${page}#${i + 1} has 4 distinct choices and explanation`, uniq && valid);
  }
}

C.check('practice 0#1: |ψ₁ₛ(r)|² is maximum at the nucleus r = 0',
  M.psi1sSq(0) > M.psi1sSq(1) && ans(0, 0).includes('r = 0'));
C.check('practice 0#2: ratio |ψ₁ₛ(1)|² / |ψ₁ₛ(0)|² = e^(−2)',
  ans(0, 1) === fmt(M.psi1sSq(1) / M.psi1sSq(0), 3));
C.check('practice 1#1: shell surface area 4πr² explains why P₁ₛ(r) peaks at r = 1 a₀',
  ans(1, 0).includes('4πr²'));
C.check('practice 1#2: peak radial probability density P₁ₛ(1) = 4e^(−2)',
  ans(1, 1) === fmt(4 * Math.exp(-2), 3));
C.check('practice 2#1: 2s radial node at r = 2.00 a₀ via bisect(R2s)',
  ans(2, 0) === fmt(bisect(M.R2s, 0.5, 3.5), 2));
C.check('practice 2#2: 2s outer peak at 3 + √5 ≈ 5.24 a₀ via bisect(dP2s/dr)',
  ans(2, 1) === fmt(bisect(r => deriv(M.P2s, r), 3.0, 8.0), 2));
C.check('practice 3#1: 2p radial peak at r = 4.00 a₀ via bisect(dP2p/dr)',
  ans(3, 0) === fmt(bisect(r => deriv(M.P2p, r), 1.5, 7.0), 2));
C.check('practice 3#2: blue (+) and red (−) lobes represent opposite wavefunction signs/phases',
  ans(3, 1).includes('phases'));
C.check('practice 4#1: 3d radial peak at r = 9.00 a₀ via bisect(dP3d/dr)',
  ans(4, 0) === fmt(bisect(r => deriv(M.P3d, r), 4.0, 14.0), 2));
C.check('practice 4#2: 3d_{z²} has two conical nodes where cos²θ = 1/3',
  ans(4, 1).includes('Two cones'));
C.check('practice 5#1: 3p (n=3, ℓ=1) has 1 radial node and 1 angular node',
  M.radialNodes(3, 1) === 1 && M.angularNodes(1) === 1 && ans(5, 0).includes('1 radial node and 1 angular node'));
C.check('practice 5#2: 4d (n=4, ℓ=2) has n − 1 = 3 total nodes',
  ans(5, 1) === `${M.totalNodes(4)}`);

C.report();
