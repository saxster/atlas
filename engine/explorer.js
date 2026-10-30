// The explorer: a figure the reader runs and tries to break. First a prediction (the model works out the answer, shown
// after the run, never before). Then one press runs the experiment; the sliders change what goes in, and the same
// gauges and chart show what comes out, so pushing a slider to its end shows what each number does. Stochastic models
// take a seed: the same seed gives the same run, which is how checks.mjs can test them exactly.
//
// The page's <main> carries class "figpage explorer" (figure.css orders it for phones). figure: {
//   no, title, question, bigIdea, PAGES: [{ cam, look?, lit?, fig }] or params → that list (the view; one page is enough),
//   params: { … defaults }, controls: [{ key, label, min, max, step, fmt?(v), rebuild? }],
//     rebuild: the world's shape depends on it (rows of pegs), so the figure is rebuilt when it changes
//   predict?: { q, choices: [text], answer(params) → index, why(params) → html },
//   run: { label, duration(params) → seconds, real?(params) → real-world seconds, for the speed badge },
//   buildWorld(E, params), state(clock, reduced, params), lookKeys,
//   readout(state, params) → corner text, chips: [{ label, value: (state, params) → text }],
//   chart?(state, params) → svg markup, PLATES?, narrowZoom? (camera distance factor on phones), frameAspect? (as machine.js)
// }
import { createStage } from './stage.js';
import { speedLabel } from './machine.js';

const $ = id => document.getElementById(id);
const END = 1.5;

