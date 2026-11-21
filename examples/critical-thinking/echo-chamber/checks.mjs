import { checks, near } from '@saxster/atlas/checks.js';
import * as M from './model.js';

const C = checks();

// 1. Twelve articles citing one primary study collapse to N_eff = 1 independent source
{
  const p = M.provenanceCollapse({ totalOutlets: 12, independentPrimary: 1, botShare: 0.70, totalComments: 1000 });
  C.check('12 echoing articles with 1 primary study yield N_eff = 1 and 12x apparent exaggeration',
    p.uniqueSources === 1 &&
    p.copiedOutlets === 11 &&
    near(p.apparentEvidenceRatio, 12, 1e-12));
}

// 2. Bot flood flips apparent raw public support (77.7%) relative to true human sample (35%)
{
  const p = M.provenanceCollapse({ totalOutlets: 12, independentPrimary: 1, botShare: 0.70, totalComments: 1000 });
  C.check('70% astroturf bot flood skews apparent support above 75% while true human sample stays 35%',
    p.botComments === 700 &&
    p.humanComments === 300 &&
    p.rawSupportPct > 75 &&
    near(p.humanSupportPct, 35.0, 1e-12));
}

// 3. Sampling margin of error shrinks as 1/sqrt(n) when genuine human responses grow
{
  const small = M.provenanceCollapse({ botShare: 0.90, totalComments: 1000 }); // 100 humans
  const large = M.provenanceCollapse({ botShare: 0.00, totalComments: 1000 }); // 1000 humans
  C.check('95% margin of error narrows cleanly when human sample grows 10x (100 -> 1000)',
    small.samplingMarginErrorPct > large.samplingMarginErrorPct * 2.8);
}

C.report();
