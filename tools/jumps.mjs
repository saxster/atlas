// node tools/jumps.mjs [subject/chapter …] [--step 0.1] [--frames dir] — cli/jumps.mjs over the atlas's examples.
import { everything, key } from './chapters.mjs';
import { jumps } from '../cli/jumps.mjs';

const args = process.argv.slice(2), si = args.indexOf('--step');
const step = si >= 0 ? +args.splice(si, 2)[1] : 0.1;
const fi = args.indexOf('--frames'), frames = fi >= 0 ? args.splice(fi, 2)[1] : null;
process.exit(await jumps(args.length ? args.map(key) : await everything(), { step, frames }) ? 1 : 0);
