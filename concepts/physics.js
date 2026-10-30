// Physics concepts that other subjects share. The AP equation sheets (physics/equations/) list every physics formula;
// these are the ones a thread (threads.js) ties to another subject. Format: see build.mjs.
export const CONCEPTS = [
  { id: 'velocity-slope', name: 'Velocity is the slope of position', formula: '<i>v</i> = <i>dx</i>/<i>dt</i>',
    shownIn: ['physics/kinematics/2', 'physics/kinematics/9'] },
  { id: 'angular-velocity', name: 'Angular velocity', formula: 'ω = Δθ/Δ<i>t</i>, &nbsp;<i>v</i> = <i>r</i>ω',
    shownIn: ['physics/circular/6'] },
  { id: 'shm', name: 'Simple harmonic motion', formula: '<i>x</i> = <i>A</i> cos ω<i>t</i>',
    shownIn: ['physics/oscillations/2', 'physics/oscillations/8'] },
  { id: 'pendulum-period', name: 'The period of a pendulum', formula: '<i>T</i> = 2π√(ℓ/<i>g</i>)',
    shownIn: ['physics/oscillations/5', 'physics/oscillations/6'] },
  { id: 'rc-charging', name: 'A capacitor charging through a resistor', formula: '<i>q</i> = <i>Q</i>(1 − <i>e</i><sup>−<i>t</i>/<i>RC</i></sup>)',
    shownIn: ['physics/circuits/8'] },
  { id: 'linear-drag', name: 'Falling against drag proportional to v', formula: '<i>v</i> = <i>v</i><sub>T</sub>(1 − <i>e</i><sup>−<i>t</i>/τ</sup>)',
    shownIn: ['physics/newton/11'] },
];
