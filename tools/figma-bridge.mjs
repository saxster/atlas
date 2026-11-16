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

// Generates a 1600×1120 Editable Vector Figma Board ("Curious Atelier Book Redesign — All 5 Kym Books + Spread")
// ready to upload directly to Figma via `upload_assets` (`image/svg+xml`).
export function buildBookRedesignSvgSheet() {
  const books = [
    {
      slug: 'kym_patterned_maths',
      vol: 'VOL. I · MATHEMATICS',
      title: 'The Patterned World',
      sub: 'Euclid, Bar Models & Invariants',
      voice: 'byrne-1847 · Paper & Ink',
      spine: '#1F1B16',
      paper: '#F4EFE2',
      accent: '#23519C',
      emblem: (x, y) => `
        <circle cx="${x + 70}" cy="${y + 48}" r="34" fill="none" stroke="#23519C" stroke-width="2.5" stroke-dasharray="4 3"/>
        <circle cx="${x + 98}" cy="${y + 48}" r="34" fill="none" stroke="#AE2B20" stroke-width="2.5"/>
        <polygon points="${x + 84},${y + 19} ${x + 70},${y + 48} ${x + 98},${y + 48}" fill="#E2A41C" stroke="#1F1B16" stroke-width="2.5" stroke-linejoin="round"/>
      `,
    },
    {
      slug: 'kym_casebook',
      vol: 'VOL. II · CRITICAL THINKING',
      title: 'The Casebook of Reason',
      sub: 'Forensic Dossiers & Rival Claims',
      voice: 'ciechanow · Mechanism',
      spine: '#23201C',
      paper: '#F7F4EC',
      accent: '#AE2B20',
      emblem: (x, y) => `
        <line x1="${x + 42}" y1="${y + 62}" x2="${x + 126}" y2="${y + 38}" stroke="#1F1B16" stroke-width="3" stroke-linecap="round"/>
        <polygon points="${x + 84},${y + 50} ${x + 74},${y + 72} ${x + 94},${y + 72}" fill="#E2A41C" stroke="#1F1B16" stroke-width="2.2"/>
        <rect x="${x + 44}" y="${y + 38}" width="24" height="18" rx="3" fill="#23519C" stroke="#1F1B16" stroke-width="2"/>
        <circle cx="${x + 114}" cy="${y + 24}" r="11" fill="#AE2B20" stroke="#1F1B16" stroke-width="2"/>
      `,
    },
    {
      slug: 'kym_moving_world',
      vol: 'VOL. III · PHYSICS',
      title: 'The Moving World',
      sub: 'Forces, Fields & Mechanisms',
      voice: 'pencil-wash · Sketchbook',
      spine: '#1C242B',
      paper: '#FAF4EC',
      accent: '#AE2B20',
      emblem: (x, y) => `
        <ellipse cx="${x + 84}" cy="${y + 48}" rx="46" ry="22" transform="rotate(-18 ${x + 84} ${y + 48})" fill="none" stroke="#23519C" stroke-width="2.2"/>
        <circle cx="${x + 72}" cy="${y + 48}" r="13" fill="#E2A41C" stroke="#1F1B16" stroke-width="2.2"/>
        <circle cx="${x + 124}" cy="${y + 35}" r="7.5" fill="#AE2B20" stroke="#1F1B16" stroke-width="2"/>
        <path d="M ${x + 124} ${y + 35} L ${x + 138} ${y + 15}" stroke="#AE2B20" stroke-width="2.5" stroke-linecap="round"/>
      `,
    },
    {
      slug: 'kym_living_world',
      vol: 'VOL. IV · BIOLOGY',
      title: 'The Living World',
      sub: 'Cells, Gradients & Selection',
      voice: 'moebius · Ligne-Claire',
      spine: '#1E2D24',
      paper: '#F6F4EE',
      accent: '#45613B',
      emblem: (x, y) => `
        <ellipse cx="${x + 84}" cy="${y + 48}" rx="44" ry="28" fill="#E1E8D8" stroke="#1F1B16" stroke-width="2.2"/>
        <circle cx="${x + 70}" cy="${y + 48}" r="12" fill="#E2A41C" stroke="#1F1B16" stroke-width="2"/>
        <path d="M ${x + 94} ${y + 34} Q ${x + 106} ${y + 48} ${x + 94} ${y + 62}" fill="none" stroke="#AE2B20" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M ${x + 106} ${y + 34} Q ${x + 94} ${y + 48} ${x + 106} ${y + 62}" fill="none" stroke="#23519C" stroke-width="2.5" stroke-linecap="round"/>
      `,
    },
    {
      slug: 'kym_molecular_world',
      vol: 'VOL. V · CHEMISTRY',
      title: 'The Molecular World',
      sub: 'Bonds, Collisions & Equilibria',
      voice: 'risograph · Halftone Press',
      spine: '#2B1E1A',
      paper: '#F7F2E7',
      accent: '#23519C',
      emblem: (x, y) => `
        <line x1="${x + 84}" y1="${y + 46}" x2="${x + 54}" y2="${y + 66}" stroke="#1F1B16" stroke-width="3"/>
        <line x1="${x + 84}" y1="${y + 46}" x2="${x + 114}" y2="${y + 66}" stroke="#1F1B16" stroke-width="3"/>
        <line x1="${x + 84}" y1="${y + 46}" x2="${x + 84}" y2="${y + 18}" stroke="#1F1B16" stroke-width="3"/>
        <circle cx="${x + 84}" cy="${y + 46}" r="12" fill="#E2A41C" stroke="#1F1B16" stroke-width="2.2"/>
        <circle cx="${x + 54}" cy="${y + 66}" r="8.5" fill="#23519C" stroke="#1F1B16" stroke-width="2"/>
        <circle cx="${x + 114}" cy="${y + 66}" r="8.5" fill="#23519C" stroke="#1F1B16" stroke-width="2"/>
        <circle cx="${x + 84}" cy="${y + 18}" r="8.5" fill="#AE2B20" stroke="#1F1B16" stroke-width="2"/>
      `,
    },
  ];

  const coverCards = books.map((b, i) => {
    const x = 36 + i * 308;
    const y = 96;
    return `<g id="Cover-${b.slug}">
      <!-- 3-stepped right fore-edge paper stack -->
      <rect x="${x + 8}" y="${y + 6}" width="276" height="316" rx="12" fill="#DFD7C6" stroke="#C5B9A5"/>
      <rect x="${x + 4}" y="${y + 3}" width="276" height="316" rx="12" fill="#ECE5D6" stroke="#CFC4B0"/>
      <!-- Book cover board -->
      <rect x="${x}" y="${y}" width="276" height="316" rx="12" fill="${b.paper}" stroke="#1F1B16" stroke-width="1.5"/>
      <!-- Cloth spine band + brass stitch ticks -->
      <rect x="${x}" y="${y}" width="24" height="316" rx="6" fill="${b.spine}"/>
      <line x1="${x + 28}" y1="${y}" x2="${x + 28}" y2="${y + 316}" stroke="#1F1B16" stroke-opacity="0.18" stroke-dasharray="4 4"/>
      <!-- Bookmark ribbon notch -->
      <polygon points="${x + 236},${y} ${x + 250},${y} ${x + 250},${y + 24} ${x + 243},${y + 18} ${x + 236},${y + 24}" fill="#AE2B20"/>
      <!-- Atelier geometric emblem plate -->
      <rect x="${x + 44}" y="${y + 22}" width="168" height="96" rx="8" fill="#FFFDF7" stroke="#D8CFC0"/>
      ${b.emblem(x + 44, y + 22)}
      <!-- Typography -->
      <text x="${x + 44}" y="${y + 144}" font-family="SF Pro Text, Inter, sans-serif" font-size="10" font-weight="600" letter-spacing="1.4" fill="#7A5112">${b.vol}</text>
      <text x="${x + 44}" y="${y + 173}" font-family="New York, EB Garamond, Georgia, serif" font-size="19.5" font-weight="500" fill="#1F1B16">${b.title}</text>
      <text x="${x + 44}" y="${y + 196}" font-family="New York, EB Garamond, Georgia, serif" font-style="italic" font-size="13.5" fill="#5E584F">${b.sub}</text>
      <!-- Creator Voice pill -->
      <rect x="${x + 44}" y="${y + 220}" width="184" height="26" rx="13" fill="#F8EACB" stroke="#D8C8A8"/>
      <text x="${x + 56}" y="${y + 237}" font-family="SF Mono, JetBrains Mono, monospace" font-size="11" fill="#1F1B16">${b.voice}</text>
      <!-- Honest Skill Lamps -->
      <circle cx="${x + 50}" cy="${y + 280}" r="5" fill="#45613B"/>
      <circle cx="${x + 66}" cy="${y + 280}" r="5" fill="#45613B"/>
      <circle cx="${x + 82}" cy="${y + 280}" r="5" fill="#7A5112"/>
      <circle cx="${x + 98}" cy="${y + 280}" r="5" fill="#A39A88" fill-opacity="0.45"/>
      <text x="${x + 114}" y="${y + 284}" font-family="SF Pro Text, Inter, sans-serif" font-size="11" fill="#5E584F">6 Chapters · Gates A–D</text>
    </g>`;
  }).join('\n  ');

  return `<svg width="1600" height="1140" viewBox="0 0 1600 1140" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1600" height="1140" rx="20" fill="#F4EFE6" stroke="#D6CBB8" stroke-width="2"/>
  <text x="36" y="48" font-family="New York, EB Garamond, Georgia, serif" font-size="30" font-weight="500" fill="#1F1B16">Curious Atelier Book System — All 5 Kym Books × @saxster/atlas Voices</text>
  <text x="36" y="72" font-family="SF Mono, JetBrains Mono, monospace" font-size="12" fill="#7A5112">BYRNE 1847 VISUAL PROOFS · THEBUGGEDDEV PENCIL-WASH SKETCHBOOK · NICKY CASE :NUTSHELL ASIDES · MOEBIUS &amp; RISOGRAPH SHADERS</text>

  ${coverCards}

  <!-- Row 2: Redesigned Open-Book Reading Spread (1024pt iPad/Mac + 390pt iPhone Preview) -->
  <g id="Redesigned-Open-Book-Spread">
    <rect x="36" y="444" width="1100" height="660" rx="16" fill="#FFFDF7" stroke="#1F1B16" stroke-width="1.5"/>
    <!-- Left Sidebar Spine Shelf (240pt) -->
    <rect x="36" y="444" width="240" height="660" rx="16" fill="#F1EADC" stroke="#D8CFC0"/>
    <text x="56" y="482" font-family="SF Pro Text, Inter, sans-serif" font-size="10" font-weight="600" letter-spacing="1.4" fill="#7A5112">ATELIER BOOKSHELF · VOL. III</text>
    <text x="56" y="508" font-family="New York, EB Garamond, Georgia, serif" font-size="20" font-weight="500" fill="#1F1B16">The Moving World</text>
    <rect x="52" y="528" width="208" height="64" rx="10" fill="#FFFDF7" stroke="#1F1B16" stroke-width="1.5"/>
    <rect x="52" y="528" width="8" height="64" rx="4" fill="#AE2B20"/>
    <text x="70" y="550" font-family="SF Mono, JetBrains Mono, monospace" font-size="10" fill="#7A5112">CH 1 · PENCIL-WASH</text>
    <text x="70" y="572" font-family="New York, EB Garamond, Georgia, serif" font-size="14" font-weight="500" fill="#1F1B16">Why tables push back</text>

    <rect x="52" y="604" width="208" height="58" rx="10" fill="#FAF6EE" stroke="#D8CFC0"/>
    <text x="70" y="626" font-family="SF Mono, JetBrains Mono, monospace" font-size="10" fill="#5E584F">CH 2 · MECHANISM</text>
    <text x="70" y="646" font-family="New York, EB Garamond, Georgia, serif" font-size="14" fill="#5E584F">Galileo&#39;s inclined plane</text>

    <!-- Top Reading Ribbon: Wonder · Explore · Converse · Prove -->
    <rect x="300" y="464" width="812" height="44" rx="10" fill="#F1EADC" stroke="#D8CFC0"/>
    <circle cx="324" cy="486" r="5" fill="#AE2B20"/>
    <text x="336" y="490" font-family="SF Pro Text, Inter, sans-serif" font-size="12" font-weight="600" fill="#1F1B16">1. Wonder</text>
    <circle cx="424" cy="486" r="5" fill="#23519C"/>
    <text x="436" y="490" font-family="SF Pro Text, Inter, sans-serif" font-size="12" fill="#5E584F">2. Explore Stage</text>
    <circle cx="564" cy="486" r="5" fill="#7A5112"/>
    <text x="576" y="490" font-family="SF Pro Text, Inter, sans-serif" font-size="12" fill="#5E584F">3. Desk Tutor</text>
    <circle cx="684" cy="486" r="5" fill="#45613B"/>
    <text x="696" y="490" font-family="SF Pro Text, Inter, sans-serif" font-size="12" fill="#5E584F">4. Prove</text>
    <rect x="976" y="472" width="124" height="28" rx="8" fill="#8F641F"/>
    <text x="1002" y="490" font-family="SF Pro Text, Inter, sans-serif" font-size="11" font-weight="600" fill="#FFFDF7">Mentor Room</text>

    <!-- Field-Notebook Dog-Eared Wonder Card -->
    <rect x="300" y="524" width="540" height="96" rx="12" fill="#F8EACB" stroke="#1F1B16" stroke-width="1.2"/>
    <circle cx="320" cy="544" r="4.5" fill="#AE2B20"/>
    <text x="332" y="548" font-family="SF Pro Text, Inter, sans-serif" font-size="10" font-weight="600" letter-spacing="1.5" fill="#7A5112">WONDER FIRST · THOUGHT EXPERIMENT</text>
    <text x="320" y="576" font-family="New York, EB Garamond, Georgia, serif" font-style="italic" font-size="19" fill="#1F1B16">“How does a passive wooden table know to push upward</text>
    <text x="320" y="600" font-family="New York, EB Garamond, Georgia, serif" font-style="italic" font-size="19" fill="#1F1B16">with 49 N on a kettle, but only 1 N on an apple?”</text>

    <!-- Connected Prerequisite Thread Ticket -->
    <rect x="300" y="634" width="540" height="46" rx="10" fill="#FFFDF7" stroke="#D8CFC0"/>
    <text x="316" y="661" font-family="SF Mono, JetBrains Mono, monospace" font-size="11" fill="#23519C">STANDS ON: Vectors &amp; Mass  ──●──►  CH 1  ──●──►  UNLOCKS: Work &amp; Energy</text>

    <!-- 5-Medium @saxster/atlas Interactive Stage with Atelier Grid -->
    <rect x="300" y="696" width="540" height="384" rx="14" fill="#FAF7EF" stroke="#1F1B16" stroke-width="1.5"/>
    <rect x="316" y="712" width="508" height="34" rx="17" fill="#F1EADC" stroke="#D8CFC0"/>
    <rect x="322" y="716" width="96" height="26" rx="13" fill="#1F1B16"/>
    <text x="338" y="733" font-family="SF Mono, JetBrains Mono, monospace" font-size="10" fill="#FFFDF7">Sketchbook</text>
    <text x="434" y="733" font-family="SF Mono, JetBrains Mono, monospace" font-size="10" fill="#5E584F">Textbook</text>
    <text x="506" y="733" font-family="SF Mono, JetBrains Mono, monospace" font-size="10" fill="#5E584F">Ligne-claire</text>
    <text x="596" y="733" font-family="SF Mono, JetBrains Mono, monospace" font-size="10" fill="#5E584F">Risograph</text>
    <text x="676" y="733" font-family="SF Mono, JetBrains Mono, monospace" font-size="10" fill="#AE2B20">⚡ Counterfactual</text>

    <!-- 3D Lattice Table & Force Arrows inside Stage -->
    <rect x="336" y="762" width="468" height="236" rx="10" fill="#FFFDF7" stroke="#D8CFC0" stroke-dasharray="3 3"/>
    <line x1="400" y1="882" x2="740" y2="882" stroke="#7A5112" stroke-width="3" stroke-dasharray="6 4"/>
    <rect x="490" y="824" width="160" height="58" rx="8" fill="#DCE4F2" stroke="#23519C" stroke-width="2"/>
    <text x="534" y="858" font-family="New York, EB Garamond, Georgia, serif" font-size="15" fill="#1F1B16">5 kg Kettle</text>
    <line x1="570" y1="882" x2="570" y2="956" stroke="#AE2B20" stroke-width="3.5" stroke-linecap="round"/>
    <polygon points="570,964 564,952 576,952" fill="#AE2B20"/>
    <line x1="570" y1="824" x2="570" y2="774" stroke="#45613B" stroke-width="3.5" stroke-linecap="round"/>
    <polygon points="570,766 564,778 576,778" fill="#45613B"/>
    <text x="584" y="948" font-family="SF Mono, JetBrains Mono, monospace" font-size="11" fill="#AE2B20">Fg = 49 N (moves)</text>
    <text x="584" y="792" font-family="SF Mono, JetBrains Mono, monospace" font-size="11" fill="#45613B">FN = 49 N (spring bonds)</text>
    <rect x="336" y="1014" width="468" height="46" rx="8" fill="#F8EACB"/>
    <text x="352" y="1042" font-family="SF Mono, JetBrains Mono, monospace" font-size="12" fill="#1F1B16">Deflection = 0.14 mm · Net Force = 0.0 N (invariant)</text>

    <!-- Right Living Margin (250pt): Tilted Sketch Note + Expandable :nutshell Card -->
    <g transform="rotate(-1.2 980 590)">
      <rect x="864" y="532" width="244" height="126" rx="10" fill="#F8EACB" stroke="#1F1B16" stroke-width="1.2"/>
      <rect x="956" y="524" width="60" height="14" rx="3" fill="#E2A41C" fill-opacity="0.55"/>
      <text x="880" y="558" font-family="SF Pro Text, Inter, sans-serif" font-size="10" font-weight="600" letter-spacing="1.3" fill="#7A5112">NO DUMB QUESTIONS · SKETCH NOTE</text>
      <text x="880" y="584" font-family="New York, EB Garamond, Georgia, serif" font-style="italic" font-size="15" fill="#1F1B16">“Wait — does a concrete floor</text>
      <text x="880" y="606" font-family="New York, EB Garamond, Georgia, serif" font-style="italic" font-size="15" fill="#1F1B16">really bend when a fly lands?”</text>
      <text x="880" y="634" font-family="SF Mono, JetBrains Mono, monospace" font-size="11" fill="#45613B">→ Yes! By ~0.01 pm (atomic spring)</text>
    </g>

    <rect x="864" y="684" width="244" height="148" rx="10" fill="#F1EADC" stroke="#D8CFC0"/>
    <text x="880" y="710" font-family="SF Pro Text, Inter, sans-serif" font-size="10" font-weight="600" letter-spacing="1.3" fill="#23519C">:NUTSHELL · SKIP-SAFE DEPTH</text>
    <text x="880" y="736" font-family="New York, EB Garamond, Georgia, serif" font-size="14" fill="#1F1B16">Hooke&#39;s Law at Atomic Scale</text>
    <text x="880" y="762" font-family="New York, EB Garamond, Georgia, serif" font-size="13" fill="#5E584F">Pauli repulsion + electrostatic</text>
    <text x="880" y="782" font-family="New York, EB Garamond, Georgia, serif" font-size="13" fill="#5E584F">bonds act as k ≈ 3.5×10⁵ N/m.</text>
    <rect x="880" y="796" width="118" height="24" rx="12" fill="#FFFDF7" stroke="#1F1B16"/>
    <text x="894" y="812" font-family="SF Mono, JetBrains Mono, monospace" font-size="10" fill="#1F1B16">● ● Fold aside</text>
  </g>

  <!-- Compact 390pt iPhone Card Preview on Right -->
  <g id="Compact-390pt-iPhone-Preview">
    <rect x="1168" y="444" width="390" height="660" rx="28" fill="#FFFDF7" stroke="#1F1B16" stroke-width="2"/>
    <rect x="1188" y="468" width="350" height="36" rx="8" fill="#F1EADC"/>
    <text x="1202" y="490" font-family="SF Mono, JetBrains Mono, monospace" font-size="10" fill="#7A5112">390PT COMPACT · ZERO OVERFLOW</text>
    <rect x="1188" y="518" width="350" height="78" rx="10" fill="#F8EACB" stroke="#1F1B16"/>
    <text x="1204" y="542" font-family="SF Pro Text, Inter, sans-serif" font-size="9" font-weight="600" fill="#7A5112">WONDER FIRST</text>
    <text x="1204" y="566" font-family="New York, EB Garamond, Georgia, serif" font-style="italic" font-size="15" fill="#1F1B16">How does the table know how hard to push?</text>
    <rect x="1188" y="610" width="350" height="240" rx="12" fill="#FAF7EF" stroke="#1F1B16"/>
    <text x="1204" y="636" font-family="SF Mono, JetBrains Mono, monospace" font-size="10" fill="#23519C">3D STAGE · SKETCHBOOK MEDIUM</text>
    <rect x="1204" y="650" width="318" height="148" rx="8" fill="#FFFDF7" stroke="#D8CFC0"/>
    <circle cx="1363" cy="724" r="34" fill="#E2A41C" stroke="#1F1B16" stroke-width="2"/>
    <text x="1204" y="828" font-family="SF Mono, JetBrains Mono, monospace" font-size="11" fill="#1F1B16">FN = 49 N · Δy = 0.14 mm</text>
    <rect x="1188" y="866" width="350" height="94" rx="10" fill="#F1EADC" stroke="#D8CFC0"/>
    <text x="1204" y="890" font-family="SF Pro Text, Inter, sans-serif" font-size="10" font-weight="600" fill="#7A5112">STACKED SKETCH NOTE (390PT)</text>
    <text x="1204" y="916" font-family="New York, EB Garamond, Georgia, serif" font-style="italic" font-size="14" fill="#1F1B16">“Wait — does concrete bend too?” → Yes!</text>
    <rect x="1188" y="976" width="350" height="104" rx="10" fill="#FFFDF7" stroke="#D8CFC0"/>
    <text x="1204" y="1002" font-family="SF Pro Text, Inter, sans-serif" font-size="10" font-weight="600" fill="#45613B">DESK TUTOR · STANDING BESIDE YOU</text>
    <text x="1204" y="1028" font-family="New York, EB Garamond, Georgia, serif" font-size="13" fill="#1F1B16">Tap Talk With Tutor or Type Quietly.</text>
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
  } else if (cmd === 'book-redesign-sheet') {
    const svg = buildBookRedesignSvgSheet();
    if (arg1) { fs.writeFileSync(arg1, svg); console.log(`Wrote Book Redesign SVG sheet -> ${arg1}`); }
    else console.log(svg);
  } else {
    console.log(`Usage:
  node tools/figma-bridge.mjs tokens                     emit 8-mode Figma Variables JSON
  node tools/figma-bridge.mjs audit <vars.json>          verify WCAG AA contrast on Figma variable modes or get_variable_defs JSON
  node tools/figma-bridge.mjs bundle <figure> [out-dir]  stage self-contained Code Layer bundle for send_code_to_figma
  node tools/figma-bridge.mjs svg-sheet [out.svg]        emit editable SVG Vector & 8-Voice Swatch Sheet for upload_assets
  node tools/figma-bridge.mjs book-redesign-sheet [out]  emit editable SVG Curious Atelier Book Redesign Sheet for upload_assets`);
  }
}
