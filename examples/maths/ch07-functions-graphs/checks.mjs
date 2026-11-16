import * as M from './model.js';
let bad = 0;
const check = (name, ok) => { if (ok) console.log(`PASS  ${name}`); else { bad++; console.log(`FAIL  ${name}`); } };
const ls = M.linearSlopeState(1.5, 0.5, 2.0);
check('Gradient m = 1.5 over dx = 2 gives dy = 3 and m * m_perp = -1', ls.dy === 3.0 && Math.abs(ls.product + 1) < 1e-12);
const tr = M.travelGraphArea(12, 4, 6);
check('Speed-time area: triangle 24 m + rectangle 72 m = 96 m', tr.distAccel === 24 && tr.distCruise === 72 && tr.totalDist === 96);
process.exit(bad ? 1 : 0);
