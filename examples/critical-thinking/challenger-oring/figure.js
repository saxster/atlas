import { buildWorld } from './world.js';
import * as M from './model.js';
import { chart, samples } from '@saxster/atlas/chart.js';

let cache = null;
const experiment = p => {
  const key = `${p.tempF}|${p.buggyCensored}`;
  if (!cache || cache.key !== key) cache = { key, e: M.run(p) };
  return cache.e;
};
const pct = x => `${(x * 100).toFixed(1)}%`;

export const FIGURE = {
  no: 'CT.7',
  title: 'Challenger O-ring censorship & dissent',
  question: 'Why did plotting only the 7 flights with O-ring damage hide the freezing-morning danger that killed Challenger’s crew?',
  bigIdea: 'Leaving out the 16 undamaged warm flights censored the exact baseline engineers needed. When all 23 prior launches are plotted against pad temperature, every flight at or below 63°F suffered O-ring distress — making a 31°F launch far outside verified safety margins.',
  PAGES: [{ cam: { target: [0.0, 1.05, 0], az: -10, el: 11, dist: 15.6 }, lit: 'joint', fig: 'SRB field joint cutaway & Tufte 23-flight temperature plot' }],
  narrowZoom: 1.15,
  params: { tempF: 31, buggyCensored: 0 },
  controls: [
    { key: 'tempF', label: 'Launch pad temperature (°F)', min: 28, max: 82, step: 1, fmt: v => `${v}°F` },
    { key: 'buggyCensored', label: 'Dataset shown', min: 0, max: 1, step: 1, fmt: v => v ? 'Buggy: 7 Damaged Flights Only' : 'Full: All 23 Prior Flights' },
  ],
  predict: {
    q: 'Morton Thiokol managers looked at a chart showing only the 7 prior Space Shuttle launches that had O-ring damage (spanning 53°F to 75°F) and saw no clear trend. What critical data was missing from that chart?',
    choices: [
      'The 16 undamaged flights — almost all of them occurred in warm 67–81°F weather',
      'The astronauts’ seat belt tension measurements',
      'The colour of the external fuel tank foam',
      'Weather forecasts for airports on the West Coast',
    ],
    answer: () => 0,
    why: () => 'Zero-incident flights carry decisive causal evidence! Every single launch below 66°F had O-ring distress, whereas 16 of 19 launches above 65°F had zero damage.',
  },
  run: { label: 'Cool pad from 75°F to launch temp', duration: () => M.DURATION },
  buildWorld: (E, p) => buildWorld(E, p),
  lookKeys: [],
  state: (clock, reduced, p) => {
    const e = experiment(p), t = reduced ? M.DURATION : clock;
    return { e, t, snap: M.snapshot(e, t) };
  },
  readout: s => `T=${s.snap.curTempF.toFixed(0)}°F · Viton flex=${Math.round(s.snap.curResil * 100)}%\nP(O-ring distress)=${pct(s.snap.curDistress)}`,
  chips: [
    { label: 'Current pad temperature', value: s => `${s.snap.curTempF.toFixed(0)}°F` },
    { label: 'Viton O-ring resiliency', value: s => `${Math.round(s.snap.curResil * 100)}%` },
    { label: 'Modelled distress risk', value: s => pct(s.snap.curDistress) },
    { label: 'Prior launches ≤ 63°F', value: () => '4 of 4 damaged (100%)' },
    { label: 'Prior launches ≥ 66°F', value: s => s.e.buggyCensored ? 'Hidden (3 damaged shown)' : '3 of 19 damaged (16 clean!)' },
  ],
  chart: (s, p) => {
    const pts = samples(28, 82, 54, T => M.distressProbability(T) * 100);
    return chart({
      x0: 28, x1: 82, y0: 0, y1: 100, h: 180,
      xlabel: 'launch ambient temperature (°F)', ylabel: 'P(O-ring distress) (%)',
      label: 'Modelled O-ring thermal distress probability vs launch pad temperature across all 23 flights',
      marks: [[s.snap.curTempF, s.snap.curDistress * 100, `${s.snap.curTempF.toFixed(0)}°F: ${pct(s.snap.curDistress)}`]],
      series: [
        { cls: 'trend', pts: [[53, 0], [53, 100]], tag: [54, 48, '53°F lowest prior flight'] },
        { pts },
      ],
    });
  },
  PLATES: {
    joint: { text: 'At the February 11, 1986 Rogers Commission hearing, Richard Feynman clamped an O-ring sample in a glass of ice water (32°F) and proved instantaneously that cold Viton loses its spring-back resiliency.' },
    plot: { text: 'Edward Tufte showed how removing 16 zero-incident warm launches turned an unmistakable cold-weather danger curve into an ambiguous flat scatter.' },
  },
};
