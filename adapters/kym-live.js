// An atlas figure inside a kym textbook's live widget (live/core.js: Live.register(name, (stage, params, api) => …)).
// The book owns time and Play: its api.loop calls us each frame (dt 0 for a still frame while paused). The figure
// takes the book's theme (sepia, light, dark) and rebuilds when the reader switches it. Between the book's frames the
// adapter draws on its own for a moment after a touch, so a breakdown opens and the camera turns while paused, but
// the physics stays where the reader stopped it. Every part of the page is also a button, the keyboard's way in.
//
// Rich affordances supported out of the box:
//   - Multi-page chapter navigation (1..N page tabs with smooth camera transitions)
//   - Solid / X-ray / Section 3D cutaway mode pills
//   - Interactive parameter sliders coupled to pure model state
//   - Click/hover/keyboard 3D assembly breakdowns (E.asm) + Explode-all toggle
//   - Direct 3D draggable handles (E.draggable) + SVG leader lines
//   - Optional user-initiated Web Audio sonification (api.audio())
//   - Optional user-initiated HTML5 sensor bridge (camera photometer, mic spirometer, device tilt)
//   - Automatic 2D Canvas paper-and-ink fallback when WebGL is disabled
import { createStage } from '../engine/stage.js';
import { readTheme } from '../engine/theme.js';

const CSS = `
.atlas-stage { position: relative; width: 100%; border-radius: 6px; overflow: hidden; background: var(--sheet); touch-action: pan-y; box-sizing: border-box; }
.atlas-stage canvas { display: block; width: 100%; height: 100%; cursor: grab; }
.atlas-stage canvas.pointing { cursor: pointer; }
.atlas-stage canvas.draggable-hover { cursor: move; }
.atlas-stage canvas.dragging { cursor: grabbing; }
.atlas-stage .atlas-labels { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
.atlas-stage .lbl { position: absolute; transform: translate(-50%, -50%); white-space: nowrap; }
.atlas-stage .lbl.vec { font: italic 20px/1 Georgia, 'Times New Roman', serif; color: var(--ink); }
.atlas-stage .lbl.vec.red { color: var(--proton); }
.atlas-stage .lbl.vec.blue { color: var(--electron); }
.atlas-stage .lbl.vec.grey, .atlas-stage .lbl.mark { color: var(--muted); }
.atlas-stage .lbl.mark { font: 14px/1 Georgia, serif; }
.atlas-stage .lbl.tick { font: 11px/1 ui-monospace, monospace; color: var(--muted); transform: translate(-100%, -50%); }
.atlas-stage .lbl.board { font: italic 16px/1 Georgia, serif; color: var(--ink); transform: translate(0, -50%); }
.atlas-stage .lbl.axis { font: italic 14px/1 Georgia, serif; color: var(--muted); transform: translate(-100%, -50%); }
.atlas-stage .atlas-title { position: absolute; top: 10px; right: 14px; font: italic 15px/1.3 Georgia, serif; color: var(--ink); pointer-events: none; text-align: right; max-width: 72%; background: color-mix(in srgb, var(--sheet) 82%, transparent); padding: 2px 7px; border-radius: 4px; }
.atlas-stage .atlas-badge { position: absolute; bottom: 8px; left: 12px; font: 500 11px/1.3 var(--sans, system-ui, sans-serif); color: var(--muted); pointer-events: none; background: color-mix(in srgb, var(--sheet) 82%, transparent); padding: 2px 6px; border-radius: 4px; }
.atlas-parts, .atlas-cuts, .atlas-pages { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; max-width: 100%; }
`;
let styled = false;
const style = () => {
  if (styled) return;
  styled = true;
  const s = document.createElement('style');
  s.textContent = CSS;
  document.head.appendChild(s);
};

