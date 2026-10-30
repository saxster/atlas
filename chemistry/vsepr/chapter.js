// Chapter 1: the shapes of molecules (VSEPR)
// The chapter as a figure: its pages, world, clock and readout. main.js opens it as a book; a textbook can embed it.
import { SUBJECT } from '../subject.js';
import { buildWorld } from './world.js';
import { PAGES, PLATES, RANGE } from './pages.js';
import { moveCursor } from '../../engine/chart.js';
import * as M from './model.js';

const f = (x, n = 2) => (x < -1e-9 ? '−' : '') + Math.abs(x).toFixed(n);
const mol = k => { const m = M.MOL[k]; return `H–${m.centre}–H ${f(m.angle, 2)}°   ${m.centre}–H ${f(m.r, 3)} Å\n${m.bonds} bond pairs, ${m.lone} lone`; };

export const CHAPTER = {
  subject: SUBJECT,
  no: 1, PAGES, PLATES, clock0: 0,
  lookKeys: [],
  buildWorld(E) {
    const W = buildWorld(E);
    return { update: s => W.update(s), labels: W.labels };
  },
  // the molecules rock about their axes; on page 1.5 the lone pair swells and shrinks. A reduced-motion reader gets one
  // still moment, with the lone pair at its full (fitted) strength.
  state: (clock, reduced) => {
    const t = reduced ? M.ROCK.period / 8 : clock;
    return { t, q: reduced ? M.Q_LONE : M.swellQ(t) };
  },
  readout({ t, q }, page) {
    switch (page.scene) {
      case 'domains': return [2, 3, 4].map(n => `${n} pairs ${f(M.SPREAD[n], n === 4 ? 1 : 0)}°`).join('   ');
      case 'tetra': return `cos θ = −1/3\nθ = ${f(M.TET_DEG, 4)}°`;
      case 'ch4': return mol('CH4');
      case 'nh3': return mol('NH3');
      case 'h2o': return mol('H2O');
      case 'swell': return `lone-pair strength q ${f(q, 3)}\nH–N–H ${f(M.squeeze('AX3E', q).bond, 2)}° (toy model)`;
      case 'real': return M.MAIN.map(k => `${M.MOL[k].formula} ${f(M.MOL[k].angle, 2)}°`).join('   ');
      case 'edge': return `H₂O ${f(M.MOL.H2O.angle, 1)}°   H₂S ${f(M.MOL.H2S.angle, 1)}°\nVSEPR says ≈ ${f(M.PREDICT.H2S.bond, 0)}° for both`;
    }
    return '';
  },
  onFrame({ q }, sheets) {
    moveCursor(sheets, 'q5', RANGE.swell, q, M.squeeze('AX3E', q).bond);
  },
};
