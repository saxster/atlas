# Atlas

One figure engine (three.js paper-and-ink renderer, book / machine / explorer grammars) and the subject
atlases built on it. Figures also embed in the kym textbooks through their `:::live` widget pipeline.
Plan and decisions: `~/.claude/plans/we-want-to-hugely-dazzling-hellman.md`.

Seeded from nathanliow/atlas-of-physics (MIT; keep its LICENSE notice). Remotes: `upstream` = nathanliow,
`fork` = saxster/atlas-of-physics.

## Rules
- Model first: every number, motion and practice answer reads from a pure `model.js`; `checks.mjs` proves
  the model a second, independent way before anything is drawn.
- A chapter is five files: model, checks, world, pages, practice (+ main.js, index.html).
- Engine code stays subject-free: nothing physics-specific in `engine/`.
- No GPL, NC, ND or unlicensed assets in the engine. SA assets only book-side.
- Static site: any static server works; three.js loads from jsDelivr (importmap in each index.html).

## Test lanes
- FOCUSED: `node <chapter>/checks.mjs` (prints PASS/FAIL rows, exit 1 on failure)
- SMOKE: `npm run check` (every chapter's checks + equation-sheet link check)
- FULL: `npm run check`, then with `python3 -m http.server 8137` running: `node tools/allpages.mjs`
  (every page by deep link: practice present, no console errors)

Browser tools need Chrome (set `CHROME` if not at the macOS default). Screenshots:
`CHAPTER=newton PARTS=, node tools/shoot.mjs <out-dir> [w] [h]`. `golden/` (ignored) holds pre-refactor
screenshots for visual comparison; the scene animates, so compare by eye, not pixel diff.
