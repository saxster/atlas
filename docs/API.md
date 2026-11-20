# Atlas API

Atlas draws teaching figures: a pure model, a 3D scene in paper and ink, and one of four ways for a reader to work
it. This page is the reference. For a first figure, run `npx atlas new <subject>/<id>` and edit what it writes.

## Install

```
npm install github:saxster/atlas three
```

Import everything from `@saxster/atlas`, or one module at a time from `@saxster/atlas/<module>.js`. The examples
import one module at a time. In a plain web page, an importmap resolves the package name:

```html
<script type="importmap">
{ "imports": {
  "@saxster/atlas/adapters/": "./node_modules/@saxster/atlas/adapters/",
  "@saxster/atlas/": "./node_modules/@saxster/atlas/engine/",
  "three": "https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js",
  "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/"
} }
</script>
```

Bundlers resolve it from `package.json` exports with no importmap. `three` is a peer dependency (0.180 or later).

## The files of a figure

| File | Holds | Rule |
|---|---|---|
| `model.js` | the subject: `state(params, t, seed)` and every number | no DOM, no three.js |
| `checks.mjs` | proofs of the model, run with `node` | prove each fact a second, independent way |
| `world.js` | `buildWorld(E)` → `{ update(state, look), labels }` | draws the state; computes nothing new |
| `figure.js` or `chapter.js` | the grammar's description: steps, sliders or pages | words and cameras |
| `main.js`, `index.html` | starts the grammar on the page | copy them from an example |

Every number a reader sees (a label, a chip, a practice answer) reads from the model. That's what keeps two numbers
on one screen from disagreeing.

## The world

`buildWorld(E)` builds the scene once and returns `{ update(state, look), labels }`.

- `E.scene` is the three.js scene. `E.asm(key, parent, { title, sub })` makes a group that lights on hover and
  opens a breakdown on click, under the name `key`.
- `update(state, look)` poses the scene for a model state. `look` holds 0 to 1 weights for the `lookKeys` a page
  or step turns on, eased by the engine.
- `labels` is a list of `{ cls, html, at, leader?, anchor? }`. `at()` returns a `THREE.Vector3`, or `null` to hide the label. When `leader: true` (and optional `anchor()` returning the 3D attachment point), the stage draws a bent SVG leader line with a target dot connecting the 3D part to the offset label. The label classes are in `engine/labels.css` (`board`, `tick`, `axis`, `mark`, `vec`, `tag`, `sound`).
- `E.setCutaway(planeOrPlanes, keys?)`, `E.setXray(amount, keys?)`, `E.setIsolate(keys, { mode: 'ghost' | 'wash' }?)` (or `E.setIsolate({ keys, mode: 'wash' })`) and `E.warm()` control section-plane clipping, ghosted housing transparency, subsystem isolation (`'ghost'` translucent see-through for housings, or `'wash'` opaque depth-solid paper-wash desaturation for side-by-side dioramas) and first-frame shader pre-compilation. Pages and steps can also drive them declaratively via `look: { xray, section, isolate, ex }` or `transparent: true` (`bg: 'transparent'`).

## Building blocks (`prims.js`)

Each building block is `prim(parent, spec) → { object, labels, … }`. `object` is added to `parent`. `labels` goes
straight into the world's labels: `labels: [...ax.labels, ...v.labels]`. Blocks that take `axes` work in data
coordinates.

