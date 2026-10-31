// record(figure, { out = 'videos', size = '1920x1080', fps = 60, silent = false, samples = 1, shutter = 0.5, loop = false })
// Records a chapter's or figure's ?render tour as an MP4: every frame is drawn by seek(i / fps), so the video is the
// same every run, however slow the machine. When samples > 1, averages sub-frames across the shutter window [t - 0.5*shutter/fps, t + 0.5*shutter/fps]
// for temporal motion blur. Frames go straight to ffmpeg (H.264, yuv420p, explicit BT.709 color tags, faststart). Then:
//   <name>.timeline.json  the tour's duration, page or step starts and designed events (score.mjs reads it)
//   <name>.sheet.jpg      a contact sheet, one frame every 3 s, to read the whole video at a glance
//   unless silent, score.mjs (beside this file) scores it: <name>.mp4 gets a code-made soundtrack at −14 LUFS.
// Checks its own output via qaVideo(): frame count, BT.709 color tags, photosensitivity (<= 3 luminance flips/s),
// and optional loop seam continuity. Needs ffmpeg and ffprobe on PATH.
// Returns true when all QA checks pass and the page logged no errors.
import fs from 'node:fs';
import path from 'node:path';
import { spawn, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { serve, launch, open } from './render.mjs';

export function qaVideo(file, { expectedFrames, fps = 60, checkSeam = false, loop = false } = {}) {
  const verifySeam = checkSeam || loop;
  const findings = [];
  const counted = +execFileSync('ffprobe', [
    '-v', 'error', '-select_streams', 'v:0', '-count_frames',
    '-show_entries', 'stream=nb_read_frames', '-of', 'csv=p=0', file,
  ]).toString().replace(/[^0-9]/g, '');
  if (expectedFrames != null && counted !== expectedFrames) {
    findings.push(`frame count ${counted}, expected ${expectedFrames}`);
  }

  // Explicit BT.709 color tagging check
  const colorRaw = execFileSync('ffprobe', [
    '-v', 'error', '-select_streams', 'v:0',
    '-show_entries', 'stream=color_space,color_primaries,color_transfer',
    '-of', 'json', file,
  ]).toString();
  const stream = JSON.parse(colorRaw).streams?.[0] || {};
  const csOk = stream.color_space === 'bt709' && stream.color_primaries === 'bt709' && stream.color_transfer === 'bt709';
  if (!csOk) {
    findings.push(`color tags (${stream.color_space}/${stream.color_primaries}/${stream.color_transfer}), expected bt709/bt709/bt709`);
  }

  // Downsampled 320px-wide grayscale frames for photosensitivity (Harding/ITU flash rate <= 3 flips/s) and loop-seam analysis
  const W_QA = 320, H_QA = 180, NPIX = W_QA * H_QA;
  const rawGray = execFileSync('ffmpeg', [
    '-v', 'error', '-i', file, '-vf', `scale=${W_QA}:${H_QA}`, '-f', 'rawvideo', '-pix_fmt', 'gray', '-',
  ], { maxBuffer: 128 * 1024 * 1024 });
  const nFrames = Math.floor(rawGray.length / NPIX);
  const means = new Float64Array(nFrames);
  const pairDiffs = new Float64Array(Math.max(0, nFrames - 1));
  for (let f = 0; f < nFrames; f++) {
    const off = f * NPIX;
    let sum = 0;
    for (let p = 0; p < NPIX; p++) sum += rawGray[off + p];
    means[f] = sum / NPIX;
    if (f > 0) {
      const prev = (f - 1) * NPIX;
      let d = 0;
      for (let p = 0; p < NPIX; p++) d += Math.abs(rawGray[off + p] - rawGray[prev + p]);
      pairDiffs[f - 1] = d / NPIX;
    }
  }

  // Photosensitivity check: count large full-frame luminance swings (|Δmean| > 64 on 0..255) within any 1-second window
  let maxFlashesPerSec = 0;
  const winFrames = Math.max(1, Math.round(fps));
  const flips = new Uint8Array(nFrames);
  for (let f = 1; f < nFrames; f++) {
    if (Math.abs(means[f] - means[f - 1]) > 64) flips[f] = 1;
  }
  let curFlips = 0;
  for (let f = 0; f < nFrames; f++) {
    curFlips += flips[f];
    if (f >= winFrames) curFlips -= flips[f - winFrames];
    if (curFlips > maxFlashesPerSec) maxFlashesPerSec = curFlips;
  }
  if (maxFlashesPerSec > 3) {
    findings.push(`photosensitivity: ${maxFlashesPerSec} luminance flashes/s (> 3 Hz limit)`);
  }

  // Loop-seam & duplicate-frame check (when checkSeam / --loop is enabled)
  let seamRatio = 1;
  if (verifySeam && nFrames >= 4) {
    const sorted = Array.from(pairDiffs).sort((a, b) => a - b);
    const typical = sorted[Math.floor(sorted.length * 0.5)] || 0;
    let lastToFirst = 0;
    const lastOff = (nFrames - 1) * NPIX;
    for (let p = 0; p < NPIX; p++) lastToFirst += Math.abs(rawGray[lastOff + p] - rawGray[p]);
    lastToFirst /= NPIX;
    const firstToSecond = pairDiffs[0] || 0;
    const seamPairMax = Math.max(lastToFirst, firstToSecond);
    // 5 neighboring steps near the seam: up to 3 before the end and 2 after the start
    const neighbors = [];
    for (let k = Math.max(0, pairDiffs.length - 3); k < pairDiffs.length; k++) neighbors.push(pairDiffs[k]);
    for (let k = 1; k < Math.min(3, pairDiffs.length); k++) neighbors.push(pairDiffs[k]);
    const neighborMean = neighbors.length ? neighbors.reduce((a, b) => a + b, 0) / neighbors.length : typical;
    const ref = Math.max(neighborMean, typical, 0.5);
    seamRatio = seamPairMax / ref;
    if (seamRatio > 2.0) {
      findings.push(`loop seam jump ratio ${seamRatio.toFixed(2)}x (> 2.0x neighbor step)`);
    }
    if (typical > 1.0 && lastToFirst < 0.2 * typical) {
      findings.push(`loop seam duplicate frame (seam diff ${lastToFirst.toFixed(2)} < 0.2 * typical ${typical.toFixed(2)})`);
    }
  }

  return {
    ok: findings.length === 0,
    counted,
    colorSpace: stream.color_space,
    maxFlashesPerSec,
    seamRatio,
    findings,
  };
}

export async function record(target, { out = 'videos', size = '1920x1080', fps = 60, silent: quiet = false, samples = 1, shutter = 0.5, loop = false } = {}) {
  const [W, H] = size.split('x').map(Number), FPS = +fps, SAMPLES = Math.max(1, Math.round(+samples || 1)), SHUTTER = +shutter || 0.5;
  const outDir = path.resolve(out); fs.mkdirSync(outDir, { recursive: true });
  const name = target.replace(/^examples\//, '').replaceAll('/', '-'), video = path.join(outDir, `${name}.mp4`), silent = path.join(outDir, `${name}.silent.mp4`);

  const { server, base } = serve(), browser = await launch();
  const R = await open(browser, base, target, W, H);
  const frames = Math.round(R.duration * FPS);
  const timeline = { target, duration: R.duration, fps: FPS, size: [W, H], starts: R.starts,
    events: await R.page.evaluate(() => window.__atlas.events || []) };
  fs.writeFileSync(path.join(outDir, `${name}.timeline.json`), JSON.stringify(timeline, null, 1));

  const ff = spawn('ffmpeg', [
    '-y', '-hide_banner', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
    '-vf', 'format=yuv420p,setparams=colorspace=bt709:color_primaries=bt709:color_trc=bt709:range=tv',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p',
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
    '-movflags', '+faststart', silent,
  ], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((ok, fail) => ff.on('close', c => c ? fail(new Error('ffmpeg exited ' + c)) : ok()));
  const t0 = Date.now();
  for (let i = 0; i < frames; i++) {
    const tCenter = i / FPS;
    if (SAMPLES > 1) {
      const subTimes = [];
      for (let s = 0; s < SAMPLES; s++) {
        const u = (s + 0.5) / SAMPLES - 0.5;
        let ts = tCenter + u * (SHUTTER / FPS);
        if (loop) ts = ((ts % R.duration) + R.duration) % R.duration;
        else ts = Math.max(0, Math.min(R.duration, ts));
        subTimes.push(ts);
      }
      for (let s = 0; s < subTimes.length; s++) {
        await R.seek(subTimes[s]);
        await R.page.evaluate((idx, total) => {
          const src = document.querySelector('canvas');
          if (!src) return;
          let acc = document.getElementById('__atlas_mblur');
          if (!acc) {
            acc = document.createElement('canvas');
            acc.id = '__atlas_mblur';
            acc.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:1;display:none';
            document.body.appendChild(acc);
          }
          if (idx === 0) {
            acc.style.display = 'none';
            acc.width = src.width; acc.height = src.height;
            const ctx = acc.getContext('2d');
            ctx.clearRect(0, 0, acc.width, acc.height);
          }
          const ctx = acc.getContext('2d');
          ctx.globalAlpha = 1 / (idx + 1);
          ctx.drawImage(src, 0, 0, acc.width, acc.height);
          if (idx === total - 1) {
            const r = src.getBoundingClientRect();
            acc.style.left = r.left + 'px'; acc.style.top = r.top + 'px';
            acc.style.width = r.width + 'px'; acc.style.height = r.height + 'px';
            acc.style.display = 'block';
          }
        }, s, subTimes.length);
      }
    } else {
      await R.seek(tCenter);
    }
    const buf = await R.page.screenshot({ type: 'jpeg', quality: 95, optimizeForSpeed: true });
    if (SAMPLES > 1) await R.page.evaluate(() => { const acc = document.getElementById('__atlas_mblur'); if (acc) acc.style.display = 'none'; });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % (FPS * 5) === 0) process.stdout.write(`\r${target} ${(i / FPS).toFixed(0)}/${R.duration.toFixed(0)} s`);
  }
  ff.stdin.end(); await done;
  await browser.close(); server.close();
  console.log(`\r${target}: ${frames} frames in ${((Date.now() - t0) / 1000).toFixed(0)} s${R.errors.length ? ' ERRORS ' + R.errors.join(' | ') : ''}`);

  const qa = qaVideo(silent, { expectedFrames: frames, fps: FPS, checkSeam: loop });
  console.log(qa.ok ? 'PASS' : 'FAIL', `video QA: ${qa.counted}/${frames} frames, color=${qa.colorSpace}, flashes=${qa.maxFlashesPerSec}/s${loop ? `, seam=${qa.seamRatio.toFixed(2)}x` : ''}${qa.findings.length ? ' (' + qa.findings.join('; ') + ')' : ''}`);

  const stamp = `drawtext=text='t=%{pts\\:flt}s':x=10:y=10:fontsize=16:fontcolor=white:box=1:boxcolor=black@0.65:boxborderw=4`;
  const sheetBase = `fps=1/3,scale=480:-1`, sheetTile = `tile=4x${Math.ceil(R.duration / 3 / 4)}`;
  try {
    execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', silent, '-vf', `${sheetBase},${stamp},${sheetTile}`, '-frames:v', '1', '-q:v', '4', path.join(outDir, `${name}.sheet.jpg`)], { stdio: 'ignore' });
  } catch {
    execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', silent, '-vf', `${sheetBase},${sheetTile}`, '-frames:v', '1', '-q:v', '4', path.join(outDir, `${name}.sheet.jpg`)], { stdio: 'ignore' });
  }
  if (R.starts?.length) {
    const beatFrames = [...new Set(R.starts.map(s => Math.min(frames - 1, Math.max(0, Math.round((s + 0.3) * FPS)))))];
    const sel = beatFrames.map(n => `eq(n\\,${n})`).join('+');
    const cols = Math.min(4, beatFrames.length), rows = Math.ceil(beatFrames.length / cols);
    try {
      execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', silent, '-vf', `select='${sel}',scale=480:-1,${stamp},tile=${cols}x${rows}`, '-fps_mode', 'passthrough', '-frames:v', '1', '-q:v', '4', path.join(outDir, `${name}.beats.jpg`)], { stdio: 'ignore' });
    } catch {
      execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', silent, '-vf', `select='${sel}',scale=480:-1,tile=${cols}x${rows}`, '-fps_mode', 'passthrough', '-frames:v', '1', '-q:v', '4', path.join(outDir, `${name}.beats.jpg`)], { stdio: 'ignore' });
    }
  }

  if (quiet) fs.renameSync(silent, video);
  else execFileSync(process.execPath, [path.join(path.dirname(fileURLToPath(import.meta.url)), 'score.mjs'), path.join(outDir, `${name}.timeline.json`), silent, video], { stdio: 'inherit' });
  console.log('wrote', path.relative(process.cwd(), video));
  return qa.ok && !R.errors.length;
}
