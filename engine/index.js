// @saxster/atlas: everything a figure needs, from one import. Each module is also importable on its own
// ('@saxster/atlas/stage.js', '@saxster/atlas/prims.js' …), which is what the examples do.
export {
  createStage, draggable, rayAxisClosest, mountMediumBar, MEDIUMS,
  TAU, clamp01, clamp, lerp, fract, mod, smooth, smoothstep, ease,
  phase, win, warpTime, spring as motionSpring, settleShake, squashStretch, eases,
  hash, rand, rrange, loopNoise,
  cubicBezier, bez, stagger, dwell, pingPong, anticipate, followThrough, pulseBeat, posterizeTime,
  camDolly, camZoom, camOrbit, camCrane, camDollyZoom, camHandheld,
} from './stage.js';
export { auditDeliverable } from './mesh-audit.js';
export { mountFigure } from './mount.js';
export { renderComicStripHTML, renderComicPanelSVG, renderByrneInlineHTML, mountComicStrip } from './comic.js';
export { startBook } from './book.js';
export { startMachine, speedLabel } from './machine.js';
export { startExplorer } from './explorer.js';
export { startSandbox } from './sandbox.js';
export { part, box, cyl, xAxis, zAxis, lines, arrow, setArrow, rod, liveTube, gearGeo, gear, rackGeo, rack, spring, shadeMat, PALETTE, TONE, V, applyTheme } from './parts.js';
export { axes, plot, area, surface, curve, vector, field, streamline, fieldLines, flowBeads, lattice, blob, particles, molecule, parseXYZ, linkage } from './prims.js';
export { chart, samples, scale, moveCursor, moveTangent, setLivePath, textAdvanceEm, waterfallWalk, waterfallChart, sankeyLayout, sankeyChart } from './chart.js';
export { checks, near, deriv, integ, bisect, rk4, mean, variance, meanWithin, chiSquare, chiSquareCDF, chiSquareCritical, normalQuantile, binomial, checkLinkLengths } from './checks.js';
export { circleIntersect, sliderCrank, fourBar, gearRatio, rackPinion, differential, createSolver, twoLinkIK, fabrik, jacobianIK } from './kinematics.js';
export { solveLinear, solveNetwork, quantileSeeds, opticSag, traceAxisymmetricRays } from './solvers.js';
export { playTone, playBoop, playClick, playKnock, createHum, mountSoundToggle } from './sound.js';
export { scrub, val, term, byrne, aside, bindProse } from './prose.js';
export * from './cad_kit.js';
export { rng } from './rng.js';
export { readTheme, KYM, BYRNE_THEME, parseColor, compositeOver, srgbLuminance, wcagContrast, auditTheme } from './theme.js';
