// node tools/labels.mjs [subject/chapter …] — cli/labels.mjs over the atlas's examples (all, or those named).
import { everything, key } from './chapters.mjs';
import { labels } from '../cli/labels.mjs';

const only = process.argv.slice(2);
process.exit(await labels(only.length ? only.map(key) : await everything()) ? 1 : 0);
