// Pure physical model for the Ultrasonic Pulse-Echo & Thermal Speed-of-Sound Bench.
// Zero DOM, zero Three.js imports (enforced by cli/check.mjs).

export const T_KELVIN_ZERO = 273.15;
export const V_ZERO_C = 331.3; // m/s in dry air at 0 °C
export const T_REF_C = 20;
export const V_REF = V_ZERO_C * Math.sqrt(1 + T_REF_C / T_KELVIN_ZERO); // ~343.21 m/s hardcoded in naive sketches
export const CYCLE_PERIOD = 1.7; // s (incommensurate with integer 1, 3, 7 s sample points)
export const RUN_DURATION = 7.5; // s

export const DEFAULTS = {
  distCm: 60,
  tempC: 20,
  stopCm: 35,
  comp: 0,
};

export function soundSpeed(tempC = T_REF_C) {
  const ratio = Math.max(0.2, 1 + Number(tempC) / T_KELVIN_ZERO);
  return V_ZERO_C * Math.sqrt(ratio);
}

export function echoTimeUs(distCm, tempC = T_REF_C) {
  const dMetres = Math.max(0.05, Number(distCm) / 100);
  return (2 * dMetres / soundSpeed(tempC)) * 1e6;
}

export function measuredDistanceCm(distCm, tempC = T_REF_C, comp = 0) {
  const us = echoTimeUs(distCm, tempC);
  const cUsed = Number(comp) > 0.5 ? soundSpeed(tempC) : V_REF;
  return (us * 1e-6 * cUsed * 0.5) * 100;
}

export function alertZone(shownCm, stopCm = 35) {
  if (shownCm <= Number(stopCm)) return 'STOP';
  if (shownCm <= Number(stopCm) + 15) return 'WARN';
  return 'SAFE';
}

export function stateAtTime(t = 0, rawParams = DEFAULTS) {
  const p = { ...DEFAULTS, ...(rawParams || {}) };
  const distCm = Math.min(100, Math.max(20, Number(p.distCm)));
  const tempC = Math.min(50, Math.max(-10, Number(p.tempC)));
  const stopCm = Number(p.stopCm);
  const comp = Number(p.comp) > 0.5 ? 1 : 0;

  const vActual = soundSpeed(tempC);
  const us = echoTimeUs(distCm, tempC);
  const naiveCm = measuredDistanceCm(distCm, tempC, 0);
  const shownCm = measuredDistanceCm(distCm, tempC, comp);
  const biasCm = shownCm - distCm;
  const zone = alertZone(shownCm, stopCm);

  const cyclePhase = (((t % CYCLE_PERIOD) + CYCLE_PERIOD) % CYCLE_PERIOD) / CYCLE_PERIOD;
  let activeLine = 1;
  let stage = 'trigger';
  let waveFrac = 0; // 0 at transducer, 1 at target reflector
  let returning = false;

  if (cyclePhase < 0.14) {
    activeLine = 1;
    stage = 'trigger';
    waveFrac = 0;
  } else if (cyclePhase < 0.46) {
    activeLine = 2;
    stage = 'outbound';
    waveFrac = (cyclePhase - 0.14) / 0.32;
  } else if (cyclePhase < 0.78) {
    activeLine = 3;
    stage = 'echo';
    returning = true;
    waveFrac = 1 - (cyclePhase - 0.46) / 0.32;
  } else if (cyclePhase < 0.90) {
    activeLine = 4;
    stage = 'compute';
    waveFrac = 0;
  } else {
    activeLine = 5;
    stage = 'alert';
    waveFrac = 0;
  }

  return {
    t,
    distCm,
    tempC,
    stopCm,
    comp,
    vActual,
    vUsed: comp ? vActual : V_REF,
    echoUs: us,
    naiveCm,
    shownCm,
    biasCm,
    zone,
    cyclePhase,
    activeLine,
    stage,
    waveFrac,
    returning,
    heaterLevel: Math.max(0, (tempC - (-10)) / 60),
  };
}
