import { buildWorld } from './world.js';
import * as M from './model.js';
import { chart, samples } from '@saxster/atlas/chart.js';

let cache = null;
const experiment = p => {
  const key = `${p.claimedAUMBillions}|${p.buggyPaperTrust}`;
  if (!cache || cache.key !== key) cache = { key, e: M.run(p) };
  return cache.e;
};

export const FIGURE = {
  no: 'CT.8',
  title: 'Ponzi capacity & independent custody',
  question: 'How could Harry Markopolos prove Madoff’s fund was mathematically impossible years before it collapsed — without seeing Madoff’s books?',
  bigIdea: 'Every physical or financial story has a market-wide capacity ceiling. Just as worldwide International Reply Coupons could not support Charles Ponzi’s payout scale and Theranos’s demo hid which machine ran the blood, $28–65 billion in split-strike collars required more OEX option contracts than existed on the entire Chicago Board Options Exchange — while DTC held under $18 million against $2.5 billion claimed.',
  PAGES: [{ cam: { target: [0.05, 1.1, 0], az: -9, el: 11, dist: 15.8 }, lit: 'exchange', fig: 'Global exchange option ceiling vs independent DTC custody' }],
  narrowZoom: 1.15,
  params: { claimedAUMBillions: 28, buggyPaperTrust: 0 },
  controls: [
    { key: 'claimedAUMBillions', label: 'Claimed assets under management ($B)', min: 2, max: 65, step: 1, fmt: v => `$${v}B` },
    { key: 'buggyPaperTrust', label: 'Verification method', min: 0, max: 1, step: 1, fmt: v => v ? 'Buggy: Trust Friend’s Bank Withdrawal' : 'Audit: Check Exchange Volume & DTC' },
  ],
  predict: {
    q: 'A friend shows you a real $50,000 cash withdrawal deposited into her bank from a secretive $28B hedge fund claiming S&P 100 option collars. Why does that genuine deposit NOT prove the fund is earning real market returns?',
    choices: [
      'A genuine withdrawal occurs under both real profits AND a Ponzi scheme paying old investors from new deposits — only independent custody & market capacity checks distinguish them',
      'Bank transfers cannot be trusted unless paid in gold coins',
      'A 12% steady return is legally impossible for any stock portfolio',
      'Because Nasdaq chairs cannot trade options legally',
    ],
    answer: () => 0,
    why: () => 'Both hypotheses predict your friend’s withdrawal clears cleanly while inflows grow. Checking external CBOE open interest and Depository Trust Company (DTC) custody separates them cleanly.',
  },
  run: { label: 'Scale AUM & test exchange ceiling', duration: () => M.DURATION },
  buildWorld: (E, p) => buildWorld(E, p),
  lookKeys: [],
  state: (clock, reduced, p) => {
    const e = experiment(p), t = reduced ? M.DURATION : clock;
    return { e, t, snap: M.snapshot(e, t) };
  },
  readout: s => `AUM: $${s.snap.aumVis.toFixed(1)}B (${Math.round(s.snap.requiredContracts / 1000)}k OEX contracts)\nworld share: ${(s.snap.shareOfWorldMarket * 100).toFixed(0)}% of CBOE open interest`,
  chips: [
    { label: 'Claimed AUM', value: s => `$${s.snap.aumVis.toFixed(1)}B` },
    { label: 'OEX option contracts needed', value: s => `${Math.round(s.snap.requiredContracts / 1000)}k` },
    { label: 'Share of global CBOE OEX market', value: s => `${(s.snap.shareOfWorldMarket * 100).toFixed(0)}%` },
    { label: 'Fairfield claim vs DTC record', value: () => '$2,500M vs <$18M' },
    { label: 'Capacity verdict', value: s => s.snap.impossible ? 'Impossible — exceeds world volume' : 'Fits within exchange volume' },
  ],
  chart: (s, p) => {
    const pts = samples(2, 65, 36, aum => M.optionCapacityCheck({ claimedAUMBillions: aum }).shareOfWorldMarket * 100);
    const curShare = s.snap.shareOfWorldMarket * 100;
    return chart({
      x0: 2, x1: 65, y0: 0, y1: 500, h: 180,
      xlabel: 'claimed fund AUM ($ billions)', ylabel: 'required % of global CBOE OEX',
      label: 'Required share of total global CBOE OEX open interest vs claimed fund assets',
      marks: [[s.snap.aumVis, curShare, `${curShare.toFixed(0)}% at $${s.snap.aumVis.toFixed(0)}B`]],
      series: [
        { cls: 'trend', pts: [[2, 100], [65, 100]], tag: [18, 120, '100% world open interest ceiling'] },
        { pts },
      ],
    });
  },
  PLATES: {
    exchange: { text: 'Harry Markopolos submitted his mathematical capacity proof ("The World’s Largest Hedge Fund is a Fraud") to the SEC in 2005 — demonstrating that Madoff’s alleged strategy exceeded global OEX volume.' },
    custody: { text: 'When Fairfield Sentry claimed $2.5B in S&P 100 stocks on Jan 31, 2005, independent DTC records held less than $18M.' },
  },
};
