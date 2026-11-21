import { buildWorld } from './world.js';
import * as M from './model.js';
import { chart, samples } from '@saxster/atlas/chart.js';

let cache = null;
const experiment = p => {
  const key = `${p.botShare}|${p.independentPrimary}|${p.buggy}`;
  if (!cache || cache.key !== key) cache = { key, e: M.run(p) };
  return cache.e;
};

export const FIGURE = {
  no: 'CT.3',
  title: 'Echo chambers, sampling & provenance',
  question: 'When 12 outlets repeat the exact same figure and 70 % of public comments come from bots, how many independent witnesses exist?',
  bigIdea: 'Repetition is not corroboration. Twelve articles quoting one press release represent N_eff = 1 primary observation, not twelve confirmations. Similarly, counting 700 automated bot comments alongside 300 real residents reverses apparent majority support from 35 % to 78 %.',
  PAGES: [{ cam: { target: [0.05, 1.05, 0], az: -8, el: 10, dist: 15.6 }, lit: 'consultation', fig: 'Bot flood vs genuine sample & citation provenance chain' }],
  narrowZoom: 1.15,
  params: { botShare: 0.70, independentPrimary: 1, buggy: 0 },
  controls: [
    { key: 'botShare', label: 'Automated / duplicated submission share', min: 0.0, max: 0.90, step: 0.05, fmt: v => `${Math.round(v * 100)}%` },
    { key: 'independentPrimary', label: 'True independent primary studies', min: 1, max: 6, step: 1 },
    { key: 'buggy', label: 'Counting rule', min: 0, max: 1, step: 1, fmt: v => v ? 'Buggy: Count All Raw Copies' : 'Rigorous: Trace Primary Sources' },
  ],
  predict: {
    q: 'Five separate websites print the exact same decimal statistic down to 0.1%. A sixth website independently audits the raw government archive and publishes its own table. How many independent sources actually checked the data?',
    choices: [
      'Two at most — the original source behind those five copies plus the sixth independent audit',
      'Six completely independent confirmations',
      'Five confirmations, because identical numbers prove convergence',
      'Zero, because publishing numbers automatically invalidates them',
    ],
    answer: () => 0,
    why: () => 'Tracing the source chain shows that five copies sharing one upstream origin collapse to one observation. Only an independent audit of primary records adds a new witness.',
  },
  run: { label: 'Trace provenance & filter bots', duration: () => M.DURATION },
  buildWorld: (E, p) => buildWorld(E, p),
  lookKeys: [],
  state: (clock, reduced, p) => {
    const e = experiment(p), t = reduced ? M.DURATION : clock;
    return { e, t, snap: M.snapshot(e, t) };
  },
  readout: s => `outlets: ${s.snap.outletsAudited}/12 -> primary N_eff=${s.e.res.uniqueSources}\nraw support=${s.e.res.rawSupportPct}% vs human=${s.e.res.humanSupportPct}%`,
  chips: [
    { label: 'Published articles counted', value: s => `${s.snap.outletsAudited} / 12` },
    { label: 'Independent primary records', value: s => `${s.e.res.uniqueSources} (${s.e.res.apparentEvidenceRatio.toFixed(1)}× echo)` },
    { label: 'Apparent raw support', value: s => `${s.e.res.rawSupportPct}%` },
    { label: 'Verified human support', value: s => `${s.e.res.humanSupportPct}%` },
    { label: 'Human sampling margin (±)', value: s => `±${s.e.res.samplingMarginErrorPct}% (n=${s.e.res.humanComments})` },
  ],
  chart: (s, p) => {
    const pts = samples(0, 90, 40, b => M.provenanceCollapse({ botShare: b / 100 }).rawSupportPct);
    return chart({
      x0: 0, x1: 90, y0: 0, y1: 100, h: 180,
      xlabel: 'bot / duplicate share (%)', ylabel: 'apparent raw support (%)',
      label: 'How bot concentration inflates raw consultation support above true 35% human baseline',
      marks: [[p.botShare * 100, s.e.res.rawSupportPct, `${s.e.res.rawSupportPct}% raw`]],
      series: [
        { cls: 'trend', pts: [[0, 35], [90, 35]], tag: [12, 38, 'true human baseline 35%'] },
        { pts },
      ],
    });
  },
  PLATES: {
    consultation: { text: 'During the 2017 FCC net-neutrality consultation, millions of duplicated and stolen-identity filings drowned out individual comment counts until deduplication separated real respondents from automated bulk submissions.' },
    provenance: { text: 'Always ask: did five people observe the phenomenon independently, or did five writers copy one unverified memo (like the famous 10× spinach iron decimal error)?' },
  },
};
