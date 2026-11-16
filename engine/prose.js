// Reactive Prose & Visual-Proof Kit for @saxster/atlas (Node-safe HTML/SVG builders + browser DOM binder):
//   - scrub(): Bret Victor (Tangle) + Amit Patel hybrid accessible inline scrubbable number (5px = 1 step, tabular-nums)
//   - val(): live model-computed inline <output data-var="..."> (zero math in prose)
//   - term(): Amit Patel (Red Blob Games) semantic-hue [data-part] prose <-> 3D stage <-> 2D chart hover/click lock
//   - byrne: Oliver Byrne / Nicholas Rougeux (c82.net/euclid) inline keylined geometric proof chips (seg, angle, poly)
//   - aside(): Nicky Case (:nutshell) inline expandable speech-bubble aside with two-dot expand/pinch indicator
//   - bindProse(): delegated event & frame-sync binder for book.js, explorer.js, machine.js, and sandbox.js

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const HUE_HEX = {
  red: '#d63a24',
  blue: '#1d5b8c',
  ochre: '#e5ad16',
  amber: '#e5ad16',
  green: '#226b48',
  ink: '#1b1917',
  hi: '#26262a',
  grey: '#8a8a8f',
};
const TEXT_INK = {
  red: 'var(--red-ink, #b8343a)',
  blue: '#2c5697',
  ochre: '#825b00', // WCAG >= 4.7:1 on both rag page (#ece5d5) and paper (#fbfbfa)
  amber: '#825b00',
  green: 'var(--green-ink, #236b43)',
  ink: 'var(--strong, #18181a)',
};

const normTargets = t => (Array.isArray(t) ? t.join(',') : String(t || '').trim());

// Bret Victor Tangle-inspired inline scrubbable parameter span (accessible spinbutton + 5px/step horizontal drag).
export function scrub(key, {
  value = 0, min = 0, max = 100, step = 1, unit = '', label = key, fmt = null, part = '', color = 'blue',
} = {}) {
  const shown = fmt ? fmt(value) : `${value}${unit}`;
  const ink = TEXT_INK[color] || TEXT_INK.blue;
  const pAttr = part ? ` data-part="${esc(normTargets(part))}"` : '';
  return `<span class="tk-scrub" data-param="${esc(key)}" data-min="${min}" data-max="${max}" data-step="${step}" data-unit="${esc(unit)}"${pAttr} style="--tk-col:${ink}" role="spinbutton" tabindex="0" aria-label="${esc(label)}" aria-valuemin="${min}" aria-valuemax="${max}" aria-valuenow="${value}"><span class="tk-num">${esc(shown)}</span><span class="tk-help" aria-hidden="true">drag ↔</span></span>`;
}

// Live model-computed inline value (updated in place by bindProse().sync(state, params)).
export function val(key, { initial = '–', part = '', color = '' } = {}) {
  const pAttr = part ? ` data-part="${esc(normTargets(part))}"` : '';
  const st = color && TEXT_INK[color] ? ` style="color:${TEXT_INK[color]}"` : '';
  return `<output class="tk-val" data-var="${esc(key)}"${pAttr}${st}>${esc(initial)}</output>`;
}

// Amit Patel (Red Blob Games) semantic-color prose span locked bidirectionally to one or more 3D assemblies.
export function term(targets, text, { color = '', isolate = false } = {}) {
  const t = normTargets(targets);
  const ink = TEXT_INK[color] || '';
  const st = ink ? ` style="--part-col:${ink};color:${ink}"` : '';
  const iso = isolate ? ' data-isolate="1"' : '';
  return `<span class="tk-term" data-part="${esc(t)}"${iso}${st} tabindex="0" role="button">${text}</span>`;
}

