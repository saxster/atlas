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
      '@saxster/atlas/checks.js': ['checks', 'near', 'deriv', 'checkLinkLengths'],
    },
    templateDir: 'examples/minimal/teardown',
    templateFiles: ['model.js', 'checks.mjs', 'world.js', 'figure.js', 'main.js'],
    invariants: [
      'Use cuts: ["solid", "xray", "section"] with xrayKeys, cutKeys, and cutPlane on the figure spec.',
      'Verify rigid linkage invariants in checks.mjs with checkLinkLengths() and analytical derivatives with deriv().',
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
    summary: 'Core 3D paper-and-ink mathematical and scientific building blocks (axes, plots, surfaces, vector fields, streamlines, lattices, molecules, particles).',
    triggers: ['building blocks', '3d plot', 'vector field', 'streamline', '3d surface', 'molecule xyz', 'coordinate axes'],
    modules: {
      '@saxster/atlas/prims.js': ['axes', 'plot', 'area', 'surface', 'curve', 'vector', 'field', 'streamline', 'lattice', 'blob', 'particles', 'molecule', 'parseXYZ', 'linkage'],
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
      '@saxster/atlas/checks.js': ['checks', 'near', 'deriv', 'checkLinkLengths'],
    },
    invariants: [
      'kinematics.js is pure math (zero DOM, zero three.js) and belongs in model.js and checks.mjs.',
      'Always verify link lengths across multiple crank angles with checkLinkLengths() in checks.mjs.',
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
    summary: '2D SVG line/scatter charts, waterfall bridges, and Sankey flow diagrams with paper-masked labels and WCAG-checked palettes for book pages and explorers.',
    triggers: ['2d chart', 'waterfall chart', 'sankey diagram', 'sankey flow', 'waterfall bridge', 'svg chart'],
    modules: {
      '@saxster/atlas/chart.js': [
        'textAdvanceEm', 'scale', 'chart', 'samples', 'moveCursor',
        'waterfallWalk', 'waterfallChart', 'sankeyLayout', 'sankeyChart',
      ],
      '@saxster/atlas/theme.js': ['readTheme', 'KYM', 'parseColor', 'compositeOver', 'srgbLuminance', 'wcagContrast', 'auditTheme'],
    },
    invariants: [
      'Compute waterfallWalk(steps) or sankeyLayout({ stages, links }) in model.js/checks.mjs and verify mass/flow conservation before drawing.',
      'Run npx atlas critic <figure> (which includes cli/clip.mjs) to verify zero SVG text/node overlaps or viewport clipping.',
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
  if (supportingKits.length) {
    lines.push('', '## Matched Supporting Kits');
    for (const kit of supportingKits) {
      lines.push(`### ${kit.slug} — ${kit.summary}`);
      for (const [mod, syms] of Object.entries(kit.modules)) {
        lines.push(`- \`${mod}\`: ${syms.map(s => `\`${s}\``).join(', ')}`);
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
    matchedBy,
    supportingKits: supportingKits.map(k => k.slug),
    modules: primary.modules,
    templates,
    markdown: lines.join('\n'),
  };
}

export function boot(queryOrSlug = '', { list = false, json = false } = {}) {
  const q = String(queryOrSlug || '').trim();
  if (list || !q) {
    const grammars = TARGETS.filter(t => t.kind === 'grammar');
    const kits = TARGETS.filter(t => t.kind === 'kit');
    const lines = [
      '# Atlas Boot Targets',
      '',
      '## Grammars (`npx atlas boot <grammar>`)',
      ...grammars.map(g => `- **${g.slug.padEnd(10)}** — ${g.summary} (triggers: ${g.triggers.join(', ')})`),
      '',
      '## Domain Kits (`npx atlas boot <kit>`)',
      ...kits.map(k => `- **${k.slug.padEnd(10)}** — ${k.summary} (triggers: ${k.triggers.join(', ')})`),
    ];
    const payload = {
      matched: false,
      exitCode: 0,
      targets: TARGETS.map(({ slug, kind, summary, triggers }) => ({ slug, kind, summary, triggers })),
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

  if (firedGrammars.length === 1) {
    const g = firedGrammars[0];
    return assemblePackage(
      g.target,
      `trigger fired: "${g.hits[0]}"`,
      firedKits.map(k => k.target),
    );
  }
  if (firedGrammars.length === 0 && firedKits.length === 1) {
    const k = firedKits[0];
    return assemblePackage(k.target, `trigger fired: "${k.hits[0]}"`);
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
