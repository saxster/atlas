// Every chapter (a book: book.js) and figure (a machine or an explorer) of every subject, as 'subject/id' paths from
// the site root, in each subject's order. A subject is a top-level directory with a subject.js manifest listing
// chapters: [...] and figures: [...]. node tools/chapters.mjs prints them all.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

export async function subjects() {
  const dirs = fs.readdirSync(ROOT).filter(d => fs.existsSync(path.join(ROOT, d, 'subject.js'))).sort();
  return Promise.all(dirs.map(async d => (await import(pathToFileURL(path.join(ROOT, d, 'subject.js')).href)).SUBJECT));
}

export async function chapters() {
  return (await subjects()).flatMap(s => (s.chapters || []).map(c => `${s.id}/${c}`));
}
export async function figures() {
  return (await subjects()).flatMap(s => (s.figures || []).map(c => `${s.id}/${c}`));
}
// books and figures alike: everything with a model to check and a ?render tour to draw
export async function everything() {
  return (await subjects()).flatMap(s => [...(s.chapters || []), ...(s.figures || [])].map(c => `${s.id}/${c}`));
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) console.log((await everything()).join('\n'));
