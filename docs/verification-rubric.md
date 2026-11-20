# Verification Rubric, Epistemic Modes & Visual Contact-Sheet Protocol

Before publishing any `@saxster/atlas` figure or 2D orthographic construction plate (`engine/draft_kit.js`), verify both the underlying numbers and the rendered image using the four-part rubric below.

## 1. Epistemic Modes (Required Classification)

Declare the diagram or figure mode explicitly (`mode` in `draftSvg`, or section header in `docs/voices/plotter-draft.md`):

1. **`geometric-construction`**: Pure Euclidean, kinematic, optical, or topological proof where every vertex, tangent, and intersection follows deterministically from stated parameters (`model.js` + `checks.mjs` / `draft_kit.js`).
2. **`physical-technical-view`**: Scaled architectural, specimen, or anatomical section (`cad_kit.js` `extrudePlan`, `extrudeLayers`, `draftHatch`, `draftDimension`) where units, bounds, and clearances trace directly to explicit data or user input.
3. **`functional-schematic`**: Block flow, electrical/mechanical circuit, timing sequence, or structural free-body diagram where topology and conservation laws hold (`solveNetwork`, `sequenceLanes`, `sankeyChart`, `draftSupportTicks`) without claiming architectural millimeter scale.
4. **`conceptual-diagram`**: State machine, phase portrait, discrete index cycle (`sCurveIndex`, `snapLogStop`, `eventKeyframes`), or regime transition diagram.

## 2. `NEEDS QUALIFICATION` Protocol

If a prompt omits empirical numbers, boundary conditions, coordinate frame, unit scale, or load ratings needed to construct a claim honestly:

- **Do NOT invent plausible numbers** (`e.g.` fake latency in ms, made-up stress tolerances, ungrounded efficiency `%`, or arbitrary specimen dimensions).
- Mark the missing specification as **`NEEDS QUALIFICATION`** (or emit `badge('unobserved', ...)` / an explicit unscaled qualitative coordinate) and request or surface the exact parameter required before issuing scaled engineering numbers.

## 3. Anti-Icon & Flat-Discipline Rule

Every visual mark must participate in an explanation, geometric construction, or state transformation:

- Reject decorative icon silhouettes, marketing clip-art, gradients, drop shadows, CSS/SVG blurs, skew hacks, stroked text labels, upside-down text (`|deg| > 90°`), bold/italic SVG label styling, stretched letter-spacing, and ALL-CAPS filler headers.
- Enforce structural hygiene and drafting discipline mechanically via `npx atlas svg-lint <file...> --strict-draft`.

## 4. Three-Option Exploration & Light/Dark Contact-Sheet Review

For non-trivial 2D plates and responsive compact variants:

1. Draft three distinct layout/vantage candidates (varying projection axis, section plane, or annotation density) rather than anchoring on the first sketch.
2. Render PNG proofs in both paper light and blueprint dark themes before selection:
   - `npx atlas svg-render <candidate.svg> --out <preview.png> --theme both`
3. Inspect the light/dark PNG pair and any compact (`<= 400px` / `draftCompactSvg`) view side-by-side to verify stroke separation, label clearance, legibility (`>= 4.5:1` WCAG AA contrast), zero stroke clipping, and zero obscured geometry before final delivery (`npx atlas export-svg` + `npx atlas critic`).
