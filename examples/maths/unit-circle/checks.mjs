// node maths/unit-circle/checks.mjs — the model proved a second way before anything is drawn. Exit 1 on any failure.
// The independent route is the circle itself: a point turned by integrating x' = −y, y' = x (RK4) from (1, 0), with no
// Math.sin or Math.cos in it; arcs measured by adding up chords; angles found by bisection.
import { checks, near, deriv, integ, bisect, rk4 } from '@saxster/atlas/checks.js';
import * as M from './model.js';
import { PRACTICE } from './practice.js';

const C = checks(), check = C.check;
const d = deg => deg * M.DEG;
// turn (1, 0) through θ by integrating the rotation: x' = −y, y' = x
const turn = (th, n = 400) => { const out = rk4((t, [x, y]) => [-y, x], [1, 0], 0, th, n).at(-1); return { x: out[0], y: out[1] }; };
// the length of the circle's arc from angle a to b, as a sum of chords between points the RK4 turn lands on
const chords = (a, b, n = 20000) => { let s = 0, p = turn(a, 200); const h = (b - a) / n;
  for (let i = 1; i <= n; i++) { const q = rk4((t, [x, y]) => [-y, x], [p.x, p.y], 0, h, 1).at(-1); s += Math.hypot(q[0] - p.x, q[1] - p.y); p = { x: q[0], y: q[1] }; }
  return s; };
const angles = Array.from({ length: 1000 }, (_, i) => -20 + i * 0.0437);   // −20 … +23.7 rad, a few thousand degrees

// ---------- the point ----------
check('P is on the circle: |OP| = 1 at 1000 angles', angles.every(a => near(Math.hypot(M.P(a).x, M.P(a).y), 1, 1e-12)));
check('sin²θ + cos²θ = 1 to 1e-12 at 1000 angles', angles.every(a => Math.abs(M.sin(a) ** 2 + M.cos(a) ** 2 - 1) < 1e-12));
check('P = (cos θ, sin θ) matches the RK4 turn from (1, 0)', [0.3, 1, 2, 3.5, 5, -1.2].every(a => { const q = turn(a); return near(q.x, M.P(a).x, 1e-9) && near(q.y, M.P(a).y, 1e-9); }));
check('the RK4 turn keeps |OP| = 1 (Pythagoras along the way)', [1, 4, 6.2].every(a => { const q = turn(a); return near(q.x * q.x + q.y * q.y, 1, 1e-9); }));
check('angle measured anticlockwise from +x: 90° is straight up', near(M.P(d(90)).x, 0, 1e-15) && near(M.P(d(90)).y, 1));
check('angleOf inverts P', [0.2, 1.9, 3.3, 5.7].every(a => near(M.angleOf(M.P(a).x, M.P(a).y), a, 1e-12)));

// ---------- calculus ----------
check('d/dθ sin θ = cos θ (numerically)', angles.filter((_, i) => i % 50 === 0).every(a => near(deriv(M.sin, a), M.cos(a), 1e-8)));
check('d/dθ cos θ = −sin θ (numerically)', angles.filter((_, i) => i % 50 === 0).every(a => near(deriv(M.cos, a), -M.sin(a), 1e-8)));
check('P moves at speed 1 per radian: |dP/dθ| = 1', [0.1, 1.3, 2.8, 4.4].every(a => near(Math.hypot(deriv(t => M.P(t).x, a), deriv(t => M.P(t).y, a)), 1, 1e-8)));

// ---------- special values ----------
const S = M.SPECIAL;
check('sin 30° = ½ exactly (the model holds the exact number)', M.special(30).sin === 0.5 && Math.abs(Math.sin(Math.PI / 6) - 0.5) < 1e-15);
check('sin 45° = √2/2, sin 90° = 1, sin 0 = 0', near(M.special(45).sin, Math.SQRT2 / 2, 1e-15) && M.special(90).sin === 1 && M.special(0).sin === 0);
check('all special sines and cosines match Math.sin / Math.cos to 1e-15', S.every(s => Math.abs(s.sin - Math.sin(s.rad)) < 1e-15 && Math.abs(s.cos - Math.cos(s.rad)) < 1e-15));
check('all special values match the RK4 turn', S.every(s => { const q = turn(s.rad); return near(q.x, s.cos, 1e-9) && near(q.y, s.sin, 1e-9); }));
{ // geometry: halve an equilateral triangle of side 1; an isosceles right triangle of hypotenuse 1
  const half = 1 / 2, alt = Math.sqrt(1 - half * half), leg = Math.sqrt(1 / 2);
  check('30-60-90: the half of an equilateral triangle gives sin 30° = ½, sin 60° = √3/2', near(M.special(30).sin, half, 1e-15) && near(M.special(60).sin, alt, 1e-15));
  check('45-45-90: legs of an isosceles right triangle are √2/2', near(M.special(45).sin, leg, 1e-15) && near(M.special(45).cos, leg, 1e-15)); }
