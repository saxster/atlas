// Chapter 5 assembly: Fourier Series & Rotating Epicycles.
import { SUBJECT } from '../subject.js';
import { PAGES, PLATES } from './pages.js';
import { buildWorld } from './world.js';
import * as M from './model.js';

const fmt = (x, n = 3) => (x < -1e-12 ? '−' : '') + Math.abs(x).toFixed(n);

export const CHAPTER = {
  no: 5,
  subject: SUBJECT,
  PAGES,
  PLATES,
  lookKeys: [],
  narrowZoom: 1.15,

  buildWorld(E) {
    return buildWorld(E);
  },

  state(clock, reduced) {
    const t = reduced ? 1.15 : clock * 0.95;
    const tMod = ((t % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    return {
      clock,
      t,
      tMod,
      s2: M.squarePartial(t, 2),
      s5: M.squarePartial(t, 5),
      saw6: M.sawtoothPartial(t, 6),
    };
  },

  readout(s, page) {
    switch (page.lit) {
      case 'twoEpicycles':
        return `t = ${s.tMod.toFixed(2)} rad   S₂(t) = ${fmt(s.s2)}\nb₁ = 4/π = 1.273   b₃ = 4/3π = 0.424`;
      case 'squareChain':
        return `t = ${s.tMod.toFixed(2)} rad   S₅(t) = ${fmt(s.s5)}\n5 odd harmonics (n = 1, 3, 5, 7, 9) · 96.6 % energy`;
      case 'sawtooth':
        return `t = ${s.tMod.toFixed(2)} rad   W₆(t) = ${fmt(s.saw6)}\nsawtooth b_n = (−1)^(n+1) 2/(nπ)`;
      case 'orthoMatch':
        return `∫ sin²(2t) dt = π ≈ 3.142 (mean ½)\n∫ sin(2t) sin(3t) dt = 0.000 (orthogonal)`;
      case 'spectrum':
        return `Parseval: ½ b₁² = 81.1 % · first 3 odd = ${(M.squareParsevalSum(3) * 100).toFixed(1)} % · first 5 = ${(M.squareParsevalSum(5) * 100).toFixed(1)} %`;
      case 'gibbs':
        return `Gibbs peak (2/π) Si(π) = ${M.GIBBS_PEAK.toFixed(4)} (+8.95 % of jump Δ = 2)\nS₁₅(π/30) = ${M.squarePartial(M.gibbsPeakAngle(15), 15).toFixed(4)}`;
      default:
        return '';
    }
  },

  onFrame(s, sheets) {
    for (const root of sheets) {
      if (!root) continue;
      const set = (k, txt) => { const el = root.querySelector(`[data-live="${k}"]`); if (el) el.textContent = txt; };
      set('two', `t = ${s.tMod.toFixed(2)} rad  ·  b₁ sin t = ${fmt(M.squareCoeff(1) * Math.sin(s.t))}  ·  S₂(t) = ${fmt(s.s2)}`);
      set('sq', `t = ${s.tMod.toFixed(2)} rad  ·  5-harmonic sum S₅(t) = ${fmt(s.s5)}  ·  target = ${fmt(M.squareTarget(s.tMod), 0)}`);
      set('saw', `t = ${s.tMod.toFixed(2)} rad  ·  6-harmonic sawtooth W₆(t) = ${fmt(s.saw6)}`);
    }
  },
};
