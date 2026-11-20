// node tools/style.mjs — checks documentation & skill token/byte budgets, verifies referenced repo paths,
// resolves @saxster/atlas/* package subpaths, verifies exported symbols via live import(), and runs the boot self-check.
// Called by tools/check.mjs so CLAUDE.md, docs/API.md, docs/decisions.md, cli/boot.mjs, and the atlas skill stay accurate.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT } from './chapters.mjs';
import { TARGETS, boot } from '../cli/boot.mjs';

const fail = [];

// 1. CLAUDE.md byte budget (< 32 KiB so agent instruction loaders never truncate it)
const claudePath = path.join(ROOT, 'CLAUDE.md');
if (!fs.existsSync(claudePath)) {
  fail.push('CLAUDE.md is missing');
} else {
  const bytes = fs.statSync(claudePath).size;
  if (bytes >= 32768) fail.push(`CLAUDE.md is ${bytes} bytes (limit 32768)`);
}

// 2. docs/decisions.md exists and is non-empty
const decisionsPath = path.join(ROOT, 'docs', 'decisions.md');
if (!fs.existsSync(decisionsPath) || fs.statSync(decisionsPath).size < 200) {
  fail.push('docs/decisions.md is missing or empty');
}

// 3. Verify explicit local file/folder paths referenced in CLAUDE.md, docs/API.md, docs/decisions.md, and docs/voices/*.md
const voiceDir = path.join(ROOT, 'docs', 'voices');
const voiceDocs = fs.existsSync(voiceDir)
  ? fs.readdirSync(voiceDir).filter(f => f.endsWith('.md')).map(f => `docs/voices/${f}`)
  : [];
const DOC_FILES = ['CLAUDE.md', 'docs/API.md', 'docs/decisions.md', 'docs/figma-mcp-workflow.md', 'docs/verification-rubric.md', ...voiceDocs];
const PATH_RE = /`((?:engine|adapters|bin|cli|tools|docs|examples)\/[A-Za-z0-9_./-]+)`/g;
for (const rel of DOC_FILES) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) continue;
  const text = fs.readFileSync(abs, 'utf8');
  for (const m of text.matchAll(PATH_RE)) {
    const token = m[1].replace(/[.,;:]+$/, '');
    if (token.includes('<') || token.includes('>') || token.includes('*') || token.includes('…')) continue;
    const target = path.join(ROOT, token);
    if (!fs.existsSync(target)) {
      fail.push(`${rel} references missing path: ${token}`);
    }
  }
}