check('special values satisfy sin² + cos² = 1 exactly in surds', S.every(s => Math.abs(s.sin ** 2 + s.cos ** 2 - 1) < 1e-15));
check('cos θ = sin(90° − θ) for every special angle', S.every(s => near(s.cos, M.special(90 - s.deg).sin, 1e-15)));
check('tan of the special angles: 0, √3/3, 1, √3', S.slice(0, 4).every(s => near(s.tan, Math.tan(s.rad), 1e-12)) && M.special(90).tan === Infinity);

// ---------- radians: arc length = θ ----------
check('arc length = θ: ∫|dP/dθ| dθ (Simpson) at 0.5, 1, 2.4', [0.5, 1, 2.4].every(a => near(integ(t => Math.hypot(deriv(u => M.P(u).x, t), deriv(u => M.P(u).y, t)), 0, a), M.arc(a), 1e-7)));
check('arc length = θ: chords along the RK4 turn, 0 to 1 rad', near(chords(0, 1), M.arc(1), 1e-7), `${chords(0, 1).toFixed(8)}`);
{ const full = chords(0, 2 * Math.PI, 60000);
  check('a full turn is 2π long (chords)', near(full, M.FULL, 1e-7), `${full.toFixed(6)}`);
  check('1 radian = 360° / circumference = 57.30°', near(360 / full, M.RAD_DEG, 1e-7), `${(360 / full).toFixed(4)}°`); }
{ // an independent arc: y = √(1 − x²) from x = cos θ to x = 1 is ∫ dx / √(1 − x²); x = 1 − u² tames the end:
  // dx = 2u du and 1 − x² = u²(2 − u²), so the integrand is 2 / √(2 − u²)
  const a = 1.1, x0 = turn(a).x, arcX = integ(u => 2 / Math.sqrt(2 - u * u), 0, Math.sqrt(1 - x0), 4000);
  check('arc by y = √(1 − x²) (no angle at all) = θ', near(arcX, a, 1e-6), `${arcX.toFixed(7)} for θ = ${a}`); }
check('six radii round the circle fall short of a turn by 2π − 6', near(M.FULL - 6, 0.2831853, 1e-6));

// ---------- the sine wave ----------
const ts = [0, 1.3, 4.1, 7.7, 12.9, 31];
check('the traced wave is sin: wave(t, u) = sin(ωt − u/K)', ts.every(t => [0, 0.4, 2, 3.5].every(u => near(M.wave(t, u), Math.sin(M.W * t - u / M.K), 1e-12))));
check('…and each traced point is P\'s RK4 height when it was drawn', ts.every(t => [0.7, 1.6, 3.3].every(u => near(M.wave(t, u), turn(M.W * t - u / M.K, 800).y, 1e-8))));
check('one turn draws one wavelength: the paper moves K·2π (t = 2π)', near(M.WAVELENGTH, M.K * 2 * Math.PI, 1e-12) && near(M.WAVELENGTH / M.K, 2 * Math.PI, 1e-12), `${M.WAVELENGTH.toFixed(4)} radii of paper in ${M.TURN} s`);
check('the trace repeats every wavelength along the strip', ts.every(t => [0.2, 1.5].every(u => near(M.wave(t, u + M.WAVELENGTH), M.wave(t, u), 1e-9))));
check('the strip is long enough to show a whole wavelength', M.STRIP.len > M.WAVELENGTH && near(M.STRIP.len, M.K * M.STRIP.tmax));

// ---------- tangent ----------
check('tan θ = sin θ / cos θ (Math.tan agrees)', angles.filter(a => Math.abs(Math.cos(a)) > 0.05).every(a => near(M.tan(a), Math.tan(a), 1e-9)));
check('tangent-line construction: ray OP meets x = 1 at height tan θ (bisection on the ray)', [-40, 10, 45, 60, 68].every(deg => {
  const p = turn(d(deg)), s = bisect(s => s * p.x - 1, 0, 100);   // walk out along the ray until x = 1
  return near(s * p.y, M.tangentPoint(d(deg)).y, 1e-9); }));
