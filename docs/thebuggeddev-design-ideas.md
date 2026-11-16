# Design & Architecture Evaluation: `thebuggeddev` → `@saxster/atlas`

- **Status:** `implemented` (Goldfish-audited; engine, 8 Creator Voices, `grill-me` Step 0 gate, and `examples/physics/dc-motor` verified)
- **Worktree / Branch:** `atlas-thebuggeddev` (`feat/thebuggeddev-design-ideas`, branched from `781dc4a`)
- **Primary Sources Surveyed (14 repositories under `https://github.com/thebuggeddev`):**
  1. **Specimen, Atlas & Exhibit Explorers:** `anatomy` (*Anatomy Atelier*), `seed` (*Seed Atlas*), `empire` (*Empire Atlas*), `relic` (*Relic Reborn*)
  2. **Interactive STEM Playgrounds:** `electric-motor`, `electromagnetism`, `mechlab`, `lens` (*LensLab*), `Circuitz`, `spaceship` (*ORBITLAB*)
  3. **Book, Shelf & Tactile Paper Metaphors:** `books`, `paper-roll`, `dear-diary`, `casebook`

---

## 1. Objective & Architectural Filter

`@saxster/atlas` took its original warm neutral paper tokens (`engine/atlas.css`) from `thebuggeddev/anatomy`. Since then, `thebuggeddev` has published ~95 Three.js interactive explorations spanning anatomy, botany, electromagnetism, optics, mechanical engines, circuits, museum conservation, and physical paper/book interfaces.

**Objective:** Extract the highest-leverage rendering, spatial-annotation, direct-manipulation, pedagogical, and tactile-book ideas from `thebuggeddev` and fit them into `@saxster/atlas`'s existing deep modules—**without** regressing Atlas's five non-negotiable invariants (`CLAUDE.md`, `docs/decisions.md`):

1. **Pure-Model Invariant (`model.js` + `checks.mjs`):** Every number, field line, ray intersection, nodal flow, scale bar, and quiz answer on screen comes from a pure `model.js` (zero DOM, zero Three.js) proved a second independent way in `checks.mjs`.
2. **Stateless Order-Independent Time (`?render` & `window.seek(t)`):** Anything drawn during `?render` tours must be a pure function of `t` with zero per-frame state accumulators (`pos += vel * dt`), so stills, `tools/jumps.mjs`, and shutter-blurred video (`--samples`) remain deterministic in any seek order.
3. **Zero Runtime Dependencies Beyond `three` (`package.json`):** No React, GSAP, `three-mesh-bvh`, or browser-only `CanvasTexture` calls inside Node-tested `engine/` modules (`engine/selftest.mjs` runs in headless Node).
4. **Subject-Free Engine & Deep Seams (`CLAUDE.md`, `codebase-design`):** `engine/` stays subject-free (`nothing physics-specific in engine/`). New capabilities deepen existing modules (`engine/render.js`, `engine/parts.js`, `engine/cad_kit.js`, `engine/prims.js`, `engine/stage.js`, `engine/chart.js`, `adapters/specimen.js`, `engine/book.js`, `engine/explorer.js`, `engine/sandbox.js`) and eliminate existing hidden links rather than adding caller-specific flags.
5. **Multi-Theme WCAG 2.x Contrast (`engine/theme.js`):** Every visual addition must adapt across Atlas paper, sepia, and dark Kym textbook embeds (`>= 4.5:1` text, `>= 3.0:1` essential marks) and honour `prefers-reduced-motion`.

---

## 2. Comparative Source Matrix: Adopt vs. Adapt vs. Reject

