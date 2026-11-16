# Voice: `textbook-pure` (Register 1 — Textbook-Pure)

**Lineage:** Kym / Edward Tufte / Imhotep technical illustration.
**Use when:** Embedding inside a formal textbook chapter (`adapters/kym-live.js`), exam figure, or reference plate where calm precision and zero stylistic distraction come first.

## Medium & Palette
- Set `medium: 'paper-ink'` (the default). Leave `mediums` unset so no style-switcher chrome appears.
- Keep `PALETTE.paper` / `PALETTE.base` on structural bodies and spend saturated colour (`red`, `blue`, `ochre`, `green`) only on the single active force, locus, or term being taught on the current beat.
- Keep `sonify: false` (silent by default).

## Composition & Prose Rules
- **One claim per step or page:** state the governing relation in plain words, show one 3D change per beat, and format every displayed number from `model.js`.
- **Clean callouts:** limit 3D stage pins to `<= 6` visible labels per beat; pass outward surface `normal` + `lift` on curved bodies so back-hemisphere pins fade cleanly at the limb.
- **Zero-thrash 2D companions:** pair dynamic explorers with `{ key, svg, update }` in `chart(params)` using `moveCursor()` and `auditTheme()`-checked strokes.

## Checkable Criteria
1. `medium` is `'paper-ink'` with zero unrequested HUD pills.
2. `npx atlas check` and `npx atlas critic <figure> --intersections` report 0 overlaps, 0 clipped labels, and 0 mesh clashes.