| Block | Draws | Returns, besides `object` and `labels` |
|---|---|---|
| `axes(parent, { x, y, z?, size?, at?, ticks?, names?, grid? })` | axes with ticks and names; with a `z` range, z is up | `to(x, y, z)`, `from(vec)` (data ↔ world points) |
| `plot(parent, f, { axes, x?, samples?, color? })` | y = f(x) | `update(f, { x? })` |
| `area(parent, f, { axes, x?, y0?, bars?, rule?, pal?, opacity? })` | shaded region or `bars` Riemann rectangles between `y0` and `f(x)` | `update(f, { x?, y0?, bars?, rule? })` |
| `surface(parent, f, { axes, x?, y?, n?, pal? })` | z = f(x, y), shaded paper | `update(f)` |
| `curve(parent, r, { t, samples?, radius?, axes?, color? })` | a tube along r(t) → [x, y, z] | `update(r)` |
| `vector(parent, from, to, { color?, label?, axes?, side?, gap? })` | a solid arrow; `side` and `gap` place its label | `set(from, to, side?)` |
| `field(parent, fn, { axes, x?, y?, z?, n?, scale?, color? })` | a 2D or 3D grid of arrows for fn(x, y, z) → [vx, vy, vz?] | `arrows`, `update(fn, scale?)` |
| `streamline(parent, fn, { axes, from, dt?, steps?, radius?, color? })` | RK4 trajectory tube of x′ = fn(x, y, z, t) from `from` | `points`, `update(fn, from?)` |
| `lattice(parent, map, { axes, x?, y?, n?, samples?, color?, opacity? })` | deformed coordinate grid under map(x, y) → [u, v, w?] | `update(map)` |
| `blob(parent, { radius?, lobes?, cleft?, seed?, rings?, segs?, pal? })` | seeded coarse-grained globular shape with optional active-site cleft | `mesh`, `update(spec)` |
| `particles(parent, count, { radius?, color?, axes? })` | one instanced set of balls | `set(i, [x, y, z])`, `show(n)` |
| `molecule(parent, xyz, { scale?, names? })` | atoms and bonds from XYZ text (ångström); bonds from covalent radii | `atoms`, `bonds` (and `parseXYZ(text)`) |
| `linkage(parent, { joints, links, r?, pinR?, pinDepth?, z?, axes?, pal?, pinPal? })` | multi-bar planar or 3D linkage of rods and pin bosses | `bars`, `pins`, `update(joints)` |
| `canvasPlate(parent, drawFn, { width?, height?, pxWidth?, pxHeight?, bezel?, pal?, pos?, axes? })` | stateless 2D-canvas-on-3D instrument screen, OLED, gauge or reticle | `screen`, `texture`, `update(state, t?)` |
| `billboard(parent, { kind?, width?, height?, color?, pos?, faceCamera?, axes? })` | cel-shaded `'flame'`, `'plume'` or `'ring'` SDF plane synced to the ink-outline pass | `mesh`, `update(phase, { amp?, pos?, visible? }?)` |
| `draggable(target, { axes?, plane?, constrain?, onDrag?, onReset? })` | (`stage.js`) makes any 3D mesh/group directly grab-and-drag interactive on a plane or curve | `{ get, set, reset, project }` |

`update` and `set` rewrite geometry in place, so they can run every frame. Colours are `'hi'` (ink), `'grey'`,
any `PALETTE` name, `'ochre'`, `'green'` or `'#hex'`. The full contract is the comment at the top of `engine/prims.js`;
`engine/selftest.mjs` tests every block, and `examples/minimal/` shows the core patterns.

Below them sit the paper-and-ink pieces in `parts.js` (`part`, `box`, `cyl`, `rod`, `gearGeo`, `gear`, `rackGeo`, `rack`,
`spring`, `lines`, `arrow`, `liveTube`, `shadeMat`, `applyClipPlanes`, `PALETTE`) for shapes and mechanical CAD parts (`spring.set(a, b)` stretches a helical coil in place every frame).

## Kinematics & Constraint Solver (`kinematics.js`)

Pure forward and inverse kinematics for mechanical figures (`@saxster/atlas/kinematics.js`, no DOM or three.js):

- **Analytical forward kinematics:** `circleIntersect(p0, r0, p1, r1, branch)`, `sliderCrank(theta, r, L, offset?)` (returns `{ s, v, a, phi, pin, piston }`), `fourBar(a, b, c, d, theta, branch?)`, `gearRatio(driveAngle, teethDrive, teethDriven, opts?)`, `rackPinion({ module, teeth, stroke?, angle? })`, `differential({ ring?, left?, right?, ratio? })`.
- **Declarative constraint solver:** `createSolver(defs, { iterations?, tol? })` topologically sorts sequential chains (`revolute`, `prismatic`, `gear`, `rackPinion`, `sliderCrank`, `circleIntersect`, `fourBar`, `differential`) for single-pass exact evaluation and relaxes closed loops (`distance` or custom `{ solve, residual }`).
- **Inverse kinematics:** `twoLinkIK(base, target, L1, L2, elbow)`, `fabrik(joints, lengths, target, opts?)` (2D/3D serial chain solver), and `jacobianIK({ angles, fk, target, method: 'dls' | 'transpose', limits?, step?, damping? })`.

## Stateless Procedural Motion (`motion.js`)

Pure functions of time `t` (`@saxster/atlas/motion.js`, also re-exported by `@saxster/atlas/stage.js` and `@saxster/atlas`) so `?render` seeking (`window.seek(t)`) is order-independent with zero per-frame accumulator drift:

