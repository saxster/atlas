import assert from 'node:assert/strict';
import { znCuTransferLedger, electrochemicalCellState, faradayElectrolysis } from './model.js';

const led = znCuTransferLedger(3, 6, 6);
assert.equal(led.electronsMoved, 6, '3 Zn -> Zn2+ events transfer 6 electrons to 3 Cu2+');
assert.equal(led.znStrip + led.znIons, 6, 'Total Zn atoms/ions conserved');
assert.equal(led.cuIons + led.cuPlated, 6, 'Total Cu atoms/ions conserved');

const galv = electrochemicalCellState(0.0);
const elec = electrochemicalCellState(1.60);
assert(Math.abs(galv.eCellStd - 1.10) < 1e-6, 'Standard Zn/Cu Daniell cell voltage is +1.10 V');
assert(galv.netDrivingV > 0 && elec.netDrivingV < 0, 'External voltage > 1.10 V reverses cell into electrolytic mode');

const far = faradayElectrolysis(2.0, 15, 2, 63.55);
assert(far.molesElectrons > 0.018 && far.massGrams > 0.5, 'Faraday law computes moles of electrons and plated Cu mass');
