# Figma MCP × `@saxster/atlas`: Full 2026 Studio Polish & Bidirectional Workflow Plan

- **Status:** Implemented, deployed & verified (`tools/figma-bridge.mjs` + live Figma Design Atelier file, WGSL Printmaking Shader & PropsKit Vector Foundry Plugin)
- **Live Deployed Figma Resources:**
  - **Atlas Design Atelier (Design File + Live Code Layer `1:3` + Editable Vector Swatch Sheet `3:2`):** `https://www.figma.com/design/5lNPm1IUc1VTTcEKbgV51Q?node-id=1-3&autoplay-code-preview=1-3`
  - **Atlas Printmaking Studio (`gen_effect` WGSL Shader — `55edfa15-7f9d-4fe6-99d4-0ba99d34cb77`, v`52a633e04504a4964b8bcfaeda189c63c2ecd58f`):** `https://www.figma.com/file/new?try-tool-resource-content-id=55edfa15-7f9d-4fe6-99d4-0ba99d34cb77&try-tool-resource-type=gen_effect&type=design&mode=design` (or in the Atelier file: `https://www.figma.com/design/5lNPm1IUc1VTTcEKbgV51Q?try-tool-resource-content-id=55edfa15-7f9d-4fe6-99d4-0ba99d34cb77&try-tool-resource-type=gen_effect`)
  - **Atlas Vector Foundry & Token Studio (`gen_tool` PropsKit Plugin — `0cf9a286-d5f1-440c-92d0-572ace830772`, v`36555e7dea8de62ea4de04ae877d2752d2b96fc8`):** `https://www.figma.com/file/new?try-tool-resource-content-id=0cf9a286-d5f1-440c-92d0-572ace830772&try-tool-resource-type=gen_tool&type=design&mode=design` (or in the Atelier file: `https://www.figma.com/design/5lNPm1IUc1VTTcEKbgV51Q?try-tool-resource-content-id=0cf9a286-d5f1-440c-92d0-572ace830772&try-tool-resource-type=gen_tool`)
- **Live Verified Subscription Capabilities (`figma_figma` MCP `whoami` & `list_shaders`):**
  - **Plan & Seat:** `pro` tier, `Full` seat (`admin`)
  - **Code Layers in Design:** `code_layers_enabled: true` (`send_code_to_figma` mounts runnable interactive figures directly onto Figma Design pages)
  - **Figma Specs:** `specs_enabled: true` (`editorType: "figspec"` & embedded GFM `SPEC_BLOCK` documents with inline `[comment:<uuid>]` threads)
  - **WebGPU Shaders:** 35 first-party Figma GPU shaders (`Halftone`, `Hatching`, `Dither`, `Colored edges`, `Outlines`, `Gradient map`, `Duotone`, `Moire`, `Water caustic`, `Pattern refraction`, `Lens distortion`, `Fractal noise`) + custom TypeScript/WGSL account shaders (`create_shader` / `update_shader` via `figma:shaders`)
  - **Account Generative Plugins:** Custom reusable Figma Design tools (`create_generative_plugin` / `update_generative_plugin`) with native PropsKit `<fig-*>` controls (`<fig-slider>`, `<fig-input-palette>`, `<fig-joystick>`, `<fig-options>`)
  - **Figma Motion & 3D Transforms:** Bottom-docked keyframe timelines, spring physics, `TextStagger`, `timelineCohorts` (`get_motion_context`), server-side MP4 rendering (`export_video`), and CSS-parity 3D poses (`scene3d`, `transform3d`, `transformOrigin`)
  - **Figma Draw & Vector Generation:** Expressive vector brushes, `TextPath`, boolean operations, and text-to-SVG (`generate_vector_illustration`)
  - **Figma Weave (`weave_*`):** Node-based AI asset/3D/relighting pipelines *(requires a one-time account link at `https://app.weavy.ai/settings?section=profile`)*

---

## 1. The Core Architectural Rule: Division of Labour

`@saxster/atlas` never compromises its **Model-First** (`model.js` → `checks.mjs`) or **Stateless `?render`** (`window.seek(t)`) invariants. Figma is used strictly where 2D optical craft, spatial human critique, and bespoke art direction beat blind CSS/SVG number-guessing:

