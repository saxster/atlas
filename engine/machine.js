// The machine: a figure that answers one question in steps. One button per step, in order; only the next is live,
// so nobody skips the part that matters. Manual (the default) waits for every press; Auto plays them all on a loop.
// Each step moves the camera to its view and runs the model through its stretch of time, at a speed the badge states
// (×4, ×1/20, a year a second). Readout chips stay "–" until a step earns them. One line under the figure says the
// big idea. Built on the stage (stage.js), so hover, click-to-break-down, drag and labels work as in a book.
//
// figure: {
//   no, title, question, bigIdea,
//   intro: { cam, look?, lit?, fig? },                     the view before the first step
//   STEPS: [{ label, hint, run, play, real?, cam, look?, lit?, fig?, sounds?: [{ at, word, where: state => V | null }] }],
//     run: model seconds the step covers; play: seconds it takes on screen; real: real-world seconds the step stands
//     for, when the model's clock isn't real time (a year of saving), for the speed badge
//   buildWorld(E) → { update(state, look), labels }, lookKeys, state(clock, reduced),
//   readout(state, step) → text for the corner, chips: [{ label, from (step number, 1-based), value: state → text }],
//   PLATES?: { key: { text, facts?(state) } }               breakdowns, as in a book
//   narrowZoom?: camera distance factor on phones (narrow figures need to stand further back),
//   frameAspect?: the canvas aspect the cameras were framed for (default 1.25); a narrower canvas pulls back.
//     A step (or intro) may give its own, for a close-up inside a wide figure
//   events?: model times of designed discrete changes (a coin dropping in, a new column): tools/jumps.mjs reports
//     frames there apart from real jumps. Step starts and ends count as events too.
// }
import { createStage, smooth, mountShareButton, mountCutBar } from './stage.js';

const $ = id => document.getElementById(id);
const MODE_KEY = 'atlas:machine-mode';
const GAP = 0.7, FIRST = 0.9, END = 1.8;          // ?render tour: seconds before the first step, between steps, at the end

// a speed as the badge says it: ×4, ×1/20, or "1 year a second" for clocks far from real time
export function speedLabel(realSeconds, playSeconds) {
  const k = realSeconds / playSeconds;
  if (Math.abs(k - 1) < 0.05) return '';
  const units = [['year', 365.25 * 86400], ['month', 365.25 * 86400 / 12], ['day', 86400], ['hour', 3600], ['minute', 60]];
  if (k >= 600) { const [u, s] = units.find(([, s]) => k >= s * 0.95); const n = k / s; return `${n >= 9.5 ? Math.round(n) : +n.toFixed(1)} ${u}${Math.abs(n - 1) < 0.05 ? '' : 's'} a second`; }
  return k >= 1 ? `×${k >= 9.5 ? Math.round(k) : +k.toFixed(1)}` : `×1/${1 / k >= 9.5 ? Math.round(1 / k) : +(1 / k).toFixed(1)}`;
}

