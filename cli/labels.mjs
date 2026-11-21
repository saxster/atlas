// labels(figures): at the middle of every page, at desktop and phone sizes, labels that overlap each other and labels
// whose anchor is hidden behind a solid (the label floats over the wrong thing). Returns the number of findings.
import { serve, launch, open } from './render.mjs';
import { createReviewPin } from '../engine/review.js';

export async function labels(list, { pins = null } = {}) {
  const { server, base } = serve(), browser = await launch();
  let total = 0;
  const inter = (a, b) => Math.max(0, Math.min(a[0] + a[2], b[0] + b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[1] + a[3], b[1] + b[3]) - Math.max(a[1], b[1]));
  for (const c of list) for (const [w, h, tag] of [[1440, 900, 'desk'], [390, 844, 'phone']]) {
    const R = await open(browser, base, c, w, h), found = [];
    for (let i = 0; i < R.pages; i++) {
      const t = R.mid(i);
      await R.seek(t);
      const L = await R.page.evaluate(() => window.__atlas.labelReport());
      for (const l of L) if (l.hiddenBy) {
        const text = `p${i} "${l.text}" behind ${l.hiddenBy}`;
        found.push(text);
        pins?.push(createReviewPin({
          figure: c, page: i, t, source: 'labels', severity: 'error', viewport: tag,
          xPct: ((l.box[0] + l.box[2] * 0.5) / w) * 100,
          yPct: ((l.box[1] + l.box[3] * 0.5) / h) * 100,
          text,
        }));
      }
      for (let a = 0; a < L.length; a++) for (let b = a + 1; b < L.length; b++) {
        const o = inter(L[a].box, L[b].box), small = Math.min(L[a].box[2] * L[a].box[3], L[b].box[2] * L[b].box[3]);
        if (small > 0 && o / small > 0.2) {
          const text = `p${i} "${L[a].text}" overlaps "${L[b].text}" (${Math.round(100 * o / small)} %)`;
          found.push(text);
          pins?.push(createReviewPin({
            figure: c, page: i, t, source: 'labels', severity: 'warn', viewport: tag,
            xPct: ((L[a].box[0] + L[a].box[2] * 0.5) / w) * 100,
            yPct: ((L[a].box[1] + L[a].box[3] * 0.5) / h) * 100,
            text,
          }));
        }
      }
    }
    total += found.length;
    console.log(c.padEnd(24), tag.padEnd(6), found.length ? `${found.length} FINDINGS\n  ` + found.join('\n  ') : 'clean');
    await R.page.close();
  }
  await browser.close(); server.close();
  return total;
}
