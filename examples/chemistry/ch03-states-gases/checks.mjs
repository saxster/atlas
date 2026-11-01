import assert from 'node:assert/strict';
import { waterStateAtHeat, idealGasPiston, solutionMolarity } from './model.js';

const melt = waterStateAtHeat(200);
const boil = waterStateAtHeat(1500);
assert.equal(melt.tempC, 0, 'During melting plateau temperature remains constant at 0 C');
assert.equal(boil.tempC, 100, 'During boiling plateau temperature remains constant at 100 C');

const g1 = idealGasPiston(2.0, 300, 0.1);
const g2 = idealGasPiston(1.0, 300, 0.1);
assert(Math.abs(g2.pressureAtm - 2 * g1.pressureAtm) < 1e-6, 'Halving gas volume at constant T doubles pressure (Boyle)');

const sol = solutionMolarity(0.5, 0.25);
assert.equal(sol.molarity, 2.0, '0.5 mol in 0.25 L equals 2.0 M');