- **Core scalars:** `TAU`, `clamp01(x)`, `clamp(x, a = 0, b = 1)`, `lerp(a, b, u)`, `fract(x)`, `mod(x, m)`, `smooth(a, b, x)` (and alias `smoothstep(a, b, x)`), `ease(u)`.
- **Time windows & seamless loops:** `phase(t, period = 1, offset = 0)` (normalised `0..1` cycle phase), `win(p, a, b, fn = null)` (clamped `0..1` sub-window over `[a, b]`, optionally shaped by `fn`), `warpTime(t, period = 12, amp = 0.15)` (periodic speed modulation where `warpTime(t + period) === warpTime(t) + period`).
- **Closed-loop springs & secondary motion:** `spring(u, zeta = 0.35, freq = 3.2)` (underdamped harmonic response pinned at `spring(0) === 0` and smoothly blended to `spring(1) === 1`), `settleShake(tau, freq = 6, decay = 0.25, end = 1)`, `squashStretch(sy, power = 0.75)` (`[sx, sy, sz]` volume-preserving scale around `sy = 1`).
- **Easings, boundary physics & seamless loop noise:** `eases` (31 standard easings: `linear`, `in/out/inOut` `Sine`/`Quad`/`Cubic`/`Quart`/`Quint`/`Expo`/`Circ`/`Back`, `outElastic`, `outBounce`, `spring`, plus UI custom curves `uiOut`, `uiInOut`, `drawer`), `cubicBezier(x1, y1, x2, y2)` (and alias `bez`, bisection CSS `cubic-bezier` solver), `rubberband(overshoot, dimension, constant = 0.55)` (Apple progressive boundary resistance bounded by `dimension`), `projectMomentum(velocity, decelerationRate = 0.998)` (Apple exponential-decay momentum projection), `loopNoise(t, seed = 0, period = 12, octaves = 2)` (periodic multi-octave harmonic noise on a circle where `loopNoise(t + period, seed, period, octaves) === loopNoise(t, seed, period, octaves)`), `hash(n)`, `rand(i, salt = 0)`, `rrange(i, a, b, salt = 0)`.
- **Choreography & animation principles:** `stagger(u, index, count, overlap = 0.5, fn = ease)`, `dwell(u, inEnd = 0.25, outStart = 0.75, fnIn?, fnOut?)`, `pingPong(u, hold = 0, fn = ease)`, `anticipate(u, pullback = 0.14, split = 0.28, overshoot = 1.1)` (wind-up dip before launch + settle), `followThrough(u, stopAt = 0.55, amp = 0.22, freq = 3.5, decay = 5)`, `pulseBeat(u, beats = 2, sharpness = 4)`, `posterizeTime(u, steps = 8)` (stop-motion quantized phase).
- **Mechanical indexing & exact timeline keyframes:** `sCurveIndex(t, { start, travel, accel, brake, distance, origin })` (7-segment $C^2$ jerk-limited indexing profile), `snapLogStop(value, stops)` (logarithmic nearest-stop detent snapping), and `eventKeyframes(t0, t1, { fps = 60, events = [] })` (sorted deduplicated timestamps pairing uniform sampling with analytical transitions).
- **Stateless 3D camera moves:** `camDolly(pose, u, factor = 0.6, fn = ease)`, `camZoom(pose, u, factor = 0.5, fn = ease)`, `camOrbit(pose, u, dAz = 45, dEl = 0, fn = ease)`, `camCrane(pose, u, { dY = 1.5, dEl = 16, dDist = 0 }, fn = ease)`, `camDollyZoom(pose, u, targetFov = 42, fn = ease)` (Vertigo contra-zoom preserving `dist * tan(fov/2)`), and `camHandheld(pose, t, { ampAz, ampEl, ampY, period = 12, seed = 1, octaves = 2 })`.

## 2D-to-3D CAD, Blueprint & Procedural Detailing Kit (`cad_kit.js`)

Bridges 2D technical drawings, floorplans, and STEM/Economics textbook diagrams to 3D models (`@saxster/atlas/cad_kit.js`, also re-exported by `@saxster/atlas`, `phys_kit.js`, `chem_kit.js`, and `bio_kit.js`; see `docs/2d-to-3d-evaluation.md` and `examples/{minimal/blueprint,maths/cross-sections,physics/optics-bench,chemistry/crystal-projection,biology/leaf-section,economics/isoquant}`):

