// node tools/figma-bridge.mjs — Bidirectional bridge between @saxster/atlas and the Figma MCP server:
//   1. `tokens`                 -> emits 8-mode Figma Variables JSON across all Atlas themes & mediums
//   2. `audit <vars.json>`      -> parses nested modes OR flat `get_variable_defs` slash maps and runs WCAG 2.x AA audit
//   3. `bundle <figure> [out]`  -> packages any standalone figure OR multi-page/headless book chapter + engine/ + adapters/
//                                  into a self-contained static directory ready for `send_code_to_figma` Code Layers.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PALETTE, ATLAS_INKS } from '../engine/parts.js';
import { BYRNE_THEME, auditTheme } from '../engine/theme.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Canonical 8-mode token table for Figma Variable Collections ("Atlas Themes & Mediums").
export function exportTokens() {
  return {
    collection: 'Atlas Themes & Mediums',
    modes: {
      'paper-ink': {
        page: '#f2f2ef',
        sheet: '#fbfbfa',
        ink: ATLAS_INKS[4],
        text: '#57575a',
        muted: '#66666c',
        faint: '#d4d4d6',
        red: PALETTE.red[1],
        redInk: '#b8343a',
        blue: PALETTE.blue[2],
        blueInk: '#2c5697',
        green: PALETTE.green[1],
        greenInk: '#236b43',
        ochre: PALETTE.ochre[2],
        ochreInk: '#825b00',
      },
      ciechanow: {
        page: '#f0f0ee',
        sheet: '#f8f8f8',
        ink: '#222226',
        text: '#4c4c50',
        muted: '#66666c',
        faint: '#d8d8da',
        red: PALETTE.compound[2],
        redInk: '#ab3e3e',
        blue: PALETTE.idler[2],
        blueInk: '#296387',
        green: PALETTE.driven[2],
        greenInk: '#3d6934',
        ochre: '#826308',
        ochreInk: '#7d5e06',
      },
      'pencil-wash': {
        page: '#f3eee2',
        sheet: '#faf7ef',
        ink: '#2b2927',
        text: '#524e48',
        muted: '#6b665e',
        faint: '#d8d1c3',
        red: PALETTE.red[1],
        redInk: '#b33338',
        blue: PALETTE.blue[2],
        blueInk: '#2c5697',
        green: PALETTE.green[1],
        greenInk: '#236b43',
        ochre: PALETTE.ochre[2],
        ochreInk: '#855d00',
      },
      moebius: {
        page: '#eeece5',
        sheet: '#f6f4ee',
        ink: '#1c1b19',
        text: '#494742',
        muted: '#636058',
        faint: '#d2cec4',
        red: '#c83c36',
        redInk: '#a82d28',
        blue: '#2f5f9e',
        blueInk: '#274f85',
        green: '#2a7852',
        greenInk: '#216343',
        ochre: '#8d6218',
        ochreInk: '#7d5612',
      },
      risograph: {
        page: '#efe8d8',
        sheet: '#f7f2e7',
        ink: '#1f1e1c',
        text: '#4a4640',
        muted: '#666056',
        faint: '#d4ccb9',
        red: '#c83b32',
        redInk: '#b03028',
        blue: '#2c6cb8',
        blueInk: '#235491',
        green: '#268055',
        greenInk: '#1e6945',
        ochre: '#8c6314',
        ochreInk: '#825c00',
      },
      'byrne-1847': {
        page: '#ece5d5',
        sheet: BYRNE_THEME.sheet,
        ink: BYRNE_THEME.ink,
        text: '#2e2b27',
        muted: '#5e584f',
        faint: '#cfc6b4',
        red: BYRNE_THEME.red,
        redInk: '#b32d1b',
        blue: BYRNE_THEME.blue,
        blueInk: BYRNE_THEME.blue,
        green: BYRNE_THEME.green,
        greenInk: BYRNE_THEME.green,
        ochre: '#8c6208',
        ochreInk: '#825b00',
      },
      'kym-sepia': {
        page: '#efe4cf',
        sheet: '#f8f0e0',
        ink: '#3a2e22',
        text: '#4d3f31',
        muted: '#6b5a48',
        faint: '#d6c8b2',
        red: '#a3452c',
        redInk: '#a3452c',
        blue: '#3c687a',
        blueInk: '#2e5463',
        green: '#456446',
        greenInk: '#456446',
        ochre: '#87581b',
        ochreInk: '#784d15',
      },
      'kym-dark': {
        page: '#121917',
        sheet: '#18211e',
        ink: '#e6e3d6',
        text: '#cfccc0',
        muted: '#9aa5a1',
        faint: '#2d3834',
        red: '#e0896f',
        redInk: '#e0896f',
        blue: '#78b3cb',
        blueInk: '#78b3cb',
        green: '#7cbf9c',
        greenInk: '#7cbf9c',
        ochre: '#d4a35f',
        ochreInk: '#d4a35f',
      },
    },
    typography: {
      serif: 'EB Garamond',
      sans: 'Inter',
      mono: 'JetBrains Mono',
    },
  };
}

