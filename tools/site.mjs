// node tools/site.mjs [--check] — writes the examples' shelf (examples/index.html) and each subject's contents page
// (examples/<subject>/index.html) from the subject.js manifests, so a new chapter or figure appears by adding it there once.
// A subject with contents: false keeps a hand-made page (physics). --check fails if any written page is stale.
// Each subject.js gives name, blurb, and cards: { id: { title, sub, alt, section? } }; a card's picture is
// <subject>/img/<id>.jpg (node tools/cards.mjs draws them). cover: the id whose picture stands for the subject on the shelf.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { ROOT, EXAMPLES, subjects } from './chapters.mjs';
import { XREFS } from '../examples/xrefs.js';
import { THREADS } from '../examples/concepts/threads.js';

const CHECK = process.argv.includes('--check');
// the shelf's order and the subjects still in preparation, so the root page shows the whole plan
const SHELF = [
  ['physics', 'Physics', 'mechanics, electricity and magnetism'],
  ['maths', 'Mathematics', 'trigonometry, calculus, linear algebra'],
  ['statistics', 'Statistics', 'probability, sampling, inference'],
  ['critical-thinking', 'Critical Thinking', 'arguments, denominators, causal inference and evidence'],
  ['chemistry', 'Chemistry', 'molecules, reactions, energy'],
  ['economics', 'Economics', 'money, markets, growth'],
  ['biology', 'Biology', 'cells, molecules, living machines'],
];
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const strip = s => String(s).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const head = (title, up, extra = '') => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<link rel="icon" href="data:,">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Inter:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${up}engine/atlas.css">
<link rel="stylesheet" href="${up}engine/shelf.css">
<script type="module" src="${up}engine/search.js"></script>
${extra}</head>
`;
const GENERATED = '<!-- written by tools/site.mjs from the subject.js manifests: edit those, then run it -->\n';

const SHELF_COLORS = {
  physics: '#5a79c2',
  maths: '#3aa57a',
  statistics: '#8c6bb5',
  'critical-thinking': '#d63a24',
  chemistry: '#ef6a4c',
  economics: '#c98a18',
  biology: '#226b48',
};

function rootPage(all) {
  const byId = Object.fromEntries(all.map(s => [s.id, s]));
  const deckRows = [];
  const cards = SHELF.map(([id, name, blurb]) => {
    const s = byId[id], items = s ? [...(s.chapters || []), ...(s.figures || [])] : [];
    if (!items.length) return `    <div class="card soon"><div class="no"><span>in preparation</span></div><h2>${name}</h2><i>${blurb}</i><span class="wait">coming</span></div>`;
    const first = s.cover || items[0], img = fs.existsSync(path.join(EXAMPLES, id, 'img', `${first}.jpg`)) ? `\n      <img src="${id}/img/${first}.jpg" alt="${esc(s.cards?.[first]?.alt || '')}">` : '';
    const count = `${items.length} ${items.length === 1 ? (s.chapters?.length ? 'chapter' : 'figure') : (s.figures?.length && !s.chapters?.length ? 'figures' : 'chapters')}`;
    deckRows.push({
      id,
      label: name,
      color: SHELF_COLORS[id] || '#ef6a4c',
      items: items.map(itemId => {
        const c = s.cards?.[itemId] || {};
        const thumbPath = path.join(EXAMPLES, id, 'img', `${itemId}.jpg`);
        return {
          id: itemId,
          kicker: name,
          title: c.title || itemId,
          sub: c.sub || '',
          href: `${id}/${itemId}/`,
          ...(fs.existsSync(thumbPath) ? { img: `${id}/img/${itemId}.jpg` } : {}),
        };
      }),
    });
    return `    <a class="card" href="${id}/"><div class="no"><span>${count}</span></div><h2>${name}</h2><i>${esc(s.blurb || blurb)}</i>${img}</a>`;
  });
  const deckJson = JSON.stringify(deckRows).replace(/</g, '\\u003c');
  return head('Atlas', '../') + `<body>
