// clip(figures): at the middle of every page or step, at desktop (1440×900) and phone (390×844) sizes, checks for
// horizontal page overflow, collapsed SVGs, and clipped SVG paint using a staged overflow-release pixel-diff oracle
// (adapted from cathrynlavery/diagram-design lint-render.py). Returns the number of findings.
import { serve, launch, open } from './render.mjs';
import { createReviewPin } from '../engine/review.js';

const DIFF_JS = async ({ beforeB64, afterB64, box, edgeGuard, channelThreshold }) => {
  const load = async b64 => {
    const res = await fetch('data:image/png;base64,' + b64);
    return createImageBitmap(await res.blob());
  };
  const [bmpA, bmpB] = await Promise.all([load(beforeB64), load(afterB64)]);
  const w = bmpA.width, h = bmpA.height;
  const cv = new OffscreenCanvas(w, h), g = cv.getContext('2d', { willReadFrequently: true });
  g.drawImage(bmpA, 0, 0); const a = g.getImageData(0, 0, w, h).data;
  g.clearRect(0, 0, w, h);
  g.drawImage(bmpB, 0, 0); const b = g.getImageData(0, 0, w, h).data;
  bmpA.close(); bmpB.close();
  const dpr = window.devicePixelRatio || 1;
  const x0 = Math.floor((box.left - edgeGuard) * dpr), x1 = Math.ceil((box.right + edgeGuard) * dpr);
  const y0 = Math.floor((box.top - edgeGuard) * dpr), y1 = Math.ceil((box.bottom + edgeGuard) * dpr);
  let pixels = 0;
  for (let y = 0; y < h; y++) {
    const inY = y >= y0 && y < y1;
    const row = y * w * 4;
    for (let x = 0; x < w; x++) {
      if (inY && x >= x0 && x < x1) continue;
      const k = row + x * 4;
      if (
        Math.abs(a[k] - b[k]) >= channelThreshold ||
        Math.abs(a[k + 1] - b[k + 1]) >= channelThreshold ||
        Math.abs(a[k + 2] - b[k + 2]) >= channelThreshold ||
        Math.abs(a[k + 3] - b[k + 3]) >= channelThreshold
      ) pixels++;
    }
  }
  return { pixels };
};

