// Figure C.2 as a machine: five steps along a weak-acid / strong-base titration curve
// from initial weak acid through the Henderson–Hasselbalch buffer plateau to the equivalence cliff and excess base.
import { buildWorld } from './world.js';
import * as M from './model.js';

const whole = { target: [-0.1, 1.12, 0], az: -10, el: 8, dist: 16.5 };
const closeFlask = { target: [-0.85, 1.12, 0], az: -14, el: 10, dist: 14.2 };

export const FIGURE = {
  no: 'C.2',
  title: 'The buffer flat and the equivalence cliff',
  question: 'Why does a weak acid resist pH change halfway through a titration, then jump four pH units on a single drop at equivalence?',
  bigIdea: `while both weak acid HA and conjugate base A⁻ are abundant (around half-equivalence V_{1/2} = ${M.V_HALF} mL, where [HA] = [A⁻] and pH = pK_a = ${M.PKA.toFixed(2)}), added OH⁻ is absorbed into the logarithmic ratio log₁₀([A⁻]/[HA]). At equivalence (V_eq = ${M.V_EQ} mL), the last HA is consumed: the buffer vanishes, pH shoots past 7 to ${M.phAt(M.V_EQ).toFixed(2)} (basic A⁻ hydrolysis), and phenolphthalein flashes pink.`,
  intro: { cam: closeFlask, lit: 'flask', fig: '25.0 mL of 0.100 M acetic acid waiting under the NaOH burette', look: { strong: 0 } },
  lookKeys: ['strong'],
  frameAspect: 1.5,
  narrowZoom: 1.18,
  STEPS: [
    {
      label: 'Initial weak acid (V_b = 0 mL, pH 2.88)',
      fig: 'Un-ionized HA dominates (98.7% HA)',
      run: 0.0, play: 2.2,
      hint: `Before any NaOH is added (V_b = 0 mL), 0.100 M acetic acid (K_a = 1.8 × 10⁻⁵) is only 1.3% dissociated, giving pH = ${M.phAt(0).toFixed(2)} — nearly two pH units higher than 0.100 M HCl (pH 1.00).`,
      cam: closeFlask, lit: 'flask', look: { strong: 0 },
    },
    {
      label: 'Half-equivalence buffer (V_b = 12.5 mL, pH = pK_a)',
      fig: `50 : 50 buffer of HA and A⁻ (pH = ${M.PKA.toFixed(2)})`,
      run: 12.5, play: 3.6, real: 12.5,
      hint: `At V_b = 12.5 mL, half the amber HA has converted to blue A⁻ ([HA] = [A⁻]). In Henderson–Hasselbalch, log₁₀([A⁻]/[HA]) = log₁₀(1) = 0, pinning pH at pK_a = ${M.PKA.toFixed(2)} where the slope d(pH)/dV_b is flattest.`,
      cam: whole, lit: 'curve', look: { strong: 0 },
    },
    {
      label: 'Near the buffer edge (V_b = 22.0 mL, pH 5.61)',
      fig: '88% converted to A⁻, yet pH rose < 0.9 units',
      run: 9.5, play: 3.2, real: 9.5,
      hint: `Adding 9.5 mL more NaOH converts 88% of the acid into A⁻, yet pH only creeps up to ${M.phAt(22.0).toFixed(2)}. Now the remaining 12% of HA is running dangerously low.`,
      cam: whole, lit: 'flask', look: { strong: 0 },
    },
    {
      label: 'The equivalence cliff (V_b = 25.0 mL, pH 8.72)',
      fig: 'HA exhausted; phenolphthalein flashes pink',
      run: 3.0, play: 3.4, real: 3.0,
      hint: `At V_eq = 25.0 mL, moles of OH⁻ equal initial moles of HA. The buffer collapses and pH leaps vertically to ${M.phAt(25.0).toFixed(2)} — basic (> 7) because conjugate base A⁻ hydrolyzes water (A⁻ + H₂O ⇌ HA + OH⁻).`,
      cam: whole, lit: 'curve', look: { strong: 1 },
    },
    {
      label: 'Excess strong base (V_b = 32.0 mL, pH 12.09)',
      fig: 'Unreacted OH⁻ sets the pH ceiling',
      run: 7.0, play: 3.0, real: 7.0,
      hint: `Past equivalence, no HA remains to neutralize incoming NaOH. The curve joins the strong-acid titration line as excess [OH⁻] accumulates to pH = ${M.phAt(32.0).toFixed(2)}.`,
      cam: whole, lit: 'flask', look: { strong: 1 },
    },
  ],
  buildWorld(E) {
    const W = buildWorld(E);
    return { update: (s, look) => W.update(s, look), labels: W.labels };
  },
  state: clock => {
    const Vb = Math.min(M.V_MAX, Math.max(0, clock));
    return M.speciesAt(Vb);
  },
  readout: s => `V_b = ${s.Vb.toFixed(1)} mL   pH = ${s.pH.toFixed(2)}\nHA ${(s.alphaHA * 100).toFixed(0)}% · A⁻ ${(s.alphaA * 100).toFixed(0)}%`,
  chips: [
    { label: 'Added NaOH V_b', from: 1, value: s => `${s.Vb.toFixed(1)} mL` },
    { label: 'Solution pH', from: 1, value: s => `${s.pH.toFixed(2)}` },
    { label: 'HA : A⁻ ratio', from: 2, value: s => `${(s.alphaHA * 100).toFixed(0)}% : ${(s.alphaA * 100).toFixed(0)}%` },
    { label: 'Half-equiv pK_a (12.5 mL)', from: 2, value: () => `${M.PKA.toFixed(2)}` },
    { label: 'Equiv pH (25.0 mL)', from: 4, value: () => `${M.phAt(M.V_EQ).toFixed(2)} (basic > 7)` },
  ],
  PLATES: {
    flask: {
      text: `In the titration flask, 25.0 mL of 0.100 M acetic acid (CH₃COOH, K_a = 1.8 × 10⁻⁵) reacts with 0.100 M NaOH: HA + OH⁻ → A⁻ + H₂O. Phenolphthalein indicator stays colourless through the acidic and buffer regions and turns pink as the equivalence cliff crosses pH 8.2–10.0.`,
      facts: s => [
        ['added base V_b', `${s.Vb.toFixed(2)} mL`],
        ['solution pH', `${s.pH.toFixed(2)}`],
        ['protonated [HA]', `${(s.HA * 1000).toFixed(2)} mM (${(s.alphaHA * 100).toFixed(1)}%)`],
        ['conjugate base [A⁻]', `${(s.A * 1000).toFixed(2)} mM (${(s.alphaA * 100).toFixed(1)}%)`],
      ],
    },
    curve: {
      text: `Exact charge balance [H⁺] + [Na⁺] = [OH⁻] + [A⁻] governs the entire curve. Between V_b = 5 and 20 mL, the Henderson–Hasselbalch equation pH = pK_a + log₁₀(V_b / (V_eq − V_b)) holds within 0.01 pH units; at V_eq = 25.0 mL, acetate hydrolysis makes the equivalence point basic (pH 8.72) rather than neutral (pH 7.00 for HCl).`,
      facts: s => [
        ['pK_a of CH₃COOH', `${M.PKA.toFixed(3)}`],
        ['Henderson–Hasselbalch pH', s.Vb > 0.5 && s.Vb < 24.5 ? `${M.phHenderson(s.Vb).toFixed(2)}` : 'outside buffer zone'],
        ['equivalence pH (25.0 mL)', `${M.phAt(M.V_EQ).toFixed(2)} (vs 7.00 for HCl)`],
      ],
    },
  },
};
