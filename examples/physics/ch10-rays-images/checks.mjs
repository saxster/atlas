import * as M from './model.js';

let bad = 0;
function check(name, cond, detail = '') {
  if (cond) console.log(`PASS  ${name}`);
  else { bad++; console.log(`FAIL  ${name} ${detail}`); }
}

const pSmall = M.pinholeOptics(100, 400, 200, 1.0);
const pWide = M.pinholeOptics(100, 400, 200, 3.0);
check('Pinhole magnification M = d_i / d_o = 0.5 and 3x wider hole gives 9x brightness and 3x blur circle',
  Math.abs(pSmall.mag - 0.5) < 1e-9 &&
  Math.abs(pWide.relativeBrightness / pSmall.relativeBrightness - 9) < 1e-9 &&
  Math.abs(pWide.blurCircleMm / pSmall.blurCircleMm - 3) < 1e-9);
const rom = M.romerEclipseDelay(180);
check('Romer light-travel delay across Earth orbital diameter (2 AU) is ~16.6 minutes (~998 s)',
  Math.abs(rom.extraDistanceAu - 2.0) < 1e-9 && rom.delayMin > 16.5 && rom.delayMin < 16.7);

process.exit(bad ? 1 : 0);
