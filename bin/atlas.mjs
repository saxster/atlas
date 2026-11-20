#!/usr/bin/env node
// atlas: start a figure, check its model, and look at it, from any repo that has @saxster/atlas installed.
// Figures are folders relative to the current one (biology/heart). The browser commands need Chrome (CHROME=… if it
// isn't at the usual place); record also needs ffmpeg.
import fs from 'node:fs';
import path from 'node:path';
const USAGE = `atlas new <subject>/<id> [--grammar book|machine|explorer|sandbox|teardown|blueprint]   start a figure from a working example
atlas boot [<grammar|kit|voice|task>] [--list] [--json]    assemble a grammar, kit, or creator voice boot package
atlas check [dir]                                          audit model.js purity and run every checks.mjs under dir (default: here)
atlas gate [<file>] [--transcript <jsonl>]                 verify Model-First & Read-Before-Write gate (CLI or PreToolUse stdin hook)
atlas stills <out-dir> <figure…>                           a still of every page or step, desktop and phone
atlas critic <figure…> [--intersections]                   frames that jump, labels that overlap, framing/occlusion/mesh & SVG clip clashes
atlas visual-learner <figure> [--out <dir>] [--steps <n>] [--policy scripted|ollama]   blind screenshot-only QA walk & HTML report
atlas record <figure> [--size 1920x1080] [--fps 60] [--samples 1] [--shutter 0.5] [--loop] [--silent] [--out videos]   an MP4 with a soundtrack
atlas svg-lint <file…> [--strict-draft] [--compact] [--json]   lint SVG files for XML/ref hygiene and Plotter drafting rules
atlas export-svg <in.svg> [--out <out.svg>] [--theme light|dark|atelier] [--id-prefix <p>] [--bg <hex|theme>] [--embed-font <woff2>]   resolve tokens & sanitize static SVG
atlas svg-render <in.svg> --out <out.png> [--theme light|dark|both] [--width <px>] [--scale <n>] [--background theme|none|<hex>] [--renderer auto|browser|rsvg-convert|resvg|inkscape|magick|qlmanage]   render SVG to PNG`;

const [cmd, ...args] = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i < 0 ? d : args.splice(i, 2)[1]; };
const flag = k => { const i = args.indexOf(k); return i >= 0 && args.splice(i, 1).length > 0; };
const figures = () => args.map(a => a.replace(/\/$/, ''));

const COMMANDS = {
  async new() { const grammar = opt('--grammar', 'book'); await (await import('../cli/new.mjs')).create(args[0], { grammar }); return 0; },
  async boot() {
    const list = flag('--list');
    const json = flag('--json');
    const query = args.join(' ');
    const res = (await import('../cli/boot.mjs')).boot(query, { list, json });
    console.log(json ? JSON.stringify(res, null, 2) : res.markdown);
    return { exitCode: res.exitCode ?? 0 };
  },
  async check() { return (await import('../cli/check.mjs')).check(args[0] || '.'); },
  async gate() {
    const transcriptPath = opt('--transcript', null);
    return (await import('../cli/gate.mjs')).gateCli(args[0] || '', { transcriptPath });
  },
  async stills() { const [out, ...rest] = figures(); if (!rest.length) throw usage(); return (await import('../cli/stills.mjs')).stills(out, rest); },
  async critic() {
    const intersections = flag('--intersections');
    if (!args.length) throw usage();
    const list = figures();
    const j = await (await import('../cli/jumps.mjs')).jumps(list);
    const l = await (await import('../cli/labels.mjs')).labels(list);
    const s = await (await import('../cli/scene.mjs')).scene(list, { intersections });
    const c = await (await import('../cli/clip.mjs')).clip(list);
    return j + l + s + c;
  },
  async 'visual-learner'() {
    const outDir = opt('--out', 'artifacts/visual-learner');
    const steps = Number(opt('--steps', '4'));
    const policy = opt('--policy', 'scripted');
    const model = opt('--model', 'qwen3-vl:4b-instruct');
    const width = Number(opt('--width', '960'));
    const height = Number(opt('--height', '640'));
    const deterministic = flag('--deterministic');
    if (!args[0]) throw usage();
    const target = fs.existsSync(path.resolve(args[0])) ? args[0] : (args[0].startsWith('examples/') ? args[0] : `examples/${args[0]}`);
    await (await import('../cli/visual-learner.mjs')).visualLearner(target, { outDir, steps, policy, model, width, height, deterministic });
    return 0;
  },
  async record() {
    const o = {
      size: opt('--size', '1920x1080'),
      fps: +opt('--fps', 60),
      samples: +opt('--samples', 1),
      shutter: +opt('--shutter', 0.5),
      loop: flag('--loop'),
      out: opt('--out', 'videos'),
      silent: flag('--silent'),
    };
    if (!args[0]) throw usage();
    return (await (await import('../cli/record.mjs')).record(figures()[0], o)) ? 0 : 1;
  },
  async 'svg-lint'() {
    const strictDraft = flag('--strict-draft');
    const compact = flag('--compact');
    const json = flag('--json');
    if (!args.length) throw usage();
    const exitCode = (await import('../cli/svg-lint.mjs')).svgLintCli(args, { strictDraft, compact, json });
    return { exitCode };
  },
  async 'export-svg'() {
    const out = opt('--out', null);
    const theme = opt('--theme', 'light');
    const idPrefix = opt('--id-prefix', '');
    const bg = opt('--bg', null);
    const embedFont = opt('--embed-font', null);
    if (!args[0]) throw usage();
    const exitCode = (await import('../cli/export-svg.mjs')).exportSvgCli(args[0], { out, theme, idPrefix, bg, embedFont });
    return { exitCode };
  },
  async 'svg-render'() {
    const out = opt('--out', null);
    const theme = opt('--theme', 'light');
    const width = opt('--width', null);
    const scale = opt('--scale', '2');
    const background = opt('--background', 'theme');
    const renderer = opt('--renderer', 'auto');
    if (!args[0] || !out) throw usage();
    const exitCode = await (await import('../cli/svg-render.mjs')).svgRenderCli(args[0], { out, theme, width, scale, background, renderer });
    return { exitCode };
  },
};
const usage = () => Object.assign(new Error(USAGE), { usage: true });

if (!COMMANDS[cmd]) { console.log(USAGE); process.exit(cmd && cmd !== 'help' && cmd !== '--help' ? 1 : 0); }
try {
  const out = await COMMANDS[cmd]();
  const code = (out && typeof out === 'object' && typeof out.exitCode === 'number') ? out.exitCode : (out ? 1 : 0);
  process.exit(code);
}
catch (e) {
  if (e.usage) { console.error(e.message); process.exit(2); }
  if (e.code === 'ERR_MODULE_NOT_FOUND' && /puppeteer/.test(e.message)) { console.error('The browser commands need puppeteer-core: npm install -D puppeteer-core'); process.exit(1); }
  throw e;
}
