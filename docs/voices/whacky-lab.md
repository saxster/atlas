# Voice: `whacky-lab` (Register 4 — Wild, Whacky & Over-the-Top)

**Lineage:** Gary Larson (*The Far Side*), Scott Adams (*Dilbert*), *The Incredible Machine*, *Moebius* × *Risograph* pop printmaking, and rubber-hose contraption labs.
**Use when:** Pushing the `QUIRKS` spectrum to its upper extreme (`quirk: 'wild'` / `'whacky'` / `'over-the-top'`, `level: 1.0`) for counterfactual "what if my buggy rule were a real physical law?" stress tests, Rube Goldberg contraptions, and unmissable intuition-breakers.

## Quirk Spectrum & Mad-Atelier Shader
- Set `quirk: 'wild'` (or mount the 5-stop `mountQuirkBar` from `@saxster/atlas/stage.js`: `['bland', 'atelier', 'slightly-quirky', 'playful', 'wild']`, where `DEFAULT_QUIRK` is `'slightly-quirky'`).
- At `quirk: 'wild'` (`uQuirk = 1.0`), `engine/render.js` engages the **Mad Atelier Overdrive** pass: 12 Hz stop-motion line boil (`uBoil`), double-inked comic keylines with energetic sketch wobble, 3-tier Moebius shadow cross-hatching, and CMYK Risograph halftone pop dots simultaneously.
- Pair with `mountComicStrip` (`engine/comic.js`) starring Director Barnaby (the bureaucratic jargon foil) and Dr. Zeta & Pip (the deadpan *Far Side* lab observers).

## Choreography, Counterfactual Physics & Soundscape
- **Exaggerated rubber-hose springs & camera drama:** use `squashStretch(sy, 1.1)`, `anticipate(u, 0.18, 0.28, 1.18)`, `settleShake`, `camDollyZoom` (Vertigo contra-zoom), and `camHandheld` from `@saxster/atlas/motion.js` (`posterizeTime` in `?render` so `window.seek(t)` stays 100% deterministic).
- **Extreme-case counterfactual toggle:** let the reader push sliders to absurd extremes ($0$, $1{,}000{,}000$, negative resistance, zero friction) or toggle between physical reality and the coherent buggy world.
- **Full procedural WebAudio soundscape:** wire `sonify(ctx, state)` using `createHum`, `playBoop`, `playClick`, and `playKnock` from `@saxster/atlas/sound.js` (muted by default via `mountSoundToggle`, silent in `?render`).

## Checkable Criteria
1. `resolveQuirk('wild')` (or `'whacky'` / `'over-the-top'`) resolves to `id: 'wild', level: 1.0` while `resolveQuirk()` defaults to `'slightly-quirky'` (`level: 0.5`).
2. Even at maximum visual whacky overdrive, every number on screen still comes from pure `model.js` and passes `checks.mjs` and `?render` determinism.
