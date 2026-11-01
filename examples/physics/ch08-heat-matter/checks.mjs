import * as M from './model.js';

let bad = 0;
function check(name, cond, detail = '') {
  if (cond) console.log(`PASS  ${name}`);
  else { bad++; console.log(`FAIL  ${name} ${detail}`); }
}

const j = M.jouleCalorimeterRise(12, 2.0, 20, 1.5, 9.8);
check('Joule 2x12 kg weights falling 2m x 20 times do 9408 J work and warm 1.5 kg water by ~1.50 K',
  Math.abs(j.workJoules - 9408) < 1e-9 && j.deltaTK > 1.49 && j.deltaTK < 1.51);
const mat = M.matkaEvaporativeCooling(32, 0.015);
check('Evaporating just 1.5% of water in a porous matka cools the remaining water by ~8.2 C',
  mat.deltaTC > 8.0 && mat.deltaTC < 8.4 && mat.finalTempC < 24);
const pMelt = M.waterPhaseState(200);
const pBoil = M.waterPhaseState(1500);
check('Water phase curve holds flat at 0 C during melting and 100 C during boiling',
  pMelt.tempC === 0 && pBoil.tempC === 100);

process.exit(bad ? 1 : 0);
