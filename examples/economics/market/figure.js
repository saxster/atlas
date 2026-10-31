// Figure E.2 as a machine: six steps from the first low-cost units to the market-clearing intersection (Q* = 40, P* = ₹50),
// overshooting where MC > P_d, a price ceiling at ₹30, and a demand surge.
import { buildWorld } from './world.js';
import * as M from './model.js';

const whole = { target: [-0.95, 1.12, 0], az: -8, el: 7, dist: 16.8 };
const closeCost = { target: [-1.55, 1.12, 0], az: -10, el: 8, dist: 14.8 };
const closeMkt = { target: [0.35, 1.12, 0], az: -8, el: 7, dist: 14.5 };

export const FIGURE = {
  no: 'E.2',
  title: 'Where supply meets demand',
  question: 'Why does a competitive market settle where supply crosses demand?',
  bigIdea: `the supply curve is simply the slope of Total Cost: MC = dC/dQ = 10 + Q. As long as buyers value the next unit more than it costs to make (P_d > MC), trading another unit adds to social surplus — right up to Q* = ${M.Q_STAR} units at P* = ₹${M.P_STAR}, where P_d(Q*) = MC(Q*).`,
  intro: { cam: closeCost, lit: 'cost', fig: 'Total cost C(Q) and its marginal-cost slope', look: { ceiling: 0, shift: 0 } },
  lookKeys: ['ceiling', 'shift'],
  frameAspect: 1.5,
  narrowZoom: 1.18,
  STEPS: [
    {
      label: 'First 10 units: cheap to make, high buyer value',
      fig: 'Slope dC/dQ gives Marginal Cost MC(10) = ₹20',
      run: 10, play: 3.2,
      hint: 'At Q = 10, the tangent slope of Total Cost is MC = ₹20/unit while buyers are willing to pay P_d = ₹80 — a ₹60 gain on the 10th unit.',
      cam: closeCost, lit: 'cost', look: { ceiling: 0, shift: 0 },
    },
    {
      label: 'Expanding to 25 units: rising marginal cost',
      fig: 'Crowded ovens push MC up to ₹35',
      run: 15, play: 3.2,
      hint: 'As output climbs to Q = 25, overtime and fuller ovens steepen C(Q) to MC = ₹35, narrowing the gap below buyer willingness to pay (P_d = ₹65).',
      cam: whole, lit: 'market', look: { ceiling: 0, shift: 0 },
    },
    {
      label: 'Market clearing (Q* = 40, P* = ₹50)',
      fig: 'Supply meets demand: maximum surplus ₹1,600',
      run: 15, play: 3.5,
      hint: `At Q* = ${M.Q_STAR}, the last unit costs MC = ₹${M.P_STAR} to produce and is worth P_d = ₹${M.P_STAR} to the marginal buyer. Consumer surplus (₹800) + producer surplus (₹800) reaches its peak of ₹1,600.`,
      cam: closeMkt, lit: 'market', look: { ceiling: 0, shift: 0 },
    },
    {
      label: 'Why stop at 40? (Overshoot to Q = 52)',
      fig: 'Beyond Q* = 40, MC exceeds buyer value',
      run: 12, play: 3.0,
      hint: 'At Q = 52, producing the 52nd unit costs MC = ₹62 while buyers only value it at P_d = ₹38 — destroying ₹24 of value on that unit.',
      cam: whole, lit: 'market', look: { ceiling: 0, shift: 0 },
    },
    {
      label: 'Price ceiling at P = ₹30 (shortage & deadweight loss)',
      fig: 'Trade stalls at Q_s = 20, losing ₹400 of surplus',
      run: -32, play: 3.0,
      hint: 'Capping the price at ₹30 makes units 21..40 unprofitable to bake (Q_s = 20) while buyers want Q_d = 60, leaving a shortage of 40 units and ₹400 of deadweight loss.',
      cam: closeMkt, lit: 'ceiling', look: { ceiling: 1, shift: 0 },
    },
    {
      label: 'Demand surge (P_d shifts to 110 − Q)',
      fig: 'New equilibrium at Q* = 50, P* = ₹60',
      run: 30, play: 3.0,
      hint: 'Amber: when buyers’ willingness to pay rises by ₹20, price bids up along the marginal-cost curve to a new market-clearing equilibrium at Q* = 50, P* = ₹60.',
      cam: closeMkt, lit: 'shift', look: { ceiling: 0, shift: 1 },
    },
  ],
  buildWorld(E) {
    const W = buildWorld(E);
    return { update: (s, look) => W.update(s, look), labels: W.labels };
  },
  state: clock => {
    const Q = Math.max(2, Math.min(M.Q_MAX, clock));
    return {
      Q,
      cost: M.totalCost(Q),
      mc: M.marginalCost(Q),
      pd: M.demandPrice(Q),
      cs: M.consumerSurplus(Math.min(Q, M.Q_STAR)),
      ps: M.producerSurplus(Math.min(Q, M.Q_STAR)),
    };
  },
  readout: s => `Q = ${s.Q.toFixed(0)} units   MC = ₹${s.mc.toFixed(0)} · P_d = ₹${s.pd.toFixed(0)}\ntotal cost C(Q) = ₹${s.cost.toFixed(0)}`,
  chips: [
    { label: 'Quantity Q', from: 1, value: s => `${s.Q.toFixed(0)} units` },
    { label: 'Total cost C(Q)', from: 1, value: s => `₹${s.cost.toFixed(0)}` },
    { label: 'Marginal cost MC = dC/dQ', from: 1, value: s => `₹${s.mc.toFixed(0)} /unit` },
    { label: 'Buyer value P_d(Q)', from: 2, value: s => `₹${s.pd.toFixed(0)} /unit` },
    { label: 'Consumer + Producer surplus', from: 3, value: s => `₹${s.cs.toFixed(0)} + ₹${s.ps.toFixed(0)}` },
    { label: 'Ceiling shortage (at ₹30)', from: 5, value: () => `40 units (DWL ₹400)` },
  ],
  PLATES: {
    cost: {
      text: `Total cost C(Q) = 40 + 10Q + ½Q² starts at fixed cost ₹40 and curves upward because each additional batch requires costlier inputs. Its derivative dC/dQ = 10 + Q is the Marginal Cost (MC) — the minimum price a price-taking seller must receive to willingly produce unit Q.`,
      facts: s => [
        ['output Q', `${s.Q.toFixed(0)} units`],
        ['total cost C(Q)', `₹${s.cost.toFixed(0)}`],
        ['variable cost C(Q) − C(0)', `₹${(s.cost - M.C0).toFixed(0)}`],
        ['marginal cost dC/dQ', `₹${s.mc.toFixed(2)} /unit`],
      ],
    },
    market: {
      text: `By the Fundamental Theorem of Calculus, the area under the marginal-cost curve ∫₀^Q MC(q) dq equals total variable cost C(Q) − C(0). At the market-clearing price P* = ₹50 (Q* = 40), the green triangle between P* and MC(q) is Producer Surplus (₹800), and the blue triangle between P_d(q) and P* is Consumer Surplus (₹800).`,
      facts: s => [
        ['equilibrium (Q*, P*)', `${M.Q_STAR} units at ₹${M.P_STAR}`],
        ['consumer surplus at Q*', `₹${M.consumerSurplus(M.Q_STAR).toFixed(0)}`],
        ['producer surplus at Q*', `₹${M.producerSurplus(M.Q_STAR).toFixed(0)}`],
      ],
    },
    ceiling: {
      text: `A binding price ceiling below P* = ₹50 prevents mutually beneficial trades between Q_s = 20 and Q* = 40, where buyers value units at ₹50–₹70 and sellers could make them for ₹30–₹50. That lost amber triangle is the deadweight loss (₹400).`,
    },
    shift: {
      text: `An outward shift in demand raises price from ₹50 to ₹60, signalling producers to move up their marginal-cost curve from 40 to 50 units.`,
    },
  },
};
