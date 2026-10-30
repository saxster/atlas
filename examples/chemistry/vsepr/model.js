// VSEPR model: electron pairs (domains) around a central atom spread as far apart as they can, and that sets the
// shape. Pure functions, no DOM. Lengths in ångström (Å), angles in degrees unless a name says radians.
// Every number on the pages, labels, readouts and practice answers comes from here.
//
// Experimental geometries: NIST Computational Chemistry Comparison and Benchmark Database (CCCBDB), Release 22,
// "Experimental data for <molecule>", Geometric Data (internal coordinates), read 2026-10-30:
//   CH4  https://cccbdb.nist.gov/exp2x.asp?casno=74828&charge=0     rCH 1.087 ± 0.001 Å (re, 1979Hir:213); aHCH 109.471° (Td)
//   NH3  https://cccbdb.nist.gov/exp2x.asp?casno=7664417&charge=0   rNH 1.012 Å; aHNH 106.67° (1966Herzberg)
//   H2O  https://cccbdb.nist.gov/exp2x.asp?casno=7732185&charge=0   rOH 0.958 Å (re); aHOH 104.4776 ± 0.0019° (1979Hoy/Bun:1, equilibrium)
//   H2S  https://cccbdb.nist.gov/exp2x.asp?casno=7783064&charge=0   rSH 1.336 Å; aHSH 92.11° (1975Coo/DeL:237, Cook, De Lucia & Helminger,
//                                                                    J. Mol. Struct. 28 (1975) 237, doi:10.1016/0022-2860(75)80094-9)
//   PH3  https://cccbdb.nist.gov/exp2x.asp?casno=7803512&charge=0   rPH 1.421 Å; aHPH 93.3° (1966Herzberg)
//   SiH4 https://cccbdb.nist.gov/exp2x.asp?casno=7803625&charge=0   rSiH 1.480 Å (1955Boyd:922); aHSiH 109.47122° (by symmetry)
// The angles of CH4 and SiH4 are fixed by their tetrahedral symmetry; the others are measured (microwave and
// infrared spectroscopy). The brief's figures (C–H 1.087, N–H 1.012, O–H 0.958 Å; 106.67°, 104.48°, H2S 92.1°) agree.

export const DEG = Math.PI / 180;
export const TET = Math.acos(-1 / 3);          // the tetrahedral angle, radians: arccos(−1/3)
export const TET_DEG = TET / DEG;              // 109.4712…°

// ---------- small vector kit (arrays [x, y, z]) ----------
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const len = a => Math.sqrt(dot(a, a));
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const scale = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
export const unit = a => scale(a, 1 / len(a));
export const angleOf = (a, b) => Math.acos(Math.max(-1, Math.min(1, dot(a, b) / (len(a) * len(b))))) / DEG;

