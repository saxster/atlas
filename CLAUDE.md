# Atlas

`@saxster/atlas`: a library for teaching figures in any subject (three.js paper-and-ink renderer, building
blocks, book / machine / explorer grammars), with example atlases built on it in `examples/`. Figures also embed in
the kym textbooks through their `:::live` widget pipeline. Public; the site is https://saxster.github.io/atlas/.
Architectural rationale and invariants: `docs/decisions.md`.

Seeded from nathanliow/atlas-of-physics (MIT; keep its LICENSE notice). Remotes: `upstream` = nathanliow,
`fork` = saxster/atlas-of-physics.

## Rules
- Model first: every number, motion and practice answer reads from a pure `model.js`; `checks.mjs` proves
  the model a second, independent way before anything is drawn.
- Layout: the library is `engine/` (+ `adapters/`, `bin/`); `package.json` exports it as `@saxster/atlas`
  (`'.'` → `engine/index.js`, `'./<file>.js'` → `engine/`, `'./adapters/<file>.js'`). Content lives in
  `examples/<subject>/` with a `subject.js` manifest; `tools/chapters.mjs` discovers them. URLs are
  `/examples/<subject>/<chapter>/#<page>`.
- Examples import the library by its package name (`@saxster/atlas/stage.js`), never by relative path, so they read
  like user code: node resolves it by package self-reference, the browser by the importmap in each index.html.
- `atlas new <subject>/<id> --grammar …` copies `examples/minimal/<grammar>/` (`book`, `machine`, `explorer`, `sandbox`, `teardown`, `blueprint`): keep those six working and small.
- `cli/` is shipped: the browser harness (`render.mjs`), boot packages (`boot.mjs`), model-first gate (`gate.mjs`), stills, jumps, labels, clip, record and score as functions over the
  current folder, behind `bin/atlas.mjs` (`atlas new | boot | check | gate | stills | critic | record`). `tools/` wraps them for the
  atlas's own examples (all, or `physics/newton`-style names). Run tools from the repo root: they serve the current
  folder.
- The `atlas` skill (`~/.agents/skills/atlas/SKILL.md`) is how Claude in another repo learns this library; keep it
  in step with `docs/API.md` and the `atlas` command.
- A chapter is five files: model, checks, world, pages, practice, plus `chapter.js` (exports `CHAPTER`: pages,
  world, clock, readout; importable alone, so a textbook can embed the figure), `main.js` (`startBook(CHAPTER)`)
  and `index.html`. The figure is `engine/stage.js`; `engine/book.js` is the book around it.