- **Pure plan & camera framing math (safe for `model.js` and `checks.mjs`, exported from `motion.js`, `cad_kit.js`, `stage.js`, and `index.js`):** `planArea(polyOrBox)`, `planBounds(spec)`, `planPose(boundsOrSpec, { fov = 3, el = 89.4, az = 0, aspect = 1.25, pad = 1.18 })`, `logFovLerp(camA, camB, t, pullBack = 1)`, `glide(keys)`. Pages and steps in `stage.js` also accept `cam.fov` and `look.cutY` directly.
- **Watertight boolean CSG & floorplan compiler:** `new RectSolid().add(x0, y0, z0, x1, y1, z1).sub(...).build(faceKey, edgeKey)` (watertight boundary faces with metric UVs + merged non-coplanar corner edges), `extrudePlan(parent, spec, opts)` (compiles `rooms`, `walls`, `windows`, `doors`, `slides`, `dims`, `grids`, `border` into a watertight 3D model with pochè section cuts `plan.setCutY(y)`, hinged doors `plan.setDoors(frac)`, and sliding glass doors `plan.setSlides(frac)`), `buildSheet` (supports `dims`, `doors`, `slides`, `grids`, `border`, `curves`, `vectors`, `circles`, and `crosshairs`), `dimChain` (supports custom `unit`, `decimals`, `scale`, and `fmt`), `swingArc`, `slideArrow`.
- **Universal STEM & Economics 2D-to-3D compilers:**
  - `revolveSection(parent, spec, opts)`: revolves a 2D axisymmetric cross-section (`profile: [[x, r], ...]`, `rInner`) around the X-axis into a 3D solid of revolution with watertight meridian cutaway end-caps and `setSweep(u)` (e.g., optical lenses, nozzles, flasks; `examples/physics/optics-bench`).
  - `extrudeCrossSections(parent, spec, opts)`: extrudes a 2D base region (`xRange`, `zLow(x)`, `zHigh(x)`) into $N$ 3D Cavalieri/Riemann cross-sectional slices (`shape: 'semicircle' | 'square' | 'triangle' | 'rect'`) with `setLift(u)` and `setHighlight(idx)` (`examples/maths/cross-sections`).
  - `extrudeLayers(parent, spec, opts)`: extrudes a 2D stratified/histological cross-section (`layers: [{ z0, z1, x0, x1, key, cutOut }]`, `columns`, `tubes`) into a watertight 3D multi-layer block along Y with `setDepth(u)` (`examples/biology/leaf-section`).
  - `extrudeContours(parent, spec, opts)`: extrudes a 2D contour/isoquant map + linear constraint line into a watertight 3D solid surface $y = f(x, z)$ + vertical 3D constraint wall with `setElevation(u)` (`examples/economics/isoquant`).
- **Parametric 3D detailing & procedural PBR:** `uvMetres(geo, scale)`, `bevelBox(w, h, d, bevel, segs)`, `shell(w, d, h, { thickness, radius })` (closed-bottom hollow rounded extrusion), `lathe(points, { segs, spline })`, `drape(w, d, h, { drop, fold })`, `fronts(parent, { w, h, d, nx, ny, gap, pull })` (shadow-gap cabinetry with bar/knob/edge pulls), `contactShadow(parent, w, d, opts)` (with `setHeight(h)` penumbra attenuation), `batchGeos(items)` (merges static geometries with per-vertex `aCenter`), `branchTree(parent, opts)` (Frenet-frame procedural organic tree with foliated canopy), `procTex(kind, opts)` (`'wood'`, `'marble'`, `'tile'`, `'terrazzo'`, `'brushed'`, `'linen'`, `'painting'`, `'foil'`, `'fluted'`, `'striation'`, `'acuity'`), `tweakMat(material, opts)` (world-space 3D value-noise macro de-tiling via `onBeforeCompile`), `createRevealController(zones, opts)`, and `inkAware(material, ctrl, opts)`.

## 3D Mesh Audit & Specimen Viewer (`mesh-audit.js`, `adapters/specimen.js`)