${GENERATED}  <header><b>Atlas</b><span>Ideas, taken apart</span></header>
  <section class="hero">
    <h1>Every subject, taken apart.</h1>
    <p>Each idea as one working figure: a model you can check, a thing you can move</p>
  </section>
  <div class="shelf-view-bar">
    <div class="shelf-view-seg" role="group" aria-label="Shelf view">
      <button type="button" data-shelf-view="grid" aria-pressed="true">Grid</button>
      <button type="button" data-shelf-view="deck" aria-pressed="false">2D Deck</button>
    </div>
  </div>
  <section class="shelf" id="shelf-grid">
${cards.join('\n')}
  </section>
  <section class="shelf-deck" id="shelf-deck" hidden aria-label="2D subject and figure deck"></section>
  <p class="foot"><a href="concepts/">Every idea, and the figures that show it</a> · <a href="ink-ui/">Corner Atelier (24 live ink controls)</a> · <a href="../llms.txt">llms.txt</a></p>
  <script type="application/json" id="atlas-deck-data">${deckJson}</script>
  <script type="module">
    const grid = document.getElementById('shelf-grid');
    const deck = document.getElementById('shelf-deck');
    const btns = [...document.querySelectorAll('[data-shelf-view]')];
    let mounted = null;
    async function setView(v) {
      const showDeck = v === 'deck';
      grid.hidden = showDeck;
      deck.hidden = !showDeck;
      btns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.shelfView === v)));
      if (showDeck && !mounted) {
        const rows = JSON.parse(document.getElementById('atlas-deck-data')?.textContent || '[]');
        const { mountSpaceDeck } = await import('../engine/diegetic.js');
        mounted = mountSpaceDeck(deck, { rows });
      }
    }
    btns.forEach(b => b.addEventListener('click', () => setView(b.dataset.shelfView)));
  </script>
</body>
</html>
`;
}

function subjectPage(s) {
  const items = [...(s.chapters || []).map(id => ({ id, kind: 'book' })), ...(s.figures || []).map(id => ({ id, kind: 'figure' }))];
  const sections = [];
  for (const it of items) {
    const c = s.cards?.[it.id] || {}, name = c.section || '';
    let sec = sections.find(x => x.name === name); if (!sec) sections.push(sec = { name, items: [] });
    sec.items.push({ ...it, ...c });
  }
  let n = 0;
  const body = sections.map(sec => `${sec.name ? `  <h2 class="section">${esc(sec.name)}</h2>\n` : ''}  <section class="shelf">
${sec.items.map(it => {
    n++;
    const img = fs.existsSync(path.join(EXAMPLES, s.id, 'img', `${it.id}.jpg`)) ? `\n      <img src="img/${it.id}.jpg" alt="${esc(it.alt || '')}">` : '';
    const kind = it.kind === 'book' ? (it.pages ? `${it.pages} pages` : 'book') : (it.grammar || 'figure');
    return `    <a class="card" href="${it.id}/">
      <div class="no"><span>No. ${String(n).padStart(2, '0')}</span><span>${esc(kind)}</span></div>
      <h2>${esc(it.title || it.id)}</h2><i>${esc(it.sub || '')}</i>${img}
    </a>`;
  }).join('\n')}
  </section>`).join('\n');
  const links = (s.links || []).map(l => `<a href="${esc(l.href.replace(/^\.\.\//, ''))}">${esc(l.label)}</a>`).join('');
  return head(s.name, '../../', '<script src="../../engine/cover.js" data-contents></script>\n') + `<body>
${GENERATED}  <header><a class="home" href="../">Atlas</a><span>${links}<a href="../concepts/">Concepts</a></span></header>
  <section class="hero">
    <h1>${esc(s.hero || s.name)}</h1>
    <p>${esc(s.tagline || s.blurb || '')}</p>
  </section>