check('tangent line touches the circle at (1, 0), at right angles to the radius', near(M.tangentPoint(0).y, 0) && M.tangentPoint(d(30)).x === 1);
check('tan 45° = 1', near(M.tan(d(45)), 1, 1e-15));
check('tan θ → ∞ as θ → 90°: 57 at 89°, 573 at 89.9°', M.tan(d(89)) > 57 && M.tan(d(89.9)) > 572, `${M.tan(d(89.9)).toFixed(0)}`);
check('tan is the slope of OP: d(height)/d(across) along the ray', [20, 50, -30].every(deg => near((M.P(d(deg)).y * 2 - M.P(d(deg)).y) / (M.P(d(deg)).x * 2 - M.P(d(deg)).x), M.tan(d(deg)), 1e-12)));

// ---------- quadrants ----------
const QS = [[40, 1, 1, 1, 1], [130, 2, 1, -1, -1], [220, 3, -1, -1, 1], [310, 4, -1, 1, -1]];
check('quadrant signs (sin, cos, tan) agree with the RK4 point', QS.every(([deg, q, s, c, t]) => { const p = turn(d(deg)); return M.quadrant(d(deg)) === q && Math.sign(p.y) === s && Math.sign(p.x) === c && Math.sign(p.y / p.x) === t && M.signs(d(deg)).sin === s && M.signs(d(deg)).cos === c && M.signs(d(deg)).tan === t; }));
check('reference angle: |sin θ| = sin(ref), |cos θ| = cos(ref) in every quadrant', [25, 150, 200, 290, 390, -60].every(deg => { const r = M.reference(d(deg)); return r >= 0 && r <= Math.PI / 2 && near(Math.abs(M.sin(d(deg))), Math.sin(r), 1e-12) && near(Math.abs(M.cos(d(deg))), Math.cos(r), 1e-12); }));

// ---------- the motions drawn ----------
const grid = (T, n = 4000) => Array.from({ length: n + 1 }, (_, i) => i * T / n);
const range = (fn, T) => { const v = grid(T).map(fn); return [Math.min(...v), Math.max(...v), Math.max(...v.slice(1).map((x, i) => Math.abs(x - v[i])))]; };
{ const [lo, hi] = range(M.sway, M.PY.T); check('sin² + cos² scene: P stays in 20°…70°', lo >= M.PY.lo - 1e-12 && hi <= M.PY.hi + 1e-12, `${(lo / M.DEG).toFixed(1)}° to ${(hi / M.DEG).toFixed(1)}°`); }
{ const [lo, hi, step] = range(M.unwind, M.RADT); check('radian scene: the arc grows 0 → 2π and back, never jumping', near(lo, 0, 1e-9) && near(hi, 2 * Math.PI, 1e-6) && step < 0.01, `largest step ${step.toFixed(4)} rad per ${(M.RADT / 4000).toFixed(3)} s`); }
{ const [lo, hi] = range(M.tsway, M.TG.T); check('tangent scene: P stays between −45° and 68°, short of 90°', lo >= M.TG.lo - 1e-12 && hi <= M.TG.hi + 1e-12 && M.tan(hi) < 2.5, `tan up to ${M.tan(hi).toFixed(3)}`); }
check('steady turn: one turn in TURN seconds', near(M.steady(M.TURN), 2 * Math.PI));

