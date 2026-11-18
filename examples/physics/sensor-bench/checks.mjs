import { checks, near, deriv } from '@saxster/atlas/checks.js';
import {
  V_ZERO_C, T_KELVIN_ZERO, V_REF, soundSpeed, echoTimeUs, measuredDistanceCm, stateAtTime,
} from './model.js';

const C = checks();

// 1. Exact 0 °C anchor and analytical dv/dT = v0 / (2 * 273.15 * sqrt(1 + T/273.15)) against numerical derivative
C.check(
  'soundSpeed: v(0 °C) = 331.3 m/s and dv/dT matches analytical ideal-gas acoustic derivative',
  near(soundSpeed(0), V_ZERO_C, 1e-12)
    && [-10, 0, 20, 45].every(T => near(
      deriv(soundSpeed, T),
      V_ZERO_C / (2 * T_KELVIN_ZERO * Math.sqrt(1 + T / T_KELVIN_ZERO)),
      1e-7,
    )),
  `v(20°C)=${soundSpeed(20).toFixed(2)} m/s`,
);

// 2. Round-trip acoustic time-of-flight conservation: v(T) * t_echo / 2 === d across temperatures and ranges
C.check(
  'echoTimeUs: round-trip acoustic distance (v * t_echo / 2) recovers true target distance across all temperatures',
  [25, 60, 95].every(cm => [-10, 20, 45].every(T => near(
    (soundSpeed(T) * echoTimeUs(cm, T) * 1e-6) / 2,
    cm / 100,
    1e-11,
  ))),
);

// 3. Uncompensated hot-air bias vs compensated exactness
const hotUncomp = stateAtTime(0.82 * 1.7, { distCm: 60, tempC: 45, comp: 0, stopCm: 35 });
const hotComp = stateAtTime(0.82 * 1.7, { distCm: 60, tempC: 45, comp: 1, stopCm: 35 });
const coldUncomp = stateAtTime(0.82 * 1.7, { distCm: 60, tempC: -5, comp: 0, stopCm: 35 });
C.check(
  'measuredDistanceCm: hot 45 °C air returns echo early so uncompensated 343.2 m/s sketch under-reads (< 58 cm), while compensation recovers 60.0 cm',
  hotUncomp.shownCm < 58.0 && near(hotUncomp.shownCm, 60 * (V_REF / soundSpeed(45)), 1e-9)
    && near(hotComp.shownCm, 60, 1e-9)
    && coldUncomp.shownCm > 62.5,
  `45°C uncomp=${hotUncomp.shownCm.toFixed(2)} cm, -5°C uncomp=${coldUncomp.shownCm.toFixed(2)} cm`,
);

// 4. Stateless cycle phase & distinct sample frames at t = 1, 3, 7 s
const s1 = stateAtTime(1), s3 = stateAtTime(3), s7 = stateAtTime(7);
C.check(
  'stateAtTime: stateless across 1.7 s cycle and distinct at t = 1, 3, 7 s',
  near(stateAtTime(1 + 1.7).cyclePhase, s1.cyclePhase, 1e-12)
    && Math.abs(s1.cyclePhase - s3.cyclePhase) > 0.1
    && Math.abs(s3.cyclePhase - s7.cyclePhase) > 0.1
    && Math.abs(s1.cyclePhase - s7.cyclePhase) > 0.1,
);

C.report();
