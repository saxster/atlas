# Voice: `ncase-playable-toy` (Register 3 — Quirky & Toy-First)

**Lineage:** Nicky Case (*The Evolution of Trust*, *Parable of the Polygons*, *Loopy*, *To Build a Better Ballot*, `:nutshell`).
**Use when:** Teaching an emergent system, feedback loop, game-theoretic dilemma, counter-intuitive probability puzzle, or misconception where the reader must *feel their intuition break* before the math lands.

## 5-Act Interest Curve
Structure `book` pages, `machine` steps, or `explorer` flow along Nicky Case's five beats:
1. **Act 1 — Immediate Toy Hook (0–5s):** start with one irresistible clickable/draggable micro-object on stage before introducing jargon or formulas.
2. **Act 2 — Single Local Rule:** reveal the one simple rule governing a single agent, step, or collision.
3. **Act 3 — The Reader Bet (`predict`):** ask a sharp misconception-targeting prediction (`predict` in `explorer.js` or `practice.js` in `book.js`) *before* running the ensemble or edge case.
4. **Act 4 — Emergent / Counter-Intuitive Twist:** run the simulation so the surprising macro-pattern emerges directly from the local rule; highlight the turning point on the 2D chart.
5. **Act 5 — Constrained Sandbox:** hand over 2–3 curated sliders or `sandbox` presets so the reader can test boundary conditions ("Where does this rule flip?").

## Expressive Motion & `:nutshell` Prose
- **Conversational main line + optional depth:** keep primary prose punchy (`<= 45` words per beat) and tuck formal derivations or historical footnotes inside inline `aside('why?', '...')` speech-bubble cards from `@saxster/atlas/prose.js` (with two-dot expand/pinch affordance).
- **Physical personality from pure time:** give discrete transitions subtle `squashStretch(u, 0.14)` and boundary collisions `settleShake(u)` from `@saxster/atlas/motion.js`—always pure functions of step time `t` so `?render` stays exact.
- **Spatial recall (`pickPart`):** in `book` chapters, include at least one `pickPart: 'assemblyKey'` practice question where clicking the 3D part itself answers the check.

## Checkable Criteria
1. Reader encounters a concrete prediction or clickable toy before any multi-parameter control wall.
2. Technical tangents live in expandable `aside()` cards rather than overflowing `.side` or `#sheet`.
3. `predict.answer(params)` and `predict.why(params)` are computed dynamically from `model.js`.