| Layer | Authoritative Owner | Why |
|---|---|---|
| **Physics/math models, 3D kinematics, ray-tracing, conservation networks, data-driven plot coordinates** | **Code (`model.js`, `checks.mjs`, `world.js`, `chart.js`)** | Every number and curve must be computed from `model.js` and proven a second way in `checks.mjs`. |
| **Typography, multi-voice colour harmony, UI chrome, shelf covers, bespoke SVG emblems, motion curves, print shaders, human redline pin-ups** | **Figma MCP ↔ `tools/figma-bridge.mjs` ↔ Code** | Humans evaluate kerning, optical balance, warmth, and vector silhouettes 10× faster on an infinite 2D canvas with spatial comment pins than in chat prose. |

---

## 2. Nine Modern Figma Affordances & How Atlas Uses Each

### Affordance 1 — Live Runnable Code Layers on Design Canvas (`send_code_to_figma` + `tools/figma-bridge.mjs`)
- **What Figma added:** `code_layers_enabled: true` lets a Figma Design page host **live, interactive HTML/CSS/JS Code Layers** side-by-side with static editorial frames, reference tears, and comment pins (`figma-code-workflows`).
- **The Atlas blocker solved by `tools/figma-bridge.mjs`:** Every example `index.html` in `examples/<subject>/<id>/` uses `../../../engine/` relative paths, which escape a single-figure archive.
- **Exact workflow:**
  1. Stage a self-contained zero-escape bundle:
     ```bash
     node tools/figma-bridge.mjs bundle physics/dc-motor /tmp/atlas-figma-dc-motor
     ```
  2. Call `create_session` on the target Design file (or create one via `create_new_file` with `editorType: "design"` after loading `figma-create-new-file`).
  3. Call `send_code_to_figma` (`fileKey`, `promptId`, `sessionId`), tar/zip `/tmp/atlas-figma-dc-motor` to `nextStep.localArchivePath`, execute `nextStep.uploadCommand`, and complete `send_code_to_figma` with `nextStep.thenCall.arguments`.
  4. Interact with the live spinning 3D figure directly inside Figma Design!

### Affordance 2 — Spatial Human Redlines & Video Storyboard Pin-Ups (`get_comments` + `video-interaction-mapper`)
- **What Figma added:** Native canvas annotations, spatial comment threads overlapping specific `nodeId`s (`get_comments`), and automated video-to-storyboard decomposition (`video-interaction-mapper` skill).
- **Exact workflow:**
  1. Record a 60fps tour with `npx atlas record <subject>/<id>` (or render desktop/phone/5-medium stills with `npx atlas stills`).
  2. Map key interaction beats (`before`/`after` frames + click/drag markers) onto a Figma Design critique page via `video-interaction-mapper` (`upload_assets`), or inspect the live Code Layer.
  3. You drop Figma Comment pins directly on exact pixels (*"tighten `.mediumbar` padding"*, *"make `byrne-1847` paper slightly warmer"*, *"increase folio margin"*).
  4. The agent calls `get_comments({ fileKey, resolved: false })` + `get_screenshot`, translates every pin into `engine/*.css` / `render.js` / `figure.js`, and verifies with `npx atlas critic`.

### Affordance 3 — Native Figma Specs Co-Located with Design (`editorType: "figspec"` / `SPEC_BLOCK`)
- **What Figma added:** Multiplayer GFM specification documents (`specs_enabled: true`, `figma-spec` skill) living either standalone (`editorType: "figspec"`) or embedded directly on a Figma Design canvas (`figma.spec.createOnCanvasAsync`), with anchored inline text comments (`[comment:<uuid>]`).
- **Exact workflow:**
  - Embed the figure's **4-line Step 0 Design Brief**, pedagogical misconception arc, and `checks.mjs` invariants as a `SPEC_BLOCK` right beside its live Code Layer in Figma so copy/pedagogy edits and visual art direction stay in one place.

