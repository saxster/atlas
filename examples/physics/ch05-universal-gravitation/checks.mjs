import * as M from './model.js';

let bad = 0;
function check(name, cond, detail = '') {
  if (cond) console.log(`PASS  ${name}`);
  else { bad++; console.log(`FAIL  ${name} ${detail}`); }
}

const mn = M.moonDropComparison(60);
check('At 60 Earth radii, gravity is diluted by 3600x and 1-s fall is ~1.36 mm',
  mn.dilutionFactor === 3600 && mn.moonFall1sMm > 1.35 && mn.moonFall1sMm < 1.37);
const el = M.ellipseGeometry(2.0, 0.5);
check('Ellipse e = 0.5 gives perihelion/aphelion speed ratio (1+e)/(1-e) = 3.0',
  Math.abs(el.speedRatioPeriToApo - 3.0) < 1e-9 && Math.abs(el.rPeri + el.rApo - 4.0) < 1e-9);
const cav = M.cavendishTorque(0.73, 158, 0.23, 0.9, 1.4e-7);
check('Cavendish lead spheres exert ~1.45e-7 N gravitational attraction',
  cav.forceN > 1.4e-7 && cav.forceN < 1.5e-7 && cav.lightSpotShiftMm > 5);

process.exit(bad ? 1 : 0);
