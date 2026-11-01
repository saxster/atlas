import assert from 'node:assert/strict';
import { alkaneHomologueState, degreeOfUnsaturation, isomerComparisonC2H6O } from './model.js';

const c1 = alkaneHomologueState(1);
const c6 = alkaneHomologueState(6);
assert.equal(c1.hCount, 4, 'Methane has 2(1)+2 = 4 H atoms');
assert.equal(c6.hCount, 14, 'Hexane has 2(6)+2 = 14 H atoms');
assert(c6.bpC > c1.bpC, 'Alkane boiling point rises with chain length due to stronger London dispersion attractions');

const etheneIhd = degreeOfUnsaturation(2, 4);
const ethyneIhd = degreeOfUnsaturation(2, 2);
assert.equal(etheneIhd.ihd, 1, 'C2H4 has 1 degree of unsaturation (1 C=C pi bond)');
assert.equal(ethyneIhd.ihd, 2, 'C2H2 has 2 degrees of unsaturation (triple bond)');

const iso = isomerComparisonC2H6O();
assert(iso.deltaBpC > 100, 'Intermolecular O-H...O hydrogen bonding raises ethanol boiling point >100 C above dimethyl ether');
