// node tools/stills.mjs <out-dir> [subject/chapter …] — cli/stills.mjs over the atlas's examples (all, or those named).
import { everything, key } from './chapters.mjs';
import { stills } from '../cli/stills.mjs';

const [out, ...only] = process.argv.slice(2);
process.exit(await stills(out, only.length ? only.map(key) : await everything()) ? 1 : 0);