- `auditDeliverable(root, { maxTris = 50000, requireUV = false, checkScale = true, clampNonMetal = false, calmPBR = false })` (`@saxster/atlas/mesh-audit.js`): traverses a Three.js `Object3D` hierarchy and checks triangle budget, non-empty geometries, finite coordinates, normal presence, negative-scale inside-out winding (`matrixWorld.determinant() < 0`), UV presence on textured meshes, and optionally clamps dielectric `metalness` / calms PBR roughness (`>= 0.38`) and normal maps idempotently.
- `showSpecimen(el, spec, { background })` (`@saxster/atlas/adapters/specimen.js`): mounts an on-demand 3-point-lit turntable viewer (demand-rendered, grounded plinth + radial shadow, optional metric `ScaleBar` via `spec.scaleBar`, and live `Paper & Ink` toggle) for a `.glb`/`.gltf` URL or Three.js builder function and audits it with `auditDeliverable`. Book pages with `specimen: { src | build | object, source, scaleBar? }` get a "See the real specimen" button automatically.
- `chart`, `scale`, `samples`, `moveCursor`, `moveTangent`, `setLivePath`, `interpViewBox`, `focusViewBox`, `samplePolyline`, `beadSlots`, `pathBeads`, `textAdvanceEm`, `waterfallWalk`, `waterfallChart`, `sankeyLayout`, `sankeyChart` (`@saxster/atlas/chart.js`): 2D left-page and explorer/sandbox SVG charts with paper-masked callout plates (`6px` clearance, clamped to plot frame), zero-thrash `{ key, svg, update }` live attribute updates, stepped geometric-zoom `viewBox` framing (`focusViewBox`), constant-speed arc-length `pathBeads`, collision-free accessible `<title>`/`<desc>` naming, and conservation-verified waterfall bridges and Sankey flow diagrams (horizontal midline cubic Bezier tangents).
- `readTheme`, `KYM`, `BYRNE_THEME`, `parseColor`, `compositeOver`, `srgbLuminance`, `wcagContrast`, `auditTheme`, `ACCENT_SWATCHES`, `deriveAccentTokens`, `applyAccentTokens`, `buildThemeCssSnippet`, `mountThemeStudio` (`@saxster/atlas/theme.js`): host CSS theme reader, Oliver Byrne 1847 primary-ink preset (`theme: BYRNE_THEME`), pure IEC 61966-2-1 relative luminance and WCAG 2.x contrast verification (`4.5:1` text, `3.0:1` large text & essential marks), WCAG-clamped single-swatch cascade (`deriveAccentTokens`), and interactive CSS token configurator (`mountThemeStudio` + `buildThemeCssSnippet`).

## 2D Orthographic Drafting Kit (`draft_kit.js`)

Flat-stroke 2D technical drafting primitives (`@saxster/atlas/draft_kit.js`, generated tokens from `engine/draft_standard.json` via `tools/build-standard.mjs` into `engine/draft_standard.js` and `engine/atlas.css`; Creator Voice `docs/voices/plotter-draft.md`, rubric `docs/verification-rubric.md`):

- `draftArrow({ kind = 'line', from, to, legLength, angle })`: emits a tip-first shaft (`M<tip>L<start>`) and open `45°` chevron tip so dashed transfer strokes always meet at an inked point.
- `draftDimension({ axis, witnesses, position, extensions, label })`: builds extension lines (`gap`, `overshoot`), `8`-unit diagonal end slashes, and split dimension lines cleared around `label.clearance`.
- `draftHatch({ region, pattern = 'H1' | 'H2', phase, pitch })` and `draftSupportTicks({ from, to, extent, pitch, side })`: analytically clipped diagonal cut hatching and one-sided wall/ground ticks.
- `draftInverseClip(id, frontPathD, { vb })` and `draftClearanceMask(id, maskContent, { vb })`: even-odd inverse `<clipPath>` and luminance `<mask>` knockouts without opaque background patches.
- `draftSvg(opts)`, `draftCompactSvg(svgMarkup, opts)` (coordinate-preserving crop + `vector-effect="non-scaling-stroke"` + compact dash `--atlas-compact-dash`), and `draftIsolationWrap` / `bindDraftIsolation` (non-boosting hover/focus/toggle isolation).

<!-- BEGIN GENERATED: draft-standard -->
| Role | Width | Opacity | Dash Pattern | Meaning |
| --- | ---: | ---: | --- | --- |
| `primary` (Primary form) | 1.00 | 1.00 | Continuous | Main silhouette or selected functional route |
| `secondary` (Secondary form) | 1.00 | 0.36 | Continuous | Subordinate real detail |
| `dimension` (Dimension / leader) | 1.00 | 0.36 | Continuous | Measurement, extension, explanatory leader |
| `leader` (Callout leader) | 1.00 | 0.36 | Continuous | Explanatory anchor connecting label to feature |
| `guide` (Reference guides) | 1.00 | 0.18 | Continuous | Subordinate alignment projections and reference scaffold |
| `grid` (Grid) | 1.00 | 0.07 | Continuous | Repeated coordinate or module field |
| `hatch` (Hatch) | 1.00 | 0.20 | Continuous | One declared bounded region or cut |
| `section` (Section cut) | 1.00 | 1.00 | Continuous | Material intersected by a stated cut plane |
| `centerline` (Axis / centerline / pitch locus) | 1.00 | 0.18 | `8 3 1 3` | Symmetry axis, center, or theoretical generating locus |
| `hidden` (Hidden outline) | 1.00 | 0.36 | `3 5` | Geometry presently concealed behind a front face |
| `absent` (Absent outline) | 1.00 | 0.36 | `3 5` | Missing link or unfilled position (label state in context) |
| `proposed` (Proposed outline) | 1.00 | 0.36 | `3 5` | Possible future or target configuration |
| `transfer` (Motion or transfer) | 1.00 | 0.36 | `4 6` | Movement or conceptual transfer, with solid open arrowhead |

