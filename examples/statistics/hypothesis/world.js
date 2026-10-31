// Left: Overlapping sampling bell curves for H₀: N(0, SE²) (blue) and H₁: N(Δ, SE²) (red) with shaded α = 5% rejection tails and power region.
// Right: 3D forest plot of 20 replicated 95% confidence interval rods [x̄_k − 1.96·SE, x̄_k + 1.96·SE] around μ₀ = 0 and true effect Δ.
import * as THREE from 'three';
import { PALETTE, part, rod, lines, V } from '@saxster/atlas/parts.js';
import { axes, plot, area } from '@saxster/atlas/prims.js';
import * as M from './model.js';

PALETTE.amber = ['#f5c96b', '#d99b26', '#9e6d14'];
PALETTE.teal  = ['#6bc48e', '#2e8b57', '#1e5e3a'];

export function buildWorld(E, p = { delta: 0.4, n: 25, seed: 1 }) {
  const { scene, asm } = E;
  const root = new THREE.Group(); scene.add(root);
  const labels = [], label = (cls, html, at, text) =>
    typeof html === 'function' ? labels.push({ cls, html: html(), at, text: html }) : labels.push({ cls, html, at, text });

  const X_MIN = -0.9, X_MAX = 1.6;

  // ---------- left: Null H₀ vs True Effect H₁ sampling curves ----------
  const gBells = asm('bells', root, {
    title: 'Null H₀ vs. True Effect H₁ sampling distributions',
    sub: 'blue is H₀: N(0, σ²/n) with 5% rejection tails at ±1.96·SE; red is H₁: N(Δ, σ²/n) whose area beyond the threshold is statistical power',
  });
  gBells.userData.focus = () => ({ target: [-1.45, 1.15, 0], radius: 2.3 });

  const axBell = axes(gBells, {
    x: [X_MIN, X_MAX], y: [0, 4.5], size: [2.7, 2.3], at: [-2.85, 0.0, 0],
    ticks: { x: 4, y: 4 }, names: { x: 'sample mean <i>x̄</i>', y: 'density' }, grid: true,
  });
  labels.push(...axBell.labels);

  const se0 = M.standardError(p.n);
  const crit0 = M.Z_CRIT * se0;

  // Shaded statistical power area under H₁ beyond +1.96·SE
  const powerShade = area(gBells, x => M.normalPdf(x, p.delta, se0), {
    axes: axBell, x: [crit0, X_MAX], y0: 0, pal: 'red', opacity: 0.25, name: 'Statistical power P(reject H₀ | H₁)',
  });
  // Shaded α/2 false-positive tails under H₀
  const alphaRight = area(gBells, x => M.normalPdf(x, 0, se0), {
    axes: axBell, x: [crit0, X_MAX], y0: 0, pal: 'amber', opacity: 0.36, name: 'Right α/2 = 2.5% rejection tail',
  });
  const alphaLeft = area(gBells, x => M.normalPdf(x, 0, se0), {
    axes: axBell, x: [X_MIN, -crit0], y0: 0, pal: 'amber', opacity: 0.36, name: 'Left α/2 = 2.5% rejection tail',
  });

  const h0Curve = plot(gBells, x => M.normalPdf(x, 0, se0), {
    axes: axBell, x: [X_MIN, X_MAX], samples: 120, color: 'blue', width: 0.038, name: 'Null distribution H₀: N(0, SE²)',
  });
  const h1Curve = plot(gBells, x => M.normalPdf(x, p.delta, se0), {
    axes: axBell, x: [X_MIN, X_MAX], samples: 120, color: 'red', width: 0.038, name: 'True distribution H₁: N(Δ, SE²)',
  });

  // Critical threshold rods at ±1.96·SE on the bell plot
  const critRodR = rod(gBells, { r: 0.018, pal: 'amber', name: 'Critical line +1.96·SE' });
  const critRodL = rod(gBells, { r: 0.018, pal: 'amber', name: 'Critical line −1.96·SE' });

  // ---------- right: Forest plot of 20 replicated 95% confidence intervals ----------
  const gForest = asm('forest', root, {
    title: '20 replicated studies & their 95 % confidence intervals',
    sub: 'each horizontal bar is x̄_k ± 1.96·SE; red bars exclude 0 (p < 0.05, significant), while grey bars cross 0 (not significant)',
  });
  gForest.userData.focus = () => ({ target: [1.45, 1.15, 0], radius: 2.3 });

  const axForest = axes(gForest, {
    x: [X_MIN, X_MAX], y: [0, M.N_TRIALS + 1], size: [2.7, 2.3], at: [0.35, 0.0, 0],
    ticks: { x: 4, y: 4 }, names: { x: 'effect estimate <i>x̄</i> ± 1.96 SE', y: 'study #' }, grid: true,
  });
  labels.push(...axForest.labels);

  // Vertical reference rods on forest plot: null μ₀ = 0 and true effect Δ
  const nullRod = rod(gForest, { r: 0.018, pal: 'blue', name: 'Null hypothesis line μ₀ = 0' });
  nullRod.set(axForest.to(0, 0, 0.01), axForest.to(0, M.N_TRIALS + 1, 0.01));
  const trueRod = rod(gForest, { r: 0.020, pal: 'teal', name: 'True effect line Δ' });

  // 20 study rods + point-estimate spheres (we create both red and dark variants so color switches cleanly)
  const sphereGeo = new THREE.SphereGeometry(0.042, 16, 12);
  const studyItems = Array.from({ length: M.N_TRIALS }, (_, i) => {
    const sigRod = rod(gForest, { r: 0.018, pal: 'red', name: `Study ${i + 1} 95% CI (p < 0.05)` });
    const nsRod = rod(gForest, { r: 0.018, pal: 'dark', name: `Study ${i + 1} 95% CI (p ≥ 0.05)` });
    const sigDot = part(gForest, sphereGeo, { pal: 'red', tone: 'lit', name: `Study ${i + 1} mean x̄` });
    const nsDot = part(gForest, sphereGeo, { pal: 'dark', tone: 'mid', name: `Study ${i + 1} mean x̄` });
    return { sigRod, nsRod, sigDot, nsDot };
  });

  let cur = { delta: p.delta, se: se0, crit: crit0, power: M.statisticalPower(p.delta, p.n), rejected: 0, k: M.N_TRIALS };
  label('vec blue', '<i>H</i><sub>0</sub> (0)', () => axBell.to(0.65, 4.45, 0.06));
  label('vec red', () => `<i>H</i><sub>1</sub> (Δ=${cur.delta.toFixed(1)})`, () => axBell.to(1.48, 3.25, 0.06));
  label('mark', () => `±1.96 SE = ±${cur.crit.toFixed(2)}`, () => axBell.to(1.55, 1.35, 0.06));

  label('vec blue', () => `μ₀ = 0 · Δ = ${cur.delta.toFixed(1)}`, () => axForest.to(1.52, 19.2, 0.06));
  label('vec red', () => `${cur.rejected}/${cur.k} reject H₀`, () => axForest.to(1.52, 13.5, 0.06));

  function update(s) {
    const { e, snap } = s;
    const se = e.se, crit = e.crit, delta = e.delta;

    h0Curve.update(x => Math.min(4.45, M.normalPdf(x, 0, se)));
    h1Curve.update(x => Math.min(4.45, M.normalPdf(x, delta, se)));
    powerShade.update(x => Math.min(4.45, M.normalPdf(x, delta, se)), { x: [crit, X_MAX], y0: 0 });
    alphaRight.update(x => Math.min(4.45, M.normalPdf(x, 0, se)), { x: [crit, X_MAX], y0: 0 });
    alphaLeft.update(x => Math.min(4.45, M.normalPdf(x, 0, se)), { x: [X_MIN, -crit], y0: 0 });

    critRodR.set(axBell.to(crit, 0, 0.03), axBell.to(crit, 3.4, 0.03));
    critRodL.set(axBell.to(-crit, 0, 0.03), axBell.to(-crit, 3.4, 0.03));

    trueRod.set(axForest.to(delta, 0, 0.02), axForest.to(delta, M.N_TRIALS + 1, 0.02));

    for (let i = 0; i < M.N_TRIALS; i++) {
      const item = studyItems[i];
      const shown = i < snap.k;
      if (!shown) {
        item.sigRod.visible = item.nsRod.visible = item.sigDot.visible = item.nsDot.visible = false;
        continue;
      }
      const tr = e.trials[i];
      const y = i + 1;
      const pL = axForest.to(Math.max(X_MIN, tr.ciLo), y, 0.04);
      const pR = axForest.to(Math.min(X_MAX, tr.ciHi), y, 0.04);
      const pM = axForest.to(Math.max(X_MIN, Math.min(X_MAX, tr.xBar)), y, 0.05);

      if (tr.rejectsH0) {
        item.sigRod.set(pL, pR);
        item.sigDot.position.copy(pM);
        item.sigDot.visible = true;
        item.nsRod.visible = item.nsDot.visible = false;
      } else {
        item.nsRod.set(pL, pR);
        item.nsDot.position.copy(pM);
        item.nsDot.visible = true;
        item.sigRod.visible = item.sigDot.visible = false;
      }
    }

    cur = { delta, se, crit, power: e.power, rejected: snap.rejected, k: snap.k };
  }

  return { update, labels };
}
