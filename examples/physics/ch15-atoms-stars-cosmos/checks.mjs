import * as M from './model.js';

let bad = 0;
function check(name, cond, detail = '') {
  if (cond) console.log(`PASS  ${name}`);
  else { bad++; console.log(`FAIL  ${name} ${detail}`); }
}

const peRed = M.photoelectricEmission(650, 2.3);
const peUv = M.photoelectricEmission(300, 2.3);
check('Potassium (phi = 2.3 eV) emits 0 photoelectrons under 650 nm red light and ~1.83 eV electrons under 300 nm UV',
  !peRed.emitted && peRed.kMaxEv === 0 && peUv.emitted && Math.abs(peUv.kMaxEv - (1239.84193 / 300 - 2.3)) < 1e-6);
const fus = M.ppFusionMassDefect();
check('Solar p-p fusion converts ~0.7% of mass into ~26.7 MeV per He-4 nucleus',
  fus.fractionConverted > 0.0068 && fus.fractionConverted < 0.0072 && fus.energyMev > 26.5 && fus.energyMev < 26.9);
const wd06 = M.whiteDwarfRadiusEarthRadii(0.6);
const wd12 = M.whiteDwarfRadiusEarthRadii(1.2);
check('Heavier white dwarf is smaller (R shrinks as mass approaches 1.44 M_sun Chandrasekhar limit)',
  wd12.radiusRe < wd06.radiusRe && M.whiteDwarfRadiusEarthRadii(1.4).nearCollapse);

process.exit(bad ? 1 : 0);
