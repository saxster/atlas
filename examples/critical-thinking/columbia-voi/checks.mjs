import { checks, near } from '@saxster/atlas/checks.js';
import * as M from './model.js';

const C = checks();

// 1. Crater extrapolation factor: 1920 in^3 / 3 in^3 = 640x beyond calibrated test regime
{
  const c = M.craterExtrapolation({ foamVolumeIn3: 1920 });
  C.check('1,920 in^3 foam strike is 640x above the 3 in^3 maximum Crater calibration test',
    near(c.extrapolationFactor, 640, 1e-12) &&
    c.outOfEnvelope === true);
}

// 2. Value of Information threshold: if Cost = 10, Loss = 10000, mitigation = 0.40 -> p* = 10 / 4000 = 0.0025 (0.25%)
{
  const low = M.valueOfInformation({ pBreach: 0.001, costLook: 10, lossFailure: 10000, mitigationShare: 0.40 });
  const high = M.valueOfInformation({ pBreach: 0.05, costLook: 10, lossFailure: 10000, mitigationShare: 0.40 });
  C.check('VOI looking decision flips at p* = 0.25% breach risk (worth checking far below 50%)',
    near(low.pThreshold, 0.0025, 1e-12) &&
    low.shouldLook === false &&
    high.shouldLook === true &&
    near(high.netVOI, 190, 1e-12));
}

// 3. Normalization of deviance: surviving 18 flights with p = 12% leaves (0.88)^18 ≈ 10% luck, NOT proof of safety
{
  const s18 = M.survivalAcrossFlights(0.12, 18);
  C.check('surviving 18 prior flights at p=12% has ~10% chance by luck without changing flight 19 risk',
    near(s18, Math.pow(0.88, 18), 1e-12) &&
    s18 > 0.09 && s18 < 0.11);
}

C.report();