// ---------- practice (practice.js): structure, and every answer recomputed another way ----------
{
  const NPAGES = 8;   // pages.js imports world.js (three.js, browser-only), so the page count is written here
  const items = Object.entries(PRACTICE);
  check('practice: every page 0..7 has 1–2 questions, and no others', Array.from({ length: NPAGES }, (_, i) => PRACTICE[i]).every(q => Array.isArray(q) && q.length >= 1 && q.length <= 2) && items.every(([k]) => +k >= 0 && +k < NPAGES && Number.isInteger(+k)),
    `${items.reduce((s, [, q]) => s + q.length, 0)} questions`);
  check('practice: each has q and either 4 distinct choices, a valid answer and a why, or a solution', items.every(([, qs]) => qs.every(it => typeof it.q === 'string' && it.q.length > 0 && (it.choices
    ? it.choices.length === 4 && new Set(it.choices).size === 4 && Number.isInteger(it.answer) && it.answer >= 0 && it.answer < 4 && typeof it.why === 'string' && it.why.length > 0
    : typeof it.solution === 'string' && it.solution.length > 0))));
  // a choice's value: decimals, or the surds the chapter uses (½, ⅓, √n/2, √n/3), with − as minus
  const val = s => { const t = s.replace(/<[^>]*>/g, '').replace(/−/g, '-').trim(), sg = t.startsWith('-') ? -1 : 1, u = t.replace(/^-/, '');
    const surd = /^√(\d+)\/(\d+)/.exec(u);
    if (u.startsWith('½')) return { v: sg * 0.5, dp: 15 };
    if (u.startsWith('⅓')) return { v: sg / 3, dp: 15 };
    if (surd) return { v: sg * Math.sqrt(+surd[1]) / +surd[2], dp: 15 };
    const m = u.match(/\d+(?:\.\d+)?/); return m ? { v: sg * parseFloat(m[0]), dp: (m[0].split('.')[1] || '').length } : { v: NaN, dp: 0 }; };
  // keyed choice = want within its rounding (exact for surds); every other choice > 2% away
  const keyed = (pg, i, want, name) => {
    const it = PRACTICE[pg][i], cs = it.choices.map(val), k = cs[it.answer];
    const okKey = Math.abs(k.v - want) <= Math.max(0.5 * 10 ** -k.dp, 1e-9) * (1 + 1e-9);
    const okOthers = cs.every((c, j) => j === it.answer || !(Math.abs(c.v - want) <= 0.02 * Math.max(Math.abs(want), Math.abs(c.v), 1e-9)));
    check(`practice ${pg}.${i + 1}: ${name}`, okKey && okOthers, `want ${+want.toPrecision(6)}, keyed ${it.choices[it.answer].replace(/<[^>]*>/g, '')}${okOthers ? '' : ', a distractor is within 2%'}`);
  };
  // 0: x at 210° by the RK4 turn; x from y = 0.6 by bisection on the circle's angle in (π/2, π)
  keyed(0, 0, turn(d(210)).x, 'x at 210°, RK4 turn');
  { const a = bisect(a => turn(a).y - 0.6, Math.PI / 2, Math.PI); keyed(0, 1, turn(a).x, 'x where y = 0.6 in Q2, bisection on the RK4 turn'); }
  // 1: sin 30° from the RK4 turn; the rider's height as the RK4 point scaled by 20 m
  keyed(1, 0, turn(d(30)).y, 'sin 30°, RK4 turn');
  keyed(1, 1, 22 + 20 * turn(d(30)).y, 'Ferris wheel height, RK4 turn scaled');
  // 2: cos 60°; cos 250° by the RK4 turn
  keyed(2, 0, turn(d(60)).x, 'cos 60°, RK4 turn');
  keyed(2, 1, turn(d(250)).x, 'cos 250°, RK4 turn');
  // 3: the acute angle with sin = 0.28 by bisection, then its x; the simplification checked at many angles
  { const a = bisect(a => turn(a).y - 0.28, 0, Math.PI / 2); keyed(3, 0, turn(a).x, 'cos θ from sin θ = 0.28, bisection'); }
  check('practice 3.2: (1 − cos²θ)/sin θ = sin θ at many angles, and the solution says so', [0.3, 1.2, 2.5, 4, -0.7].every(a => near((1 - turn(a).x ** 2) / turn(a).y, turn(a).y, 1e-8)) && PRACTICE[3][1].solution.includes('sin θ'));
  // 4: degrees in a radian from the chord-measured circumference; rim distance by integrating the arc of radius 0.35
  keyed(4, 0, 360 / chords(0, 2 * Math.PI, 60000), '1 rad in degrees, 360° / chord circumference');
  keyed(4, 1, integ(t => 0.35 * Math.hypot(deriv(u => M.P(u).x, t), deriv(u => M.P(u).y, t)), 0, 2.4), 'rim distance, ∫ r|dP/dθ| dθ');
  // 5: the first top of sin t, where its slope (numerical) is zero; the period of sin 3t from successive upward zero crossings
  keyed(5, 0, bisect(t => deriv(Math.sin, t), 0.5, 2.5), 'first top of sin t, slope = 0 by bisection');
  { const up = [bisect(t => Math.sin(3 * t), -0.3, 0.3), bisect(t => Math.sin(3 * t), 1.8, 2.4)]; keyed(5, 1, up[1] - up[0], 'period of sin 3t, between upward zero crossings'); }
  // 6: tan 45° by walking the 45° ray to x = 1; the height at 60° by bisecting on the angle of points (1, y)
  { const p = turn(d(45)), s = bisect(s => s * p.x - 1, 0, 10); keyed(6, 0, s * p.y, 'tan 45°, the ray walked to x = 1'); }
  keyed(6, 1, bisect(y => Math.atan2(y, 1) - d(60), 0, 10), 'height on x = 1 at 60°, bisection on atan2');
  // 7: the signs at 200° from the RK4 point; sin 150° by the RK4 turn
  { const p = turn(d(200)), it = PRACTICE[7][0], want = `sin ${p.y > 0 ? '+' : '−'}, cos ${p.x > 0 ? '+' : '−'}`;
    check('practice 7.1: signs at 200° from the RK4 point', it.choices[it.answer] === want && new Set(it.choices).size === 4, want); }
  keyed(7, 1, turn(d(150)).y, 'sin 150°, RK4 turn');
}

C.report();
