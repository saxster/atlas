// engine/takes.js — Synchronized multi-take exploration board ("3 Takes" comparison + Pick workflow).
// Pure buildTakesSpec() works in Node; mountTakesBoard() mounts live synchronized ?embed frames in browsers.
import { resolveVoice } from './voices.js';
import { showActionReceipt } from './diegetic.js';

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

export function buildTakesSpec({
  title = 'Atlas Exploration · 3 Takes',
  figure = '',
  voices = ['textbook-pure', 'bugged-sketchbook', 'whacky-lab'],
  takes = null,
  basePrefix = '/',
  sync = true,
  calm = true,
  render = false,
} = {}) {
  const prefix = basePrefix.endsWith('/') ? basePrefix : `${basePrefix}/`;
  const normalizeUrl = (fig, voiceId) => {
    const clean = String(fig || '').replace(/^\/+|\/+$/g, '');
    const p = new URLSearchParams();
    p.set('embed', '1');
    if (calm && !render) p.set('calm', '1');
    if (render) p.set('render', '1');
    if (sync) p.set('sync', 'takes');
    if (voiceId) p.set('voice', voiceId);
    return `${prefix}${clean}/?${p.toString()}`;
  };

  if (Array.isArray(takes) && takes.length) {
    return {
      title: String(title),
      takes: takes.map((t, i) => {
        const v = t.voice ? resolveVoice(t.voice) : null;
        const fig = t.figure || figure;
        return {
          id: String(t.id || `take-${i + 1}`),
          label: String(t.label || v?.label || `Take ${i + 1}`),
          badge: String(t.badge || (v ? `R${v.register} · ${v.medium}` : 'Take')),
          voice: v?.id || t.voice || null,
          medium: v?.medium || t.medium || null,
          quirk: v?.quirk || t.quirk || null,
          figure: String(fig || ''),
          note: String(t.note || v?.summary || ''),
          src: String(t.src || normalizeUrl(fig, v?.id)),
        };
      }),
    };
  }

  const list = (Array.isArray(voices) && voices.length ? voices : ['textbook-pure', 'bugged-sketchbook', 'whacky-lab']).map((vid, idx) => {
    const v = resolveVoice(vid);
    return {
      id: v.id || `take-${idx + 1}`,
      label: v.label,
      badge: `R${v.register} · ${v.medium} · ${v.quirk}`,
      voice: v.id,
      medium: v.medium,
      quirk: v.quirk,
      figure: String(figure || '').replace(/^\/+|\/+$/g, ''),
      note: v.summary,
      src: normalizeUrl(figure, v.id),
    };
  });

  return { title: String(title), takes: list };
}

