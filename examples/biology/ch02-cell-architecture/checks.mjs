import * as M from './model.js';

let bad = 0;
function check(name, cond, detail = '') {
  if (cond) console.log(`PASS  ${name}`);
  else { bad++; console.log(`FAIL  ${name} ${detail}`); }
}

const g10 = M.cubeGeometry(10);
const g100 = M.cubeGeometry(100);
check('SA/V = 6/L exactly: 10 um cube has SA/V = 0.6 um^-1', Math.abs(g10.savPerUm - 0.6) < 1e-12);
check('10x larger side reduces SA/V 10x and increases diffusion time 100x', Math.abs(g10.savPerUm / g100.savPerUm - 10) < 1e-9 && Math.abs(g100.diffusionTimeSec / g10.diffusionTimeSec - 100) < 1e-9);
const cr = M.cristaeFoldingGain(6);
check('Mitochondrial cristae folding amplifies inner membrane area > 4x', cr.areaMultiplier > 4.2);
const rbc = M.specialistShapeFactor('rbc');
const rh = M.specialistShapeFactor('roothair');
check('Root hair and biconcave RBC boost SA/V above spherical baseline', rbc.savBoost > 1.3 && rh.savBoost > 3.0);

process.exit(bad ? 1 : 0);
