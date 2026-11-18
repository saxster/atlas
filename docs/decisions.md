# Architectural & Engineering Decisions

This log records the non-obvious engineering decisions and invariants behind `@saxster/atlas`, so future maintainers and coding agents do not accidentally regress them.

## 1. Pure-Model Invariant & Independent Verification (`model.js` + `checks.mjs`)

- **Decision:** Every number, motion curve, and practice answer displayed on screen must come from `model.js` (zero DOM, zero Three.js imports), and `checks.mjs` must verify the model a second, independent way before anything is drawn.
- **Why:** If `world.js` or `pages.js` computes its own numbers, two parts of the same screen (e.g., a 3D vector, a readout chip, and a practice question) inevitably drift out of agreement. Independent numerical checks (e.g., closed form vs. RK4/Simpson/finite difference, or analytical kinematics vs. Euclidean link-length invariants) catch formula typos without requiring a browser.

## 2. Stateless Time & Closed-Loop Procedural Motion (`?render` & `engine/motion.js`)

- **Decision:** Every frame in `?render` mode (`window.seek(t)`) and every helper in `engine/motion.js` (`phase`, `win`, `warpTime`, `spring`, `settleShake`, `squashStretch`, `loopNoise`, `eases`) is a pure function of time `t` with zero per-frame accumulator state.
- **Why:**
  1. **Order-independent seeking:** Stills, jump critics, contact sheets, and sub-frame motion blur (`--samples`) seek to arbitrary timestamps out of order. Any velocity/position accumulator (`pos += vel * dt`) breaks when `seek(t)` jumps backward or steps at different frame rates.
  2. **Boundary-pinned springs (`spring(0) === 0`, `spring(1) === 1`):** Raw damped-harmonic envelopes `1 - exp(-z*w*u) * (...)` never reach exact `1.0` at `u = 1`, causing 1–2 px pops at transition boundaries. Blending `lerp(v, 1, smooth(0.85, 1, u))` over the tail `[0.85, 1]` pins both endpoints while preserving physical overshoot and ring.
  3. **Seamless loops (`loopNoise`, `warpTime`):** Summing multi-octave harmonic sines around a circle `sin(2π * (o + 1) * t / period + phase_o)` in `loopNoise(t, seed, period, octaves)` guarantees exact periodicity `f(t + period) === f(t)` with smooth derivatives across the seam (`t = 0` ↔ `t = period`).

## 3. Geometric Scene & Label Critics (`labelReport` & `sceneReport`)

- **Decision:** Critique scenes mechanically in 3D/2D (`cli/labels.mjs`, `cli/scene.mjs`, `cli/jumps.mjs`) alongside visual inspection of stills.
- **Why:**
  - `labelReport()` catches 2D label-box collisions and anchors occluded behind opaque solids.
  - `sceneReport()` checks three orthogonal 3D failure modes at both desktop (`1440×900`) and phone (`390×844`) viewports:
    1. **Camera framing (`inFrame`, `centerInFrame`, `bounds`):** Projects world-space bounding-box center and 8 corners of the active `pageLit` assembly (or visible scene) into normalized screen coordinates to detect clipped assemblies or empty frames.
    2. **Subject occlusion (`occlusion`):** Casts rays from the camera toward sample points on the active page's `lit` assembly to detect when another opaque assembly blocks 100% of the subject.
    3. **Assembly AABB interpenetration (`intersections`):** When `--intersections` (`checkIntersections`) is enabled or an assembly sets `userData.auditIntersections = true`, computes world AABBs for distinct opaque solid assemblies (skipping housing/xray shells and plot tubes) and flags pairs overlapping by more than `intersectionTol` on all three axes.

## 4. Video Encoding, BT.709 Color Tagging, Photosensitivity & A/V Sync (`cli/record.mjs`, `cli/score.mjs`)

- **Decision:**
  - Always end the FFmpeg `-vf` chain with `format=yuv420p,setparams=colorspace=bt709:color_primaries=bt709:color_trc=bt709:range=tv` in addition to `-colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv`.
  - Gate every recorded video with `qaVideo()` (exact frame count `round(DURATION * fps)`, `ffprobe` BT.709 stream tags, Harding/ITU photosensitivity `<= 3` full-frame luminance flips/s, and optional `--loop` seam ratio `<= 2.0x` with no duplicate seam frame).
  - Gate every synthesized soundtrack in `cli/score.mjs` with both two-pass EBU R128 loudness (`-14 ± 1 LUFS`, `<= -0.9 dBTP`) and an A/V impulse cross-correlation check (`|bestLagMs| <= 40 ms`).
