// scene(figures, { margin = 0.02, intersections = false }): at the middle of every page or step, at desktop and phone
// sizes, checks camera framing (all visible meshes inside the viewport), key-subject occlusion (whether the labelled
// subject is hidden by another solid along the camera ray), and optional pairwise 3D mesh intersections.
// Returns the number of findings.
import { serve, launch, open } from './render.mjs';
import { createReviewPin } from '../engine/review.js';

export async function scene(list, { margin = 0.02, intersections = false, pins = null } = {}) {
  const { server, base } = serve(), browser = await launch();
  let total = 0;
  for (const c of list) for (const [w, h, tag] of [[1440, 900, 'desk'], [390, 844, 'phone']]) {
    const R = await open(browser, base, c, w, h), found = [];
    for (let i = 0; i < R.pages; i++) {
      const t = R.mid(i);
      await R.seek(t);
      const rep = await R.page.evaluate(opts => window.__atlas?.sceneReport?.(opts), { margin, checkIntersections: intersections });
      if (!rep) continue;
      const cx = Array.isArray(rep.framing?.center) ? rep.framing.center[0] * 100 : 50;
      const cy = Array.isArray(rep.framing?.center) ? rep.framing.center[1] * 100 : 50;
      if (rep.framing && !rep.framing.inFrame) {
        const b = rep.framing.bounds;
        const text = `p${i} framing (${rep.framing.subject || 'scene'}) clipped [${b ? b.map(v => v.toFixed(2)).join(', ') : ''}]`;
        found.push(text);
        pins?.push(createReviewPin({ figure: c, page: i, t, source: 'scene', severity: 'error', viewport: tag, asm: rep.framing.subject || null, xPct: cx, yPct: cy, text }));
      }
      if (rep.occlusion?.blocked) {
        const text = `p${i} subject "${rep.occlusion.subject || rep.occlusion.target}" occluded by ${rep.occlusion.occludedBy || rep.occlusion.by}`;
        found.push(text);
        pins?.push(createReviewPin({ figure: c, page: i, t, source: 'scene', severity: 'error', viewport: tag, asm: rep.occlusion.subject || null, xPct: cx, yPct: cy, text }));
      }
      if (rep.intersections?.length) {
        for (const item of rep.intersections) {
          const [a, b] = Array.isArray(item) ? item : item.pair;
          const text = `p${i} mesh intersection: ${a} ∩ ${b}${item.overlap ? ` (${item.overlap}m)` : ''}`;
          found.push(text);
          pins?.push(createReviewPin({ figure: c, page: i, t, source: 'scene', severity: 'warn', viewport: tag, asm: a, xPct: cx, yPct: cy, text }));
        }
      }
    }
    total += found.length;
    console.log(c.padEnd(24), tag.padEnd(6), found.length ? `${found.length} SCENE FINDINGS\n  ` + found.join('\n  ') : 'clean');
    await R.page.close();
  }
  await browser.close(); server.close();
  return total;
}
