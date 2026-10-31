#!/usr/bin/env node
// atlas: start a figure, check its model, and look at it, from any repo that has @saxster/atlas installed.
// Figures are folders relative to the current one (biology/heart). The browser commands need Chrome (CHROME=… if it
// isn't at the usual place); record also needs ffmpeg.
const USAGE = `atlas new <subject>/<id> [--grammar book|machine|explorer|sandbox]   start a figure from a working example
atlas check [dir]                                          run every checks.mjs under dir (default: here)
atlas stills <out-dir> <figure…>                           a still of every page or step, desktop and phone
atlas critic <figure…>                                     frames that jump, labels that overlap or hide
atlas record <figure> [--size 1920x1080] [--fps 60] [--silent] [--out videos]   an MP4 with a soundtrack`;

const [cmd, ...args] = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i < 0 ? d : args.splice(i, 2)[1]; };
const flag = k => { const i = args.indexOf(k); return i >= 0 && args.splice(i, 1).length > 0; };
const figures = () => args.map(a => a.replace(/\/$/, ''));

const COMMANDS = {
  async new() { const grammar = opt('--grammar', 'book'); await (await import('../cli/new.mjs')).create(args[0], { grammar }); return 0; },
  async check() { return (await import('../cli/check.mjs')).check(args[0] || '.'); },
  async stills() { const [out, ...rest] = figures(); if (!rest.length) throw usage(); return (await import('../cli/stills.mjs')).stills(out, rest); },
  async critic() {
    if (!args.length) throw usage();
    const j = await (await import('../cli/jumps.mjs')).jumps(figures());
    const l = await (await import('../cli/labels.mjs')).labels(figures());
    return j + l;
  },
  async record() {
    const o = { size: opt('--size', '1920x1080'), fps: +opt('--fps', 60), out: opt('--out', 'videos'), silent: flag('--silent') };
    if (!args[0]) throw usage();
    return (await (await import('../cli/record.mjs')).record(figures()[0], o)) ? 0 : 1;
  },
};
const usage = () => Object.assign(new Error(USAGE), { usage: true });

if (!COMMANDS[cmd]) { console.log(USAGE); process.exit(cmd && cmd !== 'help' && cmd !== '--help' ? 1 : 0); }
try { process.exit(await COMMANDS[cmd]() ? 1 : 0); }
catch (e) {
  if (e.usage) { console.error(e.message); process.exit(2); }
  if (e.code === 'ERR_MODULE_NOT_FOUND' && /puppeteer/.test(e.message)) { console.error('The browser commands need puppeteer-core: npm install -D puppeteer-core'); process.exit(1); }
  throw e;
}
