// node examples/minimal/blueprint/checks.mjs — verifies 2D plan room areas, telephoto log-FOV framing,
// passive-solar overhang shadow trigonometry, and winter vs. summer insolation invariants.
import fs from 'node:fs';
import { checks, near, deriv } from '@saxster/atlas/checks.js';
import * as M from './model.js';
import { FIGURE } from './figure.js';

const C = checks();

// 1. Pure model.js contract: model.js has zero Three.js or DOM imports and step cutY matches figure.js look.cutY
const modelSrc = fs.readFileSync(new URL('./model.js', import.meta.url), 'utf8');
C.check('pure model.js contract: imports only @saxster/atlas/motion.js (no three.js or cad_kit.js) and cutY hits 1.20, 1.85, 2.85 m',
  !modelSrc.includes('three') && !modelSrc.includes('cad_kit')
  && near(M.at(0.5).cutY, 1.20, 1e-12) && near(M.at(1.8).cutY, 1.85, 1e-12) && near(M.at(2.8).cutY, 2.85, 1e-12));

// 2. 2D floorplan room areas sum to the exact outer envelope area (16.0 + 9.6 = 25.6 m²)
const s0 = M.at(0);
C.check('2D plan areas: Studio (4.0 × 4.0 = 16.0 m²) + Alcove (2.4 × 4.0 = 9.6 m²) = 25.6 m²',
  near(s0.studioArea, 16.0, 1e-12) && near(s0.alcoveArea, 9.6, 1e-12) && near(s0.totalArea, 25.6, 1e-12));

// 2. Telephoto blueprint pose: 3° lens stands > 100 m above the plan so perspective distortion is < 2.7%
const tanHalf = Math.tan((M.POSE_PLAN.fov * Math.PI) / 360);
C.check('telephoto blueprint pose: 3° lens frames the plan from > 100 m with 2·dist·tan(fov/2) = frameHeight',
  M.POSE_PLAN.fov === 3 && M.POSE_PLAN.dist > 100
  && near(2 * M.POSE_PLAN.dist * tanHalf, M.POSE_PLAN.frameHeight, 1e-12));

// 3. Overhang shadow derivative: d(shadowEdgeY)/dα = −OVERHANG_D · sec²(α) · (π/180)
C.check('overhang shadow edge y(α) = H_o − D_o tan(α) matches numerical derivative',
  [30, 45, 60].every(a => {
    const rad = (a * Math.PI) / 180;
    const exact = -M.OVERHANG_D * (1 / Math.cos(rad) ** 2) * (Math.PI / 180);
    return near(deriv(x => M.solarAt(x).shadowEdgeY, a), exact, 1e-7);
  }));

// 4. Passive solar design invariant: Winter solstice (26°) admits > 1.4 m of sunlit window and > 2.4 kW heat gain,
//    while Summer solstice (73°) is 100% shaded below the sill (litHeight = 0, heatGainW = 0).
const winter = M.at(2.5);
const summer = M.at(4.0);
C.check('passive solar invariant: winter sun (26°) penetrates > 3 m into studio; summer sun (73°) is fully blocked by overhang',
  winter.litHeight > 1.4 && winter.floorReach > 3.0 && winter.heatGainW > 2400
  && near(summer.litHeight, 0, 1e-12) && near(summer.heatGainW, 0, 1e-12));

const st = FIGURE.state(1.5);
C.check('FIGURE readout, chips, and PLATES facts evaluate cleanly from model state',
  typeof FIGURE.readout(st) === 'string'
  && FIGURE.chips.every(c => typeof c.value(st) === 'string' && !c.value(st).includes('undefined'))
  && Object.values(FIGURE.PLATES).every(p => p.facts(st).every(([k, v]) => k && v && !v.includes('undefined'))));

C.report();
