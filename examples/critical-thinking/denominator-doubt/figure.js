import { buildWorld } from './world.js';
import * as M from './model.js';
import { chart, samples } from '@saxster/atlas/chart.js';

let cache = null;
const experiment = p => {
  const key = `${p.exposedShare}|${p.hazardProb}|${p.buggy}`;
  if (!cache || cache.key !== key) cache = { key, e: M.run(p) };
  return cache.e;
};
const pct = (x, d = 2) => `${(x * 100).toFixed(d)}%`;

export const FIGURE = {
  no: 'CT.1',
  title: 'Missing denominators & waiting risk',
  question: 'Can an 80 % headline count be completely accurate and still point to the exact wrong cause?',
  bigIdea: 'A true numerator without its exposure denominator flips cause and correlation whenever one group dominates the fleet. At 95 % beacon adoption (950 of 1,000 vessels), 80 % of groundings carry beacons even while unequipped vessels ground at 4.7× the rate (4.00 % vs 0.84 %). Meanwhile, delaying precaution until certainty requires judging P(hazard) × Harm against Precaution Cost.',
  PAGES: [{ cam: { target: [0.05, 1.05, 0], az: -9, el: 10, dist: 15.8 }, lit: 'counts', fig: 'Fleet numerators vs denominators & per-vessel incidence rates' }],
  narrowZoom: 1.15,
  params: { exposedShare: 0.95, hazardProb: 0.35, buggy: 0 },
  controls: [
    { key: 'exposedShare', label: 'Fleet share exposed / carrying beacon', min: 0.10, max: 0.95, step: 0.05, fmt: v => `${Math.round(v * 100)}%` },
    { key: 'hazardProb', label: 'Assessed hazard probability P(H)', min: 0.02, max: 0.60, step: 0.02, fmt: v => `${Math.round(v * 100)}%` },
    { key: 'buggy', label: 'Counterfactual lens', min: 0, max: 1, step: 1, fmt: v => v ? 'Buggy-World: Numerators Only' : 'Rigorous: Full Denominators' },
  ],
  predict: {
    q: 'Eight out of ten fishing boats that ran aground in fog carried new sonar beacons. What single missing number must you inspect before blaming the beacons?',
    choices: [
      'How many total departing boats in port carried beacons versus sailed without them',
      'What colour the beacons were painted',
      'Whether any single captain wrote an angry letter after grounding',
      'How many ships sank in a different ocean ten years earlier',
    ],
    answer: () => 0,
    why: p => {
      const r = M.computeRates({ exposedShare: p.exposedShare });
      return `Raw numerators alone cannot establish rate. At ${Math.round(p.exposedShare * 100)}% fleet adoption, beacon vessels produce ${Math.round(r.rawNumeratorShare * 100)}% of raw incidents (${r.eventsExposed} of ${r.totalEvents}), yet their per-vessel rate is ${pct(r.rateExposed)} versus ${pct(r.rateUnexposed)} for unequipped boats.`;
    },
  },
  run: { label: 'Audit full port departures', duration: () => M.DURATION },
  buildWorld: (E, p) => buildWorld(E, p),
  lookKeys: [],
  state: (clock, reduced, p) => {
    const e = experiment(p), t = reduced ? M.DURATION : clock;
    return { e, t, snap: M.snapshot(e, t) };
  },
  readout: s => `fleet audited: ${s.snap.k}/1,000 · raw beacon share ${Math.round(s.e.rates.rawNumeratorShare * 100)}%\nrate(beacon)=${pct(s.e.rates.rateExposed)} vs rate(none)=${pct(s.e.rates.rateUnexposed)}`,
  chips: [
    { label: 'Raw beacon grounding share', value: s => `${Math.round(s.e.rates.rawNumeratorShare * 100)}% (${s.e.rates.eventsExposed}/${s.e.rates.totalEvents})` },
    { label: 'Beacon grounding rate', value: s => pct(s.e.rates.rateExposed) },
    { label: 'Unequipped grounding rate', value: s => pct(s.e.rates.rateUnexposed) },
    { label: 'Expected harm of waiting', value: s => `${s.e.dec.expectedHarmWaiting.toFixed(1)} vs cost ${s.e.dec.costOfPrecaution}` },
    { label: 'Action verdict', value: s => s.e.dec.shouldActNow ? 'Precaution warranted' : 'Hold / monitor' },
  ],
  chart: (s, p) => {
    const pts = samples(10, 95, 40, u => M.computeRates({ exposedShare: u / 100 }).rawNumeratorShare * 100);
    const curY = s.e.rates.rawNumeratorShare * 100;
    return chart({
      x0: 10, x1: 95, y0: 0, y1: 100, h: 180,
      xlabel: 'fleet adoption share (%)', ylabel: 'raw beacon share of accidents (%)',
      label: 'How raw incident share rises with fleet adoption even when beacons cut per-vessel risk',
      marks: [[p.exposedShare * 100, curY, `${curY.toFixed(0)}% raw share`]],
      series: [
        { cls: 'trend', pts: [[10, 50], [95, 50]], tag: [18, 55, '50% raw parity'] },
        { pts },
      ],
    });
  },
  PLATES: {
    counts: { text: 'In 1954 tobacco ads highlighted narrow laboratory doubts while inviting smokers to keep buying until every question closed. Separating stated evidence from the hidden bridge ("keep acting as before until certainty") reveals who bears the waiting risk.' },
    rates: { text: 'Compare two complete rates: Events / Exposed vs Events / Unexposed. Numerators without denominators let high adoption masquerade as high hazard.' },
  },
};