export function startMachine(figure) {
  const touch = matchMedia('(pointer: coarse)').matches;
  const narrowQ = matchMedia('(max-width: 900px)');
  const { STEPS } = figure, N = STEPS.length;
  const PAGES = [{ fig: figure.title, ...figure.intro, look: figure.intro.look || {} }, ...STEPS.map(s => ({ fig: s.fig || s.label, ...s, look: s.look || {} }))];
  const T0 = []; { let t = 0; for (const s of STEPS) { T0.push(t); t += s.run; } }
  const TEND = T0[N - 1] + STEPS[N - 1].run;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const Q = new URLSearchParams(location.search), RENDER = Q.has('render');
  if (RENDER) document.documentElement.classList.add('render');

  // ---------- where the machine is: done steps, and the step playing (k, 1-based) u seconds in ----------
  // everything drawn is a function of this, so the reader's presses and a recorded tour draw the same frames
  function poseOf(done, k, u) {
    if (!k) return { s: done, clock: done ? T0[done - 1] + STEPS[done - 1].run : 0, step: done, playing: false };
    const st = STEPS[k - 1], p = Math.min(u / st.play, 1);
    // the camera glides to the step's view over up to 1.6 s (smoothstep: no sudden swing in the middle)
    return { s: k - 1 + smooth(0, 1, u / Math.min(1.6, st.play)), clock: T0[k - 1] + st.run * p, step: k, playing: p < 1, u };
  }
  // when a step's glide is halfway (s crosses k − ½, where the lit thing changes): smooth(0, 1, x) = ½ at x = ½
  const bisectHalf = st => 0.5 * Math.min(1.6, st.play);
  // the ?render tour: Auto from the first press to the end, a pure function of t
  const TOUR = []; { let t = FIRST; for (const s of STEPS) { TOUR.push(t); t += s.play + GAP; } }
  const DURATION = TOUR[N - 1] + STEPS[N - 1].play + END;
  function tourAt(t) {
    let k = 0; while (k < N && t >= TOUR[k]) k++;
    if (!k) return [0, 0, 0];
    const u = t - TOUR[k - 1];
    return u >= STEPS[k - 1].play ? [k, 0, 0] : [k - 1, k, u];
  }

  // ---------- page ----------
  document.title = `${figure.title} · Atlas`;
  $('figtitle').textContent = figure.title; $('figno').textContent = `Fig. ${figure.no}`;
  $('question').textContent = figure.question; $('bigidea').innerHTML = `<b>The big idea:</b> ${figure.bigIdea}`;
  $('steps').innerHTML = STEPS.map((s, i) => `<li><button type="button" class="step" data-k="${i + 1}"><span class="n">${i + 1}</span><span class="lab">${s.label}</span></button></li>`).join('');
  $('chips').innerHTML = (figure.chips || []).map((c, i) => `<div class="chip" data-i="${i}"><span class="v">–</span><span class="l">${c.label}</span></div>`).join('');
  const stepB = [...document.querySelectorAll('#steps .step')], chipEls = [...document.querySelectorAll('#chips .chip .v')];

  let mode = RENDER ? 'auto' : (localStorage.getItem(MODE_KEY) === 'auto' && !reduced ? 'auto' : 'manual');
  let done = !RENDER && Q.has('step') ? Math.min(Math.max(+Q.get('step') || 0, 0), N) : 0, k = 0, u = 0, wait = 0;
  let cutBar = null;
  let idleWait = 0;
  if (!RENDER && Q.has('t') && !Q.has('step')) {
    const tc = +Q.get('t') || 0;
    for (let i = 0; i < N; i++) if (tc >= T0[i] + STEPS[i].run - 1e-6) done = i + 1;
  }
  const shareUrl = () => {
    const url = new URL(location.href); url.search = '';
    const d = k ? k : done;
    if (d > 0) url.searchParams.set('step', String(d));
    const p = poseOf(done, k, u);
    if (p.clock > 0) url.searchParams.set('t', p.clock.toFixed(2));
    if (cutBar && cutBar.mode !== 'solid') url.searchParams.set('cut', cutBar.mode);
    return url.toString();
  };
  const syncMode = () => document.querySelectorAll('#mode button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
  document.querySelectorAll('#mode button').forEach(b => b.onclick = () => { mode = b.dataset.mode; idleWait = 0; localStorage.setItem(MODE_KEY, mode); syncMode(); if (mode === 'auto' && !k) wait = 0.4; });
  syncMode();
  function press(n) { if (k || n !== done + 1) return; k = n; u = 0; }
  function startOver() { done = 0; k = 0; u = 0; wait = mode === 'auto' ? 0.6 : 0; cutBar?.reset(); S.select(null); }
  $('steps').addEventListener('click', e => { const b = e.target.closest('.step'); if (!b) return; if (mode === 'auto') { mode = 'manual'; idleWait = 0; syncMode(); } press(+b.dataset.k); });
  $('again').onclick = startOver;
  mountShareButton($('again'), shareUrl);
  addEventListener('keydown', e => {
    if (e.target.closest?.('button, input, select, textarea, a')) return;
    if (mode === 'auto' && !RENDER) idleWait = 25;
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (done === N) startOver(); else press(done + 1); }
    if (e.key === 'Escape') S.select(null);
  });

  // ---------- the figure ----------
  const S = createStage($('gl'), $('labels'), { ...figure, PAGES }, { reduced, touch, dprCap: touch ? 1.5 : 2 });
  S.hooks.onPointerDown = () => { if (mode === 'auto' && !RENDER) { idleWait = 25; } };

  // Optional cutaway / x-ray / section bar when figure.cuts is provided
  cutBar = mountCutBar($('mode'), figure, () => S, { initialMode: Q.get('cut') || null, place: 'after' });
  if (cutBar && Q.has('cut')) cutBar.apply(Q.get('cut'), true);

  // Simulated operator cursor + click ring during Auto / ?render tours
  const tourCur = document.createElement('div');
  tourCur.className = 'tourcursor';
  tourCur.setAttribute('aria-hidden', 'true');
  tourCur.innerHTML = `<span class="ring"></span><svg width="18" height="18" viewBox="0 0 28 28"><path d="M3 2 L24 11 L14 14.5 L10.5 24 Z" fill="var(--hi, #18181a)" stroke="var(--card, #fff)" stroke-width="2" stroke-linejoin="round"/></svg>`;
  document.body.appendChild(tourCur);
  const ringEl = tourCur.querySelector('.ring');
  function updateTourCursor(pose) {
    const show = (mode === 'auto' || RENDER) && idleWait <= 0 && !narrowQ.matches && stepB.length > 0;
    if (!show || !pose.step) { tourCur.style.opacity = '0'; return; }
    const btn = stepB[pose.step - 1];
    if (!btn) { tourCur.style.opacity = '0'; return; }
    const r = btn.getBoundingClientRect();
    const tx = r.left + 22, ty = r.top + r.height * 0.55;
    const age = pose.playing ? (pose.u || 0) : 99;
    const pressRing = age >= 0 && age < 0.45 ? 1 - age / 0.45 : 0;
    tourCur.style.opacity = age < 1.1 ? String(Math.min(1, (1.1 - age) / 0.35)) : '0';
    tourCur.style.transform = `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) scale(${age < 0.14 ? 0.88 : 1})`;
    ringEl.style.opacity = String(pressRing * 0.85);
    ringEl.style.transform = `translate(-50%, -50%) scale(${(0.35 + (1 - pressRing) * 0.9).toFixed(2)})`;
  }
  S.hooks.onHover = key => { $('hint').textContent = key ? `${S.E.ASM[key].userData.title}: click to look closer` : hintFor(); };
  S.hooks.onSelect = key => {
    const pl = $('plate');
    if (!key || !figure.PLATES?.[key]) { pl.hidden = true; return; }
    const ud = S.E.ASM[key].userData;
    pl.innerHTML = `<button type="button" class="close">Close</button><div class="kicker">Closer</div><h2>${ud.title}</h2><p class="sub">${ud.sub || ''}</p><p>${figure.PLATES[key].text}</p><table class="data" id="facts"></table>`;
    pl.hidden = false; pl.querySelector('.close').onclick = () => S.select(null);
  };
  // the caption says what the running or last finished step shows, and stays until the next one starts
  const hintAt = (d, r) => r ? STEPS[r - 1].hint : d ? STEPS[d - 1].hint + (d === N ? ' Start over to watch it again.' : '') : `Press 1 to start: ${STEPS[0].label.toLowerCase()}.`;
  const hintFor = () => hintAt(done, k);

  // sound words: a short handwritten word drawn on the action, for a moment
  const sounds = STEPS.flatMap((st, i) => (st.sounds || []).map(sd => { const el = document.createElement('div'); el.className = 'lbl sound'; el.textContent = sd.word; $('labels').appendChild(el); return { ...sd, step: i + 1, el }; }));
  function drawSounds(pose, state) {
    for (const sd of sounds) {
      const age = pose.step === sd.step && pose.playing ? pose.u - sd.at : -1;
      const on = age >= 0 && age < (sd.dur ?? 0.7);
      const p = on && sd.where(state);
      if (!p) { sd.el.style.opacity = 0; continue; }
      const r = $('gl').getBoundingClientRect(), [x, y, front] = S.E.toScreen(p, r.width, r.height);
      sd.el.style.opacity = front ? 1 - Math.max(0, age - (sd.dur ?? 0.7) * 0.6) / ((sd.dur ?? 0.7) * 0.4) : 0;
      sd.el.style.left = `${x}px`; sd.el.style.top = `${y - 14 - 10 * age}px`;
    }
  }

  let lastDone = -1, lastK = -1;
  function draw(now, dt, pose) {
    const state = S.step({ now, dt, s: pose.s, litPage: Math.round(pose.s), running: pose.playing || mode === 'auto', clockAt: pose.clock, narrow: narrowQ.matches, narrowZoom: figure.narrowZoom ?? 1, blend: 'linear' });
    $('readout').textContent = figure.readout(state, pose.step ? STEPS[pose.step - 1] : null);
    (figure.chips || []).forEach((c, i) => { chipEls[i].textContent = pose.step >= c.from ? c.value(state) : '–'; chipEls[i].parentNode.classList.toggle('on', pose.step >= c.from); });
    const st = pose.playing ? STEPS[pose.step - 1] : null, sp = st && (st.real ?? st.run) > 0 ? speedLabel(st.real ?? st.run, st.play) : '';   // a step that only changes the view has no speed
    $('speed').textContent = sp; $('speed').hidden = !sp;
    drawSounds(pose, state);
    updateTourCursor(pose);
    cutBar?.syncFromLook(S.lastLook);
    if (S.selected && $('facts') && figure.PLATES[S.selected].facts) $('facts').innerHTML = figure.PLATES[S.selected].facts(state).map(([a, b]) => `<tr><td>${a}</td><td>${b}</td></tr>`).join('');
    const curDone = pose.playing ? pose.step - 1 : pose.step, curK = pose.playing ? pose.step : 0;
    if (curDone !== lastDone || curK !== lastK) {
      lastDone = curDone; lastK = curK;
      stepB.forEach((b, i) => {
        const n = i + 1;
        b.classList.toggle('done', n <= curDone); b.classList.toggle('running', n === curK);
        b.classList.toggle('next', !curK && n === curDone + 1);
        b.disabled = !!curK || n !== curDone + 1;
        b.setAttribute('aria-current', n === curK ? 'step' : 'false');
      });
      // phones show the steps as a scrolling row: keep the running or next one in view
      const at = stepB[(curK || curDone + 1) - 1]; if (at && narrowQ.matches && !RENDER) at.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      $('again').classList.toggle('strong', curDone === N);
      $('hint').textContent = hintAt(curDone, curK);
    }
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(Math.max((now - last) / 1000, 0), 1 / 20); last = now;
    if (k) {
      u += reduced ? STEPS[k - 1].play : dt;                 // reduced motion: a step lands at once
      if (u >= STEPS[k - 1].play) { done = k; k = 0; u = 0; wait = done === N ? END : GAP; }
    } else if (mode === 'auto') {
      if (idleWait > 0) {
        idleWait = Math.max(0, idleWait - dt);
      } else {
        wait -= dt;
        if (wait <= 0) { if (done === N) startOver(); else press(done + 1); }
      }
    }
    draw(now, dt, poseOf(done, k, u));
    if (!RENDER) requestAnimationFrame(frame);
  }
  if (mode === 'auto') wait = 2;   // a remembered Auto: a moment to see the page, and the Manual switch, before it moves
  document.fonts.ready.then(() => requestAnimationFrame(t => { if (RENDER) draw(0, 0, poseOf(0, 0, 0)); else frame(t); }));

  window.__atlas = { E: S.E, S, N: PAGES.length, labelReport: S.labelReport, press, startOver, shareUrl, setCut: c => cutBar?.apply(c, true),
    get state() { return { done, k, u, mode, cut: cutBar?.mode || 'solid' }; }, get clock() { return S.clock; } };
  if (RENDER) {
    window.DURATION = DURATION;
    // stills land mid-step: each step's tour stretch, the intro before the first press
    window.__atlas.tour = { starts: [0, ...TOUR], dwells: [FIRST, ...STEPS.map(s => s.play + GAP)] };
    // designed discrete changes, as tour times: the figure's own events, mapped through the steps, and every step's ends
    const tourOf = c => { for (let i = 0; i < N; i++) if (STEPS[i].run > 0 && c >= T0[i] && c <= T0[i] + STEPS[i].run) return TOUR[i] + (c - T0[i]) / STEPS[i].run * STEPS[i].play; return null; };
    // …and the moment each step's lit thing takes over from the last (halfway through its camera glide: one thing lit at a time)
    const litSwitch = STEPS.flatMap((st, i) => PAGES[i + 1].lit !== PAGES[i].lit ? [TOUR[i] + bisectHalf(st)] : []);
    window.__atlas.events = [...(figure.events || []).map(tourOf).filter(t => t !== null), ...TOUR, ...TOUR.map((t, i) => t + STEPS[i].play), ...litSwitch].sort((a, b) => a - b);
    window.seek = t => { t = Math.min(Math.max(t, 0), DURATION); const [d, kk, uu] = tourAt(t); draw(t * 1000, 1 / 60, poseOf(d, kk, uu)); return t; };
  }
}
