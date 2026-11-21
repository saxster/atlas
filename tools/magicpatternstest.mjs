// node tools/magicpatternstest.mjs — browser E2E suite for all Magic Patterns workflow & UI integrations:
// 1. Root index.html ("Same Math, Five Voices" 6-voice switcher, WCAG AA badge, 7-subject switcher, 1440 & 390 responsive layout).
// 2. Live 16:9 presentation mode (?present on book & machine, ArrowRight, N speaker notes, B blank screen, Escape exit).
// 3. Spatial critique overlay & review pins (?inspect&reviewData=, Interact|Inspect|Tune|Pins, cam: patch & decoded pin).
// 4. Synchronized 3-Takes board (3 live ?embed iframes, Pick workflow + action receipt).
// 5. Gallery 2D Deck zoom shortcuts (Shift+1/2/0) & subject card actions (Remix|Embed|Slides, zero nested interactives).
// 6. Concepts coverage filters (All|Shown|Gaps + Remix) & examples/ink-ui/ 10-voice gallery + state previews + ?render hiding.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve, launch } from '../cli/render.mjs';
import { createReviewPin, encodeReviewPins } from '../engine/review.js';
import { writeTakesBoard } from '../cli/takes.mjs';

const HERE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TMP_TAKES = path.join(HERE, 'examples', '.tmp-takes-test.html');

const rows = [];
const check = (name, ok, info = '') => rows.push([ok ? 'PASS' : 'FAIL', name, info]);
const wait = ms => new Promise(r => setTimeout(r, ms));

const { server, base } = serve();
const browser = await launch();

