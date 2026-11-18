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
const isoAttr = iso => (iso === 'wash' ? ' data-isolate="wash"' : iso ? ' data-isolate="1"' : '');

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
  return `<span class="tk-term" data-part="${esc(t)}"${isoAttr(isolate)}${st} tabindex="0" role="button">${text}</span>`;
}

// Oliver Byrne (1847 Chiswick Press / c82.net) inline SVG geometric proof tokens replacing algebraic letter labels.
export const byrne = {
  seg(targets, { color = 'red', angle = 0, dashed = false, label = 'segment', isolate = true } = {}) {
    const stroke = HUE_HEX[color] || color;
    const dash = dashed ? ' stroke-dasharray="3.2 2.4"' : '';
    return `<button type="button" class="byrne-chip" data-part="${esc(normTargets(targets))}"${isoAttr(isolate)} aria-label="${esc(label)}"><svg width="1.75em" height="0.95em" viewBox="0 0 28 14" aria-hidden="true"><g transform="rotate(${angle} 14 7)"><line x1="2.5" y1="7" x2="25.5" y2="7" stroke="#1b1917" stroke-width="3.8" stroke-linecap="round"${dash}/><line x1="2.5" y1="7" x2="25.5" y2="7" stroke="${esc(stroke)}" stroke-width="2.2" stroke-linecap="round"${dash}/></g></svg></button>`;
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
    return `<button type="button" class="byrne-chip" data-part="${esc(normTargets(targets))}"${isoAttr(isolate)} aria-label="${esc(label)}"><svg width="1.2em" height="1.05em" viewBox="0 0 20 18" aria-hidden="true"><path d="M${cx},${cy} L${x0.toFixed(1)},${y0.toFixed(1)} A${r},${r} 0 ${large} ${dir} ${x1.toFixed(1)},${y1.toFixed(1)} Z" fill="${esc(fill)}" stroke="#1b1917" stroke-width="1"/><line x1="${cx}" y1="${cy}" x2="${lx0.toFixed(1)}" y2="${ly0.toFixed(1)}" stroke="#1b1917" stroke-width="1.35" stroke-linecap="round"/><line x1="${cx}" y1="${cy}" x2="${lx1.toFixed(1)}" y2="${ly1.toFixed(1)}" stroke="#1b1917" stroke-width="1.35" stroke-linecap="round"/></svg></button>`;
  },

  poly(targets, { shape = 'tri', color = 'ochre', label = shape, isolate = true } = {}) {
    const fill = HUE_HEX[color] || color;
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
    return `<button type="button" class="byrne-chip" data-part="${esc(normTargets(targets))}"${isoAttr(isolate)} aria-label="${esc(label)}"><svg width="1.12em" height="1.05em" viewBox="0 0 18 18" aria-hidden="true">${inner}</svg></button>`;
  },
};

// Discrete inline parameter pill ("Mad-Libs" clickable code/formula constant cycling through preset choices).
export function paramChip(key, {
  value, choices = [], unit = '', label = key, part = '', color = 'ochre', isolate = false,
} = {}) {
  const normChoices = choices.map(c => (c && typeof c === 'object'
    ? { value: c.value, label: String(c.label ?? `${c.value}${unit}`) }
    : { value: c, label: `${c}${unit}` }));
  const curVal = value !== undefined ? value : normChoices[0]?.value ?? '';
  const match = normChoices.find(c => String(c.value) === String(curVal));
  const shown = match ? match.label : `${curVal}${unit}`;
  const ink = TEXT_INK[color] || TEXT_INK.ochre;
  const pAttr = part ? ` data-part="${esc(normTargets(part))}"` : '';
  const cAttr = normChoices.length ? ` data-choices="${esc(JSON.stringify(normChoices))}"` : '';
  return `<button type="button" class="tk-param" data-param="${esc(key)}" data-value="${esc(curVal)}"${cAttr}${pAttr}${isoAttr(isolate)} style="--tk-col:${ink}" aria-label="${esc(label)}">${esc(shown)}</button>`;
}

