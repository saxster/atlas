# Design & UX Evaluation: `www.magicpatterns.com` -> `@saxster/atlas`

- **Status:** `implemented` (single-source voice manifest, spatial critique pins + non-destructive stage overlay, live 16:9 lecture mode, synchronized 3-takes board, zero-dep stdio MCP server, showcase upgrades, unit tests, and Playwright E2E)
- **Primary Source:** `https://www.magicpatterns.com/` (Magic Patterns — multi-variant UI canvas, spatial feedback pins, interactive presentation mode, visual state/theme matrices, zoomable workspace deck, and agentic MCP bridge)

---

## 1. Architectural Filter (Adopt vs. Adapt vs. Skip)

`@saxster/atlas` already excels at checked mathematical models (`model.js` + `checks.mjs`), stateless `?render` `window.seek(t)` captures, 3D paper-and-ink shaders, WCAG-clamped single-swatch cascades (`engine/theme.js`), IDF+graph `Cmd/Ctrl+K` search (`engine/search.js`), and spring/rubberband physics (`engine/motion.js`). We evaluated Magic Patterns against Atlas's invariants (zero runtime deps beyond `three`, pure-Node selftests, multi-theme WCAG AA contrast, stateless `?render` determinism, subject-free `engine/`) and deepened existing Atlas seams rather than inventing parallel stacks:

| Pattern / Idea | Disposition | Atlas Seam & Implementation |
|---|---|---|
| **Single-Source Voice Presets + Clean Switching** | **Adopted** | Single JSON source `engine/voices.json` generated via `tools/build-voices.mjs` into frozen `engine/voices.js` and `docs/voices/catalog.md`; WCAG-audited `applyVoice` + `mountVoiceBar` in `engine/theme.js` (zero `three` dependency) with `?voice=` URL state and `setVoice` in `engine/stage.js`. |
| **Multi-Mode Inspection Overlay + Portable Critique Pins (`Inspect`, `Tune`, `Pins`)** | **Adopted** | Pure schema, base64url `?reviewData=` codec, `Cite:`/`cam:` formatters, and live `Interact \| Inspect \| Tune \| Pins` pill overlay in `engine/review.js`, wired into `engine/book.js`, `engine/machine.js`, `engine/explorer.js`, and `engine/sandbox.js`, plus `--pins` emission in `cli/labels.mjs`, `cli/scene.mjs`, `cli/clip.mjs`, `cli/visual-learner.mjs`, and `bin/atlas.mjs`. |
| **Live Interactive Presentation Deck + Vector-Clean Slide Export** | **Adopted** | Zero-dep 16:9 lecture wrapper (`?present` / `Shift+P`, keyboard navigation, speaker notes `N`, blank `B`, `Escape` exit) in `engine/present.js` with full-bleed `?embed` support across all 4 figure runners and headless PNG/PDF export in `cli/slides.mjs` (`npx atlas slides`). |
| **3-Take Exploratory Variant Board** | **Adopted** | Pure take planner `buildTakesSpec` + synchronized `postMessage` board `mountTakesBoard` in `engine/takes.js` and static self-contained board builder `buildTakesHtml` / `writeTakesBoard` in `cli/takes.mjs` (`npx atlas takes`). |
| **Agent-Native Stdio MCP Tooling** | **Adopted** | Zero-dependency JSON-RPC 2.0 stdio server in `cli/mcp.mjs` (`npx atlas mcp`) exposing `9` read/lint/scaffold/critique tools and `5` resources with strict stdout isolation (`captureLogs`) and Content-Length + NDJSON framing. |
| **Live Concept Hero & Multi-Voice / State Matrix Preview** | **Adapted** | Upgraded root `index.html` with a dual-audience hero ("Same Math, Five Voices" live damped harmonic oscillator across `6` voices + WCAG AA badge, `7`-subject switcher, For Readers & Authors / For Coding Agents split) and extended `examples/ink-ui/index.html`, `examples/ink-ui/main.js`, and `tools/bundle-ink-demo.mjs` with `#voice-gallery` (all `10` voices) and `#state-previews` (hidden under `html.render`). |
| **Zoomable 2D Canvas Shortcuts, Card Workflows & Coverage Filters** | **Adapted** | Added `Meta/Ctrl +/-` and `Shift+0/1/2` zoom shortcuts to `mountSpaceDeck` in `engine/diegetic.js` and `tools/site.mjs`; added `.card-slot` (`Remix \| Embed \| Slides`) and `examples/catalog.md` generation in `tools/site.mjs`; added `All \| Shown \| Gaps` + `Remix` filtering in `examples/concepts/build.mjs` synced with `engine/search.js`. |
| **Cloud SaaS Workspaces / Proprietary React Component Generation / Server-Side LLM Chat Loops** | **Skipped** | Conflicts with Atlas's local-first static HTML/ES-module distribution, pure `model.js` correctness gates, and external-agent workflow (`cli/mcp.mjs` + `cli/boot.mjs`). |

---

## 2. Verification Targets

- Pure-Node selftests in `engine/selftest.mjs` (`npm run check` via `tools/check.mjs`, including `tools/build-voices.mjs --check`, `tools/style.mjs`, and `docs/API.md` / `CLAUDE.md` path checks).
- Deterministic build and UI regression gates (`npm run site`, `tools/controls.mjs`, `tools/inkuitest.mjs`).
- Headless Chrome end-to-end suite in `tools/magicpatternstest.mjs` covering root `/` (`1440x900` & `390x844`), `?present`, `?inspect` / `?reviewData=`, takes boards (`?embed`), 2D Deck zoom, Concepts filters, `examples/ink-ui/`, and CLI smoke checks (`atlas mcp`, `atlas takes`, `atlas slides --pdf`).