- Canvas: **560 × 440**; arrowhead: **6**-unit legs at **45°**; dimension slashes: **8** units (clearance **3**); hatch pitch: **12** units; label opacity: **0.82** / note opacity: **0.66**; region highlight `fill-opacity`: **0.06**.
<!-- END GENERATED: draft-standard -->

## Four grammars

Each takes one description object and owns the page around the figure. The full field list is in the comment at the
top of each file.

**Book** (`startBook(chapter)`, `book.js`). The reader scrolls; each page has a camera, a lit part and text, and a
click breaks a part down. `chapter` is `{ no, subject, PAGES, PLATES, buildWorld, lookKeys, state, readout }`. A page
is `{ kicker, title, sub, body, cam, lit, look, fig, alt, parts?, foil?, molecule?, specimen? }` (`foil: { label, page? | part? | to?, note }` renders a 1-tap *"Don’t confuse with"* lookalike comparison card). Practice questions come from
`practice.js` and support 4-choice (`choices`), numeric entry (`numeric: { answer, tol }`), 3D drag-position verification (`target: { label, hint, check(state, W, E) }`), and direct 3D part-click identification (`pickPart: 'assemblyKey'` or `{ asm, label? }`).

**Machine** (`startMachine(figure)`, `machine.js`). Numbered steps, only the next one live. Manual by default, Auto
on request (with simulated operator cursor and 25 s pointer-interaction handover), and the choice is remembered. A step is `{ label, hint, run, play, real?, cam, look?, lit? }`: `run`
model seconds shown in `play` seconds on screen, with a speed badge. `chips` fill in from the step that earns them.
Optional `cuts: ['solid', 'xray', 'section']` (with `xrayKeys`, `cutKeys`, `cutPlane`) mounts a cutaway pill bar (also supported in `sandbox.js`).

**Explorer** (`startExplorer(figure)`, `explorer.js`). Predict first, then sliders and a seeded run. `predict` is
`{ q, choices, answer(params), why(params) }`: the model works out the answer, which shows after the run. A control
is `{ key, label, min, max, step, fmt?, rebuild? }`.

**Sandbox** (`startSandbox(figure)`, `sandbox.js`). Constructive play: presets (`presets`), a 2×2 matrix or parameter editor (`matrix`, `controls`), and a palette (`palette`) to place, remove and drag 3D pieces (`items`) directly on the stage while chips and charts update live.

All four draw through `createStage` (`stage.js`), respond live to OS `prefers-reduced-motion` and tab visibility changes via `bindPlaybackLifecycle` (`S.setReduced`), and support shareable state URLs (`?t=...`, `?step=...`, `?key=val`, `?medium=...`).

## Art-direction mediums, 5-Stop Quirk Spectrum, Creator Voices, reactive prose & solvers

