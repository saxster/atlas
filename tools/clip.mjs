// node tools/clip.mjs [subject/chapter …] [--selftest] — cli/clip.mjs over the atlas's examples (all, or those named).
import { everything, key } from './chapters.mjs';
import { clip, selftest } from '../cli/clip.mjs';

const args = process.argv.slice(2);
if (args.includes('--selftest')) process.exit(await selftest());
const only = args.filter(a => !a.startsWith('--'));
process.exit(await clip(only.length ? only.map(key) : await everything()) ? 1 : 0);
