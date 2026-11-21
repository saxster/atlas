# Atlas Creator Voices & 5-Stop Quirk Spectrum

Atlas ships a **5-Stop Design Quirk & Expressiveness Spectrum** (`QUIRKS = ['bland', 'atelier', 'slightly-quirky', 'playful', 'wild']` in `engine/render.js` and `engine/stage.js`), with **`'slightly-quirky'` (`level: 0.5`, `medium: 'pencil-wash'`) as the universal default**:

| Quirk Stop | Level | Default Medium | Register & Default Creator Voice | Character |
|---|---|---|---|---|
| **`bland`** | `0.00` | `'paper-ink'` | Register 1 — `textbook-pure` | Clinical, austere reference plate: zero wobble, zero grain, overdamped transitions. |
| **`atelier`** | `0.25` | `'ciechanow'` | Register 2 — `ciechanowski-mechanism` / `byrne-visual-proof` | Crisp editorial mechanism & visual-proof plate with subtle ink pressure. |
| **`slightly-quirky`** *(Default)* | `0.50` | `'pencil-wash'` | Register 3 — `bugged-sketchbook` / `moebius-printmaking` | Warm watercolor sketchbook & ligne-claire craft, gentle graphite wobble, lively springs, and tactile probes. |
| **`playful`** | `0.75` | `'risograph'` | Register 3 — `ncase-playable-toy` / `toybox-scale-joy` | Bouncy tabletop toybox: CMYK Risograph halftones, squash-and-stretch, and stop-motion boil. |
| **`wild`** *(aliases: `whacky`, `over-the-top`)* | `1.00` | `'moebius'` | Register 4 — `whacky-lab` | Over-the-top Mad Atelier maximalism: animated 12 Hz line boil, comic cross-hatching + Risograph pop dots, rubber-hose springs, and full soundscape. |

Load any **Creator Voice** with `npx atlas boot <voice>` alongside `npx atlas boot <grammar>`.

## Register 1 — Bland / Textbook-Pure (Calm, Canonical Reference · `quirk: 'bland'`)
- **`textbook-pure`** (`docs/voices/textbook-pure.md`) — Kym / Tufte / Imhotep technical plate: warm ivory paper, crisp ink silhouettes, restrained single-accent focus, zero theatrical chrome.

## Register 2 — Creative Atelier (Editorial Craft, Printmaking & Visual Proofs · `quirk: 'atelier'`)
- **`ciechanowski-mechanism`** (`docs/voices/ciechanowski-mechanism.md`) — Bartosz Ciechanowski mechanical clarity: frameless `#f8f8f8` stage, `[0.75, 1.0]` view-headlight, role-coded `driver` / `driven` / `idler` / `compound` gears with rotation `notch: true`, one degree of freedom per figure.
- **`byrne-visual-proof`** (`docs/voices/byrne-visual-proof.md`) — Oliver Byrne (1847 Chiswick Press) & Nicholas Rougeux (`c82.net/euclid`): `BYRNE_THEME` primary inks + inline `byrne.seg` / `byrne.angle` / `byrne.poly` geometric tokens replacing algebraic letter Soup (`∠ABC`), paired with `data-isolate="1"` hover proof-focus.
- **`plotter-draft`** (`docs/voices/plotter-draft.md`) — Pure 2D orthographic construction plate (`engine/draft_kit.js`, `engine/draft_standard.json`): flat `1px` line hierarchy via opacity tokens (`primary`..`grid`), tip-first dashed transfer arrows, witness-broken dimensions, clipped H1/H2 hatching & S1 support ticks, even-odd inverse clips & luminance clearance masks, `draftCompactSvg` LOD, and non-boosting mark isolation.
- **`moebius-printmaking`** (`docs/voices/moebius-printmaking.md`) — Moebius ligne-claire & Risograph printmaking (Maxime Heckel): `medium: 'moebius'` (hard specular islands + 3-tier screen-space cross-hatching) or `medium: 'risograph'` (CMYK rotated cell-center halftone dots + warm paper grain).
- **`redblob-reactive-prose`** (`docs/voices/redblob-reactive-prose.md`) — Amit Patel (Red Blob Games) & Bret Victor (`Tangle`): 4-surface semantic hue lock across inline `scrub()`, live `val()`, bidirectional `[data-part]` `term()`, 2D chart `tangents`/`livePaths`, and 3D assemblies.

