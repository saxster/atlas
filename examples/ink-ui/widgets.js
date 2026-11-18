// Renders all 24 interactive bento widgets for Corner Atelier (examples/ink-ui/) in both 'standard' and 'creative' modes.
// Uses @saxster/atlas/iso_kit.js, @saxster/atlas/diegetic.js, and @saxster/atlas/chart.js with CSS custom-property
// fills (--accent, --accent-mid, --accent-deep, --accent-soft, --accent-ink, --accent-on) so brand swatch changes
// happen in 0ms without regenerating SVG DOM nodes.

import {
  isoSvg, isoNotepad, isoJar, isoFlipCalendar, isoPourOver, isoOven, isoSignRow,
  isoPawnTable, isoCup, isoCarton, isoKettle, isoEspressoMachine, isoTray,
  isoToaster, isoStamp, isoWaveformCup, isoNoticeBoard, isoCoin, isoCoinStack,
  isoPunchCard, isoDiscSlot, isoWallet, isoTicket,
} from '@saxster/atlas/iso_kit.js';
import { isoStackChart } from '@saxster/atlas/chart.js';
import * as M from './model.js';

const esc = s => String(s ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

export const COLUMNS = [
  ['search', 'filter', 'date', 'stepper', 'oven', 'toggles'],
  ['split', 'size', 'rating', 'milk', 'timer', 'order'],
  ['tray', 'toast', 'pay', 'audio', 'tabs', 'chat', 'tip'],
  ['club', 'shots', 'wallet', 'coupon', 'chart'],
];

function cardShell(id, title, pillHtml, bodyHtml, { footer = '', variant = '', mode = 'creative' } = {}) {
  const cls = `ink-card bento-card${variant ? ` ${variant}` : ''}`;
  return `<article class="${cls}" data-widget="${esc(id)}" data-mode="${esc(mode)}">` +
    `<header class="bento-head"><span class="bento-title">${esc(title)}</span>${pillHtml}</header>` +
    `<div class="bento-body">${bodyHtml}</div>` +
    (footer ? `<footer class="bento-foot">${footer}</footer>` : '') +
    `</article>`;
}

const pill = (text, cls = '') => `<span class="dg-pill${cls ? ` ${cls}` : ''}" data-pill>${esc(text)}</span>`;

export function renderWidget(id, state, { mode = 'creative', quirk = 'slightly-quirky' } = {}) {
  const isCreative = mode === 'creative';

  switch (id) {
    case 'search': {
      const s = M.searchMenu(state.searchQuery);
      if (!isCreative) {
        const body = `<div class="std-search">` +
          `<input type="search" class="std-input" data-search-input value="${esc(state.searchQuery)}" placeholder="Search the menu…" aria-label="Search the menu">` +
          `<button type="button" class="std-btn" data-act="search" aria-label="Cycle sample search">↻</button>` +
          `</div>`;
        return cardShell(id, 'Search', pill(s.badge), body, { mode });
      }
      const svg = isoSvg({ id: 'w-search', vb: [0, 0, 168, 66], quirk, staticBody: isoNotepad({ text: state.searchQuery || 'search…', progress: 1 }), label: `Search: ${state.searchQuery || 'all'}` });
      const body = `<button type="button" class="bento-fig-btn" data-act="search" aria-label="Search menu (${esc(state.searchQuery || 'all')}, ${esc(s.badge)})">${svg}</button>`;
      return cardShell(id, 'Search', pill(s.badge), body, { mode });
    }

    case 'filter': {
      const f = M.filterCount(state.filterCategory);
      const cats = Object.keys(M.CATEGORY_COUNTS);
      if (!isCreative) {
        const pills = cats.map(c => `<button type="button" class="std-pill" role="radio" aria-checked="${c === state.filterCategory}" data-act="filter" data-val="${c}">${c}</button>`).join('');
        return cardShell(id, 'Filter', pill(f.badge, 'accent'), `<div class="std-row" role="radiogroup" aria-label="Menu filter">${pills}</div>`, { mode });
      }
      const jars = cats.map((c, i) => {
        const active = c === state.filterCategory;
        const cx = 28 + i * 37;
        return isoJar({ x: 0, y: 0, z: 0, r: 9.5, h: 17, lidLift: active ? 0.85 : 0, active, label: c, origin: [cx, 54], scale: 0.92 });
      }).join('');
      const svg = isoSvg({ id: 'w-filter', vb: [0, 0, 168, 76], quirk, staticBody: jars, label: `Filter: ${state.filterCategory}` });
      const hits = cats.map(c => `<button type="button" class="dg-hit" role="radio" aria-checked="${c === state.filterCategory}" aria-label="Filter ${c}" data-act="filter" data-val="${c}"></button>`).join('');
      return cardShell(id, 'Filter', pill(state.filterCategory, 'accent'), `<div class="dg-art" role="radiogroup" aria-label="Filter category">${svg}<div class="dg-hit-row">${hits}</div></div>`, { mode });
    }

    case 'date': {
      const idx = M.clamp(state.dateIndex, 0, M.SCHEDULE_DAYS.length - 1);
      const d = M.SCHEDULE_DAYS[idx];
      const badgeText = `${d.day} · ${d.event}`;
      if (!isCreative) {
        const btns = M.SCHEDULE_DAYS.map((it, i) => `<button type="button" class="std-pill" role="radio" aria-checked="${i === idx}" data-act="date" data-val="${i}">${esc(it.day)}</button>`).join('');
        return cardShell(id, 'Date picker', pill(badgeText, 'accent'), `<div class="std-row" role="radiogroup" aria-label="Pick a day">${btns}</div>`, { mode });
      }
      const svg = isoSvg({ id: 'w-date', vb: [0, 0, 168, 68], quirk, staticBody: isoFlipCalendar({ days: M.SCHEDULE_DAYS.map(x => x.day), activeIndex: idx }), label: badgeText });
      const hits = M.SCHEDULE_DAYS.map((it, i) => `<button type="button" class="dg-hit" role="radio" aria-checked="${i === idx}" aria-label="${esc(it.day)}: ${esc(it.event)}" data-act="date" data-val="${i}"></button>`).join('');
      return cardShell(id, 'Date picker', pill(badgeText, 'accent'), `<div class="dg-art" role="radiogroup" aria-label="Date picker">${svg}<div class="dg-hit-row">${hits}</div></div>`, { mode });
    }

    case 'stepper': {
      const k = M.clamp(state.brewStep, 0, M.BREW_STEPS.length - 1);
      const badgeText = `Step ${k + 1} of ${M.BREW_STEPS.length}`;
      if (!isCreative) {
        const list = M.BREW_STEPS.map((st, i) => `<button type="button" class="std-step${i <= k ? ' is-done' : ''}" data-act="stepper" data-val="${i}" aria-pressed="${i === k}"><span>${i + 1}</span> ${esc(st)}</button>`).join('');
        return cardShell(id, 'Stepper', pill(badgeText), `<div class="std-col">${list}</div>`, { mode });
      }
      const svg = isoSvg({ id: 'w-stepper', vb: [0, 0, 168, 86], quirk, staticBody: isoPourOver({ step: k, steps: M.BREW_STEPS }), label: badgeText });
      const hits = M.BREW_STEPS.map((st, i) => `<button type="button" class="dg-hit" aria-pressed="${i === k}" aria-label="Step ${i + 1}: ${esc(st)}" data-act="stepper" data-val="${i}"></button>`).join('');
      return cardShell(id, 'Stepper', pill(badgeText), `<div class="dg-art">${svg}<div class="dg-hit-row">${hits}</div></div>`, { mode });
    }

    case 'oven': {
      const ov = M.ovenState(state.ovenProgress);
      const svg = isoSvg({ id: 'w-oven', vb: [0, 0, 168, 92], quirk, staticBody: isoOven({ progress: ov.progress }), label: `Cinnamon buns: ${ov.badge}` });
      const body = `<button type="button" class="bento-fig-btn" data-act="oven" aria-label="Cinnamon buns oven (${esc(ov.badge)})">${svg}</button>`;
      return cardShell(id, 'Cinnamon buns', pill(ov.badge, ov.status === 'Fresh out' ? 'accent' : ''), body, { mode });
    }

    case 'toggles': {
      const tg = M.toggleCount(state.toggleMask);
      const names = ['Open', 'Lights', 'Music'];
      const switches = names.map((nm, i) => {
        const on = Boolean(tg.mask & (1 << i));
        return `<button type="button" class="std-pill" role="switch" aria-checked="${on}" data-act="toggles" data-val="${i}">${nm}</button>`;
      }).join('');
      if (!isCreative) {
        return cardShell(id, 'Toggle switch', pill(tg.badge, 'accent'), `<div class="std-row">${switches}</div>`, { mode });
      }
      const svg = isoSvg({
        id: 'w-toggles',
        vb: [0, 0, 168, 68],
        quirk,
        staticBody: isoSignRow({ items: names, activeIndex: names.findIndex((_, i) => (tg.mask & (1 << i)) !== 0) }),
        label: `Switches: ${tg.badge}`,
      });
      return cardShell(id, 'Toggle switch', pill(tg.badge, 'accent'), `<div class="dg-art">${svg}</div>`, { footer: `<div class="std-row">${switches}</div>`, mode });
    }

    case 'split': {
      const sp = M.splitBill(48.00, state.splitCount);
      const svg = isoSvg({ id: 'w-split', vb: [0, 0, 168, 98], quirk, staticBody: isoPawnTable({ count: sp.people }), label: `Split the bill: ${sp.people} people, ${sp.badge}` });
      const foot = `<div class="bento-meta-row"><span>$48.00 BILL · ${sp.people} PEOPLE</span>` +
        `<span class="std-stepper"><button type="button" class="std-step-btn" data-act="split" data-val="${Math.max(2, sp.people - 1)}" aria-label="Fewer people">−</button>` +
        `<button type="button" class="std-step-btn" data-act="split" data-val="${Math.min(6, sp.people + 1)}" aria-label="More people">+</button></span></div>`;
      const body = `<button type="button" class="bento-fig-btn" data-act="split" aria-label="Split bill (${sp.people} people, ${sp.badge})">${svg}</button>`;
      return cardShell(id, 'Split the bill', pill(sp.badge, 'accent'), body, { footer: foot, mode });
    }

    case 'size': {
      const idx = M.clamp(state.sizeIndex, 0, M.SIZE_OPTIONS.length - 1);
      const opt = M.SIZE_OPTIONS[idx];
      const badgeText = `${opt.label} · ${M.dollars(opt.price)}`;
      const figs = M.SIZE_OPTIONS.map((o, i) => {
        const cx = 36 + i * 48;
        return isoCup({ x: 0, y: 0, z: 0, sizeScale: o.scale, takeaway: true, active: i === idx, origin: [cx, 62], scale: 0.92 });
      }).join('');
      const svg = isoSvg({ id: 'w-size', vb: [0, 0, 168, 84], quirk, staticBody: figs, label: `Size: ${badgeText}` });
      const hits = M.SIZE_OPTIONS.map((o, i) => `<button type="button" class="dg-hit" role="radio" aria-checked="${i === idx}" aria-label="${o.label} (${M.dollars(o.price)})" data-act="size" data-val="${i}"></button>`).join('');
      const foot = !isCreative
        ? `<div class="std-row" role="radiogroup" aria-label="Cup size">${M.SIZE_OPTIONS.map((o, i) => `<button type="button" class="std-pill" role="radio" aria-checked="${i === idx}" data-act="size" data-val="${i}">${o.label}</button>`).join('')}</div>`
        : '';
      return cardShell(id, 'Segmented control', pill(badgeText, 'accent'), `<div class="dg-art" role="radiogroup" aria-label="Cup size">${svg}<div class="dg-hit-row">${hits}</div></div>`, { footer: foot, mode });
    }

    case 'rating': {
      const r = M.clamp(state.rating, 1, 5);
      const lbl = M.RATING_LABELS[r - 1];
      if (!isCreative) {
        const stars = Array.from({ length: 5 }, (_, i) => `<button type="button" class="std-star${i < r ? ' is-on' : ''}" role="radio" aria-checked="${i + 1 === r}" aria-label="Rate ${i + 1} of 5" data-act="rating" data-val="${i + 1}">★</button>`).join('');
        return cardShell(id, 'Rating', pill(`${r}/5 · ${lbl}`), `<div class="std-row" role="radiogroup" aria-label="Rating">${stars}</div>`, { mode });
      }
      const cups = Array.from({ length: 5 }, (_, i) => {
        const cx = 22 + i * 31;
        return isoCup({ x: 0, y: 0, z: 0, sizeScale: 0.62, active: i < r, filled: i < r, latteHeart: i < r, origin: [cx, 44], scale: 0.85 });
      }).join('');
      const svg = isoSvg({ id: 'w-rating', vb: [0, 0, 168, 66], quirk, staticBody: cups, label: `Rating: ${r} of 5 (${lbl})` });
      const hits = Array.from({ length: 5 }, (_, i) => `<button type="button" class="dg-hit" role="radio" aria-checked="${i + 1 === r}" aria-label="Rate ${i + 1} of 5" data-act="rating" data-val="${i + 1}"></button>`).join('');
      return cardShell(id, 'Rating', pill(`${r}/5 · ${lbl}`, 'accent'), `<div class="dg-art" role="radiogroup" aria-label="Rating">${svg}<div class="dg-hit-row">${hits}</div></div>`, { mode });
    }

    case 'milk': {
      const idx = M.clamp(state.milkIndex, 0, M.MILK_OPTIONS.length - 1);
      const m = M.MILK_OPTIONS[idx];
      if (!isCreative) {
        const rows = M.MILK_OPTIONS.map((o, i) => `<button type="button" class="std-pill" role="radio" aria-checked="${i === idx}" data-act="milk" data-val="${i}">${o.label} (${o.badge})</button>`).join('');
        return cardShell(id, 'Radio · milk', pill(m.badge), `<div class="std-row" role="radiogroup" aria-label="Milk choice">${rows}</div>`, { mode });
      }
      const cartons = M.MILK_OPTIONS.map((o, i) => {
        const cx = 34 + i * 48;
        const active = i === idx;
        return isoCarton({ x: -8, y: -8, z: 0, tilt: active ? -12 : 0, active, label: o.short, origin: [cx, 54], scale: 0.88 });
      }).join('');
      const svg = isoSvg({ id: 'w-milk', vb: [0, 0, 168, 76], quirk, staticBody: cartons, label: `Milk: ${m.label} (${m.badge})` });
      const hits = M.MILK_OPTIONS.map((o, i) => `<button type="button" class="dg-hit" role="radio" aria-checked="${i === idx}" aria-label="${o.label} (${o.badge})" data-act="milk" data-val="${i}"></button>`).join('');
      return cardShell(id, 'Radio · milk', pill(`${m.label} · ${m.badge}`, 'accent'), `<div class="dg-art" role="radiogroup" aria-label="Milk choice">${svg}<div class="dg-hit-row">${hits}</div></div>`, { mode });
    }

    case 'timer': {
      const tm = M.timerReadout(state.timerSec);
      const svg = isoSvg({ id: 'w-timer', vb: [0, 0, 168, 86], quirk, staticBody: isoKettle({ progress: 1 - tm.sec / 45, ready: tm.ready }), label: `Ready in ${tm.badge}` });
      const body = `<button type="button" class="bento-fig-btn" data-act="timer" aria-label="Kettle timer (${tm.badge})">${svg}</button>`;
      const ledPill = `<span class="dg-pill" data-pill><i class="ink-led${tm.ready ? ' ok' : ''}" aria-hidden="true"></i>${esc(tm.badge)}</span>`;
      return cardShell(id, 'Ready in', ledPill, body, { variant: 'dark', mode });
    }

    case 'order': {
      const stg = M.clamp(state.orderStage, 0, M.ORDER_STAGES.length - 1);
      const status = M.ORDER_STAGES[stg];
      const svg = isoSvg({ id: 'w-order', vb: [0, 0, 168, 86], quirk, staticBody: isoEspressoMachine({ stage: stg }), label: `Order 42: ${status}` });
      const btns = M.ORDER_STAGES.map((lbl, i) => `<button type="button" class="std-pill" role="radio" aria-checked="${i === stg}" data-act="order" data-val="${i}">${lbl}</button>`).join('');
      return cardShell(id, 'Order 42', pill(status, 'accent'), `<div class="dg-art">${svg}</div>`, { footer: `<div class="std-row" role="radiogroup" aria-label="Order 42 stage">${btns}</div>`, variant: 'tint', mode });
    }

    case 'tray': {
      const tr = M.trayTotal(state.traySlots);
      if (!isCreative) {
        const checks = tr.active.map((it, i) => `<button type="button" class="std-pill" role="checkbox" aria-checked="${it.on}" data-act="tray" data-val="${i}">${it.on ? '✓ ' : ''}${esc(it.label)} ${M.dollars(it.price)}</button>`).join('');
        return cardShell(id, 'Checklist', pill(tr.badge, 'accent'), `<div class="std-col">${checks}</div>`, { mode });
      }
      const svg = isoSvg({ id: 'w-tray', vb: [0, 0, 168, 82], quirk, staticBody: isoTray({ slots: state.traySlots }), label: `Checklist tray: ${tr.badge}` });
      const hits = tr.active.map((it, i) => `<button type="button" class="dg-hit" role="checkbox" aria-checked="${it.on}" aria-label="${esc(it.label)} (${M.dollars(it.price)})" data-act="tray" data-val="${i}"></button>`).join('');
      const sub = `<div class="dg-sub-row">${tr.active.map(it => `<span class="${it.on ? 'is-active' : ''}">${esc(it.label)} ${M.dollars(it.price)}</span>`).join('')}</div>`;
      return cardShell(id, 'Checklist', pill(tr.badge, 'accent'), `<div class="dg-art">${svg}<div class="dg-hit-row">${hits}</div></div>`, { footer: sub, mode });
    }

    case 'toast': {
      const msg = M.TOAST_MESSAGES[state.toastIndex % M.TOAST_MESSAGES.length];
      const svg = isoSvg({ id: 'w-toast', vb: [0, 0, 84, 72], quirk, staticBody: isoToaster({ pop: state.toastIndex % 2 === 0 ? 0.6 : 1 }), label: msg.title });
      const body = `<button type="button" class="bento-toast-row" data-act="toast" aria-label="Toast notification: ${esc(msg.title)} (${esc(msg.meta)})">` +
        `<div class="toast-fig">${svg}</div>` +
        `<div class="toast-copy"><strong>${esc(msg.title)}</strong><span>${esc(msg.meta)}</span></div></button>`;
      return cardShell(id, 'Toast notification', pill('Now'), body, { mode });
    }

    case 'pay': {
      const stg = M.clamp(state.payStage, 0, M.PAY_STAGES.length - 1);
      const status = M.PAY_STAGES[stg];
      if (!isCreative) {
        const btn = `<button type="button" class="ink-key std-pay-btn" data-act="pay" aria-label="Pay $48.00 (${status})">Pay $48.00 · ${esc(status)}</button>`;
        return cardShell(id, 'Button · pay', pill(status, stg === 2 ? 'accent' : ''), btn, { mode });
      }
      const receiptAndStamp = `<rect x="28" y="18" width="76" height="48" rx="4" fill="#fffdf6" stroke="var(--ink, #231e16)" stroke-width="0.6"/>` +
        `<text x="66" y="36" text-anchor="middle" font-family="var(--mono, monospace)" font-size="8.5" font-weight="800" fill="var(--ink, #231e16)">TOTAL $48.00</text>` +
        `<text x="66" y="50" text-anchor="middle" font-family="var(--mono, monospace)" font-size="6.8" fill="var(--accent-ink, #b5381f)">${esc(status.toUpperCase())}</text>` +
        isoStamp({ x: 32, y: -6, z: 6, press: stg === 2 ? 0.9 : 0, origin: [96, 52], scale: 1.05 });
      const svg = isoSvg({ id: 'w-pay', vb: [0, 0, 168, 78], quirk, staticBody: receiptAndStamp, label: `Payment: ${status}` });
      return cardShell(id, 'Button · pay', pill(status, stg === 2 ? 'accent' : ''), `<button type="button" class="bento-fig-btn" data-act="pay" aria-label="Order from Maya: ${esc(status)}">${svg}</button>`, { mode });
    }

    case 'audio': {
      const sec = M.clamp(state.audioSec, 0, 4);
      const activeBar = Math.round((sec / 4) * (M.WAVEFORM_BARS.length - 1));
      const badgeText = `${sec > 0 && sec < 4 ? '❚❚' : '▶'} 0:0${sec}`;
      const svg = isoSvg({ id: 'w-audio', vb: [0, 0, 168, 76], quirk, staticBody: isoWaveformCup({ bars: M.WAVEFORM_BARS, activeBar }), label: `Voice note Maya: 0:0${sec}` });
      return cardShell(id, 'Audio player · Maya', pill(badgeText, 'accent'), `<button type="button" class="bento-fig-btn" data-act="audio" aria-label="Play voice note (${badgeText})">${svg}</button>`, { mode });
    }

    case 'tabs': {
      const idx = M.clamp(state.tabIndex, 0, M.TAB_ITEMS.length - 1);
      if (!isCreative) {
        const tabs = M.TAB_ITEMS.map((t, i) => `<button type="button" class="std-pill" role="tab" aria-selected="${i === idx}" data-act="tabs" data-val="${i}">${esc(t)}</button>`).join('');
        return cardShell(id, 'Tabs', pill(M.TAB_ITEMS[idx], 'accent'), `<div class="std-row" role="tablist" aria-label="Section tabs">${tabs}</div>`, { mode });
      }
      const svg = isoSvg({ id: 'w-tabs', vb: [0, 0, 168, 66], quirk, staticBody: isoSignRow({ items: M.TAB_ITEMS, activeIndex: idx }), label: `Tabs: ${M.TAB_ITEMS[idx]}` });
      const hits = M.TAB_ITEMS.map((t, i) => `<button type="button" class="dg-hit" role="tab" aria-selected="${i === idx}" aria-label="${esc(t)}" data-act="tabs" data-val="${i}"></button>`).join('');
      return cardShell(id, 'Tabs', pill(M.TAB_ITEMS[idx], 'accent'), `<div class="dg-art" role="tablist" aria-label="Hanging sign tabs">${svg}<div class="dg-hit-row">${hits}</div></div>`, { mode });
    }

    case 'chat': {
      const badgeText = state.chatTyping ? 'Typing…' : '✓✓ Seen · 9:41';
      if (!isCreative) {
        const bubbles = `<button type="button" class="std-chat" data-act="chat" aria-label="Toggle chat reply">` +
          `<div class="chat-b">Maya: Extra hot?</div><div class="chat-b reply">Café: ${state.chatTyping ? 'Typing…' : 'On it!'}</div></button>`;
        return cardShell(id, 'Chat', pill(badgeText), bubbles, { mode });
      }
      const svg = isoSvg({ id: 'w-chat', vb: [0, 0, 168, 84], quirk, staticBody: isoNoticeBoard({ typing: state.chatTyping }), label: `Chat: ${badgeText}` });
      return cardShell(id, 'Chat', pill(badgeText), `<button type="button" class="bento-fig-btn" data-act="chat" aria-label="Chat notice board (${badgeText})">${svg}</button>`, { mode });
    }

    case 'tip': {
      const tp = M.tipSummary(48.00, state.tipPct);
      const artBody = isCreative
        ? Array.from({ length: 10 }, (_, i) => isoCoin({ x: 0, y: 0, z: i < tp.coins ? 2 : 0, r: 7.5, h: 2.6, tone: i < tp.coins ? 'accent' : 'stone', origin: [20 + i * 14.2, 42], scale: 1 })).join('')
        : isoCoinStack({ x: 0, y: 0, z: 0, count: tp.coins, r: 13, discH: 3.2, tone: 'accent', origin: [84, 62], scale: 1 });
      const svg = isoSvg({ id: 'w-tip', vb: [0, 0, 168, 74], quirk, staticBody: artBody, label: `Tip: ${tp.badge}` });
      const body = `<div class="dg-art">${svg}` +
        `<input type="range" class="dg-range-overlay" data-tip-range data-key="tipPct" min="0" max="30" step="3" value="${tp.pct}" aria-label="Tip percentage (${tp.badge})">` +
        `</div>`;
      return cardShell(id, 'Slider · tip', pill(tp.badge, 'accent'), body, { mode });
    }

    case 'club': {
      const k = M.clamp(state.clubStamps, 0, 10);
      const svg = isoSvg({ id: 'w-club', vb: [0, 0, 168, 92], quirk, staticBody: isoPunchCard({ stamped: k, total: 10, press: 0.35 }), label: `Coffee club: ${k} of 10 stamps` });
      return cardShell(id, 'Progress · coffee club', pill(`${k}/10`, k === 10 ? 'accent' : ''), `<button type="button" class="bento-fig-btn" data-act="club" aria-label="Stamp loyalty card (${k} of 10)">${svg}</button>`, { mode });
    }

    case 'shots': {
      const sh = M.shotsSummary(state.shots);
      const slots = Array.from({ length: 4 }, (_, i) => {
        const cx = 28 + i * 37;
        return i < sh.shots
          ? isoCup({ x: 0, y: 0, z: 0, sizeScale: 0.72, active: true, origin: [cx, 48], scale: 0.9 })
          : isoDiscSlot({ x: 0, y: 0, z: 0, r: 11, active: false, dashed: true, origin: [cx, 48], scale: 0.9 });
      }).join('');
      const svg = isoSvg({ id: 'w-shots', vb: [0, 0, 168, 72], quirk, staticBody: slots, label: `Espresso shots: ${sh.badge}` });
      const hits = Array.from({ length: 4 }, (_, i) => `<button type="button" class="dg-hit" role="radio" aria-checked="${i + 1 === sh.shots}" aria-label="${i + 1} shot${i ? 's' : ''}" data-act="shots" data-val="${i + 1}"></button>`).join('');
      return cardShell(id, 'Number stepper', pill(sh.badge, 'accent'), `<div class="dg-art" role="radiogroup" aria-label="Espresso shots">${svg}<div class="dg-hit-row">${hits}</div></div>`, { mode });
    }

    case 'wallet': {
      const w = M.walletSummary(state.walletDrops);
      const svg = isoSvg({ id: 'w-wallet', vb: [0, 0, 168, 86], quirk, staticBody: isoWallet({ coinDrop: (w.drops % 2) * 0.55 }), label: `Wallet balance: ${w.formatted}` });
      const body = `<button type="button" class="bento-fig-btn" data-act="wallet" aria-label="Wallet balance ${w.formatted} (${w.badge})">` +
        `<div class="wallet-balance">${esc(w.formatted)}</div>${svg}</button>`;
      return cardShell(id, 'Balance', pill(w.badge, w.drops > 0 ? 'accent' : ''), body, { mode });
    }

    case 'coupon': {
      const torn = Boolean(state.couponTorn);
      const badgeText = torn ? 'BUN20 copied ✓' : 'Tear to use';
      const svg = isoSvg({ id: 'w-coupon', vb: [0, 0, 168, 82], quirk, staticBody: isoTicket({ torn }), label: `Coupon BUN20: ${badgeText}` });
      return cardShell(id, 'Coupon', pill(badgeText, torn ? 'accent' : ''), `<button type="button" class="bento-fig-btn" data-act="coupon" aria-pressed="${torn}" aria-label="Coupon BUN20 (${badgeText})">${svg}</button>`, { variant: 'tint', mode });
    }

    case 'chart': {
      const mInfo = M.monthSpendSummary(state.chartMonthIndex);
      const bars = M.MONTHLY_SPEND.map(b => ({ ...b, fmt: M.dollars }));
      const chartSvg = isoStackChart({
        bars,
        activeIndex: mInfo.index,
        maxDiscs: 8,
        unitShape: 'coin',
        w: 260,
        h: 152,
        kicker: `Spent in ${mInfo.month}`,
        id: 'w-chart',
        quirk,
      });
      const monthBtns = M.MONTHLY_SPEND.map((b, i) => `<button type="button" class="std-pill" role="radio" aria-checked="${i === mInfo.index}" data-act="chart" data-val="${i}">${b.label}</button>`).join('');
      return cardShell(id, `Spent in ${mInfo.month}`, pill(mInfo.badge, 'accent'), `<div class="dg-art">${chartSvg}</div>`, { footer: `<div class="std-row" role="radiogroup" aria-label="Select month">${monthBtns}</div>`, mode });
    }

    default:
      return '';
  }
}

export function renderBentoGrid(state, { mode = 'creative', quirk = 'slightly-quirky' } = {}) {
  return COLUMNS.map((colIds, cIdx) => {
    const cards = colIds.map(id => renderWidget(id, state, { mode, quirk })).join('');
    return `<div class="bento-col" data-col="${cIdx}">${cards}</div>`;
  }).join('');
}
