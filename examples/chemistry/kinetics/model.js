// Pure mathematical and stochastic model for Figure C.1: Reversible reaction & half-life (A ⇌ B).
// Covers both dynamic chemical equilibrium (K = k_f / k_r) and irreversible radioactive decay (k_r = 0, N = N₀ e^−λt).
// Zero DOM, zero Three.js imports.
import { rng } from '@saxster/atlas/rng.js';

export const DURATION = 10.0;
export const DT = 0.05;
export const STEPS = Math.round(DURATION / DT);

// Relaxation rate λ = k_f + k_r (s⁻¹)
export function relaxationRate(kf, kr = 0) {
  return kf + kr;
}

// Half-life t_{1/2} = ln 2 / (k_f + k_r); for irreversible decay (k_r = 0), t_{1/2} = ln 2 / k_f
export function halfLife(kf, kr = 0) {
  return Math.LN2 / relaxationRate(kf, kr);
}

// Equilibrium constant K = [B]_eq / [A]_eq = k_f / k_r
export function eqConstant(kf, kr) {
  return kr > 0 ? kf / kr : Infinity;
}

// Equilibrium count of reactant A: N_0 * k_r / (k_f + k_r)
export function eqReactant(n, kf, kr = 0) {
  return (n * kr) / relaxationRate(kf, kr);
}

// Equilibrium count of product B: N_0 * k_f / (k_f + k_r)
export function eqProduct(n, kf, kr = 0) {
  return (n * kf) / relaxationRate(kf, kr);
}

// Exact analytical reactant count N_A(t) solving dN_A/dt = −k_f N_A + k_r (n − N_A) with N_A(0) = n
export function expectedA(n, kf, kr, t) {
  const aEq = eqReactant(n, kf, kr);
  return aEq + (n - aEq) * Math.exp(-relaxationRate(kf, kr) * t);
}

export function expectedB(n, kf, kr, t) {
  return n - expectedA(n, kf, kr, t);
}

// Rate of change dN_A/dt for rk4 verification
export function dAdt(n, kf, kr, nA) {
  return -kf * nA + kr * (n - nA);
}

// Exact continuous-time two-state Markov transition probabilities over step dt
export function stepProbs(kf, kr, dt = DT) {
  const lam = relaxationRate(kf, kr);
  const decay = 1 - Math.exp(-lam * dt);
  return {
    pAB: (kf / lam) * decay,
    pBA: (kr / lam) * decay,
  };
}

// Run seeded stochastic simulation of n molecules in a reaction vessel
export function run({ n = 200, kf = 0.30, kr = 0.15, seed = 1 } = {}) {
  const rand = rng(seed * 131 + n * 17 + Math.round(kf * 1000) * 7 + Math.round(kr * 1000));
  const { pAB, pBA } = stepProbs(kf, kr, DT);

  // Deterministic 3D home coordinates inside a cylindrical vessel (radius 1.15, height 1.8)
  const homes = [];
  for (let i = 0; i < n; i++) {
    const r = 1.05 * Math.sqrt(rand.next());
    const th = rand.next() * Math.PI * 2;
    const y = (rand.next() - 0.5) * 1.55;
    homes.push({
      x: r * Math.cos(th),
      y,
      z: r * Math.sin(th) * 0.75,
      phase: rand.next() * Math.PI * 2,
    });
  }

  const stateB = new Uint8Array(n); // 0 = A (reactant), 1 = B (product)
  const frames = [];
  const series = [];
  let fwdSteps = new Int16Array(STEPS + 1);
  let revSteps = new Int16Array(STEPS + 1);

  for (let s = 0; s <= STEPS; s++) {
    let countB = 0;
    for (let i = 0; i < n; i++) countB += stateB[i];
    const countA = n - countB;
    const t = +(s * DT).toFixed(4);
    frames.push(new Uint8Array(stateB));
    series.push({ t, nA: countA, nB: countB });

    if (s < STEPS) {
      let fCnt = 0, rCnt = 0;
      for (let i = 0; i < n; i++) {
        const u = rand.next();
        if (stateB[i] === 0) {
          if (u < pAB) { stateB[i] = 1; fCnt++; }
        } else {
          if (u < pBA) { stateB[i] = 0; rCnt++; }
        }
      }
      fwdSteps[s + 1] = fCnt;
      revSteps[s + 1] = rCnt;
    }
  }

  return { n, kf, kr, seed, homes, frames, series, fwdSteps, revSteps };
}

export function snapshot(e, t) {
  const clamped = Math.max(0, Math.min(DURATION, t));
  const idx = Math.min(STEPS, Math.round(clamped / DT));
  const win = Math.round(1.0 / DT); // 1-second rolling window for forward/reverse reaction events
  let fwd = 0, rev = 0;
  for (let k = Math.max(1, idx - win + 1); k <= idx; k++) {
    fwd += e.fwdSteps[k];
    rev += e.revSteps[k];
  }
  const row = e.series[idx];
  return {
    stepIdx: idx,
    t: row.t,
    nA: row.nA,
    nB: row.nB,
    stateB: e.frames[idx],
    fwdRate: fwd,
    revRate: rev,
  };
}
