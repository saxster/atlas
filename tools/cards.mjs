// node tools/cards.mjs [subject/id …] — draws each chapter's and figure's contents-page picture,
// <subject>/img/<id>.jpg, 900×800, from its ?render tour: a book at the middle of the card's page (cards[id].page,
// default 0), a machine or explorer at cards[id].at seconds (default: the end of the tour). Physics keeps its own.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT, subjects, key, EXAMPLES } from './chapters.mjs';
import { serve, launch, open } from '../cli/render.mjs';

const only = process.argv.slice(2).map(key);
const jobs = (await subjects()).filter(s => s.contents !== false).flatMap(s =>
  [...(s.chapters || []), ...(s.figures || [])].map(id => ({ s, id, key: `examples/${s.id}/${id}`, card: s.cards?.[id] || {}, book: (s.chapters || []).includes(id) })))
  .filter(j => !only.length || only.includes(j.key));
const { server, base } = serve(), browser = await launch();
let bad = 0;
for (const j of jobs) {
  const R = await open(browser, base, j.key, 1040, 900);   // a figure near the cards' 9:8 at the desktop layout
  const t = j.book ? R.mid(Math.min(j.card.page || 0, R.pages - 1)) : (j.card.at ?? R.duration - 0.05);
  await R.seek(t);
  // the figure's canvas, cropped from its centre to the cards' 9:8
  const box = await R.page.evaluate(() => { const r = document.getElementById('gl').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  let w = box.w, h = w * 8 / 9; if (h > box.h) { h = box.h; w = h * 9 / 8; }
  const clip = { x: box.x + (box.w - w) / 2, y: box.y + (box.h - h) / 2, width: w, height: h };
  // the picture is the scene and its labels: the figure's hint, corners and badges are page furniture
  await R.page.addStyleTag({ content: '.hintbar, .corner, .speed, .hint, #hint, .fig-no, .readout { visibility: hidden !important; }' });
  await R.seek(t);
  const out = path.join(EXAMPLES, j.s.id, 'img', `${j.id}.jpg`); fs.mkdirSync(path.dirname(out), { recursive: true });
  await R.page.screenshot({ path: out, type: 'jpeg', quality: 90, clip });
  execFileSync('sips', ['-z', '800', '900', '-s', 'formatOptions', '84', out], { stdio: 'ignore' });   // macOS; 900×800
  if (R.errors.length) bad++;
  console.log(j.key.padEnd(24), `t=${t.toFixed(1)}`, R.errors.length ? 'ERRORS ' + R.errors.join(' | ') : 'ok', path.relative(ROOT, out));
  await R.page.close();
}
await browser.close(); server.close();
process.exit(bad ? 1 : 0);