// Oliver Byrne (1847 Chiswick Press / c82.net) inline SVG geometric proof tokens replacing algebraic letter labels.
export const byrne = {
  seg(targets, { color = 'red', angle = 0, dashed = false, label = 'segment', isolate = true } = {}) {
    const stroke = HUE_HEX[color] || color;
    const dash = dashed ? ' stroke-dasharray="3.2 2.4"' : '';
    const iso = isolate ? ' data-isolate="1"' : '';
    return `<button type="button" class="byrne-chip" data-part="${esc(normTargets(targets))}"${iso} aria-label="${esc(label)}"><svg width="1.75em" height="0.95em" viewBox="0 0 28 14" aria-hidden="true"><g transform="rotate(${angle} 14 7)"><line x1="2.5" y1="7" x2="25.5" y2="7" stroke="#1b1917" stroke-width="3.8" stroke-linecap="round"${dash}/><line x1="2.5" y1="7" x2="25.5" y2="7" stroke="${esc(stroke)}" stroke-width="2.2" stroke-linecap="round"${dash}/></g></svg></button>`;
  },

  angle(targets, { color = 'blue', start = -25, sweep = 52, label = 'angle', isolate = true } = {}) {
    const fill = HUE_HEX[color] || color;
    const a0 = (start * Math.PI) / 180, a1 = ((start + sweep) * Math.PI) / 180;
    const cx = 4, cy = 14, r = 10.5, rl = 13.5;
    const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    const lx0 = cx + rl * Math.cos(a0), ly0 = cy + rl * Math.sin(a0);
    const lx1 = cx + rl * Math.cos(a1), ly1 = cy + rl * Math.sin(a1);
    const large = Math.abs(sweep) > 180 ? 1 : 0;
    const dir = sweep >= 0 ? 1 : 0;
    const iso = isolate ? ' data-isolate="1"' : '';
    return `<button type="button" class="byrne-chip" data-part="${esc(normTargets(targets))}"${iso} aria-label="${esc(label)}"><svg width="1.2em" height="1.05em" viewBox="0 0 20 18" aria-hidden="true"><path d="M${cx},${cy} L${x0.toFixed(1)},${y0.toFixed(1)} A${r},${r} 0 ${large} ${dir} ${x1.toFixed(1)},${y1.toFixed(1)} Z" fill="${esc(fill)}" stroke="#1b1917" stroke-width="1"/><line x1="${cx}" y1="${cy}" x2="${lx0.toFixed(1)}" y2="${ly0.toFixed(1)}" stroke="#1b1917" stroke-width="1.35" stroke-linecap="round"/><line x1="${cx}" y1="${cy}" x2="${lx1.toFixed(1)}" y2="${ly1.toFixed(1)}" stroke="#1b1917" stroke-width="1.35" stroke-linecap="round"/></svg></button>`;
  },

  poly(targets, { shape = 'tri', color = 'ochre', label = shape, isolate = true } = {}) {
    const fill = HUE_HEX[color] || color;
    const iso = isolate ? ' data-isolate="1"' : '';
    let inner = '';
    if (shape === 'circle') {
      inner = `<circle cx="9" cy="9" r="6.8" fill="${esc(fill)}" stroke="#1b1917" stroke-width="1.3"/>`;
    } else if (shape === 'sq') {
      inner = `<rect x="2.6" y="2.6" width="12.8" height="12.8" fill="${esc(fill)}" stroke="#1b1917" stroke-width="1.3" stroke-linejoin="round"/>`;
    } else if (shape === 'rect') {
      inner = `<rect x="1.8" y="4.2" width="14.4" height="9.6" fill="${esc(fill)}" stroke="#1b1917" stroke-width="1.3" stroke-linejoin="round"/>`;
    } else {
      const pts = shape === 'tri' ? '9,2.2 16.2,15.4 1.8,15.4' : shape;
      inner = `<polygon points="${esc(pts)}" fill="${esc(fill)}" stroke="#1b1917" stroke-width="1.3" stroke-linejoin="round"/>`;
    }
    return `<button type="button" class="byrne-chip" data-part="${esc(normTargets(targets))}"${iso} aria-label="${esc(label)}"><svg width="1.12em" height="1.05em" viewBox="0 0 18 18" aria-hidden="true">${inner}</svg></button>`;
  },
};

// Nicky Case (:nutshell) inline expandable aside with two-dot expand/pinch micro-affordance.
let asideSeq = 0;
export function aside(triggerHtml, bodyHtml, { id = '' } = {}) {
  const uid = id || `tk-aside-${++asideSeq}`;
  return `<button type="button" class="tk-aside-btn" data-aside="${esc(uid)}" aria-expanded="false" aria-controls="${esc(uid)}"><span class="tk-dots" aria-hidden="true"><i></i><i></i></span>${triggerHtml}</button><span class="tk-aside-card" id="${esc(uid)}" role="region" hidden>${bodyHtml}</span>`;
}

