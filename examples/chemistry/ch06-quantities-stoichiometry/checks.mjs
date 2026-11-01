import assert from 'node:assert/strict';
import { moleSampleBridge, haberLimitingStoichiometry, reactionYieldAccount } from './model.js';

const w = moleSampleBridge(2.0, 18.015);
assert(Math.abs(w.massGrams - 36.03) < 1e-6, '2.0 mol of H2O has mass 36.03 g');

const limH2 = haberLimitingStoichiometry(2.0, 3.0);
assert.equal(limH2.nh3Formed, 2.0, '2 N2 + 3 H2 forms 2 NH3 because 3 H2 limits extent to xi = 1');
assert.equal(limH2.n2Left, 1.0, '1 mol N2 remains unreacted in excess');
assert.equal(limH2.h2Left, 0.0, 'Limiting H2 is completely consumed');

const y = reactionYieldAccount(50.0, 80);
assert.equal(y.actualGrams, 40.0, '80% yield of 50.0 g theoretical gives 40.0 g actual');
