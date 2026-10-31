// Figure C.3 as an explorer: Activation energy, Maxwell–Boltzmann distribution, and catalysis.
import { buildWorld } from './world.js';
import * as M from './model.js';
import { chart, samples } from '@saxster/atlas/chart.js';

const f = (x, d = 2) => x.toFixed(d);

export const FIGURE = {
  no: 'C.3',
  title: 'Over the barrier: temperature and catalysts',
  question: 'Why does warming a reaction by just 10 °C (from 300 K to 310 K, a 3.3% rise in thermal energy) roughly double its rate?',
  bigIdea: 'average collision energy (3/2)RT barely budges (+3.3%), so collision frequency increases by less than 2%. Instead, reaction rate is governed by the exponential Boltzmann tail e^(−E_a / RT): at E_a = 54 kJ/mol, shifting the Maxwell–Boltzmann distribution slightly rightward doubles the fraction of collisions energetic enough to surmount the transition state. A catalyst speeds the reaction another way — lowering E_a for both forward and reverse directions without changing ΔH or K_eq.',
  PAGES: [{ cam: { target: [-0.05, 1.15, 0], az: -10, el: 8, dist: 16.8 }, lit: 'barrier', fig: 'Potential energy barrier U(x) and Maxwell–Boltzmann reactive tail' }],
  narrowZoom: 1.16,
  params: { T: 300, Ea: 55, dEcat: 0 },
  controls: [
    { key: 'T', label: 'Temperature T (K)', min: 280, max: 360, step: 5 },
    { key: 'Ea', label: 'Activation energy E_a (kJ/mol)', min: 35, max: 75, step: 5 },
    { key: 'dEcat', label: 'Catalyst barrier drop ΔE_cat (kJ/mol)', min: 0, max: 20, step: 5 },
  ],
  predict: {
    q: 'Warming a reaction from 300 K (27 °C) to 310 K (37 °C) raises the average kinetic energy of molecules by only 10 / 300 = 3.3%. Why does a typical reaction with E_a = 54 kJ/mol run twice as fast?',
    choices: [
      'Because only the high-energy tail E ≥ E_a reacts, and the exponential factor e^(−E_a / RT) doubles when T rises from 300 K to 310 K',
      'Because molecules move twice as fast at 310 K and collide twice as often per second',
      'Because raising temperature lowers the activation energy barrier E_a by half',
      'Because warming makes the reaction enthalpy ΔH twice as exothermic',
    ],
    answer: () => 0,
    why: p => {
      const ratio = M.tenDegreeRatio(p.T, p.Ea, p.dEcat);
      const Eeff = M.effectiveEa(p.Ea, p.dEcat);
      return `Collision frequency scales as √T, which rises by only √(310/300) − 1 = 1.7%, and the barrier height E_eff = ${Eeff} kJ/mol is fixed by bond strengths. What doubles is the population in the high-energy Maxwell–Boltzmann tail: exp(−E_eff / R(T+10)) / exp(−E_eff / RT) = ${ratio.toFixed(2)}×.`;
    },
  },
  run: { label: 'Run molecular collisions', duration: () => M.DURATION },
  buildWorld: (E, p) => { const W = buildWorld(E, p); return { update: s => W.update(s), labels: W.labels }; },
  lookKeys: [],
  state: (clock, reduced, p) => {
    const t = reduced ? 3.5 : clock;
    const Eeff = M.effectiveEa(p.Ea, p.dEcat);
    const k = M.rateConstant(p.T, p.Ea, p.dEcat);
    const kUncat = M.rateConstant(p.T, p.Ea, 0);
    return { ...p, t, Eeff, k, kUncat };
  },
  readout: s => `T = ${s.T} K   E_eff = ${s.Eeff} kJ/mol (ΔH = ${M.DELTA_H} kJ/mol)\nk(T) = ${s.k.toFixed(2)} s⁻¹   10 °C jump ×${f(M.tenDegreeRatio(s.T, s.Ea, s.dEcat), 2)}`,
  chips: [
    { label: 'Effective barrier E_eff', value: s => `${s.Eeff} kJ/mol${s.dEcat > 0 ? ` (−${s.dEcat} cat)` : ''}` },
    { label: 'Mean thermal energy (3/2)RT', value: s => `${f(M.meanThermalEnergy(s.T), 2)} kJ/mol` },
    { label: 'Rate constant k(T)', value: s => `${f(s.k, 2)} s⁻¹` },
    { label: '10 °C rate multiplier k(T+10)/k(T)', value: s => `×${f(M.tenDegreeRatio(s.T, s.Ea, s.dEcat), 2)}` },
    { label: 'Catalyst speedup (ΔH unchanged)', value: s => s.dEcat > 0 ? `×${f(M.catalystFactor(s.T, s.dEcat), 1)} (K_eq = ${f(M.equilibriumK(s.T, s.Ea, s.dEcat), 0)})` : `1.0× (K_eq = ${f(M.equilibriumK(s.T, s.Ea, 0), 0)})` },
  ],
  chart: (s, p) => {
    // Bottom SVG chart: Arrhenius plot ln k vs 1000 / T (K⁻¹) showing linear slope −E_eff / R
    const xOf = T => 1000 / T; // 1000/360 = 2.78 to 1000/280 = 3.57
    const lnk = (T, dE) => Math.log(M.rateConstant(T, p.Ea, dE));
    const uncatSeries = {
      pts: samples(2.78, 3.57, 60, x => lnk(1000 / x, 0)),
      tag: [3.22, lnk(1000 / 3.22, 0) - 1.4, `uncatalyzed (slope −E_a/R)`],
    };
    const series = [uncatSeries];
    if (p.dEcat > 0) {
      series.push({
        cls: 'curve total',
        pts: samples(2.78, 3.57, 60, x => lnk(1000 / x, p.dEcat)),
        tag: [3.05, lnk(1000 / 3.05, p.dEcat) + 1.1, `catalyzed (E_eff = ${s.Eeff} kJ/mol)`],
      });
    }
    return chart({
      x0: 2.75, x1: 3.60, y0: -10, y1: 12, h: 185,
      xlabel: 'inverse temperature 1000 / T (K⁻¹)', ylabel: 'ln k (s⁻¹)',
      label: 'Arrhenius plot of ln k against 1000/T with straight-line slope −E_a / (1000 R)',
      series,
      marks: [[xOf(p.T), lnk(p.T, p.dEcat), `T = ${p.T} K`]],
    });
  },
  PLATES: {
    barrier: {
      text: 'Along the reaction coordinate x, reactants at x = 0 must stretch and distort their bonds to reach the transition state at x = 0.5 (height E_a). Adding a catalyst provides an alternative pathway with a lower transition-state barrier E_eff = E_a − ΔE_cat. Because both the forward barrier (E_eff) and reverse barrier (E_eff − ΔH) drop by the exact same ΔE_cat, the reaction enthalpy ΔH = −15 kJ/mol and equilibrium constant K_eq = k_f / k_r remain completely unchanged.',
    },
    boltzmann: {
      text: 'The Arrhenius equation k = A e^(−E_a / RT) comes directly from integrating the high-energy tail E ≥ E_a of the Maxwell–Boltzmann distribution. Taking the natural logarithm gives ln k = ln A − (E_a / R)(1 / T): a straight line against 1 / T whose steepness is proportional to the activation energy E_a.',
    },
  },
};
