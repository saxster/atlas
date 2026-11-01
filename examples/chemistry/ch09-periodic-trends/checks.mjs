import assert from 'node:assert/strict';
import { period2TrendState, hydrogenLineSpectrum } from './model.js';

const li = period2TrendState(3);
const ne = period2TrendState(10);
assert(ne.zEff > li.zEff, 'Effective nuclear charge Zeff increases across Period 2 from Li to Ne');
assert(ne.radiusPm < li.radiusPm, 'Atomic radius contracts across Period 2 as Zeff pulls the n=2 shell inward');
assert(ne.ie1Kj > li.ie1Kj, 'First ionization energy generally increases across Period 2');
assert(li.ie2Kj > 10 * li.ie1Kj, 'Removing a core 1s electron from Li+ (IE2) requires a huge energy jump');

const hAlpha = hydrogenLineSpectrum(3, 2);
assert(Math.abs(hAlpha.wavelengthNm - 656.3) < 2.0, 'n = 3 -> 2 Balmer H-alpha transition emits ~656 nm red photon');