export async function clipOnPage(page, { edgeGuard = 2, channelThreshold = 16, minDiffPixels = 8, scales = [1, 0.25] } = {}) {
  const findings = [];
  const overflowPx = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (overflowPx > 1) findings.push(`page-overflow (+${Math.round(overflowPx)}px)`);

  const targets = await page.evaluate(() => {
    const label = el => {
      const id = el.id ? '#' + el.id : '';
      const cls = el.getAttribute('class') ? '.' + el.getAttribute('class').trim().split(/\s+/)[0] : '';
      return el.tagName.toLowerCase() + id + cls;
    };
    const isHidden = el => {
      for (let cur = el; cur && cur !== document.documentElement; cur = cur.parentElement) {
        if (cur.hasAttribute('hidden') || cur.getAttribute('aria-hidden') === 'true' || cur.classList?.contains('leaf')) return true;
        const cs = getComputedStyle(cur);
        if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) return true;
      }
      return false;
    };
    return [...document.querySelectorAll('svg')].flatMap((svg, index) => {
      if (isHidden(svg)) return [];
      const chain = [];
      let blockedBy = null;
      for (let el = svg.parentElement; el && el !== document.body && el !== document.documentElement; el = el.parentElement) {
        const cs = getComputedStyle(el);
        if (cs.overflow === 'visible' && cs.overflowX === 'visible' && cs.overflowY === 'visible') continue;
        const canScroll = /(auto|scroll)/.test(`${cs.overflow} ${cs.overflowX} ${cs.overflowY}`);
        const scrolls = canScroll && (el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1);
        if (scrolls) { blockedBy = label(el); break; }
        chain.push(label(el));
      }
      const cs = getComputedStyle(svg);
      return [{
        index,
        label: label(svg),
        ownOverflowVisible: cs.overflow === 'visible' && cs.overflowX === 'visible' && cs.overflowY === 'visible',
        chain,
        blockedBy,
      }];
    });
  });

  for (const t of targets) {
    // Snapshot scroll positions & scroll SVG into viewport if needed
    const box = await page.evaluate(idx => {
      const svg = document.querySelectorAll('svg')[idx];
      const snaps = [[window, window.scrollX, window.scrollY]];
      for (let el = svg.parentElement; el; el = el.parentElement) snaps.push([el, el.scrollTop, el.scrollLeft]);
      window.__clipScrollSnaps = snaps;
      let b = svg.getBoundingClientRect();
      if (b.top < 0 || b.bottom > window.innerHeight || b.left < 0 || b.right > window.innerWidth) {
        svg.scrollIntoView({ block: 'center', inline: 'nearest' });
        b = svg.getBoundingClientRect();
      }
      return { left: b.left, top: b.top, right: b.right, bottom: b.bottom, width: b.width, height: b.height };
    }, t.index);

    try {
      if (box.width < 1 || box.height < 1) {
        findings.push(`${t.label} collapsed (${box.width.toFixed(0)}×${box.height.toFixed(0)})`);
        continue;
      }
      let base1xB64 = null;
      // Stage 0: release the SVG itself (at 1x and 0.25x so wide spills inside narrow scroll containers are caught)
      if (!t.ownOverflowVisible) {
        for (const sc of scales) {
          let stageBox = box, beforeB64;
          try {
            if (sc !== 1) {
              stageBox = await page.evaluate((idx, s) => {
                const svg = document.querySelectorAll('svg')[idx];
                window.__clipStyleSnaps = [[svg, svg.getAttribute('style')]];
                svg.style.setProperty('transform-origin', 'top left', 'important');
                svg.style.setProperty('transform', `scale(${s})`, 'important');
                const b = svg.getBoundingClientRect();
                return { left: b.left, top: b.top, right: b.right, bottom: b.bottom };
              }, t.index, sc);
              beforeB64 = await page.screenshot({ encoding: 'base64' });
            } else {
              await page.evaluate(idx => {
                const svg = document.querySelectorAll('svg')[idx];
                window.__clipStyleSnaps = [[svg, svg.getAttribute('style')]];
              }, t.index);
              beforeB64 = base1xB64 || (base1xB64 = await page.screenshot({ encoding: 'base64' }));
            }
            await page.evaluate(idx => {
              const svg = document.querySelectorAll('svg')[idx];
              svg.style.setProperty('overflow', 'visible', 'important');
            }, t.index);
            const afterB64 = await page.screenshot({ encoding: 'base64' });
            const { pixels } = await page.evaluate(DIFF_JS, { beforeB64, afterB64, box: stageBox, edgeGuard, channelThreshold });
            if (pixels >= minDiffPixels) {
              findings.push(`${t.label} clipped (${pixels}px spilled past svg${sc !== 1 ? ` @${sc}x` : ''})`);
              break;
            }
          } finally {
            await page.evaluate(() => {
              for (const [el, st] of (window.__clipStyleSnaps || []).reverse()) {
                if (st === null) el.removeAttribute('style'); else el.setAttribute('style', st);
              }
              window.__clipStyleSnaps = [];
            });
          }
        }
      }
      // Stages 1..k: release nearest non-scrolling clipping ancestors at 1x
      for (let depth = 1; depth <= t.chain.length; depth++) {
        const beforeB64 = base1xB64 || (base1xB64 = await page.screenshot({ encoding: 'base64' }));
        try {
          const outerBox = await page.evaluate((idx, d) => {
            const svg = document.querySelectorAll('svg')[idx];
            const snaps = [[svg, svg.getAttribute('style')]];
            svg.style.setProperty('overflow', 'visible', 'important');
            let left = d, last = svg;
            for (let el = svg.parentElement; el && el !== document.body && el !== document.documentElement && left > 0; el = el.parentElement) {
              const cs = getComputedStyle(el);
              if (cs.overflow === 'visible' && cs.overflowX === 'visible' && cs.overflowY === 'visible') continue;
              const canScroll = /(auto|scroll)/.test(`${cs.overflow} ${cs.overflowX} ${cs.overflowY}`);
              const scrolls = canScroll && (el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1);
              if (scrolls) break;
              snaps.push([el, el.getAttribute('style')]);
              el.style.setProperty('overflow', 'visible', 'important');
              last = el;
              left--;
            }
            window.__clipStyleSnaps = snaps;
            const b = last.getBoundingClientRect();
            return { left: b.left, top: b.top, right: b.right, bottom: b.bottom };
          }, t.index, depth);
          const afterB64 = await page.screenshot({ encoding: 'base64' });
          const { pixels } = await page.evaluate(DIFF_JS, { beforeB64, afterB64, box: outerBox, edgeGuard, channelThreshold });
          if (pixels >= minDiffPixels) {
            findings.push(`${t.label} clipped by ${t.chain[depth - 1]} (${pixels}px spilled)`);
            break;
          }
        } finally {
          await page.evaluate(() => {
            for (const [el, st] of (window.__clipStyleSnaps || []).reverse()) {
              if (st === null) el.removeAttribute('style'); else el.setAttribute('style', st);
            }
            window.__clipStyleSnaps = [];
          });
        }
      }
    } finally {
      await page.evaluate(() => {
        for (const [el, top, left] of (window.__clipScrollSnaps || []).reverse()) {
          if (el === window) window.scrollTo( top, left );
          else { el.scrollTop = top; el.scrollLeft = left; }
        }
        window.__clipScrollSnaps = [];
      });
    }
  }
  return findings;
}

