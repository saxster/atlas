// cli/gate.mjs — Model-First & Read-Before-Write verification gate for @saxster/atlas.
// Can be called directly (`npx atlas gate <file-path> [--transcript <jsonl>]`) or wired as a
// Claude Code PreToolUse hook reading JSON from stdin. Fails open on unrelated files or hook parse errors.
import fs from 'node:fs';
import path from 'node:path';
import { auditFigureDir } from './check.mjs';

const GATED_SCENE_FILES = new Set(['world.js', 'figure.js', 'chapter.js', 'pages.js', 'practice.js']);
const GATED_WRITE_TOOLS = new Set(['Write', 'Edit', 'MultiEdit', 'NotebookEdit', 'apply_patch', 'write_file', 'edit_file']);

export function transcriptSatisfied(transcriptPath) {
  if (!transcriptPath || !fs.existsSync(transcriptPath)) return true;
  try {
    const raw = fs.readFileSync(transcriptPath, 'utf8');
    return (
      raw.includes('SKILL.md') ||
      raw.includes('API.md') ||
      raw.includes('CLAUDE.md') ||
      raw.includes('examples/minimal/') ||
      raw.includes('atlas boot') ||
      raw.includes('atlas.mjs boot') ||
      raw.includes('atlas new') ||
      raw.includes('atlas.mjs new')
    );
  } catch {
    return true;
  }
}

export function evaluateGate(targetFile, { transcriptPath = null } = {}) {
  if (process.env.ATLAS_GATE_DISABLE) {
    return { allowed: true, gate: null, reason: null };
  }
  if (!targetFile || typeof targetFile !== 'string') {
    return { allowed: true, gate: null, reason: null };
  }
  const absTarget = path.resolve(targetFile);
  const base = path.basename(absTarget);
  if (!GATED_SCENE_FILES.has(base)) {
    return { allowed: true, gate: null, reason: null };
  }

  const figDir = path.dirname(absTarget);
  const relDir = path.relative(process.cwd(), figDir) || '.';
  const audit = auditFigureDir(figDir, { runChecks: true });
  if (!audit.ok) {
    const reason = [
      `MODEL-FIRST GATE: Cannot write ${base} in ${relDir}/ until ${relDir}/model.js (pure, no DOM/Three.js) and ${relDir}/checks.mjs exist and pass 'npx atlas check ${relDir}'.`,
      ...audit.errors.map(e => `  - ${e}`),
    ].join('\n');
    return {
      allowed: false,
      gate: 'model-first',
      reason,
      errors: audit.errors,
    };
  }

  if (base === 'world.js' && !fs.existsSync(absTarget) && transcriptPath && !transcriptSatisfied(transcriptPath)) {
    const reason = [
      `READ-BEFORE-WRITE GATE: Creating a new ${relDir}/world.js without reading the Atlas protocol in this session.`,
      `Run 'npx atlas boot <grammar>' (or read SKILL.md / docs/API.md / examples/minimal/<grammar>/) first, then retry the write.`,
    ].join('\n');
    return {
      allowed: false,
      gate: 'read-before-write',
      reason,
      errors: [reason],
    };
  }

  return {
    allowed: true,
    gate: null,
    reason: null,
    pass: audit.pass,
  };
}

export async function gateCli(targetArg, { transcriptPath = null } = {}) {
  if (targetArg) {
    const res = evaluateGate(targetArg, { transcriptPath });
    if (res.allowed) {
      console.log(`PASS gate: ${targetArg} (${res.pass ?? 0} model checks pass)`);
      return { exitCode: 0, ...res };
    }
    console.error(res.reason);
    return { exitCode: 1, ...res };
  }

  if (process.stdin.isTTY) {
    return { exitCode: 0, allowed: true };
  }

  let raw = '';
  try {
    raw = fs.readFileSync(0, 'utf8');
  } catch {
    return { exitCode: 0, allowed: true };
  }
  if (!raw.trim()) return { exitCode: 0, allowed: true };

  try {
    const data = JSON.parse(raw);
    if (data.hook_event_name && data.hook_event_name !== 'PreToolUse') {
      return { exitCode: 0, allowed: true };
    }
    if (data.tool_name && !GATED_WRITE_TOOLS.has(data.tool_name)) {
      return { exitCode: 0, allowed: true };
    }
    const inp = data.tool_input || {};
    const fp = inp.file_path || inp.notebook_path || inp.path || inp.Path || '';
    if (!fp) return { exitCode: 0, allowed: true };

    const res = evaluateGate(fp, { transcriptPath: data.transcript_path || transcriptPath });
    if (!res.allowed) {
      console.log(JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'deny',
          permissionDecisionReason: res.reason,
        },
      }));
    }
    return { exitCode: 0, ...res };
  } catch {
    return { exitCode: 0, allowed: true };
  }
}
