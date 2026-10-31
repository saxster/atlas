// Prose, breakdowns, and SVG charts for Chapter 5: Fourier Series & Epicycles (6 pages).
import * as M from './model.js';
import { at } from './world.js';

const chartSpectrum = () => {
  const bars = [1, 3, 5, 7, 9].map((n, i) => {
    const b = M.squareCoeff(n), h = b * 68, x = 55 + i * 62;
    return `<rect class="bar" x="${x}" y="${(108 - h).toFixed(1)}" width="32" height="${h.toFixed(1)}"/>
      <text x="${x + 6}" y="122">n=${n}</text>
      <text x="${x + 2}" y="${(103 - h).toFixed(1)}" class="lab">${b.toFixed(2)}</text>`;
  }).join('');
  return `<div class="charts"><svg class="chart" viewBox="0 0 400 132" aria-label="Harmonic amplitudes b_n = 4/(n pi)">
    <rect class="frame" x="36" y="12" width="336" height="96"/>
    ${bars}
  </svg></div>`;
};

export const PAGES = [
  {
    kicker: 'Chapter 5 · Fourier series',
    title: 'Adding spinning circles to draw a corner',
    sub: 'A single circle draws a smooth sine wave; mount a smaller, faster circle on its tip and flat tops appear',
    fig: 'Two tip-to-tail epicycles (n = 1 and n = 3) tracing S₂(t)',
    alt: 'A large blue circle of radius 4/π and a smaller amber circle of radius 4/(3π) spinning at 3× speed on its tip, tracing a flattened wave.',
    cam: { target: at(0, -0.1, 2.0, 0), az: 0, el: 5, dist: 16.8 },
    lit: 'twoEpicycles',
    parts: ['twoEpicycles'],
    look: {},
    body: `
      <p class="lede">In 1807 Joseph Fourier made a startling claim: <i>any</i> periodic signal — even one with flat plateaus and vertical cliffs — is a sum of simple sines and cosines at integer multiples of the fundamental frequency.</p>
      <div class="eq"><i>S</i>₂(<i>t</i>) = (4 / π) sin <i>t</i> + (4 / 3π) sin 3<i>t</i></div>
      <p>Watch the two circles on the left. The blue arm has radius <i>b</i>₁ = 4/π ≈ 1.273 and turns once per period. Riding on its tip, the amber arm has one-third the radius (<i>b</i>₃ = 4/3π ≈ 0.424) and spins three times as fast.</p>
      <p>Near <i>t</i> = 0 and <i>t</i> = π both arms point the same way, steepening the cliff; at the crest <i>t</i> = π/2, sin 3<i>t</i> = −1 points downward and presses the round peak flat.</p>
      <p class="live" data-live="two"></p>`,
  },
  {
    kicker: '5.1 · The square wave',
    title: 'Odd harmonics sharpen the cliff',
    sub: 'With n = 1, 3, 5, 7, 9 spinning tip-to-tail, the trace locks onto the ±1 square wave',
    fig: 'Five odd-harmonic epicycles (n = 1, 3, 5, 7, 9) tracing S₅(t)',
    alt: 'Five chained epicycles spinning at 1×, 3×, 5×, 7×, and 9× speed drawing a 5-term square wave over the exact step target.',
    cam: { target: at(1, -0.1, 2.0, 0), az: 0, el: 5, dist: 16.8 },
    lit: 'squareChain',
    parts: ['squareChain'],
    look: {},
    body: `
      <p class="lede">Because a symmetric square wave flips sign when shifted by half a period, <i>f</i>(<i>t</i> + π) = −<i>f</i>(<i>t</i>), every even harmonic sin(2<i>mt</i>) cancels out. Only the odd harmonics <i>n</i> = 1, 3, 5, 7, … survive:</p>
      <div class="eq"><i>f</i>(<i>t</i>) = (4 / π) (sin <i>t</i> + ⅓ sin 3<i>t</i> + ⅕ sin 5<i>t</i> + ⅐ sin 7<i>t</i> + …)</div>
      <p>Each new circle has radius <i>b<sub>n</sub></i> = 4/(<i>n</i>π) and angular speed <i>n</i>. High-frequency circles are tiny, so they barely change the broad plateau, but right at the jump <i>t</i> = 0 all their velocities <i>n b<sub>n</sub></i> = 4/π add in phase to make the slope steeper and steeper.</p>
      <p class="live" data-live="sq"></p>`,
  },
  {
    kicker: '5.2 · Symmetry and the sawtooth',
    title: 'When every harmonic joins in: the ramp',
    sub: 'Alternating even and odd harmonics b_n = (−1)^(n+1) 2/(nπ) climb steadily and snap back at π',
    fig: 'Six harmonics (n = 1…6) drawing the sawtooth wave t / π',
    alt: 'Six epicycles including both odd and even harmonics drawing a rising linear ramp that drops vertically at t = π.',
    cam: { target: at(2, -0.1, 2.0, 0), az: 0, el: 5, dist: 16.8 },
    lit: 'sawtooth',
    parts: ['sawtooth'],
    look: {},
    body: `
      <p class="lede">A <b>sawtooth wave</b> <i>f</i>(<i>t</i>) = <i>t</i>/π climbs at a steady slope from −1 to +1 and drops straight back at <i>t</i> = π. Because it lacks half-wave symmetry, both odd and even harmonics appear with alternating signs:</p>
      <div class="eq"><i>t</i> / π = (2 / π) (sin <i>t</i> − ½ sin 2<i>t</i> + ⅓ sin 3<i>t</i> − ¼ sin 4<i>t</i> + …)</div>
      <p>At the jump <i>t</i> = π, every term sin(<i>n</i>π) is zero, so the series passes dead through 0 — the exact midpoint ½((+1) + (−1)) between the top and bottom of the cliff.</p>
      <p class="live" data-live="saw"></p>`,
  },
  {
    kicker: '5.3 · Orthogonality',
    title: 'How the integral sifts out one frequency at a time',
    sub: 'Multiplying two different harmonics gives equal positive and negative lobes that integrate to zero',
    fig: 'sin²(2t) (positive, mean ½) above sin(2t)sin(3t) (cancelling lobes, mean 0)',
    alt: 'Upper green curve of sin²(2t) staying non-negative around its mean ½, and lower blue curve of sin(2t)sin(3t) oscillating equally above and below zero.',
    cam: { target: at(3, 0, 2.0, 0), az: 0, el: 5, dist: 16.5 },
    lit: 'orthoMatch',
    parts: ['orthoMatch', 'orthoCancel'],
    look: {},
    body: `
      <p class="lede">How do we find the unknown radius <i>b<sub>n</sub></i> hidden inside a complicated wave <i>f</i>(<i>t</i>)? Multiply <i>f</i>(<i>t</i>) by sin(<i>nt</i>) and integrate over a full period:</p>
      <div class="eq">(1 / π) ∫<sub>−π</sub><sup>π</sup> sin(<i>mt</i>) sin(<i>nt</i>) d<i>t</i> = δ<sub><i>mn</i></sub> &nbsp;(1 if <i>m</i> = <i>n</i>, 0 if <i>m</i> ≠ <i>n</i>)</div>
      <p>On the lower board, sin(2<i>t</i>) sin(3<i>t</i>) spends just as much area below the axis as above it, so its integral is strictly <b>0</b>. On the upper board, when the frequencies match, sin²(2<i>t</i>) = ½(1 − cos 4<i>t</i>) is never negative and averages to <b>½</b> (integral π).</p>
      <p>So integrating (1/π) ∫ <i>f</i>(<i>t</i>) sin(<i>nt</i>) d<i>t</i> wipes out every harmonic except the <i>n</i>-th, returning <i>b<sub>n</sub></i> cleanly.</p>`,
  },
  {
    kicker: '5.4 · Spectrum and Parseval’s theorem',
    title: 'Where the wave’s energy lives',
    sub: 'Squaring the amplitudes sums to the signal’s total power: ½ Σ b_n² = 1',
    fig: '3D frequency spectrum bars b_n = 4/(nπ) for n = 1, 3, 5, 7, 9',
    alt: 'Five 3D spectrum bars falling under the amber 4/(nπ) curve, with the first bar n = 1 carrying 81.1 % of total wave energy.',
    cam: { target: at(4, 0, 2.0, 0), az: -6, el: 7, dist: 16.5 },
    lit: 'spectrum',
    parts: ['spectrum'],
    look: {},
    body: `
      <p class="lede">Plotting amplitude <i>b<sub>n</sub></i> against harmonic number <i>n</i> turns a wave in time into a bar chart in <b>frequency</b>. By <b>Parseval's theorem</b>, the average power of the wave in time equals the sum of powers of its individual harmonics:</p>
      <div class="eq">(1 / 2π) ∫<sub>−π</sub><sup>π</sup> |<i>f</i>(<i>t</i>)|² d<i>t</i> = ½ Σ<sub><i>n</i>=1</sub><sup>∞</sup> <i>b<sub>n</sub></i>² = 1</div>
      <p>Because ½<i>b<sub>n</sub></i>² = 8/(<i>n</i>²π²) falls off as 1/<i>n</i>², the fundamental sine wave <i>n</i> = 1 alone already captures 8/π² ≈ <b>81.1 %</b> of the square wave's energy, and the first five odd harmonics capture <b>96.6 %</b>.</p>
      ${chartSpectrum()}`,
  },
  {
    kicker: '5.5 · The Gibbs phenomenon',
    title: 'The 9 % ears that never go away',
    sub: 'Adding harmonics squeezes the overshoot narrower against the cliff, but its height locks at 1.179',
    fig: 'Close-up of the jump at t = 0 comparing S₅(t) and S₁₅(t) against the Gibbs ceiling 1.179',
    alt: 'Zoomed view of the step jump at t = 0 showing blue 5-term and red 15-term Fourier sums both peaking at the amber line y = 1.179.',
    cam: { target: at(5, 0, 2.0, 0), az: 0, el: 5, dist: 16.5 },
    lit: 'gibbs',
    parts: ['gibbs'],
    look: {},
    body: `
      <p class="lede">Look closely at the top corner of the cliff at <i>t</i> = 0. As we increase the number of odd harmonics from 5 (blue) to 15 (red), the ripples across the flat plateau die down — except for the very first horn next to the jump!</p>
      <div class="eq">lim<sub><i>N</i>→∞</sub> <i>S<sub>N</sub></i>(π / 2<i>N</i>) = (2 / π) ∫₀<sup>π</sup> (sin <i>u</i> / <i>u</i>) d<i>u</i> ≈ 1.17898</div>
      <p>That peak rises 0.179 above +1 — about <b>8.95 % of the total jump height of 2</b>. Smooth functions converge uniformly, but at a jump discontinuity the partial sums converge only pointwise, leaving the signature <b>Gibbs ears</b>.</p>`,
  },
];

