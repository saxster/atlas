// node tools/check.mjs [subject/chapter …] — the engine's own self-test, every chapter's model invariants (its checks.mjs), then each subject's
// generated-page link checks (equations/check.mjs where a subject has one). Exit 1 on the first failure.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, subjects, chapters } from './chapters.mjs';

const only = process.argv.slice(2);
const run = file => {
  try { execFileSync(process.execPath, [file], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] }); return true; }
  catch (e) { process.stdout.write(e.stdout?.toString() || ''); process.stderr.write(e.stderr?.toString() || ''); return false; }
};
if (!only.length && !run(path.join(ROOT, 'engine', 'selftest.mjs'))) { console.log('FAIL engine/selftest.mjs'); process.exit(1); }
let n = 0;
for (const c of only.length ? only : await chapters()) {
  if (!run(path.join(ROOT, c, 'checks.mjs'))) { console.log(`FAIL ${c}`); process.exit(1); }
  n++;
}
console.log(`${n} chapters: all checks pass`);
if (!only.length) for (const s of await subjects()) {
  const eq = path.join(ROOT, s.id, 'equations', 'check.mjs');
  if (fs.existsSync(eq)) execFileSync(process.execPath, [eq], { cwd: ROOT, stdio: 'inherit' });
}
