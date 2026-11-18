// check(dir): audits every figure directory under dir for Model-First structural purity (auditFigureDir)
// and runs its checks.mjs in a separate node process. Prints a line per figure and returns how many failed.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const FIGURE_MARKERS = new Set(['checks.mjs', 'model.js', 'world.js', 'figure.js', 'chapter.js', 'pages.js']);
const SKIP_DIRS = new Set(['node_modules', 'engine', 'adapters', 'bin', 'cli', 'tools', 'docs', 'concepts', 'equations', 'img', 'videos', 'golden', 'shots']);

const FORBIDDEN_MODEL_IMPORTS = /(?:from|import)\s*\(?['"](?:three(?:\/[^'"]*)?|(?:@saxster\/atlas\/|\.{1,2}\/)(?:prims|parts|stage|render|book|machine|explorer|sandbox|cad_kit|mount|iso_kit|diegetic|comic|index)\.js)['"]/m;
const FORBIDDEN_MODEL_DOM = /\b(?:document|window)\s*\./m;

function stripComments(src) {
  return String(src || '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '');
}

export function auditFigureDir(figDir, { runChecks = true } = {}) {
  const dir = path.resolve(figDir);
  const errors = [];
  const modelPath = path.join(dir, 'model.js');
  const checksPath = path.join(dir, 'checks.mjs');

  if (!fs.existsSync(modelPath)) {
    errors.push('missing model.js (Model-first rule: write model.js before scene/grammar files)');
  } else {
    const cleanModel = stripComments(fs.readFileSync(modelPath, 'utf8'));
    const badImp = cleanModel.match(FORBIDDEN_MODEL_IMPORTS);
    if (badImp) {
      errors.push(`model.js must be pure (no Three.js or scene/grammar imports): found "${badImp[0].trim()}"`);
    }
    const badDom = cleanModel.match(FORBIDDEN_MODEL_DOM);
    if (badDom) {
      errors.push(`model.js must not access DOM globals: found "${badDom[0].trim()}"`);
    }
  }

  if (!fs.existsSync(checksPath)) {
    errors.push('missing checks.mjs (Model-first rule: prove model.js in checks.mjs before drawing)');
  } else {
    const cleanChecks = stripComments(fs.readFileSync(checksPath, 'utf8'));
    if (!/model\.js['"]/.test(cleanChecks)) {
      errors.push('checks.mjs must import ./model.js to verify the figure model');
    }
  }

  let pass = 0;
  let stdout = '';
  let stderr = '';
  if (!errors.length && runChecks) {
    const r = spawnSync(process.execPath, [checksPath], { encoding: 'utf8' });
    stdout = r.stdout || '';
    stderr = r.stderr || '';
    const rows = stdout.split('\n');
    pass = rows.filter(l => l.startsWith('PASS')).length;
    if (r.status !== 0) {
      const fails = rows.filter(l => l.startsWith('FAIL'));
      errors.push(...(fails.length ? fails : ['checks.mjs exited with non-zero status']));
    } else if (pass < 1) {
      errors.push('checks.mjs exited 0 but printed 0 PASS assertions');
    }
  }

  return {
    ok: errors.length === 0,
    pass,
    errors,
    stdout,
    stderr,
  };
}

function findFigureDirs(d) {
  const entries = fs.readdirSync(d, { withFileTypes: true });
  const hasMarker = entries.some(e => e.isFile() && FIGURE_MARKERS.has(e.name));
  const subDirs = entries
    .filter(e => e.isDirectory() && !e.name.startsWith('.') && !SKIP_DIRS.has(e.name))
    .flatMap(e => findFigureDirs(path.join(d, e.name)));
  return hasMarker ? [d, ...subDirs] : subDirs;
}

export function check(dir = '.') {
  const figDirs = findFigureDirs(path.resolve(dir)).sort();
  if (!figDirs.length) { console.log(`no checks.mjs under ${dir}`); return 1; }
  let bad = 0;
  for (const d of figDirs) {
    const res = auditFigureDir(d, { runChecks: true });
    const name = path.relative(process.cwd(), d) || '.';
    if (res.ok) {
      console.log(`${name.padEnd(32)} ${res.pass} checks pass`);
      continue;
    }
    bad++;
    console.log(`${name.padEnd(32)} FAILED`);
    for (const err of res.errors) console.log('  ' + err);
    if (res.stderr) console.log('  ' + res.stderr.trim().split('\n').slice(0, 6).join('\n  '));
  }
  return bad;
}
