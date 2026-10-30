// unit-circle/practice.js — exam-style practice (A-level, IB, AP Precalculus), one or two questions per page (keys are
// page indices, as in PAGES). Every number is computed here from the model; checks.mjs recomputes each answer another way.
import * as M from './model.js';

const f = (x, n = 3) => (x < -1e-12 ? '−' : '') + Math.abs(x).toFixed(n);
const d = deg => deg * M.DEG;

// 0 · the point at 210°; a point on the circle with y = 0.6 in the second quadrant
const th0 = 210, x0 = M.P(d(th0)).x;
const y0b = 0.6, x0b = -Math.sqrt(1 - y0b ** 2);
// 1 · a Ferris wheel: radius 20 m, centre 22 m up, a rider 30° above the level of the centre
const FW = { r: 20, h: 22, deg: 30 }, h1 = FW.h + FW.r * M.sin(d(FW.deg));
// 2 · the sideways shadow at 250°
const th2 = 250, x2 = M.cos(d(th2));
// 3 · sin θ = 0.28 with θ acute
const s3 = 0.28, c3 = Math.sqrt(1 - s3 ** 2);
// 4 · a wheel of radius 0.35 m turned through 2.4 rad; 150° in radians
const r4 = 0.35, a4 = 2.4, s4 = r4 * a4, deg4 = 150, rad4 = deg4 * M.DEG;
// 5 · the first top of y = sin t; the period of y = sin 3t
const top5 = Math.PI / 2, k5 = 3, T5 = M.TAU / k5;
// 6 · where the ray at 60° meets the tangent line
const th6 = 60, y6 = M.tangentPoint(d(th6)).y;
// 7 · signs at 200°; sin 150°
const th7 = 200, sg7 = M.signs(d(th7)), word = s => (s > 0 ? '+' : '−');

