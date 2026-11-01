import assert from 'node:assert/strict';
import { bondEnthalpyLedger, arrheniusBarrier, dynamicEquilibriumState } from './model.js';

const exo = bondEnthalpyLedger(1370, 1852);
assert.equal(exo.deltaHKj, -482, '2 H2 + O2 -> 2 H2O bond ledger gives Delta H = -482 kJ/mol');

const uncat = arrheniusBarrier(75, 298, false);
const cat = arrheniusBarrier(75, 298, true);
assert(cat.effectiveEa < uncat.effectiveEa, 'Catalyst lowers effective activation barrier Ea');
assert(cat.relativeRate > uncat.relativeRate, 'Lowering Ea increases reactive Boltzmann fraction and rate');

const eq = dynamicEquilibriumState(1.2, 0.6, 1.0, 0.0);
assert(Math.abs(eq.forwardRateEq - eq.reverseRateEq) < 1e-9, 'At dynamic equilibrium forward rate equals reverse rate');
assert(Math.abs(eq.bEq / eq.aEq - eq.Keq) < 1e-9, 'Equilibrium concentration ratio [B]/[A] equals Keq = kf/kr');
