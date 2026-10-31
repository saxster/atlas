// node tools/record.mjs <subject/id> [--out videos] [--size 1920x1080] [--fps 60] [--samples 1] [--shutter 0.5] [--loop] [--silent] — cli/record.mjs on an
// atlas example.
import path from 'node:path';
import { ROOT, key } from './chapters.mjs';
import { record } from '../cli/record.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i < 0 ? d : args.splice(i, 2)[1]; };
const flag = k => { const i = args.indexOf(k); return i >= 0 && args.splice(i, 1).length > 0; };
const o = {
  out: opt('--out', path.join(ROOT, 'videos')),
  size: opt('--size', '1920x1080'),
  fps: +opt('--fps', 60),
  samples: +opt('--samples', 1),
  shutter: +opt('--shutter', 0.5),
  loop: flag('--loop'),
  silent: flag('--silent'),
};
const target = args.find(a => !a.startsWith('--'));
if (!target) {
  console.log('usage: node tools/record.mjs <subject/id> [--out dir] [--size WxH] [--fps n] [--samples n] [--shutter f] [--loop] [--silent]');
  process.exit(2);
}
const ok = await record(key(target), o);
process.exit(ok ? 0 : 1);
