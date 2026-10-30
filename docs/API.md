# Atlas API

Atlas draws teaching figures: a pure model, a 3D scene in paper and ink, and one of three ways for a reader to work
it. This page is the reference. For a first figure, run `npx atlas new <subject>/<id>` and edit what it writes.

## Install

```
npm install github:saxster/atlas three
```

Import everything from `@saxster/atlas`, or one module at a time from `@saxster/atlas/<module>.js`. The examples
import one module at a time. In a plain web page, an importmap resolves the package name:

```html
<script type="importmap">
{ "imports": {
  "@saxster/atlas/adapters/": "./node_modules/@saxster/atlas/adapters/",
  "@saxster/atlas/": "./node_modules/@saxster/atlas/engine/",
  "three": "https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js",
  "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/"
} }
</script>
```

Bundlers resolve it from `package.json` exports with no importmap. `three` is a peer dependency (0.180 or later).

## The files of a figure

| File | Holds | Rule |
|---|---|---|
| `model.js` | the subject: `state(params, t, seed)` and every number | no DOM, no three.js |
| `checks.mjs` | proofs of the model, run with `node` | prove each fact a second, independent way |
| `world.js` | `buildWorld(E)` → `{ update(state, look), labels }` | draws the state; computes nothing new |
| `figure.js` or `chapter.js` | the grammar's description: steps, sliders or pages | words and cameras |
| `main.js`, `index.html` | starts the grammar on the page | copy them from an example |

Every number a reader sees (a label, a chip, a practice answer) reads from the model. That's what keeps two numbers
on one screen from disagreeing.

## The world

`buildWorld(E)` builds the scene once and returns `{ update(state, look), labels }`.

- `E.scene` is the three.js scene. `E.asm(key, parent, { title, sub })` makes a group that lights on hover and
  opens a breakdown on click, under the name `key`.
- `update(state, look)` poses the scene for a model state. `look` holds 0 to 1 weights for the `lookKeys` a page
  or step turns on, eased by the engine.
- `labels` is a list of `{ cls, html, at }`. `at()` returns a `THREE.Vector3`, or `null` to hide the label. The
  label classes are in `engine/labels.css` (`board`, `tick`, `axis`, `mark`, `vec`, `sound`).

## Building blocks (`prims.js`)

Each building block is `prim(parent, spec) → { object, labels, … }`. `object` is added to `parent`. `labels` goes
straight into the world's labels: `labels: [...ax.labels, ...v.labels]`. Blocks that take `axes` work in data
coordinates.

| Block | Draws | Returns, besides `object` and `labels` |
|---|---|---|
| `axes(parent, { x, y, z?, size?, at?, ticks?, names?, grid? })` | axes with ticks and names; with a `z` range, z is up | `to(x, y, z)`: a data point as a world point |
| `plot(parent, f, { axes, x?, samples?, color? })` | y = f(x) | `update(f)` |
| `surface(parent, f, { axes, x?, y?, n?, pal? })` | z = f(x, y), shaded paper | `update(f)` |
| `curve(parent, r, { t, samples?, radius?, axes?, color? })` | a tube along r(t) → [x, y, z] | `update(r)` |
| `vector(parent, from, to, { color?, label?, axes?, side?, gap? })` | a solid arrow; `side` and `gap` place its label | `set(from, to, side?)` |
| `particles(parent, count, { radius?, color?, axes? })` | one instanced set of balls | `set(i, [x, y, z])`, `show(n)` |
| `molecule(parent, xyz, { scale?, names? })` | atoms and bonds from XYZ text (ångström); bonds from covalent radii | `atoms`, `bonds` (and `parseXYZ(text)`) |

`update` and `set` rewrite geometry in place, so they can run every frame. Colours are `'hi'` (ink), `'grey'`,
any `PALETTE` name, `'ochre'`, `'green'` or `'#hex'`. The full contract is the comment at the top of `engine/prims.js`;
`examples/minimal/` uses every block.

Below them sit the paper-and-ink pieces in `parts.js` (`part`, `box`, `cyl`, `lines`, `arrow`, `liveTube`,
`shadeMat`, `PALETTE`) for shapes the blocks don't cover.

## Three grammars

