export const CONCEPTS = [
  { id: 'binomial', name: 'The binomial distribution', formula: 'P(<i>k</i>) = C(<i>n</i>, <i>k</i>) <i>p</i><sup><i>k</i></sup>(1 − <i>p</i>)<sup><i>n</i>−<i>k</i></sup>, &nbsp;mean <i>np</i>, variance <i>np</i>(1 − <i>p</i>)',
    shownIn: ['statistics/galton'] },
  { id: 'normal-curve', name: 'The normal curve', formula: '<i>f</i>(<i>x</i>) = <i>e</i><sup>−(<i>x</i>−μ)²/2σ²</sup> / σ√(2π)',
    shownIn: ['statistics/galton'] },
  { id: 'clt', name: 'Sums of many small chances are bell-shaped', formula: 'the central limit theorem',
    shownIn: ['statistics/galton'] },
  { id: 'measurement-error', name: 'Measurement error', formula: 'repeated readings spread as a normal curve about the true value',
    shownIn: [] },
];