- **Why:**
  - In FFmpeg 7+, `-colorspace bt709` output flags alone leave `color_primaries` and `color_transfer` as `unknown` when reading from `image2pipe` MJPEG unless `setparams` stamps each frame in the filtergraph. Untagged videos shift warm paper tones noticeably across macOS QuickTime, Chrome, and iOS.

## 5. On-Demand Specimen & Molecule Viewers (`adapters/molecule.js`, `adapters/specimen.js`)

- **Decision:** Keep the core paper-and-ink stage lightweight and subject-free; load heavy 3D specimen viewers (`3Dmol.js` for molecules, `GLTFLoader` / `showSpecimen` for 3D meshes) on demand only when the reader clicks "See the real molecule" or "See the real specimen", and audit every 3D specimen with `auditDeliverable()` (`engine/mesh-audit.js`).
- **Why:** Most readers scroll through the paper-and-ink diagram without needing megabytes of external mesh/chemistry payloads. Auditing meshes (`maxTris`, non-empty faces, finite coordinates, negative-scale inside-out winding detection, UV presence, and dielectric `metalness` clamping) prevents corrupt or unlit `.glb` assets from breaking the modal viewer.

## 6. Agent Instruction & Skill Context Budgets (`tools/style.mjs`)

- **Decision:** Enforce mechanical budgets in `tools/style.mjs` (run by `npm run check`):
  - `CLAUDE.md` must stay under `32,768` bytes (32 KiB).
  - `~/.agents/skills/atlas/SKILL.md` (when present) must keep valid YAML frontmatter (`name: atlas`, `description`) and a body under `2,500` words (~5,000 tokens).
  - Every local repo path referenced in `CLAUDE.md` and `docs/API.md` must resolve to an existing file or directory.
- **Why:**
  - Coding agents silently truncate project instruction files above 32 KiB (`project_doc_max_bytes = 32768`) and re-attach only the first ~5,000 tokens per invoked skill after context compaction. Keeping instructions concise and putting historical rationale in `docs/decisions.md` ensures zero silent truncation.

## 7. Unified 2D Blueprint & 3D Model Pipeline (`engine/cad_kit.js`, `stage.js`, `render.js`, `parts.js`)

- **Decision:** Treat the 2D technical drawing/floorplan and the 3D physical model as a single geometric truth (`examples/minimal/blueprint`, `docs/2d-to-3d-evaluation.md`):
  1. **Watertight boolean CSG (`RectSolid` & `extrudePlan`):** Build walls, slabs, and openings by adding and subtracting axis-aligned boxes on a non-uniform coordinate grid so touching solids share zero interior seam faces and collinear corner edges merge cleanly.
  2. **Horizontal section cuts with solid ink pochè (`poche: true`, `look.cutY`):** When sliced by a clipping plane (`y = 1.20 m`), watertight backfaces (`!gl_FrontFacing`) render as solid ink (`uPoche`) and flip their view-space normals in `normalMat` so cut boundaries receive crisp ink outlines.
  3. **Telephoto log-FOV dolly-zoom (`planPose`, `logFovLerp`, `cam.fov`):** Interpolate $\ln\tan(\text{fov}/2)$ and $\ln(\text{frameHeight})$ together when transitioning between a $2^\circ\text{--}3^\circ$ overhead blueprint pose and a $20^\circ\text{--}50^\circ$ perspective view so apparent subject scale remains linear without switching cameras.
- **Why:** Maintaining separate 2D SVG floorplans and 3D scenes causes coordinate drift and camera cuts. Slicing a single watertight 3D solid under a $3^\circ$ telephoto lens produces an authentic architectural blueprint that extrudes continuously into 3D perspective.

## 8. WCAG 2.x Contrast Verification, Paper-Masked 2D Charts, and Staged Overflow-Release Clipping Critic
- **Decision:** Added pure WCAG 2.x contrast verification (`wcagContrast`, `auditTheme` in `engine/theme.js`), deepened `engine/chart.js` with surface-matched `<rect class="mask">` callout plates, collision-free SVG naming (`engine/book.js` strips mirrored `#leafsheet` IDs), and conservation-verified `waterfallChart` and `sankeyChart` builders, and added `cli/clip.mjs` (`tools/clip.mjs`) to `atlas critic`.
- **Why:** `getBoundingClientRect()` reports SVG geometry rather than painted stroke/marker bleed or CSS ancestor clipping; screenshotting authored vs. staged `overflow: visible` releases via `OffscreenCanvas` catches real clipped ink at `1440×900` and `390×844`. Enforcing `4.5:1` text and `3.0:1` mark contrast in `engine/selftest.mjs` prevents low-contrast regressions across light, sepia, and dark themes.

