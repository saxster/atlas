import { buildWorld } from './world.js';
import * as M from './model.js';
import { chart, samples } from '@saxster/atlas/chart.js';

let cache = null;
const experiment = p => {
  const key = `${p.foamVolumeIn3}|${p.pBreach}|${p.buggyPriorPass}`;
  if (!cache || cache.key !== key) cache = { key, e: M.run(p) };
  return cache.e;
};

export const FIGURE = {
  no: 'CT.9',
  title: 'Columbia Crater extrapolation & value of information',
  question: 'Why did calling a 640× larger foam strike "in-family" violate both model scope and expected Value of Information?',
  bigIdea: 'Extrapolating Boeing’s Crater empirical curve 640× beyond its calibrated 3 in³ test data produced false reassurance while PowerPoint slide bullets hid the assumption. Meanwhile, Value-of-Information analysis shows that when catastrophic loss is high, even a 1% chance of salvageable breach dwarfs the modest cost of looking with ground/orbital optics.',
  PAGES: [{ cam: { target: [0.05, 1.05, 0], az: -10, el: 12, dist: 15.8 }, lit: 'wing', fig: '640× Crater foam extrapolation & Value-of-Information bar' }],
  narrowZoom: 1.15,
  params: { foamVolumeIn3: 1920, pBreach: 0.05, buggyPriorPass: 0 },
  controls: [
    { key: 'foamVolumeIn3', label: 'Debris strike volume (in³)', min: 3, max: 1920, step: 50, fmt: v => `${v} in³` },
    { key: 'pBreach', label: 'Assessed breach risk P(breach)', min: 0.002, max: 0.25, step: 0.005, fmt: v => `${(v * 100).toFixed(1)}%` },
    { key: 'buggyPriorPass', label: 'Decision lens', min: 0, max: 1, step: 1, fmt: v => v ? 'Buggy: Prior Survival = "In-Family"' : 'VOI: Extrapolation Limit + Look Option' },
  ],
  predict: {
    q: 'An empirical wing-tile damage equation was calibrated on foam pieces up to 3 cubic inches. During launch, a piece roughly 1,920 cubic inches (640× larger) strikes the wing leading edge. What does a "no burn-through" output from that equation justify?',
    choices: [
      'Almost nothing beyond flagging that the strike sits 640× outside calibrated test bounds — justifying an immediate visual check if option value exists',
      'Certainty that the wing survived, because equations always remain valid at larger scales',
      'Proving the strike is "in-family" because previous foam hits did not destroy prior orbiters',
      'Wait until re-entry before requesting any images so the equation stays undisturbed',
    ],
    answer: () => 0,
    why: () => 'Empirical regression fits only where tested. Extrapolating 640× past tested volume invalidates confidence, while high stakes plus low imaging cost make Value of Information strongly positive.',
  },
  run: { label: 'Simulate 640× debris strike & VOI', duration: () => M.DURATION },
  buildWorld: (E, p) => buildWorld(E, p),
  lookKeys: [],
  state: (clock, reduced, p) => {
    const e = experiment(p), t = reduced ? M.DURATION : clock;
    return { e, t, snap: M.snapshot(e, t) };
  },
  readout: s => `foam=${s.snap.curVol.toFixed(0)} in³ (${s.snap.extrapolationFactor.toFixed(0)}× calibrated)\nnet VOI = +${s.e.voi.netVOI.toFixed(1)} (look threshold p*=${(s.e.voi.pThreshold * 100).toFixed(2)}%)`,
  chips: [
    { label: 'Debris volume vs 3 in³ test', value: s => `${s.snap.extrapolationFactor.toFixed(0)}× test max` },
    { label: 'Model scope status', value: s => s.snap.outOfEnvelope ? 'Outside calibrated bounds' : 'Within test range' },
    { label: 'Breach threshold to justify looking', value: s => `p* = ${(s.e.voi.pThreshold * 100).toFixed(2)}%` },
    { label: 'Net Value of Information', value: s => `+${s.e.voi.netVOI.toFixed(1)} (vs cost ${s.e.voi.costLook})` },
    { label: '18-flight luck survival (p=12%)', value: s => `${(s.e.surv18 * 100).toFixed(1)}% (not safety proof!)` },
  ],
  chart: (s, p) => {
    const pts = samples(0.1, 25, 40, pctVal => M.valueOfInformation({ pBreach: pctVal / 100 }).netVOI);
    return chart({
      x0: 0, x1: 25, y0: -20, y1: 1000, h: 180,
      xlabel: 'assessed wing-breach risk (%)', ylabel: 'net Value of Information',
      label: 'Net Value of Information of requesting orbital imagery vs assessed wing-breach probability',
      marks: [[p.pBreach * 100, s.e.voi.netVOI, `VOI +${s.e.voi.netVOI.toFixed(0)}`]],
      series: [
        { cls: 'trend', pts: [[0, 0], [25, 0]], tag: [14, 40, 'break-even VOI = 0'] },
        { pts },
      ],
    });
  },
  PLATES: {
    wing: { text: 'The Columbia Accident Investigation Board documented that Boeing’s Crater model was stretched 640× past its debris calibration while management treated prior non-fatal strikes as proof of safety.' },
    voi: { text: 'Even when an outcome looks unlikely, if a low-cost check unlocks rescue or heat-shield repair options, option value demands taking the picture.' },
  },
};