| Source Repo | Standout Ideas Worth Adopting | Required Adaptation / What to Reject for `@saxster/atlas` |
|---|---|---|
| **`anatomy`** | Sub-pixel `VIEW_LIFT` along camera ray (`anchor + normalize(cam - anchor) * lift`); zero-raycast outward-normal dot-product back-hemisphere label fade; dual-highlight spatial quiz (wrong red + true green); anti-shimmer PBR clamping; `[dir="rtl"]` canvas lock & CSS `unicode-bidi: isolate` numeric readouts. | Reject React HUD and hardcoded 7-light studio inside `engine/`; port PBR clamping idempotently into `engine/mesh-audit.js` + `adapters/specimen.js`. |
| **`seed`** | Live metric `ScaleBar` (`[0.5, 1, 2, 5, 10, 20, 50]` mm/µm/cm/Å from `2 * dist * tan(fov/2)`); proportional plinth + lift-softened contact shadow; offline deterministic k-means++ texture-to-`_tissue` vertex segmentation + uniqueness guard (`share <= 0.60`); aria-scrubbed `"Identify on the figure"` practice mode. | Reject unconditional `WebGPURenderer` / `sharp` runtime dependency in `engine/`; keep segmentation in an optional offline CLI script (`tools/segment-glb.mjs`) reusing `rng` from `engine/rng.js`. |
| **`empire`** | Plaster + ink-wireframe view mode (`polygonOffset` matte paper base + ink wireframe overlay turning textured GLBs into line drawings); 3.5M-pixel fragment budget cap; off-stage `warm()` before scene attach. | Reject `three-mesh-bvh` runtime dependency; `adapters/specimen.js` can add `'ink'` mode using pure Three.js material overrides. |
| **`relic`** | Render-on-demand (`0%` idle GPU); camera-angle-preserving hypothesis/variant swap (`I / II / III`); epistemic provenance split (*Observed/Measured* vs. *Modelled/Extrapolated*). | Reject R3F `<Canvas>` and dark-only emerald palette; express variant comparison in `sandbox.js` / `specimen.js` using Atlas tokens. |
| **`electric-motor`** | Part-ID edge channel so **coplanar flush parts** get crisp ink seams; world-anchored screen-LOD cross-hatching (`log2` octave crossfade—no shower-door sliding, no zoom moiré); optional hand-wobble/sketch contour; `"Hold & scrub phase"` dead-zone probe; 60 Hz in-place SVG mutation vs. diffed text DOM; opt-in procedural WebAudio synth (`hum` + impulse click). | Reject WebGPU-only MRT requirement (encode part-ID inside fractional mantissa of existing WebGL2 `HalfFloatType` `normalRT.a` with `NearestFilter`!). Make sketch boil deterministic via `posterizeTime` (`engine/motion.js`) in `?render`. |
| **`electromagnetism`** | Inverse-CDF equal-flux seed placement (`∫ 2πr w(r) dr` so line spacing encodes magnitude); twist-free parallel-transport multi-tube batch (`fieldLines`) with `InstancedMesh` direction cones; skew-line closest-point **1D axis dragging**; damped load-lag drag feedback; live tangent-slope chart overlay (`slope = dy/dx`). | Keep RK4 streamline integration deterministic per state (`model.js` / `prims.js`) rather than frame-sliced across `rAF` ticks so `window.seek(t)` renders complete lines on frame 1. |
| **`mechlab`** | Continuous running explode (kinematics keep turning while exploded); named sub-programs + `0.1×–2.0×` speed control. | Atlas already has `tools/cards.mjs` (Puppeteer `?render` stills) and `engine/kinematics.js` (`differential`, `gearRatio`, `sliderCrank`). |
| **`lens`** | Shared `+X`-axis conic/aspheric sag function driving both 3D lens mesh (`revolveSection`) and 14-step Newton-Raphson vector Snell ray bundle (with TIR and dashed virtual backward rays); split-curtain *Before / After* comparison; threshold causal micro-tips; `params` Undo/Redo stack. | Keep ray tracing pure and subject-agnostic in a zero-Three solver module (`engine/solvers.js`) so `model.js` & `checks.mjs` verify the paraxial limit without importing `three`. |
| **`Circuitz`** | ~75-line `G_min`-regularized linear conservation-network solver (`solveNetwork`: electrical MNA, hydraulic resistance, thermal flow, Markov/Leontief balances) + Backward Euler companions. | Place pure matrix/network solver in zero-Three `engine/solvers.js` (never in Three-importing `engine/phys_kit.js`!) so `checks.mjs` verifies conservation ($\sum I = 0$, $\sum P = 0$) in Node. |
| **`spaceship`** | Procedural surface textures (crinkled foil facets, fluted channels, riveted seams); `InstancedMesh` signal/packet pulses along 3D curves. | **Critical Node Seam:** Use `THREE.DataTexture` inside existing `procTex()` (`engine/cad_kit.js:1074`), **never** `document.createElement('canvas')`, so `engine/selftest.mjs` runs in Node without DOM! |
| **`books` & `dear-diary`** | Tactile book-card spine & fore-edge page stack on shelf cards; dynamic left/right page-stack thickness growing/shrinking with `shown / (N - 1)`; spine gutter specular catchlight + sinusoidal cast shadow during page flip; bidirectional single-leaf jump when clicking distant `#dots`. | Update both `tools/site.mjs` (`engine/shelf.css`) **and** hand-authored `examples/physics/index.html` (`contents: false`); keep `goto(i, true)` instantaneous for `tools/controls.mjs`. |
| **`paper-roll` & `casebook`** | Intra-page scroll progress micro-rule (`clamp01(f / 0.5)` hairline in sticky `.folio`); dual-mode *Ledger / Spatial Thread Board* for `examples/concepts/` with subject-pinned concept cards, closed-form catenary cross-subject `THREADS` curves, and `Shown / Gaps` filter. | Map `XREFS` (`subject/chapter/page`) through `CONCEPTS.shownIn` and coexist cleanly with `engine/search.js`'s `#concept-filter` listener. |

