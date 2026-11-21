// cli/visual-learner.mjs — Blind screenshot-only visual learner QA harness adapted from
// withmarbleapp/os-taxonomy (`moon-visual-learner.mjs`). Receives ONLY paired viewport
// screenshots and its own recent action trace — zero DOM, source, geometry, or answer keys.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { serve, launch } from './render.mjs';
import { createReviewPin } from '../engine/review.js';

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const sha = buf => crypto.createHash('sha256').update(buf).digest('hex').slice(0, 16);
const clampNorm = v => Math.max(0, Math.min(1000, Number(v) || 0));

const SCRIPTED_ACTIONS = [
  { observation: 'Initial interactive viewport loaded; drag across the right-hand canvas to orbit.', action: 'drag', x: 720, y: 450, toX: 540, toY: 420, text: '' },
  { observation: 'Check responsive page controls along the top bar.', action: 'click', x: 510, y: 24, toX: 0, toY: 0, text: '' },
  { observation: 'Wait and compare paired frames to verify dwell stability.', action: 'wait', x: 0, y: 0, toX: 0, toY: 0, text: '' },
  { observation: 'Drag in the opposite direction to test camera response.', action: 'drag', x: 640, y: 460, toX: 790, toY: 430, text: '' },
  { observation: 'Complete blind visual tour.', action: 'stop', x: 0, y: 0, toX: 0, toY: 0, text: 'Checked main view and controls.' },
];

/**
 * Pure trace analyzer catching passive-wait loops, repeated fruitless clicks at nearly identical
 * coordinates, and actions whose paired screenshots show zero visual change.
 */
export function analyzeVisualLearnerTrace(steps = []) {
  const passiveWaitLoops = [];
  const repeatedFruitlessClicks = [];
  const unchangedFrameStalls = [];

  for (let i = 0; i < steps.length; i++) {
    const cur = steps[i];
    if (cur.frameAHash && cur.frameBHash && cur.frameAHash === cur.frameBHash && cur.action !== 'stop') {
      unchangedFrameStalls.push({ step: cur.step, action: cur.action });
    }
    if (i > 0) {
      const prev = steps[i - 1];
      if (prev.action === 'wait' && cur.action === 'wait' && prev.frameBHash === cur.frameBHash) {
        passiveWaitLoops.push({ fromStep: prev.step, toStep: cur.step });
      }
      if (
        prev.action === 'click'
        && cur.action === 'click'
        && prev.frameAHash === prev.frameBHash
        && cur.frameAHash === cur.frameBHash
        && Math.hypot((prev.x ?? 0) - (cur.x ?? 0), (prev.y ?? 0) - (cur.y ?? 0)) <= 25
      ) {
        repeatedFruitlessClicks.push({ fromStep: prev.step, toStep: cur.step, x: cur.x, y: cur.y });
      }
    }
  }

  return {
    totalSteps: steps.length,
    passiveWaitLoops,
    repeatedFruitlessClicks,
    unchangedFrameStalls,
  };
}

