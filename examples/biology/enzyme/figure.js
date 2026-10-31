// Figure B.3 as a machine: four steps along the Michaelis–Menten saturation curve from dilute substrate
// to active-site saturation, followed by competitive and non-competitive inhibition comparisons.
import { buildWorld } from './world.js';
import * as M from './model.js';

const whole = { target: [-0.1, 1.15, 0], az: -10, el: 8, dist: 16.5 };
const closeEnzyme = { target: [-0.85, 1.15, 0], az: -14, el: 10, dist: 13.8 };

export const FIGURE = {
  no: 'B.3',
  title: 'Lock, key and saturation',
  question: 'Why does adding more substrate stop speeding up an enzyme?',
  bigIdea: `at low concentration, empty catalytic clefts wait for collisions so rate rises in proportion to [S]. Above K_m = ${M.K_M} mM (where half the ${M.E_TOT} enzyme sites are full), almost every cleft is already busy cleaving substrate at its turnover limit k_cat = ${M.K_CAT} s⁻¹, capping the rate at V_max = ${M.V_MAX} μM/s.`,
  intro: { cam: closeEnzyme, lit: 'enzyme', fig: 'Globular enzyme waiting for substrate collisions', look: { comp: 0, noncomp: 0 } },
  lookKeys: ['comp', 'noncomp'],
  frameAspect: 1.5,
  narrowZoom: 1.18,
  STEPS: [
    {
      label: 'Dilute substrate ([S] = 1 mM)',
      fig: 'Empty clefts wait for collisions',
      run: 1.0, play: 3.2, real: 1.0,
      hint: `At [S] = 1.0 mM (below K_m = ${M.K_M} mM), two-thirds of the ${M.E_TOT} active sites sit empty and velocity rises nearly linearly to ${M.velocity(1.0).toFixed(0)} μM/s.`,
      cam: closeEnzyme, lit: 'enzyme', look: { comp: 0, noncomp: 0 },
    },
    {
      label: 'Half-saturation ([S] = K_m = 2 mM)',
      fig: `Half the ${M.E_TOT} active sites are occupied`,
      run: 1.0, play: 3.2, real: 1.0,
      hint: `At the Michaelis constant K_m = ${M.K_M.toFixed(1)} mM, exactly ${M.boundSites(M.K_M).toFixed(0)} of ${M.E_TOT} enzyme pockets hold a substrate and the reaction runs at ½ V_max = ${(0.5 * M.V_MAX).toFixed(0)} μM/s.`,
      cam: whole, lit: 'curve', look: { comp: 0, noncomp: 0 },
    },
    {
      label: 'Crowded clefts ([S] = 6 mM)',
      fig: 'Three-quarters of sites busy (v = 90 μM/s)',
      run: 4.0, play: 3.8, real: 4.0,
      hint: `Tripling [S] from 2 to 6 mM does not triple the rate: 15 of ${M.E_TOT} pockets are now occupied (75 %) and velocity bends toward ${M.velocity(6.0).toFixed(0)} μM/s.`,
      cam: whole, lit: 'curve', look: { comp: 0, noncomp: 0 },
    },
    {
      label: 'Queue at the speed limit ([S] = 10 mM)',
      fig: `Approaching the ceiling V_max = ${M.V_MAX} μM/s`,
      run: 4.0, play: 3.8, real: 4.0,
      hint: `At [S] = 10 mM (5 K_m), ${M.boundSites(10).toFixed(0)} of ${M.E_TOT} clefts are continuously full; fresh substrate must wait for k_cat = ${M.K_CAT} turnovers/s (${M.velocity(10).toFixed(0)} μM/s).`,
      cam: whole, lit: 'enzyme', look: { comp: 0, noncomp: 0 },
    },
    {
      label: 'Competitive inhibitor (decoy in the cleft)',
      fig: 'Apparent K_m triples to 6.0 mM, in red',
      run: 0, play: 2.5,
      hint: 'Red: a decoy molecule competes for the active site, requiring 3× more [S] (6.0 mM) to reach ½ V_max, though flooding with substrate still approaches V_max = 120.',
      cam: whole, lit: 'comp', look: { comp: 1, noncomp: 0 },
    },
    {
      label: 'Non-competitive inhibitor (allosteric brake)',
      fig: 'Ceiling halves to V_max = 60 μM/s, in amber',
      run: 0, play: 2.5,
      hint: 'Amber: an allosteric inhibitor binds away from the cleft and disables half the active enzymes, cutting V_max in half (60 μM/s) without changing K_m = 2.0 mM.',
      cam: whole, lit: 'noncomp', look: { comp: 0, noncomp: 1 },
    },
  ],
  buildWorld(E) {
    const W = buildWorld(E);
    return { update: (s, look) => W.update(s, look), labels: W.labels };
  },
  state: clock => {
    const S = Math.min(M.S_MAX, Math.max(0, clock));
    return {
      S,
      theta: M.boundFraction(S),
      bound: M.boundSites(S),
      v: M.velocity(S),
      vComp: M.velocityComp(S),
      vNon: M.velocityNonComp(S),
    };
  },
  readout: s => `[S] = ${s.S.toFixed(1)} mM   bound ${s.bound.toFixed(1)} / ${M.E_TOT} sites\nrate v = ${s.v.toFixed(1)} / ${M.V_MAX} μM/s`,
  chips: [
    { label: 'Substrate [S]', from: 1, value: s => `${s.S.toFixed(1)} mM` },
    { label: 'Bound sites [ES]', from: 1, value: s => `${s.bound.toFixed(0)} / ${M.E_TOT} (${(s.theta * 100).toFixed(0)} %)` },
    { label: 'Reaction rate v([S])', from: 1, value: s => `${s.v.toFixed(1)} μM/s` },
    { label: 'Half-saturation K_m', from: 2, value: () => `${M.K_M.toFixed(1)} mM (at 60 μM/s)` },
    { label: 'With competitive inhibitor', from: 5, value: s => `${s.vComp.toFixed(1)} μM/s (K_m = 6)` },
    { label: 'With non-comp. inhibitor', from: 6, value: s => `${s.vNon.toFixed(1)} μM/s (V_max = 60)` },
  ],
  PLATES: {
    enzyme: {
      text: `An enzyme E binds substrate S reversibly to form the complex ES (rate constants k_on = ${M.K_ON} mM⁻¹s⁻¹, k_off = ${M.K_OFF} s⁻¹), then cleaves it into product P at turnover rate k_cat = ${M.K_CAT} s⁻¹. Once every cleft is occupied, reaction velocity hits the ceiling V_max = k_cat · E_tot = ${M.V_MAX} μM/s.`,
      facts: s => [
        ['substrate [S]', `${s.S.toFixed(2)} mM`],
        ['occupied clefts [ES]', `${s.bound.toFixed(1)} of ${M.E_TOT} (${(s.theta * 100).toFixed(1)} %)`],
        ['turnover k_cat', `${M.K_CAT.toFixed(1)} s⁻¹ per enzyme`],
        ['ceiling V_max', `${M.V_MAX} μM/s`],
      ],
    },
    curve: {
      text: `Balancing ES formation against breakdown gives the Michaelis–Menten equation v = V_max [S] / (K_m + [S]), where K_m = (k_off + k_cat)/k_on = ${M.K_M.toFixed(1)} mM is the exact concentration at which half the active sites are full.`,
      facts: s => [
        ['velocity v([S])', `${s.v.toFixed(2)} μM/s`],
        ['Michaelis constant K_m', `${M.K_M.toFixed(2)} mM`],
        ['initial efficiency V_max/K_m', `${M.initialSlope().toFixed(0)} μM s⁻¹ mM⁻¹`],
      ],
    },
    comp: {
      text: `A competitive inhibitor resembles the substrate and vies for the same catalytic pocket. It multiplies K_m by (1 + [I]/K_i) = ${M.COMP_FACTOR}, shifting the curve rightward without lowering V_max.`,
    },
    noncomp: {
      text: `A non-competitive inhibitor binds an allosteric site whether or not substrate is docked. Substrate still binds with the same affinity (K_m = ${M.K_M} mM), but only the uninhibited fraction of enzymes can complete catalysis, halving V_max to ${M.V_MAX * M.NONCOMP_FACTOR} μM/s.`,
    },
  },
};
