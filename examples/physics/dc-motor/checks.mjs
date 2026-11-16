import { checks, near, deriv } from '@saxster/atlas/checks.js';
import {
  COIL, fieldStrength, fluxLinkage, commutatorSign, motorInstant,
  stallTorqueAt, fluxSeeds, simulateMotor, stateAtTime,
} from './model.js';

const C = checks();

// 1. Split-ring rectification vs unswitched slip-ring torque reversal
{
  const split0 = stallTorqueAt(0, { V: 6, gap: 1.15, commutator: 1 });
  const splitPi = stallTorqueAt(Math.PI, { V: 6, gap: 1.15, commutator: 1 });
  const slip0 = stallTorqueAt(0, { V: 6, gap: 1.15, commutator: 0 });
  const slipPi = stallTorqueAt(Math.PI, { V: 6, gap: 1.15, commutator: 0 });
  const deadZone = stallTorqueAt(Math.PI / 2, { V: 6, gap: 1.15, commutator: 1 });
  C.check('split-ring commutator rectifies torque (τ(π) = +τ(0) > 0) while slip rings reverse sign (τ(π) = −τ(0))',
    split0 > 0.5 && near(splitPi, split0, 1e-12) && near(slipPi, -slip0, 1e-12) && deadZone === 0);
}

// 2. Faraday dΦ/dθ = N B A cos(θ) matches analytical kTheta and solveNetwork conserves power (P_supply = P_copper + P_mech)
{
  const angles = [0.25, 0.8, 2.2, 4.1];
  const faradayOk = angles.every(th => {
    const dPhi = deriv(a => fluxLinkage(a, 1.15), th);
    const sw = commutatorSign(th, 1);
    const inst = motorInstant(th, 8.5, { V: 8, gap: 1.15, commutator: 1 });
    return near(dPhi * sw, inst.kTheta, 1e-7)
      && near(inst.pSupply, inst.pCopper + inst.pMech, 1e-9)
      && near(inst.pMech, inst.torque * 8.5, 1e-9)
      && inst.kclResidual < 1e-10;
  });
  C.check('Faraday dΦ/dθ matches motor k(θ) and MNA solveNetwork conserves P_supply = I²R + τ·ω', faradayOk);
}

// 3. Dynamic RK4 verification: split-ring spins continuously (> 2 turns), while unswitched slip rings trap at θ = π/2
{
  const spinTraj = simulateMotor({ V: 6, gap: 1.15, commutator: 1 }, 5.0, 500);
  const trapTraj = simulateMotor({ V: 6, gap: 1.15, commutator: 0 }, 5.0, 500);
  const spinEnd = spinTraj.at(-1);
  const trapEnd = trapTraj.at(-1);
  C.check('dynamic RK4: split-ring motor accelerates past dead zones (> 2 full turns), while slip-ring motor traps at θ ≈ π/2',
    spinEnd.theta > 4 * Math.PI && spinEnd.omega > 4
    && near(trapEnd.theta, Math.PI / 2, 0.06) && Math.abs(trapEnd.omega) < 0.25,
    `split θ=${spinEnd.theta.toFixed(2)} rad, slip θ=${trapEnd.theta.toFixed(2)} rad`);
}

// 4. Air-gap rail & equal-flux quantileSeeds + hold-to-stall stateAtTime
{
  const seedsTight = fluxSeeds(0.85, 5);
  const seedsWide = fluxSeeds(2.0, 5);
  const stalled = stateAtTime(2.5, { V: 6, gap: 1.0, commutator: 1, stallTheta: 0 });
  C.check('narrower magnet air-gap increases B(gap), quantileSeeds stays symmetric, and stall probe yields I = V/R at ω = 0',
    fieldStrength(0.85) > fieldStrength(2.0) * 2
    && seedsTight.length === 5 && near(seedsTight[2], 0, 1e-3) && near(seedsTight[0], -seedsTight[4], 1e-3)
    && seedsWide[4] < seedsTight[4]
    && stalled.stalled && near(stalled.current, 6 / COIL.R, 1e-9));
}

C.report();