// ---------- the measured molecules ----------
// bonds and lone pairs on the central atom (its electron domains), the measured X–H length and H–X–H angle, the shape
const CC = 'https://cccbdb.nist.gov/exp2x.asp?casno=';
export const MOL = {
  CH4: { name: 'methane', formula: 'CH₄', centre: 'C', bonds: 4, lone: 0, r: 1.087, angle: 109.471, shape: 'tetrahedral', src: CC + '74828&charge=0' },
  NH3: { name: 'ammonia', formula: 'NH₃', centre: 'N', bonds: 3, lone: 1, r: 1.012, angle: 106.67, shape: 'trigonal pyramidal', src: CC + '7664417&charge=0' },
  H2O: { name: 'water', formula: 'H₂O', centre: 'O', bonds: 2, lone: 2, r: 0.958, angle: 104.4776, shape: 'bent', src: CC + '7732185&charge=0' },
  H2S: { name: 'hydrogen sulfide', formula: 'H₂S', centre: 'S', bonds: 2, lone: 2, r: 1.336, angle: 92.11, shape: 'bent', src: CC + '7783064&charge=0' },
  PH3: { name: 'phosphine', formula: 'PH₃', centre: 'P', bonds: 3, lone: 1, r: 1.421, angle: 93.3, shape: 'trigonal pyramidal', src: CC + '7803512&charge=0' },
  SiH4: { name: 'silane', formula: 'SiH₄', centre: 'Si', bonds: 4, lone: 0, r: 1.480, angle: 109.47122, shape: 'tetrahedral', src: CC + '7803625&charge=0' },
};
export const MAIN = ['CH4', 'NH3', 'H2O'];      // the chapter's three: four electron pairs each, 0, 1 and 2 of them lone
export const KIND = { 4: 'AX4', 3: 'AX3E', 2: 'AX2E2' };   // VSEPR's labels: A the centre, X a bonded atom, E a lone pair
export const kindOf = k => KIND[MOL[k].bonds];
// X…H distance across the angle: two bonds of length r at angle θ are 2r sin(θ/2) apart at their ends
export const hh = k => 2 * MOL[k].r * Math.sin(MOL[k].angle * DEG / 2);
// how far the centre sits above the plane of the three H atoms in a pyramid (AX3E): r·cos p, p the bond's tilt
export const pyramidHeight = k => -MOL[k].r * tiltCos(MOL[k].angle);

// ---------- directions of the domains, symmetry axis up (+y) ----------
// Lone pairs point up, bonds down; the H–X–H pair whose angle is labelled faces the reader (+z).
// Three bonds at the same tilt p from the axis, 120° apart round it: cos θ = cos²p − ½ sin²p, so cos²p = (2 cos θ + 1)/3.
export const tiltCos = angle => -Math.sqrt((2 * Math.cos(angle * DEG) + 1) / 3);
const ring = (cp, az) => { const sp = Math.sqrt(1 - cp * cp); return az.map(a => [sp * Math.cos(a * DEG), cp, sp * Math.sin(a * DEG)]); };
// angle: the bond–bond angle; lone: the lone–lone angle (AX2E2 only; lone pairs can't be measured, so it is the model's)
export function domains(kind, angle, lone = 0) {
  if (kind === 'AX4') return { bonds: [[0, 1, 0], ...ring(-1 / 3, [30, 150, 270])], lone: [] };          // one H straight up
  if (kind === 'AX3E') return { bonds: ring(tiltCos(angle), [30, 150, 270]), lone: [[0, 1, 0]] };
  const h = angle * DEG / 2, l = lone * DEG / 2;
  return { bonds: [[-Math.sin(h), -Math.cos(h), 0], [Math.sin(h), -Math.cos(h), 0]], lone: [[0, Math.cos(l), Math.sin(l)], [0, Math.cos(l), -Math.sin(l)]] };
}
// the measured molecule's atoms: [element, x, y, z] in Å, centre at the origin
export function atoms(k) {
  const m = MOL[k], d = domains(kindOf(k), m.angle);
  return [[m.centre, 0, 0, 0], ...d.bonds.map(u => ['H', ...scale(u, m.r)])];
}
// The experimental geometry as XYZ text (count, comment, then "El x y z" in Å), for a 3Dmol.js "see the real molecule"
// view. Built from the CCCBDB bond length and angle above; checks.mjs reads the angles and lengths back out of the text.
const fx = x => (Math.abs(x) < 5e-7 ? 0 : x).toFixed(6);
const xyz = k => { const a = atoms(k); return `${a.length}\n${MOL[k].name}, experimental geometry (NIST CCCBDB)\n` + a.map(([e, x, y, z]) => `${e} ${fx(x)} ${fx(y)} ${fx(z)}`).join('\n'); };
export const XYZ = Object.fromEntries(Object.keys(MOL).map(k => [k, xyz(k)]));

// ---------- the ideal spreads: n domains as far apart as possible on a sphere ----------
export const SPREAD = { 2: 180, 3: 120, 4: TET_DEG };   // a line, a flat triangle, a tetrahedron
export const SPREAD_NAME = { 2: 'linear', 3: 'trigonal planar', 4: 'tetrahedral' };

