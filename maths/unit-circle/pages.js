// Chapter 1 of the Atlas of Mathematics, page by page (A-level, IB and AP Precalculus). Text and charts on the left
// page; on the right, the camera, the lit board and what is shown. Every number is read from model.js.
import * as M from './model.js';
import { STATIONS, CY } from './world.js';
import { chart, samples } from '../../engine/chart.js';

const f = (x, n = 3) => (x < -5 * 10 ** -(n + 1) ? '−' : '') + Math.abs(x).toFixed(n);
const deg = th => ((th / M.DEG) % 360 + 360) % 360;
const S = M.special;

// ---------- charts, and the ranges their live cursors are placed in (chapter.js onFrame) ----------
export const RANGES = {
  sin: { x0: 0, x1: 360, y0: -1, y1: 1, h: 130 },
  cos: { x0: 0, x1: 360, y0: -1, y1: 1, h: 130 },
  sq: { x0: 0, x1: 360, y0: 0, y1: 1, h: 120 },
  arc: { x0: 0, x1: 360, y0: 0, y1: +M.FULL.toFixed(2), h: 120 },
  wave: { x0: 0, x1: +(4 * Math.PI).toFixed(2), y0: -1, y1: 1, h: 120 },
  tan: { x0: -90, x1: 90, y0: -4, y1: 4, h: 140 },
  signs: { x0: 0, x1: 360, y0: -1, y1: 1, h: 130 },
};
const quarterLines = [90, 180, 270].map(x => ({ cls: 'grid', pts: [[x, -1], [x, 1]] }));

const at = (k, dx = 0, dy = 0) => [STATIONS[k] + dx, CY + dy, 0];

