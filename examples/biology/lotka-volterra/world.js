// Figure B.6 world: Lotka–Volterra phase portrait (R, F) with vector field, closed Lyapunov orbit, and equilibrium
// crosshairs (R*, F*) on the left, paired with the coupled prey R(t) and predator F(t) time-series waves on the right.
import * as THREE from 'three';
import { PALETTE, part, lines, V } from '@saxster/atlas/parts.js';
import { axes, field, curve, plot, vector } from '@saxster/atlas/prims.js';
import * as M from './model.js';

PALETTE.prey = ['#5ab882', '#2e8b57', '#1e5e3a'];   // rabbits / prey R (green)
PALETTE.pred = ['#f07a7e', '#e5484d', '#b8343a'];   // foxes / predators F (red)
PALETTE.loop = ['#8fb0f0', '#4f7ed4', '#2e5599'];   // closed phase-space orbit

export function buildWorld(E, params) {
  const { scene, asm } = E;
  const root = new THREE.Group(); scene.add(root);
  const labels = [], label = (cls, html, at, text) =>
    typeof html === 'function' ? labels.push({ cls, html: html(), at, text: html }) : labels.push({ cls, html, at, text });

  // ---------- left: phase plane (R, F) with vector field & closed orbit ----------
  const gPhase = asm('phase', root, {
    title: 'Phase portrait (R, F) & conserved orbit V(R, F)',
    sub: 'trajectories circulate counterclockwise around the equilibrium (R*, F*) = (γ/δ, α/β)',
  });
  const axPhase = axes(gPhase, {
    x: [0, 80], y: [0, 50], size: [2.85, 2.35], at: [-3.35, 0.0, 0],
    ticks: { x: 4, y: 5 }, names: { x: 'Prey <i>R</i>', y: 'Foxes <i>F</i>' }, grid: true,
  });
  labels.push(...axPhase.labels);

  // Normalized phase-plane direction field so arrows show counterclockwise circulation cleanly
  const vf = field(gPhase, (R, F) => {
    const [dR, dF] = M.lvDeriv(Math.max(2, R), Math.max(2, F), params);
    const mag = Math.hypot(dR, dF) || 1;
    return [(dR / mag) * 7.5, (dF / mag) * 5.0, 0];
  }, {
    axes: axPhase, x: [8, 74], y: [5, 45], n: [6, 5], scale: 0.55, color: 'grey', name: 'Phase velocity field',
  });

  // Closed phase-space orbit curve
  const orbitCurve = curve(gPhase, u => [30, 20], {
    t: [0, 1], samples: 140, radius: 0.024, axes: axPhase, color: 'loop', name: 'Closed Lotka–Volterra orbit',
  });

  // Equilibrium dot (R*, F*) and moving state ball (R(t), F(t))
  const eqDot = part(gPhase, new THREE.SphereGeometry(0.058, 18, 14), {
    pal: 'ink', tone: 'hi', name: 'Coexistence equilibrium (R*, F*)',
  });
  const stateDot = part(gPhase, new THREE.SphereGeometry(0.072, 20, 14), {
    pal: 'pred', tone: 'lit', name: 'Current population state (R(t), F(t))',
  });
  const stateVec = vector(gPhase, [30, 20], [35, 20], {
    axes: axPhase, color: 'red', name: 'Instantaneous rate (dR/dt, dF/dt)',
  });

  // ---------- right: time-series board R(t) and F(t) ----------
  const gWaves = asm('waves', root, {
    title: 'Coupled population waves R(t) and F(t)',
    sub: 'prey (green) peak first; predators (red) boom a quarter-cycle later after feasting on abundant prey',
  });
  const axTime = axes(gWaves, {
    x: [0, M.T_MAX], y: [0, 80], size: [3.15, 2.35], at: [0.35, 0.0, 0],
    ticks: { x: 4, y: 4 }, names: { x: 'time <i>t</i>', y: 'count' }, grid: true,
  });
  labels.push(...axTime.labels);

  const preyPlot = plot(gWaves, () => 30, {
    axes: axTime, x: [0, M.T_MAX], samples: 160, color: 'prey', width: 0.044, name: 'Prey trajectory R(t)',
  });
  const predPlot = plot(gWaves, () => 20, {
    axes: axTime, x: [0, M.T_MAX], samples: 160, color: 'pred', width: 0.040, name: 'Predator trajectory F(t)',
  });

  const preyNow = part(gWaves, new THREE.SphereGeometry(0.064, 18, 14), {
    pal: 'prey', tone: 'lit', name: 'Current prey R(t)',
  });
  const predNow = part(gWaves, new THREE.SphereGeometry(0.064, 18, 14), {
    pal: 'pred', tone: 'lit', name: 'Current predators F(t)',
  });

  let cur = { R: params.R0 ?? M.DEFAULT_PARAMS.R0, F: params.F0 ?? M.DEFAULT_PARAMS.F0, Rstar: 30, Fstar: 20, tModel: 0 };
  label('mark', () => `(R*, F*) = (${cur.Rstar.toFixed(0)}, ${cur.Fstar.toFixed(0)})`,
    () => axPhase.to(Math.min(76, cur.Rstar + 18), Math.min(46, cur.Fstar + 6), 0.04));
  label('board', () => `Prey R = ${cur.R.toFixed(0)}`, () => axTime.to(M.T_MAX - 1.2, 72, 0.05));
  label('vec red', () => `Foxes F = ${cur.F.toFixed(0)}`, () => axTime.to(M.T_MAX - 1.2, 52, 0.05));

  function update(s) {
    const { sim, snap } = s;
    const { Rstar, Fstar } = sim.eq;

    // Update phase field & closed orbit
    vf.update((R, F) => {
      const [dR, dF] = M.lvDeriv(Math.max(2, R), Math.max(2, F), sim.params);
      const mag = Math.hypot(dR, dF) || 1;
      return [(dR / mag) * 7.5, (dF / mag) * 5.0, 0];
    });
    orbitCurve.update(u => M.orbitPoint(sim, u));

    eqDot.position.copy(axPhase.to(Rstar, Fstar, 0.03));
    stateDot.position.copy(axPhase.to(snap.R, snap.F, 0.05));
    const mag = Math.hypot(snap.dR, snap.dF) || 1;
    stateVec.set([snap.R, snap.F, 0.04], [snap.R + (snap.dR / mag) * 8.5, snap.F + (snap.dF / mag) * 5.8, 0.04]);

    // Update time-series plots up to current model time
    const tEnd = Math.max(0.4, snap.tModel);
    const interp = (t, key) => {
      const u = Math.max(0, Math.min(sim.steps - 1e-6, t / sim.h));
      const idx = Math.floor(u), frac = u - idx;
      return sim.traj[idx][key] + (sim.traj[idx + 1][key] - sim.traj[idx][key]) * frac;
    };
    preyPlot.update(t => interp(t, 'R'), { x: [0, tEnd] });
    predPlot.update(t => interp(t, 'F'), { x: [0, tEnd] });

    preyNow.position.copy(axTime.to(snap.tModel, snap.R, 0.05));
    predNow.position.copy(axTime.to(snap.tModel, snap.F, 0.05));

    cur = { R: snap.R, F: snap.F, Rstar, Fstar, tModel: snap.tModel };
  }

  return { update, labels };
}