// Helper to map @saxster/atlas[/subpath] to local disk path
function resolvePkgSubpath(pkgSpec) {
  if (pkgSpec === '@saxster/atlas') return path.join(ROOT, 'engine', 'index.js');
  const sub = pkgSpec.replace(/^@saxster\/atlas\//, '');
  if (sub.startsWith('adapters/')) return path.join(ROOT, sub);
  return path.join(ROOT, 'engine', sub);
}

const modCache = new Map();
async function loadPkgModule(pkgSpec) {
  if (modCache.has(pkgSpec)) return modCache.get(pkgSpec);
  const abs = resolvePkgSubpath(pkgSpec);
  if (!fs.existsSync(abs)) {
    modCache.set(pkgSpec, null);
    return null;
  }
  const mod = await import(pathToFileURL(abs).href);
  modCache.set(pkgSpec, mod);
  return mod;
}

// 4. Verify @saxster/atlas root and subpath imports across docs, cli/boot.mjs, and SKILL.md
try {
  const rootMod = await loadPkgModule('@saxster/atlas');
  if (!rootMod) fail.push('@saxster/atlas root export (engine/index.js) failed to resolve');
} catch (e) {
  fail.push(`@saxster/atlas root export (engine/index.js) failed to import: ${e.message}`);
}

const skillPath = path.join(os.homedir(), '.agents', 'skills', 'atlas', 'SKILL.md');
const PKG_RE = /`@saxster\/atlas\/([A-Za-z0-9_./-]+\.js)`/g;
const sourcesToScan = [
  ...DOC_FILES.map(rel => ({ label: rel, path: path.join(ROOT, rel) })),
  ...(fs.existsSync(skillPath) ? [{ label: 'SKILL.md', path: skillPath }] : []),
];

for (const src of sourcesToScan) {
  if (!fs.existsSync(src.path)) continue;
  const text = fs.readFileSync(src.path, 'utf8');
  for (const m of text.matchAll(PKG_RE)) {
    const sub = m[1];
    if (sub.includes('<') || sub.includes('>') || sub.includes('*') || sub.includes('…')) continue;
    const pkgSpec = `@saxster/atlas/${sub}`;
    const abs = resolvePkgSubpath(pkgSpec);
    if (!fs.existsSync(abs)) {
      fail.push(`${src.label} references missing package export: ${pkgSpec}`);
    }
  }
}

// 5. Verify every module & exported symbol registered in cli/boot.mjs TARGETS
for (const t of TARGETS) {
  for (const [modSpec, syms] of Object.entries(t.modules || {})) {
    let mod = null;
    try {
      mod = await loadPkgModule(modSpec);
    } catch (e) {
      fail.push(`cli/boot.mjs [${t.slug}] failed importing ${modSpec}: ${e.message}`);
      continue;
    }
    if (!mod) {
      fail.push(`cli/boot.mjs [${t.slug}] references missing module ${modSpec}`);
      continue;
    }
    for (const sym of syms) {
      if (!(sym in mod)) {
        fail.push(`cli/boot.mjs [${t.slug}] symbol "${sym}" is not exported by ${modSpec}`);
      }
    }
  }
  if (t.voiceDoc && !fs.existsSync(path.join(ROOT, t.voiceDoc))) {
    fail.push(`cli/boot.mjs [${t.slug}] missing voiceDoc: ${t.voiceDoc}`);
  }
  if (t.templateDir) {
    const dir = path.join(ROOT, t.templateDir);
    if (!fs.existsSync(dir)) {
      fail.push(`cli/boot.mjs [${t.slug}] missing templateDir: ${t.templateDir}`);
    } else {
      for (const fn of t.templateFiles || []) {
        if (!fs.existsSync(path.join(dir, fn))) {
          fail.push(`cli/boot.mjs [${t.slug}] missing template file: ${t.templateDir}/${fn}`);
        }
      }
    }
  }
}

// 6. Check ~/.agents/skills/atlas/SKILL.md budgets + live symbol attributions when installed
if (fs.existsSync(skillPath)) {
  const raw = fs.readFileSync(skillPath, 'utf8');
  const fm = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!fm) {
    fail.push('SKILL.md is missing YAML frontmatter');
  } else {
    const [, head, body] = fm;
    if (!/^name:\s*atlas\b/m.test(head)) fail.push('SKILL.md frontmatter missing "name: atlas"');
    const descMatch = head.match(/^description:\s*(.+)$/m);
    if (!descMatch) {
      fail.push('SKILL.md frontmatter missing "description"');
    } else if (!/\bUse when\b/i.test(descMatch[1])) {
      fail.push('SKILL.md description must include triggering conditions ("Use when ...")');
    }
    const words = body.trim().split(/\s+/).filter(Boolean).length;
    if (words > 2500) fail.push(`SKILL.md body is ${words} words (limit 2500 words / ~5000 tokens)`);

    // Verify symbol lists attributed to @saxster/atlas/<mod>.js in SKILL.md
    // Matches both: `@saxster/atlas/foo.js` (`a`, `b`) and `@saxster/atlas/foo.js`: `a`, `b`
    // and (`@saxster/atlas/adapters/foo.js`, ... `sym`)
    const ATTR_RE = /`@saxster\/atlas\/([A-Za-z0-9_./-]+\.js)`(?:\s*\(([^)]+)\)|\s*:\s*([^.;\n)]+)|,\s*([^)]+)\))/g;
    for (const m of body.matchAll(ATTR_RE)) {
      const modSpec = `@saxster/atlas/${m[1]}`;
      const symText = m[2] || m[3] || m[4] || '';
      const mod = await loadPkgModule(modSpec);
      if (!mod) continue;
      for (const sm of symText.matchAll(/`([A-Za-z_$][\w$]*)`/g)) {
        const ident = sm[1];
        if (!(ident in mod)) {
          fail.push(`SKILL.md attributes "${ident}" to ${modSpec}, but ${modSpec} does not export "${ident}"`);
        }
      }
    }
  }
}

// 7. Run programmatic boot() self-check (happy path, trigger match, coincidental-overlap abstention, and code-3 no-match)
const bBlueprint = boot('blueprint');
if (!bBlueprint.matched || bBlueprint.exitCode !== 0 || !bBlueprint.templates?.['model.js']) {
  fail.push('boot("blueprint") self-check failed to assemble working skeleton');
}
const bTrigger = boot('architectural blueprint with section cut');
if (!bTrigger.matched || bTrigger.slug !== 'blueprint') {
  fail.push('boot("architectural blueprint with section cut") failed to route to blueprint grammar');
}
const bDraftKit = boot('draft_kit');
if (!bDraftKit.matched || bDraftKit.slug !== 'draft_kit') {
  fail.push('boot("draft_kit") self-check failed to assemble drafting kit package');
}
const bPlotter = boot('plotter-draft');
if (!bPlotter.matched || bPlotter.slug !== 'plotter-draft') {
  fail.push('boot("plotter-draft") self-check failed to load plotter-draft voice');
}
const bAbstain = boot('create a lesson tracker doc for the course');
if (bAbstain.matched || bAbstain.exitCode !== 0 || !Array.isArray(bAbstain.candidates) || !bAbstain.candidates.length) {
  fail.push('boot("create a lesson tracker doc for the course") must abstain (matched: false, exitCode: 0) with scored candidates');
}
const bNoMatch = boot('underwater basketweaving');
if (bNoMatch.matched || bNoMatch.exitCode !== 3) {
  fail.push(`boot("underwater basketweaving") must fail with exitCode 3 (got ${bNoMatch.exitCode})`);
}

if (fail.length) {
  for (const f of fail) console.error('FAIL style:', f);
  process.exit(1);
}
console.log('style, live symbol exports & boot self-check: clean');
