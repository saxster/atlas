export const CONCEPTS = [
  {
    id: 'base-rate-denominator',
    name: 'Base-rate denominator check',
    formula: 'Rate<sub>exposed</sub> = Events<sub>exposed</sub> / Total<sub>exposed</sub>',
    shownIn: ['critical-thinking/denominator-doubt'],
  },
  {
    id: 'survivorship-filter',
    name: 'Survivorship & test-scope boundaries',
    formula: 'P(Return | Hit<sub>engine</sub>) &lt; P(Return | Hit<sub>wing</sub>)',
    shownIn: ['critical-thinking/survivorship-rig'],
  },
  {
    id: 'source-chain-provenance',
    name: 'Source-chain independence (deduplication)',
    formula: '<i>N</i><sub>eff</sub> = unique primary observations &le; echoing articles',
    shownIn: ['critical-thinking/echo-chamber'],
  },
  {
    id: 'simpsons-stratification',
    name: 'Confounding & Simpson’s paradox reversal',
    formula: 'Stratum rates A &gt; B can invert when severity weights differ',
    shownIn: ['critical-thinking/snow-simpson'],
  },
  {
    id: 'bayesian-missed-sweep',
    name: 'Bayesian search update under imperfect detection',
    formula: 'P(A | miss) &prop; P(A) &middot; (1 &minus; <i>P</i><sub>d</sub>)<sup><i>k</i></sup> &gt; 0',
    shownIn: ['critical-thinking/bayes-search'],
  },
  {
    id: 'goodhart-target-distortion',
    name: 'Goodhart’s law & payoff equilibrium distinction',
    formula: 'When unverified proxy becomes target, proxy &uarr; while true trust &darr;',
    shownIn: ['critical-thinking/goodhart-games'],
  },
  {
    id: 'zero-incident-censorship',
    name: 'Zero-incident flight censorship',
    formula: 'Plot all 23 prior launches (7 damaged + 16 clean) across temperature',
    shownIn: ['critical-thinking/challenger-oring'],
  },
  {
    id: 'capacity-ceiling-custody',
    name: 'Exchange capacity ceiling & independent custody',
    formula: 'Claimed Contracts = AUM / Notional &le; Exchange Open Interest',
    shownIn: ['critical-thinking/ponzi-capacity'],
  },
  {
    id: 'value-of-information',
    name: 'Value of Information & extrapolation bounds',
    formula: 'Look if <i>p</i><sub>breach</sub> &middot; <i>q</i><sub>mitigate</sub> &middot; Loss &gt; Cost<sub>look</sub>',
    shownIn: ['critical-thinking/columbia-voi'],
  },
];
