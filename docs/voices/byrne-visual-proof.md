# Voice: `byrne-visual-proof` (Register 2 — Creative Atelier)

**Lineage:** Oliver Byrne (*The First Six Books of the Elements of Euclid*, 1847 Chiswick Press) & Nicholas Rougeux (`c82.net/euclid`).
**Use when:** Presenting a geometric proof, conservation identity, trigonometric derivation, vector decomposition, or invariant argument where algebraic letter soup (`triangle ABC`, `segment DE`) forces eye-ping-pong between prose and figure.

## Medium & Primary-Ink Palette
- Set `theme: BYRNE_THEME` (imported from `@saxster/atlas/theme.js`; `#f4efe2` Caslon rag paper, `#1b1917` letterpress black, `#d63a24` vermilion, `#1d5b8c` cobalt, `#e5ad16` ochre fill / `#825b00` WCAG text, `#226b48` emerald). `createStage` applies `chapter.theme` / `figure.theme` automatically via `applyTheme` (`@saxster/atlas/parts.js`).
- Pair with `medium: 'paper-ink'` or `medium: 'risograph'` for tactile print grain.
- Keep yellow (`ochre`) strictly on ink-keylined fills (`byrne.poly`, `shadeMat('ochre')`); for inline text, use `prose.js` `color: 'ochre'` (`#825b00`, ≥ 4.7:1 contrast).

## Visual-Proof Prose Rules
- **Replace letter labels with inline glyphs:** inside `pages.js` or `figure.js` `prose`, emit `byrne.seg('hypotenuse', { color: 'red', angle: -32 })`, `byrne.angle('theta', { color: 'blue', sweep: 54 })`, and `byrne.poly(['sqA', 'sqB'], { shape: 'sq', color: 'ochre' })` from `@saxster/atlas/prose.js`.
- **Multi-target proof isolation:** `byrne.*` defaults to `isolate: true` (`data-isolate="1"`). Hovering or tapping a glyph ghost-fades unrelated construction lines to `0.14` opacity (`E.setIsolate(['sqA', 'sqB'])`) so the reader sees the exact equality step in isolation.
- **Solid black keylines:** every coloured proof region in 3D (`area`, `part`) and 2D (`byrne.*`) carries a crisp ink outline so adjacent primary colours never vibrate.

## Checkable Criteria
1. Prose steps refer to geometric entities through `byrne.{seg,angle,poly}` or `term(..., { isolate: true })` rather than bare 3-letter vertex strings.
2. Every `data-part` target in `byrne.*` resolves to a named assembly in `world.js`.
3. `auditTheme` passes ≥ 4.5:1 text contrast on `#f4efe2`.
