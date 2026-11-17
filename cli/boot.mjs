// cli/boot.mjs — Programmatic boot-package assembler and strict router for @saxster/atlas.
// Assembles a single boot package containing the grammar or kit contract, verified @saxster/atlas
// imports/exports, invariants, and live minimal working skeleton files from examples/minimal/<grammar>.
// Auto-routing is deliberately strict: only an exact slug or a complete trigger phrase adopts a target;
// ambiguous or partial overlaps abstain and return an IDF-scored candidate table.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const STOPWORDS = new Set([
  'a', 'about', 'an', 'and', 'are', 'as', 'at', 'be', 'been', 'but', 'by',
  'can', 'could', 'create', 'did', 'do', 'does', 'for', 'from', 'how', 'i',
  'in', 'is', 'it', 'let', 'make', 'me', 'my', 'need', 'of', 'on', 'or',
  'our', 'please', 'should', 'that', 'the', 'these', 'this', 'those', 'to',
  'want', 'was', 'we', 'what', 'when', 'who', 'will', 'with', 'would', 'you', 'your',
]);

const SUGGEST_FLOOR = 0.10;
const SUGGEST_MAX = 4;

export const TARGETS = [
  {
    slug: 'book',
    kind: 'grammar',
    summary: 'Scroll-driven multi-page chapter where turning pages moves the 3D camera, lights assemblies, and opens part breakdowns and practice checks.',
    triggers: ['scroll book', 'book chapter', 'multi page chapter', 'part breakdown', 'practice questions', 'textbook chapter'],
    modules: {
      '@saxster/atlas/book.js': ['startBook'],
      '@saxster/atlas/prims.js': ['axes', 'plot', 'area', 'surface', 'curve', 'vector', 'field', 'streamline', 'lattice', 'blob', 'particles', 'molecule', 'linkage'],
      '@saxster/atlas/stage.js': ['draggable'],
      '@saxster/atlas/checks.js': ['checks', 'near', 'deriv', 'integ', 'bisect', 'rk4'],
      '@saxster/atlas/adapters/specimen.js': ['showSpecimen', 'auditDeliverable'],
    },
    templateDir: 'examples/minimal/book',
    templateFiles: ['model.js', 'checks.mjs', 'world.js', 'pages.js', 'practice.js', 'chapter.js', 'main.js'],
    invariants: [
      'Every number in pages.js, readout, and practice.js comes from model.js (zero DOM, zero three.js).',
      'checks.mjs proves model.js a second, independent way before anything is drawn.',
      'chapter.js exports CHAPTER so mountFigure() or adapters/kym-live.js can embed the figure standalone.',
    ],
  },
  {
    slug: 'machine',
    kind: 'grammar',
    summary: 'Stepped process diagram with numbered steps (Manual or Auto), speed badge, progressive readout chips, and camera moves.',
    triggers: ['stepped machine', 'numbered steps', 'step by step process', 'manual or auto', 'process diagram'],
    modules: {
      '@saxster/atlas/machine.js': ['startMachine', 'speedLabel'],
      '@saxster/atlas/prims.js': ['axes', 'plot', 'area', 'vector', 'curve', 'particles', 'linkage'],
      '@saxster/atlas/parts.js': ['part', 'box', 'cyl', 'rod', 'gear', 'rack', 'spring', 'arrow'],
      '@saxster/atlas/motion.js': ['phase', 'win', 'ease', 'spring', 'stagger', 'dwell'],
      '@saxster/atlas/checks.js': ['checks', 'near', 'deriv', 'integ', 'rk4'],
    },
    templateDir: 'examples/minimal/machine',
    templateFiles: ['model.js', 'checks.mjs', 'world.js', 'figure.js', 'main.js'],
    invariants: [
      'Each step defines { label, hint, run, play, cam, look, lit }; model time advances purely as a function of step clock.',
      'Every chip value in figure.js is formatted from model.js state(t).',
      '?render mode seeks deterministically across all steps via window.seek(t).',
    ],
  },
  {
    slug: 'explorer',
    kind: 'grammar',
    summary: 'Predict-first interactive experiment: the reader answers a prediction question, drags parameter sliders, and runs a seeded simulation.',
    triggers: ['what if sliders', 'predict first', 'interactive experiment', 'seeded simulation', 'slider experiment', 'parameter explorer'],
    modules: {
      '@saxster/atlas/explorer.js': ['startExplorer'],
      '@saxster/atlas/rng.js': ['rng'],
      '@saxster/atlas/chart.js': ['chart', 'scale', 'samples', 'moveCursor'],
      '@saxster/atlas/prims.js': ['axes', 'plot', 'area', 'particles', 'vector'],
      '@saxster/atlas/checks.js': ['checks', 'near', 'mean', 'variance', 'meanWithin', 'chiSquare', 'chiSquareCritical', 'normalQuantile', 'binomial'],
    },
    templateDir: 'examples/minimal/explorer',
    templateFiles: ['model.js', 'checks.mjs', 'world.js', 'figure.js', 'main.js'],
    invariants: [
      'predict.answer(params) and predict.why(params) are computed from model.js so prediction grading matches the simulation.',
      'Stochastic models use rng(seed) from @saxster/atlas/rng.js so runs and checks.mjs are 100% reproducible.',
    ],
  },
  {
    slug: 'sandbox',
    kind: 'grammar',
    summary: 'Constructive 3D play: presets, a 2x2 matrix or parameter controls, and a palette to place, remove, and drag 3D items directly on stage.',
    triggers: ['constructive play', 'draggable 3d pieces', 'matrix editor', 'place and drag', 'sandbox figure'],
    modules: {
      '@saxster/atlas/sandbox.js': ['startSandbox'],
      '@saxster/atlas/stage.js': ['draggable'],
      '@saxster/atlas/prims.js': ['axes', 'lattice', 'vector', 'area', 'plot'],
      '@saxster/atlas/parts.js': ['part', 'box', 'cyl', 'rod', 'arrow'],
      '@saxster/atlas/checks.js': ['checks', 'near'],
    },
    templateDir: 'examples/minimal/sandbox',
    templateFiles: ['model.js', 'checks.mjs', 'world.js', 'figure.js', 'main.js'],
    invariants: [
      'Dragging 3D items or editing matrix/preset controls updates state through model.js and redraws in place.',
      'Supports optional cuts: ["solid", "xray", "section"] for cutaway inspection.',
    ],
  },
  {
    slug: 'teardown',
    kind: 'grammar',
    summary: 'Mechanical teardown figure with Solid/X-ray/Section cutaway pills, spring-exploded assemblies (ex), and kinematic linkages or gears.',
    triggers: ['mechanical teardown', 'exploded view', 'xray cutaway', 'section cutaway', 'four stroke', 'gear train'],
    modules: {
      '@saxster/atlas/machine.js': ['startMachine'],
      '@saxster/atlas/kinematics.js': ['sliderCrank', 'fourBar', 'circleIntersect', 'gearRatio', 'rackPinion', 'differential', 'createSolver', 'twoLinkIK', 'fabrik', 'jacobianIK'],
      '@saxster/atlas/parts.js': ['part', 'box', 'cyl', 'rod', 'gearGeo', 'gear', 'rackGeo', 'rack', 'spring', 'applyClipPlanes'],
      '@saxster/atlas/prims.js': ['linkage', 'vector'],
      '@saxster/atlas/checks.js': ['checks', 'near', 'deriv', 'checkLinkLengths', 'checkTrajectory'],
    },
    templateDir: 'examples/minimal/teardown',
    templateFiles: ['model.js', 'checks.mjs', 'world.js', 'figure.js', 'main.js'],
    invariants: [
      'Use cuts: ["solid", "xray", "section"] with xrayKeys, cutKeys, and cutPlane on the figure spec.',
      'Verify rigid linkage invariants in checks.mjs with checkLinkLengths() / checkTrajectory() and analytical derivatives with deriv().',
    ],
  },
  {
    slug: 'blueprint',
    kind: 'grammar',
    summary: 'Unified 2D architectural/STEM blueprint that extrudes continuously into a watertight 3D model with solid ink pochè section cuts and telephoto log-FOV dolly-zooms.',
    triggers: ['2d to 3d', 'floorplan', 'architectural blueprint', 'section cut', 'poche', 'extrude plan', 'blueprint grammar'],
    modules: {
      '@saxster/atlas/machine.js': ['startMachine'],
      '@saxster/atlas/cad_kit.js': ['RectSolid', 'extrudePlan', 'buildSheet', 'dimChain', 'swingArc', 'slideArrow', 'revolveSection', 'extrudeCrossSections', 'extrudeLayers', 'extrudeContours', 'shell', 'lathe', 'drape', 'fronts', 'procTex', 'tweakMat', 'createRevealController', 'inkAware', 'contactShadow'],
      '@saxster/atlas/motion.js': ['planArea', 'planBounds', 'planPose', 'logFovLerp', 'glide'],
      '@saxster/atlas/mesh-audit.js': ['auditDeliverable'],
      '@saxster/atlas/checks.js': ['checks', 'near'],
    },
    templateDir: 'examples/minimal/blueprint',
    templateFiles: ['model.js', 'checks.mjs', 'world.js', 'figure.js', 'main.js'],
    invariants: [
      '2D blueprint sheet and 3D physical model share a single geometric spec in model.js.',
      'Overhead blueprint steps use planPose(bounds, { fov: 3, el: 89.4 }) and look.cutY for watertight pochè section cuts.',
      'Audit generated 3D solids with auditDeliverable(root, { maxTris: 60000, requireUV: true }).',
    ],
  },
  {
    slug: 'prims',
    kind: 'kit',
    summary: 'Core 3D paper-and-ink mathematical and scientific building blocks (axes, plots, surfaces, vector fields, streamlines, equal-flux fieldLines, flowBeads, lattices, molecules, particles).',
    triggers: ['building blocks', '3d plot', 'vector field', 'streamline', 'field lines', 'flow beads', '3d surface', 'molecule xyz', 'coordinate axes'],
    modules: {
      '@saxster/atlas/prims.js': ['axes', 'plot', 'area', 'surface', 'curve', 'vector', 'field', 'streamline', 'fieldLines', 'flowBeads', 'lattice', 'blob', 'particles', 'molecule', 'parseXYZ', 'linkage'],
      '@saxster/atlas/parts.js': ['part', 'box', 'cyl', 'rod', 'lines', 'arrow', 'setArrow', 'liveTube', 'shadeMat', 'PALETTE', 'TONE'],
    },
    invariants: [
      'Build primitives once in buildWorld(E) and mutate in place inside update(state, look) via .update() or .set().',
      'Pass [...ax.labels, ...v.labels] into buildWorld return value { update, labels }.',
    ],
  },
  {
    slug: 'kinematics',
    kind: 'kit',
    summary: 'Pure forward and inverse kinematics (slider-crank, 4-bar, gears, rack-and-pinion, differential, declarative constraint solver, 2-link IK, FABRIK, Jacobian IK).',
    triggers: ['forward kinematics', 'inverse kinematics', 'slider crank', 'four bar linkage', 'fabrik', 'jacobian ik', 'constraint solver', 'gear ratio'],
    modules: {
      '@saxster/atlas/kinematics.js': ['circleIntersect', 'sliderCrank', 'fourBar', 'gearRatio', 'rackPinion', 'differential', 'createSolver', 'twoLinkIK', 'fabrik', 'jacobianIK'],
      '@saxster/atlas/checks.js': ['checks', 'near', 'deriv', 'checkLinkLengths', 'checkTrajectory'],
    },
    invariants: [
      'kinematics.js is pure math (zero DOM, zero three.js) and belongs in model.js and checks.mjs.',
      'Always verify link lengths and smooth joint trajectories across crank/cycle angles with checkLinkLengths() and checkTrajectory() in checks.mjs.',
    ],
  },
  {
    slug: 'solvers',
    kind: 'kit',
    summary: 'Pure conservation-network solver (MNA circuits/hydraulics/thermal), inverse-CDF equal-flux streamline seeding, and 3D axisymmetric Snell/TIR ray-tracing.',
    triggers: ['circuit solver', 'nodal analysis', 'flow network', 'equal flux', 'quantile seeds', 'ray tracing', 'snell refraction', 'optical bench'],
    modules: {
      '@saxster/atlas/solvers.js': ['solveLinear', 'solveNetwork', 'quantileSeeds', 'opticSag', 'traceAxisymmetricRays'],
      '@saxster/atlas/checks.js': ['checks', 'near', 'deriv', 'integ'],
    },
    invariants: [
      'solvers.js is pure math (zero DOM, zero three.js) and belongs in model.js and checks.mjs.',
      'Verify KCL residual (maxKclResidual < 1e-8) and power conservation (sum(powers) === 0) in checks.mjs.',
    ],
  },
  {
    slug: 'motion',
    kind: 'kit',
    summary: 'Stateless closed-loop procedural motion, 28 easings, cubic-bezier, choreography (stagger, dwell, anticipate, followThrough), seamless loopNoise, and 3D camera moves.',
    triggers: ['procedural motion', 'camera moves', 'dolly zoom', 'spring easing', 'loop noise', 'stagger animation', 'stateless time'],
    modules: {
      '@saxster/atlas/motion.js': [
        'TAU', 'clamp01', 'clamp', 'lerp', 'fract', 'mod', 'smooth', 'smoothstep', 'ease',
        'phase', 'win', 'warpTime', 'spring', 'settleShake', 'squashStretch', 'eases',
        'hash', 'rand', 'rrange', 'loopNoise',
        'planArea', 'planBounds', 'planPose', 'logFovLerp', 'glide',
        'cubicBezier', 'bez', 'stagger', 'dwell', 'pingPong', 'anticipate', 'followThrough', 'pulseBeat', 'posterizeTime',
        'camDolly', 'camZoom', 'camOrbit', 'camCrane', 'camDollyZoom', 'camHandheld',
      ],
    },
    invariants: [
      'Every helper is a pure function of time t with zero per-frame accumulator state so ?render window.seek(t) is order-independent.',
      'spring(0) === 0 and spring(1) === 1 are pinned at both boundaries; loopNoise(t + period) === loopNoise(t).',
    ],
  },
  {
    slug: 'cad_kit',
    kind: 'kit',
    summary: 'Watertight boolean CSG (RectSolid), floorplan & STEM 2D-to-3D compilers (extrudePlan, revolveSection, extrudeCrossSections, extrudeLayers, extrudeContours), and procedural PBR.',
    triggers: ['watertight csg', 'rectsolid', 'revolve section', 'cross sections', 'extrude layers', 'extrude contours', 'procedural texture', 'cad kit'],
    modules: {
      '@saxster/atlas/cad_kit.js': [
        'RectSolid', 'uvMetres', 'bevelBox', 'shell', 'lathe', 'drape', 'fronts', 'batchGeos', 'branchTree',
        'swingArc', 'slideArrow', 'dimChain', 'buildSheet', 'extrudePlan',
        'revolveSection', 'extrudeCrossSections', 'extrudeLayers', 'extrudeContours',
        'procTex', 'tweakMat', 'createRevealController', 'inkAware', 'contactShadow',
      ],
      '@saxster/atlas/mesh-audit.js': ['auditDeliverable'],
    },
    invariants: [
      'Use RectSolid or the 4 STEM compilers (revolveSection, extrudeCrossSections, extrudeLayers, extrudeContours) so touching solids share zero internal seam faces.',
      'Audit generated meshes with auditDeliverable() in selftests or specimen viewers.',
    ],
  },
  {
    slug: 'chart',
    kind: 'kit',
    summary: '2D SVG line/scatter charts, live tangents/paths, waterfall bridges, and Sankey flow diagrams with paper-masked labels and WCAG-checked palettes.',
    triggers: ['2d chart', 'waterfall chart', 'sankey diagram', 'sankey flow', 'waterfall bridge', 'svg chart', 'live chart'],
    modules: {
      '@saxster/atlas/chart.js': [
        'textAdvanceEm', 'scale', 'chart', 'samples', 'moveCursor', 'moveTangent', 'setLivePath',
        'waterfallWalk', 'waterfallChart', 'sankeyLayout', 'sankeyChart',
      ],
      '@saxster/atlas/theme.js': ['readTheme', 'KYM', 'BYRNE_THEME', 'parseColor', 'compositeOver', 'srgbLuminance', 'wcagContrast', 'auditTheme'],
    },
    invariants: [
      'Compute waterfallWalk(steps) or sankeyLayout({ stages, links }) in model.js/checks.mjs and verify mass/flow conservation before drawing.',
      'Return { key, svg, update } from figure.chart(params) with moveCursor/moveTangent/setLivePath for zero-thrash live updates.',
    ],
  },
  {
    slug: 'prose',
    kind: 'kit',
    summary: 'Reactive prose & visual-proof kit: Bret Victor 5px/step inline scrub(), live val(), Amit Patel [data-part] term(), Oliver Byrne SVG proof chips, and Nicky Case expandable aside().',
    triggers: ['scrubbable numbers', 'reactive prose', 'byrne chips', 'nutshell aside', 'inline scrubber'],
    modules: {
      '@saxster/atlas/prose.js': ['scrub', 'val', 'term', 'byrne', 'aside', 'bindProse'],
      '@saxster/atlas/theme.js': ['BYRNE_THEME', 'auditTheme'],
    },
    invariants: [
      'Every inline val(key) formats state from model.js via proseFormat / formatters (never inline math in DOM strings).',
      'Every data-part target in term() or byrne.* resolves to a named 3D assembly in world.js.',
    ],
  },
  {
    slug: 'sound',
    kind: 'kit',
    summary: 'Zero-asset WebAudio synthesis kit: rising-semitone playBoop, directional playClick, velocity-gated playKnock, continuous motor/field createHum, and muted-by-default mountSoundToggle.',
    triggers: ['procedural audio', 'sound synthesis', 'motor hum', 'commutator click', 'rising boop'],
    modules: {
      '@saxster/atlas/sound.js': ['playTone', 'playBoop', 'playClick', 'playKnock', 'createHum', 'mountSoundToggle'],
    },
    invariants: [
      'Audio is always opt-in via figure.sonify(ctx, state, ...) (muted by default until user clicks Sound, suspended on mute, and hidden in ?render).',
    ],
  },
  // ---------- Creator Voices (3 Design Registers: textbook, creative, quirky) ----------
  {
    slug: 'textbook-pure',
    kind: 'voice',
    register: 'textbook',
    voiceDoc: 'docs/voices/textbook-pure.md',
    summary: 'Register 1 (Textbook-Pure) — Kym / Tufte calm reference plate: paper-ink medium, single-accent focus, zero theatrical chrome.',
    triggers: ['textbook pure', 'anodyne textbook', 'canonical plate', 'calm textbook'],
    modules: {
      '@saxster/atlas/render.js': ['MEDIUMS'],
      '@saxster/atlas/chart.js': ['chart', 'moveCursor'],
      '@saxster/atlas/theme.js': ['auditTheme'],
    },
    invariants: [
      'Use medium: "paper-ink" with silent defaults and <= 6 stage callouts per beat.',
    ],
  },
  {
    slug: 'ciechanowski-mechanism',
    kind: 'voice',
    register: 'creative',
    voiceDoc: 'docs/voices/ciechanowski-mechanism.md',
    summary: 'Register 2 (Creative Atelier) — Bartosz Ciechanowski mechanical clarity: frameless #f8f8f8 stage, [0.75, 1.0] view-headlight, driver/driven/idler role gears with notch: true.',
    triggers: ['ciechanowski', 'bartosz mechanism', 'gear mechanism voice', 'ciechanow style'],
    modules: {
      '@saxster/atlas/render.js': ['MEDIUMS'],
      '@saxster/atlas/parts.js': ['part', 'gear', 'rack', 'spring', 'PALETTE'],
      '@saxster/atlas/kinematics.js': ['gearRatio', 'sliderCrank', 'fourBar', 'rackPinion', 'differential'],
    },
    invariants: [
      'Set medium: "ciechanow", assign pal: "driver"|"driven"|"idler"|"compound"|"housing", and pass notch: true on rotating gears.',
    ],
  },
  {
    slug: 'byrne-visual-proof',
    kind: 'voice',
    register: 'creative',
    voiceDoc: 'docs/voices/byrne-visual-proof.md',
    summary: 'Register 2 (Creative Atelier) — Oliver Byrne (1847 Euclid) & c82.net: BYRNE_THEME primary inks + inline SVG seg/angle/poly tokens replacing letter labels with hover proof-isolation.',
    triggers: ['oliver byrne', 'byrne proof', 'visual euclid', 'geometric proof voice'],
    modules: {
      '@saxster/atlas/prose.js': ['byrne', 'term', 'aside'],
      '@saxster/atlas/theme.js': ['BYRNE_THEME', 'auditTheme'],
      '@saxster/atlas/parts.js': ['applyTheme', 'part'],
    },
    invariants: [
      'Replace 3-letter vertex strings in prose with byrne.seg(), byrne.angle(), and byrne.poly() locked to 3D assemblies via data-isolate="1".',
    ],
  },
  {
    slug: 'moebius-printmaking',
    kind: 'voice',
    register: 'creative',
    voiceDoc: 'docs/voices/moebius-printmaking.md',
    summary: 'Register 2 (Creative Atelier) — Moebius ligne-claire & Risograph printmaking (Maxime Heckel): hard specular islands + 3-tier shadow cross-hatching or CMYK rotated halftone dots.',
    triggers: ['moebius style', 'ligne claire', 'risograph print', 'crosshatch shader'],
    modules: {
      '@saxster/atlas/render.js': ['MEDIUMS'],
      '@saxster/atlas/cad_kit.js': ['revolveSection', 'extrudeLayers', 'extrudeContours', 'procTex'],
      '@saxster/atlas/mesh-audit.js': ['auditDeliverable'],
    },
    invariants: [
      'Set medium: "moebius" or "risograph" and audit PBR meshes with auditDeliverable(root, { calmPBR: true }).',
    ],
  },
  {
    slug: 'redblob-reactive-prose',
    kind: 'voice',
    register: 'creative',
    voiceDoc: 'docs/voices/redblob-reactive-prose.md',
    summary: 'Register 2 (Creative Atelier) — Amit Patel (Red Blob Games) & Bret Victor (Tangle): 4-surface hue lock across inline 5px/step scrub(), live val(), [data-part] term(), and 60fps SVG charts.',
    triggers: ['red blob', 'amit patel', 'bret victor', 'tangle prose', 'coupled chart prose'],
    modules: {
      '@saxster/atlas/prose.js': ['scrub', 'val', 'term', 'bindProse'],
      '@saxster/atlas/chart.js': ['chart', 'moveCursor', 'moveTangent', 'setLivePath'],
      '@saxster/atlas/parts.js': ['setArrow', 'PALETTE'],
    },
    invariants: [
      'Lock each variable to one semantic hue across inline scrub()/val(), term(), 2D chart tangents/livePaths, and 3D vectors.',
    ],
  },
  {
    slug: 'bugged-sketchbook',
    kind: 'voice',
    register: 'quirky',
    voiceDoc: 'docs/voices/bugged-sketchbook.md',
    summary: 'Register 3 (Quirky & Toy-First) — thebuggeddev STEM sketchbook: pencil-wash watercolor medium, flush-seam parts, 1D axis/load tactile drag, hold-to-stall probes, fieldLines/flowBeads, and motor hum.',
    triggers: ['thebuggeddev', 'bugged sketchbook', 'pencil wash', 'watercolor sketchbook', 'sketchbook lab'],
    modules: {
      '@saxster/atlas/render.js': ['MEDIUMS'],
      '@saxster/atlas/stage.js': ['draggable', 'rayAxisClosest', 'mountMediumBar'],
      '@saxster/atlas/prims.js': ['fieldLines', 'flowBeads'],
      '@saxster/atlas/solvers.js': ['solveNetwork', 'quantileSeeds', 'traceAxisymmetricRays'],
      '@saxster/atlas/prose.js': ['scrub', 'val', 'term', 'aside'],
      '@saxster/atlas/sound.js': ['createHum', 'playClick', 'mountSoundToggle'],
    },
    invariants: [
      'Set medium: "pencil-wash", include direct 1D axis/load manipulation or an edge-case stall probe, and keep figure.sonify(ctx, state) muted by default.',
    ],
  },
  {
    slug: 'ncase-playable-toy',
    kind: 'voice',
    register: 'quirky',
    voiceDoc: 'docs/voices/ncase-playable-toy.md',
    summary: 'Register 3 (Quirky & Toy-First) — Nicky Case playable system: 5-act Interest Curve (Toy Hook -> Single Rule -> Bet -> Twist -> Sandbox), :nutshell aside() bubbles, and squashStretch personality.',
    triggers: ['nicky case', 'playable toy', 'evolution of trust', 'interest curve', 'nutshell voice'],
    modules: {
      '@saxster/atlas/prose.js': ['aside', 'term', 'scrub', 'val'],
      '@saxster/atlas/motion.js': ['squashStretch', 'settleShake', 'spring'],
      '@saxster/atlas/sound.js': ['playBoop', 'playClick'],
    },
    invariants: [
      'Open with an immediate toy hook before multi-slider walls, test intuition with predict/pickPart, and tuck tangents into expandable aside() bubbles.',
    ],
  },
  {
    slug: 'toybox-scale-joy',
    kind: 'voice',
    register: 'quirky',
    voiceDoc: 'docs/voices/toybox-scale-joy.md',
    summary: 'Register 3 (Quirky & Toy-First) — Bruno Simon, Josh Comeau & Neal Agarwal: 3-second zero-onboarding tabletop joy, rrange imperfection, grounded contactShadow, logFovLerp scale anchors, and boops/knocks.',
    triggers: ['bruno simon', 'josh comeau', 'neal agarwal', 'tabletop toybox', 'scale joy'],
    modules: {
      '@saxster/atlas/motion.js': ['rrange', 'logFovLerp', 'camDollyZoom', 'squashStretch'],
      '@saxster/atlas/cad_kit.js': ['contactShadow', 'procTex'],
      '@saxster/atlas/sound.js': ['playBoop', 'playKnock'],
      '@saxster/atlas/adapters/specimen.js': ['showSpecimen', 'auditDeliverable'],
    },
    invariants: [
      'Ground floating parts with height-attenuated contactShadow, seed tabletop micro-jitter via rrange(seed), and anchor >10x scale jumps with familiar reference objects.',
    ],
  },
  {
    slug: 'whacky-lab',
    kind: 'voice',
    register: 'wild',
    voiceDoc: 'docs/voices/whacky-lab.md',
    summary: 'Register 4 (Wild, Whacky & Over-the-Top) — Far Side x Scott Adams x Incredible Machine Mad Atelier maximalism: quirk "wild" (uQuirk=1.0), simultaneous Moebius cross-hatch + Risograph pop dots + 12Hz line boil, rubber-hose squashStretch, and full WebAudio soundscape.',
    triggers: ['whacky lab', 'wild and whacky', 'over the top', 'mad atelier', 'rube goldberg'],
    modules: {
      '@saxster/atlas/render.js': ['MEDIUMS', 'QUIRKS', 'DEFAULT_QUIRK', 'QUIRK_PRESETS', 'resolveQuirk'],
      '@saxster/atlas/stage.js': ['mountQuirkBar', 'mountMediumBar', 'draggable'],
      '@saxster/atlas/motion.js': ['squashStretch', 'anticipate', 'settleShake', 'camDollyZoom', 'camHandheld', 'posterizeTime'],
      '@saxster/atlas/comic.js': ['renderComicStripHTML', 'mountComicStrip'],
      '@saxster/atlas/sound.js': ['createHum', 'playBoop', 'playClick', 'playKnock', 'mountSoundToggle'],
    },
    invariants: [
      'Use quirk: "wild" (or mountQuirkBar defaulting to DEFAULT_QUIRK = "slightly-quirky" with full range from "bland" to "wild"), and preserve pure model.js + ?render determinism.',
    ],
  },
];

