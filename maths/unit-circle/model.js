// Unit circle model: a point P going round a circle of radius 1 about the origin O, the angle θ measured
// anticlockwise from the +x axis. Pure functions; lengths in units of the radius. Every number, motion,
// label and practice answer in the chapter comes from here.

export const TAU = 2 * Math.PI;
export const DEG = Math.PI / 180;               // radians per degree
export const R = 1;                             // the radius: the whole chapter is measured in it
export const RAD_DEG = 180 / Math.PI;           // degrees in one radian: 57.30°
export const FULL = TAU * R;                    // a full turn, as arc length: 2π ≈ 6.283

// ---------- the point and its shadows ----------
export const P = th => ({ x: R * Math.cos(th), y: R * Math.sin(th) });
export const sin = th => Math.sin(th);
export const cos = th => Math.cos(th);
export const tan = th => Math.sin(th) / Math.cos(th);
// the length of arc from (1, 0) round to P: s = rθ
export const arc = th => R * th;
// the angle of a point (x, y), in [0, 2π)
export const angleOf = (x, y) => { const a = Math.atan2(y, x); return a < 0 ? a + TAU : a; };

// the tangent line x = 1 touches the circle at (1, 0); the ray from O through P meets it at height tan θ
export const tangentPoint = th => ({ x: R, y: R * tan(th) });

// ---------- special angles, exactly ----------
// sin and cos of 0°, 30°, 45°, 60°, 90° as surds: √0/2, √1/2, √2/2, √3/2, √4/2, read up for sine, down for cosine
// (the sines are √n/2 for n = 0…4, the cosines the same list backwards; these are exact, not Math.sin)
export const SPECIAL = [0, 30, 45, 60, 90].map((deg, n) => ({
  deg, rad: deg * DEG,
  sin: Math.sqrt(n) / 2, cos: Math.sqrt(4 - n) / 2, tan: n === 4 ? Infinity : Math.sqrt(n / (4 - n)),
  sinText: ['0', '½', '√2/2', '√3/2', '1'][n],
  cosText: ['1', '√3/2', '√2/2', '½', '0'][n],
  tanText: ['0', '√3/3', '1', '√3', 'undefined'][n],
  radText: ['0', 'π/6', 'π/4', 'π/3', 'π/2'][n],
}));
export const special = deg => SPECIAL.find(s => s.deg === deg);

// ---------- quadrants: which shadows are positive ----------
export function quadrant(th) {
  const a = ((th % TAU) + TAU) % TAU;
  return a < Math.PI / 2 ? 1 : a < Math.PI ? 2 : a < 1.5 * Math.PI ? 3 : 4;
}
export const signs = th => ({ sin: Math.sign(sin(th)), cos: Math.sign(cos(th)), tan: Math.sign(tan(th)) });
// the acute angle P makes with the x axis: sin and cos of θ are those of this angle, with the quadrant's signs
export function reference(th) {
  const a = ((th % TAU) + TAU) % TAU;
  return [a, Math.PI - a, a - Math.PI, TAU - a][quadrant(a) - 1];
}

// ---------- the motions drawn, one per scene (t in seconds) ----------
export const TURN = 16;                           // seconds for one steady turn
export const W = TAU / TURN;                      // ω, radians per second
export const steady = t => W * t;                 // P going round at a steady rate: θ = ωt
// sin² + cos²: P sways in the first quadrant, between 20° and 70°
export const PY = { lo: 20 * DEG, hi: 70 * DEG, T: 10 };
export const sway = t => (PY.lo + PY.hi) / 2 + (PY.hi - PY.lo) / 2 * Math.sin(TAU * t / PY.T);
// radians: the arc grows from 0 to a full turn and back, θ = π(1 − cos(2πt/T)), so it never jumps
export const RADT = 36;
export const unwind = t => Math.PI * (1 - Math.cos(TAU * t / RADT));
// tangent: P sways between −45° and 68°, short of 90°, where tan θ runs off to infinity
export const TG = { lo: -45 * DEG, hi: 68 * DEG, T: 16 };
export const tsway = t => (TG.lo + TG.hi) / 2 + (TG.hi - TG.lo) / 2 * Math.sin(TAU * t / TG.T);

// ---------- the sine wave: P's height drawn on a strip that slides sideways ----------
// The strip moves at ω (one radius per radian), so one turn draws one wavelength, 2π long.
export const STRIP = { len: 7.0 };                // strip length, in radii
export const SPEED = W * R;                       // strip speed: radii per second
export const WAVELENGTH = SPEED * TURN;           // distance the strip moves in one turn: 2π
// a point u along the strip from the pen was drawn u/SPEED seconds ago, when the angle was ωt − u
export const wave = (t, u) => sin(steady(t - u / SPEED));