## Register 3 — Slightly Quirky & Playful (Default Tactile Sketchbook & Toy-First · `quirk: 'slightly-quirky' | 'playful'`)
- **`bugged-sketchbook`** *(Default Voice)* (`docs/voices/bugged-sketchbook.md`) — `thebuggeddev` interactive STEM sketchbook: `medium: 'pencil-wash'` (misregistered watercolor wash + subtle graphite edge wobble), flush-seam coplanar parts (`idOff`), 1D `axis` / damped `load` direct manipulation, hold-to-stall probes, `fieldLines` + `flowBeads`, and opt-in `sonify: true` (`createHum`, `playClick`).
- **`ncase-playable-toy`** (`docs/voices/ncase-playable-toy.md`) — Nicky Case playable-system arc: 5-act Interest Curve (*Toy Hook → Single Local Rule → Reader Bet `predict` → Edge-Case Twist → Constrained Sandbox*), inline `:nutshell` `aside()` bubbles, and expressive `squashStretch` / `settleShake`.
- **`toybox-scale-joy`** (`docs/voices/toybox-scale-joy.md`) — Bruno Simon, Josh Comeau & Neal Agarwal tactile delight: 3-second zero-onboarding rule, `rrange` hand-placed tabletop micro-imperfection, height-attenuated `contactShadow`, `logFovLerp` visceral scale anchors, and rising-semitone `playBoop` / velocity `playKnock`.

## Register 4 — Wild, Whacky & Over-the-Top (Mad Atelier Maximalism · `quirk: 'wild'`)
- **`whacky-lab`** (`docs/voices/whacky-lab.md`) — *Far Side* × *Scott Adams* × *Incredible Machine* counterfactual lab: `quirk: 'wild'` (`uQuirk = 1.0`, simultaneous Moebius comic cross-hatching + CMYK Risograph pop dots + 12 Hz stop-motion line boil + double-inked keylines), rubber-hose `squashStretch` & `anticipate`, `camDollyZoom`, and full procedural WebAudio soundscape.

## Single-Source Voice Matrix (`engine/voices.json` → `engine/voices.js`)

<!-- BEGIN GENERATED: voice-matrix -->
| Voice | Reg | Quirk | Medium | Feel | Type | Corners | Accent | Paper / Card |
| --- | :---: | --- | --- | --- | --- | --- | --- | --- |
| `textbook-pure` | R1 | `bland` | `paper-ink` | `smooth` | `editorial` | `sharp` | `#4664ad` | `#f5f5f3` / `#ffffff` |
| `ciechanowski-mechanism` | R2 | `atelier` | `ciechanow` | `smooth` | `clean` | `soft` | `#2d6f96` | `#f0f0ee` / `#f8f8f8` |
| `byrne-visual-proof` | R2 | `atelier` | `paper-ink` | `smooth` | `editorial` | `sharp` | `#d63a24` | `#ece5d5` / `#f4efe2` |
| `plotter-draft` | R2 | `atelier` | `paper-ink` | `instant` | `technical` | `sharp` | `#2c5697` | `#f2f2ef` / `#fbfbfa` |
| `moebius-printmaking` | R2 | `atelier` | `moebius` | `smooth` | `editorial` | `soft` | `#2f5f9e` | `#eeece5` / `#f6f4ee` |
| `redblob-reactive-prose` | R2 | `atelier` | `paper-ink` | `smooth` | `clean` | `soft` | `#288560` | `#f2f2ef` / `#fbfbfa` |
| `bugged-sketchbook` | R3 | `slightly-quirky` | `pencil-wash` | `spring` | `editorial` | `soft` | `#d95638` | `#f3eee2` / `#faf7ef` |
| `ncase-playable-toy` | R3 | `playful` | `risograph` | `spring` | `clean` | `round` | `#c83b32` | `#efe8d8` / `#f7f2e7` |
| `toybox-scale-joy` | R3 | `playful` | `risograph` | `spring` | `clean` | `round` | `#a86d0c` | `#f6efe0` / `#fffcf5` |
| `whacky-lab` | R4 | `wild` | `moebius` | `spring` | `technical` | `round` | `#7654a3` | `#f3ead8` / `#fffaf0` |
<!-- END GENERATED: voice-matrix -->
