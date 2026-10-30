// stills(out, figures): one still from the middle of every page's dwell (or step), at desktop (1440×900) and phone
// (390×844) sizes, drawn by seek(t) so they are the same every run. figures: folders relative to the current one.
// Prints a line per figure and size; returns how many had console errors.
import fs from 'node:fs';
import path from 'node:path';
import { serve, launch, open } from './render.mjs';

export async function stills(outArg, list) {
  const out = path.resolve(outArg || 'shots/stills');
  const { server, base } = serve(), browser = await launch();
  let bad = 0;
  for (const c of list) for (const [w, h, tag] of [[1440, 900, 'desk'], [390, 844, 'phone']]) {
    const R = await open(browser, base, c, w, h);
    const dir = path.join(out, c.replace(/^examples\//, '').replaceAll('/', '-')); fs.mkdirSync(dir, { recursive: true });
    for (let i = 0; i < R.pages; i++) await R.shot(path.join(dir, `${tag}-p${String(i).padStart(2, '0')}.png`), R.mid(i));
    if (R.errors.length) bad++;
    console.log(c.padEnd(24), tag.padEnd(6), R.pages, 'stills', R.errors.length ? 'ERRORS ' + [...new Set(R.errors)].join(' | ') : 'no errors');
    await R.page.close();
  }
  await browser.close(); server.close();
  return bad;
}
