// Chapter 2: Atomic orbitals (wavefunctions ψ, radial probability P(r) = 4πr²|ψ|², and n − 1 nodes)
import { SUBJECT } from '../subject.js';
import { buildWorld } from './world.js';
import { PAGES, PLATES, RANGES } from './pages.js';
import { moveCursor } from '@saxster/atlas/chart.js';
import * as M from './model.js';

const fmt = (x, n = 2) => (x < -5 * 10 ** -(n + 1) ? '−' : '') + Math.abs(x).toFixed(n);

export const CHAPTER = {
  subject: SUBJECT,
  no: 2,
  PAGES,
  PLATES,
  clock0: 1.6,
  lookKeys: [],
  narrowZoom: 1.14,
  buildWorld(E) {
    const W = buildWorld(E);
    this._W = W;
    return { update: s => W.update(s.t), labels: W.labels, stateAt: W.stateAt, drag: W.drag };
  },
  state(clock, reduced) {
    const t = reduced ? 1.6 : clock;
    const st = this._W ? this._W.stateAt(t) : { r1: M.rSweep1s(t), r2: M.rSweep2s(t) };
    return { t, r1: st.r1, r2: st.r2 };
  },
  readout({ r1, r2 }, page) {
    switch (page.scene) {
      case 'cloud1s':
        return `1s (n=1, ℓ=0)   |ψ₁ₛ(0)|² = ${fmt(M.psi1sSq(0), 3)} a₀⁻³\nno radial or angular nodes`;
      case 'radial1s':
        return `shell r = ${fmt(r1, 2)} a₀   P₁ₛ(r) = ${fmt(M.P1s(r1), 3)} a₀⁻¹\npeak at r = 1.00 a₀ (${fmt(M.A0_ANGSTROM, 3)} Å)`;
      case 'node2s':
        return `r = ${fmt(r2, 2)} a₀   P₂ₛ(r) = ${fmt(M.P2s(r2), 3)} a₀⁻¹\nradial node at r = 2.00 a₀ · peak 5.24 a₀`;
      case 'porbitals':
        return `2p (n=2, ℓ=1)   0 radial, 1 planar node\nmost probable radius r = 4.00 a₀`;
      case 'dorbitals':
        return `3d (n=3, ℓ=2)   0 radial, 2 angular nodes\nmost probable radius r = 9.00 a₀`;
      case 'staircase':
        return `total nodes = n − 1   radial = n − ℓ − 1\nangular = ℓ   circular peaks r = n² a₀`;
    }
    return '';
  },
  onFrame({ r1, r2 }, sheets) {
    moveCursor(sheets, 'r1s', RANGES.rad1s, r1, M.P1s(r1));
    moveCursor(sheets, 'r2s', RANGES.rad2s, r2, M.P2s(r2));
  },
};
