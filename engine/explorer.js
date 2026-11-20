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
import { createStage, bindPlaybackLifecycle, mountShareButton, mountMediumBar } from './stage.js';
import { speedLabel } from './machine.js';
import { bindProse } from './prose.js';
import { mountSoundToggle, playClick, playBoop } from './sound.js';
import { renderControl, updateControl, bindControls, mountControlModeBar } from './diegetic.js';

function applyChartSlot(el, res, state, params) {
  if (!el || !res) return;
  if (typeof res === 'string') {
    if (el._lastSvg !== res) { el._lastSvg = res; el._chartKey = null; el.innerHTML = res; }
  } else if (typeof res === 'object' && res.svg !== undefined) {
    const k = res.key ?? 'static';
    if (el._chartKey !== k) { el._chartKey = k; el._lastSvg = null; el.innerHTML = res.svg; }
    res.update?.(el, state, params);
  }
}

const $ = id => document.getElementById(id);
const END = 1.5;

export function startExplorer(figure) {
  const touch = matchMedia('(pointer: coarse)').matches;
  const narrowQ = matchMedia('(max-width: 900px)');
  const Q = new URLSearchParams(location.search), RENDER = Q.has('render');
  if (RENDER) document.documentElement.classList.add('render');
  let S = null, raf = 0, frameReady = false, last = performance.now();
  const life = RENDER ? { reduced: false, hidden: false, visible: true, active: true, destroy() {} } : bindPlaybackLifecycle({
    onChange(st) {
      S?.setReduced?.(st.reduced);
      if (!frameReady) return;
      if (st.hidden && raf) { cancelAnimationFrame(raf); raf = 0; }
      else if (!st.hidden && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
    },
  });
  const params = { ...figure.params };
  let hasParamQuery = false;
  for (const c of figure.controls || []) if (Q.has(c.key)) { params[c.key] = +Q.get(c.key); hasParamQuery = true; }   // ?p=0.7 opens it so

  document.title = `${figure.title} · Atlas`;
  $('figtitle').textContent = figure.title; $('figno').textContent = `Fig. ${figure.no}`;
  $('question').textContent = figure.question; $('bigidea').innerHTML = `<b>The big idea:</b> ${figure.bigIdea}`;
  $('chips').innerHTML = (figure.chips || []).map((c, i) => `<div class="chip${c.tone === 'ink' ? ' chip-ink' : ''}" data-i="${i}"><span class="v">${c.led ? `<i class="ink-led" aria-hidden="true"></i>` : ''}–</span><span class="l">${c.label}</span></div>`).join('');
  const chipEls = [...document.querySelectorAll('#chips .chip .v')];

  // ---------- predict first ----------
  const hasTimeQuery = !RENDER && Q.has('t');
  let predicted = !figure.predict || RENDER || hasParamQuery || hasTimeQuery, guess = null, ran = false;
  if (figure.predict) {
    $('predict').innerHTML = `<div class="kicker">Predict first</div><p class="q">${figure.predict.q}</p><ol class="choices">${figure.predict.choices.map((c, i) =>
      `<li><button type="button" data-c="${i}"><span class="letter">${'ABCDE'[i]}</span><span>${c}</span></button></li>`).join('')}</ol>`;
    $('predict').addEventListener('click', e => {
      const b = e.target.closest('[data-c]'); if (!b || predicted) return;
      guess = +b.dataset.c; predicted = true; b.classList.add('picked');
      $('predict').querySelectorAll('[data-c]').forEach(x => x.disabled = true);
      $('run').disabled = false; $('controls').querySelectorAll('input, button.dg-hit').forEach(x => x.disabled = false); $('run').focus();
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
  const hasDiegetic = (figure.controls || []).some(c => c.ui?.kind);
  let ctlMode = Q.get('controls') === 'creative' ? 'creative' : (Q.get('controls') === 'standard' ? 'standard' : (figure.controlMode || 'standard'));
  const drawControls = () => {
    $('controls').innerHTML = (figure.controls || []).map(c =>
      renderControl(c, params[c.key], { mode: ctlMode, disabled: !predicted, idPrefix: `exp-${figure.no || 'fig'}` })
    ).join('');
    if (!predicted) $('controls').querySelectorAll('input, button.dg-hit').forEach(x => x.disabled = true);
  };
  drawControls();
  const applyParam = (key, val) => {
    const c = (figure.controls || []).find(x => x.key === key); if (!c) return;
    params[key] = +val;
    if (ctlMode === 'creative' && c.ui?.kind) drawControls();
    else {
      const inp = $('controls')?.querySelector(`input[data-key="${key}"]`);
      const out = inp?.closest('[data-ctl]')?.querySelector('[data-out]') || inp?.nextElementSibling;
      if (inp) inp.value = params[key];
      if (out) out.textContent = fmt(c);
      updateControl($('controls'), c, params[key]);
    }
    if (c.rebuild) build();
    reset();
    syncUrl();
  };
  $('controls').addEventListener('input', e => {
    const key = e.target.dataset.key; if (!key) return;
    const c = figure.controls.find(x => x.key === key); if (!c) return;
    params[key] = +e.target.value;
    const out = e.target.closest('[data-ctl]')?.querySelector('[data-out]') || e.target.nextElementSibling;
    if (out) out.textContent = fmt(c);
    updateControl($('controls'), c, params[key]);
    if (c.rebuild) build();
    reset();
    syncUrl();
  });
  bindControls($('controls'), {
    getParams: () => params,
    setParam: (k, v) => { if (predicted) applyParam(k, v); },
  });
  if (hasDiegetic) {
    mountControlModeBar($('controls'), {
      initialMode: ctlMode,
      place: 'before',
      onChange: m => { ctlMode = m; drawControls(); syncUrl(); },
    });
  }
  // the prediction is about the board as it first stands: the sliders wait until it is made
  $('run').textContent = figure.run.label; $('run').disabled = !predicted;
  if (!predicted) $('controls').querySelectorAll('input, button.dg-hit').forEach(x => x.disabled = true);
  const duration = () => figure.run.duration(params);
  let clock = hasTimeQuery ? Math.min(Math.max(+Q.get('t') || 0, 0), duration()) : 0, running = false;
  if (hasTimeQuery && clock >= duration()) { ran = true; $('run').textContent = 'Run it again'; }
  const shareUrl = () => {
    const u = new URL(location.href); u.search = '';
    for (const c of figure.controls || []) if (params[c.key] !== figure.params[c.key]) u.searchParams.set(c.key, String(params[c.key]));
    if (clock > 0) u.searchParams.set('t', clock.toFixed(2));
    return u.toString();
  };
  const syncUrl = () => { if (!RENDER) history.replaceState(null, '', shareUrl()); };
  function reset() { clock = 0; running = false; ran = false; $('run').textContent = figure.run.label; syncUrl(); }
  $('run').onclick = () => {
    if (running) { running = false; $('run').textContent = 'Go on'; syncUrl(); return; }
    if (clock >= duration()) clock = 0;
    running = true; $('run').textContent = 'Pause';
    // on a phone the figure sits above the controls: bring it into view to watch the run
    if (narrowQ.matches) document.querySelector('.figure').scrollIntoView({ block: 'start', behavior: life.reduced ? 'auto' : 'smooth' });
  };
  $('again').onclick = () => reset();
  mountShareButton($('again'), shareUrl, 'again sharebtn', syncUrl);
  mountMediumBar($('controls'), figure, () => S, { initialMedium: Q.get('medium') || null, place: 'before' });
  if (figure.prose) {
    const pNote = document.createElement('div');
    pNote.className = 'prose-note';
    pNote.innerHTML = typeof figure.prose === 'function' ? figure.prose(params) : figure.prose;
    $('controls').before(pNote);
  }
  const soundCtl = figure.sonify ? mountSoundToggle($('again'), { label: 'Sound' }) : null;

  // ---------- the figure ----------
  const proseRoot = document.querySelector('main') || document.body;
  const prose = bindProse(proseRoot, {
    getStage: () => S,
    getParams: () => params,
    setParam: (k, v) => {
      if (!predicted) return;
      applyParam(k, v);
    },
    formatters: figure.proseFormat || figure.formatters || {},
    onSound: (kind, dir) => { if (soundCtl?.on && soundCtl.ctx) (kind === 'scrub' ? playClick : playBoop)(soundCtl.ctx, { dir }); },
  });
  // PAGES may depend on the settings (a taller board needs the camera further back): a function of params, or a list
  const fig = () => ({ ...figure, PAGES: (typeof figure.PAGES === 'function' ? figure.PAGES(params) : figure.PAGES).map(p => ({ look: {}, ...p })), buildWorld: E => figure.buildWorld(E, params), state: (c, r) => figure.state(c, r, params) });
  function build() {
    if (S) {
      S.destroy();
      const fresh = document.createElement('canvas'); fresh.id = 'gl'; $('gl').replaceWith(fresh);   // a disposed context can't be reused
    }
    S = createStage($('gl'), $('labels'), fig(), { reduced: life.reduced, touch, dprCap: touch ? 1.5 : 2 });
    S.hooks.onHover = key => { prose.highlightPart(key); };
    S.hooks.onSelect = key => {
      const pl = $('plate');
      if (!key || !figure.PLATES?.[key]) { pl.hidden = true; return; }
      const ud = S.E.ASM[key].userData;
      pl.innerHTML = `<button type="button" class="close">Close</button><div class="kicker">Closer</div><h2>${ud.title}</h2><p class="sub">${ud.sub || ''}</p><p>${figure.PLATES[key].text}</p>`;
      pl.hidden = false; pl.querySelector('.close').onclick = () => S.select(null);
    };
    if (RENDER || window.__atlas) Object.assign(window.__atlas || {}, { E: S.E, S, labelReport: S.labelReport, sceneReport: S.sceneReport });
  }
  build();

  function draw(now, dt, c) {
    const state = S.step({ now, dt, s: 0, litPage: 0, running, clockAt: c, narrow: narrowQ.matches, narrowZoom: figure.narrowZoom ?? 1 });
    $('readout').textContent = figure.readout(state, params);
    (figure.chips || []).forEach((ch, i) => {
      const txt = c > 0 || ran ? String(ch.value(state, params)) : '–';
      if (chipEls[i].textContent !== txt) chipEls[i].textContent = txt;
      chipEls[i].parentNode.classList.toggle('on', c > 0 || ran);
    });
    if (figure.chart) applyChartSlot($('chart'), figure.chart(state, params), state, params);
    prose.sync(state, params);
    if (soundCtl?.on && soundCtl.ctx && figure.sonify) {
      try { figure.sonify(soundCtl.ctx, state, 0, params); } catch {}
    }
    const sp = running && figure.run.real ? speedLabel(figure.run.real(params), duration()) : '';
    $('speed').textContent = sp; $('speed').hidden = !sp;
  }
  function frame(now) {
    const dt = Math.min(Math.max((now - last) / 1000, 0), 1 / 20); last = now;
    if (running) {
      clock = life.reduced ? duration() : Math.min(clock + dt, duration());
      if (clock >= duration()) { running = false; ran = true; $('run').textContent = 'Run it again'; reveal(); syncUrl(); }
    }
    draw(now, dt, clock);
    if (!RENDER && !life.hidden) raf = requestAnimationFrame(frame);
    else raf = 0;
  }
  document.fonts.ready.then(() => requestAnimationFrame(t => { frameReady = true; last = t; if (RENDER) draw(0, 0, 0); else frame(t); }));
  window.__atlas = { E: S.E, S, N: 1, labelReport: S.labelReport, sceneReport: S.sceneReport, lifecycle: life, params, reset, shareUrl,
    get state() { return { clock, running, predicted, ran }; }, get clock() { return S.clock; } };
  if (RENDER) {
    const D = duration() + END;
    window.DURATION = D;
    window.__atlas.tour = { starts: [0], dwells: [D] };
    window.seek = t => { t = Math.min(Math.max(t, 0), D); draw(t * 1000, 1 / 60, Math.min(t, duration())); return t; };
  }
}
