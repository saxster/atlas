# 2D-to-3D Evaluation & Architectural Synthesis

**Repositories Evaluated:**
1. **`Sam1983Aing/casa-serra`** (`https://github.com/Sam1983Aing/casa-serra`) — Interactive 3D architectural scroll experience of a residential pavilion in Serra de Tramuntana, Mallorca.
2. **`sam1983aing.github.io/casa-serra/prompt/` & `Sam1983Aing/casa-larga`** — The generative prompt system and unminified reference implementation (`js/{plan.js,sheet.js,solid.js,materials.js,house.js,rig.js,main.js}`).
3. **`wy51ai/floorplan-3d`** (`https://wy51ai.github.io/floorplan-3d/`) — Single-file declarative 2D SVG CAD floorplan to interactive 3D apartment visualizer with zero external assets.

---

## 1. Steelman of the Vision for `@saxster/atlas`

In science, engineering, architecture, and mathematics, domain experts communicate precision through **2D technical drawings** (blueprints, cross-sections, schematics, optical bench plans, free-body diagrams), while learners build intuition from **3D physical models**. Historically, interactive figures forced a false choice:
- **2D SVG diagrams** carry exact dimension chains, wall/shell thicknesses, swing arcs, and cross-sectional cuts, but require the reader to mentally extrude flat lines into 3D space.
- **3D WebGL scenes** show spatial volume and lighting, but lose the crisp metric legibility of a technical sheet, or drift out of sync when a separate 2D overlay is maintained by hand.

**The Steelmanned Principle — *"The Drawing and the Model Are One"*:**
The 2D technical drawing should not be a separate picture; **it is the 3D model itself**, viewed from straight above through a long-focal-length ($2^\circ\text{--}3^\circ$) telephoto lens and sliced horizontally by a section clipping plane (`y = 1.20 m`), with watertight interior wall backfaces rendered as solid black architectural pochè (`!gl_FrontFacing`) and world-space dimension chains lying directly on the datum plane. Opening the lens while lowering the camera and raising the section plane extrudes the 2D drawing into a rich, physically shaded 3D model with zero camera cuts and zero coordinate drift.

---

## 2. Comparative Technical Deconstruction

