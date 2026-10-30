// node chemistry/vsepr/checks.mjs — the VSEPR model proved a second way before anything is drawn. Exit 1 on any failure.
// The model builds shapes from symmetry and closed forms; here they are rebuilt from coordinates, from NIST's own
// cartesians, and from an unconstrained minimiser that knows nothing of the molecules' symmetry.
import { checks, near, bisect } from '@saxster/atlas/checks.js';
import { rng } from '@saxster/atlas/rng.js';
import * as M from './model.js';
import { PRACTICE } from './practice.js';

const C = checks(), { check } = C;
const D = 180 / Math.PI;
const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0), norm = a => Math.sqrt(dot(a, a));
const minus = (a, b) => a.map((x, i) => x - b[i]);
const ang = (a, b) => Math.acos(Math.max(-1, Math.min(1, dot(a, b) / (norm(a) * norm(b))))) * D;
const pairs = n => { const p = []; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) p.push([i, j]); return p; };

// ---------- the tetrahedral angle ----------
const cube = [[1, 1, 1], [-1, -1, 1], [1, -1, -1], [-1, 1, -1]];
{ const cs = pairs(4).map(([i, j]) => dot(cube[i], cube[j]) / (norm(cube[i]) * norm(cube[j])));
  check('tetrahedral: every pair of alternate cube corners has cos θ = −1/3 (dot product)', cs.every(c => near(c, -1 / 3, 1e-15)), `${cs.length} pairs`);
  check('tetrahedral: arccos(−1/3) = model TET = 109.4712…°', near(Math.acos(-1 / 3) * D, M.TET_DEG, 1e-14) && Math.abs(M.TET_DEG - 109.4712206) < 1e-7, `${M.TET_DEG.toFixed(7)}°`);
  check('tetrahedral: the model\'s AX4 directions are 109.47° apart in every pair', pairs(4).every(([i, j]) => near(ang(M.domains('AX4').bonds[i], M.domains('AX4').bonds[j]), M.TET_DEG, 1e-9)));
  // cos θ = −1/3 also from the centroid: four unit vectors summing to zero, all angles equal, give 4 + 12 cos θ = 0
  check('tetrahedral: Σu = 0 and equal angles force 4 + 12 cos θ = 0', near(-4 / 12, -1 / 3) && norm(M.domains('AX4').bonds.reduce((s, u) => s.map((x, k) => x + u[k]), [0, 0, 0])) < 1e-12); }

// an unconstrained minimiser: n points on the unit sphere with charges q, energy Σ qᵢqⱼ/dᵢⱼ, projected gradient descent
function relax(q, seed = 1, steps = 6000, eta = 0.02) {
  const R = rng(seed), n = q.length;
  let P = q.map(() => { const v = [R.normal(), R.normal(), R.normal()]; const l = norm(v); return v.map(x => x / l); });
  for (let s = 0; s < steps; s++) {
    const G = P.map(() => [0, 0, 0]);
    for (const [i, j] of pairs(n)) { const d = minus(P[i], P[j]), r = norm(d), k = q[i] * q[j] / (r * r * r); for (let a = 0; a < 3; a++) { G[i][a] -= k * d[a]; G[j][a] += k * d[a]; } }
    P = P.map((p, i) => { const g = G[i], gt = g.map((x, a) => x - dot(g, p) * p[a]); const v = p.map((x, a) => x - eta * gt[a]); const l = norm(v); return v.map(x => x / l); });
  }
  return P;
}
for (const n of [2, 3, 4]) {
  const P = relax(new Array(n).fill(1), 7 + n), as = pairs(n).map(([i, j]) => ang(P[i], P[j]));
  check(`spread: ${n} equal pairs relax to ${M.SPREAD_NAME[n]}, ${M.SPREAD[n].toFixed(2)}° (random start, no symmetry assumed)`, as.every(a => Math.abs(a - M.SPREAD[n]) < 1e-4), as.map(a => a.toFixed(4)).join(', '));
}
// the tetrahedron maximises the smallest angle among four points (Tammes, n = 4): no random or nudged layout beats it
{ const R = rng(11), unitR = () => { const v = [R.normal(), R.normal(), R.normal()]; const l = norm(v); return v.map(x => x / l); };
  const minAng = P => Math.min(...pairs(4).map(([i, j]) => ang(P[i], P[j])));
  let best = 0; for (let k = 0; k < 200000; k++) best = Math.max(best, minAng([unitR(), unitR(), unitR(), unitR()]));
  const T = M.domains('AX4').bonds; let worse = true;
  for (let k = 0; k < 2000; k++) { const Q = T.map(u => { const v = u.map(x => x + 0.01 * R.normal()); const l = norm(v); return v.map(x => x / l); }); if (minAng(Q) > M.TET_DEG + 1e-9) worse = false; }
  check('tetrahedral: 200 000 random 4-point layouts never beat 109.47° as the smallest angle', best < M.TET_DEG, `best ${best.toFixed(2)}°`);
  check('tetrahedral: 2 000 small nudges of the tetrahedron all shrink its smallest angle', worse); }

