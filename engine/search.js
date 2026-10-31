// Instant search (Cmd+K / Ctrl+K / /) across chapters, figures, book pages, concepts, equations and practice questions.
// Works on the root page, examples/index.html, every subject shelf, and examples/concepts/index.html.
const EXAMPLES_BASE = new URL('../examples/', import.meta.url);
const INDEX_URL = new URL('../examples/search-index.js', import.meta.url).href;

const STYLE = `
.search-trigger {
  display: inline-flex; align-items: center; gap: 8px; border: 1px solid var(--faint); background: var(--card);
  color: var(--muted); border-radius: 999px; padding: 5px 11px; font: 500 11px/1 var(--mono); letter-spacing: .05em;
  text-transform: uppercase; cursor: pointer;
}
.search-trigger:hover { border-color: var(--mid); color: var(--strong); }
.search-trigger kbd { font: 500 10px/1 var(--mono); color: var(--lo); border: 1px solid var(--faint); border-radius: 4px; padding: 2px 4px; background: var(--page, #f6f6f3); }
.search-backdrop {
  position: fixed; inset: 0; z-index: 50; background: rgba(20, 20, 19, 0.32); backdrop-filter: blur(3px);
  display: flex; align-items: flex-start; justify-content: center; padding: 10vh 16px 24px;
}
.search-backdrop[hidden] { display: none; }
.search-modal {
  width: min(640px, 100%); max-height: 76vh; background: var(--card, #fbfbfa); border-radius: 14px;
  box-shadow: 0 0 0 1px var(--faint), 0 18px 48px rgba(0,0,0,.16); display: flex; flex-direction: column; overflow: hidden;
}
.search-bar { display: flex; align-items: center; gap: 10px; padding: 14px 18px; border-bottom: 1px solid var(--faint); }
.search-bar input {
  flex: 1; border: 0; background: none; font: 400 18px/1.3 var(--sans); color: var(--strong); outline: none;
}
.search-bar .esc { border: 1px solid var(--faint); background: none; border-radius: 6px; padding: 4px 8px; font: 500 11px var(--mono); color: var(--muted); cursor: pointer; }
.search-results { list-style: none; margin: 0; padding: 8px; overflow-y: auto; flex: 1; }
.search-results li a {
  display: flex; align-items: baseline; justify-content: space-between; gap: 14px; padding: 10px 12px;
  border-radius: 8px; text-decoration: none; color: var(--text);
}
.search-results li a.active, .search-results li a:hover { background: #efefe9; }
.search-results .sr-main { min-width: 0; flex: 1; }
.search-results .sr-title { font: 500 15px/1.3 var(--sans); color: var(--strong); }
.search-results .sr-sub { font: italic 14px/1.3 var(--serif); color: var(--muted); margin-left: 8px; }
.search-results .sr-eq { display: block; font: 400 14px/1.3 var(--serif); color: var(--hi); margin-top: 2px; }
.search-results .sr-badge { flex: none; font: 500 10px/1 var(--mono); letter-spacing: .06em; text-transform: uppercase; color: var(--muted); border: 1px solid var(--faint); border-radius: 999px; padding: 3px 8px; }
.search-empty { padding: 24px 18px; text-align: center; font: italic 17px var(--serif); color: var(--muted); }
.concept-filter-wrap { max-width: 520px; margin: 20px auto 0; }
.concept-filter {
  width: 100%; padding: 10px 16px; border: 1px solid var(--faint); border-radius: 999px; background: var(--card);
  box-shadow: var(--lift); font: 400 15px var(--sans); color: var(--strong); outline: none;
}
.concept-filter:focus { border-color: var(--hi); }
`;

