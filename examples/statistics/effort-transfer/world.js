// Left: 3D inverse-variance meta-analysis forest plot across 5 community replications (n = 228..500) + Pooled N = 1,457 diamond/bar.
// Right: 50-trial unrewarded Transfer Demand Trajectory (Levels 1..5) comparing Effort-Reinforced (red) vs. Control (blue) quadratic slump.
import * as THREE from 'three';
import { PALETTE, part, rod } from '@saxster/atlas/parts.js';
import { axes, plot, area } from '@saxster/atlas/prims.js';
import * as M from './model.js';

PALETTE.amber = ['#f5c96b', '#d99b26', '#9e6d14'];
PALETTE.teal  = ['#6bc48e', '#2e8b57', '#1e5e3a'];

export function buildWorld(E, p = { trueD: 0.22, vLearned: 0.35, seed: 1 }) {
  const { scene, asm } = E;
  const root = new THREE.Group();
  scene.add(root);
  const labels = [];
  const label = (cls, html, at, text) =>
    typeof html === 'function'
      ? labels.push({ cls, html: html(), at, text: html })
      : labels.push({ cls, html, at, text });

  const D_MIN = -0.35, D_MAX = 0.85;

  // ---------- left: 5-Study Replication Forest + Pooled Meta-Analysis (y = 1..6) ----------
  const gMeta = asm('meta', root, {
    title: 'Five replications (n = 228..500) & pooled meta-analysis (N = 1,457)',
    sub: 'individual n ≈ 240 studies have ~40% power at d = 0.22 and flicker across 0; pooling inverse-variance weights resolves d cleanly',
  });
  gMeta.userData.focus = () => ({ target: [-1.45, 1.15, 0], radius: 2.35 });

  const axMeta = axes(gMeta, {
    x: [D_MIN, D_MAX], y: [0, 7], size: [2.65, 2.3], at: [-2.85, 0.0, 0],
    ticks: { x: 4, y: 6 }, names: { x: 'effect <i>d</i>', y: 'study' }, grid: true,
  });
  labels.push(...axMeta.labels);

  const nullRod = rod(gMeta, { r: 0.016, pal: 'blue', name: 'Zero-effect null line d = 0' });
  nullRod.set(axMeta.to(0, 0, 0.01), axMeta.to(0, 7, 0.01));

  const trueEffectRod = rod(gMeta, { r: 0.018, pal: 'amber', name: 'True underlying effect d' });

  const sphereGeo = new THREE.SphereGeometry(0.048, 16, 12);
  const diamondGeo = new THREE.OctahedronGeometry(0.068, 0);

  const studyRows = Array.from({ length: M.STUDY_SAMPLE_SIZES.length }, (_, i) => {
    const y = 6 - i; // top-to-bottom: 2a (y=6) .. 2e (y=2)
    const sigRod = rod(gMeta, { r: 0.020, pal: 'red', name: `${M.STUDY_LABELS[i]} (n=${M.STUDY_SAMPLE_SIZES[i]}, p < 0.05)` });
    const nsRod = rod(gMeta, { r: 0.020, pal: 'dark', name: `${M.STUDY_LABELS[i]} (n=${M.STUDY_SAMPLE_SIZES[i]}, p ≥ 0.05)` });
    const sigDot = part(gMeta, sphereGeo, { pal: 'red', tone: 'lit', name: `${M.STUDY_LABELS[i]} estimate` });
    const nsDot = part(gMeta, sphereGeo, { pal: 'dark', tone: 'mid', name: `${M.STUDY_LABELS[i]} estimate` });
    return { y, sigRod, nsRod, sigDot, nsDot };
  });

  // Pooled meta-analysis row at y = 0.85
  const pooledY = 0.85;
  const pooledRod = rod(gMeta, { r: 0.026, pal: 'teal', name: 'Pooled N = 1,457 95% CI' });
  const pooledGem = part(gMeta, diamondGeo, { pal: 'teal', tone: 'lit', name: 'Pooled inverse-variance estimate d̂' });

  // ---------- right: 50-Trial Transfer Demand Trajectory (Levels 1..5, zero external reward) ----------
  const gCurve = asm('transfer', root, {
    title: 'Voluntary demand selection across 50 unrewarded transfer trials',
    sub: 'blue is outcome/random-reward control (steep late-session slump); red is effort-reinforced transfer (higher demand & persistence)',
  });
  gCurve.userData.focus = () => ({ target: [1.45, 1.15, 0], radius: 2.35 });

  const axCurve = axes(gCurve, {
    x: [1, M.N_TRANSFER_TRIALS], y: [1.5, 4.3], size: [2.65, 2.3], at: [0.40, 0.0, 0],
    ticks: { x: 4, y: 4 }, names: { x: 'trial', y: 'level' }, grid: true,
  });
  labels.push(...axCurve.labels);

  const uOfTrial = tr => (tr - 1.0) / (M.N_TRANSFER_TRIALS - 1.0);

  const liftShade = area(gCurve, tr => M.demandTrajectory(uOfTrial(tr), p.vLearned), {
    axes: axCurve, x: [1, M.N_TRANSFER_TRIALS], y0: tr => M.demandTrajectory(uOfTrial(tr), 0.0),
    pal: 'red', opacity: 0.22, name: 'Learned-industriousness demand lift & slump buffer',
  });

  const ctrlPlot = plot(gCurve, tr => M.demandTrajectory(uOfTrial(tr), 0.0), {
    axes: axCurve, x: [1, M.N_TRANSFER_TRIALS], samples: 80, color: 'blue', width: 0.036,
    name: 'Control group demand curve (quadratic slump)',
  });
  const expPlot = plot(gCurve, tr => M.demandTrajectory(uOfTrial(tr), p.vLearned), {
    axes: axCurve, x: [1, M.N_TRANSFER_TRIALS], samples: 80, color: 'red', width: 0.040,
    name: 'Effort-reinforced demand curve (buffered persistence)',
  });

  const cursorRod = rod(gCurve, { r: 0.016, pal: 'amber', name: 'Current transfer trial cursor' });
  const ctrlBead = part(gCurve, sphereGeo, { pal: 'blue', tone: 'lit', name: 'Control demand at current trial' });
  const expBead = part(gCurve, sphereGeo, { pal: 'red', tone: 'lit', name: 'Effort-reinforced demand at current trial' });

  let cur = {
    trueD: p.trueD,
    pooledD: p.trueD,
    sigCount: 2,
    trialIndex: 50,
    expEnd: M.demandTrajectory(1.0, p.vLearned),
    ctrlEnd: M.demandTrajectory(1.0, 0.0),
  };

  label('vec blue', () => `true <i>d</i>=${cur.trueD.toFixed(2)}`, () => axMeta.to(0.52, 6.55, 0.06));
  label('mark', () => `pooled <i>d̂</i>=${cur.pooledD.toFixed(2)}`, () => axMeta.to(0.56, 3.45, 0.08));

  label('vec red', () => `effort (${cur.expEnd.toFixed(2)})`, () => axCurve.to(28, 3.68, 0.06));
  label('vec blue', () => `ctrl (${cur.ctrlEnd.toFixed(2)})`, () => axCurve.to(18, 2.22, 0.06));

  function update(s) {
    const { e, snap } = s;
    trueEffectRod.set(axMeta.to(e.trueD, 0, 0.02), axMeta.to(e.trueD, 7, 0.02));

    for (let i = 0; i < studyRows.length; i++) {
      const row = studyRows[i];
      const st = e.studies[i];
      const lo = Math.max(D_MIN, st.ciLo);
      const hi = Math.min(D_MAX, st.ciHi);
      const mid = Math.max(D_MIN, Math.min(D_MAX, st.dHat));
      const pL = axMeta.to(lo, row.y, 0.04);
      const pR = axMeta.to(hi, row.y, 0.04);
      const pM = axMeta.to(mid, row.y, 0.05);

      if (st.rejectsH0) {
        row.sigRod.set(pL, pR);
        row.sigDot.position.copy(pM);
        row.sigRod.visible = row.sigDot.visible = true;
        row.nsRod.visible = row.nsDot.visible = false;
      } else {
        row.nsRod.set(pL, pR);
        row.nsDot.position.copy(pM);
        row.nsRod.visible = row.nsDot.visible = true;
        row.sigRod.visible = row.sigDot.visible = false;
      }
    }

    const pLo = Math.max(D_MIN, e.meta.ciLo);
    const pHi = Math.min(D_MAX, e.meta.ciHi);
    const pMid = Math.max(D_MIN, Math.min(D_MAX, e.meta.pooledD));
    pooledRod.set(axMeta.to(pLo, pooledY, 0.05), axMeta.to(pHi, pooledY, 0.05));
    pooledGem.position.copy(axMeta.to(pMid, pooledY, 0.07));

    expPlot.update(tr => M.demandTrajectory(uOfTrial(tr), e.vLearned));
    ctrlPlot.update(tr => M.demandTrajectory(uOfTrial(tr), 0.0));
    liftShade.update(tr => M.demandTrajectory(uOfTrial(tr), e.vLearned), {
      x: [1, M.N_TRANSFER_TRIALS],
      y0: tr => M.demandTrajectory(uOfTrial(tr), 0.0),
    });

    const trNow = snap.trialIndex;
    cursorRod.set(axCurve.to(trNow, 1.5, 0.02), axCurve.to(trNow, 4.25, 0.02));
    ctrlBead.position.copy(axCurve.to(trNow, snap.curCtrl, 0.06));
    expBead.position.copy(axCurve.to(trNow, snap.curExp, 0.06));

    cur = {
      trueD: e.trueD,
      pooledD: e.meta.pooledD,
      sigCount: snap.sigCount,
      trialIndex: trNow,
      expEnd: M.demandTrajectory(1.0, e.vLearned),
      ctrlEnd: M.demandTrajectory(1.0, 0.0),
    };
  }

  return { update, labels };
}
