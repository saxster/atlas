// node examples/biology/leaf-section/checks.mjs — verifies pure model contract, histological layer sum (220 µm),
// Beer-Lambert attenuation derivative dI/dz = -µ I(z), and Fick's First Law stomatal CO2 flux.
import fs from 'node:fs';
import { checks, near, deriv } from '@saxster/atlas/checks.js';
import * as M from './model.js';
import { FIGURE } from './figure.js';

const C = checks();

const modelSrc = fs.readFileSync(new URL('./model.js', import.meta.url), 'utf8');
C.check('pure model.js contract: imports only @saxster/atlas/motion.js (zero Three.js)',
  !modelSrc.includes('three') && !modelSrc.includes('cad_kit')
  && M.POSE_PLAN.fov === 3 && M.POSE_PLAN.dist > 100);

C.check('histological strata sum: 30 + 90 + 80 + 20 = 220 µm and Beer-Lambert dI/dz = −µ I(z)',
  M.TOTAL_THICK_UM === 220
  && [10, 40, 80].every(z => near(deriv(M.transmittedLight, z), -M.MU_PALISADE * M.transmittedLight(z), 1e-8)));

const sClosed = M.at(0.5);
const sOpen = M.at(2.8);
C.check('Fickian stomatal conductance: opening pore 2 µm -> 12 µm scales CO2 flux 6× (3.2 -> 19.2 µmol m⁻² s⁻¹)',
  near(sClosed.flux, 3.2, 1e-9) && near(sOpen.flux, 19.2, 1e-9)
  && near(sOpen.flux / sClosed.flux, 6.0, 1e-9));

const st = FIGURE.state(1.5);
C.check('FIGURE readout, chips, and PLATES facts evaluate cleanly from model state',
  typeof FIGURE.readout(st) === 'string'
  && FIGURE.chips.every(c => typeof c.value(st) === 'string' && !c.value(st).includes('undefined'))
  && Object.values(FIGURE.PLATES).every(p => p.facts(st).every(([k, v]) => k && v && !v.includes('undefined'))));

C.report();
