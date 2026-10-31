// Chapter 4 assembly: wires state(clock), readout(state, page), and live DOM updates for Differential Equations.
import { SUBJECT } from '../subject.js';
import { PAGES, PLATES } from './pages.js';
import { buildWorld } from './world.js';
import * as M from './model.js';

const fmt = (x, n = 2) => (x < -1e-12 ? '−' : '') + Math.abs(x).toFixed(n);

export const CHAPTER = {
  no: 4,
  subject: SUBJECT,
  PAGES,
  PLATES,
  lookKeys: [],
  narrowZoom: 1.15,

  buildWorld(E) {
    return buildWorld(E);
  },

  state(clock, reduced) {
    const tCyc = reduced ? 1.5 : (clock % 5.0);
    const y0Slope = 1.0 + 0.35 * Math.sin(clock * 0.8);
    const tExp = reduced ? 1.25 : ((clock * 0.7) % 3.8);
    const yExp = M.coolingExact(tExp, 2.6);
    const tLog = reduced ? 2.0 : ((clock * 0.75) % 3.9);
    const yLog = M.logisticExact(tLog, 0.2);
    const [xHarm, vHarm] = M.harmonicExact(clock * 1.1, 1.8, 0);
    const tSp = reduced ? 1.8 : ((clock * 1.1) % 6.0);
    const [xSp, vSp] = M.spiralExact(tSp, 2.2, 0);
    const { l1, l2, vUnstable, vStable } = M.saddleEigenvectors();
    const uSad = reduced ? 0.5 : (((clock * 0.55) % 2.2) - 1.1);
    const c1 = 0.35 * Math.exp(l1 * uSad), c2 = 1.2 * Math.exp(l2 * uSad);
    const xSad = c1 * vUnstable[0] + c2 * vStable[0];
    const ySad = c1 * vUnstable[1] + c2 * vStable[1];

    return {
      clock,
      slope: { t0: 0.2, y0: reduced ? 1.25 : y0Slope, m0: M.slopeFieldRhs(0.2, reduced ? 1.25 : y0Slope) },
      exp: { t: tExp, y: yExp, rate: M.coolingRhs(yExp) },
      logistic: { t: tLog, y: yLog, rate: M.logisticRhs(yLog) },
      harmonic: { t: clock * 1.1, x: xHarm, v: vHarm, E: M.harmonicEnergy(xHarm, vHarm) },
      spiral: { t: tSp, x: xSp, v: vSp, E: M.harmonicEnergy(xSp, vSp) },
      saddle: { x: xSad, y: ySad },
    };
  },

  readout(s, page) {
    switch (page.lit) {
      case 'integralCurve':
        return `(t₀, y₀) = (${fmt(s.slope.t0)}, ${fmt(s.slope.y0)})   slope y₀ − t₀ = ${fmt(s.slope.m0)}\ny(2.0) = ${fmt(M.slopeFieldExact(2.0, s.slope.t0, s.slope.y0), 3)}`;
      case 'relaxCurves':
        return `t = ${fmt(s.exp.t)} s (τ = 1.25 s)   y(t) = ${fmt(s.exp.y, 3)}\ngap y − y_eq = ${fmt(s.exp.y - M.Y_EQ, 3)}   dy/dt = ${fmt(s.exp.rate, 3)}`;
      case 'logisticCurve':
        return `t = ${fmt(s.logistic.t)} s   y(t) = ${fmt(s.logistic.y, 3)} / K = ${M.K_LOG}\ngrowth rate dy/dt = ${fmt(s.logistic.rate, 3)}`;
      case 'phaseCircle':
        return `(x, v) = (${fmt(s.harmonic.x)}, ${fmt(s.harmonic.v)})\nconserved energy E = ½(x² + v²) = ${fmt(s.harmonic.E, 3)}`;
      case 'spiralSink':
        return `t = ${fmt(s.spiral.t)} s   (x, v) = (${fmt(s.spiral.x)}, ${fmt(s.spiral.v)})\nenergy E(t) = ${fmt(s.spiral.E, 3)}   trace = −0.50, det = +1.00`;
      case 'saddle':
        return `A = [[0.8, 0.4], [0.4, −0.8]]   det(A) = −0.80 < 0 (saddle)\nλ₁ = +0.894 (unstable), λ₂ = −0.894 (stable)`;
      default:
        return '';
    }
  },

  onFrame(s, sheets) {
    for (const root of sheets) {
      if (!root) continue;
      const set = (k, txt) => { const el = root.querySelector(`[data-live="${k}"]`); if (el) el.textContent = txt; };
      set('slope', `Initial point (${fmt(s.slope.t0)}, ${fmt(s.slope.y0)})  ·  slope dy/dt = ${fmt(s.slope.m0)}  ·  y(2) = ${fmt(M.slopeFieldExact(2, s.slope.t0, s.slope.y0))}`);
      set('exp', `t = ${fmt(s.exp.t)} s  ·  y(t) = ${fmt(s.exp.y, 3)}  ·  remaining gap = ${fmt(s.exp.y - M.Y_EQ, 3)}`);
      set('logistic', `t = ${fmt(s.logistic.t)} s  ·  y(t) = ${fmt(s.logistic.y, 2)}  ·  dy/dt = ${fmt(s.logistic.rate, 3)}`);
      set('harmonic', `x = ${fmt(s.harmonic.x)}  ·  v = ${fmt(s.harmonic.v)}  ·  E = ½(x² + v²) = ${fmt(s.harmonic.E, 3)}`);
      set('spiral', `t = ${fmt(s.spiral.t)} s  ·  (x, v) = (${fmt(s.spiral.x)}, ${fmt(s.spiral.v)})  ·  E(t) = ${fmt(s.spiral.E, 3)}`);
      set('saddle', `trace(A) = 0.00  ·  det(A) = −0.80  ·  λ₁,₂ = ±0.894`);
    }
  },
};
