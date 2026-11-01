import * as M from './model.js';

let bad = 0;
function check(name, cond, detail = '') {
  if (cond) console.log(`PASS  ${name}`);
  else { bad++; console.log(`FAIL  ${name} ${detail}`); }
}

const dHz2 = M.horizonDistanceKm(2.0);
check('Eye at 2 m height sees horizon at ~5.05 km', dHz2 > 5.0 && dHz2 < 5.1);
const hidden15 = M.hiddenHullHeightM(15.05, 2.0);
check('Ship 10 km beyond horizon hides ~7.85 m of hull', hidden15 > 7.7 && hidden15 < 8.0);
check('Ship inside horizon hides 0 m of hull', M.hiddenHullHeightM(3.0, 2.0) === 0);
const pErr = M.parallaxErrorMm(4.0, 45);
check('Parallax at 45 deg across 4 mm thick ruler is 4 mm', Math.abs(pErr - 4.0) < 1e-9);
const gNarrow = M.rainGaugeCollection(30, 25);
const gWide = M.rainGaugeCollection(30, 50);
check('Wide cylinder collects 4x volume at identical 30 mm rain depth', Math.abs(gWide.volumeMl / gNarrow.volumeMl - 4) < 1e-9 && gNarrow.depthMm === gWide.depthMm);

process.exit(bad ? 1 : 0);