async function queryOllamaVision({ model, baseUrl, frameA, frameB, stepIndex, recentTrace }) {
  const systemPrompt = [
    'You are testing an interactive educational figure as a curious beginner.',
    'You receive ONLY two viewport screenshots separated by a short interval plus your own recent actions.',
    'Choose ONE physical action per step: click, drag, wait, reply, or stop.',
    'Coordinates x, y, toX, toY are normalized 0..1000 across the whole image (top-left 0,0). Use 0 for unused coordinates.',
    'Never invent hidden DOM state or wait repeatedly on an unchanged screen.',
    'Reply strictly with JSON: {"observation":"...","action":"click|drag|wait|reply|stop","text":"...","x":0,"y":0,"toX":0,"toY":0}.',
  ].join(' ');

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      model,
      stream: false,
      format: 'json',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Step ${stepIndex}. Recent trace: ${JSON.stringify(recentTrace.slice(-4))}. Inspect the paired screenshots and choose your next JSON action.`,
          images: [frameA.toString('base64'), frameB.toString('base64')],
        },
      ],
    }),
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) {
    throw new Error(`Ollama vision call failed (${response.status})`);
  }
  const payload = await response.json();
  const raw = payload?.message?.content ?? '{}';
  return JSON.parse(raw);
}

function buildHtmlReport(summary) {
  const rows = summary.steps.map(s => {
    const markerX = Math.round((clampNorm(s.x) / 1000) * summary.width);
    const markerY = Math.round((clampNorm(s.y) / 1000) * summary.height);
    const toX = Math.round((clampNorm(s.toX) / 1000) * summary.width);
    const toY = Math.round((clampNorm(s.toY) / 1000) * summary.height);
    const overlaySvg = s.action === 'drag'
      ? `<svg viewBox="0 0 ${summary.width} ${summary.height}" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none"><line x1="${markerX}" y1="${markerY}" x2="${toX}" y2="${toY}" stroke="#AE2B20" stroke-width="5"/><circle cx="${markerX}" cy="${markerY}" r="9" fill="#AE2B20"/></svg>`
      : (s.action === 'click'
        ? `<svg viewBox="0 0 ${summary.width} ${summary.height}" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none"><circle cx="${markerX}" cy="${markerY}" r="12" fill="none" stroke="#AE2B20" stroke-width="4"/></svg>`
        : '');
    return `<section style="border:1px solid #d5cab8;border-radius:8px;padding:12px;margin:14px 0;background:#fffdf7">
      <div style="font:600 13px/1.4 system-ui,sans-serif;color:#7a5112">Step ${s.step} · ${s.action} · (${s.x}, ${s.y}) → (${s.toX}, ${s.toY}) · delta=${s.frameChanged}</div>
      <p style="margin:6px 0 10px;font:14px/1.5 Georgia,serif">${String(s.observation || '').replace(/</g, '&lt;')}</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div style="position:relative"><img src="${s.frameA}" style="width:100%;border:1px solid #d5cab8;border-radius:4px"/>${overlaySvg}</div>
        <div><img src="${s.frameB}" style="width:100%;border:1px solid #d5cab8;border-radius:4px"/></div>
      </div>
    </section>`;
  }).join('\n');

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Atlas Visual Learner QA — ${summary.figure}</title></head>
<body style="max-width:1120px;margin:24px auto;padding:0 16px;background:#f4efe6;color:#1f1b16;font-family:Georgia,serif">
  <h1>Blind Screenshot-Only Visual Learner Report</h1>
  <p><strong>Figure:</strong> ${summary.figure} · <strong>Policy:</strong> ${summary.policy} · <strong>Steps:</strong> ${summary.steps.length} · <strong>Outcome:</strong> ${summary.outcome}</p>
  <p><strong>Diagnostics:</strong> passiveWaitLoops=${summary.diagnostics.passiveWaitLoops.length}, repeatedFruitlessClicks=${summary.diagnostics.repeatedFruitlessClicks.length}, unchangedFrameStalls=${summary.diagnostics.unchangedFrameStalls.length}</p>
  ${rows}
