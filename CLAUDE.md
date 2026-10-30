# Atlas

One figure engine (three.js paper-and-ink renderer, book / machine / explorer grammars) and the subject
atlases built on it. Figures also embed in the kym textbooks through their `:::live` widget pipeline.
Plan and decisions: `~/.claude/plans/we-want-to-hugely-dazzling-hellman.md`.

Seeded from nathanliow/atlas-of-physics (MIT; keep its LICENSE notice). Remotes: `upstream` = nathanliow,
`fork` = saxster/atlas-of-physics.

## Rules
- Model first: every number, motion and practice answer reads from a pure `model.js`; `checks.mjs` proves
  the model a second, independent way before anything is drawn.
- Layout: one top-level directory per subject (`physics/`, later `maths/` …) with a `subject.js` manifest
  listing its chapters; `tools/chapters.mjs` discovers them. URLs are `/<subject>/<chapter>/#<page>`.
- A chapter is five files: model, checks, world, pages, practice, plus `chapter.js` (exports `CHAPTER`: pages,
  world, clock, readout; importable alone, so a textbook can embed the figure), `main.js` (`startBook(CHAPTER)`)
  and `index.html`. The figure is `engine/stage.js`; `engine/book.js` is the book around it.
- Cross-references (`engine/xrefs.js`) use `subject/chapter/page` ids and may cross subjects.
- Engine code stays subject-free: nothing physics-specific in `engine/`.
- No GPL, NC, ND or unlicensed assets in the engine. SA assets only book-side.
- Static site: any static server works; three.js loads from jsDelivr (importmap in each index.html).

## Test lanes
- FOCUSED: `node physics/<chapter>/checks.mjs` (PASS/FAIL rows, exit 1 on failure), or `node tools/check.mjs physics/newton`
- SMOKE: `npm run check` (engine self-test, every chapter and figure's checks, the equation-sheet links, the concept
  index's links and xrefs, and that the generated pages are current)
- FULL: `npm run check`, then with `python3 -m http.server 8137` running: `npm run test:browser`
  (every book page by deep link: practice present, no console errors; tools/controls.mjs: Play/Pause, calm,
  parts as keyboard buttons, Esc focus, top bar fits 360 px, render determinism, embed; then the machine, explorer
  and kym-adapter tests)

Browser tools need Chrome (set `CHROME` if not at the macOS default). Screenshots:
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

## Generated pages (`npm run site` writes them; `npm run check` fails when one is stale)
- `tools/site.mjs`: the root shelf and each subject's contents page, from `subject.js` (`cards`, `hero`, `tagline`,
  `cover`). Physics keeps its hand-made `physics/index.html` (`contents: false`).
- `tools/cards.mjs [subject/id …]`: each card's picture, `<subject>/img/<id>.jpg`, drawn from the `?render` tour
  (`cards[id].page` for a book, `cards[id].at` seconds for a machine or explorer).
- `concepts/build.mjs`: `concepts/index.html` from `concepts/<subject>.js` (ideas, formulas, `shownIn` refs) and
  `concepts/threads.js` (one idea across subjects). `shownIn: []` shows as "not shown yet". It also fails on any
  `engine/xrefs.js` pair that points at a missing page.

## Figure options worth knowing
- `frameAspect` (chapter, figure, or one page or step): the canvas aspect the cameras were framed for (default 1.25); a narrower canvas
  pulls back. `narrowZoom`: extra distance on phones.
- A book page's `molecule` (XYZ text, ångström) adds "See the real molecule": `adapters/molecule.js` loads 3Dmol.js
  2.5.5 (BSD-3) from jsDelivr only when tapped, and says so when offline.
- Grammars: `engine/book.js` (scroll-book), `engine/machine.js` (steps, Manual/Auto), `engine/explorer.js`
  (predict, sliders, seeded run). Each page's `<main>` class and markup follow the pilots
  (`economics/compound`, `statistics/galton`).
- Textbook embeds: `adapters/kym-live.js` (`mountAtlas`), copied into a book by `tools/vendor.mjs`.

## Video (needs ffmpeg; output in `videos/`, ignored)
- `node tools/record.mjs <subject/id> [--size 1920x1080] [--fps 60] [--silent]`: seeks the `?render` tour frame by
  frame into H.264; fails unless the frame count is round(DURATION × fps). Writes a contact sheet (a frame per 3 s)
  and a timeline (`starts`, `events`) for the score.
- `node tools/score.mjs <timeline.json> [<silent.mp4> <out.mp4>]` (record runs it): a seeded lo-fi bed, a bell per
  page or step, a pluck per designed event; two-pass loudnorm to −14 LUFS / −1 dBTP, then measured (PASS/FAIL).
