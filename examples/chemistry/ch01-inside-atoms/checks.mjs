import assert from 'node:assert/strict';
import { rutherfordScattering, atomIdentity, chlorineIsotopeMix } from './model.js';

const headOn = rutherfordScattering(2, 5.0, 79);
const distant = rutherfordScattering(180, 5.0, 79);
assert(headOn.thetaDeg > 140, 'Small impact parameter near Au nucleus produces back-scattering (>140 deg)');
assert(distant.thetaDeg < 15, 'Large impact parameter passes nearly straight (<15 deg)');

const c14 = atomIdentity(6, 8, 6);
assert.equal(c14.symbol, 'C', '6 protons is always Carbon');
assert.equal(c14.A, 14, 'Mass number A = Z + N = 14');
assert.equal(c14.charge, 0, 'Neutral atom when protons equal electrons');

const oxide = atomIdentity(8, 8, 10);
assert.equal(oxide.symbol, 'O', '8 protons is Oxygen');
assert.equal(oxide.charge, -2, '8 protons and 10 electrons gives -2 charge');
assert.deepEqual(oxide.shells, [2, 8, 0], '10 electrons fill shells [2, 8, 0]');

const cl = chlorineIsotopeMix(75.76);
assert(Math.abs(cl.avgMass - 35.45) < 0.02, 'Natural chlorine isotope mix yields ~35.45 u');