// ---------- the measured molecules: read every XYZ back and measure it ----------
const parse = txt => { const L = txt.split('\n'); const n = +L[0]; return L.slice(2, 2 + n).map(l => { const [e, x, y, z] = l.trim().split(/\s+/); return [e, +x, +y, +z]; }); };
for (const k of Object.keys(M.MOL)) {
  const m = M.MOL[k], A = parse(M.XYZ[k]), c = A[0].slice(1), H = A.slice(1).map(a => minus(a.slice(1), c));
  const rs = H.map(norm), as = pairs(H.length).map(([i, j]) => ang(H[i], H[j]));
  check(`${k} XYZ: ${A.length} atoms, ${m.centre} first, then ${m.bonds} H`, A.length === m.bonds + 1 && A[0][0] === m.centre && A.slice(1).every(a => a[0] === 'H') && +M.XYZ[k].split('\n')[0] === A.length);
  check(`${k} XYZ: every ${m.centre}–H = ${m.r} Å (from coordinates)`, rs.every(r => Math.abs(r - m.r) < 2e-6), rs.map(r => r.toFixed(5)).join(', '));
  check(`${k} XYZ: every H–${m.centre}–H = ${m.angle}° (from coordinates)`, as.every(a => Math.abs(a - m.angle) < (m.bonds === 4 ? 2e-3 : 2e-4)), as.map(a => a.toFixed(4)).join(', '));
}
// NIST's own cartesians (CCCBDB "Cartesians" tables, 4 decimals, copied from the pages cited in model.js) give the same r and angle
const NIST = {
  CH4: [[0, 0, 0], [0.6276, 0.6276, 0.6276], [0.6276, -0.6276, -0.6276], [-0.6276, 0.6276, -0.6276], [-0.6276, -0.6276, 0.6276]],
  NH3: [[0, 0, 0], [0, -0.9377, -0.3816], [0.8121, 0.4689, -0.3816], [-0.8121, 0.4689, -0.3816]],
  H2O: [[0, 0, 0.1173], [0, 0.7572, -0.4692], [0, -0.7572, -0.4692]],
  H2S: [[0, 0, 0.1030], [0, 0.9616, -0.8239], [0, -0.9616, -0.8239]],
  PH3: [[0, 0, 0], [0, -1.1932, -0.7717], [1.0333, 0.5966, -0.7717], [-1.0333, 0.5966, -0.7717]],
};
for (const [k, P] of Object.entries(NIST)) {
  const m = M.MOL[k], H = P.slice(1).map(p => minus(p, P[0])), rs = H.map(norm), as = pairs(H.length).map(([i, j]) => ang(H[i], H[j]));
  check(`${k}: NIST's cartesians give r = ${m.r} Å and ${m.angle}° (to their 4-decimal rounding)`, rs.every(r => Math.abs(r - m.r) < 1.5e-3) && as.every(a => Math.abs(a - m.angle) < 0.02), `${rs[0].toFixed(4)} Å, ${as[0].toFixed(3)}°`);
}
check('CH4 and SiH4: measured angle = the tetrahedral angle (Td symmetry)', Math.abs(M.MOL.CH4.angle - M.TET_DEG) < 5e-4 && Math.abs(M.MOL.SiH4.angle - M.TET_DEG) < 1e-5);
check('ordering: CH4 > NH3 > H2O (109.47° > 106.67° > 104.48°)', M.MOL.CH4.angle > M.MOL.NH3.angle && M.MOL.NH3.angle > M.MOL.H2O.angle, M.MAIN.map(k => M.MOL[k].angle).join(' > '));
check('ordering: bonds shorten across the period, C–H > N–H > O–H', M.MOL.CH4.r > M.MOL.NH3.r && M.MOL.NH3.r > M.MOL.H2O.r);
// distances used on the pages, from coordinates
for (const k of M.MAIN) { const A = parse(M.XYZ[k]); const d = norm(minus(A[1].slice(1), A[2].slice(1)));
  check(`${k}: H···H = 2r sin(θ/2) matches the coordinates`, Math.abs(d - M.hh(k)) < 1e-5, `${d.toFixed(4)} Å`); }
{ const A = parse(M.XYZ.NH3), H = A.slice(1).map(a => a.slice(1)), cen = [0, 1, 2].map(a => (H[0][a] + H[1][a] + H[2][a]) / 3);
  check('NH3: N above the H₃ plane (centroid distance) = model pyramid height', Math.abs(norm(cen) - M.pyramidHeight('NH3')) < 1e-5, `${norm(cen).toFixed(4)} Å`); }

