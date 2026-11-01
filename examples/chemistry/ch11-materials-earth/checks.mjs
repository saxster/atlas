import assert from 'node:assert/strict';
import { lithiumIonCellState, oceanCarbonateBuffer } from './model.js';

const charged = lithiumIonCellState(100, 8);
const discharged = lithiumIonCellState(0, 8);
assert.equal(charged.atGraphite + charged.atOxide, 8, 'Total lithium inventory is strictly conserved during charge/discharge');
assert(charged.cellVoltageV > discharged.cellVoltageV, 'Charged Li-ion cell has higher potential than discharged cell');

const preInd = oceanCarbonateBuffer(280);
const elevated = oceanCarbonateBuffer(560);
assert(elevated.pH < preInd.pH, 'Rising atmospheric CO2 lowers ocean surface pH (ocean acidification)');
assert(elevated.carbonatePct < preInd.carbonatePct, 'Added H2CO3 consumes CO3^2- to form 2 HCO3-, reducing carbonate ion availability');
