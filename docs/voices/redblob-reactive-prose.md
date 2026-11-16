# Voice: `redblob-reactive-prose` (Register 2 — Creative Atelier)

**Lineage:** Amit Patel (`redblobgames.com`) & Bret Victor (*Explorable Explanations* / `Tangle`).
**Use when:** Building mathematical, algorithmic, physical, or systems explanations where equations, prose numbers, 2D plots, and 3D spatial vectors should behave as one coupled live instrument.

## 4-Surface Semantic Hue Lock
Assign at most 3–4 semantic hues per figure and lock each variable to the **exact same hue** across all four surfaces:
1. **Inline scrubbers & outputs (`@saxster/atlas/prose.js`):** `scrub('omega', { value: 2, min: 0.5, max: 6, step: 0.1, unit: ' rad/s', color: 'blue', part: 'rotor' })` (`5px = 1 step` drift-free horizontal drag + keyboard spinbutton) and `val('torque', { color: 'red', part: 'coil' })`.
2. **Bidirectional prose terms:** `term('coil', 'armature winding', { color: 'red' })` — hovering prose lights the 3D assembly and vice versa.
3. **Zero-thrash live 2D chart (`@saxster/atlas/chart.js`):** return `{ key, svg, update(el, state, params) }` from `chart(params)` with `cursors`, `tangents` (`moveTangent`), and `livePaths` (`setLivePath`) so scrubbing updates SVG attributes at 60fps without rebuilding DOM.
4. **3D vectors & curves (`@saxster/atlas/prims.js`):** `vector` / `setArrow` (with MathBox cubic micro-vector ease when magnitudes pass through zero) and `plot` in the matching `PALETTE` hue.

## Pacing Rules
- **Show concrete instance + whole curve together:** whenever the 3D stage shows the system at one parameter `x`, show the full curve `f(x)` in the side chart with a live cursor + tangent line at `x` so the reader sees both the local state and global landscape simultaneously.
- **Format every prose `val()` via `proseFormat` (or `formatters`):** never compute math inside DOM templates; read `state` from `model.js`.

## Checkable Criteria
1. Every `scrub(key)` matches a declared control/param `key`, and every `val(key)` has a formatter reading `model.js` state.
2. Scrubbing any inline number updates prose outputs, 2D chart cursor/curve, and 3D stage in lockstep with zero DOM rebuild flicker.
