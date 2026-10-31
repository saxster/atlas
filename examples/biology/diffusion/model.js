// Passive diffusion across a cell membrane with open channels. Pure functions of (n, channels, D, seed, t).
// Every molecule's position, the inside/outside counts, Fick's net flux and the 1D random-walk spread come from here.
//
// Each molecule starts outside the cell (x < 0) and jiggles by thermal motion (diffusivity D). Whenever its random walk
// hits one of the membrane's open channels, it slips through to the other side, with per-second rate k = K0 · channels · D
// either way. Because each molecule is equally likely to cross in or out once it hits a pore, the net flow is proportional
// to the difference (N_out − N_in), and the two sides approach a 50 : 50 dynamic balance where crossings continue both ways.
import { rng } from '@saxster/atlas/rng.js';

export const L = 2.4, H = 1.6, W = 0.9;           // half-width (x), height (y) and depth (z) of the chamber, world units
export const DURATION = 8.0, DT = 0.25, STEPS = Math.round(DURATION / DT);
export const K0 = 0.045;                          // crossing rate per channel at D = 1 (s⁻¹)

// per-molecule crossing rate (s⁻¹), and the exact probability a molecule starting outside is inside at time t
export const rate = (channels, D) => K0 * channels * D;
export const pIn = (channels, D, t) => 0.5 * (1 - Math.exp(-2 * rate(channels, D) * Math.max(0, t)));
export const expectedIn = (n, channels, D, t) => n * pIn(channels, D, t);
export const expectedOut = (n, channels, D, t) => n - expectedIn(n, channels, D, t);
// Fick's first law for the membrane: dN_in/dt = k · (N_out − N_in) = n · k · e^(−2kt)
export const netFlux = (n, channels, D, t) => n * rate(channels, D) * Math.exp(-2 * rate(channels, D) * Math.max(0, t));
// half-equilibration time: when the gap N_out − N_in has halved (ln 2 / (2k))
export const halfTime = (channels, D) => Math.log(2) / (2 * rate(channels, D));
// Einstein–Smoluchowski 1D mean squared displacement along an unbounded axis: ⟨Δx²⟩ = 2Dt
export const theoryMSD = (D, t) => 2 * D * Math.max(0, t);

// y-positions of the open protein channels along the membrane
export const poreY = (channels, j) => ((j + 0.5) / channels - 0.5) * (H * 0.82);

// a seeded 1D free random walk of n particles over t seconds, to check ⟨Δx²⟩ = 2Dt and the bell shape
export function freeWalk({ n = 2000, D = 1, t = 4, steps = 80, seed = 1 }) {
  const g = rng(seed), sd = Math.sqrt(2 * D * (t / steps));
  return Array.from({ length: n }, () => {
    let x = 0;
    for (let s = 0; s < steps; s++) x += g.normal() * sd;
    return x;
  });
}

// the full chamber experiment: each molecule's waypoints at 0, DT, 2·DT, … DURATION, and which side it sits on
export function run({ n = 200, channels = 4, D = 1.0, seed = 1 }) {
  const g = rng(seed), k = rate(channels, D), pFlip = 0.5 * (1 - Math.exp(-2 * k * DT));
  const stepSpan = Math.min(0.55, 0.28 * Math.sqrt(D));
  const bounce = (v, lo, hi) => {
    let u = v;
    while (u < lo || u > hi) u = u < lo ? 2 * lo - u : 2 * hi - u;
    return u;
  };
  const tracks = Array.from({ length: n }, () => {
    let side = -1;                                // -1 = outside (left), +1 = inside (right)
    let x = -0.28 - g.next() * (L - 0.46), y = (g.next() - 0.5) * (H * 0.84), z = (g.next() - 0.5) * (W * 0.76);
    const pts = [{ x, y, z, side, crossed: false, py: y }];
    for (let s = 1; s <= STEPS; s++) {
      const cross = g.next() < pFlip;
      const py = poreY(channels, Math.floor(g.next() * channels));
      if (cross) {
        side = -side;
        x = side * (0.24 + g.next() * 0.72);
        y = bounce(py + g.normal() * 0.14, -H * 0.43, H * 0.43);
      } else {
        const lo = side < 0 ? -L + 0.16 : 0.22, hi = side < 0 ? -0.22 : L - 0.16;
        x = bounce(x + g.normal() * stepSpan, lo, hi);
        y = bounce(y + g.normal() * stepSpan * 0.7, -H * 0.43, H * 0.43);
      }
      z = bounce(z + g.normal() * stepSpan * 0.5, -W * 0.38, W * 0.38);
      pts.push({ x, y, z, side, crossed: cross, py });
    }
    return pts;
  });
  // counts inside and crossings at each step, for the chart and chips
  const series = Array.from({ length: STEPS + 1 }, (_, s) => {
    let inside = 0, outToIn = 0, inToOut = 0;
    for (let i = 0; i < n; i++) {
      if (tracks[i][s].side > 0) inside++;
      if (s > 0 && tracks[i][s].crossed) { if (tracks[i][s].side > 0) outToIn++; else inToOut++; }
    }
    return { t: s * DT, inside, outside: n - inside, outToIn, inToOut };
  });
  return { n, channels, D, seed, tracks, series };
}

// smooth position of molecule i at time t; when crossing a pore during step s, its midpoint passes through (0, py, 0)
export function moleculeAt(e, i, t) {
  const clamped = Math.min(Math.max(t, 0), DURATION), s = Math.min(Math.floor(clamped / DT), STEPS - 1);
  const u = (clamped - s * DT) / DT, u2 = u * u * (3 - 2 * u);
  const A = e.tracks[i][s], B = e.tracks[i][s + 1];
  if (!B.crossed) return { x: A.x + (B.x - A.x) * u2, y: A.y + (B.y - A.y) * u2, z: A.z + (B.z - A.z) * u2, side: A.side };
  // two-leg spline through the channel pore at u = 0.5
  if (u < 0.5) {
    const v = u * 2, v2 = v * v * (3 - 2 * v);
    return { x: A.x * (1 - v2), y: A.y + (B.py - A.y) * v2, z: A.z * (1 - v2), side: A.side };
  }
  const v = (u - 0.5) * 2, v2 = v * v * (3 - 2 * v);
  return { x: B.x * v2, y: B.py + (B.y - B.py) * v2, z: B.z * v2, side: B.side };
}

// snapshot at time t: counts on each side, plus recent two-way traffic through the pores
export function snapshot(e, t) {
  const clamped = Math.min(Math.max(t, 0), DURATION);
  let inside = 0;
  const pos = Array.from({ length: e.n }, (_, i) => {
    const p = moleculeAt(e, i, clamped);
    if (p.x > 0) inside++;
    return p;
  });
  const stepIdx = Math.min(Math.round(clamped / DT), STEPS);
  // crossings over the last 4 steps (1 second) so the reader sees traffic continuing both ways at equilibrium
  const s0 = Math.max(1, stepIdx - 3);
  let inFlow = 0, outFlow = 0;
  for (let s = s0; s <= stepIdx; s++) { inFlow += e.series[s].outToIn; outFlow += e.series[s].inToOut; }
  return { t: clamped, pos, inside, outside: e.n - inside, inFlow, outFlow, stepIdx };
}