${body}
</body>
</html>
`;
}

async function searchIndexJs(all) {
  const entries = [];
  const conceptShownIn = new Map();
  for (const s of all) {
    if (s.id === 'minimal') continue;
    const subjName = s.name.replace(/^Atlas of /, '');
    for (const c of s.chapters || []) {
      const card = s.cards?.[c] || {};
      entries.push({ id: `${s.id}/${c}`, kind: 'chapter', subject: subjName, title: card.title || c, sub: card.sub || '', text: card.alt || '', href: `${s.id}/${c}/` });
      const pFile = path.join(EXAMPLES, s.id, c, 'pages.js');
      if (fs.existsSync(pFile)) {
        const src = fs.readFileSync(pFile, 'utf8');
        [...src.matchAll(/kicker:\s*'([^']*)',\s*title:\s*'([^']*)'/g)].forEach(([, k, t], i) => {
          entries.push({ id: `${s.id}/${c}/${i}`, kind: 'page', subject: subjName, title: t, sub: `${card.title || c} · ${k}`, href: `${s.id}/${c}/#${i}` });
        });
      }
      const qFile = path.join(EXAMPLES, s.id, c, 'practice.js');
      if (fs.existsSync(qFile)) {
        try {
          const { PRACTICE } = await import(pathToFileURL(qFile).href);
          for (const [pg, qs] of Object.entries(PRACTICE || {})) {
            (qs || []).forEach((q, qi) => {
              const qText = strip(q.q || '');
              if (qText) entries.push({ id: `${s.id}/${c}/${pg}/q${qi}`, kind: 'practice', subject: subjName, title: qText.slice(0, 110), sub: `${card.title || c} · p.${+pg + 1}`, text: qText, href: `${s.id}/${c}/#${pg}` });
            });
          }
        } catch {}
      }
    }
    for (const f of s.figures || []) {
      const card = s.cards?.[f] || {};
      entries.push({ id: `${s.id}/${f}`, kind: card.grammar || 'figure', subject: subjName, title: card.title || f, sub: card.sub || '', text: card.alt || '', href: `${s.id}/${f}/` });
    }
  }
  const cDir = path.join(EXAMPLES, 'concepts');
  if (fs.existsSync(cDir)) {
    const files = fs.readdirSync(cDir).filter(f => f.endsWith('.js') && f !== 'threads.js').sort();
    for (const file of files) {
      const subjId = file.slice(0, -3);
      const subjName = subjId === 'maths' ? 'Mathematics' : (subjId === 'critical-thinking' ? 'Critical Thinking' : subjId[0].toUpperCase() + subjId.slice(1));
      const { CONCEPTS } = await import(pathToFileURL(path.join(cDir, file)).href);
      for (const c of CONCEPTS) {
        conceptShownIn.set(c.id, c.shownIn || []);
        const firstRef = c.shownIn?.[0];
        let href = `concepts/#${c.id}`;
        if (firstRef) {
          const parts = firstRef.split('/');
          href = parts.length === 3 ? `${parts[0]}/${parts[1]}/#${parts[2]}` : `${parts[0]}/${parts[1]}/`;
        }
        entries.push({ id: `concept:${c.id}`, kind: 'concept', subject: subjName, title: c.name, formula: strip(c.formula || ''), formulaHtml: c.formula || '', href });
      }
    }
  }
  for (const t of THREADS) {
    entries.push({
      id: `thread:${t.id}`,
      kind: 'thread',
      subject: 'Across subjects',
      title: t.name,
      sub: 'Thread',
      text: t.idea,
      href: `concepts/#thread-${t.id}`,
    });
  }
  const byId = new Map(entries.map(e => [e.id, e]));
  const addLink = (fromId, toId, why) => {
    if (!fromId || !toId || fromId === toId || !byId.has(fromId) || !byId.has(toId)) return;
    const src = byId.get(fromId);
    src.links ||= [];
    if (!src.links.some(l => l.to === toId)) src.links.push({ to: toId, why });
  };
  for (const [a, , b, , whyHtml] of XREFS) {
    const why = `Compare · ${strip(whyHtml)}`;
    addLink(a, b, why);
    addLink(b, a, why);
  }
  for (const t of THREADS) {
    const why = `Thread · ${t.name}`;
    const threadId = `thread:${t.id}`;
    const threadRefs = [];
    for (const cid of t.concepts) {
      const cEntryId = `concept:${cid}`;
      addLink(threadId, cEntryId, why);
      addLink(cEntryId, threadId, why);
      for (const otherCid of t.concepts) addLink(cEntryId, `concept:${otherCid}`, why);
      for (const ref of conceptShownIn.get(cid) || []) {
        addLink(threadId, ref, why);
        addLink(ref, threadId, why);
        addLink(cEntryId, ref, why);
        addLink(ref, cEntryId, why);
        threadRefs.push(ref);
      }
    }
    for (const r1 of threadRefs) {
      for (const r2 of threadRefs) addLink(r1, r2, why);
    }
  }
  for (const [cid, refs] of conceptShownIn.entries()) {
    const cEntry = byId.get(`concept:${cid}`);
    const why = `Concept · ${cEntry?.title || cid}`;
    for (const ref of refs) {
      addLink(`concept:${cid}`, ref, why);
      addLink(ref, `concept:${cid}`, why);
    }
  }
  return `// written by tools/site.mjs — do not edit by hand\nexport const SEARCH_INDEX = ${JSON.stringify(entries, null, 2)};\n`;
}

