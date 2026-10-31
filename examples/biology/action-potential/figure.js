// Figure B.4 as a machine: five steps through the Hodgkin–Huxley action potential from resting potential (-70 mV)
// to threshold (-55 mV), all-or-none Na⁺ depolarization spike, K⁺ repolarization, and refractory undershoot.
import { buildWorld } from './world.js';
import * as M from './model.js';

const whole = { target: [-0.1, 1.15, 0], az: -10, el: 8, dist: 16.5 };
const closeMembrane = { target: [-0.95, 1.15, 0], az: -14, el: 10, dist: 13.8 };

export const FIGURE = {
  no: 'B.4',
  title: 'Na⁺ rush and K⁺ reset',
  question: 'How does an axon fire a 100 mV electrical spike in two milliseconds without a wire?',
  bigIdea: `at rest, leak channels hold the membrane near K⁺’s Nernst potential (${M.V_REST} mV vs E_K = ${M.E_K} mV) while Na⁺ waits outside at E_Na = +${M.E_NA} mV. Crossing the ${M.V_TH} mV threshold snaps voltage-gated Na⁺ channels open in a runaway loop that flips V_m above +35 mV, before an inactivation ball plugs the Na⁺ pore and delayed K⁺ channels open to reset the membrane.`,
  intro: { cam: closeMembrane, lit: 'membrane', fig: 'Polarized axon membrane at −70 mV rest', look: { cond: 0 } },
  lookKeys: ['cond'],
  frameAspect: 1.5,
  narrowZoom: 1.18,
  STEPS: [
    {
      label: 'Resting state (V_m = −70 mV)',
      fig: 'K⁺ leak dominates while Na⁺/K⁺ gates sit closed',
      run: 0.8, play: 2.8, real: 0.0008,
      hint: `With 97 % of resting conductance coming from K⁺ leak (g_K = ${M.G_K_REST.toFixed(2)} vs g_Na = ${M.G_NA_REST} mS/cm²), the chord equation pins V_m at ${M.V_REST} mV, close to E_K = ${M.E_K} mV.`,
      cam: closeMembrane, lit: 'membrane', look: { cond: 0 },
    },
    {
      label: 'Threshold crossed (V_th = −55 mV)',
      fig: 'Stimulus lifts V_m to the point of no return',
      run: 0.7, play: 2.8, real: 0.0007,
      hint: `At t = 1.5 ms, local depolarization reaches V_th = ${M.V_TH} mV, tugging the voltage sensors of the blue Na⁺ channel so activation gate m begins to crack open.`,
      cam: whole, lit: 'naChannel', look: { cond: 1 },
    },
    {
      label: 'Depolarization spike (+35 mV overshoot)',
      fig: 'Runaway Na⁺ influx flips the membrane positive',
      run: 0.8, play: 3.4, real: 0.0008,
      hint: `More depolarization opens more Na⁺ channels (Hodgkin cycle): g_Na surges 500-fold to ${M.gNa(2.2).toFixed(1)} mS/cm², driving V_m through 0 mV toward E_Na = +${M.E_NA} mV.`,
      cam: whole, lit: 'naChannel', look: { cond: 1 },
    },
    {
      label: 'Na⁺ inactivation & K⁺ repolarization',
      fig: 'h-ball plugs Na⁺ pore; delayed K⁺ stream resets V_m',
      run: 1.3, play: 3.6, real: 0.0013,
      hint: `Within 1 ms, the red cytoplasmic ball (h gate) plugs the Na⁺ pore while delayed green K⁺ channels reach peak conductance (${M.gK(3.15).toFixed(1)} mS/cm²), carrying positive K⁺ ions out to repolarize the cell.`,
      cam: whole, lit: 'kChannel', look: { cond: 1 },
    },
    {
      label: 'Hyperpolarization undershoot & reset',
      fig: 'Slow K⁺ closure dips V_m to −76 mV before rest',
      run: 1.4, play: 3.4, real: 0.0014,
      hint: `Because K⁺ gates (n) close slowly, g_K briefly stays above rest while g_Na is inactivated, pulling V_m down to −76 mV near E_K = ${M.E_K} mV (refractory period) before settling back to ${M.V_REST} mV.`,
      cam: whole, lit: 'trace', look: { cond: 1 },
    },
  ],
  buildWorld(E) {
    const W = buildWorld(E);
    return { update: (s, look) => W.update(s, look), labels: W.labels };
  },
  state: clock => {
    const t = Math.min(M.DURATION, Math.max(0, clock));
    return {
      t,
      v: M.membranePotential(t),
      gNa: M.gNa(t),
      gK: M.gK(t),
      m: M.gateM(t),
      h: M.gateH(t),
      n: M.gateN(t),
    };
  },
  readout: s => `t = ${s.t.toFixed(2)} ms   V_m = ${s.v >= 0 ? '+' : '−'}${Math.abs(s.v).toFixed(1)} mV\ng_Na = ${s.gNa.toFixed(2)} · g_K = ${s.gK.toFixed(2)} mS/cm²`,
  chips: [
    { label: 'Membrane V_m(t)', from: 1, value: s => `${s.v >= 0 ? '+' : '−'}${Math.abs(s.v).toFixed(1)} mV` },
    { label: 'Na⁺ conductance g_Na', from: 2, value: s => `${s.gNa.toFixed(2)} mS/cm²` },
    { label: 'K⁺ conductance g_K', from: 2, value: s => `${s.gK.toFixed(2)} mS/cm²` },
    { label: 'Na⁺ gates (m open / h unblocked)', from: 3, value: s => `m ${(s.m * 100).toFixed(0)}% · h ${(s.h * 100).toFixed(0)}%` },
    { label: 'K⁺ delayed gate n', from: 4, value: s => `${(s.n * 100).toFixed(0)} % open` },
    { label: 'Nernst limits E_Na / E_K', from: 5, value: () => `+${M.E_NA} / ${M.E_K} mV` },
  ],
  PLATES: {
    membrane: {
      text: `The Na⁺/K⁺ pump maintains steep concentration gradients across the bilayer: [Na⁺] is ${M.NA_OUT.toFixed(0)} mM outside vs ${M.NA_IN.toFixed(0)} mM inside (E_Na = +${M.E_NA} mV), while [K⁺] is ${M.K_OUT.toFixed(1)} mM outside vs ${M.K_IN.toFixed(0)} mM inside (E_K = ${M.E_K} mV).`,
      facts: s => [
        ['time t', `${s.t.toFixed(2)} ms`],
        ['membrane potential V_m', `${s.v.toFixed(1)} mV`],
        ['E_Na (Nernst)', `+${M.E_NA.toFixed(1)} mV`],
        ['E_K (Nernst)', `${M.E_K.toFixed(1)} mV`],
      ],
    },
    naChannel: {
      text: `Voltage-gated Na⁺ channels have two gates with opposite voltage responses: a fast activation gate m that snaps open upon depolarization, and a slower cytoplasmic ball-and-chain gate h that plugs the pore ~1 ms later, enforcing unidirectional propagation and the absolute refractory period.`,
      facts: s => [
        ['g_Na(t)', `${s.gNa.toFixed(2)} mS/cm²`],
        ['activation gate m', `${(s.m * 100).toFixed(0)} %`],
        ['inactivation gate h (open)', `${(s.h * 100).toFixed(0)} %`],
      ],
    },
    kChannel: {
      text: `Delayed-rectifier K⁺ channels have a single slow activation gate n. Because n opens after Na⁺ channels are already inactivating, outward K⁺ current does not cancel the rising spike—instead it cleanly drives V_m back down toward E_K = ${M.E_K} mV.`,
      facts: s => [
        ['g_K(t)', `${s.gK.toFixed(2)} mS/cm²`],
        ['K⁺ gate n', `${(s.n * 100).toFixed(0)} %`],
      ],
    },
    trace: {
      text: `At every instant, the chord conductance equation V_m = (g_Na E_Na + g_K E_K + g_L E_L) / (g_Na + g_K + g_L) is a tug-of-war weighted by each ion’s conductance. Whichever ion has the highest conductance pulls V_m toward its own Nernst equilibrium potential.`,
    },
  },
};
