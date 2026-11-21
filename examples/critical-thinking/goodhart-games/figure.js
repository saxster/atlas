import { buildWorld } from './world.js';
import * as M from './model.js';
import { chart, samples } from '@saxster/atlas/chart.js';

let cache = null;
const experiment = p => {
  const key = `${p.quotaPressure}|${p.auditStrength}|${p.gameKind}`;
  if (!cache || cache.key !== key) cache = { key, e: M.run(p) };
  return cache.e;
};

export const FIGURE = {
  no: 'CT.6',
  title: 'Targets, Goodhart’s law & strategic games',
  question: 'Why did Wells Fargo’s "Eight is Great" cross-sell target manufacture millions of unauthorized accounts — and when do payoffs trap rational players?',
  bigIdea: 'Goodhart’s Law warns that when an unverified proxy becomes a high-stakes target, workers maximize the metric rather than customer welfare. In strategic decisions, distinguishing Prisoner’s Dilemmas (where defection dominates) from Assurance Games (where verification makes mutual cooperation stable) determines what institutional safeguard works.',
  PAGES: [{ cam: { target: [0.05, 1.05, 0], az: -10, el: 13, dist: 15.6 }, lit: 'goodhart', fig: 'Goodhart metric divergence & 2×2 game payoff landscape' }],
  narrowZoom: 1.15,
  params: { quotaPressure: 0.75, auditStrength: 0.25, gameKind: 0 },
  controls: [
    { key: 'quotaPressure', label: 'Daily quota pressure', min: 0.0, max: 1.0, step: 0.05, fmt: v => `${Math.round(v * 100)}%` },
    { key: 'auditStrength', label: 'Independent customer consent audit', min: 0.0, max: 1.0, step: 0.05, fmt: v => `${Math.round(v * 100)}%` },
    { key: 'gameKind', label: 'Strategic dilemma model', min: 0, max: 2, step: 1, fmt: v => ['Prisoner’s Dilemma', 'Assurance Game', 'Shared Bill Split'][v] },
  ],
  predict: {
    q: 'A bank pushes branches toward 8 accounts per customer by tying branch pay to raw account counts without checking customer consent. If the bank fires staff without changing the target or adding independent customer verification, what happens?',
    choices: [
      'Goodhart distortion persists: pressure without verified consent shifts gaming from one employee to the next',
      'Firing a few staff automatically makes raw account counts measure real customer satisfaction',
      'Lowering customer audits makes the proxy metric more accurate',
      'Customers automatically benefit whenever proxy counts double',
    ],
    answer: () => 0,
    why: () => 'When incentives reward an unverified proxy, changing personnel leaves the structural Goodhart trap intact. Replacing raw counts with customer-verified active usage aligns metric and value.',
  },
  run: { label: 'Apply quota & audit regime', duration: () => M.DURATION },
  buildWorld: (E, p) => buildWorld(E, p),
  lookKeys: [],
  state: (clock, reduced, p) => {
    const e = experiment(p), t = reduced ? M.DURATION : clock;
    return { e, t, snap: M.snapshot(e, t) };
  },
  readout: s => `proxy=${s.snap.accountsVis.toFixed(1)} accts · true trust=${Math.round(s.snap.trustVis * 100)}%\n${s.e.game.name}`,
  chips: [
    { label: 'Reported proxy accounts', value: s => `${s.snap.accountsVis.toFixed(1)} / cust` },
    { label: 'Genuine customer trust', value: s => `${Math.round(s.snap.trustVis * 100)}%` },
    { label: 'Unauthorized share', value: s => `${Math.round(s.e.goodhart.unauthorizedShare * 100)}%` },
    { label: 'Game model', value: s => s.e.game.name },
    { label: 'Equilibrium outcome', value: s => s.e.game.equilibria[0] },
  ],
  chart: (s, p) => {
    const pts = samples(0, 100, 40, q => M.goodhartDivergence({ quotaPressure: q / 100, auditStrength: p.auditStrength }).genuineCustomerTrust * 100);
    const curY = s.snap.trustVis * 100;
    return chart({
      x0: 0, x1: 100, y0: 0, y1: 100, h: 180,
      xlabel: 'quota pressure (%)', ylabel: 'genuine customer trust (%)',
      label: 'Genuine customer trust vs quota pressure under current independent audit strength',
      marks: [[p.quotaPressure * 100, curY, `${curY.toFixed(0)}% trust`]],
      series: [
        { cls: 'trend', pts: [[0, 75], [100, 75]], tag: [18, 78, 'healthy trust floor'] },
        { pts },
      ],
    });
  },
  PLATES: {
    goodhart: { text: 'Wells Fargo employees opened millions of unauthorized deposit and credit-card accounts to hit cross-sell targets ("Going for Gr-Eight") while ignoring complaints.' },
    games: { text: 'Distinguishing a Prisoner’s Dilemma (needs enforceable rules) from an Assurance Game (needs mutual visibility) avoids diagnosing every coordination failure as malice.' },
  },
};