export const RETIRED_ROUTES = Object.freeze({});

export function resolveRoute(id) {
  const clean = String(id || '').replace(/^\/+|\/+$/g, '');
  if (clean in RETIRED_ROUTES) {
    return { id: clean, retired: true, target: RETIRED_ROUTES[clean] };
  }
  return { id: clean, retired: false, target: clean };
}

export function buildLlmsTxt(all) {
  const realSubjects = all.filter(s => s.id !== 'minimal');
  const totalCount = realSubjects.reduce((acc, s) => acc + (s.chapters?.length || 0) + (s.figures?.length || 0), 0);
  const subjLines = realSubjects.map(s => {
    const n = (s.chapters?.length || 0) + (s.figures?.length || 0);
    return `- **${s.name}** (\`examples/${s.id}/\`): ${n} figures/chapters — ${s.blurb || s.tagline || ''}`.trim();
  });
  return `# @saxster/atlas

> Paper-and-ink 3D and 2D interactive teaching figures for any subject: a pure checked \`model.js\`, independent verification in \`checks.mjs\`, 6 pedagogical grammars, 10 creator voices, stateless \`?render\` video/still tours, and textbook embeds. Zero runtime dependencies beyond \`three\`.

## Quickstart

\`\`\`bash
npm install github:saxster/atlas three
npx atlas new <subject>/<id> --grammar machine
npx atlas boot <grammar|kit|voice>
npx atlas check examples/<subject>/<id>
\`\`\`

## 6 Grammars

- \`book\` (\`engine/book.js\`): scroll-turned chapters with 3D camera choreography, breakdowns, practice questions, and embeds.
- \`machine\` (\`engine/machine.js\`): numbered step sequences, Manual/Auto playback, optional \`cuts: ['solid', 'xray', 'section']\`.
- \`explorer\` (\`engine/explorer.js\`): predict first, adjust sliders/controls, run seeded simulation + 2D live SVG charts.
- \`sandbox\` (\`engine/sandbox.js\`): constructive play with presets, matrix inputs, piece palette, 3D dragging, and undo-over-confirm receipts.
- \`teardown\` (\`examples/minimal/teardown\`): multi-part hardware/system disassembly & assembly plates.
- \`blueprint\` (\`examples/minimal/blueprint\`): watertight CSG & orthographic architectural/floorplan construction with section cuts.

## Engine Modules & Kits

- \`@saxster/atlas/stage.js\`, \`render.js\`, \`parts.js\`, \`prims.js\`, \`cad_kit.js\`: Three.js paper-and-ink renderer, 5 art mediums, flush-part \`idOff\` seams, \`RectSolid\` CSG, STEM 2D-to-3D compilers, and 3D \`fieldLines\` / \`flowBeads\`.
- \`@saxster/atlas/draft_kit.js\` & \`iso_kit.js\`: pure 2D orthographic construction plates (\`DRAFT_STANDARD\`) and 25 keylined 2.5D isometric primitives.
- \`@saxster/atlas/diegetic.js\`: 8 illustrated control schemas, \`statusOrb\`, \`compareCurtain\`, \`previewStage\`, \`mountFloatingDock\`, \`createUndoStack\`, \`showActionReceipt\`, and \`mountSpaceDeck\`.
- \`@saxster/atlas/chart.js\`: 2D SVG charts (\`moveCursor\`, \`moveTangent\`, \`setLivePath\`), \`waterfallChart\`, \`sankeyChart\`, \`sequenceLanes\`, \`isoStackChart\`, and nested \`spanTimeline\`.
- \`@saxster/atlas/prose.js\`: Bret Victor \`scrub\`, \`val\`, \`term\`, \`byrne\`, \`aside\`, \`paramChip\`, \`codeBlock\`, \`foilCard\`, \`diffList\`, \`frameInspector\`, and \`anatomyOverlay\`.
- \`@saxster/atlas/theme.js\` & \`motion.js\`: perceptual \`tonalScale\`, WCAG-clamped \`deriveAccentTokens\`, optional \`tintNeutrals\`, \`TYPOGRAPHY_PRESETS\`, \`controlRadius\`, \`mountThemeStudio\`, 31 \`eases\`, \`rubberband\`, \`projectMomentum\`, \`createMotionGovernor\`, and decoupled \`MOTION_FEELS\`.
- \`@saxster/atlas/solvers.js\`, \`kinematics.js\`, \`sound.js\`, \`moments.js\`: pure domain-agnostic solvers, kinematics, opt-in WebAudio, and lesson moments.

## Published Examples (${totalCount} Figures & Chapters + Showcases)

${subjLines.join('\n')}
- **Corner Atelier** (\`examples/ink-ui/\`): 24 live 2.5D ink widgets, Theme Studio, Floating Dock, Split Compare, Span Timeline, Orbs & Space Deck.
- **Concepts & Threads** (\`examples/concepts/\`): cross-subject concept ledger & spatial thread board.

## Docs

- \`llms-full.txt\`: full combined API reference, 10 Creator Voices catalog, and verification rubric.
- \`docs/API.md\`, \`docs/voices/catalog.md\`, \`docs/decisions.md\`, \`docs/verification-rubric.md\`.
`;
}

