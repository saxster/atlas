// The book: scroll turns the pages and moves the camera; hover lights a thing; click breaks
// it down. A chapter supplies its pages, breakdowns, world and clock; this does the rest. The figure itself is the
// stage (stage.js); the book is everything around it: pages, the leaf turning, practice, the top bar, Play.
// From kym_physics' port (source/spread/): a Pause button, every page's parts as buttons so a breakdown opens from
// the keyboard, focus back where it was after Esc, Still mode, and calm: nothing moves until the reader asks.
import { createStage, smooth, ease } from './stage.js';
import { XREFS } from './xrefs.js';

const $ = id => document.getElementById(id);
const touch = matchMedia('(pointer: coarse)').matches;
const CLOSE_HINT = touch ? 'Tap empty space to close' : 'Click empty space or press Esc to close';
const DEFAULT_HINT = touch ? 'Drag sideways to turn · tap to break it down' : 'Drag to turn · shift-drag to pan · click to break it down';
// this chapter as cross-references name it, subject and directory: physics/kinematics (pages are #3 after it)
const DIR = location.pathname.split('/').filter(s => s && s !== 'index.html').slice(-2).join('/');
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

// chapter: { no, subject, PAGES, PLATES, buildWorld(E), lookKeys, state(clock, reduced), readout(state),
//            forceLook?(selected, look), onFrame?(state, sheetEls), clock0? }
// subject: the subject's manifest (<subject>/subject.js): { links: [{ label, href, cls }], source, calm? }
// calm (chapter or subject): the figure is still until the reader scrolls, taps, presses a key or presses Play.
// still?(): true when the reader's own settings ask for no motion (a book's Still mode); counts as reduced motion.
// tourDwell?: seconds each page holds in the ?render tour (default 4); a page may set its own dwell.
// narrowZoom?: camera distance factor on phones. A page may list parts: ['ball', 'vArrow'], the things on it that
// open a breakdown; without a list, the page's lit thing is its part.
export function startBook(chapter) {
  const { PAGES, PLATES } = chapter;
  const N = PAGES.length;
  // the ?render tour: each page holds for its dwell, then the next turns in over TURN seconds
  const TURN = 1.4, dwell = i => PAGES[i].dwell ?? chapter.tourDwell ?? 4;
  const TOUR = PAGES.map((_, i) => dwell(i) + (i < N - 1 ? TURN : 0)), DURATION = TOUR.reduce((a, b) => a + b, 0);
  function tourAt(t) {                           // page position s at tour time t
    let i = 0;
    for (; i < N - 1 && t >= TOUR[i]; i++) t -= TOUR[i];
    return i + (t <= dwell(i) ? 0 : ease((t - dwell(i)) / TURN));
  }
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches || !!chapter.still?.();
  const Q = new URLSearchParams(location.search);
  // ?embed&page=i: only the figure, held on page i (an iframe or a book's widget). Calm unless &auto.
  // ?render: no clock of its own; window.seek(t) draws the page tour at time t, so any frame can be drawn in any order
  const EMBED = Q.has('embed'), RENDER = Q.has('render');
  const calm = !RENDER && (chapter.calm ?? chapter.subject?.calm ?? (Q.has('calm') || (EMBED && !Q.has('auto'))));
  if (EMBED) document.documentElement.classList.add('embed');
  if (RENDER) document.documentElement.classList.add('render');
  const narrowQ = matchMedia('(max-width: 900px), (max-height: 520px)'), narrow = () => narrowQ.matches;
  // one page of scroll; held steady while a phone's toolbar slides in and out (only a width change resizes it)
  let pageH = innerHeight, lastW = innerWidth;
  // one block per page, so touch scrolling can snap to whole pages (book.css)
  $('space').innerHTML = '<div></div>'.repeat(N);
  const sizeSpace = () => { for (const d of $('space').children) d.style.height = `${pageH}px`; };
  addEventListener('resize', () => { if (innerWidth !== lastW || !touch) { lastW = innerWidth; pageH = innerHeight; sizeSpace(); } });

  // ---------- pages ----------
  sizeSpace();
  let PRACTICE = {};
  // practice questions live beside the chapter (practice.js: { pageIndex: [question, ...] }); a chapter may have none
  import(new URL('practice.js', location.href).href).then(m => { PRACTICE = m.PRACTICE || {}; shown = leafFor = -1; }, () => {});
  const practiceHtml = i => {
    const qs = PRACTICE[i] || [];
    if (!qs.length) return '';
    return `<section class="practice"><div class="kicker">Practice</div>${qs.map((q, n) => `<div class="q" data-q="${n}">
      <p class="qtext"><span class="qn">${n + 1}</span>${q.q}</p>
      ${q.choices ? `<ol class="choices">${q.choices.map((c, k) => `<li><button type="button" data-c="${k}"><span class="letter">${'ABCDE'[k]}</span><span>${c}</span></button></li>`).join('')}</ol>`
        : '<button type="button" class="reveal">Show the solution</button>'}
      <div class="why" hidden>${q.why || q.solution}</div></div>`).join('')}</section>`;
  };
  const xrefHtml = i => {
    const here = `${DIR}/${i}`, links = XREFS.flatMap(([a, al, b, bl, note]) => a === here ? [[b, bl, note]] : b === here ? [[a, al, note]] : []);
    if (!links.length) return '';
    return `<aside class="xref"><div class="kicker">Compare</div>${links.map(([to, label, note]) => {
      const d = to.slice(0, to.lastIndexOf('/')), k = to.slice(to.lastIndexOf('/') + 1);
      return `<p><a href="${d === DIR ? '' : `../../${d}/`}#${k}">${label} →</a> ${note}</p>`; }).join('')}</aside>`;
  };
  // the parts of this page's figure, as buttons: the keyboard's way into a breakdown
  const partsOf = i => (PAGES[i].parts || (PAGES[i].lit ? [PAGES[i].lit] : [])).filter(k => PLATES[k] && E.ASM[k]);
  const partsHtml = i => {
    const ks = partsOf(i);
    if (!ks.length) return '';
    return `<div class="kicker parts-k">Take the figure apart</div><ul class="parts">${ks.map(k => { const u = E.ASM[k].userData;
      return `<li><button type="button" data-part="${k}">${PLATES[k].title || u.title || k}<span>${PLATES[k].sub || u.sub || ''}</span></button></li>`; }).join('')}</ul>`;
  };
  // small screens: the page ends with a way on to the next (book.css shows it there)
  const turnHtml = i => i < N - 1 ? `<button type="button" class="turn" data-turn="${i + 1}"><span class="kicker">Next page</span>${PAGES[i + 1].title} →</button>` : '';
  const sheetHtml = i => { const p = PAGES[i]; return `<div class="kicker">${p.kicker}</div><h1>${p.title}</h1><div class="sub">${p.sub}</div>${p.body}${partsHtml(i)}${xrefHtml(i)}${practiceHtml(i)}${turnHtml(i)}`; };
  // answering: click a choice to mark it and show the worked solution
  $('sheet').addEventListener('click', e => {
    const b = e.target.closest('button'), q = b && b.closest('.q');
    if (b?.dataset.turn) return goto(+b.dataset.turn);
    if (b?.dataset.part) { begin(); return select(b.dataset.part, b); }
    if (!q) return;
    const item = PRACTICE[shown][+q.dataset.q];
    if (b.dataset.c !== undefined) {
      if (q.classList.contains('done')) return;
      q.classList.add('done');
      q.querySelectorAll('[data-c]').forEach(c => { c.disabled = true; c.classList.toggle('right', +c.dataset.c === item.answer); });
      if (+b.dataset.c !== item.answer) b.classList.add('wrong');
    } else if (b.classList.contains('reveal')) b.hidden = true;
    q.querySelector('.why').hidden = false;
  });
  let shown = -1, leafFor = -1;
  // the leaf's back is the next left page: the same folio at its foot
  const leafFolio = $('folio').parentNode.cloneNode(true); leafFolio.lastElementChild.removeAttribute('id');
  document.querySelector('.leaf-back').append(leafFolio);
  function showPage(i) {
    if (i === shown) return;
    shown = i;
    $('sheet').innerHTML = sheetHtml(i);
    $('left').scrollTop = 0;
    $('pagenum').textContent = `${i + 1} / ${N}`;
    // the address names the page, so it can be bookmarked or linked: kinematics/#3
    history.replaceState(null, '', i ? `#${i}` : location.pathname);
    $('folio').textContent = i + 1;
    $('figno').textContent = `Fig. ${chapter.no}${i ? '.' + i : ''}`;
    $('figtitle').textContent = PAGES[i].fig;
    if (partsOf(i).length) $('gl').setAttribute('aria-label', `Figure ${chapter.no}${i ? '.' + i : ''}: ${PAGES[i].fig}. ${PAGES[i].alt || ''} The buttons under the text take it apart.`);
    [...$('dots').children].forEach((b, k) => b.setAttribute('aria-current', k === i));
  }
  const goto = (i, now) => (now || begin(), scrollTo({ top: Math.max(0, Math.min(N - 1, i)) * pageH, behavior: reduced || now ? 'auto' : 'smooth' }));
  const fromHash = () => { const m = /^#(\d+)$/.exec(location.hash); return m && +m[1] < N ? +m[1] : null; };
  history.scrollRestoration = 'manual';
  addEventListener('hashchange', () => { const k = fromHash(); if (k !== null) goto(k); });
  // a compact pager for small screens, where a row of dots would not fit
  const { links: barLinks = [], source } = chapter.subject || {};
  $('dots').insertAdjacentHTML('afterend', '<span class="pager"><button type="button" aria-label="Previous page">‹</button><span id="pagenum"></span><button type="button" aria-label="Next page">›</button></span>'
    + (reduced ? '' : '<button type="button" class="playbtn" id="play" aria-pressed="false">Play</button>')
    + barLinks.map(l => `<a class="${l.cls || ''}" href="${l.href}">${l.label}</a>`).join('')
    + (source ? `<a class="gh" href="${source}" aria-label="Source on GitHub"><svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg></a>` : ''));
  // Play / Pause. Calm chapters start still: the reader's scrolling, a key, a tap or Play starts them; a deep link doesn't
  let started = !calm, userPaused = false;
  const playB = $('play');
  if (EMBED && playB) { playB.classList.add('playbtn-embed'); $('gl').parentElement.appendChild(playB); }   // no top bar in an embed
  const syncPlay = () => {
    if (!playB) return;
    const on = started && !userPaused, word = on ? 'Pause' : 'Play';
    playB.innerHTML = `<span class="word">${word}</span><span class="icon" aria-hidden="true">${on ? '❚❚' : '▶'}</span>`;
    playB.setAttribute('aria-label', word); playB.setAttribute('aria-pressed', String(on));
  };
  function begin() { if (!started) { started = true; syncPlay(); } }
  if (playB) playB.onclick = () => { if (!started) { started = true; userPaused = false; } else userPaused = !userPaused; syncPlay(); };
  syncPlay();
  for (const ev of ['wheel', 'touchmove']) addEventListener(ev, begin, { passive: true });
  const [prevB, nextB] = document.querySelectorAll('.pager button');
  prevB.onclick = () => goto(Math.round(scrollY / pageH) - 1); nextB.onclick = () => goto(Math.round(scrollY / pageH) + 1);
  PAGES.forEach((p, i) => {
    const b = document.createElement('button');
    b.setAttribute('aria-label', `Page ${i + 1}: ${p.title}`);
    b.onclick = () => goto(i);
    $('dots').appendChild(b);
  });

  // ---------- scene ----------
  const S = createStage($('gl'), $('labels'), chapter, { reduced, touch, dprCap: touch ? 1.5 : 2 });
  const E = S.E;

  // ---------- hover / click: the stage reports, the book shows ----------
  let returnFocus = null, pendingFrom = null, selectScroll = 0;
  S.hooks.onPointerDown = () => begin();
  S.hooks.onHover = k => { $('hint').textContent = k ? `${E.ASM[k].userData.title} — click to break it down` : S.selected ? CLOSE_HINT : DEFAULT_HINT; };
  S.hooks.onSelect = k => {
    returnFocus = pendingFrom; pendingFrom = null;
    selectScroll = scrollY;
    const plate = $('plate');
    if (!k) { plate.hidden = true; $('hint').textContent = DEFAULT_HINT; return; }
    const u = E.ASM[k].userData;
    plate.innerHTML = `
      <button class="close" type="button">${touch ? 'Close' : 'Close · Esc'}</button>
      <div class="kicker">Breakdown</div>
      <h1>${u.title}</h1>
      <div class="sub">${u.sub}</div>
      <p>${PLATES[k].text}</p>
      <table class="data" id="facts" aria-live="off"></table>`;
    plate.hidden = false;
    plate.querySelector('.close').onclick = () => { const back = returnFocus; select(null); back?.focus(); };
    if (returnFocus) plate.querySelector('.close').focus();
    $('hint').textContent = CLOSE_HINT;
  };
  // from: the button that asked (a part button), so focus can go back to it when the breakdown closes
  function select(k, from) { pendingFrom = from || null; S.select(k); }
  addEventListener('keydown', e => {
    if (e.key === 'Escape' && S.selected) { const back = returnFocus; select(null); back?.focus(); }
    if (['ArrowRight', 'ArrowLeft', 'PageDown', 'PageUp', ' '].includes(e.key)) begin();
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); goto(Math.round(scrollY / pageH) + 1); }
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); goto(Math.round(scrollY / pageH) - 1); }
  });

  // a small badge says when motion is stopped (pointing at something, or a breakdown open)
  const paused = document.createElement('div');
  paused.className = 'paused'; paused.setAttribute('aria-hidden', 'true');
  paused.innerHTML = '<span class="bars"></span>paused';
  $('gl').parentElement.appendChild(paused);

  // ---------- frame ----------
  // resolution follows the device: if frames run slow for two seconds running, draw fewer pixels
  // ponytail: only ever steps down (to 1 px per CSS px); stepping back up would need hysteresis
  let last0 = performance.now(), slow = 0, win = [], dprCap = touch ? 1.5 : 2;
  function adapt(ms) {
    win.push(ms);
    if (win.length < 120) return;
    const hitch = Math.max(...win) > 250, avg = win.reduce((a, b) => a + b) / win.length;
    win = [];
    if (hitch) return;
    slow = avg > 1000 / 45 ? slow + 1 : 0;
    if (slow >= 2 && dprCap > 1) { dprCap = Math.max(1, dprCap - 0.25); E.setDprCap(dprCap); slow = 0; }
  }
  let last = performance.now();
  const EMBED_PAGE = Math.min(Math.max(+Q.get('page') || 0, 0), N - 1);
  let tourT = 0;
  function frame(now) {
    const dt = RENDER ? 1 / 60 : Math.min(Math.max((now - last) / 1000, 0), 1 / 20); last = now;   // a frame stamp can predate setup
    const s = RENDER ? tourAt(tourT) : EMBED ? EMBED_PAGE : Math.min(Math.max(scrollY / pageH, 0), N - 1);
    const i = Math.min(Math.floor(s), N - 1), f = s - i, j = Math.min(i + 1, N - 1);
    if (S.selected && Math.abs(scrollY - selectScroll) > pageH * 0.25) select(null);
    if (!RENDER) adapt(now - last0);
    last0 = now;

    // text: the leaf turns over the second half of each page's scroll
    const flip = narrow() || i === j ? 0 : smooth(0.5, 1, f);
    showPage(flip > 0.999 ? j : (narrow() ? Math.round(s) : i));
    const leaf = $('leaf');
    if (flip > 0.001 && flip < 0.999) {
      if (leafFor !== j) { leafFor = j; $('leafsheet').innerHTML = sheetHtml(j); $('leafnext').textContent = PAGES[j].fig; leafFolio.lastElementChild.textContent = j + 1; }
      leaf.style.visibility = 'visible';
      leaf.style.transform = `rotateY(${-180 * flip}deg)`;
      leaf.querySelector('.leaf-front').style.opacity = 0.25 + 0.6 * smooth(0.15, 0.5, flip);
      leaf.style.setProperty('--shade', (0.10 * Math.sin(flip * Math.PI)).toFixed(3));
    } else leaf.style.visibility = 'hidden';
    $('cue').style.opacity = s < 0.05 ? 1 : 0;

    // the figure: camera, time, world, labels (stage.js); time pauses while something is pointed at or open
    const state = S.step({ now, dt, s, litPage: shown, running: started && !userPaused, narrow: narrow(), narrowZoom: chapter.narrowZoom ?? 1,
      clockAt: RENDER ? (chapter.clock0 || 0) + tourT : undefined });
    paused.classList.toggle('on', !reduced && started && !userPaused && !!(S.selected || S.hovered));

    $('readout').textContent = chapter.readout(state, PAGES[shown]);
    if (chapter.onFrame) chapter.onFrame(state, [$('sheet'), $('leafsheet')]);
    if (S.selected && $('facts')) $('facts').innerHTML = PLATES[S.selected].facts(state).map(([a, b]) => `<tr><td>${a}</td><td>${b}</td></tr>`).join('');
    if (!RENDER) requestAnimationFrame(frame);
  }
  S.relight();
  { const k = fromHash(); if (k !== null) goto(k, true); }
  // the first frame drawn: the book can open now (cover.js)
  document.fonts.ready.then(() => requestAnimationFrame(t => { frame(RENDER ? 0 : t); dispatchEvent(new Event('bookready')); }));
  window.__atlas = { E, S, select, goto, N, labelReport: S.labelReport, get started() { return started; }, get clock() { return S.clock; } };
  if (RENDER) {
    // every frame is a pure function of t: the page from the tour, the clock from t, the sway from t
    window.DURATION = DURATION;
    window.__atlas.tour = { dwells: PAGES.map((_, i) => dwell(i)), turn: TURN };
    window.seek = t => { tourT = Math.min(Math.max(t, 0), DURATION); frame(tourT * 1000); return tourT; };
  }
}