export function startExplorer(figure) {
  const touch = matchMedia('(pointer: coarse)').matches;
  const narrowQ = matchMedia('(max-width: 900px)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const Q = new URLSearchParams(location.search), RENDER = Q.has('render');
  if (RENDER) document.documentElement.classList.add('render');
  const params = { ...figure.params };
  for (const c of figure.controls || []) if (Q.has(c.key)) params[c.key] = +Q.get(c.key);   // ?p=0.7 opens it so

  document.title = `${figure.title} · Atlas`;
  $('figtitle').textContent = figure.title; $('figno').textContent = `Fig. ${figure.no}`;
  $('question').textContent = figure.question; $('bigidea').innerHTML = `<b>The big idea:</b> ${figure.bigIdea}`;
  $('chips').innerHTML = (figure.chips || []).map((c, i) => `<div class="chip" data-i="${i}"><span class="v">–</span><span class="l">${c.label}</span></div>`).join('');
  const chipEls = [...document.querySelectorAll('#chips .chip .v')];

  // ---------- predict first ----------
  let predicted = !figure.predict || RENDER, guess = null, ran = false;
  if (figure.predict) {
    $('predict').innerHTML = `<div class="kicker">Predict first</div><p class="q">${figure.predict.q}</p><ol class="choices">${figure.predict.choices.map((c, i) =>
      `<li><button type="button" data-c="${i}"><span class="letter">${'ABCDE'[i]}</span><span>${c}</span></button></li>`).join('')}</ol>`;
    $('predict').addEventListener('click', e => {
      const b = e.target.closest('[data-c]'); if (!b || predicted) return;
      guess = +b.dataset.c; predicted = true; b.classList.add('picked');
      $('predict').querySelectorAll('[data-c]').forEach(x => x.disabled = true);
      $('run').disabled = false; $('controls').querySelectorAll('input').forEach(x => x.disabled = false); $('run').focus();
    });
  } else $('predict').hidden = true;
  // the answer and its reason go under Run, not under the choices, so nothing the reader is pointing at moves
  const why = document.createElement('div'); why.className = 'why'; why.id = 'why'; why.hidden = true; why.setAttribute('aria-live', 'polite');
  $('again').after(why);
  function reveal() {
    if (!figure.predict || guess === null) return;
    const a = figure.predict.answer(params);
    $('predict').querySelectorAll('[data-c]').forEach(x => x.classList.toggle('right', +x.dataset.c === a));
    if (guess !== a) $('predict').querySelector(`[data-c="${guess}"]`).classList.add('wrong');
    why.innerHTML = (guess === a ? '<b>Right.</b> ' : '<b>Not quite.</b> ') + figure.predict.why(params); why.hidden = false;
  }

  // ---------- controls ----------
  const fmt = c => (c.fmt || (v => String(v)))(params[c.key]);
  $('controls').innerHTML = (figure.controls || []).map(c => `<label class="slider"><span class="name">${c.label}</span>
    <input type="range" data-key="${c.key}" min="${c.min}" max="${c.max}" step="${c.step}" value="${params[c.key]}"><output>${fmt(c)}</output></label>`).join('');
  $('controls').addEventListener('input', e => {
    const key = e.target.dataset.key; if (!key) return;
    const c = figure.controls.find(x => x.key === key); params[key] = +e.target.value; e.target.nextElementSibling.textContent = fmt(c);
    if (c.rebuild) build();
    reset();
  });
  // the prediction is about the board as it first stands: the sliders wait until it is made
  $('run').textContent = figure.run.label; $('run').disabled = !predicted;
  if (!predicted) $('controls').querySelectorAll('input').forEach(x => x.disabled = true);
  let clock = 0, running = false;
  const duration = () => figure.run.duration(params);
  function reset() { clock = 0; running = false; ran = false; $('run').textContent = figure.run.label; }
  $('run').onclick = () => {
    if (running) { running = false; $('run').textContent = 'Go on'; return; }
    if (clock >= duration()) clock = 0;
    running = true; $('run').textContent = 'Pause';
    // on a phone the figure sits above the controls: bring it into view to watch the run
    if (narrowQ.matches) document.querySelector('.figure').scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' });
  };
  $('again').onclick = () => reset();

  // ---------- the figure ----------
  let S = null;
  // PAGES may depend on the settings (a taller board needs the camera further back): a function of params, or a list
  const fig = () => ({ ...figure, PAGES: (typeof figure.PAGES === 'function' ? figure.PAGES(params) : figure.PAGES).map(p => ({ look: {}, ...p })), buildWorld: E => figure.buildWorld(E, params), state: (c, r) => figure.state(c, r, params) });
  function build() {
    if (S) {
      S.destroy();
      const fresh = document.createElement('canvas'); fresh.id = 'gl'; $('gl').replaceWith(fresh);   // a disposed context can't be reused
    }
    S = createStage($('gl'), $('labels'), fig(), { reduced, touch, dprCap: touch ? 1.5 : 2 });
    S.hooks.onSelect = key => {
      const pl = $('plate');
      if (!key || !figure.PLATES?.[key]) { pl.hidden = true; return; }
      const ud = S.E.ASM[key].userData;
      pl.innerHTML = `<button type="button" class="close">Close</button><div class="kicker">Closer</div><h2>${ud.title}</h2><p class="sub">${ud.sub || ''}</p><p>${figure.PLATES[key].text}</p>`;
      pl.hidden = false; pl.querySelector('.close').onclick = () => S.select(null);
    };
    if (RENDER || window.__atlas) Object.assign(window.__atlas || {}, { E: S.E, S, labelReport: S.labelReport });
  }
  build();

  function draw(now, dt, c) {
    const state = S.step({ now, dt, s: 0, litPage: 0, running, clockAt: c, narrow: narrowQ.matches, narrowZoom: figure.narrowZoom ?? 1 });
    $('readout').textContent = figure.readout(state, params);
    (figure.chips || []).forEach((ch, i) => { chipEls[i].textContent = c > 0 || ran ? ch.value(state, params) : '–'; chipEls[i].parentNode.classList.toggle('on', c > 0 || ran); });
    if (figure.chart) $('chart').innerHTML = figure.chart(state, params);
    const sp = running && figure.run.real ? speedLabel(figure.run.real(params), duration()) : '';
    $('speed').textContent = sp; $('speed').hidden = !sp;
  }
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(Math.max((now - last) / 1000, 0), 1 / 20); last = now;
    if (running) {
      clock = reduced ? duration() : Math.min(clock + dt, duration());
      if (clock >= duration()) { running = false; ran = true; $('run').textContent = 'Run it again'; reveal(); }
    }
    draw(now, dt, clock);
    if (!RENDER) requestAnimationFrame(frame);
  }
  document.fonts.ready.then(() => requestAnimationFrame(t => { if (RENDER) draw(0, 0, 0); else frame(t); }));
  window.__atlas = { E: S.E, S, N: 1, labelReport: S.labelReport, params, reset,
    get state() { return { clock, running, predicted, ran }; }, get clock() { return S.clock; } };
  if (RENDER) {
    const D = duration() + END;
    window.DURATION = D;
    window.__atlas.tour = { starts: [0], dwells: [D] };
    window.seek = t => { t = Math.min(Math.max(t, 0), D); draw(t * 1000, 1 / 60, Math.min(t, duration())); return t; };
  }
}
