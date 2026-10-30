# Atlas

A JavaScript library for teaching figures in any subject. You write a model of the idea and say what to draw. Atlas
draws it in 3D, in paper and ink, and gives the reader a way to work it: turning pages, pressing steps, or running an
experiment with sliders.

Live examples: https://saxster.github.io/atlas/

```
npm install github:saxster/atlas three
npx atlas new biology/heart --grammar machine
```

`atlas new` writes a working figure to start from: a model, its checks, the scene, and a page.

## How a figure is made

1. **Model.** `model.js` holds the idea as plain functions, with no drawing in it. Every number the reader sees comes
   from here.
2. **Checks.** `checks.mjs` proves the model a second, independent way: a derivative against the closed form, an
   rk4 integration against the formula, a seeded run against its expected spread. Run it with `node`.
3. **Scene.** `world.js` draws the model's state from building blocks: `axes`, `plot`, `surface`, `curve`,
   `vector`, `particles`, `molecule`.
4. **Grammar.** Choose how the reader works it:
   - **Book.** Scrolling turns pages and moves the camera; clicking a part breaks it down.
   - **Machine.** Numbered steps, one live at a time, Manual or Auto.
   - **Explorer.** The reader predicts first, then drags sliders and runs it.

The three minimal examples in `examples/minimal/` are each about 50 to 70 lines of scene and figure code. Every
example figure also works under `?render`, where `window.seek(t)` draws any moment the same way every time. That is
what the stills, tests and videos use.

## What's in the repo

| Path | What |
|---|---|
| `engine/` | the library: stage, three grammars, building blocks, charts, model checks, seeded randomness |
| `adapters/` | `kym-live.js` (mount a figure in a Kym textbook), `molecule.js` (3Dmol, loaded on demand) |
| `bin/atlas.mjs` | `atlas new` |
| `examples/` | about 20 figures in physics, maths, chemistry, statistics and economics, plus a concept index |
| `tools/` | checks, browser tests, stills, jump and label critics, video recording, vendoring into textbooks |
| `docs/API.md` | the reference |

## Working on the library

```
npm install
npm run check                       # every model's checks, links, generated pages
python3 -m http.server 8137 &       # any static server
npm run test:browser                # the grammars driven in Chrome
```

`CLAUDE.md` has the rules and every tool.

## Licences

The code is MIT (`LICENSE`). It started from [Atlas of Physics](https://github.com/nathanliow/atlas-of-physics) by
Nathan Liow (MIT), whose chapters are in `examples/physics/`. 3Dmol.js (BSD-3-Clause) loads from jsDelivr only when a
reader asks for a measured molecule. AP® is a trademark of the College Board, which does not endorse this site.
