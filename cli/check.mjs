// check(dir): runs every checks.mjs under dir (node_modules and dot-folders skipped), each in its own node process.
// Prints a line per figure, and the failing rows of any that fail; returns how many failed.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const find = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e =>
  e.name === 'node_modules' || e.name.startsWith('.') ? [] : e.isDirectory() ? find(path.join(d, e.name)) : e.name === 'checks.mjs' ? [path.join(d, e.name)] : []);

export function check(dir = '.') {
  const files = find(path.resolve(dir)).sort();
  if (!files.length) { console.log(`no checks.mjs under ${dir}`); return 1; }
  let bad = 0;
  for (const f of files) {
    const r = spawnSync(process.execPath, [f], { encoding: 'utf8' });
    const rows = (r.stdout || '').split('\n'), pass = rows.filter(l => l.startsWith('PASS')).length;
    const name = path.relative(process.cwd(), path.dirname(f)) || '.';
    if (r.status === 0) { console.log(`${name.padEnd(32)} ${pass} checks pass`); continue; }
    bad++;
    console.log(`${name.padEnd(32)} FAILED`);
    for (const l of rows.filter(l => l.startsWith('FAIL'))) console.log('  ' + l);
    if (r.stderr) console.log('  ' + r.stderr.trim().split('\n').slice(0, 6).join('\n  '));
  }
  return bad;
}
