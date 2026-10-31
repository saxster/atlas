// Chapter 2 of the Atlas of Chemistry: Atomic orbitals (hydrogen-like wavefunctions ψ_{n,ℓ,m},
// probability density |ψ|², radial distribution P(r) = r² [R_{nℓ}(r)]², and nodal surfaces).
// Lengths in Bohr radii a₀ = 1 (0.529 177 Å). Pure maths — no DOM, no Three.js.
import { rng } from '@saxster/atlas/rng.js';

export const A0_ANGSTROM = 0.529177; // 1 Bohr radius in ångströms
export const RYDBERG_EV = 13.6057;   // hydrogen ground-state binding energy (eV)

// Exact normalized hydrogen radial wavefunctions R_{nℓ}(r) in atomic units (a₀ = 1),
// normalized so ∫₀^∞ r² [R_{nℓ}(r)]² dr = 1.
export const R1s = r => 2 * Math.exp(-r);
export const R2s = r => (1 / Math.SQRT2) * (1 - 0.5 * r) * Math.exp(-0.5 * r);
export const R2p = r => (1 / (2 * Math.sqrt(6))) * r * Math.exp(-0.5 * r);
export const R3d = r => (4 / (81 * Math.sqrt(30))) * r * r * Math.exp(-r / 3);

export const RADIAL_R = {
  '1s': R1s,
  '2s': R2s,
  '2p': R2p,
  '3d': R3d,
};

// Radial probability distribution P_{nℓ}(r) = r² [R_{nℓ}(r)]² = 4π r² |ψ_{ns}|²
// Normalized so ∫₀^∞ P_{nℓ}(r) dr = 1.
export const P1s = r => { const R = R1s(r); return r * r * R * R; };
export const P2s = r => { const R = R2s(r); return r * r * R * R; };
export const P2p = r => { const R = R2p(r); return r * r * R * R; };
export const P3d = r => { const R = R3d(r); return r * r * R * R; };

export const RADIAL_P = {
  '1s': P1s,
  '2s': P2s,
  '2p': P2p,
  '3d': P3d,
};

// Volume probability density |ψ_{1s}(r)|² = R_{1s}(r)² / (4π) = (1/π) e^(−2r)
export const psi1sSq = r => Math.exp(-2 * r) / Math.PI;
// Scaled 4π |ψ_{1s}(r)|² = 4 e^(−2r) for direct visual comparison against shell area r² and P_{1s}(r)
export const density1sScaled = r => 4 * Math.exp(-2 * r);
export const shellAreaScaled = r => r * r;

// Exact node counts from quantum numbers (n, ℓ)
export const radialNodes = (n, l) => n - l - 1;
export const angularNodes = l => l;
export const totalNodes = n => n - 1;
export const energyEv = n => -RYDBERG_EV / (n * n);

// Key orbital metadata
export const ORBITALS = {
  '1s': { n: 1, l: 0, label: '1s', subshell: 's', rPeak: 1.0, rNode: null, rMean: 1.5 },
  '2s': { n: 2, l: 0, label: '2s', subshell: 's', rPeak: 3 + Math.sqrt(5), rInnerPeak: 3 - Math.sqrt(5), rNode: 2.0, rMean: 6.0 },
  '2p': { n: 2, l: 1, label: '2p', subshell: 'p', rPeak: 4.0, rNode: null, rMean: 5.0 },
  '3d': { n: 3, l: 2, label: '3d', subshell: 'd', rPeak: 9.0, rNode: null, rMean: 10.5 },
};

// Real angular factors Y(ux, uy, uz) for unit direction vector (ux, uy, uz) = (x/r, y/r, z/r),
// normalized so ∬ Y² dΩ = 1.
const INV_SQRT_4PI = 1 / Math.sqrt(4 * Math.PI);
export function angularY(kind, ux, uy, uz) {
  switch (kind) {
    case '1s':
    case '2s':
      return INV_SQRT_4PI;
    case '2pz':
      return Math.sqrt(3) * INV_SQRT_4PI * uz;
    case '2px':
      return Math.sqrt(3) * INV_SQRT_4PI * ux;
    case '2py':
      return Math.sqrt(3) * INV_SQRT_4PI * uy;
    case '3dxz':
      return Math.sqrt(15) * INV_SQRT_4PI * ux * uz;
    case '3dx2-y2':
      return 0.5 * Math.sqrt(15) * INV_SQRT_4PI * (ux * ux - uy * uy);
    case '3dz2':
      return 0.5 * Math.sqrt(5) * INV_SQRT_4PI * (3 * uz * uz - 1);
    default:
      return INV_SQRT_4PI;
  }
}