- Cross-references (`examples/xrefs.js`, passed in as each subject's `xrefs`) use `subject/chapter/page` ids and may
  cross subjects.
- Engine code stays subject-free: nothing physics-specific in `engine/`.
- No GPL, NC, ND or unlicensed assets in the engine. SA assets only book-side.
- Static site: any static server works; three.js loads from jsDelivr (importmap in each index.html).

## Test lanes
- FOCUSED: `node examples/physics/<chapter>/checks.mjs` (PASS/FAIL rows, exit 1 on failure), or
  `node tools/check.mjs physics/newton` (tools take `physics/newton` or `examples/physics/newton`)
- SMOKE: `npm run check` (engine self-test, every chapter and figure's checks, the equation-sheet links, the concept
  index's links and xrefs, and that the generated pages are current)
- FULL: `npm run check`, then with `python3 -m http.server 8137` running: `npm run test:browser`
  (every book page by deep link: practice present, no console errors; tools/controls.mjs: Play/Pause, calm,
  parts as keyboard buttons, Esc focus, top bar fits 360 px, render determinism, embed; then the machine, explorer
  and kym-adapter tests)

Browser tools need Chrome (`cli/chrome.mjs`: set `CHROME` if it is elsewhere; `GL=swiftshader` renders in software, as
CI's Linux runners do). CI (`.github/workflows/check.yml`) runs SMOKE and `npm run test:browser` on every push. Screenshots:
`CHAPTER=physics/newton PARTS=, node tools/shoot.mjs <out-dir> [w] [h]`. `golden/` (ignored) holds pre-refactor
screenshots for visual comparison; the scene animates, so compare by eye, not pixel diff.

## Modes (any chapter URL)
- `?render`: no clock of its own. `window.seek(t)` draws the page tour at time t (each page dwells `tourDwell`
  s, default 4, then turns over 1.4 s); `window.DURATION` is the tour's length. Every frame is a pure function of t,
  so the figure (`#right`) is pixel-identical for the same t in any order. Take one throwaway frame after load;
  the top bar's page dots can re-rasterise a few pixels differently, so compare the figure, not the whole page.
- `?embed&page=i`: only the figure, held on page i, calm (still until asked) unless `&auto`.
- `?calm`: still until the reader scrolls, taps, presses a key or Play.

## Critic tools (serve themselves; no server needed)
- `node tools/stills.mjs <out> [chapters]`: a still mid-dwell of every page, at 1440×900 and 390×844.
- `node tools/jumps.mjs [chapters] [--frames dir]`: draws the tour at 0.1 s steps and flags any frame that
  changes more than 3× its nearest neighbours' pixels. Scene loop restarts and forces switching off are flagged
  too; they are designed, so read the frames (`--frames`) before "fixing" one.
- `node tools/labels.mjs [chapters]`: labels overlapping each other, or anchored behind a solid.
- `node tools/scene.mjs [chapters] [--intersections]`: camera framing clipping/empty-frame checks, active-subject
  occlusion along the camera ray, and optional pairwise 3D mesh intersections (`sceneReport`).
- `node tools/clip.mjs [chapters] [--selftest]`: horizontal page overflow, collapsed SVGs, and staged overflow-release pixel-diff clipping (`cli/clip.mjs`, at 1440×900 and 390×844).
- `node tools/style.mjs`: checks `CLAUDE.md` (<32 KiB) and `SKILL.md` (<2,500 words) context budgets, verifies all referenced repo paths and `@saxster/atlas/*` package exports via live `import()`, and runs the `cli/boot.mjs` router self-check.

## Generated pages (`npm run site` writes them; `npm run check` fails when one is stale)
- `tools/site.mjs`: the examples' shelf (`examples/index.html`) and each subject's contents page, from `subject.js` (`cards`, `hero`, `tagline`,
  `cover`). Physics keeps its hand-made `examples/physics/index.html` (`contents: false`).
- `tools/cards.mjs [subject/id …]`: each card's picture, `examples/<subject>/img/<id>.jpg`, drawn from the `?render` tour
  (`cards[id].page` for a book, `cards[id].at` seconds for a machine or explorer).
- `examples/concepts/build.mjs`: `examples/concepts/index.html` from `examples/concepts/<subject>.js` (ideas, formulas, `shownIn` refs) and
  `examples/concepts/threads.js` (one idea across subjects). `shownIn: []` shows as "not shown yet". It also fails on any
  `examples/xrefs.js` pair that points at a missing page.

## Figure options worth knowing
- `frameAspect` (chapter, figure, or one page or step): the canvas aspect the cameras were framed for (default 1.25); a narrower canvas
  pulls back. `narrowZoom`: extra distance on phones.
- A book page's `molecule` (XYZ text, ångström) adds "See the real molecule": `adapters/molecule.js` loads 3Dmol.js
  2.5.5 (BSD-3) from jsDelivr only when tapped, and says so when offline. A book page's `specimen` (`.glb`/`.gltf` URL, Three.js builder, or `{ src, build, source }`) adds "See the real specimen": `adapters/specimen.js` audits the mesh with `engine/mesh-audit.js` (`auditDeliverable`) and opens an interactive 3-point-lit turntable viewer.
- Grammars: `engine/book.js` (scroll-book), `engine/machine.js` (steps, Manual/Auto, optional `cuts: ['solid', 'xray', 'section']`), `engine/explorer.js`
  (predict, sliders, seeded run), `engine/sandbox.js` (presets, matrix, palette, draggable 3D items, optional `cuts`). Each page's `<main>` class and markup follow the pilots
  (`examples/economics/compound`, `examples/statistics/galton`, `examples/minimal/teardown`).
- Kinematics, solvers, procedural motion, 2D-to-3D CAD, reactive prose, multi-voice art mediums, 5-stop Quirk Spectrum, sound & Figma MCP bridge: `engine/kinematics.js`, `engine/solvers.js` (`solveNetwork`, `quantileSeeds`, `traceAxisymmetricRays` — pure, zero DOM/Three.js), `engine/motion.js`, `engine/cad_kit.js`, `engine/parts.js` (`gear` `notch`, role palettes `driver`/`driven`/`idler`, flush-part `idOff`), `engine/prims.js` (`linkage`, `fieldLines`, `flowBeads`), `engine/prose.js` (`scrub`, `val`, `term`, `byrne`, `aside`, `bindProse`), `engine/sound.js` (`playTone`, `playBoop`, `playClick`, `playKnock`, `createHum`, `mountSoundToggle`), `engine/render.js` (`MEDIUMS`: `'paper-ink'`, `'ciechanow'`, `'pencil-wash'`, `'moebius'`, `'risograph'`; `QUIRKS`: `'bland'`, `'atelier'`, `'slightly-quirky'` [default `DEFAULT_QUIRK`], `'playful'`, `'wild'`, `QUIRK_PRESETS`, `resolveQuirk`), `engine/stage.js` (`rayAxisClosest`, 1D `axis`/`load` `draggable`, `normal`/`lift` limb-fading labels, `mountMediumBar`, `mountQuirkBar`), 9 Creator Voices in `docs/voices/catalog.md` (`npx atlas boot <voice>`, including `whacky-lab`), and `tools/figma-bridge.mjs` (`tokens`, `audit`, `bundle` for Figma Code Layers & Variables). Deep evaluations: `docs/2d-to-3d-evaluation.md`, `docs/thebuggeddev-design-ideas.md`, `docs/figma-mcp-workflow.md`.
- Textbook embeds: `adapters/kym-live.js` (`mountAtlas`), copied into a book by `tools/vendor.mjs`.

## Video (needs ffmpeg; output in `videos/`, ignored)
- `node tools/record.mjs <subject/id> [--size 1920x1080] [--fps 60] [--samples 1] [--shutter 0.5] [--loop] [--silent]`: seeks the `?render` tour frame by
  frame into H.264 with explicit BT.709 color tags (`bt709/bt709/bt709`) and optional sub-frame shutter motion blur (`--samples`); runs `qaVideo` (frame count, BT.709 tags, photosensitivity `<= 3` flips/s, and `--loop` seam continuity). Writes a contact sheet (`<name>.sheet.jpg`),
  settled beat sheet (`<name>.beats.jpg`), and a timeline (`starts`, `events`) for the score.
- `node cli/score.mjs <timeline.json> [<silent.mp4> <out.mp4>]` (record runs it): a seeded lo-fi bed, a bell per
  page or step, a pluck per designed event; two-pass loudnorm to −14 LUFS / −1 dBTP, measured (PASS/FAIL), A/V impulse cross-correlation sync check (`±40 ms`), plus `<name>.wave.png` with beat markers.
