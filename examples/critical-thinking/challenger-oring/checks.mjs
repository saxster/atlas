import { checks, near } from '@saxster/atlas/checks.js';
import * as M from './model.js';

const C = checks();

// 1. Dataset integrity: 23 prior launches = 7 damaged + 16 undamaged (with STS-51-L making 24 total discussed)
{
  const sum = M.launchSummary();
  C.check('prior dataset has 23 flights (7 damaged, 16 clean) and clean flights are substantially warmer',
    sum.totalPrior === 23 &&
    sum.damagedCount === 7 &&
    sum.cleanCount === 16 &&
    sum.avgTempClean > sum.avgTempDamaged + 5.0);
}

// 2. Logistic distress probability rises steeply from warm pad (75°F -> low) to Challenger launch morning (31°F -> >99%)
{
  const pWarm = M.distressProbability(75);
  const pMed = M.distressProbability(53);
  const pCold = M.distressProbability(31);
  C.check('O-ring distress probability climbs strictly as temperature drops (75°F < 53°F < 31°F)',
    pWarm < 0.15 &&
    pMed > 0.90 &&
    pCold > 0.99 &&
    pWarm < pMed && pMed < pCold);
}

// 3. Snapshot cools monotonically from 75°F to target tempF = 31°F and viton resiliency collapses
{
  const e = M.run({ tempF: 31, buggyCensored: 0 });
  const s0 = M.snapshot(e, 0);
  const s1 = M.snapshot(e, M.DURATION);
  C.check('cooling snapshot lowers Viton resiliency and raises blow-by distress probability',
    near(s0.curTempF, 75, 1e-12) &&
    near(s1.curTempF, 31, 1e-12) &&
    s1.curResil < 0.20 &&
    s1.curDistress > 0.99);
}

C.report();
