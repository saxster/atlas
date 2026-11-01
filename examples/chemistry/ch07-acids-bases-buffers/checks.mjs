import assert from 'node:assert/strict';
import { acidDissociationState, titrationCurveState } from './model.js';

const strong = acidDissociationState(0.10, -2);
const weak = acidDissociationState(0.10, 4.76);
assert(Math.abs(strong.pH - 1.0) < 1e-6, '0.10 M strong acid has pH = 1.0');
assert(weak.pH > 2.5 && weak.alphaPct < 5, '0.10 M weak ethanoic acid is only ~1.3% ionized with pH ~2.88');
assert(Math.abs(strong.pH + strong.pOH - 14) < 1e-9, 'pH + pOH = 14 at 25 C');

const halfEq = titrationCurveState(12.5, 25.0, 0.10, 0.10, 4.76);
const eqPt = titrationCurveState(25.0, 25.0, 0.10, 0.10, 4.76);
assert(Math.abs(halfEq.pH - 4.76) < 0.01, 'At half-equivalence (12.5 mL), buffer pH equals pKa = 4.76');
assert(eqPt.pH > 8.5, 'Weak acid + strong base equivalence point is basic (pH ~8.7) due to A- hydrolysis');
