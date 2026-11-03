// node examples/maths/cross-sections/checks.mjs — verifies pure model contract, Cavalieri slice area A(x),
// Fundamental Theorem derivative dV/dx = A(x), and Simpson integral ∫_{-R}^R A(x) dx = (2/3)π R³.
import fs from 'node:fs';
import { checks, near, deriv, integ } from '@saxster/atlas/checks.js';
import * as M from './model.js';
import { FIGURE } from './figure.js';

const C = checks();

const modelSrc = fs.readFileSync(new URL('./model.js', import.meta.url), 'utf8');
C.check('pure model.js contract: imports only @saxster/atlas/motion.js (zero Three.js)',
  !modelSrc.includes('three') && !modelSrc.includes('cad_kit')
  && M.POSE_PLAN.fov === 3 && M.POSE_PLAN.dist > 100);

C.check('Cavalieri slice derivative: dV/dx = A(x) = ½π(R² − x²) across [-1.5, 1.5]',
  [-1.4, -0.5, 0.0, 0.6, 1.3].every(x => near(deriv(M.cumulativeVolume, x), M.sliceArea(x), 1e-7)));

C.check('Simpson integral ∫_{-R}^R ½π(R² − x²) dx equals exact hemisphere volume ⅔πR³ = 16.755 m³',
  near(integ(M.sliceArea, -M.R, M.R, 200), (2 / 3) * Math.PI * M.R ** 3, 1e-10)
  && near(M.TOTAL_VOLUME, (2 / 3) * Math.PI * M.R ** 3, 1e-12));

const st = FIGURE.state(1.5);
C.check('FIGURE readout, chips, and PLATES facts evaluate cleanly from model state',
  typeof FIGURE.readout(st) === 'string'
  && FIGURE.chips.every(c => typeof c.value(st) === 'string' && !c.value(st).includes('undefined'))
  && Object.values(FIGURE.PLATES).every(p => p.facts(st).every(([k, v]) => k && v && !v.includes('undefined'))));

C.report();