- **5-Stop Design Quirk & Expressiveness Spectrum (`engine/render.js`, `engine/stage.js`):** Every chapter or figure supports `quirk: 'bland' | 'atelier' | 'slightly-quirky' | 'playful' | 'wild'` (aliases `'whacky'`, `'over-the-top'`, or numeric `0.0..1.0`) via `QUIRKS`, `DEFAULT_QUIRK` (`'slightly-quirky'`), `QUIRK_PRESETS`, `resolveQuirk`, and `mountQuirkBar`. By default, figures launch at **`'slightly-quirky'` (`level: 0.5`, `medium: 'pencil-wash'`)** — warm sketchbook watercolour wash, gentle graphite wobble, and lively springs — ranging down to **`'bland'`** (`0.0`, clinical `paper-ink` reference plate) on one end and up to **`'wild'`** (`1.0`, Mad Atelier overdrive combining 12 Hz stop-motion line boil, Moebius cross-hatching, CMYK Risograph pop dots, and double-inked comic keylines) on the other.
- **Art-direction mediums (`engine/render.js`, `engine/stage.js`):** Every chapter or figure accepts `medium: 'paper-ink' | 'ciechanow' | 'pencil-wash' | 'moebius' | 'risograph'` and optional `mediums: [...]` to mount a live switcher pill (`mountMediumBar`). Flush coplanar meshes inside one assembly carry sub-bucket `idOff` offsets (`±0.05` in `normalRT.a`) so mating parts draw crisp ink seams.
- **Creator Voices (`docs/voices/catalog.md`, `npx atlas boot <voice>`):** Ten curated voices across four registers—*Bland / Textbook-Pure* (`textbook-pure`), *Creative Atelier* (`ciechanowski-mechanism`, `byrne-visual-proof`, `plotter-draft`, `moebius-printmaking`, `redblob-reactive-prose`), *Slightly Quirky & Playful (Default)* (`bugged-sketchbook`, `ncase-playable-toy`, `toybox-scale-joy`), and *Wild, Whacky & Over-the-Top* (`whacky-lab`).
- **Reactive prose & visual proofs (`@saxster/atlas/prose.js`, `@saxster/atlas/theme.js`):** `scrub(key, opts)` (Bret Victor `5px = 1 step` spinbutton), `paramChip(key, { value, choices, part })` (discrete clickable code/formula parameter pill), `codeBlock(lines, { lineVar })` (numbered read-only execution trace synced to `state[lineVar]`), `badge(kind, text)` (epistemic `'eg'` / `'unobserved'` / `'vantage'` and `'added'` / `'removed'` / `'changed'` diff pills), `foilCard(foil, opts)` (1-tap lookalike comparison card), `diffList(items, opts)` (`+`/`−`/`~` step change cards), `frameInspector(spec)` (capture-vantage header + proportional byte-width bar + `[from..to]` byte-offset field rows), `val(key)` (live `<output>` formatted via `proseFormat` / `formatters`), `term(targets, text, { isolate: true | 'wash' })` (bidirectional `[data-part]` hover/click lock), `byrne.{seg,angle,poly}` (Oliver Byrne inline SVG proof glyphs with `theme: BYRNE_THEME`), and `aside(trigger, body)` (Nicky Case `:nutshell` expandable card), bound automatically by `bindProse`.
- **3D Electronics, Microcontroller, Breadboard & Braided Rope Kit (`@saxster/atlas/phys_kit.js`):** `breadboard`, `mcuBoard` (`'uno'` / `'esp32'`), `jumperWire` (arched `CatmullRomCurve3` with DuPont housings), `ledComponent`, `resistorComponent` (automatic 4-band EIA color rings from `ohms`), `servoComponent`, `ultrasonicComponent`, and `braidedRope` (centripetal `CatmullRomCurve3` with `.morph(ptsA, ptsB, u)`).
- **Pure STEM solvers (`@saxster/atlas/solvers.js`):** Zero-DOM/Three.js math for `model.js`: `solveNetwork` ($G_{\min}$-regularized MNA conservation networks), `quantileSeeds` (inverse-CDF equal-flux seeding for `fieldLines`), and `traceAxisymmetricRays` (3D conic/aspheric Snell refraction + total internal reflection along `+X`).
- **Tactile rails, fields & procedural audio (`@saxster/atlas/stage.js`, `@saxster/atlas/prims.js`, `@saxster/atlas/sound.js`):** `draggable(mesh, { axis, load })` (`rayAxisClosest`, `stepDraggableLoad`), `fieldLines` + `flowBeads`, `{ key, svg, update }` live charts (`moveTangent`, `setLivePath` in `engine/chart.js`), and opt-in `sonify(ctx, state, ...)` (`playTone`, `playBoop`, `playClick`, `playKnock`, `createHum`, `mountSoundToggle`).

## Just the figure, in any page

`mountFigure(el, CHAPTER, { page = 0, height = 400, playing = true, theme })` (`mount.js`) puts one page's 3D figure
in any element, with its own frame loop: hover, click to take a part apart, drag to turn. It stops drawing while
scrolled out of view and stands still for readers who ask for reduced motion. It returns
`{ stage, play(on), destroy() }`. `CHAPTER` is anything with `PAGES`, `buildWorld`, `state` and `lookKeys`, such as a
book's `chapter.js`.

```js
import { mountFigure } from '@saxster/atlas';
import { CHAPTER } from './examples/physics/newton/chapter.js';
mountFigure(document.querySelector('#newton'), CHAPTER, { page: 2, height: 420 });
```

## Modes, on any figure's URL

- `?render`: the page draws no frames of its own. `window.seek(t)` draws the moment t, the same every time, and
  `window.DURATION` is the length of the tour. Stills, tests and video use this.
- `?embed&page=i` (books): only the figure, held on page i.
- `?calm`: still until the reader asks.

## Checking a model (`checks.js`)

`const C = checks()` gives `C.check(label, ok, info)` rows; `C.report()` prints them and exits 1 on any failure. Helpers: `near`, `deriv`, `integ`
(Simpson), `bisect`, `rk4`, `mean`, `variance`, `meanWithin`, `chiSquare` with its exact CDF and critical value,
`normalQuantile`, `binomial`, `checkLinkLengths(joints, links, tol?)`, `checkTrajectory(sampleFn, { t0?, t1?, steps?, maxJump?, links?, chains?, loop?, loopTol? })`. `rng(seed)` (`rng.js`) is seeded randomness, so a stochastic model checks exactly.

