#!/usr/bin/env node
// atlas new <subject>/<id> [--grammar book|machine|explorer]
// Starts a figure by copying the matching minimal example (examples/minimal/<grammar>/), so the starting point is a
// working, checked figure, and adds it to <subject>/subject.js (made if missing). Inside the atlas repo the figure
// goes in examples/<subject>/<id>/; anywhere else, in ./<subject>/<id>/ with its links pointed at the installed
// package (node_modules/@saxster/atlas).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GRAMMARS = { book: 'chapters', machine: 'figures', explorer: 'figures' };
const [cmd, target, ...rest] = process.argv.slice(2);
const opt = (k, d) => { const i = rest.indexOf(k); return i < 0 ? d : rest[i + 1]; };
const fail = msg => { console.error(msg); process.exit(1); };

if (cmd !== 'new' || !/^[a-z][\w-]*\/[a-z][\w-]*$/.test(target || '')) {
  console.log('usage: atlas new <subject>/<id> [--grammar book|machine|explorer]\n  e.g. atlas new biology/heart --grammar machine');
  process.exit(cmd ? 1 : 0);
}
const grammar = opt('--grammar', 'book');
if (!GRAMMARS[grammar]) fail(`--grammar must be one of ${Object.keys(GRAMMARS).join(', ')}`);
const [subject, id] = target.split('/');

const cwd = process.cwd();
const ownPkg = f => { try { return JSON.parse(fs.readFileSync(path.join(f, 'package.json'), 'utf8')).name === '@saxster/atlas'; } catch { return false; } };
const inRepo = ownPkg(cwd);
const pkg = inRepo ? cwd : path.join(cwd, 'node_modules', '@saxster', 'atlas');
if (!ownPkg(pkg)) fail('Install the library first, so the figure can link to it:\n  npm install github:saxster/atlas three');
const base = inRepo ? path.join(cwd, 'examples') : cwd;
const src = path.join(HERE, 'examples', 'minimal', grammar), dest = path.join(base, subject, id);
if (!fs.existsSync(src)) fail(`no template at ${src}`);
if (fs.existsSync(dest)) fail(`${path.relative(cwd, dest)} already exists`);

// copy, re-pointing every relative link that leaves the template folder at the same file in the installed package
const LINK = /((?:href|src)=")(\.{1,2}\/[^"]*)(")|("@saxster\/atlas\/(?:adapters\/)?":\s*")(\.{1,2}\/[^"]*)(")/g;
const relink = (text, from) => text.replace(LINK, (m, a1, p1, z1, a2, p2, z2) => {
  const [pre, link, post] = a1 ? [a1, p1, z1] : [a2, p2, z2];
  const abs = path.resolve(path.dirname(path.join(src, from)), link);
  if (abs.startsWith(src + path.sep) || abs === src || abs.startsWith(path.join(HERE, 'examples', 'minimal') + path.sep)) return m;
  let r = path.relative(path.dirname(path.join(dest, from)), path.join(pkg, path.relative(HERE, abs)));
  if (link.endsWith('/') && !r.endsWith('/')) r += '/';
  return pre + (r.startsWith('.') ? r : './' + r) + post;
});
const copy = rel => {
  const s = path.join(src, rel), d = path.join(dest, rel);
  if (fs.statSync(s).isDirectory()) { fs.mkdirSync(d, { recursive: true }); for (const f of fs.readdirSync(s)) copy(path.join(rel, f)); return; }
  fs.writeFileSync(d, rel.endsWith('.html') ? relink(fs.readFileSync(s, 'utf8'), rel) : fs.readFileSync(s));
};
copy('');

// the subject's manifest: made if missing, the new id added to its chapters (books) or figures
const manifest = path.join(base, subject, 'subject.js'), list = GRAMMARS[grammar];
if (!fs.existsSync(manifest)) {
  const name = subject[0].toUpperCase() + subject.slice(1);
  fs.writeFileSync(manifest, `// The ${name} atlas: its chapters (books) and figures (machines and explorers), in order.
export const SUBJECT = {
  id: '${subject}',
  name: 'Atlas of ${name}',
  chapters: [],
  figures: [],
  links: [],
  xrefs: [],
};
`);
}
const m = fs.readFileSync(manifest, 'utf8'), re = new RegExp(`(${list}:\\s*\\[)([^\\]]*)\\]`);
if (!re.test(m)) fail(`${path.relative(cwd, manifest)} has no ${list}: [...] list; add '${id}' to it by hand`);
fs.writeFileSync(manifest, m.replace(re, (all, open, items) => `${open}${items.trim() ? `${items.trim().replace(/,$/, '')}, ` : ''}'${id}']`));
await import(pathToFileURL(manifest).href);   // the manifest must still parse

const rel = path.relative(cwd, dest);
console.log(`Made ${rel}/ (a ${grammar}, from examples/minimal/${grammar}) and added '${id}' to ${path.relative(cwd, manifest)}.
Next:
  1. Write the model: ${rel}/model.js, and prove it a second way in ${rel}/checks.mjs (node ${rel}/checks.mjs)
  2. Draw it: ${rel}/world.js, from the building blocks in @saxster/atlas/prims.js
  3. Serve this folder (python3 -m http.server 8137) and open http://localhost:8137/${rel.split(path.sep).join('/')}/`);