## 9. Graph-Spread Search, Programmatic Boot Packages, Model-First Gate & Live Export Verification (`engine/search.js`, `cli/boot.mjs`, `cli/gate.mjs`, `tools/style.mjs`)
- **Decision:**
  1. **1-Hop Graph-Spread + RRF Search (`tools/site.mjs`, `engine/search.js`):** Stamp deterministic `id`s and bidirectional `XREFS`/`THREADS` `links` into `examples/search-index.js` and rank queries in `rankSearch()` by fusing corpus-IDF field-weighted lexical retrieval with 1-hop spreading activation across `XREFS` analogies (`Compare · ...`) and `THREADS` (`Thread · ...`) via Reciprocal Rank Fusion (`RRF_K = 60`).
  2. **Strict Boot Router (`cli/boot.mjs`, `npx atlas boot`):** Assemble a focused boot package (contract, verified exports, live `examples/minimal/<grammar>` skeleton) only on an exact slug or complete multi-word trigger phrase, abstaining with an IDF-scored candidate table on partial overlap.
  3. **Model-First & Read-Before-Write Gate (`cli/check.mjs`, `cli/gate.mjs`, `npx atlas gate`):** Mechanically verify that `model.js` is pure (zero DOM/Three.js imports) and `checks.mjs` passes with $\ge 1$ `PASS` row before scene/grammar files (`world.js`, `figure.js`, `chapter.js`, `pages.js`, `practice.js`) are accepted.
  4. **Live `import()` Symbol Verification (`tools/style.mjs`):** Dynamically import all `@saxster/atlas` modules during `npm run check` to verify that every symbol attributed to a module in `SKILL.md` and `cli/boot.mjs` is actually exported.
- **Why:** Prevents silent documentation/skill drift, mis-routed figure grammars, and scene-before-model authoring shortcuts while surfacing cross-subject analogies directly in `⌘K` search.

## 10. Multi-Voice Art-Direction Mediums, Pure Solvers, Reactive Prose & Grill-Me Design Gate (`engine/render.js`, `engine/solvers.js`, `engine/prose.js`, `engine/sound.js`, `docs/voices/catalog.md`)
- **Decision:**
  1. **Single-Pass Multi-Medium Compositor (`MEDIUMS` in `engine/render.js`, `engine/parts.js`):** Drive 5 art-direction looks (`'paper-ink'`, `'ciechanow'`, `'pencil-wash'`, `'moebius'`, `'risograph'`) through uniforms on the existing normal+ink compositor (`uMedium`, `uHeadlight`, `uPocheMode`, `uSpecIsland`) plus sub-bucket `idOff` (`±0.05` in `HalfFloatType` `normalRT.a` with `NearestFilter`) for flush coplanar part seams. Keep `?render` line-boil phase fixed (`0`) so `window.seek(t)` remains 100% deterministic.
  2. **Pure Conservation & Optical Solvers (`engine/solvers.js`):** Isolate `solveNetwork`, `quantileSeeds`, and `traceAxisymmetricRays` in `engine/solvers.js` with zero DOM and zero Three.js imports so `model.js` and `checks.mjs` stay pure (`engine/phys_kit.js` imports `'three'` and must never be imported by `model.js`).
  3. **Coupled Reactive Prose & Zero-Thrash Charts (`engine/prose.js`, `engine/chart.js`):** Couple inline `scrub()`, `val()`, `term()`, `byrne.{seg,angle,poly}`, and `:nutshell` `aside()` tokens bidirectionally to multi-target 3D assemblies (`setLit`/`setIsolate`) and attribute-mutated `{ key, svg, update }` SVG charts (`moveCursor`, `moveTangent`, `setLivePath`).
  4. **3-Register Creator Voice Canon & Step 0 `grilling` Gate (`docs/voices/catalog.md`, `cli/boot.mjs`, `SKILL.md`):** Before coding a figure, ask the user for the Design Register (*Textbook-Pure*, *Creative Atelier*, or *Quirky & Toy-First*) and load the matching Creator Voice (`npx atlas boot <voice>`).
- **Why:** Allows `@saxster/atlas` to span calm textbook reference plates and expressive, tactile, non-anodyne interactive toys from one pure-model architecture without bespoke WebGL pipelines or DOM thrashing.

