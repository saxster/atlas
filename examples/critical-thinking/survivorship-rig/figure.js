import { buildWorld } from './world.js';
import * as M from './model.js';
import { chart, samples } from '@saxster/atlas/chart.js';

let cache = null;
const experiment = p => {
  const key = `${p.defeatMultiplier}|${p.onRoad}|${p.buggy}`;
  if (!cache || cache.key !== key) cache = { key, e: M.run(p) };
  return cache.e;
};

export const FIGURE = {
  no: 'CT.2',
  title: 'Survivorship & test scope',
  question: 'Where should you armor a bomber — or look for emissions cheating — when your data only contains what passed?',
  bigIdea: 'Survivorship bias and test-gaming share the same flaw: evaluating performance only inside the filter that selects winners. Returning planes had fewer bullet holes in their engines (1.11 vs 1.80 hits/ft²) because engine hits didn’t return; similarly, VW cars met the 0.043 g/km lab limit whenever the wheel stayed still on a dynamometer, then emitted up to 35× more NOx on real roads.',
  PAGES: [{ cam: { target: [0.05, 0.95, 0], az: -12, el: 14, dist: 15.2 }, lit: 'wald', fig: 'Wald’s returning bomber & lab-vs-road emissions bench' }],
  narrowZoom: 1.15,
  params: { defeatMultiplier: 28, onRoad: 1, buggy: 0 },
  controls: [
    { key: 'defeatMultiplier', label: 'Off-cycle real-road NOx multiplier', min: 1, max: 35, step: 1, fmt: v => `${v}×` },
    { key: 'onRoad', label: 'Test scope', min: 0, max: 1, step: 1, fmt: v => v ? 'Open Road (Real Driving)' : 'Lab Roller Bench' },
    { key: 'buggy', label: 'Counterfactual lens', min: 0, max: 1, step: 1, fmt: v => v ? 'Buggy: Armor Visible Holes / Trust Lab' : 'Wald: Armor Missing Hits / Test Road' },
  ],
  predict: {
    q: 'Returning WWII bombers show 1.80 bullet hits/ft² on wings and tail, vs only 1.11 hits/ft² on engines. If enemy flak sprays randomly across the sky, where does extra armor save the most planes?',
    choices: [
      'The engines — fewer returning hits means engine hits stopped planes from coming home',
      'The wings and tail — they clearly take the heaviest beating in combat',
      'Nowhere — bullet holes on survivors match the complete distribution of all hits',
      'Paint the wing tips bright silver so gunners miss them',
    ],
    answer: () => 0,
    why: () => 'Missing planes leave silent evidence in the denominator. If flak strikes uniformly, fewer marks on returning engines prove that engine strikes were fatal and disappeared from the sample.',
  },
  run: { label: 'Switch to open-road driving', duration: () => M.DURATION },
  buildWorld: (E, p) => buildWorld(E, p),
  lookKeys: [],
  state: (clock, reduced, p) => {
    const e = experiment(p), t = reduced ? M.DURATION : clock;
    return { e, t, snap: M.snapshot(e, t) };
  },
  readout: s => `active NOx = ${s.snap.nox.toFixed(3)} g/km (${s.snap.ratio.toFixed(1)}× limit)\nWald top risk: Engine (loss ~${Math.round(s.e.wald.deadliest.lossGivenHit * 100)}%)`,
  chips: [
    { label: 'Returning wing hit density', value: () => '1.80 / ft²' },
    { label: 'Returning engine hit density', value: () => '1.11 / ft² (silent loss!)' },
    { label: 'Lab dynamometer NOx', value: s => `${s.e.em.labEmission.toFixed(3)} g/km (Pass)` },
    { label: 'Real-road NOx', value: s => `${s.snap.nox.toFixed(3)} g/km (${s.snap.ratio.toFixed(1)}×)` },
    { label: 'Scope verdict', value: s => s.snap.ratio > 1 ? 'Fails outside lab scope' : 'Within limit' },
  ],
  chart: (s, p) => {
    const pts = samples(1, 35, 34, m => M.emissionsScope({ onRoad: 1, defeatMultiplier: m }).ratioToLimit);
    return chart({
      x0: 1, x1: 35, y0: 0, y1: 35, h: 180,
      xlabel: 'defeat-device multiplier (×)', ylabel: 'multiple of legal NOx limit',
      label: 'Real-road NOx emissions vs legal threshold across defeat-device multiplier',
      marks: [[p.defeatMultiplier, s.snap.ratio, `${s.snap.ratio.toFixed(1)}× limit`]],
      series: [
        { cls: 'trend', pts: [[1, 1], [35, 1]], tag: [18, 2.5, 'legal limit 1.0×'] },
        { pts },
      ],
    });
  },
  PLATES: {
    wald: { text: 'Abraham Wald (Columbia SRG, 1943) pointed out that surviving bombers are a filtered sample: armor belongs where survivors lack bullet holes.' },
    scope: { text: 'A valid argument citing "passed the bench test" only reaches "clean everywhere" if the bench represents road driving and cannot be recognised by the software.' },
  },
};
