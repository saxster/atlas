// node examples/minimal/teardown/checks.mjs — verifies the four-stroke slider-crank, 2:1 cam timing gear ratio,
// connecting-rod rigid length invariant, TDC/BDC stroke bounds, 2-link IK arm, and numerical derivatives.
import { checks, near, deriv, checkLinkLengths } from '@saxster/atlas/checks.js';
import * as M from './model.js';

const C = checks();

// 1. Connecting-rod length |wrist - pin| = L and crank radius |pin| = R across the full 720° cycle
const samples = Array.from({ length: 73 }, (_, i) => i * (4 / 72));
C.check('rigid links: |pin − O| = R and |wrist − pin| = L across all 720°',
  samples.every(t => {
    const s = M.at(t);
    return checkLinkLengths({ O: [0, 0], pin: s.pin, wrist: s.wrist }, [['O', 'pin', M.R], ['pin', 'wrist', M.L]], 1e-12);
  }));

// 2. Dead centres: s(0) = R + L (TDC), s(1) = L − R (BDC), total stroke = 2R
const s0 = M.at(0), s1 = M.at(1), s2 = M.at(2);
C.check('dead centres: TDC = L + R at 0°/360° and BDC = L − R at 180°, stroke = 2R',
  near(s0.s, M.TDC, 1e-12) && near(s1.s, M.BDC, 1e-12) && near(s2.s, M.TDC, 1e-12) && near(s0.s - s1.s, 2 * M.R, 1e-12));

// 3. Analytical piston velocity ds/dθ and acceleration d²s/dθ² match central-difference derivatives
C.check('analytical v = ds/dθ and a = d²s/dθ² match numerical derivatives',
  [0.25, 0.7, 1.4, 2.3, 3.6].every(t => {
    const st = M.at(t);
    const numV = deriv(c => M.at(c).s, t) / Math.PI;
    const numA = deriv(c => M.at(c).v, t) / Math.PI;
    return near(st.v, numV, 1e-7) && near(st.a, numA, 1e-7);
  }));

// 4. 2:1 camshaft gear reduction: 2 crank revolutions (720°, clock = 4) produce exactly −1 cam revolution (−360°)
const s4 = M.at(4);
C.check('2:1 timing gear train: cam turns −360° for every +720° of the crank',
  near(s4.theta, 4 * Math.PI, 1e-12) && near(s4.camAngle, -2 * Math.PI, 1e-12) && near(s4.camRatio, -0.5, 1e-12));

// 5. Compression ratio and thermodynamic cycle ordering: peak pressure occurs in Power stroke (~14° ATDC)
const pIntake = M.at(0.5).pressure, pCompTDC = M.at(2.0).pressure, pPowerPeak = M.at(2.08).pressure, pExhaust = M.at(3.5).pressure;
C.check('four-stroke pressure cycle: p(Intake) = p(Exhaust) = 1 bar < p(Compression TDC) < p(Power peak)',
  near(pIntake, 1.0, 1e-9) && near(pExhaust, 1.0, 1e-9)
  && near(M.at(1).volRatio, M.COMP_RATIO, 1e-12) && near(M.at(2).volRatio, 1.0, 1e-12)
  && pCompTDC > 15 && pPowerPeak > pCompTDC * 2);

// 6. 2-link inverse-kinematics inspection arm preserves ARM_L1 and ARM_L2 and reaches target
const ikTargets = [[-0.52, 0.68], [-0.45, 0.45], [-0.60, 0.78]];
C.check('2-link IK arm: preserves link lengths ARM_L1, ARM_L2 and reaches every target',
  ikTargets.every(tgt => {
    const arm = M.solveArm(tgt);
    return arm.reachable
      && checkLinkLengths({ base: arm.base, elbow: arm.elbow, tip: arm.tip }, [['base', 'elbow', M.ARM_L1], ['elbow', 'tip', M.ARM_L2]], 1e-12)
      && near(arm.tip[0], tgt[0], 1e-12) && near(arm.tip[1], tgt[1], 1e-12);
  }));

C.report();
