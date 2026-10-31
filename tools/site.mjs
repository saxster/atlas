// node tools/site.mjs [--check] — writes the examples' shelf (examples/index.html) and each subject's contents page
// (examples/<subject>/index.html) from the subject.js manifests, so a new chapter or figure appears by adding it there once.
// A subject with contents: false keeps a hand-made page (physics). --check fails if any written page is stale.
// Each subject.js gives name, blurb, and cards: { id: { title, sub, alt, section? } }; a card's picture is
// <subject>/img/<id>.jpg (node tools/cards.mjs draws them). cover: the id whose picture stands for the subject on the shelf.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { EXAMPLES, subjects } from './chapters.mjs';

const CHECK = process.argv.includes('--check');
// the shelf's order and the subjects still in preparation, so the root page shows the whole plan
const SHELF = [
  ['physics', 'Physics', 'mechanics, electricity and magnetism'],
  ['maths', 'Mathematics', 'trigonometry, calculus, linear algebra'],
  ['statistics', 'Statistics', 'probability, sampling, inference'],
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

function rootPage(all) {
  const byId = Object.fromEntries(all.map(s => [s.id, s]));
  const cards = SHELF.map(([id, name, blurb]) => {
    const s = byId[id], items = s ? [...(s.chapters || []), ...(s.figures || [])] : [];
    if (!items.length) return `    <div class="card soon"><div class="no"><span>in preparation</span></div><h2>${name}</h2><i>${blurb}</i><span class="wait">coming</span></div>`;
    const first = s.cover || items[0], img = fs.existsSync(path.join(EXAMPLES, id, 'img', `${first}.jpg`)) ? `\n      <img src="${id}/img/${first}.jpg" alt="${esc(s.cards?.[first]?.alt || '')}">` : '';
    const count = `${items.length} ${items.length === 1 ? (s.chapters?.length ? 'chapter' : 'figure') : (s.figures?.length && !s.chapters?.length ? 'figures' : 'chapters')}`;
    return `    <a class="card" href="${id}/"><div class="no"><span>${count}</span></div><h2>${name}</h2><i>${esc(s.blurb || blurb)}</i>${img}</a>`;
  });
  return head('Atlas', '../') + `<body>
${GENERATED}  <header><b>Atlas</b><span>Ideas, taken apart</span></header>
  <section class="hero">
    <h1>Every subject, taken apart.</h1>
    <p>Each idea as one working figure: a model you can check, a thing you can move</p>
  </section>
  <section class="shelf">
${cards.join('\n')}
  </section>
  <p class="foot"><a href="concepts/">Every idea, and the figures that show it</a></p>
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
  for (const s of all) {
    if (s.id === 'minimal') continue;
    const subjName = s.name.replace(/^Atlas of /, '');
    for (const c of s.chapters || []) {
      const card = s.cards?.[c] || {};
      entries.push({ kind: 'chapter', subject: subjName, title: card.title || c, sub: card.sub || '', text: card.alt || '', href: `${s.id}/${c}/` });
      const pFile = path.join(EXAMPLES, s.id, c, 'pages.js');
      if (fs.existsSync(pFile)) {
        const src = fs.readFileSync(pFile, 'utf8');
        [...src.matchAll(/kicker:\s*'([^']*)',\s*title:\s*'([^']*)'/g)].forEach(([, k, t], i) => {
          entries.push({ kind: 'page', subject: subjName, title: t, sub: `${card.title || c} · ${k}`, href: `${s.id}/${c}/#${i}` });
        });
      }
      const qFile = path.join(EXAMPLES, s.id, c, 'practice.js');
      if (fs.existsSync(qFile)) {
        try {
          const { PRACTICE } = await import(pathToFileURL(qFile).href);
          for (const [pg, qs] of Object.entries(PRACTICE || {})) {
            for (const q of qs) {
              const qText = strip(q.q || '');
              if (qText) entries.push({ kind: 'practice', subject: subjName, title: qText.slice(0, 110), sub: `${card.title || c} · p.${+pg + 1}`, text: qText, href: `${s.id}/${c}/#${pg}` });
            }
          }
        } catch {}
      }
    }
    for (const f of s.figures || []) {
      const card = s.cards?.[f] || {};
      entries.push({ kind: card.grammar || 'figure', subject: subjName, title: card.title || f, sub: card.sub || '', text: card.alt || '', href: `${s.id}/${f}/` });
    }
  }
  const cDir = path.join(EXAMPLES, 'concepts');
  if (fs.existsSync(cDir)) {
    const files = fs.readdirSync(cDir).filter(f => f.endsWith('.js') && f !== 'threads.js').sort();
    for (const file of files) {
      const subjId = file.slice(0, -3);
      const subjName = subjId === 'maths' ? 'Mathematics' : subjId[0].toUpperCase() + subjId.slice(1);
      const { CONCEPTS } = await import(pathToFileURL(path.join(cDir, file)).href);
      for (const c of CONCEPTS) {
        const firstRef = c.shownIn?.[0];
        let href = `concepts/#${c.id}`;
        if (firstRef) {
          const parts = firstRef.split('/');
          href = parts.length === 3 ? `${parts[0]}/${parts[1]}/#${parts[2]}` : `${parts[0]}/${parts[1]}/`;
        }
        entries.push({ kind: 'concept', subject: subjName, title: c.name, formula: strip(c.formula || ''), formulaHtml: c.formula || '', href });
      }
    }
  }
  return `// written by tools/site.mjs — do not edit by hand\nexport const SEARCH_INDEX = ${JSON.stringify(entries, null, 2)};\n`;
}

const all = await subjects();
const pages = [
  ['index.html', rootPage(all)],
  ...all.filter(s => s.contents !== false).map(s => [`${s.id}/index.html`, subjectPage(s)]),
  ['search-index.js', await searchIndexJs(all)],
];
let stale = 0;
for (const [file, html] of pages) {
  const p = path.join(EXAMPLES, file), now = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
  if (now === html) { console.log('same   ', file); continue; }
  if (CHECK) { stale++; console.log('STALE  ', file); continue; }
  fs.writeFileSync(p, html); console.log('wrote  ', file);
}
if (stale) { console.log('run: node tools/site.mjs'); process.exit(1); }
