// engine/review.js — Unified spatial critique pins & non-destructive Interact | Inspect | Tune | Pins overlay.
// Pure schema, base64url serialization, agent citation packets, and camera-patch formatters work in Node
// with zero DOM dependencies; mountStageOverlay() runs in browsers on ?inspect / ?review / ?reviewData.

export const PIN_SOURCES = Object.freeze(['human', 'labels', 'scene', 'clip', 'visual-learner']);
export const PIN_SEVERITIES = Object.freeze(['info', 'warn', 'error']);

const clampPct = v => {
  const n = Number(v);
  if (!Number.isFinite(n)) return 50;
  return +Math.max(0, Math.min(100, n)).toFixed(2);
};

export function createReviewPin(input = {}) {
  const source = PIN_SOURCES.includes(input.source) ? input.source : 'human';
  const severity = PIN_SEVERITIES.includes(input.severity)
    ? input.severity
    : (source === 'human' ? 'warn' : 'error');
  const pageNum = Math.max(0, Math.floor(Number(input.page) || 0));
  const tNum = Number.isFinite(Number(input.t)) ? +Number(input.t).toFixed(3) : 0;
  return {
    id: String(input.id || `pin-${pageNum}-${Math.round(clampPct(input.xPct) * 10)}-${Math.round(clampPct(input.yPct) * 10)}`),
    ...(input.figure ? { figure: String(input.figure) } : {}),
    page: pageNum,
    t: tNum,
    asm: input.asm ? String(input.asm) : null,
    dataPart: input.dataPart ? String(input.dataPart) : null,
    xPct: clampPct(input.xPct),
    yPct: clampPct(input.yPct),
    severity,
    source,
    text: String(input.text || ''),
    ...(input.selector ? { selector: String(input.selector) } : {}),
    ...(input.viewport ? { viewport: String(input.viewport) } : {}),
    ...(input.camera ? { camera: input.camera } : {}),
    resolved: Boolean(input.resolved),
  };
}