function words(text) {
  return new Set(String(text || '').toLowerCase().split(/[^\w]+/).filter(Boolean));
}

function contentTokens(text) {
  return String(text || '')
    .toLowerCase()
    .split(/[^\w]+/)
    .filter(w => w && !STOPWORDS.has(w) && w.length > 1);
}

function targetVocab(target) {
  const syms = Object.values(target.modules || {}).flat().join(' ');
  return words([target.slug, target.kind, target.summary, (target.triggers || []).join(' '), syms].join(' '));
}

export function firedTriggers(target, queryWords) {
  const out = [];
  for (const phrase of target.triggers || []) {
    const pw = words(phrase);
    if (pw.size > 0 && [...pw].every(w => queryWords.has(w))) {
      out.push(phrase);
    }
  }
  return out;
}

export function scoreTargets(targets, query) {
  const tokens = contentTokens(query);
  if (!tokens.length) return [];
  const N = targets.length;
  const vocabList = targets.map(t => ({ target: t, vocab: targetVocab(t) }));
  const idf = new Map();
  for (const tk of tokens) {
    let df = 0;
    for (const { vocab } of vocabList) {
      if (vocab.has(tk) || [...vocab].some(v => v.includes(tk))) df++;
    }
    idf.set(tk, df > 0 ? Math.log(1 + N / df) : Math.log(1 + N));
  }
  const totalWeight = tokens.reduce((acc, tk) => acc + (idf.get(tk) || 1), 0) || 1;
  const scored = [];
  for (const { target, vocab } of vocabList) {
    const matched = [];
    let hitWeight = 0;
    for (const tk of tokens) {
      if (vocab.has(tk) || [...vocab].some(v => v.length >= 3 && (v.includes(tk) || tk.includes(v)))) {
        matched.push(tk);
        hitWeight += idf.get(tk) || 1;
      }
    }
    const score = hitWeight / totalWeight;
    if (score >= SUGGEST_FLOOR) {
      scored.push({ target, score: Number(score.toFixed(2)), matched });
    }
  }
  scored.sort((a, b) => b.score - a.score || a.target.slug.localeCompare(b.target.slug));
  return scored.slice(0, SUGGEST_MAX);
}

