import { checks, near } from '@saxster/atlas/checks.js';
import * as M from './model.js';

const C = checks();

// 1. Wald survivorship: returning planes show fewest hits on engines (1.11 vs 1.80) -> engine loss probability is highest
{
  const w = M.waldSurvivorship({ uniformHitRate: 1.80 });
  C.check('Wald analysis identifies Engine/Cockpit as deadliest zone despite fewest visible holes on survivors',
    w.deadliest.id === 'engine' &&
    w.mostBulletHolesVisible.id === 'tail' &&
    near(w.deadliest.survivalGivenHit, 1.11 / 1.80, 1e-12) &&
    w.deadliest.lossGivenHit > 0.35);
}

// 2. VW defeat-device scope: passes lab test <= 0.043 while real-road rises up to 35x lab
{
  const em = M.emissionsScope({ onRoad: 1, defeatMultiplier: 35 });
  C.check('defeat device passes dynamometer scope while failing real-road scope by >30x',
    em.passesLab === true &&
    em.passesRoad === false &&
    near(em.roadEmission, 0.038 * 35, 1e-12) &&
    em.ratioToLimit > 30);
}

// 3. Snapshot progresses smoothly across duration on road, stays flat under lab-only scope
{
  const eRoad = M.run({ defeatMultiplier: 28, onRoad: 1, buggy: 0 });
  const s0 = M.snapshot(eRoad, 0);
  const s1 = M.snapshot(eRoad, M.DURATION);
  C.check('on-road snapshot rises from lab baseline to full defeat emission across run',
    near(s0.nox, eRoad.em.labEmission, 1e-12) &&
    near(s1.nox, eRoad.em.roadEmission, 1e-12) &&
    s1.nox > s0.nox * 20);
}

C.report();