Each takes one description object and owns the page around the figure. The full field list is in the comment at the
top of each file.

**Book** (`startBook(chapter)`, `book.js`). The reader scrolls; each page has a camera, a lit part and text, and a
click breaks a part down. `chapter` is `{ no, subject, PAGES, PLATES, buildWorld, lookKeys, state, readout }`. A page
is `{ kicker, title, sub, body, cam, lit, look, fig, alt, parts?, molecule? }`. Practice questions come from
`practice.js`.

**Machine** (`startMachine(figure)`, `machine.js`). Numbered steps, only the next one live. Manual by default, Auto
on request, and the choice is remembered. A step is `{ label, hint, run, play, real?, cam, look?, lit? }`: `run`
model seconds shown in `play` seconds on screen, with a speed badge. `chips` fill in from the step that earns them.

**Explorer** (`startExplorer(figure)`, `explorer.js`). Predict first, then sliders and a seeded run. `predict` is
`{ q, choices, answer(params), why(params) }`: the model works out the answer, which shows after the run. A control
is `{ key, label, min, max, step, fmt?, rebuild? }`.

All three draw through `createStage` (`stage.js`).

## Just the figure, in any page

`mountFigure(el, CHAPTER, { page = 0, height = 400, playing = true, theme })` (`mount.js`) puts one page's 3D figure
in any element, with its own frame loop: hover, click to take a part apart, drag to turn. It stops drawing while
scrolled out of view and stands still for readers who ask for reduced motion. It returns
`{ stage, play(on), destroy() }`. `CHAPTER` is anything with `PAGES`, `buildWorld`, `state` and `lookKeys`, such as a
book's `chapter.js`.

```js
import { mountFigure } from '@saxster/atlas';
import { CHAPTER } from './biology/cell/chapter.js';
mountFigure(document.querySelector('#cell'), CHAPTER, { page: 2, height: 420 });
```

## Modes, on any figure's URL

- `?render`: the page draws no frames of its own. `window.seek(t)` draws the moment t, the same every time, and
  `window.DURATION` is the length of the tour. Stills, tests and video use this.
- `?embed&page=i` (books): only the figure, held on page i.
- `?calm`: still until the reader asks.

## Checking a model (`checks.js`)

`const C = checks()` gives `C.check(label, ok, info)` rows; `C.report()` prints them and exits 1 on any failure. Helpers: `near`, `deriv`, `integ`
(Simpson), `bisect`, `rk4`, `mean`, `variance`, `meanWithin`, `chiSquare` with its exact CDF and critical value,
`normalQuantile`, `binomial`. `rng(seed)` (`rng.js`) is seeded randomness, so a stochastic model checks exactly.

## In a textbook

`mountAtlas(stage, params, api, chapter, { page, height, readout })` (`adapters/kym-live.js`) mounts a book page as a
Kym textbook `:::live` widget. It follows the book's light, sepia or dark theme and stays still until asked. In the
atlas repo, `node tools/vendor.mjs <book>/source/live/atlas <subject/chapter>` copies the figure and the engine files
it needs into the book.

## The `atlas` command

Run from the repo that holds the figures; a figure is its folder, relative to here.

| Command | Does |
|---|---|
| `npx atlas new <subject>/<id> --grammar book\|machine\|explorer` | copies a working minimal example to start from |
| `npx atlas check [dir]` | runs every `checks.mjs` under the folder |
| `npx atlas stills <out> <figure…>` | a still of every page or step, at 1440×900 and 390×844 |
| `npx atlas critic <figure…>` | frames that change far more than their neighbours, and labels that overlap or hide |
| `npx atlas record <figure> [--size 1920x1080] [--fps 60] [--silent]` | an MP4 drawn frame by frame, with a soundtrack at −14 LUFS (needs ffmpeg) |

The browser commands need Chrome; set `CHROME` if it isn't at the usual place.

## Tools in this repo

`npm run check` runs every model's checks and the link checks. `npm run test:browser` drives the grammars in Chrome.
`tools/stills.mjs`, `tools/jumps.mjs` and `tools/labels.mjs` are the visual critics. `tools/record.mjs` makes a
1080p60 MP4 with a soundtrack. `CLAUDE.md` describes each.
