// node concepts/build.mjs [--check] — writes concepts/index.html: every idea, its formula, and the figures that show
// it, across subjects. Threads (threads.js) lead: one idea seen in several subjects. Then each subject's own list.
// --check builds nothing; it fails on a bad link or a stale page (tools/check.mjs runs it).
//
// concepts/<subject>.js exports CONCEPTS: [{ id, name, formula (HTML), shownIn: [refs], level? }]
//   a ref is subject/chapter/page (a book's page) or subject/figure (a machine or an explorer);
//   shownIn: [] marks an idea no figure shows yet, so the gaps stay visible.
// Book page labels come from each chapter's pages.js (kicker + title), figure labels from subject.js cards.
// Also checked here: every engine/xrefs.js pair points at a page that exists, so cross-subject links can't rot.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { EXAMPLES as ROOT, subjects } from '../../tools/chapters.mjs';
import { THREADS } from './threads.js';
import { XREFS } from '../xrefs.js';

const CHECK = process.argv.includes('--check');
const all = await subjects();
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

// ---------- what can be linked to ----------
const targets = {};   // ref → { label, href (from concepts/) }
for (const s of all) {
  for (const c of s.chapters || []) {
    const src = fs.readFileSync(path.join(ROOT, s.id, c, 'pages.js'), 'utf8');
    [...src.matchAll(/kicker:\s*'([^']*)',\s*title:\s*'([^']*)'/g)].forEach(([, k, t], i) => {
      const no = k.startsWith('Chapter') ? 'Ch. ' + k.split(' ')[1] : k.split(' ')[0];
      targets[`${s.id}/${c}/${i}`] = { label: `${no} ${t}`, href: `../${s.id}/${c}/#${i}` };
    });
  }
  for (const f of s.figures || []) targets[`${s.id}/${f}`] = { label: `Fig. ${s.cards?.[f]?.title || f}`, href: `../${s.id}/${f}/` };
}

// ---------- the concepts ----------
// a subject may have ideas before it has a figure (biology): its file is read all the same, in the shelf's order
const ORDER = ['physics', 'maths', 'statistics', 'chemistry', 'economics', 'biology'];
const NAMES = { ...Object.fromEntries(ORDER.map(id => [id, id[0].toUpperCase() + id.slice(1)])), maths: 'Mathematics',
  ...Object.fromEntries(all.map(s => [s.id, s.name.replace(/^Atlas of /, '')])) };
const files = fs.readdirSync(path.join(ROOT, 'concepts')).filter(f => f.endsWith('.js') && f !== 'threads.js').map(f => f.slice(0, -3))
  .sort((a, b) => (ORDER.indexOf(a) + 1 || 99) - (ORDER.indexOf(b) + 1 || 99));
const bySubject = [], byId = {}, problems = [];
for (const subject of files) {
  const { CONCEPTS } = await import(pathToFileURL(path.join(ROOT, 'concepts', `${subject}.js`)).href);
  bySubject.push({ subject, concepts: CONCEPTS });
  for (const c of CONCEPTS) {
    if (byId[c.id]) problems.push(`concept ${c.id} is defined twice`);
    byId[c.id] = { ...c, subject };
    if (!Array.isArray(c.shownIn)) problems.push(`concept ${c.id} has no shownIn list (use [] for "not shown yet")`);
    for (const r of c.shownIn || []) if (!targets[r]) problems.push(`concept ${c.id}: no page ${r}`);
  }
}
for (const t of THREADS) for (const id of t.concepts) if (!byId[id]) problems.push(`thread ${t.id}: no concept ${id}`);
for (const [a, , b] of XREFS) for (const r of [a, b]) if (!targets[r]) problems.push(`engine/xrefs.js: no page ${r}`);
if (problems.length) { for (const p of problems) console.log('FAIL', p); process.exit(1); }

const chips = c => c.shownIn.length
  ? c.shownIn.map(r => `<a href="${targets[r].href}"><span class="subj">${esc(NAMES[r.split('/')[0]])}</span>${esc(targets[r].label)}</a>`).join('')
  : '<span class="none">not shown yet</span>';
const row = c => `      <li class="${c.shownIn.length ? '' : 'unshown'}" id="${c.id}"><div class="e">${c.formula}</div><div class="m"><div class="n">${esc(c.name)}<span class="home">${esc(NAMES[c.subject])}</span></div><div class="chips">${chips(c)}</div></div></li>`;

const threads = THREADS.map(t => `  <section class="group thread" id="thread-${t.id}">
    <h3>${esc(t.name)}</h3>
    <p class="idea">${esc(t.idea)}</p>
    <ul>
${t.concepts.map(id => row(byId[id])).join('\n')}
    </ul>
  </section>`).join('\n');
const inThread = new Set(THREADS.flatMap(t => t.concepts));
const subjectsHtml = bySubject.map(({ subject, concepts }) => `  <section class="group" id="${subject}">
    <h3>${esc(NAMES[subject])}</h3>
    <ul>
${concepts.map(c => row({ ...c, subject })).join('\n')}
    </ul>
  </section>`).join('\n');
const shown = Object.values(byId).filter(c => c.shownIn.length).length, total = Object.keys(byId).length;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Concepts · Atlas</title>
<link rel="icon" href="data:,">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Inter:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../../engine/atlas.css">
<link rel="stylesheet" href="concepts.css">
</head>
<body>
<!-- written by concepts/build.mjs from concepts/*.js: edit those, then run it -->
  <header><a href="../">Atlas</a><span>${shown} of ${total} ideas have a figure</span></header>
  <section class="hero">
    <h1>One idea, many subjects.</h1>
    <p>Every idea in the atlases, and the figures that show it</p>
  </section>
  <nav><div class="in"><a href="#threads">Threads</a>${bySubject.map(b => `<a href="#${b.subject}">${esc(NAMES[b.subject])}</a>`).join('')}<a href="../physics/equations/">AP equation sheets</a></div></nav>
  <main>
  <h2 class="part" id="threads">Threads</h2>
${threads}
  <h2 class="part">By subject</h2>
${subjectsHtml}
  </main>
</body>
</html>
`;

const out = path.join(ROOT, 'concepts', 'index.html');
const same = fs.existsSync(out) && fs.readFileSync(out, 'utf8') === html;
if (CHECK) {
  console.log(same ? 'PASS' : 'FAIL', `concepts/index.html ${same ? 'is current' : 'is stale: run node concepts/build.mjs'}`);
  console.log('PASS', `${total} concepts in ${THREADS.length} threads, ${shown} shown, every link resolves; ${XREFS.length} xrefs resolve`);
  process.exit(same ? 0 : 1);
}
fs.writeFileSync(out, html);
console.log(`wrote concepts/index.html: ${total} concepts (${shown} shown, ${[...inThread].length} in threads), ${XREFS.length} xrefs checked`);