| Capability | `casa-serra` & `casa-larga` (Sam Aing) | `floorplan-3d` (wy51ai) | Adaptation in `@saxster/atlas` (`engine/cad_kit.js`, `stage.js`, `render.js`, `parts.js`) |
|---|---|---|---|
| **Single-Camera 2D ↔ 3D Projection** | Single `PerspectiveCamera` starting at `fov: 2°–3°`, `pitch: -89.4°`, `y ≈ 1800 m`. Interpolates $\ln\tan(\text{fov}/2)$ and $\ln(\text{frameHeight})$ simultaneously via Fritsch–Carlson monotone cubic splines (`rig.js` `glide`). | Computes `planPose()` (`dist = visH / (2 tan(FOV/2))`) so 3D top-down matches 2D SVG pixel-for-pixel, then cross-fades and orbits along a `THREE.Spherical` arc while scaling `archUp.scale.y` (`0 → 1`). | Added pure `planArea()`, `planBounds()`, `planPose()`, `logFovLerp()`, and `glide()` in `engine/motion.js` (re-exported by `cad_kit.js` and `stage.js`), plus native `cam.fov` dolly-zoom and dynamic depth-plane scaling in `engine/render.js`. |
| **Watertight CSG Solids & True Edges** | `RectSolid` (`solid.js`): non-uniform grid occupancy (`Uint8Array`) from `.add()` / `.sub()` boxes. Emits only exterior boundary faces (metric UVs) and walks grid lines to merge collinear non-coplanar corner edges. | Extrudes 2D wall rects `[x0, y0, x1, y1]` and carves window/door spans by splitting wall segments into sill (`0..sillY`) and lintel (`lintelY..H`) boxes. | Adopted `RectSolid` and synthesized `extrudePlan()` in `engine/cad_kit.js`: declarative `rooms`, `walls`, `windows` (auto sill/lintel/mullions/pane), `doors` (hinged 3D leaf + 2D swing arc), and `slides` (fixed + sliding glass sash + 2D slide arrow). |
| **Section Cut & Architectural Pochè** | Shared `CUT = new THREE.Plane(Vector3(0,-1,0), cutY)` with `DoubleSide` materials; fragment shader paints `!gl_FrontFacing` solid ink (`uInkCol`). | Uses vertical `scale.y` growth (`grow`, `furnGrow`) instead of a clipping plane. | Enhanced `shadeMat()` (`engine/parts.js`), `setCutaway()` (`engine/render.js`), and `look.cutY` (`engine/stage.js`) with `uHasPoche` / `uPoche`, flipped backface normals in `normalMat`, and `LineSegments` clipping while preserving translucent window glass. |
| **World-Space 2D Sheet Annotations** | `buildSheet()` (`sheet.js`): 3D line segments at `y = 0.004 m` for dimension strings (`dimString` with 45° ticks + witness lines), door swing arcs, slide arrows, floor grids, and canvas title block. | 2D `<svg>` floorplan with room polygons, furniture symbols (`furnSVG`), and compass rose synced to 3D via `wx(x), wz(y)`. | Implemented `swingArc()`, `slideArrow()`, `dimChain()`, and `buildSheet()` in `engine/cad_kit.js`, laying dimension ticks, witness lines, door arcs, slide arrows, grids, and borders at `y = 0.004 m` with world-anchored Atlas labels. |
| **Parametric 3D Detailing Grammar** | `FX.uvMetres` (dominant-normal metric UVs), `FX.bevelBox` (rounded edge normals), `drape` (sinusoidal corner-pleated cloth), Frenet-frame noisy branch tubes (`branchTree`), `FX.Batch` (`batchGeos` with `aCenter`). | Compact DSL (`box`, `rbox`, `cyl`, `lathe`, `rod`, `tube`, `shell` hole extrusions, `fronts` cabinet door/drawer grids with shadow-gap reveals and bar/knob/edge pulls). | Built `uvMetres()`, `bevelBox()`, `shell()`, `lathe()`, `drape()`, `fronts()`, `contactShadow()`, `batchGeos()`, and `branchTree()` in `engine/cad_kit.js`. |
| **Procedural PBR & Ink-to-PBR Sweep** | `inkAware()` (`materials.js`) & `drawable()` (`fx-paint.js`): `onBeforeCompile` blends flat paper wash + procedural hatching (`HATCH`) into PBR with analytical `roomAO`, macro-noise de-tiling (`tweakMat`), and `fwidth` sweep ring. | Procedural 2D canvas textures (`floorMat`: wood planks, marble veins, terrazzo chips, ceramic tiles) + `RoomEnvironment` PMREM reflections. | Implemented `procTex()` (`'wood'`, `'marble'`, `'tile'`, `'terrazzo'`, `'brushed'`, `'linen'`, `'painting'` via deterministic `DataTexture`), `tweakMat()`, `createRevealController()`, and `inkAware()` in `engine/cad_kit.js`. |

---

## 3. Key Mathematical & Shader Formulations Adapted

### 3.1 Logarithmic FOV + Frame Dolly-Zoom (`logFovLerp`)
Linearly interpolating `fov` and `dist` between an overhead blueprint ($\text{fov}_A = 3^\circ, \text{dist}_A \approx 180\text{ m}$) and an interior perspective view ($\text{fov}_B = 22^\circ, \text{dist}_B \approx 14\text{ m}$) causes severe mid-transition zoom distortion because apparent size scales with $\text{dist} \cdot \tan(\text{fov}/2)$. Interpolating in log-space keeps framing linear in perceptual screen size:
$$\tan\!\left(\frac{\text{fov}(u)}{2}\right) = \exp\!\Bigl((1-u)\ln\tan\frac{\text{fov}_A}{2} + u\ln\tan\frac{\text{fov}_B}{2}\Bigr)$$
$$F(u) = \exp\!\Bigl((1-u)\ln F_A + u\ln F_B\Bigr), \qquad \text{dist}(u) = \frac{F(u)}{2\tan(\text{fov}(u)/2)}$$

