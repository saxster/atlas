// 3D geometric unit-square population board split vertically by prevalence p = P(D) and horizontally by test result,
// alongside the isolated positive-test bar comparing True Positives (TP) vs False Positives (FP).
import * as THREE from 'three';
import { PALETTE, part, box, lines, V } from '@saxster/atlas/parts.js';
import * as M from './model.js';

PALETTE.amber = ['#f5c96b', '#d99b26', '#9e6d14'];
PALETTE.teal  = ['#6bc48e', '#2e8b57', '#1e5e3a'];

export function buildWorld(E, p = { p: 0.02, sens: 0.95, fp: 0.05 }) {
  const { scene, asm } = E;
  const root = new THREE.Group(); scene.add(root);
  const labels = [], label = (cls, html, at, text) =>
    typeof html === 'function' ? labels.push({ cls, html: html(), at, text: html }) : labels.push({ cls, html, at, text });

  // ---------- left: Unit-square population board (1,000 people partitioned by disease & test) ----------
  const gSquare = asm('square', root, {
    title: 'Population unit square (N = 1,000)',
    sub: 'width is split into diseased p and healthy 1 − p; height is split by test sensitivity P(+|D) and false-positive rate P(+|¬D)',
  });
  gSquare.userData.focus = () => ({ target: [-1.1, 1.15, 0], radius: 2.3 });

  const W = 2.8, H = 2.4;
  const x0 = -2.55, y0 = 0.0;

  // Base frame plate
  part(gSquare, box(W + 0.12, H + 0.12, 0.04), {
    pal: 'board', tone: 'faint', pos: [x0 + W / 2, y0 + H / 2, -0.04], name: 'Population board N = 1,000',
  });

  // 4 quadrant blocks (unit 1×1×1 boxes scaled dynamically)
  const unitGeo = box(1, 1, 1, 0.015);
  const bTP = part(gSquare, unitGeo, { pal: 'red', tone: 'lit', name: 'True Positives (TP = N·p·sens)' });
  const bFN = part(gSquare, unitGeo, { pal: 'blue', tone: 'mid', name: 'False Negatives (FN = N·p·(1 − sens))' });
  const bFP = part(gSquare, unitGeo, { pal: 'amber', tone: 'lit', name: 'False Positives (FP = N·(1 − p)·fp)' });
  const bTN = part(gSquare, unitGeo, { pal: 'paper', tone: 'lo', name: 'True Negatives (TN = N·(1 − p)·(1 − fp))' });

  // Outline border of the unit square
  lines(gSquare, [
    x0, y0, 0.01, x0 + W, y0, 0.01,
    x0 + W, y0, 0.01, x0 + W, y0 + H, 0.01,
    x0 + W, y0 + H, 0.01, x0, y0 + H, 0.01,
    x0, y0 + H, 0.01, x0, y0, 0.01,
  ], '#6a655d', 0.85);

  // ---------- right: Isolated positive-test bar (Posterior P(D | +) = TP / (TP + FP)) ----------
  const gPost = asm('posterior', root, {
    title: 'Positive tests isolated: P(D | +) = TP / (TP + FP)',
    sub: 'among everyone who tests positive, Bayes’ theorem asks what share is red (True Positive) vs amber (False Positive)',
  });
  gPost.userData.focus = () => ({ target: [1.65, 1.15, 0], radius: 2.1 });

  const bx = 1.15, bw = 0.62, bh = 2.4;
  part(gPost, box(bw + 0.14, bh + 0.12, 0.04), {
    pal: 'board', tone: 'faint', pos: [bx, y0 + bh / 2, -0.04], name: 'Positive-test comparison column',
  });
  const postTP = part(gPost, unitGeo, { pal: 'red', tone: 'lit', name: 'True Positives share in P(D | +)' });
  const postFP = part(gPost, unitGeo, { pal: 'amber', tone: 'lit', name: 'False Positives share in P(¬D | +)' });

  // Raw count towers beside the posterior column so absolute TP vs FP counts are visible
  const cxTP = 2.15, cxFP = 2.65, cw = 0.36;
  const colTP = part(gPost, unitGeo, { pal: 'red', tone: 'lit', name: 'Count of True Positives (TP)' });
  const colFP = part(gPost, unitGeo, { pal: 'amber', tone: 'lit', name: 'Count of False Positives (FP)' });

  let cur = {
    p: p.p, sens: p.sens, fp: p.fp,
    tp: 19, fn: 1, fpCount: 49, tn: 931, ppv: 19 / 68,
    wD: 0.25,
  };

  label('axis', 'N = 1,000 population', () => V(x0 + W * 0.72, y0 + H + 0.32, 0.08));
  label('vec red', () => `TP = ${cur.tp}`, () => V(x0 + cur.wD + 0.95, y0 + H - 0.18, 0.32));
  label('mark', () => `FP = ${cur.fpCount}`, () => V(x0 + cur.wD + (W - cur.wD) * 0.65, y0 + 0.35, 0.32));
  label('mark', () => `TN = ${cur.tn}`, () => V(x0 + cur.wD + (W - cur.wD) * 0.68, y0 + H * 0.58, 0.16));

  label('axis', 'all + tests', () => V(bx + 0.45, y0 + bh + 0.32, 0.08));
  label('vec red', () => `P(D|+) = ${(cur.ppv * 100).toFixed(1)}%`, () => V(bx + 0.42, y0 + bh * Math.max(0.14, cur.ppv * 0.5), 0.32));
  label('mark', () => `TP ${cur.tp}`, () => V(cxTP + 0.22, y0 - 0.22, 0.08));
  label('mark', () => `FP ${cur.fpCount}`, () => V(cxFP + 0.32, y0 - 0.52, 0.08));

  function placeBox(mesh, cx, cy, w, h, d) {
    mesh.scale.set(Math.max(0.02, w), Math.max(0.02, h), Math.max(0.02, d));
    mesh.position.set(cx, cy, d / 2);
    mesh.userData.home.copy(mesh.position);
  }

  function update(s) {
    const { e, snap } = s;
    const grow = Math.max(0.08, snap.frac);

    // Exaggerate visual minimum width slightly at very tiny p so the thin diseased strip remains legible while preserving order
    const pVis = Math.max(0.045, e.p);
    const gap = 0.03;
    const wD = Math.max(0.12, W * pVis - gap * 0.5);
    const wH = Math.max(0.20, W - wD - gap);

    const hSens = Math.max(0.08, H * e.sens - gap * 0.5);
    const hFN = Math.max(0.04, H - hSens - gap);

    const hFP = Math.max(0.06, H * e.fp - gap * 0.5);
    const hTN = Math.max(0.12, H - hFP - gap);

    // Positive regions raised higher in z so the viewer immediately sees the two sources of a '+' test
    placeBox(bTP, x0 + wD / 2, y0 + H - hSens / 2, wD, hSens, 0.28 * grow);
    placeBox(bFN, x0 + wD / 2, y0 + hFN / 2, wD, hFN, 0.10 * grow);
    placeBox(bFP, x0 + wD + gap + wH / 2, y0 + hFP / 2, wH, hFP, 0.28 * grow);
    placeBox(bTN, x0 + wD + gap + wH / 2, y0 + hFP + gap + hTN / 2, wH, hTN, 0.08 * grow);

    // Stacked positive-test bar: bottom is TP (red), top is FP (amber)
    const ppv = snap.ppv;
    const hPostTP = Math.max(0.04, (bh - gap) * ppv);
    const hPostFP = Math.max(0.04, (bh - gap) * (1 - ppv));
    placeBox(postTP, bx, y0 + hPostTP / 2, bw, hPostTP, 0.26 * grow);
    placeBox(postFP, bx, y0 + hPostTP + gap + hPostFP / 2, bw, hPostFP, 0.26 * grow);

    // Absolute count columns (scaled relative to max count ~250)
    const maxCount = Math.max(120, snap.tp + snap.fp, e.exp.tp + e.exp.fp);
    const hColTP = Math.max(0.05, (snap.tp / maxCount) * bh);
    const hColFP = Math.max(0.05, (snap.fp / maxCount) * bh);
    placeBox(colTP, cxTP, y0 + hColTP / 2, cw, hColTP, 0.24);
    placeBox(colFP, cxFP, y0 + hColFP / 2, cw, hColFP, 0.24);

    cur = {
      p: e.p, sens: e.sens, fp: e.fp,
      tp: snap.tp, fn: snap.fn, fpCount: snap.fp, tn: snap.tn,
      ppv, wD,
    };
  }

  return { update, labels };
}
