import * as M from './model.js';

let bad = 0;
function check(name, cond, detail = '') {
  if (cond) console.log(`PASS  ${name}`);
  else { bad++; console.log(`FAIL  ${name} ${detail}`); }
}

for (let k = 1; k <= 4; k++) {
  const st = M.photosynthesisStoichiometry(k);
  check(`Stoichiometric mass balance k=${k}: 264k + 108k === 180k + 192k`, st.massInG === st.massOutG && st.massInG === 372 * k);
}
const bLight = M.blackmanSurface(25, 80, 25);
const bCo2 = M.blackmanSurface(80, 30, 25);
const bHot = M.blackmanSurface(80, 80, 45);
check('Blackman law of limiting factors identifies the exact minimum ceiling', bLight.gross === 25 && bLight.limiting === 'Light' && bCo2.gross === 30 && bCo2.limiting === 'CO₂' && bHot.limiting === 'Temperature');
const sapDry = M.vascularSapAccount(20, 80);
const sapHumid = M.vascularSapAccount(90, 80);
check('Lower ambient humidity increases VPD and xylem transpiration pull', sapDry.xylemVelocityMmPerMin > sapHumid.xylemVelocityMmPerMin * 4);
const rub = M.rubiscoKineticsAccount(8, 3.3, 0.25);
check('RuBisCO L8S8 holoenzyme (BNID 100022, ~3.3 s^-1/site) fixes ~19.8 CO2/s after 25% photorespiration', Math.abs(rub.carboxylationPerHoloenzymeSec - 19.8) < 1e-9);
const realBm = M.blackmanSurface(100, 10, 25, false);
const buggyBm = M.blackmanSurface(100, 10, 25, true);
check('Buggy-world counterfactual replaces Blackman min bottleneck with additive average', realBm.gross === 10 && buggyBm.gross > 60);

process.exit(bad ? 1 : 0);
