// Repeated measurements piling into histogram columns beneath Gauss's normal bell curve N(μ + bias, σ²),
// with the true value marker (100.0 mm) and running sample mean x̄ ± σ/√k.
import * as THREE from 'three';
import { PALETTE, part, box, rod, lines, V } from '@saxster/atlas/parts.js';
import { axes, plot, particles } from '@saxster/atlas/prims.js';
import * as M from './model.js';

PALETTE.trueGreen = ['#5ab882', '#2e8b57', '#1e5e3a'];

export function buildWorld(E, p = { n: 160, sigma: 2.0, bias: 0.0 }) {
  const { scene, asm } = E;
  const root = new THREE.Group(); scene.add(root);
  const labels = [], label = (cls, html, at, text) =>
    typeof html === 'function' ? labels.push({ cls, html: html(), at, text: html }) : labels.push({ cls, html, at, text });

  const gBoard = asm('bell', root, {
    title: 'Histogram of repeated readings & Gauss’s normal curve',
    sub: 'each blue sphere is one measurement X_i; random errors pile into N(μ + b, σ²) while the sample mean x̄ narrows as σ / √k',
  });
  gBoard.userData.focus = () => ({ target: [0, 1.2, 0], radius: 2.8 });

  const yMax = Math.max(45, Math.ceil((p.n * M.BIN_W * M.normalPdf(M.TRUE_MU, M.TRUE_MU, 1.0) * 1.15) / 10) * 10);
  const ax = axes(gBoard, {
    x: [M.X_MIN, M.X_MAX], y: [0, yMax], size: [5.4, 2.7], at: [-2.7, -0.15, 0],
    ticks: { x: 4, y: 4 }, names: { x: 'reading (mm)', y: 'count' }, grid: true,
  });
  labels.push(...ax.labels);

  // Reference brass bar at the bottom representing the true 100.0 mm standard
  const pTrue0 = ax.to(M.TRUE_MU, 0, 0.02), pTrueTop = ax.to(M.TRUE_MU, yMax * 0.92, 0.02);
  lines(gBoard, [...pTrue0.toArray(), ...pTrueTop.toArray()], '#2e8b57', 0.85);
  part(gBoard, box(0.14, 0.08, 0.14), {
    pal: 'trueGreen', tone: 'lit', pos: pTrue0.toArray(), name: 'True value μ = 100.0 mm',
  });

  // Gaussian bell curve N(μ + bias, σ²)
  const bellCurve = plot(gBoard, x => M.expectedBinHeight(x, p.n, p.sigma, p.bias), {
    axes: ax, x: [M.X_MIN, M.X_MAX], samples: 120, color: 'red', width: 0.042, name: 'Gaussian error curve N(μ + b, σ²)',
  });

  // Instanced measurement beads stacked in their bins
  const beads = particles(gBoard, p.n, {
    radius: 0.048, color: 'blue', axes: ax, name: 'Individual measurements X_i',
  });

  // Running sample mean x̄ vertical rod and ±1 SE horizontal confidence bar near the top
  const gMean = asm('mean', root, {
    title: 'Sample mean x̄ & standard error ±σ/√k',
    sub: 'averaging k readings shrinks random spread by √k, but any systematic bias b remains',
  });
  gMean.userData.focus = () => ({ target: [0, 1.2, 0], radius: 2.2 });
  const meanRod = rod(gMean, { r: 0.024, pal: 'red', name: 'Sample mean x̄_k' });
  const seBar = rod(gMean, { r: 0.032, pal: 'red', name: 'Standard error interval x̄ ± σ/√k' });
  const meanDot = part(gMean, new THREE.SphereGeometry(0.068, 20, 14), {
    pal: 'red', tone: 'lit', name: 'Current sample mean x̄',
  });

  let cur = { k: p.n, mean: M.TRUE_MU, se: M.standardError(p.sigma, p.n), sigma: p.sigma, bias: p.bias, n: p.n };
  label('mark', 'true μ = 100.0 mm', () => pTrueTop.clone().add(V(-1.35, 0.20, 0.05)));
  label('vec red', () => `x̄ = ${cur.mean.toFixed(2)} ± ${cur.se.toFixed(2)} mm`, () => {
    const p = ax.to(cur.mean, yMax * 0.62);
    return p.clone().add(V(1.45, 0.18, 0.05));
  });

  function update(s) {
    const { e, snap } = s;
    const k = snap.k;
    for (let i = 0; i < k; i++) {
      const r = e.readings[i];
      beads.set(i, [r.xBin, r.rank + 0.5, 0.03]);
    }
    beads.show(k);

    bellCurve.update(x => M.expectedBinHeight(x, e.n, e.sigma, e.bias));

    const yBar = yMax * 0.80;
    const pBot = ax.to(snap.mean, 0, 0.05);
    const pTop = ax.to(snap.mean, yBar, 0.05);
    const pLeft = ax.to(snap.mean - snap.se, yBar, 0.05);
    const pRight = ax.to(snap.mean + snap.se, yBar, 0.05);
    meanRod.set(pBot, pTop);
    seBar.set(pLeft, pRight);
    meanDot.position.copy(pTop);

    cur = { k, mean: snap.mean, se: snap.se, sigma: e.sigma, bias: e.bias, n: e.n };
  }

  return { update, labels };
}
