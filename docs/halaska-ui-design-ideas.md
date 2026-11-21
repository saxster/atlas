# Design & UX Evaluation: `ui.halaska.com` (Halaska UI v1.1.0) → `@saxster/atlas`

- **Status:** `implemented` (pure-Node selftests, multi-swatch WCAG audits, standalone bundle, and headless Chrome E2E verified)
- **Primary Source:** `https://ui.halaska.com/` (**Halaska UI** v1.1.0, MIT, Chris Halaska / Halaska Studio — zero-chart-dep React kit, 2 screens, 40 AI UX patterns, 90 components, `/llms.txt`)

---

## 1. Architectural Filter (Adopt vs. Adapt vs. Skip)

`@saxster/atlas` already leads on pure checked STEM/system models (`model.js` + `checks.mjs`), stateless `?render` `window.seek(t)` video/still tours, 3D paper-and-ink shaders, WCAG-clamped single-swatch cascades (`engine/theme.js`), IDF+graph `⌘K` search (`engine/search.js`), and spring/rubberband physics (`engine/motion.js`). We evaluated Halaska UI against Atlas's invariants (zero runtime deps beyond `three`, pure-Node selftests, multi-theme WCAG AA contrast, zero `?render` drift) and deepened existing Atlas seams:

| Pattern / Idea | Disposition | Atlas Seam & Implementation |
|---|---|---|
| **Nested `TraceWaterfall` (`tabular-nums` KPIs, nested span rows, keyboard arrow nav, `aria-live` detail footer)** | **Adopted** | `spanTimelineLayout`, `spanTimeline`, `bindSpanTimeline`, `setSpanTimelineCursor` in `engine/chart.js` (plus `.st-*` container-queried styles in `engine/atlas.css`). |
| **Live Split-Curtain `CompareSlider`** | **Adopted** | `compareCurtain` + `bindCompareCurtain` (`role="slider"` + pointer/keyboard control) in `engine/diegetic.js`. |
| **Measured-Lightness `0..100` Tonal Scale, Optional Hue-Tinted Neutrals, Orthogonal Headline (`Aa`) & Proportional Corner Geometry** | **Adopted** | `TONAL_STOPS`, `tonalScale`, `deriveNeutralTokens`, `TYPOGRAPHY_PRESETS`, `RADIUS_PRESETS`, `controlRadius`, deepened `deriveAccentTokens` / `applyAccentTokens` / `buildThemeCssSnippet` / `mountThemeStudio` in `engine/theme.js`. |
| **Inverted-Polarity Inline-Expanding Floating Control Dock** | **Adopted** | `mountFloatingDock` in `engine/diegetic.js`, mounted on `examples/ink-ui/` (hidden under `html.render` & `html.embed`). |
| **Agent-First Static Discovery (`/llms.txt`, `/llms-full.txt`, Open Starter Prompt)** | **Adopted** | Generated dynamically by `tools/site.mjs` (`npm run site`) into repo-root `llms.txt` & `llms-full.txt`; ungated "Copy starter prompt" + updated 6-grammar overview in `index.html`. |
| **`Preview \| Code` + `390px` Phone + `Paper \| Sepia \| Dark` Stage Chrome** | **Adapted** | `previewStage` + `bindPreviewStage` in `engine/diegetic.js`, wrapping `#token-studio-preview`, Compare demo, and root `index.html` anatomy plate. |
| **Numbered Live Anatomy Pins (`1..N` + Legend + `"Built from"` Chips)** | **Adapted** | `anatomyOverlay` + `bindAnatomyOverlay` in `engine/prose.js` (interoperates with `[data-part]` isolation). |
| **Undo-Over-Confirm Action Receipts & Semantic SVG State Orbs** | **Adapted** | `createUndoStack` + `showActionReceipt` wired into `engine/sandbox.js` (`Reset`, `Preset`, `Remove`, `Cmd/Ctrl+Z`) and `examples/ink-ui/`; `statusOrb` (`pulse`, `orbit`, `sweep`, `globe`, `spark`) in `engine/diegetic.js` & `engine/book.js` lazy overlay loaders. |
| **Decoupled Motion Feel (`spring \| smooth \| instant`) & 2D Axis-Locked `SpaceDeck`** | **Adapted** | `MOTION_FEELS`, `MOTION_PRESETS`, `normalizeMotionFeel`, `applyMotionFeel` + `createMotionGovernor({ feel })` in `engine/motion.js`; `stepSpaceDeck` + `mountSpaceDeck` in `engine/diegetic.js` (wired into `examples/index.html` `Grid \| 2D Deck` toggle and `examples/ink-ui/`). |
| **`⌘K` Bottom Keyboard Legend** | **Adapted** | `.search-foot` (`↑↓ move · ↵ open · Esc close`) in `engine/search.js` and `engine/shelf.css`. |
| **Single-file JSX + inline JS styles / AI chat approval cards / `transform: scale()` fixed 1200px board / email-gated install prompt** | **Skipped** | Conflicts with Atlas's zero-dep ES-module / `viewBox` & Three.js projection / open-source distribution invariants. |