export function mountAtlas(stage, params, api, chapter, defaults = {}) {
  const opts = { page: 0, height: 420, showPages: true, ...defaults, ...params };
  // If opened from a specific lesson id, allow lessonPresets[params.lesson] to pick initial page and parameter overrides
  const preset = (opts.lesson && chapter.lessons && (
    chapter.lessons[opts.lesson] ||
    Object.entries(chapter.lessons).find(([k]) => opts.lesson.startsWith(k))?.[1]
  )) || null;
  const initPage = preset?.page !== undefined ? preset.page : (opts.page | 0);
  let page = Math.min(Math.max(initPage, 0), chapter.PAGES.length - 1);
  let sPos = page;
  let P = chapter.PAGES[page];

  if (chapter.defaultParams) {
    chapter.params = { ...chapter.defaultParams, ...(chapter.params || {}), ...(preset?.params || {}) };
  } else if (preset?.params) {
    chapter.params = { ...(chapter.params || {}), ...preset.params };
  }

  style();
  const wrap = document.createElement('div');
  wrap.className = 'atlas-stage lab-diagram-scroll';
  wrap.tabIndex = 0;
  wrap.style.height = `${opts.height}px`;
  wrap.setAttribute('role', 'img');
  const updateAria = () => {
    wrap.setAttribute(
      'aria-label',
      `${P.fig}. ${P.alt || P.title || ''} Drag to turn in 3D; use the buttons below to step pages, slice sections, or take parts apart.`.replace(/\s+/g, ' ')
    );
  };
  updateAria();

  let canvas = document.createElement('canvas');
  canvas.dataset.logicalWidth = '680';
  canvas.style.aspectRatio = '680 / 420';
  const labels = document.createElement('div');
  const title = document.createElement('div');
  const badge = document.createElement('div');
  labels.className = 'atlas-labels';
  title.className = 'atlas-title';
  badge.className = 'atlas-badge';
  title.textContent = P.fig;
  badge.textContent = '3D Atlas · Drag to orbit · Click part to explode';
  wrap.append(canvas, labels, title, badge);
  stage.appendChild(wrap);
  const say = api.readout();
  const controlsEl = api.controls || say.element?.parentElement || stage.parentElement?.querySelector('.live-controls') || stage;

  let S = null;
  let fallback2D = false;
  let clock = chapter.clock0 || 0;
  let hostAt = 0;
  let raf = 0;
  let kickUntil = 0;
  let lastT = 0;
  let cutMode = 'solid';
  let explodeAll = false;
  let sonifyOn = false;
  let lastSonifyAt = 0;
  let sensorCleanup = null;
  let sliderInputs = new Map();

  const describe = k => {
    const u = S?.E?.ASM?.[k]?.userData || { title: k, sub: '' };
    const pl = chapter.PLATES?.[k] || { text: '' };
    return `<b>${u.title}</b>${u.sub ? ' · ' + u.sub : ''}<br>${pl.text}`;
  };

  function applyCutMode(mode) {
    cutMode = mode;
    if (!S || fallback2D) return;
    if (mode === 'solid') {
      S.cutOverride = 'solid';
      S.E.setXray(0, chapter.xrayKeys || null);
      S.E.setCutaway(null, chapter.cutKeys || null);
    } else if (mode === 'xray') {
      S.cutOverride = 'xray';
      S.E.setXray(0.84, chapter.xrayKeys || null);
      S.E.setCutaway(null, chapter.cutKeys || null);
    } else if (mode === 'section') {
      S.cutOverride = 'section';
      S.E.setXray(0.28, chapter.xrayKeys || null);
      S.E.setCutaway(chapter.cutPlane || [0, 0, -1, 0.05], chapter.cutKeys || null);
    }
  }

  function drawFallback(dt, running) {
    if (!reducedMotion() && running) clock += dt;
    const state = chapter.state(clock, reducedMotion());
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth || 680;
      const h = canvas.clientHeight || opts.height || 420;
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      ctx.save();
      ctx.scale(dpr, dpr);
      const th = readTheme(stage);
      const bg = th === 'dark' ? '#171c1b' : th === 'light' ? '#f9f7f2' : '#f2e8d5';
      const ink = th === 'dark' ? '#e8e4da' : '#1d2422';
      const muted = th === 'dark' ? '#9aa5a1' : '#5d6c66';
      const accent = th === 'dark' ? '#68b0d8' : '#2f6d8f';
      const warm = th === 'dark' ? '#e07a5f' : '#b8432f';
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      if (chapter.drawFallback2D) {
        chapter.drawFallback2D(ctx, w, h, state, page, { bg, ink, muted, accent, warm, cutMode });
      } else {
        // Generic schematic 2D orthographic fallback with parts & live state
        ctx.strokeStyle = muted;
        ctx.lineWidth = 1;
        ctx.strokeRect(16, 16, w - 32, h - 32);
        ctx.fillStyle = ink;
        ctx.font = 'bold 15px system-ui, sans-serif';
        ctx.fillText(P.title || P.fig || 'Atlas 3D View (2D Schematic Fallback)', 28, 44);
        ctx.fillStyle = muted;
        ctx.font = '13px Georgia, serif';
        const bodyTxt = (P.body?.[0] || '').replace(/<[^>]+>/g, '');
        ctx.fillText(bodyTxt.slice(0, 88) + (bodyTxt.length > 88 ? '…' : ''), 28, 68);
        const parts = P.parts || (P.lit ? [P.lit] : Object.keys(chapter.PLATES || {}).slice(0, 4));
        parts.forEach((pk, idx) => {
          const bx = 28 + (idx % 2) * ((w - 72) / 2);
          const by = 92 + Math.floor(idx / 2) * 86;
          const bw = (w - 84) / 2;
          const bh = 72;
          const active = S?.selected === pk;
          ctx.fillStyle = active ? accent + '22' : bg;
          ctx.strokeStyle = active ? warm : accent;
          ctx.lineWidth = active ? 2 : 1.2;
          ctx.beginPath();
          ctx.roundRect(bx, by, bw, bh, 6);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = ink;
          ctx.font = 'bold 13px system-ui, sans-serif';
          ctx.fillText(pk.replace(/_/g, ' ').toUpperCase(), bx + 12, by + 24);
          const pText = (chapter.PLATES?.[pk]?.text || '').replace(/<[^>]+>/g, '');
          ctx.fillStyle = muted;
          ctx.font = '12px system-ui, sans-serif';
          ctx.fillText(pText.slice(0, 46) + (pText.length > 46 ? '…' : ''), bx + 12, by + 46);
        });
        // Live state bar at bottom
        const readPlain = (chapter.readout ? chapter.readout(state, P) : '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        ctx.fillStyle = accent;
        ctx.font = '12px ui-monospace, monospace';
        ctx.fillText(readPlain.slice(0, 96), 28, h - 30);
      }
      ctx.restore();
    }
    const k = S?.selected;
    say(
      k && chapter.PLATES?.[k]
        ? `<b>${k}</b> · ${chapter.PLATES[k].text}`
        : opts.readout
          ? opts.readout(state, P, page)
          : chapter.readout(state, P, page).replace(/\n/g, '<br>')
    );
  }

  function reducedMotion() {
    return !!(api.reduced || matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function build() {
    if (S && !fallback2D) {
      clock = S.clock;
      S.destroy();
      const fresh = document.createElement('canvas');
      fresh.dataset.logicalWidth = '680';
      fresh.style.aspectRatio = '680 / 420';
      canvas.replaceWith(fresh);
      canvas = fresh;
      listen();
    }
    try {
      S = createStage(canvas, labels, chapter, {
        reduced: reducedMotion(),
        touch: matchMedia('(pointer: coarse)').matches,
        theme: readTheme(stage),
        dprCap: 2,
      });
      S.clock = clock;
      S.hooks.onPointerDown = kick;
      S.hooks.onHover = kick;
      S.hooks.onSelect = k => {
        syncPartButtons();
        kick();
      };
      S.hooks.onDrag = (item, val) => {
        if (chapter.onDrag) chapter.onDrag(item, val, chapter.params, S);
        syncSlidersFromParams();
        kick();
      };
      if (cutMode !== 'solid') applyCutMode(cutMode);
      fallback2D = false;
    } catch (e) {
      fallback2D = true;
      S = { selected: null, dragging: false, select(k) { this.selected = k; syncPartButtons(); }, destroy() {} };
      badge.textContent = '2D Schematic View · Interactive controls active';
    }
  }

  function draw(dt, running) {
    if (fallback2D) {
      drawFallback(dt, running);
      return;
    }
    // Smoothly ease sPos toward target page
    const diff = page - sPos;
    if (Math.abs(diff) > 0.002) {
      sPos += diff * Math.min(1, (dt || 0.016) * 7.5);
    } else {
      sPos = page;
    }
    const state = S.step({ now: lastT * 1000, dt, s: sPos, litPage: page, running, blend: 'linear' });
    if (explodeAll && !S.selected) {
      S.E.setExplode(0.85, null, true);
      S.E.stepExplode(dt || 0.016);
      S.E.render();
    }
    if (sonifyOn && chapter.sonify && performance.now() - lastSonifyAt > 90) {
      const a = api.audio?.();
      const ctx = a?.ctx || a;
      if (ctx) {
        lastSonifyAt = performance.now();
        try { chapter.sonify(ctx, state, page, chapter.params); } catch (_) { /* ignore audio glitch */ }
      }
    }
    const k = S.selected;
    say(
      k && chapter.PLATES?.[k]
        ? describe(k) +
          (chapter.PLATES[k].facts
            ? '<br>' + chapter.PLATES[k].facts(state).map(([a, b]) => `${a} ${b}`).join(' · ')
            : '')
        : opts.readout
          ? opts.readout(state, P, page)
          : chapter.readout(state, P, page).replace(/\n/g, '<br>')
    );
  }

  // The book's frames; dt > 0 means it is playing
  api.loop((dt, t) => {
    lastT = t;
    if (dt > 0) hostAt = performance.now();
    draw(dt, dt > 0);
  });

  // Our own frames for a moment after a touch, page switch, slider change, or cutaway change when the book is paused
  function kick() {
    kickUntil = performance.now() + 1600;
    if (!raf) raf = requestAnimationFrame(own);
  }
  let ownLast = 0;
  function own(ts) {
    raf = 0;
    const dt = ownLast ? Math.min((ts - ownLast) / 1000, 0.05) : 1 / 60;
    ownLast = ts;
    if (performance.now() - hostAt > 120) draw(dt, false);
    if (performance.now() < kickUntil || S?.dragging || Math.abs(page - sPos) > 0.005) {
      raf = requestAnimationFrame(own);
    } else {
      ownLast = 0;
    }
  }

  function listen() {
    for (const ev of ['pointermove', 'wheel']) {
      canvas.addEventListener(ev, e => { if (e.buttons || ev === 'wheel') kick(); }, { passive: true });
    }
  }
  listen();
  build();

  const themeObs = new MutationObserver(() => {
    build();
    draw(0, false);
  });
  themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  // ---------- 1. Multi-Page Stepper Tabs ----------
  let pageButtons = [];
  if (chapter.PAGES.length > 1 && opts.showPages !== false) {
    const pageWrap = document.createElement('div');
    pageWrap.className = 'live-tabs atlas-pages';
    pageWrap.setAttribute('role', 'group');
    pageWrap.setAttribute('aria-label', 'Chapter 3D stages');
    chapter.PAGES.forEach((pg, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'live-ctl';
      const shortTitle = pg.tab || pg.title || `Stage ${idx + 1}`;
      btn.textContent = `${idx + 1}. ${shortTitle}`;
      btn.setAttribute('aria-pressed', String(idx === page));
      btn.addEventListener('click', () => setPage(idx));
      pageWrap.appendChild(btn);
      pageButtons.push(btn);
    });
    controlsEl.appendChild(pageWrap);
  }

  function setPage(idx) {
    page = Math.min(Math.max(idx | 0, 0), chapter.PAGES.length - 1);
    P = chapter.PAGES[page];
    title.textContent = P.fig;
    updateAria();
    pageButtons.forEach((b, i) => b.setAttribute('aria-pressed', String(i === page)));
    if (S && S.selected) S.select(null);
    rebuildPartButtons();
    kick();
  }

  // ---------- 2. Solid / X-ray / Section Cutaway Controls ----------
  const hasCuts = chapter.cuts !== false;
  let cutButtons = new Map();
  if (hasCuts) {
    const cutWrap = document.createElement('div');
    cutWrap.className = 'live-tabs atlas-cuts';
    cutWrap.setAttribute('role', 'group');
    cutWrap.setAttribute('aria-label', '3D view mode');
    for (const [m, lbl] of [['solid', 'Solid'], ['xray', 'X-ray'], ['section', 'Section cutaway']]) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'live-ctl';
      btn.textContent = lbl;
      btn.setAttribute('aria-pressed', String(m === cutMode));
      btn.addEventListener('click', () => {
        applyCutMode(m);
        for (const [k, b] of cutButtons) b.setAttribute('aria-pressed', String(k === m));
        kick();
      });
      cutWrap.appendChild(btn);
      cutButtons.set(m, btn);
    }
    controlsEl.appendChild(cutWrap);
  }

  // ---------- 3. Interactive Sliders (coupled to chapter.params) ----------
  function syncSlidersFromParams() {
    if (!chapter.params) return;
    for (const [id, entry] of sliderInputs) {
      const v = chapter.params[id];
      if (v !== undefined && Number(entry.input.value) !== Number(v)) {
        entry.input.value = String(v);
        entry.out.textContent = entry.format ? entry.format(v) : `${v}${entry.unit ? ' ' + entry.unit : ''}`;
      }
    }
  }

  if (Array.isArray(chapter.controls) && chapter.controls.length) {
    chapter.params = chapter.params || {};
    for (const c of chapter.controls) {
      const initVal = chapter.params[c.id] !== undefined ? chapter.params[c.id] : c.value;
      chapter.params[c.id] = initVal;
      const row = document.createElement('div');
      row.className = 'live-slider';
      const lab = document.createElement('label');
      const inp = document.createElement('input');
      const out = document.createElement('output');
      const uid = `atlas-sl-${c.id}-${Math.random().toString(36).slice(2, 7)}`;
      lab.htmlFor = uid;
      lab.textContent = c.label;
      inp.id = uid;
      inp.type = 'range';
      inp.min = String(c.min);
      inp.max = String(c.max);
      inp.step = String(c.step ?? 1);
      inp.value = String(initVal);
      const fmt = v => (c.format ? c.format(v) : `${v}${c.unit ? ' ' + c.unit : ''}`);
      out.textContent = fmt(initVal);
      inp.addEventListener('input', () => {
        const val = Number(inp.value);
        chapter.params[c.id] = val;
        out.textContent = fmt(val);
        if (chapter.onParamChange) chapter.onParamChange(chapter.params, S, c.id, val);
        kick();
      });
      row.append(lab, inp, out);
      controlsEl.appendChild(row);
      sliderInputs.set(c.id, { input: inp, out, unit: c.unit, format: c.format });
    }
  }

  // ---------- 4. Keyboard-Accessible Part Breakdown Buttons ----------
  const partsWrap = document.createElement('div');
  partsWrap.className = 'atlas-parts';
  controlsEl.appendChild(partsWrap);
  let partBtnMap = new Map();
  let explodeBtn = null;

  function syncPartButtons() {
    for (const [k, b] of partBtnMap) {
      b.setAttribute('aria-pressed', String(S?.selected === k));
    }
    if (explodeBtn) explodeBtn.setAttribute('aria-pressed', String(explodeAll));
  }

  function rebuildPartButtons() {
    partsWrap.replaceChildren();
    partBtnMap.clear();
    explodeBtn = null;
    const rawParts = P.parts || (P.lit ? [P.lit] : Object.keys(chapter.PLATES || {}));
    const parts = rawParts.filter(k => chapter.PLATES?.[k] && (fallback2D || S?.E?.ASM?.[k]));
    for (const k of parts) {
      const titleTxt = S?.E?.ASM?.[k]?.userData?.title || k.replace(/_/g, ' ');
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'live-ctl';
      b.textContent = `Take apart: ${titleTxt}`;
      b.setAttribute('aria-pressed', String(S?.selected === k));
      b.addEventListener('click', () => {
        explodeAll = false;
        S.select(S.selected === k ? null : k);
        syncPartButtons();
        kick();
      });
      partsWrap.appendChild(b);
      partBtnMap.set(k, b);
    }
    if (parts.length > 1 && !fallback2D) {
      explodeBtn = document.createElement('button');
      explodeBtn.type = 'button';
      explodeBtn.className = 'live-ctl';
      explodeBtn.textContent = 'Explode all parts';
      explodeBtn.setAttribute('aria-pressed', String(explodeAll));
      explodeBtn.addEventListener('click', () => {
        explodeAll = !explodeAll;
        if (explodeAll && S.selected) S.select(null);
        if (!explodeAll && S?.E) S.E.setExplode(0, null, true);
        syncPartButtons();
        kick();
      });
      partsWrap.appendChild(explodeBtn);
    }
  }
  rebuildPartButtons();

  // ---------- 5. Optional Web Audio Sonification ----------
  if (chapter.sonify) {
    const soundBtn = api.button(
      'Sonify model',
      () => {
        sonifyOn = !sonifyOn;
        soundBtn.setAttribute('aria-pressed', String(sonifyOn));
        if (sonifyOn) {
          const a = api.audio?.();
          const ctx = a?.ctx || a;
          if (ctx) {
            const state = chapter.state(clock, reducedMotion());
            try { chapter.sonify(ctx, state, page, chapter.params); } catch (_) { /* ignore */ }
          }
        }
        kick();
      },
      { pressed: false }
    );
  }

  // ---------- 6. Optional HTML5 Hardware Sensor Bridge (Camera Light / Mic Breath / Device Tilt) ----------
  if (chapter.sensor) {
    const spec = chapter.sensor;
    let activeSensor = false;
    const sensorBtn = api.button(
      spec.label || 'Use live sensor',
      async () => {
        if (activeSensor) {
          stopSensor();
          return;
        }
        activeSensor = true;
        sensorBtn.setAttribute('aria-pressed', 'true');
        try {
          if (spec.type === 'light' && navigator.mediaDevices?.getUserMedia) {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 48, height: 48 } });
            const vid = document.createElement('video');
            vid.muted = true;
            vid.playsInline = true;
            vid.srcObject = stream;
            await vid.play();
            const c2 = document.createElement('canvas');
            c2.width = 16;
            c2.height = 16;
            const ctx2 = c2.getContext('2d', { willReadFrequently: true });
            const timer = setInterval(() => {
              if (!activeSensor) return;
              ctx2.drawImage(vid, 0, 0, 16, 16);
              const d = ctx2.getImageData(0, 0, 16, 16).data;
              let sum = 0;
              for (let i = 0; i < d.length; i += 4) sum += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
              const norm = Math.min(1, Math.max(0, sum / (256 * 255)));
              const mapped = Math.round((spec.min ?? 0) + norm * ((spec.max ?? 100) - (spec.min ?? 0)));
              if (chapter.params && spec.param) {
                chapter.params[spec.param] = mapped;
                syncSlidersFromParams();
                kick();
              }
            }, 180);
            sensorCleanup = () => {
              clearInterval(timer);
              stream.getTracks().forEach(t => t.stop());
            };
          } else if (spec.type === 'mic' && navigator.mediaDevices?.getUserMedia) {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const a = api.audio?.();
            const actx = a?.ctx || a;
            const src = actx.createMediaStreamSource(stream);
            const analyser = actx.createAnalyser();
            analyser.fftSize = 256;
            src.connect(analyser);
            const buf = new Uint8Array(analyser.frequencyBinCount);
            const timer = setInterval(() => {
              if (!activeSensor) return;
              analyser.getByteTimeDomainData(buf);
              let sq = 0;
              for (let i = 0; i < buf.length; i++) {
                const v = (buf[i] - 128) / 128;
                sq += v * v;
              }
              const rms = Math.min(1, Math.sqrt(sq / buf.length) * 3.5);
              const mapped = Math.round((spec.min ?? 0) + rms * ((spec.max ?? 100) - (spec.min ?? 0)));
              if (chapter.params && spec.param) {
                chapter.params[spec.param] = mapped;
                syncSlidersFromParams();
                kick();
              }
            }, 150);
            sensorCleanup = () => {
              clearInterval(timer);
               src.disconnect();
              stream.getTracks().forEach(t => t.stop());
            };
          } else if (spec.type === 'tilt') {
            const onOrient = e => {
              if (!activeSensor) return;
              const gamma = Math.max(-45, Math.min(45, e.gamma || 0));
              const norm = (gamma + 45) / 90;
              const mapped = Math.round((spec.min ?? -45) + norm * ((spec.max ?? 45) - (spec.min ?? -45)));
              if (chapter.params && spec.param) {
                chapter.params[spec.param] = mapped;
                syncSlidersFromParams();
                kick();
              }
            };
            window.addEventListener('deviceorientation', onOrient);
            sensorCleanup = () => window.removeEventListener('deviceorientation', onOrient);
          }
        } catch (_) {
          stopSensor();
        }
      },
      { pressed: false }
    );
    function stopSensor() {
      activeSensor = false;
      sensorBtn.setAttribute('aria-pressed', 'false');
      if (sensorCleanup) {
        try { sensorCleanup(); } catch (_) { /* ignore */ }
        sensorCleanup = null;
      }
    }
    api.onHide(() => {
      sonifyOn = false;
      stopSensor();
    });
  } else {
    api.onHide(() => {
      sonifyOn = false;
    });
  }

  draw(0, false);
  return {
    destroy() {
      cancelAnimationFrame(raf);
      if (sensorCleanup) {
        try { sensorCleanup(); } catch (_) { /* ignore */ }
      }
      themeObs.disconnect();
      if (S) S.destroy();
      wrap.remove();
    },
  };
}