export async function clip(list, opts = {}) {
  const { server, base } = serve(), browser = await launch();
  const pins = opts.pins || null;
  let total = 0;
  try {
    for (const c of list) for (const [w, h, tag] of [[1440, 900, 'desk'], [390, 844, 'phone']]) {
      const R = await open(browser, base, c, w, h), found = [];
      for (let i = 0; i < R.pages; i++) {
        const t = R.mid(i);
        await R.seek(t);
        const stepFindings = await clipOnPage(R.page, opts);
        for (const f of stepFindings) {
          const text = `p${i} ${f}`;
          found.push(text);
          pins?.push(createReviewPin({
            figure: c, page: i, t, source: 'clip', severity: 'error', viewport: tag,
            xPct: 50, yPct: 50, text,
          }));
        }
      }
      total += found.length;
      console.log(c.padEnd(24), tag.padEnd(6), found.length ? `${found.length} CLIP FINDINGS\n  ` + found.join('\n  ') : 'clean');
      await R.page.close();
    }
  } finally {
    await browser.close(); server.close();
  }
  return total;
}

export async function selftest() {
  const browser = await launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 800, height: 600, deviceScaleFactor: 1 });
  const rows = [], check = (name, ok, info = '') => rows.push([ok ? 'PASS' : 'FAIL', name, info]);
  try {
    // 1. Clean SVG chart + intentional clipPath + hidden .leaf SVG -> 0 findings, exact DOM restoration
    await page.setContent(`<!doctype html><html><body style="margin:0;padding:40px;background:#f2f2ef">
      <div id="wrap" style="width:400px;overflow:hidden" data-keep="1">
        <svg id="clean" viewBox="0 0 200 100" style="width:200px;height:100px;display:block">
          <defs><clipPath id="cp"><rect x="0" y="0" width="200" height="100"/></clipPath></defs>
          <rect x="10" y="10" width="180" height="80" fill="#18181a"/>
          <circle cx="230" cy="50" r="40" fill="#b8343a" clip-path="url(#cp)"/>
          <circle cx="240" cy="50" r="40" fill="#b8343a" opacity="0"/>
        </svg>
      </div>
      <div class="leaf" style="display:none"><svg id="ghost" viewBox="0 0 100 50"></svg></div>
    </body></html>`);
    const beforeHtml = await page.evaluate(() => document.body.innerHTML);
    const fClean = await clipOnPage(page);
    const afterHtml = await page.evaluate(() => document.body.innerHTML);
    check('clip selftest: clean SVG, internal clipPath, opacity:0, and hidden .leaf pass with 0 findings', fClean.length === 0, fClean.join('; '));
    check('clip selftest: DOM style attributes restored byte-for-byte', beforeHtml === afterHtml);

    // 2. Stage 0 SVG spill (rect/stroke spilling outside viewBox) -> must flag svg-clipped
    await page.setContent(`<!doctype html><html><body style="margin:0;padding:80px;background:#fbfbfa">
      <svg id="spiller" viewBox="0 0 200 100" style="width:200px;height:100px;display:block">
        <rect x="150" y="20" width="90" height="60" fill="#b8343a"/>
      </svg>
    </body></html>`);
    const fSpill = await clipOnPage(page);
    check('clip selftest: stage 0 catches SVG ink spilling outside viewBox', fSpill.some(s => s.includes('svg#spiller clipped')), fSpill.join('; '));

    // 3. Stage 1 ancestor clip (overflow:visible SVG clipped by overflow:hidden wrapper) -> must flag ancestor-clipped
    await page.setContent(`<!doctype html><html><body style="margin:0;padding:80px;background:#fbfbfa">
      <div id="clipper" style="width:160px;height:100px;overflow:hidden">
        <svg id="inner" viewBox="0 0 240 100" style="width:240px;height:100px;overflow:visible;display:block">
          <rect x="0" y="10" width="230" height="80" fill="#18181a"/>
        </svg>
      </div>
    </body></html>`);
    const fAnc = await clipOnPage(page);
    check('clip selftest: stage 1 catches overflow:visible SVG clipped by overflow:hidden ancestor', fAnc.some(s => s.includes('clipped by div#clipper')), fAnc.join('; '));

    // 4. Horizontal page overflow -> must flag page-overflow
    await page.setContent(`<!doctype html><html><body style="margin:0;background:#fbfbfa">
      <div style="width:1200px;height:20px;background:#18181a"></div>
    </body></html>`);
    const fPage = await clipOnPage(page);
    check('clip selftest: catches horizontal document overflow', fPage.some(s => s.includes('page-overflow')), fPage.join('; '));
  } finally {
    await browser.close();
  }
  for (const [status, name, info] of rows) console.log(`${status}  ${name}${info ? '  ' + info : ''}`);
  return rows.some(([s]) => s === 'FAIL') ? 1 : 0;
}
