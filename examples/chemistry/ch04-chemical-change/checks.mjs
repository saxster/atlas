import assert from 'node:assert/strict';
import { lavoisierRetort, waterSynthesisAtomLedger, coeffVsSubscript } from './model.js';

const before = lavoisierRetort(0, 118.7, 32.0);
const after = lavoisierRetort(100, 118.7, 32.0);
assert(Math.abs(before.totalSealedMass - after.totalSealedMass) < 1e-9, 'Total sealed mass is strictly conserved during calcination');
assert(after.solidMass > before.solidMass, 'Solid calx gains the exact mass of oxygen removed from the gas phase');

const bal = waterSynthesisAtomLedger(2, 1, 2);
const unbal = waterSynthesisAtomLedger(1, 1, 1);
assert.equal(bal.balanced, true, '2 H2 + 1 O2 -> 2 H2O conserves both H (4) and O (2)');
assert.equal(unbal.balanced, false, '1 H2 + 1 O2 -> 1 H2O leaves an O atom unaccounted for');

const water2 = coeffVsSubscript(2, 1);
const peroxide1 = coeffVsSubscript(1, 2);
assert.equal(water2.totalO, 2, '2 H2O contains 2 O atoms across two water molecules');
assert.equal(peroxide1.totalO, 2, '1 H2O2 contains 2 O atoms bonded inside a different substance');
assert.notEqual(water2.formula, peroxide1.formula, 'Changing a subscript changes the chemical substance');