// ---------- the lone-pair squeeze: a toy model, one number fitted to ammonia ----------
// Put the four domains on a sphere round the centre and let them repel like charges, energy Σ qᵢqⱼ/dᵢⱼ. A bond pair has
// q = 1; a lone pair q = Q_LONE > 1, because it is held by one nucleus and spreads wider near the centre. VSEPR itself
// gives no number for that: Q_LONE is chosen so that NH3 comes out at its measured 106.67°. Everything else (water's
// angle, the lone–lone angle) is then a prediction. checks.mjs re-fits Q_LONE and re-solves the shapes without symmetry.
export const Q_LONE = 1.25168;
const energyOf = (pts, q) => { let e = 0; for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) e += q[i] * q[j] / len(sub(pts[i], pts[j])); return e; };
function golden(f, a, b, n = 90) {
  const g = (Math.sqrt(5) - 1) / 2; let c = b - g * (b - a), d = a + g * (b - a), fc = f(c), fd = f(d);
  for (let i = 0; i < n; i++) { if (fc < fd) { b = d; d = c; fd = fc; c = b - g * (b - a); fc = f(c); } else { a = c; c = d; fc = fd; d = a + g * (b - a); fd = f(d); } }
  return (a + b) / 2;
}
// the lowest-energy shape for a kind, using its symmetry: returns the bond–bond, lone–lone and lone–bond angles (°)
export function squeeze(kind, q = Q_LONE) {
  if (kind === 'AX4') return { bond: TET_DEG, lone: 0, lb: 0 };
  if (kind === 'AX3E') {
    // one free number: the bonds' tilt p from the lone pair's axis
    const pts = p => [[0, 1, 0], ...ring(Math.cos(p), [30, 150, 270])];
    const E = p => energyOf(pts(p), [q, 1, 1, 1]);
    const p = golden(E, Math.PI / 2, Math.PI);
    const P = pts(p);
    return { bond: angleOf(P[1], P[2]), lone: 0, lb: p / DEG };
  }
  // AX2E2: bonds in one plane, lone pairs in the plane at right angles (the C2v symmetry); two free numbers, the half-angles
  const pts = (h, l) => [[0, Math.cos(l), Math.sin(l)], [0, Math.cos(l), -Math.sin(l)], [-Math.sin(h), -Math.cos(h), 0], [Math.sin(h), -Math.cos(h), 0]];
  const E = (h, l) => energyOf(pts(h, l), [q, q, 1, 1]);
  let h = TET / 2, l = TET / 2;
  for (let i = 0; i < 40; i++) { h = golden(x => E(x, l), 0.3, 1.5, 60); l = golden(x => E(h, x), 0.3, 1.5, 60); }
  const P = pts(h, l);
  return { bond: 2 * h / DEG, lone: 2 * l / DEG, lb: angleOf(P[0], P[2]) };
}
// what the toy model predicts for each molecule, and how far off it is
export const PREDICT = Object.fromEntries(Object.keys(MOL).map(k => { const s = squeeze(kindOf(k)); return [k, { ...s, off: s.bond - MOL[k].angle }]; }));

// ---------- the figure's clock ----------
export const ROCK = { amp: 18, period: 14 };          // each molecule rocks ±18° about its axis, every 14 s, so it reads as 3D
export const rock = t => ROCK.amp * Math.sin(2 * Math.PI * t / ROCK.period);
// page 5: the lone pair swells from a bond pair's strength (q = 1) to its fitted strength and back, every SWELL s.
// 8.3 s puts its fullest at the middle of page 1.5's dwell in the ?render tour (t = 29 s), so stills and cards show it.
export const SWELL = 8.3;
export const swellQ = t => 1 + (Q_LONE - 1) * (1 - Math.cos(2 * Math.PI * t / SWELL)) / 2;
