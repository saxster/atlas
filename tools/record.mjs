// node tools/record.mjs <subject/id> [--out videos] [--size 1920x1080] [--fps 60] [--silent]
// Records a chapter's or figure's ?render tour as an MP4: every frame is drawn by seek(i / fps), so the video is the
// same every run, however slow the machine. Frames go straight to ffmpeg (H.264, yuv420p, faststart). Then:
//   <name>.timeline.json  the tour's duration, page or step starts and designed events (tools/score.mjs reads it)
//   <name>.sheet.jpg      a contact sheet, one frame every 3 s, to read the whole video at a glance
//   unless --silent, tools/score.mjs scores it: <name>.mp4 gets a code-made soundtrack at −14 LUFS.
// Checks its own output: the frame count must be round(DURATION × fps). Needs ffmpeg and ffprobe on PATH.
import fs from 'node:fs';
import path from 'node:path';
import { spawn, execFileSync } from 'node:child_process';
import { serve, launch, open } from './render.mjs';
import { ROOT } from './chapters.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i < 0 ? d : args[i + 1]; };
const target = args.find(a => !a.startsWith('--') && !args[args.indexOf(a) - 1]?.startsWith('--'));
if (!target) { console.log('usage: node tools/record.mjs <subject/id> [--out dir] [--size WxH] [--fps n] [--silent]'); process.exit(2); }
const [W, H] = opt('--size', '1920x1080').split('x').map(Number), FPS = +opt('--fps', 60);
const outDir = path.resolve(opt('--out', path.join(ROOT, 'videos'))); fs.mkdirSync(outDir, { recursive: true });
const name = target.replace('/', '-'), video = path.join(outDir, `${name}.mp4`), silent = path.join(outDir, `${name}.silent.mp4`);

const { server, base } = serve(), browser = await launch();
const R = await open(browser, base, target, W, H);
const frames = Math.round(R.duration * FPS);
const timeline = { target, duration: R.duration, fps: FPS, size: [W, H], starts: R.starts,
  events: await R.page.evaluate(() => window.__atlas.events || []) };
fs.writeFileSync(path.join(outDir, `${name}.timeline.json`), JSON.stringify(timeline, null, 1));

const ff = spawn('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', silent], { stdio: ['pipe', 'inherit', 'inherit'] });
const done = new Promise((ok, fail) => ff.on('close', c => c ? fail(new Error('ffmpeg exited ' + c)) : ok()));
const t0 = Date.now();
for (let i = 0; i < frames; i++) {
  await R.seek(i / FPS);
  const buf = await R.page.screenshot({ type: 'jpeg', quality: 95, optimizeForSpeed: true });
  if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  if (i % (FPS * 5) === 0) process.stdout.write(`\r${target} ${(i / FPS).toFixed(0)}/${R.duration.toFixed(0)} s`);
}
ff.stdin.end(); await done;
await browser.close(); server.close();
console.log(`\r${target}: ${frames} frames in ${((Date.now() - t0) / 1000).toFixed(0)} s${R.errors.length ? ' ERRORS ' + R.errors.join(' | ') : ''}`);

// the gate: exactly DURATION × fps frames
const counted = +execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-count_frames', '-show_entries', 'stream=nb_read_frames', '-of', 'csv=p=0', silent]).toString().replace(/[^0-9]/g, '');
console.log(counted === frames ? 'PASS' : 'FAIL', `frame count ${counted}, expected ${frames}`);
execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', silent, '-vf', `fps=1/3,scale=480:-1,tile=4x${Math.ceil(R.duration / 3 / 4)}`, '-frames:v', '1', '-q:v', '4', path.join(outDir, `${name}.sheet.jpg`)]);

if (args.includes('--silent')) fs.renameSync(silent, video);
else execFileSync(process.execPath, [path.join(ROOT, 'tools', 'score.mjs'), path.join(outDir, `${name}.timeline.json`), silent, video], { stdio: 'inherit' });
console.log('wrote', path.relative(process.cwd(), video));
process.exit(counted === frames && !R.errors.length ? 0 : 1);
