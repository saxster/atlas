// node tools/jumps.mjs [subject/chapter …] [--step 0.1] [--frames dir] — the jump detector. Draws the whole ?render tour at fixed time
// steps, counts the figure's changed pixels from one step to the next, and flags any step that changes more than 3×
// the median of its neighbours (and enough pixels to see): a pop, a flash, a part teleporting, a frame that blows up.
// Slow moves should be continuous, so their pixel counts rise and fall smoothly. Frames at a figure's declared
// designed events (window.__atlas.events: a coin dropping in, a step starting) are counted apart. Exit 1 on any jump.
import { everything as allChapters } from './chapters.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { serve, launch, open } from './render.mjs';

const args = process.argv.slice(2), si = args.indexOf('--step');
const STEP = si >= 0 ? +args.splice(si, 2)[1] : 0.1;
const fi = args.indexOf('--frames'), FRAMES = fi >= 0 ? args.splice(fi, 2)[1] : null;   // save the frames either side of each jump
// a jump is a spike against its nearest neighbours (two steps each side): a smooth ease rises and falls through
// them, a pop doesn't. FLOOR: a jump must change at least 0.6 % of the figure (a coin-sized patch moving smoothly is
// not a jump; the glitches worth catching, a part blowing up or teleporting, change several per cent).
const FACTOR = 3, WINDOW = 2, FLOOR = 0.006;
const list = args.length ? args : await allChapters();
const { server, base } = serve(), browser = await launch();
let total = 0;
for (const c of list) {
  const R = await open(browser, base, c, 1200, 800);
  // changed pixels between consecutive frames, counted in the page from the canvas (it keeps its drawing buffer)
  await R.page.evaluate(() => {
    const src = document.getElementById('gl'), cv = document.createElement('canvas'), g = cv.getContext('2d', { willReadFrequently: true });
    cv.width = src.width; cv.height = src.height; let prev = null;
    window.__diff = () => {
      g.drawImage(src, 0, 0); const d = g.getImageData(0, 0, cv.width, cv.height).data; let n = 0;
      if (prev) for (let k = 0; k < d.length; k += 4) if (Math.abs(d[k] - prev[k]) + Math.abs(d[k + 1] - prev[k + 1]) + Math.abs(d[k + 2] - prev[k + 2]) > 48) n++;
      prev = d; return n / (d.length / 4);
    };
  });
  const ts = [], counts = [];
  for (let t = 0; t <= R.duration + 1e-9; t += STEP) { await R.seek(t); ts.push(t); counts.push(await R.page.evaluate(() => window.__diff())); }
  // a figure may declare designed discrete changes (window.__atlas.events, tour times): frames there are listed apart
  const events = await R.page.evaluate(() => window.__atlas.events || []);
  const designed = t => events.some(e => Math.abs(e - t) <= STEP * 1.5);
  const jumps = [], known = [];
  for (let k = 2; k < counts.length; k++) {
    const nb = []; for (let m = k - WINDOW; m <= k + WINDOW; m++) if (m > 0 && m !== k && m < counts.length) nb.push(counts[m]);
    nb.sort((a, b) => a - b); const med = nb.length % 2 ? nb[nb.length >> 1] : (nb[nb.length / 2 - 1] + nb[nb.length / 2]) / 2;
    if (counts[k] > FLOOR && counts[k] > FACTOR * Math.max(med, FLOOR / FACTOR)) {
      const pg = R.starts.findLastIndex(s => s <= ts[k] + 1e-9);
      const line = `t ${ts[k].toFixed(1)} s (page ${pg}): ${(100 * counts[k]).toFixed(1)} % vs ${(100 * med).toFixed(2)} % around`;
      if (designed(ts[k])) { known.push(line); continue; }
      jumps.push(line);
      if (FRAMES) {
        fs.mkdirSync(FRAMES, { recursive: true });
        const stem = path.join(FRAMES, `${c.replace('/', '-')}-${ts[k].toFixed(1)}`), fig = await R.page.$('#gl');
        await R.seek(ts[k - 1]); await fig.screenshot({ path: stem + '-a.png' });
        await R.seek(ts[k]); await fig.screenshot({ path: stem + '-b.png' });
      }
    }
  }
  total += jumps.length;
  console.log(c.padEnd(24), `${counts.length} frames,`, jumps.length ? `${jumps.length} JUMPS\n  ` + jumps.join('\n  ') : 'no jumps', known.length ? `(${known.length} at designed events)` : '', R.errors.length ? '\n  ERRORS ' + R.errors.join(' | ') : '');
  await R.page.close();
}
await browser.close(); server.close();
process.exit(total ? 1 : 0);
