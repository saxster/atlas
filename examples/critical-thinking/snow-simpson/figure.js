import { buildWorld } from './world.js';
import * as M from './model.js';
import { chart, samples } from '@saxster/atlas/chart.js';

let cache = null;
const experiment = p => {
  const key = `${p.severeShareA}|${p.severeShareB}|${p.stratified}`;
  if (!cache || cache.key !== key) cache = { key, e: M.run(p) };
  return cache.e;
};
const pct = x => `${(x * 100).toFixed(1)}%`;

export const FIGURE = {
  no: 'CT.4',
  title: 'Confounders, John Snow & Simpson’s paradox',
  question: 'How can Hospital A beat Hospital B in mild cases AND critical cases yet lose overall — and how did Snow rule out elevation miasma?',
  bigIdea: 'Third variables confound pooled totals. In 1854 South London, houses piped from sewage-tainted Southwark & Vauxhall suffered 71.4 deaths per 10,000 houses versus 5.4 for Lambeth (a 13.3× ratio) along the exact same streets. In hospitals, pooling unequal severity mixes hides superior treatment inside every subgroup.',
  PAGES: [{ cam: { target: [0.05, 1.1, 0], az: -9, el: 11, dist: 15.8 }, lit: 'snow', fig: 'Snow 1854 intermingled-pipes rates & Simpson’s stratification' }],
  narrowZoom: 1.15,
  params: { severeShareA: 0.80, severeShareB: 0.20, stratified: 1 },
  controls: [
    { key: 'severeShareA', label: 'Center A critical-case share', min: 0.10, max: 0.90, step: 0.05, fmt: v => `${Math.round(v * 100)}%` },
    { key: 'severeShareB', label: 'Clinic B critical-case share', min: 0.10, max: 0.90, step: 0.05, fmt: v => `${Math.round(v * 100)}%` },
    { key: 'stratified', label: 'Comparison view', min: 0, max: 1, step: 1, fmt: v => v ? 'Rigorous: Stratified by Severity' : 'Buggy-World: Pooled Totals Only' },
  ],
  predict: {
    q: 'Center A has 96% survival on mild cases (vs Clinic B 90%) and 78% survival on critical cases (vs B 65%). If Center A receives 80% critical cases while B receives 20%, which hospital looks better in an unstratified pooled table?',
    choices: [
      'Clinic B (85.0% pooled vs Center A 81.6%), solely because B’s patients started mostly mild',
      'Center A always wins the pooled total too whenever it wins both subgroups',
      'Both hospitals tie at 82.0% regardless of patient mix',
      'Pooling automatically removes case-mix differences',
    ],
    answer: () => 0,
    why: p => {
      const sim = M.simpsonHospitals({ severeShareA: p.severeShareA, severeShareB: p.severeShareB });
      return `Case-mix weighting drives pooled scores: at ${Math.round(p.severeShareA * 100)}% vs ${Math.round(p.severeShareB * 100)}% critical share, Center A pools to ${pct(sim.pooledA)} and Clinic B pools to ${pct(sim.pooledB)}, even though Center A wins both mild and critical strata.`;
    },
  },
  run: { label: 'Compare Snow rates & stratify', duration: () => M.DURATION },
  buildWorld: (E, p) => buildWorld(E, p),
  lookKeys: [],
  state: (clock, reduced, p) => {
    const e = experiment(p), t = reduced ? M.DURATION : clock;
    return { e, t, snap: M.snapshot(e, t) };
  },
  readout: s => `Snow: S&V ${s.snap.svRateVis.toFixed(1)} vs Lam ${s.snap.lamRateVis.toFixed(1)} per 10k (${s.e.snow.ratio.toFixed(1)}×)\nPooled: A ${pct(s.e.simpson.pooledA)} vs B ${pct(s.e.simpson.pooledB)}`,
  chips: [
    { label: 'Southwark & Vauxhall (per 10k)', value: s => `${s.snap.svRateVis.toFixed(2)}` },
    { label: 'Lambeth Co. (per 10k)', value: s => `${s.snap.lamRateVis.toFixed(2)}` },
    { label: 'Snow cholera rate ratio', value: s => `${s.e.snow.ratio.toFixed(1)}×` },
    { label: 'Pooled hospital survival (A vs B)', value: s => `${pct(s.e.simpson.pooledA)} vs ${pct(s.e.simpson.pooledB)}` },
    { label: 'Stratified truth', value: () => 'A wins Mild (96>90) & Crit (78>65)' },
  ],
  chart: (s, p) => {
    const pts = samples(10, 90, 40, sh => M.simpsonHospitals({ severeShareA: sh / 100, severeShareB: p.severeShareB }).pooledA * 100);
    const curY = s.e.simpson.pooledA * 100;
    return chart({
      x0: 10, x1: 90, y0: 60, y1: 100, h: 180,
      xlabel: 'Center A critical-patient share (%)', ylabel: 'pooled survival (%)',
      label: 'How Center A pooled survival drops below Clinic B strictly from case severity mix',
      marks: [[p.severeShareA * 100, curY, `A pooled ${curY.toFixed(1)}%`]],
      series: [
        { cls: 'trend', pts: [[10, s.e.simpson.pooledB * 100], [90, s.e.simpson.pooledB * 100]], tag: [18, s.e.simpson.pooledB * 100 + 2.5, `Clinic B pooled ${(s.e.simpson.pooledB * 100).toFixed(1)}%`] },
        { pts },
      ],
    });
  },
  PLATES: {
    snow: { text: 'Snow noted that removing the Broad Street handle coincided with an already declining attack curve; causal hazard came from household pipe comparisons (286/40,046 vs 14/26,107).' },
    simpson: { text: 'Always check whether a lurking severity or confounder weight differs across groups before comparing pooled averages.' },
  },
};
