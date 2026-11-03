import assert from 'node:assert/strict';
import { brownianState, filtrationState, scaleBridge } from './model.js';

const bCold = brownianState(275, 500);
const bHot = brownianState(350, 500);
assert(bHot.D > bCold.D, 'Stokes-Einstein diffusivity increases with temperature');
assert(bHot.rmsUm > bCold.rmsUm, 'RMS Brownian displacement increases with temperature');
assert(bHot.moleculesAcrossGrain > 3000, '1 um resin grain spans thousands of H2O diameters');
assert.equal(brownianState(100, 500).tempK, 250, 'Temperature clamps at lower bound');

const filt = filtrationState(200);
assert.equal(filt.sandRetained, true, 'Suspended sand grain is retained by filter paper');
assert.equal(filt.ionPasses, true, 'Hydrated ions pass through filter paper pores');
assert(filt.selectivityRatio > 1000, 'Suspended grains are orders of magnitude larger than hydrated ions');

const sc = scaleBridge(-10);
assert(Math.abs(sc.nanometers - 0.1) < 1e-9, '10^-10 m equals 0.1 nm');
assert(Math.abs(sc.picometers - 100) < 1e-6, '10^-10 m equals 100 pm');