### 3.2 Watertight Grid Occupancy & Collinear Edge Merging (`RectSolid`)
For $N$ axis-aligned box operations (`add` = $1$, `sub` = $0$), let $X = \text{uniq}(x_0, x_1)$, $Y = \text{uniq}(y_0, y_1)$, $Z = \text{uniq}(z_0, z_1)$ be the sorted coordinate partitions.
- **Interior Face Elimination**: A face between cell $(i,j,k)$ and $(i+1,j,k)$ is emitted if and only if $\text{occ}(i,j,k) = 1$ and $\text{occ}(i+1,j,k) = 0$.
- **True Corner Detection**: Around each unit grid edge segment sit 4 cells with occupancy sum $S = f_{00} + f_{10} + f_{01} + f_{11}$. The segment is a true geometric crease if and only if $S \in \{1, 3\}$ or ($S = 2$ and $f_{00} = f_{11}$). Adjacent coplanar boxes ($S = 2, f_{00} \neq f_{11}$) produce zero seam lines.

### 3.3 Analytical Room Cavity Ambient Occlusion (`roomAO`)
Screen-space ambient occlusion (SSAO/GTAO) requires extra full-screen passes and flickers on thin blueprint lines. For rectilinear rooms/enclosures with bounds $[x_0, x_1] \times [0, y_{\text{top}}] \times [z_0, z_1]$, analytical exponential wall proximity darkens corners and floor/wall junctions inside the PBR fragment shader at near-zero cost:
$$\text{occ}(\mathbf{p}, \mathbf{n}) = \sum_{k \in \{x,y,z\}} (1 - |n_k|)\!\left(e^{-\max(p_k - b_{k,\min} - \delta,\, 0)/R} + e^{-\max(b_{k,\max} - \delta - p_k,\, 0)/R}\right)$$
$$\text{roomAO}(\mathbf{p}, \mathbf{n}) = \text{clamp}(1 - u_{\text{AO}} \cdot \text{occ}(\mathbf{p}, \mathbf{n}),\; 0.3,\; 1.0)$$

---

## 4. Universal Educational 2D-to-3D Archetypes Across STEM & Economics

Every 2D textbook diagram across science, mathematics, engineering, and economics maps cleanly onto one of **5 geometric 2D-to-3D compilation archetypes** in `@saxster/atlas/cad_kit.js`:

| Archetype | 2D Textbook Drawing ($y = 0.004$) | 3D Extruded / Revolved Solid | Compiler (`engine/cad_kit.js`) | Flagship Figure |
|---|---|---|---|---|
| **1. Plan & Enclosure Extrusion** | 2D architectural floorplan with dimension chains, door swing arcs, and window breaks | Watertight `RectSolid` walls, floor slabs, glazing, hinged doors, and horizontal section pochè (`look.cutY`) | `extrudePlan(parent, spec, opts)` | `examples/minimal/blueprint` (*From 2D blueprint to 3D solar room*) |
| **2. Axisymmetric Cross-Section Revolution** | 2D meridian profile $(x, r(x))$ with principal rays, focal points, and dimension chains | $270^\circ$ cutaway 3D solid of revolution with watertight meridian end-caps (`setSweep(u)`) + 3D ray cone | `revolveSection(parent, spec, opts)` | `examples/physics/optics-bench` (*From 2D ray diagram to 3D optical bench*) |
| **3. Base Region + Cross-Sectional Slice Rule** | 2D base curve $[x_0, x_1], [z_{\text{lo}}(x), z_{\text{hi}}(x)]$ with chord $s(x)$ | $N$ 3D Cavalieri cross-sectional slabs (`semicircle`, `square`, `triangle`, `rect`) rising via `setLift(u)` | `extrudeCrossSections(parent, spec, opts)` | `examples/maths/cross-sections` (*From 2D base circle to 3D cross-section dome*) |
| **4. Stratified / Histological / Lattice Layer Extrusion** | 2D histological slide or $(001)$ fractional elevation plan ($z = 0, \tfrac{1}{2}$) | Multi-layer 3D tissue block with stomatal pores & vascular bundle (`setDepth(u)`) or 3D FCC crystal lattice | `extrudeLayers(parent, spec, opts)` & `buildCrystalLattice` | `examples/biology/leaf-section` & `examples/chemistry/crystal-projection` |
| **5. Contour / Level-Set + Constraint Wall Extrusion** | 2D isoquant / level curves $f(x,z) = Q_k$, gradient vectors, and budget/isocost line | Watertight 3D surface solid $y = f(x,z)$ + vertical 3D constraint wall intersecting along the 3D ridge curve (`setElevation(u)`) | `extrudeContours(parent, spec, opts)` | `examples/economics/isoquant` (*From 2D isoquant map to 3D production mountain*) |
