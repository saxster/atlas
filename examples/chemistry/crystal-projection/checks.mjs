// node examples/chemistry/crystal-projection/checks.mjs — verifies pure model contract, cubic d_{hkl} spacing,
// Bragg's law 2d sin θ = λ derivative, and theoretical NaCl density ρ = 2.165 g/cm³.
import fs from 'node:fs';
import { checks, near, deriv } from '@saxster/atlas/checks.js';
import * as M from './model.js';
import { FIGURE } from './figure.js';

const C = checks();

const modelSrc = fs.readFileSync(new URL('./model.js', import.meta.url), 'utf8');
C.check('pure model.js contract: imports only @saxster/atlas/motion.js (zero Three.js)',
  !modelSrc.includes('three') && !modelSrc.includes('cad_kit')
  && M.POSE_PLAN.fov === 3 && M.POSE_PLAN.dist > 100);

C.check('cubic interplanar spacing d_200 = a_0 / 2 = 2.82 Å and Bragg law 2 d_200 sin(θ) = λ',
  near(M.D_200, 2.82, 1e-12)
  && near(2 * M.D_200 * Math.sin((M.THETA_200 * Math.PI) / 180), M.LAMBDA_CU_KA, 1e-12));

C.check('Bragg angle derivative dθ/dd matches analytical −λ / (2d² cos θ) · (180/π)',
  [2.0, 2.5, 2.82, 3.5].every(d => {
    const thRad = (M.braggAngleDeg(d) * Math.PI) / 180;
    const exact = (-M.LAMBDA_CU_KA / (2 * d * d * Math.cos(thRad))) * (180 / Math.PI);
    return near(deriv(x => M.braggAngleDeg(x), d), exact, 1e-7);
  }));

C.check('FCC NaCl theoretical density ρ = 4·M / (N_A·a_0³) ≈ 2.165 g/cm³',
  near(M.DENSITY_NACL, 2.165, 2e-3));

const st = FIGURE.state(1.5);
C.check('FIGURE readout, chips, and PLATES facts evaluate cleanly from model state',
  typeof FIGURE.readout(st) === 'string'
  && FIGURE.chips.every(c => typeof c.value(st) === 'string' && !c.value(st).includes('undefined'))
  && Object.values(FIGURE.PLATES).every(p => p.facts(st).every(([k, v]) => k && v && !v.includes('undefined'))));

C.report();