export const PAGES = [
  {
    kicker: 'Chapter 1', title: 'The unit circle', sub: 'one circle, every angle',
    body: `
      <p class="lede">Draw a circle of radius 1 about the origin <i>O</i>. Turn a radius <b>anticlockwise</b> from the positive <i>x</i> axis through an angle θ. Its end is the point <i>P</i>, and its coordinates define the two functions of this chapter:</p>
      <div class="eq"><i>P</i> = (cos θ, sin θ)</div>
      <p>No triangle is needed, so the definition works for every angle: obtuse, negative (turned clockwise), or more than a whole turn. Turning a whole turn brings <i>P</i> back where it was, so cos and sin repeat every 360°.</p>
      <table class="data">
        <tr><th>θ</th><th><i>P</i> = (cos θ, sin θ)</th></tr>
        ${[0, 90, 180, 270].map(d => `<tr><td>${d}°</td><td>(${f(M.P(d * M.DEG).x, 0)}, ${f(M.P(d * M.DEG).y, 0)})</td></tr>`).join('')}
      </table>
      <p>Every point of the circle is 1 from <i>O</i>, so its coordinates obey <i>x</i>² + <i>y</i>² = 1: the equation of the unit circle.</p>
      <p class="hintline">Click the circle for P’s two coordinates drawn as lengths.</p>`,
    cam: { target: at('circle', 0, 0.1), az: -8, el: 6, dist: 16 }, lit: 'circle', scene: 'circle', look: {},
    fig: 'The unit circle: P at angle θ',
    alt: 'A circle of radius 1 on a drawing board, with a red point P going round it anticlockwise and the radius OP turning with it.',
  },
  {
    kicker: '1.1', title: 'Sine is the height', sub: 'a shadow cast by level light',
    body: `
      <p class="lede">Light comes in level from the right. <i>P</i> blocks it, so <i>P</i>’s shadow lands on the screen at exactly <i>P</i>’s height above the <i>x</i> axis. That height is the sine:</p>
      <div class="eq">sin θ = the <i>y</i>-coordinate of <i>P</i></div>
      <p>The level ray crosses the <i>y</i> axis at the same height, so sin θ is <i>P</i>’s projection onto the <i>y</i> axis. Above the axis it is positive, below it negative, and it never leaves −1 ≤ sin θ ≤ 1.</p>
      <table class="data">
        <tr><th>θ</th><th>sin θ, exactly</th><th>decimal</th></tr>
        ${[30, 45, 60, 90].map(d => `<tr><td>${d}° = ${S(d).radText}</td><td>${S(d).sinText}</td><td>${f(S(d).sin)}</td></tr>`).join('')}
      </table>
      <p><b>Why ½ exactly?</b> Halve an equilateral triangle of side 1: the piece is a 30°-60°-90° triangle with hypotenuse 1, and the side facing 30° is half the base, ½. The 45° triangle is half a square: legs equal, so 2<i>y</i>² = 1 and <i>y</i> = √2/2.</p>
      <div class="charts">${chart({ ...RANGES.sin, xlabel: 'θ (°)', ylabel: 'sin θ', cursors: ['sin'], label: 'sin theta against theta, 0 to 360 degrees',
        series: [...quarterLines, { pts: samples(0, 360, 180, d => Math.sin(d * M.DEG)) }], marks: [[30, S(30).sin, '½ at 30°'], [90, 1, '1 at 90°']] })}</div>
      <p class="hintline">Click the lamp or the shadow to follow one ray.</p>`,
    cam: { target: at('sine', -0.05, 0.05), az: -6, el: 6, dist: 16.5 }, lit: 'sine', scene: 'sine', look: {},
    fig: 'Level light: P’s shadow is sin θ high',
    alt: 'A lamp on the right of the board sends level light across the circle; P’s shadow falls on a screen on the left, and a red bar on the screen measures its height.',
  },
  {
    kicker: '1.2', title: 'Cosine is the sideways shadow', sub: 'the same point, lit from above',
    body: `
      <p class="lede">Now light the circle from above. <i>P</i>’s shadow falls on the screen below, as far right or left of <i>O</i> as <i>P</i> is. That is the cosine:</p>
      <div class="eq">cos θ = the <i>x</i>-coordinate of <i>P</i></div>
      <p>Positive to the right of the <i>y</i> axis, negative to the left. At 0° the shadow is the whole radius, 1; at 90° it shrinks to nothing.</p>
      <table class="data">
        <tr><th>θ</th><th>cos θ, exactly</th><th>decimal</th></tr>
        ${[0, 30, 45, 60, 90].map(d => `<tr><td>${d}°</td><td>${S(d).cosText}</td><td>${f(S(d).cos)}</td></tr>`).join('')}
      </table>
      <p>The cosines are the sines read backwards. In the triangle under <i>P</i> the angle at the top is 90° − θ, and the side across from it is the cosine side, so</p>
      <div class="eq">cos θ = sin(90° − θ)</div>
      <p>which is the name: the <b>co</b>-sine is the sine of the <b>co</b>mplement.</p>
      <div class="charts">${chart({ ...RANGES.cos, xlabel: 'θ (°)', ylabel: 'cos θ', cursors: ['cos'], label: 'cos theta against theta, 0 to 360 degrees',
        series: [...quarterLines, { cls: 'curve total', pts: samples(0, 360, 180, d => Math.cos(d * M.DEG)) }], marks: [[60, S(60).cos, '½ at 60°']] })}</div>
      <p class="hintline">Click the lamp or the shadow to follow one ray.</p>`,
    cam: { target: at('cosine', 0, -0.25), az: 6, el: 6, dist: 17.5 }, lit: 'cosine', scene: 'cosine', look: {},
    fig: 'Light from above: P’s shadow is cos θ across',
    alt: 'A lamp along the top of the board shines down; P’s shadow falls on a screen along the bottom, and a blue bar measures how far it is from the middle.',
  },
  {
    kicker: '1.3', title: 'sin²θ + cos²θ = 1', sub: 'Pythagoras, once and for all',
    body: `
      <p class="lede">Drop a line from <i>P</i> straight down to the <i>x</i> axis. The right triangle it makes has hypotenuse <i>OP</i> = 1, a side across of cos θ (blue) and a side up of sin θ (red). Pythagoras:</p>
      <div class="eq">sin²θ + cos²θ = 1</div>
      <p>The red square and the blue square together cover the same area as the square on the radius. (sin²θ means (sin θ)².) In the other quadrants the sides only change sign, and squaring removes signs, so the identity holds for every θ.</p>
      <p><b>Check at 30°.</b> (½)² + (√3/2)² = ¼ + ¾ = 1.</p>
      <p><b>Use it.</b> If sin θ = 0.6, then cos²θ = 1 − 0.36 = 0.64 and cos θ = ±0.8. The identity gives the size; the quadrant gives the sign.</p>
      <div class="charts">${chart({ ...RANGES.sq, xlabel: 'θ (°)', ylabel: '', cursors: ['s2', 'c2'], label: 'sin squared and cos squared against theta: they always add to 1',
        series: [{ pts: samples(0, 360, 180, d => Math.sin(d * M.DEG) ** 2), tag: [62, 0.8, 'sin²θ'] }, { cls: 'curve total', pts: samples(0, 360, 180, d => Math.cos(d * M.DEG) ** 2), tag: [208, 0.8, 'cos²θ'] }] })}</div>
      <p class="hintline">Click the triangle: the squares fold part way up off the board.</p>`,
    cam: { target: at('pythag', 0.25, 0.25), az: -12, el: 8, dist: 17.5 }, lit: 'pythag', scene: 'pythag', look: { unfold: 1 },
    fig: 'A square on each side of the triangle under P',
    alt: 'The right triangle under P with a red square on its vertical side, a blue square on its horizontal side and a grey square on the radius.',
  },
  {
    kicker: '1.4', title: 'Radians', sub: 'measuring an angle by its arc',
    body: `
      <p class="lede">Measure an angle by the arc it cuts off, counted in radii. That is the <b>radian</b>. On the unit circle the arc length <i>is</i> the angle:</p>
      <div class="eq">θ = <i>s</i> / <i>r</i>, so <i>s</i> = <i>r</i>θ</div>
      <p>A whole turn is the whole circumference, 2π radii, so 360° = 2π rad. One radian is the angle whose arc equals the radius: 180°/π = ${f(M.RAD_DEG, 2)}°. Six radii laid round the circle fall short of a full turn by ${f(M.TAU - 6)} of a radius.</p>
      <table class="data">
        <tr><th>degrees</th><th>radians</th><th>arc on the unit circle</th></tr>
        ${[[30, 'π/6'], [45, 'π/4'], [90, 'π/2'], [180, 'π'], [360, '2π']].map(([d, r]) => `<tr><td>${d}°</td><td>${r}</td><td>${f(M.arc(d * M.DEG))}</td></tr>`).join('')}
      </table>
      <p><b>Why bother?</b> In radians, arc length is <i>r</i>θ with no conversion factor, and so is the calculus: d/dθ sin θ = cos θ. In degrees every derivative carries a stray π/180.</p>
      <div class="charts">${chart({ ...RANGES.arc, xlabel: 'angle (°)', ylabel: 'arc s (radii)', cursors: ['arc'], label: 'Arc length against angle in degrees: a straight line through 57.3 degrees per radian',
        series: [{ pts: [[0, 0], [360, M.FULL]] }, { cls: 'grid', pts: [[M.RAD_DEG, 0], [M.RAD_DEG, 1]] }], marks: [[M.RAD_DEG, 1, `1 rad = ${f(M.RAD_DEG, 1)}°`]] })}</div>
      <p class="hintline">Click the arc to unroll it up the line x = 1 and measure it.</p>`,
    cam: { target: at('radian', 0.05, 0.05), az: -8, el: 6, dist: 16 }, lit: 'radian', scene: 'radian', look: {},
    fig: 'The arc, measured in radii',
    alt: 'A red arc grows round the circle from the positive x axis, past marks at every radius of arc, to a full turn of 2π and back.',
  },
  {
    kicker: '1.5', title: 'The sine wave', sub: 'the height, drawn against the turn',
    body: `
      <p class="lede">Let <i>P</i> go round at a steady rate, and let a strip of paper slide to the right at one radius per radian. A pen held level with <i>P</i> draws its height against how far it has turned:</p>
      <div class="eq"><i>y</i> = sin <i>t</i></div>
      <p>After one turn the paper has moved 2π: one <b>wavelength</b>. Then <i>P</i> repeats itself, and so does the trace: sin(<i>t</i> + 2π) = sin <i>t</i>. Sine is <b>periodic</b> with period 2π.</p>
      <table class="data">
        <tr><th><i>t</i></th>${['0', 'π/2', 'π', '3π/2', '2π'].map(x => `<td>${x}</td>`).join('')}</tr>
        <tr><th>sin <i>t</i></th>${[0, 1, 2, 3, 4].map(k => `<td>${f(Math.sin(k * Math.PI / 2), 0)}</td>`).join('')}</tr>
      </table>
      <p>The trace is steepest where it crosses the middle and flat at the tops: its slope is cos <i>t</i>. With <i>t</i> in radians, d/d<i>t</i> sin <i>t</i> = cos <i>t</i>. In the figure one turn takes ${M.TURN} s.</p>
      <div class="charts">${chart({ ...RANGES.wave, xlabel: 't', ylabel: 'y = sin t', cursors: ['wave'], label: 'y equals sin t over two turns',
        series: [{ cls: 'grid', pts: [[M.TAU, -1], [M.TAU, 1]] }, { pts: samples(0, RANGES.wave.x1, 200, Math.sin) }], marks: [[M.TAU, 0, '2π']] })}</div>
      <p class="hintline">Click the trace for its slope, cos t, in blue.</p>`,
    cam: { target: at('wave', 3.4 * 1.5, 0), az: -3, el: 5, dist: 43 }, lit: 'wave', scene: 'wave', look: {},
    fig: 'P’s height drawn on a sliding strip',
    alt: 'P goes round the circle on the left; a pen level with P draws a red sine wave on a paper strip sliding to the right.',
  },
  {
    kicker: '1.6', title: 'Tangent', sub: 'the slope of OP, and a length',
    body: `
      <p class="lede">The third function is the slope of the radius <i>OP</i>, how far up per unit across:</p>
      <div class="eq">tan θ = sin θ / cos θ</div>
      <p>Carry the ray <i>OP</i> on until it meets the line <i>x</i> = 1, which touches the circle at (1, 0). It meets it at height tan θ, because the small triangle under <i>P</i> and the large one under the meeting point have the same angles: up/across is sin θ / cos θ in one and tan θ / 1 in the other. A line that touches a circle is a <b>tangent</b>; hence the name.</p>
      <table class="data">
        <tr><th>θ</th>${[0, 30, 45, 60].map(d => `<td>${d}°</td>`).join('')}<td>89°</td><td>90°</td></tr>
        <tr><th>tan θ</th>${[0, 30, 45, 60].map(d => `<td>${S(d).tanText}</td>`).join('')}<td>${f(M.tan(89 * M.DEG), 1)}</td><td>none</td></tr>
      </table>
      <p>As θ → 90°, cos θ → 0 and the ray turns parallel to <i>x</i> = 1, so it meets it ever higher: tan θ → ∞, and tan 90° is undefined. Below the axis the ray meets the line below (1, 0): tan θ is negative.</p>
      <div class="charts">${chart({ ...RANGES.tan, xlabel: 'θ (°)', ylabel: 'tan θ', cursors: ['tan'], label: 'tan theta from minus 90 to 90 degrees, running off to infinity at both ends',
        series: [{ cls: 'grid', pts: [[45, -4], [45, 4]] }, { pts: samples(-Math.atan(4) / M.DEG, Math.atan(4) / M.DEG, 160, d => Math.tan(d * M.DEG)) }], marks: [[45, 1, '1 at 45°']] })}</div>
      <p class="hintline">Click the red length to see the two triangles of the same shape.</p>`,
    cam: { target: at('tangent', 0.2, 0.9), az: -6, el: 4, dist: 20 }, lit: 'tangent', scene: 'tangent', look: {},
    fig: 'The ray OP meets x = 1 at height tan θ',
    alt: 'The radius OP is extended as a ray until it meets the vertical line x = 1; a red bar on that line measures from the x axis up to the meeting point.',
  },
  {
    kicker: '1.7', title: 'Beyond 90°', sub: 'the signs in each quadrant',
    body: `
      <p class="lede">The definitions never needed a triangle, so they carry on all the way round. A shadow left of <i>O</i>, or below it, is negative.</p>
      <table class="data">
        <tr><th>quadrant</th><th>θ</th><th>sin</th><th>cos</th><th>tan</th></tr>
        ${[[1, '0°–90°', 45], [2, '90°–180°', 135], [3, '180°–270°', 225], [4, '270°–360°', 315]].map(([q, r, d]) => { const s = M.signs(d * M.DEG), w = v => (v > 0 ? '+' : '−');
          return `<tr><td>${['I', 'II', 'III', 'IV'][q - 1]}</td><td>${r}</td><td>${w(s.sin)}</td><td>${w(s.cos)}</td><td>${w(s.tan)}</td></tr>`; }).join('')}
      </table>
      <p>All three are positive in the first quadrant; only sine in the second (up, but left); only tangent in the third (left and down, two minuses make a plus); only cosine in the fourth.</p>
      <p><b>Reference angle.</b> Reflect <i>P</i> into the first quadrant: the shadows keep their lengths and only their signs change. 150° reflects to 30°, so sin 150° = +½ and cos 150° = −√3/2; 210° gives sin 210° = −½.</p>
      <div class="charts">${chart({ ...RANGES.signs, xlabel: 'θ (°)', ylabel: 'sin θ, cos θ (blue)', cursors: ['sg', 'cg'], label: 'sin and cos over a full turn, with the quadrants marked',
        series: [...quarterLines, { pts: samples(0, 360, 180, d => Math.sin(d * M.DEG)) }, { cls: 'curve total', pts: samples(0, 360, 180, d => Math.cos(d * M.DEG)) }] })}</div>
      <p class="hintline">Click the shadows to see the reference angle.</p>`,
    cam: { target: at('signs', 0, 0), az: 6, el: 6, dist: 16.5 }, lit: 'signs', scene: 'signs', look: {},
    fig: 'Signed shadows, all the way round',
    alt: 'P goes all the way round; a blue bar along the x axis and a red bar up to P show cos θ and sin θ, each flipping sign in the quadrants where they point left or down.',
  },
];

