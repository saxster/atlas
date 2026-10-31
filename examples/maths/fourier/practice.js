// Exam-style practice for Chapter 5: Fourier Series & Epicycles (2 questions per page, 12 total).
import * as M from './model.js';

const fmt = (x, n = 3) => (x < -1e-12 ? '−' : '') + Math.abs(x).toFixed(n);

const b1 = M.squareCoeff(1), b3 = M.squareCoeff(3), s2Peak = b1 - b3;
const b5 = M.squareCoeff(5);
const saw1 = M.sawtoothCoeff(1), saw2 = Math.abs(M.sawtoothCoeff(2));
const e1 = M.squareParsevalSum(1), e3 = M.squareParsevalSum(3);

export const PRACTICE = {
  0: [
    { q: `In the square-wave Fourier series, the fundamental circle has radius <i>b</i>₁ = 4/π ≈ ${fmt(b1, 3)} and the third harmonic has radius <i>b</i>₃ = 4/(3π) ≈ ${fmt(b3, 3)}. At <i>t</i> = π/2 (where sin <i>t</i> = +1 and sin 3<i>t</i> = −1), what is their combined height?`,
      numeric: { answer: s2Peak, tol: 0.01, placeholder: '0.849' },
      choices: [fmt(b1, 3), fmt(s2Peak, 3), '1.000', fmt(b1 + b3, 3)], answer: 1,
      why: `<p>At <i>t</i> = π/2, sin(π/2) = +1 while sin(3π/2) = −1, so the second epicycle points straight down and carves a central dimple: 4/π − 4/(3π) = 8/(3π) ≈ <b>${fmt(s2Peak, 3)}</b>.</p>` },
    { q: `Why do all even sine terms sin(2<i>t</i>), sin(4<i>t</i>), … have coefficient zero in the symmetric square wave?`,
      choices: ['Because sin(2t) is not periodic', 'Because the square wave has half-wave symmetry f(t + π) = −f(t), whereas sin(2mt) repeats with period π', 'Because 4/(2π) is too large', 'Because even harmonics only appear in cosines'], answer: 1,
      why: `<p>Shifting by half a period sends the square wave to its negative, <i>f</i>(<i>t</i> + π) = −<i>f</i>(<i>t</i>), while sin(2<i>m</i>(<i>t</i> + π)) = +sin(2<i>mt</i>). So the second half of every cycle cancels the first half in ∫ <i>f</i>(<i>t</i>) sin(2<i>mt</i>) d<i>t</i> = 0.</p>` },
  ],
  1: [
    { q: `What is the amplitude <i>b</i>₅ = 4/(5π) of the fifth harmonic sin(5<i>t</i>) in the unit square wave?`,
      numeric: { answer: b5, tol: 0.01, placeholder: '0.255' },
      choices: ['0.159', fmt(b5, 3), fmt(b3, 3), '0.400'], answer: 1,
      why: `<div class="eq"><i>b</i>₅ = 4 / (5π) ≈ ${fmt(b5, 3)}</div><p>Odd harmonic amplitudes fall off inversely with frequency as 1/<i>n</i>.</p>` },
    { q: `How fast does the <i>n</i> = 5 epicycle spin compared with the fundamental <i>n</i> = 1 circle, and how large is its radius compared with <i>b</i>₁?`,
      choices: ['5× faster, 1/5 the radius', '5× slower, 5× the radius', '5× faster, 1/25 the radius', 'Same speed, 1/5 the radius'], answer: 0,
      why: `<p>The phase angle is 5<i>t</i> (so angular speed is <b>5× faster</b>) and its amplitude is <i>b</i>₅ = <i>b</i>₁ / 5 (<b>1/5 the radius</b>).</p>` },
  ],
  2: [
    { q: `Unlike the square wave, the sawtooth wave <i>f</i>(<i>t</i>) = <i>t</i>/π uses every integer harmonic <i>n</i> = 1, 2, 3, … with alternating signs. What are |<i>b</i>₁| and |<i>b</i>₂|?`,
      numeric: { answer: saw1, tol: 0.01, placeholder: '0.637' },
      choices: [`|b₁| = ${fmt(saw1, 3)}, |b₂| = ${fmt(saw2, 3)}`, '|b₁| = 1.273, |b₂| = 0.637', '|b₁| = 0.500, |b₂| = 0.250', '|b₁| = 0.637, |b₂| = 0.000'], answer: 0,
      why: `<p>Integrating (1/π) ∫<sub>−π</sub><sup>π</sup> (<i>t</i>/π) sin(<i>nt</i>) d<i>t</i> by parts gives <i>b<sub>n</sub></i> = (−1)<sup><i>n</i>+1</sup> 2/(<i>n</i>π), so |<i>b</i>₁| = 2/π ≈ <b>${fmt(saw1, 3)}</b> and |<i>b</i>₂| = 1/π ≈ <b>${fmt(saw2, 3)}</b>.</p>` },
    { q: `Because the sawtooth jumps from +1 to −1 at <i>t</i> = π, what value does its Fourier series converge to right at the jump <i>t</i> = π?`,
      numeric: { answer: 0, tol: 0.01, placeholder: '0.00' },
      choices: ['−1.00', '0.00 (the midpoint of the jump)', '+0.50', '+1.00'], answer: 1,
      why: `<p>By Dirichlet's theorem, at any jump discontinuity a Fourier series converges to the average of the left and right limits: ½((+1) + (−1)) = <b>0.00</b> (and indeed every term sin(<i>n</i>π) = 0).</p>` },
  ],
  3: [
    { q: `What are the values of the orthogonality integrals ∫<sub>−π</sub><sup>π</sup> sin(2<i>t</i>) sin(3<i>t</i>) d<i>t</i> and ∫<sub>−π</sub><sup>π</sup> sin²(2<i>t</i>) d<i>t</i>?`,
      choices: ['0 and π ≈ 3.142', 'π and π', '0 and 2π', '½ and 1'], answer: 0,
      why: `<p>By the product-to-sum identity, 2 sin(2<i>t</i>) sin(3<i>t</i>) = cos(<i>t</i>) − cos(5<i>t</i>), whose integral over a full period is <b>0</b>; whereas sin²(2<i>t</i>) = ½(1 − cos 4<i>t</i>) integrates to ½(2π) = <b>π</b>.</p>` },
    { q: `Why does dividing ∫<sub>−π</sub><sup>π</sup> <i>f</i>(<i>t</i>) sin(<i>nt</i>) d<i>t</i> by π isolate the single coefficient <i>b<sub>n</sub></i>?`,
      choices: ['Because sin(nt) is zero everywhere else', 'Because every other term b_m sin(mt) integrates to 0 against sin(nt), leaving only b_n · π / π = b_n', 'Because derivatives cancel the higher terms', 'Because π is the period'], answer: 1,
      why: `<p>Orthogonality makes the sines act like perpendicular basis vectors: taking the inner product with sin(<i>nt</i>) projects <i>f</i>(<i>t</i>) onto the <i>n</i>-th harmonic axis.</p>` },
  ],
  4: [
    { q: `By Parseval's theorem, the square wave has average power 1, and each harmonic contributes ½<i>b<sub>n</sub></i>². What fraction of the total power is already carried by the single fundamental sine wave <i>n</i> = 1 (½<i>b</i>₁² = 8/π²)?`,
      numeric: { answer: e1, tol: 0.01, placeholder: '0.811' },
      choices: ['0.500 (50.0 %)', fmt(e1, 3) + ' (81.1 %)', fmt(e3, 3) + ' (93.3 %)', '1.000 (100 %)'], answer: 1,
      why: `<div class="eq">½ <i>b</i>₁² = ½ (4/π)² = 8 / π² ≈ ${fmt(e1, 3)} (81.1 %)</div><p>Adding the 3rd and 5th harmonics brings the captured energy to ${fmt(e3, 3)} (93.3 %).</p>` },
    { q: `Since ½ Σ<sub>odd n</sub> (4/<i>n</i>π)² = 1 for the unit square wave, what exact sum does Parseval's identity give for 1 + 1/3² + 1/5² + 1/7² + …?`,
      choices: ['π / 4', 'π² / 8 ≈ 1.2337', 'π² / 6 ≈ 1.6449', '2'], answer: 1,
      why: `<p>Factoring (8/π²) out of ½ Σ (16 / <i>n</i>²π²) = 1 yields Σ<sub>m=1</sub><sup>∞</sup> 1/(2<i>m</i> − 1)² = <b>π² / 8 ≈ 1.2337</b>.</p>` },
  ],
  5: [
    { q: `Near the jump from −1 to +1 at <i>t</i> = 0, what height does the first peak of the partial sum <i>S<sub>N</sub></i>(<i>t</i>) approach as <i>N</i> → ∞ (the Gibbs phenomenon)?`,
      numeric: { answer: M.GIBBS_PEAK, tol: 0.01, placeholder: '1.179' },
      choices: ['1.000 (the overshoot disappears)', '1.090', fmt(M.GIBBS_PEAK, 3) + ' (≈ 8.95 % of the jump of 2)', '1.273 (4/π)'], answer: 2,
      why: `<p>As <i>N</i> → ∞, the first peak at <i>t</i> = π/(2<i>N</i>) converges to (2/π) ∫₀<sup>π</sup> (sin <i>u</i> / <i>u</i>) d<i>u</i> ≈ <b>${fmt(M.GIBBS_PEAK, 3)}</b>. Adding more harmonics squeezes the spike narrower against the jump, but never lowers its height.</p>` },
    { q: `Why do Fourier coefficients decay as 1/<i>n</i> for a wave with jumps (square/sawtooth), but as 1/<i>n</i>² for a continuous triangle wave?`,
      choices: ['Every continuous derivative adds another factor of 1/n upon integration by parts', 'Triangle waves have higher frequency', 'Cosines decay faster than sines', 'Jumps have zero energy'], answer: 0,
      why: `<p>Integrating ∫ <i>f</i>(<i>t</i>) sin(<i>nt</i>) d<i>t</i> by parts brings out a 1/<i>n</i> each time <i>f</i> can be differentiated without hitting a jump discontinuity.</p>` },
  ],
};
