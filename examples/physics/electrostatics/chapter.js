// Chapter 9: electrostatics
// The chapter as a figure: its pages, world, clock and readout. main.js opens it as a book; a textbook can embed it.
import { SUBJECT } from '../subject.js';
import { buildWorld } from './world.js';
import { PAGES, PLATES, CH, RANGE } from './pages.js';
import * as M from './model.js';

const f = (x, n = 2) => (x < -1e-9 ? '−' : '') + Math.abs(x).toFixed(n);

export const CHAPTER = {
  subject: SUBJECT,
  no: 9, PAGES, PLATES, clock0: 0,
  lookKeys: [],
  buildWorld(E) {
    const W = buildWorld(E);
    this._W = W;
    return { update: s => W.update(s), labels: W.labels, drag: W.drag };
  },
  state(clock, reduced) {
    const c = reduced ? 3.2 : clock;
    const pl = M.loop(c, M.PLATES.show * 1.45);
    const d = this._W?.drag || {};
    return {
      clock: c,
      induce: M.induce(reduced ? 6.5 : c % (M.INDUCE.run + M.REST)),
      balloonGap: M.balloonGap(c),
      pairR: d.pairR ?? M.pairR(c),
      lineX: d.lineX ?? M.lineX(c),
      testR: d.testR ?? M.testR(c),
      dipoleX: d.dipoleX ?? M.dipoleX(c),
      dipoleY: d.dipoleY ?? M.dipoleY(c),
      rodA: M.rodA(c),
      rodB: M.rodB(c),
      ringZ: d.ringZ ?? M.ringZ(c),
      plates: { t: pl.t / M.PLATES.show * M.PLATES.tCross },     // real seconds: 4 ns shown in 3.2 s
    };
  },
  readout(s, page) {
    const { pairR, lineX, testR, dipoleX, dipoleY, ringZ } = s;
    switch (page.scene) {
      case 'atoms': return `neutral 0   ion −1e   ion +1e\n1 e = 1.60 × 10⁻¹⁹ C`;
      case 'induce': { const st = s.induce; return `${st.stage}\nsphere ${f(st.Qnet / M.nC)} nC   rod ${st.rod ? f(st.dTip * 100, 0) + ' cm away' : 'gone'}`; }
      case 'coulomb': return `r ${f(pairR * 100, 1)} cm\nF ${f(M.coulomb(M.PAIR.q1, M.PAIR.q2, pairR))} N on each, attracting`;
      case 'line': { const r = M.lineForces(lineX); return `x ${f(lineX * 100, 1)} cm   F_A ${f(r.FA[0], 3)} N   F_B ${f(r.FB[0], 3)} N\nΣF ${f(r.net[0], 3)} N`; }
      case 'point': { const E = M.pointMag(M.POINT.Q, testR); return `r ${f(testR * 100, 1)} cm   E ${f(E, 0)} N/C\nF = q₀E = ${f(M.POINT.q0 * E * 1e9, 1)} × 10⁻⁹ N`; }
      case 'dipole': return `axis x ${f(dipoleX * 100, 1)} cm: E ${f(M.dipoleAxis(dipoleX), 0)} N/C\nbisector y ${f(dipoleY * 100, 1)} cm: E ${f(M.dipoleBisector(dipoleY), 0)} N/C`;
      case 'rod': return `axis a ${f(s.rodA * 100, 1)} cm: E ${f(M.rodAxis(s.rodA), 0)} N/C\nbisector a ${f(s.rodB * 100, 1)} cm: E ${f(M.rodBisector(s.rodB), 0)} N/C`;
      case 'ring': return `z ${f(ringZ * 100, 1)} cm   E ${f(M.ringAxis(ringZ), 0)} N/C\npeak ${f(M.ringAxis(M.RING_ZMAX), 0)} N/C at ${f(M.RING_ZMAX * 100, 1)} cm`;
      case 'plates': { const e = M.electron(s.plates.t); return `t ${f(s.plates.t * 1e9)} ns   x ${f(e.x * 100)} cm   y ${f(e.y * 1000)} mm\n${e.inside ? `a ${(M.PLATES.a / 1e14).toFixed(2)} × 10¹⁴ m/s² up` : 'past the plates: straight line'}`; }
    }
    return '';
  },
  onFrame(s, sheets) {
    const { pairR, lineX, testR, dipoleX, ringZ } = s;
    const put = (key, x, y) => { const r = RANGE[key]; for (const el of sheets) el.querySelectorAll(`circle[data-cursor="${key}"]`).forEach(c => { c.setAttribute('cx', CH.sx(Math.min(Math.max(x, r.x0), r.x1), r.x0, r.x1)); c.setAttribute('cy', CH.sy(Math.min(Math.max(y, r.y0), r.y1), r.y0, r.y1)); }); };
    const tI = s.clock % (M.INDUCE.run + M.REST);
    put('induce', tI, s.induce.Qnet / M.nC);
    put('coulomb', pairR * 100, M.coulomb(M.PAIR.q1, M.PAIR.q2, pairR));
    put('line', lineX * 100, M.lineForces(lineX).net[0]);
    put('field', testR * 100, M.pointMag(M.POINT.Q, testR) / 1000);
    put('dipole', dipoleX * 100, M.dipoleAxis(dipoleX) / 1000);
    put('rod', s.rodA * 100, M.rodAxis(s.rodA) / 1000);
    put('ring', ringZ * 100, M.ringAxis(ringZ) / 1000);
    const e = M.electron(s.plates.t); put('plates', e.x * 100, e.y * 1000);
  },
};
