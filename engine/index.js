// @saxster/atlas: everything a figure needs, from one import. Each module is also importable on its own
// ('@saxster/atlas/stage.js', '@saxster/atlas/prims.js' …), which is what the examples do.
export { createStage, clamp01, smooth, ease, lerp } from './stage.js';
export { startBook } from './book.js';
export { startMachine, speedLabel } from './machine.js';
export { startExplorer } from './explorer.js';
export { part, box, cyl, xAxis, zAxis, lines, arrow, setArrow, liveTube, shadeMat, PALETTE, TONE, V, applyTheme } from './parts.js';
export { axes, plot, surface, curve, vector, particles, molecule, parseXYZ } from './prims.js';
export { chart, samples, scale, moveCursor } from './chart.js';
export { checks, near, deriv, integ, bisect, rk4, mean, variance, meanWithin, chiSquare, chiSquareCDF, chiSquareCritical, normalQuantile, binomial } from './checks.js';
export { rng } from './rng.js';
export { readTheme, KYM } from './theme.js';