// Normalizes either `{ modes: { mode: { ... } } }` OR flat Figma `get_variable_defs` output
// (e.g. `{ "paper-ink/sheet": "#fbfbfa", "paper-ink/text": "#57575a" }` or `{ "color/sheet": "#fbfbfa" }`).
export function normalizeFigmaModes(input) {
  if (!input || typeof input !== 'object') return {};
  if (input.modes && typeof input.modes === 'object') return input.modes;
  const vals = Object.values(input);
  if (!vals.length) return {};
  // If values are already mode objects:
  if (vals.every(v => v && typeof v === 'object' && !Array.isArray(v))) return input;
  // Flat slash-keyed map from Figma get_variable_defs:
  const grouped = {};
  const knownTokens = new Set(['page', 'sheet', 'card', 'ink', 'text', 'muted', 'faint', 'red', 'redInk', 'blue', 'blueInk', 'green', 'greenInk', 'ochre', 'ochreInk']);
  for (const [rawKey, val] of Object.entries(input)) {
    if (typeof val !== 'string' || !val.trim()) continue;
    const parts = rawKey.split('/').map(s => s.trim()).filter(Boolean);
    const leafRaw = parts.at(-1) || rawKey;
    const leaf = leafRaw === 'card' ? 'sheet' : leafRaw.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    if (!knownTokens.has(leaf)) continue;
    const mode = parts.length >= 2 && parts[0] !== 'color' && parts[0] !== 'colors' ? parts[0] : 'default';
    (grouped[mode] ||= {})[leaf] = val;
  }
  return grouped;
}

// Validates a mode map or raw Figma `get_variable_defs` map against WCAG 2.x AA contrast
// (4.5:1 text/prose inks, 3.0:1 graphical marks including ochre) on both `sheet` and `page`.
// Fails closed (`ok: false`) if zero foreground/background pairs could be extracted.
export function auditFigmaVariables(modesInput) {
  const modes = normalizeFigmaModes(modesInput);
  const entries = [];
  for (const [modeName, m] of Object.entries(modes)) {
    if (!m || typeof m !== 'object') continue;
    const bgSheet = m.sheet || m['--card'] || '#fbfbfa';
    const bgPage = m.page || m['--page'] || bgSheet;
    for (const [label, bg] of [['sheet', bgSheet], ['page', bgPage]]) {
      if (m.ink) entries.push({ role: `${modeName} ink on ${label}`, fg: m.ink, bg, kind: 'text' });
      if (m.text) entries.push({ role: `${modeName} text on ${label}`, fg: m.text, bg, kind: 'text' });
      if (m.muted) entries.push({ role: `${modeName} muted on ${label}`, fg: m.muted, bg, kind: 'text' });
      for (const k of ['redInk', 'blueInk', 'greenInk', 'ochreInk']) {
        if (m[k]) entries.push({ role: `${modeName} ${k} on ${label}`, fg: m[k], bg, kind: 'text' });
      }
      for (const k of ['red', 'blue', 'green', 'ochre']) {
        if (m[k]) entries.push({ role: `${modeName} ${k} mark on ${label}`, fg: m[k], bg, kind: 'mark' });
      }
    }
  }
  if (!entries.length) {
    return {
      ok: false,
      checked: 0,
      findings: [{ role: 'empty or unrecognized Figma variable map', ratio: 0, min: 4.5 }],
    };
  }
  const res = auditTheme(entries);
  return { ...res, checked: entries.length };
}

