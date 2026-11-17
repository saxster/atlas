// Instant search (Cmd+K / Ctrl+K / /) across chapters, figures, book pages, concepts, threads, equations and practice questions.
// Works on the root page, examples/index.html, every subject shelf, and examples/concepts/index.html.
// Pure ranking helpers (tokenizeQuery, scoreItem, rankSearch) are exported at the top for Node selftests.
const EXAMPLES_BASE = new URL('../examples/', import.meta.url);
const INDEX_URL = new URL('../examples/search-index.js', import.meta.url).href;

const STOPWORDS = new Set([
  'a', 'about', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
  'how', 'in', 'into', 'is', 'it', 'of', 'on', 'or', 'that', 'the', 'to',
  'what', 'when', 'where', 'which', 'why', 'with',
]);

const KIND_WEIGHT = {
  chapter: 1.18,
  figure: 1.15,
  machine: 1.15,
  explorer: 1.15,
  sandbox: 1.15,
  teardown: 1.15,
  blueprint: 1.15,
  thread: 1.14,
  concept: 1.10,
  page: 1.05,
  practice: 0.92,
};

const RRF_K = 60;
const W_TEXT = 1.0;
const W_GRAPH = 0.55;
const GRAPH_SEEDS = 5;

export function tokenizeQuery(q) {
  return String(q || '')
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map(t => t.replace(/^[,.;:?!()"']+|[,.;:?!()"']+$/g, ''))
    .filter(Boolean);
}

function itemHaystack(it) {
  return `${it.title || ''} ${it.sub || ''} ${it.subject || ''} ${it.formula || ''} ${it.text || ''}`.toLowerCase();
}

function hasToken(textLow, tk) {
  if (!textLow || !tk) return false;
  if (!textLow.includes(tk)) return false;
  if (tk.length <= 2 && /^[a-z0-9]+$/.test(tk)) {
    const words = textLow.split(/[^\w]+/);
    return words.includes(tk);
  }
  return true;
}

export function buildIdf(index, tokens) {
  const N = Math.max(index.length, 1);
  const hasNonStop = tokens.some(t => !STOPWORDS.has(t));
  const map = new Map();
  for (const tk of tokens) {
    let df = 0;
    for (const it of index) {
      if (hasToken(itemHaystack(it), tk)) df++;
    }
    const base = Math.log(1 + N / (1 + df));
    map.set(tk, {
      idf: STOPWORDS.has(tk) && hasNonStop ? base * 0.25 : base,
      df,
      N,
    });
  }
  return map;
}

export function scoreItem(it, tokens, idfMap = null) {
  if (!tokens.length) {
    return (it.kind === 'chapter' || it.kind === 'figure' || it.kind === 'thread') ? 10 : 0;
  }
  const titleLow = (it.title || '').toLowerCase();
  const formulaLow = (it.formula || '').toLowerCase();
  const subLow = (it.sub || '').toLowerCase();
  const subjectLow = (it.subject || '').toLowerCase();
  const textLow = (it.text || '').toLowerCase();
  const titleWords = titleLow.split(/[^\w]+/).filter(Boolean);

  const contentTokens = tokens.filter(t => !STOPWORDS.has(t));
  const requiredPool = contentTokens.length ? contentTokens : tokens;

  let score = 0;
  let matchedCount = 0;
  let matchedContentCount = 0;
  let rareHit = false;

  for (const tk of tokens) {
    const info = idfMap?.get(tk);
    const idf = info ? info.idf : 1;
    let tkScore = 0;
    if (titleLow === tk || titleWords.includes(tk) || (tk.length > 2 && titleLow.startsWith(tk))) tkScore = 32 * idf;
    else if (hasToken(titleLow, tk)) tkScore = 20 * idf;
    if (hasToken(formulaLow, tk)) tkScore = Math.max(tkScore, 16 * idf) + (tkScore ? 4 * idf : 0);
    if (hasToken(subLow, tk)) tkScore = Math.max(tkScore, 10 * idf) + (tkScore ? 2 * idf : 0);
    if (hasToken(subjectLow, tk)) tkScore = Math.max(tkScore, 8 * idf);
    if (hasToken(textLow, tk)) tkScore = Math.max(tkScore, 6 * idf) + (tkScore ? 1.5 * idf : 0);

    if (tkScore > 0) {
      score += tkScore;
      matchedCount++;
      if (!STOPWORDS.has(tk)) {
        matchedContentCount++;
        if (!info || info.df <= Math.max(8, info.N * 0.18)) rareHit = true;
      }
    }
  }

  if (requiredPool.length && matchedContentCount === 0 && contentTokens.length > 0) return 0;
  const fullMatch = matchedCount === tokens.length;
  if (!fullMatch) {
    if (!rareHit && matchedContentCount < Math.ceil(requiredPool.length * 0.6)) return 0;
  } else {
    score *= 2.5;
  }

  if (it.kind === 'chapter' || it.kind === 'figure' || it.kind === 'thread') score += 6;
  if (it.kind === 'concept') score += 4;
  return score;
}

function whyPriority(why) {
  if (!why) return 0;
  if (why.startsWith('Compare ·')) return 3;
  if (why.startsWith('Thread ·')) return 2;
  return 1;
}

export function rankSearch(index, query, { limit = 28, spread = true } = {}) {
  if (!Array.isArray(index) || !index.length) return [];
  const tokens = tokenizeQuery(query);
  if (!tokens.length) {
    return index
      .filter(it => scoreItem(it, []) > 0)
      .slice(0, limit)
      .map(it => ({ ...it, matchWhy: it.links?.find(l => l.why?.startsWith('Compare ·'))?.why || null }));
  }

  const idfMap = buildIdf(index, tokens);
  const lexical = [];
  for (const it of index) {
    const s = scoreItem(it, tokens, idfMap);
    if (s > 0) {
      const hay = itemHaystack(it);
      const fullMatch = tokens.every(tk => hasToken(hay, tk));
      lexical.push({ it, score: s, fullMatch });
    }
  }
  lexical.sort((a, b) => (Number(b.fullMatch) - Number(a.fullMatch)) || (b.score - a.score));

  const textRankMap = new Map();
  const fullMatchSet = new Set();
  lexical.forEach((entry, idx) => {
    textRankMap.set(entry.it, idx + 1);
    if (entry.fullMatch) fullMatchSet.add(entry.it);
  });

  const graphScoreMap = new Map();
  const whyMap = new Map();

  if (spread && lexical.length) {
    const byId = new Map();
    for (const it of index) {
      if (it.id) byId.set(it.id, it);
    }
    const fullSeeds = lexical.filter(x => x.fullMatch);
    const seeds = (fullSeeds.length ? fullSeeds : lexical).slice(0, GRAPH_SEEDS);

    seeds.forEach((seed, seedIdx) => {
      const baseWeight = 1 / (seedIdx + 1);
      for (const link of seed.it.links || []) {
        const target = byId.get(link.to);
        if (!target || target === seed.it) continue;
        const boost = link.why?.startsWith('Compare ·') ? 1.45 : link.why?.startsWith('Thread ·') ? 1.2 : 1.0;
        graphScoreMap.set(target, (graphScoreMap.get(target) || 0) + baseWeight * boost);
        const prevWhy = whyMap.get(target);
        if (whyPriority(link.why) > whyPriority(prevWhy)) {
          whyMap.set(target, link.why);
        }
      }
    });
  }

  const graphSorted = [...graphScoreMap.entries()].sort((a, b) => b[1] - a[1]);
  const graphRankMap = new Map();
  graphSorted.forEach(([it], idx) => graphRankMap.set(it, idx + 1));

  const candidates = new Set([...lexical.map(x => x.it), ...graphScoreMap.keys()]);
  const fused = [];

  for (const it of candidates) {
    const tRank = textRankMap.get(it) || 0;
    const gRank = graphRankMap.get(it) || 0;
    const textTerm = tRank ? W_TEXT / (RRF_K + tRank) : 0;
    const graphTerm = gRank ? W_GRAPH / (RRF_K + gRank) : 0;
    const kw = KIND_WEIGHT[it.kind] || 1.0;
    const rrf = (textTerm + graphTerm) * kw;
    const ownCompare = it.links?.find(l => l.why?.startsWith('Compare ·'))?.why || null;
    const matchWhy = whyMap.get(it) || (fullMatchSet.has(it) ? ownCompare : null);
    fused.push({
      it,
      fullMatch: fullMatchSet.has(it),
      hasWhy: Boolean(whyMap.get(it)),
      rrf,
      lexScore: tRank ? lexical[tRank - 1].score : 0,
      matchWhy,
    });
  }

  fused.sort((a, b) => {
    if (a.fullMatch !== b.fullMatch) return Number(b.fullMatch) - Number(a.fullMatch);
    if (!a.fullMatch && a.hasWhy !== b.hasWhy) return Number(b.hasWhy) - Number(a.hasWhy);
    if (Math.abs(b.rrf - a.rrf) > 1e-9) return b.rrf - a.rrf;
    return b.lexScore - a.lexScore;
  });

  return fused.slice(0, limit).map(f => ({
    ...f.it,
    matchWhy: f.matchWhy || null,
  }));
}

const STYLE = `
.search-trigger {
  display: inline-flex; align-items: center; gap: 8px; border: 1px solid var(--faint); background: var(--card);
  color: var(--muted); border-radius: 999px; padding: 5px 11px; font: 500 11px/1 var(--mono); letter-spacing: .05em;
  text-transform: uppercase; cursor: pointer; transition: scale 120ms var(--ease-out), border-color 150ms, color 150ms;
}
@media (prefers-reduced-motion: no-preference) { .search-trigger:active:not(:disabled) { scale: 0.97; } }
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
.search-results li a.active { background: #efefe9; }
@media (hover: hover) and (pointer: fine) {
  .search-trigger:hover { border-color: var(--mid); color: var(--strong); }
  .search-results li a:hover { background: #efefe9; }
}
.search-results .sr-main { min-width: 0; flex: 1; }
.search-results .sr-title { font: 500 15px/1.3 var(--sans); color: var(--strong); }
.search-results .sr-sub { font: italic 14px/1.3 var(--serif); color: var(--muted); margin-left: 8px; }
.search-results .sr-eq { display: block; font: 400 14px/1.3 var(--serif); color: var(--hi); margin-top: 2px; }
.search-results .sr-why { display: block; font: 400 12px/1.35 var(--sans); color: var(--muted); margin-top: 3px; }
.search-results .sr-badge { flex: none; font: 500 10px/1 var(--mono); letter-spacing: .06em; text-transform: uppercase; color: var(--muted); border: 1px solid var(--faint); border-radius: 999px; padding: 3px 8px; }
.search-empty { padding: 24px 18px; text-align: center; font: italic 17px var(--serif); color: var(--muted); }
.concept-filter-wrap { max-width: 520px; margin: 20px auto 0; }
.concept-filter {
  width: 100%; padding: 10px 16px; border: 1px solid var(--faint); border-radius: 999px; background: var(--card);
  box-shadow: var(--lift); font: 400 15px var(--sans); color: var(--strong); outline: none;
}
@media (pointer: coarse) { .concept-filter { font-size: 16px; } }
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
      <input type="search" id="atlas-search-input" enterkeyhint="go" placeholder="Search chapters, concepts, equations, or questions…" autocomplete="off">
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

  function renderList(q) {
    if (!indexData) return;
    const matches = rankSearch(indexData, q, { limit: 28, spread: true });

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
          ${it.matchWhy ? `<span class="sr-why">${it.matchWhy}</span>` : ''}
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

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initSearch);
  else initSearch();
}