### Affordance 4 — Multi-Mode Variable Studio + Automated WCAG Gate (`get_variable_defs` ↔ `tools/figma-bridge.mjs`)
- **What Figma added:** Scoped Variables (`FRAME_FILL`, `SHAPE_FILL`, `TEXT_FILL`, `GAP`, `FONT_FAMILY`) across multiple Variable Modes.
- **Exact workflow:**
  1. Export Atlas's 8 canonical palette modes (`paper-ink`, `ciechanow`, `pencil-wash`, `moebius`, `risograph`, `byrne-1847`, `kym-sepia`, `kym-dark`) + typography stacks:
     ```bash
     node tools/figma-bridge.mjs tokens > /tmp/atlas-tokens.json
     ```
  2. Adjust perceptual colour harmony, warmth, and contrast visually in Figma across all 8 modes side-by-side.
  3. Pull variables back via `get_variable_defs` and gate them with:
     ```bash
     node tools/figma-bridge.mjs audit /tmp/figma-vars.json
     ```
     Every mode must clear WCAG 2.x AA (`4.5:1` text & inline prose inks, `3.0:1` graphical marks) on both `sheet` and `page` before syncing to `engine/theme.js` and `engine/atlas.css`.

### Affordance 5 — WebGPU Account Shaders (`create_shader` / `update_shader` + 35 Built-In Shaders)
- **What Figma added:** Real WebGPU (`GPUDevice` + WGSL + `defineProperties` from `"figma:shaders"`) custom `effect` (`gen_effect`) and `fill` (`gen_fill`) shaders in your account library (`figma-shaders` skill), plus 35 first-party shaders (`Halftone`, `Hatching`, `Dither` with Atkinson/Blue-Noise, `Colored edges`, `Outlines`, `Gradient map` in OKLab, `Moire`, `Water caustic`, `Pattern refraction`).
- **Exact workflow:**
  1. **Rapid look-dev in Figma:** Stack Figma's built-in `Halftone` + `Colored edges` + `Fractal noise` (or `Hatching` + `Dither`) on static frames to test printmaking parameters visually in seconds, then port the winning numbers into `engine/render.js`.
  2. **Publish Atlas Shaders to Figma:** Author matching WGSL `effect` shaders (*Atlas Pencil-Wash*, *Atlas Moebius Cross-Hatch*, *Atlas Risograph*) via `create_shader` → `update_shader` (`metadata: { isAnimated, usesMouse }`) so static Figma book covers, social cards, and **Figma Slides** presentations share the exact same print aesthetic as the live Three.js engine! (Zero AI credit cost.)

### Affordance 6 — Custom Account Generative Plugins with PropsKit (`create_generative_plugin`)
- **What Figma added:** Account-scoped TypeScript + PropsKit (`<fig-slider>`, `<fig-input-palette>`, `<fig-options>`, `<fig-joystick>`, `<fig-input-file>`) plugins authored and updated directly via MCP (`figma-generative-plugins` skill)—100% deterministic code, zero AI credits!
- **High-leverage plugins we can mint into your account library on demand:**
  1. **Atlas Token & Contrast Matrix Builder:** Reads `exportTokens()` JSON via `<fig-input-file>` and generates a complete multi-mode Figma Variable Collection + live WCAG contrast swatch sheet in one click.
  2. **Atlas Scientific Vector Foundry:** Generates mathematically exact editable `VectorNode` networks (`setVectorNetworkAsync`) for **Oliver Byrne proof glyphs**, **involute 2D gear profiles**, **guilloché engraving borders**, **logarithmic scale bars**, and **equal-flux field diagrams** directly onto any Figma frame.

### Affordance 7 — Figma Motion Timelines (`get_motion_context` + `export_video`)
- **What Figma added:** Native keyframe tracks, iOS/Android physical springs (`mass`, `stiffness`, `damping`), character/word `TextStagger` (`CENTER_OUT`), multi-node `timelineCohorts`, and server-side `export_video` (`figma-use-motion` + `figma-implement-motion`).
- **Exact workflow:**
  - Choreograph UI chrome transitions—book cover opening (`engine/cover.js`), `:nutshell` `aside()` bubble unfolds (`engine/prose.js`), practice feedback badges, and shelf card hover lifts—visually on Figma's timeline.
  - Call `get_motion_context(fileKey, nodeId, recursive: true)` to pull exact `codeSnippets` (`@keyframes` / springs), `transformOrigin`, and `derivedTimingInfo`, adapting them into `engine/motion.js` / `engine/figure.css` with `@media (prefers-reduced-motion: reduce)` honoured.

