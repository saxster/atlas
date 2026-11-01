import * as M from './model.js';

let bad = 0;
function check(name, cond, detail = '') {
  if (cond) console.log(`PASS  ${name}`);
  else { bad++; console.log(`FAIL  ${name} ${detail}`); }
}

const jun = M.solarNoonAltitude(23.44, 23.44, 90);
const dec = M.solarNoonAltitude(23.44, 23.44, 270);
check('On Tropic of Cancer (23.44 N), June solstice sun is directly overhead (90 deg) vs ~43.1 deg in December',
  Math.abs(jun.noonAltDeg - 90) < 1e-6 && Math.abs(jun.insolationFactor - 1.0) < 1e-6 && dec.noonAltDeg < 44);
const ecNode = M.lunarEclipseAlignment(0, 5.14, 60);
const ecQuadrature = M.lunarEclipseAlignment(90, 5.14, 60);
check('5.14 deg lunar tilt causes Moon to miss Earth shadow by ~5.37 R_Earth away from line of nodes',
  ecNode.eclipseOccurs && !ecQuadrature.eclipseOccurs && Math.abs(ecQuadrature.verticalMissEarthRadii) > 5.0);

process.exit(bad ? 1 : 0);
