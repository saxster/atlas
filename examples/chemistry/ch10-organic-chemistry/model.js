// Chapter 10 pure model: homologous alkane formula & boiling-point trend,
// constitutional isomer property comparison (C2H6O & C4H10), and degrees of unsaturation (IHD).
const ALKANES = [
  null,
  { n: 1, name: 'Methane',  formula: 'CH₄',    bpC: -161.5, state25C: 'Gas' },
  { n: 2, name: 'Ethane',   formula: 'C₂H₆',   bpC: -88.6,  state25C: 'Gas' },
  { n: 3, name: 'Propane',  formula: 'C₃H₈',   bpC: -42.1,  state25C: 'Gas' },
  { n: 4, name: 'n-Butane', formula: 'C₄H₁₀',  bpC: -0.5,   state25C: 'Gas' },
  { n: 5, name: 'n-Pentane',formula: 'C₅H₁₂',  bpC: 36.1,   state25C: 'Volatile liquid' },
  { n: 6, name: 'n-Hexane', formula: 'C₆H₁₄',  bpC: 68.7,   state25C: 'Liquid' },
  { n: 7, name: 'n-Heptane',formula: 'C₇H₁₆',  bpC: 98.4,   state25C: 'Liquid' },
  { n: 8, name: 'n-Octane', formula: 'C₈H₁₈',  bpC: 125.7,  state25C: 'Liquid' },
];

export function alkaneHomologueState(carbonCount = 4) {
  const n = Math.max(1, Math.min(8, Math.round(carbonCount)));
  const hCount = 2 * n + 2;
  const molarMassG = +(n * 12.011 + hCount * 1.008).toFixed(2);
  const spec = ALKANES[n];
  return { ...spec, hCount, molarMassG };
}

export function degreeOfUnsaturation(c = 2, h = 4, n = 0, x = 0) {
  // IHD = (2C + 2 + N - H - X) / 2
  const ihd = (2 * c + 2 + n - h - x) / 2;
  return { c, h, n, x, ihd };
}

export function isomerComparisonC2H6O() {
  return {
    formula: 'C₂H₆O',
    ethanol: { name: 'Ethanol (CH₃CH₂OH)', bpC: 78.4, hBonding: true },
    dimethylEther: { name: 'Dimethyl ether (CH₃OCH₃)', bpC: -24.8, hBonding: false },
    deltaBpC: +(78.4 - (-24.8)).toFixed(1),
  };
}
