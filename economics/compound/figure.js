// Figure E.1 as a machine: six steps from the first ₹1,000 to twenty years, then two comparisons.
import { buildWorld, colX, UNIT } from './world.js';
import * as M from './model.js';
import { V } from '../../engine/parts.js';

const year = s => Math.min(Math.floor(s.whole / 12) + (s.whole % 12 ? 1 : 0), M.YEARS);
const pct = x => `${(100 * x).toFixed(1)} %`;
const whole = { target: [0.2, 1.45, 0], az: -16, el: 12, dist: 18.5 };

export const FIGURE = {
  no: 'E.1', title: '₹1,000 a month at 8 %', question: 'How does ₹1,000 a month grow?',
  bigIdea: `interest earns interest, so the pot grows faster every year. After 20 years, ${M.rupees(M.deposited(M.MONTHS))} paid in has become ${M.rupees(M.pot(M.MONTHS))}: more of it is interest than savings.`,
  intro: { cam: { target: [colX(1) + 0.6, 1.55, 0], az: -12, el: 13, dist: 13.5 }, lit: 'coin', fig: 'An empty pot' },
  lookKeys: ['coin', 'simple', 'late'],
  // the twenty columns are a wide scene: framed for the 1.65 canvas a desktop gives, pulled back on anything narrower
  frameAspect: 1.65, narrowZoom: 1.1,
  // designed discrete changes: each month's coin and deposit in the coin-by-coin year, the coin landing, each new year's column
  events: [...Array.from({ length: 13 }, (_, m) => m), ...Array.from({ length: 12 }, (_, m) => m + 0.85), ...Array.from({ length: M.YEARS }, (_, y) => 12 * y)],
  STEPS: [
    { label: 'Save ₹1,000 a month', fig: 'The first year, coin by coin', run: 12, play: 7, real: 12 * M.MONTH_S,
      hint: `Each month a ₹1,000 coin goes in. First the bank adds ${(100 * M.r).toFixed(2)} % of what is already there.`,
      cam: { target: [colX(1) + 0.6, 1.55, 0], az: -12, el: 13, dist: 13.5 }, lit: 'coin', look: { coin: 1 },
      sounds: Array.from({ length: 12 }, (_, k) => ({ at: (k + 0.85) * 7 / 12, word: 'clink', dur: 0.5, where: () => V(colX(1), M.pot(k) * UNIT + 0.2, 0) })) },
    { label: 'Five years', fig: 'A thin skin of interest', run: 48, play: 5, real: 48 * M.MONTH_S,
      hint: 'Red is interest. In the first years it is a thin skin on top of what you paid in.',
      cam: { target: [colX(3), 1.0, 0], az: -16, el: 12, dist: 12 }, lit: 'stack', look: { coin: 0 } },
    { label: 'Ten years', fig: 'Interest on interest', run: 60, play: 5, real: 60 * M.MONTH_S,
      hint: 'Interest now earns interest. Each year the red grows by more than the year before.',
      cam: { target: [colX(6), 1.2, 0], az: -16, el: 12, dist: 14.5 }, lit: 'stack', look: { coin: 0 } },
    { label: 'Twenty years', fig: 'More interest than savings', run: 120, play: 6, real: 120 * M.MONTH_S,
      hint: `${M.rupees(M.deposited(M.MONTHS))} went in. The pot holds ${M.rupees(M.pot(M.MONTHS))}. Most of it is interest.`,
      cam: whole, lit: 'stack', look: { coin: 0 } },
    { label: 'If interest didn’t earn interest', fig: 'Simple interest, dashed', run: 0, play: 2.5,
      hint: `The dashed outlines are simple interest, where interest is never added back: ${M.rupees(M.simplePot(M.MONTHS))}. The gap is interest on interest.`,
      cam: whole, lit: 'stack', look: { simple: 1 } },
    { label: 'Start ten years later', fig: 'The late saver, in blue', run: 0, play: 2.5,
      hint: `Blue: the same ₹1,000 a month, started in year 11. Half the money in, less than a third of the pot (${M.rupees(M.latePot(M.MONTHS))}).`,
      cam: { ...whole, el: 16 }, lit: 'late', look: { late: 1 } },
  ],
  buildWorld(E) { const W = buildWorld(E); return { update: (s, look) => W.update(s, look), labels: W.labels }; },
  state: clock => M.at(clock),
  readout: s => `month ${s.whole}   year ${year(s)}\npot ${M.rupees(s.pot)}`,
  chips: [
    { label: 'Paid in', from: 1, value: s => M.rupees(s.deposited) },
    { label: 'Interest', from: 1, value: s => M.rupees(s.interest) },
    { label: 'The pot', from: 1, value: s => M.rupees(s.pot) },
    { label: 'Interest share', from: 2, value: s => s.pot ? pct(s.interest / s.pot) : '–' },
    { label: 'Without interest on interest', from: 5, value: s => M.rupees(s.simple) },
    { label: 'Starting 10 years later', from: 6, value: s => M.rupees(s.late) },
  ],
  PLATES: {
    stack: { text: `Each column is the pot at the end of a year. White is what you paid in, ${M.rupees(12 * M.P)} a year. Red is interest: the bank pays ${(100 * M.r).toFixed(2)} % a month on everything in the pot, including last month's interest, so the red part grows by more every year. Real accounts differ a little (some add interest every quarter, and interest may be taxed), but the shape is the same.`,
      facts: s => [['paid in', M.rupees(s.deposited)], ['interest', M.rupees(s.interest)], ['interest share', s.pot ? pct(s.interest / s.pot) : '–'], ['8 % a year, monthly, is', pct(M.EFFECTIVE) + ' a year']] },
    coin: { text: `This month's ₹1,000. It goes in at the end of the month, after that month's interest, so it starts earning next month. A sum left alone at this rate doubles in ${(M.DOUBLE_MONTHS / 12).toFixed(1)} years; the rule of 72 says 72 ÷ 8 = 9.` },
    late: { text: `Someone who waits ten years and then saves the same ₹1,000 a month pays in ${M.rupees(M.deposited(M.MONTHS - M.LATE))}, half as much, but ends with ${M.rupees(M.latePot(M.MONTHS))}, ${(100 * M.latePot(M.MONTHS) / M.pot(M.MONTHS)).toFixed(0)} % of the early saver's pot. The early years matter most, because their money has the longest to compound.` },
  },
};
