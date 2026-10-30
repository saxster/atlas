// node tools/labels.mjs [subject/chapter …] — at the middle of every page, at desktop and phone sizes: labels that
// overlap each other, and labels whose anchor is hidden behind a solid (the label floats over the wrong thing).
// Exit 1 on any finding.
import { everything as allChapters } from './chapters.mjs';
import { serve, launch, open } from './render.mjs';

const list = process.argv.length > 2 ? process.argv.slice(2) : await allChapters();
const { server, base } = serve(), browser = await launch();
let total = 0;
const inter = (a, b) => Math.max(0, Math.min(a[0] + a[2], b[0] + b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[1] + a[3], b[1] + b[3]) - Math.max(a[1], b[1]));
for (const c of list) for (const [w, h, tag] of [[1440, 900, 'desk'], [390, 844, 'phone']]) {
  const R = await open(browser, base, c, w, h), found = [];
  for (let i = 0; i < R.pages; i++) {
    await R.seek(R.mid(i));
    const L = await R.page.evaluate(() => window.__atlas.labelReport());
    for (const l of L) if (l.hiddenBy) found.push(`p${i} "${l.text}" behind ${l.hiddenBy}`);
    for (let a = 0; a < L.length; a++) for (let b = a + 1; b < L.length; b++) {
      const o = inter(L[a].box, L[b].box), small = Math.min(L[a].box[2] * L[a].box[3], L[b].box[2] * L[b].box[3]);
      if (small > 0 && o / small > 0.2) found.push(`p${i} "${L[a].text}" overlaps "${L[b].text}" (${Math.round(100 * o / small)} %)`);
    }
  }
  total += found.length;
  console.log(c.padEnd(24), tag.padEnd(6), found.length ? `${found.length} FINDINGS\n  ` + found.join('\n  ') : 'clean');
  await R.page.close();
}
await browser.close(); server.close();
process.exit(total ? 1 : 0);
