# Voice: `bugged-sketchbook` (Register 3 — Quirky & Toy-First)

**Lineage:** `thebuggeddev` (*Anatomy*, *Seed*, *Electric Motor*, *Electromagnetism*, *MechLab*, *Lens*, *Books*, *Relic*).
**Use when:** Building tactile, curious STEM lab benches and specimens that feel hand-drawn in an inventor's notebook and invite direct physical poking (stalling a rotor, sliding a magnet along a rail, peeling tissue layers, listening to commutator clicks).

## Medium & Sketchbook Craft
- Set `medium: 'pencil-wash'` (warm `#f7f3ea` sketchbook stock, 1.5px misregistered watercolor fill wash, soft graphite edge wobble, deterministic in `?render`). Optionally offer `mediums: ['pencil-wash', 'paper-ink', 'ciechanow', 'moebius', 'risograph']`.
- Give flush coplanar parts (split-ring commutator halves, p-n junctions, optical doublets) distinct `idOff: -0.05` / `+0.05` so internal boundaries draw crisp graphite seams.
- Pass outward surface `normal` + `lift` on 3D `labels` entries (`{ at: () => ..., normal: () => [nx, ny, nz], lift: 0.08 }`) so pins lift clear of curved shells and fade smoothly at the limb.

## Tactile Bench & Multi-Sensory Rules
- **Camera-angle-invariant 1D rails & damped load:** use `draggable(mesh, { axis: { origin, dir, min, max }, load: 0.28 })` from `@saxster/atlas/stage.js` (`rayAxisClosest`, `stepDraggableLoad`) so sliding magnets, lenses, plungers, or calipers works cleanly even at grazing camera angles and carries physical weight.
- **Edge-case / stall probe:** include at least one direct physical "what happens if I hold or break this?" affordance (e.g. hold-to-stall rotor setting `params.stallTheta`, flip brush polarity, exceed critical angle into TIR via `traceAxisymmetricRays`, short a branch via `solveNetwork`).
- **Visible invisible fields:** render fields and currents with `quantileSeeds` + `fieldLines(..., { conesEvery })` and `flowBeads()` so flux density and carrier direction read spatially without cluttering the stage with arrow grids.
- **Opt-in physical sound (`sonify(ctx, state, ...)`):** define `sonify(ctx, state)` on the chapter or figure with `createHum(ctx)` for continuous speed/flux hum and `playClick(ctx, { dir })` for discrete switching/commutation detents (`mountSoundToggle` starts muted by default, suspends `ctx` immediately on mute, and hides in `?render`).

## Checkable Criteria
1. Includes at least one direct 3D stage manipulation (`draggable` `axis`/`load` or interactive probe) plus reactive prose (`scrub` / `term` / `aside`).
2. `sonify` starts muted by default and never fires in headless tests or `?render`.
3. Every physical curve, ray, or network flow is computed in pure `model.js` (`solvers.js` / `kinematics.js`) and proven in `checks.mjs`.
