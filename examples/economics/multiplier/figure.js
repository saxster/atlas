// Figure E.4 as a machine: five steps from an initial ₹100 Cr injection through round-by-round re-spending (MPC = 0.75)
// and savings leakages (MPS = 0.25) to the 4× Keynesian multiplier equilibrium (₹400 Cr).
import { buildWorld } from './world.js';
import * as M from './model.js';

const whole = { target: [0.15, 1.12, 0], az: -8, el: 7, dist: 17.2 };
const closeCas = { target: [-1.6, 1.12, 0], az: -8, el: 7, dist: 14.5 };
const closeCross = { target: [1.55, 1.12, 0], az: -8, el: 7, dist: 14.5 };

export const FIGURE = {
  no: 'E.4',
  title: 'How ₹100 of spending becomes ₹400 of income',
  question: 'Why does an initial ₹100 Cr burst of spending create a multiple of itself in total national income — and why doesn’t it grow forever?',
  bigIdea: `one person’s spending is the next person’s income. When households re-spend c = 75 % of every extra rupee and save s = 25 %, an initial ₹100 Cr injection triggers a geometric cascade 100 + 75 + 56.25 + 42.19 + ··· = ₹100 Cr / (1 − 0.75) = ₹400 Cr — stopping once the 25 % savings leakages add up to the full ₹100 Cr injected.`,
  intro: { cam: closeCas, lit: 'cascade', fig: 'Round 1 spending injection & geometric cascade', look: {} },
  lookKeys: [],
  frameAspect: 1.55,
  narrowZoom: 1.2,
  STEPS: [
    {
      label: 'Round 1: Initial ₹100 Cr injection (ΔG)',
      fig: 'Bridge builders earn ₹100 Cr of new income',
      run: 1, play: 2.6,
      hint: 'An autonomous ₹100 Cr project pays workers and suppliers ₹100 Cr in Round 1. Out of that ₹100 Cr, households set aside 25 % (₹25 Cr, amber cap) in savings and prepare to spend 75 % (₹75 Cr, red bar).',
      cam: closeCas, lit: 'cascade', look: {},
    },
    {
      label: 'Round 2: Re-spending 75 % (+₹75 Cr)',
      fig: 'Cumulative income climbs to ₹175 Cr',
      run: 1, play: 2.8,
      hint: 'When workers spend ₹75 Cr at grocers and tailors, those shopkeepers earn ₹75 Cr of Round 2 income — saving 25 % (₹18.75 Cr) and passing on 75 % (₹56.25 Cr). Total income is now ₹175 Cr.',
      cam: closeCas, lit: 'cascade', look: {},
    },
    {
      label: 'Rounds 3 to 5: The diminishing ripple',
      fig: '+₹56.25 + ₹42.19 + ₹31.64 Cr → ₹305 Cr after 5 rounds',
      run: 3, play: 3.4,
      hint: 'Each subsequent round multiplies by c = 0.75. After 5 rounds, over three-quarters of the total multiplier effect (₹305.08 Cr out of ₹400 Cr) has already occurred.',
      cam: whole, lit: 'cascade', look: {},
    },
    {
      label: 'The Keynesian Cross staircase (k = 1 / (1 − c) = 4×)',
      fig: 'AE = ΔG + 0.75·Y crosses the 45° line at ΔY* = ₹400 Cr',
      run: 7, play: 3.6,
      hint: 'On the Keynesian Cross, the ₹100 Cr vertical shift of AE = ΔG + 0.75·Y has slope 0.75, so the green staircase steps rightward until it meets the 45° line AE = Y at ΔY* = 100 / (1 − 0.75) = ₹400 Cr.',
      cam: closeCross, lit: 'cross', look: {},
    },
    {
      label: 'Why it stops: Savings leakages equal the ₹100 Cr injection',
      fig: '∑ ΔS_k = 0.25 × ₹400 Cr = ₹100 Cr',
      run: 28, play: 3.2,
      hint: 'Amber column: because 25 % leaks out into savings at every round, cumulative savings S_n = 0.25 × Y_n reach ₹100 Cr just as cumulative income reaches ₹400 Cr — draining the injection completely.',
      cam: whole, lit: 'leakage', look: {},
    },
  ],
  buildWorld(E) {
    const W = buildWorld(E);
    return { update: s => W.update(s), labels: W.labels };
  },
  state: clock => {
    const n = Math.max(1, Math.min(40, clock));
    const roundIdx = Math.min(M.N_ROUNDS - 1, Math.max(0, Math.floor(n - 1)));
    return {
      n,
      yCum: M.cumulativeIncome(n),
      sCum: M.cumulativeSaving(n),
      lastRound: M.roundSpending(roundIdx),
    };
  },
  readout: s => `rounds n = ${Math.min(12, Math.floor(s.n))}   cumulative income ΔY = ₹${s.yCum.toFixed(1)} Cr / ₹400 Cr\ncumulative savings leakage ΔS = ₹${s.sCum.toFixed(1)} Cr / ₹100 Cr`,
  chips: [
    { label: 'Initial injection ΔG', from: 1, value: () => `₹${M.DELTA_G} Cr` },
    { label: 'MPC (c) / MPS (1 − c)', from: 1, value: () => `75% spent · 25% saved` },
    { label: 'Current round spending ΔG·c^k', from: 2, value: s => `₹${s.lastRound.toFixed(2)} Cr` },
    { label: 'Cumulative income ΔY_n', from: 2, value: s => `₹${s.yCum.toFixed(1)} Cr` },
    { label: 'Multiplier k = 1 / (1 − c)', from: 4, value: () => `${M.MULTIPLIER.toFixed(1)}× (limit ₹${M.Y_INF} Cr)` },
    { label: 'Cumulative savings leakage S_n', from: 5, value: s => `₹${s.sCum.toFixed(1)} Cr` },
  ],
  PLATES: {
    cascade: {
      text: 'Richard Kahn (1931) and John Maynard Keynes (1936) showed that when an economy has idle capacity, an injection ΔG circulates from buyer to seller in a geometric series: ΔY = ΔG·(1 + c + c² + c³ + ···) = ΔG / (1 − c).',
      facts: s => [
        ['initial injection ΔG', `₹${M.DELTA_G} Cr`],
        ['re-spending fraction c (MPC)', '0.75 (75 %)'],
        ['cumulative income ΔY_n', `₹${s.yCum.toFixed(2)} Cr`],
      ],
    },
    cross: {
      text: 'Paul Samuelson’s Keynesian Cross plots planned expenditure AE(Y) = A + cY against the 45° line AE = Y. Because the expenditure line has slope c = 0.75, lifting its intercept by ΔG = ₹100 Cr moves the intersection 4× farther horizontally to ΔY* = ₹400 Cr.',
      facts: () => [
        ['vertical shift ΔG', '₹100 Cr'],
        ['slope d(AE)/dY = MPC', '0.75'],
        ['equilibrium ΔY* = ΔG / (1 − c)', '₹400 Cr'],
      ],
    },
    leakage: {
      text: 'Why doesn’t ₹100 Cr create infinite income? Because at every step a fraction s = 1 − c = 25 % leaks out of the spending stream into savings (or taxes and imports). Equilibrium is reached when total leakages s·ΔY equal the initial injection ΔG.',
      facts: s => [
        ['leakage rate s = 1 − c', '0.25 (25 %)'],
        ['cumulative savings S_n', `₹${s.sCum.toFixed(2)} Cr`],
        ['remaining active flow', `₹${(M.DELTA_G - s.sCum).toFixed(2)} Cr`],
      ],
    },
  },
};
