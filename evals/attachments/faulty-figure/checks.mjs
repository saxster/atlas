// Intentionally failing checks.mjs fixture for cold-run skill eval 05.
import { faultyBeamTip } from './model.js';

if (faultyBeamTip(2) !== 999) {
  console.log('FAIL  faultyBeamTip: expected 999, got 2 (planted failure for eval 05)');
  process.exit(1);
}