export function mountTakesBoard(containerEl, {
  title = 'Atlas · 3 Takes',
  takes = [],
  duration = 0,
  onPick = null,
} = {}) {
  if (!containerEl || typeof document === 'undefined') return null;

  let syncOrbit = true;
  let phoneMode = false;
  let pickedId = null;

  const root = document.createElement('section');
  root.className = 'takes-board atlas-dot-grid';
  root.setAttribute('aria-label', title);

  const cardsHtml = takes.map((t, i) => (
    `<article class="takes-card" data-take-id="${esc(t.id)}" data-take-idx="${i}">` +
    `  <header class="takes-card-head">` +
    `    <div><strong class="takes-card-title">${esc(t.label)}</strong><span class="takes-badge">${esc(t.badge)}</span></div>` +
    `    <a class="takes-open" href="${esc(t.src)}" target="_blank" rel="noopener">Open ↗</a>` +
    `  </header>` +
    `  <div class="takes-frame"><iframe src="${esc(t.src)}" title="${esc(t.label)}" loading="eager"></iframe></div>` +
    `  <div class="takes-tel" data-tel-id="${esc(t.id)}">Telemetry ready · click Audit</div>` +
    `  <p class="takes-note">${esc(t.note)}</p>` +
    `  <footer class="takes-card-foot">` +
    `    <button type="button" class="takes-pick" data-pick-id="${esc(t.id)}" aria-pressed="false">Pick this take</button>` +
    `  </footer>` +
    `</article>`
  )).join('');

  root.innerHTML = [
    `<header class="takes-head">`,
    `  <div><span class="takes-kicker">Spatial Exploration Board</span><h1 class="takes-title">${esc(title)}</h1></div>`,
    `  <div class="takes-controls">`,
    `    <button type="button" class="takes-btn" data-takes-sync aria-pressed="true">Sync orbit</button>`,
    `    <div class="takes-seg" role="group" aria-label="Frame width"><button type="button" data-takes-vp="fluid" aria-pressed="true">Fluid</button><button type="button" data-takes-vp="phone" aria-pressed="false">390px</button></div>`,
    duration > 0 ? `<label class="takes-scrub"><span>t</span><input type="range" min="0" max="${duration}" step="0.05" value="0" data-takes-seek><output data-takes-t>0.00s</output></label>` : '',
    `    <button type="button" class="takes-btn" data-takes-audit>Audit frames</button>`,
    `    <button type="button" class="takes-btn" data-takes-reset>Reset views</button>`,
    `  </div>`,
    `</header>`,
    `<div class="takes-grid" data-takes-grid>${cardsHtml}</div>`,
  ].join('\n');

  containerEl.innerHTML = '';
  containerEl.appendChild(root);

  const iframes = [...root.querySelectorAll('iframe')];
  const syncBtn = root.querySelector('[data-takes-sync]');
  const auditBtn = root.querySelector('[data-takes-audit]');
  const resetBtn = root.querySelector('[data-takes-reset]');
  const seekIn = root.querySelector('[data-takes-seek]');
  const seekOut = root.querySelector('[data-takes-t]');

  const broadcast = (msg, excludeWin = null) => {
    for (const f of iframes) {
      if (f.contentWindow && f.contentWindow !== excludeWin) {
        try { f.contentWindow.postMessage(msg, '*'); } catch {}
      }
    }
  };

  const runAudit = () => {
    iframes.forEach((f, idx) => {
      const take = takes[idx];
      if (!f.contentWindow || !take) return;
      try { f.contentWindow.postMessage({ type: 'atlas:audit', id: take.id }, '*'); } catch {}
    });
  };

  const onMessage = e => {
    const msg = e?.data;
    if (!msg || typeof msg !== 'object') return;
    if (msg.type === 'atlas:orbit' && syncOrbit) {
      broadcast(msg, e.source);
    } else if (msg.type === 'atlas:audit-result' && msg.id) {
      const tel = root.querySelector(`[data-tel-id="${CSS.escape(msg.id)}"]`);
      if (tel) {
        const frameOk = msg.framing?.inFrame !== false && !msg.occlusion?.blocked;
        const ok = frameOk && (msg.labelHidden || 0) === 0;
        tel.classList.toggle('is-ok', ok);
        tel.classList.toggle('is-warn', !ok);
        tel.textContent = `${frameOk ? 'In frame' : 'Framing issue'} · ${msg.labelHidden || 0} hidden labels · ${msg.medium || ''}/${msg.quirk || ''}`;
      }
    }
  };
  window.addEventListener('message', onMessage);

  const onClick = async e => {
    const pickBtn = e.target.closest('[data-pick-id]');
    if (pickBtn) {
      const prevPicked = pickedId;
      const id = pickBtn.dataset.pickId;
      pickedId = id;
      const take = takes.find(t => t.id === id);
      const syncBtns = curId => {
        root.querySelectorAll('.takes-card').forEach(c => c.classList.toggle('is-picked', c.dataset.takeId === curId));
        root.querySelectorAll('[data-pick-id]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.pickId === curId)));
      };
      syncBtns(pickedId);
      const payload = take ? `npx atlas boot ${take.voice || take.id}\n// Picked: ${take.label} (${take.src})` : id;
      try { await navigator.clipboard?.writeText(payload); } catch {}
      showActionReceipt(pickBtn, {
        message: `Picked ${take?.label || id} (copied snippet)`,
        onUndo: () => { pickedId = prevPicked; syncBtns(pickedId); },
      });
      onPick?.(take);
      return;
    }

    const vpBtn = e.target.closest('[data-takes-vp]');
    if (vpBtn) {
      phoneMode = vpBtn.dataset.takesVp === 'phone';
      root.classList.toggle('is-phone', phoneMode);
      root.querySelectorAll('[data-takes-vp]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.takesVp === (phoneMode ? 'phone' : 'fluid'))));
      return;
    }

    if (e.target === syncBtn) {
      syncOrbit = !syncOrbit;
      syncBtn.setAttribute('aria-pressed', String(syncOrbit));
    } else if (e.target === auditBtn) {
      runAudit();
    } else if (e.target === resetBtn) {
      broadcast({ type: 'atlas:orbit', az: 0, el: 0, pan: [0, 0, 0] });
    }
  };
  root.addEventListener('click', onClick);

  const onInput = e => {
    if (e.target === seekIn) {
      const t = Number(seekIn.value) || 0;
      if (seekOut) seekOut.textContent = `${t.toFixed(2)}s`;
      broadcast({ type: 'atlas:seek', t });
    }
  };
  root.addEventListener('input', onInput);

  // Run initial telemetry audit once iframes finish loading
  iframes.forEach((f, idx) => {
    f.addEventListener('load', () => {
      const take = takes[idx];
      if (take) {
        setTimeout(() => {
          try { f.contentWindow?.postMessage({ type: 'atlas:audit', id: take.id }, '*'); } catch {}
        }, 450);
      }
    });
  });

  return {
    root,
    runAudit,
    getPicked: () => takes.find(t => t.id === pickedId) || null,
    destroy() {
      window.removeEventListener('message', onMessage);
      root.removeEventListener('click', onClick);
      root.removeEventListener('input', onInput);
      root.remove();
    },
  };
}