function assemblePackage(primary, matchedBy, supportingKits = []) {
  const templates = {};
  if (primary.templateDir && primary.templateFiles) {
    const dir = path.join(HERE, primary.templateDir);
    for (const fn of primary.templateFiles) {
      const p = path.join(dir, fn);
      if (fs.existsSync(p)) templates[fn] = fs.readFileSync(p, 'utf8').trim();
    }
  }
  let voiceMarkdown = null;
  if (primary.voiceDoc) {
    const vp = path.join(HERE, primary.voiceDoc);
    if (fs.existsSync(vp)) voiceMarkdown = fs.readFileSync(vp, 'utf8').trim();
  }
  const lines = [
    `# Boot Package: ${primary.slug} (${primary.kind})`,
    `Matched by: ${matchedBy}`,
    '',
    `> ${primary.summary}`,
    '',
    '## Contract & Invariants',
    ...primary.invariants.map(inv => `- ${inv}`),
    '',
    '## Verified Imports & Exports',
  ];
  for (const [mod, syms] of Object.entries(primary.modules)) {
    lines.push(`- \`${mod}\`: ${syms.map(s => `\`${s}\``).join(', ')}`);
  }
  if (voiceMarkdown) {
    lines.push('', '## Creator Voice Guide', '', voiceMarkdown);
  }
  if (supportingKits.length) {
    lines.push('', '## Matched Supporting Kits & Voices');
    for (const kit of supportingKits) {
      lines.push(`### ${kit.slug} (${kit.kind}) — ${kit.summary}`);
      for (const [mod, syms] of Object.entries(kit.modules)) {
        lines.push(`- \`${mod}\`: ${syms.map(s => `\`${s}\``).join(', ')}`);
      }
      if (kit.voiceDoc) {
        const kvp = path.join(HERE, kit.voiceDoc);
        if (fs.existsSync(kvp)) lines.push('', fs.readFileSync(kvp, 'utf8').trim());
      }
    }
  }
  if (Object.keys(templates).length) {
    lines.push('', `## Working Skeleton (\`${primary.templateDir}/\`)`);
    lines.push(`Start a new figure with: \`npx atlas new <subject>/<id> --grammar ${primary.slug}\``);
    for (const [fn, code] of Object.entries(templates)) {
      lines.push('', `### \`${fn}\``, '```js', code, '```');
    }
  }
  lines.push(
    '',
    '## Verification Workflow',
    '1. `npx atlas check <subject>/<id>` — verifies `model.js` purity and runs `checks.mjs`',
    '2. `npx atlas stills shots <subject>/<id>` — renders desktop (1440×900) and phone (390×844) mid-dwell stills',
    '3. `npx atlas critic <subject>/<id> [--intersections]` — checks frame jumps, label overlaps, 3D framing/occlusion/mesh clashes, and SVG/page clipping',
  );
  return {
    matched: true,
    exitCode: 0,
    slug: primary.slug,
    kind: primary.kind,
    register: primary.register || null,
    matchedBy,
    supportingKits: supportingKits.map(k => k.slug),
    modules: primary.modules,
    templates,
    voiceDoc: primary.voiceDoc || null,
    markdown: lines.join('\n'),
  };
}

