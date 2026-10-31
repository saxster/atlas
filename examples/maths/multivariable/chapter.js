// Chapter 6 assembly: Multivariable Calculus.
import { SUBJECT } from '../subject.js';
import { PAGES, PLATES } from './pages.js';
import { buildWorld } from './world.js';
import * as M from './model.js';

const fmt = (x, n = 2) => (x < -1e-12 ? '−' : '') + Math.abs(x).toFixed(n);

export const CHAPTER = {
  no: 6,
  subject: SUBJECT,
  PAGES,
  PLATES,
  lookKeys: [],
  narrowZoom: 1.15,

  buildWorld(E) {
    return buildWorld(E);
  },

  state(clock, reduced) {
    const x0 = reduced ? 0.9 : 0.9 * Math.cos(clock * 0.6);
    const y0 = 0.6;
    return {
      clock,
      slice: { x0, y0, z0: M.dome(x0, y0), fx: M.domeFx(x0, y0), fy: M.domeFy(x0, y0) },
      grad: { th: reduced ? 0.7 : clock * 0.7 },
      curl: { angle: reduced ? 0.4 : clock * 1.0 },
    };
  },

  readout(s, page) {
    switch (page.lit) {
      case 'domeSlice':
        return `(x₀, y₀) = (${fmt(s.slice.x0)}, ${fmt(s.slice.y0)})   z₀ = ${fmt(s.slice.z0, 3)}\n∂f/∂x = ${fmt(s.slice.fx)}   ∂f/∂y = ${fmt(s.slice.fy)}`;
      case 'tangentPlane':
        return `(x₀, y₀, z₀) = (0.80, 0.60, 1.50)\n∇f = (−0.80, −0.60)   normal n = (+0.80, +0.60, 1.00)`;
      case 'gradContours':
        return `contour r = 1.10 (f = 1.395)   |∇f| = 1.10\n∇f ⊥ contour   D_u f (along contour) = 0.00`;
      case 'saddleSurf':
        return `h(x, y) = ½(x² − y²)   ∇h(0, 0) = (0, 0)\nh_xx = +1, h_yy = −1   Hessian det D = −1 < 0 (saddle)`;
      case 'divField':
        return `F(x, y) = (x, y)   ∇ · F = ∂x/∂x + ∂y/∂y = +2.00\noutward flux (R = 1.25) = 2πR² = ${M.diskFluxExact(1.25).toFixed(2)}`;
      case 'curlField':
        return `G(x, y) = (−y, x)   (∇ × G)_z = ∂x/∂x − ∂(−y)/∂y = +2.00\ncirculation (R = 1.25) = 2πR² = ${M.diskCirculationExact(1.25).toFixed(2)}`;
      default:
        return '';
    }
  },

  onFrame(s, sheets) {
    for (const root of sheets) {
      if (!root) continue;
      const set = (k, txt) => { const el = root.querySelector(`[data-live="${k}"]`); if (el) el.textContent = txt; };
      set('slice', `(x₀, y₀) = (${fmt(s.slice.x0)}, ${fmt(s.slice.y0)})  ·  z₀ = ${fmt(s.slice.z0, 2)}  ·  ∂f/∂x = ${fmt(s.slice.fx)}  ·  ∂f/∂y = ${fmt(s.slice.fy)}`);
      set('grad', `|∇f| = 1.10 (radially inward)  ·  D_u f along contour = 0.00`);
    }
  },
};