function initSearch() {
  const st = document.createElement('style'); st.textContent = STYLE; document.head.appendChild(st);
  const mac = /Mac|iPhone|iPad/.test(navigator.platform || '');
  const headerSpan = document.querySelector('header span') || document.querySelector('header');
  const btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'search-trigger'; btn.setAttribute('aria-label', 'Search Atlas (Command+K)');
  btn.innerHTML = `<span>Search</span><kbd>${mac ? '⌘K' : 'Ctrl+K'}</kbd>`;
  if (headerSpan) headerSpan.prepend(btn);

  const backdrop = document.createElement('div');
  backdrop.className = 'search-backdrop'; backdrop.hidden = true;
  backdrop.innerHTML = `<div class="search-modal" role="dialog" aria-modal="true" aria-label="Search Atlas">
    <div class="search-bar">
      <input type="search" id="atlas-search-input" placeholder="Search chapters, concepts, equations, or questions…" autocomplete="off">
      <button type="button" class="esc">Esc</button>
    </div>
    <ul class="search-results" id="atlas-search-results"></ul>
  </div>`;
  document.body.appendChild(backdrop);

  const input = backdrop.querySelector('#atlas-search-input');
  const list = backdrop.querySelector('#atlas-search-results');
  let indexData = null, activeIdx = 0, currentLinks = [];

  async function ensureIndex() {
    if (indexData) return indexData;
    try {
      const m = await import(INDEX_URL);
      indexData = m.SEARCH_INDEX || [];
    } catch { indexData = []; }
    return indexData;
  }

  function scoreItem(it, tokens) {
    if (!tokens.length) return it.kind === 'chapter' || it.kind === 'figure' ? 10 : 0;
    const hay = `${it.title} ${it.sub || ''} ${it.subject || ''} ${it.formula || ''} ${it.text || ''}`.toLowerCase();
    const titleLow = it.title.toLowerCase();
    let score = 0;
    for (const tk of tokens) {
      if (!hay.includes(tk)) return 0;
      score += titleLow.startsWith(tk) ? 30 : titleLow.includes(tk) ? 18 : 8;
    }
    if (it.kind === 'chapter' || it.kind === 'figure') score += 6;
    if (it.kind === 'concept') score += 4;
    return score;
  }

  function renderList(q) {
    if (!indexData) return;
    const tokens = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const matches = indexData
      .map(it => ({ it, s: scoreItem(it, tokens) }))
      .filter(x => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 28)
      .map(x => x.it);

    if (!matches.length) {
      list.innerHTML = `<li class="search-empty">No matching chapters, concepts, equations, or questions.</li>`;
      currentLinks = [];
      return;
    }
    activeIdx = 0;
    list.innerHTML = matches.map((it, i) => {
      const url = new URL(it.href, EXAMPLES_BASE).href;
      return `<li><a href="${url}" class="${i === 0 ? 'active' : ''}">
        <div class="sr-main">
          <span class="sr-title">${it.title}</span>
          ${it.sub ? `<span class="sr-sub">${it.sub}</span>` : ''}
          ${it.formulaHtml ? `<span class="sr-eq">${it.formulaHtml}</span>` : ''}
        </div>
        <span class="sr-badge">${it.subject} · ${it.kind}</span>
      </a></li>`;
    }).join('');
    currentLinks = [...list.querySelectorAll('a')];
  }

  async function openModal() {
    backdrop.hidden = false;
    input.focus(); input.select();
    await ensureIndex();
    renderList(input.value);
  }
  function closeModal() { backdrop.hidden = true; }

  btn.onclick = openModal;
  backdrop.querySelector('.esc').onclick = closeModal;
  backdrop.addEventListener('click', e => { if (e.target === backdrop) closeModal(); });
  input.addEventListener('input', () => renderList(input.value));

  addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (backdrop.hidden) openModal(); else closeModal();
      return;
    }
    if (e.key === '/' && backdrop.hidden && !e.target.closest?.('input, textarea, select, [contenteditable]')) {
      e.preventDefault();
      openModal();
      return;
    }
    if (backdrop.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); closeModal(); }
    else if (e.key === 'ArrowDown' && currentLinks.length) {
      e.preventDefault();
      currentLinks[activeIdx]?.classList.remove('active');
      activeIdx = (activeIdx + 1) % currentLinks.length;
      currentLinks[activeIdx]?.classList.add('active');
      currentLinks[activeIdx]?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'ArrowUp' && currentLinks.length) {
      e.preventDefault();
      currentLinks[activeIdx]?.classList.remove('active');
      activeIdx = (activeIdx - 1 + currentLinks.length) % currentLinks.length;
      currentLinks[activeIdx]?.classList.add('active');
      currentLinks[activeIdx]?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter' && currentLinks[activeIdx]) {
      e.preventDefault();
      currentLinks[activeIdx].click();
    }
  });

  // Inline live filtering on examples/concepts/index.html if #concept-filter is present
  const filterInp = document.getElementById('concept-filter');
  if (filterInp) {
    filterInp.addEventListener('input', () => {
      const tokens = filterInp.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
      for (const grp of document.querySelectorAll('main .group')) {
        let vis = 0;
        for (const li of grp.querySelectorAll('li')) {
          const text = li.textContent.toLowerCase();
          const ok = tokens.every(tk => text.includes(tk));
          li.hidden = !ok;
          if (ok) vis++;
        }
        grp.hidden = vis === 0;
      }
    });
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initSearch);
else initSearch();
