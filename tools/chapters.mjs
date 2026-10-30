// Every chapter (a book: book.js) and figure (a machine or an explorer) of every example subject, as
// 'examples/subject/id' paths from the repo root (which is also the site root), in each subject's order. A subject is
// a directory of examples/ with a subject.js manifest listing chapters: [...] and figures: [...].
// node tools/chapters.mjs prints them all. key('physics/newton') gives 'examples/physics/newton', so tools take either.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
export const EXAMPLES = path.join(ROOT, 'examples');
export const key = c => c.replace(/\/$/, '').startsWith('examples/') ? c.replace(/\/$/, '') : `examples/${c.replace(/\/$/, '')}`;

export async function subjects() {
  const dirs = fs.readdirSync(EXAMPLES).filter(d => fs.existsSync(path.join(EXAMPLES, d, 'subject.js'))).sort();
  return Promise.all(dirs.map(async d => (await import(pathToFileURL(path.join(EXAMPLES, d, 'subject.js')).href)).SUBJECT));
}

export async function chapters() {
  return (await subjects()).flatMap(s => (s.chapters || []).map(c => `examples/${s.id}/${c}`));
}
export async function figures() {
  return (await subjects()).flatMap(s => (s.figures || []).map(c => `examples/${s.id}/${c}`));
}
// books and figures alike: everything with a model to check and a ?render tour to draw
export async function everything() {
  return (await subjects()).flatMap(s => [...(s.chapters || []), ...(s.figures || [])].map(c => `examples/${s.id}/${c}`));
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) console.log((await everything()).join('\n'));