// Read-only numbered code / equation trace block where lines can embed scrub(), paramChip(), val(), and term(),
// and bindProse().sync(state) highlights state[lineVar] in sync with the live simulation.
export function codeBlock(lines = [], { title = '', lineVar = 'activeLine', startLine = 1 } = {}) {
  const head = title ? `<figcaption class="tk-code-head">${esc(title)}</figcaption>` : '';
  const rows = lines.map((entry, idx) => {
    const ln = startLine + idx;
    const isObj = entry && typeof entry === 'object';
    const html = isObj ? (entry.html ?? '') : String(entry ?? '');
    const pAttr = isObj && entry.part ? ` data-part="${esc(normTargets(entry.part))}"` : '';
    return `<div class="tk-code-line" data-line="${ln}"${pAttr}><span class="tk-ln" aria-hidden="true">${ln}</span><span class="tk-src">${html}</span></div>`;
  }).join('');
  const vAttr = lineVar ? ` data-line-var="${esc(lineVar)}"` : '';
  return `<figure class="tk-code"${vAttr}>${head}<div class="tk-code-body" role="group" aria-label="${esc(title || 'Execution trace')}">${rows}</div></figure>`;
}

// Epistemic honesty & structural-diff pills ('eg', 'unobserved', 'vantage', 'added', 'removed', 'changed').
const BADGE_META = {
  eg: { text: 'E.G.', cls: 'tk-badge-eg', title: 'Illustrative example value — varies across real captures or runs' },
  unobserved: { text: '··', cls: 'tk-badge-unobs', title: 'Unobserved, encrypted, or hidden from this vantage point' },
  documented: { text: 'DOC', cls: 'tk-badge-vant', title: 'Documented protocol or archival field' },
  vantage: { text: 'Vantage', cls: 'tk-badge-vant', title: 'Observation vantage point' },
  added: { prefix: '+ ', cls: 'tk-badge-add', title: 'Added in this step' },
  removed: { prefix: '− ', cls: 'tk-badge-rem', title: 'Removed in this step' },
  changed: { prefix: '~ ', cls: 'tk-badge-chg', title: 'Changed in this step' },
};
export function badge(kind = 'eg', text = '', { title = '' } = {}) {
  const meta = BADGE_META[kind] || BADGE_META.eg;
  const raw = String(text || meta.text || '').trim();
  const shown = meta.prefix && raw && !/^[+−~-]/.test(raw) ? `${meta.prefix}${raw}` : raw;
  const tip = title || meta.title || '';
  return `<span class="tk-badge ${meta.cls}"${tip ? ` title="${esc(tip)}"` : ''}>${esc(shown)}</span>`;
}

// Stepped architecture "What changed" diff list (+ added / − removed / ~ changed rows wired to data-part).
export function diffList(items = [], { title = 'What changed' } = {}) {
  const list = (Array.isArray(items) ? items : [items]).filter(Boolean);
  if (!list.length) return '';
  const head = title ? `<figcaption class="tk-diffs-head">${esc(title)}</figcaption>` : '';
  const rows = list.map(item => {
    const kind = item.kind || 'changed';
    const pill = badge(kind, item.label || item.title || '');
    const detail = item.detail || item.note ? ` <span class="tk-diff-note">${esc(item.detail || item.note)}</span>` : '';
    const pAttr = item.part ? ` data-part="${esc(normTargets(item.part))}"` : '';
    return `<div class="tk-diff-row"${pAttr}>${pill}${detail}</div>`;
  }).join('');
  return `<figure class="tk-diffs">${head}<div class="tk-diffs-body">${rows}</div></figure>`;
}

// Byte-offset proportional encapsulation bar & decoded protocol/register frame inspector (from protocol-explorer).
export function frameInspector(spec = {}) {
  const layers = Array.isArray(spec.layers) ? spec.layers.filter(Boolean) : [];
  if (!layers.length) return '';
  const totalBytes = spec.totalBytes || layers.reduce((acc, l) => acc + Math.max(1, Number(l.bytes || 1)), 0);
  const vantHtml = spec.vantage ? `<div class="tk-frame-vant">${badge('vantage', spec.vantage)}<span class="tk-frame-total">${totalBytes} B frame</span></div>` : '';
  const barSegs = layers.map(l => {
    const b = Math.max(1, Number(l.bytes || 1));
    const col = TEXT_INK[l.color || l.pal] || TEXT_INK.blue;
    const pAttr = l.part ? ` data-part="${esc(normTargets(l.part))}"` : '';
    return `<div class="tk-frame-seg"${pAttr} style="flex:${b};--seg-col:${col}" title="${esc(l.label)} (${b} B)"><span>${esc(l.label)}</span><b>${b}B</b></div>`;
  }).join('');
  const fieldRows = layers.flatMap(l => (l.fields || []).map(f => {
    const rng = Array.isArray(f.range) && f.range.length === 2 ? `[${f.range[0]}..${f.range[1]}]` : '';
    const tagHtml = f.tag ? ` ${badge(f.tag)}` : '';
    const hexHtml = f.hex ? `<code class="tk-frame-hex">${esc(f.hex)}</code>` : '';
    const pAttr = (f.part || l.part) ? ` data-part="${esc(normTargets(f.part || l.part))}"` : '';
    return `<div class="tk-frame-row"${pAttr}><span class="tk-frame-rng">${esc(rng)}</span><span class="tk-frame-name">${esc(f.name || '')}</span><span class="tk-frame-val">${esc(f.value ?? '')}${tagHtml}</span>${hexHtml}</div>`;
  })).join('');
  return `<figure class="tk-frame-ins">${vantHtml}<div class="tk-frame-bar" role="group" aria-label="Encapsulation byte bar">${barSegs}</div><div class="tk-frame-tree">${fieldRows}</div></figure>`;
}

