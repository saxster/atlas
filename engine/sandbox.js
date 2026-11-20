// The sandbox: constructive play. Place, remove or drag pieces in 3D, type your own matrix or parameters, or pick a
// preset, and watch the figure, chips and chart respond at once. Built on stage.js and draggable(), with shareable URLs
// and a deterministic ?render tour across presets so tools/cards.mjs and tools/stills.mjs work out of the box.
import { createStage, bindPlaybackLifecycle, ease, mountShareButton, mountCutBar, mountMediumBar } from './stage.js';
import { bindProse } from './prose.js';
import { mountSoundToggle, playClick, playBoop } from './sound.js';
import { renderControl, updateControl, bindControls, mountControlModeBar } from './diegetic.js';

function applySandboxChart(el, res, state, params, items) {
  if (!el || !res) return;
  if (typeof res === 'string') {
    if (el._lastSvg !== res) { el._lastSvg = res; el._chartKey = null; el.innerHTML = res; }
  } else if (typeof res === 'object' && res.svg !== undefined) {
    const k = res.key ?? 'static';
    if (el._chartKey !== k) { el._chartKey = k; el._lastSvg = null; el.innerHTML = res.svg; }
    res.update?.(el, state, params, items);
  }
}

const $ = id => document.getElementById(id);
const clone = x => JSON.parse(JSON.stringify(x));