const th = s => M.steady(s.t);
export const PLATES = {
  circle: { text: `P’s two coordinates drawn as lengths: across from O to the foot of P (blue) is cos θ, and up from there to P (red) is sin θ. The dashed lines carry them to the axes.`,
    facts: s => [['θ', `${f(deg(th(s)), 1)}° = ${f(((th(s) % M.TAU) + M.TAU) % M.TAU)} rad`], ['cos θ', f(Math.cos(th(s)))], ['sin θ', f(Math.sin(th(s)))], ['|OP|', f(Math.hypot(M.P(th(s)).x, M.P(th(s)).y))]] },
  sine: { text: `The amber lamp sends level light to the left. The one ray that grazes P stops there; the rest go on to the screen, leaving P’s shadow exactly as high as P. The red bar on the screen is sin θ.`,
    facts: s => [['θ', `${f(deg(th(s)), 1)}°`], ['shadow height sin θ', f(Math.sin(th(s)))], ['quadrant', `${M.quadrant(th(s))}`]] },
  cosine: { text: `The light now falls straight down. P’s shadow lands on the screen below, as far across as P. The blue bar is cos θ: positive to the right of O, negative to the left.`,
    facts: s => [['θ', `${f(deg(th(s)), 1)}°`], ['shadow across cos θ', f(Math.cos(th(s)))], ['sin(90° − θ)', f(Math.sin(Math.PI / 2 - th(s)))]] },
  pythag: { text: `The squares fold part way up so you can see they are three separate areas. Flat on the board, the red and the blue together cover exactly as much as the grey one on the radius: sin²θ + cos²θ = 1², for any θ.`,
    facts: s => { const a = M.sway(s.t), c = Math.cos(a), n = Math.sin(a); return [['θ', `${f(a / M.DEG, 1)}°`], ['sin²θ (red)', f(n * n)], ['cos²θ (blue)', f(c * c)], ['sum', f(n * n + c * c, 6)]]; } },
  radian: { text: `The red arc straightened up the line x = 1. It is as long as the angle in radians: a mark every radius, six marks and a bit for a full turn, ${f(M.FULL)}.`,
    facts: s => { const a = M.unwind(s.t); return [['angle', `${f(a / M.DEG, 1)}°`], ['in radians', f(a)], ['arc s', `${f(M.arc(a))} radii`], ['full turn', `2π = ${f(M.FULL)}`]]; } },
  wave: { text: `The blue curve is the slope of the red trace at each point: steepest (±1) where the trace crosses the middle, zero at its tops and bottoms. It is the cosine, shifted a quarter turn: the derivative of sin t is cos t.`,
    facts: s => [['turned t', `${f(th(s) % M.TAU)} of 2π`], ['height sin t', f(Math.sin(th(s)))], ['slope cos t', f(Math.cos(th(s)))], ['wavelength', `2π = ${f(M.WAVELENGTH)}`]] },
  tangent: { text: `Blue and red: the triangle under P, across cos θ and up sin θ. The big triangle under the meeting point is the same shape, across 1 and up tan θ. Same shape, same ratio: tan θ = sin θ / cos θ.`,
    facts: s => { const a = M.tsway(s.t); return [['θ', `${f(a / M.DEG, 1)}°`], ['sin θ / cos θ', f(Math.sin(a) / Math.cos(a))], ['height on x = 1', f(M.tangentPoint(a).y)], ['slope of OP', f(M.tan(a))]]; } },
  signs: { text: `The grey point is P reflected into the first quadrant, at the reference angle. Its shadows are the same lengths as P’s; the quadrant only decides their signs.`,
    facts: s => { const a = th(s), r = M.reference(a); return [['θ', `${f(deg(a), 1)}° (quadrant ${M.quadrant(a)})`], ['reference angle', `${f(r / M.DEG, 1)}°`], ['sin θ', f(Math.sin(a))], ['cos θ', f(Math.cos(a))], ['tan θ', Math.abs(Math.cos(a)) < 1e-3 ? 'undefined' : f(M.tan(a))]]; } },
};
