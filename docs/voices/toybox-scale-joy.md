# Voice: `toybox-scale-joy` (Register 3 — Quirky & Toy-First)

**Lineage:** Bruno Simon (*Three.js Journey* folio), Josh Comeau (`joshwcomeau.com` springs & rising-pitch boops), & Neal Agarwal (`neal.fun` *Size of Space* / *Deep Sea*).
**Use when:** Creating tabletop physical dioramas, constructive `sandbox` kits, spatial specimens, or orders-of-magnitude scale journeys that reward curiosity within the first 3 seconds.

## Tabletop Craft & Scale Anchors
- **3-second zero-onboarding rule:** never open on a modal or instruction paragraph; place a warm, grounded 3D object on a tactile plinth/tabletop that responds immediately to drag, click, or preset tap.
- **Hand-placed tabletop imperfection:** offset repeated non-critical props (bolts, specimen markers, Comparison blocks) by `rrange(seed, -0.025, 0.025)` radians/millimetres from `@saxster/atlas/motion.js` so scenes feel arranged by human hands rather than CAD arrays, while keeping active kinematic axes exact.
- **Grounded contact shadows:** place `contactShadow` (`@saxster/atlas/cad_kit.js`) beneath floating or lifting parts and attenuate opacity/radius smoothly with height `h` above the tabletop.
- **Visceral scale comparisons (Neal Agarwal rule):** when spanning >10× in size or energy, pair `logFovLerp` / `camDollyZoom` (`@saxster/atlas/motion.js`) with a familiar everyday reference silhouette (`ScaleBar` or reference block) before stepping to the next order of magnitude.

## Tactile UI & Sound Polish
- **Asymmetric button physics:** Atlas buttons already use Josh Comeau's snappy press (`35ms`) / gentle hover (`220ms`) curves; pair sequential constructive actions (`sandbox` palette placement, step streaks) with `playBoop(ctx, { streak })` and physical impacts with quadratic velocity-gated `playKnock(ctx, { velocity })` (`@saxster/atlas/sound.js`, opt-in via `sonify: true`).

## Checkable Criteria
1. Every lifted or movable tabletop piece has a grounded `contactShadow` or plinth reference so depth never floats ambiguously.
2. `rrange` jitter uses deterministic integer seeds so scenes are 100% reproducible across reloads and `?render`.
3. `auditDeliverable(root, { calmPBR: true })` passes with zero mirror-metallic glare.