export function startSandbox(figure) {
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

  const baseParams = { ...figure.params };
  const baseItems = clone(figure.initialItems || []);
  const params = { ...baseParams };
  let items = clone(baseItems);
  let activePreset = figure.presets?.[0]?.key || '';
  let cutBar = null;

  // Restore state from URL query string (?preset=... or ?a=1.5&b=...&items=...)
  if (Q.has('preset')) {
    const pr = (figure.presets || []).find(p => p.key === Q.get('preset'));
    if (pr) {
      activePreset = pr.key;
      if (pr.params) Object.assign(params, pr.params);
      if (pr.items) items = clone(pr.items);
    }
  }
  for (const k of Object.keys(baseParams)) if (Q.has(k)) params[k] = Number.isNaN(+Q.get(k)) ? Q.get(k) : +Q.get(k);
  if (Q.has('items')) {
    try { const parsed = JSON.parse(Q.get('items')); if (Array.isArray(parsed)) items = parsed; } catch {}
  }

  document.title = `${figure.title} · Atlas`;
  $('figtitle').textContent = figure.title; $('figno').textContent = `Fig. ${figure.no}`;
  $('question').textContent = figure.question; $('bigidea').innerHTML = `<b>The big idea:</b> ${figure.bigIdea}`;
  $('chips').innerHTML = (figure.chips || []).map((c, i) => `<div class="chip on${c.tone === 'ink' ? ' chip-ink' : ''}" data-i="${i}"><span class="v">–</span><span class="l">${c.label}</span></div>`).join('');
  const chipEls = [...document.querySelectorAll('#chips .chip .v')];

  const shareUrl = () => {
    const u = new URL(location.href); u.search = '';
    for (const [k, v] of Object.entries(params)) {
      if (v !== baseParams[k]) u.searchParams.set(k, typeof v === 'number' ? String(+v.toFixed(3)) : String(v));
    }
    if (JSON.stringify(items) !== JSON.stringify(baseItems)) u.searchParams.set('items', JSON.stringify(items));
    if (cutBar && cutBar.mode !== 'solid') u.searchParams.set('cut', cutBar.mode);
    return u.toString();
  };
  const syncUrl = () => { if (!RENDER) history.replaceState(null, '', shareUrl()); };

  // ---------- optional cutaway / x-ray / section bar ----------
  cutBar = mountCutBar($('presets') || $('controls'), figure, () => S, {
    initialMode: Q.get('cut') || null,
    place: 'before',
    onChange: () => syncUrl(),
  });

  // ---------- presets ----------
  const presetsEl = $('presets');
  function renderPresets() {
    if (!presetsEl) return;
    if (!figure.presets?.length) { presetsEl.hidden = true; return; }
    presetsEl.innerHTML = `<div class="kicker">Presets</div><div class="preset-row">${figure.presets.map(p =>
      `<button type="button" class="preset" data-preset="${p.key}" aria-pressed="${p.key === activePreset}">${p.label}</button>`).join('')}</div>`;
  }
  if (presetsEl) {
    renderPresets();
    presetsEl.addEventListener('click', e => {
      const b = e.target.closest('[data-preset]'); if (!b) return;
      const pr = figure.presets.find(p => p.key === b.dataset.preset); if (!pr) return;
      activePreset = pr.key;
      if (pr.params) Object.assign(params, pr.params);
      if (pr.items) items = clone(pr.items);
      syncInputs(); renderPresets(); renderPalette();
      build(); syncUrl();
    });
  }

  // ---------- 2x2 matrix / custom expression editor ----------
  const matrixEl = $('matrix');
  function renderMatrix() {
    if (!matrixEl) return;
    if (!figure.matrix) { matrixEl.hidden = true; return; }
    const keys = figure.matrix.keys || ['a', 'b', 'c', 'd'];
    const labels = figure.matrix.labels || keys;
    const step = figure.matrix.step ?? 0.1;
    matrixEl.innerHTML = `<div class="kicker">${figure.matrix.title || 'Matrix entries'}</div>
      <div class="mat-bracket"><div class="mat-grid">${keys.map((k, i) =>
        `<label class="mat-cell"><span>${labels[i]}</span><input type="number" step="${step}" inputmode="decimal" enterkeyhint="done" data-mkey="${k}" value="${(+params[k]).toFixed(2)}"></label>`).join('')}</div></div>`;
  }
  if (matrixEl) {
    renderMatrix();
    matrixEl.addEventListener('input', e => {
      const k = e.target.dataset.mkey; if (!k) return;
      const v = parseFloat(e.target.value); if (Number.isNaN(v)) return;
      params[k] = v; activePreset = ''; renderPresets();
      syncSliders(); syncUrl();
    });
  }

  // ---------- constructive piece palette ----------
  const paletteEl = $('palette');
  const maxItems = figure.maxItems ?? 8;
  function renderPalette() {
    if (!paletteEl) return;
    if (!figure.palette?.length) { paletteEl.hidden = true; return; }
    paletteEl.innerHTML = `<div class="kicker">Place &amp; sculpt (${items.length}/${maxItems})</div>
      <div class="pal-add">${figure.palette.map(p =>
        `<button type="button" class="pal-btn" data-add="${p.type}" ${items.length >= maxItems ? 'disabled' : ''}>+ ${p.label}</button>`).join('')}</div>
      ${items.length ? `<ul class="pal-items">${items.map((it, i) =>
        `<li><span>${figure.itemLabel ? figure.itemLabel(it, i) : `${it.label || it.type || 'Piece'} #${i + 1}`}</span><button type="button" data-rem="${i}" aria-label="Remove piece ${i + 1}">×</button></li>`).join('')}</ul>` : ''}`;
  }
  if (paletteEl) {
    renderPalette();
    paletteEl.addEventListener('click', e => {
      const addB = e.target.closest('[data-add]'), remB = e.target.closest('[data-rem]');
      if (addB && items.length < maxItems) {
        const spec = figure.palette.find(p => p.type === addB.dataset.add);
        if (spec) {
          items.push(spec.make(items.length, params, items));
          activePreset = ''; renderPresets(); renderPalette();
          build(); syncUrl();
        }
      } else if (remB) {
        const idx = +remB.dataset.rem;
        items.splice(idx, 1);
        activePreset = ''; renderPresets(); renderPalette();
        build(); syncUrl();
      }
    });
  }

  // ---------- controls ----------
  const fmt = c => (c.fmt || (v => String(v)))(params[c.key]);
  const hasDiegetic = (figure.controls || []).some(c => c.ui?.kind);
  let ctlMode = Q.get('controls') === 'creative' ? 'creative' : (Q.get('controls') === 'standard' ? 'standard' : (figure.controlMode || 'standard'));
  function renderControls() {
    if (!$('controls')) return;
    $('controls').innerHTML = (figure.controls || []).map(c =>
      renderControl(c, params[c.key], { mode: ctlMode, idPrefix: `sb-${figure.no || 'fig'}` })
    ).join('');
  }
  renderControls();
  function syncSliders() {
    for (const c of figure.controls || []) {
      const inp = $('controls')?.querySelector(`input[data-key="${c.key}"]`);
      const out = inp?.closest('[data-ctl]')?.querySelector('[data-out]') || inp?.nextElementSibling;
      if (inp) inp.value = params[c.key];
      if (out) out.textContent = fmt(c);
      updateControl($('controls'), c, params[c.key]);
    }
  }
  function syncMatrixInputs() {
    if (!matrixEl || !figure.matrix) return;
    for (const k of figure.matrix.keys || ['a', 'b', 'c', 'd']) {
      const inp = matrixEl.querySelector(`input[data-mkey="${k}"]`);
      if (inp && document.activeElement !== inp) inp.value = (+params[k]).toFixed(2);
    }
  }
  function syncInputs() { syncSliders(); syncMatrixInputs(); }

  $('controls')?.addEventListener('input', e => {
    const key = e.target.dataset.key; if (!key) return;
    const c = figure.controls.find(x => x.key === key); if (!c) return;
    params[key] = +e.target.value;
    const out = e.target.closest('[data-ctl]')?.querySelector('[data-out]') || e.target.nextElementSibling;
    if (out) out.textContent = fmt(c);
    updateControl($('controls'), c, params[key]);
    activePreset = ''; renderPresets(); syncMatrixInputs();
    if (c.rebuild) build();
    syncUrl();
  });
  if ($('controls')) {
    bindControls($('controls'), {
      getParams: () => params,
      setParam: (k, v) => {
        const c = (figure.controls || []).find(x => x.key === k); if (!c) return;
        params[k] = +v;
        if (ctlMode === 'creative' && c.ui?.kind) renderControls();
        else syncSliders();
        activePreset = ''; renderPresets(); syncMatrixInputs();
        if (c.rebuild) build();
        syncUrl();
      },
    });
    if (hasDiegetic) {
      mountControlModeBar($('controls'), {
        initialMode: ctlMode,
        place: 'before',
        onChange: m => { ctlMode = m; renderControls(); syncUrl(); },
      });
    }
  }

  function reset() {
    Object.assign(params, baseParams);
    items = clone(baseItems);
    activePreset = figure.presets?.[0]?.key || '';
    syncInputs(); renderPresets(); renderPalette();
    build(); syncUrl();
  }
  if ($('again')) $('again').onclick = () => reset();
  if ($('again')) mountShareButton($('again'), shareUrl, 'again sharebtn', syncUrl);
  mountMediumBar(cutBar?.el || $('presets') || $('controls'), figure, () => S, { initialMedium: Q.get('medium') || null, place: 'before' });
  const soundCtl = figure.sonify && $('again') ? mountSoundToggle($('again'), { label: 'Sound' }) : null;

  // ---------- hooks for 3D draggable handles inside world.js ----------
  const worldHooks = {
    setParam(key, val) {
      params[key] = val; activePreset = '';
      syncInputs(); renderPresets(); syncUrl();
    },
    setParams(patch) {
      Object.assign(params, patch); activePreset = '';
      syncInputs(); renderPresets(); syncUrl();
    },
    updateItem(index, patch) {
      if (!items[index]) return;
      Object.assign(items[index], patch); activePreset = '';
      renderPresets(); renderPalette(); syncUrl();
    },
    getParams: () => params,
    getItems: () => items,
  };

  // ---------- the figure ----------
  const fig = () => ({
    ...figure,
    PAGES: (typeof figure.PAGES === 'function' ? figure.PAGES(params, items) : figure.PAGES).map(p => ({ look: {}, ...p })),
    buildWorld: E => figure.buildWorld(E, params, items, worldHooks),
    state: (c, r) => figure.state(c, r, params, items),
  });
  if (figure.prose && $('controls')) {
    const pNote = document.createElement('div');
    pNote.className = 'prose-note';
    pNote.innerHTML = typeof figure.prose === 'function' ? figure.prose(params) : figure.prose;
    $('controls').before(pNote);
  }
  const proseRoot = document.querySelector('main') || document.body;
  const prose = bindProse(proseRoot, {
    getStage: () => S,
    getParams: () => params,
    setParam: (k, v) => worldHooks.setParam(k, v),
    formatters: figure.proseFormat || figure.formatters || {},
    onSound: (kind, dir) => { if (soundCtl?.on && soundCtl.ctx) (kind === 'scrub' ? playClick : playBoop)(soundCtl.ctx, { dir }); },
  });

  function build() {
    if (S) {
      S.destroy();
      const fresh = document.createElement('canvas'); fresh.id = 'gl'; $('gl').replaceWith(fresh);
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
    if (cutBar?.overridden) cutBar.apply(cutBar.mode, true);
    if (RENDER || window.__atlas) Object.assign(window.__atlas || {}, { E: S.E, S, labelReport: S.labelReport, sceneReport: S.sceneReport });
  }
  build();

  let clock = !RENDER && Q.has('t') ? (+Q.get('t') || 0) : 0;
  function draw(now, dt, c) {
    const state = S.step({ now, dt, s: 0, litPage: 0, running: !life.reduced, clockAt: c, narrow: narrowQ.matches, narrowZoom: figure.narrowZoom ?? 1 });
    $('readout').textContent = figure.readout(state, params, items);
    (figure.chips || []).forEach((ch, i) => {
      const txt = String(ch.value(state, params, items));
      if (chipEls[i].textContent !== txt) chipEls[i].textContent = txt;
    });
    if (figure.chart && $('chart')) applySandboxChart($('chart'), figure.chart(state, params, items), state, params, items);
    prose.sync(state, params);
    if (soundCtl?.on && soundCtl.ctx && figure.sonify) {
      try { figure.sonify(soundCtl.ctx, state, 0, params); } catch {}
    }
  }

  function frame(now) {
    const dt = Math.min(Math.max((now - last) / 1000, 0), 1 / 20); last = now;
    if (!life.reduced) clock += dt;
    draw(now, dt, clock);
    if (!RENDER && !life.hidden) raf = requestAnimationFrame(frame);
    else raf = 0;
  }
  document.fonts.ready.then(() => requestAnimationFrame(t => { frameReady = true; last = t; if (RENDER) draw(0, 0, 0); else frame(t); }));

  window.__atlas = {
    E: S.E, S, N: 1, labelReport: S.labelReport, sceneReport: S.sceneReport, lifecycle: life, params, get items() { return items; },
    reset, shareUrl, setCut: c => cutBar?.apply(c, true), setParam: worldHooks.setParam, setParams: worldHooks.setParams, updateItem: worldHooks.updateItem,
    get state() { return { clock, params: { ...params }, items: clone(items), activePreset, cut: cutBar?.mode || 'solid' }; },
    get clock() { return S.clock; },
  };

  if (RENDER) {
    const D = figure.duration ?? 9;
    window.DURATION = D;
    window.__atlas.tour = { starts: [0], dwells: [D] };
    let lastRenderPreset = -1;
    window.seek = t => {
      t = Math.min(Math.max(t, 0), D);
      // If presets exist, tour across them so seek(t) shows constructive variety for both params and items
      const prs = (figure.presets || []).filter(p => p.params || p.items);
      if (prs.length >= 2) {
        const seg = D / (prs.length - 1);
        const idx = Math.min(Math.floor(t / seg), prs.length - 2);
        const u = ease((t - idx * seg) / seg);
        const p0 = prs[idx].params, p1 = prs[idx + 1].params;
        if (p0 && p1) {
          for (const k of Object.keys(p0)) {
            if (typeof p0[k] === 'number' && typeof p1[k] === 'number') params[k] = p0[k] + (p1[k] - p0[k]) * u;
          }
        }
        const itemIdx = u < 0.5 ? idx : idx + 1;
        if (prs[itemIdx]?.items && lastRenderPreset !== itemIdx) {
          lastRenderPreset = itemIdx;
          items = clone(prs[itemIdx].items);
          build();
        }
      }
      draw(t * 1000, 1 / 60, t);
      return t;
    };
  }
}
