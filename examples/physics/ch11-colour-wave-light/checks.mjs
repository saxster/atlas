import * as M from './model.js';

let bad = 0;
function check(name, cond, detail = '') {
  if (cond) console.log(`PASS  ${name}`);
  else { bad++; console.log(`FAIL  ${name} ${detail}`); }
}

const pRed = M.prismDispersion(60, 680);
const pVio = M.prismDispersion(60, 410);
check('Violet light (410 nm) has higher refractive index and bends more than red light (680 nm)',
  pVio.n > pRed.n && pVio.devDeg > pRed.devDeg);
const br = M.brewsterAndMalus(1.333, 90);
check('Water Brewster angle is ~53.1 deg and 90-deg vertical Polaroid blocks 100% of glare',
  br.brewsterDeg > 53.0 && br.brewsterDeg < 53.2 && br.transmittedGlareFraction < 1e-12);
const ram = M.ramanShiftSpectrum(435.8, 459);
check('Raman Stokes line shifts to longer wavelength (~444.7 nm) while anti-Stokes shifts shorter',
  ram.stokesNm > ram.laserNm && ram.antiStokesNm < ram.laserNm);

process.exit(bad ? 1 : 0);
