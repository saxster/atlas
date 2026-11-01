import assert from 'node:assert/strict';
import { morseBondPotential, naclBornHaber, bondPolarityState } from './model.js';

const eq = morseBondPotential(74);
const compressed = morseBondPotential(45);
const separated = morseBondPotential(230);
assert(Math.abs(eq.energyKj - (-436)) < 1e-6, 'H2 bond energy minimum is -436 kJ/mol at 74 pm');
assert(compressed.energyKj > eq.energyKj, 'Compressing below 74 pm raises potential energy sharply');
assert(separated.energyKj > -45, 'Pulling atoms far apart approaches 0 kJ/mol');

const bh = naclBornHaber(3);
assert.equal(bh.levelKj, -640, 'Full NaCl Born-Haber cycle closes at -640 kJ/mol');
assert.equal(bh.coordination, 6, 'Rock-salt NaCl has 6:6 octahedral coordination');

const h2oDipole = bondPolarityState(1.24, 'bent');
const co2Dipole = bondPolarityState(0.89, 'linear-sym');
assert(h2oDipole.netDipoleDebye > 1.5, 'Bent H2O has a non-zero net molecular dipole');
assert.equal(co2Dipole.netDipoleDebye, 0, 'Symmetric linear CO2 has zero net dipole despite polar bonds');
