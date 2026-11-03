// node examples/economics/isoquant/checks.mjs — verifies pure model contract, Euler's homogeneous function theorem
// L·MP_L + K·MP_K = Q(L, K), partial derivatives ∂Q/∂L = MP_L, and tangency MRTS = w/r at (L*, K*) = (6, 6).
import fs from 'node:fs';
import { checks, near, deriv } from '@saxster/atlas/checks.js';
import * as M from './model.js';
import { FIGURE } from './figure.js';

const C = checks();

const modelSrc = fs.readFileSync(new URL('./model.js', import.meta.url), 'utf8');
C.check('pure model.js contract: imports only @saxster/atlas/motion.js (zero Three.js)',
  !modelSrc.includes('three') && !modelSrc.includes('cad_kit')
  && M.POSE_PLAN.fov === 3 && M.POSE_PLAN.dist > 100);

C.check('Euler theorem & partial derivatives: L·MP_L + K·MP_K = Q(L, K) and ∂Q/∂L = MP_L',
  [[4, 9], [6, 6], [9, 4]].every(([L, K]) => {
    const mp = M.marginalProducts(L, K);
    return near(L * mp.mpL + K * mp.mpK, mp.q, 1e-12)
      && near(deriv(x => M.outputQ(x, K), L), mp.mpL, 1e-7)
      && near(deriv(x => M.outputQ(L, x), K), mp.mpK, 1e-7);
  }));

C.check('cost-minimising tangency: at (L* = 6, K* = 6), wL* + rK* = ₹120, Q* = 60, and MRTS = w/r = 1.00',
  near(M.W_WAGE * M.L_STAR + M.R_RENTAL * M.K_STAR, M.BUDGET_C, 1e-12)
  && near(M.Q_STAR, 60.0, 1e-12)
  && near(M.MRTS_STAR, M.W_WAGE / M.R_RENTAL, 1e-12));

const st = FIGURE.state(1.5);
C.check('FIGURE readout, chips, and PLATES facts evaluate cleanly from model state',
  typeof FIGURE.readout(st) === 'string'
  && FIGURE.chips.every(c => typeof c.value(st) === 'string' && !c.value(st).includes('undefined'))
  && Object.values(FIGURE.PLATES).every(p => p.facts(st).every(([k, v]) => k && v && !v.includes('undefined'))));

C.report();
