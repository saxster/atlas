// Figure B.6 as an explorer: Lotka–Volterra predator–prey cycles, closed phase-space orbits V(R, F),
// and Volterra's counterintuitive equilibrium principle.
import { buildWorld } from './world.js';
import * as M from './model.js';
import { chart } from '@saxster/atlas/chart.js';

let cache = null;
const getSim = p => {
  const key = `${p.alpha}|${p.beta}|${p.gamma}|${p.R0}`;
  if (!cache || cache.key !== key) cache = { key, sim: M.simulate(p, 1200) };
  return cache.sim;
};
const f = (x, d = 1) => x.toFixed(d);

export const FIGURE = {
  no: 'B.6',
  title: 'Foxes, rabbits and the loop of life',
  question: 'Why do predator and prey populations rise and fall in endless waves—and who benefits when prey breed faster?',
  bigIdea: 'abundant rabbits feed a fox boom; the extra foxes eat the rabbits down; starving foxes then decline, letting rabbits rebound. In phase space (R, F), the ecosystem traces a closed loop around the coexistence center (R*, F*) = (γ/δ, α/β)—where average prey R* is set entirely by the predators’ mortality γ and efficiency δ, not by the prey’s own birth rate α.',
  PAGES: [{ cam: { target: [-0.05, 1.15, 0], az: -8, el: 9, dist: 16.6 }, lit: 'phase', fig: 'Lotka–Volterra phase orbit & coupled waves' }],
  frameAspect: 1.5,
  narrowZoom: 1.16,
  params: { alpha: 1.0, beta: 0.05, gamma: 0.80, R0: 45 },
  controls: [
    { key: 'alpha', label: 'Prey birth rate (α)', min: 0.6, max: 1.6, step: 0.1, fmt: v => v.toFixed(1) },
    { key: 'beta', label: 'Predation rate (β)', min: 0.03, max: 0.08, step: 0.01, fmt: v => v.toFixed(2) },
    { key: 'gamma', label: 'Predator mortality (γ)', min: 0.5, max: 1.1, step: 0.15, fmt: v => v.toFixed(2) },
    { key: 'R0', label: 'Initial prey R(0)', min: 20, max: 60, step: 5 },
  ],
  predict: {
    q: 'Suppose Lush Meadow doubles the rabbits’ intrinsic birth rate α (more clover!), while predation β, fox mortality γ, and conversion δ stay the same. What happens to the long-run average number of rabbits R* and foxes F*?',
    choices: [
      'Average rabbits R* = γ/δ stays unchanged; all the extra rabbit births go into supporting more foxes (F* = α/β doubles)',
      'Average rabbits R* doubles while average foxes F* stays the same',
      'Both average rabbits R* and average foxes F* double together',
      'Foxes go extinct because rabbits outbreed them',
    ],
    answer: () => 0,
    why: p => {
      const eq = M.equilibrium(p);
      return `Setting dF/dt = F(δR − γ) = 0 shows that foxes stop growing only when R* = γ/δ = ${eq.Rstar.toFixed(0)} rabbits—which does not contain α at all! Feeding the rabbits faster simply raises the fox equilibrium F* = α/β = ${eq.Fstar.toFixed(1)} until extra predation eats up the extra births (Volterra’s principle).`;
    },
  },
  run: { label: 'Run the ecosystem', duration: () => M.DURATION },
  buildWorld: (E, p) => {
    const W = buildWorld(E, p);
    return { update: s => W.update(s), labels: W.labels };
  },
  lookKeys: [],
  state: (clock, reduced, p) => {
    const sim = getSim(p);
    const c = reduced ? M.DURATION : clock;
    return { sim, snap: M.stateAt(sim, c) };
  },
  readout: s => `t = ${f(s.snap.tModel, 1)}   prey R = ${f(s.snap.R, 1)} (R* = ${f(s.sim.eq.Rstar, 0)})\nfoxes F = ${f(s.snap.F, 1)} (F* = ${f(s.sim.eq.Fstar, 0)})   invariant V = ${f(s.snap.V, 3)}`,
  chips: [
    { label: 'Prey count R(t)', value: s => `${f(s.snap.R, 1)} (avg R* = ${f(s.sim.eq.Rstar, 0)})` },
    { label: 'Predator count F(t)', value: s => `${f(s.snap.F, 1)} (avg F* = ${f(s.sim.eq.Fstar, 1)})` },
    { label: 'Cycle period 2π/√(αγ)', value: (s, p) => `${f(M.smallAmplitudePeriod(p), 2)} time units` },
    { label: 'Conserved V(R, F)', value: s => `${f(s.snap.V, 4)}` },
    { label: 'Phase lag (prey → fox peak)', value: () => '¼ cycle (90°)' },
  ],
  chart: s => {
    const { sim, snap } = s;
    const upto = Math.max(2, snap.idx + 1);
    const stride = Math.max(1, Math.floor(upto / 100));
    const preyPts = [], predPts = [];
    for (let i = 0; i < upto; i += stride) {
      preyPts.push([sim.traj[i].t, sim.traj[i].R]);
      predPts.push([sim.traj[i].t, sim.traj[i].F]);
    }
    preyPts.push([snap.tModel, snap.R]);
    predPts.push([snap.tModel, snap.F]);

    const rStarLine = { cls: 'grid', pts: [[0, sim.eq.Rstar], [M.T_MAX, sim.eq.Rstar]], tag: [M.T_MAX * 0.82, sim.eq.Rstar + 4, `R* = γ/δ = ${sim.eq.Rstar.toFixed(0)}`] };
    return chart({
      x0: 0, x1: M.T_MAX, y0: 0, y1: 80, h: 185,
      xlabel: 'model time t', ylabel: 'population',
      label: 'Lotka–Volterra prey R(t) and predator F(t) oscillations around coexistence equilibrium R*',
      series: [
        rStarLine,
        { cls: 'trend', pts: predPts, tag: [M.T_MAX * 0.22, Math.min(72, sim.eq.Fstar + 12), 'Foxes F(t)'] },
        { pts: preyPts },
      ],
    });
  },
  PLATES: {
    phase: {
      text: 'Dividing dF/dt = F(δR − γ) by dR/dt = R(α − βF) separates variables: (α/F − β) dF + (δ − γ/R) dR = 0. Integrating gives the exact conserved quantity V(R, F) = δR − γ ln R + βF − α ln F, whose level curves are closed counterclockwise loops around (R*, F*) = (γ/δ, α/β).',
    },
    waves: {
      text: 'Why do fox peaks always lag a quarter-cycle behind rabbit peaks? Foxes grow fastest (dF/dt > 0) whenever rabbits exceed R* = γ/δ. Even after rabbits hit their peak and start declining, R is still above R*, so foxes keep multiplying until R drops back through R*—putting the fox peak 90° behind the rabbit peak.',
    },
  },
};