export function buildLlmsFullTxt(all) {
  const parts = [buildLlmsTxt(all).trimEnd()];
  for (const rel of ['docs/API.md', 'docs/voices/catalog.md', 'docs/verification-rubric.md']) {
    const abs = path.join(ROOT, rel);
    if (fs.existsSync(abs)) {
      parts.push(`\n---\n<!-- ${rel} -->\n\n${fs.readFileSync(abs, 'utf8').trimEnd()}`);
    }
  }
  return parts.join('\n') + '\n';
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const all = await subjects();
  const pages = [
    [path.join(EXAMPLES, 'index.html'), 'index.html', rootPage(all)],
    ...all.filter(s => s.contents !== false).map(s => [path.join(EXAMPLES, `${s.id}/index.html`), `${s.id}/index.html`, subjectPage(s)]),
    [path.join(EXAMPLES, 'search-index.js'), 'search-index.js', await searchIndexJs(all)],
    [path.join(ROOT, 'llms.txt'), 'llms.txt', buildLlmsTxt(all)],
    [path.join(ROOT, 'llms-full.txt'), 'llms-full.txt', buildLlmsFullTxt(all)],
  ];
  let stale = 0;
  for (const [p, label, html] of pages) {
    const now = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
    if (now === html) { console.log('same   ', label); continue; }
    if (CHECK) { stale++; console.log('STALE  ', label); continue; }
    fs.writeFileSync(p, html); console.log('wrote  ', label);
  }
  if (CHECK) {
    for (const idxFile of ['index.html', ...all.map(s => `${s.id}/index.html`)]) {
      const p = path.join(EXAMPLES, idxFile);
      if (!fs.existsSync(p)) continue;
      const dir = path.dirname(p), src = fs.readFileSync(p, 'utf8');
      for (const [, imgRel] of src.matchAll(/<img\s+[^>]*src="([^"]+)"/g)) {
        if (!fs.existsSync(path.join(dir, imgRel))) { stale++; console.log('MISSING', path.join(path.dirname(idxFile), imgRel)); }
      }
    }
  }
  if (stale) { console.log('run: node tools/site.mjs && node tools/cards.mjs'); process.exit(1); }
}
