// Threads: one idea that turns up in several subjects. Each is a sentence saying what carries over, and the concepts
// (ids from the subject files) that show it. The index page leads with these.
export const THREADS = [
  { id: 'exponential', name: 'Change in proportion to what is there',
    idea: 'When a thing grows or shrinks by a fixed fraction of itself, it follows an exponential: savings earning interest, a capacitor filling, a falling ball nearing its terminal speed, a population, a radioactive sample.',
    concepts: ['exponential', 'compound-interest', 'rule-of-72', 'rc-charging', 'linear-drag', 'population-growth', 'radioactive-decay'] },
  { id: 'circle', name: 'Every wave is a turning circle seen from the side',
    idea: 'A point going round a circle, watched edge-on, goes up and down as a sine. That is why springs, pendulums and alternating current all have a 2π in them.',
    concepts: ['sine', 'radian', 'angular-velocity', 'shm', 'pendulum-period'] },
  { id: 'bell', name: 'Many small chances add up to a bell',
    idea: 'Add up many small, independent pushes and the total spreads as a normal curve, whatever each push looks like: balls on a pegboard, measurement error, molecules diffusing.',
    concepts: ['binomial', 'normal-curve', 'clt', 'measurement-error', 'diffusion'] },
  { id: 'slope', name: 'A rate is a slope; an accumulation is an area',
    idea: 'How fast one thing changes as another does is the steepness of its graph, and the total change is the area under the rate graph: velocity and position, marginal and total cost.',
    concepts: ['derivative', 'fundamental-theorem', 'velocity-slope', 'marginal-cost'] },
  { id: 'balance', name: 'Systems settle where pushes balance',
    idea: 'A reaction, a market, a dividing colony and a pendulum all come to rest where the pushes or rates either way cancel, and move back when disturbed.',
    concepts: ['equilibrium', 'carrying-capacity', 'enzyme-kinetics', 'supply-demand'] },
];