let proseStyleInjected = false;
const PROSE_CSS = `
html.tk-scrubbing, html.tk-scrubbing * { cursor: ew-resize !important; user-select: none !important; }
.tk-scrub {
  position: relative; display: inline-flex; align-items: baseline; padding: 0 3px; border-radius: 3px;
  color: var(--tk-col, #2c5697); border-bottom: 1.5px dashed currentColor; font-weight: 500;
  font-variant-numeric: tabular-nums; cursor: ew-resize; touch-action: pan-y;
}
.tk-scrub:hover, .tk-scrub:focus-visible, .tk-scrub.is-dragging {
  background: color-mix(in srgb, var(--tk-col, #2c5697) 12%, transparent);
}
.tk-scrub .tk-help {
  position: absolute; bottom: calc(100% + 2px); left: 50%; transform: translateX(-50%);
  font: 500 9.5px/1 var(--mono, monospace); letter-spacing: .04em; text-transform: uppercase;
  color: var(--tk-col, #2c5697); background: var(--card, #fbfbfa); border: 1px solid var(--faint, #d4d4d6);
  border-radius: 4px; padding: 2px 5px; white-space: nowrap; pointer-events: none; opacity: 0; transition: opacity .15s;
}
html:not(.tk-scrubbing) .tk-scrub:hover .tk-help, .tk-scrub.show-help .tk-help { opacity: 1; }
.tk-val { font-family: var(--mono, monospace); font-size: 0.92em; font-weight: 500; color: var(--strong, #18181a); font-variant-numeric: tabular-nums; }
.tk-term, [data-part]:not(button):not(.byrne-chip) {
  border-bottom: 1.5px dotted var(--part-col, var(--mid, #8a8a8f)); border-radius: 3px; padding: 0 2px; cursor: pointer;
}
.tk-term.is-lit, [data-part].is-lit, .byrne-chip.is-lit {
  background: color-mix(in srgb, var(--part-col, var(--hi, #26262a)) 14%, transparent); color: var(--strong, #18181a);
}
.byrne-chip {
  display: inline-flex; align-items: center; vertical-align: -0.17em; margin: 0 1px; padding: 1px 3px;
  border: 0; border-radius: 4px; background: transparent; cursor: pointer;
}
.byrne-chip:hover, .byrne-chip:focus-visible { background: rgba(27, 25, 23, 0.08); }
.tk-aside-btn {
  display: inline-flex; align-items: center; gap: 4px; border: 0; border-bottom: 1.5px dotted var(--mid, #8a8a8f);
  background: none; padding: 0 2px; font: inherit; color: var(--strong, #18181a); cursor: pointer;
}
.tk-aside-btn .tk-dots { position: relative; display: inline-block; width: 5px; height: 1em; vertical-align: -0.15em; }
.tk-aside-btn .tk-dots i {
  position: absolute; left: 1px; width: 3px; height: 3px; border-radius: 50%; background: currentColor; transition: top .12s ease;
}
.tk-aside-btn .tk-dots i:first-child { top: 0.34em; }
.tk-aside-btn .tk-dots i:last-child { top: 0.68em; }
.tk-aside-btn[aria-expanded="false"]:hover .tk-dots i:first-child { top: 0.2em; }
.tk-aside-btn[aria-expanded="false"]:hover .tk-dots i:last-child { top: 0.82em; }
.tk-aside-btn[aria-expanded="true"] .tk-dots i:first-child,
.tk-aside-btn[aria-expanded="true"] .tk-dots i:last-child { top: 0.51em; }
.tk-aside-card {
  display: block; margin: 10px 0 14px; padding: 12px 16px; border-radius: 14px;
  border: 1px solid var(--mid, #8a8a8f); background: var(--card, #fbfbfa); box-shadow: var(--lift, none);
  font: 14.5px/1.55 var(--sans, sans-serif); color: var(--text, #57575a);
}
.tk-aside-card[hidden] { display: none; }
`;

function ensureProseStyles() {
  if (proseStyleInjected || typeof document === 'undefined') return;
  proseStyleInjected = true;
  const st = document.createElement('style');
  st.id = 'atlas-prose-styles';
  st.textContent = PROSE_CSS;
  document.head.appendChild(st);
}

