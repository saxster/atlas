// node tools/vendor.mjs <dest> <subject/chapter …> [--check] — copy what a textbook needs to embed these chapters'
// figures into <dest> (a book's live/atlas/): the kym adapter and every file it and each chapter.js import, found
// by following relative imports, with the licences and a VERSION naming the atlas commit. A copy, not a package,
// because the books bundle offline with their own three.js and esbuild follows relative imports into the copy.
// --check: exit 1 if <dest> differs from what would be written (run it in the book before publishing).
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT, key } from './chapters.mjs';

const args = process.argv.slice(2), check = args.includes('--check');
const [dest, ...chArgs] = args.filter(a => a !== '--check'), chapters = chArgs.map(key);
if (!dest || !chapters.length) { console.error('usage: node tools/vendor.mjs <dest> <subject/chapter …> [--check]'); process.exit(2); }

// the closure of imports from the entry files: relative ones, and the library's own ('@saxster/atlas/…')
const SPEC = /((?:from|import)\s*\(?\s*)(['"])((?:\.{1,2}\/|@saxster\/atlas\/)[^'"]+)\2/g;
const target = (from, spec) => spec.startsWith('@saxster/atlas/')
  ? (spec.startsWith('@saxster/atlas/adapters/') ? spec.slice('@saxster/atlas/'.length) : 'engine/' + spec.slice('@saxster/atlas/'.length))
  : path.normalize(path.join(path.dirname(from), spec));
const files = new Set();
const walk = rel => {
  if (files.has(rel)) return;
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) throw new Error(`missing ${rel}`);
  files.add(rel);
  // imports only: block comments and whole-line comments (a usage example) are not code
  const src = fs.readFileSync(abs, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  for (const [, , , spec] of src.matchAll(SPEC)) walk(target(rel, spec));
};
walk('adapters/kym-live.js');
for (const c of chapters) walk(path.join(c, 'chapter.js'));
// in the book's copy, examples sit at the top (physics/oscillations/…) and every import is relative, for its bundler
const placed = rel => rel.replace(/^examples\//, '');
const relink = (rel, buf) => {
  if (!/\.m?js$/.test(rel)) return buf;
  return Buffer.from(buf.toString('utf8').replace(SPEC, (m, pre, q, spec) => {
    let r = path.relative(path.dirname(placed(rel)), placed(target(rel, spec)));
    if (!r.startsWith('.')) r = './' + r;
    return pre + q + r + q;
  }));
};
const commit = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: ROOT }).toString().trim();
const dirty = execFileSync('git', ['status', '--porcelain', '--', ...files], { cwd: ROOT }).toString().trim() ? ' (with uncommitted changes)' : '';
const out = new Map([...files].sort().map(f => [placed(f), relink(f, fs.readFileSync(path.join(ROOT, f)))]));
out.set('LICENSE', fs.readFileSync(path.join(ROOT, 'LICENSE')));
out.set('VERSION', Buffer.from(`Atlas (github.com/saxster/atlas) at ${commit}${dirty}, vendored by tools/vendor.mjs.\n` +
  `Chapters: ${chArgs.join(' ')}\nDo not edit these files here: change the atlas, then run\n` +
  `  node tools/vendor.mjs <this directory> ${chArgs.join(' ')}\nin the atlas. Code MIT (LICENSE); Atlas of Physics (c) 2026 Nathan Liow.\n`));

if (check) {
  const stale = [];
  for (const [f, buf] of out) { if (f === 'VERSION') continue; const p = path.join(dest, f); if (!fs.existsSync(p) || !fs.readFileSync(p).equals(buf)) stale.push(f); }
  const walkDest = d => fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walkDest(path.join(d, e.name)) : [path.relative(dest, path.join(d, e.name))]) : [];
  const extra = walkDest(dest).filter(f => !out.has(f));
  if (stale.length || extra.length) { console.log(`stale: ${stale.join(' ') || '-'}\nextra: ${extra.join(' ') || '-'}`); process.exit(1); }
  console.log(`${dest}: up to date with the atlas (${out.size} files)`); process.exit(0);
}
fs.rmSync(dest, { recursive: true, force: true });
for (const [f, buf] of out) { const p = path.join(dest, f); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, buf); }
console.log(`${out.size} files → ${dest} (atlas ${commit}${dirty})`);
for (const f of out.keys()) console.log('  ' + f);
