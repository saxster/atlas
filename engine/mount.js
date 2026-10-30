// mountFigure(el, chapter, { page, height, playing, theme }): just the 3D figure, in any element of any page, with its
// own frame loop. Hover lights a part, a click takes it apart, a drag turns it. No pages, steps or controls around it.
// chapter: anything with PAGES, buildWorld(E), state(clock, reduced) and lookKeys (a book's CHAPTER; see stage.js).
// It stops drawing while scrolled out of view, and stands still for readers who ask for reduced motion.
// Returns { stage, play(on), destroy() }.
import { createStage } from './stage.js';

// the label styles a page needs without the atlas's own stylesheets: system fonts, colours that read on light paper
const CSS = `
.atlas-figure { position: relative; width: 100%; overflow: hidden; touch-action: pan-y; }
.atlas-figure canvas { display: block; width: 100%; height: 100%; cursor: grab; }
.atlas-figure canvas.pointing { cursor: pointer; }
.atlas-figure canvas.dragging { cursor: grabbing; }
.atlas-figure .atlas-labels { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
.atlas-figure .lbl { position: absolute; transform: translate(-50%, -50%); white-space: nowrap; color: #2c2c30; }
.atlas-figure .lbl.vec { font: italic 20px/1 Georgia, serif; }
.atlas-figure .lbl.vec.red { color: #c8383d; } .atlas-figure .lbl.vec.blue { color: #3d63a8; }
.atlas-figure .lbl.vec.grey, .atlas-figure .lbl.mark { color: #86868c; }
.atlas-figure .lbl.mark { font: 14px/1 Georgia, serif; }
.atlas-figure .lbl.tick { font: 11px/1 ui-monospace, monospace; color: #86868c; transform: translate(-100%, -50%); }
.atlas-figure .lbl.board { font: italic 16px/1 Georgia, serif; transform: translate(0, -50%); }
.atlas-figure .lbl.axis { font: italic 14px/1 Georgia, serif; color: #86868c; transform: translate(-100%, -50%); }
.atlas-figure .lbl.sound { font: italic 600 18px/1 Georgia, serif; color: #c8383d; transform: translate(-50%, -100%) rotate(-6deg); }
`;
let styled = false;

export function mountFigure(el, chapter, { page = 0, height = 400, playing = true, theme = null } = {}) {
  if (!styled) { styled = true; const s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s); }
  const pg = Math.min(Math.max(page | 0, 0), chapter.PAGES.length - 1);
  const wrap = document.createElement('div'), canvas = document.createElement('canvas'), labels = document.createElement('div');
  wrap.className = 'atlas-figure'; wrap.style.height = `${height}px`; labels.className = 'atlas-labels';
  wrap.setAttribute('role', 'img'); wrap.setAttribute('aria-label', chapter.PAGES[pg].alt || chapter.PAGES[pg].fig || 'A 3D figure');
  wrap.append(canvas, labels); el.appendChild(wrap);

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const S = createStage(canvas, labels, chapter, { reduced, touch: matchMedia('(pointer: coarse)').matches, theme, dprCap: 2 });
  if (chapter.clock0) S.clock = chapter.clock0;
  let raf = 0, last = 0, seen = true, on = playing && !reduced;
  function frame(now) {
    const dt = last ? Math.min((now - last) / 1000, 1 / 20) : 1 / 60; last = now;
    S.step({ now, dt, s: pg, litPage: pg, running: on });
    raf = seen ? requestAnimationFrame(frame) : 0;
  }
  const io = new IntersectionObserver(([e]) => { seen = e.isIntersecting; if (seen && !raf) { last = 0; raf = requestAnimationFrame(frame); } });
  io.observe(wrap);
  raf = requestAnimationFrame(frame);
  return {
    stage: S,
    play(v = true) { on = v && !reduced; },
    destroy() { cancelAnimationFrame(raf); io.disconnect(); S.destroy(); wrap.remove(); },
  };
}
