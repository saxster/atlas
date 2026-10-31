// node tools/style.mjs — checks documentation & skill token/byte budgets and verifies referenced repo paths.
// Called by tools/check.mjs so CLAUDE.md, docs/API.md, docs/decisions.md, and the atlas skill stay accurate and within agent context limits.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ROOT } from './chapters.mjs';

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

// 3. Verify explicit local file/folder paths referenced in CLAUDE.md, docs/API.md, and docs/decisions.md
const DOC_FILES = ['CLAUDE.md', 'docs/API.md', 'docs/decisions.md'];
const PATH_RE = /`((?:engine|adapters|bin|cli|tools|docs|examples)\/[A-Za-z0-9_./-]+)`/g;
for (const rel of DOC_FILES) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) continue;
  const text = fs.readFileSync(abs, 'utf8');
  for (const m of text.matchAll(PATH_RE)) {
    const token = m[1].replace(/[.,;:]+$/, '');
    // Skip placeholder patterns like examples/<subject> or engine/<file>.js
    if (token.includes('<') || token.includes('>') || token.includes('*') || token.includes('…')) continue;
    const target = path.join(ROOT, token);
    if (!fs.existsSync(target)) {
      fail.push(`${rel} references missing path: ${token}`);
    }
  }
}

// 4. Check ~/.agents/skills/atlas/SKILL.md when installed on this machine
const skillPath = path.join(os.homedir(), '.agents', 'skills', 'atlas', 'SKILL.md');
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
  }
}

if (fail.length) {
  for (const f of fail) console.error('FAIL style:', f);
  process.exit(1);
}
console.log('style & doc budgets: clean');