// Rewrites relative parent paths (`../../../engine/`, `../../engine/`, `../../../adapters/`) inside a figure's
// index.html so a standalone bundle directory works inside Figma Code Layers (`send_code_to_figma`) without parent escapes.
export function rewriteIndexForCodeLayer(html) {
  return String(html)
    .replace(/(?:\.\.\/)+engine\//g, './engine/')
    .replace(/(?:\.\.\/)+adapters\//g, './adapters/')
    .replace(/href="(?:\.\.\/)+[^"]*"/g, 'href="#"');
}

function synthesizeBookIndexHtml(title = 'Atlas Chapter') {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<link rel="icon" href="data:,">
<link rel="stylesheet" href="./engine/atlas.css">
<link rel="stylesheet" href="./engine/book.css">
<script src="./engine/cover.js"></script>
<script type="importmap">
{ "imports": { "@saxster/atlas/adapters/": "./adapters/", "@saxster/atlas/": "./engine/", "three": "https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js", "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/" } }
</script>
</head>
<body class="book-body">
  <header class="topbar">
    <a href="#" class="brand">Atlas</a>
    <span class="crumb">${title}</span>
    <nav class="dots" id="dots" aria-label="Pages"></nav>
  </header>
  <div class="scroll-space" id="space"></div>
  <main class="book" id="book">
    <section class="page left" id="left" aria-live="polite">
      <article class="sheet" id="sheet"></article>
      <article class="plate" id="plate" hidden></article>
      <footer class="folio"><span>${title}</span><span id="folio">1</span></footer>
    </section>
    <section class="page right" id="right">
      <div class="figure">
        <canvas id="gl" aria-label="${title}"></canvas>
        <div id="labels" aria-hidden="true"></div>
        <div class="corner tl" id="figno">Fig. 1</div>
        <div class="corner tr" id="figtitle"></div>
        <div class="corner bl" id="hint">Drag to turn · shift-drag to pan · click to break it down</div>
        <div class="corner br readout" id="readout"></div>
      </div>
    </section>
    <div class="leaf" id="leaf" aria-hidden="true">
      <div class="leaf-front"><span id="leafnext"></span></div>
      <div class="leaf-back"><article class="sheet" id="leafsheet"></article></div>
    </div>
    <div class="spine" aria-hidden="true"></div>
  </main>
  <p class="scroll-cue" id="cue">Scroll to turn the page</p>
  <script type="module" src="./main.js"></script>
</body>
</html>
`;
}

function copyDirFiltered(src, dest, skipExt = new Set(['.mjs'])) {
  fs.mkdirSync(dest, { recursive: true });
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    if (ent.name.startsWith('.')) continue;
    const s = path.join(src, ent.name);
    const d = path.join(dest, ent.name);
    if (ent.isDirectory()) {
      copyDirFiltered(s, d, skipExt);
    } else if (!skipExt.has(path.extname(ent.name))) {
      fs.copyFileSync(s, d);
    }
  }
}

// Stages a self-contained static HTML/CSS/JS bundle of any Atlas figure or book chapter (including headless Kym chapters)
// into `outDir` with zero `../` escapes, ready to tar/zip for Figma's `send_code_to_figma` Code Layer workflow.
export function bundleFigureForFigma(figureRef, outDir) {
  const cleanRef = figureRef.replace(/^\/+|\/+$/g, '');
  const candidateA = path.join(ROOT, cleanRef);
  const candidateB = path.join(ROOT, 'examples', cleanRef);
  const figDir = fs.existsSync(path.join(candidateA, 'model.js')) || fs.existsSync(path.join(candidateA, 'index.html'))
    ? candidateA
    : candidateB;
  if (!fs.existsSync(figDir)) {
    throw new Error(`bundleFigureForFigma: cannot find figure or chapter "${figureRef}"`);
  }
  const dest = path.resolve(outDir);
  fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(dest, { recursive: true });

  // 1. Copy figure/chapter runtime files (excluding Node-only .mjs checks)
  copyDirFiltered(figDir, dest);

  // 2. Rewrite `../subject.js` across ALL bundled .js files (e.g. `chapter.js` AND `main.js`) and neutralize external links/xrefs
  const subjFile = path.join(path.dirname(figDir), 'subject.js');
  let needsSubject = false;
  for (const fn of fs.readdirSync(dest)) {
    if (!fn.endsWith('.js')) continue;
    const fp = path.join(dest, fn);
    const src = fs.readFileSync(fp, 'utf8');
    if (src.includes('../subject.js')) {
      needsSubject = true;
      fs.writeFileSync(fp, src.replace(/\.\.\/subject\.js/g, './subject.js'));
    }
  }
  if (needsSubject && fs.existsSync(subjFile)) {
    let subjSrc = fs.readFileSync(subjFile, 'utf8')
      .replace(/import\s*\{\s*XREFS\s*\}\s*from\s*['"]\.\.\/xrefs\.js['"];?/g, 'const XREFS = [];')
      .replace(/links:\s*\[[^\]]*\]/g, 'links: []');
    fs.writeFileSync(path.join(dest, 'subject.js'), subjSrc);
  }

  // 3. Synthesize `main.js` + `index.html` if bundling a headless Kym textbook chapter (`chapter.js` without `index.html`)
  const indexSrc = path.join(figDir, 'index.html');
  if (fs.existsSync(indexSrc)) {
    fs.writeFileSync(path.join(dest, 'index.html'), rewriteIndexForCodeLayer(fs.readFileSync(indexSrc, 'utf8')));
  } else if (fs.existsSync(path.join(dest, 'chapter.js'))) {
    if (!fs.existsSync(path.join(dest, 'main.js'))) {
      fs.writeFileSync(path.join(dest, 'main.js'),
        `import { startBook } from '@saxster/atlas/book.js';\nimport { CHAPTER } from './chapter.js';\nstartBook(CHAPTER);\n`);
    }
    fs.writeFileSync(path.join(dest, 'index.html'), synthesizeBookIndexHtml(path.basename(figDir)));
  } else {
    throw new Error(`bundleFigureForFigma: "${figureRef}" has neither index.html nor chapter.js`);
  }

  // 4. Copy runtime engine/ and adapters/ into ./engine and ./adapters inside the bundle
  copyDirFiltered(path.join(ROOT, 'engine'), path.join(dest, 'engine'));
  copyDirFiltered(path.join(ROOT, 'adapters'), path.join(dest, 'adapters'));

  return { figDir, outDir: dest, files: fs.readdirSync(dest) };
}

// Generates a complete SVG Vector & 8-Voice Swatch Sheet that Figma's `upload_assets` (`image/svg+xml`)
// imports directly as editable vector node trees (8-mode palette swatches, Oliver Byrne proof trio, and involute gear).
export function buildAtelierSvgSheet() {
  const { modes } = exportTokens();
  const modeEntries = Object.entries(modes);
  const rows = modeEntries.map(([name, m], idx) => {
    const y = 76 + idx * 46;
    const keys = ['ink', 'text', 'red', 'blue', 'green', 'ochre'];
    const chips = keys.map((k, ci) => {
      const x = 180 + ci * 54;
      return `<rect id="${name}-${k}" x="${x}" y="${y + 7}" width="44" height="26" rx="5" fill="${m[k]}" stroke="${m.ink}" stroke-opacity="0.22"/>`;
    }).join('');
    return `<g id="Voice-${name}">
      <rect x="24" y="${y}" width="500" height="40" rx="8" fill="${m.sheet}" stroke="${m.faint}"/>
      <text x="38" y="${y + 25}" font-family="Inter, sans-serif" font-size="13" font-weight="500" fill="${m.ink}">${name}</text>
      ${chips}
    </g>`;
  }).join('\n  ');

  // 16-tooth involute gear path at (680, 175)
  const teeth = 16, rPitch = 68, mod = (2 * rPitch) / teeth, rAdd = rPitch + 0.95 * mod, rDed = rPitch - 1.15 * mod;
  const cx = 680, cy = 175, step = (Math.PI * 2) / teeth;
  const gPts = [];
  for (let i = 0; i < teeth; i++) {
    const a0 = i * step;
    const p = (r, a) => `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
    gPts.push(i === 0 ? `M ${p(rDed, a0)}` : `L ${p(rDed, a0)}`);
    gPts.push(`L ${p(rDed, a0 + step * 0.18)}`, `L ${p(rAdd, a0 + step * 0.32)}`, `L ${p(rAdd, a0 + step * 0.58)}`, `L ${p(rDed, a0 + step * 0.72)}`);
  }
  gPts.push('Z');

  return `<svg width="840" height="468" viewBox="0 0 840 468" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="840" height="468" rx="16" fill="#FBFBFA" stroke="#D4D4D6"/>
  <text x="24" y="42" font-family="EB Garamond, Georgia, serif" font-size="24" fill="#18181A">Atlas Design Atelier — 8-Voice Swatch Matrix &amp; Editable Vector Foundry</text>
  <text x="24" y="62" font-family="JetBrains Mono, monospace" font-size="11" fill="#66666C">WCAG 2.x AA VERIFIED PALETTES · OLIVER BYRNE PROOF TOKENS · CIECHANOWSKI INVOLUTE GEAR</text>
  ${rows}
  <g id="Ciechanowski-Involute-Gear">
    <rect x="556" y="76" width="256" height="200" rx="12" fill="#F8F8F8" stroke="#D8D8DA"/>
    <path d="${gPts.join(' ')}" fill="#FCD561" stroke="#18181A" stroke-width="2" stroke-linejoin="round"/>
    <circle cx="${cx}" cy="${cy}" r="20" fill="#F8F8F8" stroke="#18181A" stroke-width="2"/>
    <circle cx="${(cx + rPitch * 0.58).toFixed(1)}" cy="${cy}" r="5.5" fill="#18181A"/>
    <text x="684" y="262" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11" fill="#4C4C50">driver · 16T · notch: true</text>
  </g>
  <g id="Byrne-Visual-Proof-Tokens">
    <rect x="556" y="292" width="256" height="152" rx="12" fill="#F4EFE2" stroke="#CFC6B4"/>
    <line x1="582" y1="382" x2="638" y2="332" stroke="#1B1917" stroke-width="9" stroke-linecap="round"/>
    <line x1="582" y1="382" x2="638" y2="332" stroke="#D63A24" stroke-width="5.5" stroke-linecap="round"/>
    <path d="M662 384 L714 384 A52 52 0 0 0 696 344 Z" fill="#1D5B8C" stroke="#1B1917" stroke-width="2.2" stroke-linejoin="round"/>
    <line x1="662" y1="384" x2="722" y2="384" stroke="#1B1917" stroke-width="3" stroke-linecap="round"/>
    <line x1="662" y1="384" x2="702" y2="338" stroke="#1B1917" stroke-width="3" stroke-linecap="round"/>
    <polygon points="764,330 796,384 732,384" fill="#E5AD16" stroke="#1B1917" stroke-width="3" stroke-linejoin="round"/>
    <text x="684" y="424" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11" fill="#2E2B27">byrne.seg · byrne.angle · byrne.poly</text>
  </g>
</svg>`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [cmd, arg1, arg2] = process.argv.slice(2);
  if (cmd === 'tokens') {
    console.log(JSON.stringify(exportTokens(), null, 2));
  } else if (cmd === 'audit') {
    if (!arg1) { console.error('Usage: node tools/figma-bridge.mjs audit <vars.json>'); process.exit(2); }
    const raw = JSON.parse(fs.readFileSync(arg1, 'utf8'));
    const res = auditFigmaVariables(raw);
    if (!res.ok) {
      for (const f of res.findings) console.error(`FAIL contrast: ${f.role} (${f.ratio}:1 < ${f.min}:1)`);
      process.exit(1);
    }
    console.log(`PASS contrast: ${res.checked} Figma variable pairs clear WCAG AA`);
  } else if (cmd === 'bundle') {
    if (!arg1) { console.error('Usage: node tools/figma-bridge.mjs bundle <subject/id> [out-dir]'); process.exit(2); }
    const slug = arg1.replace(/^examples\//, '').replace(/\//g, '-');
    const out = arg2 || path.join('/tmp', `atlas-figma-${slug}`);
    const res = bundleFigureForFigma(arg1, out);
    console.log(`Bundled ${arg1} -> ${res.outDir} (${res.files.length} top-level entries, ready for send_code_to_figma)`);
  } else if (cmd === 'svg-sheet') {
    const svg = buildAtelierSvgSheet();
    if (arg1) { fs.writeFileSync(arg1, svg); console.log(`Wrote SVG vector & swatch sheet -> ${arg1}`); }
    else console.log(svg);
  } else {
    console.log(`Usage:
  node tools/figma-bridge.mjs tokens                     emit 8-mode Figma Variables JSON
  node tools/figma-bridge.mjs audit <vars.json>          verify WCAG AA contrast on Figma variable modes or get_variable_defs JSON
  node tools/figma-bridge.mjs bundle <figure> [out-dir]  stage self-contained Code Layer bundle for send_code_to_figma
  node tools/figma-bridge.mjs svg-sheet [out.svg]        emit editable SVG Vector & 8-Voice Swatch Sheet for upload_assets`);
  }
}