// 1-tap "Don't confuse with …" lookalike foil callout (wires into book.js data-turn, data-part, or subject/chapter/page href).
export function foilCard(foil, { currentDir = '', kicker = 'Don’t confuse with' } = {}) {
  if (!foil) return '';
  const list = (Array.isArray(foil) ? foil : [foil]).filter(Boolean);
  if (!list.length) return '';
  const rows = list.map(item => {
    const label = esc(item.label || item.title || 'Lookalike');
    const note = item.note ? ` ${item.note}` : '';
    if (item.page !== undefined) {
      return `<p><button type="button" class="foil-jump" data-turn="${Number(item.page)}">${label} →</button>${note}</p>`;
    }
    if (item.part) {
      return `<p><button type="button" class="foil-jump" data-part="${esc(normTargets(item.part))}">${label} →</button>${note}</p>`;
    }
    if (item.to) {
      const to = String(item.to);
      const d = to.slice(0, to.lastIndexOf('/')), k = to.slice(to.lastIndexOf('/') + 1);
      const subj = d.split('/')[0], curSubj = currentDir ? currentDir.split('/')[0] : subj;
      const prefix = subj && subj !== curSubj ? `${subj[0].toUpperCase()}${subj.slice(1)} · ` : '';
      const href = d === currentDir ? `#${esc(k)}` : `../../${esc(d)}/#${esc(k)}`;
      return `<p><a class="foil-jump" href="${href}">${esc(prefix)}${label} →</a>${note}</p>`;
    }
    return `<p><strong>${label}</strong>${note}</p>`;
  }).join('');
  return `<aside class="xref foil"><div class="kicker">${esc(kicker)}</div>${rows}</aside>`;
}

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
.tk-scrub:focus-visible, .tk-scrub.is-dragging {
  background: color-mix(in srgb, var(--tk-col, #2c5697) 12%, transparent);
}
.tk-scrub .tk-help {
  position: absolute; bottom: calc(100% + 2px); left: 50%; transform: translateX(-50%);
  font: 500 9.5px/1 var(--mono, monospace); letter-spacing: .04em; text-transform: uppercase;
  color: var(--tk-col, #2c5697); background: var(--card, #fbfbfa); border: 1px solid var(--faint, #d4d4d6);
  border-radius: 4px; padding: 2px 5px; white-space: nowrap; pointer-events: none; opacity: 0; transition: opacity .15s;
}
.tk-scrub.show-help .tk-help { opacity: 1; }
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
.byrne-chip:focus-visible { background: rgba(27, 25, 23, 0.08); }
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
.tk-aside-btn[aria-expanded="true"] .tk-dots i:first-child,
.tk-aside-btn[aria-expanded="true"] .tk-dots i:last-child { top: 0.51em; }
@media (hover: hover) and (pointer: fine) {
  .tk-scrub:hover { background: color-mix(in srgb, var(--tk-col, #2c5697) 12%, transparent); }
  html:not(.tk-scrubbing) .tk-scrub:hover .tk-help { opacity: 1; }
  .byrne-chip:hover { background: rgba(27, 25, 23, 0.08); }
  .tk-aside-btn[aria-expanded="false"]:hover .tk-dots i:first-child { top: 0.2em; }
  .tk-aside-btn[aria-expanded="false"]:hover .tk-dots i:last-child { top: 0.82em; }
}
.tk-aside-card {
  display: block; margin: 10px 0 14px; padding: 12px 16px; border-radius: 14px;
  border: 1px solid var(--mid, #8a8a8f); background: var(--card, #fbfbfa); box-shadow: var(--lift, none);
  font: 14.5px/1.55 var(--sans, sans-serif); color: var(--text, #57575a);
}
.tk-aside-card[hidden] { display: none; }
.tk-param {
  display: inline-flex; align-items: baseline; padding: 1px 6px; margin: 0 1px; border-radius: 5px;
  border: 1px solid color-mix(in srgb, var(--tk-col, #825b00) 42%, transparent);
  background: color-mix(in srgb, var(--tk-col, #825b00) 11%, var(--card, #fbfbfa));
  color: var(--tk-col, #825b00); font: 600 0.92em/1.25 var(--mono, ui-monospace, monospace);
  font-variant-numeric: tabular-nums; cursor: pointer;
}
.tk-code {
  margin: 12px 0 16px; border-radius: 10px; border: 1px solid var(--faint, #d4d4d6);
  background: var(--card, #fbfbfa); overflow: hidden; font: 13px/1.6 var(--mono, ui-monospace, monospace);
}
.tk-code-head {
  padding: 5px 12px; border-bottom: 1px solid var(--faint, #d4d4d6);
  font: 600 11px/1.3 var(--mono, ui-monospace, monospace); letter-spacing: .03em; color: var(--text, #57575a);
}
.tk-code-body { padding: 6px 0; overflow-x: auto; }
.tk-code-line {
  display: flex; align-items: baseline; gap: 10px; padding: 1px 12px; border-left: 3px solid transparent;
  color: var(--strong, #18181a); white-space: pre-wrap;
}
.tk-code-line.is-active {
  border-left-color: #825b00;
  background: color-mix(in srgb, #e5ad16 14%, transparent);
}
.tk-ln { min-width: 2ch; text-align: right; color: var(--mid, #6e6e73); user-select: none; font-size: 0.86em; }
.tk-src { flex: 1; min-width: 0; }
.tk-badge {
  display: inline-flex; align-items: center; padding: 1px 5px; margin: 0 2px; border-radius: 4px;
  font: 600 10.5px/1.3 var(--mono, ui-monospace, monospace); letter-spacing: .02em; vertical-align: 0.06em;
  border: 1px solid var(--faint, #d4d4d6); background: var(--card, #fbfbfa); color: var(--strong, #18181a);
}
.tk-badge-eg, .tk-badge-chg { color: #825b00; border-color: color-mix(in srgb, #825b00 35%, transparent); }
.tk-badge-unobs { color: var(--text, #57575a); border-style: dashed; }
.tk-badge-vant { color: #2c5697; border-color: color-mix(in srgb, #2c5697 35%, transparent); }
.tk-badge-add { color: #236b43; border-color: color-mix(in srgb, #236b43 35%, transparent); }
.tk-badge-rem { color: #b8343a; border-color: color-mix(in srgb, #b8343a 35%, transparent); }
.xref.foil { border-left-color: var(--red-ink, #b8343a); }
.foil-jump {
  border: 0; background: none; padding: 0; font: inherit; font-weight: 500;
  color: var(--red-ink, #b8343a); text-decoration: none; cursor: pointer; white-space: nowrap;
}
.tk-diffs {
  margin: 12px 0 16px; padding: 10px 14px; border-radius: 10px;
  border: 1px solid var(--faint, #d4d4d6); background: var(--card, #fbfbfa);
}
.tk-diffs-head {
  font: 600 10.5px/1.3 var(--mono, ui-monospace, monospace); letter-spacing: .04em;
  text-transform: uppercase; color: var(--text, #57575a); margin-bottom: 6px;
}
.tk-diffs-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 5px; }
.tk-diff-item { font: 13.5px/1.45 var(--sans, sans-serif); color: var(--strong, #18181a); display: flex; align-items: baseline; gap: 6px; flex-wrap: wrap; }
.tk-diff-detail { color: var(--text, #57575a); }
.tk-frame-ins {
  margin: 12px 0 16px; border-radius: 10px; border: 1px solid var(--faint, #d4d4d6);
  background: var(--card, #fbfbfa); overflow: hidden; font: 12.5px/1.45 var(--mono, ui-monospace, monospace);
}
.tk-frame-vant { padding: 6px 10px; border-bottom: 1px solid var(--faint, #d4d4d6); background: color-mix(in srgb, #2c5697 5%, var(--card, #fbfbfa)); }
.tk-frame-bar { display: flex; gap: 2px; padding: 6px 8px; border-bottom: 1px solid var(--faint, #d4d4d6); }
.tk-frame-seg {
  min-width: 48px; padding: 5px 8px; border-radius: 6px;
  border: 1px solid color-mix(in srgb, var(--tk-col, #2c5697) 42%, transparent);
  background: color-mix(in srgb, var(--tk-col, #2c5697) 13%, var(--card, #fbfbfa));
  color: var(--tk-col, #2c5697); display: flex; justify-content: space-between; align-items: baseline; gap: 6px;
}
.tk-frame-fields { padding: 6px 10px; display: grid; gap: 4px; }
.tk-frame-row { display: grid; grid-template-columns: 7.5ch minmax(9ch, 1fr) minmax(8ch, 1.2fr) auto auto; gap: 8px; align-items: baseline; padding: 2px 0; border-bottom: 1px dashed color-mix(in srgb, var(--faint, #d4d4d6) 55%, transparent); }
.tk-frame-row:last-child { border-bottom: 0; }
.tk-frame-off { color: var(--mid, #6e6e73); font-size: 0.9em; }
.tk-frame-name { font-weight: 600; color: var(--strong, #18181a); }
.tk-frame-val { color: var(--text, #57575a); }
.tk-frame-hex { color: var(--mid, #6e6e73); font-size: 0.9em; }
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
    const iso = pEl.dataset.isolate;
    S?.hoverExtern?.(keys, { isolate: iso === 'wash' ? 'wash' : iso === '1' });
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
    // Discrete .tk-param pill click (cycles preset choices; Shift+Click steps backward)
    const paramBtn = e.target.closest?.('.tk-param[data-param]');
    if (paramBtn && rootEl.contains(paramBtn) && setParam) {
      stepParamChip(paramBtn, e.shiftKey ? -1 : 1);
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
    const paramBtn = e.target.closest?.('.tk-param[data-param]');
    if (paramBtn && setParam && ['ArrowRight', 'ArrowUp', 'ArrowLeft', 'ArrowDown'].includes(e.key)) {
      e.preventDefault();
      stepParamChip(paramBtn, (e.key === 'ArrowRight' || e.key === 'ArrowUp') ? 1 : -1);
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

  function parseParamChoices(btn) {
    try { return JSON.parse(btn.dataset.choices || '[]'); } catch { return []; }
  }

  function updateParamChip(btn, v) {
    const choices = parseParamChoices(btn);
    const match = choices.find(c => String(c.value) === String(v));
    const txt = match ? String(match.label) : String(v);
    if (btn.textContent !== txt) btn.textContent = txt;
    btn.dataset.value = String(v);
  }

  function stepParamChip(btn, dir) {
    const choices = parseParamChoices(btn);
    if (!choices.length || !setParam) return;
    const key = btn.dataset.param;
    const params = getParams?.() || {};
    const cur = key in params ? params[key] : btn.dataset.value;
    const idx = Math.max(0, choices.findIndex(c => String(c.value) === String(cur)));
    const next = choices[(idx + dir + choices.length) % choices.length];
    setParam(key, next.value);
    updateParamChip(btn, next.value);
    onSound?.('scrub', dir);
  }

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
      rootEl.querySelectorAll('.tk-param[data-param]').forEach(btn => {
        const k = btn.dataset.param;
        if (k in params) updateParamChip(btn, params[k]);
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
      rootEl.querySelectorAll('.tk-code[data-line-var]').forEach(fig => {
        const raw = state[fig.dataset.lineVar];
        const activeSet = raw instanceof Set ? raw
          : Array.isArray(raw) ? new Set(raw.map(String))
          : (raw !== null && raw !== undefined && raw !== 0 && raw !== false) ? new Set([String(raw)])
          : new Set();
        fig.querySelectorAll('.tk-code-line[data-line]').forEach(row => {
          const on = activeSet.has(row.dataset.line);
          if (row.classList.contains('is-active') !== on) {
            row.classList.toggle('is-active', on);
            if (on) row.setAttribute('aria-current', 'step');
            else row.removeAttribute('aria-current');
          }
        });
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
