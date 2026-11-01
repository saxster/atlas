import * as M from './model.js';

let bad = 0;
function check(name, cond, detail = '') {
  if (cond) console.log(`PASS  ${name}`);
  else { bad++; console.log(`FAIL  ${name} ${detail}`); }
}

const d2 = M.clayDentDepthCm(1.0, 2.0, 200);
const d4 = M.clayDentDepthCm(1.0, 4.0, 200);
check('Doubling impact speed quadruples kinetic energy and clay dent depth (4x)',
  Math.abs(d4.keJ / d2.keJ - 4) < 1e-9 && Math.abs(d4.depthCm / d2.depthCm - 4) < 1e-9);
const b = M.inelasticBounceSequence(2.0, 0.5);
check('Restitution e = 0.5 loses 75% to thermal energy on first bounce (h1 = 0.25 * h0)',
  Math.abs(b.h1 - 0.5) < 1e-9 && Math.abs(b.thermalFractionFirstBounce - 0.75) < 1e-9);
const bill = M.householdBillCalc(1000, 5, 30, 8);
check('1 kW for 5 h/day over 30 days = 150 kWh = 540 MJ = Rs 1200',
  Math.abs(bill.totalKwh - 150) < 1e-9 && Math.abs(bill.totalMegajoules - 540) < 1e-9 && Math.abs(bill.costInr - 1200) < 1e-9);

process.exit(bad ? 1 : 0);
