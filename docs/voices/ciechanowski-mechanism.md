# Voice: `ciechanowski-mechanism` (Register 2 — Creative Atelier)

**Lineage:** Bartosz Ciechanowski (`ciechanow.ski` — *Mechanical Watch*, *Gears*, *Internal Combustion Engine*, *Bicycle*, *Cameras and Lenses*).
**Use when:** Explaining a physical mechanism, linkage, gear train, escapement, pump, optical bench, or instrument by stripping complex hardware down to one isolated degree of freedom per figure.

## Medium, Lighting & Role Palette
- Set `medium: 'ciechanow'`. The stage shifts to frameless `#f8f8f8`, widens `shadeMat` to a camera-locked `[0.75, 1.0]` view-headlight so underside gear teeth never fall into black shadow, and softens silhouettes (`0.38`).
- Assign kinematic role palettes on `part()` and `gear()`:
  - `pal: 'driver'` — warm gold input crank / driving pinion (`#fcd561`)
  - `pal: 'driven'` — sage green output wheel / follower (`#78ad6c`)
  - `pal: 'idler'` — sky blue carrier / reversing idler (`#5eaad4`)
  - `pal: 'compound'` — coral crimson secondary stage (`#d45e5e`)
  - `pal: 'housing'` — quiet grey frame (`xray: true` or `cuts: ['solid', 'xray', 'section']`)
- Always pass `notch: true` on `gear()` so every wheel carries a radial keyway/timing mark that makes angular velocity ratios visible at a glance.

## Interaction & Pacing Rules
- **1 primary scrubber per figure:** bind one continuous phase/angle slider (or 1D `draggable(..., { axis })` handle) directly to `kinematics.js` (`gearRatio`, `sliderCrank`, `fourBar`, `rackPinion`, `differential`).
- **Machined section cuts:** when `cuts` includes `'section'`, `ciechanow` automatically renders ±45° diagonal machined hatching across clipped `cutPlane` faces (`uPocheMode = 1`).
- **Flush part seams:** give coplanar mating halves (e.g. split rings, valve seats, clutch plates) distinct `idOff: -0.05` / `+0.05` inside an assembly so their mating seam draws a crisp hairline.

## Checkable Criteria
1. Every rotating gear or rotor includes `notch: true` or an explicit timing mark.
2. `checks.mjs` verifies exact velocity/angle ratios (`deriv`) and link lengths (`checkLinkLengths`) across full rotation.
3. Every housing/casing part supports `xray` or `section` inspection without hiding the active mesh contact point.