// Delegated binder connecting a prose container (e.g. #sheet or .side) to a 3D stage and reactive params/state.
export function bindProse(rootEl, {
  getStage = () => null,
  getParams = () => null,
  setParam = null,
  formatters = {},
  onPartSelect = null,
  onSound = null,
} = {}) {
  if (!rootEl || typeof document === 'undefined') return { sync() {}, highlightPart() {}, destroy() {} };
  ensureProseStyles();
  const off = [];
  const on = (el, ev, fn, opt) => { el.addEventListener(ev, fn, opt); off.push(() => el.removeEventListener(ev, fn, opt)); };

  let activeScrub = null;

  // 1. Bidirectional [data-part] hover & click sync (Amit Patel + Oliver Byrne)
  const partsOfEl = el => (el?.dataset?.part || '').split(',').map(s => s.trim()).filter(Boolean);

  on(rootEl, 'pointerover', e => {
    if (activeScrub) return;
    const pEl = e.target.closest?.('[data-part]');
    if (!pEl || !rootEl.contains(pEl)) return;
    const keys = partsOfEl(pEl);
    if (!keys.length) return;
    const S = getStage();
    S?.hoverExtern?.(keys, { isolate: pEl.dataset.isolate === '1' });
    highlightPart(keys);
  });

  on(rootEl, 'pointerout', e => {
    if (activeScrub) return;
    const pEl = e.target.closest?.('[data-part]');
    if (!pEl || !rootEl.contains(pEl)) return;
    if (e.relatedTarget && pEl.contains(e.relatedTarget)) return;
    const S = getStage();
    S?.hoverExtern?.(null);
    highlightPart(null);
  });

  on(rootEl, 'click', e => {
    // Expandable :nutshell aside
    const asideBtn = e.target.closest?.('[data-aside]');
    if (asideBtn && rootEl.contains(asideBtn)) {
      const card = rootEl.querySelector(`#${CSS.escape(asideBtn.dataset.aside)}`) || document.getElementById(asideBtn.dataset.aside);
      if (card) {
        const nextOpen = card.hidden;
        card.hidden = !nextOpen;
        asideBtn.setAttribute('aria-expanded', String(nextOpen));
        onSound?.('aside', nextOpen ? 1 : -1);
      }
      return;
    }
    // Inline .tk-term or .byrne-chip click (note: button[data-part] inside .parts list is already handled by book.js)
    const chip = e.target.closest?.('.tk-term[data-part], .byrne-chip[data-part]');
    if (chip && rootEl.contains(chip)) {
      const keys = partsOfEl(chip);
      if (keys.length) {
        if (onPartSelect) onPartSelect(keys[0], chip);
        else getStage()?.select?.(keys[0]);
      }
    }
  });

  // 2. Bret Victor 5px = 1 step drift-free inline scrubbing (.tk-scrub[data-param])
  on(rootEl, 'pointerdown', e => {
    const sc = e.target.closest?.('.tk-scrub[data-param]');
    if (!sc || !rootEl.contains(sc) || e.button > 0 || !setParam) return;
    const params = getParams?.() || {};
    const key = sc.dataset.param;
    const min = parseFloat(sc.dataset.min ?? '0');
    const max = parseFloat(sc.dataset.max ?? '100');
    const step = parseFloat(sc.dataset.step ?? '1') || 1;
    const decimals = (String(step).split('.')[1] || '').length;
    const v0 = Number(params[key] ?? sc.getAttribute('aria-valuenow') ?? min);
    const x0 = e.clientX, y0 = e.clientY, t0 = performance.now();
    let locked = false, lastQuant = v0;

    activeScrub = { sc, key };
    sc.classList.add('is-dragging');
    sc.setPointerCapture?.(e.pointerId);

    const onMove = ev => {
      const dx = ev.clientX - x0, dy = ev.clientY - y0;
      if (!locked) {
        if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
        if (Math.abs(dy) > Math.abs(dx) * 1.4) { cleanup(false); return; } // let touch vertical scroll win
        locked = true;
        document.documentElement.classList.add('tk-scrubbing');
      }
      ev.preventDefault();
      // Bret Victor exact anchor-and-offset formula: 5px = 1 step
      const raw = v0 + (dx / 5) * step;
      const quant = Number(Math.min(max, Math.max(min, Math.round(raw / step) * step)).toFixed(decimals));
      if (quant !== lastQuant) {
        const dir = quant > lastQuant ? 1 : -1;
        lastQuant = quant;
        setParam(key, quant);
        updateScrubSpan(sc, key, quant);
        onSound?.('scrub', dir);
      }
    };

    const cleanup = (wasTap = false) => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
      document.documentElement.classList.remove('tk-scrubbing');
      sc.classList.remove('is-dragging');
      activeScrub = null;
      if (wasTap) {
        sc.classList.add('show-help');
        setTimeout(() => sc.classList.remove('show-help'), 1400);
      }
    };
    const onUp = ev => {
      const moved = Math.hypot(ev.clientX - x0, ev.clientY - y0) > 6;
      const dt = performance.now() - t0;
      cleanup(!moved && dt < 300);
    };
    const onCancel = () => cleanup(false);

    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
  });

  // Keyboard accessibility for .tk-scrub (ArrowLeft/Right/Up/Down, Shift = 10x, Home/End) and .tk-term (Enter/Space)
  on(rootEl, 'keydown', e => {
    const sc = e.target.closest?.('.tk-scrub[data-param]');
    if (sc && setParam) {
      const params = getParams?.() || {};
      const key = sc.dataset.param;
      const min = parseFloat(sc.dataset.min ?? '0');
      const max = parseFloat(sc.dataset.max ?? '100');
      const step = parseFloat(sc.dataset.step ?? '1') || 1;
      const decimals = (String(step).split('.')[1] || '').length;
      const cur = Number(params[key] ?? sc.getAttribute('aria-valuenow') ?? min);
      const mult = e.shiftKey ? 10 : 1;
      let next = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = cur + step * mult;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = cur - step * mult;
      else if (e.key === 'Home') next = min;
      else if (e.key === 'End') next = max;
      if (next !== null) {
        e.preventDefault();
        const clamped = Number(Math.min(max, Math.max(min, next)).toFixed(decimals));
        setParam(key, clamped);
        updateScrubSpan(sc, key, clamped);
        onSound?.('scrub', clamped >= cur ? 1 : -1);
      }
      return;
    }
    const termEl = e.target.closest?.('.tk-term[data-part]');
    if (termEl && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      const keys = partsOfEl(termEl);
      if (keys.length) {
        if (onPartSelect) onPartSelect(keys[0], termEl);
        else getStage()?.select?.(keys[0]);
      }
    }
  });

  function updateScrubSpan(sc, key, v) {
    const numEl = sc.querySelector('.tk-num');
    const fmt = formatters[key];
    const dec = (String(sc.dataset.step || '').split('.')[1] || '').length;
    const base = typeof v === 'number' && dec > 0 ? v.toFixed(dec) : String(v);
    const txt = fmt ? fmt(v) : `${base}${sc.dataset.unit || ''}`;
    if (numEl && numEl.textContent !== txt) numEl.textContent = txt;
    sc.setAttribute('aria-valuenow', String(v));
  }

  function highlightPart(keyOrKeys) {
    const set = new Set(Array.isArray(keyOrKeys) ? keyOrKeys : keyOrKeys ? [keyOrKeys] : []);
    rootEl.querySelectorAll('[data-part]').forEach(el => {
      const match = set.size > 0 && partsOfEl(el).some(k => set.has(k));
      el.classList.toggle('is-lit', match);
    });
  }

  function sync(state, params = null) {
    if (params) {
      rootEl.querySelectorAll('.tk-scrub[data-param]').forEach(sc => {
        const k = sc.dataset.param;
        if (k in params) updateScrubSpan(sc, k, params[k]);
      });
    }
    if (state) {
      rootEl.querySelectorAll('output[data-var]').forEach(out => {
        const k = out.dataset.var;
        const fmt = formatters[k];
        const raw = typeof fmt === 'function' ? fmt(state, params) : state[k];
        if (raw === undefined) return;
        const txt = String(raw);
        if (out._lastTxt !== txt) {
          out._lastTxt = txt;
          out.textContent = txt;
        }
      });
    }
  }

  return {
    sync,
    highlightPart,
    destroy() {
      for (const fn of off) fn();
    },
  };
}