export function boot(queryOrSlug = '', { list = false, json = false } = {}) {
  const q = String(queryOrSlug || '').trim();
  if (list || !q) {
    const grammars = TARGETS.filter(t => t.kind === 'grammar');
    const kits = TARGETS.filter(t => t.kind === 'kit');
    const voices = TARGETS.filter(t => t.kind === 'voice');
    const lines = [
      '# Atlas Boot Targets',
      '',
      '## Grammars (`npx atlas boot <grammar>`)',
      ...grammars.map(g => `- **${g.slug.padEnd(10)}** — ${g.summary} (triggers: ${g.triggers.join(', ')})`),
      '',
      '## Domain Kits (`npx atlas boot <kit>`)',
      ...kits.map(k => `- **${k.slug.padEnd(10)}** — ${k.summary} (triggers: ${k.triggers.join(', ')})`),
      '',
      '## Creator Voices (`npx atlas boot <voice>` — see `docs/voices/catalog.md`)',
      ...voices.map(v => `- **${v.slug.padEnd(23)}** [${v.register}] — ${v.summary} (triggers: ${v.triggers.join(', ')})`),
    ];
    const payload = {
      matched: false,
      exitCode: 0,
      targets: TARGETS.map(({ slug, kind, register, summary, triggers }) => ({ slug, kind, ...(register ? { register } : {}), summary, triggers })),
      markdown: lines.join('\n'),
    };
    return payload;
  }

  const slugNorm = q.toLowerCase().replace(/^@saxster\/atlas\//, '').replace(/\.js$/, '');
  const exact = TARGETS.find(t => t.slug.toLowerCase() === slugNorm);
  if (exact) {
    return assemblePackage(exact, `exact slug: ${exact.slug}`);
  }

  const qWords = words(q);
  const fired = [];
  for (const t of TARGETS) {
    const hits = firedTriggers(t, qWords);
    if (hits.length) fired.push({ target: t, hits });
  }

  const firedGrammars = fired.filter(x => x.target.kind === 'grammar');
  const firedKits = fired.filter(x => x.target.kind === 'kit');
  const firedVoices = fired.filter(x => x.target.kind === 'voice');

  if (firedGrammars.length === 1) {
    const g = firedGrammars[0];
    return assemblePackage(
      g.target,
      `trigger fired: "${g.hits[0]}"`,
      [...firedKits, ...firedVoices].map(x => x.target),
    );
  }
  if (firedGrammars.length === 0 && firedKits.length === 1 && firedVoices.length === 0) {
    const k = firedKits[0];
    return assemblePackage(k.target, `trigger fired: "${k.hits[0]}"`);
  }
  if (firedGrammars.length === 0 && firedKits.length === 0 && firedVoices.length === 1) {
    const v = firedVoices[0];
    return assemblePackage(v.target, `trigger fired: "${v.hits[0]}"`);
  }

  const candidates = scoreTargets(TARGETS, q);
  if (candidates.length > 0) {
    const lines = [
      `# No confident match for "${q}"`,
      'No single complete trigger phrase fired. Abstaining rather than guessing the wrong grammar.',
      '',
      '## Scored Candidates',
      ...candidates.map(c => `- \`npx atlas boot ${c.target.slug}\` (${c.target.kind}, score ${c.score.toFixed(2)}, matched: ${c.matched.join(', ')}) — ${c.target.summary}`),
    ];
    return {
      matched: false,
      exitCode: 0,
      candidates: candidates.map(c => ({ slug: c.target.slug, kind: c.target.kind, score: c.score, matched: c.matched })),
      markdown: lines.join('\n'),
    };
  }

  const lines = [
    `No grammar or kit matches "${q}".`,
    'Available targets:',
    ...TARGETS.map(t => `  - ${t.slug} (${t.kind}): ${t.summary}`),
  ];
  return {
    matched: false,
    exitCode: 3,
    candidates: [],
    markdown: lines.join('\n'),
  };
}