export const PRACTICE = {
  0: [
    { q: `P is on the unit circle at θ = ${th0}°. What is its <i>x</i>-coordinate?`,
      choices: [f(-0.5), f(x0), f(0.5), f(-x0)], answer: 1,
      why: `<p><i>x</i> = cos ${th0}°. P is ${th0 - 180}° past the −<i>x</i> axis, below it and to the left, so <i>x</i> = −cos ${th0 - 180}° = −√3/2 = ${f(x0)}. The <i>y</i>-coordinate is sin ${th0}° = −½.</p>` },
    { q: `A point on the unit circle has <i>y</i> = ${y0b} and lies in the second quadrant. What is its <i>x</i>-coordinate?`,
      choices: [f(-0.4, 1), f(x0b, 1), f(0.8, 1), f(-0.6, 1)], answer: 1,
      why: `<p>Every point on the unit circle is 1 from O, so <i>x</i>² + <i>y</i>² = 1: <i>x</i>² = 1 − ${y0b}² = ${f(1 - y0b ** 2, 2)}, <i>x</i> = ±${f(-x0b, 1)}. The second quadrant is left of the <i>y</i> axis, so <i>x</i> = ${f(x0b, 1)}.</p>` },
  ],
  1: [
    { q: 'What is sin 30° exactly?',
      choices: ['½', '√3/2', '√2/2', '⅓'], answer: 0,
      why: `<p>Halve an equilateral triangle of side 1. The half has angles 30°, 60°, 90°, hypotenuse 1 and the side opposite 30° is half the base: ½. So sin 30° = ½ exactly, not a rounded decimal.</p>` },
    { q: `A Ferris wheel has radius ${FW.r} m and its centre is ${FW.h} m above the ground. A rider is ${FW.deg}° above the level of the centre. How high is the rider above the ground?`,
      choices: [`${f(FW.h + FW.r * Math.cos(d(FW.deg)), 1)} m`, `${f(h1, 1)} m`, `${f(FW.r * M.sin(d(FW.deg)), 1)} m`, `${f(FW.h + FW.deg / 90 * FW.r, 1)} m`], answer: 1,
      why: `<p>The rider is the point P on a circle of radius ${FW.r} m: their height above the centre is the sine shadow, scaled up, ${FW.r} sin ${FW.deg}° = ${f(FW.r * M.sin(d(FW.deg)), 1)} m.</p><div class="eq"><i>h</i> = ${FW.h} + ${FW.r} sin ${FW.deg}° = ${f(h1, 1)} m</div>` },
  ],
  2: [
    { q: 'What is cos 60° exactly?',
      choices: ['√3/2', '½', '√2/2', '0'], answer: 1,
      why: `<p>In the same half equilateral triangle, the side next to 60° is the half base, ½. Cos 60° = sin 30°: the cosine of an angle is the sine of what it lacks of 90°.</p>` },
    { q: `P is at θ = ${th2}°. What is the length and sign of its shadow on the <i>x</i> axis, cos ${th2}°?`,
      choices: [f(M.sin(d(th2))), f(x2), f(-x2), f(-M.sin(d(th2)))], answer: 1,
      why: `<p>${th2}° is ${th2 - 180}° past the −<i>x</i> axis, in the third quadrant, so the shadow falls left of O: cos ${th2}° = −cos ${th2 - 180}° = ${f(x2)}. (${f(M.sin(d(th2)))} is the sine, the shadow on the <i>y</i> axis.)</p>` },
  ],
  3: [
    { q: `θ is acute and sin θ = ${s3}. What is cos θ?`,
      choices: [f(1 - s3, 2), f(1 - s3 ** 2, 2), f(c3, 2), f(1 + s3, 2)], answer: 2,
      why: `<div class="eq">cos²θ = 1 − sin²θ = 1 − ${f(s3 ** 2, 4)} = ${f(1 - s3 ** 2, 4)}</div><p>so cos θ = √${f(1 - s3 ** 2, 4)} = ${f(c3, 2)}, positive because θ is acute. Taking 1 − ${s3} forgets that the identity is about <i>squares</i>.</p>` },
    { q: 'Simplify (1 − cos²θ) / sin θ, for sin θ ≠ 0.',
      solution: '<p>By the identity, 1 − cos²θ = sin²θ, so the fraction is sin²θ / sin θ = <b>sin θ</b>.</p>' },
  ],
  4: [
    { q: 'How many degrees is 1 radian?',
      choices: [`${f(M.RAD_DEG / 2, 2)}°`, `${f(M.RAD_DEG, 2)}°`, '60.00°', `${f(Math.PI, 2)}°`], answer: 1,
      why: `<p>A full turn is 360° and also 2π radians (the whole circumference, 2π radii). So 1 rad = 360°/2π = ${f(M.RAD_DEG, 2)}°: a little less than 60°, because six radii laid round the circle fall short of a full turn by ${f(M.TAU - 6)} of a radius.</p>` },
    { q: `A wheel of radius ${r4} m turns through ${a4} rad. How far does a point on its rim travel?`,
      choices: [`${f(r4 / a4, 2)} m`, `${f(r4 * a4 / 2, 2)} m`, `${f(s4, 2)} m`, `${f(a4 / r4, 2)} m`], answer: 2,
      why: `<div class="eq"><i>s</i> = <i>r</i>θ = ${r4} × ${a4} = ${f(s4, 2)} m</div><p>This only works with θ in radians: a radian is defined so that the arc is θ radii long.</p>` },
  ],
  5: [
    { q: 'For <i>y</i> = sin <i>t</i>, what is the first positive <i>t</i> at which <i>y</i> = 1?',
      choices: [f(1, 3), f(top5, 3), f(Math.PI, 3), f(M.TAU, 3)], answer: 1,
      why: `<p>P is highest a quarter of a turn round: <i>t</i> = π/2 = ${f(top5, 3)}. At π it is back on the axis (<i>y</i> = 0), and 2π is one whole wavelength.</p>` },
    { q: `What is the period of <i>y</i> = sin ${k5}<i>t</i>?`,
      choices: [f(M.TAU * k5, 3), f(Math.PI / k5, 3), f(T5, 3), f(M.TAU, 3)], answer: 2,
      why: `<p>sin ${k5}<i>t</i> goes through one turn when ${k5}<i>t</i> grows by 2π, so <i>t</i> grows by 2π/${k5} = ${f(T5, 3)}. Speeding P up ${k5} times squeezes the wave ${k5} times.</p>` },
  ],
  6: [
    { q: 'What is tan 45°?',
      choices: ['0', '√2/2', '1', 'undefined'], answer: 2,
      why: `<p>At 45°, sin and cos are both √2/2, so tan 45° = sin/cos = 1. The ray at 45° rises one for every one across: it meets the line <i>x</i> = 1 at height 1.</p>` },
    { q: `The ray from O at θ = ${th6}° meets the tangent line <i>x</i> = 1. How high is that point?`,
      choices: [f(M.sin(d(th6))), f(1 / y6), f(y6), f(2, 3)], answer: 2,
      why: `<p>Along the ray, height ÷ across = sin ${th6}° / cos ${th6}° = (√3/2)/(½) = √3 for every point, so where across = 1 the height is tan ${th6}° = √3 = ${f(y6)}.</p>` },
  ],
  7: [
    { q: `P is at θ = ${th7}°. Which signs do sin θ and cos θ have?`,
      choices: ['sin +, cos +', 'sin +, cos −', `sin ${word(sg7.sin)}, cos ${word(sg7.cos)}`, 'sin −, cos +'], answer: 2,
      why: `<p>${th7}° is past 180° and short of 270°: the third quadrant, below and left of O. Both shadows fall on the negative sides, so both are negative, and tan = sin/cos is positive.</p>` },
    { q: 'What is sin 150° exactly?',
      choices: ['−½', '½', '√3/2', '−√3/2'], answer: 1,
      why: `<p>150° is 30° short of 180°. Reflect P in the <i>y</i> axis and it lands at 30°, at the same height: sin 150° = sin 30° = ½, positive because P is above the <i>x</i> axis. (cos 150° = −√3/2.)</p>` },
  ],
};