// Full 3D hydrogen wavefunction ψ(x, y, z) in atomic units (a₀ = 1)
export function psi3D(kind, x, y, z) {
  const r = Math.hypot(x, y, z);
  const ux = r > 1e-12 ? x / r : 0;
  const uy = r > 1e-12 ? y / r : 0;
  const uz = r > 1e-12 ? z / r : 1;
  const radKey = kind.startsWith('1s') ? '1s'
    : kind.startsWith('2s') ? '2s'
    : kind.startsWith('2p') ? '2p'
    : '3d';
  return RADIAL_R[radKey](r) * angularY(kind, ux, uy, uz);
}

// Rejection bounds for fast, exact Monte Carlo sampling of r ~ P_{nℓ}(r) and direction ~ Y(Ω)²
const SAMPLE_BOUNDS = {
  '1s':      { rad: '1s', rMax: 5.5,  pMax: P1s(1.0) * 1.02,               y2Max: INV_SQRT_4PI ** 2 * 1.01 },
  '2s':      { rad: '2s', rMax: 11.5, pMax: P2s(3 + Math.sqrt(5)) * 1.02,  y2Max: INV_SQRT_4PI ** 2 * 1.01 },
  '2px':     { rad: '2p', rMax: 11.5, pMax: P2p(4.0) * 1.02,               y2Max: 3 * INV_SQRT_4PI ** 2 * 1.01 },
  '2py':     { rad: '2p', rMax: 11.5, pMax: P2p(4.0) * 1.02,               y2Max: 3 * INV_SQRT_4PI ** 2 * 1.01 },
  '2pz':     { rad: '2p', rMax: 11.5, pMax: P2p(4.0) * 1.02,               y2Max: 3 * INV_SQRT_4PI ** 2 * 1.01 },
  '3dxz':    { rad: '3d', rMax: 19.5, pMax: P3d(9.0) * 1.02,               y2Max: 3.75 * INV_SQRT_4PI ** 2 * 1.02 },
  '3dx2-y2': { rad: '3d', rMax: 19.5, pMax: P3d(9.0) * 1.02,               y2Max: 3.75 * INV_SQRT_4PI ** 2 * 1.02 },
  '3dz2':    { rad: '3d', rMax: 19.5, pMax: P3d(9.0) * 1.02,               y2Max: 5.0 * INV_SQRT_4PI ** 2 * 1.02 },
};

// Deterministic Monte Carlo point-cloud sampler weighted by |ψ(x,y,z)|² = P_{nℓ}(r)/(4π r²) · |Y(θ,φ)|² · 4π r² dr dΩ/(4π)
// Returns points in Bohr radii a₀ (plus scaled world coordinates when scale is given), tagged by wavefunction phase sign (+1 blue, −1 red).
export function sampleOrbital(kind, count = 240, seed = 42, { scale = 1.0, halfCut = false } = {}) {
  const cfg = SAMPLE_BOUNDS[kind] || SAMPLE_BOUNDS['1s'];
  const R = rng(seed);
  const Pfn = RADIAL_P[cfg.rad];
  const Rfn = RADIAL_R[cfg.rad];
  const pos = [], neg = [], all = [];

  const unif = (lo, hi) => lo + (hi - lo) * R.next();

  while (all.length < count) {
    // 1. Sample radius r from P_{nℓ}(r) via rejection
    const r = unif(0.02, cfg.rMax);
    if (unif(0, cfg.pMax) > Pfn(r)) continue;

    // 2. Sample isotropic unit direction (ux, uy, uz) and accept with probability proportional to Y(ux,uy,uz)²
    const uz = unif(-1, 1);
    const phi = unif(0, 2 * Math.PI);
    const sinT = Math.sqrt(Math.max(0, 1 - uz * uz));
    let ux = sinT * Math.cos(phi);
    let uy = sinT * Math.sin(phi);

    // Optional cutaway front hemisphere (z > 0.15 and x > -0.15) to expose the inner core of 2s
    if (halfCut && uz > 0.12 && ux > -0.15) continue;

    const Y = angularY(kind, ux, uy, uz);
    if (unif(0, cfg.y2Max) > Y * Y) continue;

    const amp = Rfn(r) * Y;
    const sign = amp >= 0 ? 1 : -1;
    const pt = {
      x: r * ux * scale,
      y: r * uz * scale, // map quantum z-axis to world +y (upright)
      z: r * uy * scale,
      r,
      sign,
    };
    all.push(pt);
    if (sign >= 0) pos.push(pt);
    else neg.push(pt);
  }
  return { pos, neg, all };
}

// Smooth animation helpers for the chapter clock
export const rSweep1s = t => 1.0 + 0.85 * Math.sin(0.65 * t); // sweeps r in [0.15, 1.85] around peak r = 1.0 a₀
export const rSweep2s = t => 3.2 + 2.5 * Math.sin(0.55 * t);  // sweeps r in [0.7, 5.7] across inner peak, node r=2, outer peak
export const zSweep2p = t => 2.2 * Math.sin(0.6 * t);         // sweeps z across nodal plane z = 0