// ---------- the lone-pair squeeze (a toy model: one number fitted to NH3) ----------
// the shape for given charges with no symmetry assumed: the bond–bond angles of the relaxed points
const relaxedBond = (nb, nl, q, seed = 3) => { const P = relax([...new Array(nl).fill(q), ...new Array(nb).fill(1)], seed, 5000, 0.02), B = P.slice(nl); return pairs(nb).map(([i, j]) => ang(B[i], B[j])); };
check('toy model: with q = 1 (lone pairs no stronger) NH3 and H2O stay tetrahedral', [relaxedBond(3, 1, 1), relaxedBond(2, 2, 1)].flat().every(a => Math.abs(a - M.TET_DEG) < 1e-3));
{ const fit = bisect(q => relaxedBond(3, 1, q)[0] - M.MOL.NH3.angle, 1.0, 2.0, 1e-6);
  check('toy model (fitted, empirical): re-fitting q to NH3 without symmetry gives the model\'s Q_LONE', Math.abs(fit - M.Q_LONE) < 2e-4, `q = ${fit.toFixed(5)}`); }
{ const a3 = relaxedBond(3, 1, M.Q_LONE), a2 = relaxedBond(2, 2, M.Q_LONE)[0];
  check('toy model: NH3 at Q_LONE, all three H–N–H within 0.005° of 106.67° (fitted)', a3.every(a => Math.abs(a - M.MOL.NH3.angle) < 0.005), a3.map(a => a.toFixed(3)).join(', '));
  check('toy model: the relaxed H2O angle equals the model\'s symmetric solution', Math.abs(a2 - M.PREDICT.H2O.bond) < 0.005, `${a2.toFixed(3)}°`);
  check('toy model (prediction): fitted to NH3 only, it puts H2O within 0.2° of the measured 104.48°', Math.abs(a2 - M.MOL.H2O.angle) < 0.2, `${a2.toFixed(2)}° vs ${M.MOL.H2O.angle}°`);
  check('toy model: reproduces the ordering CH4 > NH3 > H2O', M.TET_DEG > a3[0] && a3[0] > a2);
  const lone = (() => { const P = relax([M.Q_LONE, M.Q_LONE, 1, 1], 3, 5000, 0.02); return ang(P[0], P[1]); })();
  check('toy model: lone–lone > tetrahedral > bond–bond in H2O (LP–LP pushes hardest)', lone > M.TET_DEG && M.TET_DEG > a2 && Math.abs(lone - M.PREDICT.H2O.lone) < 0.01, `${lone.toFixed(2)}°`); }
check('honest limit: the toy model misses H2S by more than 10° and PH3 by more than 10°', M.PREDICT.H2S.off > 10 && M.PREDICT.PH3.off > 10, `+${M.PREDICT.H2S.off.toFixed(1)}°, +${M.PREDICT.PH3.off.toFixed(1)}°`);
check('figure clock: the swell runs from q = 1 to Q_LONE and back, smoothly', near(M.swellQ(0), 1) && near(M.swellQ(M.SWELL / 2), M.Q_LONE) && near(M.swellQ(M.SWELL), 1, 1e-12));
check('figure: the drawn swell ends at the measured NH3 angle', Math.abs(M.squeeze('AX3E', M.swellQ(M.SWELL / 2)).bond - M.MOL.NH3.angle) < 0.005);