</body></html>`;
}

export async function visualLearner(
  figureArg,
  {
    outDir = 'artifacts/visual-learner',
    steps = 4,
    policy = 'scripted',
    model = 'qwen3-vl:4b-instruct',
    ollamaUrl = process.env.OLLAMA_URL || 'http://127.0.0.1:11434',
    width = 960,
    height = 640,
    dwellMs = 900,
    deterministic = false,
  } = {},
) {
  const absOut = path.resolve(outDir);
  fs.mkdirSync(absOut, { recursive: true });
  const figure = figureArg.replace(/\/$/, '');
  const { server, base } = serve();
  const browser = await launch();

  try {
    const page = await browser.newPage();
    await page.setViewport({ width, height, deviceScaleFactor: 1 });
    await page.goto(`${base}/${figure}/`, { waitUntil: 'networkidle0' });
    await page.evaluate(() => document.fonts?.ready);
    await wait(300);

    const trace = [];
    let outcome = 'step_limit';
    const maxSteps = Math.max(1, Number(steps) || 4);

    for (let idx = 0; idx < maxSteps; idx++) {
      const stepNum = idx + 1;
      const frameAName = `step-${String(stepNum).padStart(2, '0')}-a.png`;
      const frameBName = `step-${String(stepNum).padStart(2, '0')}-b.png`;
      const frameABuf = await page.screenshot({ path: path.join(absOut, frameAName) });
      if (deterministic) {
        await page.evaluate(() => window.__lesson?.advance?.(1.0));
      } else {
        await wait(dwellMs);
      }
      const frameBBuf = await page.screenshot({ path: path.join(absOut, frameBName) });

      let decision;
      if (policy === 'ollama') {
        decision = await queryOllamaVision({
          model,
          baseUrl: ollamaUrl,
          frameA: frameABuf,
          frameB: frameBBuf,
          stepIndex: stepNum,
          recentTrace: trace,
        });
      } else {
        decision = SCRIPTED_ACTIONS[idx % SCRIPTED_ACTIONS.length];
      }

      const action = ['click', 'drag', 'wait', 'reply', 'stop'].includes(decision.action) ? decision.action : 'wait';
      const x = clampNorm(decision.x);
      const y = clampNorm(decision.y);
      const toX = clampNorm(decision.toX);
      const toY = clampNorm(decision.toY);

      if (action === 'click') {
        await page.mouse.click((x / 1000) * width, (y / 1000) * height);
      } else if (action === 'drag') {
        const sx = (x / 1000) * width;
        const sy = (y / 1000) * height;
        const ex = (toX / 1000) * width;
        const ey = (toY / 1000) * height;
        await page.mouse.move(sx, sy);
        await page.mouse.down();
        for (let k = 1; k <= 8; k++) {
          await page.mouse.move(sx + ((ex - sx) * k) / 8, sy + ((ey - sy) * k) / 8);
        }
        await page.mouse.up();
      }
      await wait(180);

      const frameAHash = sha(frameABuf);
      const frameBHash = sha(frameBBuf);
      trace.push({
        step: stepNum,
        action,
        observation: String(decision.observation || ''),
        text: String(decision.text || ''),
        x,
        y,
        toX,
        toY,
        frameA: frameAName,
        frameB: frameBName,
        frameAHash,
        frameBHash,
        frameChanged: frameAHash !== frameBHash,
      });

      if (action === 'stop') {
        outcome = 'learner_stopped';
        break;
      }
    }

    const diagnostics = analyzeVisualLearnerTrace(trace);
    const summary = {
      figure,
      policy,
      width,
      height,
      outcome,
      diagnostics,
      steps: trace,
    };
    const pins = [];
    for (const u of diagnostics.unchangedFrameStalls) {
      const st = trace.find(s => s.step === u.step);
      pins.push(createReviewPin({
        figure, page: 0, t: u.step, source: 'visual-learner', severity: 'warn',
        xPct: (st?.x || 500) / 10, yPct: (st?.y || 500) / 10,
        text: `Step ${u.step} (${u.action}) produced identical before/after screenshots`,
      }));
    }
    for (const r of diagnostics.repeatedFruitlessClicks) {
      pins.push(createReviewPin({
        figure, page: 0, t: r.toStep, source: 'visual-learner', severity: 'error',
        xPct: (r.x || 500) / 10, yPct: (r.y || 500) / 10,
        text: `Repeated fruitless clicks at (${r.x}, ${r.y}) across steps ${r.fromStep}-${r.toStep}`,
      }));
    }
    for (const w of diagnostics.passiveWaitLoops) {
      pins.push(createReviewPin({
        figure, page: 0, t: w.toStep, source: 'visual-learner', severity: 'warn',
        xPct: 50, yPct: 50,
        text: `Passive wait loop with unchanged viewport across steps ${w.fromStep}-${w.toStep}`,
      }));
    }
    fs.writeFileSync(path.join(absOut, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
    fs.writeFileSync(path.join(absOut, 'pins.json'), JSON.stringify(pins, null, 2) + '\n');
    fs.writeFileSync(path.join(absOut, 'report.html'), buildHtmlReport(summary));
    return summary;
  } finally {
    await browser.close();
    server.close();
  }
}