try {
  const p = await browser.newPage();
  const runtimeErrors = [];
  p.on('pageerror', err => runtimeErrors.push(`pageerror: ${err.message}`));
  p.on('console', msg => {
    if (msg.type() === 'error') runtimeErrors.push(`console.error: ${msg.text()}`);
  });

  // 1. Root index.html — 1440x900 & 390x844 responsive, 6 Hero Voices + WCAG badge, 7 Subject tabs
  const errStartRoot = runtimeErrors.length;
  await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await p.goto(`${base}/`, { waitUntil: 'networkidle0' });
  await p.waitForSelector('#hero-voice-bar button[data-voice]');
  await wait(120);

  const heroVoicesResult = await p.evaluate(() => {
    const btns = [...document.querySelectorAll('#hero-voice-bar button[data-voice]')];
    const stage = document.getElementById('voice-hero-stage');
    const badge = document.getElementById('hero-wcag-badge');
    const meta = document.getElementById('hero-voice-meta');
    const seen = [];
    let allWcagPass = btns.length === 6;
    let allDatasetsMatch = btns.length === 6;
    for (const b of btns) {
      b.click();
      const v = b.dataset.voice;
      seen.push(v);
      const badgeOk = (badge?.textContent || '').includes('WCAG AA PASS');
      const attrOk = stage?.dataset?.voice === v && Boolean(stage?.dataset?.type) && Boolean(stage?.dataset?.radius);
      const metaOk = Boolean(meta?.textContent?.includes('medium:'));
      if (!badgeOk) allWcagPass = false;
      if (!attrOk || !metaOk) allDatasetsMatch = false;
    }
    return {
      count: btns.length,
      seen,
      allWcagPass,
      allDatasetsMatch,
      desktopOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    };
  });

  const subjResult = await p.evaluate(() => {
    const tabs = [...document.querySelectorAll('#subject-switcher .subj-tabs button[data-subj]')];
    const panel = document.getElementById('subj-panel');
    const titles = [];
    for (const t of tabs) {
      t.click();
      titles.push(panel?.querySelector('h3, strong, h2')?.textContent?.trim() || panel?.textContent?.slice(0, 40) || '');
    }
    const uniqueTitles = new Set(titles.filter(Boolean));
    return { count: tabs.length, uniqueCount: uniqueTitles.size };
  });

  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  await wait(150);
  const mobileOverflow = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

  const rootClean = runtimeErrors.length === errStartRoot;
  check('Root /: 6 hero voices swap attributes cleanly, WCAG AA PASS holds, 7 subjects switch, 1440/390 no overflow',
    rootClean
    && heroVoicesResult.count === 6
    && heroVoicesResult.allWcagPass
    && heroVoicesResult.allDatasetsMatch
    && !heroVoicesResult.desktopOverflow
    && subjResult.count === 7
    && subjResult.uniqueCount === 7
    && !mobileOverflow,
    `voices=${heroVoicesResult.count} subj=${subjResult.uniqueCount}/7 err=${runtimeErrors.length - errStartRoot}`);

  // 2. Live ?present lecture mode across book (physics/newton) & machine (minimal/machine)
  for (const figPath of ['examples/physics/newton', 'examples/minimal/machine']) {
    const errStartPrs = runtimeErrors.length;
    await p.goto(`${base}/${figPath}/?present`, { waitUntil: 'networkidle0' });
    await p.waitForSelector('html.present .prs-bar');
    await wait(150);

    const beforeCount = await p.evaluate(() => document.querySelector('.prs-count')?.textContent?.trim() || '');
    await p.keyboard.press('ArrowRight');
    await p.waitForFunction(
      prev => (document.querySelector('.prs-count')?.textContent?.trim() || '') !== prev,
      { timeout: 3000 },
      beforeCount
    ).catch(() => {});
    const afterCount = await p.evaluate(() => document.querySelector('.prs-count')?.textContent?.trim() || '');

    await p.keyboard.press('KeyN');
    await wait(80);
    const notesVisible = await p.evaluate(() => {
      const n = document.querySelector('.prs-notes');
      return Boolean(n && !n.hidden);
    });

    await p.keyboard.press('KeyB');
    await wait(60);
    const blankOn = await p.evaluate(() => document.documentElement.classList.contains('present-blank'));
    await p.keyboard.press('KeyB');
    await wait(60);
    const blankOff = await p.evaluate(() => !document.documentElement.classList.contains('present-blank'));

    await p.keyboard.press('Escape');
    await wait(80);
    const notesClosedByFirstEsc = await p.evaluate(() => {
      const n = document.querySelector('.prs-notes');
      return Boolean(n?.hidden) && document.documentElement.classList.contains('present');
    });

    await p.keyboard.press('Escape');
    await wait(100);
    const exited = await p.evaluate(() => !document.documentElement.classList.contains('present'));

    const prsClean = runtimeErrors.length === errStartPrs;
    check(`Present mode (${figPath}): ?present active, ArrowRight advances (${beforeCount} -> ${afterCount}), N notes, B blank, Escape closes notes then exits`,
      prsClean && beforeCount !== afterCount && notesVisible && blankOn && blankOff && notesClosedByFirstEsc && exited,
      `${beforeCount} -> ${afterCount}, notes=${notesVisible}, blank=${blankOn}/${blankOff}, escNotes=${notesClosedByFirstEsc}, exit=${exited}`);
  }

  // 3. Spatial inspection overlay & encoded review pins (?inspect&reviewData=...)
  {
    const errStartRev = runtimeErrors.length;
    const encoded = encodeReviewPins([
      createReviewPin({
        figure: 'examples/minimal/machine',
        page: 0,
        xPct: 42,
        yPct: 38,
        source: 'labels',
        severity: 'error',
        text: 'Test overlap pin',
      }),
    ]);
    await p.goto(`${base}/examples/minimal/machine/?inspect&reviewData=${encoded}`, { waitUntil: 'networkidle0' });
    await p.waitForSelector('.atlas-ov-bar button[data-ov-mode]');
    await wait(150);

    const modesOk = await p.evaluate(() => {
      const root = document.querySelector('.atlas-ov-root');
      const modes = ['interact', 'inspect', 'tune', 'pins'];
      return modes.every(m => {
        const b = document.querySelector(`.atlas-ov-bar button[data-ov-mode="${m}"]`);
        b?.click();
        return root?.getAttribute('data-ov-mode') === m && b?.getAttribute('aria-pressed') === 'true';
      });
    });

    await p.evaluate(() => document.querySelector('.atlas-ov-bar button[data-ov-mode="tune"]')?.click());
    await wait(80);
    const patchBefore = await p.evaluate(() => document.querySelector('[data-tune-patch]')?.textContent || '');
    await p.evaluate(() => {
      const sl = document.querySelector('[data-tune="dAz"]');
      if (!sl) return;
      sl.value = '25';
      sl.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await wait(120);
    const patchAfter = await p.evaluate(() => document.querySelector('[data-tune-patch]')?.textContent || '');

    await p.evaluate(() => document.querySelector('.atlas-ov-bar button[data-ov-mode="pins"]')?.click());
    await wait(80);
    const pinInfo = await p.evaluate(() => {
      const pin = document.querySelector('.atlas-ov-pin');
      return pin ? { left: pin.style.left, top: pin.style.top, title: pin.getAttribute('title') } : null;
    });

    const revClean = runtimeErrors.length === errStartRev;
    check('Overlay & pins (/examples/minimal/machine/?inspect&reviewData=): 4 modes toggle, Tune emits updated cam: patch, decoded pin renders',
      revClean
      && modesOk
      && patchBefore.includes('cam: { target: [')
      && patchAfter.includes('cam: { target: [')
      && patchBefore !== patchAfter
      && !patchAfter.includes('fov: 2')
      && pinInfo?.left === '42%'
      && pinInfo?.top === '38%',
      `patch=${patchAfter.replace(/\s+/g, ' ')} pin=${JSON.stringify(pinInfo)}`);
  }

  // 4. Synchronized 3-Takes board with 3 live ?embed frames + Pick receipt
  {
    const errStartTakes = runtimeErrors.length;
    writeTakesBoard('examples/minimal/machine', { out: TMP_TAKES });
    await p.goto(`${base}/examples/.tmp-takes-test.html`, { waitUntil: 'networkidle0' });
    await p.waitForSelector('.takes-card iframe');
    await p.waitForFunction(() => {
      const frames = [...document.querySelectorAll('.takes-card iframe')];
      return frames.length === 3 && frames.every(f => {
        try {
          const doc = f.contentDocument;
          return doc?.readyState === 'complete' && Boolean(doc.querySelector('canvas'));
        } catch {
          return false;
        }
      });
    }, { timeout: 15000 });
    await wait(150);

    await p.click('.takes-pick[data-pick-id]');
    await p.waitForSelector('.atlas-receipt', { timeout: 3000 }).catch(() => {});
    const pickRes = await p.evaluate(() => {
      const frames = document.querySelectorAll('.takes-card iframe').length;
      const btn = document.querySelector('.takes-pick[data-pick-id]');
      const pressed = btn?.getAttribute('aria-pressed') === 'true';
      const receipt = document.querySelector('.atlas-receipt')?.textContent || '';
      return { frames, pressed, receipt };
    });

    const takesClean = runtimeErrors.length === errStartTakes;
    check('Synchronized 3-Takes board: 3 live ?embed canvases boot cleanly & Pick shows .atlas-receipt',
      takesClean && pickRes.frames === 3 && pickRes.pressed && pickRes.receipt.includes('Picked'),
      `frames=${pickRes.frames} receipt=${pickRes.receipt.slice(0, 48)}`);
  }

  // 5. Gallery 2D Deck zoom shortcuts (/examples/) & card action row (/examples/critical-thinking/)
  {
    const errStartGal = runtimeErrors.length;
    await p.goto(`${base}/examples/`, { waitUntil: 'networkidle0' });
    await p.waitForSelector('button[data-shelf-view="deck"]');
    await p.click('button[data-shelf-view="deck"]');
    await p.waitForSelector('[data-sd-zoom]');
    await wait(100);

    const zInit = await p.evaluate(() => document.querySelector('[data-sd-zoom]')?.textContent?.trim() || '');
    await p.evaluate(() => document.querySelector('#shelf-deck-host .sd-vp, #shelf-deck-host [tabindex="0"]')?.focus());
    await p.keyboard.down('Shift');
    await p.keyboard.press('Digit1');
    await p.keyboard.up('Shift');
    await wait(80);
    const z1 = await p.evaluate(() => document.querySelector('[data-sd-zoom]')?.textContent?.trim() || '');

    await p.keyboard.down('Shift');
    await p.keyboard.press('Digit2');
    await p.keyboard.up('Shift');
    await wait(80);
    const z2 = await p.evaluate(() => document.querySelector('[data-sd-zoom]')?.textContent?.trim() || '');

    await p.keyboard.down('Shift');
    await p.keyboard.press('Digit0');
    await p.keyboard.up('Shift');
    await wait(80);
    const z0 = await p.evaluate(() => document.querySelector('[data-sd-zoom]')?.textContent?.trim() || '');

    await p.goto(`${base}/examples/critical-thinking/`, { waitUntil: 'networkidle0' });
    await p.waitForSelector('.card-slot');
    const cardRes = await p.evaluate(() => {
      const slots = [...document.querySelectorAll('.card-slot')];
      const noNested = slots.every(s => !s.querySelector('a.card a, a.card button, a.card input'));
      const hasTools = slots.every(s =>
        s.querySelector('.card-tools [data-card-remix]')
        && s.querySelector('.card-tools [data-card-embed]')
        && s.querySelector('.card-tools a[href$="/?present"]')
      );
      const firstRemix = slots[0]?.querySelector('[data-card-remix]');
      firstRemix?.click();
      return { slots: slots.length, noNested, hasTools };
    });
    await wait(100);

    const galClean = runtimeErrors.length === errStartGal;
    check('Gallery 2D Deck zoom (Shift+1/2/0) & subject card-slot (Remix|Embed|Slides, no nested interactives)',
      galClean
      && zInit === '100%' && z1 === '72%' && z2 === '112%' && z0 === '100%'
      && cardRes.slots > 0 && cardRes.noNested && cardRes.hasTools,
      `zoom=${zInit}->${z1}->${z2}->${z0}, slots=${cardRes.slots}`);
  }

  // 6. Concepts page filters (All | Shown | Gaps + Remix)
  {
    const errStartCon = runtimeErrors.length;
    await p.goto(`${base}/examples/concepts/`, { waitUntil: 'networkidle0' });
    await p.waitForSelector('[data-concept-status="all"]');

    const conceptRes = await p.evaluate(() => {
      const btnAll = document.querySelector('[data-concept-status="all"]');
      const btnShown = document.querySelector('[data-concept-status="shown"]');
      const btnGaps = document.querySelector('[data-concept-status="gaps"]');
      const visCount = () => document.querySelectorAll('main .group:not(.thread) li:not([hidden])').length;
      const parseCount = el => Number((el?.textContent || '').match(/\((\d+)\)/)?.[1] ?? -1);

      btnShown?.click();
      const shownPressed = btnShown?.getAttribute('aria-pressed') === 'true';
      const shownVis = visCount();
      const shownExpected = parseCount(btnShown);

      btnGaps?.click();
      const gapsPressed = btnGaps?.getAttribute('aria-pressed') === 'true';
      const gapsVis = visCount();
      const gapsExpected = parseCount(btnGaps);

      btnAll?.click();
      const allPressed = btnAll?.getAttribute('aria-pressed') === 'true';
      const allVis = visCount();
      const allExpected = parseCount(btnAll);

      const remixBtns = document.querySelectorAll('.concept-remix[data-concept-remix]').length;
      return {
        shownOk: shownPressed && shownVis === shownExpected,
        gapsOk: gapsPressed && gapsVis === gapsExpected,
        allOk: allPressed && allVis === allExpected && allExpected > 0,
        remixBtns,
        summary: `all=${allVis}/${allExpected} shown=${shownVis}/${shownExpected} gaps=${gapsVis}/${gapsExpected} remix=${remixBtns}`,
      };
    });

    const conClean = runtimeErrors.length === errStartCon;
    check('Concepts /examples/concepts/: All | Shown | Gaps filter pills match counts & Remix buttons exist',
      conClean && conceptRes.shownOk && conceptRes.gapsOk && conceptRes.allOk && conceptRes.remixBtns > 0,
      conceptRes.summary);
  }

  // 7. examples/ink-ui/ #voice-gallery (all 10 voices), #state-previews & ?render hiding
  {
    const errStartInk = runtimeErrors.length;
    await p.goto(`${base}/examples/ink-ui/`, { waitUntil: 'networkidle0' });
    await p.waitForSelector('#voice-gallery-bar button[data-voice]');
    await wait(120);

    const inkLive = await p.evaluate(() => {
      const btns = [...document.querySelectorAll('#voice-gallery-bar button[data-voice]')];
      const stage = document.getElementById('voice-gallery-stage');
      const statesHost = document.getElementById('state-previews-host');
      let allMatched = btns.length === 10;
      let allWcag = btns.length === 10;
      for (const b of btns) {
        b.click();
        if (stage?.dataset?.voice !== b.dataset.voice) allMatched = false;
        if (!(stage?.textContent || '').includes('WCAG AA PASS')) allWcag = false;
      }
      return {
        voices: btns.length,
        allMatched,
        allWcag,
        stateCards: statesHost?.children?.length || 0,
      };
    });

    await p.goto(`${base}/examples/ink-ui/?render=1`, { waitUntil: 'networkidle0' });
    await p.waitForSelector('#bento-grid');
    const inkRenderHidden = await p.evaluate(() => {
      const vg = document.getElementById('voice-gallery');
      const sp = document.getElementById('state-previews');
      return {
        vgHidden: Boolean(vg && getComputedStyle(vg).display === 'none'),
        spHidden: Boolean(sp && getComputedStyle(sp).display === 'none'),
      };
    });

    const inkClean = runtimeErrors.length === errStartInk;
    check('examples/ink-ui/: 10-voice gallery (WCAG AA PASS), #state-previews matrix & hidden under ?render=1',
      inkClean
      && inkLive.voices === 10 && inkLive.allMatched && inkLive.allWcag
      && inkLive.stateCards > 0
      && inkRenderHidden.vgHidden && inkRenderHidden.spHidden,
      `voices=${inkLive.voices} stateCards=${inkLive.stateCards} renderHidden=${JSON.stringify(inkRenderHidden)}`);
  }

  check('Zero uncaught page or console errors across all Magic Patterns E2E journeys',
    runtimeErrors.length === 0,
    runtimeErrors.slice(0, 3).join(' | '));
} finally {
  try { fs.unlinkSync(TMP_TAKES); } catch {}
  await browser.close();
  server.close();
}

const pad = Math.max(...rows.map(r => r[1].length)) + 2;
for (const [status, name, info] of rows) {
  console.log(`${status.padEnd(5)} ${name.padEnd(pad)} ${info}`);
}
if (rows.some(r => r[0] === 'FAIL')) {
  process.exitCode = 1;
}
