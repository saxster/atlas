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