// ---------- practice (practice.js): structure, and every numeric answer recomputed another way ----------
{
  const NPAGES = 8;   // pages.js imports world.js (three.js, browser-only), so the page count is written here
  const items = Object.entries(PRACTICE);
  check('practice: every page 0..7 has 1–2 questions, and no others', Array.from({ length: NPAGES }, (_, i) => PRACTICE[i]).every(q => Array.isArray(q) && q.length >= 1 && q.length <= 2) && items.every(([k]) => +k >= 0 && +k < NPAGES && Number.isInteger(+k)),
    `${items.reduce((s, [, q]) => s + q.length, 0)} questions`);
  check('practice: each has q, 4 distinct choices, a valid answer and a why', items.every(([, qs]) => qs.every(it => typeof it.q === 'string' && it.q.length > 0 && it.choices.length === 4 && new Set(it.choices).size === 4 && Number.isInteger(it.answer) && it.answer >= 0 && it.answer < 4 && typeof it.why === 'string' && it.why.length > 0)));
  const num = s => { const m = s.replace(/<[^>]*>/g, '').replace(/−/g, '-').match(/[-+]?\d+(?:\.\d+)?/); return { v: parseFloat(m[0]), dp: (m[0].split('.')[1] || '').length }; };
  const keyed = (pg, i, want, name) => {
    const it = PRACTICE[pg][i], cs = it.choices.map(num), k = cs[it.answer];
    const okKey = Math.abs(k.v - want) <= 0.5 * 10 ** -k.dp * (1 + 1e-9);
    const okOthers = cs.every((c, j) => j === it.answer || Math.abs(c.v - want) > 0.02 * Math.max(Math.abs(want), Math.abs(c.v)));
    check(`practice ${pg}.${i + 1}: ${name}`, okKey && okOthers, `want ${+want.toPrecision(5)}, keyed ${it.choices[it.answer].replace(/<[^>]*>/g, '')}${okOthers ? '' : ', a distractor is within 2%'}`);
  };
  const keyedText = (pg, i, want, name) => check(`practice ${pg}.${i + 1}: ${name}`, PRACTICE[pg][i].choices[PRACTICE[pg][i].answer].includes(want), want);
  const xyzOf = k => parse(M.XYZ[k]).map(a => a.slice(1));
  // 0: count the domains from the electron bookkeeping; 3 equal pairs relaxed with no symmetry
  { const valence = 6, bondE = 2, lonePairs = (valence - bondE) / 2; keyed(0, 0, bondE + lonePairs, 'O domains = bonds + (6 − 2)/2 lone pairs'); }
  { const P = relax([1, 1, 1], 21); keyed(0, 1, ang(P[0], P[1]), '3 pairs: relaxed angle'); }
  // 1: cos from the cube corners; the angle from four relaxed points
  keyed(1, 0, dot([1, 1, 1], [1, -1, -1]) / 3, 'cos θ from the dot product');
  { const P = relax([1, 1, 1, 1], 31); keyed(1, 1, ang(P[0], P[1]), 'tetrahedral angle from relaxed points'); }
  // 2, 4: H···H straight from the coordinates; 3: height from the coordinates' centroid
  { const A = xyzOf('CH4'); keyed(2, 0, norm(minus(A[1], A[2])), 'CH4 H···H from the XYZ'); }
  keyedText(3, 0, 'trigonal pyramidal', 'shape named from the atoms');
  { const A = xyzOf('NH3'); const cen = [0, 1, 2].map(a => (A[1][a] + A[2][a] + A[3][a]) / 3); keyed(3, 1, norm(minus(A[0], cen)), 'N above the H₃ plane, centroid of the XYZ'); }
  keyedText(4, 0, 'CH₄ &gt; NH₃ &gt; H₂O', 'ordering');
  { const A = xyzOf('H2O'); keyed(4, 1, norm(minus(A[1], A[2])), 'H2O H···H from the XYZ'); }
  // 5: the relaxed (unconstrained) water at Q_LONE
  keyedText(5, 0, 'held by one nucleus', 'lone pair held by one nucleus');
  keyed(5, 1, relaxedBond(2, 2, M.Q_LONE, 9)[0], 'H2O predicted by the relaxed toy model');
  // 6: bond lengths read from the XYZ
  { const rc = norm(xyzOf('CH4')[1]), ro = norm(minus(xyzOf('H2O')[1], xyzOf('H2O')[0])); keyed(6, 0, 100 * (rc - ro) / rc, 'O–H shorter than C–H, from the XYZ'); }
  // 7: H2S predicted by the relaxed model, minus the angle measured from NIST's cartesians
  { const P = NIST.H2S, a = ang(minus(P[1], P[0]), minus(P[2], P[0])); keyed(7, 0, relaxedBond(2, 2, M.Q_LONE, 13)[0] - a, 'H2S overestimate: relaxed model − NIST cartesians'); }
  keyedText(7, 1, 'not their exact sizes', 'VSEPR orders angles, does not size them');
}

C.report();
