// engine/present.js — Live interactive 16:9 presentation & lecture mode (?present, Shift+P).
// Zero Three.js imports; buildSlideMeta() is pure and Node-testable.

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const stripTags = s => String(s ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

export function buildSlideMeta({
  index = 0,
  total = 1,
  title = '',
  kicker = '',
  sub = '',
  notesHtml = '',
} = {}) {
  const safeTotal = Math.max(1, Math.floor(Number(total) || 1));
  const safeIndex = Math.max(0, Math.min(safeTotal - 1, Math.floor(Number(index) || 0)));
  const cleanTitle = stripTags(title) || `Slide ${safeIndex + 1}`;
  const cleanKicker = stripTags(kicker);
  const cleanSub = stripTags(sub);
  return {
    index: safeIndex,
    total: safeTotal,
    counter: `${safeIndex + 1} / ${safeTotal}`,
    title: cleanTitle,
    kicker: cleanKicker,
    sub: cleanSub,
    notesHtml: notesHtml ? String(notesHtml) : (cleanSub ? `<p>${esc(cleanSub)}</p>` : ''),
  };
}

export function mountPresentMode({
  kind = 'book',
  title = '',
  count = 1,
  getIndex = () => 0,
  goTo = () => {},
  getSlideMeta = () => ({}),
  getStage = () => null,
  initialActive = false,
  renderOnly = false,
} = {}) {
  if (typeof document === 'undefined') return null;
  if (renderOnly && !initialActive) {
    return { root: null, sync() {}, setActive: () => false, toggle: () => false, isActive: () => false, destroy() {} };
  }

  let active = Boolean(initialActive);
  let notesOpen = false;
  let blankOpen = false;
  let laserOn = false;

  const root = document.createElement('div');
  root.className = 'prs-shell';
  root.hidden = !active;

  const bar = document.createElement('div');
  bar.className = 'prs-bar';
  bar.setAttribute('role', 'region');
  bar.setAttribute('aria-label', 'Presentation controls');

  const notes = document.createElement('aside');
  notes.className = 'prs-notes';
  notes.hidden = true;
  notes.setAttribute('aria-label', 'Speaker notes');

  const laser = document.createElement('div');
  laser.className = 'prs-laser';
  laser.hidden = true;
  laser.setAttribute('aria-hidden', 'true');

  root.append(notes, bar, laser);
  document.body.appendChild(root);

  function syncDomClasses() {
    const html = document.documentElement;
    html.classList.toggle('present', active);
    html.classList.toggle('present-blank', active && blankOpen);
    html.dataset.presentKind = kind;
    root.hidden = !active;
  }

  function sync() {
    const idx = Math.max(0, Math.min(Math.max(1, count) - 1, Number(getIndex?.()) || 0));
    const raw = getSlideMeta?.(idx) || {};
    const meta = buildSlideMeta({
      index: idx,
      total: count,
      title: raw.title || title,
      kicker: raw.kicker || '',
      sub: raw.sub || '',
      notesHtml: raw.notesHtml || '',
    });

    bar.innerHTML = [
      `<div class="prs-meta">`,
      `  <span class="prs-count">${esc(meta.counter)}</span>`,
      meta.kicker ? `<span class="prs-kicker">${esc(meta.kicker)}</span>` : '',
      `  <strong class="prs-title">${esc(meta.title)}</strong>`,
      meta.sub ? `<span class="prs-sub">${esc(meta.sub)}</span>` : '',
      `</div>`,
      renderOnly ? '' : [
        `<div class="prs-acts">`,
        `  <button type="button" data-prs="prev" aria-label="Previous slide"${meta.index <= 0 ? ' disabled' : ''}>←</button>`,
        `  <button type="button" data-prs="next" aria-label="Next slide"${meta.index >= meta.total - 1 ? ' disabled' : ''}>→</button>`,
        `  <button type="button" data-prs="notes" aria-pressed="${notesOpen}" title="Speaker notes (N)">Notes</button>`,
        `  <button type="button" data-prs="blank" aria-pressed="${blankOpen}" title="Focus stage (B)">Focus</button>`,
        `  <button type="button" data-prs="laser" aria-pressed="${laserOn}" title="Laser pointer (L)">Laser</button>`,
        `  <button type="button" data-prs="exit" title="Exit presentation (Esc)">Exit</button>`,
        `</div>`,
      ].join(''),
    ].join('');

    notes.innerHTML = `<div class="prs-notes-head"><span>Speaker Notes · ${esc(meta.counter)}</span><button type="button" data-prs="notes">Close</button></div><div class="prs-notes-body">${meta.notesHtml || '<p>No notes on this slide.</p>'}</div>`;
    notes.hidden = !(active && notesOpen && !renderOnly);
  }

  function setActive(flag) {
    const next = Boolean(flag);
    if (next === active && root.hidden === !next) return active;
    active = next;
    if (!active) {
      notesOpen = false;
      blankOpen = false;
      laserOn = false;
      laser.hidden = true;
    }
    syncDomClasses();
    sync();
    requestAnimationFrame(() => getStage?.()?.fit?.());
    return active;
  }

  const onBarClick = e => {
    const act = e.target.closest('[data-prs]')?.dataset.prs;
    if (!act) return;
    e.stopPropagation();
    const cur = Number(getIndex?.()) || 0;
    if (act === 'prev') goTo(Math.max(0, cur - 1));
    else if (act === 'next') goTo(Math.min(count - 1, cur + 1));
    else if (act === 'notes') { notesOpen = !notesOpen; sync(); }
    else if (act === 'blank') { blankOpen = !blankOpen; syncDomClasses(); sync(); }
    else if (act === 'laser') { laserOn = !laserOn; laser.hidden = !laserOn; sync(); }
    else if (act === 'exit') setActive(false);
  };
  root.addEventListener('click', onBarClick);

  const onPointerMove = e => {
    if (!active || !laserOn || renderOnly) return;
    laser.hidden = false;
    laser.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
  };
  window.addEventListener('pointermove', onPointerMove, { passive: true });

  const hasOpenModal = () => Boolean(
    document.querySelector('#plate:not([hidden]), .molpanel, .specpanel')
  );

  const onKeyDown = e => {
    if (renderOnly) return;
    if (e.target?.closest?.('input, textarea, select, [contenteditable]')) return;
    if (e.key === 'P' && e.shiftKey && !e.metaKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      setActive(!active);
      return;
    }
    if (!active) return;

    const k = e.key;
    if (k === 'Escape') {
      if (hasOpenModal()) return;
      if (notesOpen) { notesOpen = false; sync(); e.preventDefault(); return; }
      if (blankOpen) { blankOpen = false; syncDomClasses(); sync(); e.preventDefault(); return; }
      e.preventDefault();
      setActive(false);
      return;
    }
    if (k === 'n' || k === 'N') {
      e.preventDefault(); notesOpen = !notesOpen; sync();
    } else if (k === 'b' || k === 'B') {
      e.preventDefault(); blankOpen = !blankOpen; syncDomClasses(); sync();
    } else if (k === 'l' || k === 'L') {
      e.preventDefault(); laserOn = !laserOn; laser.hidden = !laserOn; sync();
    } else if (k === 'ArrowRight' || k === 'PageDown' || (k === ' ' && !e.target?.closest?.('button, a'))) {
      e.preventDefault();
      e.stopImmediatePropagation();
      goTo(Math.min(count - 1, (Number(getIndex?.()) || 0) + 1));
    } else if (k === 'ArrowLeft' || k === 'PageUp') {
      e.preventDefault();
      e.stopImmediatePropagation();
      goTo(Math.max(0, (Number(getIndex?.()) || 0) - 1));
    }
  };
  window.addEventListener('keydown', onKeyDown, { capture: true });

  syncDomClasses();
  sync();
  if (active) requestAnimationFrame(() => getStage?.()?.fit?.());

  return {
    root,
    sync,
    setActive,
    toggle() { return setActive(!active); },
    isActive: () => active,
    destroy() {
      root.removeEventListener('click', onBarClick);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('keydown', onKeyDown, { capture: true });
      document.documentElement.classList.remove('present', 'present-blank');
      root.remove();
    },
  };
}