export function encodeReviewPins(pins = []) {
  const list = Array.isArray(pins) ? pins.map(createReviewPin) : [];
  const json = JSON.stringify(list);
  const bytes = new TextEncoder().encode(json);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeReviewPins(encoded) {
  if (!encoded || typeof encoded !== 'string') return [];
  try {
    let b64 = encoded.trim().replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const parsed = JSON.parse(new TextDecoder().decode(bytes));
    const rawList = Array.isArray(parsed) ? parsed : (Array.isArray(parsed?.pins) ? parsed.pins : []);
    return rawList.map(createReviewPin);
  } catch {
    return [];
  }
}

export function formatCameraPatch(cam, { page = null } = {}) {
  if (!cam || !Array.isArray(cam.target)) return '';
  const tgt = cam.target.map(n => Number(n || 0).toFixed(3).replace(/\.?0+$/, '') || '0');
  const az = Number(cam.az || 0).toFixed(2).replace(/\.?0+$/, '') || '0';
  const el = Number(cam.el || 0).toFixed(2).replace(/\.?0+$/, '') || '0';
  const dist = Number(cam.dist || 10).toFixed(3).replace(/\.?0+$/, '') || '10';
  const fovPart = cam.fov !== undefined && cam.fov !== null && Math.abs(Number(cam.fov) - 18) > 0.05
    ? `, fov: ${Number(cam.fov).toFixed(1).replace(/\.0$/, '')}`
    : '';
  const prefix = page !== null && page !== undefined ? `// Page ${page}\n` : '';
  return `${prefix}cam: { target: [${tgt.join(', ')}], az: ${az}, el: ${el}, dist: ${dist}${fovPart} },`;
}

export function formatInspectPacket({
  figure = '',
  page = 0,
  t = 0,
  asm = null,
  dataPart = null,
  labelText = '',
  screenRect = null,
  camera = null,
  modelState = null,
  voice = null,
  medium = null,
  quirk = null,
  note = '',
} = {}) {
  const payload = {
    figure: String(figure || ''),
    page: Math.max(0, Math.floor(Number(page) || 0)),
    t: Number.isFinite(Number(t)) ? +Number(t).toFixed(3) : 0,
    ...(asm ? { asm: String(asm) } : {}),
    ...(dataPart ? { dataPart: String(dataPart) } : {}),
    ...(labelText ? { labelText: String(labelText) } : {}),
    ...(screenRect ? { screenRect } : {}),
    ...(camera ? { camera } : {}),
    ...(voice ? { voice } : {}),
    ...(medium ? { medium } : {}),
    ...(quirk ? { quirk } : {}),
    ...(modelState && typeof modelState === 'object' ? { modelState } : {}),
    ...(note ? { note: String(note) } : {}),
  };
  const target = asm ? `assembly \`${asm}\`` : (dataPart ? `[data-part="${dataPart}"]` : (labelText ? `label "${labelText}"` : 'stage viewport'));
  const lines = [
    `### Atlas Inspect Citation (${payload.figure || 'figure'} · p.${payload.page} @ t=${payload.t}s)`,
    `- Target: ${target}`,
    ...(camera ? [`- ${formatCameraPatch(camera)}`] : []),
    ...(voice || medium || quirk ? [`- Visual register: voice=${voice || 'default'}, medium=${medium || 'default'}, quirk=${quirk || 'default'}`] : []),
    ...(note ? [`- Request: ${note}`] : []),
    '',
    '```json',
    JSON.stringify(payload, null, 2),
    '```',
  ];
  return { payload, json: JSON.stringify(payload, null, 2), markdown: lines.join('\n') };
}

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

export function mountStageOverlay(getStage, hostEl, {
  figureId = '',
  getPage = () => 0,
  getTotalPages = () => 1,
  getClock = () => 0,
  getModelState = () => null,
  initialMode = 'inspect',
  initialPins = [],
  reviewUrl = null,
} = {}) {
  if (!hostEl || typeof document === 'undefined') return null;

  let mode = ['interact', 'inspect', 'tune', 'pins'].includes(initialMode) ? initialMode : 'inspect';
  let pins = Array.isArray(initialPins) ? initialPins.map(createReviewPin) : [];
  let activePinId = pins[0]?.id || null;
  let showAllPages = false;
  let lastInspect = null;
  const tune = { dAz: 0, dEl: 0, dDist: 0, fov: '' };

  const root = document.createElement('div');
  root.className = 'atlas-ov-root';
  root.setAttribute('data-ov-mode', mode);

  const bar = document.createElement('div');
  bar.className = 'atlas-ov-bar';
  bar.setAttribute('role', 'toolbar');
  bar.setAttribute('aria-label', 'Authoring & review overlay');
  bar.innerHTML = [
    `<div class="atlas-ov-seg" role="group" aria-label="Stage mode">`,
    `  <button type="button" data-ov-mode="interact" aria-pressed="${mode === 'interact'}">Interact</button>`,
    `  <button type="button" data-ov-mode="inspect" aria-pressed="${mode === 'inspect'}" title="Inspect parts (I)">Inspect</button>`,
    `  <button type="button" data-ov-mode="tune" aria-pressed="${mode === 'tune'}" title="Tune camera & voice (E)">Tune</button>`,
    `  <button type="button" data-ov-mode="pins" aria-pressed="${mode === 'pins'}">Pins <span class="atlas-ov-count" data-ov-count>${pins.length}</span></button>`,
    `</div>`,
    `<span class="atlas-ov-status" data-ov-status aria-live="polite"></span>`,
  ].join('');

  const pinsLayer = document.createElement('div');
  pinsLayer.className = 'atlas-ov-pins';

  const panel = document.createElement('div');
  panel.className = 'atlas-ov-pop';
  panel.hidden = mode === 'interact';

  root.append(pinsLayer, bar, panel);
  hostEl.appendChild(root);

  const statusEl = bar.querySelector('[data-ov-status]');
  const countEl = bar.querySelector('[data-ov-count]');
  const setStatus = msg => {
    if (!statusEl) return;
    statusEl.textContent = msg;
    if (msg) setTimeout(() => { if (statusEl.textContent === msg) statusEl.textContent = ''; }, 2400);
  };

  const copyText = async (txt, msg) => {
    try { await navigator.clipboard?.writeText(txt); } catch {}
    setStatus(msg);
  };

  function syncStageHook() {
    const S = getStage?.();
    if (!S) return;
    if (mode === 'inspect') {
      S.pickIntercept = clickedKey => {
        if (!clickedKey) return;
        const rect = hostEl.getBoundingClientRect();
        const cam = S.getCameraPose?.() || null;
        lastInspect = {
          figure: figureId || location.pathname,
          page: getPage(),
          t: getClock(),
          asm: clickedKey,
          dataPart: clickedKey,
          labelText: S.E?.ASM?.[clickedKey]?.userData?.title || clickedKey,
          camera: cam,
          voice: S.voice || document.documentElement?.dataset?.voice || null,
          medium: S.medium || null,
          quirk: S.quirk || null,
          modelState: getModelState?.(),
          xPct: 50,
          yPct: 50,
          screenRect: { w: Math.round(rect.width), h: Math.round(rect.height) },
        };
        S.litOverride = clickedKey;
        renderPanel();
      };
    } else {
      if (S.pickIntercept) S.pickIntercept = null;
      if (S.litOverride) S.litOverride = null;
    }
  }

  function renderPins() {
    const curPage = getPage();
    if (countEl) countEl.textContent = String(pins.filter(p => !p.resolved).length);
    pinsLayer.hidden = !(mode === 'pins' || pins.length > 0);
    const visible = showAllPages ? pins : pins.filter(p => p.page === curPage);
    pinsLayer.innerHTML = visible.map((p, idx) => {
      const active = p.id === activePinId ? ' is-active' : '';
      const resolved = p.resolved ? ' is-resolved' : '';
      return `<button type="button" class="atlas-ov-pin sev-${p.severity}${active}${resolved}" data-pin-id="${esc(p.id)}" style="left:${p.xPct}%;top:${p.yPct}%" title="${esc(p.text || p.source)}">${idx + 1}</button>`;
    }).join('');
  }

  function renderPanel() {
    if (mode === 'interact') {
      panel.hidden = true;
      return;
    }
    panel.hidden = false;
    const S = getStage?.();
    if (mode === 'inspect') {
      const info = lastInspect || {
        figure: figureId || location.pathname,
        page: getPage(),
        t: getClock(),
        camera: S?.getCameraPose?.() || null,
        voice: S?.voice || null,
        medium: S?.medium || null,
        quirk: S?.quirk || null,
      };
      const pkt = formatInspectPacket(info);
      panel.innerHTML = [
        `<div class="atlas-ov-phead"><strong>Inspect</strong><span>${esc(info.asm || info.dataPart || 'Click a 3D part or [data-part]')}</span></div>`,
        `<pre class="atlas-ov-pre">${esc(formatCameraPatch(info.camera, { page: info.page }) || `p.${info.page} · t=${Number(info.t || 0).toFixed(2)}s`)}</pre>`,
        `<input type="text" class="atlas-ov-in" data-ov-note placeholder="Add agent note…" value="${esc(info.note || '')}" aria-label="Agent citation note">`,
        `<div class="atlas-ov-acts">`,
        `  <button type="button" data-ov-act="copy-inspect">Copy agent citation</button>`,
        `  <button type="button" data-ov-act="pin-from-inspect">Drop pin here</button>`,
        `</div>`,
      ].join('');
      panel.dataset.packet = pkt.markdown;
      return;
    }

    if (mode === 'tune') {
      const pose = S?.getCameraPose?.() || { target: [0, 0, 0], az: 0, el: 18, dist: 10, fov: 18 };
      const curVoice = S?.voice || document.documentElement?.dataset?.voice || 'bugged-sketchbook';
      const curMed = S?.medium || 'pencil-wash';
      const curQuirk = S?.quirk || 'slightly-quirky';
      panel.innerHTML = [
        `<div class="atlas-ov-phead"><strong>Tune Camera &amp; Voice</strong><span>model.js read-only</span></div>`,
        `<div class="atlas-ov-sliders">`,
        `  <label>dAz <input type="range" min="-180" max="180" step="1" value="${tune.dAz}" data-tune="dAz"><output>${tune.dAz}°</output></label>`,
        `  <label>dEl <input type="range" min="-45" max="45" step="1" value="${tune.dEl}" data-tune="dEl"><output>${tune.dEl}°</output></label>`,
        `  <label>dDist <input type="range" min="-8" max="14" step="0.2" value="${tune.dDist}" data-tune="dDist"><output>${tune.dDist}</output></label>`,
        `  <label>FOV <input type="range" min="3" max="75" step="1" value="${tune.fov === '' ? Math.round(pose.fov || 18) : tune.fov}" data-tune="fov"><output>${tune.fov === '' ? Math.round(pose.fov || 18) : tune.fov}°</output></label>`,
        `</div>`,
        `<div class="atlas-ov-selects">`,
        `  <label>Medium <select data-tune-style="medium">${['paper-ink', 'ciechanow', 'pencil-wash', 'moebius', 'risograph'].map(m => `<option value="${m}"${m === curMed ? ' selected' : ''}>${m}</option>`).join('')}</select></label>`,
        `  <label>Quirk <select data-tune-style="quirk">${['bland', 'atelier', 'slightly-quirky', 'playful', 'wild'].map(q => `<option value="${q}"${q === curQuirk ? ' selected' : ''}>${q}</option>`).join('')}</select></label>`,
        `  <label>Voice <select data-tune-style="voice">${['textbook-pure', 'ciechanowski-mechanism', 'byrne-visual-proof', 'plotter-draft', 'moebius-printmaking', 'redblob-reactive-prose', 'bugged-sketchbook', 'ncase-playable-toy', 'toybox-scale-joy', 'whacky-lab'].map(v => `<option value="${v}"${v === curVoice ? ' selected' : ''}>${v}</option>`).join('')}</select></label>`,
        `</div>`,
        `<pre class="atlas-ov-pre" data-tune-patch>${esc(formatCameraPatch(pose, { page: getPage() }))}</pre>`,
        `<div class="atlas-ov-acts">`,
        `  <button type="button" data-ov-act="copy-cam">Copy cam patch</button>`,
        `  <button type="button" data-ov-act="reset-tune">Reset orbit</button>`,
        `</div>`,
      ].join('');
      return;
    }

    if (mode === 'pins') {
      const sel = pins.find(p => p.id === activePinId) || null;
      const pageCount = getTotalPages();
      panel.innerHTML = [
        `<div class="atlas-ov-phead"><strong>Spatial Pins</strong><span>Click figure to drop pin · p.${getPage() + 1}/${pageCount}</span></div>`,
        sel ? [
          `<div class="atlas-ov-pin-edit">`,
          `  <div class="atlas-ov-pin-meta"><span class="atlas-ov-badge sev-${sel.severity}">${esc(sel.source)} · ${esc(sel.severity)}</span><span>(${sel.xPct}%, ${sel.yPct}%) · p.${sel.page}</span></div>`,
          `  <input type="text" class="atlas-ov-in" data-pin-text value="${esc(sel.text)}" placeholder="Critique note…" aria-label="Pin critique note">`,
          `  <div class="atlas-ov-acts">`,
          `    <select data-pin-sev aria-label="Pin severity">${PIN_SEVERITIES.map(sv => `<option value="${sv}"${sv === sel.severity ? ' selected' : ''}>${sv}</option>`).join('')}</select>`,
          `    <button type="button" data-ov-act="resolve-pin">${sel.resolved ? 'Reopen' : 'Resolve'}</button>`,
          `    <button type="button" data-ov-act="delete-pin">Delete</button>`,
          `  </div>`,
          `</div>`,
        ].join('') : `<p class="atlas-ov-empty">No pin selected. Click the figure to drop one, or select a numbered pin.</p>`,
        `<div class="atlas-ov-acts">`,
        `  <label class="atlas-ov-chk"><input type="checkbox" data-ov-allpages${showAllPages ? ' checked' : ''}> All pages</label>`,
        `  <button type="button" data-ov-act="copy-pins-json">Copy review JSON</button>`,
        `  <button type="button" data-ov-act="copy-pins-link">Copy review link</button>`,
        `</div>`,
      ].join('');
    }
  }

  function setMode(next) {
    if (!['interact', 'inspect', 'tune', 'pins'].includes(next)) return;
    mode = next;
    root.setAttribute('data-ov-mode', mode);
    bar.querySelectorAll('[data-ov-mode]').forEach(b => {
      b.setAttribute('aria-pressed', String(b.dataset.ovMode === mode));
    });
    syncStageHook();
    renderPins();
    renderPanel();
  }

  const onBarClick = e => {
    const b = e.target.closest('[data-ov-mode]');
    if (b) { e.stopPropagation(); setMode(b.dataset.ovMode); }
  };
  bar.addEventListener('click', onBarClick);

  const onPinsClick = e => {
    const pBtn = e.target.closest('[data-pin-id]');
    if (!pBtn) return;
    e.stopPropagation();
    activePinId = pBtn.dataset.pinId;
    if (mode !== 'pins') setMode('pins');
    else { renderPins(); renderPanel(); }
  };
  pinsLayer.addEventListener('click', onPinsClick);

  const onHostClick = e => {
    if (mode === 'pins' && !e.target.closest('.atlas-ov-bar, .atlas-ov-pop, .atlas-ov-pin')) {
      const r = hostEl.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        const xPct = ((e.clientX - r.left) / r.width) * 100;
        const yPct = ((e.clientY - r.top) / r.height) * 100;
        const S = getStage?.();
        const pin = createReviewPin({
          id: `pin-${Date.now().toString(36)}`,
          figure: figureId || location.pathname,
          page: getPage(),
          t: getClock(),
          xPct,
          yPct,
          severity: 'warn',
          source: 'human',
          text: '',
          camera: S?.getCameraPose?.() || null,
        });
        pins = [...pins, pin];
        activePinId = pin.id;
        renderPins();
        renderPanel();
        panel.querySelector('[data-pin-text]')?.focus();
      }
      return;
    }

    if (mode === 'inspect') {
      const partEl = e.target.closest?.('[data-part], .lbl, .tk-scrub, .tk-val');
      if (partEl && !e.target.closest('.atlas-ov-bar, .atlas-ov-pop')) {
        const S = getStage?.();
        const r = hostEl.getBoundingClientRect();
        const pr = partEl.getBoundingClientRect();
        const xPct = r.width > 0 ? ((pr.left + pr.width / 2 - r.left) / r.width) * 100 : 50;
        const yPct = r.height > 0 ? ((pr.top + pr.height / 2 - r.top) / r.height) * 100 : 50;
        lastInspect = {
          figure: figureId || location.pathname,
          page: getPage(),
          t: getClock(),
          dataPart: partEl.dataset?.part || null,
          labelText: (partEl.textContent || '').trim().slice(0, 80),
          camera: S?.getCameraPose?.() || null,
          modelState: getModelState?.(),
          xPct: Math.max(0, Math.min(100, xPct)),
          yPct: Math.max(0, Math.min(100, yPct)),
        };
        renderPanel();
      }
    }
  };
  hostEl.addEventListener('click', onHostClick);

  const onPanelClick = e => {
    const act = e.target.closest('[data-ov-act]')?.dataset.ovAct;
    if (!act) return;
    e.stopPropagation();
    const S = getStage?.();
    if (act === 'copy-inspect') {
      const note = panel.querySelector('[data-ov-note]')?.value || '';
      const info = { ...(lastInspect || { figure: figureId, page: getPage(), t: getClock(), camera: S?.getCameraPose?.() }), note };
      const pkt = formatInspectPacket(info);
      copyText(pkt.markdown, 'Copied agent citation');
    } else if (act === 'pin-from-inspect') {
      const note = panel.querySelector('[data-ov-note]')?.value || '';
      const info = lastInspect || { page: getPage(), t: getClock(), xPct: 50, yPct: 50 };
      const pin = createReviewPin({
        id: `pin-${Date.now().toString(36)}`,
        figure: figureId || location.pathname,
        page: info.page,
        t: info.t,
        asm: info.asm || null,
        dataPart: info.dataPart || null,
        xPct: info.xPct ?? 50,
        yPct: info.yPct ?? 50,
        severity: 'warn',
        source: 'human',
        text: note || (info.asm ? `Check ${info.asm}` : 'Inspect note'),
        camera: info.camera || null,
      });
      pins = [...pins, pin];
      activePinId = pin.id;
      setMode('pins');
      setStatus('Pin dropped');
    } else if (act === 'copy-cam') {
      const pose = S?.getCameraPose?.();
      copyText(formatCameraPatch(pose, { page: getPage() }), 'Copied cam patch');
    } else if (act === 'reset-tune') {
      tune.dAz = 0; tune.dEl = 0; tune.dDist = 0; tune.fov = '';
      S?.resetOrbit?.();
      renderPanel();
    } else if (act === 'resolve-pin') {
      pins = pins.map(p => (p.id === activePinId ? { ...p, resolved: !p.resolved } : p));
      renderPins();
      renderPanel();
    } else if (act === 'delete-pin') {
      pins = pins.filter(p => p.id !== activePinId);
      activePinId = pins[0]?.id || null;
      renderPins();
      renderPanel();
    } else if (act === 'copy-pins-json') {
      copyText(JSON.stringify(pins, null, 2), `Copied ${pins.length} pins JSON`);
    } else if (act === 'copy-pins-link') {
      const u = new URL(location.href);
      u.searchParams.set('reviewData', encodeReviewPins(pins));
      copyText(u.toString(), 'Copied review URL');
    }
  };
  panel.addEventListener('click', onPanelClick);

  const onPanelInput = e => {
    const S = getStage?.();
    if (e.target.matches('[data-ov-note]') && lastInspect) {
      lastInspect.note = e.target.value;
    } else if (e.target.matches('[data-pin-text]')) {
      pins = pins.map(p => (p.id === activePinId ? { ...p, text: e.target.value } : p));
    } else if (e.target.matches('[data-pin-sev]')) {
      pins = pins.map(p => (p.id === activePinId ? { ...p, severity: e.target.value } : p));
      renderPins();
    } else if (e.target.matches('[data-ov-allpages]')) {
      showAllPages = Boolean(e.target.checked);
      renderPins();
    } else if (e.target.matches('[data-tune]')) {
      const k = e.target.dataset.tune;
      tune[k] = Number(e.target.value);
      const out = e.target.parentElement?.querySelector('output');
      if (out) out.textContent = k === 'dDist' ? String(tune[k]) : `${tune[k]}°`;
      S?.setCameraAdjust?.(tune);
      const patchEl = panel.querySelector('[data-tune-patch]');
      if (patchEl && S?.getCameraPose) {
        setTimeout(() => { patchEl.textContent = formatCameraPatch(S.getCameraPose(), { page: getPage() }); }, 32);
      }
    } else if (e.target.matches('[data-tune-style]')) {
      const k = e.target.dataset.tuneStyle;
      if (k === 'medium') S?.setMedium?.(e.target.value);
      else if (k === 'quirk') S?.setQuirk?.(e.target.value, { syncMedium: false });
      else if (k === 'voice') S?.setVoice?.(e.target.value, { setSurfaces: true });
    }
  };
  panel.addEventListener('input', onPanelInput);
  panel.addEventListener('change', onPanelInput);

  const onKeyDown = e => {
    if (e.target?.closest?.('input, textarea, select, [contenteditable]')) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === 'i') { e.preventDefault(); setMode(mode === 'inspect' ? 'interact' : 'inspect'); }
    else if (k === 'e') { e.preventDefault(); setMode(mode === 'tune' ? 'interact' : 'tune'); }
  };
  window.addEventListener('keydown', onKeyDown);

  if (reviewUrl) {
    fetch(reviewUrl)
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (!data) return;
        const raw = Array.isArray(data) ? data : (Array.isArray(data.pins) ? data.pins : []);
        if (raw.length) {
          pins = [...pins, ...raw.map(createReviewPin)];
          activePinId = pins[0]?.id || null;
          renderPins();
          renderPanel();
        }
      })
      .catch(() => {});
  }

  syncStageHook();
  renderPins();
  renderPanel();

  return {
    root,
    setMode,
    getMode: () => mode,
    getPins: () => pins.map(p => ({ ...p })),
    setPins(next) { pins = Array.isArray(next) ? next.map(createReviewPin) : []; activePinId = pins[0]?.id || null; renderPins(); renderPanel(); },
    syncStage() { syncStageHook(); renderPins(); },
    refreshPins() { renderPins(); if (mode === 'pins') renderPanel(); },
    destroy() {
      bar.removeEventListener('click', onBarClick);
      pinsLayer.removeEventListener('click', onPinsClick);
      hostEl.removeEventListener('click', onHostClick);
      panel.removeEventListener('click', onPanelClick);
      panel.removeEventListener('input', onPanelInput);
      panel.removeEventListener('change', onPanelInput);
      window.removeEventListener('keydown', onKeyDown);
      const S = getStage?.();
      if (S) {
        if (S.pickIntercept) S.pickIntercept = null;
        if (S.litOverride) S.litOverride = null;
      }
      root.remove();
    },
  };
}
