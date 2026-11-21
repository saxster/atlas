import { checks, near } from '@saxster/atlas/checks.js';
import * as M from './model.js';

const C = checks();

// 1. Exact Bayes search update: priorA=0.55, pd=0.70, 1 miss -> postA = 0.55*0.30 / (0.55*0.30 + 0.45) = 0.165 / 0.615 = 11/41 (~26.83%)
{
  const s1 = M.searchUpdate({ priorA: 0.55, pd: 0.70, sweepsOnA: 1 });
  C.check('1 missed sweep with Pd=70% drops Sector A posterior from 55% to 0.165/0.615 (~26.8%) — NOT zero!',
    near(s1.postA, 0.165 / 0.615, 1e-12) &&
    near(s1.postA + 3 * s1.postEachOther, 1.0, 1e-12) &&
    s1.postEachOther > s1.restEach);
}

// 2. AF447 lesson: multiple missed imperfect sweeps can still leave Sector A non-zero until posterior shifts
{
  const s2 = M.searchUpdate({ priorA: 0.70, pd: 0.60, sweepsOnA: 2 });
  C.check('after 2 imperfect misses (Pd=60%) from 70% prior, posterior stays positive (0.70*0.16 / (0.70*0.16 + 0.30))',
    near(s2.postA, (0.70 * 0.16) / (0.70 * 0.16 + 0.30), 1e-12) &&
    s2.postA > 0.25);
}

// 3. Regression to the mean: site selected at spike 24 (mean 10, r=0.40) naturally drops to 15.6 without any intervention
{
  const reg = M.regressionStep({ baselineMean: 10, extremeSpike: 24, correlation: 0.40 });
  C.check('regression to the mean drops extreme spike 24 to 15.6 (-35%) before any camera effect',
    near(reg.expectedNextNatural, 15.6, 1e-12) &&
    near(reg.naturalDropPct, 35.0, 1e-12));
}

C.report();
