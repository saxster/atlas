# Atlas

One figure engine and the subject atlases built on it. Each idea is one working figure: a pure model you can
check, drawn in 3D like a textbook diagram (paper solids, ink edges, one lit thing). The same figures embed in the
Kym story-first textbooks, record as videos, and are listed in a cross-subject concept index.

Seeded from [Atlas of Physics](https://github.com/nathanliow/atlas-of-physics) by Nathan Liow (MIT), whose fifteen
AP Physics chapters live on in `physics/`.

## What is here

| Subject | Figures | Grammar |
|---|---|---|
| `physics/` | 15 chapters, AP Physics 1 and C | book |
| `maths/` | the unit circle: sine and cosine as shadows | book |
| `chemistry/` | the shapes of molecules (VSEPR), with the measured molecules in 3Dmol | book |
| `statistics/` | the Galton board: 500 balls make a bell | explorer |
| `economics/` | ₹1,000 a month at 8 %: compound interest | machine |
| `concepts/` | 28 ideas in 5 threads that cross subjects (exponentials, circles and waves, the bell curve …) | index |

Three ways for a reader to work a figure:

- **Book** (`engine/book.js`). The reader scrolls to turn the page and the camera moves. Hovering lights a part;
  clicking it breaks it down. Each page carries practice questions.
- **Machine** (`engine/machine.js`). Numbered steps, and only the next one can be pressed. Manual or Auto, and
  the choice is remembered. A speed badge shows how fast the figure runs against real time, and readouts fill in
  as each step earns them.
- **Explorer** (`engine/explorer.js`). The reader predicts first, then runs the experiment with sliders and a
  seeded run. The model works out the answer and shows it after the run.

All three share `engine/stage.js`: the world, the camera, hover and click, labels, and a deterministic clock. Under
`?render`, `window.seek(t)` draws any moment, the same every time. Stills, tests, videos and reduced motion all
come from that.

## Run it

```
python3 -m http.server 8137        # any static server; three.js loads from jsDelivr
open http://localhost:8137/
```

Keys: ← → turn pages, Esc puts a part back. Deep links: `physics/newton/#4`.

## Check it

```
npm install                        # puppeteer-core; the browser tools need Chrome (CHROME=… if not the macOS default)
npm run check                      # every model's checks, the link checks, generated pages current
npm run test:browser               # with the server above: every page, controls, machine, explorer, textbook adapter
node tools/stills.mjs shots        # a still of every page at desktop and phone sizes
node tools/jumps.mjs               # frames that change far more than their neighbours
node tools/labels.mjs              # labels that overlap, or hide behind a solid
node tools/record.mjs maths/unit-circle   # a 1080p60 MP4 with a soundtrack at −14 LUFS (needs ffmpeg)
```

`CLAUDE.md` has the rules for adding a subject, chapter or figure, and every tool.

## In the textbooks

`tools/vendor.mjs <book>/source/live/atlas <subject/chapter>` copies a figure and the engine files it needs into a
book. The book's `:::live` widget mounts it through `adapters/kym-live.js`, in the book's light, sepia or dark
theme, offline.

## Licences

Code is MIT (`LICENSE`; Atlas of Physics © 2026 Nathan Liow). 3Dmol.js (BSD-3-Clause) loads from jsDelivr only
when a reader asks for a measured molecule. Molecular geometries are NIST CCCBDB experimental values.
AP® is a trademark of the College Board, which does not endorse this site. The physics equation sheets follow the
published AP Physics equation tables.
