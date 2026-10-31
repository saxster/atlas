// create('<subject>/<id>', { grammar }): atlas new.
// Starts a figure by copying the matching minimal example (examples/minimal/<grammar>/), so the starting point is a
// working, checked figure, and adds it to <subject>/subject.js (made if missing). Inside the atlas repo the figure
// goes in examples/<subject>/<id>/; anywhere else, in ./<subject>/<id>/ with its links pointed at the installed
// package (node_modules/@saxster/atlas).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GRAMMARS = { book: 'chapters', machine: 'figures', explorer: 'figures', sandbox: 'figures' };
const fail = msg => { throw Object.assign(new Error(msg), { usage: true }); };

export async function create(target, { grammar = 'book' } = {}) {
  if (!/^[a-z][\w-]*\/[a-z][\w-]*$/.test(target || '')) fail('give the figure as <subject>/<id>, e.g. biology/heart');
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
  // the figures are ES modules: in a project whose package.json doesn't say so, the subject's folder does
  const nearestPkg = d => fs.existsSync(path.join(d, 'package.json')) ? path.join(d, 'package.json') : path.dirname(d) === d ? null : nearestPkg(path.dirname(d));
  const esm = f => { try { return JSON.parse(fs.readFileSync(f, 'utf8')).type === 'module'; } catch { return false; } };
  const near = nearestPkg(path.join(base, subject));
  if (!near || !esm(near)) fs.writeFileSync(path.join(base, subject, 'package.json'), '{ "type": "module" }\n');
  const m = fs.readFileSync(manifest, 'utf8'), re = new RegExp(`(${list}:\\s*\\[)([^\\]]*)\\]`);
  if (!re.test(m)) fail(`${path.relative(cwd, manifest)} has no ${list}: [...] list; add '${id}' to it by hand`);
  fs.writeFileSync(manifest, m.replace(re, (all, open, items) => `${open}${items.trim() ? `${items.trim().replace(/,$/, '')}, ` : ''}'${id}']`));
  await import(pathToFileURL(manifest).href);   // the manifest must still parse

  const rel = path.relative(cwd, dest);
  console.log(`Made ${rel}/ (${grammar === 'explorer' ? 'an' : 'a'} ${grammar}, from examples/minimal/${grammar}) and added '${id}' to ${path.relative(cwd, manifest)}.
Next:
  1. Write the model: ${rel}/model.js, and prove it a second way in ${rel}/checks.mjs (npx atlas check ${rel})
  2. Draw it: ${rel}/world.js, from the building blocks in @saxster/atlas/prims.js
  3. Look at it: npx atlas stills shots ${rel.split(path.sep).join('/')}, or serve this folder (python3 -m http.server 8137)
     and open http://localhost:8137/${rel.split(path.sep).join('/')}/`);
}
