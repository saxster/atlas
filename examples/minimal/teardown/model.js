// Four-stroke single-cylinder mechanism: a crank of radius R and connecting rod of length L drive a piston along +y,
// while a 14:28 spur gear pair drives the overhead camshaft at exactly −½ crank speed (one cam revolution per two
// crank revolutions = 720°), and a 2-link inverse-kinematics inspection arm tracks any dragged target point.
// Pure functions on kinematics.js; no DOM or Three.js.
import { sliderCrank, gearRatio, rackPinion, twoLinkIK } from '@saxster/atlas/kinematics.js';

export const R = 0.32;                 // crank radius (m, scaled 8× for table-top view)
export const L = 0.96;                 // connecting-rod length (L/R = 3)
export const TEETH_CRANK = 14;         // crankshaft timing pinion teeth
export const TEETH_CAM = 28;           // camshaft gear teeth (2:1 reduction)
export const MODULE = 0.032;           // gear module -> r_crank = 0.224, r_cam = 0.448
export const R_CRANK = 0.5 * MODULE * TEETH_CRANK;
export const R_CAM = 0.5 * MODULE * TEETH_CAM;
export const CAM_X = R_CRANK + R_CAM;
export const RACK_Y = -R_CRANK - 0.06;
export const RACK_SPAN = 0.6;
export const CAM_PHASE_OFFSET = Math.PI / TEETH_CAM;

export const CRANK_RPM = 600;          // 10 rev/s in real life (1 four-stroke cycle = 0.2 s)
export const CYCLE_REAL_S = 0.2;       // 2 revolutions at 600 rpm = 0.2 real seconds
export const COMP_RATIO = 8.5;         // geometric compression ratio V_max / V_min
export const GAMMA = 1.35;             // polytropic exponent for air-fuel mixture
export const PEAK_MULT = 4.2;          // combustion pressure multiplier over adiabatic compression
export const COMP_BAR = Math.round(COMP_RATIO ** GAMMA);
export const PEAK_BAR = Math.round(COMP_RATIO ** GAMMA * PEAK_MULT * 0.75);

export const TDC = R + L;              // top dead centre piston height = 1.28
export const BDC = L - R;              // bottom dead centre piston height = 0.64
export const STROKE = 2 * R;           // 0.64
export const CLEARANCE = STROKE / (COMP_RATIO - 1);

// 2-link inverse-kinematics timing/inspection arm on the left of the cylinder block
export const ARM_BASE = [-0.96, 0.05];
export const ARM_L1 = 0.48;
export const ARM_L2 = 0.44;
export const ARM_HOME = [-0.52, 0.68];

export function solveArm(target = ARM_HOME) {
  const ik = twoLinkIK(ARM_BASE, target, ARM_L1, ARM_L2, 1);
  return { base: ARM_BASE, elbow: ik.elbowPt, tip: ik.endPt, th1: ik.th1, th2: ik.th2, reachable: ik.reachable };
}

const STROKES = ['Intake', 'Compression', 'Power', 'Exhaust'];

// One model second = one half-revolution (180° = π rad) of the crank, so 4 model seconds = 720° full 4-stroke cycle.
export function at(clock = 0, armTarget = null) {
  const c = Math.max(0, clock);
  const theta = c * Math.PI;           // crank angle (rad), 0 at TDC
  const deg = ((theta * 180 / Math.PI) % 720 + 720) % 720;
  const strokeIdx = Math.min(3, Math.floor((deg + 1e-6) / 180));
  const strokeName = STROKES[strokeIdx];

  // Slider-crank along +y: sliderCrank measures s along +x from θ=0, so map (x_sc, y_sc) -> (y_sc, x_sc)
  const sc = sliderCrank(theta, R, L);
  const pin = [R * Math.sin(theta), R * Math.cos(theta)];
  const wrist = [0, sc.s];

  // 2:1 timing gear train and indicator rack
  const cam = gearRatio(theta, TEETH_CRANK, TEETH_CAM, { module: MODULE });
  const rack = rackPinion({ module: MODULE, teeth: TEETH_CRANK, angle: theta });
  const rackX = (rack.stroke % RACK_SPAN) - RACK_SPAN * 0.5;

  // Intake valve lift (smooth raised-cosine lobe during 0°..180° intake stroke)
  const intakePhase = deg <= 180 ? (deg / 180) * Math.PI : 0;
  const valveLift = deg <= 180 ? 0.16 * Math.sin(intakePhase) ** 2 : 0;

  // Polytropic cylinder pressure (bar): atmospheric (1.0 bar) during intake/exhaust, adiabatic compression + combustion peak
  const volRatio = (CLEARANCE + (TDC - sc.s)) / CLEARANCE;   // 1 at TDC, COMP_RATIO at BDC
  let pressure = 1.0;
  if (deg > 180 && deg <= 360) {
    pressure = (COMP_RATIO ** GAMMA) / (volRatio ** GAMMA);
  } else if (deg > 360 && deg <= 540) {
    const burn = Math.sin(Math.min(1, (deg - 360) / 18) * (Math.PI / 2));
    const peakMultiplier = 1 + (PEAK_MULT - 1) * burn;
    pressure = (COMP_RATIO ** GAMMA * peakMultiplier) / (volRatio ** GAMMA);
  }

  // Default arm target tracks wrist height unless the reader drags the 3D IK handle
  const defaultTarget = [-0.48, 0.35 + (sc.s - BDC) * 0.65];
  const arm = solveArm(armTarget || defaultTarget);

  return {
    clock: c,
    theta,
    deg,
    strokeIdx,
    strokeName,
    s: sc.s,
    v: sc.v,
    a: sc.a,
    phi: sc.phi,
    pin,
    wrist,
    camAngle: cam.angle,
    camRatio: cam.ratio,
    rackStroke: rack.stroke,
    rackX,
    valveLift,
    volRatio,
    pressure,
    arm,
  };
}
