// Left: Round-by-round spending cascade ΔY_k = ΔG·c^k (red bars) & cumulative savings leakage S_n (amber reservoir) vs. cumulative income Y_n (green tower).
// Right: Keynesian Cross (45° line AE = Y and expenditure line AE = ΔG + 0.75·Y with staircase cobweb steps converging to ΔY* = ₹400 Cr).
import * as THREE from 'three';
import { PALETTE, part, box, rod, lines, V } from '@saxster/atlas/parts.js';
import { axes, plot } from '@saxster/atlas/prims.js';
import * as M from './model.js';

PALETTE.surplus = ['#6bc48e', '#2e8b57', '#1e5e3a'];
PALETTE.amber   = ['#f5c96b', '#d99b26', '#9e6d14'];

export function buildWorld(E) {
  const { scene, asm } = E;
  const root = new THREE.Group(); scene.add(root);
  const labels = [], label = (cls, html, at, text) =>
    typeof html === 'function' ? labels.push({ cls, html: html(), at, text: html }) : labels.push({ cls, html, at, text });

  // ---------- left: Round-by-round geometric cascade ΔG·c^k & savings leakage reservoir ----------
  const gCascade = asm('cascade', root, {
    title: 'Spending cascade ΔY_k = ΔG · c^k & savings leakage',
    sub: 'each round re-spends 75% (red bar) and leaks 25% into savings (amber cap); when cumulative savings reach ₹100 Cr, the ₹400 Cr wave is complete',
  });
  const axCas = axes(gCascade, {
    x: [0, M.N_ROUNDS + 1], y: [0, 115], size: [2.5, 2.25], at: [-2.95, 0.0, 0],
    ticks: { x: 4, y: 4 }, names: { x: 'round <i>k</i>', y: '₹ Cr' }, grid: true,
  });
  labels.push(...axCas.labels);

  // Theoretical geometric decay envelope ΔG · 0.75^(x−1)
  plot(gCascade, x => M.DELTA_G * Math.pow(M.MPC, Math.max(0, x - 1)), {
    axes: axCas, x: [1, M.N_ROUNDS], samples: 60, color: 'red', width: 0.026, name: 'Geometric envelope 100 · 0.75^(k−1)',
  });

  const unitBox = box(1, 1, 1, 0.015);
  const roundBars = Array.from({ length: M.N_ROUNDS }, (_, k) => {
    // Red bar for round k's spending, with an amber top segment showing the 25% leaked into savings that round
    const spendBar = part(gCascade, unitBox, { pal: 'red', tone: 'lit', name: `Round ${k + 1} spending ΔY_${k + 1}` });
    const leakBar = part(gCascade, unitBox, { pal: 'amber', tone: 'mid', name: `Round ${k + 1} saving leakage ΔS_${k + 1}` });
    return { spendBar, leakBar };
  });

  // ---------- right: Keynesian Cross (AE = ΔG + 0.75·Y crossing the 45° line AE = Y at ₹400 Cr) ----------
  const gCross = asm('cross', root, {
    title: 'The Keynesian Cross & multiplier staircase',
    sub: 'a ₹100 Cr upward shift of AE = ΔG + 0.75 Y bounces between the expenditure line and the 45° line AE = Y until ΔY* = ₹400 Cr',
  });
  const axCross = axes(gCross, {
    x: [0, 440], y: [0, 440], size: [2.55, 2.25], at: [0.35, 0.0, 0],
    ticks: { x: 4, y: 4 }, names: { x: 'income Δ<i>Y</i> (₹ Cr)', y: 'spending ΔAE' }, grid: true,
  });
  labels.push(...axCross.labels);

  // 45° equilibrium line ΔAE = ΔY (blue/ink) and pre-injection baseline ΔAE = 0.75·ΔY (faint)
  plot(gCross, y => y, {
    axes: axCross, x: [0, 440], samples: 40, color: 'blue', width: 0.032, name: '45° clearing line ΔAE = ΔY',
  });
  plot(gCross, y => M.MPC * y, {
    axes: axCross, x: [0, 440], samples: 40, color: 'grey', width: 0.024, name: 'Baseline induced spending 0.75·ΔY',
  });
  // Shifted expenditure line ΔAE = 100 + 0.75·ΔY
  plot(gCross, y => M.aggregateExpenditure(y), {
    axes: axCross, x: [0, 440], samples: 40, color: 'red', width: 0.038, name: 'Aggregate expenditure ΔG + 0.75·ΔY',
  });

  // Staircase cobweb rods on the Keynesian Cross (up to M.N_ROUNDS vertical + horizontal steps)
  const stairRods = Array.from({ length: M.N_ROUNDS }, (_, k) => ({
    vRod: rod(gCross, { r: 0.018, pal: 'surplus', name: `Round ${k + 1} expenditure jump` }),
    hRod: rod(gCross, { r: 0.018, pal: 'surplus', name: `Round ${k + 1} income translation` }),
  }));

  const eqDot = part(gCross, new THREE.SphereGeometry(0.066, 20, 14), {
    pal: 'surplus', tone: 'lit', name: 'Cumulative income point (ΔY_n, ΔY_n)',
  });

  // Cumulative Savings vs Injection comparison column at the far right
  const gLeak = asm('leakage', root, {
    title: 'Cumulative savings leakage ∑ ΔS_k = ₹100 Cr',
    sub: 'the multiplier stops growing when cumulative 25% savings leakages exactly match the initial ₹100 Cr injection',
  });
  const leakCol = part(gLeak, unitBox, { pal: 'amber', tone: 'lit', name: 'Cumulative savings leakage S_n' });
  const injLine = lines(gLeak, [3.15, axCas.to(0, 100).y, 0.14, 3.55, axCas.to(0, 100).y, 0.14], '#c84b31', 0.9);

  let cur = { n: 1, yCum: 100, sCum: 25, lastRound: 100 };

  label('vec red', () => `round 1: ₹100 Cr`, () => axCas.to(7.5, -34, 0.06));
  label('mark', () => `saved S = ₹${cur.sCum.toFixed(1)} Cr`, () => V(3.65, 2.95, 0.12));
  label('vec blue', '45° (AE = Y)', () => axCross.to(425, 255, 0.06));
  label('vec red', 'ΔG + 0.75 Y', () => axCross.to(340, 455, 0.06));
  label('mark', () => `ΔY = ₹${cur.yCum.toFixed(0)} Cr`, () => axCross.to(425, -145, 0.06));

  function placeBar(mesh, cx, yBot, yTop, w, d) {
    const h = Math.max(0.008, yTop - yBot);
    mesh.scale.set(w, h, d);
    mesh.position.set(cx, (yBot + yTop) / 2, d / 2);
    mesh.userData.home.copy(mesh.position);
  }

  function update(s) {
    const nCont = s.n;
    const yBase = axCas.to(0, 0).y;

    for (let k = 0; k < M.N_ROUNDS; k++) {
      const w = Math.max(0, Math.min(1, nCont - k));
      const { spendBar, leakBar } = roundBars[k];
      if (w <= 0.01) {
        spendBar.visible = leakBar.visible = false;
        continue;
      }
      spendBar.visible = leakBar.visible = true;
      const yTotal = M.roundSpending(k) * w;
      const yReSpend = yTotal * M.MPC;
      const cx = axCas.to(k + 1, 0).x;
      const y0W = yBase;
      const yMidW = axCas.to(k + 1, yReSpend).y;
      const yTopW = axCas.to(k + 1, yTotal).y;
      placeBar(spendBar, cx, y0W, yMidW, 0.14, 0.16);
      placeBar(leakBar, cx, yMidW, yTopW, 0.14, 0.16);
    }

    // Staircase cobweb on Keynesian Cross
    let yPrev = 0;
    for (let k = 0; k < M.N_ROUNDS; k++) {
      const w = Math.max(0, Math.min(1, nCont - k));
      const { vRod, hRod } = stairRods[k];
      if (w <= 0.01) {
        vRod.visible = hRod.visible = false;
        continue;
      }
      const yNextFull = M.aggregateExpenditure(yPrev);
      const yVert = yPrev + (yNextFull - yPrev) * Math.min(1, w * 1.6);
      const yHoriz = yPrev + (yNextFull - yPrev) * Math.max(0, Math.min(1, (w - 0.35) / 0.65));
      vRod.set(axCross.to(yPrev, yPrev, 0.04), axCross.to(yPrev, yVert, 0.04));
      hRod.set(axCross.to(yPrev, yNextFull, 0.04), axCross.to(yHoriz, yNextFull, 0.04));
      yPrev = yNextFull;
    }

    eqDot.position.copy(axCross.to(s.yCum, s.yCum, 0.06));

    // Cumulative savings column (fills up to ₹100 Cr)
    const ySaveTop = axCas.to(0, s.sCum).y;
    placeBar(leakCol, 3.35, yBase, ySaveTop, 0.28, 0.22);
    injLine.visible = true;

    cur = s;
  }

  return { update, labels };
}