export const PLATES = {
  twoEpicycles: {
    text: 'Each rotating vector r_n(t) = (b_n cos nt, b_n sin nt) is a phasor. Its vertical shadow is b_n sin(nt). Chaining phasors tip-to-tail adds their vertical shadows directly.',
    facts: s => [
      ['angle t', `${s.tMod.toFixed(2)} rad`],
      ['fundamental b₁ sin t', (M.squareCoeff(1) * Math.sin(s.t)).toFixed(3)],
      ['3rd harmonic b₃ sin 3t', (M.squareCoeff(3) * Math.sin(3 * s.t)).toFixed(3)],
      ['sum S₂(t)', M.squarePartial(s.t, 2).toFixed(3)],
    ],
  },
  squareChain: {
    text: 'At t = π/4, all five odd harmonics combine to give S₅(π/4) = 0.971; at t = π/2, alternating signs give Gregory–Leibniz’s series 1 − 1/3 + 1/5 − 1/7 + 1/9 → π/4.',
    facts: s => [
      ['angle t', `${s.tMod.toFixed(2)} rad`],
      ['5-term sum S₅(t)', M.squarePartial(s.t, 5).toFixed(3)],
      ['captured power ½ Σ b_n²', `${(M.squareParsevalSum(5) * 100).toFixed(1)} %`],
    ],
  },
  sawtooth: {
    text: 'Integrating t/π against sin(nt) by parts produces b_n = (−1)^(n+1) 2/(nπ). Evaluating at t = π/2 recovers the alternating odd reciprocals.',
    facts: s => [
      ['angle t', `${s.tMod.toFixed(2)} rad`],
      ['6-term sawtooth W₆(t)', M.sawtoothPartial(s.t, 6).toFixed(3)],
      ['b₁, b₂, b₃', `${M.sawtoothCoeff(1).toFixed(3)}, ${M.sawtoothCoeff(2).toFixed(3)}, ${M.sawtoothCoeff(3).toFixed(3)}`],
    ],
  },
  orthoMatch: {
    text: 'Because sin²(nt) = ½(1 − cos 2nt), its oscillating part cos(2nt) averages to zero over a period, leaving an exact average value of ½ and integral π on [−π, π].',
    facts: () => [
      ['integral ∫ sin²(2t) dt', 'π ≈ 3.1416'],
      ['normalized inner product', '1.000'],
    ],
  },
  orthoCancel: {
    text: 'For m ≠ n, sin(mt)sin(nt) = ½[cos((m−n)t) − cos((m+n)t)]. Both cosines complete a whole number of cycles on [−π, π], so their net signed area is zero.',
    facts: () => [
      ['integral ∫ sin(2t)sin(3t) dt', '0.000'],
      ['frequencies m, n', '2 and 3 (orthogonal)'],
    ],
  },
  spectrum: {
    text: 'The rate at which Fourier coefficients decay measures smoothness: a jump discontinuity decays as 1/n, a sharp corner (triangle wave) as 1/n², and an infinitely smooth wave faster than any power of 1/n.',
    facts: () => [
      ['n = 1 power share', `${(M.squareParsevalSum(1) * 100).toFixed(1)} %`],
      ['n = 1, 3, 5 power share', `${(M.squareParsevalSum(3) * 100).toFixed(1)} %`],
      ['n = 1..9 power share', `${(M.squareParsevalSum(5) * 100).toFixed(1)} %`],
    ],
  },
  gibbs: {
    text: 'Differentiating S_N(t) gives (4/π) Σ cos((2m−1)t) = (2/π) sin(2Nt) / sin(t), which first vanishes at t_N = π/(2N). Rescaling u = 2Nt turns the sum into a Riemann sum for (2/π) ∫_0^π (sin u / u) du ≈ 1.17898.',
    facts: () => [
      ['asymptotic peak height', M.GIBBS_PEAK.toFixed(5)],
      ['overshoot above +1', `+${(M.GIBBS_PEAK - 1).toFixed(4)} (${M.GIBBS_JUMP_PCT.toFixed(2)} % of jump)`],
      ['S₁₅ peak at π/30', M.squarePartial(M.gibbsPeakAngle(15), 15).toFixed(4)],
    ],
  },
};
