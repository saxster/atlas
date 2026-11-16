// Pure physical model of a brushed permanent-magnet DC motor (zero DOM, zero three.js).
// Answers: "Why doesn't a DC motor get stuck halfway?"
// Uses solveNetwork (MNA armature power balance) and quantileSeeds (equal-flux magnetic field lines).
import { solveNetwork, quantileSeeds } from '@saxster/atlas/solvers.js';

export const COIL = {
  turns: 12,
  area: 0.085,      // m^2 effective loop area
  R: 2.0,           // Ω armature + brush resistance
  J: 0.055,         // kg·m^2 rotor moment of inertia (readable ~60 rpm visual cadence)
  damping: 0.085,   // N·m·s/rad brush + bearing damping (settles slip-ring trap cleanly at π/2)
  gapDeadRad: 0.09, // rad half-width of split-ring brush insulator gap around θ = ±π/2
};

// Air-gap flux density B(gap) in Tesla as magnets slide on the 1D bench rail (gap in [0.8, 2.0]).
export function fieldStrength(gap = 1.15) {
  const g = Math.max(0.75, Math.min(2.2, gap));
  return 0.68 / (g ** 1.15);
}

// Flux linkage Φ(θ) = N * B * A * sin(θ) (zero when coil plane is parallel to B at θ = 0; max at θ = π/2).
export function fluxLinkage(theta, gap = 1.15) {
  return COIL.turns * fieldStrength(gap) * COIL.area * Math.sin(theta);
}

// Split-ring commutator polarity switch s(θ):
//   commutator === 1 (split ring): flips polarity every half-turn at θ = π/2, 3π/2 with narrow insulator dead-zone
//   commutator === 0 (solid slip rings): never flips (+1), so torque reverses past 90° and traps the rotor!
export function commutatorSign(theta, commutator = 1) {
  if (!commutator) return 1;
  const c = Math.cos(theta);
  if (Math.abs(c) < Math.sin(COIL.gapDeadRad)) return 0;
  return c >= 0 ? 1 : -1;
}

// Instantaneous armature circuit & electromagnetic torque via MNA solveNetwork:
// Node 1 = supply V+, Node 2 = back-EMF internal node, Node 0 = ground.
export function motorInstant(theta, omega, { V = 6, gap = 1.15, commutator = 1 } = {}) {
  const B = fieldStrength(gap);
  const sw = commutatorSign(theta, commutator);
  // Geometric torque/EMF factor k(θ) = N * B * A * cos(θ) * sw(θ)
  const kTheta = sw === 0 ? 0 : COIL.turns * B * COIL.area * Math.cos(theta) * sw;
  const backEmf = kTheta * omega;

  if (sw === 0) {
    return {
      B, sw: 0, kTheta: 0, backEmf: 0, current: 0, torque: 0,
      pSupply: 0, pCopper: 0, pMech: 0, kclResidual: 0,
    };
  }

  const net = solveNetwork(2, [
    { type: 'V', from: 1, to: 0, V },
    { type: 'R', from: 1, to: 2, R: COIL.R },
    { type: 'V', from: 2, to: 0, V: backEmf },
  ], { gmin: 1e-12 });

  const current = net.flows[1]; // current from supply (1) through R into armature (2)
  const torque = kTheta * current;
  const pSupply = -net.powers[0]; // power delivered by battery V
  const pCopper = net.powers[1];  // I^2 * R dissipated in winding
  const pMech = net.powers[2];    // E_back * I converted to mechanical work (equals torque * omega)

  return {
    B, sw, kTheta, backEmf, current, torque,
    pSupply, pCopper, pMech, kclResidual: net.maxKclResidual,
  };
}

// Static stall torque curve τ(θ) at ω = 0 for the 2D companion plot (θ in [0, 2π]).
export function stallTorqueAt(theta, params = {}) {
  return motorInstant(theta, 0, params).torque;
}

// Equal-flux vertical seed heights y in [-0.72, 0.72] across the stator pole window using quantileSeeds.
export function fluxSeeds(gap = 1.15, count = 5) {
  const g = Math.max(0.75, Math.min(2.2, gap));
  // Fringing weakens slightly near top/bottom pole edges as gap widens
  const weight = y => 1 - 0.22 * g * (y / 0.78) ** 2;
  return quantileSeeds(weight, [-0.68, 0.68], count);
}

// Deterministic RK4 integration of rotor angle θ(t) and angular velocity ω(t) from rest at θ_0 = 0.20 rad.
export function simulateMotor(params = {}, duration = 5.0, steps = 500) {
  const { V = 6, gap = 1.15, commutator = 1 } = params;
  const dt = duration / steps;
  const rhs = (th, om) => {
    const inst = motorInstant(th, om, { V, gap, commutator });
    const alpha = (inst.torque - COIL.damping * om) / COIL.J;
    return [om, alpha];
  };
  const traj = new Array(steps + 1);
  let th = 0.20, om = 0;
  for (let i = 0; i <= steps; i++) {
    const t = i * dt;
    const inst = motorInstant(th, om, { V, gap, commutator });
    traj[i] = { t, theta: th, omega: om, rpm: (om * 60) / (2 * Math.PI), ...inst };
    if (i < steps) {
      const [k1x, k1v] = rhs(th, om);
      const [k2x, k2v] = rhs(th + 0.5 * dt * k1x, om + 0.5 * dt * k1v);
      const [k3x, k3v] = rhs(th + 0.5 * dt * k2x, om + 0.5 * dt * k2v);
      const [k4x, k4v] = rhs(th + dt * k3x, om + dt * k3v);
      th += (dt / 6) * (k1x + 2 * k2x + 2 * k3x + k4x);
      om += (dt / 6) * (k1v + 2 * k2v + 2 * k3v + k4v);
    }
  }
  return traj;
}

// Sample trajectory state at arbitrary clock t in [0, DURATION] (order-independent for ?render seek(t)).
export const RUN_DURATION = 5.0;
const cache = new Map();
export function stateAtTime(t, params = {}) {
  const V = +(params.V ?? 6);
  const gap = +(params.gap ?? 1.15);
  const commutator = +(params.commutator ?? 1);
  const stallTheta = params.stallTheta ?? null;
  if (stallTheta !== null && Number.isFinite(stallTheta)) {
    const inst = motorInstant(stallTheta, 0, { V, gap, commutator });
    return { t, T: RUN_DURATION, theta: stallTheta, omega: 0, rpm: 0, stalled: true, ...inst };
  }
  const key = `${V.toFixed(2)}:${gap.toFixed(3)}:${commutator}`;
  let traj = cache.get(key);
  if (!traj) {
    if (cache.size > 24) cache.clear();
    traj = simulateMotor({ V, gap, commutator }, RUN_DURATION, 500);
    cache.set(key, traj);
  }
  const clamped = Math.max(0, Math.min(RUN_DURATION, t));
  const f = (clamped / RUN_DURATION) * (traj.length - 1);
  const i0 = Math.min(traj.length - 2, Math.floor(f));
  const u = f - i0;
  const a = traj[i0], b = traj[i0 + 1];
  const theta = a.theta + (b.theta - a.theta) * u;
  const omega = a.omega + (b.omega - a.omega) * u;
  const inst = motorInstant(theta, omega, { V, gap, commutator });
  return { t: clamped, T: RUN_DURATION, theta, omega, rpm: (omega * 60) / (2 * Math.PI), stalled: false, ...inst };
}