---

## 3. Prioritized Deep-Module Design Proposals

Each proposal names the **existing Atlas seam** it deepens, what existing code it **reuses** (avoiding hidden/needless links), and the exact implementation invariants caught during Goldfish verification.

---

### Tier 1 — High-Leverage Core Engine, Stage & Performance Enrichments

#### P1. Coplanar Flush-Part Ink Seams & Optional Sketch/Hatching Modes (`engine/render.js`, `engine/parts.js`)
- **Inspiration:** `electric-motor` (`gbuffer.ts:13-16`, `shaders.ts:84-137, 198-233`).
- **Problem in Atlas today:** `edges` `ShaderPass` in `engine/render.js:185-217` detects edges only from depth jumps (`gap`) and view-normal creases (`1 - dot(n0, n1)`). Two **coplanar or flush-tangent parts sharing the same normal**—such as split-ring commutator halves, N/S bar-magnet halves, histological strata (`extrudeLayers`), or a gear flush against a carrier—produce **zero ink boundary line**.
- **Deep-Module Design (Zero Extra Passes, Zero WebGPU Lock-In):**
  1. **Sub-bucket Part ID in `normalRT.a`:**
     - `TONE` (`engine/parts.js:6`) uses `{0.2, 0.4, 0.6, 0.8, 1.0}`, which `edges` quantizes via `int(clamp(floor(tone * 5.0 - 0.5), 0.0, 4.0))` (`engine/render.js:197`), landing at `{0.5, 1.5, 2.5, 3.5, 4.5}`—dead-center in each unit interval.
     - Assign each `part()` mesh (`engine/parts.js:135`) a monotonic per-mesh sub-bucket offset stored in its own `m.userData.idOff = (((++partSeq) % 23) - 11) * 0.005` (`±0.055`, keeping `a * 5.0 - 0.5` inside `[k + 0.225, k + 0.775]`, well above `HalfFloatType` ULP `≈ 0.005` and collision-free even when sibling parts share a name or lack `asm` at construction time; `userData.noSeam = true` opts out).
     - Keep `userData.idOff` separate from `userData.tone` / `userData.baseTone` so `createAssemblyController`'s `syncMeshAppearance` (`engine/render.js:30-43`) never wipes `idOff` on hover, lit, xray, or isolate; combine at render time: `normalMat((o.userData.tone ?? TONE.mid) + (o.userData.idOff ?? 0), ...)`.
     - **Critical Filter Fix:** Set `minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter` on `normalRT.texture` (`engine/render.js:181`)! At `dpr = 2` (`uPx = 1.5`), default `LinearFilter` bilinearly averages `n.a` across silhouettes (`0.5 * (0.6 + 0) = 0.3` → `fract = 0.0`), which would otherwise create false 2px seam halos.
     - In `edges` fragment shader (`engine/render.js:208-212`), compute `seam` only when both texels hit geometry (`else if (a0)`):
       ```glsl
       float id0 = fract(n0.a * 5.0 - 0.5), id1 = fract(n1.a * 5.0 - 0.5);
       float seam = smoothstep(0.012, 0.022, abs(id0 - id1)) * 0.85;
       ek = max(max(crease, gap), seam);
       ```
  2. **Optional `look.sketch` / `look.hatch`:** Add optional uniforms `uWobble` (`0` default) and world-anchored screen-LOD cross-hatching (`lod = log2(hatchPx * dpr * fw / 0.05)` with `1 - fract(lod)` odd-stroke fade), using `posterizeTime` (`engine/motion.js:461`) when line boil is enabled so `window.seek(t)` remains 100% deterministic (`0` under `prefers-reduced-motion`).