### Affordance 8 — Native 3D Perspective & Spine-Hinged Book Poses (`scene3d` + `transform3d`)
- **What Figma added:** Container `scene3d: { perspective, preserve3d }` (`-1` for true orthographic/isometric, positive px for perspective), per-node `transform3d: { type: 'FIXED_ORDER', translateZ, rotateX, rotateY, rotateZ, backfaceVisible }`, and edge-hinged `transformOrigin` (`figma-3d-transforms` skill).
- **Exact workflow:**
  - Prototype physical book-shelf covers (`examples/index.html`), spine-hinged page-turn leaves (`transformOrigin: x: 0%, y: 50%` in `engine/book.css`), and exploded isometric layer diagrams in Figma, then port the exact `perspective`, `rotateX/Y/Z`, and `translateZ` numbers directly to CSS!

### Affordance 9 — Figma Draw, Vector Illustrations, Slides/FigJam & Weave 3D Specimens
- **Bespoke Editorial Vectors (`Figma Draw` + `generate_vector_illustration`):** Generate spot emblems/icons (`kind: "icon" | "illustration"`—paid Figma AI credits; always confirm before invoking), refine curves with Figma Draw brushes / `TextPath`, and download clean fixed-`viewBox` SVGs via `get_design_context` / `download_assets`.
- **Code Connect (`add_code_connect_map`):** Bind Figma components for `.topbar`, `.chip`, `.predict`, `.mediumbar`, `.cutbar`, `.tk-scrub`, `.byrne-chip`, and `.plate` to Atlas's native DOM/CSS contracts so design-to-code never emits generic wrapper soup.
- **Figma Slides & FigJam (`editorType: "slides" | "figjam"`, `generate_diagram`):** Turn any Atlas chapter or `examples/concepts/threads.js` cross-subject concept graph into a lecture slide deck or FigJam architecture map.
- **Figma Weave 3D Specimen Pipeline (`weave_*` → `adapters/specimen.js`):** Once linked at `https://app.weavy.ai/settings?section=profile` (and only with explicit credit confirmation), run node-based image-to-3D `.glb` / delighting workflows for biology/anatomy/museum book pages, gated automatically by `auditDeliverable(root, { maxTris: 50000, requireUV: true, calmPBR: true })` in `engine/mesh-audit.js`.

---

## 3. Credit & Cost Guardrails

1. **Free / Unlimited Pro MCP Operations (Default):** `whoami`, `create_new_file`, `create_session`, `send_code_to_figma` (Code Layers), `get_design_context`, `get_motion_context`, `get_variable_defs`, `get_comments`, `get_screenshot`, `upload_assets`, `download_assets`, `create_shader` / `update_shader` (WGSL), `create_generative_plugin` / `update_generative_plugin` (PropsKit), and `add_code_connect_map`.
2. **Paid Credit / Heavy Server Operations (Confirm First):**
   - `generate_vector_illustration` and `generate_image` consume Figma AI credits—always ask before calling.
   - `weave_run_tool` and `weave_run_model` consume Weave credits—always show estimated cost from `weave_find_model` and ask before running.
   - `export_video` renders server-side (~10s–minutes)—keep diagnostic renders small (`WIDTH: 320`, `fps: 5`, `quality: "low"`).

---

## 4. Integration into the Atlas Authoring Loop (`SKILL.md` Step 0 & Step 5)

```
User Request
   │
   ▼
Step 0: Grill the Design Brief (SKILL.md)
   ├── Q1: Register (Textbook-Pure | Creative Atelier | Quirky & Toy-First)
   ├── Q2: Core Surprise / Misconception
   ├── Q3: Grammar & Tactile Verb
   └── Studio Trigger? (New voice/chrome, bespoke cover/vectors, or Figma pin-up requested)
          │
          ├── No (Fast Path) ──► model.js + checks.mjs ──► world.js + figure.js ──► npx atlas critic
          │
          └── Yes (Figma Studio Polish Pass)
                 ├── Pre-Code: Figma Variables (`figma-bridge.mjs tokens`), Custom Plugin/Vectors, or Motion study
                 ├── Code:     model.js + checks.mjs ──► world.js + figure.js
                 └── Pin-Up:   `figma-bridge.mjs bundle` -> `send_code_to_figma` + `get_comments` redline -> `npx atlas critic`
```
