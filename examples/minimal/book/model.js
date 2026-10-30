// The derivative as the slope: f(x) = x³/3 − x and the tangent at a point P that slides along it. Pure functions.
// Every number, motion and practice answer in the chapter reads from here.

export const f = x => x ** 3 / 3 - x;
export const df = x => x * x - 1;                    // the slope of the tangent at x
export const tangent = x0 => x => f(x0) + df(x0) * (x - x0);
export const STATIONARY = [-1, 1];                   // where df = 0: the curve's top and bottom

export const X = [-2.5, 2.5], Y = [-2, 2];           // the axes
export const XF = [-2.25, 2.25], XD = [-1.72, 1.72]; // where f and df stay inside them
// P sways between x = −1.4 and 1.4, a full sway every PERIOD seconds, so the run-1 triangle stays on the axes
export const SWAY = 1.4, PERIOD = 16;
export const xAt = t => SWAY * Math.sin(2 * Math.PI * t / PERIOD);
