import { checks, near } from '@saxster/atlas/checks.js';
import * as M from './model.js';

const C = checks();

// 1. Canonical harbour fog case: 8/10 (80%) of groundings had beacons when 950/1000 fleet carried them -> unexposed rate is ~4.75x higher
{
  const r = M.computeRates({ totalFleet: 1000, exposedShare: 0.95, exposedRate: 0.0084, unexposedRate: 0.04 });
  C.check('80% numerator share reverses when divided by 950 vs 50 fleet denominators (0.84% vs 4.00%)',
    r.eventsExposed === 8 &&
    r.eventsUnexposed === 2 &&
    near(r.rawNumeratorShare, 0.80, 1e-12) &&
    near(r.rateExposed, 8 / 950, 1e-12) &&
    near(r.rateUnexposed, 2 / 50, 1e-12) &&
    r.rateUnexposed > r.rateExposed * 4.5);
}

// 2. When exposedShare equals 0.50 with equal rates, numerator share equals 0.50 and relativeRisk = 1
{
  const r = M.computeRates({ totalFleet: 1000, exposedShare: 0.50, exposedRate: 0.02, unexposedRate: 0.02 });
  C.check('equal fleet sizes and equal risk produce relativeRisk = 1.0',
    near(r.rawNumeratorShare, 0.50, 1e-12) &&
    near(r.relativeRisk, 1.0, 1e-12));
}

// 3. Asymmetric waiting cost threshold: act when P(hazard) > costOfPrecaution / harmIfHazard
{
  const low = M.waitingCost({ hazardProb: 0.08, harmIfHazard: 100, costOfPrecaution: 12 });
  const high = M.waitingCost({ hazardProb: 0.35, harmIfHazard: 100, costOfPrecaution: 12 });
  C.check('waiting-cost decision flips cleanly across threshold p = 12/100 = 0.12',
    near(low.thresholdProb, 0.12, 1e-12) &&
    low.shouldActNow === false &&
    high.shouldActNow === true &&
    near(high.netBenefitPrecaution, 23, 1e-12));
}

C.report();