#### P2. Zero-Raycast Normal-Fade & View-Ray Lift for 3D Stage Labels (`engine/stage.js`, `engine/labels.css`)
- **Inspiration:** `anatomy` (`hotspots.ts:26, 222-247`) & `seed` (`AnnotationSystem.ts:299-311`).
- **Problem in Atlas today:** `placeLabels()` (`engine/stage.js:206-235`) checks only clip-space `front` (`v.z < 1`), leaving back-hemisphere labels on rotating spheres, cells, globes, or drums at `opacity: 1` right through opaque solids, and ignores `front` on `L.anchor()` (`line 218`).
- **Deep-Module Design:**
  - Extend `W.labels` items (`engine/stage.js:187-235`) with two optional fields evaluated at the surface attachment point `surfPt = L.anchor?.() ?? p`:
    - `normal?: () => THREE.Vector3` (outward world normal): computes `facing = normalWorld.dot(normalize(E.camera.position - surfPt))` and multiplies opacity by `vis = smooth(0.0, 0.28, facing)` (strictly `0` for `facing <= 0` so back-hemisphere labels disappear cleanly at the limb with zero per-frame raycasts). When `L.normal` is present, add class `no-fade-lag` (`transition: none` in `labels.css`) so continuous 60fps opacity matches the SVG leader line/dot without a 250ms CSS lag.
    - `lift?: number` (world units toward camera): shifts `surfPt` along `normalize(E.camera.position - surfPt) * lift` before `E.toScreen` (and inside `labelReport()`, `stage.js:529-535`, which also filters `+L.el.style.opacity > 0.15`) so 3D surface dots clear local geometry relief with **zero 2D pixel parallax drift** and zero false `atlas critic` occlusion flags.

#### P3. Camera-Invariant 1D Axis Mode & Damped Load Feedback in `draggable()` (`engine/stage.js`)
- **Inspiration:** `electromagnetism` (`main.js:336-353, 920-926`).
- **Problem in Atlas today:** `draggable(target, opts)` (`engine/stage.js:97-153, 374-397`) intersects a 2D `THREE.Plane` (`makeDragPlane`), which blows up when orbiting nearly edge-on to a 1D rail (optical bench sliders, pistons, magnets on tracks, number lines).
- **Deep-Module Design:**
  - Deepen `draggable(target, { axis?, load?, ... })` at its existing seam in `engine/stage.js`:
    - `axis: { origin: [x,y,z], dir: [dx,dy,dz], min?, max? }` transforms `origin` and `origin + dir` into Euclidean world space via `axes.toWorld` (`engine/prims.js:84`, handling anisotropic `k` and 3D `z`-up swap!) when `opts.axes` is set, or via `obj.parent.localToWorld` when parented to a translated 3D group:
      $$\mathbf{p}_0 = \text{toWorld}(\text{origin}), \quad \mathbf{v} = \text{toWorld}(\text{origin} + \text{dir}) - \mathbf{p}_0, \quad L = \lVert\mathbf{v}\rVert, \quad \hat{\mathbf{u}} = \mathbf{v}/L$$
    - For camera ray $(\mathbf{o}, \hat{\mathbf{d}})$ with $\Delta = 1 - (\hat{\mathbf{d}}\cdot\hat{\mathbf{u}})^2 > 10^{-4}$, solve closest world arc-length $s_w$ and ray depth $t_r$:
      $$s_w = \frac{(\mathbf{o} - \mathbf{p}_0)\cdot\hat{\mathbf{u}} - (\hat{\mathbf{d}}\cdot\hat{\mathbf{u}})\bigl((\mathbf{o} - \mathbf{p}_0)\cdot\hat{\mathbf{d}}\bigr)}{\Delta}, \qquad t_r = (\hat{\mathbf{d}}\cdot\hat{\mathbf{u}})s_w - (\mathbf{o} - \mathbf{p}_0)\cdot\hat{\mathbf{d}}$$
      Guard $t_r > 10^{-3}$ (ignoring behind-camera ray intersections), convert to axis parameter $s = s_w / L + s_{\text{grabOffset}}$ (preserving `pointerdown` offset `s0 - sHit0`), clamp to `[min, max]`, and pass `origin + s * dir` through `spec.project`.
    - Optional `load: (targetVal, curVal, dt) => nextVal` is stepped inside `createStage.step()` when `!RENDER && !reduced` so holding the pointer still lets spring/Lenz-law resistance settle smoothly.