## In a textbook

`mountAtlas(stage, params, api, chapter, { page, height, readout })` (`adapters/kym-live.js`) mounts a book page as a
Kym textbook `:::live` widget. It follows the book's light, sepia or dark theme and stays still until asked. In the
atlas repo, `node tools/vendor.mjs <book>/source/live/atlas <subject/chapter>` copies the figure and the engine files
it needs into the book. The adapter turns on two `createStage` options that default off: `frameParts` (each frame
the camera pulls back until every assembly the page names fits, and `board` labels are spread apart with leader
lines, kept below `labelTopInset()` px, default 24; `framing.js`) and `retainContext` (destroy keeps the WebGL context, so the next figure reuses the canvas, since
WebKit is slow to free lost contexts).

## The `atlas` command

Run from the repo that holds the figures; a figure is its folder, relative to here.

| Command | Does |
|---|---|
| `npx atlas new <subject>/<id> --grammar book\|machine\|explorer\|sandbox\|teardown\|blueprint` | copies a working minimal example to start from |
| `npx atlas boot [<grammar\|kit\|voice\|task>] [--list] [--json]` | assembles a boot package (contract, voice guide, verified exports, working minimal skeleton) |
| `npx atlas check [dir]` | audits `model.js` purity and runs every `checks.mjs` under the folder |
| `npx atlas gate [<file>] [--transcript <jsonl>]` | verifies the Model-First & Read-Before-Write gate (CLI or `PreToolUse` stdin hook) |
| `npx atlas stills <out> <figure…>` | a still of every page or step, at 1440×900 and 390×844 |
| `npx atlas critic <figure…> [--intersections]` | frames that jump, labels that overlap or hide, 3D framing/occlusion/mesh clashes, and staged SVG/page clipping |
| `npx atlas record <figure> [--size 1920x1080] [--fps 60] [--samples 1] [--shutter 0.5] [--loop] [--silent]` | an MP4 drawn frame by frame (BT.709, QA-gated) with a soundtrack at −14 LUFS (needs ffmpeg) |
| `npx atlas svg-lint <file…> [--strict-draft] [--compact] [--json]` | validates SVG XML/IDs, stroked or upside-down text, compact strokes, and Plotter strict rules |
| `npx atlas export-svg <in.svg> [--out <out.svg>] [--theme light\|dark\|atelier] [--id-prefix <p>]` | resolves `var(--...)` / `currentColor` tokens, sanitizes unsafe elements/styles, and normalizes ARIA |
| `npx atlas svg-render <in.svg> --out <out.png> [--theme light\|dark\|both]` | rasterizes token-resolved SVGs to PNG across browser / `rsvg-convert` / `resvg` / `magick` fallbacks |

The browser commands need Chrome; set `CHROME` if it isn't at the usual place.

## Tools in this repo

`npm run check` runs every model's checks, the link checks, `tools/build-standard.mjs --check`, and `tools/style.mjs`. `npm run test:browser` drives the grammars in Chrome.
`tools/stills.mjs`, `tools/jumps.mjs`, `tools/labels.mjs`, `tools/scene.mjs` and `tools/clip.mjs` are the visual and geometric critics. `tools/record.mjs` makes a
1080p60 MP4 with a soundtrack. `tools/figma-bridge.mjs` (`tokens`, `audit`, `bundle`, `export-svg`) bridges multi-mode palettes, sanitized SVGs, and self-contained Code Layer bundles with the Figma MCP server (`docs/figma-mcp-workflow.md`). `engine/draft_kit.js` (`draft_standard.json` + `tools/build-standard.mjs`) powers pure 2D orthographic construction plates. `engine/iso_kit.js` (`isoSvg`, `inkFilterDefs`, 2.5D keylined primitives), `engine/diegetic.js` (`renderControl`, `bindControls`, `mountControlModeBar`, `createAutoplayDirector`), `engine/chart.js` (`computeBarDelta`, `isoStackChart`, `updateIsoStackChart`), and `engine/theme.js` (`ACCENT_SWATCHES`, `deriveAccentTokens`, `applyAccentTokens`, `mountSwatchBar`, `buildThemeCssSnippet`, `mountThemeStudio`) power diegetic hand-inked 2.5D controls, the live Token Studio, and `examples/ink-ui/` (`tools/bundle-ink-demo.mjs` writes the standalone `examples/ink-ui/atelier-ink-ui.html` bundle). `evals/run.sh` and `evals/validate.mjs` run isolated cold-run skill checks. `CLAUDE.md` and `docs/decisions.md` describe each.
