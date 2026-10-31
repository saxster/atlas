// Chapter 3: Linear transformations (Linear Algebra)
import { SUBJECT } from '../subject.js';
import { buildWorld } from './world.js';
import { PAGES, PLATES, RANGES } from './pages.js';
import { moveCursor } from '@saxster/atlas/chart.js';
import * as M from './model.js';

const fmt = (x, n = 2) => (x < -5 * 10 ** -(n + 1) ? '−' : '') + Math.abs(x).toFixed(n);
const fmtVec = ([x, y], n = 2) => `(${fmt(x, n)}, ${fmt(y, n)})`;

export const CHAPTER = {
  subject: SUBJECT,
  no: 3,
  PAGES,
  PLATES,
  clock0: 2.2,
  lookKeys: [],
  narrowZoom: 1.14,
  buildWorld(E) {
    const W = buildWorld(E);
    return { update: s => W.update(s.t), labels: W.labels };
  },
  state: (clock, reduced) => ({ t: reduced ? 2.2 : clock }),
  readout({ t }, page) {
    const s = M.sSweep(t);
    switch (page.scene) {
      case 'basis': {
        const Ms = M.lerpMat(M.MAT_I, M.MAT_A, s);
        return `Aî = ${fmtVec([Ms.a, Ms.c])}   Aĵ = ${fmtVec([Ms.b, Ms.d])}\nA(1, 1) = ${fmtVec(M.applyMat(Ms, [1, 1]))}`;
      }
      case 'shear': {
        const k = M.kAt(t), Sk = M.shearMat(k);
        return `shear k = ${fmt(k)}   S(1, 1) = ${fmtVec(M.applyMat(Sk, [1, 1]))}\narea det(S) = ${fmt(M.det(Sk))}`;
      }
      case 'det': {
        const Ms = M.lerpMat(M.MAT_I, M.MAT_A, s);
        return `ad = ${fmt(Ms.a * Ms.d, 3)}   bc = ${fmt(Ms.b * Ms.c, 3)}\narea det(M) = ${fmt(M.det(Ms), 3)}`;
      }
      case 'collapse': {
        const d = M.dCollapseAt(t), C = M.collapseMat(d);
        return `col 2 = (0.60, ${fmt(d)})   det(C) = ${fmt(M.det(C), 3)}\nlimit d → 0.40 collapses onto y = ⅔x`;
      }
      case 'eigen': {
        const th = M.thetaAt(t) % Math.PI;
        const u = [Math.cos(th), Math.sin(th)], eu = M.applyMat(M.MAT_E, u);
        return `θ = ${fmt((th * 180) / Math.PI, 0)}°   u = ${fmtVec(u)}\nEu = ${fmtVec(eu)}   (λ₁ = 2, λ₂ = 1)`;
      }
      case 'compose': {
        const Mrs = M.lerpMat(M.MAT_I, M.MAT_RS, s);
        const Msr = M.lerpMat(M.MAT_I, M.MAT_SR, s);
        return `RS(1, 1) = ${fmtVec(M.applyMat(Mrs, [1, 1]))}\nSR(1, 1) = ${fmtVec(M.applyMat(Msr, [1, 1]))}`;
      }
    }
    return '';
  },
  onFrame({ t }, sheets) {
    const put = (key, range, x, y) => moveCursor(sheets, key, RANGES[range], x, y);
    const s = M.sSweep(t), Ms = M.lerpMat(M.MAT_I, M.MAT_A, s);
    const p11 = M.applyMat(Ms, [1, 1]);
    put('bx', 'basis', s, p11[0]);
    put('by', 'basis', s, p11[1]);
    const k = M.kAt(t);
    put('shx', 'shear', k, 1 + k);
    put('sha', 'shear', k, 1);
    put('det', 'det', s, M.det(Ms));
    const d = M.dCollapseAt(t);
    put('col', 'collapse', d, M.det(M.collapseMat(d)));
    const th = M.thetaAt(t) % Math.PI;
    put('eig', 'eigen', th, M.eigenCrossSin(M.MAT_E, th));
    const pRS = M.applyMat(M.lerpMat(M.MAT_I, M.MAT_RS, s), [1, 1]);
    const pSR = M.applyMat(M.lerpMat(M.MAT_I, M.MAT_SR, s), [1, 1]);
    put('crs', 'compose', s, Math.hypot(...pRS));
    put('csr', 'compose', s, Math.hypot(...pSR));
  },
};
