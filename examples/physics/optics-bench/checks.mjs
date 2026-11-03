// node examples/physics/optics-bench/checks.mjs — verifies pure model contract, thin-lens reciprocal sum
// 1/d_o + 1/d_i = 1/f, derivative dd_i/dd_o = -(d_i / d_o)² = -M², and 2f -> 1.5f magnification invariants.
import fs from 'node:fs';
import { checks, near, deriv } from '@saxster/atlas/checks.js';
import * as M from './model.js';
import { FIGURE } from './figure.js';

const C = checks();

const modelSrc = fs.readFileSync(new URL('./model.js', import.meta.url), 'utf8');
C.check('pure model.js contract: imports only @saxster/atlas/motion.js (zero Three.js)',
  !modelSrc.includes('three') && !modelSrc.includes('cad_kit')
  && M.POSE_PLAN.fov === 3 && M.POSE_PLAN.dist > 100);

C.check('thin-lens equation: 1/d_o + 1/d_i = 1/f and dd_i/dd_o = −M² across object distances',
  [1.8, 2.1, 2.6, 3.5].every(doVal => {
    const op = M.opticsAt(doVal);
    return near(1 / op.doDist + 1 / op.diDist, 1 / M.F, 1e-12)
      && near(deriv(x => M.opticsAt(x).diDist, doVal), -(op.mag ** 2), 1e-7);
  }));

const sStart = M.at(0.5);
const sEnd = M.at(2.8);
C.check('2f symmetric focus (|M| = 1.00×) and 1.5f magnified focus (d_i = 3.90 m, |M| = 2.00×)',
  near(sStart.diDist, 2.60, 1e-12) && near(sStart.absMag, 1.0, 1e-12)
  && near(sEnd.diDist, 3.90, 1e-12) && near(sEnd.absMag, 2.0, 1e-12));

C.check('FIGURE readout, chips, and PLATES facts evaluate cleanly from model state',
  typeof FIGURE.readout(sEnd) === 'string'
  && FIGURE.chips.every(c => typeof c.value(sEnd) === 'string' && !c.value(sEnd).includes('undefined'))
  && Object.values(FIGURE.PLATES).every(p => p.facts(sEnd).every(([k, v]) => k && v && !v.includes('undefined'))));

C.report();
