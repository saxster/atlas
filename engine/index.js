// @saxster/atlas: everything a figure needs, from one import. Each module is also importable on its own
// ('@saxster/atlas/stage.js', '@saxster/atlas/prims.js' …), which is what the examples do.
export {
  createStage, draggable, rayAxisClosest, wireModeBar, mountMediumBar, mountQuirkBar, mountSwatchBar, ensureInkChromeDefs,
  MEDIUMS, QUIRKS, DEFAULT_QUIRK, QUIRK_PRESETS, resolveQuirk,
  TAU, clamp01, clamp, lerp, fract, mod, smooth, smoothstep, ease,
  phase, win, warpTime, spring as motionSpring, settleShake, squashStretch, eases,
  hash, rand, rrange, loopNoise,
  cubicBezier, bez, rubberband, projectMomentum, stagger, dwell, pingPong, anticipate, followThrough, pulseBeat, posterizeTime,
  camDolly, camZoom, camOrbit, camCrane, camDollyZoom, camHandheld,
  settledFlowPhase, createMotionGovernor, sharedAnchorDelta,
  sCurveIndex, snapLogStop, eventKeyframes, bindPlaybackLifecycle,
} from './stage.js';
export { auditDeliverable } from './mesh-audit.js';
export { mountFigure } from './mount.js';
export { renderComicStripHTML, renderComicPanelSVG, renderByrneInlineHTML, mountComicStrip } from './comic.js';
export { startBook } from './book.js';
export { startMachine, speedLabel } from './machine.js';
export { startExplorer } from './explorer.js';
export { startSandbox } from './sandbox.js';
export { part, box, cyl, xAxis, zAxis, lines, arrow, setArrow, rod, liveTube, gearGeo, gear, rackGeo, rack, spring, shadeMat, PALETTE, TONE, V, applyTheme, setLiveAccent } from './parts.js';
export { createAssemblyController, normalPassTone } from './render.js';
export { axes, plot, area, surface, curve, vector, field, streamline, fieldLines, flowBeads, lattice, blob, particles, molecule, parseXYZ, linkage, canvasPlate, billboard } from './prims.js';
export { chart, samples, scale, moveCursor, moveTangent, setLivePath, interpViewBox, focusViewBox, samplePolyline, beadSlots, pathBeads, sequenceLanes, textAdvanceEm, waterfallWalk, waterfallChart, sankeyLayout, sankeyChart, computeBarDelta, isoStackChart, updateIsoStackChart } from './chart.js';
export { renderControl, updateControl, bindControls, mountControlModeBar, createAutoplayDirector, ensureDiegeticStyles } from './diegetic.js';
export { checks, near, deriv, integ, bisect, rk4, mean, variance, meanWithin, chiSquare, chiSquareCDF, chiSquareCritical, normalQuantile, binomial, checkLinkLengths } from './checks.js';
export { circleIntersect, sliderCrank, fourBar, gearRatio, rackPinion, differential, createSolver, twoLinkIK, fabrik, jacobianIK } from './kinematics.js';
export { solveLinear, solveNetwork, quantileSeeds, opticSag, traceAxisymmetricRays } from './solvers.js';
export { playTone, playBoop, playClick, playKnock, createHum, mountSoundToggle } from './sound.js';
export { scrub, val, term, byrne, aside, paramChip, codeBlock, badge, foilCard, diffList, frameInspector, bindProse } from './prose.js';
export { breadboard, mcuBoard, jumperWire, ledComponent, resistorComponent, servoComponent, ultrasonicComponent, braidedRope } from './phys_kit.js';
export * from './cad_kit.js';
export * from './iso_kit.js';
export * from './draft_kit.js';
export { rng } from './rng.js';
export { readTheme, KYM, BYRNE_THEME, parseColor, compositeOver, srgbLuminance, wcagContrast, auditTheme, ACCENT_SWATCHES, deriveAccentTokens, applyAccentTokens, buildThemeCssSnippet, mountThemeStudio } from './theme.js';
