// node tools/record.mjs <subject/id> [--out videos] [--size 1920x1080] [--fps 60] [--silent] — cli/record.mjs on an
// atlas example.
import path from 'node:path';
import { ROOT, key } from './chapters.mjs';
import { record } from '../cli/record.mjs';

const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf(k); return i < 0 ? d : args[i + 1]; };
const target = args.find((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'));
if (!target) { console.log('usage: node tools/record.mjs <subject/id> [--out dir] [--size WxH] [--fps n] [--silent]'); process.exit(2); }
const ok = await record(key(target), { out: opt('--out', path.join(ROOT, 'videos')), size: opt('--size', '1920x1080'), fps: +opt('--fps', 60), silent: args.includes('--silent') });
process.exit(ok ? 0 : 1);