#### P4. Zero-Thrash 60fps Live Chart Seam in `explorer.js` & `sandbox.js` (`engine/chart.js`, `engine/explorer.js`, `engine/sandbox.js`, `book.css`, `figure.css`)
- **Inspiration:** `electric-motor` (`ui.tsx:98-204`), `Circuitz` (`PhysicsEngine.tsx:11-87`), `electromagnetism` (`main.js:1012-1022`).
- **Problem in Atlas today:** `engine/explorer.js:122` (`figure.chart(state, params)`) and `engine/sandbox.js:227` (`figure.chart(state, params, items)`) rewrite `$('chart').innerHTML` unconditionally 60 times/sec during runs.
- **Deep-Module Design:**
  1. Extend `chart()` (`engine/chart.js:64`) with declarative `tangents: [key]` (`<line class="tangent" data-tangent="key"/>`) and `livePaths: [key]` (`<path class="curve live-path" data-live="key"/>`), styled in **both** `engine/book.css` and `engine/figure.css`, plus `moveTangent(el, key, range, x, y, slope, dx)` and `setLivePath(el, key, range, pts)` alongside `moveCursor`.
  2. In `explorer.js` and `sandbox.js`, support a backward-compatible two-tier return contract from `figure.chart(state, params, items)`:
     - **Fast path (`{ key, svg, update(el, state, params, items) }`):** Mount `el.innerHTML = svg` only when `key` changes (e.g. `JSON.stringify([params, items])`, including during `sandbox.js`'s `window.seek(t)` preset morphs!) and invoke `update(...)` via `setAttribute` every frame.
     - **Legacy string path (`string`):** Keep full compatibility for existing clock-varying string charts (`statistics/galton`, `biology/diffusion`), diffing `if (svg !== prevSvg) el.innerHTML = prevSvg = svg` and diffing `chipEls[i].textContent` so idle frames perform zero DOM mutations.

#### P5. First-Class Museum Specimen Stage (`adapters/specimen.js`, `engine/mesh-audit.js`, `tools/segment-glb.mjs`)
- **Inspiration:** `seed` (`ScaleBar.tsx`, `Pedestal.ts`, `segment-tissues.mjs`), `anatomy` (`loaders.ts:99-145`), `empire` (`engine.ts:1119-1175`), `relic` (`ArtifactStage3D.tsx:223-301, 1327-1378, 1565`).
- **Deep-Module Upgrades (Keeping `adapters/specimen.js` Self-Contained & Lightweight):**
  1. **Demand-Driven Loop + Reduced Motion:** Initialize `spinning = !matchMedia('(prefers-reduced-motion: reduce)').matches`. When `!spinning && !dragging && Math.abs(velAz) < 1e-4`, halt `requestAnimationFrame` (`raf = 0`, `0%` idle GPU) and wake via a guarded `requestRender()` on pointer/wheel/resize/variant change.
  2. **Proportional Paper Plinth + Self-Contained Contact Shadow:** When `spec.plinth !== false`, place a warm bevelled cylinder + a 15-line inline radial-falloff `ShaderMaterial` quad (avoiding importing 75 KB `cad_kit.js`) at `y = box.min.y - sphere.center.y - lift` (`lift = sizeY * 0.06`), tinted from `background` so it matches light, sepia, and dark themes.
  3. **Exact Metric Scale Bar:** When `spec.lengthMm` is provided (defined as `max(boxSize.x, boxSize.y, boxSize.z)` in mm), compute `worldSpanY = 2 * dist * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))`, `pxPerMm = (maxBoxEdge / spec.lengthMm) * (clientHeight / worldSpanY)`, and set bar width in `[44px, 128px]` across `1–2–5` steps (`µm` / `mm` / `cm` / `m`).
  4. **Idempotent `calmPBR` Hygiene (`engine/mesh-audit.js`):** Add optional `calmPBR = false` and `maxAnisotropy = 1` to `auditDeliverable`: guarded by `m.userData._calmed`, clamps dielectric `roughness` into `[0.38, 0.88]`, scales `normalScale` by `0.65` once, and upgrades mipmap filters/anisotropy **only** on textures with `tex.generateMipmaps !== false`.
  5. **`Textured | Paper & Ink` Pill + Camera-Preserving Variants:** Toggle between original PBR and `empire`-style matte paper base + `polygonOffset` ink wireframe, and support `variants: [{ label, src, provenance? }]` (`I / II / III`) swapping models without resetting `az, elAng, dist`.
  6. **Offline Tissue Segmenter (`tools/segment-glb.mjs`):** Standalone build tool reusing `rng` from `engine/rng.js` to bake deterministic k-means++ `_part` vertex attributes into single-mesh GLBs.

---

### Tier 2 — Subject-Free Solvers, 3D Primitives & Active Pedagogy

#### P6. Pure Subject-Free Solvers (`engine/solvers.js`) + `fieldLines`, `flowBeads` & `procTex` Stamps (`engine/prims.js`, `engine/cad_kit.js`)
- **Inspiration:** `electromagnetism` (`main.js:112-118, 403-530`), `electric-motor` (`scene.ts:199-229`), `lens` (`index.html:1917-2081, 3273-3425`), `Circuitz` (`simulation.ts:97-229`), `spaceship` (`index.html:1579-1903`).
- **Critical Seam Placement:** `engine/phys_kit.js` imports `'three'` (`line 2`), and `CLAUDE.md` requires `model.js` to be zero-Three and `engine/` to stay subject-free! Therefore, pure domain-agnostic mathematical solvers belong in a new zero-Three, zero-DOM module **`engine/solvers.js`** (re-exported by `engine/index.js` and traced automatically by `tools/vendor.mjs`):
  1. **`solveNetwork(nodeCount, branches, { gmin = 1e-9 })` (`engine/solvers.js`):** Pure ~70-line `G_min`-regularized nodal conservation solver (`conductance`, `source` difference, `flow` injection, Backward-Euler storage companion) for any conserved potential/flow graph (circuits, hydraulic pipes, heat networks, economic input-output balances), verifiable via node-flow and power conservation in `checks.mjs`.
  2. **`quantileSeeds(weightFn, [r0, r1], count)` (`engine/solvers.js`):** Pure inverse-CDF sampler over non-negative radial/1D density $w(r) \ge 0$ (e.g. $2\pi r |B_x(r)|$ across a bore before sign reversal) using `checks.js`-style Simpson quadrature + bisection so streamline density encodes field magnitude.
  3. **`traceAxisymmetricRays(surfaces, rays)` (`engine/solvers.js`):** Pure 3D conic/aspheric/toric surface Newton-Raphson intersection + vector Snell refraction/reflection/TIR + backward virtual-ray extensions **aligned along `+X`** (`x(y, z)` sag), matching `cad_kit.js`'s `revolveSection()` (`line 1467`) coordinate convention out of the box!
  4. **`fieldLines(parent, fn, { seeds, steps, dt, radius, color, conesEvery, axes })` (`engine/prims.js`) & `flowBeads(parent, curveFn, { count, radius, color, axes })` (`engine/prims.js`):** Pre-allocated `DynamicDrawUsage` parallel-transported multi-tube batch + `InstancedMesh` direction cones/carrier beads using `shadeMat(palOf(color))` so light/sepia/dark themes work automatically, with stateless `u_i = fract(i / count + phase)`.
  5. **New `DataTexture` Modes in `procTex()` (`engine/cad_kit.js:1074`):** Add `'foil'` (micro-facet bump/albedo), `'fluted'` (parallel channels), `'striation'` (stacked paper edges), and `'acuity'` (procedural resolution test grid) using pure `Uint8Array` `THREE.DataTexture` + `rng(seed)` so headless Node `selftest.mjs` tests every mode.

#### P7. Consolidated `engine/sound.js`, Spatial `pickPart` Practice & "Hold & Scrub Phase" (`engine/sound.js`, `engine/book.js`, `engine/machine.js`, `engine/explorer.js`, `engine/stage.js`)
- **Inspiration:** `anatomy` (`OrganViewer.tsx:48-154`), `seed` (`Practice.tsx`), `electric-motor` (`sound.ts:9-83`, `App.tsx:442-473`).
- **Existing Hidden-Link Cleanup + Seam Deepening:**
  1. **Consolidate 3× Duplicated `playTone` into `engine/sound.js`:** Currently `playTone(ctx, opts)` is copy-pasted identically across `engine/phys_kit.js:143`, `engine/bio_kit.js:185`, and `engine/chem_kit.js:600`, while `adapters/kym-live.js:310, 574` already supports `chapter.sonify(ctx, state, page, params)`! Extracting `engine/sound.js` (`playTone`, `playImpulse`, `createHumSynth`, and muted-by-default `mountSoundToggle` calling `figure.sonify`) deletes all 3 duplicate copies and unifies standalone figures with Kym textbook embeds (staying 100% silent by default, in `?render`, and under `prefers-reduced-motion`).
  2. **4th Practice Question Type — `pickPart: { asm: 'valve', label? }` (`engine/book.js`, `engine/stage.js`):**
     - Clicking *"Locate on the figure"* arms `stage` quiz-pick mode: intercepts pointer taps **before** `S.select(k)` explodes parts or opens `#plate` (which would cover `#sheet`!), masks canvas hover hints and left-page `.parts` button labels while armed, and disarms cleanly on `showPage`.
     - On a wrong tap `wrongKey`, temporarily clones/tints `wrongKey` (`PALETTE.red`) and `asm` (`PALETTE.green`) simultaneously for `1.8 s` while revealing `.why`.
  3. **"Hold & Scrub Cycle" Control (`engine/machine.js`, `engine/explorer.js`):** Optional `cycle: { period, unit: '°', max: 360, hints?: [[at, tol, text]] }` adds a *"Hold & scrub"* pill beside Play/Run that pauses autonomous `clock` advance and reveals a `0–360°` phase scrubber with causal micro-hints.

---

### Tier 3 — Shelf, Scroll-Book & Cross-Subject Concept-Board Craft

#### P8. Tactile Book-Spine Shelf Cards, Dynamic Page-Stack Edges & Direct-Jump Leaf Turns (`tools/site.mjs`, `examples/physics/index.html`, `engine/shelf.css`, `engine/cover.js`, `engine/book.js`, `engine/book.css`, `engine/figure.css`)
- **Inspiration:** `books` (`index.html:757-785, 1474-1561`), `dear-diary` (`App.tsx:707-750, 907-908, 995-1011`), `paper-roll` (`index.html:143-156`), `anatomy` (`globals.css:618-641`).
- **Deep-Module Additions:**
  1. **Book vs. Figure Shelf Affordances (`tools/site.mjs:78`, `engine/shelf.css`, `examples/physics/index.html`):** Emit `data-kind="book" | "figure"` in `tools/site.mjs` **and** update hand-authored `examples/physics/index.html` (`contents: false`) so all subject shelves share the cloth-spine left crease, 3-stepped right fore-edge paper stack, and subtle `perspective(1400px) rotateY(-5deg)` hover cover-peel on multi-page books.
  2. **Dynamic Left/Right Page-Stack Thickness + Spine Catchlight (`engine/book.js:207`, `engine/book.css:26-34`):** Set `--left-stack: N > 1 ? shown / (N - 1) : 0` and `--right-stack: N > 1 ? 1 - shown / (N - 1) : 0` on `#book` so stacked paper fore-edges transfer visibly from right to left across a chapter; add a `1px` specular catchlight on `.spine` and sinusoidal cast shadow during `.leaf` and `cover.js` turns.
  3. **Bidirectional Direct-Jump Leaf Override (`engine/book.js:222, 315-343`):** When a reader clicks a distant dot in `#dots` (`|target - current| > 1`) with `!now && !reduced` (leaving programmatic `goto(i, true)` in `tools/controls.mjs` 100% synchronous!), activate a short `jumpAnim` override that interpolates camera/look directly between `PAGES[current]` and `PAGES[target]` while swinging a single leaf forward (`0° → -180°` for `target > current`) or backward (`-180° → 0°` for `target < current`) instead of riffling through intermediate pages.
  4. **Sticky Dwell-Progress Hairline & Bidi-Safe Readouts:** Render a `1.5px` progress hairline (`clamp01(f / 0.5)`) inside sticky `.folio` (so it remains visible even when `.page.left` scrolls vertically) and add `direction: ltr; unicode-bidi: isolate` in CSS on `.figure`, `.corner.br`, `.chip .v`, and `.slider output` (safe with `.textContent` assignments).

#### P9. Dual-Mode "Ledger / Spatial Thread Board" on `examples/concepts/` (`examples/concepts/build.mjs`, `examples/concepts/concepts.css`, `engine/search.js`)
- **Inspiration:** `casebook` (`index.html:2780-2967, 3184-3305, 4047-4176`).
- **Deep-Module Design:**
  - Keep the typographic **Ledger** as default and mobile layout, and add a `Ledger | Thread Board` view switch + `All | Shown | Gaps` pill in `concepts/index.html` (syncing cleanly with `engine/search.js`'s `#concept-filter` input):
    - Positions the 6 subject columns on a pan/zoomable `--page: #f2f2ef` desk with formula cards, closed-form SVG catenary curves for the 5 cross-subject `THREADS` (`threads.js`) plus page-level `XREFS` mapped via `CONCEPTS.shownIn`, and a side **Concept Inspector** displaying existing `<subject>/img/<id>.jpg` card thumbnails and deep links.

---

## 4. Recommended Phased Roadmap

| Phase | Proposals Included | Touched Files | Risk / Footprint |
|---|---|---|---|
| **Phase 1: Core Engine & Stage Precision** | **P1** (flush-part seams), **P2** (normal-fade + view-ray lift labels), **P3** (1D axis `draggable`), **P4** (`updateChart` 60fps seam) | `engine/{render,parts,stage,labels.css,chart,explorer,sandbox,book.css,figure.css}.js`, `engine/selftest.mjs` | Small (~170 LOC total), 100% backward-compatible, immediate visual & CPU win across all figures. |
| **Phase 2: Museum Specimen Stage** | **P5** (demand loop, plinth + inline contact shadow, live `ScaleBar`, idempotent `calmPBR`, `Paper & Ink` toggle, camera-preserving variants) | `adapters/specimen.js`, `engine/mesh-audit.js`, `tools/{adaptertest,segment-glb}.mjs` | Isolated to on-demand specimen adapter + mesh audit (~190 LOC). |
| **Phase 3: Solvers, Primitives & Active Pedagogy** | **P6** (`engine/solvers.js`, `fieldLines`, `flowBeads`, `procTex` stamps), **P7** (unified `engine/sound.js`, `pickPart` quiz, *Hold & scrub*) | `engine/{solvers,index,prims,cad_kit,sound,phys_kit,bio_kit,chem_kit,book,machine,explorer}.js` | Medium (~360 LOC, minus ~45 LOC deleted duplicate `playTone`); unlocks flagship E&M, motor, circuit, and 3D optics figures. |
| **Phase 4: Tactile Book, Shelf & Concept Board** | **P8** (book-spine shelf cards incl. `physics/index.html`, dynamic page stacks, direct-jump leaf), **P9** (Spatial Thread Board on `concepts/`) | `tools/site.mjs`, `examples/physics/index.html`, `engine/{shelf,book,figure}.css`, `engine/{book,cover,search}.js`, `examples/concepts/{build.mjs,concepts.css}` | Pure UI/CSS & static site generator; zero 3D engine risk. |

---

## 5. Verification Commands & Boundaries

### Commands (run from worktree `/Users/amarsukhi/src/MyCode/visualisations/atlas-thebuggeddev`)
```bash
# 1. Fast smoke & self-tests (Node-only: engine/selftest.mjs, all 52 chapter/figure checks, xref/concept links, style budgets)
npm run check

# 2. Regenerate shelf pages, search-index.js, and concepts/index.html when touching tools/site.mjs or concepts/build.mjs
npm run site

# 3. Full headless Chrome browser suite (start static server on 8137 first)
python3 -m http.server 8137 &
npm run test:browser

# 4. Geometric, label, jump, and staged overflow-clipping critics at 1440x900 & 390x844
#    Note: bin/atlas.mjs expects repo-relative paths starting with examples/..., whereas tools/*.mjs also accept short subject/id keys
npx atlas critic examples/physics/induction --intersections
npx atlas stills shots/ examples/minimal/book examples/minimal/machine examples/minimal/explorer examples/minimal/sandbox
```

### Boundaries
- **Always do:**
  - Keep `model.js`, `engine/kinematics.js`, `engine/motion.js`, and `engine/solvers.js` 100% free of DOM and Three.js imports, and prove every solver a second independent way in `engine/selftest.mjs` and `checks.mjs`.
  - Use `THREE.DataTexture` (never `document.createElement('canvas')`) inside any `engine/` module imported by `engine/selftest.mjs`.
  - Preserve `window.seek(t)` order-independence in `?render` mode (no velocity/particle accumulators in tour-visible paths) and verify contrast with `auditTheme()` (`engine/theme.js`).
  - Keep `CLAUDE.md` `< 32 KiB`, `~/.agents/skills/atlas/SKILL.md` `< 2,500` words, and update `docs/API.md` + `docs/decisions.md` only when corresponding files exist (`tools/style.mjs` enforces path resolution).
- **Ask first:**
  - Before adding any npm dependency to `package.json` (all 9 proposals require **zero** new runtime dependencies).
  - Before changing public chapter schema fields in a non-backward-compatible way.
- **Never do:**
  - Never mutate the main `/Users/amarsukhi/src/MyCode/visualisations/atlas` worktree (which holds uncommitted work on `main`); keep all work isolated in `/Users/amarsukhi/src/MyCode/visualisations/atlas-thebuggeddev`.
  - Never copy GPL/NC/ND or unlicensed 3D `.glb` or texture assets from `thebuggeddev` into `@saxster/atlas`; re-implement mathematical/shader ideas cleanly from first principles.

---

## 6. Open Questions for Implementation Sign-Off

1. **Which phase(s) should we implement first in `atlas-thebuggeddev`?** (Recommended starting slice: **Phase 1 + Phase 2**, or a vertical slice pairing **P1 + P6** with a flagship electromagnetism/motor figure.)
2. **Sketch / Hand-Drawn Look (`P1`):** Should `look.sketch` / `look.hatch` remain opt-in per page/step (preserving Atlas's crisp architectural ink line as the default), or also be exposed as a reader-facing appearance toggle?
3. **Procedural Sound (`P7`):** Should opt-in WebAudio synthesis (`sonify`) surface a muted-by-default `Sound` pill only on `machine` / `explorer` / `sandbox` figures, or also on `book` pages that define `sonify`?
4. **Concepts Spatial Thread Board (`P9`):** Should `examples/concepts/` offer `Ledger | Thread Board` as an interactive client-side toggle on the same `concepts/index.html` page?
