// node tools/scene.mjs [subject/chapter …] [--intersections] — cli/scene.mjs over the atlas's examples (all, or those named).
import { everything, key } from './chapters.mjs';
import { scene } from '../cli/scene.mjs';

const args = process.argv.slice(2);
const intersections = args.includes('--intersections');
const only = args.filter(a => !a.startsWith('--'));
process.exit(await scene(only.length ? only.map(key) : await everything(), { intersections }) ? 1 : 0);
