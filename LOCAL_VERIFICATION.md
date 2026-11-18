# Local verification

Owner-approved cadence, 18 November 2026. This file supersedes older requirements
to run broad suites on every ordinary commit/push. It does not remove product
invariants, coverage floors, required release checks or deployment approvals.

## Ordinary changes

node examples/physics/<chapter>/checks.mjs

Commands containing `<...>` are templates: supply the actual affected test or base.
Check the complete task diff, not just the last commit. Include relevant lint/types,
security/contracts and direct consumers. Explain selection in the task receipt.
An empty or unknown executable-test selection must widen or block, never pass silently.
For workflow/docs-only edits, use syntax/policy checks and focused workflow regressions.

## Settled release batch

npm run check; then npm run test:browser with the documented local server

Run the existing mandatory gate once after the authorised batch settles. Keep its
assertions and coverage requirements intact. Native/UI changes still need the relevant
rendered journey. Exhaustive matrices, live paid checks and repeated broad campaigns
need separate authorisation. Do not treat a focused pass as release qualification.

## Evidence and resources

Record source revision or dirty content fingerprint, task base, selected commands,
toolchain/dependency/environment identity, exit codes, elapsed time and log paths.
Reuse passing evidence only while these tested inputs remain valid; rerun failed or
invalidated checks. Use existing receipt/release guards where available. Otherwise
record and check release evidence explicitly; this document is not a machine guard.
Prefer four workers and one heavy gate at a time after checking competing work.
Keep caches where safe; do not reinstall or rebuild unchanged dependencies for each check.

## Local-only execution

Do not add, enable, dispatch or rely on hosted CI. Workflow definitions, where present,
are retained as local command references with triggers disabled. Server-side behaviour
changes only after a separately authorised push; no remote setting was changed here.
Source publication and deployment remain separate explicit authorisations.

Delete tests only with evidence of equivalent retained coverage or an obsolete contract.
No test-line quota, weakened assertion, lowered coverage floor or retry-for-green.
New adaptive selection must be deterministic, explainable and conservative on unknown
dependencies. Bounded shadow calibration requires approval, not full reruns per edit.

## Existing command sources

Read CLAUDE.md.

- `.github/workflows/check.yml`
