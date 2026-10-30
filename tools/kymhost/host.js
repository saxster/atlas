// The slice of a kym book's live/core.js that adapters/kym-live.js uses: Live.register, a Play button, api.loop
// (dt > 0 while playing; one fn(0, t) still frame on pausing), api.readout, api.button, api.reduced. ?chapter=…&page=…
import { mountAtlas } from '../../adapters/kym-live.js';

const Q = new URLSearchParams(location.search);
const chapterPath = Q.get('chapter') || 'physics/oscillations', page = +(Q.get('page') || 8);
const { CHAPTER } = await import(`../../${chapterPath}/chapter.js`);
const stage = document.getElementById('stage'), controls = document.getElementById('controls');
const loops = new Set(), state = { t: 0 };
let playing = false, raf = 0, last = 0;
const api = {
  get reduced() { return matchMedia('(prefers-reduced-motion: reduce)').matches; },
  loop(fn) { loops.add(fn); return () => loops.delete(fn); },
  readout() { const r = document.createElement('p'); r.className = 'live-readout'; controls.appendChild(r); return html => { if (r.innerHTML !== html) r.innerHTML = html; }; },
  button(label, onClick, opts = {}) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'live-ctl'; b.textContent = label;
    if (opts.pressed != null) b.setAttribute('aria-pressed', String(!!opts.pressed));
    b.addEventListener('click', () => onClick(b)); controls.appendChild(b); return b;
  },
  play() { setPlaying(true); }, pause() { setPlaying(false); },
};
const playBtn = document.createElement('button'); playBtn.type = 'button'; playBtn.className = 'live-ctl live-play'; playBtn.textContent = 'Play';
controls.appendChild(playBtn);
function frame(ts) {
  const dt = Math.min(0.05, last ? (ts - last) / 1000 : 0.016); last = ts; state.t += dt;
  for (const fn of loops) fn(dt, state.t);
  if (playing) raf = requestAnimationFrame(frame);
}
function setPlaying(p) {
  playing = p; playBtn.textContent = p ? 'Pause' : 'Play'; playBtn.setAttribute('aria-pressed', String(p));
  cancelAnimationFrame(raf); last = 0;
  if (p) raf = requestAnimationFrame(frame); else for (const fn of loops) fn(0, state.t);
}
playBtn.addEventListener('click', () => setPlaying(!playing));
const widget = mountAtlas(stage, {}, api, CHAPTER, { page });
window.__host = { api, widget, setPlaying, get playing() { return playing; }, get t() { return state.t; },
  close() { widget.destroy(); loops.clear(); setPlaying(false); } };