## 11. Ghosted Normal-Pass Exclusion, Opaque Paper-Wash Isolation, Diegetic Screens & Stepped 2D Cinematography (`engine/render.js`, `engine/prims.js`, `engine/prose.js`, `engine/chart.js`)
- **Decision:**
  1. **Ghosted-shell `normalRT` exclusion + `+2.0` paper-wash band (`normalPassTone` in `engine/render.js`):** Exclude translucent ghosted housings (`_isolatedDim` or `_xray > 0.45`) from writing opaque depth into `normalRT` so interior lit assemblies retain full ink creases and hatching. Support `{ mode: 'wash' }` on `setIsolate` (and `isolate: 'wash'` in `prose.js` / `stage.js`), encoding `2.0 + tone + idOff` in `normalRT.a` so side-by-side dioramas wash dimmed assemblies toward `uPaper` in `edges` while staying 100% depth-opaque without cloning materials.
  2. **Stateless diegetic `canvasPlate` & SDF-cutout `billboard` (`engine/prims.js`):** Redraw 2D instrument screens purely from `(state, t)` (with headless `DataTexture` fallback in Node) and attach `userData.normalMat` SDF cutouts to `'flame'`/`'plume'`/`'ring'` billboards so `edges` outlines animated silhouettes with exact 1-period loop continuity.
  3. **Parameterized `codeBlock`/`paramChip`, epistemic `badge`, `foilCard`, and geometric-zoom `focusViewBox` (`engine/prose.js`, `engine/chart.js`, `engine/book.js`):** Extend `bindProse` and `chart.js` rather than adding parallel engines or runtime code compilers, keeping every frame order-independent under `?render`.
- **Why:** Eliminates transparent depth-sorting artifacts on tabletop dioramas, preserves interior ink outlines under X-ray/ghosted housings, and provides zero-WebGL stepped 2D SVG cinematography and parameterized execution traces without violating Decision #2 (`window.seek(t)`) or Decision #7 (single 2D/3D geometric truth).

## 12. 2.5D Isometric Ink Kit, Diegetic Illustrated Controls, WCAG Brand Cascade & `#leafsheet` SVG Filter Preservation (`engine/iso_kit.js`, `engine/diegetic.js`, `engine/theme.js`, `engine/chart.js`, `engine/book.js`)
- **Decision:**
  1. **Zero-DOM-Rebuild Accent Cascade & Live 3D Uniform Sync (`deriveAccentTokens` in `engine/theme.js`, `setLiveAccent` in `engine/parts.js`):** Derive 6 semantic CSS variables (`--accent`, `--accent-mid`, `--accent-deep`, `--accent-soft`, `--accent-ink`, `--accent-on`) from a single hex swatch using binary-search luminance clamping (`wcagContrast >= 4.55` on page, card, and soft wash) and mutate cached 3D `ShaderMaterial` uniforms in place so switching swatches recolors DOM, SVGs, charts, comics, and 3D stage parts in `< 1 ms` with zero SVG DOM regeneration.
  2. **Two-Layer Static/Dynamic 2.5D Isometric SVG Split (`engine/iso_kit.js`):** Place static keylined bodies inside `<g filter="url(#...-hand)">` (viewBox-calibrated `feTurbulence` + `feDisplacementMap` + `grain` + `blot` multiply filter, omitted when `quirk === 'bland'`) and place 60fps moving parts in sibling `<g class="iso-dyn">` groups so attribute updates never invalidate browser `<filter>` bitmap caches.
  3. **Accessible Diegetic Controls & Isometric Unit-Stack Charts (`engine/diegetic.js`, `engine/chart.js`, `examples/ink-ui/`):** Pair all 8 Creative control schemas (`unit-stepper`, `prop-picker`, `coin-slider`, `stack-slider`, `slot-tray`, `object-toggles`, `stamp-card`, `tear-stub`) and `isoStackChart` with native ARIA roles (`radiogroup`, `switch`, `aria-pressed`) and synchronized `input[data-key]` elements, and namespace SVG-internal `<defs>` IDs with `leaf-` inside `engine/book.js` `#leafsheet` so filtered SVGs never turn invisible during page turns.
- **Why:** Bridges the aesthetic gap between hand-inked 3D WebGL stages and 2D HTML controls while exceeding static SVG demos on keyboard/screen-reader accessibility, WCAG contrast for bright yellow/amber swatches, 60fps filter caching, and order-independent `window.seek(t)` determinism.
