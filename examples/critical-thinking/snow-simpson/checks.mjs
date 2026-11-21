import { checks, near } from '@saxster/atlas/checks.js';
import * as M from './model.js';

const C = checks();

// 1. Snow 1854 exact arithmetic: 286/40046*10000 = 71.418 vs 14/26107*10000 = 5.363 -> ratio ~13.3x
{
  const s = M.snowComparison();
  C.check('Snow 1854 South London rates match 71.42 vs 5.36 per 10,000 houses (~13.3x ratio)',
    near(s.svRatePer10k, (286 / 40046) * 10000, 1e-9) &&
    near(s.lambethRatePer10k, (14 / 26107) * 10000, 1e-9) &&
    near(s.ratio, s.svRatePer10k / s.lambethRatePer10k, 1e-12) &&
    s.ratio > 13.0 && s.ratio < 13.6);
}

// 2. Simpson's Paradox: A beats B in mild (96% vs 90%) AND critical (78% vs 65%), yet pooled B (85%) beats pooled A (81.6%)
{
  const sim = M.simpsonHospitals({ severeShareA: 0.80, severeShareB: 0.20 });
  C.check('Simpson reversal holds when severeShareA=0.80 and severeShareB=0.20',
    sim.aBetterWithinEachStratum === true &&
    sim.pooledReversal === true &&
    near(sim.pooledA, 0.816, 1e-9) &&
    near(sim.pooledB, 0.85, 1e-9));
}

// 3. Removing case-mix confounding (severeShareA = severeShareB) eliminates the reversal
{
  const eq = M.simpsonHospitals({ severeShareA: 0.50, severeShareB: 0.50 });
  C.check('matching severity weights removes Simpson reversal so A wins pooled too',
    eq.pooledA > eq.pooledB &&
    eq.pooledReversal === false);
}

C.report();
