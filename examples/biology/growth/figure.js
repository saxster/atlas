// Figure B.2 as a machine: six steps from 4 founding bacteria on fresh agar to the carrying capacity K = 240,
// then two comparisons (unconstrained exponential doubling and halving the sugar broth).
import { buildWorld } from './world.js';
import * as M from './model.js';

const whole = { target: [-0.1, 1.15, 0], az: -10, el: 8, dist: 16.5 };
const closeDish = { target: [-0.85, 1.15, 0], az: -12, el: 12, dist: 13.5 };
const T_STAR = M.inflectionTime();

export const FIGURE = {
  no: 'B.2',
  title: 'One cell to a crowded dish',
  question: 'Why doesn’t a dividing colony double forever?',
  bigIdea: `with fresh sugar, 4 bacteria double every hour. But each cell consumes a 1/${M.K} share of the dish’s capacity, slowing division by (1 − N/K) until growth peaks halfway up at K/2 = ${M.K_HALF} and levels off at K = ${M.K}.`,
  intro: { cam: closeDish, lit: 'dish', fig: 'Four founding bacteria on fresh agar', look: { exp: 0, half: 0 } },
  lookKeys: ['exp', 'half'],
  frameAspect: 1.5,
  narrowZoom: 1.18,
  STEPS: [
    {
      label: 'Two hours: 4 become 16',
      fig: 'Doubling on an open plate',
      run: 2.0, play: 3.5, real: 2 * 3600,
      hint: 'With 94 % of the sugar still free, each cell divides once an hour: 4 → 8 → 15 cells.',
      cam: closeDish, lit: 'dish', look: { exp: 0, half: 0 },
    },
    {
      label: 'Four hours: exponential takeoff',
      fig: 'The curve bends steeply upward',
      run: 2.0, play: 3.5, real: 2 * 3600,
      hint: 'More mothers divide each hour than the hour before, so the red growth-rate arrow stretches taller.',
      cam: whole, lit: 'curve', look: { exp: 0, half: 0 },
    },
    {
      label: 'Half full: fastest division',
      fig: `Inflection point at N = K/2 = ${M.K_HALF}`,
      run: T_STAR - 4.0, play: 3.5, real: (T_STAR - 4.0) * 3600,
      hint: `At t* = ${T_STAR.toFixed(1)} hr the dish is half full (120 cells) and adds cells at its peak rate, ${M.peakRate().toFixed(1)} an hour.`,
      cam: whole, lit: 'curve', look: { exp: 0, half: 0 },
    },
    {
      label: 'Ten hours: crowding at the limit K',
      fig: `Leveling off at K = ${M.K} cells`,
      run: M.HOURS - T_STAR, play: 4.5, real: (M.HOURS - T_STAR) * 3600,
      hint: `With ${M.logisticPop(M.HOURS).toFixed(0)} of ${M.K} spots taken, only ${(M.openShare(M.HOURS) * 100).toFixed(1)} % of the sugar remains and division slows to a crawl.`,
      cam: whole, lit: 'dish', look: { exp: 0, half: 0 },
    },
    {
      label: 'If sugar never ran out',
      fig: 'Unconstrained doubling 4 · 2ᵗ, in red',
      run: 0, play: 2.5,
      hint: `Red: without the (1 − N/K) crowding brake, 4 · 2¹⁰ would reach ${Math.round(M.expPop(M.HOURS)).toLocaleString('en-US')} cells — 17× the dish’s capacity.`,
      cam: whole, lit: 'exp', look: { exp: 1, half: 0 },
    },
    {
      label: 'Half the sugar broth',
      fig: `Halving K from ${M.K} to ${M.K_HALF}, in amber`,
      run: 0, play: 2.5,
      hint: `Amber: half the nutrient broth gives the same initial doubling speed, but caps the colony at K = ${M.K_HALF}.`,
      cam: whole, lit: 'half', look: { exp: 0, half: 1 },
    },
  ],
  buildWorld(E) {
    const W = buildWorld(E);
    return { update: (s, look) => W.update(s, look), labels: W.labels };
  },
  state: clock => ({
    t: clock,
    N: M.logisticPop(clock, M.K),
    rate: M.logisticRate(clock, M.K),
    open: M.openShare(clock, M.K),
    Nexp: M.expPop(clock),
    Nhalf: M.logisticPop(clock, M.K_HALF),
  }),
  readout: s => `hour ${s.t.toFixed(1)}   colony ${s.N.toFixed(0)} / ${M.K} cells\nrate dN/dt ${s.rate.toFixed(1)} cells/hr`,
  chips: [
    { label: 'Colony N(t)', from: 1, value: s => `${s.N.toFixed(0)} cells` },
    { label: 'Open sugar (1 − N/K)', from: 1, value: s => `${(s.open * 100).toFixed(0)} %` },
    { label: 'Growth rate dN/dt', from: 2, value: s => `${s.rate.toFixed(1)} /hr` },
    { label: 'Peak rate (at K/2)', from: 3, value: () => `${M.peakRate().toFixed(1)} /hr` },
    { label: 'Without crowding (4·2ᵗ)', from: 5, value: s => `${Math.round(s.Nexp).toLocaleString('en-US')} cells` },
    { label: 'Half sugar (K = 120)', from: 6, value: s => `${s.Nhalf.toFixed(0)} cells` },
  ],
  PLATES: {
    dish: {
      text: `The circular plate holds enough sugar to sustain K = ${M.K} bacteria. Each existing cell uses up 1/${M.K} of the nutrient supply, leaving the open share (1 − N/K) for new divisions.`,
      facts: s => [
        ['hour t', `${s.t.toFixed(2)} hr`],
        ['living cells N(t)', `${s.N.toFixed(1)} of ${M.K}`],
        ['open sugar 1 − N/K', `${(s.open * 100).toFixed(1)} %`],
        ['doubling time (unconstrained)', `${M.doublingTime().toFixed(1)} hr`],
      ],
    },
    curve: {
      text: `Verhulst’s logistic equation dN/dt = rN(1 − N/K) multiplies two competing factors: N (how many cells are ready to divide) and (1 − N/K) (how much resource is left). Their product is a parabola in N that peaks right in the middle at N = K/2 = ${M.K_HALF}.`,
      facts: s => [
        ['growth rate dN/dt', `${s.rate.toFixed(2)} cells/hr`],
        ['inflection time t*', `${T_STAR.toFixed(2)} hr (at N = ${M.K_HALF})`],
        ['peak rate rK/4', `${M.peakRate().toFixed(2)} cells/hr`],
      ],
    },
    exp: {
      text: `For the first three hours, 4 · 2ᵗ and the logistic curve are nearly indistinguishable because N/K is tiny. Exponential growth always looks harmless right until it hits the resource wall.`,
    },
    half: {
      text: `Halving the nutrient concentration cuts K from ${M.K} to ${M.K_HALF} and halves the maximum growth rate rK/4, while keeping the intrinsic per-capita rate r = ln 2 hr⁻¹ unchanged.`,
    },
  },
};
