// scene(figures, { margin = 0.02, intersections = false }): at the middle of every page or step, at desktop and phone
// sizes, checks camera framing (all visible meshes inside the viewport), key-subject occlusion (whether the labelled
// subject is hidden by another solid along the camera ray), and optional pairwise 3D mesh intersections.
// Returns the number of findings.
import { serve, launch, open } from './render.mjs';

export async function scene(list, { margin = 0.02, intersections = false } = {}) {
  const { server, base } = serve(), browser = await launch();
  let total = 0;
  for (const c of list) for (const [w, h, tag] of [[1440, 900, 'desk'], [390, 844, 'phone']]) {
    const R = await open(browser, base, c, w, h), found = [];
    for (let i = 0; i < R.pages; i++) {
      await R.seek(R.mid(i));
      const rep = await R.page.evaluate(opts => window.__atlas?.sceneReport?.(opts), { margin, checkIntersections: intersections });
      if (!rep) continue;
      if (rep.framing && !rep.framing.inFrame) {
        const b = rep.framing.bounds;
        found.push(`p${i} framing (${rep.framing.subject || 'scene'}) clipped [${b ? b.map(v => v.toFixed(2)).join(', ') : ''}]`);
      }
      if (rep.occlusion?.blocked) {
        found.push(`p${i} subject "${rep.occlusion.subject || rep.occlusion.target}" occluded by ${rep.occlusion.occludedBy || rep.occlusion.by}`);
      }
      if (rep.intersections?.length) {
        for (const item of rep.intersections) {
          const [a, b] = Array.isArray(item) ? item : item.pair;
          found.push(`p${i} mesh intersection: ${a} ∩ ${b}${item.overlap ? ` (${item.overlap}m)` : ''}`);
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
