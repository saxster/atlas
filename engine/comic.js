// Curious Atelier Ligne-Claire Sequential Bookends (Book Introduction, Chapter Opener, Chapter Closer).
// Renders responsive 2-4 panel bande-dessinee strips using Byrne semantic inks, upright narrator captions,
// source-honest speech balloons, inline leader-line callouts, and optional live @saxster/atlas 3D figure mounts.

import { mountFigure } from './mount.js';

const esc = s => String(s ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const ROLE_LABELS = {
  bookPrologue: 'Book Introduction · 4 Panels',
  chapterOpener: 'Opening Scene',
  chapterCloser: 'Chapter Resolution & Bridge',
};

const BASIS_LABELS = {
  documentedFact: 'Documented fact',
  historicalAccount: 'Historical account',
  thoughtExperiment: 'Thought experiment',
};

export function renderByrneInlineHTML(richText) {
  const raw = String(richText ?? '');
  let out = '';
  let i = 0;
  while (i < raw.length) {
    if (raw[i] === '{') {
      const colon = raw.indexOf(':', i + 1);
      if (colon > i + 1 && colon - i <= 10) {
        const tag = raw.slice(i + 1, colon).toLowerCase();
        const role = (tag === 'given' || tag === 'blue') ? 'given'
          : (tag === 'moves' || tag === 'red') ? 'moves'
          : (tag === 'stays' || tag === 'amber' || tag === 'yellow') ? 'stays'
          : null;
        if (role) {
          let depth = 1;
          let j = colon + 1;
          while (j < raw.length && depth > 0) {
            if (raw[j] === '{') depth++;
            else if (raw[j] === '}') depth--;
            j++;
          }
          if (depth === 0) {
            const inner = raw.slice(colon + 1, j - 1);
            out += `<span class="atlas-comic-byrne-${role}">${renderByrneInlineHTML(inner)}</span>`;
            i = j;
            continue;
          }
        }
      }
    }
    out += esc(raw[i]);
    i++;
  }
  return out;
}

export function renderComicPanelSVG(panel = {}, emblem = 'orbitalField') {
  const preset = panel.scenePreset || 'anomalySetup';
  const callout = panel.calloutLabel ? esc(panel.calloutLabel) : '';
  const pid = esc(`${preset}-${panel.panelNumber || 1}-${emblem}`).replace(/[^a-zA-Z0-9_-]/g, '');

  const ink = 'var(--ink, var(--strong, #1F1B16))';
  const blue = 'var(--given, var(--blue, #23519C))';
  const red = 'var(--moves, var(--red, #AE2B20))';
  const yellow = 'var(--stays, var(--ochre, #E2A41C))';
  const green = 'var(--proven, var(--green, #45613B))';
  const sheet = 'var(--surface, var(--sheet, #FFFDF7))';
  const faint = 'var(--faint, #D8CFC0)';

  let body = '';
  if (preset === 'byrneKeyLegend') {
    body = `
      <circle cx="86" cy="58" r="24" fill="none" stroke="${blue}" stroke-width="2.5" stroke-dasharray="5 3"/>
      <rect x="140" y="36" width="44" height="44" rx="6" fill="${yellow}" stroke="${ink}" stroke-width="2"/>
      <path d="M 218 76 L 258 38" stroke="${red}" stroke-width="3" stroke-linecap="round"/>
      <polygon points="262,34 249,38 257,46" fill="${red}"/>
    `;
  } else if (preset === 'intuitionBreak') {
    body = `
      <line x1="36" y1="84" x2="284" y2="84" stroke="${ink}" stroke-width="2"/>
      <rect x="92" y="42" width="58" height="42" rx="5" fill="${blue}" stroke="${ink}" stroke-width="2"/>
      <line x1="121" y1="63" x2="121" y2="104" stroke="${red}" stroke-width="2.6"/>
      <polygon points="121,110 116,100 126,100" fill="${red}"/>
      <circle cx="212" cy="56" r="20" fill="${yellow}" stroke="${ink}" stroke-width="2" stroke-dasharray="4 3"/>
      <text x="212" y="62" text-anchor="middle" font-family="Georgia, serif" font-size="18" font-weight="700" fill="${ink}">?</text>
    `;
  } else if (preset === 'xrayMechanism') {
    body = `
      <rect x="44" y="68" width="232" height="32" rx="4" fill="none" stroke="${ink}" stroke-width="1.8" stroke-dasharray="5 3"/>
      <path d="M 88 68 L 96 96 L 106 72 L 116 96 L 126 68 M 192 68 L 200 96 L 210 72 L 220 96 L 230 68" fill="none" stroke="${yellow}" stroke-width="2.4"/>
      <path d="M 160 96 L 160 32" stroke="${red}" stroke-width="2.8" stroke-linecap="round"/>
      <polygon points="160,25 154,36 166,36" fill="${red}"/>
      <circle cx="160" cy="60" r="11" fill="${green}" stroke="${ink}" stroke-width="1.8"/>
    `;
  } else if (preset === 'misconceptionTrap') {
    body = `
      <path d="M 56 76 Q 130 28 206 76" fill="none" stroke="${red}" stroke-width="2.2" stroke-dasharray="6 4"/>
      <line x1="122" y1="42" x2="142" y2="62" stroke="${red}" stroke-width="2.6"/>
      <line x1="142" y1="42" x2="122" y2="62" stroke="${red}" stroke-width="2.6"/>
      <path d="M 56 84 L 254 52" stroke="${green}" stroke-width="2.6" stroke-linecap="round"/>
      <circle cx="254" cy="52" r="9" fill="${yellow}" stroke="${ink}" stroke-width="1.8"/>
    `;
  } else if (preset === 'nextHorizon') {
    body = `
      <line x1="36" y1="88" x2="284" y2="88" stroke="${ink}" stroke-width="1.8"/>
      <circle cx="92" cy="66" r="18" fill="${green}" stroke="${ink}" stroke-width="2"/>
      <path d="M 118 66 C 154 38, 186 38, 224 58" fill="none" stroke="${blue}" stroke-width="2.4" stroke-dasharray="5 3"/>
      <polygon points="246,58 222,46 226,68" fill="${yellow}" stroke="${ink}" stroke-width="1.8"/>
    `;
  } else {
    // anomalySetup tailored with subtle domain motif
    body = `
      <line x1="34" y1="88" x2="286" y2="88" stroke="${ink}" stroke-width="2"/>
      <ellipse cx="118" cy="58" rx="34" ry="24" fill="none" stroke="${blue}" stroke-width="2.2"/>
      <polygon points="118,36 98,74 138,74" fill="${yellow}" stroke="${ink}" stroke-width="2"/>
      <circle cx="212" cy="58" r="16" fill="${red}" stroke="${ink}" stroke-width="2"/>
      <line x1="154" y1="58" x2="192" y2="58" stroke="${ink}" stroke-width="1.8" stroke-dasharray="4 3"/>
    `;
  }

  const calloutSVG = callout ? `
    <g class="atlas-comic-callout">
      <line x1="168" y1="48" x2="196" y2="26" stroke="${ink}" stroke-width="1.4"/>
      <circle cx="168" cy="48" r="3" fill="${ink}"/>
      <rect x="196" y="12" width="114" height="22" rx="5" fill="${sheet}" stroke="${ink}" stroke-width="1.2"/>
      <text x="253" y="26" text-anchor="middle" font-family="ui-monospace, SFMono-Regular, monospace" font-size="9.5" fill="${ink}">${callout.slice(0, 20)}</text>
    </g>
  ` : '';

  return `<svg viewBox="0 0 320 118" role="img" aria-label="${esc(panel.calloutLabel || preset)}">
    <defs>
      <pattern id="riso-${pid}" width="12" height="12" patternUnits="userSpaceOnUse">
        <circle cx="3" cy="3" r="1" fill="${faint}"/>
      </pattern>
      <pattern id="hatch-${pid}" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="8" stroke="${faint}" stroke-width="1"/>
      </pattern>
    </defs>
    <rect x="0" y="0" width="320" height="118" fill="url(#riso-${pid})"/>
    <rect x="0" y="88" width="320" height="30" fill="url(#hatch-${pid})" opacity="0.55"/>
    ${body}
    ${calloutSVG}
  </svg>`;
}

export function renderComicStripHTML(strip, opts = {}) {
  if (!strip || !Array.isArray(strip.panels) || !strip.panels.length) return '';
  const role = strip.role || 'chapterOpener';
  const roleLabel = ROLE_LABELS[role] || 'Sequential Strip';
  const emblem = opts.emblem || 'orbitalField';
  const panelsHTML = strip.panels.map((p, idx) => {
    const num = p.panelNumber ?? (idx + 1);
    const balloon = p.balloon ? (() => {
      const basis = BASIS_LABELS[p.balloon.sourceBasis] || BASIS_LABELS.thoughtExperiment;
      const tail = p.balloon.tailDirection === 'bottomRight' ? 'bottomRight' : 'bottomLeft';
      return `<div class="atlas-comic-balloon-wrap">
        <div class="atlas-comic-balloon" data-tail="${tail}">
          <div class="atlas-comic-speaker-row">
            <span>${esc(p.balloon.speaker || 'Reader')}</span>
            <span class="atlas-comic-basis">${esc(basis)}</span>
          </div>
          <div>${renderByrneInlineHTML(p.balloon.textRich || '')}</div>
        </div>
      </div>`;
    })() : '';

    return `<article class="atlas-comic-panel" data-span="${esc(p.span || 'half')}" data-panel="${num}">
      <div class="atlas-comic-caption">
        <span class="atlas-comic-num">${num}</span>
        <span>${renderByrneInlineHTML(p.captionRich || '')}</span>
      </div>
      <div class="atlas-comic-art" data-art-slot="${num}">
        ${renderComicPanelSVG(p, emblem)}
      </div>
      ${balloon}
    </article>`;
  }).join('');

  const nextActionHTML = opts.nextLabel
    ? `<div class="atlas-comic-footer"><button type="button" class="atlas-comic-turn-btn" data-comic-next="1">${esc(opts.nextLabel)} →</button></div>`
    : '';

  return `<section class="atlas-comic-strip" data-role="${esc(role)}" aria-label="${esc(strip.title || roleLabel)}">
    <div class="atlas-comic-header">
      <h2 class="atlas-comic-title">${esc(strip.title || roleLabel)}</h2>
      <span class="atlas-comic-role-tag">${esc(roleLabel)}</span>
    </div>
    <div class="atlas-comic-grid">${panelsHTML}</div>
    ${nextActionHTML}
  </section>`;
}

export function mountComicStrip(el, strip, opts = {}) {
  if (!el || !strip) return { destroy() {} };
  el.innerHTML = renderComicStripHTML(strip, opts);
  const mounted = [];
  (strip.panels || []).forEach((p, idx) => {
    if (!p.figure || !p.figure.chapter) return;
    const num = p.panelNumber ?? (idx + 1);
    const slot = el.querySelector(`[data-art-slot="${num}"]`);
    if (!slot) return;
    slot.innerHTML = '';
    const handle = mountFigure(slot, p.figure.chapter, {
      page: p.figure.page ?? 0,
      height: p.figure.height ?? 140,
    });
    if (handle) mounted.push(handle);
  });
  const nextBtn = el.querySelector('[data-comic-next="1"]');
  if (nextBtn && typeof opts.onNext === 'function') {
    nextBtn.addEventListener('click', () => opts.onNext());
  }
  return {
    destroy() {
      for (const m of mounted) m.destroy?.();
      el.innerHTML = '';
    },
  };
}
