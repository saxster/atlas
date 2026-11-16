# Voice: `moebius-printmaking` (Register 2 — Creative Atelier)

**Lineage:** Jean Giraud (Moebius) ligne-claire scientific plates & Maxime Heckel (`blog.maximeheckel.com` Moebius / Risograph post-processing shaders).
**Use when:** Creating editorial science essays, botanical/anatomical/geological cross-sections, celestial mechanics, or poster-grade figures with unmistakable hand-inked or screen-printed character.

## Medium Selection
- **`medium: 'moebius'`** — Cool daylight bone paper (`#f6f4ee`), hard-edged specular ink islands (`smoothstep(0.90, 0.925)` in `normalMat`), and 3-tier screen-space cross-hatching (+45° diagonal, −45° diagonal, and horizontal ink strokes) gated strictly inside shadow bands so lit faces stay clean.
- **`medium: 'risograph'`** — Warm cream stock (`#f7f2e7`), rotated CMYK-angle cell-center halftone dots (`0.56 * sqrt(cov)` sampled at quantized cell centers so dots never warp across curved surfaces), and tactile paper tooth.
- Optionally expose `mediums: ['moebius', 'risograph', 'paper-ink']` so readers can compare print editions live.

## Geometry & Surface Rules
- **Clean large-radius curvature:** Moebius hatching and Risograph halftone dots read best on broad, well-bevelled silhouettes (`revolveSection`, `extrudeLayers`, `extrudeContours`, `shell`, `blob`) rather than dense high-frequency wireframes.
- **Calm PBR discipline:** if combining procedural surface maps (`procTex('striation' | 'fluted')`), run `auditDeliverable(root, { calmPBR: true })` so `roughness >= 0.38`, spurious dielectric metalness is clamped, and shadow bands remain graphic rather than mirror-chrome.

## Checkable Criteria
1. Lit primary surfaces remain un-hatched in `moebius` / cleanly halftoned in `risograph` with `>= 4.5:1` label legibility.
2. `?render` stills pass `npx atlas critic` with deterministic frame-to-frame stability (zero temporal shimmer).
